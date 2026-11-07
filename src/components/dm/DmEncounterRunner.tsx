import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Character, NPC, LocationEntry, LiveEncounter, 
  EncounterParticipant, EncounterSettings, EncounterEvent, ParticipantVisibility 
} from '../../types';
import { api } from '../../services/api';
import { BottomSheet } from '../mobile/BottomSheet';
import { Chip } from '../common/Chip';
import { 
  Swords, Shield, Heart, Plus, Trash2, Play, Pause, 
  RotateCcw, Save, ArrowRight, ArrowLeft, Dices, ChevronRight, 
  CheckCircle2, Eye, EyeOff, AlertTriangle, Users, Copy, 
  MoreVertical, Sparkles, Award, Lock, MapPin, X, MessageSquarePlus, Map as MapIcon,
  ChevronLeft, MoreHorizontal, Calculator
} from 'lucide-react';
import { DmHandoutManager } from './DmHandoutManager';

interface DmEncounterRunnerProps {
  characters: Character[];
  npcs: NPC[];
  locations: LocationEntry[];
  savedEncounters?: any[];
  onSaveEncounter?: (enc: any) => void;
  onRollDice: (sides: number, count: number, modifier: number, label: string) => void;
  onCreateLocation?: (loc: Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
}

// ---------------------------------------------------------
// Shared layout helpers
// Type scale used across this screen: 12 (meta) / 14 (controls, labels) / 16 (names) / 18 (key numbers)
// Radii: 14 = cards, 10-12 = controls, full = pills
// ---------------------------------------------------------

const STATUS_META: Record<string, { label: string; pill: string; text: string }> = {
  active: { label: 'در حال اجرا', pill: 'bg-success/15 text-success border border-success/30', text: 'text-success' },
  paused: { label: 'متوقف‌شده', pill: 'bg-accent/15 text-accent border border-accent/30', text: 'text-accent' },
  ended: { label: 'پایان‌یافته', pill: 'bg-surface-2 text-text-muted border border-border', text: 'text-text-muted' },
  draft: { label: 'پیش‌نویس', pill: 'bg-surface-2 text-text-primary border border-border', text: 'text-text-muted' }
};

const VISIBILITY_META: Record<ParticipantVisibility, { label: string; hint: string; tone: string }> = {
  revealed: { label: 'آشکار', hint: 'نام و آمار برای بازیکنان نمایش داده می‌شود', tone: 'text-success' },
  announced: { label: 'ناشناخته', hint: 'بازیکنان فقط «موجود ناشناخته» را می‌بینند', tone: 'text-accent' },
  hidden: { label: 'مخفی', hint: 'بازیکنان این موجود را نمی‌بینند', tone: 'text-danger-hover' }
};

const VISIBILITY_ICON: Record<ParticipantVisibility, typeof Eye> = {
  revealed: Eye,
  announced: Shield,
  hidden: EyeOff
};

const kindLabel = (kind: string) =>
  kind === 'character' ? 'شخصیت' : kind === 'monster' ? 'هیولا' : 'NPC';

const SETTING_ROWS = [
  { key: 'showExactHp', label: 'نمایش HP دقیق هیولاها' },
  { key: 'showAc', label: 'نمایش AC هیولاها' },
  { key: 'showConditions', label: 'نمایش وضعیت‌ها (مثل مسموم یا گیج)' },
  { key: 'playerInitiativeRolls', label: 'بازیکنان ابتکار عمل خود را پرتاب کنند' }
] as const;

/** A full-width, thumb-sized action row used inside bottom sheets. */
const SheetAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  tone?: 'default' | 'danger';
}> = ({ icon, label, hint, onClick, tone = 'default' }) => (
  <Button
    type="button"
    onClick={onClick}
    className={`w-full min-h-[52px] px-3 py-2 rounded-[12px] border flex items-center gap-3 text-start transition touch-target ${
      tone === 'danger'
        ? 'bg-danger/10 border-danger/30 text-danger-hover hover:bg-danger/20'
        : 'bg-surface border-border text-text-primary hover:bg-surface-2'
    }`}
  >
    <span className="shrink-0">{icon}</span>
    <span className="min-w-0">
      <span className="block text-sm font-bold">{label}</span>
      {hint && <span className="block text-xs text-text-muted font-normal mt-0.5">{hint}</span>}
    </span>
  </Button>
);

/** Label on the start side, checkbox on the end side, whole row is the tap target. */
const ToggleRow: React.FC<{
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, hint, checked, onChange }) => (
  <label className="flex w-full items-center justify-between gap-3 min-h-[48px] px-3 py-2 rounded-[10px] bg-surface border border-border cursor-pointer">
    <span className="flex-1 min-w-80">
      <span className="block text-sm text-text-primary break-words">
        {label}
      </span>
      {hint && (
        <span className="block text-xs text-text-muted mt-0.5">
          {hint}
        </span>
      )}
    </span>

    <Input
      noWrapper
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-5 h-5 accent-accent"
    />
  </label>
);

/** Initiative entry with an explicit confirm button (Enter alone is unreliable on mobile keypads). */
const InitiativeEntry: React.FC<{ onSubmit: (value: number) => void; onRoll: () => void }> = ({ onSubmit, onRoll }) => {
  const [value, setValue] = useState('');

  const submit = () => {
    const n = parseInt(value, 10);
    if (isNaN(n)) return;
    onSubmit(n);
    setValue('');
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={onRoll}
        className="h-11 px-3 rounded-[10px] bg-surface-2 text-accent border border-border text-sm font-bold flex items-center gap-1.5 touch-target shrink-0"
      >
        <Dices className="w-4 h-4" />
        <span>پرتاب 1d20</span>
      </Button>
      <span className="text-xs text-text-muted">یا</span>
      <Input noWrapper
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        placeholder="عدد"
        className="w-16 h-11 bg-bg text-text-primary text-center text-sm rounded-[10px] border border-border focus:border-accent focus:outline-none"
      />
      <Button
        type="button"
        onClick={submit}
        disabled={value === ''}
        className="h-11 px-4 rounded-[10px] bg-accent text-on-accent text-sm font-bold disabled:opacity-40 touch-target shrink-0"
      >
        ثبت
      </Button>
    </div>
  );
};

