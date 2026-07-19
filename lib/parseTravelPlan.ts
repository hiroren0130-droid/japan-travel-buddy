export type DayPlan = {
  title: string;
  lines: string[];
};

export function parseTravelPlan(content: string): DayPlan[] {
  const lines = content.split("\n");

  const days: DayPlan[] = [];

  let current: DayPlan | null = null;

  for (const line of lines) {
    const text = line.trim();

    if (
      /^##\s*.*日目/.test(text) ||
      /^\d+日目/.test(text)
    ) {
      if (current) {
        days.push(current);
      }

      current = {
        title: text.replace(/^##\s*/, ""),
        lines: [],
      };

      continue;
    }

    if (current) {
      current.lines.push(text);
    }
  }

  if (current) {
    days.push(current);
  }

  return days;
}