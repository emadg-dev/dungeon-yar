import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Campaign, WizardState, WizardStartMode, CampaignSettings, 
  ContentPack, User, RuleSet, LocationEntry, Faction, NPC, 
  ItemLibraryEntry, CampaignDoc, CampaignRole, GenericCalendarData, 
  ClassTemplate 
} from '../../types';
import { api } from '../../services/api';
import { 
  TEMPLATE_SHAHROOZAN_ZORVANIA, 
  TEMPLATE_GATHIC, 
  TEMPLATE_SIMPLE_STARTER, 
  createCampaignCalendarFromTemplate 
} from '../../../shared/rules/calendarTemplates';
import { 
  Compass, Sparkles, BookOpen, Layers, ArrowRight, ArrowLeft, 
  Check, Save, AlertTriangle, Users, Shield, Calendar, MapPin, 
  Swords, Scroll, Mail, CheckCircle2, ChevronRight, X, Plus, Trash2, 
  Upload, HelpCircle, RefreshCw, Copy, ExternalLink 
} from 'lucide-react';
import { ScrollableRow } from '../ui/ScrollableRow';
import { BottomSheet } from '../mobile/BottomSheet';

interface CampaignWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchSuccess: (campaign: Campaign) => void;
  currentUser: User | null;
  existingDraftCampaign?: Campaign | null;
  myCampaigns: Campaign[];
}

