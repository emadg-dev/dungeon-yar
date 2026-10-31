/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PartyItem,
  PartyCurrency,
  TreasuryLogEntry,
  TreasuryTransferRequest,
  CampaignSettings,
  CampaignRole,
  InventoryItem,
} from '../../src/types';

/**
 * Checks if a user has permission to access or modify treasury resources.
 */
export function canUserManageTreasury(
  userRole?: boolean | CampaignRole | 'dm' | null,
  settings?: CampaignSettings | null
): {
  canView: boolean;
  canModify: boolean;
  reason?: string;
} {
  const isDm = typeof userRole === 'boolean'
    ? userRole
    : (userRole === 'owner' || userRole === 'co_dm' || userRole === 'dm');

  // DM can always view and modify
  if (isDm) {
    return { canView: true, canModify: true };
  }

  // Spectators can only view
  if (userRole === 'spectator') {
    return { canView: true, canModify: false, reason: 'تماشاچیان دسترسی ویرایش خزانه را ندارند.' };
  }

  // If campaign setting locks treasury for players
  if (settings?.treasuryLocked) {
    return { canView: true, canModify: false, reason: 'خزانه گروه توسط دانجن‌مستر قفل شده است.' };
  }

  return { canView: true, canModify: true };
}

/**
 * Validates an item withdrawal / transfer with strict revision checking to prevent race conditions.
 * Used for acceptance criteria: "Two players cannot take the same item simultaneously (revision / clear error)."
 */
export function validateItemTransfer(
  item: PartyItem | null | undefined,
  requestedQty: number,
  expectedRevision?: number
): {
  valid: boolean;
  error?: string;
} {
  if (!item) {
    return { valid: false, error: 'آیتم مورد نظر در خزانه یافت نشد.' };
  }

  if (expectedRevision !== undefined && item.revision !== expectedRevision) {
    return {
      valid: false,
      error: 'خطای همزمانی: این آیتم هم‌زمان توسط بازیکن دیگری برداشته یا ویرایش شده است. لطفاً صفحه را تازه‌سازی کنید.',
    };
  }

  if (requestedQty <= 0) {
    return { valid: false, error: 'تعداد باید عددی بزرگتر از صفر باشد.' };
  }

  if (item.quantity < requestedQty) {
    return { valid: false, error: `موجودی کافی نیست (موجودی فعلی: ${item.quantity}).` };
  }

  return { valid: true };
}

/**
 * Validates currency updates with revision concurrency check.
 */
export function validateCurrencyUpdate(
  current: PartyCurrency,
  newBalances: Record<string, number>,
  expectedRevision?: number
): {
  valid: boolean;
  error?: string;
} {
  if (expectedRevision !== undefined && current.revision !== expectedRevision) {
    return {
      valid: false,
      error: 'خطای همزمانی: موجودی سکه‌های خزانه هم‌زمان توسط کاربر دیگری تغییر یافته است.',
    };
  }

  for (const [key, val] of Object.entries(newBalances)) {
    if (typeof val !== 'number' || isNaN(val) || val < 0) {
      return { valid: false, error: `مقدار ارز ${key} نامعتبر یا منفی است.` };
    }
  }

  return { valid: true };
}

/**
 * Performs atomic transfer simulation between party items and a character's inventory array.
 */
