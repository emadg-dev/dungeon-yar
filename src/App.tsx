/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { 
  User, Character, CharacterNote, NPC, ItemLibraryEntry, 
  RewardPackage, CampaignNote, Encounter, WeaponTemplate, ClassTemplate, DiceRollResult,
  LocationEntry, PlayerEncounterView 
} from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { BottomNav } from './components/mobile/BottomNav';
import { StickyHeader } from './components/common/StickyHeader';
import { Toast } from './components/common/Toast';
import { useWakeLock } from './hooks/useWakeLock';
import { useVisualViewport } from './hooks/useVisualViewport';
import { 
  Heart, Zap, Swords, Sparkles, Shield, AlertTriangle, KeyRound, LogIn, RefreshCw, UserCheck 
} from 'lucide-react';
import { BottomSheet } from './components/mobile/BottomSheet';

// Route-level code splitting
const OverviewTab = React.lazy(() => import('./components/character/OverviewTab').then(m => ({ default: m.OverviewTab })));
const AbilitiesTab = React.lazy(() => import('./components/character/AbilitiesTab').then(m => ({ default: m.AbilitiesTab })));
const CombatTab = React.lazy(() => import('./components/character/CombatTab').then(m => ({ default: m.CombatTab })));
const CompanionsTab = React.lazy(() => import('./components/character/CompanionsTab').then(m => ({ default: m.CompanionsTab })));
const InventoryTab = React.lazy(() => import('./components/character/InventoryTab').then(m => ({ default: m.InventoryTab })));
const NotesTab = React.lazy(() => import('./components/character/NotesTab').then(m => ({ default: m.NotesTab })));
const CodexTab = React.lazy(() => import('./components/character/CodexTab').then(m => ({ default: m.CodexTab })));
const DmTools = React.lazy(() => import('./components/dm/DmTools').then(m => ({ default: m.DmTools })));
const AuthModal = React.lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const AccountModal = React.lazy(() => import('./components/AccountModal').then(m => ({ default: m.AccountModal })));
const DiceRollerModal = React.lazy(() => import('./components/DiceRollerModal').then(m => ({ default: m.DiceRollerModal })));
const RestModal = React.lazy(() => import('./components/character/RestModal').then(m => ({ default: m.RestModal })));
const LiveEncounterModal = React.lazy(() => import('./components/character/LiveEncounterModal').then(m => ({ default: m.LiveEncounterModal })));

