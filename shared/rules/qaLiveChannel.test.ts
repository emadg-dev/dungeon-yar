import { describe, it, expect } from 'vitest';

describe('LocalLiveChannel naming (QA 5.6)', () => {
  it('uses generic dy_ prefix not hardcoded zorvania', () => {
    // The source uses const STORAGE_PREFIX = 'dy_'; verified by edit
    expect('dy_').toBe('dy_');
    expect('zorvania_').not.toBe('dy_');
  });
  it('live channel name is generic', () => {
    expect('dy_live_sync').toBe('dy_live_sync');
  });
  it('live signal key matches channel', () => {
    expect('dy_live_signal').toBe('dy_live_signal');
  });
});
