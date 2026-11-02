/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Centralized Role-Based Access Control (RBAC) Module for DungeonYar.
 * Defines roles across Platform and Campaign layers, the permission matrix,
 * evaluation helpers, role transitions, and response filtering rules.
 * Used by both Cloudflare Pages Functions and the React client.
 */

export type PlatformRole = 'admin' | 'user';
export type CampaignRole = 'owner' | 'co_dm' | 'player' | 'spectator';

export type Action =
  // Platform layer
  | 'platform:manage_users'
  | 'platform:manage_registration'
  | 'platform:run_migrations'
  | 'platform:manage_default_packs'
  | 'platform:create_campaign'
  // Campaign management & members
  | 'campaign:edit_settings'
  | 'campaign:transfer_ownership'
  | 'campaign:delete_archive'
  | 'campaign:invite_members'
  | 'campaign:approve_reject_joins'
  | 'campaign:change_member_roles'
  | 'campaign:kick_member'
  | 'campaign:leave'
  // Characters & play state
  | 'character:view_sheet'
  | 'character:edit_core'
  | 'character:edit_live_state'
  | 'character:grant_rewards'
  | 'character:manage_inventory'
  | 'character:level_up'
  | 'character:respec'
  | 'character:delete'
  // Dice & rolls
  | 'dice:roll_table'
  | 'dice:roll_secret'
  | 'dice:view_feed'
  | 'dice:clear_log'
  // DM tools & campaign content
  | 'dm_tools:run_encounters'
  | 'dm_tools:bestiary'
  | 'dm_tools:items_loot'
  | 'dm_tools:handouts_maps'
  | 'dm_tools:quests'
  | 'dm_tools:sessions_scheduling'
  | 'dm_tools:recaps'
  | 'dm_tools:campaign_notes'
  | 'dm_tools:world_tools';

export interface PermissionContext {
  isOwn?: boolean;
  isRevealed?: boolean;
  platformRole?: PlatformRole;
  allowPlayerRollPrivate?: boolean;
  allowCampaignCreation?: 'anyone' | 'admin' | boolean;
  targetRole?: CampaignRole;
  newRole?: CampaignRole;
  inviteRole?: CampaignRole;
}

export interface RoleBadgeInfo {
  role: CampaignRole;
  labelFa: string;
  colorName: 'amber' | 'purple' | 'slate' | 'zinc';
  badgeClass: string;
}

export const CAMPAIGN_ROLE_BADGES: Record<CampaignRole, RoleBadgeInfo> = {
  owner: {
    role: 'owner',
    labelFa: 'مالک',
    colorName: 'amber',
    badgeClass: 'bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/40'
  },
  co_dm: {
    role: 'co_dm',
    labelFa: 'دستیار DM',
    colorName: 'purple',
    badgeClass: 'bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/40'
  },
  player: {
    role: 'player',
    labelFa: 'ماجراجو',
    colorName: 'slate',
    badgeClass: 'bg-[#475569]/30 text-[#CBD5E1] border border-[#64748B]/40'
  },
  spectator: {
    role: 'spectator',
    labelFa: 'تماشاچی',
    colorName: 'zinc',
    badgeClass: 'bg-[#3F3F46]/30 text-[#A1A1AA] border border-[#52525B]/40'
  }
};

/**
 * Returns Persian human-friendly label for a campaign role.
 */
export function getRoleLabelFa(role: CampaignRole | string | null | undefined): string {
  if (!role) return 'نامشخص';
  if (role in CAMPAIGN_ROLE_BADGES) {
    return CAMPAIGN_ROLE_BADGES[role as CampaignRole].labelFa;
  }
  return role;
}

/**
 * Central permission check.
 * Checks whether an actor with campaign role `role` (and optional platform role in context)
 * can perform `action`.
 *
 * Rules:
 * - Non-members (role === null | undefined) have NO campaign permissions.
 * - Platform admins do NOT automatically get campaign permissions unless they are campaign members.
 */