// Loading skeleton fallback for tabs
const TabSkeleton = () => (
  <div className="space-y-4 p-2 animate-pulse" dir="rtl">
    <div className="h-28 rounded-2xl bg-[#141824]/60 border border-amber-500/10"></div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="h-20 rounded-2xl bg-[#141824]/40 border border-slate-800"></div>
      <div className="h-20 rounded-2xl bg-[#141824]/40 border border-slate-800"></div>
      <div className="h-20 rounded-2xl bg-[#141824]/40 border border-slate-800"></div>
      <div className="h-20 rounded-2xl bg-[#141824]/40 border border-slate-800"></div>
    </div>
    <div className="h-44 rounded-2xl bg-[#141824]/30 border border-slate-800"></div>
  </div>
);

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [activePlayerTab, setActivePlayerTab] = useState<'overview' | 'abilities' | 'combat' | 'companions' | 'inventory' | 'notes' | 'codex'>('overview');
  const [isDmView, setIsDmView] = useState<boolean>(false);
  const [activeDmTab, setActiveDmTab] = useState<'dashboard' | 'encounters' | 'library' | 'narrative' | 'more'>('dashboard');

  // Notes, NPCs, Items, Rewards, Encounters
  const [notes, setNotes] = useState<CharacterNote[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [items, setItems] = useState<ItemLibraryEntry[]>([]);
  const [rewards, setRewards] = useState<RewardPackage[]>([]);
  const [campaignNotes, setCampaignNotes] = useState<CampaignNote[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [weaponTemplates, setWeaponTemplates] = useState<WeaponTemplate[]>([]);
  const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>([]);
  const [allowPlayerCreateCharacter, setAllowPlayerCreateCharacter] = useState<boolean>(false);

  // Locations & Live Encounters
  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [activeLiveEncounter, setActiveLiveEncounter] = useState<PlayerEncounterView | null>(null);
  const [liveEncounterModalOpen, setLiveEncounterModalOpen] = useState(false);

  // Modals & UI State
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register' | 'reset';
    inviteCode?: string;
    resetToken?: string;
  }>({
    isOpen: false,
    mode: 'login'
  });
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [sessionExpiredSheetOpen, setSessionExpiredSheetOpen] = useState(false);

  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [presetRoll, setPresetRoll] = useState<{ sides: number; count: number; modifier: number; label: string } | null>(null);
  const [diceHistory, setDiceHistory] = useState<DiceRollResult[]>([]);
  const [restModal, setRestModal] = useState<{ isOpen: boolean; type: 'short' | 'long' | 'special' }>({
    isOpen: false,
    type: 'short'
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // WakeLock, Virtual Viewport & Font Scale
  const { isSupported: wakeLockSupported, isActive: wakeLockActive, toggleWakeLock } = useWakeLock();
  const { isKeyboardOpen } = useVisualViewport();
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'xlarge'>(() => {
    return (localStorage.getItem('zorvania_font_scale') as 'normal' | 'large' | 'xlarge') || 'normal';
  });

  // Apply font scale to documentElement
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('font-scale-normal', 'font-scale-large', 'font-scale-xlarge');
      document.documentElement.classList.add(`font-scale-${fontScale}`);
    }
    localStorage.setItem('zorvania_font_scale', fontScale);
  }, [fontScale]);

  const toggleFontScale = () => {
    setFontScale(prev => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Scroll positions per tab
  const scrollPositionsRef = useRef<Record<string, number>>({});

  // Deep-linkable hash routing
  const applyRouteFromHash = useCallback((hash: string) => {
    const raw = hash.replace(/^#\/?/, '');
    if (!raw) return;

    // Check query params in hash (e.g. #register?code=XYZ or #reset-password?token=ABC)
    const [routePart, queryPart] = raw.split('?');
    const clean = routePart.toLowerCase();
    const query = new URLSearchParams(queryPart || '');

    if (clean === 'register') {
      const code = query.get('code') || '';
      setAuthModalState({ isOpen: true, mode: 'register', inviteCode: code });
      return;
    }
    if (clean === 'reset-password' || clean === 'reset') {
      const token = query.get('token') || '';
      setAuthModalState({ isOpen: true, mode: 'reset', resetToken: token });
      return;
    }
    if (clean === 'login') {
      setAuthModalState({ isOpen: true, mode: 'login' });
      return;
    }

    if (clean.startsWith('dm')) {
      setIsDmView(true);
      const parts = clean.split('/');
      const dmSub = parts[1] as any;
      if (['dashboard', 'encounters', 'library', 'narrative', 'more'].includes(dmSub)) {
        setActiveDmTab(dmSub);
      }
    } else {
      setIsDmView(false);
      if (['overview', 'abilities', 'combat', 'companions', 'inventory', 'notes', 'codex'].includes(clean)) {
        setActivePlayerTab(clean as any);
      }
    }
  }, []);

  useEffect(() => {
    applyRouteFromHash(window.location.hash);
    const onHashChange = () => {
      applyRouteFromHash(window.location.hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [applyRouteFromHash]);

  const handleSelectPlayerTab = (tab: typeof activePlayerTab) => {
    scrollPositionsRef.current[`player_${activePlayerTab}`] = window.scrollY;
    setActivePlayerTab(tab);
    window.location.hash = `#${tab}`;
    const prevPos = scrollPositionsRef.current[`player_${tab}`] || 0;
    setTimeout(() => window.scrollTo({ top: prevPos, behavior: 'instant' }), 20);
  };

  const handleSelectDmTab = (tab: typeof activeDmTab) => {
    scrollPositionsRef.current[`dm_${activeDmTab}`] = window.scrollY;
    setActiveDmTab(tab);
    window.location.hash = `#dm/${tab}`;
    const prevPos = scrollPositionsRef.current[`dm_${tab}`] || 0;
    setTimeout(() => window.scrollTo({ top: prevPos, behavior: 'instant' }), 20);
  };

  // Debounced save ref
  const saveTimeoutRef = useRef<any>(null);

  // Load Initial Data
  const loadInitialData = async () => {
    try {
      const authRes = await api.getMe();
      const user = authRes.user;
      setCurrentUser(user);
      setIsDmView(user?.role === 'dm');

      if (user?.role === 'dm') {
        const usersList = await api.listUsers().catch(() => []);
        setAllUsers(usersList);
      } else {
        setAllUsers(user ? [user] : []);
      }

      const charsList = await api.listCharacters();
      setCharacters(charsList);

      if (authRes.activeCharacterId && charsList.some(c => c.id === authRes.activeCharacterId)) {
        setActiveCharId(authRes.activeCharacterId);
      } else if (charsList.length > 0) {
        setActiveCharId(charsList[0].id);
      } else {
        setActiveCharId(null);
      }

      const notesList = await api.listNotes().catch(() => []);
      setNotes(notesList);

      const npcsList = await api.listNpcs().catch(() => []);
      setNpcs(npcsList);

      const itemsList = await api.listItems().catch(() => []);
      setItems(itemsList);

      const rewardsList = await api.listRewards().catch(() => []);
      setRewards(rewardsList);

      const weaponTmplList = await api.listWeaponTemplates().catch(() => []);
      setWeaponTemplates(weaponTmplList);

      const classTmplList = await api.listClassTemplates().catch(() => []);
      setClassTemplates(classTmplList);

      const locsList = await api.listLocations().catch(() => []);
      setLocations(locsList);

      const activeEnc = await api.getActiveEncounter().catch(() => null);
      setActiveLiveEncounter(activeEnc);

      const settings = await api.getCampaignSettings().catch(() => ({ allowPlayerCreateCharacter: false }));
      setAllowPlayerCreateCharacter(settings.allowPlayerCreateCharacter);

      if (user?.role === 'dm') {
        const campNotes = await api.listCampaignNotes().catch(() => []);
        setCampaignNotes(campNotes);

        const encList = await api.listEncounters().catch(() => []);
        setEncounters(encList);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.message?.includes('نشست')) {
        setSessionExpiredSheetOpen(true);
      }
      console.error('Initial data load error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Real-time live encounter updates via liveChannel (§3)
  useEffect(() => {
    const unsubscribe = api.liveChannel.subscribe(null, async (update: any) => {
      const activeEnc = await api.getActiveEncounter().catch(() => null);
      setActiveLiveEncounter(activeEnc);

      if (update?.type === 'start') {
        const locName = activeEnc?.location?.name;
        showToast(locName ? `مبارزه شروع شد — ${locName}` : 'مبارزه شروع شد!');
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([120, 60, 120]);
          } catch {}
        }
      } else if (update?.type === 'end') {
        showToast('مبارزه به پایان رسید.');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Location CRUD handlers
  const handleCreateLocation = async (loc: Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await api.createLocation(loc);
    setLocations(prev => [...prev, created]);
    showToast('مکان جدید با موفقیت ثبت شد.');
    return created;
  };

  const handleUpdateLocation = async (loc: LocationEntry) => {
    const updated = await api.updateLocation(loc);
    setLocations(prev => prev.map(l => l.id === loc.id ? updated : l));
    showToast('تغییرات مکان ذخیره شد.');
    return updated;
  };

  const handleDeleteLocation = async (id: string) => {
    await api.deleteLocation(id);
    setLocations(prev => prev.filter(l => l.id !== id));
    showToast('مکان حذف شد.');
  };

  // Active Character
  const activeCharacter = characters.find(c => c.id === activeCharId) || characters[0] || null;

  // Character Update with Debounced Save
  const handleUpdateCharacter = useCallback((updated: Character) => {
    setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSaveStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const saved = await api.updateCharacter(updated);
        setCharacters(prev => prev.map(c => c.id === saved.id ? saved : c));
        setSaveStatus('saved');
      } catch (err: any) {
        if (err?.status === 401) {
          setSessionExpiredSheetOpen(true);
        }
        console.error('Save error:', err);
        setSaveStatus('saved');
      }
    }, 600);
  }, []);

  // Quick Roll Trigger
  const handleRollCheck = (sides: number, count: number, modifier: number, label: string) => {
    setPresetRoll({ sides, count, modifier, label });
    setDiceModalOpen(true);
  };

  const handleAddDiceRoll = (roll: DiceRollResult) => {
    setDiceHistory(prev => [roll, ...prev.slice(0, 20)]);
  };

  // Rest Modal Execution
  const handleConfirmRest = async (type: 'short' | 'long' | 'special', notesText: string = '') => {
    try {
      const updatedChars = await api.applyGroupRest(type, notesText);
      setCharacters(updatedChars);
      showToast(
        type === 'long' 
          ? 'استراحت کامل اعمال شد؛ تمام HP بازیابی و خستگی کاهش یافت.' 
          : type === 'short'
          ? 'استراحت کوتاه ثبت شد؛ قابلیت‌های کوتاه بازیابی شدند.'
          : 'استراحت ویژه اردوگاه پریان اعمال گردید.'
      );
    } catch (e: any) {
      showToast('خطا در اعمال استراحت.');
    }
  };

  // Auth Callbacks
  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsDmView(user.role === 'dm');
    showToast(`خوش آمدید، ${user.displayName || user.name}!`);
    await loadInitialData();
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      const user = await api.switchUser(userId);
      setCurrentUser(user);
      setIsDmView(user.role === 'dm');
      showToast(`به حساب ${user.displayName || user.name} جابجا شدید.`);
      await loadInitialData();
    } catch (e: any) {
      showToast(e.message || 'خطا در جابجایی کاربر.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      setIsDmView(false);
      showToast('با موفقیت خارج شدید.');
      await loadInitialData();
    } catch (e) {
      setCurrentUser(null);
    }
  };

  // Distribute Reward
  const handleDistributeReward = async (rewardId: string, characterIds: string[]) => {
    try {
      const updated = await api.distributeReward(rewardId, characterIds);
      setCharacters(updated);
      showToast('پاداش با موفقیت میان ماجراجویان توزیع گردید!');
    } catch (err: any) {
      showToast(err.message || 'خطا در توزیع پاداش.');
    }
  };

  // Give item from library
  const handleGiveItemToPlayer = async (charId: string, item: ItemLibraryEntry) => {
    try {
      const updatedChar = await api.giveItemToPlayer(charId, item);
      setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
      showToast(`شیء «${item.name}» به کوله‌پشتی ${updatedChar.name} افزوده شد!`);
    } catch (err: any) {
      showToast(err.message || 'خطا در اهدای شیء.');
    }
  };

  // Import Seed data
  const handleImportSeedIntoDb = async () => {
    const res = await api.seedDatabase(true);
    showToast(res.message);
    await loadInitialData();
  };

  // Notes callbacks
  const handleAddNote = async (noteData: Omit<CharacterNote, 'id' | 'updatedAt'>) => {
    const newNote = await api.createNote(noteData);
    setNotes(prev => [newNote, ...prev]);
  };

  const handleUpdateNote = async (note: CharacterNote) => {
    const updated = await api.updateNote(note);
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  const handleDeleteNote = async (id: string) => {
    await api.deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0E0D0C] text-[#EDE6D8] flex flex-col font-sans selection:bg-[#E0A030]/25 selection:text-[#E0A030]" dir="rtl">
      {/* Toast notifications */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* Main App Bar Header */}
      <Header
        currentUser={currentUser}
        allUsers={allUsers}
        characters={characters}
        activeCharacterId={activeCharId}
        onSelectCharacter={setActiveCharId}
        onSwitchUser={handleSwitchUser}
        onOpenAuth={() => setAuthModalState({ isOpen: true, mode: 'login' })}
        onOpenAccount={() => setAccountModalOpen(true)}
        onLogout={handleLogout}
        saveStatus={saveStatus}
        isDmView={isDmView}
        onToggleDmView={() => setIsDmView(!isDmView)}
        wakeLockActive={wakeLockActive}
        onToggleWakeLock={toggleWakeLock}
        wakeLockSupported={wakeLockSupported}
        fontScale={fontScale}
        onToggleFontScale={toggleFontScale}
        activeEncounter={activeLiveEncounter ? { id: activeLiveEncounter.id, name: activeLiveEncounter.name } : null}
        onOpenActiveEncounter={() => setLiveEncounterModalOpen(true)}
      />

      {/* Sticky Character Header & Sub-Tabs */}
      {activeCharacter && !isDmView && (activePlayerTab === 'overview' || activePlayerTab === 'abilities' || activePlayerTab === 'combat' || activePlayerTab === 'companions') && (
        <StickyHeader
          character={activeCharacter}
          onUpdate={handleUpdateCharacter}
          onOpenRest={(type) => setRestModal({ isOpen: true, type })}
          activeSheetTab={activePlayerTab as any}
          onSelectSheetTab={(tab) => {
            if (tab === 'features' || tab === 'resources') {
              handleSelectPlayerTab('abilities');
            } else {
              handleSelectPlayerTab(tab as any);
            }
          }}
        />
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 py-3 sm:py-6 overflow-x-hidden">
        <Suspense fallback={<TabSkeleton />}>
          {isDmView && currentUser?.role === 'dm' ? (
            /* DM Tools Suite */
            <DmTools
              characters={characters}
              sharedNotes={notes.filter(n => n.sharedWithDm)}
              npcs={npcs}
              items={items}
              locations={locations}
              rewards={rewards}
              campaignNotes={campaignNotes}
              savedEncounters={encounters}
              users={allUsers}
              weaponTemplates={weaponTemplates}
              onUpdateCharacter={handleUpdateCharacter}
              onApplyGroupRest={handleConfirmRest}
              onUpdateGroupResources={async (delta) => {
                const res = await api.updateGroupResources(delta);
                setCharacters(res);
              }}
              onInspectCharacter={(id) => {
                setActiveCharId(id);
                setIsDmView(false);
                handleSelectPlayerTab('overview');
              }}
              onSaveEncounter={async (enc) => {
                const saved = await api.createEncounter(enc);
                setEncounters(prev => [saved, ...prev]);
                showToast('وضعیت مواجهه با موفقیت ذخیره شد!');
              }}
              onCreateNpc={async (data) => {
                const created = await api.createNpc(data);
                setNpcs(prev => [...prev, created]);
              }}
              onUpdateNpc={async (data) => {
                const updated = await api.updateNpc(data);
                setNpcs(prev => prev.map(n => n.id === updated.id ? updated : n));
              }}
              onDeleteNpc={async (id) => {
                await api.deleteNpc(id);
                setNpcs(prev => prev.filter(n => n.id !== id));
              }}
              onCreateLocation={handleCreateLocation}
              onUpdateLocation={handleUpdateLocation}
              onDeleteLocation={handleDeleteLocation}
              onCreateItem={async (data) => {
                const created = await api.createItem(data);
                setItems(prev => [...prev, created]);
              }}
              onUpdateItem={async (data) => {
                const updated = await api.updateItem(data);
                setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
              }}
              onDeleteItem={async (id) => {
                await api.deleteItem(id);
                setItems(prev => prev.filter(i => i.id !== id));
              }}
              onGiveItemToPlayer={handleGiveItemToPlayer}
              onDistributeReward={handleDistributeReward}
              onCreateReward={async (data) => {
                const created = await api.createReward(data);
                setRewards(prev => [...prev, created]);
              }}
              onCreateCampaignNote={async (data) => {
                const created = await api.createCampaignNote(data);
                setCampaignNotes(prev => [created, ...prev]);
              }}
              onUpdateCampaignNote={async (data) => {
                const updated = await api.updateCampaignNote(data);
                setCampaignNotes(prev => prev.map(c => c.id === updated.id ? updated : c));
              }}
              onDeleteCampaignNote={async (id) => {
                await api.deleteCampaignNote(id);
                setCampaignNotes(prev => prev.filter(c => c.id !== id));
              }}
              onUpdateUserRole={async (userId, role) => {
                const updated = await api.updateUser(userId, { role });
                setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
              }}
              onImportSeedIntoDb={handleImportSeedIntoDb}
              onRollDice={handleRollCheck}
              isHttpMode={import.meta.env.VITE_API_MODE === 'http'}
              activeDmTab={activeDmTab}
              onSelectDmTab={handleSelectDmTab}
              onRefreshCharacters={loadInitialData}
            />
          ) : activeCharacter ? (
            /* Player Character Sheet */
            <div className="space-y-4 sm:space-y-6">
              {activePlayerTab === 'overview' && (
                <OverviewTab
                  character={activeCharacter}
                  classTemplates={classTemplates}
                  onUpdate={handleUpdateCharacter}
                  onOpenRestModal={(type) => setRestModal({ isOpen: true, type })}
                  onRollCheck={handleRollCheck}
                />
              )}

              {activePlayerTab === 'abilities' && (
                <AbilitiesTab
                  character={activeCharacter}
                  onUpdate={handleUpdateCharacter}
                  onRollCheck={handleRollCheck}
                />
              )}

              {activePlayerTab === 'combat' && (
                <CombatTab
                  character={activeCharacter}
                  weaponTemplates={weaponTemplates}
                  onUpdate={handleUpdateCharacter}
                  onOpenRestModal={(type) => setRestModal({ isOpen: true, type })}
                  onRollCheck={handleRollCheck}
                />
              )}

              {activePlayerTab === 'companions' && (
                <CompanionsTab
                  character={activeCharacter}
                  onUpdate={handleUpdateCharacter}
                  onRollCheck={handleRollCheck}
                />
              )}

              {activePlayerTab === 'inventory' && (
                <InventoryTab
                  character={activeCharacter}
                  onUpdate={handleUpdateCharacter}
                />
              )}

              {activePlayerTab === 'notes' && (
                <NotesTab
                  character={activeCharacter}
                  notes={notes.filter(n => n.characterId === activeCharacter.id)}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}

              {activePlayerTab === 'codex' && (
                <CodexTab
                  revealedNpcs={npcs}
                  revealedItems={items}
                  revealedLocations={locations.filter(l => Boolean(l.revealed))}
                />
              )}
            </div>
          ) : currentUser && currentUser.role === 'player' && characters.length === 0 ? (
            /* Screen 6: First-login empty state when user has no character */
            <div className="surface-card rounded-[14px] p-6 text-center py-12 max-w-md mx-auto space-y-4 card-gold-top border border-[#2F2A23]">
              <div className="w-14 h-14 rounded-[12px] bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#E0A030] flex items-center justify-center mx-auto shadow-md">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-base font-black text-[#EDE6D8]">کاراکتری به شما اختصاص داده نشده است</h2>
              <p className="text-xs text-[#A39A89] leading-relaxed">
                سلام <strong>{currentUser.displayName || currentUser.name}</strong>؛ حساب کاربری شما با موفقیت فعال شد، اما هنوز کاراکتری برای شما تعیین نگردیده است. لطفاً از دانجن مستر خود بخواهید کاراکتر شما را پیوند دهد.
              </p>
              {allowPlayerCreateCharacter && (
                <button
                  type="button"
                  onClick={async () => {
                    const newChar = await api.createCharacter({ name: `شخصیت ${currentUser.displayName || currentUser.name}` });
                    setCharacters([newChar]);
                    setActiveCharId(newChar.id);
                  }}
                  className="py-2.5 px-6 rounded-[12px] btn-primary-amber font-extrabold text-xs shadow-lg transition touch-target"
                >
                  ساخت کاراکتر جدید
                </button>
              )}
            </div>
          ) : (
            /* Welcome / Login prompt for unauthenticated guest */
            <div className="surface-card rounded-[14px] p-6 text-center py-12 max-w-md mx-auto space-y-4 card-gold-top border border-[#2F2A23]">
              <div className="w-14 h-14 rounded-[12px] bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#E0A030] flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-[#EDE6D8]">به کمپین زروانیا خوش آمدید</h2>
              <p className="text-xs text-[#A39A89] leading-relaxed">
                جهت دسترسی به برگه شخصیت، کوله‌پشتی و ابزارهای بازی، لطفاً وارد حساب خود شوید یا با کد دعوت ثبت‌نام کنید.
              </p>
              <button
                type="button"
                onClick={() => setAuthModalState({ isOpen: true, mode: 'login' })}
                className="py-2.5 px-6 rounded-[12px] btn-primary-amber font-extrabold text-xs shadow-lg transition touch-target flex items-center justify-center gap-2 mx-auto"
              >
                <LogIn className="w-4 h-4" />
                <span>ورود / عضویت با کد دعوت</span>
              </button>
            </div>
          )}
        </Suspense>
      </main>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <BottomNav
        isDmView={isDmView}
        playerTab={activePlayerTab}
        onSelectPlayerTab={handleSelectPlayerTab}
        dmTab={activeDmTab as any}
        onSelectDmTab={handleSelectDmTab}
        onOpenDice={() => {
          setPresetRoll(null);
          setDiceModalOpen(true);
        }}
        inventoryBadge={activeCharacter?.inventory?.length || 0}
        notesBadge={notes.filter(n => n.characterId === activeCharId).length || 0}
        isKeyboardOpen={isKeyboardOpen}
        hasActiveEncounter={Boolean(activeLiveEncounter && activeLiveEncounter.status === 'active')}
        onOpenActiveEncounter={() => setLiveEncounterModalOpen(true)}
      />

      {/* Global Modals */}
      <Suspense fallback={null}>
        {authModalState.isOpen && (
          <AuthModal
            isOpen={authModalState.isOpen}
            onClose={() => setAuthModalState(prev => ({ ...prev, isOpen: false }))}
            onSuccess={handleAuthSuccess}
            initialMode={authModalState.mode}
            initialInviteCode={authModalState.inviteCode}
            initialResetToken={authModalState.resetToken}
            onSelectPreloadedUser={handleSwitchUser}
          />
        )}

        {accountModalOpen && currentUser && (
          <AccountModal
            isOpen={accountModalOpen}
            onClose={() => setAccountModalOpen(false)}
            currentUser={currentUser}
            characters={characters}
            activeCharacterId={activeCharId}
            onSelectActiveCharacter={async (charId) => {
              setActiveCharId(charId);
              await api.setActiveCharacter(charId);
              showToast('کاراکتر فعال با موفقیت تغییر کرد.');
            }}
            onUpdateUser={(updated) => {
              setCurrentUser(updated);
              showToast('مشخصات حساب ذخیره شد.');
            }}
            onLogout={handleLogout}
          />
        )}

        {/* 401 Session Expired Friendly Sheet */}
        {sessionExpiredSheetOpen && (
          <BottomSheet
            isOpen={sessionExpiredSheetOpen}
            onClose={() => setSessionExpiredSheetOpen(false)}
            title="نشست شما به پایان رسیده است"
            subtitle="نیاز به ورود مجدد جهت همگام‌سازی اطلاعات"
          >
            <div className="space-y-4 py-2 text-center" dir="rtl">
              <div className="w-12 h-12 rounded-full bg-[#E0A030]/15 text-[#E0A030] border border-[#E0A030]/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs text-[#EDE6D8]/90 leading-relaxed">
                نشست امنیتی شما منقضی یا توسط دستگاه دیگری خاتمه یافته است. داده‌های تغییریافته شما در حافظه دستگاه محفوظ است و پس از ورود مجدد همگام‌سازی خواهند شد.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSessionExpiredSheetOpen(false);
                  setAuthModalState({ isOpen: true, mode: 'login' });
                }}
                className="w-full py-3 rounded-[12px] btn-primary-amber font-extrabold text-xs touch-target min-h-[48px]"
              >
                ورود مجدد به حساب کاربری
              </button>
            </div>
          </BottomSheet>
        )}

        {diceModalOpen && (
          <DiceRollerModal
            isOpen={diceModalOpen}
            onClose={() => {
              setDiceModalOpen(false);
              setPresetRoll(null);
            }}
            presetRoll={presetRoll}
            history={diceHistory}
            onAddRoll={handleAddDiceRoll}
          />
        )}

        {restModal.isOpen && (
          <RestModal
            isOpen={restModal.isOpen}
            type={restModal.type}
            onClose={() => setRestModal({ isOpen: false, type: 'short' })}
            onConfirm={handleConfirmRest}
          />
        )}

        {liveEncounterModalOpen && (
          <LiveEncounterModal
            isOpen={liveEncounterModalOpen}
            onClose={() => setLiveEncounterModalOpen(false)}
            encounter={activeLiveEncounter}
            activeCharacter={activeCharacter}
            onOpenDice={() => {
              setPresetRoll(null);
              setDiceModalOpen(true);
            }}
            onUpdateCharacterHp={(newHp) => {
              if (activeCharacter) {
                handleUpdateCharacter({
                  ...activeCharacter,
                  hp: {
                    ...activeCharacter.hp,
                    current: newHp
                  }
                });
              }
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
