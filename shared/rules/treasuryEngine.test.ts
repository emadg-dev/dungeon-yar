import { describe, it, expect } from 'vitest';
import {
  canUserManageTreasury,
  validateItemTransfer,
  validateCurrencyUpdate,
  executeItemTransfer,
} from './treasuryEngine';
import { PartyItem, PartyCurrency, InventoryItem, TreasuryTransferRequest } from '../../src/types';

describe('treasuryEngine', () => {
  const samplePartyItem: PartyItem = {
    id: 'item-healing-potion',
    campaignId: 'camp-1',
    name: 'معجون شفا (Healing Potion)',
    quantity: 2,
    category: 'potion',
    description: 'بازگرداندن 2d4+2 جان',
    revision: 1,
    createdAt: 1000,
  };

  const sampleCurrency: PartyCurrency = {
    campaignId: 'camp-1',
    balances: { gold: 150, silver: 45, copper: 100 },
    revision: 3,
  };

  describe('acceptance criteria: Two players cannot take the same item simultaneously (revision / clear error)', () => {
    it('accepts transfer when revision matches', () => {
      const result = validateItemTransfer(samplePartyItem, 1, 1);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects with clear Persian concurrency error if revision is stale (simulated race condition)', () => {
      // Player 1 took the potion first, bumping revision from 1 to 2.
      // Player 2 attempts to take the potion with stale revision 1.
      const updatedItemAfterPlayer1: PartyItem = {
        ...samplePartyItem,
        quantity: 1,
        revision: 2,
      };

      const player2Attempt = validateItemTransfer(updatedItemAfterPlayer1, 1, 1);
      expect(player2Attempt.valid).toBe(false);
      expect(player2Attempt.error).toContain('خطای همزمانی');
      expect(player2Attempt.error).toContain('بازیکن دیگری برداشته یا ویرایش شده است');
    });

    it('simulates concurrent withdrawal attempt between two players', () => {
      let currentTreasuryItems: PartyItem[] = [{ ...samplePartyItem, quantity: 1, revision: 1 }];
      let player1Inv: InventoryItem[] = [];
      let player2Inv: InventoryItem[] = [];

      const transferReqP1: TreasuryTransferRequest = {
        itemId: 'item-healing-potion',
        quantity: 1,
        direction: 'to_inventory',
        participationId: 'part-p1',
        currentRevision: 1,
      };

      // Player 1 executes transfer first
      const p1Exec = executeItemTransfer(currentTreasuryItems, player1Inv, transferReqP1, 'part-p1');
      expect(p1Exec.success).toBe(true);
      expect(p1Exec.updatedCharacterInventory.length).toBe(1);
      expect(p1Exec.updatedPartyItems.length).toBe(0); // Potion was 1, taken completely

      // Update the shared treasury state
      currentTreasuryItems = p1Exec.updatedPartyItems;

      // Player 2 attempts transfer with the old state / item reference
      const transferReqP2: TreasuryTransferRequest = {
        itemId: 'item-healing-potion',
        quantity: 1,
        direction: 'to_inventory',
        participationId: 'part-p2',
        currentRevision: 1, // Stale revision!
      };

      const p2Exec = executeItemTransfer(currentTreasuryItems, player2Inv, transferReqP2, 'part-p2');
      expect(p2Exec.success).toBe(false);
      expect(p2Exec.error).toBeDefined();
    });
  });

  describe('quantity and inventory validation', () => {
    it('rejects withdrawal if requested quantity exceeds available stock', () => {
      const result = validateItemTransfer(samplePartyItem, 10, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('موجودی کافی نیست');
    });

    it('rejects withdrawal if quantity is zero or negative', () => {
      const result = validateItemTransfer(samplePartyItem, 0, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('بزرگتر از صفر');
    });
  });

  describe('currency concurrency and balance validation', () => {
    it('accepts currency update with matching revision', () => {
      const result = validateCurrencyUpdate(sampleCurrency, { gold: 200, silver: 50 }, 3);
      expect(result.valid).toBe(true);
    });

    it('rejects currency update with stale revision', () => {
      const result = validateCurrencyUpdate(sampleCurrency, { gold: 200 }, 2);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('خطای همزمانی');
    });

    it('rejects negative currency values', () => {
      const result = validateCurrencyUpdate(sampleCurrency, { gold: -50 }, 3);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('نامعتبر یا منفی');
    });
  });

  describe('treasury permissions and locked state', () => {
    it('allows DM full management even if treasury is locked', () => {
      const perms = canUserManageTreasury('owner', { treasuryLocked: true } as any);
      expect(perms.canView).toBe(true);
      expect(perms.canModify).toBe(true);
    });

    it('blocks players from modifying treasury if treasuryLocked is true', () => {
      const perms = canUserManageTreasury('player', { treasuryLocked: true } as any);
      expect(perms.canView).toBe(true);
      expect(perms.canModify).toBe(false);
      expect(perms.reason).toContain('قفل شده است');
    });

    it('allows players to modify treasury when treasuryLocked is false or unset', () => {
      const perms = canUserManageTreasury('player', { treasuryLocked: false } as any);
      expect(perms.canView).toBe(true);
      expect(perms.canModify).toBe(true);
    });
  });

  describe('deposit item transfer (to_treasury)', () => {
    it('transfers item from character inventory to treasury', () => {
      const partyItems: PartyItem[] = [];
      const charInv: InventoryItem[] = [
        {
          id: 'char-item-1',
          name: 'یاقوت درخشان',
          quantity: 3,
          category: 'misc',
          description: 'سنگ قیمتی با ارزش',
          weight: 0.5,
          isEquipped: false,
        },
      ];

      const req: TreasuryTransferRequest = {
        itemId: 'char-item-1',
        itemName: 'یاقوت درخشان',
        quantity: 2,
        direction: 'to_treasury',
        participationId: 'part-p1',
      };

      const result = executeItemTransfer(partyItems, charInv, req, 'part-p1');
      expect(result.success).toBe(true);
      expect(result.updatedCharacterInventory[0].quantity).toBe(1);
      expect(result.updatedPartyItems[0].name).toBe('یاقوت درخشان');
      expect(result.updatedPartyItems[0].quantity).toBe(2);
      expect(result.log.type).toBe('transfer_in');
    });
  });
});
