/** Collision-resistant local id (no crypto dependency needed for local-only data). */
export function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
