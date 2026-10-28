/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { 
  User, Character, CharacterNote, NPC, ItemLibraryEntry, 
  RewardPackage, CampaignNote, Encounter, WeaponTemplate, ClassTemplate, DiceRollResult,
  LocationEntry, PlayerEncounterView, Campaign, MasterCharacter, CampaignInvite, 
  CampaignMember, CharacterHistoryEvent, CharacterParticipation, CampaignRole, CampaignSettings,
  LineageTemplate, BackgroundTemplate
} from './types';
import { api, HttpApi } from './services/api';
import { pageTitle } from './config/app';
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

// Multi-Campaign Views & Modals
const HomeScreen = React.lazy(() => import('./components/home/HomeScreen').then(m => ({ default: m.HomeScreen })));
const MasterCharacterScreen = React.lazy(() => import('./components/character/MasterCharacterScreen').then(m => ({ default: m.MasterCharacterScreen })));
const CampaignSwitcherModal = React.lazy(() => import('./components/campaign/CampaignSwitcherModal').then(m => ({ default: m.CampaignSwitcherModal })));
const CreateCampaignModal = React.lazy(() => import('./components/campaign/CreateCampaignModal').then(m => ({ default: m.CreateCampaignModal })));
const CampaignWizardModal = React.lazy(() => import('./components/campaign/CampaignWizardModal').then(m => ({ default: m.CampaignWizardModal })));
const JoinCampaignModal = React.lazy(() => import('./components/campaign/JoinCampaignModal').then(m => ({ default: m.JoinCampaignModal })));
const CampaignSettingsModal = React.lazy(() => import('./components/campaign/CampaignSettingsModal').then(m => ({ default: m.CampaignSettingsModal })));
const CampaignMembersModal = React.lazy(() => import('./components/campaign/CampaignMembersModal').then(m => ({ default: m.CampaignMembersModal })));
const CampaignInvitesModal = React.lazy(() => import('./components/campaign/CampaignInvitesModal').then(m => ({ default: m.CampaignInvitesModal })));
const CampaignApprovalsModal = React.lazy(() => import('./components/campaign/CampaignApprovalsModal').then(m => ({ default: m.CampaignApprovalsModal })));
const CharacterCreationWizardModal = React.lazy(() => import('./components/character-wizard/CharacterCreationWizardModal').then(m => ({ default: m.CharacterCreationWizardModal })));
const LevelUpModal = React.lazy(() => import('./components/character/LevelUpModal').then(m => ({ default: m.LevelUpModal })));
const SheetChangeRequestModal = React.lazy(() => import('./components/character/SheetChangeRequestModal').then(m => ({ default: m.SheetChangeRequestModal })));

// Loading skeleton fallback for tabs
const TabSkeleton = () => (
  <div className="space-y-4 p-2 animate-pulse" dir="rtl">
    <div className="skeleton h-28" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="skeleton h-20" />
      <div className="skeleton h-20" />
      <div className="skeleton h-20" />
      <div className="skeleton h-20" />
    </div>
    <div className="skeleton h-44" />
  </div>
);