export function executeItemTransfer(
  partyItems: PartyItem[],
  characterInventory: InventoryItem[],
  transfer: TreasuryTransferRequest,
  actorParticipationId?: string | null
): {
  success: boolean;
  error?: string;
  updatedPartyItems: PartyItem[];
  updatedCharacterInventory: InventoryItem[];
  log: TreasuryLogEntry;
} {
  const now = Date.now();
  const qty = Math.max(1, transfer.quantity || 1);

  if (transfer.direction === 'to_inventory') {
    // Player is taking an item from the treasury into their character sheet
    const existingIndex = partyItems.findIndex(i => i.id === transfer.itemId);
    if (existingIndex === -1) {
      return {
        success: false,
        error: 'آیتم در خزانه یافت نشد.',
        updatedPartyItems: partyItems,
        updatedCharacterInventory: characterInventory,
        log: null as any,
      };
    }

    const partyItem = partyItems[existingIndex];
    const validation = validateItemTransfer(partyItem, qty, transfer.currentRevision);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        updatedPartyItems: partyItems,
        updatedCharacterInventory: characterInventory,
        log: null as any,
      };
    }

    const updatedPartyItems = [...partyItems];
    if (partyItem.quantity === qty) {
      // Completely taken
      updatedPartyItems.splice(existingIndex, 1);
    } else {
      // Partially taken: decrement quantity and bump revision
      updatedPartyItems[existingIndex] = {
        ...partyItem,
        quantity: partyItem.quantity - qty,
        revision: partyItem.revision + 1,
        updatedAt: now,
      };
    }

    // Add to character inventory
    const charInv = [...characterInventory];
    const matchIndex = charInv.findIndex(
      ci => ci.name.trim().toLowerCase() === partyItem.name.trim().toLowerCase()
    );

    if (matchIndex >= 0) {
      charInv[matchIndex] = {
        ...charInv[matchIndex],
        quantity: charInv[matchIndex].quantity + qty,
      };
    } else {
      charInv.push({
        id: `inv-${now}-${Math.random().toString(36).substring(2, 6)}`,
        name: partyItem.name,
        quantity: qty,
        category: (partyItem.category as any) || 'misc',
        description: partyItem.description || '',
        weight: 1,
        isEquipped: false,
      });
    }

    const log: TreasuryLogEntry = {
      id: `tlog-${now}-${Math.random().toString(36).substring(2, 7)}`,
      campaignId: partyItem.campaignId,
      actorParticipationId: actorParticipationId || transfer.participationId,
      type: 'transfer_out',
      itemRef: partyItem.name,
      qty,
      note: transfer.note || `انتقال ${qty} عدد ${partyItem.name} از خزانه به کوله‌پشتی`,
      createdAt: now,
    };

    return {
      success: true,
      updatedPartyItems,
      updatedCharacterInventory: charInv,
      log,
    };
  } else {
    // Player is depositing an item from their character sheet into the treasury
    const charInv = [...characterInventory];
    const charItemIndex = charInv.findIndex(
      ci => (transfer.itemId && ci.id === transfer.itemId) || ci.name === transfer.itemName
    );

    if (charItemIndex === -1) {
      return {
        success: false,
        error: 'آیتم در کوله‌پشتی کاراکتر یافت نشد.',
        updatedPartyItems: partyItems,
        updatedCharacterInventory: characterInventory,
        log: null as any,
      };
    }

    const charItem = charInv[charItemIndex];
    if (charItem.quantity < qty) {
      return {
        success: false,
        error: `موجودی در کوله‌پشتی کافی نیست (موجودی: ${charItem.quantity}).`,
        updatedPartyItems: partyItems,
        updatedCharacterInventory: characterInventory,
        log: null as any,
      };
    }

    // Remove from character
    if (charItem.quantity === qty) {
      charInv.splice(charItemIndex, 1);
    } else {
      charInv[charItemIndex] = {
        ...charItem,
        quantity: charItem.quantity - qty,
      };
    }

    // Add to party items (or increment if matching name exists)
    const updatedPartyItems = [...partyItems];
    const partyMatchIdx = updatedPartyItems.findIndex(
      pi => pi.name.trim().toLowerCase() === charItem.name.trim().toLowerCase()
    );

    if (partyMatchIdx >= 0) {
      updatedPartyItems[partyMatchIdx] = {
        ...updatedPartyItems[partyMatchIdx],
        quantity: updatedPartyItems[partyMatchIdx].quantity + qty,
        revision: updatedPartyItems[partyMatchIdx].revision + 1,
        updatedAt: now,
      };
    } else {
      updatedPartyItems.push({
        id: `pitem-${now}-${Math.random().toString(36).substring(2, 7)}`,
        campaignId: charInv[0]?.id ? 'campaign' : '', // populated by caller
        name: charItem.name,
        quantity: qty,
        category: charItem.category || transfer.itemCategory || 'misc',
        description: charItem.description || transfer.itemDescription || '',
        notes: '',
        revision: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    const log: TreasuryLogEntry = {
      id: `tlog-${now}-${Math.random().toString(36).substring(2, 7)}`,
      campaignId: updatedPartyItems[0]?.campaignId || '',
      actorParticipationId: actorParticipationId || transfer.participationId,
      type: 'transfer_in',
      itemRef: charItem.name,
      qty,
      note: transfer.note || `انتقال ${qty} عدد ${charItem.name} از کوله‌پشتی به خزانه`,
      createdAt: now,
    };

    return {
      success: true,
      updatedPartyItems,
      updatedCharacterInventory: charInv,
      log,
    };
  }
}
