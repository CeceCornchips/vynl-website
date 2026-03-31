/** "HH:mm:ss" or "HH:mm" → minutes from midnight */
export function timeStrToMinutes(t: string): number {
  const p = t.split(':').map((x) => Number(x));
  const h = p[0] ?? 0;
  const m = p[1] ?? 0;
  return h * 60 + m;
}

export function minutesToTimeStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

export function formatTimeLabel(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Minutes from midnight → compact label for hour rows (e.g. 8am, 1pm). */
export function formatHourGridLabel(totalMin: number): string {
  const h24 = Math.floor(totalMin / 60);
  const h12 = h24 % 12 || 12;
  const ampm = h24 >= 12 ? 'pm' : 'am';
  return `${h12}${ampm}`;
}

/** "yyyy-MM-dd" → short weekday e.g. Wed */
export function formatWeekdayShort(dateYmd: string): string {
  const [y, m, d] = dateYmd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString('en-AU', { weekday: 'short' });
}
