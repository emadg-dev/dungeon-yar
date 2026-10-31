/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  canUserManageQuests,
  canUserToggleObjective,
  filterQuestForViewer,
  filterQuestsForViewer,
  calculateQuestProgress,
  partitionQuestsByStatus,
  validateQuestPayload,
  searchQuests
} from './questEngine';
import { Quest } from '../../src/types';

describe('questEngine pure rules', () => {
  const sampleQuest: Quest = {
    id: 'quest-1',
    campaignId: 'c-1',
    title: 'کشف راز سنگ‌های سیاه سپیدارون',
    description: 'تحقیق در مورد دگرگونی‌های جادویی در نزدیکی سپیدارون',
    status: 'active',
    giverNpcId: 'npc-1',
    giverNpcName: 'موبد آذر',
    locationId: 'loc-1',
    locationName: 'سپیدارون',
    locationRegion: 'سپیدارون',
    objectives: [
      { id: 'obj-1', text: 'بازجویی از نگهبان دروازه', done: true, visible: true },
      { id: 'obj-2', text: 'یافتن تکه سنگ نخستین', done: false, visible: true },
      { id: 'obj-3', text: 'بررسی نشان مخفی موبد (راز پنهان)', done: false, visible: false },
    ],
    dmNotes: 'موبد آذر در حقیقت تحت تأثیر طلسم زمان است.',
    sortIndex: 0,
    createdAt: 1000,
    updatedAt: 2000
  };

  const hiddenQuest: Quest = {
    ...sampleQuest,
    id: 'quest-hidden',
    title: 'ماموریت سری دانجن مستر',
    status: 'hidden'
  };

  const personalQuest: Quest = {
    ...sampleQuest,
    id: 'quest-personal',
    title: 'انتقام شخصی سهراب',
    participantIds: ['part-sohrab-1']
  };

  describe('canUserManageQuests', () => {
    it('grants DM access to owner, co_dm, and dm', () => {
      expect(canUserManageQuests('owner')).toBe(true);
      expect(canUserManageQuests('co_dm')).toBe(true);
      expect(canUserManageQuests('dm')).toBe(true);
    });

    it('denies DM access to player and spectator', () => {
      expect(canUserManageQuests('player')).toBe(false);
      expect(canUserManageQuests('spectator')).toBe(false);
      expect(canUserManageQuests(null)).toBe(false);
    });
  });

  describe('canUserToggleObjective', () => {
    it('always allows DM to toggle objectives', () => {
      expect(canUserToggleObjective('owner', false)).toBe(true);
      expect(canUserToggleObjective('co_dm', false)).toBe(true);
      expect(canUserToggleObjective('dm', false)).toBe(true);
    });

    it('allows player to toggle objectives only when campaign setting allows it', () => {
      expect(canUserToggleObjective('player', false)).toBe(false);
      expect(canUserToggleObjective('player', true)).toBe(true);
    });

    it('denies spectator from toggling even if setting is enabled', () => {
      expect(canUserToggleObjective('spectator', true)).toBe(false);
    });
  });

  describe('filterQuestForViewer', () => {
    it('returns full quest for DM without stripping dmNotes or invisible objectives', () => {
      const result = filterQuestForViewer(sampleQuest, 'owner');
      expect(result).not.toBeNull();
      expect(result?.dmNotes).toBe('موبد آذر در حقیقت تحت تأثیر طلسم زمان است.');
      expect(result?.objectives).toHaveLength(3);
    });

    it('strips dmNotes and invisible objectives for players', () => {
      const result = filterQuestForViewer(sampleQuest, 'player', 'any-part');
      expect(result).not.toBeNull();
      expect(result?.dmNotes).toBeUndefined();
      expect(result?.objectives).toHaveLength(2);
      expect(result?.objectives.map(o => o.id)).toEqual(['obj-1', 'obj-2']);
    });

    it('returns null for hidden quests when viewer is player or spectator', () => {
      expect(filterQuestForViewer(hiddenQuest, 'player')).toBeNull();
      expect(filterQuestForViewer(hiddenQuest, 'spectator')).toBeNull();
      expect(filterQuestForViewer(hiddenQuest, 'owner')).not.toBeNull();
    });

    it('handles participant-specific quests properly', () => {
      // Eligible participant sees the quest
      const eligible = filterQuestForViewer(personalQuest, 'player', 'part-sohrab-1');
      expect(eligible).not.toBeNull();
      expect(eligible?.id).toBe('quest-personal');

      // Non-eligible participant gets null
      const nonEligible = filterQuestForViewer(personalQuest, 'player', 'part-other');
      expect(nonEligible).toBeNull();

      // DM sees it regardless
      const dmView = filterQuestForViewer(personalQuest, 'owner', 'part-other');
      expect(dmView).not.toBeNull();
    });
  });

  describe('filterQuestsForViewer', () => {
    it('filters out hidden and non-eligible quests for player', () => {
      const list = [sampleQuest, hiddenQuest, personalQuest];
      const playerQuests = filterQuestsForViewer(list, 'player', 'part-other');
      expect(playerQuests).toHaveLength(1);
      expect(playerQuests[0].id).toBe('quest-1');
    });

    it('keeps all quests for DM', () => {
      const list = [sampleQuest, hiddenQuest, personalQuest];
      const dmQuests = filterQuestsForViewer(list, 'owner');
      expect(dmQuests).toHaveLength(3);
    });
  });

  describe('calculateQuestProgress', () => {
    it('returns 0 for empty objectives', () => {
      expect(calculateQuestProgress([])).toEqual({ total: 0, completed: 0, percentage: 0 });
    });

    it('calculates progress accurately', () => {
      const objs = [
        { id: '1', text: 'a', done: true, visible: true },
        { id: '2', text: 'b', done: false, visible: true },
        { id: '3', text: 'c', done: true, visible: true },
        { id: '4', text: 'd', done: false, visible: true },
      ];
      expect(calculateQuestProgress(objs)).toEqual({ total: 4, completed: 2, percentage: 50 });
    });
  });

  describe('partitionQuestsByStatus', () => {
    it('partitions quests into respective status buckets', () => {
      const quests: Quest[] = [
        { ...sampleQuest, id: 'q1', status: 'active' },
        { ...sampleQuest, id: 'q2', status: 'completed' },
        { ...sampleQuest, id: 'q3', status: 'failed' },
        { ...sampleQuest, id: 'q4', status: 'hidden' },
        { ...sampleQuest, id: 'q5', status: 'abandoned' },
      ];
      const partitioned = partitionQuestsByStatus(quests);
      expect(partitioned.active).toHaveLength(1);
      expect(partitioned.completed).toHaveLength(1);
      expect(partitioned.failed).toHaveLength(1);
      expect(partitioned.hidden).toHaveLength(1);
      expect(partitioned.abandoned).toHaveLength(1);
    });
  });

  describe('validateQuestPayload', () => {
    it('passes for valid payload', () => {
      const res = validateQuestPayload({
        title: 'ماموریت جدید',
        status: 'active',
        objectives: [{ id: '1', text: 'گام اول', done: false, visible: true }]
      });
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('fails when title is missing or empty', () => {
      const res = validateQuestPayload({ title: '  ' });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('عنوان مأموریت الزامی است.');
    });

    it('fails when objective text is empty', () => {
      const res = validateQuestPayload({
        title: 'ماموریت',
        objectives: [{ id: '1', text: '   ', done: false, visible: true }]
      });
      expect(res.valid).toBe(false);
      expect(res.errors).toContain('متن هدف شماره 1 نمی‌تواند خالی باشد.');
    });
  });

  describe('searchQuests', () => {
    it('searches title, description, objectives, giver, and location', () => {
      const list = [sampleQuest];
      expect(searchQuests(list, 'سنگ‌های سیاه')).toHaveLength(1);
      expect(searchQuests(list, 'موبد آذر')).toHaveLength(1);
      expect(searchQuests(list, 'سپیدارون')).toHaveLength(1);
      expect(searchQuests(list, 'نگهبان دروازه')).toHaveLength(1);
      expect(searchQuests(list, 'ناموجود')).toHaveLength(0);
    });
  });
});
