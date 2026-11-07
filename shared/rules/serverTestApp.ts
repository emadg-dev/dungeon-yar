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

          return { results: [] };
        },
        async run(): Promise<{ success: boolean }> {
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

          return { success: true };
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
    campaignCalendar: new Map()
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
    campaignCalendar: new Map()
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
