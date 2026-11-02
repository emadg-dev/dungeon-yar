import { describe, it, expect } from 'vitest';
import { SHEET_POLICY_DEFAULT, isLocked, requiresGrant, isFree } from './sheetPolicy';

describe('sheetPolicy', () => {
  it('maps dm_only core stats', () => {
    expect(SHEET_POLICY_DEFAULT.level).toBe('dm_only');
    expect(SHEET_POLICY_DEFAULT.abilities).toBe('dm_only');
  });
  it('maps grant_dm_only for inventory/currency increases', () => {
    expect(SHEET_POLICY_DEFAULT.inventoryQuantity).toBe('grant_dm_only');
    expect(SHEET_POLICY_DEFAULT.currencyBalance).toBe('grant_dm_only');
  });
  it('maps player_free for current HP / conditions / notes', () => {
    expect(SHEET_POLICY_DEFAULT.currentHp).toBe('player_free');
    expect(SHEET_POLICY_DEFAULT.notes).toBe('player_free');
  });
  it('requires grant for grant_dm_only', () => {
    expect(requiresGrant('grant_dm_only')).toBe(true);
    expect(requiresGrant('dm_only')).toBe(false);
  });
  it('isLocked true only when finalized + dm_only/grant', () => {
    expect(isLocked('dm_only', 'finalized')).toBe(true);
    expect(isLocked('dm_only', 'draft')).toBe(false);
    expect(isLocked('player_free', 'finalized')).toBe(false);
  });
});
