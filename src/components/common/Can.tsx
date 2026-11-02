/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Action, PermissionContext } from '../../../shared/permissions';

export interface CanProps {
  action: Action;
  campaignId?: string | null;
  context?: PermissionContext;
  children: React.ReactNode | ((allowed: boolean) => React.ReactNode);
  fallback?: React.ReactNode;
  mode?: 'hide' | 'disable';
  disabledTooltip?: string;
}

/**
 * Declarative RBAC permission wrapper.
 * Evaluates `can(role, action, context)`.
 * If allowed, renders children.
 * If forbidden:
 *  - 'hide' (default): renders fallback or nothing.
 *  - 'disable': renders children in a disabled, styled container with Persian tooltip.
 */
export const Can: React.FC<CanProps> = ({
  action,
  campaignId,
  context,
  children,
  fallback = null,
  mode = 'hide',
  disabledTooltip = 'شما مجوز انجام این عملیات را در این کمپین ندارید.'
}) => {
  const { can, loading } = usePermissions(campaignId);

  if (loading) {
    return null;
  }

  const allowed = can(action, context);

  if (typeof children === 'function') {
    return <>{children(allowed)}</>;
  }

  if (allowed) {
    return <>{children}</>;
  }

  if (mode === 'disable') {
    return (
      <div
        className="opacity-50 pointer-events-none cursor-not-allowed select-none relative group inline-flex"
        title={disabledTooltip}
        aria-disabled="true"
      >
        {children}
      </div>
    );
  }

  return <>{fallback}</>;
};
