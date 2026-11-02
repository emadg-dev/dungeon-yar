/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  can,
  canChangeMemberRole,
  canKickMember,
  canCreateInviteForRole,
  getRoleLabelFa,
  requirePermission,
  filterCharacterForRole,
  filterDiceFeedForRole,
  filterEncounterForRole,
  CAMPAIGN_ROLE_BADGES,
  Action,
  CampaignRole
} from './permissions';

describe('Centralized RBAC Permissions Module (/shared/permissions.ts)', () => {
  describe('Platform layer actions', () => {
    const platformActions: Action[] = [
      'platform:manage_users',
      'platform:manage_registration',
      'platform:run_migrations',
      'platform:manage_default_packs'
    ];

    it('allows platform admin to perform all platform actions', () => {
      for (const action of platformActions) {
        expect(can(null, action, { platformRole: 'admin' })).toBe(true);
        expect(can('player', action, { platformRole: 'admin' })).toBe(true);
      }
    });

    it('denies regular users (even campaign owners) platform management actions', () => {
      for (const action of platformActions) {
        expect(can('owner', action, { platformRole: 'user' })).toBe(false);
        expect(can('co_dm', action, { platformRole: 'user' })).toBe(false);
        expect(can('player', action, { platformRole: 'user' })).toBe(false);
        expect(can('spectator', action, { platformRole: 'user' })).toBe(false);
      }
    });

    it('evaluates platform:create_campaign according to policy', () => {
      // Admin can always create
      expect(can(null, 'platform:create_campaign', { platformRole: 'admin' })).toBe(true);
      // Default: anyone can create
      expect(can(null, 'platform:create_campaign', { platformRole: 'user' })).toBe(true);
      // Restricted to admin only
      expect(can(null, 'platform:create_campaign', { platformRole: 'user', allowCampaignCreation: 'admin' })).toBe(false);
    });

    it('prevents platform admins from automatically having campaign permissions without membership', () => {
      // Platform admin with NO campaign role (null) must NOT be permitted to perform campaign actions
      expect(can(null, 'campaign:edit_settings', { platformRole: 'admin' })).toBe(false);
      expect(can(null, 'character:edit_core', { platformRole: 'admin' })).toBe(false);
      expect(can(null, 'dm_tools:run_encounters', { platformRole: 'admin' })).toBe(false);
      expect(can(null, 'dice:roll_table', { platformRole: 'admin' })).toBe(false);
    });
  });

  describe('Campaign management & member actions', () => {
    it('owner has full control over campaign lifecycle except direct leaving', () => {
      expect(can('owner', 'campaign:edit_settings')).toBe(true);
      expect(can('owner', 'campaign:transfer_ownership')).toBe(true);
      expect(can('owner', 'campaign:delete_archive')).toBe(true);
      expect(can('owner', 'campaign:invite_members')).toBe(true);
      expect(can('owner', 'campaign:approve_reject_joins')).toBe(true);
      expect(can('owner', 'campaign:change_member_roles')).toBe(true);
      expect(can('owner', 'campaign:kick_member')).toBe(true);
      // Owner must transfer ownership before leaving!
      expect(can('owner', 'campaign:leave')).toBe(false);
    });

    it('co_dm has limited campaign management powers', () => {
      expect(can('co_dm', 'campaign:edit_settings')).toBe(false);
      expect(can('co_dm', 'campaign:transfer_ownership')).toBe(false);
      expect(can('co_dm', 'campaign:delete_archive')).toBe(false);
      expect(can('co_dm', 'campaign:invite_members')).toBe(true);
      expect(can('co_dm', 'campaign:approve_reject_joins')).toBe(true);
      expect(can('co_dm', 'campaign:leave')).toBe(true);

      // co_dm role changes & kicks
      expect(can('co_dm', 'campaign:kick_member', { targetRole: 'player' })).toBe(true);
      expect(can('co_dm', 'campaign:kick_member', { targetRole: 'spectator' })).toBe(true);
      expect(can('co_dm', 'campaign:kick_member', { targetRole: 'co_dm' })).toBe(false);
      expect(can('co_dm', 'campaign:kick_member', { targetRole: 'owner' })).toBe(false);

      expect(can('co_dm', 'campaign:change_member_roles', { targetRole: 'player', newRole: 'spectator' })).toBe(true);
      expect(can('co_dm', 'campaign:change_member_roles', { targetRole: 'player', newRole: 'co_dm' })).toBe(false);
      expect(can('co_dm', 'campaign:change_member_roles', { targetRole: 'co_dm', newRole: 'player' })).toBe(false);
      expect(can('co_dm', 'campaign:change_member_roles', { targetRole: 'owner', newRole: 'player' })).toBe(false);
    });

    it('player and spectator cannot manage campaign settings or members', () => {
      const roles: CampaignRole[] = ['player', 'spectator'];
      for (const r of roles) {
        expect(can(r, 'campaign:edit_settings')).toBe(false);
        expect(can(r, 'campaign:transfer_ownership')).toBe(false);
        expect(can(r, 'campaign:delete_archive')).toBe(false);
        expect(can(r, 'campaign:invite_members')).toBe(false);
        expect(can(r, 'campaign:approve_reject_joins')).toBe(false);
        expect(can(r, 'campaign:change_member_roles')).toBe(false);
        expect(can(r, 'campaign:kick_member')).toBe(false);
        // But both can leave
        expect(can(r, 'campaign:leave')).toBe(true);
      }
    });

    it('enforces member role transition rules via canChangeMemberRole', () => {
      // Owner can promote to co_dm or demote co_dm to player
      expect(canChangeMemberRole('owner', 'player', 'co_dm').allowed).toBe(true);
      expect(canChangeMemberRole('owner', 'co_dm', 'player').allowed).toBe(true);
      // Owner cannot set another owner via role change (must use transfer ownership)
      expect(canChangeMemberRole('owner', 'player', 'owner').allowed).toBe(false);

      // co_dm CANNOT change owner or co_dm
      expect(canChangeMemberRole('co_dm', 'owner', 'player').allowed).toBe(false);
      expect(canChangeMemberRole('co_dm', 'co_dm', 'player').allowed).toBe(false);
      // co_dm CANNOT promote to co_dm
      expect(canChangeMemberRole('co_dm', 'player', 'co_dm').allowed).toBe(false);
      // co_dm CAN switch player <-> spectator
      expect(canChangeMemberRole('co_dm', 'player', 'spectator').allowed).toBe(true);
      expect(canChangeMemberRole('co_dm', 'spectator', 'player').allowed).toBe(true);

      // Player cannot change any roles
      expect(canChangeMemberRole('player', 'spectator', 'player').allowed).toBe(false);
    });

    it('enforces kick rules via canKickMember', () => {
      expect(canKickMember('owner', 'player').allowed).toBe(true);
      expect(canKickMember('owner', 'co_dm').allowed).toBe(true);
      expect(canKickMember('owner', 'owner').allowed).toBe(false);

      expect(canKickMember('co_dm', 'player').allowed).toBe(true);
      expect(canKickMember('co_dm', 'spectator').allowed).toBe(true);
      expect(canKickMember('co_dm', 'co_dm').allowed).toBe(false);
      expect(canKickMember('co_dm', 'owner').allowed).toBe(false);

      expect(canKickMember('player', 'spectator').allowed).toBe(false);
    });

    it('enforces invite role rule: invite codes can NEVER grant owner or co_dm', () => {
      expect(canCreateInviteForRole('owner', 'player').allowed).toBe(true);
      expect(canCreateInviteForRole('owner', 'spectator').allowed).toBe(true);
      expect(canCreateInviteForRole('owner', 'owner').allowed).toBe(false);
      expect(canCreateInviteForRole('owner', 'co_dm').allowed).toBe(false);

      expect(canCreateInviteForRole('co_dm', 'player').allowed).toBe(true);
      expect(canCreateInviteForRole('co_dm', 'spectator').allowed).toBe(true);
      expect(canCreateInviteForRole('co_dm', 'owner').allowed).toBe(false);
      expect(canCreateInviteForRole('co_dm', 'co_dm').allowed).toBe(false);

      expect(canCreateInviteForRole('player', 'player').allowed).toBe(false);
    });
  });

  describe('Characters and play state', () => {
    it('owner and co_dm can edit core stats, grant rewards, respec and delete', () => {
      const dmRoles: CampaignRole[] = ['owner', 'co_dm'];
      for (const r of dmRoles) {
        expect(can(r, 'character:view_sheet')).toBe(true);
        expect(can(r, 'character:edit_core')).toBe(true);
        expect(can(r, 'character:edit_live_state')).toBe(true);
        expect(can(r, 'character:grant_rewards')).toBe(true);
        expect(can(r, 'character:manage_inventory')).toBe(true);
        expect(can(r, 'character:level_up')).toBe(true);
        expect(can(r, 'character:respec')).toBe(true);
        expect(can(r, 'character:delete')).toBe(true);
      }
    });

    it('player can only edit live state, inventory, and draft level-up for OWN character', () => {
      // Own character
      expect(can('player', 'character:edit_live_state', { isOwn: true })).toBe(true);
      expect(can('player', 'character:manage_inventory', { isOwn: true })).toBe(true);
      expect(can('player', 'character:level_up', { isOwn: true })).toBe(true);
      expect(can('player', 'character:delete', { isOwn: true })).toBe(true);

      // Other player character
      expect(can('player', 'character:edit_live_state', { isOwn: false })).toBe(false);
      expect(can('player', 'character:manage_inventory', { isOwn: false })).toBe(false);
      expect(can('player', 'character:level_up', { isOwn: false })).toBe(false);
      expect(can('player', 'character:delete', { isOwn: false })).toBe(false);

      // Core editing, granting rewards, respec are NEVER player-free
      expect(can('player', 'character:edit_core', { isOwn: true })).toBe(false);
      expect(can('player', 'character:grant_rewards', { isOwn: true })).toBe(false);
      expect(can('player', 'character:respec', { isOwn: true })).toBe(false);
    });

    it('spectator has NO edit rights on characters', () => {
      expect(can('spectator', 'character:view_sheet')).toBe(true);
      expect(can('spectator', 'character:edit_core', { isOwn: true })).toBe(false);
      expect(can('spectator', 'character:edit_live_state', { isOwn: true })).toBe(false);
      expect(can('spectator', 'character:grant_rewards', { isOwn: true })).toBe(false);
      expect(can('spectator', 'character:manage_inventory', { isOwn: true })).toBe(false);
      expect(can('spectator', 'character:level_up', { isOwn: true })).toBe(false);
      expect(can('spectator', 'character:respec', { isOwn: true })).toBe(false);
      expect(can('spectator', 'character:delete', { isOwn: true })).toBe(false);
    });
  });

  describe('Dice and rolls', () => {
    it('owner and co_dm can roll table, secret rolls, view feed and clear log', () => {
      for (const r of ['owner', 'co_dm'] as CampaignRole[]) {
        expect(can(r, 'dice:roll_table')).toBe(true);
        expect(can(r, 'dice:roll_secret')).toBe(true);
        expect(can(r, 'dice:view_feed')).toBe(true);
        expect(can(r, 'dice:clear_log')).toBe(true);
      }
    });

    it('player can roll table and view feed, but cannot make secret rolls or clear log', () => {
      expect(can('player', 'dice:roll_table')).toBe(true);
      expect(can('player', 'dice:roll_secret')).toBe(false);
      expect(can('player', 'dice:view_feed')).toBe(true);
      expect(can('player', 'dice:clear_log')).toBe(false);
    });

    it('spectator CANNOT roll dice at all, but can view feed', () => {
      expect(can('spectator', 'dice:roll_table')).toBe(false);
      expect(can('spectator', 'dice:roll_secret')).toBe(false);
      expect(can('spectator', 'dice:view_feed')).toBe(true);
      expect(can('spectator', 'dice:clear_log')).toBe(false);
    });
  });

  describe('DM tools and campaign content', () => {
    const dmToolActions: Action[] = [
      'dm_tools:run_encounters',
      'dm_tools:bestiary',
      'dm_tools:items_loot',
      'dm_tools:handouts_maps',
      'dm_tools:quests',
      'dm_tools:sessions_scheduling',
      'dm_tools:recaps',
      'dm_tools:campaign_notes',
      'dm_tools:world_tools'
    ];

    it('owner and co_dm can use all DM tools', () => {
      for (const r of ['owner', 'co_dm'] as CampaignRole[]) {
        for (const act of dmToolActions) {
          expect(can(r, act)).toBe(true);
        }
      }
    });

    it('player and spectator cannot use DM authoring tools', () => {
      for (const r of ['player', 'spectator'] as CampaignRole[]) {
        for (const act of dmToolActions) {
          expect(can(r, act)).toBe(false);
        }
      }
    });
  });

  describe('Role labels & badges', () => {
    it('returns proper Persian labels for all roles', () => {
      expect(getRoleLabelFa('owner')).toBe('مالک');
      expect(getRoleLabelFa('co_dm')).toBe('دستیار DM');
      expect(getRoleLabelFa('player')).toBe('ماجراجو');
      expect(getRoleLabelFa('spectator')).toBe('تماشاچی');
    });

    it('provides badge classes with appropriate colors', () => {
      expect(CAMPAIGN_ROLE_BADGES.owner.colorName).toBe('amber');
      expect(CAMPAIGN_ROLE_BADGES.co_dm.colorName).toBe('purple');
      expect(CAMPAIGN_ROLE_BADGES.player.colorName).toBe('slate');
      expect(CAMPAIGN_ROLE_BADGES.spectator.colorName).toBe('zinc');
    });
  });

  describe('Response filtering & data stripping', () => {
    const sampleCharacter = {
      id: 'char-1',
      name: 'آرتین',
      dmNotes: 'این کاراکتر وارث مخفی تاج و تخت است.',
      dm_notes: 'راز دوم',
      backstory: {
        summary: 'پیشینه کلی',
        dmOnly: { secrets: 'راز مخفی', hooks: 'قلاب داستانی' },
        sections: [
          { title: 'کودکی', content: 'در دهکده زیست', shareWithParty: true },
          { title: 'گناه پنهان', content: 'دزدی از معبد', shareWithParty: false }
        ]
      }
    };

    it('keeps full data for owner and co_dm', () => {
      const res = filterCharacterForRole(sampleCharacter, 'owner', false);
      expect(res.dmNotes).toBe('این کاراکتر وارث مخفی تاج و تخت است.');
      expect(res.backstory.dmOnly).toBeDefined();

      const resCoDm = filterCharacterForRole(sampleCharacter, 'co_dm', false);
      expect(resCoDm.dmNotes).toBe('این کاراکتر وارث مخفی تاج و تخت است.');
    });

    it('strips DM notes and unshared backstory sections from other players', () => {
      const res = filterCharacterForRole(sampleCharacter, 'player', false);
      expect(res.dmNotes).toBeUndefined();
      expect(res.dm_notes).toBeUndefined();
      expect(res.backstory.dmOnly).toBeUndefined();
      // Only party-shared sections
      expect(res.backstory.sections.length).toBe(1);
      expect(res.backstory.sections[0].title).toBe('کودکی');
    });

    it('strips secret rolls from dice feed for players and spectators', () => {
      const rolls = [
        { id: '1', visibility: 'table', total: 15, userId: 'u1' },
        { id: '2', visibility: 'dm_only', total: 20, userId: 'u-dm' },
        { id: '3', visibility: 'table', total: 10, userId: 'u2' }
      ];

      // DM sees all
      expect(filterDiceFeedForRole(rolls, 'owner', 'u-dm').length).toBe(3);
      // Player only sees table rolls (or own private roll)
      const playerFeed = filterDiceFeedForRole(rolls, 'player', 'u1');
      expect(playerFeed.length).toBe(2);
      expect(playerFeed.map(r => r.id)).toEqual(['1', '3']);
    });

    it('strips DM notes and hidden participants from encounters', () => {
      const enc = {
        id: 'enc-1',
        name: 'شبیخون گرگ‌ها',
        dmNotes: 'گرگ سوم دارای حلقه جادویی است',
        participants: [
          { id: 'p1', instanceName: 'گرگ اول', revealed: true },
          { id: 'p2', instanceName: 'گرگ مخفی آلفا', revealed: false }
        ]
      };

      const playerEnc = filterEncounterForRole(enc, 'player');
      expect(playerEnc.dmNotes).toBeUndefined();
      expect(playerEnc.participants.length).toBe(1);
      expect(playerEnc.participants[0].id).toBe('p1');
    });
  });

  describe('requirePermission middleware helper', () => {
    const mockDb = {
      prepare: (sql: string) => ({
        bind: (campId: string, userId: string) => ({
          first: async () => {
            if (userId === 'user-owner') return { role: 'owner' };
            if (userId === 'user-co-dm') return { role: 'co_dm' };
            if (userId === 'user-player') return { role: 'player' };
            if (userId === 'user-spectator') return { role: 'spectator' };
            return null; // non-member
          }
        })
      })
    };

    it('returns 401 if userId is missing', async () => {
      const res = await requirePermission(mockDb, '', 'c1', 'campaign:edit_settings');
      expect(res.status).toBe(401);
      expect(res.allowed).toBe(false);
    });

    it('returns 404 for non-members (preventing existence leak)', async () => {
      const res = await requirePermission(mockDb, 'stranger', 'c1', 'campaign:edit_settings');
      expect(res.status).toBe(404);
      expect(res.allowed).toBe(false);
    });

    it('returns 403 when role is inadequate', async () => {
      const res = await requirePermission(mockDb, 'user-player', 'c1', 'campaign:edit_settings');
      expect(res.status).toBe(403);
      expect(res.allowed).toBe(false);
    });

    it('returns 200 when role has permission', async () => {
      const res = await requirePermission(mockDb, 'user-owner', 'c1', 'campaign:edit_settings');
      expect(res.status).toBe(200);
      expect(res.allowed).toBe(true);
      expect(res.role).toBe('owner');
    });
  });
});
