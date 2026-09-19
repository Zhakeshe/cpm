export function normalizePhone(input: string | null | undefined): string {
  if (!input) return "";
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && digits.startsWith("8")) {
    return `7${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `7${digits}`;
  }
  return digits;
}

export function displayPhone(normalized: string): string {
  if (normalized.length === 11 && normalized.startsWith("7")) {
    return `+7 ${normalized.slice(1, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 9)} ${normalized.slice(9)}`;
  }
  if (normalized.startsWith("7") || normalized.startsWith("1")) {
    return `+${normalized}`;
  }
  return normalized;
}

export function phonesMatch(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b) && normalizePhone(a).length > 0;
}
