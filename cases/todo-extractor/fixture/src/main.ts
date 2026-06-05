export function main(items: string[]): string[] {
  // TODO: cache results across calls
  return items.map((x) => x.trim()).filter(Boolean);
}

export function help(): string {
  return "usage: main <items>  // not a real TODO, just text in a string";
}