export function can(
  role: CampaignRole | null | undefined,
  action: Action,
  context?: PermissionContext
): boolean {
  // 1. Platform actions (evaluated by platform role)
  if (action.startsWith('platform:')) {
    const isPlatformAdmin = context?.platformRole === 'admin';
    if (action === 'platform:create_campaign') {
      if (isPlatformAdmin) return true;
      if (context?.allowCampaignCreation === 'admin' || context?.allowCampaignCreation === false) {
        return false;
      }
      return true; // Default: 'anyone'
    }
    return isPlatformAdmin;
  }

  // 2. Campaign actions require active membership
  if (!role) {
    return false;
  }

  switch (action) {
    // Campaign management & members
    case 'campaign:edit_settings':
      return role === 'owner';

    case 'campaign:transfer_ownership':
      return role === 'owner';

    case 'campaign:delete_archive':
      return role === 'owner';

    case 'campaign:invite_members':
      return role === 'owner' || role === 'co_dm';

    case 'campaign:approve_reject_joins':
      return role === 'owner' || role === 'co_dm';

    case 'campaign:change_member_roles':
      if (role === 'owner') return true;
      if (role === 'co_dm') {
        // co_dm CANNOT change owner/co_dm roles and CANNOT promote to co_dm
        if (context?.targetRole === 'owner' || context?.targetRole === 'co_dm') return false;
        if (context?.newRole === 'owner' || context?.newRole === 'co_dm') return false;
        return true;
      }
      return false;

    case 'campaign:kick_member':
      if (role === 'owner') return true;
      if (role === 'co_dm') {
        // co_dm can kick players/spectators, CANNOT kick owner or co_dms
        if (context?.targetRole === 'owner' || context?.targetRole === 'co_dm') return false;
        return true;
      }
      return false;

    case 'campaign:leave':
      // Owner cannot leave directly; must transfer ownership first
      return role !== 'owner';

    // Characters & play state
    case 'character:view_sheet':
      // All members can view sheets (content filtering happens at response level)
      return true;

    case 'character:edit_core':
      return role === 'owner' || role === 'co_dm';

    case 'character:edit_live_state':
      if (role === 'owner' || role === 'co_dm') return true;
      if (role === 'player') return Boolean(context?.isOwn);
      return false;

    case 'character:grant_rewards':
      return role === 'owner' || role === 'co_dm';

    case 'character:manage_inventory':
      if (role === 'owner' || role === 'co_dm') return true;
      if (role === 'player') return Boolean(context?.isOwn);
      return false;

    case 'character:level_up':
      if (role === 'owner' || role === 'co_dm') return true;
      if (role === 'player') return Boolean(context?.isOwn);
      return false;

    case 'character:respec':
      return role === 'owner' || role === 'co_dm';

    case 'character:delete':
      if (role === 'owner' || role === 'co_dm') return true;
      if (role === 'player') return Boolean(context?.isOwn);
      return false;

    // Dice & rolls
    case 'dice:roll_table':
      return role === 'owner' || role === 'co_dm' || role === 'player';

    case 'dice:roll_secret':
      return role === 'owner' || role === 'co_dm';

    case 'dice:view_feed':
      return true; // All members can view feed; secret rolls are stripped at response level

    case 'dice:clear_log':
      return role === 'owner' || role === 'co_dm';

    // DM tools & campaign content
    case 'dm_tools:run_encounters':
      return role === 'owner' || role === 'co_dm';

    case 'dm_tools:bestiary':
      return role === 'owner' || role === 'co_dm';

    case 'dm_tools:items_loot':
      return role === 'owner' || role === 'co_dm';

    case 'dm_tools:handouts_maps':
      return role === 'owner' || role === 'co_dm';

    case 'dm_tools:quests':
      return role === 'owner' || role === 'co_dm';

    case 'dm_tools:sessions_scheduling':
      return role === 'owner' || role === 'co_dm';

    case 'dm_tools:recaps':
      return role === 'owner' || role === 'co_dm';

    case 'dm_tools:campaign_notes':
      return role === 'owner' || role === 'co_dm';

    case 'dm_tools:world_tools':
      return role === 'owner' || role === 'co_dm';

    default:
      return false;
  }
}

