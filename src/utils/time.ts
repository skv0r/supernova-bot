export function toDate(input: Date | string): Date {
  return input instanceof Date ? input : new Date(input);
}

export function formatDateTime(date: Date | string): string {
  return toDate(date).toLocaleString();
}

export function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

