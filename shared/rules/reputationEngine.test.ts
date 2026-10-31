import { describe, it, expect } from 'vitest';
import {
  DEFAULT_REPUTATION_THRESHOLDS,
  getReputationLabel,
  clampReputationValue,
  calculateReputationPercentage,
  applyReputationDelta,
  filterReputationForViewer,
  filterReputationsForViewer,
  canUserManageReputation,
} from './reputationEngine';
import { FactionReputation } from '../../src/types';

describe('reputationEngine', () => {
  const sampleReputation: FactionReputation = {
    id: 'rep-1',
    campaignId: 'camp-1',
    factionId: 'fac-zrv-1',
    factionName: 'محفل نگهبانان ستاره',
    participationId: null,
    value: 0,
    min: -100,
    max: 100,
    labels: DEFAULT_REPUTATION_THRESHOLDS,
    visible: true,
    updatedAt: 1000,
  };

  it('correctly maps thresholds to Persian labels', () => {
    expect(getReputationLabel(0)).toBe('بی‌طرف');
    expect(getReputationLabel(20)).toBe('دوستانه');
    expect(getReputationLabel(75)).toBe('متحد');
    expect(getReputationLabel(-5)).toBe('خصمانه');
    expect(getReputationLabel(-10)).toBe('خصمانه');
    expect(getReputationLabel(-80)).toBe('دشمن خونی');
  });

  it('clamps values correctly within bounds', () => {
    expect(clampReputationValue(120, -100, 100)).toBe(100);
    expect(clampReputationValue(-150, -100, 100)).toBe(-100);
    expect(clampReputationValue(15, -100, 100)).toBe(15);
  });

  it('calculates percentage accurately', () => {
    expect(calculateReputationPercentage(0, -100, 100)).toBe(50);
    expect(calculateReputationPercentage(100, -100, 100)).toBe(100);
    expect(calculateReputationPercentage(-100, -100, 100)).toBe(0);
  });

  it('applies reputation delta and creates reputation audit log', () => {
    const result = applyReputationDelta(sampleReputation, 25, 'کمک به نجات کاروان', 'dm-1', 'sess-1');
    expect(result.updated.value).toBe(25);
    expect(result.updated.currentLabel).toBe('دوستانه');
    expect(result.log.delta).toBe(25);
    expect(result.log.reason).toBe('کمک به نجات کاروان');
    expect(result.log.sessionId).toBe('sess-1');
  });

  it('clamps delta adjustments when hitting maximum or minimum', () => {
    const result = applyReputationDelta(sampleReputation, 500, 'فداکاری افسانه‌ای', 'dm-1');
    expect(result.updated.value).toBe(100);
    expect(result.actualDelta).toBe(100);
    expect(result.updated.currentLabel).toBe('متحد');
  });

  describe('acceptance criteria: Hidden reputation is never in a player response', () => {
    const hiddenRep: FactionReputation = {
      ...sampleReputation,
      id: 'rep-secret',
      factionName: 'فرقه پنهان تاریکی',
      visible: false,
      value: -40,
    };

    it('DM sees hidden reputation tracks', () => {
      const dmView = filterReputationForViewer(hiddenRep, 'owner');
      expect(dmView).not.toBeNull();
      expect(dmView?.id).toBe('rep-secret');

      const coDmView = filterReputationForViewer(hiddenRep, 'co_dm');
      expect(coDmView).not.toBeNull();
    });

    it('Player receives null for hidden reputation track', () => {
      const playerView = filterReputationForViewer(hiddenRep, 'player');
      expect(playerView).toBeNull();

      const spectatorView = filterReputationForViewer(hiddenRep, 'spectator');
      expect(spectatorView).toBeNull();
    });

    it('filterReputationsForViewer completely removes hidden tracks for players', () => {
      const list = [sampleReputation, hiddenRep];
      const playerList = filterReputationsForViewer(list, 'player');
      expect(playerList.length).toBe(1);
      expect(playerList[0].id).toBe('rep-1');
      expect(playerList.some(r => r.id === 'rep-secret')).toBe(false);

      const dmList = filterReputationsForViewer(list, 'owner');
      expect(dmList.length).toBe(2);
    });

    it('character-specific reputation is only visible to that character player', () => {
      const charSpecificRep: FactionReputation = {
        ...sampleReputation,
        id: 'rep-char-1',
        participationId: 'part-player-1',
        visible: true,
      };

      // Matched player can see
      const matched = filterReputationForViewer(charSpecificRep, 'player', 'part-player-1');
      expect(matched).not.toBeNull();

      // Another player cannot see
      const other = filterReputationForViewer(charSpecificRep, 'player', 'part-player-2');
      expect(other).toBeNull();
    });
  });

  it('canUserManageReputation checks DM/Owner roles', () => {
    expect(canUserManageReputation('owner')).toBe(true);
    expect(canUserManageReputation('co_dm')).toBe(true);
    expect(canUserManageReputation('dm')).toBe(true);
    expect(canUserManageReputation('player')).toBe(false);
    expect(canUserManageReputation('spectator')).toBe(false);
  });
});
