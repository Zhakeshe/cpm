#!/usr/bin/env python3
"""Bounded host checks. Local incidents survive app/DB outages; no credentials in reports."""
import datetime, json, os, shutil, subprocess, time, urllib.request
from pathlib import Path

STATE = Path(os.environ.get('CRM_MONITOR_STATE', '/var/lib/crm-monitor'))
STATE.mkdir(mode=0o700, parents=True, exist_ok=True)
checks = {}
def command(args, timeout=5):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, check=True).stdout.strip()
def check(name, action):
    try:
        ok, detail = action()
        checks[name] = {'ok': bool(ok), 'detail': str(detail)[:200]}
    except Exception:
        checks[name] = {'ok': False, 'detail': 'Проверка не пройдена'}

def container(name):
    state = command(['docker', 'inspect', '--format', '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}', name])
    return state.startswith('running') and 'unhealthy' not in state, state

def website():
    with urllib.request.urlopen('https://quantum.ushqn.com/api/health', timeout=5) as r:
        return r.status == 200, 'HTTPS ' + str(r.status)

def disk():
    d = shutil.disk_usage('/opt/crm')
    return d.free / d.total > .10, str(round(d.free / 1024**3, 1)) + ' GB свободно'

def backup():
    output = command(['docker', 'exec', 'crm-backup-1', 'sh', '-c', 'find /backups -name "crm-*.sql.gz" -size +0c -exec stat -c %Y {} \\;'], timeout=5)
    age = time.time() - max(float(x) for x in output.splitlines())
    return age < 30*3600, str(round(age/3600, 1)) + ' ч. с последнего backup'

def heartbeat():
    value = command(['docker', 'exec', 'crm-redis-1', 'redis-cli', 'GET', 'crm:worker:heartbeat'])
    age = time.time() - float(value)/1000
    return 0 <= age < 120, str(round(age)) + ' с. с heartbeat'

check('https', website)
for name in ['app', 'worker', 'postgres', 'redis', 'caddy']:
    check(name, lambda n=name: container('crm-' + n + '-1'))
check('database', lambda: (command(['docker', 'exec', 'crm-postgres-1', 'psql', '-U', 'crm', '-d', 'crm', '-Atqc', 'SELECT 1']) == '1', 'SELECT 1'))
check('redis-ping', lambda: (command(['docker', 'exec', 'crm-redis-1', 'redis-cli', 'PING']) == 'PONG', 'PING'))
check('worker-heartbeat', heartbeat)
check('disk', disk)
check('backup', backup)
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00', 'Z')
try:
    previous = json.loads((STATE / 'status.json').read_text())
except (OSError, ValueError):
    previous = {}
issues = sorted(k for k, v in checks.items() if not v['ok'])
old_issues = sorted(k for k, v in previous.get('checks', {}).items() if not v['ok'])
incidents = previous.get('incidents', [])
changed = issues != old_issues or not previous
if changed:
    incidents = (incidents + [{'at': now, 'issues': issues}])[-30:]
report = {'checkedAt': now, 'checks': checks, 'incidents': incidents}
temp = STATE / 'status.tmp'
temp.write_text(json.dumps(report, ensure_ascii=False))
os.chmod(temp, 0o600)
temp.replace(STATE / 'status.json')
print(json.dumps({'checkedAt': now, 'issues': issues}))
# An optional webhook can alert outside CRM. Keep its secret URL only in /etc/crm-monitor.env.
last = STATE / 'delivered-incident'
latest = incidents[-1]['at'] if incidents else ''
if os.environ.get('CRM_ALERT_WEBHOOK_URL') and (not last.exists() or last.read_text() != latest):
    try:
        req = urllib.request.Request(os.environ['CRM_ALERT_WEBHOOK_URL'], data=json.dumps({'text': 'CRM: ' + (', '.join(issues) if issues else 'работа восстановлена'), 'incidents': incidents}).encode(), headers={'Content-Type':'application/json'})
        with urllib.request.urlopen(req, timeout=5): pass
        last.write_text(latest)
    except Exception:
        print('external_alert_delivery_failed')
try:
    script = "const fs=require('fs');require('./dist/lib/monitoring').recordMonitorReport(JSON.parse(fs.readFileSync(0,'utf8'))).then(()=>process.exit(0)).catch(()=>process.exit(1));"
    subprocess.run(['docker', 'exec', '-i', 'crm-app-1', 'node', '-e', script], input=json.dumps(report), text=True, capture_output=True, check=True, timeout=12)
except Exception:
    print('crm_report_pending_until_recovery')
