/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { 
  User, Character, CharacterNote, NPC, ItemLibraryEntry, 
  RewardPackage, CampaignNote, Encounter, WeaponTemplate, ClassTemplate, DiceRollResult 
} from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { BottomNav } from './components/mobile/BottomNav';
import { StickyHeader } from './components/common/StickyHeader';
import { Toast, ToastMessage } from './components/common/Toast';
import { useWakeLock } from './hooks/useWakeLock';
import { useVisualViewport } from './hooks/useVisualViewport';
import { 
  Heart, Zap, Swords, Package, FileText, Compass, Sparkles 
} from 'lucide-react';

// Route-level code splitting (lazy loading tabs and heavy modals)
const OverviewTab = React.lazy(() => import('./components/character/OverviewTab').then(m => ({ default: m.OverviewTab })));
const AbilitiesTab = React.lazy(() => import('./components/character/AbilitiesTab').then(m => ({ default: m.AbilitiesTab })));
const CombatTab = React.lazy(() => import('./components/character/CombatTab').then(m => ({ default: m.CombatTab })));
const CompanionsTab = React.lazy(() => import('./components/character/CompanionsTab').then(m => ({ default: m.CompanionsTab })));
const InventoryTab = React.lazy(() => import('./components/character/InventoryTab').then(m => ({ default: m.InventoryTab })));
const NotesTab = React.lazy(() => import('./components/character/NotesTab').then(m => ({ default: m.NotesTab })));
const CodexTab = React.lazy(() => import('./components/character/CodexTab').then(m => ({ default: m.CodexTab })));
const DmTools = React.lazy(() => import('./components/dm/DmTools').then(m => ({ default: m.DmTools })));
const AuthModal = React.lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const DiceRollerModal = React.lazy(() => import('./components/DiceRollerModal').then(m => ({ default: m.DiceRollerModal })));
const RestModal = React.lazy(() => import('./components/character/RestModal').then(m => ({ default: m.RestModal })));

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
  const [activeDmTab, setActiveDmTab] = useState<'dashboard' | 'encounters' | 'npcs' | 'items' | 'notes' | 'settings'>('dashboard');

  // Notes, NPCs, Items, Rewards, Encounters
  const [notes, setNotes] = useState<CharacterNote[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [items, setItems] = useState<ItemLibraryEntry[]>([]);
  const [rewards, setRewards] = useState<RewardPackage[]>([]);
  const [campaignNotes, setCampaignNotes] = useState<CampaignNote[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [weaponTemplates, setWeaponTemplates] = useState<WeaponTemplate[]>([]);
  const [classTemplates, setClassTemplates] = useState<ClassTemplate[]>([]);

  // Modals & UI State
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
    const clean = hash.replace(/^#\/?/, '').toLowerCase();
    if (!clean) return;

    if (clean.startsWith('dm')) {
      setIsDmView(true);
      const parts = clean.split('/');
      const dmSub = parts[1] as any;
      if (['dashboard', 'encounters', 'npcs', 'items', 'notes', 'settings'].includes(dmSub)) {
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
      const user = await api.getMe();
      setCurrentUser(user);
      setIsDmView(user?.role === 'dm');

      const usersList = await api.listUsers();
      setAllUsers(usersList);

      const charsList = await api.listCharacters();
      setCharacters(charsList);
      if (charsList.length > 0 && !activeCharId) {
        setActiveCharId(charsList[0].id);
      }

      const notesList = await api.listNotes();
      setNotes(notesList);

      const npcsList = await api.listNpcs();
      setNpcs(npcsList);

      const itemsList = await api.listItems();
      setItems(itemsList);

      const rewardsList = await api.listRewards();
      setRewards(rewardsList);

      const weaponTmplList = await api.listWeaponTemplates();
      setWeaponTemplates(weaponTmplList);

      const classTmplList = await api.listClassTemplates();
      setClassTemplates(classTmplList);

      if (user?.role === 'dm') {
        const campNotes = await api.listCampaignNotes();
        setCampaignNotes(campNotes);

        const encList = await api.listEncounters();
        setEncounters(encList);
      }
    } catch (err) {
      console.error('Initial data load error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

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
      } catch (err) {
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

  // Switch User (Simulated dev switcher)
  const handleSwitchUser = async (userId: string) => {
    try {
      const user = await api.switchUser(userId);
      setCurrentUser(user);
      setIsDmView(user.role === 'dm');
      
      // Refresh characters list for this user
      const chars = await api.listCharacters();
      setCharacters(chars);
      if (chars.length > 0) {
        setActiveCharId(chars[0].id);
      }

      const userNotes = await api.listNotes();
      setNotes(userNotes);

      const userNpcs = await api.listNpcs();
      setNpcs(userNpcs);

      const userItems = await api.listItems();
      setItems(userItems);

      if (user.role === 'dm') {
        const campNotes = await api.listCampaignNotes();
        setCampaignNotes(campNotes);
        const encList = await api.listEncounters();
        setEncounters(encList);
      }
    } catch (err) {
      console.error('User switch error:', err);
    }
  };

  // Auth Handlers
  const handleLogin = async (email: string, password?: string) => {
    const user = await api.login(email, password);
    setCurrentUser(user);
    setIsDmView(user.role === 'dm');
    await loadInitialData();
    return user;
  };

  const handleRegister = async (email: string, password?: string, name?: string, campaignCode?: string) => {
    const user = await api.register(email, password, name, campaignCode);
    setCurrentUser(user);
    setIsDmView(user.role === 'dm');
    await loadInitialData();
    return user;
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCharacters([]);
    setActiveCharId(null);
  };

  // Group rest handler
  const handleApplyGroupRest = async (type: 'short' | 'long' | 'special', notesText?: string) => {
    const updated = await api.applyGroupRest(type, notesText);
    setCharacters(updated);
    showToast(`استراحت گروهی (${type === 'long' ? 'بلند' : type === 'short' ? 'کوتاه' : 'ویژه'}) با موفقیت اعمال شد.`);
  };

  // Rest confirm from character sheet
  const handleConfirmRest = async (type: 'short' | 'long' | 'special', notesText: string) => {
    if (!activeCharacter) return;
    const isSingleChar = true;
    if (isSingleChar) {
      let hp = { ...activeCharacter.hp };
      let exhaustion = activeCharacter.exhaustion;

      const features = activeCharacter.features.map(f => {
        if (type === 'long') return { ...f, usedCount: 0 };
        if (type === 'short' && f.usageType === 'short') return { ...f, usedCount: 0 };
        return f;
      });

      const weapons = activeCharacter.weapons.map(w => {
        if (type === 'long') return { ...w, abilityUsed: 0 };
        if (type === 'short' && (w.specialAbility?.restType === 'short' || w.abilityReset === 'short')) {
          return { ...w, abilityUsed: 0 };
        }
        return w;
      });

      if (type === 'long') {
        hp.current = hp.max;
        hp.temp = 0;
        if (exhaustion > 0) exhaustion -= 1;
      } else if (type === 'special') {
        hp.current = Math.min(hp.max, hp.current + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + 2);
        if (exhaustion > 0) exhaustion -= 1;
      }

      const restEntry = {
        id: `rest-${Date.now()}`,
        date: new Date().toLocaleDateString('fa-IR'),
        type,
        notes: notesText || (type === 'long' ? 'استراحت کامل' : type === 'short' ? 'استراحت کوتاه' : 'اردوی بهاری پریان')
      };

      handleUpdateCharacter({
        ...activeCharacter,
        hp,
        exhaustion,
        features,
        weapons,
        restLog: [restEntry, ...(activeCharacter.restLog || [])]
      });

      showToast(`استراحت ${type === 'long' ? 'کامل' : type === 'short' ? 'کوتاه' : 'ویژه'} ثبت گردید.`);
    }
  };

  // Notes handlers
  const handleAddNote = async (noteData: Omit<CharacterNote, 'id' | 'updatedAt'>) => {
    const created = await api.createNote(noteData);
    setNotes(prev => [created, ...prev]);
  };

  const handleUpdateNote = async (note: CharacterNote) => {
    const updated = await api.updateNote(note);
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  const handleDeleteNote = async (id: string) => {
    await api.deleteNote(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // Give item to player
  const handleGiveItemToPlayer = async (charId: string, item: ItemLibraryEntry) => {
    const updatedChar = await api.giveItemToPlayer(charId, item);
    setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
    showToast(`شیء «${item.name}» به کاراکتر داده شد.`);
  };

  // Distribute reward
  const handleDistributeReward = async (rewardId: string, charIds: string[]) => {
    const updatedChars = await api.distributeReward(rewardId, charIds);
    setCharacters(updatedChars);
    showToast('پاداش‌ها بین ماجراجویان تقسیم شد.');
  };

  // Seed DB import
  const handleImportSeedIntoDb = async () => {
    await api.seedDatabase(true);
    await loadInitialData();
    showToast('داده‌های اولیه کمپین زروانیا با موفقیت بارگذاری شد.');
  };

  const playerNavItems = [
    { id: 'overview', label: 'نمای کلی', icon: Heart },
    { id: 'abilities', label: 'ویژگی‌ها و مهارت‌ها', icon: Zap },
    { id: 'combat', label: 'مبارزه و سلاح‌ها', icon: Swords },
    { id: 'inventory', label: 'کوله‌پشتی و منابع', icon: Package },
    { id: 'notes', label: 'یادداشت‌ها', icon: FileText },
    { id: 'codex', label: 'دانشنامه و قوانین', icon: Compass }
  ] as const;

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#0E0D0C] noise-bg text-[#EDE6D8] pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-20 flex flex-col font-sans selection:bg-[#E0A030]/30 selection:text-[#F2C265]" dir="rtl">
      {/* Toast feedback above bottom nav (z-50) */}
      {toastMsg && (
        <Toast
          toast={{
            id: 'global-toast',
            message: toastMsg,
            type: toastMsg.includes('بحرانی') ? 'roll' : 'info',
            isCrit: toastMsg.includes('بحرانی') || toastMsg.includes('۲۰'),
            isFumble: toastMsg.includes('شکست') || toastMsg.includes('۱')
          }}
          onDismiss={() => setToastMsg(null)}
        />
      )}

      {/* Global Header */}
      <Header
        currentUser={currentUser}
        allUsers={allUsers}
        characters={characters}
        activeCharacterId={activeCharId}
        onSelectCharacter={setActiveCharId}
        onSwitchUser={handleSwitchUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        saveStatus={saveStatus}
        isDmView={isDmView}
        onToggleDmView={() => setIsDmView(!isDmView)}
        wakeLockActive={wakeLockActive}
        onToggleWakeLock={toggleWakeLock}
        wakeLockSupported={wakeLockSupported}
        fontScale={fontScale}
        onToggleFontScale={toggleFontScale}
      />

      {/* Sticky Character Header & Sub-Tabs (active during character sheet, mobile first) */}
      {activeCharacter && !isDmView && (activePlayerTab === 'overview' || activePlayerTab === 'abilities' || activePlayerTab === 'combat' || activePlayerTab === 'companions') && (
        <StickyHeader
          character={activeCharacter}
          onUpdate={handleUpdateCharacter}
          onOpenRest={(type) => setRestModal({ isOpen: true, type })}
          activeSheetTab={activePlayerTab as any}
          onSelectSheetTab={handleSelectPlayerTab}
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
              rewards={rewards}
              campaignNotes={campaignNotes}
              savedEncounters={encounters}
              users={allUsers}
              weaponTemplates={weaponTemplates}
              onUpdateCharacter={handleUpdateCharacter}
              onApplyGroupRest={handleApplyGroupRest}
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
                showToast('وضعیت مواجهه نبرد با موفقیت ذخیره شد!');
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
                const updated = await api.updateUserRole(userId, role);
                setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
              }}
              onImportSeedIntoDb={handleImportSeedIntoDb}
              onRollDice={handleRollCheck}
              isHttpMode={import.meta.env.VITE_API_MODE === 'http'}
              activeDmTab={activeDmTab}
              onSelectDmTab={handleSelectDmTab}
            />
          ) : activeCharacter ? (
            /* Player Character Sheet */
            <div className="space-y-4 sm:space-y-6">
              {/* Active Character Sheet Tab View */}
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
                />
              )}
            </div>
          ) : (
            /* Empty / Welcome State */
            <div className="surface-card rounded-[14px] p-6 text-center py-12 max-w-md mx-auto space-y-4 card-gold-top border border-[#2F2A23]">
              <div className="w-14 h-14 rounded-[12px] bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#E0A030] flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-[#EDE6D8]">به کمپین زروانیا خوش آمدید</h2>
              <p className="text-xs text-[#A39A89] leading-relaxed">
                شما هم‌اکنون وارد سیستم نشده‌اید یا شخصیتی انتخاب نکرده‌اید. برای شروع، وارد یکی از کاراکترها شوید یا نقش دانجن مستر را انتخاب نمایید.
              </p>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="py-2.5 px-6 rounded-[12px] btn-primary-amber font-extrabold text-xs shadow-lg transition touch-target"
              >
                ورود سریع با کاراکترهای پیش‌فرض
              </button>
            </div>
          )}
        </Suspense>
      </main>

      {/* Fixed Mobile Bottom Navigation Bar (pinned to viewport bottom with safe area insets) */}
      <BottomNav
        isDmView={isDmView}
        playerTab={activePlayerTab}
        onSelectPlayerTab={handleSelectPlayerTab}
        dmTab={activeDmTab}
        onSelectDmTab={handleSelectDmTab}
        onOpenDice={() => {
          setPresetRoll(null);
          setDiceModalOpen(true);
        }}
        inventoryBadge={activeCharacter?.inventory?.length || 0}
        notesBadge={notes.filter(n => n.characterId === activeCharId).length || 0}
        isKeyboardOpen={isKeyboardOpen}
      />

      {/* Global Modals (lazy loaded, rendered only when opened) */}
      <Suspense fallback={null}>
        {authModalOpen && (
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onSelectPreloadedUser={handleSwitchUser}
          />
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
      </Suspense>
    </div>
  );
}