export const DmEncounterRunner: React.FC<DmEncounterRunnerProps> = ({
  characters,
  npcs,
  locations,
  onRollDice
}) => {
  // Encounters List vs Active Encounter
  const [encounters, setEncounters] = useState<LiveEncounter[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [currentEncounter, setCurrentEncounter] = useState<LiveEncounter | null>(null);
  const [listTab, setListTab] = useState<'draft' | 'active' | 'ended'>('active');

  // Modals & Bottom Sheets
  const [newEncounterSheet, setNewEncounterSheet] = useState(false);
  const [addMonstersSheet, setAddMonstersSheet] = useState(false);
  const [keypadTarget, setKeypadTarget] = useState<EncounterParticipant | null>(null);
  const [keypadAmount, setKeypadAmount] = useState('');
  const [conditionTarget, setConditionTarget] = useState<EncounterParticipant | null>(null);
  const [endLootSheet, setEndLootSheet] = useState(false);
  const [customEventSheet, setCustomEventSheet] = useState(false);
  const [customEventText, setCustomEventText] = useState('');
  const [activeMenuParticipantId, setActiveMenuParticipantId] = useState<string | null>(null);
  const [handoutsSheet, setHandoutsSheet] = useState(false);
  const [toolsSheet, setToolsSheet] = useState(false);

  // New Encounter Form State
  const [newEncForm, setNewEncForm] = useState({
    name: 'نبرد جدید',
    locationId: '',
    sessionTag: 'جلسه 1',
    dmNotes: '',
    settings: {
      showExactHp: false,
      showAc: false,
      showConditions: true,
      showDefeated: true,
      playerInitiativeRolls: true
    }
  });

  // Add Monsters Form State
  const [addMonsterSubTab, setAddMonsterSubTab] = useState<'library' | 'custom' | 'party'>('library');
  const [monsterSearch, setMonsterSearch] = useState('');
  const [selectedNpcId, setSelectedNpcId] = useState('');
  const [monsterQuantity, setMonsterQuantity] = useState(1);
  const [isMinionGroup, setIsMinionGroup] = useState(false);
  const [monsterHpMode, setMonsterHpMode] = useState<'default' | 'roll'>('default');
  const [monsterVisibility, setMonsterVisibility] = useState<ParticipantVisibility>('revealed');
  const [monsterInitiative, setMonsterInitiative] = useState<string>('');
  const [announceReinforcements, setAnnounceReinforcements] = useState(false);
  const [announcementText, setAnnouncementText] = useState('نیروهای کمکی از راه رسیدند!');

  // Quick custom monster state
  const [customMonster, setCustomMonster] = useState({
    name: 'مهاجم ناشناس',
    hp: 25,
    ac: '13',
    initiative: ''
  });

  // Selected party members state
  const [selectedPartyCharIds, setSelectedPartyCharIds] = useState<string[]>([]);

  // Loot distribution state
  const [proposedLoot, setProposedLoot] = useState<{ id: string; name: string; category: string; description: string; sourceNpc: string }[]>([]);
  const [selectedLootRecipients, setSelectedLootRecipients] = useState<Record<string, string>>({}); // lootId -> characterId

  // Available condition tags
  const availableConditions = [
    'بیهوش (Unconscious)',
    'گیج (Stunned)',
    'ریشه‌پیچ (Restrained)',
    'زمین‌خورده (Prone)',
    'مسموم (Poisoned)',
    'کور (Blinded)',
    'ترسیده (Frightened)',
    'فلج (Paralyzed)',
    'مهارشده با فره (Stabilized)'
  ];

  // Mark in-encounter on document.body so BottomNav is hidden and doesn't overlap sticky encounter controls
  useEffect(() => {
    if (selectedEncounterId && currentEncounter) {
      document.body.classList.add('in-encounter');
      return () => {
        document.body.classList.remove('in-encounter');
      };
    }
  }, [selectedEncounterId, currentEncounter]);

  // Load live encounters list
  const loadEncounters = useCallback(async () => {
    try {
      const list = await api.listLiveEncounters();
      setEncounters(list);

      // If an encounter is active, automatically select it if none selected
      if (!selectedEncounterId) {
        const active = list.find(e => e.status === 'active' || e.status === 'paused');
        if (active) {
          setSelectedEncounterId(active.id);
        }
      }
    } catch (e) {
      console.error('Error loading encounters:', e);
    }
  }, [selectedEncounterId]);

  // Load full details for selected encounter
  const loadSelectedEncounter = useCallback(async (encId: string) => {
    try {
      const enc = await api.getLiveEncounter(encId);
      if (enc) {
        setCurrentEncounter(enc);
      }
    } catch (e) {
      console.error('Error loading encounter details:', e);
    }
  }, []);

  useEffect(() => {
    loadEncounters();
  }, [loadEncounters]);

  useEffect(() => {
    if (selectedEncounterId) {
      loadSelectedEncounter(selectedEncounterId);
    } else {
      setCurrentEncounter(null);
    }
  }, [selectedEncounterId, loadSelectedEncounter]);

  // Subscribe to live updates via LiveChannel
  useEffect(() => {
    const unsubscribe = api.liveChannel.subscribe(selectedEncounterId, (update) => {
      loadEncounters();
      if (selectedEncounterId && update.activeEncounterId === selectedEncounterId) {
        loadSelectedEncounter(selectedEncounterId);
      } else if (selectedEncounterId) {
        loadSelectedEncounter(selectedEncounterId);
      }
    });

    return () => unsubscribe();
  }, [selectedEncounterId, loadEncounters, loadSelectedEncounter]);

  // --- Actions ---

  // 1. Create Encounter
  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEncForm.name.trim()) return;

    try {
      const created = await api.createLiveEncounter({
        name: newEncForm.name.trim(),
        locationId: newEncForm.locationId || null,
        sessionTag: newEncForm.sessionTag,
        dmNotes: newEncForm.dmNotes,
        settings: newEncForm.settings
      });

      setNewEncounterSheet(false);
      await loadEncounters();
      setSelectedEncounterId(created.id);
    } catch (err: any) {
      alert(err.message || 'خطا در ایجاد مبارزه.');
    }
  };

  // 2. Start Encounter
  const handleStartEncounter = async (withSurprise = false) => {
    if (!currentEncounter) return;
    try {
      await api.startLiveEncounter(currentEncounter.id, withSurprise);
      await loadSelectedEncounter(currentEncounter.id);
      await loadEncounters();
    } catch (err: any) {
      alert(err.message || 'خطا در شروع مبارزه.');
    }
  };

  // 3. Pause / Resume
  const handleTogglePause = async () => {
    if (!currentEncounter) return;
    try {
      if (currentEncounter.status === 'paused') {
        await api.resumeLiveEncounter(currentEncounter.id);
      } else {
        await api.pauseLiveEncounter(currentEncounter.id);
      }
      await loadSelectedEncounter(currentEncounter.id);
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت.');
    }
  };

  // 4. Turn Control
  const handleNextTurn = async () => {
    if (!currentEncounter) return;
    try {
      await api.nextEncounterTurn(currentEncounter.id);
      await loadSelectedEncounter(currentEncounter.id);
    } catch (err: any) {
      alert(err.message || 'خطا در عبور به نوبت بعد.');
    }
  };

  const handlePrevTurn = async () => {
    if (!currentEncounter) return;
    try {
      await api.prevEncounterTurn(currentEncounter.id);
      await loadSelectedEncounter(currentEncounter.id);
    } catch (err: any) {
      alert(err.message || 'خطا در بازگشت به نوبت قبل.');
    }
  };

  // 5. Visibility — chosen explicitly from the actions sheet (no blind one-tap cycling,
  //    so a hidden monster can't be revealed to players by a stray tap)
  const handleSetVisibility = async (p: EncounterParticipant, visibility: ParticipantVisibility) => {
    if (!currentEncounter || p.visibility === visibility) return;
    try {
      await api.updateEncounterParticipant(currentEncounter.id, p.id, { visibility });
      await loadSelectedEncounter(currentEncounter.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 5b. Quick ±HP from the card
  const handleQuickHp = async (p: EncounterParticipant, delta: number) => {
    if (!currentEncounter) return;
    const next = Math.max(0, Math.min(p.maxHp, p.hp + delta));
    const status = next === 0 ? 'defeated' : p.status === 'defeated' ? 'active' : p.status;
    try {
      await api.updateEncounterParticipant(currentEncounter.id, p.id, { hp: next, status });
      await loadSelectedEncounter(currentEncounter.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 5c. Defeated / revive
  const handleToggleDefeated = async (p: EncounterParticipant) => {
    if (!currentEncounter) return;
    const next = p.status === 'defeated' ? 'active' : 'defeated';
    try {
      await api.updateEncounterParticipant(currentEncounter.id, p.id, { status: next });
      setActiveMenuParticipantId(null);
      await loadSelectedEncounter(currentEncounter.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 5d. Boss phase
  const handleChangePhase = async (p: EncounterParticipant) => {
    if (!currentEncounter) return;
    const phaseInput = prompt('نام فاز جدید (مثال: فاز 2 - شعله‌های سرخ):', p.phase || '');
    if (phaseInput === null) return;
    try {
      await api.updateEncounterParticipant(currentEncounter.id, p.id, { phase: phaseInput.trim() || null });
      setActiveMenuParticipantId(null);
      await loadSelectedEncounter(currentEncounter.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 5e. Remove participant
  const handleDeleteParticipant = async (p: EncounterParticipant) => {
    if (!currentEncounter) return;
    if (!confirm(`حذف ${p.instanceName} از مبارزه؟`)) return;
    try {
      await api.deleteEncounterParticipant(currentEncounter.id, p.id);
      setActiveMenuParticipantId(null);
      await loadSelectedEncounter(currentEncounter.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 6. Confirm Player Pending Initiative
  const handleConfirmInitiative = async (p: EncounterParticipant, customVal?: number) => {
    if (!currentEncounter) return;
    const val = customVal !== undefined ? customVal : (p.initiative ?? 10);
    try {
      await api.updateEncounterParticipant(currentEncounter.id, p.id, {
        initiative: val,
        initiativeStatus: 'set'
      });
      await loadSelectedEncounter(currentEncounter.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 7. Add Monsters / Reinforcements
  const handleAddMonsters = async () => {
    if (!currentEncounter) return;

    const newParticipants: any[] = [];
    const groupId = isMinionGroup ? `group-${Date.now()}` : null;

    if (addMonsterSubTab === 'library') {
      const template = npcs.find(n => n.id === selectedNpcId);
      if (!template) return;

      for (let i = 1; i <= monsterQuantity; i++) {
        const instanceName = monsterQuantity > 1 ? `${template.name} ${i}` : template.name;
        let hp = template.hp.max;
        if (monsterHpMode === 'roll') {
          hp = Math.max(1, template.hp.max + Math.floor(Math.random() * 7) - 3);
        }

        const initVal = monsterInitiative !== '' ? parseInt(monsterInitiative, 10) : null;

        newParticipants.push({
          kind: 'monster',
          npcTemplateId: template.id,
          instanceName,
          displayNameForPlayers: monsterVisibility === 'announced' ? 'موجود ناشناخته' : instanceName,
          maxHp: hp,
          hp,
          ac: template.ac,
          conditions: [],
          initiative: initVal,
          initiativeStatus: initVal !== null ? 'set' : 'none',
          visibility: monsterVisibility,
          status: 'active',
          groupId,
          notes: template.tacticsTips || ''
        });
      }
    } else if (addMonsterSubTab === 'custom') {
      if (!customMonster.name.trim()) return;
      const initVal = customMonster.initiative !== '' ? parseInt(customMonster.initiative, 10) : null;
      newParticipants.push({
        kind: 'npc',
        instanceName: customMonster.name.trim(),
        displayNameForPlayers: customMonster.name.trim(),
        maxHp: Number(customMonster.hp),
        hp: Number(customMonster.hp),
        ac: customMonster.ac,
        conditions: [],
        initiative: initVal,
        initiativeStatus: initVal !== null ? 'set' : 'none',
        visibility: 'revealed',
        status: 'active'
      });
    } else if (addMonsterSubTab === 'party') {
      const charsToAdd = characters.filter(c => selectedPartyCharIds.includes(c.id));
      for (const c of charsToAdd) {
        newParticipants.push({
          kind: 'character',
          characterId: c.id,
          instanceName: c.name,
          displayNameForPlayers: c.name,
          maxHp: c.hp.max,
          hp: c.hp.current,
          ac: `${c.ac}`,
          conditions: [],
          initiative: null,
          initiativeStatus: 'none',
          visibility: 'revealed',
          status: 'active',
          notes: c.className
        });
      }
    }

    if (newParticipants.length === 0) return;

    try {
      await api.addEncounterParticipants(
        currentEncounter.id,
        newParticipants,
        announceReinforcements && addMonsterSubTab !== 'party',
        announcementText
      );
      setAddMonstersSheet(false);
      await loadSelectedEncounter(currentEncounter.id);
    } catch (err: any) {
      alert(err.message || 'خطا در افزودن شرکت‌کنندگان.');
    }
  };

  // 8. Keypad Damage / Heal
  const handleApplyKeypad = async (isHealing = false) => {
    if (!currentEncounter || !keypadTarget) return;
    const amt = parseInt(keypadAmount, 10) || 0;
    if (amt <= 0) return;

    const delta = isHealing ? amt : -amt;

    // If target belongs to a minion group, distribute damage across all active group members!
    if (keypadTarget.groupId && !isHealing) {
      const groupMembers = (currentEncounter.participants || []).filter(
        p => p.groupId === keypadTarget.groupId && p.status === 'active'
      );
      const perMember = Math.max(1, Math.floor(amt / (groupMembers.length || 1)));

      for (const m of groupMembers) {
        const nextHp = Math.max(0, m.hp - perMember);
        const nextStatus = nextHp === 0 ? 'defeated' : 'active';
        await api.updateEncounterParticipant(currentEncounter.id, m.id, {
          hp: nextHp,
          status: nextStatus
        });
      }
    } else {
      const nextHp = Math.max(0, Math.min(keypadTarget.maxHp, keypadTarget.hp + delta));
      const nextStatus = nextHp === 0 ? 'defeated' : keypadTarget.status === 'defeated' && nextHp > 0 ? 'active' : keypadTarget.status;

      await api.updateEncounterParticipant(currentEncounter.id, keypadTarget.id, {
        hp: nextHp,
        status: nextStatus
      });
    }

    setKeypadTarget(null);
    setKeypadAmount('');
    await loadSelectedEncounter(currentEncounter.id);
  };

  // 9. Quick Condition Toggle
  const handleToggleCondition = async (p: EncounterParticipant, conditionName: string) => {
    if (!currentEncounter) return;
    const exists = p.conditions?.includes(conditionName);
    const nextConditions = exists
      ? p.conditions.filter(c => c !== conditionName)
      : [...(p.conditions || []), conditionName];

    try {
      await api.updateEncounterParticipant(currentEncounter.id, p.id, { conditions: nextConditions });
      await loadSelectedEncounter(currentEncounter.id);
      setConditionTarget(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 10. Duplicate Participant
  const handleDuplicateParticipant = async (p: EncounterParticipant) => {
    if (!currentEncounter) return;
    const duplicateData = [{
      ...p,
      instanceName: `${p.instanceName} (رونوشت)`,
      displayNameForPlayers: p.displayNameForPlayers ? `${p.displayNameForPlayers} (رونوشت)` : null,
      id: undefined,
      createdAt: undefined
    }];
    try {
      await api.addEncounterParticipants(currentEncounter.id, duplicateData);
      setActiveMenuParticipantId(null);
      await loadSelectedEncounter(currentEncounter.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 11. End Encounter & Propose Loot
  const handleOpenEndLoot = () => {
    if (!currentEncounter) return;

    // Collect defeated NPC templates' loot drops
    const defeated = (currentEncounter.participants || []).filter(p => p.status === 'defeated' && p.npcTemplateId);
    const proposed: { id: string; name: string; category: string; description: string; sourceNpc: string }[] = [];

    for (const d of defeated) {
      const template = npcs.find(n => n.id === d.npcTemplateId);
      if (template?.lootDrops) {
        const drops = template.lootDrops.split('\n').filter(Boolean);
        drops.forEach((drop, idx) => {
          proposed.push({
            id: `loot-${d.id}-${idx}`,
            name: drop.replace(/^[•\-\*]\s*/, '').trim(),
            category: 'loot',
            description: `به‌دست‌آمده از غلبه بر ${template.name}`,
            sourceNpc: template.name
          });
        });
      }
    }

    setProposedLoot(proposed);
    setEndLootSheet(true);
  };

  const handleFinishEndAndDistribute = async () => {
    if (!currentEncounter) return;

    try {
      // Distribute assigned loot
      for (const loot of proposedLoot) {
        const charId = selectedLootRecipients[loot.id];
        if (charId) {
          await api.distributeEncounterLoot(currentEncounter.id, charId, loot);
        }
      }

      await api.endLiveEncounter(currentEncounter.id);
      setEndLootSheet(false);
      await loadSelectedEncounter(currentEncounter.id);
      await loadEncounters();
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت پایان مبارزه.');
    }
  };

  // 12. Duplicate Encounter as New (§2.7)
  const handleDuplicateEncounter = async (enc: LiveEncounter) => {
    try {
      const duplicated = await api.createLiveEncounter({
        name: `${enc.name} (نسخه جدید)`,
        locationId: enc.locationId,
        sessionTag: enc.sessionTag,
        dmNotes: enc.dmNotes,
        settings: enc.settings
      });

      // Add reset participants
      if (enc.participants && enc.participants.length > 0) {
        const clonedParticipants = enc.participants.map(p => ({
          ...p,
          id: undefined,
          hp: p.maxHp,
          status: 'active',
          initiative: null,
          initiativeStatus: 'none',
          conditions: []
        }));
        await api.addEncounterParticipants(duplicated.id, clonedParticipants);
      }

      await loadEncounters();
      setSelectedEncounterId(duplicated.id);
    } catch (err: any) {
      alert(err.message || 'خطا در تکثیر نبرد.');
    }
  };

  // ---------------------------------------------------------
  // Render: If No Selected Encounter -> Encounters List
  // ---------------------------------------------------------
  if (!currentEncounter || !selectedEncounterId) {
    const filteredEncounters = encounters.filter(e => {
      if (listTab === 'draft') return e.status === 'draft';
      if (listTab === 'active') return e.status === 'active' || e.status === 'paused';
      if (listTab === 'ended') return e.status === 'ended';
      return true;
    });

    // Group encounters by location (§2.7)
    const groupedByLocation: Record<string, LiveEncounter[]> = {};
    filteredEncounters.forEach(e => {
      const locKey = e.location?.name || locations.find(l => l.id === e.locationId)?.name || 'بدون مکان مشخص';
      if (!groupedByLocation[locKey]) groupedByLocation[locKey] = [];
      groupedByLocation[locKey].push(e);
    });

    const listTabs: { id: 'active' | 'draft' | 'ended'; label: string; count: number }[] = [
      { id: 'active', label: 'در حال نبرد', count: encounters.filter(e => e.status === 'active' || e.status === 'paused').length },
      { id: 'draft', label: 'پیش‌نویس', count: encounters.filter(e => e.status === 'draft').length },
      { id: 'ended', label: 'پایان‌یافته', count: encounters.filter(e => e.status === 'ended').length }
    ];

    const emptyText: Record<typeof listTab, string> = {
      active: 'نبرد فعالی وجود ندارد.',
      draft: 'پیش‌نویسی وجود ندارد.',
      ended: 'هنوز نبردی به پایان نرسیده است.'
    };

    return (
      <div className="space-y-5" dir="rtl">
        {/* Page header: one title, one primary action */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-text-primary">مدیریت مبارزات کمپین</h2>

          <Button
            type="button"
            onClick={() => setNewEncounterSheet(true)}
            className="bg-accent text-on-accent font-extrabold px-4 h-11 rounded-[12px] flex items-center gap-1.5 hover:bg-accent-hover transition shadow-md touch-target shrink-0 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>نبرد جدید</span>
          </Button>
        </div>

        {/* Status filter (Active / Draft / Ended) */}
        <div role="tablist" className="surface-card rounded-[12px] p-1 border border-border grid grid-cols-3 gap-1">
          {listTabs.map(t => (
            <Button
              type="button"
              key={t.id}
              role="tab"
              aria-selected={listTab === t.id}
              onClick={() => setListTab(t.id)}
              className={`h-10 rounded-[8px] text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                listTab === t.id
                  ? 'bg-accent text-on-accent'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <span>{t.label}</span>
              <span className="text-xs tabular-nums opacity-80">{t.count}</span>
            </Button>
          ))}
        </div>

        {/* Encounters grouped by location */}
        {Object.keys(groupedByLocation).length === 0 ? (
          <div className="p-8 text-center surface-card rounded-[14px] border border-border space-y-3">
            <Swords className="w-10 h-10 text-text-muted mx-auto opacity-50" />
            <p className="text-sm text-text-muted">{emptyText[listTab]}</p>
            {listTab !== 'ended' && (
              <Button
                type="button"
                onClick={() => setNewEncounterSheet(true)}
                className="h-11 px-4 rounded-[10px] bg-accent text-on-accent text-sm font-bold inline-flex items-center gap-1.5 touch-target"
              >
                <Plus className="w-4 h-4" />
                <span>ساخت نبرد جدید</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedByLocation).map(([locName, groupList]) => (
              <section key={locName} className="space-y-2.5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-muted px-1">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>{locName}</span>
                  <span className="text-xs font-normal">({groupList.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupList.map(enc => {
                    const sm = STATUS_META[enc.status] ?? STATUS_META.draft;
                    return (
                      <div
                        key={enc.id}
                        className="surface-card rounded-[14px] p-4 border border-border hover:border-accent/40 transition space-y-3"
                      >
                        {/* Title + status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-base text-text-primary truncate">{enc.name}</h4>
                            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted">
                              {enc.sessionTag && <span>{enc.sessionTag}</span>}
                              <span>دور {enc.round || 0}</span>
                              <span>{enc.participants?.length || 0} شرکت‌کننده</span>
                            </p>
                          </div>

                          <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${sm.pill}`}>
                            {sm.label}
                          </span>
                        </div>

                        {/* Participant preview */}
                        {(enc.participants?.length || 0) > 0 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            {(enc.participants || []).slice(0, 5).map((p, idx) => (
                              <span
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-[8px] shrink-0 ${
                                  p.kind === 'character' ? 'bg-success/15 text-success' : 'bg-surface text-text-primary border border-border'
                                }`}
                              >
                                {p.instanceName}
                              </span>
                            ))}
                            {(enc.participants?.length || 0) > 5 && (
                              <span className="text-xs text-text-muted shrink-0">+{enc.participants.length - 5}</span>
                            )}
                          </div>
                        )}

                        {/* Actions: primary on the forward side, secondary demoted */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                          <Button
                            type="button"
                            onClick={() => handleDuplicateEncounter(enc)}
                            className="h-10 px-2 rounded-[8px] text-text-muted hover:text-text-primary flex items-center gap-1.5 text-sm touch-target"
                            title="ساخت نبرد جدید از روی این نبرد"
                          >
                            <Copy className="w-4 h-4" />
                            <span>تکثیر</span>
                          </Button>

                          <Button
                            type="button"
                            onClick={() => setSelectedEncounterId(enc.id)}
                            className="h-10 bg-accent text-on-accent font-extrabold px-4 rounded-[10px] flex items-center gap-1.5 hover:bg-accent-hover transition text-sm touch-target"
                          >
                            <span>باز کردن نبرد</span>
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* New Encounter Sheet */}
        <BottomSheet
          isOpen={newEncounterSheet}
          onClose={() => setNewEncounterSheet(false)}
          title="ایجاد مبارزه جدید"
        >
          <form onSubmit={handleCreateEncounter} className="space-y-4 pb-2" dir="rtl">
            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">نام نبرد</span>
              <Input noWrapper
                type="text"
                required
                value={newEncForm.name}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: شبیخون در بیشه بلورین"
                className="w-full h-11 bg-surface text-text-primary px-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">
                مکان <span className="font-normal text-text-muted">(اختیاری)</span>
              </span>
              <Select noWrapper
                value={newEncForm.locationId}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, locationId: e.target.value }))}
                className="w-full h-11 bg-surface text-text-primary px-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
              >
                <option value="">بدون مکان پیوندخورده</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.region})
                  </option>
                ))}
              </Select>
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">
                برچسب جلسه <span className="font-normal text-text-muted">(اختیاری)</span>
              </span>
              <Input noWrapper
                type="text"
                value={newEncForm.sessionTag}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, sessionTag: e.target.value }))}
                placeholder="مثال: جلسه 4"
                className="w-full h-11 bg-surface text-text-primary px-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-1.5">
                یادداشت مستر <span className="font-normal text-text-muted">(فقط برای شما)</span>
              </span>
              <Textarea noWrapper
                rows={2}
                value={newEncForm.dmNotes}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, dmNotes: e.target.value }))}
                placeholder="رویدادهای محیطی در دور 3، نقاط ضعف یا تاکتیک‌ها..."
                className="w-full bg-surface text-text-primary p-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
              />
            </label>

            {/* What players can see / do */}
            <fieldset className="space-y-2 min-w-0 border-0 p-0 mb-5">
              <legend className="text-sm font-bold text-text-primary mb-2">تنظیمات بازیکنان</legend>
              {SETTING_ROWS.map(row => (
                <ToggleRow
                  key={row.key}
                  label={row.label}
                  checked={newEncForm.settings[row.key]}
                  onChange={(checked) => setNewEncForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, [row.key]: checked }
                  }))}
                />
              ))}
            </fieldset>

            <Button
              type="submit"
              className="w-full h-12 rounded-[12px] bg-accent text-on-accent font-extrabold text-sm hover:bg-accent-hover transition shadow-md touch-target"
            >
              ایجاد نبرد و ورود
            </Button>
          </form>
        </BottomSheet>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Render: Active Encounter Runner
  // ---------------------------------------------------------
  const sortedParticipants = [...(currentEncounter.participants || [])].sort((a, b) => {
    if (a.initiative === null && b.initiative === null) return a.sortIndex - b.sortIndex;
    if (a.initiative === null) return 1;
    if (b.initiative === null) return -1;
    return (b.initiative ?? 0) - (a.initiative ?? 0) || a.sortIndex - b.sortIndex;
  });

  const unplacedParticipants = (currentEncounter.participants || []).filter(
    p => p.initiative === null || p.initiativeStatus === 'none'
  );

  const placedParticipants = sortedParticipants.filter(
    p => p.initiative !== null && p.initiativeStatus !== 'none'
  );

  const currentActiveParticipant = (currentEncounter.participants || []).find(
    p => p.id === currentEncounter.currentParticipantId
  );

  const locationEntry = currentEncounter.location || locations.find(l => l.id === currentEncounter.locationId);

  const isDraft = currentEncounter.status === 'draft';
  const isLive = currentEncounter.status === 'active' || currentEncounter.status === 'paused';
  const isEnded = currentEncounter.status === 'ended';
  const statusMeta = STATUS_META[currentEncounter.status] ?? STATUS_META.draft;
  const hasParticipants = (currentEncounter.participants || []).length > 0;

  const menuParticipant = activeMenuParticipantId
    ? (currentEncounter.participants || []).find(p => p.id === activeMenuParticipantId) || null
    : null;

  // Add-monsters sheet derived state
  const filteredNpcs = npcs.filter(
    n => !monsterSearch || n.name.toLowerCase().includes(monsterSearch.toLowerCase())
  );
  const selectedNpc = npcs.find(n => n.id === selectedNpcId);
  const allPartySelected = characters.length > 0 && selectedPartyCharIds.length === characters.length;
  const addMonstersDisabled =
    addMonsterSubTab === 'library' ? !selectedNpc
    : addMonsterSubTab === 'custom' ? !customMonster.name.trim()
    : selectedPartyCharIds.length === 0;
  const addMonstersLabel =
    addMonsterSubTab === 'library'
      ? (selectedNpc ? `افزودن ${monsterQuantity > 1 ? `${monsterQuantity} × ` : ''}${selectedNpc.name}` : 'یک موجود انتخاب کنید')
      : addMonsterSubTab === 'custom'
      ? `افزودن ${customMonster.name.trim() || 'موجود'}`
      : (selectedPartyCharIds.length > 0 ? `افزودن ${selectedPartyCharIds.length} کاراکتر` : 'کاراکتری انتخاب کنید');

  return (
    <div className={`space-y-4 ${isEnded ? 'pb-6' : 'pb-28'}`} dir="rtl">
      {/* Sticky status bar: where we are (round, current turn) + the one state-level action */}
      <header className="sticky top-[52px] z-10 surface-card rounded-[14px] border border-border shadow-lg backdrop-blur-md bg-surface/95 p-3 space-y-2">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => setSelectedEncounterId(null)}
            className="w-11 h-11 rounded-[10px] bg-surface-2 text-text-muted hover:text-text-primary transition touch-target shrink-0 flex items-center justify-center"
            title="بازگشت به لیست نبردها"
            aria-label="بازگشت به لیست نبردها"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold text-base text-text-primary truncate">{currentEncounter.name}</h2>
            <p className="mt-0.5 flex items-center gap-3 text-xs">
              {!isDraft && <span className="font-bold text-accent">دور {currentEncounter.round || 1}</span>}
              <span className={`font-bold ${statusMeta.text}`}>{statusMeta.label}</span>
            </p>
          </div>

          {isLive && (
            <Button
              type="button"
              onClick={handleTogglePause}
              className={`h-11 px-3 rounded-[10px] text-sm font-bold transition flex items-center gap-1.5 shrink-0 touch-target ${
                currentEncounter.status === 'paused'
                  ? 'bg-accent text-on-accent'
                  : 'bg-surface-2 text-text-primary border border-border hover:bg-surface-3'
              }`}
            >
              {currentEncounter.status === 'paused' ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>ادامه</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>توقف</span>
                </>
              )}
            </Button>
          )}

          {isEnded && (
            <Button
              type="button"
              onClick={handleOpenEndLoot}
              className="h-11 px-3 rounded-[10px] bg-accent/15 text-accent text-sm font-bold transition flex items-center gap-1.5 shrink-0 touch-target"
            >
              <Award className="w-4 h-4" />
              <span>گزارش و لوت</span>
            </Button>
          )}
        </div>

        {((isLive && currentActiveParticipant) || locationEntry) && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
            {isLive && currentActiveParticipant ? (
              <span className="text-xs text-text-muted truncate">
                نوبت: <b className="text-sm text-text-primary">{currentActiveParticipant.instanceName}</b>
              </span>
            ) : <span />}
            {locationEntry && (
              <Chip variant="region" region={locationEntry.region as any} label={locationEntry.name} />
            )}
          </div>
        )}
      </header>

      {/* Draft: say what to do next instead of showing turn controls */}
      {isDraft && (
        <div className="surface-card rounded-[14px] border border-border p-4 space-y-3">
          <div>
            <h3 className="text-sm font-extrabold text-text-primary">نبرد هنوز شروع نشده</h3>
            <p className="text-xs text-text-muted mt-1">
              موجودات را اضافه کنید، ابتکار عمل را مشخص کنید و سپس نبرد را شروع کنید.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => handleStartEncounter(false)}
              className="h-11 rounded-[10px] bg-success hover:bg-success/90 text-on-accent font-black text-sm flex items-center justify-center gap-1.5 transition shadow-sm touch-target"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>شروع نبرد</span>
            </Button>
            <Button
              type="button"
              onClick={() => handleStartEncounter(true)}
              className="h-11 rounded-[10px] bg-surface-2 text-accent hover:text-accent-hover border border-border text-sm font-bold transition touch-target"
            >
              با دور غافلگیری
            </Button>
          </div>
          <p className="text-xs text-text-muted">در دور غافلگیری، موجودات مخفی پنهان می‌مانند.</p>
        </div>
      )}

      {/* Empty state */}
      {!hasParticipants && (
        <div className="p-8 text-center surface-card rounded-[14px] border border-border space-y-3">
          <Users className="w-10 h-10 text-text-muted mx-auto opacity-50" />
          <p className="text-sm text-text-muted">هنوز شرکت‌کننده‌ای در این نبرد نیست.</p>
          <Button
            type="button"
            onClick={() => setAddMonstersSheet(true)}
            className="h-11 px-4 rounded-[10px] bg-accent text-on-accent text-sm font-bold inline-flex items-center gap-1.5 touch-target"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن موجود</span>
          </Button>
        </div>
      )}

      {/* Unplaced: needs initiative before it joins the turn order */}
      {unplacedParticipants.length > 0 && (
        <section className="rounded-[14px] p-3 border border-accent/40 bg-accent/5 space-y-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-accent">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>ابتکار عمل مشخص نشده ({unplacedParticipants.length})</span>
            </h3>
            <p className="text-xs text-text-muted mt-1">تا ابتکار عمل ثبت نشود، در ترتیب نوبت‌ها قرار نمی‌گیرند.</p>
          </div>

          <div className="space-y-2">
            {unplacedParticipants.map(p => (
              <div key={p.id} className="rounded-[12px] p-3 bg-surface border border-border space-y-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold text-text-primary truncate">{p.instanceName}</span>
                  <span className="flex gap-3 text-xs text-text-muted shrink-0 tabular-nums">
                    <span>HP {p.hp}/{p.maxHp}</span>
                    <span>AC {p.ac}</span>
                  </span>
                </div>
                <InitiativeEntry
                  onRoll={() => handleConfirmInitiative(p, Math.floor(Math.random() * 20) + 1)}
                  onSubmit={(v) => handleConfirmInitiative(p, v)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Turn order */}
      {placedParticipants.length > 0 && (
        <section className="space-y-2.5" aria-label="ترتیب نوبت‌ها">
          <h3 className="px-1 text-sm font-bold text-text-muted">ترتیب نوبت‌ها</h3>

          {placedParticipants.map((p) => {
            const isCurrentTurn = p.id === currentEncounter.currentParticipantId;
            const isDefeated = p.status === 'defeated';
            const isCharacter = p.kind === 'character';
            const visKey: ParticipantVisibility = p.visibility || 'revealed';
            const vis = VISIBILITY_META[visKey];
            const VisIcon = VISIBILITY_ICON[visKey];
            const hpRatio = p.hp / (p.maxHp || 1);

            return (
              <div
                key={p.id}
                className={`surface-card rounded-[14px] p-3 border transition-colors space-y-3 ${
                  isCurrentTurn
                    ? 'border-accent ring-2 ring-accent/40 bg-surface-2'
                    : isDefeated
                    ? 'border-border opacity-60'
                    : 'border-border'
                }`}
              >
                {/* Identity: initiative, name, quiet meta, one menu button */}
                <div className="flex items-start gap-3">
                  <div
                    title="ابتکار عمل"
                    className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-base font-black tabular-nums shrink-0 ${
                      isCurrentTurn
                        ? 'bg-accent text-on-accent'
                        : p.initiativeStatus === 'pending'
                        ? 'bg-accent/15 text-accent border border-accent/50'
                        : 'bg-surface-2 text-text-primary border border-border'
                    }`}
                  >
                    {p.initiative ?? '–'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-base text-text-primary leading-snug break-words">{p.instanceName}</h4>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      {isCurrentTurn && <span className="font-bold text-accent">نوبت جاری</span>}
                      {isDefeated && <span className="font-bold">شکست‌خورده</span>}
                      <span>AC <b className="text-text-primary">{p.ac}</b></span>
                      <span>{kindLabel(p.kind)}</span>
                      {p.groupId && <span>گروه سربازان</span>}
                      {!isCharacter && (
                        <span className={`flex items-center gap-1 ${vis.tone}`}>
                          <VisIcon className="w-3.5 h-3.5" />
                          <span>{vis.label}</span>
                        </span>
                      )}
                      {p.phase && <span className="font-bold text-role-codm">{p.phase}</span>}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setActiveMenuParticipantId(p.id)}
                    className="w-11 h-11 -mt-1 rounded-[10px] hover:bg-surface-2 text-text-muted hover:text-text-primary transition touch-target shrink-0 flex items-center justify-center"
                    aria-label={`عملیات ${p.instanceName}`}
                    title="عملیات بیشتر"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>

                {/* Player-rolled initiative waiting for the DM */}
                {p.initiativeStatus === 'pending' && (
                  <div className="flex items-center justify-between gap-3 rounded-[10px] bg-accent/10 border border-accent/30 px-3 py-2">
                    <span className="text-sm text-text-primary">پرتاب بازیکن: <b className="tabular-nums">{p.initiative}</b></span>
                    <Button
                      type="button"
                      onClick={() => handleConfirmInitiative(p)}
                      className="h-9 px-4 rounded-[8px] bg-accent text-on-accent text-sm font-bold shrink-0"
                    >
                      تأیید
                    </Button>
                  </div>
                )}

                {/* HP: the number you tap is the keypad; −1 / +1 sit either side (LTR like a stepper) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2" dir="ltr">
                    <Button
                      type="button"
                      onClick={() => handleQuickHp(p, -1)}
                      aria-label="کم کردن یک HP"
                      className="w-11 h-11 rounded-[10px] bg-surface-2 text-text-primary font-black text-base border border-border hover:bg-danger/20 transition touch-target flex items-center justify-center shrink-0"
                    >
                      −1
                    </Button>

                    <Button
                      type="button"
                      onClick={() => {
                        setKeypadTarget(p);
                        setKeypadAmount('');
                      }}
                      title="ثبت آسیب یا درمان با عدد دقیق"
                      aria-label={`HP ${p.hp} از ${p.maxHp}. ثبت آسیب یا درمان با عدد دقیق`}
                      className="flex-1 h-11 px-3 rounded-[10px] bg-surface border border-border hover:border-accent/50 transition touch-target flex items-center justify-center gap-2"
                    >
                      <Heart className="w-4 h-4 text-danger shrink-0" />
                      <span className="text-lg font-black text-text-primary tabular-nums">{p.hp}</span>
                      <span className="text-sm text-text-muted tabular-nums">/ {p.maxHp}</span>
                      <Calculator className="w-4 h-4 text-text-muted shrink-0" />
                    </Button>

                    <Button
                      type="button"
                      onClick={() => handleQuickHp(p, 1)}
                      aria-label="اضافه کردن یک HP"
                      className="w-11 h-11 rounded-[10px] bg-surface-2 text-text-primary font-black text-base border border-border hover:bg-success/20 transition touch-target flex items-center justify-center shrink-0"
                    >
                      +1
                    </Button>
                  </div>

                  <div className="w-full h-2 rounded-full bg-surface overflow-hidden border border-border">
                    <div
                      className={`h-full transition-all duration-300 ${
                        hpRatio > 0.5 ? 'bg-success' : hpRatio > 0.25 ? 'bg-accent' : 'bg-danger'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, hpRatio * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Conditions */}
                <div className="flex flex-wrap items-center gap-2">
                  {(p.conditions || []).map((cond) => {
                    const condFa = cond.split(' (')[0];
                    return (
                      <span
                        key={cond}
                        className="inline-flex items-center gap-1 pe-2.5 ps-1 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/30 text-xs font-bold"
                      >
                        <span>{condFa}</span>
                        <Button
                          type="button"
                          onClick={() => handleToggleCondition(p, cond)}
                          aria-label={`حذف وضعیت ${condFa}`}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-danger/20"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </span>
                    );
                  })}

                  <Button
                    type="button"
                    onClick={() => setConditionTarget(p)}
                    className="h-9 px-3 rounded-full border border-dashed border-border text-xs text-text-muted hover:text-text-primary hover:border-accent/50 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>وضعیت</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Bottom bar: one dominant action (next turn); everything else is secondary */}
      {!isEnded && (
        <nav
          aria-label="کنترل نبرد"
          className="fixed bottom-0 inset-x-0 z-40 surface-card border-t border-border px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] backdrop-blur-md bg-surface/98 shadow-[0_-4px_25px_rgba(0,0,0,0.8)]"
        >
          <div className="max-w-md mx-auto flex items-center gap-2">
            {isLive ? (
              <>
                <Button
                  type="button"
                  onClick={handlePrevTurn}
                  className="w-12 h-12 rounded-[12px] bg-surface-2 text-text-primary border border-border hover:bg-surface-3 transition touch-target flex items-center justify-center shrink-0"
                  title="نوبت قبل"
                  aria-label="نوبت قبل"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>

                <Button
                  type="button"
                  onClick={handleNextTurn}
                  className="flex-1 h-12 px-4 rounded-[12px] bg-accent hover:bg-accent-hover text-on-accent font-black text-base flex items-center justify-center gap-2 shadow-md transition active:scale-95 touch-target"
                >
                  <span>نوبت بعد</span>
                  <ArrowLeft className="w-5 h-5" />
                </Button>

                <Button
                  type="button"
                  onClick={() => setAddMonstersSheet(true)}
                  className="w-14 h-12 rounded-[12px] bg-surface-2 text-text-primary border border-border hover:border-accent/50 transition touch-target flex flex-col items-center justify-center gap-0.5 shrink-0"
                >
                  <Plus className="w-4 h-4 text-accent" />
                  <span className="text-[11px] font-bold leading-none">افزودن</span>
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setAddMonstersSheet(true)}
                className="flex-1 h-12 px-4 rounded-[12px] bg-accent hover:bg-accent-hover text-on-accent font-black text-base flex items-center justify-center gap-2 shadow-md transition touch-target"
              >
                <Plus className="w-5 h-5" />
                <span>افزودن موجود</span>
              </Button>
            )}

            <Button
              type="button"
              onClick={() => setToolsSheet(true)}
              className="w-14 h-12 rounded-[12px] bg-surface-2 text-text-primary border border-border hover:border-accent/50 transition touch-target flex flex-col items-center justify-center gap-0.5 shrink-0"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="text-[11px] font-bold leading-none">بیشتر</span>
            </Button>
          </div>
        </nav>
      )}

      {/* Sheet 1: Add Monsters & Reinforcements (§2.2 & §2.4) */}
      <BottomSheet
        isOpen={addMonstersSheet}
        onClose={() => setAddMonstersSheet(false)}
        title="افزودن هیولا یا نیروی کمکی"
      >
        <div className="space-y-4 pb-4" dir="rtl">
          {/* Source */}
          <div role="tablist" className="rounded-[12px] p-1 border border-border bg-surface grid grid-cols-3 gap-1">
            {([
              ['library', 'کتابخانه'],
              ['party', 'کاراکترها'],
              ['custom', 'سفارشی']
            ] as const).map(([id, label]) => (
              <Button
                type="button"
                key={id}
                role="tab"
                aria-selected={addMonsterSubTab === id}
                onClick={() => setAddMonsterSubTab(id)}
                className={`h-10 rounded-[8px] text-sm font-bold transition ${
                  addMonsterSubTab === id ? 'bg-accent text-on-accent' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Library */}
          {addMonsterSubTab === 'library' && (
            <div className="space-y-4">
              <Input noWrapper
                type="text"
                placeholder="جستجو در موجودات..."
                value={monsterSearch}
                onChange={(e) => setMonsterSearch(e.target.value)}
                className="w-full h-11 bg-surface text-text-primary px-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
              />

              <div className="max-h-56 overflow-y-auto space-y-1 border border-border rounded-[12px] p-1 bg-bg">
                {filteredNpcs.length === 0 ? (
                  <p className="p-4 text-center text-sm text-text-muted">موجودی پیدا نشد.</p>
                ) : (
                  filteredNpcs.map(n => (
                    <Button
                      type="button"
                      key={n.id}
                      aria-pressed={selectedNpcId === n.id}
                      onClick={() => setSelectedNpcId(n.id)}
                      className={`w-full min-h-[44px] text-start px-3 py-2 rounded-[8px] text-sm transition flex items-center justify-between gap-3 ${
                        selectedNpcId === n.id ? 'bg-accent text-on-accent font-black' : 'text-text-primary hover:bg-surface-2'
                      }`}
                    >
                      <span className="truncate">{n.name}</span>
                      <span className="flex gap-3 text-xs opacity-80 shrink-0 tabular-nums">
                        <span>HP {n.hp.max}</span>
                        <span>AC {n.ac}</span>
                      </span>
                    </Button>
                  ))
                )}
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-text-primary">تعداد</span>
                <div className="flex items-center gap-2" dir="ltr">
                  <Button
                    type="button"
                    onClick={() => setMonsterQuantity(q => Math.max(1, q - 1))}
                    aria-label="کم کردن تعداد"
                    className="w-11 h-11 rounded-[10px] bg-surface-2 text-text-primary font-black text-lg border border-border touch-target flex items-center justify-center"
                  >
                    −
                  </Button>
                  <span className="w-10 text-center font-black text-lg text-accent tabular-nums">{monsterQuantity}</span>
                  <Button
                    type="button"
                    onClick={() => setMonsterQuantity(q => Math.min(12, q + 1))}
                    aria-label="زیاد کردن تعداد"
                    className="w-11 h-11 rounded-[10px] bg-surface-2 text-text-primary font-black text-lg border border-border touch-target flex items-center justify-center"
                  >
                    +
                  </Button>
                </div>
              </div>

              {monsterQuantity > 1 && (
                <ToggleRow
                  label="گروه‌بندی سربازان"
                  hint="آسیب بین همه‌ی اعضای گروه تقسیم می‌شود"
                  checked={isMinionGroup}
                  onChange={setIsMinionGroup}
                />
              )}

              <label className="block">
                <span className="block text-sm font-bold text-text-primary mb-1.5">دید اولیه بازیکنان</span>
                <Select noWrapper
                  value={monsterVisibility}
                  onChange={(e) => setMonsterVisibility(e.target.value as ParticipantVisibility)}
                  className="w-full h-11 bg-surface text-text-primary px-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
                >
                  <option value="revealed">آشکار (نام کامل)</option>
                  <option value="announced">ناشناخته (موجود ناشناخته)</option>
                  <option value="hidden">مخفی (کاملاً پنهان)</option>
                </Select>
              </label>

              <details className="rounded-[12px] border border-border bg-surface">
                <summary className="min-h-[44px] px-3 flex items-center justify-between gap-3 text-sm font-bold text-text-muted cursor-pointer">
                  <span>گزینه‌های بیشتر</span>
                  <span className="text-xs font-normal">
                    {monsterHpMode === 'roll' ? 'HP تصادفی' : 'HP پیش‌فرض الگو'}
                  </span>
                </summary>
                <div className="px-3 pb-3">
                  <label className="block">
                    <span className="block text-sm font-bold text-text-primary mb-1.5">محاسبه HP</span>
                    <Select noWrapper
                      value={monsterHpMode}
                      onChange={(e) => setMonsterHpMode(e.target.value as any)}
                      className="w-full h-11 bg-bg text-text-primary px-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
                    >
                      <option value="default">HP پیش‌فرض الگو</option>
                      <option value="roll">پرتاب تاس برای هر موجود</option>
                    </Select>
                  </label>
                </div>
              </details>
            </div>
          )}

          {/* Custom */}
          {addMonsterSubTab === 'custom' && (
            <div className="space-y-3">
              <label className="block">
                <span className="block text-sm font-bold text-text-primary mb-1.5">نام موجود</span>
                <Input noWrapper
                  type="text"
                  value={customMonster.name}
                  onChange={(e) => setCustomMonster(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 bg-surface text-text-primary px-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
                />
              </label>

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="block text-sm font-bold text-text-primary mb-1.5">HP</span>
                  <Input noWrapper
                    type="number"
                    value={customMonster.hp}
                    onChange={(e) => setCustomMonster(prev => ({ ...prev, hp: parseInt(e.target.value) || 10 }))}
                    className="w-full h-11 bg-surface text-text-primary rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm text-center"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-bold text-text-primary mb-1.5">AC</span>
                  <Input noWrapper
                    type="text"
                    value={customMonster.ac}
                    onChange={(e) => setCustomMonster(prev => ({ ...prev, ac: e.target.value }))}
                    className="w-full h-11 bg-surface text-text-primary rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm text-center"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-bold text-text-primary mb-1.5">ابتکار</span>
                  <Input noWrapper
                    type="number"
                    value={customMonster.initiative}
                    onChange={(e) => setCustomMonster(prev => ({ ...prev, initiative: e.target.value }))}
                    placeholder="اختیاری"
                    className="w-full h-11 bg-surface text-text-primary rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm text-center"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Party */}
          {addMonsterSubTab === 'party' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-text-primary">
                  انتخاب کاراکترها
                  {selectedPartyCharIds.length > 0 && (
                    <span className="font-normal text-text-muted"> ({selectedPartyCharIds.length})</span>
                  )}
                </span>
                <Button
                  type="button"
                  onClick={() => setSelectedPartyCharIds(allPartySelected ? [] : characters.map(c => c.id))}
                  className="h-9 px-2 text-sm text-accent font-bold"
                >
                  {allPartySelected ? 'لغو انتخاب همه' : 'انتخاب همه'}
                </Button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {characters.map(c => (
                  <ToggleRow
                    key={c.id}
                    label={c.name}
                    hint={`${c.className} · HP ${c.hp.current}/${c.hp.max}`}
                    checked={selectedPartyCharIds.includes(c.id)}
                    onChange={(checked) =>
                      setSelectedPartyCharIds(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Announcement applies to monsters, not to party members */}
          {addMonsterSubTab !== 'party' && (
            <div className="space-y-2">
              <ToggleRow
                label="اعلام ورود نیروی کمکی به بازیکنان"
                hint="پیام در لاگ نبرد نمایش داده می‌شود"
                checked={announceReinforcements}
                onChange={setAnnounceReinforcements}
              />
              {announceReinforcements && (
                <Input noWrapper
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full h-11 bg-bg text-text-primary px-3 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm"
                />
              )}
            </div>
          )}

          <Button
            type="button"
            onClick={handleAddMonsters}
            disabled={addMonstersDisabled}
            className="w-full h-12 rounded-[12px] bg-accent text-on-accent font-black text-sm hover:bg-accent-hover transition shadow-md disabled:opacity-40 touch-target"
          >
            {addMonstersLabel}
          </Button>
        </div>
      </BottomSheet>

      {/* Sheet 2: Numeric Keypad Sheet (§2.5) */}
      <BottomSheet
        isOpen={!!keypadTarget}
        onClose={() => setKeypadTarget(null)}
        title={`محاسبه HP: ${keypadTarget?.instanceName}`}
      >
        <div className="space-y-3 pb-3 max-w-xs mx-auto" dir="rtl">
          <div className="p-3 rounded-[12px] bg-surface border border-border text-center">
            <span className="text-xs text-text-muted block mb-1">مقدار تغییر:</span>
            <span className="text-2xl font-black text-accent tracking-wider min-h-[44px] block">
              {keypadAmount || '0'}
            </span>
            <span className="text-xs text-text-muted mt-1 block">
              HP فعلی: {keypadTarget?.hp} / {keypadTarget?.maxHp}
            </span>
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-2" dir="ltr">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
              <Button
                type="button"
                key={k}
                onClick={() => {
                  if (k === 'C') setKeypadAmount('');
                  else if (k === '⌫') setKeypadAmount(prev => prev.slice(0, -1));
                  else setKeypadAmount(prev => (prev.length < 4 ? prev + k : prev));
                }}
                className={`h-14 rounded-[12px] font-black text-xl transition touch-target min-w-[44px] flex items-center justify-center ${
                  k === 'C' ? 'bg-danger/20 text-danger' :
                  k === '⌫' ? 'bg-surface-2 text-text-muted' :
                  'bg-surface-2 text-text-primary hover:bg-surface-3'
                }`}
              >
                {k}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              onClick={() => handleApplyKeypad(false)}
              disabled={!keypadAmount}
              className="h-12 rounded-[12px] bg-danger hover:bg-danger/90 text-white font-black text-sm transition disabled:opacity-40 touch-target min-w-[44px]"
            >
              ثبت آسیب
            </Button>
            <Button
              type="button"
              onClick={() => handleApplyKeypad(true)}
              disabled={!keypadAmount}
              className="h-12 rounded-[12px] bg-success hover:bg-success/90 text-on-accent font-black text-sm transition disabled:opacity-40 touch-target min-w-[44px]"
            >
              ثبت درمان
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Sheet 3: Conditions Selector */}
      <BottomSheet
        isOpen={!!conditionTarget}
        onClose={() => setConditionTarget(null)}
        title={`ثبت وضعیت برای ${conditionTarget?.instanceName}`}
      >
        <div className="grid grid-cols-2 gap-2 pb-2" dir="rtl">
          {availableConditions.map(cond => {
            const isApplied = conditionTarget?.conditions?.includes(cond);
            return (
              <Button
                type="button"
                key={cond}
                onClick={() => conditionTarget && handleToggleCondition(conditionTarget, cond)}
                className={`w-full min-h-[52px] px-3 py-2 rounded-[10px] text-sm font-bold transition flex items-center justify-between gap-2 touch-target min-w-[44px] ${
                  isApplied
                    ? 'bg-danger/20 text-danger border border-danger/40'
                    : 'bg-surface text-text-primary border border-border hover:bg-surface-2'
                }`}
              >
                <span className="text-start">
                  <span className="block">{cond.split(' (')[0]}</span>
                  {cond.includes(' (') && (
                    <span className="block text-[11px] font-normal opacity-70" dir="ltr">
                      {cond.split(' (')[1].replace(')', '')}
                    </span>
                  )}
                </span>
                {isApplied && <CheckCircle2 className="w-4 h-4 text-danger-hover" />}
              </Button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Sheet 4: End Encounter & Loot Distribution (§2.6) */}
      <BottomSheet
        isOpen={endLootSheet}
        onClose={() => setEndLootSheet(false)}
        title="پایان نبرد و اهدای غنائم (Loot)"
      >
        <div className="space-y-4 pb-2" dir="rtl">
          <div className="p-3 rounded-[12px] bg-surface border border-border space-y-1 text-xs">
            <span className="font-bold text-accent block">خلاصه نبرد:</span>
            <p className="text-text-muted">تعداد دورهای مبارزه: {currentEncounter.round || 1}</p>
            <p className="text-text-muted">
              دشمنان شکست‌خورده: {(currentEncounter.participants || []).filter(p => p.status === 'defeated').length}
            </p>
          </div>

          {proposedLoot.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-bold text-text-primary block">غنائم پیشنهادی از موجودات شکست‌خورده:</span>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {proposedLoot.map(loot => (
                  <div
                    key={loot.id}
                    className="p-2.5 rounded-[10px] bg-surface border border-border space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black text-accent">{loot.name}</span>
                      <span className="text-xs text-text-muted">از {loot.sourceNpc}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-text-muted">اهدای آیتم به:</span>
                      <Select noWrapper
                        value={selectedLootRecipients[loot.id] || ''}
                        onChange={(e) => setSelectedLootRecipients(prev => ({
                          ...prev,
                          [loot.id]: e.target.value
                        }))}
                        className="bg-surface-2 text-text-primary text-xs p-1.5 rounded-[6px] border border-border focus:border-accent"
                      >
                        <option value="">عدم اهدا (رد کردن)</option>
                        {characters.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-4">
              هیچ غنیمتی در لیست لوت هیولاهای شکست‌خورده یافت نشد.
            </p>
          )}

          <Button
            type="button"
            onClick={handleFinishEndAndDistribute}
            className="w-full py-3 rounded-[10px] bg-danger hover:bg-danger text-white font-black text-sm transition shadow-md touch-target min-w-[44px]"
          >
            پایان نبرد
          </Button>
        </div>
      </BottomSheet>

      {/* Sheet 5: Custom Event Note for Combat Log */}
      <BottomSheet
        isOpen={customEventSheet}
        onClose={() => setCustomEventSheet(false)}
        title="ارسال پیام رویداد در لاگ نبرد"
      >
        <div className="space-y-3 pb-2" dir="rtl">
          <p className="text-xs text-text-muted">
            این پیام در بخش وقایع زنده مبارزه برای تمامی بازیکنان نمایش داده خواهد شد.
          </p>

          <Textarea noWrapper
            rows={3}
            value={customEventText}
            onChange={(e) => setCustomEventText(e.target.value)}
            placeholder="مثال: سقف کاروانسرا فروریخت و دود غلیظی محوطه را فراگرفت..."
            className="w-full bg-surface text-text-primary p-2.5 rounded-[10px] border border-border text-sm focus:border-accent focus:outline-none"
          />

          <Button
            type="button"
            onClick={async () => {
              if (!customEventText.trim() || !currentEncounter) return;
              await api.addEncounterEvent(currentEncounter.id, customEventText.trim(), true);
              setCustomEventText('');
              setCustomEventSheet(false);
              loadSelectedEncounter(currentEncounter.id);
            }}
            disabled={!customEventText.trim()}
            className="w-full py-2.5 rounded-[10px] bg-accent text-on-accent font-bold text-sm transition disabled:opacity-50 touch-target min-w-[44px]"
          >
            ثبت در لاگ
          </Button>
        </div>
      </BottomSheet>

      {/* Sheet 6: Live Handouts & Maps Quick Reveal during combat */}
      <BottomSheet
        isOpen={handoutsSheet}
        onClose={() => setHandoutsSheet(false)}
        title="اسناد و نقشه‌های نبرد"
      >
        <div className="pb-4" dir="rtl">
          <DmHandoutManager
            campaignId="zorvania-c1"
            isCompact={true}
            campaignCharacters={characters.map(c => ({ id: c.id, name: c.name }))}
            onCloseCompact={() => setHandoutsSheet(false)}
          />
        </div>
      </BottomSheet>

      {/* Sheet 7: Encounter tools — secondary actions kept out of the bottom bar */}
      <BottomSheet
        isOpen={toolsSheet}
        onClose={() => setToolsSheet(false)}
        title="ابزارهای نبرد"
      >
        <div className="space-y-2 pb-2" dir="rtl">
          <SheetAction
            icon={<MessageSquarePlus className="w-5 h-5 text-accent" />}
            label="ارسال پیام در لاگ نبرد"
            hint="برای همه‌ی بازیکنان نمایش داده می‌شود"
            onClick={() => {
              setToolsSheet(false);
              setCustomEventSheet(true);
            }}
          />
          <SheetAction
            icon={<MapIcon className="w-5 h-5 text-success" />}
            label="اسناد و نقشه‌ها"
            hint="نمایش سریع به بازیکنان در حین نبرد"
            onClick={() => {
              setToolsSheet(false);
              setHandoutsSheet(true);
            }}
          />

          {isLive && (
            <div className="pt-3 mt-1 border-t border-border">
              <SheetAction
                tone="danger"
                icon={<Award className="w-5 h-5" />}
                label="پایان نبرد و غنائم"
                hint="نبرد بسته می‌شود و غنائم بین کاراکترها تقسیم می‌شود"
                onClick={() => {
                  setToolsSheet(false);
                  handleOpenEndLoot();
                }}
              />
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Sheet 8: Participant actions — replaces the inline dropdown that pushed the list around */}
      <BottomSheet
        isOpen={!!menuParticipant}
        onClose={() => setActiveMenuParticipantId(null)}
        title={menuParticipant ? menuParticipant.instanceName : ''}
      >
        {menuParticipant && (
          <div className="space-y-5 pb-2" dir="rtl">
            <div role="radiogroup" aria-label="دید بازیکنان" className="space-y-2">
              <span className="block text-sm font-bold text-text-primary">دید بازیکنان</span>
              {(['revealed', 'announced', 'hidden'] as ParticipantVisibility[]).map(v => {
                const meta = VISIBILITY_META[v];
                const Icon = VISIBILITY_ICON[v];
                const selected = menuParticipant.visibility === v;
                return (
                  <Button
                    type="button"
                    key={v}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => handleSetVisibility(menuParticipant, v)}
                    className={`w-full min-h-[52px] px-3 py-2 rounded-[12px] border flex items-center gap-3 text-start transition touch-target ${
                      selected ? 'bg-accent/10 border-accent' : 'bg-surface border-border hover:bg-surface-2'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${meta.tone}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-text-primary">{meta.label}</span>
                      <span className="block text-xs text-text-muted font-normal mt-0.5">{meta.hint}</span>
                    </span>
                    {selected && <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />}
                  </Button>
                );
              })}
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-bold text-text-primary">عملیات</span>
              <SheetAction
                icon={<Copy className="w-5 h-5 text-text-muted" />}
                label="تکثیر این موجود"
                onClick={() => handleDuplicateParticipant(menuParticipant)}
              />
              <SheetAction
                icon={<CheckCircle2 className="w-5 h-5 text-success" />}
                label={menuParticipant.status === 'defeated' ? 'احیا / بازگشت به نبرد' : 'شکست‌خورده'}
                onClick={() => handleToggleDefeated(menuParticipant)}
              />
              <SheetAction
                icon={<Sparkles className="w-5 h-5 text-role-codm" />}
                label="تغییر فاز"
                hint="برای باس‌ها، مثلاً فاز 2"
                onClick={() => handleChangePhase(menuParticipant)}
              />
            </div>

            <div className="pt-3 border-t border-border">
              <SheetAction
                tone="danger"
                icon={<Trash2 className="w-5 h-5" />}
                label="حذف از مبارزه"
                onClick={() => handleDeleteParticipant(menuParticipant)}
              />
            </div>
          </div>
        )}
      </BottomSheet>

    </div>
  );
};