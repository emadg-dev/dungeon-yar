import { onRequest } from '../../functions/api/[[route]]';
import type { GenericCalendarData, CampaignRole } from '../../src/types';

export interface MockDbState {
  users: Map<string, any>;
  sessions: Map<string, any>;
  campaigns: Map<string, any>;
  campaignMembers: Map<string, any>; // key: `${campaignId}:${userId}`
  campaignTime: Map<string, any>; // key: campaignId
  calendars: Map<string, any>; // key: calendarId
  campaignCalendar: Map<string, any>; // key: id
  campaignMaps: Map<string, any>; // key: mapId
  mapStamps: Map<string, any>; // key: stampId
  mapFeatures: Map<string, any>; // key: featureId
  locations: Map<string, any>; // key: locId
  npcs: Map<string, any>; // key: npcId
  characterParticipations: Map<string, any>; // key: partId
  media: Map<string, any>; // key: mediaId
  auditLog: any[];
}

export async function sha256Hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Creates an in-memory D1 mock capable of executing real handlers in functions/api/[[route]].ts
 */
export function createMockD1(state: MockDbState) {
  return {
    prepare(sql: string) {
      const normalizedSql = sql.trim().replace(/\s+/g, ' ');
      let boundParams: any[] = [];

      return {
        bind(...params: any[]) {
          boundParams = params;
          return this;
        },
        async first(): Promise<any | null> {
          const res = await this.all();
          return res.results.length > 0 ? res.results[0] : null;
        },
        async all(): Promise<{ results: any[] }> {
          // 1. Session Auth query
          if (normalizedSql.includes('FROM auth_sessions s') && normalizedSql.includes('JOIN users u')) {
            const tokenHash = boundParams[0];
            for (const s of state.sessions.values()) {
              if (s.token_hash === tokenHash && (!s.revoked_at || s.revoked_at === null)) {
                const u = state.users.get(s.user_id);
                if (u && u.status === 'active' && !u.deleted_at) {
                  return {
                    results: [
                      {
                        ...s,
                        u_id: u.id,
                        u_email: u.email,
                        u_display_name: u.display_name,
                        u_password_hash: u.password_hash,
                        u_role: u.role,
                        u_platform_role: u.platform_role,
                        u_status: u.status,
                        u_must_change_password: u.must_change_password || 0,
                        u_created_at: u.created_at,
                        u_last_login_at: u.last_login_at,
                        u_deleted_at: u.deleted_at,
                        u_active_character_id: u.active_character_id || null,
                        u_avatar_url: u.avatar_url || null
                      }
                    ]
                  };
                }
              }
            }
            return { results: [] };
          }

          // 2. Campaign members
          if (normalizedSql.includes('FROM campaign_members') && normalizedSql.includes('campaign_id = ?') && normalizedSql.includes('user_id = ?')) {
            const campId = boundParams[0];
            const userId = boundParams[1];
            const key = `${campId}:${userId}`;
            const m = state.campaignMembers.get(key);
            return { results: m ? [m] : [] };
          }

          // 3. Campaign Time
          if (normalizedSql.includes('FROM campaign_time') && normalizedSql.includes('campaign_id = ?')) {
            const campId = boundParams[0];
            const t = state.campaignTime.get(campId);
            return { results: t ? [t] : [] };
          }

          // 4. Legacy campaign_calendar
          if (normalizedSql.includes('FROM campaign_calendar') && normalizedSql.includes('id = ?')) {
            const id = boundParams[0];
            const c = state.campaignCalendar.get(id);
            return { results: c ? [c] : [] };
          }

          // 5. Calendars by id
          if (normalizedSql.includes('FROM calendars WHERE id = ?')) {
            const id = boundParams[0];
            const c = state.calendars.get(id);
            return { results: c ? [c] : [] };
          }

          // 6. Calendars list for campaign or templates
          if (normalizedSql.includes('FROM calendars')) {
            const campId = boundParams[0];
            const isTemplateQuery = normalizedSql.includes("tags LIKE '%قالب%'") && !normalizedSql.includes("scope_id = ?");
            const hasPack = normalizedSql.includes("scope_type = 'pack'");
            const isCampOnly = !hasPack && (normalizedSql.includes('scope_type = "campaign"') || normalizedSql.includes("scope_type = 'campaign'"));

            let list = Array.from(state.calendars.values());
            if (isCampOnly && campId) {
              list = list.filter(c => c.scope_type === 'campaign' && c.scope_id === campId);
            } else if (campId && !isTemplateQuery) {
              list = list.filter(c => c.scope_type === 'pack' || (c.scope_type === 'campaign' && c.scope_id === campId) || c.id === 'cal-zorvania');
            } else if (isTemplateQuery) {
              list = list.filter(c => c.scope_type === 'pack' || (typeof c.tags === 'string' && c.tags.includes('قالب')));
            }
            return { results: list };
          }

          // 7. Campaigns
          if (normalizedSql.includes('FROM campaigns WHERE id = ?')) {
            const id = boundParams[0];
            const camp = state.campaigns.get(id);
            return { results: camp ? [camp] : [] };
          }

          // 8. Campaign Maps queries
          if (normalizedSql.includes('FROM campaign_maps WHERE campaign_id = ?')) {
            const campId = boundParams[0];
            const list = Array.from(state.campaignMaps.values())
              .filter(m => m.campaign_id === campId)
              .sort((a, b) => (b.is_main || 0) - (a.is_main || 0) || (a.created_at || 0) - (b.created_at || 0));
            return { results: list };
          }

          if (normalizedSql.includes('FROM campaign_maps WHERE id = ? AND campaign_id = ?')) {
            const [mapId, campId] = boundParams;
            const m = state.campaignMaps.get(mapId);
            return { results: m && m.campaign_id === campId ? [m] : [] };
          }

          if (normalizedSql.includes('FROM campaign_maps WHERE id = ?')) {
            const [mapId] = boundParams;
            const m = state.campaignMaps.get(mapId);
            return { results: m ? [m] : [] };
          }

          // 9. Map Features queries
          if (normalizedSql.includes('SELECT COUNT(*) as cnt FROM map_features WHERE map_id = ?')) {
            const [mapId, campId] = boundParams;
            const list = Array.from(state.mapFeatures.values()).filter(f => f.map_id === mapId && f.campaign_id === campId);
            return { results: [{ cnt: list.length }] };
          }

          if (normalizedSql.includes('FROM map_features WHERE id = ? AND map_id = ? AND campaign_id = ?')) {
            const [featId, mapId, campId] = boundParams;
            const f = state.mapFeatures.get(featId);
            return { results: f && f.map_id === mapId && f.campaign_id === campId ? [f] : [] };
          }

          if (normalizedSql.includes('FROM map_features WHERE map_id = ? AND campaign_id = ?')) {
            const [mapId, campId] = boundParams;
            const onlyRevealed = normalizedSql.includes('is_revealed = 1');
            let list = Array.from(state.mapFeatures.values()).filter(f => f.map_id === mapId && f.campaign_id === campId);
            if (onlyRevealed) {
              list = list.filter(f => Boolean(f.is_revealed));
            }
            list.sort((a, b) => (a.updated_at || 0) - (b.updated_at || 0));
            return { results: list };
          }

          // 10. Map Stamps queries
          if (normalizedSql.includes('FROM map_stamps WHERE campaign_id = ?')) {
            const campId = boundParams[0];
            const list = Array.from(state.mapStamps.values())
              .filter(s => s.campaign_id === campId)
              .sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
            return { results: list };
          }

          if (normalizedSql.includes('FROM map_stamps WHERE id = ? AND campaign_id = ?')) {
            const [stampId, campId] = boundParams;
            const s = state.mapStamps.get(stampId);
            return { results: s && s.campaign_id === campId ? [s] : [] };
          }

          // 11. Locations / NPCs / Participations queries (for IDOR checks)
          if (normalizedSql.includes('FROM locations WHERE id = ?')) {
            const [locId, campId] = boundParams;
            const loc = state.locations.get(locId);
            if (!loc) return { results: [] };
            if (campId && loc.scope_id !== campId && loc.scope_type !== 'pack') return { results: [] };
            return { results: [loc] };
          }

          if (normalizedSql.includes('FROM npcs WHERE id = ?')) {
            const [npcId, campId] = boundParams;
            const npc = state.npcs.get(npcId);
            if (!npc) return { results: [] };
            if (campId && npc.scope_id !== campId && npc.scope_type !== 'pack') return { results: [] };
            return { results: [npc] };
          }

          if (normalizedSql.includes('FROM character_participations WHERE id = ? AND campaign_id = ?')) {
            const [partId, campId] = boundParams;
            const part = state.characterParticipations.get(partId);
            return { results: part && part.campaign_id === campId ? [part] : [] };
          }

          // 12. Media queries
          if (normalizedSql.includes('FROM media WHERE id = ?')) {
            const [mediaId] = boundParams;
            const m = state.media.get(mediaId);
            return { results: m ? [m] : [] };
          }

          if (normalizedSql.includes('SELECT SUM(size_bytes) AS total FROM media WHERE owner_id = ?')) {
            const [ownerId] = boundParams;
            let sum = 0;
            for (const m of state.media.values()) {
              if (m.owner_id === ownerId) sum += Number(m.size_bytes || 0);
            }
            return { results: [{ total: sum }] };
          }

          return { results: [] };
        },
        async run(): Promise<{ success: boolean; changes?: number }> {
          // 1. INSERT / UPDATE campaign_time
          if (normalizedSql.includes('INTO campaign_time')) {
            const [campaign_id, calendar_id, epoch_day, updated_at] = boundParams;
            state.campaignTime.set(campaign_id, {
              campaign_id,
              calendar_id,
              epoch_day: Number(epoch_day),
              updated_at
            });
            return { success: true };
          }

          // 2. UPDATE campaign_time SET calendar_id = ...
          if (normalizedSql.includes('UPDATE campaign_time SET calendar_id = ?')) {
            const [calendar_id, updated_at, campaign_id] = boundParams;
            const existing = state.campaignTime.get(campaign_id);
            if (existing) {
              state.campaignTime.set(campaign_id, {
                ...existing,
                calendar_id,
                updated_at
              });
            }
            return { success: true };
          }

          // 3. INSERT INTO calendars
          if (normalizedSql.includes('INTO calendars')) {
            const isCampaignScope = normalizedSql.includes("'campaign'");
            const isPackScope = normalizedSql.includes("'pack'");
            const scope_type = isCampaignScope ? 'campaign' : isPackScope ? 'pack' : 'campaign';

            const id = boundParams[0];
            const scope_id = boundParams[1];
            const source_id = boundParams[2];
            const name = boundParams[3];
            const months = boundParams[4];
            const off_days = boundParams[5];
            const festivals = boundParams[6];
            const weekday_index = boundParams[7];
            const data = boundParams[8];
            const tags = boundParams[9];
            const era_label = boundParams[10];
            const start_year = boundParams[11];
            const weekdays = boundParams[12];
            const updated_at = boundParams[13];

            state.calendars.set(id, {
              id,
              scope_type,
              scope_id,
              source_id,
              name,
              months,
              off_days,
              festivals,
              weekday_index,
              data,
              tags,
              era_label,
              start_year,
              weekdays,
              updated_at
            });
            return { success: true };
          }

          // 4. UPDATE calendars SET
          if (normalizedSql.includes('UPDATE calendars SET')) {
            const calId = boundParams[boundParams.length - 1];
            const existing = state.calendars.get(calId);
            if (existing) {
              state.calendars.set(calId, {
                ...existing,
                name: boundParams[0],
                months: boundParams[1],
                off_days: boundParams[2],
                festivals: boundParams[3],
                weekday_index: boundParams[4],
                data: boundParams[5],
                tags: boundParams[6],
                era_label: boundParams[7],
                start_year: boundParams[8],
                weekdays: boundParams[9],
                updated_at: boundParams[10]
              });
            }
            return { success: true };
          }

          // 5. DELETE calendars
          if (normalizedSql.includes('DELETE FROM calendars')) {
            const id = boundParams[0];
            state.calendars.delete(id);
            return { success: true };
          }

          // 6. INSERT / UPDATE campaign_calendar (legacy)
          if (normalizedSql.includes('INTO campaign_calendar')) {
            const [id, year, month, day, is_off_day, off_day_index, current_festival, updated_at] = boundParams;
            state.campaignCalendar.set(id, {
              id,
              year,
              month,
              day,
              is_off_day,
              off_day_index,
              current_festival,
              updated_at
            });
            return { success: true };
          }

          // 7. Campaign Maps mutations
          if (normalizedSql.includes('UPDATE campaign_maps SET is_main = 0 WHERE campaign_id = ?')) {
            const campId = boundParams[0];
            const excludeId = boundParams[1];
            for (const m of state.campaignMaps.values()) {
              if (m.campaign_id === campId && (!excludeId || m.id !== excludeId)) {
                m.is_main = 0;
              }
            }
            return { success: true, changes: 1 };
          }

          if (normalizedSql.includes('INSERT INTO campaign_maps')) {
            const [id, campaign_id, name, media_id, width, height, is_main, created_at] = boundParams;
            state.campaignMaps.set(id, {
              id,
              campaign_id,
              name,
              media_id,
              width: Number(width),
              height: Number(height),
              is_main: Number(is_main),
              revision: 1,
              created_at: Number(created_at)
            });
            return { success: true, changes: 1 };
          }

          if (normalizedSql.includes('UPDATE campaign_maps SET name = ?') && normalizedSql.includes('revision = ?')) {
            const [name, media_id, width, height, is_main, mapId, campId, expectedRevision] = boundParams;
            const m = state.campaignMaps.get(mapId);
            if (!m || m.campaign_id !== campId || Number(m.revision) !== Number(expectedRevision)) {
              return { success: true, changes: 0 };
            }
            m.name = name;
            m.media_id = media_id;
            m.width = Number(width);
            m.height = Number(height);
            m.is_main = Number(is_main);
            m.revision = (m.revision || 1) + 1;
            return { success: true, changes: 1 };
          }

          if (normalizedSql.includes('UPDATE campaign_maps SET name = ?') && !normalizedSql.includes('revision = ?')) {
            const [name, media_id, width, height, is_main, mapId, campId] = boundParams;
            const m = state.campaignMaps.get(mapId);
            if (!m || m.campaign_id !== campId) return { success: true, changes: 0 };
            m.name = name;
            m.media_id = media_id;
            m.width = Number(width);
            m.height = Number(height);
            m.is_main = Number(is_main);
            m.revision = (m.revision || 1) + 1;
            return { success: true, changes: 1 };
          }

          if (normalizedSql.includes('UPDATE campaign_maps SET revision = revision + 1') && normalizedSql.includes('revision = ?')) {
            const [mapId, campId, expectedRevision] = boundParams;
            const m = state.campaignMaps.get(mapId);
            if (!m || m.campaign_id !== campId || Number(m.revision) !== Number(expectedRevision)) {
              return { success: true, changes: 0 };
            }
            m.revision = (m.revision || 1) + 1;
            return { success: true, changes: 1 };
          }

          if (normalizedSql.includes('UPDATE campaign_maps SET revision = revision + 1')) {
            const [mapId, campId] = boundParams;
            const m = state.campaignMaps.get(mapId);
            if (m && m.campaign_id === campId) {
              m.revision = (m.revision || 1) + 1;
            }
            return { success: true, changes: 1 };
          }

          // 8. Map Features mutations
          if (normalizedSql.includes('INSERT INTO map_features')) {
            const [id, map_id, campaign_id, kind, geometry, label, description, style, link_type, link_id, is_revealed, updated_at] = boundParams;
            state.mapFeatures.set(id, {
              id,
              map_id,
              campaign_id,
              kind,
              geometry,
              label,
              description,
              style,
              link_type,
              link_id,
              is_revealed: Number(is_revealed),
              updated_at: Number(updated_at)
            });
            return { success: true, changes: 1 };
          }

          if (normalizedSql.includes('UPDATE map_features SET')) {
            const [kind, geometry, label, description, style, link_type, link_id, is_revealed, updated_at, featureId, mapId, campId] = boundParams;
            const f = state.mapFeatures.get(featureId);
            if (f && f.map_id === mapId && f.campaign_id === campId) {
              f.kind = kind;
              f.geometry = geometry;
              f.label = label;
              f.description = description;
              f.style = style;
              f.link_type = link_type;
              f.link_id = link_id;
              f.is_revealed = Number(is_revealed);
              f.updated_at = Number(updated_at);
            }
            return { success: true, changes: 1 };
          }

          if (normalizedSql.includes('DELETE FROM map_features WHERE id = ?')) {
            const [featureId, mapId, campId] = boundParams;
            const f = state.mapFeatures.get(featureId);
            if (f && f.map_id === mapId && f.campaign_id === campId) {
              state.mapFeatures.delete(featureId);
            }
            return { success: true, changes: 1 };
          }

          // 9. Map Stamps mutations
          if (normalizedSql.includes('INSERT INTO map_stamps')) {
            const [id, campaign_id, name, media_id, created_by, width, height, created_at] = boundParams;
            state.mapStamps.set(id, {
              id,
              campaign_id,
              name,
              media_id,
              created_by,
              width: Number(width),
              height: Number(height),
              created_at: Number(created_at)
            });
            return { success: true, changes: 1 };
          }

          if (normalizedSql.includes('DELETE FROM map_stamps WHERE id = ?')) {
            const [stampId, campId] = boundParams;
            const s = state.mapStamps.get(stampId);
            if (s && s.campaign_id === campId) {
              state.mapStamps.delete(stampId);
            }
            return { success: true, changes: 1 };
          }

          // 10. Media mutations
          if (normalizedSql.includes('INSERT INTO media')) {
            const [id, owner_id, campaign_id, mime_type, size_bytes, data, width, height, created_at] = boundParams;
            state.media.set(id, {
              id,
              owner_id,
              campaign_id,
              mime_type,
              size_bytes,
              data,
              width,
              height,
              created_at
            });
            return { success: true, changes: 1 };
          }

          if (normalizedSql.includes('DELETE FROM media WHERE id = ?')) {
            const [mediaId, ownerId] = boundParams;
            const m = state.media.get(mediaId);
            if (m && (!ownerId || m.owner_id === ownerId)) {
              state.media.delete(mediaId);
            }
            return { success: true, changes: 1 };
          }

          // 11. Audit log
          if (normalizedSql.includes('INTO audit_log')) {
            state.auditLog.push(boundParams);
            return { success: true, changes: 1 };
          }

          return { success: true, changes: 1 };
        }
      };
    }
  };
}

