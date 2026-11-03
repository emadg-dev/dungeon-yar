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
  MoreVertical, Sparkles, Award, Lock, MapPin, X, MessageSquarePlus, Map as MapIcon
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

  // 5. Visibility Cycle
  const handleCycleVisibility = async (p: EncounterParticipant) => {
    if (!currentEncounter) return;
    const nextVis: Record<ParticipantVisibility, ParticipantVisibility> = {
      revealed: 'announced',
      announced: 'hidden',
      hidden: 'revealed'
    };
    const target = nextVis[p.visibility] || 'revealed';

    try {
      await api.updateEncounterParticipant(currentEncounter.id, p.id, { visibility: target });
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
        announceReinforcements,
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

    return (
      <div className="space-y-4" dir="rtl">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-text-primary">مدیریت مبارزات کمپین</h2>
            <p className="text-xs text-text-muted">کنترل نبردهای زنده، ترتیب ابتکار عمل و اشتراک با بازیکنان</p>
          </div>

          <Button
            type="button"
            onClick={() => setNewEncounterSheet(true)}
            className="bg-accent text-on-accent font-extrabold px-3.5 py-2 rounded-[12px] flex items-center gap-1.5 hover:bg-accent-hover transition shadow-md touch-target min-w-[44px] shrink-0 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>نبرد جدید</span>
          </Button>
        </div>

        {/* List Tabs (§2.7: Draft / Active / Ended) */}
        <div className="surface-card rounded-[12px] p-1 border border-border flex items-center gap-1">
          <Button
            type="button"
            onClick={() => setListTab('active')}
            className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] ${
              listTab === 'active'
                ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>در حال نبرد ({encounters.filter(e => e.status === 'active' || e.status === 'paused').length})</span>
          </Button>

          <Button
            type="button"
            onClick={() => setListTab('draft')}
            className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] ${
              listTab === 'draft'
                ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>پیش‌نویس ({encounters.filter(e => e.status === 'draft').length})</span>
          </Button>

          <Button
            type="button"
            onClick={() => setListTab('ended')}
            className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] ${
              listTab === 'ended'
                ? 'bg-accent text-on-accent font-extrabold shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>پایان‌یافته ({encounters.filter(e => e.status === 'ended').length})</span>
          </Button>
        </div>

        {/* Encounters grouped by location */}
        {Object.keys(groupedByLocation).length === 0 ? (
          <div className="p-8 text-center surface-card rounded-[14px] border border-border">
            <Swords className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm text-text-muted">مبارزه‌ای در این بخش یافت نشد.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByLocation).map(([locName, groupList]) => (
              <div key={locName} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-accent">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{locName}</span>
                  <span className="text-xs text-text-muted">({groupList.length} نبرد)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupList.map(enc => (
                    <div
                      key={enc.id}
                      className="surface-card rounded-[14px] p-4 border border-border hover:border-accent/40 transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-sm text-text-primary">{enc.name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                            {enc.sessionTag && <span>{enc.sessionTag}</span>}
                            <span>•</span>
                            <span>دور {enc.round || 0}</span>
                            <span>•</span>
                            <span>{enc.participants?.length || 0} شرکت‌کننده</span>
                          </div>
                        </div>

                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                          enc.status === 'active' ? 'bg-success/20 text-success border border-success/30 animate-pulse' :
                          enc.status === 'paused' ? 'bg-accent/20 text-accent border border-accent/30' :
                          enc.status === 'ended' ? 'bg-surface-2/20 text-text-muted' :
                          'bg-danger/20 text-danger border border-danger/30'
                        }`}>
                          {enc.status === 'active' ? 'در حال اجرا' :
                           enc.status === 'paused' ? 'متوقف‌شده' :
                           enc.status === 'ended' ? 'پایان‌یافته' : 'پیش‌نویس'}
                        </span>
                      </div>

                      {/* Participant Preview Badges */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                        {(enc.participants || []).slice(0, 5).map((p, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded-[6px] shrink-0 ${
                              p.kind === 'character' ? 'bg-success/15 text-success' : 'bg-surface text-text-primary border border-border'
                            }`}
                          >
                            {p.instanceName}
                          </span>
                        ))}
                        {(enc.participants?.length || 0) > 5 && (
                          <span className="text-xs text-text-muted">+{enc.participants.length - 5}</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs">
                        <Button
                          type="button"
                          onClick={() => handleDuplicateEncounter(enc)}
                          className="text-text-muted hover:text-text-primary flex items-center gap-1 font-bold touch-target min-w-[44px] p-1"
                          title="تکثیر این نبرد به عنوان الگوی جدید"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>تکثیر</span>
                        </Button>

                        <Button
                          type="button"
                          onClick={() => setSelectedEncounterId(enc.id)}
                          className="bg-accent/15 hover:bg-accent/25 text-accent font-extrabold px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 transition touch-target min-w-[44px]"
                        >
                          <span>ورود به رانر</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Encounter Sheet Modal */}
        <BottomSheet
          isOpen={newEncounterSheet}
          onClose={() => setNewEncounterSheet(false)}
          title="ایجاد مبارزه جدید"
        >
          <form onSubmit={handleCreateEncounter} className="space-y-4 pb-2" dir="rtl">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">
                نام نبرد <span className="text-danger">*</span>
              </label>
              <Input noWrapper
                type="text"
                required
                value={newEncForm.name}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: شبیخون در بیشه بلورین"
                className="w-full bg-surface text-text-primary p-2.5 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm touch-target min-w-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">
                محل رویداد (مکان)
              </label>
              <Select noWrapper
                value={newEncForm.locationId}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, locationId: e.target.value }))}
                className="w-full bg-surface text-text-primary p-2.5 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm touch-target min-w-[44px]"
              >
                <option value="">بدون مکان پیوندخورده</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.region})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">برچسب جلسه</label>
              <Input noWrapper
                type="text"
                value={newEncForm.sessionTag}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, sessionTag: e.target.value }))}
                placeholder="مثال: جلسه 4"
                className="w-full bg-surface text-text-primary p-2.5 rounded-[10px] border border-border focus:border-accent focus:outline-none text-sm touch-target min-w-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-danger mb-1">یادداشت‌های محرمانه مستر</label>
              <Textarea noWrapper
                rows={2}
                value={newEncForm.dmNotes}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, dmNotes: e.target.value }))}
                placeholder="رویدادهای محیطی در دور 3، نقاط ضعف یا تاکتیک‌ها..."
                className="w-full bg-surface text-text-primary p-2.5 rounded-[10px] border border-danger/40 focus:border-danger focus:outline-none text-sm touch-target min-w-[44px]"
              />
            </div>

            {/* Visibility Settings for Players (§1 & §3) */}
            <div className="space-y-2 p-3 rounded-[12px] bg-surface border border-border">
              <span className="text-xs font-extrabold text-accent block mb-1">تنظیمات مشاهده بازیکنان</span>

              <label className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-primary cursor-pointer">
                <span>نمایش عدد دقیق HP هیولاها به بازیکنان</span>
                <Input noWrapper
                  type="checkbox"
                  checked={newEncForm.settings.showExactHp}
                  onChange={(e) => setNewEncForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showExactHp: e.target.checked }
                  }))}
                  className="w-4 h-4 accent-accent"
                />
              </label>

              <label className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-primary cursor-pointer">
                <span>نمایش عدد دقیق زره (AC) هیولاها</span>
                <Input noWrapper
                  type="checkbox"
                  checked={newEncForm.settings.showAc}
                  onChange={(e) => setNewEncForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showAc: e.target.checked }
                  }))}
                  className="w-4 h-4 accent-accent"
                />
              </label>

              <label className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-primary cursor-pointer">
                <span>اجازه به بازیکن برای پرتاب تاس ابتکار عمل خود</span>
                <Input noWrapper
                  type="checkbox"
                  checked={newEncForm.settings.playerInitiativeRolls}
                  onChange={(e) => setNewEncForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, playerInitiativeRolls: e.target.checked }
                  }))}
                  className="w-4 h-4 accent-accent"
                />
              </label>

              <label className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-primary cursor-pointer">
                <span>نمایش وضعیت‌ها و حالات منفی به بازیکنان</span>
                <Input noWrapper
                  type="checkbox"
                  checked={newEncForm.settings.showConditions}
                  onChange={(e) => setNewEncForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showConditions: e.target.checked }
                  }))}
                  className="w-4 h-4 accent-accent"
                />
              </label>
            </div>

            <Button
              type="submit"
              className="w-full py-3 rounded-[10px] bg-accent text-on-accent font-extrabold text-sm hover:bg-accent-hover transition shadow-md touch-target min-w-[44px]"
            >
              ایجاد نبرد و ورود به رانر
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

  return (
    <div className="space-y-4 pb-24" dir="rtl">
      {/* Sticky Top Status Bar (§2.4) */}
      <div className="sticky top-[52px] z-10 surface-card rounded-[14px] p-3 border border-border shadow-lg backdrop-blur-md bg-surface/95 flex flex-wrap items-center justify-between gap-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            type="button"
            onClick={() => setSelectedEncounterId(null)}
            className="p-1.5 rounded-[8px] bg-surface-2 text-text-muted hover:text-text-primary transition touch-target min-w-[44px] shrink-0"
            title="بازگشت به لیست نبردها"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-sm text-text-primary truncate">{currentEncounter.name}</h2>
              {locationEntry && (
                <Chip variant="region" region={locationEntry.region as any} label={locationEntry.name} />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
              <span className="font-bold text-accent">دور {currentEncounter.round || 1}</span>
              <span>•</span>
              <span className={`font-bold ${
                currentEncounter.status === 'active' ? 'text-success' :
                currentEncounter.status === 'paused' ? 'text-accent' :
                currentEncounter.status === 'ended' ? 'text-text-muted' : 'text-danger'
              }`}>
                {currentEncounter.status === 'active' ? 'مبارزه زنده' :
                 currentEncounter.status === 'paused' ? 'متوقف‌شده' :
                 currentEncounter.status === 'ended' ? 'پایان‌یافته' : 'پیش‌نویس (پنهان)'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {currentEncounter.status === 'draft' ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                onClick={() => handleStartEncounter(false)}
                className="bg-success hover:bg-success/90 text-on-accent font-black text-xs px-3 py-1.5 rounded-[8px] flex items-center gap-1 transition shadow-sm touch-target min-w-[44px]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>شروع نبرد</span>
              </Button>
              <Button
                type="button"
                onClick={() => handleStartEncounter(true)}
                className="bg-surface-2 text-accent hover:text-accent-hover text-xs px-2 py-1.5 rounded-[8px] border border-border transition touch-target min-w-[44px]"
                title="شروع نبرد با دور غافلگیری (موجودات مخفی پنهان می‌مانند)"
              >
                دور غافلگیری
              </Button>
            </div>
          ) : currentEncounter.status === 'active' || currentEncounter.status === 'paused' ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                onClick={handleTogglePause}
                className={`text-xs px-2.5 py-1.5 rounded-[8px] font-bold transition flex items-center gap-1 touch-target min-w-[44px] ${
                  currentEncounter.status === 'paused'
                    ? 'bg-accent text-on-accent'
                    : 'bg-surface-2 text-text-muted hover:text-text-primary'
                }`}
              >
                {currentEncounter.status === 'paused' ? (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>ادامه</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 fill-current" />
                    <span>توقف</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={handleOpenEndLoot}
                className="bg-danger/20 text-danger-hover hover:bg-danger/30 text-xs px-2.5 py-1.5 rounded-[8px] font-bold transition touch-target min-w-[44px]"
              >
                پایان نبرد
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleOpenEndLoot}
              className="bg-accent/20 text-accent text-xs px-2.5 py-1.5 rounded-[8px] font-bold transition touch-target min-w-[44px] flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" />
              <span>گزارش و لوت</span>
            </Button>
          )}
        </div>
      </div>

      {/* Unplaced Strip (§2.4: Added without initiative) */}
      {unplacedParticipants.length > 0 && (
        <div className="surface-card rounded-[14px] p-3 border border-accent/40 bg-accent/5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-accent">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>موجودات نیازمند تعیین ابتکار عمل ({unplacedParticipants.length})</span>
            </span>
            <span className="text-xs text-text-muted">در صف نوبت‌دهی قرار ندارند</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unplacedParticipants.map(p => (
              <div
                key={p.id}
                className="surface-2-card rounded-[10px] p-2 border border-border flex flex-wrap items-center justify-between gap-2 gap-2"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-text-primary block truncate">{p.instanceName}</span>
                  <span className="text-xs text-text-muted">HP: {p.hp}/{p.maxHp} • AC: {p.ac}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    onClick={() => {
                      const roll = Math.floor(Math.random() * 20) + 1;
                      handleConfirmInitiative(p, roll);
                    }}
                    className="p-1 rounded-[6px] bg-surface-2 text-accent hover:text-accent-hover text-xs flex items-center gap-1 touch-target min-w-[44px] border border-border"
                    title="پرتاب تصادفی 1d20"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>تاس</span>
                  </Button>
                  <Input noWrapper
                    type="number"
                    placeholder="ابتکار"
                    className="w-14 bg-surface text-text-primary text-center text-xs p-1 rounded-[6px] border border-border focus:border-accent focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt((e.target as HTMLInputElement).value, 10);
                        if (!isNaN(val)) handleConfirmInitiative(p, val);
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Initiative List (§2.4 & §2.5) */}
      <div className="space-y-2.5">
        {placedParticipants.map((p) => {
          const isCurrentTurn = p.id === currentEncounter.currentParticipantId;
          const isDefeated = p.status === 'defeated';
          const isFled = p.status === 'fled';
          const isCharacter = p.kind === 'character';

          return (
            <div
              key={p.id}
              className={`surface-card rounded-[14px] p-3 border transition-all duration-150 relative space-y-2.5 ${
                isCurrentTurn
                  ? 'border-accent ring-1 ring-accent/50 shadow-[0_0_15px_rgba(224,160,48,0.2)] bg-surface-2'
                  : isDefeated
                  ? 'border-border opacity-60 bg-surface/40'
                  : 'border-border hover:border-accent/30'
              }`}
            >
              {/* Row Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Initiative Value Badge */}
                  <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-xs font-black shrink-0 ${
                    p.initiativeStatus === 'pending'
                      ? 'bg-accent/20 text-accent-hover border border-accent/50 animate-pulse'
                      : isCurrentTurn
                      ? 'bg-accent text-on-accent'
                      : 'bg-surface-2 text-text-primary border border-border'
                  }`}>
                    {p.initiative ?? '-'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-text-primary truncate">{p.instanceName}</h4>

                      {isCurrentTurn && (
                        <span className="text-xs bg-accent text-on-accent font-black px-1.5 py-0.2 rounded-full">
                          نوبت جاری
                        </span>
                      )}

                      {p.phase && (
                        <span className="text-xs bg-role-codm/20 text-role-codm px-1.5 py-0.2 rounded-full border border-role-codm/30">
                          {p.phase}
                        </span>
                      )}

                      {isCharacter && (
                        <span className="text-xs bg-success/20 text-success px-1.5 py-0.2 rounded-full font-bold">
                          شخصیت
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                      <span>AC: <b className="text-text-primary">{p.ac}</b></span>
                      {p.groupId && <span>• گروه سربازان</span>}
                      {p.initiativeStatus === 'pending' && (
                        <span className="text-accent-hover font-bold flex items-center gap-1">
                          (پرتاب بازیکن: {p.initiative})
                          <Button
                            type="button"
                            onClick={() => handleConfirmInitiative(p)}
                            className="bg-accent text-black px-1.5 py-0.2 rounded text-xs font-black"
                          >
                            تایید
                          </Button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls: Visibility Eye & Action Menu */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    onClick={() => handleCycleVisibility(p)}
                    title={`وضعیت دید بازیکنان: ${
                      p.visibility === 'revealed' ? 'آشکار کامل' :
                      p.visibility === 'announced' ? 'ناشناخته (بدون آمار)' : 'مخفی'
                    }`}
                    className={`p-1.5 rounded-[8px] transition touch-target min-w-[44px] ${
                      p.visibility === 'revealed' ? 'bg-success/20 text-success' :
                      p.visibility === 'announced' ? 'bg-accent/20 text-accent' :
                      'bg-danger/20 text-danger-hover'
                    }`}
                  >
                    {p.visibility === 'revealed' ? <Eye className="w-4 h-4" /> :
                     p.visibility === 'announced' ? <Shield className="w-4 h-4" /> :
                     <EyeOff className="w-4 h-4" />}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setActiveMenuParticipantId(activeMenuParticipantId === p.id ? null : p.id)}
                    className="p-1.5 rounded-[8px] hover:bg-surface-2 text-text-muted hover:text-text-primary transition touch-target min-w-[44px]"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* HP Bar and Direct Controls */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-text-primary">{p.hp} / {p.maxHp} HP</span>
                    <span className="text-xs text-text-muted">({Math.round((p.hp / (p.maxHp || 1)) * 100)}%)</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      onClick={() => {
                        const next = Math.max(0, p.hp - 1);
                        api.updateEncounterParticipant(currentEncounter.id, p.id, {
                          hp: next,
                          status: next === 0 ? 'defeated' : p.status
                        }).then(() => loadSelectedEncounter(currentEncounter.id));
                      }}
                      className="w-7 h-7 rounded-[6px] bg-surface-2 text-text-primary font-black text-xs hover:bg-danger/30 transition touch-target min-w-[44px] flex items-center justify-center border border-border"
                    >
                      -1
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        const next = Math.min(p.maxHp, p.hp + 1);
                        api.updateEncounterParticipant(currentEncounter.id, p.id, {
                          hp: next,
                          status: next > 0 && p.status === 'defeated' ? 'active' : p.status
                        }).then(() => loadSelectedEncounter(currentEncounter.id));
                      }}
                      className="w-7 h-7 rounded-[6px] bg-surface-2 text-text-primary font-black text-xs hover:bg-success/30 transition touch-target min-w-[44px] flex items-center justify-center border border-border"
                    >
                      +1
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setKeypadTarget(p);
                        setKeypadAmount('');
                      }}
                      className="px-2 h-7 rounded-[6px] bg-accent/15 hover:bg-accent/25 text-accent font-black text-xs transition touch-target min-w-[44px] flex items-center justify-center border border-accent/30"
                    >
                      کیپد
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-surface overflow-hidden border border-border">
                  <div
                    className={`h-full transition-all duration-300 ${
                      p.hp / p.maxHp > 0.5 ? 'bg-success' :
                      p.hp / p.maxHp > 0.25 ? 'bg-accent' : 'bg-danger'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, (p.hp / (p.maxHp || 1)) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Conditions Chips & Add Tag Button */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {(p.conditions || []).map((cond, cIdx) => (
                  <span
                    key={cIdx}
                    className="text-xs bg-danger/15 text-danger border border-danger/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"
                  >
                    <span>{cond}</span>
                    <Button
                      type="button"
                      onClick={() => handleToggleCondition(p, cond)}
                      className="hover:text-danger"
                    >
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  </span>
                ))}

                <Button
                  type="button"
                  onClick={() => setConditionTarget(p)}
                  className="text-xs bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text-primary border border-border px-2 py-0.5 rounded-full flex items-center gap-1 transition touch-target min-w-[44px]"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>وضعیت / حالت</span>
                </Button>
              </div>

              {/* Action Dropdown Menu if Active */}
              {activeMenuParticipantId === p.id && (
                <div className="p-2.5 rounded-[10px] bg-surface border border-border space-y-1.5 text-xs animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-border">
                    <span className="font-bold text-accent">عملیات پیشرفته برای {p.instanceName}</span>
                    <Button onClick={() => setActiveMenuParticipantId(null)}>
                      <X className="w-3.5 h-3.5 text-text-muted" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <Button
                      type="button"
                      onClick={() => handleDuplicateParticipant(p)}
                      className="p-1.5 rounded-[6px] bg-surface-2 hover:bg-surface-3 text-text-primary text-start font-semibold flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-text-muted" />
                      <span>تکثیر این موجود</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={async () => {
                        const next = p.status === 'defeated' ? 'active' : 'defeated';
                        await api.updateEncounterParticipant(currentEncounter.id, p.id, { status: next });
                        setActiveMenuParticipantId(null);
                        loadSelectedEncounter(currentEncounter.id);
                      }}
                      className="p-1.5 rounded-[6px] bg-surface-2 hover:bg-surface-3 text-text-primary text-start font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span>{p.status === 'defeated' ? 'احیا / بازگشت' : 'شکست‌خورده'}</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={async () => {
                        const phaseInput = prompt('نام فاز جدید (مثال: فاز 2 - شعله‌های سرخ):', p.phase || '');
                        if (phaseInput !== null) {
                          await api.updateEncounterParticipant(currentEncounter.id, p.id, { phase: phaseInput.trim() || null });
                          setActiveMenuParticipantId(null);
                          loadSelectedEncounter(currentEncounter.id);
                        }
                      }}
                      className="p-1.5 rounded-[6px] bg-surface-2 hover:bg-surface-3 text-text-primary text-start font-semibold flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-role-codm" />
                      <span>تغییر فاز باس</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={async () => {
                        if (confirm(`حذف ${p.instanceName} از مبارزه؟`)) {
                          await api.deleteEncounterParticipant(currentEncounter.id, p.id);
                          setActiveMenuParticipantId(null);
                          loadSelectedEncounter(currentEncounter.id);
                        }
                      }}
                      className="p-1.5 rounded-[6px] bg-danger/15 hover:bg-danger/25 text-danger-hover text-start font-semibold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف از مبارزه</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Bar (§2.5) */}
      <div className="fixed bottom-0 inset-x-0 z-40 surface-card border-t border-border p-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] backdrop-blur-md bg-surface/98 shadow-[0_-4px_25px_rgba(0,0,0,0.8)]">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <Button
            type="button"
            onClick={handlePrevTurn}
            className="p-2.5 rounded-[12px] bg-surface-2 text-text-primary border border-border hover:bg-surface-3 transition touch-target min-w-[44px] flex items-center justify-center shrink-0"
            title="نوبت قبل"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>

          <Button
            type="button"
            onClick={handleNextTurn}
            className="flex-1 py-3 px-4 rounded-[12px] bg-accent hover:bg-accent-hover text-on-accent font-black text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-97 touch-target min-w-[44px]"
          >
            <span>نوبت بعد</span>
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Button
            type="button"
            onClick={() => setAddMonstersSheet(true)}
            className="py-3 px-3.5 rounded-[12px] bg-surface-2 text-text-primary border border-border hover:border-accent/50 transition touch-target min-w-[44px] flex items-center gap-1.5 text-xs font-extrabold shrink-0"
          >
            <Plus className="w-4 h-4 text-accent" />
            <span>کمکی</span>
          </Button>

          <Button
            type="button"
            onClick={() => setCustomEventSheet(true)}
            className="p-2.5 rounded-[12px] bg-surface-2 text-text-muted hover:text-text-primary border border-border transition touch-target min-w-[44px] shrink-0"
            title="افزودن پیام در لاگ وقایع نبرد برای بازیکنان"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </Button>

          <Button
            type="button"
            onClick={() => setHandoutsSheet(true)}
            className="p-2.5 rounded-[12px] bg-surface-2 text-success hover:text-white border border-border hover:border-success/50 transition touch-target min-w-[44px] shrink-0"
            title="اسناد و نقشه‌ها (آشکارسازی سریع در حین نبرد)"
          >
            <MapIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Sheet 1: Add Monsters & Reinforcements (§2.2 & §2.4) */}
      <BottomSheet
        isOpen={addMonstersSheet}
        onClose={() => setAddMonstersSheet(false)}
        title="افزودن هیولا یا نیروی کمکی"
      >
        <div className="space-y-4 pb-4" dir="rtl">
          {/* Subtabs: Library / Custom / Party */}
          <div className="surface-card rounded-[10px] p-1 border border-border flex items-center gap-1">
            <Button
              type="button"
              onClick={() => setAddMonsterSubTab('library')}
              className={`flex-1 py-1.5 px-2 rounded-[8px] text-xs font-bold transition ${
                addMonsterSubTab === 'library' ? 'bg-accent text-on-accent' : 'text-text-muted'
              }`}
            >
              از کتابخانه
            </Button>
            <Button
              type="button"
              onClick={() => setAddMonsterSubTab('party')}
              className={`flex-1 py-1.5 px-2 rounded-[8px] text-xs font-bold transition ${
                addMonsterSubTab === 'party' ? 'bg-accent text-on-accent' : 'text-text-muted'
              }`}
            >
              کاراکترهای گروه
            </Button>
            <Button
              type="button"
              onClick={() => setAddMonsterSubTab('custom')}
              className={`flex-1 py-1.5 px-2 rounded-[8px] text-xs font-bold transition ${
                addMonsterSubTab === 'custom' ? 'bg-accent text-on-accent' : 'text-text-muted'
              }`}
            >
              سفارشی سریع
            </Button>
          </div>

          {/* Subtab 1: Library */}
          {addMonsterSubTab === 'library' && (
            <div className="space-y-3">
              <div>
                <Input noWrapper
                  type="text"
                  placeholder="جستجو در موجودات..."
                  value={monsterSearch}
                  onChange={(e) => setMonsterSearch(e.target.value)}
                  className="w-full bg-surface text-text-primary p-2 rounded-[8px] border border-border text-xs"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-[10px] p-1 bg-bg">
                {npcs
                  .filter(n => !monsterSearch || n.name.toLowerCase().includes(monsterSearch.toLowerCase()))
                  .map(n => (
                    <Button
                      type="button"
                      key={n.id}
                      onClick={() => setSelectedNpcId(n.id)}
                      className={`w-full text-start p-2 rounded-[6px] text-xs transition flex flex-wrap items-center justify-between gap-2 ${
                        selectedNpcId === n.id ? 'bg-accent text-on-accent font-black' : 'text-text-primary hover:bg-surface-2'
                      }`}
                    >
                      <span className="truncate">{n.name}</span>
                      <span className="text-xs opacity-80">HP: {n.hp.max} • AC: {n.ac}</span>
                    </Button>
                  ))}
              </div>

              {/* Quantity Counter (§2.2) */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-[8px] bg-surface border border-border">
                <span className="text-xs text-text-primary font-bold">تعداد (شماره‌گذاری خودکار 1…4):</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setMonsterQuantity(q => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded bg-surface-2 text-text-primary font-bold"
                  >
                    -
                  </Button>
                  <span className="w-6 text-center font-black text-sm text-accent">{monsterQuantity}</span>
                  <Button
                    type="button"
                    onClick={() => setMonsterQuantity(q => Math.min(12, q + 1))}
                    className="w-7 h-7 rounded bg-surface-2 text-text-primary font-bold"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Minions grouping & Visibility options */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-xs text-text-muted mb-1 font-bold">دید اولیه بازیکنان:</label>
                  <Select noWrapper
                    value={monsterVisibility}
                    onChange={(e) => setMonsterVisibility(e.target.value as ParticipantVisibility)}
                    className="w-full bg-surface text-text-primary p-2 rounded-[8px] border border-border text-xs"
                  >
                    <option value="revealed">آشکار (نام کامل)</option>
                    <option value="announced">ناشناخته (موجود ناشناخته)</option>
                    <option value="hidden">مخفی (کاملاً پنهان)</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs text-text-muted mb-1 font-bold">محاسبه HP:</label>
                  <Select noWrapper
                    value={monsterHpMode}
                    onChange={(e) => setMonsterHpMode(e.target.value as any)}
                    className="w-full bg-surface text-text-primary p-2 rounded-[8px] border border-border text-xs"
                  >
                    <option value="default">HP پیش‌فرض الگو</option>
                    <option value="roll">پرتاب تاس برای هر موجود</option>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-[8px] bg-surface border border-border">
                <label className="text-xs text-text-primary font-bold cursor-pointer">گروه‌بندی سربازان (تقسیم آسیب یکجا)</label>
                <Input noWrapper
                  type="checkbox"
                  checked={isMinionGroup}
                  onChange={(e) => setIsMinionGroup(e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
              </div>

              {/* Reinforcements announcement (§2.4) */}
              <div className="space-y-1.5 p-2 rounded-[8px] bg-surface border border-border">
                <label className="flex flex-wrap items-center justify-between gap-2 text-xs text-accent font-bold cursor-pointer">
                  <span>ارسال پیام ورود نیروی کمکی به بازیکنان</span>
                  <Input noWrapper
                    type="checkbox"
                    checked={announceReinforcements}
                    onChange={(e) => setAnnounceReinforcements(e.target.checked)}
                    className="w-4 h-4 accent-accent"
                  />
                </label>
                {announceReinforcements && (
                  <Input noWrapper
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="w-full bg-bg text-text-primary p-1.5 rounded-[6px] border border-border text-xs"
                  />
                )}
              </div>
            </div>
          )}

          {/* Subtab 2: Custom */}
          {addMonsterSubTab === 'custom' && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs text-text-muted mb-1">نام موجود:</label>
                <Input noWrapper
                  type="text"
                  value={customMonster.name}
                  onChange={(e) => setCustomMonster(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-surface text-text-primary p-2 rounded-[8px] border border-border text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-text-muted mb-1">HP:</label>
                  <Input noWrapper
                    type="number"
                    value={customMonster.hp}
                    onChange={(e) => setCustomMonster(prev => ({ ...prev, hp: parseInt(e.target.value) || 10 }))}
                    className="w-full bg-surface text-text-primary p-2 rounded-[8px] border border-border text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">AC:</label>
                  <Input noWrapper
                    type="text"
                    value={customMonster.ac}
                    onChange={(e) => setCustomMonster(prev => ({ ...prev, ac: e.target.value }))}
                    className="w-full bg-surface text-text-primary p-2 rounded-[8px] border border-border text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">ابتکار:</label>
                  <Input noWrapper
                    type="number"
                    value={customMonster.initiative}
                    onChange={(e) => setCustomMonster(prev => ({ ...prev, initiative: e.target.value }))}
                    placeholder="اختیاری"
                    className="w-full bg-surface text-text-primary p-2 rounded-[8px] border border-border text-xs text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Subtab 3: Party Characters */}
          {addMonsterSubTab === 'party' && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-border">
                <span className="text-xs font-bold text-text-muted">انتخاب کاراکترها:</span>
                <Button
                  type="button"
                  onClick={() => setSelectedPartyCharIds(characters.map(c => c.id))}
                  className="text-xs text-accent font-bold"
                >
                  انتخاب همه
                </Button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {characters.map(c => {
                  const isChecked = selectedPartyCharIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-[8px] bg-surface border border-border cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-bold text-text-primary block">{c.name}</span>
                        <span className="text-xs text-text-muted">{c.className} • HP: {c.hp.current}/{c.hp.max}</span>
                      </div>
                      <Input noWrapper
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPartyCharIds(prev => [...prev, c.id]);
                          else setSelectedPartyCharIds(prev => prev.filter(id => id !== c.id));
                        }}
                        className="w-4 h-4 accent-accent"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={handleAddMonsters}
            className="w-full py-2.5 rounded-[10px] bg-accent text-on-accent font-black text-sm hover:bg-accent-hover transition shadow-md touch-target min-w-[44px]"
          >
            افزودن به مبارزه
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
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
              <Button
                type="button"
                key={k}
                onClick={() => {
                  if (k === 'C') setKeypadAmount('');
                  else if (k === '⌫') setKeypadAmount(prev => prev.slice(0, -1));
                  else setKeypadAmount(prev => (prev.length < 4 ? prev + k : prev));
                }}
                className={`py-3 rounded-[10px] font-black text-lg transition touch-target min-w-[44px] flex items-center justify-center ${
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
              className="py-3 rounded-[10px] bg-danger hover:bg-danger/90 text-white font-black text-sm transition disabled:opacity-40 touch-target min-w-[44px]"
            >
              وارد کردن آسیب
            </Button>
            <Button
              type="button"
              onClick={() => handleApplyKeypad(true)}
              disabled={!keypadAmount}
              className="py-3 rounded-[10px] bg-success hover:bg-success/90 text-on-accent font-black text-sm transition disabled:opacity-40 touch-target min-w-[44px]"
            >
              اعمال درمان
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
        <div className="space-y-2 pb-2" dir="rtl">
          {availableConditions.map(cond => {
            const isApplied = conditionTarget?.conditions?.includes(cond);
            return (
              <Button
                type="button"
                key={cond}
                onClick={() => conditionTarget && handleToggleCondition(conditionTarget, cond)}
                className={`w-full p-2.5 rounded-[10px] text-xs font-bold transition flex flex-wrap items-center justify-between gap-2 touch-target min-w-[44px] ${
                  isApplied
                    ? 'bg-danger/20 text-danger border border-danger/40'
                    : 'bg-surface text-text-primary border border-border hover:bg-surface-2'
                }`}
              >
                <span>{cond}</span>
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
            تایید و ثبت نهایی پایان نبرد
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
    </div>
  );
};
