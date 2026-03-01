/**
 * Maps internal errors to safe client-facing messages,
 * preventing database schema, query structure, or implementation details from leaking.
 */
export function getSafeError(error: unknown): string {
  const err = error as { code?: string; message?: string };
  const msg = err?.message ?? '';

  // Log full error server-side only
  console.error('[ERROR]', error);

  // Map known Postgres error codes to generic messages
  if (err?.code === '23505') return 'This item already exists.';
  if (err?.code === '23503') return 'A referenced item could not be found.';
  if (err?.code === '23502') return 'A required field is missing.';
  if (err?.code === '22P02') return 'Invalid ID format.';
  if (err?.code === '42501') return 'Permission denied.';
  if (err?.code === '42P01') return 'Resource not found.';

  // Mask messages that hint at internals
  if (msg.includes('uuid')) return 'Invalid ID format.';
  if (msg.includes('violates')) return 'Operation not permitted due to a data constraint.';
  if (msg.includes('duplicate key')) return 'This item already exists.';
  if (msg.includes('foreign key')) return 'A referenced item could not be found.';
  if (msg.includes('not found')) return 'Resource not found.';
  if (msg.includes('permission') || msg.includes('denied')) return 'Permission denied.';

  // Generic fallback – never expose raw messages
  return 'An error occurred while processing your request.';
}
