import React, { useState, useEffect, useRef } from 'react';
import { 
  Campaign, WizardState, WizardStartMode, CampaignSettings, 
  ContentPack, User, RuleSet, LocationEntry, Faction, NPC, 
  ItemLibraryEntry, CampaignDoc, CampaignRole, GenericCalendarData, 
  ClassTemplate 
} from '../../types';
import { api } from '../../services/api';
import { 
  Compass, Sparkles, BookOpen, Layers, ArrowRight, ArrowLeft, 
  Check, Save, AlertTriangle, Users, Shield, Calendar, MapPin, 
  Swords, Scroll, Mail, CheckCircle2, ChevronRight, X, Plus, Trash2, 
  Upload, HelpCircle, RefreshCw, Copy, ExternalLink 
} from 'lucide-react';

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
  const [houseRulesText, setHouseRulesText] = useState('قوانین رسمی ۵e به همراه قوانین خانه.');

  // Step 3: دنیا (World)
  const [calendarSource, setCalendarSource] = useState<'zorvania' | 'scratch'>('zorvania');
  const [calendarYear, setCalendarYear] = useState(1500);
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
  const [sessionZeroSchedule, setSessionZeroSchedule] = useState('پنج‌شنبه‌ها ساعت ۱۸:۰۰');
  const [sessionZeroLinesAndVeils, setSessionZeroLinesAndVeils] = useState('بدون خشونت علیه بی‌گناهان، حفظ احترام متقابل بازیکنان.');
  const [sessionZeroXCard, setSessionZeroXCard] = useState(true);

  // Step 7: دعوت‌ها (Invites)
  const [invites, setInvites] = useState<{ label: string; role: CampaignRole; maxUses: number; note: string }[]>([
    { label: 'بازیکن ۱', role: 'player', maxUses: 1, note: 'خوش آمدید' }
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
        if (ans.maxEntryLevel) setMaxEntryLevel(ans.maxEntryLevel);
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
            <h3 className="text-sm font-black text-[#F2C265]">گام ۱: مشخصات هویتی و بصری کمپین</h3>
            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">نام کمپین *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثلاً: زروانیا: رازهای مهستان، سایه‌های ورنا..."
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2.5 text-sm text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">یک جمله ایده اصلی (Premise)</label>
              <input
                type="text"
                value={premise}
                onChange={e => setPremise(e.target.value)}
                placeholder="در آستانه شکستن ساعت نخستین، ماجراجویان باید حقیقت فره گم‌شده را بازیابند."
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2.5 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">توصیف جامع کمپین</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="توضیحاتی برای بازیکنان در مورد جهان، ماجرا و مقدمه آغازین..."
                rows={3}
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-3 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">برچسب‌های فضا و لحن (Tone Tags)</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {toneTags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-[#E0A030]/20 border border-[#E0A030]/30 text-[#F2C265] text-xs font-semibold flex items-center gap-1">
                    #{tag}
                    <X 
                      className="w-3.5 h-3.5 cursor-pointer hover:text-white" 
                      onClick={() => setToneTags(toneTags.filter(t => t !== tag))} 
                    />
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={toneInput}
                  onChange={e => setToneInput(e.target.value)}
                  placeholder="افزودن برچسب جدید (مثلاً اسطوره‌ای، بقا، کارآگاهی)..."
                  className="flex-1 bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[40px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (toneInput.trim() && !toneTags.includes(toneInput.trim())) {
                      setToneTags([...toneTags, toneInput.trim()]);
                      setToneInput('');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#EDE6D8] text-xs font-bold min-h-[40px]"
                >
                  افزودن
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">تصویر جلد (فشرده‌سازی خودکار ≤۱۵۰KB)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="w-full text-xs text-[#A39A89] file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E0A030] file:text-[#0E0D0C] hover:file:bg-[#F2C265] cursor-pointer"
              />
              {coverUrl && (
                <div className="mt-2 w-full h-32 rounded-xl overflow-hidden border border-[#E0A030]/30">
                  <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-[#F2C265]">گام ۲: قوانین میز و تنظیمات ۵e</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#EDE6D8] mb-1">واحد اندازه‌گیری</label>
                <select
                  value={units}
                  onChange={e => setUnits(e.target.value as any)}
                  className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2.5 text-xs text-[#EDE6D8] min-h-[44px]"
                >
                  <option value="feet">فوت (Feet - پیش‌فرض D&D 5e)</option>
                  <option value="meters">متر (Meters)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#EDE6D8] mb-1">سطح ورودی شخصیت‌ها</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={startingLevel}
                  onChange={e => setStartingLevel(Number(e.target.value))}
                  className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] min-h-[44px]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#201D19]/60 border border-[#2F2A23] space-y-2">
              <span className="text-xs font-bold text-[#EDE6D8] block">روش‌های مجاز تخصیص ویژگی‌ها (Ability Scores)</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'standard_array', label: 'آرایه استاندارد (Standard Array)' },
                  { id: 'point_buy', label: 'خرید امتیاز (Point Buy - 27)' },
                  { id: 'roll', label: 'پرتاب تاس (4d6 drop lowest)' },
                  { id: 'manual', label: 'ورود دستی' }
                ].map(m => (
                  <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={abilityMethods.includes(m.id as any)}
                      onChange={e => {
                        if (e.target.checked) setAbilityMethods([...abilityMethods, m.id as any]);
                        else setAbilityMethods(abilityMethods.filter(item => item !== m.id));
                      }}
                      className="w-4 h-4 accent-[#E0A030] rounded"
                    />
                    <span className="text-[#EDE6D8]">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#201D19]/60 border border-[#2F2A23] space-y-2">
              <span className="text-xs font-bold text-[#EDE6D8] block">تأیید دانجن مستر و پدیداری</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvalCreate}
                  onChange={e => setApprovalCreate(e.target.checked)}
                  className="w-4 h-4 accent-[#E0A030] rounded"
                />
                <span className="text-xs text-[#EDE6D8]">نیاز به تأیید مستر برای ورود شخصیت جدید (onCreate Approval)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approvalLevelUp}
                  onChange={e => setApprovalLevelUp(e.target.checked)}
                  className="w-4 h-4 accent-[#E0A030] rounded"
                />
                <span className="text-xs text-[#EDE6D8]">نیاز به تأیید ارتقای سطح توسط مستر (onLevelUp Approval)</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">قوانین خانه (House Rules Text)</label>
              <textarea
                value={houseRulesText}
                onChange={e => setHouseRulesText(e.target.value)}
                rows={3}
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-3 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-[#F2C265]">گام ۳: دنیا، گاه‌شمار و جناح‌ها</h3>

            <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
              <span className="text-xs font-bold text-[#EDE6D8] block flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#F2C265]" />
                <span>گاه‌شمار کمپین</span>
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCalendarSource('zorvania')}
                  className={`p-2.5 rounded-xl border text-right transition ${
                    calendarSource === 'zorvania'
                      ? 'border-[#E0A030] bg-[#E0A030]/10 text-[#F2C265] font-bold'
                      : 'border-[#2F2A23] bg-[#0E0D0C] text-[#A39A89]'
                  }`}
                >
                  <div className="font-bold">گاه‌شمار شاه‌روزان زروانیا</div>
                  <div className="text-[10px] text-[#A39A89] mt-0.5">۱۲ ماه ۳۰ روزه + ۵ روز برون‌گاه اساطیری</div>
                </button>

                <button
                  type="button"
                  onClick={() => setCalendarSource('scratch')}
                  className={`p-2.5 rounded-xl border text-right transition ${
                    calendarSource === 'scratch'
                      ? 'border-[#E0A030] bg-[#E0A030]/10 text-[#F2C265] font-bold'
                      : 'border-[#2F2A23] bg-[#0E0D0C] text-[#A39A89]'
                  }`}
                >
                  <div className="font-bold">گاه‌شمار اختصاصی از صفر</div>
                  <div className="text-[10px] text-[#A39A89] mt-0.5">تعریف ماه‌ها و جشن‌های دلخواه</div>
                </button>
              </div>
            </div>

            {/* Factions */}
            <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-3">
              <span className="text-xs font-bold text-[#EDE6D8] block flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#F2C265]" />
                <span>جناح‌ها و سازمان‌ها ({factionsList.length})</span>
              </span>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {factionsList.map((f, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-[#0E0D0C] border border-[#2F2A23] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#F2C265]">{f.name}</span>
                      <span className="text-[#A39A89] text-[10px] mr-2">({f.region})</span>
                      <p className="text-[11px] text-[#A39A89]">{f.description}</p>
                    </div>
                    <Trash2 
                      className="w-3.5 h-3.5 text-[#A39A89] hover:text-[#E8836B] cursor-pointer shrink-0" 
                      onClick={() => setFactionsList(factionsList.filter((_, i) => i !== idx))} 
                    />
                  </div>
                ))}
              </div>

              {/* Quick Add Faction */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#2F2A23]">
                <input
                  type="text"
                  value={newFactionName}
                  onChange={e => setNewFactionName(e.target.value)}
                  placeholder="نام جناح..."
                  className="bg-[#0E0D0C] border border-[#2F2A23] rounded-lg px-2 py-1.5 text-xs text-[#EDE6D8]"
                />
                <input
                  type="text"
                  value={newFactionDesc}
                  onChange={e => setNewFactionDesc(e.target.value)}
                  placeholder="توصیف کوتاه..."
                  className="bg-[#0E0D0C] border border-[#2F2A23] rounded-lg px-2 py-1.5 text-xs text-[#EDE6D8]"
                />
                <button
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
                  className="px-3 py-1.5 rounded-lg bg-[#2F2A23] hover:bg-[#3A342B] text-[#F2C265] text-xs font-bold"
                >
                  افزودن جناح
                </button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-[#F2C265]">گام ۴: بازیگران و شخصیت‌های غیربازیکن (Cast & NPCs)</h3>
            <p className="text-xs text-[#A39A89]">
              مجموعه‌ای از NPC‌ها، هیولاها و راویان اولیه این ماجراجویی را انتخاب یا اضافه کنید:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {castNpcs.map((n, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#EDE6D8]">{n.name}</h4>
                    <span className="text-[11px] text-[#F2C265]">{n.title || 'شخصیت'}</span>
                    <span className="text-[10px] text-[#A39A89] mr-2">جان: {n.hp} | زره: {n.ac}</span>
                  </div>
                  <Trash2 
                    className="w-4 h-4 text-[#A39A89] hover:text-[#E8836B] cursor-pointer" 
                    onClick={() => setCastNpcs(castNpcs.filter((_, i) => i !== idx))} 
                  />
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
              <span className="text-xs font-bold text-[#EDE6D8] block">افزودن سریع NPC / هیولا</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newNpcName}
                  onChange={e => setNewNpcName(e.target.value)}
                  placeholder="نام موجود یا NPC..."
                  className="bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8]"
                />
                <input
                  type="text"
                  value={newNpcTitle}
                  onChange={e => setNewNpcTitle(e.target.value)}
                  placeholder="عنوان / نقش..."
                  className="bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8]"
                />
              </div>
              <button
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
                className="w-full py-2 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#F2C265] text-xs font-bold"
              >
                ثبت در فهرست بازیگران
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-[#F2C265]">گام ۵: آیتم‌ها، آثار باستانی و پاداش‌ها (Loot & Vault)</h3>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {lootItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#F2C265]">{item.name}</h4>
                    <span className="text-[10px] text-[#A39A89]">دسته‌بندی: {item.category}</span>
                    <p className="text-[11px] text-[#EDE6D8] mt-0.5">{item.description}</p>
                  </div>
                  <Trash2 
                    className="w-4 h-4 text-[#A39A89] hover:text-[#E8836B] cursor-pointer" 
                    onClick={() => setLootItems(lootItems.filter((_, i) => i !== idx))} 
                  />
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
              <span className="text-xs font-bold text-[#EDE6D8] block">افزودن سریع آیتم</span>
              <input
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="نام شیء یا سلاح..."
                className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8]"
              />
              <input
                type="text"
                value={newItemDesc}
                onChange={e => setNewItemDesc(e.target.value)}
                placeholder="توصیف و اثر مکانیکی..."
                className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8]"
              />
              <button
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
                className="w-full py-2 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#F2C265] text-xs font-bold"
              >
                افزودن به گاوصندوق لوت
              </button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-[#F2C265]">گام ۶: سند جلسه‌ی صفر و توافقات میز بازی</h3>
            <p className="text-xs text-[#A39A89]">
              این سند به عنوان مرجع قوانین رفتاری، ایمنی و جدول زمانی برای بازیکنان قابل مطالعه خواهد بود.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">عنوان سند</label>
              <input
                type="text"
                value={sessionZeroTitle}
                onChange={e => setSessionZeroTitle(e.target.value)}
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2.5 text-xs text-[#EDE6D8] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">انتظارات و سبک بازی</label>
              <textarea
                value={sessionZeroExpectations}
                onChange={e => setSessionZeroExpectations(e.target.value)}
                rows={2}
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-3 text-xs text-[#EDE6D8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">برنامه و زمان‌بندی جلسات</label>
              <input
                type="text"
                value={sessionZeroSchedule}
                onChange={e => setSessionZeroSchedule(e.target.value)}
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2.5 text-xs text-[#EDE6D8] min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">خطوط قرمز و ایمنی (Lines & Veils)</label>
              <textarea
                value={sessionZeroLinesAndVeils}
                onChange={e => setSessionZeroLinesAndVeils(e.target.value)}
                rows={2}
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-3 text-xs text-[#EDE6D8]"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-[#201D19] border border-[#2F2A23]">
              <input
                type="checkbox"
                checked={sessionZeroXCard}
                onChange={e => setSessionZeroXCard(e.target.checked)}
                className="w-4 h-4 accent-[#E0A030] rounded"
              />
              <span className="text-xs font-bold text-[#EDE6D8]">
                پشتیبانی از کارت X برای توقف فوری موقعیت‌های ناخوشایند
              </span>
            </label>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-[#F2C265]">گام ۷: دعوت‌نامه‌ها برای بازیکنان</h3>
            <p className="text-xs text-[#A39A89]">
              برای اعضای گروه خود کدهای دعوت آماده کنید تا پس از راه‌اندازی سریعاً وارد میز شوند:
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {invites.map((inv, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#EDE6D8]">{inv.label}</h4>
                    <span className="text-[10px] text-[#F2C265]">
                      نقش: {inv.role === 'player' ? 'ماجراجو' : inv.role === 'co_dm' ? 'دستیار مستر' : 'تماشاچی'}
                    </span>
                    {inv.note && <p className="text-[11px] text-[#A39A89]">{inv.note}</p>}
                  </div>
                  <Trash2 
                    className="w-4 h-4 text-[#A39A89] hover:text-[#E8836B] cursor-pointer" 
                    onClick={() => setInvites(invites.filter((_, i) => i !== idx))} 
                  />
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
              <span className="text-xs font-bold text-[#EDE6D8] block">ساخت دعوت‌نامه جدید</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newInviteLabel}
                  onChange={e => setNewInviteLabel(e.target.value)}
                  placeholder="نام یا عنوان بازیکن..."
                  className="bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8]"
                />
                <select
                  value={newInviteRole}
                  onChange={e => setNewInviteRole(e.target.value as any)}
                  className="bg-[#0E0D0C] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8]"
                >
                  <option value="player">ماجراجو (Player)</option>
                  <option value="co_dm">دستیار دانجن مستر (Co-DM)</option>
                  <option value="spectator">تماشاچی (Spectator)</option>
                </select>
              </div>
              <button
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
                className="w-full py-2 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#F2C265] text-xs font-bold"
              >
                افزودن کد دعوت
              </button>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-[#F2C265]">گام ۸: مرور نهایی و شروع کمپین</h3>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] text-center">
                <span className="text-[10px] text-[#A39A89] block">نام کمپین</span>
                <span className="text-xs font-bold text-[#F2C265] truncate block">{name || 'بدون نام'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] text-center">
                <span className="text-[10px] text-[#A39A89] block">جناح‌ها</span>
                <span className="text-xs font-bold text-[#EDE6D8]">{factionsList.length} مورد</span>
              </div>
              <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] text-center">
                <span className="text-[10px] text-[#A39A89] block">بازیگران و NPCها</span>
                <span className="text-xs font-bold text-[#EDE6D8]">{castNpcs.length} نفر</span>
              </div>
              <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] text-center">
                <span className="text-[10px] text-[#A39A89] block">دعوت‌نامه‌ها</span>
                <span className="text-xs font-bold text-[#EDE6D8]">{invites.length} کد</span>
              </div>
            </div>

            {/* Checklist Warnings */}
            <div className="p-4 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
              <span className="text-xs font-bold text-[#EDE6D8] block flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#6F9E78]" />
                <span>بررسی نهایی وضعیت آماده‌سازی:</span>
              </span>

              <div className="space-y-1.5 text-xs text-[#EDE6D8]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6F9E78]" />
                  <span>تنظیمات قوانین، روش‌های تاس و ویژگی‌ها ثبت شد.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6F9E78]" />
                  <span>سند جلسه‌ی صفر با شرایط ایمنی و زمان‌بندی آماده شد.</span>
                </div>
                {invites.length === 0 && (
                  <div className="flex items-center gap-2 text-[#F2C265]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>هیچ کد دعوتی ساخته نشده است (می‌توانید بعداً از تنظیمات بسازید).</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-[#A39A89] leading-relaxed">
              با فشردن دکمه زیر، کمپین از حالت پیش‌نویس خارج شده و به حالت فعال (Active) درمی‌آید. تمام محتواها در ابزارهای دانجن مستر قابل ویرایش خواهند بود.
            </p>

            <button
              type="button"
              disabled={isLaunching || !name.trim()}
              onClick={handleLaunchCampaign}
              className="w-full py-3.5 rounded-xl btn-primary-amber font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Compass className="w-5 h-5" />
              <span>{isLaunching ? 'در حال راه‌اندازی کمپین...' : 'شروع کمپین و گشودن میز بازی'}</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-right" dir="rtl">
      <div className="bg-[rgba(18,16,14,0.88)] backdrop-blur-xl border border-[#E0A030]/30 rounded-t-3xl sm:rounded-3xl w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_60px_rgba(0,0,0,0.5)]">
        {/* Header Bar */}
        <div className="p-4 border-b border-[#2F2A23] flex items-center justify-between bg-[#171513]">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#F2C265]" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#F2C265]">
                {activeCampaign ? `ویزارد راه‌اندازی: ${name || 'کمپین جدید'}` : 'کمپین جدید (Campaign Wizard)'}
              </h2>
              {isSavingDraft && (
                <span className="text-[10px] text-[#F2C265] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  ذخیره خودکار پیش‌نویس...
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#2F2A23] text-[#A39A89] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification banner if any */}
        {statusMessage && (
          <div className="bg-[#E0A030]/15 border-b border-[#E0A030]/30 px-4 py-2 text-xs text-[#F2C265] flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-[#A39A89] hover:text-white">✕</button>
          </div>
        )}

        {/* START MODE SELECTION SCREEN (If mode not yet chosen) */}
        {!startMode ? (
          <div className="p-5 overflow-y-auto space-y-4">
            <div className="text-center space-y-1 mb-4">
              <h3 className="text-lg font-bold text-[#F2C265]">نقطه آغاز ماجراجویی را انتخاب کنید</h3>
              <p className="text-xs text-[#A39A89] max-w-md mx-auto">
                می‌توانید جهان خود را از صفر بسازید، از بسته‌های رسمی و آماده محتوا شروع کنید یا جهان کمپین‌های قبلی را بیاورید.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Empty Scratch */}
              <div
                onClick={() => handleSelectStartMode('empty')}
                className="p-4 rounded-2xl bg-[rgba(23,21,19,0.7)] backdrop-blur-md border border-[#2F2A23] hover:border-[#E0A030] cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2F2A23] text-[#EDE6D8] flex items-center justify-center group-hover:bg-[#E0A030] group-hover:text-[#0E0D0C] transition">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-[#EDE6D8]">الف) از صفر (خالی)</h4>
                </div>
                <p className="text-xs text-[#A39A89] leading-relaxed">
                  یک بوم سفید برای خلق مکان‌ها، قوانین خانه و هیولاهای کاملاً سفارشی شما.
                </p>
              </div>

              {/* Option B: From Content Pack */}
              <div
                onClick={() => handleSelectStartMode('pack', 'pack-zorvania')}
                className="p-4 rounded-2xl bg-[rgba(23,21,19,0.7)] backdrop-blur-md border border-[#2F2A23] hover:border-[#E0A030] cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#E0A030]/15 text-[#F2C265] flex items-center justify-center group-hover:bg-[#E0A030] group-hover:text-[#0E0D0C] transition">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-[#EDE6D8]">ب) از بسته‌ی محتوا (زروانیا)</h4>
                </div>
                <p className="text-xs text-[#A39A89] leading-relaxed">
                  ورود به جهان زروانیا با کلاس‌های اختصاصی، لور ورنا، گاه‌شمار شاه‌روزان و سلاح‌های عهد.
                </p>
              </div>

              {/* Option C: From Previous Campaign */}
              <div
                onClick={() => handleSelectStartMode('campaign', myCampaigns[0]?.id)}
                className="p-4 rounded-2xl bg-[rgba(23,21,19,0.7)] backdrop-blur-md border border-[#2F2A23] hover:border-[#E0A030] cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#9B72CF]/15 text-[#9B72CF] flex items-center justify-center group-hover:bg-[#9B72CF] group-hover:text-[#0E0D0C] transition">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-[#EDE6D8]">ج) از کمپین قبلی من</h4>
                </div>
                <p className="text-xs text-[#A39A89] leading-relaxed">
                  انتقال مکان‌ها، هیولاها و اسناد کمپین پیشین با موتور کلون و حفظ اتصال یا کپی مستقل.
                </p>
              </div>

              {/* Option D: From Campaign Template */}
              <div
                onClick={() => handleSelectStartMode('template', templates[0]?.id || 'pack-zorvania')}
                className="p-4 rounded-2xl bg-[rgba(23,21,19,0.7)] backdrop-blur-md border border-[#2F2A23] hover:border-[#E0A030] cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#7FB4D6]/15 text-[#7FB4D6] flex items-center justify-center group-hover:bg-[#7FB4D6] group-hover:text-[#0E0D0C] transition">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-[#EDE6D8]">د) از قالب کمپین</h4>
                </div>
                <p className="text-xs text-[#A39A89] leading-relaxed">
                  راه‌اندازی فوری با ساختار پیش‌ساخته‌ی قوانین، تقویم و سند جلسه صفر با اسرار پاکسازی‌شده.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* 8-STEP WIZARD */
          <>
            {/* Stepper Indicator */}
            <div className="px-4 py-2.5 bg-[#171513] border-b border-[#2F2A23] flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
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
                  <button
                    key={st.s}
                    type="button"
                    onClick={() => {
                      saveCurrentDraft(st.s);
                      setStep(st.s);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition min-h-[36px] ${
                      isCurrent
                        ? 'bg-[#E0A030] text-[#0E0D0C] shadow-sm'
                        : isDone
                        ? 'bg-[#2F2A23] text-[#F2C265]'
                        : 'text-[#A39A89] hover:text-[#EDE6D8]'
                    }`}
                  >
                    <span>{st.s}.</span>
                    <span>{st.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Step Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {renderStepContent()}
            </div>

            {/* Sticky Bottom Actions Bar */}
            <div className="p-4 bg-[#171513] border-t border-[#2F2A23] flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={step <= 1}
                onClick={handlePrevStep}
                className={`px-4 py-2.5 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#EDE6D8] text-xs font-bold transition flex items-center gap-1 min-h-[44px] ${
                  step <= 1 ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>مرحله قبل</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  saveCurrentDraft();
                  setStatusMessage('پیش‌نویس ذخیره شد. می‌توانید بعداً ادامه دهید.');
                  onClose();
                }}
                className="px-3 py-2.5 rounded-xl bg-[#201D19] border border-[#2F2A23] hover:border-[#E0A030] text-[#EDE6D8] text-xs font-semibold min-h-[44px]"
              >
                ذخیره و ادامه بعداً
              </button>

              {step < 8 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2.5 rounded-xl btn-primary-amber text-xs font-extrabold shadow-md flex items-center gap-1 min-h-[44px]"
                >
                  <span>مرحله بعد</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isLaunching || !name.trim()}
                  onClick={handleLaunchCampaign}
                  className="px-6 py-2.5 rounded-xl btn-primary-amber text-xs font-extrabold shadow-lg min-h-[44px]"
                >
                  {isLaunching ? 'در حال راه‌اندازی...' : 'شروع کمپین'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
