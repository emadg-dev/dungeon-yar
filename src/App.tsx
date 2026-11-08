import { Button } from "./components/ui/Button";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, Suspense, startTransition } from 'react';
import { 
  User, Character, CharacterNote, NPC, ItemLibraryEntry, 
  RewardPackage, CampaignNote, Encounter, WeaponTemplate, ClassTemplate, DiceRollResult,
  LocationEntry, PlayerEncounterView, Campaign, MasterCharacter, CampaignInvite, 
  CampaignMember, CharacterHistoryEvent, CharacterParticipation, CampaignRole, CampaignSettings,
  LineageTemplate, BackgroundTemplate, Session, SessionStatus, SessionRsvpChoice,
  SessionRecap, SessionHighlight, Quest, NotificationItem
} from './types';
import { api, HttpApi } from './services/api';
import { pageTitle } from './config/app';
import { partitionSessions } from '../shared/rules/sessionEngine';
import { Header } from './components/Header';
import { BottomNav } from './components/mobile/BottomNav';
import { CampaignMoreSheet } from './components/mobile/CampaignMoreSheet';
import { StickyHeader } from './components/common/StickyHeader';
import { Toast } from './components/common/Toast';
import { useWakeLock } from './hooks/useWakeLock';
import { useVisualViewport } from './hooks/useVisualViewport';
import { useVisibilityPolling } from './hooks/useVisibilityPolling';
import { 
  Heart, Zap, Swords, Sparkles, Shield, AlertTriangle, KeyRound, LogIn, RefreshCw, UserCheck 
} from 'lucide-react';
import { BottomSheet } from './components/mobile/BottomSheet';
import { useOfflineSync, offlineSyncManager } from './services/offlineSync';
import { PullToRefresh } from './components/common/PullToRefresh';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { usePWARefresh } from './hooks/usePWARefresh';
import { APP_NAME_FA, APP_VERSION, APP_VERSION_FA } from './config/app';

// Route-level code splitting
const OverviewTab = React.lazy(() => import('./components/character/OverviewTab').then(m => ({ default: m.OverviewTab })));
const AbilitiesTab = React.lazy(() => import('./components/character/AbilitiesTab').then(m => ({ default: m.AbilitiesTab })));
const CombatTab = React.lazy(() => import('./components/character/CombatTab').then(m => ({ default: m.CombatTab })));
const CompanionsTab = React.lazy(() => import('./components/character/CompanionsTab').then(m => ({ default: m.CompanionsTab })));
const InventoryTab = React.lazy(() => import('./components/character/InventoryTab').then(m => ({ default: m.InventoryTab })));
const NotesTab = React.lazy(() => import('./components/character/NotesTab').then(m => ({ default: m.NotesTab })));
const CodexTab = React.lazy(() => import('./components/character/CodexTab').then(m => ({ default: m.CodexTab })));
const ResourcesTab = React.lazy(() => import('./components/character/ResourcesTab').then(m => ({ default: m.ResourcesTab })));
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
const LockedFieldModal = React.lazy(() => import('./components/character/LockedFieldModal').then(m => ({ default: m.LockedFieldModal })));
const EditGrantModal = React.lazy(() => import('./components/dm/EditGrantModal').then(m => ({ default: m.EditGrantModal })));

// Step 4.1: Sessions & Scheduling Sheets
const SessionListSheet = React.lazy(() => import('./components/session/SessionListSheet').then(m => ({ default: m.SessionListSheet })));
const SessionEditorSheet = React.lazy(() => import('./components/session/SessionEditorSheet').then(m => ({ default: m.SessionEditorSheet })));
const SessionAttendanceModal = React.lazy(() => import('./components/session/SessionAttendanceModal').then(m => ({ default: m.SessionAttendanceModal })));

// Step 4.2: Session Recaps & Rewards Sheets
const SessionClosingSheet = React.lazy(() => import('./components/session/SessionClosingSheet').then(m => ({ default: m.SessionClosingSheet })));
const RecapArchiveSheet = React.lazy(() => import('./components/session/RecapArchiveSheet').then(m => ({ default: m.RecapArchiveSheet })));
const RecapEditorSheet = React.lazy(() => import('./components/session/RecapEditorSheet').then(m => ({ default: m.RecapEditorSheet })));

// Step 4.6: Notifications & Preferences
const NotificationsDrawer = React.lazy(() => import('./components/notifications/NotificationsDrawer').then(m => ({ default: m.NotificationsDrawer })));
const NotificationPreferencesModal = React.lazy(() => import('./components/notifications/NotificationPreferencesModal').then(m => ({ default: m.NotificationPreferencesModal })));

// Step 5.2: Offline Conflict Resolution Modal
const ConflictResolutionModal = React.lazy(() => import('./components/common/ConflictResolutionModal').then(m => ({ default: m.ConflictResolutionModal })));

// Step 5.4: Instance Admin Console Modal
const AdminConsoleModal = React.lazy(() => import('./components/admin/AdminConsoleModal').then(m => ({ default: m.AdminConsoleModal })));

// Stage A3: Dev-only UI Gallery route
const DevUiGallery = import.meta.env.DEV
  ? React.lazy(() => import('./components/dev/DevUiGallery').then(m => ({ default: m.DevUiGallery })))
  : null;

