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
  MoreVertical, Sparkles, Award, Lock, MapPin, X, MessageSquarePlus
} from 'lucide-react';

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

  // New Encounter Form State
  const [newEncForm, setNewEncForm] = useState({
    name: 'نبرد جدید',
    locationId: '',
    sessionTag: 'جلسه ۱',
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
    ac: '۱۳',
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
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#EDE6D8]">مدیریت مبارزات زروانیا</h2>
            <p className="text-xs text-[#A39A89]">کنترل نبردهای زنده، ترتیب ابتکار عمل و اشتراک با بازیکنان</p>
          </div>

          <button
            type="button"
            onClick={() => setNewEncounterSheet(true)}
            className="bg-[#E0A030] text-[#0E0D0C] font-extrabold px-3.5 py-2 rounded-[12px] flex items-center gap-1.5 hover:bg-[#F2C265] transition shadow-md touch-target shrink-0 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>نبرد جدید</span>
          </button>
        </div>

        {/* List Tabs (§2.7: Draft / Active / Ended) */}
        <div className="surface-card rounded-[12px] p-1 border border-[#2F2A23] flex items-center gap-1">
          <button
            type="button"
            onClick={() => setListTab('active')}
            className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
              listTab === 'active'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>در حال نبرد ({encounters.filter(e => e.status === 'active' || e.status === 'paused').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setListTab('draft')}
            className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
              listTab === 'draft'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>پیش‌نویس ({encounters.filter(e => e.status === 'draft').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setListTab('ended')}
            className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
              listTab === 'ended'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
                : 'text-[#A39A89] hover:text-[#EDE6D8]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>پایان‌یافته ({encounters.filter(e => e.status === 'ended').length})</span>
          </button>
        </div>

        {/* Encounters grouped by location */}
        {Object.keys(groupedByLocation).length === 0 ? (
          <div className="p-8 text-center surface-card rounded-[14px] border border-[#2F2A23]">
            <Swords className="w-10 h-10 text-[#A39A89] mx-auto mb-2 opacity-50" />
            <p className="text-sm text-[#A39A89]">مبارزه‌ای در این بخش یافت نشد.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByLocation).map(([locName, groupList]) => (
              <div key={locName} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#E0A030]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{locName}</span>
                  <span className="text-[10px] text-[#A39A89]">({groupList.length} نبرد)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupList.map(enc => (
                    <div
                      key={enc.id}
                      className="surface-card rounded-[14px] p-4 border border-[#2F2A23] hover:border-[#E0A030]/40 transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-sm text-[#EDE6D8]">{enc.name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#A39A89] mt-0.5">
                            {enc.sessionTag && <span>{enc.sessionTag}</span>}
                            <span>•</span>
                            <span>دور {enc.round || 0}</span>
                            <span>•</span>
                            <span>{enc.participants?.length || 0} شرکت‌کننده</span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          enc.status === 'active' ? 'bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30 animate-pulse' :
                          enc.status === 'paused' ? 'bg-[#E0A030]/20 text-[#E0A030] border border-[#E0A030]/30' :
                          enc.status === 'ended' ? 'bg-[#A39A89]/20 text-[#A39A89]' :
                          'bg-[#C2512B]/20 text-[#C2512B] border border-[#C2512B]/30'
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
                            className={`text-[10px] px-2 py-0.5 rounded-[6px] shrink-0 ${
                              p.kind === 'character' ? 'bg-[#6F9E78]/15 text-[#6F9E78]' : 'bg-[#171513] text-[#EDE6D8] border border-[#2F2A23]'
                            }`}
                          >
                            {p.instanceName}
                          </span>
                        ))}
                        {(enc.participants?.length || 0) > 5 && (
                          <span className="text-[10px] text-[#A39A89]">+{enc.participants.length - 5}</span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#2F2A23] text-xs">
                        <button
                          type="button"
                          onClick={() => handleDuplicateEncounter(enc)}
                          className="text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1 font-bold touch-target p-1"
                          title="تکثیر این نبرد به عنوان الگوی جدید"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>تکثیر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedEncounterId(enc.id)}
                          className="bg-[#E0A030]/15 hover:bg-[#E0A030]/25 text-[#E0A030] font-extrabold px-3 py-1.5 rounded-[8px] flex items-center gap-1.5 transition touch-target"
                        >
                          <span>ورود به رانر</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
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
              <label className="block text-xs font-bold text-[#A39A89] mb-1">
                نام نبرد <span className="text-[#C2512B]">*</span>
              </label>
              <input
                type="text"
                required
                value={newEncForm.name}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: شبیخون در بیشه بلورین"
                className="w-full bg-[#171513] text-[#EDE6D8] p-2.5 rounded-[10px] border border-[#2F2A23] focus:border-[#E0A030] focus:outline-none text-sm touch-target"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A39A89] mb-1">
                محل رویداد (مکان)
              </label>
              <select
                value={newEncForm.locationId}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, locationId: e.target.value }))}
                className="w-full bg-[#171513] text-[#EDE6D8] p-2.5 rounded-[10px] border border-[#2F2A23] focus:border-[#E0A030] focus:outline-none text-sm touch-target"
              >
                <option value="">بدون مکان پیوندخورده</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.region})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A39A89] mb-1">برچسب جلسه</label>
              <input
                type="text"
                value={newEncForm.sessionTag}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, sessionTag: e.target.value }))}
                placeholder="مثال: جلسه ۴"
                className="w-full bg-[#171513] text-[#EDE6D8] p-2.5 rounded-[10px] border border-[#2F2A23] focus:border-[#E0A030] focus:outline-none text-sm touch-target"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#C2512B] mb-1">یادداشت‌های محرمانه مستر</label>
              <textarea
                rows={2}
                value={newEncForm.dmNotes}
                onChange={(e) => setNewEncForm(prev => ({ ...prev, dmNotes: e.target.value }))}
                placeholder="رویدادهای محیطی در دور ۳، نقاط ضعف یا تاکتیک‌ها..."
                className="w-full bg-[#171513] text-[#EDE6D8] p-2.5 rounded-[10px] border border-[#C2512B]/40 focus:border-[#C2512B] focus:outline-none text-sm touch-target"
              />
            </div>

            {/* Visibility Settings for Players (§1 & §3) */}
            <div className="space-y-2 p-3 rounded-[12px] bg-[#171513] border border-[#2F2A23]">
              <span className="text-xs font-extrabold text-[#E0A030] block mb-1">تنظیمات مشاهده بازیکنان</span>

              <label className="flex items-center justify-between text-xs text-[#EDE6D8] cursor-pointer">
                <span>نمایش عدد دقیق HP هیولاها به بازیکنان</span>
                <input
                  type="checkbox"
                  checked={newEncForm.settings.showExactHp}
                  onChange={(e) => setNewEncForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showExactHp: e.target.checked }
                  }))}
                  className="w-4 h-4 accent-[#E0A030]"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-[#EDE6D8] cursor-pointer">
                <span>نمایش عدد دقیق زره (AC) هیولاها</span>
                <input
                  type="checkbox"
                  checked={newEncForm.settings.showAc}
                  onChange={(e) => setNewEncForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showAc: e.target.checked }
                  }))}
                  className="w-4 h-4 accent-[#E0A030]"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-[#EDE6D8] cursor-pointer">
                <span>اجازه به بازیکن برای پرتاب تاس ابتکار عمل خود</span>
                <input
                  type="checkbox"
                  checked={newEncForm.settings.playerInitiativeRolls}
                  onChange={(e) => setNewEncForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, playerInitiativeRolls: e.target.checked }
                  }))}
                  className="w-4 h-4 accent-[#E0A030]"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-[#EDE6D8] cursor-pointer">
                <span>نمایش وضعیت‌ها و حالات منفی به بازیکنان</span>
                <input
                  type="checkbox"
                  checked={newEncForm.settings.showConditions}
                  onChange={(e) => setNewEncForm(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showConditions: e.target.checked }
                  }))}
                  className="w-4 h-4 accent-[#E0A030]"
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-[10px] bg-[#E0A030] text-[#0E0D0C] font-extrabold text-sm hover:bg-[#F2C265] transition shadow-md touch-target"
            >
              ایجاد نبرد و ورود به رانر
            </button>
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
      <div className="sticky top-[52px] z-10 surface-card rounded-[14px] p-3 border border-[#2F2A23] shadow-lg backdrop-blur-md bg-[#171513]/95 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setSelectedEncounterId(null)}
            className="p-1.5 rounded-[8px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] transition touch-target shrink-0"
            title="بازگشت به لیست نبردها"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-sm text-[#EDE6D8] truncate">{currentEncounter.name}</h2>
              {locationEntry && (
                <Chip variant="region" region={locationEntry.region as any} label={locationEntry.name} />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#A39A89] mt-0.5">
              <span className="font-bold text-[#E0A030]">دور {currentEncounter.round || 1}</span>
              <span>•</span>
              <span className={`font-bold ${
                currentEncounter.status === 'active' ? 'text-[#6F9E78]' :
                currentEncounter.status === 'paused' ? 'text-[#E0A030]' :
                currentEncounter.status === 'ended' ? 'text-[#A39A89]' : 'text-[#C2512B]'
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
              <button
                type="button"
                onClick={() => handleStartEncounter(false)}
                className="bg-[#6F9E78] hover:bg-[#6F9E78]/90 text-[#0E0D0C] font-black text-xs px-3 py-1.5 rounded-[8px] flex items-center gap-1 transition shadow-sm touch-target"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>شروع نبرد</span>
              </button>
              <button
                type="button"
                onClick={() => handleStartEncounter(true)}
                className="bg-[#201D19] text-[#E0A030] hover:text-[#F2C265] text-xs px-2 py-1.5 rounded-[8px] border border-[#2F2A23] transition touch-target"
                title="شروع نبرد با دور غافلگیری (موجودات مخفی پنهان می‌مانند)"
              >
                دور غافلگیری
              </button>
            </div>
          ) : currentEncounter.status === 'active' || currentEncounter.status === 'paused' ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleTogglePause}
                className={`text-xs px-2.5 py-1.5 rounded-[8px] font-bold transition flex items-center gap-1 touch-target ${
                  currentEncounter.status === 'paused'
                    ? 'bg-[#E0A030] text-[#0E0D0C]'
                    : 'bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8]'
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
              </button>

              <button
                type="button"
                onClick={handleOpenEndLoot}
                className="bg-[#C2512B]/20 text-[#D66138] hover:bg-[#C2512B]/30 text-xs px-2.5 py-1.5 rounded-[8px] font-bold transition touch-target"
              >
                پایان نبرد
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenEndLoot}
              className="bg-[#E0A030]/20 text-[#E0A030] text-xs px-2.5 py-1.5 rounded-[8px] font-bold transition touch-target flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" />
              <span>گزارش و لوت</span>
            </button>
          )}
        </div>
      </div>

      {/* Unplaced Strip (§2.4: Added without initiative) */}
      {unplacedParticipants.length > 0 && (
        <div className="surface-card rounded-[14px] p-3 border border-[#E0A030]/40 bg-[#E0A030]/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#E0A030]">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>موجودات نیازمند تعیین ابتکار عمل ({unplacedParticipants.length})</span>
            </span>
            <span className="text-[10px] text-[#A39A89]">در صف نوبت‌دهی قرار ندارند</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unplacedParticipants.map(p => (
              <div
                key={p.id}
                className="surface-2-card rounded-[10px] p-2 border border-[#2F2A23] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#EDE6D8] block truncate">{p.instanceName}</span>
                  <span className="text-[10px] text-[#A39A89]">HP: {p.hp}/{p.maxHp} • AC: {p.ac}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const roll = Math.floor(Math.random() * 20) + 1;
                      handleConfirmInitiative(p, roll);
                    }}
                    className="p-1 rounded-[6px] bg-[#201D19] text-[#E0A030] hover:text-[#F2C265] text-xs flex items-center gap-1 touch-target border border-[#2F2A23]"
                    title="پرتاب تصادفی 1d20"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>تاس</span>
                  </button>
                  <input
                    type="number"
                    placeholder="ابتکار"
                    className="w-14 bg-[#171513] text-[#EDE6D8] text-center text-xs p-1 rounded-[6px] border border-[#2F2A23] focus:border-[#E0A030] focus:outline-none"
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
                  ? 'border-[#E0A030] ring-1 ring-[#E0A030]/50 shadow-[0_0_15px_rgba(224,160,48,0.2)] bg-[#201D19]'
                  : isDefeated
                  ? 'border-[#2F2A23] opacity-60 bg-[#171513]/40'
                  : 'border-[#2F2A23] hover:border-[#E0A030]/30'
              }`}
            >
              {/* Row Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Initiative Value Badge */}
                  <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-xs font-black shrink-0 ${
                    p.initiativeStatus === 'pending'
                      ? 'bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/50 animate-pulse'
                      : isCurrentTurn
                      ? 'bg-[#E0A030] text-[#0E0D0C]'
                      : 'bg-[#201D19] text-[#EDE6D8] border border-[#2F2A23]'
                  }`}>
                    {p.initiative ?? '-'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-[#EDE6D8] truncate">{p.instanceName}</h4>

                      {isCurrentTurn && (
                        <span className="text-[10px] bg-[#E0A030] text-[#0E0D0C] font-black px-1.5 py-0.2 rounded-full">
                          نوبت جاری
                        </span>
                      )}

                      {p.phase && (
                        <span className="text-[10px] bg-[#9B72CF]/20 text-[#9B72CF] px-1.5 py-0.2 rounded-full border border-[#9B72CF]/30">
                          {p.phase}
                        </span>
                      )}

                      {isCharacter && (
                        <span className="text-[10px] bg-[#6F9E78]/20 text-[#6F9E78] px-1.5 py-0.2 rounded-full font-bold">
                          شخصیت
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#A39A89] mt-0.5">
                      <span>AC: <b className="text-[#EDE6D8]">{p.ac}</b></span>
                      {p.groupId && <span>• گروه سربازان</span>}
                      {p.initiativeStatus === 'pending' && (
                        <span className="text-[#F2C265] font-bold flex items-center gap-1">
                          (پرتاب بازیکن: {p.initiative})
                          <button
                            type="button"
                            onClick={() => handleConfirmInitiative(p)}
                            className="bg-[#E0A030] text-black px-1.5 py-0.2 rounded text-[10px] font-black"
                          >
                            تایید
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls: Visibility Eye & Action Menu */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCycleVisibility(p)}
                    title={`وضعیت دید بازیکنان: ${
                      p.visibility === 'revealed' ? 'آشکار کامل' :
                      p.visibility === 'announced' ? 'ناشناخته (بدون آمار)' : 'مخفی'
                    }`}
                    className={`p-1.5 rounded-[8px] transition touch-target ${
                      p.visibility === 'revealed' ? 'bg-[#6F9E78]/20 text-[#6F9E78]' :
                      p.visibility === 'announced' ? 'bg-[#E0A030]/20 text-[#E0A030]' :
                      'bg-[#C2512B]/20 text-[#D66138]'
                    }`}
                  >
                    {p.visibility === 'revealed' ? <Eye className="w-4 h-4" /> :
                     p.visibility === 'announced' ? <Shield className="w-4 h-4" /> :
                     <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMenuParticipantId(activeMenuParticipantId === p.id ? null : p.id)}
                    className="p-1.5 rounded-[8px] hover:bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] transition touch-target"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* HP Bar and Direct Controls */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#EDE6D8]">{p.hp} / {p.maxHp} HP</span>
                    <span className="text-[10px] text-[#A39A89]">({Math.round((p.hp / (p.maxHp || 1)) * 100)}%)</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(0, p.hp - 1);
                        api.updateEncounterParticipant(currentEncounter.id, p.id, {
                          hp: next,
                          status: next === 0 ? 'defeated' : p.status
                        }).then(() => loadSelectedEncounter(currentEncounter.id));
                      }}
                      className="w-7 h-7 rounded-[6px] bg-[#201D19] text-[#EDE6D8] font-black text-xs hover:bg-[#C2512B]/30 transition touch-target flex items-center justify-center border border-[#2F2A23]"
                    >
                      -۱
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(p.maxHp, p.hp + 1);
                        api.updateEncounterParticipant(currentEncounter.id, p.id, {
                          hp: next,
                          status: next > 0 && p.status === 'defeated' ? 'active' : p.status
                        }).then(() => loadSelectedEncounter(currentEncounter.id));
                      }}
                      className="w-7 h-7 rounded-[6px] bg-[#201D19] text-[#EDE6D8] font-black text-xs hover:bg-[#6F9E78]/30 transition touch-target flex items-center justify-center border border-[#2F2A23]"
                    >
                      +۱
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKeypadTarget(p);
                        setKeypadAmount('');
                      }}
                      className="px-2 h-7 rounded-[6px] bg-[#E0A030]/15 hover:bg-[#E0A030]/25 text-[#E0A030] font-black text-xs transition touch-target flex items-center justify-center border border-[#E0A030]/30"
                    >
                      کیپد
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[#171513] overflow-hidden border border-[#2F2A23]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      p.hp / p.maxHp > 0.5 ? 'bg-[#6F9E78]' :
                      p.hp / p.maxHp > 0.25 ? 'bg-[#E0A030]' : 'bg-[#C2512B]'
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
                    className="text-[10px] bg-[#C2512B]/15 text-[#E8836B] border border-[#C2512B]/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"
                  >
                    <span>{cond}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleCondition(p, cond)}
                      className="hover:text-[#E8836B]"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}

                <button
                  type="button"
                  onClick={() => setConditionTarget(p)}
                  className="text-[10px] bg-[#201D19] hover:bg-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23] px-2 py-0.5 rounded-full flex items-center gap-1 transition touch-target"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>وضعیت / حالت</span>
                </button>
              </div>

              {/* Action Dropdown Menu if Active */}
              {activeMenuParticipantId === p.id && (
                <div className="p-2.5 rounded-[10px] bg-[#171513] border border-[#2F2A23] space-y-1.5 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-[#2F2A23]">
                    <span className="font-bold text-[#E0A030]">عملیات پیشرفته برای {p.instanceName}</span>
                    <button onClick={() => setActiveMenuParticipantId(null)}>
                      <X className="w-3.5 h-3.5 text-[#A39A89]" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicateParticipant(p)}
                      className="p-1.5 rounded-[6px] bg-[#201D19] hover:bg-[#2F2A23] text-[#EDE6D8] text-right font-semibold flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#A39A89]" />
                      <span>تکثیر این موجود</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const next = p.status === 'defeated' ? 'active' : 'defeated';
                        await api.updateEncounterParticipant(currentEncounter.id, p.id, { status: next });
                        setActiveMenuParticipantId(null);
                        loadSelectedEncounter(currentEncounter.id);
                      }}
                      className="p-1.5 rounded-[6px] bg-[#201D19] hover:bg-[#2F2A23] text-[#EDE6D8] text-right font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#6F9E78]" />
                      <span>{p.status === 'defeated' ? 'احیا / بازگشت' : 'شکست‌خورده'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const phaseInput = prompt('نام فاز جدید (مثال: فاز ۲ - شعله‌های سرخ):', p.phase || '');
                        if (phaseInput !== null) {
                          await api.updateEncounterParticipant(currentEncounter.id, p.id, { phase: phaseInput.trim() || null });
                          setActiveMenuParticipantId(null);
                          loadSelectedEncounter(currentEncounter.id);
                        }
                      }}
                      className="p-1.5 rounded-[6px] bg-[#201D19] hover:bg-[#2F2A23] text-[#EDE6D8] text-right font-semibold flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#9B72CF]" />
                      <span>تغییر فاز باس</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`حذف ${p.instanceName} از مبارزه؟`)) {
                          await api.deleteEncounterParticipant(currentEncounter.id, p.id);
                          setActiveMenuParticipantId(null);
                          loadSelectedEncounter(currentEncounter.id);
                        }
                      }}
                      className="p-1.5 rounded-[6px] bg-[#C2512B]/15 hover:bg-[#C2512B]/25 text-[#D66138] text-right font-semibold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف از مبارزه</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Bar (§2.5) */}
      <div className="fixed bottom-0 inset-x-0 z-20 surface-card border-t border-[#2F2A23] p-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] backdrop-blur-md bg-[#171513]/95 shadow-[0_-4px_25px_rgba(0,0,0,0.8)]">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevTurn}
            className="p-2.5 rounded-[12px] bg-[#201D19] text-[#EDE6D8] border border-[#2F2A23] hover:bg-[#2F2A23] transition touch-target flex items-center justify-center shrink-0"
            title="نوبت قبل"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNextTurn}
            className="flex-1 py-3 px-4 rounded-[12px] bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] font-black text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-97 touch-target"
          >
            <span>نوبت بعد</span>
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setAddMonstersSheet(true)}
            className="py-3 px-3.5 rounded-[12px] bg-[#201D19] text-[#EDE6D8] border border-[#2F2A23] hover:border-[#E0A030]/50 transition touch-target flex items-center gap-1.5 text-xs font-extrabold shrink-0"
          >
            <Plus className="w-4 h-4 text-[#E0A030]" />
            <span>کمکی</span>
          </button>

          <button
            type="button"
            onClick={() => setCustomEventSheet(true)}
            className="p-2.5 rounded-[12px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23] transition touch-target shrink-0"
            title="افزودن پیام در لاگ وقایع نبرد برای بازیکنان"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
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
          <div className="surface-card rounded-[10px] p-1 border border-[#2F2A23] flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAddMonsterSubTab('library')}
              className={`flex-1 py-1.5 px-2 rounded-[8px] text-xs font-bold transition ${
                addMonsterSubTab === 'library' ? 'bg-[#E0A030] text-[#0E0D0C]' : 'text-[#A39A89]'
              }`}
            >
              از کتابخانه
            </button>
            <button
              type="button"
              onClick={() => setAddMonsterSubTab('party')}
              className={`flex-1 py-1.5 px-2 rounded-[8px] text-xs font-bold transition ${
                addMonsterSubTab === 'party' ? 'bg-[#E0A030] text-[#0E0D0C]' : 'text-[#A39A89]'
              }`}
            >
              کاراکترهای گروه
            </button>
            <button
              type="button"
              onClick={() => setAddMonsterSubTab('custom')}
              className={`flex-1 py-1.5 px-2 rounded-[8px] text-xs font-bold transition ${
                addMonsterSubTab === 'custom' ? 'bg-[#E0A030] text-[#0E0D0C]' : 'text-[#A39A89]'
              }`}
            >
              سفارشی سریع
            </button>
          </div>

          {/* Subtab 1: Library */}
          {addMonsterSubTab === 'library' && (
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="جستجو در موجودات..."
                  value={monsterSearch}
                  onChange={(e) => setMonsterSearch(e.target.value)}
                  className="w-full bg-[#171513] text-[#EDE6D8] p-2 rounded-[8px] border border-[#2F2A23] text-xs"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 border border-[#2F2A23] rounded-[10px] p-1 bg-[#0E0D0C]">
                {npcs
                  .filter(n => !monsterSearch || n.name.toLowerCase().includes(monsterSearch.toLowerCase()))
                  .map(n => (
                    <button
                      type="button"
                      key={n.id}
                      onClick={() => setSelectedNpcId(n.id)}
                      className={`w-full text-right p-2 rounded-[6px] text-xs transition flex items-center justify-between ${
                        selectedNpcId === n.id ? 'bg-[#E0A030] text-[#0E0D0C] font-black' : 'text-[#EDE6D8] hover:bg-[#201D19]'
                      }`}
                    >
                      <span className="truncate">{n.name}</span>
                      <span className="text-[10px] opacity-80">HP: {n.hp.max} • AC: {n.ac}</span>
                    </button>
                  ))}
              </div>

              {/* Quantity Counter (§2.2) */}
              <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#171513] border border-[#2F2A23]">
                <span className="text-xs text-[#EDE6D8] font-bold">تعداد (شماره‌گذاری خودکار ۱…۴):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMonsterQuantity(q => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded bg-[#201D19] text-[#EDE6D8] font-bold"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-black text-sm text-[#E0A030]">{monsterQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setMonsterQuantity(q => Math.min(12, q + 1))}
                    className="w-7 h-7 rounded bg-[#201D19] text-[#EDE6D8] font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Minions grouping & Visibility options */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-[#A39A89] mb-1 font-bold">دید اولیه بازیکنان:</label>
                  <select
                    value={monsterVisibility}
                    onChange={(e) => setMonsterVisibility(e.target.value as ParticipantVisibility)}
                    className="w-full bg-[#171513] text-[#EDE6D8] p-2 rounded-[8px] border border-[#2F2A23] text-xs"
                  >
                    <option value="revealed">آشکار (نام کامل)</option>
                    <option value="announced">ناشناخته (موجود ناشناخته)</option>
                    <option value="hidden">مخفی (کاملاً پنهان)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#A39A89] mb-1 font-bold">محاسبه HP:</label>
                  <select
                    value={monsterHpMode}
                    onChange={(e) => setMonsterHpMode(e.target.value as any)}
                    className="w-full bg-[#171513] text-[#EDE6D8] p-2 rounded-[8px] border border-[#2F2A23] text-xs"
                  >
                    <option value="default">HP پیش‌فرض الگو</option>
                    <option value="roll">پرتاب تاس برای هر موجود</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#171513] border border-[#2F2A23]">
                <label className="text-xs text-[#EDE6D8] font-bold cursor-pointer">گروه‌بندی سربازان (تقسیم آسیب یکجا)</label>
                <input
                  type="checkbox"
                  checked={isMinionGroup}
                  onChange={(e) => setIsMinionGroup(e.target.checked)}
                  className="w-4 h-4 accent-[#E0A030]"
                />
              </div>

              {/* Reinforcements announcement (§2.4) */}
              <div className="space-y-1.5 p-2 rounded-[8px] bg-[#171513] border border-[#2F2A23]">
                <label className="flex items-center justify-between text-xs text-[#E0A030] font-bold cursor-pointer">
                  <span>ارسال پیام ورود نیروی کمکی به بازیکنان</span>
                  <input
                    type="checkbox"
                    checked={announceReinforcements}
                    onChange={(e) => setAnnounceReinforcements(e.target.checked)}
                    className="w-4 h-4 accent-[#E0A030]"
                  />
                </label>
                {announceReinforcements && (
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="w-full bg-[#0E0D0C] text-[#EDE6D8] p-1.5 rounded-[6px] border border-[#2F2A23] text-xs"
                  />
                )}
              </div>
            </div>
          )}

          {/* Subtab 2: Custom */}
          {addMonsterSubTab === 'custom' && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-[#A39A89] mb-1">نام موجود:</label>
                <input
                  type="text"
                  value={customMonster.name}
                  onChange={(e) => setCustomMonster(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#171513] text-[#EDE6D8] p-2 rounded-[8px] border border-[#2F2A23] text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-[#A39A89] mb-1">HP:</label>
                  <input
                    type="number"
                    value={customMonster.hp}
                    onChange={(e) => setCustomMonster(prev => ({ ...prev, hp: parseInt(e.target.value) || 10 }))}
                    className="w-full bg-[#171513] text-[#EDE6D8] p-2 rounded-[8px] border border-[#2F2A23] text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A39A89] mb-1">AC:</label>
                  <input
                    type="text"
                    value={customMonster.ac}
                    onChange={(e) => setCustomMonster(prev => ({ ...prev, ac: e.target.value }))}
                    className="w-full bg-[#171513] text-[#EDE6D8] p-2 rounded-[8px] border border-[#2F2A23] text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#A39A89] mb-1">ابتکار:</label>
                  <input
                    type="number"
                    value={customMonster.initiative}
                    onChange={(e) => setCustomMonster(prev => ({ ...prev, initiative: e.target.value }))}
                    placeholder="اختیاری"
                    className="w-full bg-[#171513] text-[#EDE6D8] p-2 rounded-[8px] border border-[#2F2A23] text-xs text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Subtab 3: Party Characters */}
          {addMonsterSubTab === 'party' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#2F2A23]">
                <span className="text-xs font-bold text-[#A39A89]">انتخاب کاراکترها:</span>
                <button
                  type="button"
                  onClick={() => setSelectedPartyCharIds(characters.map(c => c.id))}
                  className="text-xs text-[#E0A030] font-bold"
                >
                  انتخاب همه
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {characters.map(c => {
                  const isChecked = selectedPartyCharIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded-[8px] bg-[#171513] border border-[#2F2A23] cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-bold text-[#EDE6D8] block">{c.name}</span>
                        <span className="text-[10px] text-[#A39A89]">{c.className} • HP: {c.hp.current}/{c.hp.max}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPartyCharIds(prev => [...prev, c.id]);
                          else setSelectedPartyCharIds(prev => prev.filter(id => id !== c.id));
                        }}
                        className="w-4 h-4 accent-[#E0A030]"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddMonsters}
            className="w-full py-2.5 rounded-[10px] bg-[#E0A030] text-[#0E0D0C] font-black text-sm hover:bg-[#F2C265] transition shadow-md touch-target"
          >
            افزودن به مبارزه
          </button>
        </div>
      </BottomSheet>

      {/* Sheet 2: Numeric Keypad Sheet (§2.5) */}
      <BottomSheet
        isOpen={!!keypadTarget}
        onClose={() => setKeypadTarget(null)}
        title={`محاسبه HP: ${keypadTarget?.instanceName}`}
      >
        <div className="space-y-3 pb-3 max-w-xs mx-auto" dir="rtl">
          <div className="p-3 rounded-[12px] bg-[#171513] border border-[#2F2A23] text-center">
            <span className="text-xs text-[#A39A89] block mb-1">مقدار تغییر:</span>
            <span className="text-2xl font-black text-[#E0A030] tracking-wider min-h-[36px] block">
              {keypadAmount || '۰'}
            </span>
            <span className="text-[11px] text-[#A39A89] mt-1 block">
              HP فعلی: {keypadTarget?.hp} / {keypadTarget?.maxHp}
            </span>
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
              <button
                type="button"
                key={k}
                onClick={() => {
                  if (k === 'C') setKeypadAmount('');
                  else if (k === '⌫') setKeypadAmount(prev => prev.slice(0, -1));
                  else setKeypadAmount(prev => (prev.length < 4 ? prev + k : prev));
                }}
                className={`py-3 rounded-[10px] font-black text-lg transition touch-target flex items-center justify-center ${
                  k === 'C' ? 'bg-[#C2512B]/20 text-[#E8836B]' :
                  k === '⌫' ? 'bg-[#201D19] text-[#A39A89]' :
                  'bg-[#201D19] text-[#EDE6D8] hover:bg-[#2F2A23]'
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleApplyKeypad(false)}
              disabled={!keypadAmount}
              className="py-3 rounded-[10px] bg-[#C2512B] hover:bg-[#C2512B]/90 text-white font-black text-sm transition disabled:opacity-40 touch-target"
            >
              وارد کردن آسیب
            </button>
            <button
              type="button"
              onClick={() => handleApplyKeypad(true)}
              disabled={!keypadAmount}
              className="py-3 rounded-[10px] bg-[#6F9E78] hover:bg-[#6F9E78]/90 text-[#0E0D0C] font-black text-sm transition disabled:opacity-40 touch-target"
            >
              اعمال درمان
            </button>
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
              <button
                type="button"
                key={cond}
                onClick={() => conditionTarget && handleToggleCondition(conditionTarget, cond)}
                className={`w-full p-2.5 rounded-[10px] text-xs font-bold transition flex items-center justify-between touch-target ${
                  isApplied
                    ? 'bg-[#C2512B]/20 text-[#E8836B] border border-[#C2512B]/40'
                    : 'bg-[#171513] text-[#EDE6D8] border border-[#2F2A23] hover:bg-[#201D19]'
                }`}
              >
                <span>{cond}</span>
                {isApplied && <CheckCircle2 className="w-4 h-4 text-[#D66138]" />}
              </button>
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
          <div className="p-3 rounded-[12px] bg-[#171513] border border-[#2F2A23] space-y-1 text-xs">
            <span className="font-bold text-[#E0A030] block">خلاصه نبرد:</span>
            <p className="text-[#A39A89]">تعداد دورهای مبارزه: {currentEncounter.round || 1}</p>
            <p className="text-[#A39A89]">
              دشمنان شکست‌خورده: {(currentEncounter.participants || []).filter(p => p.status === 'defeated').length}
            </p>
          </div>

          {proposedLoot.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#EDE6D8] block">غنائم پیشنهادی از موجودات شکست‌خورده:</span>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {proposedLoot.map(loot => (
                  <div
                    key={loot.id}
                    className="p-2.5 rounded-[10px] bg-[#171513] border border-[#2F2A23] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#E0A030]">{loot.name}</span>
                      <span className="text-[10px] text-[#A39A89]">از {loot.sourceNpc}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#A39A89]">اهدای آیتم به:</span>
                      <select
                        value={selectedLootRecipients[loot.id] || ''}
                        onChange={(e) => setSelectedLootRecipients(prev => ({
                          ...prev,
                          [loot.id]: e.target.value
                        }))}
                        className="bg-[#201D19] text-[#EDE6D8] text-xs p-1.5 rounded-[6px] border border-[#2F2A23] focus:border-[#E0A030]"
                      >
                        <option value="">عدم اهدا (رد کردن)</option>
                        {characters.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#A39A89] text-center py-4">
              هیچ غنیمتی در لیست لوت هیولاهای شکست‌خورده یافت نشد.
            </p>
          )}

          <button
            type="button"
            onClick={handleFinishEndAndDistribute}
            className="w-full py-3 rounded-[10px] bg-[#C2512B] hover:bg-[#C2512B] text-white font-black text-sm transition shadow-md touch-target"
          >
            تایید و ثبت نهایی پایان نبرد
          </button>
        </div>
      </BottomSheet>

      {/* Sheet 5: Custom Event Note for Combat Log */}
      <BottomSheet
        isOpen={customEventSheet}
        onClose={() => setCustomEventSheet(false)}
        title="ارسال پیام رویداد در لاگ نبرد"
      >
        <div className="space-y-3 pb-2" dir="rtl">
          <p className="text-xs text-[#A39A89]">
            این پیام در بخش وقایع زنده مبارزه برای تمامی بازیکنان نمایش داده خواهد شد.
          </p>

          <textarea
            rows={3}
            value={customEventText}
            onChange={(e) => setCustomEventText(e.target.value)}
            placeholder="مثال: سقف کاروانسرا فروریخت و دود غلیظی محوطه را فراگرفت..."
            className="w-full bg-[#171513] text-[#EDE6D8] p-2.5 rounded-[10px] border border-[#2F2A23] text-sm focus:border-[#E0A030] focus:outline-none"
          />

          <button
            type="button"
            onClick={async () => {
              if (!customEventText.trim() || !currentEncounter) return;
              await api.addEncounterEvent(currentEncounter.id, customEventText.trim(), true);
              setCustomEventText('');
              setCustomEventSheet(false);
              loadSelectedEncounter(currentEncounter.id);
            }}
            disabled={!customEventText.trim()}
            className="w-full py-2.5 rounded-[10px] bg-[#E0A030] text-[#0E0D0C] font-bold text-sm transition disabled:opacity-50 touch-target"
          >
            ثبت در لاگ
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