/**
 * Creates an integrated test server environment wired directly to functions/api/[[route]].ts
 */
export async function createRealServerTestContext(campaignId = 'zorvania-c1') {
  const state: MockDbState = {
    users: new Map(),
    sessions: new Map(),
    campaigns: new Map(),
    campaignMembers: new Map(),
    campaignTime: new Map(),
    calendars: new Map(),
    campaignCalendar: new Map(),
    campaignMaps: new Map(),
    mapStamps: new Map(),
    mapFeatures: new Map(),
    locations: new Map(),
    npcs: new Map(),
    characterParticipations: new Map(),
    media: new Map(),
    auditLog: []
  };

  const db = createMockD1(state);

  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

  // Pre-seed users with different roles
  const users = [
    { id: 'user-owner', email: 'owner@zorvania.ir', display_name: 'مالک کمپین', role: 'dm', platform_role: 'admin', status: 'active', created_at: now },
    { id: 'user-codm', email: 'codm@zorvania.ir', display_name: 'کمک مستر', role: 'dm', platform_role: 'user', status: 'active', created_at: now },
    { id: 'user-player', email: 'player@zorvania.ir', display_name: 'بازیکن', role: 'player', platform_role: 'user', status: 'active', created_at: now },
    { id: 'user-spectator', email: 'spectator@zorvania.ir', display_name: 'تماشاچی', role: 'player', platform_role: 'user', status: 'active', created_at: now },
    { id: 'user-outsider', email: 'outsider@zorvania.ir', display_name: 'کاربر غریبه', role: 'dm', platform_role: 'admin', status: 'active', created_at: now }
  ];

  for (const u of users) {
    state.users.set(u.id, u);
    const token = `token-${u.id}`;
    const tokenHash = await sha256Hex(token);
    state.sessions.set(u.id, {
      id: `sess-${u.id}`,
      user_id: u.id,
      token_hash: tokenHash,
      created_at: now,
      expires_at: expiresAt,
      absolute_expires_at: expiresAt,
      revoked_at: null
    });
  }

  // Pre-seed campaign
  state.campaigns.set(campaignId, {
    id: campaignId,
    name: 'کمپین آزمایشی زروانیا',
    status: 'active',
    owner_id: 'user-owner'
  });

  // Pre-seed memberships
  const memberships: [string, CampaignRole][] = [
    ['user-owner', 'owner'],
    ['user-codm', 'co_dm'],
    ['user-player', 'player'],
    ['user-spectator', 'spectator']
  ];

  for (const [userId, role] of memberships) {
    state.campaignMembers.set(`${campaignId}:${userId}`, {
      campaign_id: campaignId,
      user_id: userId,
      role,
      status: 'active'
    });
  }

  // Pre-seed base Zorvania calendar
  const baseZorvaniaCal: GenericCalendarData = {
    id: 'cal-zorvania',
    name: 'گاه‌شمار شاه‌روزان (زروانیا)',
    eraLabel: 'پ.ر.ن',
    startYear: 1500,
    scopeType: 'pack',
    tags: ['قالب', 'زروانیا'],
    anchor: { weekdayIndex: 0 },
    months: [
      { name: 'فرورداد', days: 30, season: 'بهار' },
      { name: 'اردی‌مهر', days: 30, season: 'بهار' },
      { name: 'خورداد', days: 30, season: 'بهار' },
      { name: 'تیرآذر', days: 30, season: 'تابستان' },
      { name: 'امرداد', days: 30, season: 'تابستان' },
      { name: 'شهریور', days: 30, season: 'تابستان' },
      { name: 'مهرآیین', days: 30, season: 'پاییز' },
      { name: 'آبان‌داد', days: 30, season: 'پاییز' },
      { name: 'آذرپژواک', days: 30, season: 'پاییز' },
      { name: 'دی‌مهر', days: 30, season: 'زمستان' },
      { name: 'بهمن‌یار', days: 30, season: 'زمستان' },
      { name: 'اسفندارمذ', days: 30, season: 'زمستان' }
    ],
    offDays: [
      { id: 'off-1', name: 'گاه اول: اهنود' },
      { id: 'off-2', name: 'گاه دوم: اشتود' },
      { id: 'off-3', name: 'گاه سوم: سپنتمد' },
      { id: 'off-4', name: 'گاه چهارم: وهوخشتر' },
      { id: 'off-5', name: 'گاه پنجم: وهیشتوآیشت' }
    ],
    festivals: [
      { name: 'جشن روز نخست (نوروز کهن)', monthIndex: 1, day: 1 }
    ],
    weekdays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
  };

  state.calendars.set('cal-zorvania', {
    ...baseZorvaniaCal,
    months: JSON.stringify(baseZorvaniaCal.months),
    off_days: JSON.stringify(baseZorvaniaCal.offDays),
    festivals: JSON.stringify(baseZorvaniaCal.festivals),
    weekdays: JSON.stringify(baseZorvaniaCal.weekdays),
    tags: JSON.stringify(baseZorvaniaCal.tags),
    scope_type: 'pack',
    weekday_index: 0,
    start_year: 1500,
    era_label: 'پ.ر.ن',
    updated_at: now
  });

  const baseCampCalId = `cal-base-${campaignId}`;
  state.calendars.set(baseCampCalId, {
    ...baseZorvaniaCal,
    id: baseCampCalId,
    name: 'گاه‌شمار شاه‌روزان (زروانیا)',
    scope_type: 'campaign',
    scope_id: campaignId,
    source_id: 'cal-zorvania',
    months: JSON.stringify(baseZorvaniaCal.months),
    off_days: JSON.stringify(baseZorvaniaCal.offDays),
    festivals: JSON.stringify(baseZorvaniaCal.festivals),
    weekdays: JSON.stringify(baseZorvaniaCal.weekdays),
    tags: JSON.stringify(baseZorvaniaCal.tags),
    weekday_index: 0,
    start_year: 1500,
    era_label: 'پ.ر.ن',
    updated_at: now
  });

  // Pre-seed initial campaign time (epoch 0)
  state.campaignTime.set(campaignId, {
    campaign_id: campaignId,
    calendar_id: baseCampCalId,
    epoch_day: 0,
    updated_at: now
  });

  // Pre-seed locations, npcs, and participations for link & IDOR tests
  state.locations.set('loc-fire-temple', {
    id: 'loc-fire-temple',
    scope_type: 'campaign',
    scope_id: campaignId,
    name: 'آتشکده مرکزی زروان'
  });
  state.locations.set('loc-foreign', {
    id: 'loc-foreign',
    scope_type: 'campaign',
    scope_id: 'camp-foreign-diff',
    name: 'مکان متعلق به کمپین دیگر'
  });

  state.npcs.set('npc-zohak-emissary', {
    id: 'npc-zohak-emissary',
    scope_type: 'campaign',
    scope_id: campaignId,
    name: 'فرستاده ضحاک'
  });

  state.characterParticipations.set('part-hero-1', {
    id: 'part-hero-1',
    campaign_id: campaignId,
    character_id: 'char-1'
  });

  // Pre-seed map and stamp
  const mainMapId = `map-${campaignId}-main`;
  state.campaignMaps.set(mainMapId, {
    id: mainMapId,
    campaign_id: campaignId,
    name: 'نقشه جهان زروانیا',
    media_id: null,
    width: 2000,
    height: 1400,
    is_main: 1,
    revision: 1,
    created_at: now
  });

  state.mapStamps.set('stamp-fortress-1', {
    id: 'stamp-fortress-1',
    campaign_id: campaignId,
    name: 'دژ کهن کلاغ‌پر',
    media_id: null,
    created_by: 'user-owner',
    width: 64,
    height: 64,
    created_at: now
  });

  // Pre-seed revealed and unrevealed features
  state.mapFeatures.set('feat-forest-1', {
    id: 'feat-forest-1',
    map_id: mainMapId,
    campaign_id: campaignId,
    kind: 'terrain',
    geometry: JSON.stringify({ type: 'Polygon', coordinates: [[200, 300], [250, 550], [420, 600]] }),
    label: 'بیشه سیاه ورنا',
    description: 'جنگل کهن',
    style: JSON.stringify({ terrainType: 'forest', fillOpacity: 0.35 }),
    link_type: null,
    link_id: null,
    is_revealed: 1,
    updated_at: now
  });

  state.mapFeatures.set('feat-secret-1', {
    id: 'feat-secret-1',
    map_id: mainMapId,
    campaign_id: campaignId,
    kind: 'marker',
    geometry: JSON.stringify({ type: 'Point', coordinates: [520, 310] }),
    label: 'سرداب مخفی منشور پیوند',
    description: 'گنجینه پنهان دانجن مستر',
    style: JSON.stringify({ markerType: 'location' }),
    link_type: null,
    link_id: null,
    is_revealed: 0,
    updated_at: now
  });

  // Helper dispatcher to invoke onRequest handler directly
  const dispatch = async (
    pathWithQuery: string,
    options: {
      method?: string;
      body?: any;
      asUserId?: string;
      headers?: Record<string, string>;
    } = {}
  ): Promise<Response> => {
    const method = (options.method || 'GET').toUpperCase();
    const asUserId = options.asUserId || 'user-owner';
    const token = `token-${asUserId}`;

    const headers: Record<string, string> = {
      'Host': 'localhost:3000',
      'Cookie': `__Host-zsession=${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      headers['X-Requested-With'] = 'zorvania';
    }

    const url = new URL(`http://localhost:3000${pathWithQuery.startsWith('/api') ? pathWithQuery : '/api' + pathWithQuery}`);

    const request = new Request(url.toString(), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });

    const env = {
      DB: db,
      IP_HASH_SALT: 'test-salt-secret',
      DM_EMAILS: 'owner@zorvania.ir'
    };

    return await (onRequest as any)({
      request,
      env,
      params: {},
      waitUntil: () => {},
      next: async () => new Response()
    });
  };

  return {
    state,
    db,
    dispatch
  };
}

