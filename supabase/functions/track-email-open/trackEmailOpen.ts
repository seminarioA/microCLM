export interface EmailOpenState {
  opened_at: string | null;
}

/** Solo se registra la primera apertura; aperturas repetidas (recarga del pixel) no reescriben la fecha. */
export function shouldMarkOpened(existing: EmailOpenState | null): boolean {
  return existing !== null && !existing.opened_at;
}