// Stage B: Campaign Main Map preview route
const CampaignMainMap = React.lazy(() => import('./components/map/CampaignMainMap').then(m => ({ default: m.CampaignMainMap })));

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
  const [viewMode, setViewMode] = useState<'home' | 'character_master' | 'campaign_space' | 'dev_ui' | 'dev_map'>('home');
  const [devMapCampaignId, setDevMapCampaignId] = useState<string>('zorvania-c1');
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
  const [activePlayerTab, setActivePlayerTab] = useState<'overview' | 'abilities' | 'combat' | 'companions' | 'inventory' | 'notes' | 'codex' | 'features' | 'resources'>('overview');
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
  const [adminConsoleOpen, setAdminConsoleOpen] = useState(false);
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
  const [sheetChangeRequestField, setSheetChangeRequestField] = useState<string>('');
  const [campaignEditGrants, setCampaignEditGrants] = useState<any[]>([]);
  const [isDmEditMode, setIsDmEditMode] = useState<boolean>(false);
  const [lockedFieldModal, setLockedFieldModal] = useState<{
    isOpen: boolean;
    fieldName: string;
  }>({
    isOpen: false,
    fieldName: ''
  });
  const [editGrantModalState, setEditGrantModalState] = useState<{
    isOpen: boolean;
    participationId: string;
    characterName: string;
  }>({
    isOpen: false,
    participationId: '',
    characterName: ''
  });

  // Step 4.1: Sessions & Scheduling State
  const [campaignSessions, setCampaignSessions] = useState<Session[]>([]);
  const [sessionListOpen, setSessionListOpen] = useState(false);
  const [sessionEditorModal, setSessionEditorModal] = useState<{
    isOpen: boolean;
    session?: Session | null;
  }>({
    isOpen: false,
    session: null
  });
  const [attendanceModal, setAttendanceModal] = useState<{
    isOpen: boolean;
    session: Session | null;
  }>({
    isOpen: false,
    session: null
  });

  // Step 4.2: Session Recaps & Rewards State
  const [latestRecap, setLatestRecap] = useState<SessionRecap | null>(null);
  const [campaignRecaps, setCampaignRecaps] = useState<SessionRecap[]>([]);
  const [recapArchiveOpen, setRecapArchiveOpen] = useState(false);
  const [closingSheetSession, setClosingSheetSession] = useState<Session | null>(null);
  const [recapEditorState, setRecapEditorState] = useState<{
    isOpen: boolean;
    recap?: SessionRecap | null;
    sessionId?: string;
  }>({
    isOpen: false,
    recap: null
  });
  const [pendingJoinCode, setPendingJoinCode] = useState<string>('');

  // Step 4.4: Quests State
  const [campaignQuests, setCampaignQuests] = useState<Quest[]>([]);

  // Step 4.6: Notifications State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationPrefsOpen, setNotificationPrefsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Dice & Rest Modals
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [presetRoll, setPresetRoll] = useState<{ sides: number; count: number; modifier: number; label: string } | null>(null);
  const [diceHistory, setDiceHistory] = useState<DiceRollResult[]>([]);
  const [restModal, setRestModal] = useState<{ isOpen: boolean; type: 'short' | 'long' | 'special' }>({
    isOpen: false,
    type: 'short'
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const { syncStatus, queueLength, conflicts, resolveConflict, flushQueue, isOnline } = useOfflineSync();
  const { checkForUpdates, isChecking: isCheckingUpdates } = usePWARefresh();
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [campaignMoreOpen, setCampaignMoreOpen] = useState(false);

  const handleCheckForUpdates = async () => {
    showToast(`در حال بررسی نسخه جدید ${APP_NAME_FA}...`);
    const res = await checkForUpdates();
    if (res.status === 'updated') {
      showToast('نسخه جدید دریافت شد! لطفاً برنامه را مجدداً باز کنید.');
    } else if (res.status === 'latest') {
      showToast(`شما از آخرین نسخه ${APP_NAME_FA} (${APP_VERSION_FA}) استفاده می‌کنید.`);
    } else if (res.status === 'offline') {
      showToast('دستگاه شما آفلاین است. برای بررسی به‌روزرسانی به اینترنت متصل شوید.');
    } else {
      showToast(`شما از آخرین نسخه ${APP_NAME_FA} (${APP_VERSION_FA}) استفاده می‌کنید.`);
    }
  };

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

  // Global theme state with localStorage persistence and system preference fallback
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('zorvania_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // ignore storage access errors
    }
    return 'dark';
  });

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
        if (bg) {
          metaThemeColor.setAttribute('content', bg);
        }
      }
    }
    try {
      localStorage.setItem('zorvania_theme', theme);
    } catch {}
  }, [theme]);

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
      await refreshNotifications();
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

        // Load templates and NPCs for BackstoryEditor if not already cached
        if (availableBackgrounds.length === 0 || availableLineages.length === 0) {
          const [bgs, lins] = await Promise.all([
            api.listBackgroundTemplates().catch(() => []),
            api.listLineageTemplates().catch(() => [])
          ]);
          if (bgs.length > 0) setAvailableBackgrounds(bgs);
          if (lins.length > 0) setAvailableLineages(lins);
        }
        if (npcs.length === 0) {
          const npcList = await api.listNpcs().catch(() => []);
          if (npcList.length > 0) setNpcs(npcList);
        }

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
      const grantsList = await api.listEditGrants(campaignId).catch(() => []);
      setCampaignEditGrants(grantsList);
      if (charsList.length > 0) {
        setActiveCharId(charsList[0].id);
        const hist = await api.getMasterCharacterHistory(charsList[0].id).catch(() => []);
        setCharHistoryEvents(hist);
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

      const sessList = await api.listSessions(campaignId).catch(() => []);
      setCampaignSessions(sessList);

      const [latestR, recapsList, questsList] = await Promise.all([
        api.getLatestRecap(campaignId).catch(() => null),
        api.listRecaps(campaignId).catch(() => []),
        api.listQuests(campaignId).catch(() => [])
      ]);
      setLatestRecap(latestR);
      setCampaignRecaps(recapsList);
      setCampaignQuests(questsList);

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
    if (clean === 'join') {
      const code = query.get('code') || '';
      if (!currentUser) {
        setAuthModalState({ isOpen: true, mode: 'login', inviteCode: code });
        return;
      }
      setViewMode('home');
      if (code) {
        setPendingJoinCode(code);
      }
      requestAnimationFrame(() => {
        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        const section = document.getElementById('invite-section');
        if (section) {
          section.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
        }
        const input = document.getElementById('invite-code-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
        }
      });
      return;
    }
    if (clean === 'dev/ui' || clean === 'dev') {
      setViewMode('dev_ui');
      return;
    }
    if (import.meta.env.DEV && (clean === 'dev/map' || clean.startsWith('dev/map/'))) {
      const parts = routePart.split('/');
      const cid = parts[2] || activeCampaignId || 'zorvania-c1';
      setDevMapCampaignId(cid);
      setViewMode('dev_map');
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
    startTransition(() => {
      setActivePlayerTab(tab);
    });
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
    startTransition(() => {
      setActiveDmTab(tab);
    });
    if (activeCampaignId) {
      window.location.hash = `#c/${activeCampaignId}/dm/${tab}`;
    } else {
      window.location.hash = `#dm/${tab}`;
    }
    const prevPos = scrollPositionsRef.current[`dm_${tab}`] || 0;
    setTimeout(() => window.scrollTo({ top: prevPos, behavior: 'instant' }), 20);
  };

  // Character Update with Debounced Save & Offline Queue
  const handleUpdateCharacter = useCallback((updated: Character) => {
    setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSaveStatus('saving');

    // Enqueue gameplay fields to offline sync manager
    if (activeCampaignId) {
      const part = campaignParticipations.find(p => p.characterId === updated.id);
      if (part) {
        if (updated.hp?.current !== undefined) {
          offlineSyncManager.enqueue({
            campaignId: activeCampaignId,
            participationId: part.id,
            characterId: updated.id,
            field: 'currentHp',
            baseRevision: part.revision || 1,
            value: updated.hp.current,
          });
        }
        if (updated.hp?.temp !== undefined) {
          offlineSyncManager.enqueue({
            campaignId: activeCampaignId,
            participationId: part.id,
            characterId: updated.id,
            field: 'tempHp',
            baseRevision: part.revision || 1,
            value: updated.hp.temp,
          });
        }
        if (updated.inventory) {
          offlineSyncManager.enqueue({
            campaignId: activeCampaignId,
            participationId: part.id,
            characterId: updated.id,
            field: 'inventory',
            baseRevision: part.revision || 1,
            value: updated.inventory,
          });
        }
        if (updated.customResources) {
          offlineSyncManager.enqueue({
            campaignId: activeCampaignId,
            participationId: part.id,
            characterId: updated.id,
            field: 'customResources',
            baseRevision: part.revision || 1,
            value: updated.customResources,
          });
        }
      }
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const saved = await api.updateCharacter(updated);
        setCharacters(prev => prev.map(c => c.id === saved.id ? saved : c));
        setSaveStatus('saved');
      } catch (err: any) {
        if (err?.status === 401) {
          setSessionExpiredSheetOpen(true);
        } else if (err?.status === 403 || err?.message?.includes('قفل')) {
          showToast(err.message || 'این فیلد توسط دانجن مستر قفل شده است.');
        }
        console.error('Save error:', err);
        setSaveStatus('saved');
      }
    }, 800);
  }, [activeCampaignId, campaignParticipations]);

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

  // Step 4.1 Session Handlers
  const handleRsvpSession = async (sessionId: string, status: SessionRsvpChoice, note?: string) => {
    if (!activeCampaignId) return;
    try {
      await api.rsvpSession(activeCampaignId, sessionId, status, note);
      const updatedList = await api.listSessions(activeCampaignId).catch(() => []);
      setCampaignSessions(updatedList);
      showToast('پاسخ حضور در جلسه ثبت شد.');
    } catch (e: any) {
      showToast(e.message || 'خطا در ثبت پاسخ حضور.');
    }
  };

  const handleVoteSessionPoll = async (sessionId: string, optionId: string, choice: SessionRsvpChoice) => {
    if (!activeCampaignId) return;
    try {
      await api.voteSessionPoll(activeCampaignId, sessionId, optionId, choice);
      const updatedList = await api.listSessions(activeCampaignId).catch(() => []);
      setCampaignSessions(updatedList);
      showToast('رأی شما در نظرسنجی تاریخ جلسه ثبت شد.');
    } catch (e: any) {
      showToast(e.message || 'خطا در ثبت رأی.');
    }
  };

  const handleConfirmPollOption = async (sessionId: string, optionId: string) => {
    if (!activeCampaignId) return;
    try {
      await api.confirmSessionPoll(activeCampaignId, sessionId, optionId);
      const updatedList = await api.listSessions(activeCampaignId).catch(() => []);
      setCampaignSessions(updatedList);
      showToast('تاریخ جلسه نهایی و تثبیت شد.');
    } catch (e: any) {
      showToast(e.message || 'خطا در نهایی‌سازی تاریخ جلسه.');
    }
  };

  const handleSaveSession = async (data: {
    sessionId?: string;
    title: string;
    number?: number;
    scheduledAt?: string | null;
    durationMinutes?: number;
    placeText?: string;
    onlineUrl?: string;
    status?: SessionStatus;
    inWorldDate?: string | null;
    dmNotes?: string;
    pollOptions?: Array<{ startsAt: string }>;
  }) => {
    if (!activeCampaignId) return;
    try {
      if (data.sessionId) {
        await api.updateSession(activeCampaignId, data.sessionId, data);
        showToast('جلسه با موفقیت به‌روزرسانی شد.');
      } else {
        await api.createSession(activeCampaignId, data);
        showToast('جلسه جدید با موفقیت برنامه‌ریزی شد.');
      }
      const updatedList = await api.listSessions(activeCampaignId).catch(() => []);
      setCampaignSessions(updatedList);
      setSessionEditorModal({ isOpen: false, session: null });
    } catch (e: any) {
      showToast(e.message || 'خطا در ذخیره جلسه.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!activeCampaignId) return;
    try {
      await api.deleteSession(activeCampaignId, sessionId);
      setCampaignSessions(prev => prev.filter(s => s.id !== sessionId));
      showToast('جلسه حذف گردید.');
      setSessionEditorModal({ isOpen: false, session: null });
    } catch (e: any) {
      showToast(e.message || 'خطا در حذف جلسه.');
    }
  };

  const handleSubmitAttendance = async (
    sessionId: string,
    attendance: Array<{ participationId: string; attended: boolean }>
  ) => {
    if (!activeCampaignId) return;
    try {
      const res = await api.recordSessionAttendance(activeCampaignId, sessionId, attendance);
      showToast('حضور و غیاب ثبت و جلسه پایان یافت.');
      const doneSession = res?.session || campaignSessions.find(s => s.id === sessionId) || attendanceModal.session;
      setAttendanceModal({ isOpen: false, session: null });
      await loadCampaignWorkspace(activeCampaignId);
      // Automatically show closing sheet for the completed session
      if (doneSession) {
        setClosingSheetSession(doneSession);
      }
    } catch (e: any) {
      showToast(e.message || 'خطا در ثبت حضور و غیاب.');
    }
  };

  // Step 4.2: Session Recaps & Rewards Handlers
  const handleSaveRecap = async (recapData: any) => {
    if (!activeCampaignId) return;
    try {
      if (recapData.id) {
        const updated = await api.updateRecap(activeCampaignId, recapData.id, recapData);
        setCampaignRecaps(prev => prev.map(r => r.id === updated.id ? updated : r));
        if (latestRecap?.id === updated.id) setLatestRecap(updated);
        showToast('خلاصه جلسه به‌روزرسانی شد.');
      } else {
        const created = await api.createRecap(activeCampaignId, recapData);
        setCampaignRecaps(prev => [created, ...prev]);
        if (created.status === 'published') {
          setLatestRecap(created);
        }
        showToast('خلاصه جدید با موفقیت ثبت شد.');
      }
      setRecapEditorState({ isOpen: false, recap: null });
      const latest = await api.getLatestRecap(activeCampaignId).catch(() => null);
      setLatestRecap(latest);
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره خلاصه.');
      throw err;
    }
  };

  const handleDeleteRecap = async (recapId: string) => {
    if (!activeCampaignId) return;
    try {
      await api.deleteRecap(activeCampaignId, recapId);
      setCampaignRecaps(prev => prev.filter(r => r.id !== recapId));
      if (latestRecap?.id === recapId) {
        const latest = await api.getLatestRecap(activeCampaignId).catch(() => null);
        setLatestRecap(latest);
      }
      showToast('خلاصه جلسه حذف شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف خلاصه.');
    }
  };

  const handleCloseSessionSubmit = async (data: {
    recap?: any;
    rewards?: any;
    highlights?: Array<{ participationId?: string; text: string; visibleToPlayer: boolean }>;
  }) => {
    if (!activeCampaignId || !closingSheetSession) return;
    try {
      await api.closeSession(activeCampaignId, closingSheetSession.id, data);
      showToast(`جلسه «${closingSheetSession.title}» پایان یافت و پاداش‌ها و خلاصه ثبت شد.`);
      setClosingSheetSession(null);
      await loadCampaignWorkspace(activeCampaignId);
    } catch (err: any) {
      showToast(err.message || 'خطا در بستن جلسه و ثبت پاداش‌ها.');
      throw err;
    }
  };

  // Step 4.4: Quest Log Handlers
  const handleToggleQuestObjective = async (questId: string, objectiveId: string, done: boolean) => {
    if (!activeCampaignId) return;
    try {
      await api.toggleQuestObjective(activeCampaignId, questId, objectiveId, done);
      setCampaignQuests(prev => prev.map(q => {
        if (q.id === questId) {
          const updatedObjectives = q.objectives.map(o => o.id === objectiveId ? { ...o, done } : o);
          return { ...q, objectives: updatedObjectives };
        }
        return q;
      }));
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر وضعیت هدف مأموریت.');
    }
  };

  const handleCreateQuest = async (questData: Partial<Quest> & { participantIds?: string[] }) => {
    if (!activeCampaignId) return;
    try {
      const created = await api.createQuest(activeCampaignId, questData);
      setCampaignQuests(prev => [...prev, created]);
      showToast('مأموریت تازه با موفقیت ثبت شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در ثبت مأموریت.');
    }
  };

  const handleUpdateQuest = async (questId: string, questData: Partial<Quest> & { participantIds?: string[] }) => {
    if (!activeCampaignId) return;
    try {
      const updated = await api.updateQuest(activeCampaignId, questId, questData);
      setCampaignQuests(prev => prev.map(q => q.id === questId ? updated : q));
      showToast('مأموریت با موفقیت به‌روزرسانی شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره تغییرات مأموریت.');
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    if (!activeCampaignId) return;
    try {
      await api.deleteQuest(activeCampaignId, questId);
      setCampaignQuests(prev => prev.filter(q => q.id !== questId));
      showToast('مأموریت حذف شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف مأموریت.');
    }
  };

  const handleCompleteQuest = async (questId: string, options?: { grantRewards?: boolean }) => {
    if (!activeCampaignId) return;
    try {
      const res = await api.completeQuest(activeCampaignId, questId, options);
      if (res.quest) {
        setCampaignQuests(prev => prev.map(q => q.id === questId ? res.quest : q));
      }
      showToast('مأموریت با موفقیت تکمیل شد!');
      if (res.rewardsGranted) {
        await loadCampaignWorkspace(activeCampaignId);
      }
    } catch (err: any) {
      showToast(err.message || 'خطا در تکمیل مأموریت.');
    }
  };

  // Step 4.6: Notifications Helpers & Polling
  const refreshNotifications = useCallback(async () => {
    try {
      const list = await api.listNotifications();
      const unread = list.filter(n => !n.readAt).length;
      setUnreadNotificationsCount(unread);
    } catch {
      // Ignore background notification check errors
    }
  }, []);

  useVisibilityPolling({
    onPoll: refreshNotifications,
    intervalMs: 30000,
    enabled: Boolean(currentUser),
  });

  const handleNotificationNavigation = async (
    targetType?: string,
    targetId?: string,
    link?: string,
    campaignId?: string | null
  ) => {
    setNotificationsOpen(false);

    if (campaignId && campaignId !== activeCampaignId) {
      await handleSelectCampaign(campaignId);
    }

    if (targetType === 'session') {
      if (targetId) {
        const sess = campaignSessions.find(s => s.id === targetId);
        if (sess) {
          setAttendanceModal({ isOpen: true, session: sess });
          return;
        }
      }
      setSessionListOpen(true);
    } else if (targetType === 'quest') {
      if (isDmView) {
        setActiveDmTab('narrative');
      } else {
        handleSelectPlayerTab('codex');
      }
    } else if (targetType === 'handout') {
      if (isDmView) {
        setActiveDmTab('library');
      } else {
        handleSelectPlayerTab('codex');
      }
    } else if (targetType === 'encounter') {
      if (isDmView) {
        setActiveDmTab('encounters');
      } else {
        setLiveEncounterModalOpen(true);
      }
    } else if (targetType === 'approval') {
      setCampaignApprovalsOpen(true);
    } else if (targetType === 'level_up') {
      setLevelUpModalOpen(true);
    } else if (targetType === 'character' || targetType === 'backstory') {
      if (targetId) {
        window.location.hash = `#/characters/${targetId}`;
      }
    } else if (targetType === 'member') {
      setCampaignMembersOpen(true);
    } else if (targetType === 'invite') {
      if (viewMode !== 'home') {
        setViewMode('home');
        window.location.hash = '#/';
      }
    }
  };

  // Active Character & Participation in Campaign
  const activeCharacter = characters.find(c => c.id === activeCharId) || characters[0] || null;
  const activeParticipation = activeCharacter ? (campaignParticipations.find(p => p.characterId === activeCharacter.id) || null) : null;
  const characterGrants = campaignEditGrants.filter(g =>
    g && (g.participationId === activeParticipation?.id || g.participation_id === activeParticipation?.id)
  );

  // Pull-to-Refresh handlers
  const handleRefreshHome = async () => {
    await loadHomeData();
    showToast('داشبورد و اطلاعات به‌روزرسانی شدند.');
  };

  const handleRefreshCampaign = async () => {
    if (activeCampaignId) {
      await loadCampaignWorkspace(activeCampaignId);
      showToast('اطلاعات کمپین و وضعیت کاراکتر به‌روزرسانی شد.');
    } else {
      await loadHomeData();
    }
  };

  // Subtle horizontal slide transition variants for character sheet tabs (RTL)
  const tabSlideVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? -24 : (direction < 0 ? 24 : 0),
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 380, damping: 32 },
        opacity: { duration: 0.18, ease: 'easeOut' as const },
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? 24 : (direction < 0 ? -24 : 0),
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 380, damping: 32 },
        opacity: { duration: 0.14, ease: 'easeIn' as const },
      },
    }),
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden text-text-primary flex flex-col font-sans selection:bg-accent/25 selection:text-accent" dir="rtl">
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
        saveStatus={syncStatus !== 'saved' ? syncStatus : saveStatus}
        conflictCount={conflicts.length}
        onOpenConflicts={() => setConflictModalOpen(true)}
        queueLength={queueLength}
        isOnline={isOnline}
        onSyncNow={flushQueue}
        appVersion={APP_VERSION}
        onCheckForUpdates={handleCheckForUpdates}
        isCheckingUpdates={isCheckingUpdates}
        isDmView={isDmView}
        onToggleDmView={() => setIsDmView(!isDmView)}
        wakeLockActive={wakeLockActive}
        onToggleWakeLock={toggleWakeLock}
        wakeLockSupported={wakeLockSupported}
        fontScale={fontScale}
        onToggleFontScale={toggleFontScale}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeEncounter={activeLiveEncounter ? { id: activeLiveEncounter.id, name: activeLiveEncounter.name } : null}
        onOpenActiveEncounter={() => setLiveEncounterModalOpen(true)}
        // Multi-Campaign Props
        activeCampaignName={activeCampaign?.name}
        activeCampaignRole={activeCampaign?.myRole}
        viewMode={viewMode === 'dev_ui' || viewMode === 'dev_map' ? 'home' : viewMode}
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
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenAdminConsole={() => setAdminConsoleOpen(true)}
      />

      {/* Sticky Character Header & Sub-Tabs (In Campaign Space, Player View) */}
      {viewMode === 'campaign_space' && activeCharacter && !isDmView && (activePlayerTab === 'overview' || activePlayerTab === 'abilities' || activePlayerTab === 'combat' || activePlayerTab === 'companions' || activePlayerTab === 'features' || activePlayerTab === 'resources') && (
        <StickyHeader
          character={activeCharacter}
          onUpdate={handleUpdateCharacter}
          onOpenRest={(type) => setRestModal({ isOpen: true, type })}
          activeSheetTab={activePlayerTab as any}
          onSelectSheetTab={(tab) => {
            handleSelectPlayerTab(tab as any);
          }}
        />
      )}

      {/* Main Body - Only <main> scrolls in the mobile app shell */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 pt-3 sm:pt-6 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-24 overflow-y-auto overscroll-y-contain overflow-x-hidden">
        <Suspense fallback={<TabSkeleton />}>
          {/* VIEW 1: HOME DASHBOARD */}
          {viewMode === 'home' && (
            <PullToRefresh onRefresh={handleRefreshHome}>
              <HomeScreen
              currentUser={currentUser}
              myCampaigns={myCampaigns}
              myCharacters={myCharacters}
              pendingInvites={pendingInvites}
              pendingApprovals={pendingApprovals}
              draftParticipations={draftParticipations}
              initialInviteCode={pendingJoinCode}
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
            </PullToRefresh>
          )}

          {/* VIEW 2: MASTER CHARACTER SCREEN */}
          {viewMode === 'character_master' && selectedMasterChar && (
            <MasterCharacterScreen
              character={selectedMasterChar}
              history={charHistoryEvents}
              participations={charParticipations}
              campaign={activeCampaign || myCampaigns[0] || null}
              availableCampaigns={myCampaigns}
              onLegacyJoin={async (targetCampId, notes) => {
                const newPart = await api.legacyJoinCampaign(selectedMasterChar.id, targetCampId, notes);
                showToast('ورود میراثی به کمپین جدید با موفقیت ثبت شد!');
                setCharParticipations(prev => [newPart, ...prev]);
                const hist = await api.getMasterCharacterHistory(selectedMasterChar.id).catch(() => []);
                setCharHistoryEvents(hist);
                await loadHomeData();
                return newPart;
              }}
              lineageTemplate={availableLineages.find(l => l.name === selectedMasterChar.race) || null}
              backgroundTemplate={availableBackgrounds.find(b => b.name === selectedMasterChar.backstory?.origin) || null}
              allBackgroundTemplates={availableBackgrounds}
              availableNpcs={npcs}
              isDm={isDmView || currentUser?.role === 'dm'}
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
              onLoadRevisions={() => api.listCharacterRevisions(selectedMasterChar.id)}
              onRestoreRevision={async (revId) => {
                const restored = await api.restoreCharacterRevision(selectedMasterChar.id, revId);
                setSelectedMasterChar(restored);
                showToast('نسخه قدیمی پیشینه بازگردانی شد.');
                return restored;
              }}
              onToggleReadyForReview={async (ready) => {
                const updated = await api.toggleCharacterReadyForReview(selectedMasterChar.id, ready);
                const merged = { ...selectedMasterChar, readyForReview: updated.readyForReview };
                setSelectedMasterChar(merged);
                showToast(ready ? 'پیشینه جهت بازبینی به صف دانجن‌مستر ارسال شد.' : 'علامت بازبینی برداشته شد.');
                return merged;
              }}
              onLoadComments={() => api.listBackstoryComments(selectedMasterChar.id)}
              onCreateComment={(sectionId, body) => api.createBackstoryComment(selectedMasterChar.id, sectionId, body)}
              onResolveComment={(commentId, resolved) => api.resolveBackstoryComment(selectedMasterChar.id, commentId, resolved)}
              onReviewBackstory={async (decision, comment) => {
                const res = await api.reviewCharacterBackstory(selectedMasterChar.id, decision, comment);
                const merged = { ...selectedMasterChar, reviewStatus: res.reviewStatus, reviewComment: res.reviewComment };
                setSelectedMasterChar(merged);
                showToast(decision === 'approved' ? 'پیشینه با موفقیت تأیید گردید.' : 'درخواست بازنگری برای بازیکن ارسال شد.');
                return merged;
              }}
            />
          )}

          {/* VIEW DEV: UI GALLERY (Excluded from production builds) */}
          {viewMode === 'dev_ui' && DevUiGallery && (
            <DevUiGallery />
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
                  isHttpMode={import.meta.env.VITE_API_MODE === 'http' && !(api as any).isLocalMode}
                  activeDmTab={activeDmTab}
                  onSelectDmTab={handleSelectDmTab}
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
                  sessions={campaignSessions}
                  onRsvpSession={handleRsvpSession}
                  onVoteSessionPoll={handleVoteSessionPoll}
                  onConfirmPollOption={handleConfirmPollOption}
                  onOpenSessionList={() => setSessionListOpen(true)}
                  onOpenCreateSession={() => setSessionEditorModal({ isOpen: true, session: null })}
                  onOpenAttendance={(s) => setAttendanceModal({ isOpen: true, session: s })}
                  onEditSession={(s) => setSessionEditorModal({ isOpen: true, session: s })}
                  onOpenClosingSheet={(s) => setClosingSheetSession(s)}
                  latestRecap={latestRecap}
                  onOpenRecapArchive={() => setRecapArchiveOpen(true)}
                  onOpenCreateRecap={() => setRecapEditorState({ isOpen: true, recap: null, sessionId: partitionSessions(campaignSessions).nextSession?.id })}
                  onEditRecap={(r) => setRecapEditorState({ isOpen: true, recap: r, sessionId: r.sessionId })}
                  // Step 4.4: Quests
                  quests={campaignQuests}
                  onToggleQuestObjective={handleToggleQuestObjective}
                  onCreateQuest={handleCreateQuest}
                  onUpdateQuest={handleUpdateQuest}
                  onDeleteQuest={handleDeleteQuest}
                  onCompleteQuest={handleCompleteQuest}
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
                      sheetLocked={activeParticipation?.sheetLocked !== false}
                      pendingChange={activeParticipation?.pendingChange}
                      xp={activeParticipation?.xp}
                      onOpenLevelUp={() => setLevelUpModalOpen(true)}
                      onOpenSheetChangeRequest={() => setSheetChangeRequestOpen(true)}
                      activeGrants={characterGrants}
                      isDmEditMode={isDmEditMode}
                      onToggleDmEditMode={() => setIsDmEditMode(!isDmEditMode)}
                      onOpenEditGrantModal={() => setEditGrantModalState({ isOpen: true, participationId: activeParticipation?.id || '', characterName: activeCharacter?.name || '' })}
                      onOpenLockedField={(fieldName) => setLockedFieldModal({ isOpen: true, fieldName })}
                      dmHistoryEvents={charHistoryEvents.filter(e => e.eventType === 'custom' && (e.title?.includes('DM') || e.title?.includes('مجوز') || e.title?.includes('تأیید') || e.title?.includes('تغییر')))}
                      nextSession={partitionSessions(campaignSessions).nextSession}
                      campaign={activeCampaign}
                      currentUser={currentUser}
                      userRole={activeCampaign?.myRole || (currentUser?.role === 'dm' ? 'owner' : 'player')}
                      onRsvpSession={handleRsvpSession}
                      onVoteSessionPoll={handleVoteSessionPoll}
                      onConfirmPollOption={handleConfirmPollOption}
                      onOpenSessionList={() => setSessionListOpen(true)}
                      onOpenCreateSession={() => setSessionEditorModal({ isOpen: true, session: null })}
                      onOpenAttendance={(s) => setAttendanceModal({ isOpen: true, session: s })}
                      onOpenClosingSheet={(s) => setClosingSheetSession(s)}
                      onEditSession={(s) => setSessionEditorModal({ isOpen: true, session: s })}
                      latestRecap={latestRecap}
                      npcs={npcs}
                      locations={locations}
                      campaignNotes={campaignNotes}
                      onOpenRecapArchive={() => setRecapArchiveOpen(true)}
                      onOpenCreateRecap={() => setRecapEditorState({ isOpen: true, recap: null, sessionId: partitionSessions(campaignSessions).nextSession?.id })}
                      onEditRecap={(r) => setRecapEditorState({ isOpen: true, recap: r, sessionId: r.sessionId })}
                      // Step 4.4: Quests
                      quests={campaignQuests}
                      onOpenQuests={() => setActivePlayerTab('codex')}
                      onToggleQuestObjective={handleToggleQuestObjective}
                      canToggleQuestObjective={Boolean(activeCampaign?.settings?.allowPlayerTickQuestObjectives) || isDmView}
                    />
                  )}

                  {activePlayerTab === 'abilities' && (
                    <AbilitiesTab
                      character={activeCharacter}
                      onUpdate={handleUpdateCharacter}
                      onRollCheck={handleRollCheck}
                      sheetLocked={activeParticipation?.sheetLocked !== false}
                      activeGrants={characterGrants}
                      isDm={isDmView || isDmEditMode}
                      onOpenLockedField={(fieldName) => setLockedFieldModal({ isOpen: true, fieldName })}
                    />
                  )}

                  {activePlayerTab === 'combat' && (
                    <CombatTab
                      character={activeCharacter}
                      weaponTemplates={weaponTemplates}
                      onUpdate={handleUpdateCharacter}
                      onOpenRestModal={(type) => setRestModal({ isOpen: true, type })}
                      onRollCheck={handleRollCheck}
                      sheetLocked={activeParticipation?.sheetLocked !== false}
                      activeGrants={characterGrants}
                      isDm={isDmView || isDmEditMode}
                      onOpenLockedField={(fieldName) => setLockedFieldModal({ isOpen: true, fieldName })}
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
                      campaignId={activeCampaign?.id || activeCampaignId || 'zorvania-c1'}
                      activeParticipationId={activeParticipation?.id}
                      campaignSettings={activeCampaign?.settings}
                      sheetLocked={activeParticipation?.sheetLocked !== false}
                      activeGrants={characterGrants}
                      isDm={isDmView || isDmEditMode}
                      onOpenLockedField={(fieldName) => setLockedFieldModal({ isOpen: true, fieldName })}
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
                      campaignId={activeCampaignId || 'zorvania-c1'}
                      character={activeCharacter}
                      quests={campaignQuests}
                      allowPlayerTickObjectives={Boolean(activeCampaign?.settings?.allowPlayerTickQuestObjectives)}
                      isDm={isDmView}
                      onToggleQuestObjective={handleToggleQuestObjective}
                      onCreateQuest={handleCreateQuest}
                      onUpdateQuest={handleUpdateQuest}
                      onDeleteQuest={handleDeleteQuest}
                      onCompleteQuest={handleCompleteQuest}
                    />
                  )}

                  {activePlayerTab === 'features' && (
                    <AbilitiesTab
                      character={activeCharacter}
                      onUpdate={handleUpdateCharacter}
                      onRollCheck={handleRollCheck}
                      sheetLocked={activeParticipation?.sheetLocked !== false}
                      activeGrants={characterGrants}
                      isDm={isDmView || isDmEditMode}
                      onOpenLockedField={(fieldName) => setLockedFieldModal({ isOpen: true, fieldName })}
                    />
                  )}

                  {activePlayerTab === 'resources' && (
                    <ResourcesTab
                      character={activeCharacter}
                      onUpdate={handleUpdateCharacter}
                    />
                  )}
                </div>
              ) : characters.length === 0 ? (
                /* Empty state when user has no active character in this campaign */
                <div className="surface-card rounded-[14px] p-6 text-center py-12 max-w-md mx-auto space-y-4 card-gold-top border border-border">
                  <div className="w-14 h-14 rounded-[12px] bg-accent/15 border border-accent/30 text-accent flex items-center justify-center mx-auto shadow-md">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h2 className="text-base font-black text-text-primary">شخصیتی در این کمپین ندارید</h2>
                  <p className="text-xs text-text-muted leading-relaxed">
                    برای ماجراجویی در کمپین <strong>{activeCampaign?.name}</strong>، یکی از شخصیت‌های خود را وارد کنید یا شخصیت جدید بسازید.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setJoinCampaignModal({
                          isOpen: true,
                          campaign: activeCampaign,
                          characterId: myCharacters[0]?.id || null
                        });
                      }}
                      className="py-2.5 px-6 rounded-[12px] btn-primary font-extrabold text-xs shadow-lg transition touch-target min-w-[44px]"
                    >
                      ورود با شخصیت موجود
                    </Button>
                    {allowPlayerCreateCharacter && (
                      <Button
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
                        className="py-2.5 px-6 rounded-[12px] bg-surface-2 border border-border hover:border-accent font-extrabold text-xs text-text-primary transition touch-target min-w-[44px]"
                      >
                        ساخت شخصیت تازه
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Suspense>
      </main>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <CampaignMoreSheet
        isOpen={campaignMoreOpen}
        onClose={() => setCampaignMoreOpen(false)}
        onJump={tab => {
          setCampaignMoreOpen(false);
          if (tab === 'inventory') handleSelectPlayerTab('inventory');
          else if (tab === 'companions') handleSelectPlayerTab('companions');
          else if (tab === 'rest') setRestModal({ isOpen: true, type: 'short' });
          else if (tab === 'sessions') setSessionListOpen(true);
          else if (tab === 'recaps') setRecapArchiveOpen(true);
          else if (tab === 'members') setCampaignMembersOpen(true);
          else if (tab === 'settings') setCampaignSettingsOpen(true);
          else if (tab === 'logout') handleLogout();
        }}
      />
      <BottomNav
        isHomeView={viewMode === 'home'}
        homeTab="campaigns"
        onSelectHomeTab={(tab) => {
          if (tab === 'campaigns') {
            setCampaignSwitcherOpen(true);
          } else if (tab === 'characters') {
            if (myCharacters.length > 0) {
              window.location.hash = `#/characters/${myCharacters[0].id}`;
            } else {
              setViewMode('home');
            }
          } else if (tab === 'invites') {
            window.location.hash = '#/join';
          } else if (tab === 'account') {
            setAccountModalOpen(true);
          }
        }}
        isDmView={isDmView}
        playerTab={activePlayerTab}
        onSelectPlayerTab={handleSelectPlayerTab as (tab: string) => void}
        dmTab={activeDmTab as any}
        onSelectDmTab={handleSelectDmTab as (tab: string) => void}
        onOpenDice={() => {
          setPresetRoll(null);
          setDiceModalOpen(true);
        }}
        inventoryBadge={activeCharacter?.inventory?.length || 0}
        notesBadge={notes.filter(n => n.characterId === activeCharId).length || 0}
        isKeyboardOpen={isKeyboardOpen}
        hasActiveEncounter={Boolean(activeLiveEncounter && activeLiveEncounter.status === 'active')}
        onOpenActiveEncounter={() => setLiveEncounterModalOpen(true)}
        isInCombat={Boolean(liveEncounterModalOpen)}
        queueLength={queueLength}
        isOnline={isOnline}
        onOpenCampaignMore={() => setCampaignMoreOpen(true)}
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

        {/* Locked Field Modal (Step 3.4) */}
        {lockedFieldModal.isOpen && (
          <Suspense fallback={null}>
            <LockedFieldModal
              isOpen={lockedFieldModal.isOpen}
              fieldName={lockedFieldModal.fieldName}
              characterName={activeCharacter?.name || ''}
              onClose={() => setLockedFieldModal({ isOpen: false, fieldName: '' })}
              onRequestChange={(field) => {
                const targetField = field || lockedFieldModal.fieldName;
                setLockedFieldModal({ isOpen: false, fieldName: '' });
                setSheetChangeRequestField(targetField);
                setSheetChangeRequestOpen(true);
              }}
            />
          </Suspense>
        )}

        {/* Edit Grant Modal (from character sheet DM action) */}
        {editGrantModalState.isOpen && activeCampaign && (
          <Suspense fallback={null}>
            <EditGrantModal
              isOpen={editGrantModalState.isOpen}
              onClose={() => setEditGrantModalState({ isOpen: false, participationId: '', characterName: '' })}
              characterName={editGrantModalState.characterName}
              campaignId={activeCampaign.id}
              participationId={editGrantModalState.participationId}
              onGrantCreated={async () => {
                setEditGrantModalState({ isOpen: false, participationId: '', characterName: '' });
                showToast('مجوز ویرایش برگه با موفقیت صادر گردید.');
                await loadCampaignWorkspace(activeCampaign.id);
              }}
            />
          </Suspense>
        )}

        {/* Sheet Change Request Modal (Step 3.4) */}
        {sheetChangeRequestOpen && activeCharacter && activeCampaign && activeParticipation && (
          <SheetChangeRequestModal
            isOpen={sheetChangeRequestOpen}
            onClose={() => {
              setSheetChangeRequestOpen(false);
              setSheetChangeRequestField('');
            }}
            initialField={sheetChangeRequestField}
            characterName={activeCharacter.name}
            campaignId={activeCampaign.id}
            participationId={activeParticipation.id}
            onSubmitRequest={async (req) => {
              await api.createSheetChangeRequest(activeCampaign.id, activeParticipation.id, JSON.stringify(req), req.reason);
              showToast('درخواست تغییر برگه برای دانجن مستر ارسال گردید.');
              setSheetChangeRequestField('');
              await loadCampaignWorkspace(activeCampaign.id);
            }}
          />
        )}

        {/* Session List Bottom Sheet (Step 4.1) */}
        {sessionListOpen && activeCampaign && (
          <SessionListSheet
            isOpen={sessionListOpen}
            onClose={() => setSessionListOpen(false)}
            sessions={campaignSessions}
            campaign={activeCampaign}
            currentUser={currentUser}
            userRole={activeCampaign.myRole || (currentUser?.role === 'dm' ? 'owner' : 'player')}
            onOpenCreateSession={() => {
              setSessionListOpen(false);
              setSessionEditorModal({ isOpen: true, session: null });
            }}
            onEditSession={(s) => {
              setSessionListOpen(false);
              setSessionEditorModal({ isOpen: true, session: s });
            }}
            onDeleteSession={async (sid) => {
              await handleDeleteSession(sid);
            }}
            onOpenAttendance={(s) => {
              setSessionListOpen(false);
              setAttendanceModal({ isOpen: true, session: s });
            }}
            onOpenClosingSheet={(s) => {
              setSessionListOpen(false);
              setClosingSheetSession(s);
            }}
            onOpenRecapArchive={() => {
              setSessionListOpen(false);
              setRecapArchiveOpen(true);
            }}
          />
        )}

        {/* Session Editor / Create Sheet (Step 4.1) */}
        {sessionEditorModal.isOpen && activeCampaign && (
          <SessionEditorSheet
            isOpen={sessionEditorModal.isOpen}
            onClose={() => setSessionEditorModal({ isOpen: false, session: null })}
            sessionToEdit={sessionEditorModal.session}
            campaignId={activeCampaign.id}
            onSave={handleSaveSession}
          />
        )}

        {/* Session Attendance Checklist Modal (Step 4.1) */}
        {attendanceModal.isOpen && attendanceModal.session && activeCampaign && (
          <SessionAttendanceModal
            isOpen={attendanceModal.isOpen}
            onClose={() => setAttendanceModal({ isOpen: false, session: null })}
            session={attendanceModal.session}
            campaignId={activeCampaign.id}
            characters={characters}
            participations={campaignParticipations}
            onSubmitAttendance={handleSubmitAttendance}
            onProceedToClosingSheet={(s) => {
              setClosingSheetSession(s);
            }}
          />
        )}

        {/* Session Closing Sheet (Step 4.2 - Recap, XP/Milestones, Highlights, Links) */}
        {closingSheetSession && activeCampaign && (
          <SessionClosingSheet
            isOpen={Boolean(closingSheetSession)}
            onClose={() => setClosingSheetSession(null)}
            session={closingSheetSession}
            campaign={activeCampaign}
            participations={campaignParticipations}
            characters={characters}
            npcs={npcs}
            locations={locations}
            campaignNotes={campaignNotes}
            currentUser={currentUser}
            userRole={activeCampaign.myRole || (currentUser?.role === 'dm' ? 'owner' : 'player')}
            onCloseSession={handleCloseSessionSubmit}
          />
        )}

        {/* Recap Archive Sheet (Step 4.2) */}
        {recapArchiveOpen && activeCampaign && (
          <RecapArchiveSheet
            isOpen={recapArchiveOpen}
            onClose={() => setRecapArchiveOpen(false)}
            recaps={campaignRecaps}
            sessions={campaignSessions}
            campaign={activeCampaign}
            currentUser={currentUser}
            userRole={activeCampaign.myRole || (currentUser?.role === 'dm' ? 'owner' : 'player')}
            npcs={npcs}
            locations={locations}
            campaignNotes={campaignNotes}
            onOpenCreateRecap={() => {
              setRecapEditorState({
                isOpen: true,
                recap: null,
                sessionId: partitionSessions(campaignSessions).nextSession?.id
              });
            }}
            onEditRecap={(r) => {
              setRecapEditorState({
                isOpen: true,
                recap: r,
                sessionId: r.sessionId
              });
            }}
            onDeleteRecap={handleDeleteRecap}
          />
        )}

        {/* Recap Editor Sheet (Step 4.2) */}
        {recapEditorState.isOpen && activeCampaign && (
          <RecapEditorSheet
            isOpen={recapEditorState.isOpen}
            onClose={() => setRecapEditorState({ isOpen: false, recap: null })}
            recapToEdit={recapEditorState.recap}
            sessions={campaignSessions}
            defaultSessionId={recapEditorState.sessionId}
            campaignId={activeCampaign.id}
            currentUser={currentUser}
            userRole={activeCampaign.myRole || (currentUser?.role === 'dm' ? 'owner' : 'player')}
            npcs={npcs}
            locations={locations}
            campaignNotes={campaignNotes}
            onSave={handleSaveRecap}
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
            onSelectPreloadedUser={((api as any).isLocalMode || !(api instanceof HttpApi)) ? handleSwitchUser : undefined}
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
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        )}

        {/* Instance Admin Console Modal */}
        {adminConsoleOpen && currentUser && (
          <React.Suspense fallback={null}>
            <AdminConsoleModal
              isOpen={adminConsoleOpen}
              onClose={() => setAdminConsoleOpen(false)}
              currentUser={currentUser}
            />
          </React.Suspense>
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
              <div className="w-12 h-12 rounded-full bg-accent/15 text-accent border border-accent/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs text-text-primary/90 leading-relaxed">
                نشست امنیتی شما منقضی یا توسط دستگاه دیگری خاتمه یافته است. داده‌های تغییریافته شما در حافظه دستگاه محفوظ است و پس از ورود مجدد همگام‌سازی خواهند شد.
              </p>
              <Button
                type="button"
                onClick={() => {
                  setSessionExpiredSheetOpen(false);
                  setAuthModalState({ isOpen: true, mode: 'login' });
                }}
                className="w-full py-3 rounded-[12px] btn-primary font-extrabold text-xs touch-target min-w-[44px] min-h-[48px]"
              >
                ورود مجدد به حساب کاربری
              </Button>
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

        {/* Step 4.6: Notifications Drawer */}
        <NotificationsDrawer
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          activeCampaignId={activeCampaignId}
          onNavigateToTarget={handleNotificationNavigation}
          onOpenPreferences={() => setNotificationPrefsOpen(true)}
          onUnreadCountChange={setUnreadNotificationsCount}
        />

        {/* Step 4.6: Notification Preferences Modal */}
        {notificationPrefsOpen && (
          <NotificationPreferencesModal
            isOpen={notificationPrefsOpen}
            onClose={() => setNotificationPrefsOpen(false)}
            campaignId={activeCampaignId}
          />
        )}

        {/* Step 5.2: Offline Conflict Resolution Modal */}
        {conflictModalOpen && (
          <ConflictResolutionModal
            isOpen={conflictModalOpen}
            onClose={() => setConflictModalOpen(false)}
            conflicts={conflicts}
            onResolve={async (conflictId, strategy) => {
              await resolveConflict(conflictId, strategy);
              if (conflicts.length <= 1) {
                setConflictModalOpen(false);
              }
              showToast(strategy === 'client' ? 'تغییر شما حفظ و اعمال شد.' : 'نسخه سرور پذیرفته شد.');
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
