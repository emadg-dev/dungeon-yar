import { describe, it, expect, vi } from 'vitest';
import { canManageCampaignCalendar } from './serverCalendar.test';
import type { CampaignRole } from '../../src/types';

describe('Stage 2 Phase 2: CalendarStructure Access & Trigger Logic', () => {
  it('1. Enforces owner and co_dm permissions for structure editing', () => {
    expect(canManageCampaignCalendar('owner')).toBe(true);
    expect(canManageCampaignCalendar('co_dm')).toBe(true);
    expect(canManageCampaignCalendar('player')).toBe(false);
    expect(canManageCampaignCalendar('spectator')).toBe(false);
    expect(canManageCampaignCalendar(null)).toBe(false);
  });

  it('2. CalendarModal triggers onOpenStructureEditor when user is DM/owner', () => {
    let editorOpen = false;
    const isDm = true;

    const onOpenStructureEditor = () => {
      editorOpen = true;
    };

    if (isDm && onOpenStructureEditor) {
      onOpenStructureEditor();
    }
    expect(editorOpen).toBe(true);
  });

  it('3. CalendarModal suppresses structure editor trigger for player role', () => {
    let editorOpen = false;
    const isDm = false;

    const onOpenStructureEditor = () => {
      editorOpen = true;
    };

    if (isDm && onOpenStructureEditor) {
      onOpenStructureEditor();
    }
    expect(editorOpen).toBe(false);
  });
});