export const CampaignWizardModal: React.FC<CampaignWizardModalProps> = ({
  isOpen,
  onClose,
  onLaunchSuccess,
  currentUser,
  existingDraftCampaign,
  myCampaigns
}) => {
  // Wizard Start Mode selection or current active step
  const [startMode, setStartMode] = useState<WizardStartMode | null>(
    existingDraftCampaign?.wizardState?.startMode || null
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(
    existingDraftCampaign?.wizardState?.sourceId || null
  );

  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(existingDraftCampaign || null);
  const [step, setStep] = useState<number>(existingDraftCampaign?.wizardState?.step || 1);
  const [completedSteps, setCompletedSteps] = useState<number[]>(
    existingDraftCampaign?.wizardState?.completed || []
  );

  // Available packs for start mode B and templates for mode D
  const [contentPacks, setContentPacks] = useState<ContentPack[]>([]);
  const [templates, setTemplates] = useState<ContentPack[]>([]);

  // Step 1: مشخصات (Specs)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [premise, setPremise] = useState('');
  const [toneTags, setToneTags] = useState<string[]>(['حماسی', 'اسطوره‌ای']);
  const [toneInput, setToneInput] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // Step 2: قوانین (Rules)
  const [units, setUnits] = useState<'feet' | 'meters'>('feet');
  const [startingLevel, setStartingLevel] = useState<number>(1);
  const [maxEntryLevel, setMaxEntryLevel] = useState<number>(20);
  const [abilityMethods, setAbilityMethods] = useState<('standard_array' | 'point_buy' | 'roll' | 'manual')[]>([
    'standard_array', 'point_buy', 'roll', 'manual'
  ]);
  const [shortRestHours, setShortRestHours] = useState(1);
  const [longRestHours, setLongRestHours] = useState(8);
  const [grittyRealism, setGrittyRealism] = useState(false);
  const [trackRations, setTrackRations] = useState(false);
  const [trackWater, setTrackWater] = useState(false);
  const [approvalCreate, setApprovalCreate] = useState(false);
  const [approvalLevelUp, setApprovalLevelUp] = useState(false);
  const [backstoryVisibility, setBackstoryVisibility] = useState<'party' | 'dm_only'>('party');
  const [diceVisibility, setDiceVisibility] = useState<'table' | 'dm_only'>('table');
  const [houseRulesText, setHouseRulesText] = useState('قوانین رسمی 5e به همراه قوانین خانه.');

  // Step 3: دنیا (World)
  const [calendarSource, setCalendarSource] = useState<'zorvania' | 'gathic' | 'scratch'>('zorvania');
  const [calendarName, setCalendarName] = useState('گاه‌شمار شاه‌روزان (زروانیا)');
  const [calendarYear, setCalendarYear] = useState<number>(1500);
  const [calendarEra, setCalendarEra] = useState('پ.ر.ن');
  const [factionsList, setFactionsList] = useState<{ name: string; description: string; attitude: string; region: string }[]>([
    { name: 'موبدان آذرین', description: 'پاسداران آتش ابدی کویر', attitude: 'متحد', region: 'کویر خاموش' },
    { name: 'انجمن کنداوران', description: 'صنعتگران و معدن‌کاوان دیوان', attitude: 'بی‌طرف', region: 'سپیدارون' }
  ]);
  const [newFactionName, setNewFactionName] = useState('');
  const [newFactionDesc, setNewFactionDesc] = useState('');

  // Step 4: بازیگران (Cast)
  const [castNpcs, setCastNpcs] = useState<{ name: string; title?: string; region?: string; hp: number; ac: number }[]>([
    { name: 'فرخداد مهتر', title: 'راوی کتیبه‌ها', region: 'سپیدارون', hp: 22, ac: 13 },
    { name: 'گرگ زمان‌گسسته', title: 'هیولای بیشه', region: 'ورنا', hp: 38, ac: 14 }
  ]);
  const [newNpcName, setNewNpcName] = useState('');
  const [newNpcTitle, setNewNpcTitle] = useState('');

  // Step 5: لوت (Loot)
  const [lootItems, setLootItems] = useState<{ name: string; category: string; description: string }[]>([
    { name: 'گرز پیمان', category: 'weapon', description: 'سلاح عهد باستان با سپر نور' },
    { name: 'معجون ترمیم زمان', category: 'potion', description: 'ترمیم 2d4+2 جان' }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');

  // Step 6: جلسه‌ی صفر (Session Zero)
  const [sessionZeroTitle, setSessionZeroTitle] = useState('سند جلسه صفر و پیمان میز بازی');
  const [sessionZeroExpectations, setSessionZeroExpectations] = useState('تمرکز بر کار گروهی، حل معما و روایت داستانی.');
  const [sessionZeroSchedule, setSessionZeroSchedule] = useState('پنج‌شنبه‌ها ساعت 18:00');
  const [sessionZeroLinesAndVeils, setSessionZeroLinesAndVeils] = useState('بدون خشونت علیه بی‌گناهان، حفظ احترام متقابل بازیکنان.');
  const [sessionZeroXCard, setSessionZeroXCard] = useState(true);

  // Step 7: دعوت‌ها (Invites)
  const [invites, setInvites] = useState<{ label: string; role: CampaignRole; maxUses: number; note: string }[]>([
    { label: 'بازیکن 1', role: 'player', maxUses: 1, note: 'خوش آمدید' }
  ]);
  const [newInviteLabel, setNewInviteLabel] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<CampaignRole>('player');

  // Loading & submission state
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load content packs & templates
  useEffect(() => {
    api.listPacks().then(packs => {
      setContentPacks(packs.filter(p => p.kind === 'pack' || p.kind === 'library'));
      setTemplates(packs.filter(p => p.kind === 'campaign_template'));
    }).catch(() => {});
  }, []);

  // Initialize form state if existing draft campaign provided
  useEffect(() => {
    if (existingDraftCampaign) {
      setActiveCampaign(existingDraftCampaign);
      setName(existingDraftCampaign.name || '');
      setDescription(existingDraftCampaign.description || '');
      setPremise(existingDraftCampaign.tone || '');
      if (existingDraftCampaign.wizardState) {
        setStep(existingDraftCampaign.wizardState.step || 1);
        setCompletedSteps(existingDraftCampaign.wizardState.completed || []);
        setStartMode(existingDraftCampaign.wizardState.startMode);
        const ans = existingDraftCampaign.wizardState.answers || {};
        if (ans.name) setName(ans.name);
        if (ans.description) setDescription(ans.description);
        if (ans.premise) setPremise(ans.premise);
        if (ans.toneTags) setToneTags(ans.toneTags);
        if (ans.units) setUnits(ans.units);
        if (ans.startingLevel) setStartingLevel(ans.startingLevel);
        if (ans.calendarSource && (ans.calendarSource === 'zorvania' || ans.calendarSource === 'gathic' || ans.calendarSource === 'scratch')) {
          setCalendarSource(ans.calendarSource);
        }
        if (ans.calendarName) setCalendarName(ans.calendarName);
        if (ans.calendarYear) setCalendarYear(ans.calendarYear);
        if (ans.calendarEra) setCalendarEra(ans.calendarEra);
        if (ans.sessionZeroDoc) {
          setSessionZeroTitle(ans.sessionZeroDoc.title || sessionZeroTitle);
          setSessionZeroExpectations(ans.sessionZeroDoc.expectations || sessionZeroExpectations);
          setSessionZeroSchedule(ans.sessionZeroDoc.schedule || sessionZeroSchedule);
          setSessionZeroLinesAndVeils(ans.sessionZeroDoc.linesAndVeils || sessionZeroLinesAndVeils);
          setSessionZeroXCard(ans.sessionZeroDoc.xCardEnabled ?? true);
        }
      }
    }
  }, [existingDraftCampaign]);

  if (!isOpen) return null;

  // Handler: Compress image client-side to ≤ 150 KB
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with quality 0.75
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          const sizeBytes = Math.round((dataUrl.length * 3) / 4);

          const res = await api.uploadMedia({
            name: file.name,
            mimeType: 'image/jpeg',
            sizeBytes,
            dataBase64: dataUrl,
            width,
            height
          });
          setCoverUrl(res.url);
          setStatusMessage('تصویر جلد با موفقیت آپلود و فشرده شد.');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setStatusMessage(err.message || 'خطا در بارگذاری تصویر');
    }
  };

  // Start Mode Select Handler
  const handleSelectStartMode = async (mode: WizardStartMode, sourceId?: string) => {
    setStartMode(mode);
    setSelectedSourceId(sourceId || null);
    setIsSavingDraft(true);

    try {
      let draft: Campaign;
      if (activeCampaign) {
        draft = await api.updateWizardState(activeCampaign.id, {
          startMode: mode,
          sourceId: sourceId || null,
          step: 1
        });
      } else {
        draft = await api.createDraftCampaign(mode, sourceId);
      }
      setActiveCampaign(draft);
      setStep(1);
    } catch (err: any) {
      setStatusMessage(err.message || 'خطا در ایجاد پیش‌نویس');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Create or sync real campaign calendar for Step 3
  const createOrUpdateWizardCalendar = async (campaignId: string) => {
    const existingCals = await api.getCampaignCalendars(campaignId).catch(() => []);
    let cal = existingCals.find(c => c.scopeId === campaignId || c.scopeType === 'campaign');
    const template = calendarSource === 'gathic'
      ? TEMPLATE_GATHIC
      : calendarSource === 'scratch'
        ? TEMPLATE_SIMPLE_STARTER
        : TEMPLATE_SHAHROOZAN_ZORVANIA;

    const chosenName = calendarName.trim() || template.name;
    const chosenYear = Number(calendarYear) || template.startYear;
    const chosenEra = calendarEra.trim() || template.eraLabel;

    if (!cal || !cal.id) {
      const calData = createCampaignCalendarFromTemplate(campaignId, template, {
        name: chosenName,
        startYear: chosenYear,
        eraLabel: chosenEra
      });
      cal = await api.createCampaignCalendar(campaignId, calData);
      await api.setCampaignTime(campaignId, { epochDay: 0, calendarId: cal.id });
    } else {
      await api.updateCampaignCalendar(campaignId, cal.id, {
        name: chosenName,
        startYear: chosenYear,
        eraLabel: chosenEra
      });
    }
    return cal;
  };

  // Autosave Draft
  const saveCurrentDraft = async (targetStep = step) => {
    if (!activeCampaign) return;
    setIsSavingDraft(true);

    const answers = {
      name: name || 'کمپین در حال ساخت',
      description,
      premise,
      toneTags,
      coverUrl,
      units,
      startingLevel,
      maxEntryLevel,
      abilityScoreMethods: abilityMethods,
      shortRestHours,
      longRestHours,
      grittyRealism,
      trackRations,
      trackWater,
      approvalCreate,
      approvalLevelUp,
      backstoryVisibility,
      diceVisibility,
      houseRules: houseRulesText,
      calendarSource,
      calendarName,
      calendarYear,
      calendarEra,
      factions: factionsList,
      castNpcs,
      lootItems,
      sessionZeroDoc: {
        title: sessionZeroTitle,
        expectations: sessionZeroExpectations,
        schedule: sessionZeroSchedule,
        linesAndVeils: sessionZeroLinesAndVeils,
        xCardEnabled: sessionZeroXCard,
        houseRulesText
      },
      invitesList: invites
    };

    const newCompleted = Array.from(new Set([...completedSteps, step]));

    try {
      const updated = await api.updateWizardState(activeCampaign.id, {
        step: targetStep,
        completed: newCompleted,
        answers
      });
      setActiveCampaign(updated);
      setCompletedSteps(newCompleted);
    } catch {} finally {
      setIsSavingDraft(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 3 && activeCampaign) {
      setIsSavingDraft(true);
      try {
        await createOrUpdateWizardCalendar(activeCampaign.id);
      } catch (err: any) {
        setStatusMessage(err?.message || 'خطا در ثبت و اعتبارسنجی تقویم کمپین');
        setIsSavingDraft(false);
        return; // Halt/rollback! Do not advance past Step 3 if calendar creation fails
      }
    }
    await saveCurrentDraft(step + 1);
    setStep(prev => Math.min(prev + 1, 8));
  };

  const handlePrevStep = async () => {
    await saveCurrentDraft(step - 1);
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Launch Campaign (Step 8)
  const handleLaunchCampaign = async () => {
    if (!activeCampaign) return;
    setIsLaunching(true);
    try {
      await createOrUpdateWizardCalendar(activeCampaign.id);
      await saveCurrentDraft(8);
      const launched = await api.launchCampaign(activeCampaign.id);

      // Save initial session zero doc to campaign docs
      try {
        await api.createCampaignDoc({
          campaignId: launched.id,
          kind: 'session_zero',
          title: sessionZeroTitle,
          body: `## انتظارات و زمان‌بندی\n${sessionZeroExpectations}\n\n**برنامه بازی:** ${sessionZeroSchedule}\n\n## خطوط قرمز و ایمنی (Lines & Veils)\n${sessionZeroLinesAndVeils}\n\n**کارت X:** ${sessionZeroXCard ? 'فعال است' : 'غیرفعال'}`,
          visibility: 'party',
          sortIndex: 0
        });
      } catch {}

      onLaunchSuccess(launched);
      onClose();
    } catch (err: any) {
      setStatusMessage(err.message || 'خطا در آغاز کمپین');
    } finally {
      setIsLaunching(false);
    }
  };

  // Render Step Content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-accent-hover">گام 1: مشخصات هویتی و بصری کمپین</h3>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">نام کمپین *</label>
              <Input noWrapper
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثلاً: زروانیا: رازهای مهستان، سایه‌های ورنا..."
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">یک جمله ایده اصلی (Premise)</label>
              <Input noWrapper
                type="text"
                value={premise}
                onChange={e => setPremise(e.target.value)}
                placeholder="در آستانه شکستن ساعت نخستین، ماجراجویان باید حقیقت فره گم‌شده را بازیابند."
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">توصیف جامع کمپین</label>
              <Textarea noWrapper
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="توضیحاتی برای بازیکنان در مورد جهان، ماجرا و مقدمه آغازین..."
                rows={3}
                className="w-full bg-surface-2 border border-border rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">برچسب‌های فضا و لحن (Tone Tags)</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {toneTags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-accent/20 border border-accent/30 text-accent-hover text-xs font-semibold flex items-center gap-1">
                    #{tag}
                    <X 
                      className="w-3.5 h-3.5 cursor-pointer hover:text-white" 
                      onClick={() => setToneTags(toneTags.filter(t => t !== tag))} 
                    />
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input noWrapper
                  type="text"
                  value={toneInput}
                  onChange={e => setToneInput(e.target.value)}
                  placeholder="افزودن برچسب جدید (مثلاً اسطوره‌ای، بقا، کارآگاهی)..."
                  className="flex-1 bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent min-h-[40px]"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (toneInput.trim() && !toneTags.includes(toneInput.trim())) {
                      setToneTags([...toneTags, toneInput.trim()]);
                      setToneInput('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-surface-3 hover:bg-surface-3 text-text-primary text-xs font-bold min-h-[40px]"
                >
                  افزودن
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">تصویر جلد (فشرده‌سازی خودکار ≤150KB)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="w-full text-xs text-text-muted file:me-0 file:ms-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-accent file:text-on-accent hover:file:bg-accent-hover cursor-pointer"
              />
              {coverUrl && (
                <div className="mt-2 w-full h-32 rounded-xl overflow-hidden border border-accent/30">
                  <img
                    src={coverUrl}
                    alt="Cover preview"
                    loading="lazy"
                    decoding="async"
                    width={320}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-accent-hover">گام 2: قوانین میز و تنظیمات 5e</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">واحد اندازه‌گیری</label>
                <Select noWrapper
                  value={units}
                  onChange={e => setUnits(e.target.value as any)}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary min-h-[44px]"
                >
                  <option value="feet">فوت (Feet - پیش‌فرض D&D 5e)</option>
                  <option value="meters">متر (Meters)</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1">سطح ورودی شخصیت‌ها</label>
                <Input noWrapper
                  type="number"
                  min={1}
                  max={20}
                  value={startingLevel}
                  onChange={e => setStartingLevel(Number(e.target.value))}
                  className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary min-h-[44px]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-2">
              <span className="text-xs font-bold text-text-primary block">روش‌های مجاز تخصیص ویژگی‌ها (Ability Scores)</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'standard_array', label: 'آرایه استاندارد (Standard Array)' },
                  { id: 'point_buy', label: 'خرید امتیاز (Point Buy - 27)' },
                  { id: 'roll', label: 'پرتاب تاس (4d6 drop lowest)' },
                  { id: 'manual', label: 'ورود دستی' }
                ].map(m => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                    <Input noWrapper
                      type="checkbox"
                      checked={abilityMethods.includes(m.id as any)}
                      onChange={e => {
                        if (e.target.checked) setAbilityMethods([...abilityMethods, m.id as any]);
                        else setAbilityMethods(abilityMethods.filter(item => item !== m.id));
                      }}
                      className="w-4 h-4 accent-accent rounded"
                    />
                    <span className="text-text-primary">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-2/60 border border-border space-y-2">
              <span className="text-xs font-bold text-text-primary block">تأیید دانجن مستر و پدیداری</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <Input noWrapper
                  type="checkbox"
                  checked={approvalCreate}
                  onChange={e => setApprovalCreate(e.target.checked)}
                  className="w-4 h-4 accent-accent rounded"
                />
                <span className="text-xs text-text-primary">نیاز به تأیید مستر برای ورود شخصیت جدید (onCreate Approval)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Input noWrapper
                  type="checkbox"
                  checked={approvalLevelUp}
                  onChange={e => setApprovalLevelUp(e.target.checked)}
                  className="w-4 h-4 accent-accent rounded"
                />
                <span className="text-xs text-text-primary">نیاز به تأیید ارتقای سطح توسط مستر (onLevelUp Approval)</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">قوانین خانه (House Rules Text)</label>
              <Textarea noWrapper
                value={houseRulesText}
                onChange={e => setHouseRulesText(e.target.value)}
                rows={3}
                className="w-full bg-surface-2 border border-border rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-accent-hover">گام 3: دنیا، گاه‌شمار و جناح‌ها</h3>

            <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-3">
              <span className="text-xs font-bold text-text-primary block flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-accent-hover" />
                <span>گاه‌شمار کمپین</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <Button
                  type="button"
                  onClick={() => {
                    setCalendarSource('zorvania');
                    setCalendarName('گاه‌شمار شاه‌روزان (زروانیا)');
                    setCalendarYear(1500);
                    setCalendarEra('پ.ر.ن');
                  }}
                  className={`p-2.5 rounded-xl border text-start transition ${
                    calendarSource === 'zorvania'
                      ? 'border-accent bg-accent/10 text-accent-hover font-bold'
                      : 'border-border bg-bg text-text-muted'
                  }`}
                >
                  <div className="font-bold">شاه‌روزان زروانیا</div>
                  <div className="text-xs text-text-muted mt-0.5">۱۲ ماه ۳۰ روزه + ۵ روز برون‌گاه اساطیری</div>
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setCalendarSource('gathic');
                    setCalendarName('گاه‌شمار گاتایی (اوستایی کهن)');
                    setCalendarYear(1000);
                    setCalendarEra('گ.و');
                  }}
                  className={`p-2.5 rounded-xl border text-start transition ${
                    calendarSource === 'gathic'
                      ? 'border-accent bg-accent/10 text-accent-hover font-bold'
                      : 'border-border bg-bg text-text-muted'
                  }`}
                >
                  <div className="font-bold">گاه‌شمار گاتایی</div>
                  <div className="text-xs text-text-muted mt-0.5">۱۲ ماه ۳۰ روزه + ۵ گاه گاسان اوستایی</div>
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setCalendarSource('scratch');
                    setCalendarName('گاه‌شمار کمپین');
                    setCalendarYear(1);
                    setCalendarEra('س.ت');
                  }}
                  className={`p-2.5 rounded-xl border text-start transition ${
                    calendarSource === 'scratch'
                      ? 'border-accent bg-accent/10 text-accent-hover font-bold'
                      : 'border-border bg-bg text-text-muted'
                  }`}
                >
                  <div className="font-bold">گاه‌شمار از صفر</div>
                  <div className="text-xs text-text-muted mt-0.5">استارتر پایه‌ای ۱۲ ماهه آماده شخصی‌سازی</div>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">نام گاه‌شمار</label>
                  <Input noWrapper
                    type="text"
                    value={calendarName}
                    onChange={e => setCalendarName(e.target.value)}
                    placeholder="نام گاه‌شمار..."
                    className="w-full bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">سال اولیه</label>
                  <Input noWrapper
                    type="number"
                    value={calendarYear}
                    onChange={e => setCalendarYear(Number(e.target.value) || 0)}
                    placeholder="1500"
                    className="w-full bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">برچسب دوران (Era)</label>
                  <Input noWrapper
                    type="text"
                    value={calendarEra}
                    onChange={e => setCalendarEra(e.target.value)}
                    placeholder="پ.ر.ن"
                    className="w-full bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Factions */}
            <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-3">
              <span className="text-xs font-bold text-text-primary block flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-accent-hover" />
                <span>جناح‌ها و سازمان‌ها ({factionsList.length})</span>
              </span>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {factionsList.map((f, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-bg border border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-accent-hover">{f.name}</span>
                      <span className="text-text-muted text-xs me-2">({f.region})</span>
                      <p className="text-xs text-text-muted">{f.description}</p>
                    </div>
                    <Trash2 
                      className="w-3.5 h-3.5 text-text-muted hover:text-danger cursor-pointer shrink-0" 
                      onClick={() => setFactionsList(factionsList.filter((_, i) => i !== idx))} 
                    />
                  </div>
                ))}
              </div>

              {/* Quick Add Faction */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border">
                <Input noWrapper
                  type="text"
                  value={newFactionName}
                  onChange={e => setNewFactionName(e.target.value)}
                  placeholder="نام جناح..."
                  className="bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary"
                />
                <Input noWrapper
                  type="text"
                  value={newFactionDesc}
                  onChange={e => setNewFactionDesc(e.target.value)}
                  placeholder="توصیف کوتاه..."
                  className="bg-bg border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newFactionName.trim()) {
                      setFactionsList([...factionsList, {
                        name: newFactionName.trim(),
                        description: newFactionDesc.trim() || 'جناح تازه',
                        attitude: 'بی‌طرف',
                        region: 'مشترک'
                      }]);
                      setNewFactionName('');
                      setNewFactionDesc('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-surface-3 text-accent-hover text-xs font-bold"
                >
                  افزودن جناح
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-accent-hover">گام 4: بازیگران و شخصیت‌های غیربازیکن (Cast & NPCs)</h3>
            <p className="text-xs text-text-muted">
              مجموعه‌ای از NPC‌ها، هیولاها و راویان اولیه این ماجراجویی را انتخاب یا اضافه کنید:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {castNpcs.map((n, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface-2 border border-border flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">{n.name}</h4>
                    <span className="text-xs text-accent-hover">{n.title || 'شخصیت'}</span>
                    <span className="text-xs text-text-muted me-2">جان: {n.hp} | زره: {n.ac}</span>
                  </div>
                  <Trash2 
                    className="w-4 h-4 text-text-muted hover:text-danger cursor-pointer" 
                    onClick={() => setCastNpcs(castNpcs.filter((_, i) => i !== idx))} 
                  />
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
              <span className="text-xs font-bold text-text-primary block">افزودن سریع NPC / هیولا</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input noWrapper
                  type="text"
                  value={newNpcName}
                  onChange={e => setNewNpcName(e.target.value)}
                  placeholder="نام موجود یا NPC..."
                  className="bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary"
                />
                <Input noWrapper
                  type="text"
                  value={newNpcTitle}
                  onChange={e => setNewNpcTitle(e.target.value)}
                  placeholder="عنوان / نقش..."
                  className="bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary"
                />
              </div>
              <Button
                type="button"
                onClick={() => {
                  if (newNpcName.trim()) {
                    setCastNpcs([...castNpcs, {
                      name: newNpcName.trim(),
                      title: newNpcTitle.trim() || 'NPC تازه',
                      region: 'ورنا',
                      hp: 25,
                      ac: 12
                    }]);
                    setNewNpcName('');
                    setNewNpcTitle('');
                  }
                }}
                className="w-full py-2 rounded-xl bg-surface-3 hover:bg-surface-3 text-accent-hover text-xs font-bold"
              >
                ثبت در فهرست بازیگران
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-accent-hover">گام 5: آیتم‌ها، آثار باستانی و پاداش‌ها (Loot & Vault)</h3>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {lootItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface-2 border border-border flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-accent-hover">{item.name}</h4>
                    <span className="text-xs text-text-muted">دسته‌بندی: {item.category}</span>
                    <p className="text-xs text-text-primary mt-0.5">{item.description}</p>
                  </div>
                  <Trash2 
                    className="w-4 h-4 text-text-muted hover:text-danger cursor-pointer" 
                    onClick={() => setLootItems(lootItems.filter((_, i) => i !== idx))} 
                  />
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
              <span className="text-xs font-bold text-text-primary block">افزودن سریع آیتم</span>
              <Input noWrapper
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="نام شیء یا سلاح..."
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary"
              />
              <Input noWrapper
                type="text"
                value={newItemDesc}
                onChange={e => setNewItemDesc(e.target.value)}
                placeholder="توصیف و اثر مکانیکی..."
                className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary"
              />
              <Button
                type="button"
                onClick={() => {
                  if (newItemName.trim()) {
                    setLootItems([...lootItems, {
                      name: newItemName.trim(),
                      category: 'misc',
                      description: newItemDesc.trim() || 'شیء تازه'
                    }]);
                    setNewItemName('');
                    setNewItemDesc('');
                  }
                }}
                className="w-full py-2 rounded-xl bg-surface-3 hover:bg-surface-3 text-accent-hover text-xs font-bold"
              >
                افزودن به گاوصندوق لوت
              </Button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-accent-hover">گام 6: سند جلسه‌ی صفر و توافقات میز بازی</h3>
            <p className="text-xs text-text-muted">
              این سند به عنوان مرجع قوانین رفتاری، ایمنی و جدول زمانی برای بازیکنان قابل مطالعه خواهد بود.
            </p>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">عنوان سند</label>
              <Input noWrapper
                type="text"
                value={sessionZeroTitle}
                onChange={e => setSessionZeroTitle(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">انتظارات و سبک بازی</label>
              <Textarea noWrapper
                value={sessionZeroExpectations}
                onChange={e => setSessionZeroExpectations(e.target.value)}
                rows={2}
                className="w-full bg-surface-2 border border-border rounded-xl p-3 text-xs text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">برنامه و زمان‌بندی جلسات</label>
              <Input noWrapper
                type="text"
                value={sessionZeroSchedule}
                onChange={e => setSessionZeroSchedule(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">خطوط قرمز و ایمنی (Lines & Veils)</label>
              <Textarea noWrapper
                value={sessionZeroLinesAndVeils}
                onChange={e => setSessionZeroLinesAndVeils(e.target.value)}
                rows={2}
                className="w-full bg-surface-2 border border-border rounded-xl p-3 text-xs text-text-primary"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-surface-2 border border-border">
              <Input noWrapper
                type="checkbox"
                checked={sessionZeroXCard}
                onChange={e => setSessionZeroXCard(e.target.checked)}
                className="w-4 h-4 accent-accent rounded"
              />
              <span className="text-xs font-bold text-text-primary">
                پشتیبانی از کارت X برای توقف فوری موقعیت‌های ناخوشایند
              </span>
            </label>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-accent-hover">گام 7: دعوت‌نامه‌ها برای بازیکنان</h3>
            <p className="text-xs text-text-muted">
              برای اعضای گروه خود کدهای دعوت آماده کنید تا پس از راه‌اندازی سریعاً وارد میز شوند:
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {invites.map((inv, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface-2 border border-border flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">{inv.label}</h4>
                    <span className="text-xs text-accent-hover">
                      نقش: {inv.role === 'player' ? 'ماجراجو' : inv.role === 'co_dm' ? 'دستیار مستر' : 'تماشاچی'}
                    </span>
                    {inv.note && <p className="text-xs text-text-muted">{inv.note}</p>}
                  </div>
                  <Trash2 
                    className="w-4 h-4 text-text-muted hover:text-danger cursor-pointer" 
                    onClick={() => setInvites(invites.filter((_, i) => i !== idx))} 
                  />
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
              <span className="text-xs font-bold text-text-primary block">ساخت دعوت‌نامه جدید</span>
              <div className="grid grid-cols-2 gap-2">
                <Input noWrapper
                  type="text"
                  value={newInviteLabel}
                  onChange={e => setNewInviteLabel(e.target.value)}
                  placeholder="نام یا عنوان بازیکن..."
                  className="bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary"
                />
                <Select noWrapper
                  value={newInviteRole}
                  onChange={e => setNewInviteRole(e.target.value as any)}
                  className="bg-bg border border-border rounded-xl px-3 py-2 text-xs text-text-primary"
                >
                  <option value="player">ماجراجو (Player)</option>
                  <option value="co_dm">دستیار دانجن مستر (Co-DM)</option>
                  <option value="spectator">تماشاچی (Spectator)</option>
                </Select>
              </div>
              <Button
                type="button"
                onClick={() => {
                  if (newInviteLabel.trim()) {
                    setInvites([...invites, {
                      label: newInviteLabel.trim(),
                      role: newInviteRole,
                      maxUses: 1,
                      note: 'دعوت‌نامه ورود به کمپین'
                    }]);
                    setNewInviteLabel('');
                  }
                }}
                className="w-full py-2 rounded-xl bg-surface-3 hover:bg-surface-3 text-accent-hover text-xs font-bold"
              >
                افزودن کد دعوت
              </Button>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-accent-hover">گام 8: مرور نهایی و شروع کمپین</h3>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-surface-2 border border-border text-center">
                <span className="text-xs text-text-muted block">نام کمپین</span>
                <span className="text-xs font-bold text-accent-hover truncate block">{name || 'بدون نام'}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 border border-border text-center">
                <span className="text-xs text-text-muted block">جناح‌ها</span>
                <span className="text-xs font-bold text-text-primary">{factionsList.length} مورد</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 border border-border text-center">
                <span className="text-xs text-text-muted block">بازیگران و NPCها</span>
                <span className="text-xs font-bold text-text-primary">{castNpcs.length} نفر</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 border border-border text-center">
                <span className="text-xs text-text-muted block">دعوت‌نامه‌ها</span>
                <span className="text-xs font-bold text-text-primary">{invites.length} کد</span>
              </div>
            </div>

            {/* Checklist Warnings */}
            <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-2">
              <span className="text-xs font-bold text-text-primary block flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>بررسی نهایی وضعیت آماده‌سازی:</span>
              </span>

              <div className="space-y-1.5 text-xs text-text-primary">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>تنظیمات قوانین، روش‌های تاس و ویژگی‌ها ثبت شد.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>سند جلسه‌ی صفر با شرایط ایمنی و زمان‌بندی آماده شد.</span>
                </div>
                {invites.length === 0 && (
                  <div className="flex items-center gap-2 text-accent-hover">
                    <AlertTriangle className="w-4 h-4" />
                    <span>هیچ کد دعوتی ساخته نشده است (می‌توانید بعداً از تنظیمات بسازید).</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              با فشردن دکمه زیر، کمپین از حالت پیش‌نویس خارج شده و به حالت فعال (Active) درمی‌آید. تمام محتواها در ابزارهای دانجن مستر قابل ویرایش خواهند بود.
            </p>

            <Button
              type="button"
              disabled={isLaunching || !name.trim()}
              onClick={handleLaunchCampaign}
              className="w-full py-3.5 rounded-xl btn-primary font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Compass className="w-5 h-5" />
              <span>{isLaunching ? 'در حال راه‌اندازی کمپین...' : 'شروع کمپین و گشودن میز بازی'}</span>
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-accent-hover shrink-0" />
          <span className="truncate">
            {activeCampaign ? `ویزارد راه‌اندازی: ${name || 'کمپین جدید'}` : 'کمپین جدید (Campaign Wizard)'}
          </span>
        </div>
      }
      subtitle={
        isSavingDraft ? (
          <span className="text-xs text-accent-hover flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
            ذخیره خودکار پیش‌نویس...
          </span>
        ) : undefined
      }
      fullHeight
      maxWidth="max-w-3xl"
      footer={
        startMode ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              disabled={step <= 1}
              onClick={handlePrevStep}
              className={`px-4 py-2.5 rounded-xl bg-surface-3 hover:bg-surface-3 text-text-primary text-xs font-bold transition flex items-center gap-1 min-h-[44px] ${
                step <= 1 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </Button>

            <Button
              type="button"
              onClick={() => {
                saveCurrentDraft();
                setStatusMessage('پیش‌نویس ذخیره شد. می‌توانید بعداً ادامه دهید.');
                onClose();
              }}
              className="px-3 py-2.5 rounded-xl bg-surface-2 border border-border hover:border-accent text-text-primary text-xs font-semibold min-h-[44px]"
            >
              ذخیره و ادامه بعداً
            </Button>

            {step < 8 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl btn-primary text-xs font-extrabold shadow-md flex items-center gap-1 min-h-[44px]"
              >
                <span>مرحله بعد</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isLaunching || !name.trim()}
                onClick={handleLaunchCampaign}
                className="px-6 py-2.5 rounded-xl btn-primary text-xs font-extrabold shadow-lg min-h-[44px]"
              >
                {isLaunching ? 'در حال راه‌اندازی...' : 'شروع کمپین'}
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      {/* Status notification banner if any */}
      {statusMessage && (
        <div className="bg-accent/15 border border-accent/30 rounded-xl px-4 py-2 text-xs text-accent-hover flex flex-wrap items-center justify-between gap-2">
          <span>{statusMessage}</span>
          <Button onClick={() => setStatusMessage(null)} className="text-text-muted hover:text-white">✕</Button>
        </div>
      )}

      {/* START MODE SELECTION SCREEN (If mode not yet chosen) */}
      {!startMode ? (
        <div className="space-y-4">
            <div className="text-center space-y-1 mb-4">
              <h3 className="text-lg font-bold text-accent-hover">نقطه آغاز ماجراجویی را انتخاب کنید</h3>
              <p className="text-xs text-text-muted max-w-2xl mx-auto">
                می‌توانید جهان خود را از صفر بسازید، از بسته‌های رسمی و آماده محتوا شروع کنید یا جهان کمپین‌های قبلی را بیاورید.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Empty Scratch */}
              <div
                onClick={() => handleSelectStartMode('empty')}
                className="p-4 rounded-2xl bg-surface/70 backdrop-blur-md border border-border hover:border-accent cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-surface-3 text-text-primary flex items-center justify-center group-hover:bg-accent group-hover:text-on-accent transition">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">الف) از صفر (خالی)</h4>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  یک بوم سفید برای خلق مکان‌ها، قوانین خانه و هیولاهای کاملاً سفارشی شما.
                </p>
              </div>

              {/* Option B: From Content Pack */}
              <div
                onClick={() => handleSelectStartMode('pack', 'pack-zorvania')}
                className="p-4 rounded-2xl bg-surface/70 backdrop-blur-md border border-border hover:border-accent cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent-hover flex items-center justify-center group-hover:bg-accent group-hover:text-on-accent transition">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">ب) از بسته‌ی محتوا (زروانیا)</h4>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  ورود به جهان زروانیا با کلاس‌های اختصاصی، لور ورنا، گاه‌شمار شاه‌روزان و سلاح‌های عهد.
                </p>
              </div>

              {/* Option C: From Previous Campaign */}
              <div
                onClick={() => handleSelectStartMode('campaign', myCampaigns[0]?.id)}
                className="p-4 rounded-2xl bg-surface/70 backdrop-blur-md border border-border hover:border-accent cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-role-codm/15 text-role-codm flex items-center justify-center group-hover:bg-role-codm group-hover:text-on-accent transition">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">ج) از کمپین قبلی من</h4>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  انتقال مکان‌ها، هیولاها و اسناد کمپین پیشین با موتور کلون و حفظ اتصال یا کپی مستقل.
                </p>
              </div>

              {/* Option D: From Campaign Template */}
              <div
                onClick={() => handleSelectStartMode('template', templates[0]?.id || 'pack-zorvania')}
                className="p-4 rounded-2xl bg-surface/70 backdrop-blur-md border border-border hover:border-accent cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-info/15 text-info flex items-center justify-center group-hover:bg-info group-hover:text-on-accent transition">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">د) از قالب کمپین</h4>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  راه‌اندازی فوری با ساختار پیش‌ساخته‌ی قوانین، تقویم و سند جلسه صفر با اسرار پاکسازی‌شده.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* 8-STEP WIZARD */
          <>
            {/* Stepper Indicator */}
            <ScrollableRow
              activeKey={step}
              wrapperClassName="bg-surface border-b border-border"
              className="px-4 py-2.5 gap-1.5"
            >
              {[
                { s: 1, title: 'مشخصات' },
                { s: 2, title: 'قوانین' },
                { s: 3, title: 'دنیا' },
                { s: 4, title: 'بازیگران' },
                { s: 5, title: 'لوت' },
                { s: 6, title: 'جلسه صفر' },
                { s: 7, title: 'دعوت‌ها' },
                { s: 8, title: 'مرور و شروع' }
              ].map(st => {
                const isCurrent = step === st.s;
                const isDone = completedSteps.includes(st.s);
                return (
                  <Button
                    key={st.s}
                    data-key={st.s}
                    type="button"
                    onClick={() => {
                      saveCurrentDraft(st.s);
                      setStep(st.s);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 snap-start transition min-h-[44px] ${
                      isCurrent
                        ? 'bg-accent text-on-accent shadow-sm font-black'
                        : isDone
                        ? 'bg-surface-3 text-accent-hover'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <span className="shrink-0">{st.s}.</span>
                    <span className="whitespace-nowrap shrink-0">{st.title}</span>
                  </Button>
                );
              })}
            </ScrollableRow>

            {/* Step Body */}
            <div className="pt-2">
              {renderStepContent()}
            </div>
          </>
        )}
    </BottomSheet>
  );
};