/**
 * Creates an extensible test server application instance for integration and lazy init testing.
 * Directly routes requests through Cloudflare Pages Functions onRequest handler.
 */
export function createServerTestApp() {
  const state: MockDbState = {
    users: new Map(),
    sessions: new Map(),
    campaigns: new Map(),
    campaignMembers: new Map(),
    campaignTime: new Map(),
    calendars: new Map(),
    campaignCalendar: new Map(),
    campaignMaps: new Map(),
    mapStamps: new Map(),
    mapFeatures: new Map(),
    locations: new Map(),
    npcs: new Map(),
    characterParticipations: new Map(),
    media: new Map(),
    auditLog: []
  };

  const db = createMockD1(state);

  const createUser = (id: string, email: string, displayName: string, platformRole: 'admin' | 'user' = 'user') => {
    const now = Date.now();
    const user = {
      id,
      email,
      display_name: displayName,
      role: 'player',
      platform_role: platformRole,
      status: 'active',
      created_at: now
    };
    state.users.set(id, user);

    const token = `token-${id}`;
    // Pre-calculate sha256 of token to match route.ts authentication check
    sha256Hex(token).then(tokenHash => {
      state.sessions.set(id, {
        id: `sess-${id}`,
        user_id: id,
        token_hash: tokenHash,
        created_at: now,
        expires_at: now + 7 * 24 * 3600 * 1000,
        absolute_expires_at: now + 7 * 24 * 3600 * 1000,
        revoked_at: null
      });
    });
    return user;
  };

  const createCampaign = (id: string, name: string, ownerId: string) => {
    const camp = {
      id,
      name,
      status: 'active',
      owner_id: ownerId
    };
    state.campaigns.set(id, camp);
    return camp;
  };

  const addMember = (campaignId: string, userId: string, role: CampaignRole) => {
    state.campaignMembers.set(`${campaignId}:${userId}`, {
      campaign_id: campaignId,
      user_id: userId,
      role,
      status: 'active'
    });
  };

  const getAuthHeaders = (userId: string): Record<string, string> => {
    return {
      'Cookie': `__Host-zsession=token-${userId}`,
      'X-Requested-With': 'zorvania',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  };

  const request = async (
    pathWithQuery: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<Response> => {
    const method = (options.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {
      'Host': 'localhost:3000',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      headers['X-Requested-With'] = headers['X-Requested-With'] || 'zorvania';
    }

    const url = new URL(`http://localhost:3000${pathWithQuery.startsWith('/api') ? pathWithQuery : '/api' + pathWithQuery}`);

    const req = new Request(url.toString(), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });

    const env = {
      DB: db,
      IP_HASH_SALT: 'test-salt-secret',
      DM_EMAILS: 'admin@zorvania.ir'
    };

    return await (onRequest as any)({
      request: req,
      env,
      params: {},
      waitUntil: () => {},
      next: async () => new Response()
    });
  };

  return {
    dbState: state,
    db,
    createUser,
    createCampaign,
    addMember,
    getAuthHeaders,
    request
  };
}
