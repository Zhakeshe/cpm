export function placeholdersOf(body: string) {
  return Array.from(new Set(body.match(/\{\{\d+\}\}/g) || [])).sort();
}

export function renderTemplate(body: string, parameters: string[]) {
  return body.replace(/\{\{(\d+)\}\}/g, (_match, index) => parameters[Number(index) - 1] ?? `{{${index}}}`);
}