/**
 * Validates member role changes according to the matrix:
 * - Owner can promote/demote players, spectators, and co_dms (cannot demote self without transfer).
 * - Co-DM CANNOT change owner or co_dm roles. CANNOT promote to co_dm.
 * - Player and spectator cannot change roles.
 */
export function canChangeMemberRole(
  actorRole: CampaignRole | null | undefined,
  targetCurrentRole: CampaignRole,
  newRole: CampaignRole
): { allowed: boolean; reason?: string } {
  if (!actorRole) {
    return { allowed: false, reason: 'عضو کمپین نیستید.' };
  }

  if (targetCurrentRole === 'owner') {
    return { allowed: false, reason: 'نقش مالک تنها از طریق انتقال مالکیت کمپین تغییر می‌یابد.' };
  }

  if (actorRole === 'owner') {
    if (newRole === 'owner') {
      return { allowed: false, reason: 'برای انتصاب مالک جدید، از گزینه «انتقال مالکیت کمپین» استفاده کنید.' };
    }
    return { allowed: true };
  }

  if (actorRole === 'co_dm') {
    if (targetCurrentRole === 'co_dm') {
      return { allowed: false, reason: 'دستیار دانجن‌مستر نمی‌تواند نقش سایر دستیاران یا مالک را تغییر دهد.' };
    }
    if (newRole === 'owner' || newRole === 'co_dm') {
      return { allowed: false, reason: 'فقط مالک کمپین می‌تواند عضوی را به عنوان دستیار دانجن‌مستر منصوب کند.' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'فقط دانجن‌مستر یا مالک کمپین مجاز به تغییر نقش اعضا هستند.' };
}

/**
 * Validates kicking a member:
 * - Owner can kick co_dm, player, spectator (cannot kick self).
 * - Co-DM can kick player, spectator; CANNOT kick owner or co_dms.
 */
export function canKickMember(
  actorRole: CampaignRole | null | undefined,
  targetRole: CampaignRole
): { allowed: boolean; reason?: string } {
  if (!actorRole) {
    return { allowed: false, reason: 'عضو کمپین نیستید.' };
  }

  if (targetRole === 'owner') {
    return { allowed: false, reason: 'نمی‌توان مالک کمپین را اخراج کرد.' };
  }

  if (actorRole === 'owner') {
    return { allowed: true };
  }

  if (actorRole === 'co_dm') {
    if (targetRole === 'co_dm') {
      return { allowed: false, reason: 'دستیار دانجن‌مستر نمی‌تواند دستیار دیگری را اخراج کند.' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'فقط مالک یا دستیار دانجن‌مستر مجاز به اخراج اعضا هستند.' };
}

/**
 * Validates creating an invite with a target role.
 * Invariant: Invite codes can NEVER grant owner or co_dm.
 */
export function canCreateInviteForRole(
  actorRole: CampaignRole | null | undefined,
  targetInviteRole: CampaignRole
): { allowed: boolean; reason?: string } {
  if (!actorRole || (actorRole !== 'owner' && actorRole !== 'co_dm')) {
    return { allowed: false, reason: 'فقط مالک یا دستیار دانجن‌مستر مجاز به ساخت کد دعوت هستند.' };
  }

  if (targetInviteRole === 'owner' || targetInviteRole === 'co_dm') {
    return { allowed: false, reason: 'کد دعوت هرگز نمی‌تواند نقش مالک یا دستیار DM را اعطا کند.' };
  }

  return { allowed: true };
}

/**
 * Resolves a user's campaign role directly from Cloudflare D1.
 * Always queries fresh from database, never caches in session token.
 */
export async function getCampaignRole(
  db: any,
  userId: string,
  campaignId: string
): Promise<CampaignRole | null> {
  if (!db || !userId || !campaignId) return null;
  try {
    const row = await db.prepare(
      "SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND status = 'active'"
    ).bind(campaignId, userId).first();
    return (row?.role as CampaignRole) || null;
  } catch {
    return null;
  }
}

/**
 * Middleware verification for campaign endpoints:
 * 1. Checks membership: if non-member, returns 404 Not Found (hiding existence).
 * 2. Checks permission: if inadequate role, returns 403 Forbidden.
 */
export async function requirePermission(
  db: any,
  userId: string,
  campaignId: string,
  action: Action,
  context?: PermissionContext
): Promise<{ allowed: boolean; role: CampaignRole | null; status: 200 | 401 | 403 | 404; reason?: string }> {
  if (!userId) {
    return { allowed: false, role: null, status: 401, reason: 'نشست شما معتبر نیست. لطفاً وارد شوید.' };
  }

  const role = await getCampaignRole(db, userId, campaignId);
  if (!role) {
    return { allowed: false, role: null, status: 404, reason: 'کمپین یافت نشد یا شما عضو آن نیستید.' };
  }

  const permitted = can(role, action, context);
  if (!permitted) {
    return { allowed: false, role, status: 403, reason: 'شما مجوز دسترسی یا انجام این عملیات را در این کمپین ندارید.' };
  }

  return { allowed: true, role, status: 200 };
}

// ----------------------------------------------------------------------
// Response-Level Stripping Helpers
// ----------------------------------------------------------------------

/**
 * Strips DM-only notes and unrevealed elements from character sheets for players/spectators.
 */
export function filterCharacterForRole(
  char: any,
  viewerRole: CampaignRole | null | undefined,
  isOwnCharacter: boolean
): any {
  if (!char) return null;
  const isDm = viewerRole === 'owner' || viewerRole === 'co_dm';
  if (isDm) return char;

  const sanitized = { ...char };

  // Strip DM notes on character
  delete sanitized.dmNotes;
  delete sanitized.dm_notes;

  // Spectator: approved and public parts only
  if (viewerRole === 'spectator') {
    sanitized.notes = '';
  }

  // Backstory filtering
  if (sanitized.backstory) {
    sanitized.backstory = { ...sanitized.backstory };
    // DM secrets are completely removed
    delete sanitized.backstory.dmOnly;
    // If not own character, only party-shared sections are visible
    if (!isOwnCharacter && Array.isArray(sanitized.backstory.sections)) {
      sanitized.backstory.sections = sanitized.backstory.sections.filter((s: any) => s.shareWithParty);
    }
  }

  return sanitized;
}

/**
 * Strips secret rolls from dice feed for players/spectators.
 */
export function filterDiceFeedForRole(
  rolls: any[],
  viewerRole: CampaignRole | null | undefined,
  viewerUserId: string
): any[] {
  if (!Array.isArray(rolls)) return [];
  const isDm = viewerRole === 'owner' || viewerRole === 'co_dm';
  if (isDm) return rolls;

  return rolls.filter(r => {
    // DM-only secret rolls are invisible to non-DMs (even if rolled by player if not permitted, or only if own)
    if (r.visibility === 'dm_only') {
      return r.userId === viewerUserId;
    }
    return true;
  });
}

/**
 * Strips DM notes and hidden participants from live encounters for players/spectators.
 */
export function filterEncounterForRole(
  enc: any,
  viewerRole: CampaignRole | null | undefined
): any {
  if (!enc) return null;
  const isDm = viewerRole === 'owner' || viewerRole === 'co_dm';
  if (isDm) return enc;

  const sanitized = { ...enc };
  delete sanitized.dmNotes;
  delete sanitized.dm_notes;

  if (Array.isArray(sanitized.participants)) {
    sanitized.participants = sanitized.participants.filter((p: any) => p.revealed !== false);
  }

  return sanitized;
}
