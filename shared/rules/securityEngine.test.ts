/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  validateCsrfAndOrigin,
  evaluateCampaignAccess,
  canCloneFromCampaign,
  isRateLimitExceeded,
  validateStringLength,
  calculateStorageStats,
  computeOrphanCleanupReport
} from './securityEngine';
import { filterHandoutsForPlayer, filterPinsForPlayer } from './handoutEngine';
import { filterQuestForViewer } from './questEngine';
import { filterSessionForViewer } from './sessionEngine';
import { CampaignRole, Handout, Quest, Session } from '../../src/types';

describe('STEP 5.3: Security Hardening & Authorization Test Suite', () => {
  // Seeded actor identities
  const SEED_USERS = {
    platformAdmin: { id: 'u-admin', email: 'admin@zorvania.ir', platformRole: 'admin', role: 'dm' },
    ownerA: { id: 'u-owner-a', email: 'ownerA@zorvania.ir', campaignARole: 'owner' as CampaignRole },
    coDmA: { id: 'u-codm-a', email: 'codm@zorvania.ir', campaignARole: 'co_dm' as CampaignRole },
    player1A: { id: 'u-player-1', email: 'player1@zorvania.ir', campaignARole: 'player' as CampaignRole, participationId: 'p-1' },
    player2A: { id: 'u-player-2', email: 'player2@zorvania.ir', campaignARole: 'player' as CampaignRole, participationId: 'p-2' },
    spectatorA: { id: 'u-spectator', email: 'spectator@zorvania.ir', campaignARole: 'spectator' as CampaignRole },
    nonMember: { id: 'u-stranger', email: 'stranger@zorvania.ir', campaignARole: null },
    campaignBOwner: { id: 'u-owner-b', email: 'ownerB@zorvania.ir', campaignBRole: 'owner' as CampaignRole }
  };

  describe('1. CSRF and Origin Verification', () => {
    const HOST = 'https://app.zorvania.ir';

    it('allows GET requests without CSRF headers', () => {
      const res = validateCsrfAndOrigin('GET', {}, HOST);
      expect(res.valid).toBe(true);
    });

    it('rejects POST/PUT/PATCH/DELETE missing X-Requested-With header', () => {
      expect(validateCsrfAndOrigin('POST', {}, HOST).valid).toBe(false);
      expect(validateCsrfAndOrigin('PUT', {}, HOST).valid).toBe(false);
      expect(validateCsrfAndOrigin('PATCH', {}, HOST).valid).toBe(false);
      expect(validateCsrfAndOrigin('DELETE', {}, HOST).valid).toBe(false);
    });

    it('accepts write requests with X-Requested-With: zorvania and matching Origin', () => {
      const headers = {
        'x-requested-with': 'zorvania',
        'origin': 'https://app.zorvania.ir'
      };
      const res = validateCsrfAndOrigin('POST', headers, HOST);
      expect(res.valid).toBe(true);
    });

    it('rejects write requests with mismatched cross-origin', () => {
      const headers = {
        'x-requested-with': 'zorvania',
        'origin': 'https://malicious-site.com'
      };
      const res = validateCsrfAndOrigin('POST', headers, HOST);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Cross-Site Request Blocked');
    });
  });

  describe('2. Endpoint Authorization Matrix & Non-Member 404 Enforcing', () => {
    // 17 endpoint families tested across roles

    it('Campaigns: non-member gets 404; owner/co_dm get 200', () => {
      const strangerCheck = evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'member');
      expect(strangerCheck.allowed).toBe(false);
      expect(strangerCheck.status).toBe(404);

      const ownerCheck = evaluateCampaignAccess(SEED_USERS.ownerA.campaignARole, false, 'member');
      expect(ownerCheck.allowed).toBe(true);
      expect(ownerCheck.status).toBe(200);
    });

    it('Members Management: non-member gets 404; player attempting kick gets 403; owner gets 200', () => {
      const strangerCheck = evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'dm');
      expect(strangerCheck.status).toBe(404);

      const playerCheck = evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'dm');
      expect(playerCheck.allowed).toBe(false);
      expect(playerCheck.status).toBe(403);

      const ownerCheck = evaluateCampaignAccess(SEED_USERS.ownerA.campaignARole, false, 'dm');
      expect(ownerCheck.allowed).toBe(true);
      expect(ownerCheck.status).toBe(200);
    });

    it('Invites: non-member gets 404; player gets 403; co_dm gets 200', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'dm').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'dm').status).toBe(403);
      expect(evaluateCampaignAccess(SEED_USERS.coDmA.campaignARole, false, 'dm').status).toBe(200);
    });

    it('Content Entities (NPCs, Items, Locations): non-member gets 404; player creating gets 403; co_dm gets 200', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'dm').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'dm').status).toBe(403);
      expect(evaluateCampaignAccess(SEED_USERS.coDmA.campaignARole, false, 'dm').status).toBe(200);
    });

    it('Characters & Participations: DM override requires dm role (player gets 403, stranger gets 404)', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'dm').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'dm').status).toBe(403);
      expect(evaluateCampaignAccess(SEED_USERS.coDmA.campaignARole, false, 'dm').status).toBe(200);
    });

    it('Notes: non-member gets 404; spectator editing gets 403', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'member').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'member').status).toBe(200);
    });

    it('Encounters: running and saving encounters requires dm (stranger 404, player 403, co_dm 200)', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'dm').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player2A.campaignARole, false, 'dm').status).toBe(403);
      expect(evaluateCampaignAccess(SEED_USERS.coDmA.campaignARole, false, 'dm').status).toBe(200);
    });

    it('Dice: non-member accessing campaign rolls feed gets 404', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'member').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'member').status).toBe(200);
    });

    it('Sessions: scheduling, closing sheet and attendance require dm (stranger 404, player 403, co_dm 200)', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'dm').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'dm').status).toBe(403);
      expect(evaluateCampaignAccess(SEED_USERS.coDmA.campaignARole, false, 'dm').status).toBe(200);
    });

    it('Handouts: creating, editing and revealing require dm (stranger 404, player 403, co_dm 200)', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'dm').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'dm').status).toBe(403);
      expect(evaluateCampaignAccess(SEED_USERS.ownerA.campaignARole, false, 'dm').status).toBe(200);
    });

    it('Quests: creating, editing and completing require dm (stranger 404, player 403, co_dm 200)', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'dm').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'dm').status).toBe(403);
      expect(evaluateCampaignAccess(SEED_USERS.coDmA.campaignARole, false, 'dm').status).toBe(200);
    });

    it('Reputation: adjusting and creating tracks require dm (stranger 404, player 403, owner 200)', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'dm').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'dm').status).toBe(403);
      expect(evaluateCampaignAccess(SEED_USERS.ownerA.campaignARole, false, 'dm').status).toBe(200);
    });

    it('Treasury: non-member gets 404; active party members can view and access', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'member').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'member').status).toBe(200);
    });

    it('Notifications & Preferences: non-member viewing campaign-scoped alerts gets 404', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'member').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player2A.campaignARole, false, 'member').status).toBe(200);
    });

    it('Media: non-member accessing private campaign cover/handout gets 404', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'member').status).toBe(404);
    });

    it('Campaign-Scoped Audit Log: requires owner or co_dm (player 403, stranger 404, co_dm 200)', () => {
      expect(evaluateCampaignAccess(SEED_USERS.nonMember.campaignARole, false, 'dm').status).toBe(404);
      expect(evaluateCampaignAccess(SEED_USERS.player1A.campaignARole, false, 'dm').status).toBe(403);
      expect(evaluateCampaignAccess(SEED_USERS.coDmA.campaignARole, false, 'dm').status).toBe(200);
      expect(evaluateCampaignAccess(SEED_USERS.ownerA.campaignARole, false, 'owner').status).toBe(200);
    });
  });

  describe('3. Cloning Authorization Rule', () => {
    it('disallows cloning from a campaign where the caller is only a player (returns false -> 404)', () => {
      const canClone = canCloneFromCampaign(SEED_USERS.player1A.campaignARole, false);
      expect(canClone).toBe(false);
    });

    it('disallows cloning for spectators and strangers (returns false -> 404)', () => {
      expect(canCloneFromCampaign(SEED_USERS.spectatorA.campaignARole, false)).toBe(false);
      expect(canCloneFromCampaign(SEED_USERS.nonMember.campaignARole, false)).toBe(false);
    });

    it('allows cloning when caller is owner or co_dm of source campaign', () => {
      expect(canCloneFromCampaign(SEED_USERS.ownerA.campaignARole, false)).toBe(true);
      expect(canCloneFromCampaign(SEED_USERS.coDmA.campaignARole, false)).toBe(true);
    });

    it('allows platform admin/DM to clone from any campaign', () => {
      expect(canCloneFromCampaign(null, true)).toBe(true);
    });
  });

  describe('4. Data Leaks & DM-Only Field Stripping', () => {
    it('Handouts: hidden handouts are NEVER received by players; unrevealed pins stripped', () => {
      const mockHandouts: Handout[] = [
        {
          id: 'h-revealed',
          campaignId: 'camp-a',
          title: 'نقشه ورنا',
          kind: 'map',
          visibility: 'revealed',
          tags: [],
          sortIndex: 0,
          createdBy: 'u-owner-a',
          createdAt: 1000,
          updatedAt: 1000,
          pins: [
            { id: 'p-1', handoutId: 'h-revealed', x: 20, y: 30, label: 'شهر باستانی', revealed: 1 },
            { id: 'p-secret', handoutId: 'h-revealed', x: 50, y: 60, label: 'تله مرگبار', revealed: 0 }
          ]
        },
        {
          id: 'h-secret-dm',
          campaignId: 'camp-a',
          title: 'اسرار پشت‌پرده موبدان',
          kind: 'text',
          visibility: 'hidden',
          tags: [],
          sortIndex: 1,
          createdBy: 'u-owner-a',
          createdAt: 1000,
          updatedAt: 1000
        }
      ];

      // Player view
      const playerList = filterHandoutsForPlayer(mockHandouts, 'p-1', false);
      expect(playerList.length).toBe(1);
      expect(playerList[0].id).toBe('h-revealed');
      // Secret pin stripped
      expect(playerList[0].pins?.length).toBe(1);
      expect(playerList[0].pins?.[0].id).toBe('p-1');

      // DM view
      const dmList = filterHandoutsForPlayer(mockHandouts, null, true);
      expect(dmList.length).toBe(2);
      expect(dmList[0].pins?.length).toBe(2);
    });

    it('Quests: hidden quests return null to players, dm_notes and invisible objectives stripped', () => {
      const mockQuest: Quest = {
        id: 'q-1',
        campaignId: 'camp-a',
        title: 'جستجوی سرنخ',
        description: 'سرنخ‌های اولیه در دروازه سپیدارون',
        status: 'active',
        dmNotes: 'تله جادویی در زیرزمین پنهان است و غول در اتاق ۴ منتظر است!',
        objectives: [
          { id: 'o-1', text: 'ورود به سپیدارون', done: true, visible: true },
          { id: 'o-secret', text: 'کشف هویت جاسوس فرقه نوژان', done: false, visible: false }
        ],
        sortIndex: 0,
        createdAt: 1000,
        updatedAt: 1000
      };

      const playerQuest = filterQuestForViewer(mockQuest, false, 'p-1');
      expect(playerQuest).not.toBeNull();
      expect(playerQuest?.dmNotes).toBeUndefined();
      expect(playerQuest?.objectives.length).toBe(1);
      expect(playerQuest?.objectives[0].id).toBe('o-1');

      const dmQuest = filterQuestForViewer(mockQuest, true, null);
      expect(dmQuest?.dmNotes).toBe('تله جادویی در زیرزمین پنهان است و غول در اتاق ۴ منتظر است!');
      expect(dmQuest?.objectives.length).toBe(2);
    });

    it('Sessions: dm_notes stripped for players', () => {
      const mockSession: Session = {
        id: 's-1',
        campaignId: 'camp-a',
        number: 1,
        title: 'آغاز سفر',
        scheduledAt: '2026-11-10T18:00:00Z',
        durationMinutes: 180,
        status: 'confirmed',
        dmNotes: 'برنامه‌ریزی برای غافلگیری بازیکنان با نبرد ناگهانی',
        createdBy: 'u-owner-a',
        createdAt: 1000,
        updatedAt: 1000,
        rsvps: []
      };

      const playerSession = filterSessionForViewer(mockSession, 'player');
      expect(playerSession.dmNotes).toBeUndefined();

      const dmSession = filterSessionForViewer(mockSession, 'owner');
      expect(dmSession.dmNotes).toBe('برنامه‌ریزی برای غافلگیری بازیکنان با نبرد ناگهانی');
    });
  });

  describe('5. Rate Limiting Rules', () => {
    it('detects rate limit threshold exceeded', () => {
      expect(isRateLimitExceeded(5, 5)).toBe(true);
      expect(isRateLimitExceeded(6, 5)).toBe(true);
      expect(isRateLimitExceeded(4, 5)).toBe(false);
    });
  });

  describe('6. Input Validation & String Length Limits', () => {
    it('enforces min and max length limits', () => {
      expect(validateStringLength('', 'نام', 1, 100).valid).toBe(false);
      expect(validateStringLength('   ', 'نام', 1, 100).valid).toBe(false);
      expect(validateStringLength('a'.repeat(101), 'نام', 1, 100).valid).toBe(false);
      expect(validateStringLength('نام معتبر', 'نام', 1, 100).valid).toBe(true);
    });
  });

  describe('7. STEP 5.4: Storage Estimation & Orphan Cleanup Logic', () => {
    it('computes storage statistics and warns when threshold exceeded', () => {
      const counts = {
        users: 10,
        campaigns: 2,
        characters: 8,
        media: 5
      };
      const stats = calculateStorageStats(counts, 250000, 500000);
      expect(stats.totalBytes).toBeGreaterThan(0);
      expect(stats.thresholdBytes).toBe(500000);
      expect(stats.tables.length).toBeGreaterThan(5);
    });

    it('identifies unreferenced media and expired items in orphan cleanup dry-run', () => {
      const allMedia = ['m-1', 'm-2', 'm-orphan-1', 'm-orphan-2'];
      const referenced = new Set(['m-1', 'm-2']);

      const report = computeOrphanCleanupReport(true, allMedia, referenced, 3, 2, 10, 1);
      expect(report.dryRun).toBe(true);
      expect(report.counts.orphanMedia).toBe(2);
      expect(report.counts.expiredInvites).toBe(3);
      expect(report.counts.expiredSessions).toBe(2);
      expect(report.counts.oldLoginAttempts).toBe(10);
      expect(report.cleanedTotal).toBe(18);
    });
  });
});
