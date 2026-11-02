/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  CampaignRole,
  PlatformRole,
  Action,
  PermissionContext,
  RoleBadgeInfo,
  can as checkPermission,
  getRoleLabelFa,
  CAMPAIGN_ROLE_BADGES
} from '../../shared/permissions';

export interface UsePermissionsResult {
  role: CampaignRole | null;
  platformRole: PlatformRole;
  can: (action: Action, context?: PermissionContext) => boolean;
  isOwner: boolean;
  isCoDm: boolean;
  isDm: boolean;
  isPlayer: boolean;
  isSpectator: boolean;
  roleBadge: RoleBadgeInfo | null;
  roleLabelFa: string;
  loading: boolean;
  refreshRole: () => Promise<void>;
}

export function usePermissions(campaignId?: string | null): UsePermissionsResult {
  const [role, setRole] = useState<CampaignRole | null>(null);
  const [platformRole, setPlatformRole] = useState<PlatformRole>('user');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRole = useCallback(async () => {
    try {
      setLoading(true);
      const auth = await api.getMe();
      if (auth?.user?.platformRole) {
        setPlatformRole(auth.user.platformRole);
      } else if (auth?.user?.role === 'dm') {
        setPlatformRole('admin');
      } else {
        setPlatformRole('user');
      }

      const activeCid = campaignId || api.getActiveCampaignId();
      if (!activeCid) {
        setRole(null);
        return;
      }

      const userRole = await api.getCampaignRole(activeCid);
      setRole(userRole);
    } catch {
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const canFn = useCallback(
    (action: Action, context?: PermissionContext) => {
      return checkPermission(role, action, {
        platformRole,
        ...context
      });
    },
    [role, platformRole]
  );

  const isOwner = role === 'owner';
  const isCoDm = role === 'co_dm';
  const isDm = isOwner || isCoDm;
  const isPlayer = role === 'player';
  const isSpectator = role === 'spectator';
  const roleBadge = role ? CAMPAIGN_ROLE_BADGES[role] : null;
  const roleLabelFa = getRoleLabelFa(role);

  return {
    role,
    platformRole,
    can: canFn,
    isOwner,
    isCoDm,
    isDm,
    isPlayer,
    isSpectator,
    roleBadge,
    roleLabelFa,
    loading,
    refreshRole: fetchRole
  };
}
