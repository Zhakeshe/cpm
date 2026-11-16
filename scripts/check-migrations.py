#!/usr/bin/env python3
"""Refuse pending migrations outside an explicitly reviewed allowlist before deployment."""
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
result = subprocess.run(
    ['docker', 'exec', 'crm-postgres-1', 'psql', '-U', 'crm', '-d', 'crm', '-Atqc',
     'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL'],
    capture_output=True, text=True, timeout=10,
)
if result.returncode:
    print('Cannot verify migration history; deployment must stop.', file=sys.stderr)
    raise SystemExit(1)
applied = set(result.stdout.splitlines())
known = {p.name for p in (root / 'prisma' / 'migrations').iterdir() if p.is_dir() and (p / 'migration.sql').exists()}
pending = known - applied
unexpected = pending - set(sys.argv[1:])
print('Pending migrations:', ', '.join(sorted(pending)) or 'none')
if unexpected:
    print('Unreviewed migrations; deployment must stop:', ', '.join(sorted(unexpected)), file=sys.stderr)
    raise SystemExit(1)
print('Migration preflight passed.')
