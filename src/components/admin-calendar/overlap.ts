/**
 * Assigns each interval to a lane so overlapping items sit side by side.
 * Returns lane index and total lane count for each id.
 */
export function assignOverlapLanes<T extends { id: string; start: number; end: number }>(
  items: T[],
): Map<string, { lane: number; laneCount: number }> {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const laneEnds: number[] = [];
  const laneById = new Map<string, number>();

  for (const e of sorted) {
    let lane = laneEnds.findIndex((end) => e.start >= end);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(e.end);
    } else {
      laneEnds[lane] = e.end;
    }
    laneById.set(e.id, lane);
  }

  const laneCount = Math.max(1, laneEnds.length);
  const out = new Map<string, { lane: number; laneCount: number }>();
  for (const e of items) {
    out.set(e.id, { lane: laneById.get(e.id) ?? 0, laneCount });
  }
  return out;
}