export default function App() {
  // Top-level Navigation View Mode
  const [viewMode, setViewMode] = useState<'home' | 'character_master' | 'campaign_space'>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Platform / Home Summary State
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [myCharacters, setMyCharacters] = useState<MasterCharacter[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CampaignInvite[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  // Master Character View State
  const [selectedMasterCharId, setSelectedMasterCharId] = useState<string | null>(null);
  const [selectedMasterChar, setSelectedMasterChar] = useState<MasterCharacter | null>(null);
  const [charHistoryEvents, setCharHistoryEvents] = useState<CharacterHistoryEvent[]>([]);
  const [charParticipations, setCharParticipations] = useState<CharacterParticipation[]>([]);

  // Active Campaign Scoped State
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [activeCampaignMembers, setActiveCampaignMembers] = useState<CampaignMember[]>([]);
  const [campaignInvites, setCampaignInvites] = useState<CampaignInvite[]>([]);

  // In-Campaign Play State
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

  // Multi-campaign Modals
  const [campaignSwitcherOpen, setCampaignSwitcherOpen] = useState(false);
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [wizardDraftCampaign, setWizardDraftCampaign] = useState<Campaign | null>(null);
  const [joinCampaignModal, setJoinCampaignModal] = useState<{
    isOpen: boolean;
    campaign: Campaign | null;
    characterId?: string | null;
  }>({
    isOpen: false,
    campaign: null
  });
  const [campaignSettingsOpen, setCampaignSettingsOpen] = useState(false);
  const [campaignMembersOpen, setCampaignMembersOpen] = useState(false);
  const [campaignInvitesOpen, setCampaignInvitesOpen] = useState(false);
  const [campaignApprovalsOpen, setCampaignApprovalsOpen] = useState(false);

  // Character Creation Wizard (Step 3.3)
  const [characterWizardModal, setCharacterWizardModal] = useState<{
    isOpen: boolean;
    campaign: Campaign | null;
    draftParticipation?: CharacterParticipation | null;
  }>({
    isOpen: false,
    campaign: null
  });
  const [draftParticipations, setDraftParticipations] = useState<CharacterParticipation[]>([]);
  const [availableLineages, setAvailableLineages] = useState<LineageTemplate[]>([]);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundTemplate[]>([]);

  // Step 3.4 Level-Up, Approvals & Sheet Lock State
  const [campaignParticipations, setCampaignParticipations] = useState<CharacterParticipation[]>([]);
  const [levelUpModalOpen, setLevelUpModalOpen] = useState(false);
  const [sheetChangeRequestOpen, setSheetChangeRequestOpen] = useState(false);

  // Dice & Rest Modals
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

  // Synchronize document.title at runtime with pageTitle()
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (viewMode === 'home') {
        document.title = pageTitle();
      } else if (viewMode === 'character_master') {
        document.title = pageTitle(selectedMasterChar ? selectedMasterChar.name : 'پرونده شخصیت');
      } else if (viewMode === 'campaign_space' && activeCampaign) {
        document.title = pageTitle(activeCampaign.name);
      } else {
        document.title = pageTitle();
      }
    }
  }, [viewMode, selectedMasterChar, activeCampaign]);

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
  const saveTimeoutRef = useRef<any>(null);

  // Load Platform Home Data
  const loadHomeData = async () => {
    try {
      const authRes = await api.getMe();
      const user = authRes.user;
      setCurrentUser(user);

      if (user?.role === 'dm' || user?.platformRole === 'admin') {
        const usersList = await api.listUsers().catch(() => []);
        setAllUsers(usersList);
      } else {
        setAllUsers(user ? [user] : []);
      }

      const summary = await api.getHomeSummary();
      setMyCampaigns(summary.myCampaigns || []);
      setMyCharacters(summary.myCharacters || []);
      setPendingInvites(summary.pendingInvites || []);
      setPendingApprovals(summary.pendingApprovals || []);
      const drafts = await api.listDraftParticipations().catch(() => []);
      setDraftParticipations(drafts);
    } catch (err: any) {
      if (err?.status === 401 || err?.message?.includes('نشست')) {
        setSessionExpiredSheetOpen(true);
      }
      console.error('Home data load error:', err);
    }
  };

  // Helper to open Step 3.3 Character Creation Wizard
  const handleOpenCharacterWizard = async (campaignId?: string, draft?: CharacterParticipation | null) => {
    let targetCampaign = myCampaigns.find(c => c.id === campaignId) || (activeCampaign?.id === campaignId ? activeCampaign : null) || activeCampaign || myCampaigns[0];
    if (!targetCampaign && campaignId) {
      try {
        targetCampaign = (await api.getCampaign(campaignId)) || undefined;
      } catch {}
    }
    if (!targetCampaign) {
      showToast('برای ساخت کاراکتر، ابتدا یک کمپین بسازید یا به کمپین بپیوندید.');
      return;
    }

    try {
      const [classes, lins, bgs] = await Promise.all([
        api.listClassTemplates('campaign', targetCampaign.id).catch(() => []),
        api.listLineageTemplates('campaign', targetCampaign.id).catch(() => []),
        api.listBackgroundTemplates('campaign', targetCampaign.id).catch(() => [])
      ]);
      if (classes.length > 0) setClassTemplates(classes);
      setAvailableLineages(lins);
      setAvailableBackgrounds(bgs);
    } catch (e) {
      console.warn('Failed loading templates for wizard:', e);
    }

    setCharacterWizardModal({
      isOpen: true,
      campaign: targetCampaign,
      draftParticipation: draft || null
    });
  };

  // Load Master Character Screen Data
  const loadMasterCharacter = async (charId: string) => {
    try {
      const masterChar = await api.getMasterCharacter(charId);
      if (masterChar) {
        setSelectedMasterChar(masterChar);
        setSelectedMasterCharId(masterChar.id);
        const history = await api.getMasterCharacterHistory(charId).catch(() => []);
        setCharHistoryEvents(history);
        const parts = await api.listParticipations(charId).catch(() => []);
        setCharParticipations(parts);
        setViewMode('character_master');
      }
    } catch (err) {
      console.error('Master character load error:', err);
      showToast('خطا در بارگذاری اطلاعات پرونده شخصیت.');
    }
  };

  // Load Campaign Workspace Data
  const loadCampaignWorkspace = async (campaignId: string) => {
    try {
      const camp = await api.getCampaign(campaignId);
      if (!camp) {
        showToast('کمپین مورد نظر یافت نشد.');
        setViewMode('home');
        return;
      }
      api.setActiveCampaignId(camp.id);
      setActiveCampaign(camp);
      setActiveCampaignId(camp.id);

      // Check user role in campaign
      const myRole = camp.myRole || 'player';
      const isDmRole = myRole === 'owner' || myRole === 'co_dm' || currentUser?.role === 'dm';
      setIsDmView(isDmRole);

      // Members & Invites
      const members = await api.listCampaignMembers(campaignId).catch(() => []);
      setActiveCampaignMembers(members);

      if (isDmRole) {
        const invites = await api.listCampaignInvites(campaignId).catch(() => []);
        setCampaignInvites(invites);
        const campNotes = await api.listCampaignNotes().catch(() => []);
        setCampaignNotes(campNotes);
        const encList = await api.listEncounters().catch(() => []);
        setEncounters(encList);
      }

      // Characters & Participations in campaign
      const charsList = await api.listCharacters().catch(() => []);
      setCharacters(charsList);
      const partsList = await api.listParticipations(campaignId).catch(() => []);
      setCampaignParticipations(partsList);
      if (charsList.length > 0) {
        setActiveCharId(charsList[0].id);
      } else {
        setActiveCharId(null);
      }

      // Scoped game entities
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

      const campSettings = await api.getCampaignSettings().catch(() => ({
        allowPlayerCreateCharacter: camp.settings?.allowPlayerCreateCharacter ?? true
      }));
      setAllowPlayerCreateCharacter(Boolean(campSettings.allowPlayerCreateCharacter));

      setViewMode('campaign_space');
    } catch (err: any) {
      console.error('Campaign workspace load error:', err);
      showToast('خطا در ورود به کمپین.');
      setViewMode('home');
    }
  };

  // Deep-linkable hash routing
  const applyRouteFromHash = useCallback((hash: string) => {
    const raw = hash.replace(/^#\/?/, '');
    if (!raw || raw === '') {
      setViewMode('home');
      return;
    }

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

    // Characters route: #characters/:id
    if (clean.startsWith('characters/')) {
      const charId = routePart.split('/')[1];
      if (charId) {
        loadMasterCharacter(charId);
        return;
      }
    }

    // Campaign route: #c/:campaignId/...
    if (clean.startsWith('c/')) {
      const parts = routePart.split('/');
      const campaignId = parts[1];
      if (campaignId) {
        if (activeCampaignId !== campaignId) {
          loadCampaignWorkspace(campaignId);
        } else {
          setViewMode('campaign_space');
        }

        const sub = parts[2];
        if (sub === 'dm') {
          setIsDmView(true);
          const dmSub = parts[3] as any;
          if (['dashboard', 'encounters', 'library', 'narrative', 'more'].includes(dmSub)) {
            setActiveDmTab(dmSub);
          }
        } else if (sub) {
          setIsDmView(false);
          if (['overview', 'abilities', 'combat', 'companions', 'inventory', 'notes', 'codex'].includes(sub)) {
            setActivePlayerTab(sub as any);
          }
        }
        return;
      }
    }

    // Legacy tab shortcuts fallback if in campaign
    if (['overview', 'abilities', 'combat', 'companions', 'inventory', 'notes', 'codex'].includes(clean)) {
      if (activeCampaignId) {
        setViewMode('campaign_space');
        setIsDmView(false);
        setActivePlayerTab(clean as any);
      } else {
        setViewMode('home');
      }
      return;
    }

    // Default to home
    setViewMode('home');
  }, [activeCampaignId]);

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    applyRouteFromHash(window.location.hash);
    const onHashChange = () => {
      applyRouteFromHash(window.location.hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [applyRouteFromHash]);

  // Live encounter channel subscription
  useEffect(() => {
    const unsubscribe = api.liveChannel.subscribe(activeCampaignId, async (update: any) => {
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
  }, [activeCampaignId]);

  // Tab Selection with History Hash
  const handleSelectPlayerTab = (tab: typeof activePlayerTab) => {
    scrollPositionsRef.current[`player_${activePlayerTab}`] = window.scrollY;
    setActivePlayerTab(tab);
    if (activeCampaignId) {
      window.location.hash = `#c/${activeCampaignId}/${tab}`;
    } else {
      window.location.hash = `#${tab}`;
    }
    const prevPos = scrollPositionsRef.current[`player_${tab}`] || 0;
    setTimeout(() => window.scrollTo({ top: prevPos, behavior: 'instant' }), 20);
  };

  const handleSelectDmTab = (tab: typeof activeDmTab) => {
    scrollPositionsRef.current[`dm_${activeDmTab}`] = window.scrollY;
    setActiveDmTab(tab);
    if (activeCampaignId) {
      window.location.hash = `#c/${activeCampaignId}/dm/${tab}`;
    } else {
      window.location.hash = `#dm/${tab}`;
    }
    const prevPos = scrollPositionsRef.current[`dm_${tab}`] || 0;
    setTimeout(() => window.scrollTo({ top: prevPos, behavior: 'instant' }), 20);
  };

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
    showToast(`خوش آمدید، ${user.displayName || user.name}!`);
    await loadHomeData();
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      const user = await api.switchUser(userId);
      setCurrentUser(user);
      showToast(`به حساب ${user.displayName || user.name} جابجا شدید.`);
      await loadHomeData();
      if (activeCampaignId) {
        await loadCampaignWorkspace(activeCampaignId);
      }
    } catch (e: any) {
      showToast(e.message || 'خطا در جابجایی کاربر.');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      setViewMode('home');
      window.location.hash = '#/';
      showToast('با موفقیت خارج شدید.');
      await loadHomeData();
    } catch (e) {
      setCurrentUser(null);
    }
  };

  // Multi-Campaign Actions
  const handleSelectCampaign = (campaignId: string) => {
    const draft = myCampaigns.find(c => c.id === campaignId);
    if (draft && draft.status === 'draft') {
      setWizardDraftCampaign(draft);
      setCreateCampaignOpen(true);
      return;
    }
    window.location.hash = `#c/${campaignId}/overview`;
  };

  const handleCreateCampaignSubmit = async (data: {
    name: string;
    description?: string;
    tone?: string;
    packId?: string | null;
    settings?: Partial<CampaignSettings>;
  }) => {
    const newCamp = await api.createCampaign(data);
    showToast(`کمپین «${newCamp.name}» با موفقیت ایجاد شد!`);
    await loadHomeData();
    setCreateCampaignOpen(false);
    window.location.hash = `#c/${newCamp.id}/overview`;
  };

  const handleSaveMasterCharacter = async (updated: MasterCharacter) => {
    const saved = await api.updateMasterCharacter(updated);
    setSelectedMasterChar(saved);
    setMyCharacters(prev => prev.map(c => c.id === saved.id ? saved : c));
    showToast('پرونده شخصیت با موفقیت ذخیره شد.');
  };

  const handleAddMilestone = async (event: Omit<CharacterHistoryEvent, 'id' | 'timestamp'>) => {
    if (!selectedMasterChar) return;
    const added = await api.addCharacterHistoryEvent({
      ...event,
      characterId: selectedMasterChar.id
    });
    setCharHistoryEvents(prev => [added, ...prev]);
    showToast('رویداد جدید به گاه‌شمار اضافه شد.');
  };

  const handleAcceptInvite = async (code: string) => {
    try {
      const res = await api.acceptInvite(code);
      showToast('دعوت با موفقیت پذیرفته شد! در حال انتقال به کمپین...');
      await loadHomeData();
      window.location.hash = `#c/${res.campaignId}/overview`;
    } catch (err: any) {
      showToast(err.message || 'کد دعوت نامعتبر یا منقضی شده است.');
    }
  };

  // Active Character & Participation in Campaign
  const activeCharacter = characters.find(c => c.id === activeCharId) || characters[0] || null;
  const activeParticipation = activeCharacter ? (campaignParticipations.find(p => p.characterId === activeCharacter.id) || null) : null;

  return (
    <div className="min-h-screen text-[#EDE6D8] flex flex-col font-sans selection:bg-[#E0A030]/25 selection:text-[#E0A030]" dir="rtl">
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
        // Multi-Campaign Props
        activeCampaignName={activeCampaign?.name}
        activeCampaignRole={activeCampaign?.myRole}
        viewMode={viewMode}
        onOpenCampaignSwitcher={() => setCampaignSwitcherOpen(true)}
        onGoHome={() => {
          setViewMode('home');
          window.location.hash = '#/';
        }}
        onOpenCampaignSettings={() => setCampaignSettingsOpen(true)}
        onOpenCampaignMembers={() => setCampaignMembersOpen(true)}
        onOpenCampaignInvites={() => setCampaignInvitesOpen(true)}
        onOpenCampaignApprovals={() => setCampaignApprovalsOpen(true)}
        pendingApprovalsCount={pendingApprovals.length}
        levelUpAvailable={Boolean(activeParticipation?.levelUpAvailable)}
        onOpenLevelUp={() => setLevelUpModalOpen(true)}
      />

      {/* Sticky Character Header & Sub-Tabs (In Campaign Space, Player View) */}
      {viewMode === 'campaign_space' && activeCharacter && !isDmView && (activePlayerTab === 'overview' || activePlayerTab === 'abilities' || activePlayerTab === 'combat' || activePlayerTab === 'companions') && (
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 pt-3 sm:pt-6 pb-28 sm:pb-24 overflow-x-hidden">
        <Suspense fallback={<TabSkeleton />}>
          {/* VIEW 1: HOME DASHBOARD */}
          {viewMode === 'home' && (
            <HomeScreen
              currentUser={currentUser}
              myCampaigns={myCampaigns}
              myCharacters={myCharacters}
              pendingInvites={pendingInvites}
              pendingApprovals={pendingApprovals}
              draftParticipations={draftParticipations}
              onSelectCampaign={handleSelectCampaign}
              onOpenCreateCampaign={() => {
                setWizardDraftCampaign(null);
                setCreateCampaignOpen(true);
              }}
              onOpenCharacterMaster={(charId) => {
                window.location.hash = `#/characters/${charId}`;
              }}
              onOpenCreateCharacter={async () => {
                const newChar = await api.createMasterCharacter({
                  name: `شخصیت جدید ${currentUser?.displayName || currentUser?.name || ''}`.trim()
                });
                setMyCharacters(prev => [newChar, ...prev]);
                showToast('پرونده شخصیت جدید ایجاد گردید.');
                window.location.hash = `#/characters/${newChar.id}`;
              }}
              onOpenCharacterWizard={(campId) => handleOpenCharacterWizard(campId)}
              onResumeDraft={(draft) => handleOpenCharacterWizard(draft.campaignId, draft)}
              onOpenApprovals={() => setCampaignApprovalsOpen(true)}
              onAcceptInvite={handleAcceptInvite}
            />
          )}

          {/* VIEW 2: MASTER CHARACTER SCREEN */}
          {viewMode === 'character_master' && selectedMasterChar && (
            <MasterCharacterScreen
              character={selectedMasterChar}
              history={charHistoryEvents}
              participations={charParticipations}
              onBack={() => {
                setViewMode('home');
                window.location.hash = '#/';
              }}
              onSaveCharacter={handleSaveMasterCharacter}
              onAddMilestone={handleAddMilestone}
              onOpenJoinCampaign={(charId) => {
                setJoinCampaignModal({
                  isOpen: true,
                  campaign: myCampaigns[0] || null,
                  characterId: charId
                });
              }}
              onSelectCampaignParticipation={(campaignId) => {
                handleSelectCampaign(campaignId);
              }}
            />
          )}

          {/* VIEW 3: CAMPAIGN WORKSPACE */}
          {viewMode === 'campaign_space' && (
            <>
              {isDmView ? (
                /* DM Tools Suite inside Campaign */
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
                  activeCampaign={activeCampaign}
                  currentUser={currentUser}
                  myCampaigns={myCampaigns}
                  onOpenSetupChecklist={() => {
                    setWizardDraftCampaign(activeCampaign);
                    setCreateCampaignOpen(true);
                  }}
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
                  onCreateLocation={async (loc) => {
                    const created = await api.createLocation(loc);
                    setLocations(prev => [...prev, created]);
                    showToast('مکان جدید ثبت شد.');
                    return created;
                  }}
                  onUpdateLocation={async (loc) => {
                    const updated = await api.updateLocation(loc);
                    setLocations(prev => prev.map(l => l.id === loc.id ? updated : l));
                    return updated;
                  }}
                  onDeleteLocation={async (id) => {
                    await api.deleteLocation(id);
                    setLocations(prev => prev.filter(l => l.id !== id));
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
                  onGiveItemToPlayer={async (charId, item) => {
                    const updatedChar = await api.giveItemToPlayer(charId, item);
                    setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
                    showToast(`شیء به کوله‌پشتی ${updatedChar.name} افزوده شد!`);
                  }}
                  onDistributeReward={async (rewardId, charIds) => {
                    const updated = await api.distributeReward(rewardId, charIds);
                    setCharacters(updated);
                    showToast('پاداش میان ماجراجویان توزیع گردید!');
                  }}
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
                  onImportSeedIntoDb={async () => {
                    const res = await api.seedDatabase(true);
                    showToast(res.message);
                    if (activeCampaignId) await loadCampaignWorkspace(activeCampaignId);
                  }}
                  onRollDice={handleRollCheck}
                  isHttpMode={import.meta.env.VITE_API_MODE === 'http'}
                  activeDmTab={activeDmTab}
                  onRefreshCharacters={() => activeCampaignId && loadCampaignWorkspace(activeCampaignId)}
                  onCreateCharacterForPlayer={() => handleOpenCharacterWizard(activeCampaign?.id)}
                  participations={campaignParticipations}
                  onAwardXp={async (data) => {
                    if (!activeCampaignId) return;
                    if (data.isPartyWide) {
                      await api.awardXp(activeCampaignId, { amount: data.amount, reason: data.reason });
                    } else {
                      const part = campaignParticipations.find(p => p.characterId === data.characterId);
                      if (part) {
                        await api.awardXp(activeCampaignId, { amount: data.amount, reason: data.reason, participationId: part.id });
                      }
                    }
                    showToast(`امتیاز تجربه (${data.amount} XP) با موفقیت ثبت شد.`);
                    await loadCampaignWorkspace(activeCampaignId);
                  }}
                  onToggleMilestoneLevelUp={async (participationId, available) => {
                    if (!activeCampaignId) return;
                    await api.setMilestoneLevelUp(activeCampaignId, participationId, available);
                    showToast(available ? 'مجوز ارتقای مایلیستون صادر گردید.' : 'مجوز ارتقا لغو شد.');
                    await loadCampaignWorkspace(activeCampaignId);
                  }}
                  onUndoLevelUp={async (participationId) => {
                    if (!activeCampaignId) return;
                    await api.undoLevelUp(activeCampaignId, participationId);
                    showToast('آخرین ارتقای سطح واگرد (Undo) گردید.');
                    await loadCampaignWorkspace(activeCampaignId);
                  }}
                  onToggleRespecWindow={async (participationId, open) => {
                    if (!activeCampaignId) return;
                    await api.toggleRespecWindow(activeCampaignId, participationId, open);
                    showToast(open ? 'پنجره ویرایش موقت (Respec Window) باز شد.' : 'برگه کاراکتر مجدداً قفل شد.');
                    await loadCampaignWorkspace(activeCampaignId);
                  }}
                  onDmOverride={async (participationId, updates, reason) => {
                    if (!activeCampaignId) return;
                    await api.dmOverrideParticipation(activeCampaignId, participationId, updates, reason);
                    showToast('تغییرات مستقیم دانجن مستر اعمال و در لاگ ثبت شد.');
                    await loadCampaignWorkspace(activeCampaignId);
                  }}
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
                      levelUpAvailable={Boolean(activeParticipation?.levelUpAvailable)}
                      sheetLocked={activeParticipation?.sheetLocked !== 0}
                      pendingChange={activeParticipation?.pendingChange}
                      xp={activeParticipation?.xp}
                      onOpenLevelUp={() => setLevelUpModalOpen(true)}
                      onOpenSheetChangeRequest={() => setSheetChangeRequestOpen(true)}
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
                      onAddNote={async (noteData) => {
                        const newNote = await api.createNote(noteData);
                        setNotes(prev => [newNote, ...prev]);
                      }}
                      onUpdateNote={async (note) => {
                        const updated = await api.updateNote(note);
                        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
                      }}
                      onDeleteNote={async (id) => {
                        await api.deleteNote(id);
                        setNotes(prev => prev.filter(n => n.id !== id));
                      }}
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
              ) : characters.length === 0 ? (
                /* Empty state when user has no active character in this campaign */
                <div className="surface-card rounded-[14px] p-6 text-center py-12 max-w-md mx-auto space-y-4 card-gold-top border border-[#2F2A23]">
                  <div className="w-14 h-14 rounded-[12px] bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#E0A030] flex items-center justify-center mx-auto shadow-md">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h2 className="text-base font-black text-[#EDE6D8]">شخصیتی در این کمپین ندارید</h2>
                  <p className="text-xs text-[#A39A89] leading-relaxed">
                    برای ماجراجویی در کمپین <strong>{activeCampaign?.name}</strong>، یکی از شخصیت‌های خود را وارد کنید یا شخصیت جدید بسازید.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setJoinCampaignModal({
                          isOpen: true,
                          campaign: activeCampaign,
                          characterId: myCharacters[0]?.id || null
                        });
                      }}
                      className="py-2.5 px-6 rounded-[12px] btn-primary-amber font-extrabold text-xs shadow-lg transition touch-target"
                    >
                      ورود با شخصیت موجود
                    </button>
                    {allowPlayerCreateCharacter && (
                      <button
                        type="button"
                        onClick={async () => {
                          const newMaster = await api.createMasterCharacter({
                            name: `شخصیت جدید ${currentUser?.displayName || currentUser?.name || ''}`.trim()
                          });
                          setMyCharacters(prev => [newMaster, ...prev]);
                          if (activeCampaignId) {
                            await api.createParticipation(activeCampaignId, {
                              characterId: newMaster.id,
                              entryMode: 'campaign_start'
                            });
                            await loadCampaignWorkspace(activeCampaignId);
                          }
                        }}
                        className="py-2.5 px-6 rounded-[12px] bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] font-extrabold text-xs text-[#EDE6D8] transition touch-target"
                      >
                        ساخت شخصیت تازه
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Suspense>
      </main>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <BottomNav
        isHomeView={viewMode === 'home'}
        homeTab="home"
        onSelectHomeTab={(tab) => {
          if (tab === 'home') {
            setViewMode('home');
            window.location.hash = '#/';
          } else if (tab === 'characters') {
            if (myCharacters.length > 0) {
              window.location.hash = `#/characters/${myCharacters[0].id}`;
            } else {
              setViewMode('home');
            }
          } else if (tab === 'campaigns') {
            setCampaignSwitcherOpen(true);
          } else if (tab === 'account') {
            setAccountModalOpen(true);
          }
        }}
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

      {/* Global & Multi-Campaign Modals */}
      <Suspense fallback={null}>
        {/* Campaign Fast Switcher */}
        {campaignSwitcherOpen && (
          <CampaignSwitcherModal
            isOpen={campaignSwitcherOpen}
            onClose={() => setCampaignSwitcherOpen(false)}
            campaigns={myCampaigns}
            activeCampaignId={activeCampaignId}
            onSelectCampaign={(cId) => {
              handleSelectCampaign(cId);
            }}
            onGoHome={() => {
              setViewMode('home');
              window.location.hash = '#/';
            }}
            onOpenCreateCampaign={() => {
              setCampaignSwitcherOpen(false);
              setCreateCampaignOpen(true);
            }}
          />
        )}

        {/* Campaign Wizard Modal (Phase 2 Wizard) */}
        {createCampaignOpen && (
          <CampaignWizardModal
            isOpen={createCampaignOpen}
            onClose={() => {
              setCreateCampaignOpen(false);
              setWizardDraftCampaign(null);
            }}
            onLaunchSuccess={async (launched) => {
              showToast(`کمپین «${launched.name}» با موفقیت راه‌اندازی شد!`);
              await loadHomeData();
              setCreateCampaignOpen(false);
              setWizardDraftCampaign(null);
              window.location.hash = `#c/${launched.id}/overview`;
            }}
            currentUser={currentUser}
            existingDraftCampaign={wizardDraftCampaign}
            myCampaigns={myCampaigns}
          />
        )}

        {/* Join Campaign Modal */}
        {joinCampaignModal.isOpen && joinCampaignModal.campaign && (
          <JoinCampaignModal
            isOpen={joinCampaignModal.isOpen}
            onClose={() => setJoinCampaignModal({ isOpen: false, campaign: null })}
            campaign={joinCampaignModal.campaign}
            myCharacters={myCharacters}
            preSelectedCharacterId={joinCampaignModal.characterId}
            onOpenWizard={() => {
              const camp = joinCampaignModal.campaign;
              setJoinCampaignModal({ isOpen: false, campaign: null });
              if (camp) {
                handleOpenCharacterWizard(camp.id);
              }
            }}
            onJoin={async (joinData) => {
              if (!joinCampaignModal.campaign) return;
              await api.createParticipation(joinCampaignModal.campaign.id, joinData);
              showToast('درخواست پیوستن با موفقیت ثبت شد!');
              setJoinCampaignModal({ isOpen: false, campaign: null });
              await loadHomeData();
              if (activeCampaignId === joinCampaignModal.campaign.id) {
                await loadCampaignWorkspace(joinCampaignModal.campaign.id);
              }
            }}
          />
        )}

        {/* Character Creation Wizard Modal (Step 3.3) */}
        {characterWizardModal.isOpen && characterWizardModal.campaign && (
          <CharacterCreationWizardModal
            isOpen={characterWizardModal.isOpen}
            onClose={() => setCharacterWizardModal({ isOpen: false, campaign: null, draftParticipation: null })}
            campaign={characterWizardModal.campaign}
            existingDraft={characterWizardModal.draftParticipation}
            allowedClasses={classTemplates}
            availableLineages={availableLineages}
            availableBackgrounds={availableBackgrounds}
            onSaveDraft={async (draftData) => {
              if (!characterWizardModal.campaign) return;
              await api.saveDraftParticipation(characterWizardModal.campaign.id, draftData);
              const drafts = await api.listDraftParticipations().catch(() => []);
              setDraftParticipations(drafts);
              showToast('پیش‌نویس کاراکتر با موفقیت ذخیره گردید.');
            }}
            onSubmitCharacter={async (payload) => {
              if (!characterWizardModal.campaign) return;
              const result = await api.submitCharacterWizard(characterWizardModal.campaign.id, payload);
              showToast(
                result.status === 'pending_approval'
                  ? 'کاراکتر ساخته شد و در انتظار تأیید دانجن مستر قرار گرفت.'
                  : 'کاراکتر با موفقیت وارد کمپین شد!'
              );
              setCharacterWizardModal({ isOpen: false, campaign: null, draftParticipation: null });
              await loadHomeData();
              if (activeCampaignId === characterWizardModal.campaign.id) {
                await loadCampaignWorkspace(characterWizardModal.campaign.id);
              }
            }}
            onServerRollAbilities={async () => {
              return await api.rollWizardAbilities();
            }}
          />
        )}

        {/* Campaign Settings Modal (DM) */}
        {campaignSettingsOpen && activeCampaign && (
          <CampaignSettingsModal
            isOpen={campaignSettingsOpen}
            onClose={() => setCampaignSettingsOpen(false)}
            campaign={activeCampaign}
            onSaveSettings={async (updatedSettings) => {
              const saved = await api.updateCampaign(activeCampaign.id, { settings: updatedSettings });
              setActiveCampaign(saved);
              showToast('تنظیمات کمپین به‌روزرسانی شد.');
            }}
          />
        )}

        {/* Campaign Members Modal (DM) */}
        {campaignMembersOpen && activeCampaign && (
          <CampaignMembersModal
            isOpen={campaignMembersOpen}
            onClose={() => setCampaignMembersOpen(false)}
            campaign={activeCampaign}
            currentUser={currentUser}
            members={activeCampaignMembers}
            onUpdateMemberRole={async (userId, newRole) => {
              await api.updateCampaignMember(activeCampaign.id, userId, { role: newRole });
              const updatedMembers = await api.listCampaignMembers(activeCampaign.id);
              setActiveCampaignMembers(updatedMembers);
              showToast('نقش عضو تغییر یافت.');
            }}
            onRemoveMember={async (userId) => {
              await api.removeCampaignMember(activeCampaign.id, userId);
              const updatedMembers = await api.listCampaignMembers(activeCampaign.id);
              setActiveCampaignMembers(updatedMembers);
              showToast('عضو از کمپین حذف گردید.');
            }}
            onTransferOwnership={async (newOwnerId) => {
              await api.transferCampaignOwnership(activeCampaign.id, newOwnerId);
              showToast('مالکیت کمپین منتقل شد.');
              await loadHomeData();
              await loadCampaignWorkspace(activeCampaign.id);
            }}
          />
        )}

        {/* Campaign Invites Modal (DM) */}
        {campaignInvitesOpen && activeCampaign && (
          <CampaignInvitesModal
            isOpen={campaignInvitesOpen}
            onClose={() => setCampaignInvitesOpen(false)}
            campaign={activeCampaign}
            invites={campaignInvites}
            onCreateInvite={async (inviteData) => {
              const inv = await api.createCampaignInvite(activeCampaign.id, inviteData);
              setCampaignInvites(prev => [inv, ...prev]);
              showToast('کد دعوت جدید ساخته شد.');
            }}
            onRevokeInvite={async (invId) => {
              await api.revokeCampaignInvite(activeCampaign.id, invId);
              setCampaignInvites(prev => prev.filter(i => i.id !== invId));
              showToast('کد دعوت باطل گردید.');
            }}
          />
        )}

        {/* Campaign Approvals Modal (DM) */}
        {campaignApprovalsOpen && (
          <CampaignApprovalsModal
            isOpen={campaignApprovalsOpen}
            onClose={() => setCampaignApprovalsOpen(false)}
            approvals={pendingApprovals}
            onReview={async (campId, partId, action, reviewNotes) => {
              const item = pendingApprovals.find(a => a.campaignId === campId && a.participationId === partId);
              if (item?.type === 'level_up') {
                if (action === 'approve') {
                  await api.approveLevelUp(campId, partId, reviewNotes);
                } else {
                  await api.rejectLevelUp(campId, partId, reviewNotes);
                }
              } else if (item?.type === 'sheet_change') {
                await api.reviewSheetChangeRequest(campId, partId, action === 'approve' ? 'approve' : 'reject', reviewNotes);
              } else {
                await api.reviewParticipation(campId, partId, action, reviewNotes);
              }

              showToast(
                action === 'approve'
                  ? 'درخواست با موفقیت تأیید گردید.'
                  : action === 'reject'
                  ? 'درخواست رد شد.'
                  : 'درخواست اصلاح به بازیکن ارسال شد.'
              );
              await loadHomeData();
              if (activeCampaignId) {
                await loadCampaignWorkspace(activeCampaignId);
              }
            }}
          />
        )}

        {/* Level-Up Modal (Step 3.4) */}
        {levelUpModalOpen && activeCharacter && (
          <LevelUpModal
            isOpen={levelUpModalOpen}
            onClose={() => setLevelUpModalOpen(false)}
            character={activeCharacter}
            participation={activeParticipation}
            campaign={activeCampaign}
            classTemplate={classTemplates.find(t => t.id === activeCharacter.classTemplateId || t.name === activeCharacter.className)}
            onConfirmLevelUp={async (payload) => {
              if (!activeCampaign || !activeParticipation) return;
              await api.submitLevelUp(activeCampaign.id, activeParticipation.id, payload);
              showToast(
                activeCampaign.settings?.approval?.onLevelUp
                  ? 'درخواست ارتقای سطح برای تأیید دانجن مستر ارسال شد.'
                  : 'صعود به سطح جدید با موفقیت اعمال گردید!'
              );
              await loadCampaignWorkspace(activeCampaign.id);
            }}
          />
        )}

        {/* Sheet Change Request Modal (Step 3.4) */}
        {sheetChangeRequestOpen && activeCharacter && activeCampaign && activeParticipation && (
          <SheetChangeRequestModal
            isOpen={sheetChangeRequestOpen}
            onClose={() => setSheetChangeRequestOpen(false)}
            characterName={activeCharacter.name}
            campaignId={activeCampaign.id}
            participationId={activeParticipation.id}
            onSubmitRequest={async (req) => {
              await api.createSheetChangeRequest(activeCampaign.id, activeParticipation.id, JSON.stringify(req), req.reason);
              showToast('درخواست تغییر برگه برای دانجن مستر ارسال گردید.');
              await loadCampaignWorkspace(activeCampaign.id);
            }}
          />
        )}

        {/* Auth Modal */}
        {authModalState.isOpen && (
          <AuthModal
            isOpen={authModalState.isOpen}
            onClose={() => setAuthModalState(prev => ({ ...prev, isOpen: false }))}
            onSuccess={handleAuthSuccess}
            initialMode={authModalState.mode}
            initialInviteCode={authModalState.inviteCode}
            initialResetToken={authModalState.resetToken}
            onSelectPreloadedUser={api instanceof HttpApi ? undefined : handleSwitchUser}
          />
        )}

        {/* Account Modal */}
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

        {/* Dice Roller Modal (with Shared Table & Private Rolls) */}
        {diceModalOpen && (
          <DiceRollerModal
            isOpen={diceModalOpen}
            onClose={() => {
              setDiceModalOpen(false);
              setPresetRoll(null);
            }}
            presetRoll={presetRoll}
            history={diceHistory}
            campaignId={activeCampaignId}
            currentUser={currentUser}
            allowPlayerRollPrivate={activeCampaign?.settings?.allowPlayerRollPrivate ?? true}
            onAddRoll={handleAddDiceRoll}
          />
        )}

        {/* Group Rest Modal */}
        {restModal.isOpen && (
          <RestModal
            isOpen={restModal.isOpen}
            type={restModal.type}
            onClose={() => setRestModal({ isOpen: false, type: 'short' })}
            onConfirm={handleConfirmRest}
          />
        )}

        {/* Live Encounter Modal */}
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
