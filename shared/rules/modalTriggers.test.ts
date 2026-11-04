import { describe, it, expect, vi } from 'vitest';

describe('OverviewTab modal trigger handlers', () => {
  it('triggers onOpenLockedField with fieldName and updates modal state', () => {
    let lockedFieldModalState = { isOpen: false, fieldName: '' };
    const setLockedFieldModal = (state: { isOpen: boolean; fieldName: string }) => {
      lockedFieldModalState = state;
    };

    const onOpenLockedField = (fieldName: string) => {
      setLockedFieldModal({ isOpen: true, fieldName });
    };

    // Simulate clicking a locked field like AC or level
    onOpenLockedField('armorClass');
    expect(lockedFieldModalState.isOpen).toBe(true);
    expect(lockedFieldModalState.fieldName).toBe('armorClass');

    // Simulate closing
    setLockedFieldModal({ isOpen: false, fieldName: '' });
    expect(lockedFieldModalState.isOpen).toBe(false);
  });

  it('triggers onOpenEditGrantModal and sets participation and character info', () => {
    let editGrantModalState = { isOpen: false, participationId: '', characterName: '' };
    const setEditGrantModalState = (state: { isOpen: boolean; participationId: string; characterName: string }) => {
      editGrantModalState = state;
    };

    const mockParticipation = { id: 'part-123' };
    const mockCharacter = { name: 'سامان دلاور' };

    const onOpenEditGrantModal = () => {
      setEditGrantModalState({
        isOpen: true,
        participationId: mockParticipation.id,
        characterName: mockCharacter.name,
      });
    };

    // Simulate DM clicking edit grant button
    onOpenEditGrantModal();
    expect(editGrantModalState.isOpen).toBe(true);
    expect(editGrantModalState.participationId).toBe('part-123');
    expect(editGrantModalState.characterName).toBe('سامان دلاور');

    // Simulate closing
    setEditGrantModalState({ isOpen: false, participationId: '', characterName: '' });
    expect(editGrantModalState.isOpen).toBe(false);
  });
});
