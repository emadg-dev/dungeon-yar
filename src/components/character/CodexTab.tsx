import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import React, { useState, useEffect } from 'react';
import { NPC, ItemLibraryEntry, LocationEntry, Character, Quest, GenericCalendarData, CampaignTimeResponse } from '../../types';
import { api } from '../../services/api';
import { epochToDate, weekdayOf } from '../../../shared/rules/calendar';
import { SEED_RULES } from '../../data/seed';
import { BookOpen, Users, Sparkles, Compass, Calendar, Search, MapPin, Map as MapIcon, Scroll, Clock, Edit } from 'lucide-react';
import { Chip } from '../common/Chip';
import { HandoutsTab } from './HandoutsTab';
import { QuestsTab } from '../quest/QuestsTab';
import { FactionReputationManager } from '../campaign/FactionReputationManager';
import { ScrollableRow } from '../ui/ScrollableRow';
import { CalendarModal } from '../calendar/CalendarModal';
import { CalendarStructureModal } from '../calendar/CalendarStructureModal';

interface CodexTabProps {
  initialSubTab?: 'quests' | 'locations' | 'handouts' | 'items' | 'creatures' | 'rules' | 'calendar' | 'factions';
  initialCalendars?: GenericCalendarData[];
  initialTime?: CampaignTimeResponse | null;
  revealedNpcs: NPC[];
  revealedItems: ItemLibraryEntry[];
  revealedLocations?: LocationEntry[];
  campaignId?: string;
  character?: Character | null;
  quests?: Quest[];
  allowPlayerTickObjectives?: boolean;
  isDm?: boolean;
  onToggleQuestObjective?: (questId: string, objectiveId: string, done: boolean) => Promise<void>;
  onCreateQuest?: (questData: Partial<Quest> & { participantIds?: string[] }) => Promise<void>;
  onUpdateQuest?: (questId: string, questData: Partial<Quest> & { participantIds?: string[] }) => Promise<void>;
  onDeleteQuest?: (questId: string) => Promise<void>;
  onCompleteQuest?: (questId: string, options?: { grantRewards?: boolean }) => Promise<void>;
}

export const CodexTab: React.FC<CodexTabProps> = ({ 
  initialSubTab,
  initialCalendars,
  initialTime,
  revealedNpcs, 
  revealedItems, 
  revealedLocations = [],
  campaignId = 'zorvania-c1',
  character,
  quests = [],
  allowPlayerTickObjectives = false,
  isDm = false,
  onToggleQuestObjective,
  onCreateQuest,
  onUpdateQuest,
  onDeleteQuest,
  onCompleteQuest,
}) => {
  const [subTab, setSubTab] = useState<'quests' | 'locations' | 'handouts' | 'items' | 'creatures' | 'rules' | 'calendar' | 'factions'>(initialSubTab || 'quests');
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [structureEditorOpen, setStructureEditorOpen] = useState(false);

  // Live Campaign Calendars & Time
  const [calendars, setCalendars] = useState<GenericCalendarData[]>(initialCalendars || []);
  const [selectedCalId, setSelectedCalId] = useState<string>(() => {
    if (initialCalendars && initialCalendars.length > 0) {
      return (initialTime?.primaryCalendarId && initialCalendars.find(c => c.id === initialTime.primaryCalendarId)?.id) || initialCalendars[0].id || '';
    }
    return '';
  });
  const [campaignTime, setCampaignTime] = useState<CampaignTimeResponse | null>(initialTime || null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const loadCalendarData = async () => {
    if (!campaignId) return;
    setLoadingCalendar(true);
    try {
      const [cals, time] = await Promise.all([
        api.getCampaignCalendars(campaignId).catch(() => []),
        api.getCampaignTime(campaignId).catch(() => null)
      ]);
      setCalendars(cals || []);
      setCampaignTime(time);
      if (cals && cals.length > 0) {
        const preferred = (time?.primaryCalendarId && cals.find(c => c.id === time.primaryCalendarId)) || cals[0];
        setSelectedCalId(preferred?.id || '');
      }
    } catch {} finally {
      setLoadingCalendar(false);
    }
  };

  useEffect(() => {
    if (subTab === 'calendar') {
      loadCalendarData();
    }
  }, [subTab, campaignId]);

  const factions = [
    {
      name: 'نوژان (Nozhan)',
      motto: 'احیاگران جادو و جریان‌های کهن',
      region: 'ورنا',
      regionColor: 'bg-success/15 text-success border-success/30',
      description: 'استقبال‌کنندگان از جادو؛ این فرقه جادو و تاروپودهای باستانی را با آغوش باز می‌پذیرد و در پی احیای کامل جریان‌های ماورایی زروانیا است.'
    },
    {
      name: 'رهامان (Rohaman)',
      motto: 'نابودکنندگان آثار جادویی و تحریفات زمان',
      region: 'کویر خاموش',
      regionColor: 'bg-warning/15 text-warning border-warning/30',
      description: 'نابودکنندگان جادو؛ مصمم به محو و سوزاندن هرگونه آثار جادویی و پاکسازی تمام بقایای حاصل از فروپاشی زمان.'
    },
    {
      name: 'پیمانداران (Peymandaran)',
      motto: 'پاسداران نظم، ثبات و قوانین مدنی',
      region: 'شان‌شین',
      regionColor: 'bg-stat-ac/15 text-stat-ac border-stat-ac/30',
      description: 'طرفداران کنترل، انضباط و ثبات زمانی؛ آنان بیشترین نفوذ و تسلط اجرایی را در ارکان فعلی قدرت و حکومت در دست دارند.'
    }
  ];

  const calendarEvents = [
    { day: 'روز نخست مهر', event: 'آغاز سال نو زمانی و اعتدال پاییز', region: 'مشترک' },
    { day: 'شب 10 آبان', event: 'هم‌رسایی ماه و شکاف‌های واقعیت ورنا', region: 'ورنا' },
    { day: 'نیمه آذر', event: 'کاروان‌های بزرگ نمک در کویر خاموش', region: 'کویر خاموش' },
    { day: 'شب یلدا', event: 'جشن آتشین موبدان در سپیدارون', region: 'سپیدارون' },
    { day: 'روز 20 دی', event: 'سالگرد پیمان بزرگ ثبات در شان‌شین', region: 'شان‌شین' },
  ];

  const filteredLocations = revealedLocations.filter(loc =>
    !searchQuery || loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (loc.region && loc.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredNpcs = revealedNpcs.filter(npc =>
    !searchQuery || npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    npc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (npc.region && npc.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredItems = revealedItems.filter(item =>
    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.region && item.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRules = SEED_RULES.filter(rule =>
    !searchQuery || rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rule.description || rule.details || rule.summary || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4" dir="rtl">
      {/* Inner Tabs Strip: Quests / Locations / Handouts / Items / Creatures / Rules / Calendar / Factions */}
      <ScrollableRow
        activeKey={subTab}
        wrapperClassName="surface-card rounded-[14px] p-1.5"
        className="gap-1.5"
      >
        <Button
          type="button"
          data-key="quests"
          onClick={() => setSubTab('quests')}
          className={`py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
            subTab === 'quests'
              ? 'bg-accent text-on-accent font-black shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Scroll className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap shrink-0">مأموریت‌ها ({quests.length})</span>
        </Button>

        <Button
          type="button"
          data-key="locations"
          onClick={() => setSubTab('locations')}
          className={`py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
            subTab === 'locations'
              ? 'bg-accent text-on-accent font-black shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap shrink-0">مکان‌ها ({revealedLocations.length})</span>
        </Button>

        <Button
          type="button"
          data-key="handouts"
          onClick={() => setSubTab('handouts')}
          className={`py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
            subTab === 'handouts'
              ? 'bg-accent text-on-accent font-black shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap shrink-0">اسناد و نقشه‌ها</span>
        </Button>

        <Button
          type="button"
          data-key="items"
          onClick={() => setSubTab('items')}
          className={`py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
            subTab === 'items'
              ? 'bg-accent text-on-accent font-black shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap shrink-0">اشیاء ({revealedItems.length})</span>
        </Button>

        <Button
          type="button"
          data-key="creatures"
          onClick={() => setSubTab('creatures')}
          className={`py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
            subTab === 'creatures'
              ? 'bg-accent text-on-accent font-black shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap shrink-0">موجودات ({revealedNpcs.length})</span>
        </Button>

        <Button
          type="button"
          data-key="rules"
          onClick={() => setSubTab('rules')}
          className={`py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
            subTab === 'rules'
              ? 'bg-accent text-on-accent font-black shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap shrink-0">قوانین ({SEED_RULES.length})</span>
        </Button>

        <Button
          type="button"
          data-key="calendar"
          onClick={() => setSubTab('calendar')}
          className={`py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
            subTab === 'calendar'
              ? 'bg-accent text-on-accent font-black shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap shrink-0">گاهشمار</span>
        </Button>

        <Button
          type="button"
          data-key="factions"
          onClick={() => setSubTab('factions')}
          className={`py-2 px-3 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] whitespace-nowrap shrink-0 snap-start ${
            subTab === 'factions'
              ? 'bg-accent text-on-accent font-black shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <Compass className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap shrink-0">جناح‌ها</span>
        </Button>
      </ScrollableRow>

      {/* Quests Inner Tab */}
      {subTab === 'quests' && (
        <QuestsTab
          quests={quests}
          campaignId={campaignId}
          isDm={isDm}
          allowPlayerTickObjectives={allowPlayerTickObjectives}
          character={character}
          npcs={revealedNpcs}
          locations={revealedLocations}
          onToggleObjective={async (qId, objId, done) => {
            if (onToggleQuestObjective) {
              await onToggleQuestObjective(qId, objId, done);
            }
          }}
          onCreateQuest={onCreateQuest}
          onUpdateQuest={onUpdateQuest}
          onDeleteQuest={onDeleteQuest}
          onCompleteQuest={onCompleteQuest}
        />
      )}

      {/* Search Bar for Other Tabs */}
      {subTab !== 'quests' && subTab !== 'handouts' && (
        <div className="relative">
          <Input noWrapper
            type="text"
            placeholder="جستجو در دانشنامه زروانیا..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pe-3 ps-8 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-text-muted absolute start-2.5 top-1/2 -translate-y-1/2" />
        </div>
      )}

      {/* Locations Inner Tab */}
      {subTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredLocations.length === 0 ? (
            <div className="surface-card rounded-[14px] col-span-2 text-center py-10 text-text-muted text-xs">
              مکانی در دانشنامه فاش نشده است. با کشف و کاوش در زروانیا نقاط جدید در این بخش ثبت خواهند شد.
            </div>
          ) : (
            filteredLocations.map(loc => (
              <div key={loc.id} className="surface-card rounded-[14px] p-3.5 border border-border flex flex-col justify-between gap-2.5 card-gold-top">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-extrabold text-sm text-text-primary truncate">{loc.name}</h4>
                    <Chip variant="region" region={loc.region as any} />
                  </div>
                  {loc.imageUrl && (
                    <div className="w-full h-32 rounded-[10px] overflow-hidden border border-border bg-bg">
                      <img
                        src={loc.imageUrl}
                        alt={loc.name}
                        loading="lazy"
                        decoding="async"
                        width={320}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-text-primary/80 leading-relaxed select-text">
                    {loc.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Handouts & Maps Inner Tab */}
      {subTab === 'handouts' && (
        <HandoutsTab campaignId={campaignId || 'zorvania-c1'} character={character} />
      )}

      {/* Items Inner Tab */}
      {subTab === 'items' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.length === 0 ? (
            <div className="surface-card rounded-[14px] col-span-2 text-center py-10 text-text-muted text-xs">
              شیئی در دانشنامه فاش نشده است.
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="surface-card rounded-[14px] p-3.5 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="font-extrabold text-xs text-text-primary">{item.name}</span>
                    <Chip variant="region" region={(item.region || 'مشترک') as any} />
                  </div>
                  <p className="text-xs text-text-primary/80 leading-relaxed mb-2 select-text">
                    {item.description}
                  </p>
                </div>
                {item.rarity && (
                  <div className="text-xs text-text-muted pt-2 border-t border-border">
                    کمیابی: <span className="text-accent font-bold">{item.rarity}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Creatures Inner Tab (Revealed only) */}
      {subTab === 'creatures' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredNpcs.length === 0 ? (
            <div className="surface-card rounded-[14px] col-span-2 text-center py-10 text-text-muted text-xs">
              موجودی فاش نشده است.
            </div>
          ) : (
            filteredNpcs.map(npc => (
              <div key={npc.id} className="surface-card rounded-[14px] p-3.5 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="font-extrabold text-xs text-text-primary">{npc.name}</span>
                    <Chip variant="region" region={(npc.region || 'ورنا') as any} />
                  </div>
                  <p className="text-xs text-text-primary/80 leading-relaxed mb-2 select-text">
                    {npc.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border">
                  <span>AC: <strong className="text-text-primary">{npc.ac}</strong></span>
                  <span>جان: <strong className="text-text-primary">{npc.hp.max}</strong></span>
                  {npc.cr && <span>درجه چالش (CR): <strong className="text-accent">{npc.cr}</strong></span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Rules Inner Tab */}
      {subTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRules.map(rule => (
            <div key={rule.id} className="surface-card rounded-[14px] p-3.5 border border-border card-gold-top">
              <h4 className="font-extrabold text-xs text-accent mb-1.5">{rule.title}</h4>
              <p className="text-xs text-text-primary/80 leading-relaxed select-text">
                {rule.description || rule.details || rule.summary}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Inner Tab */}
      {subTab === 'calendar' && (() => {
        const activeCal = calendars.find(c => c.id === selectedCalId) || calendars[0] || null;
        const currentEpoch = campaignTime?.epochDay ?? 0;
        const projectedDate = activeCal ? epochToDate(activeCal, currentEpoch) : null;
        const projectedWeekday = activeCal ? weekdayOf(activeCal, currentEpoch) : null;
        const currentMonthObj = activeCal && projectedDate && !projectedDate.isOffDay
          ? activeCal.months[projectedDate.month - 1]
          : null;
        const currentOffDayObj = activeCal && projectedDate && projectedDate.isOffDay
          ? (activeCal.offDays?.[(projectedDate.offDayIndex || 1) - 1] || null)
          : null;

        const todayFormattedText = projectedDate
          ? (projectedDate.isOffDay
              ? `روز برون‌گاه: ${currentOffDayObj?.name || 'روز برون‌گاه'}، سال ${projectedDate.year} ${activeCal?.eraLabel || ''} (${projectedWeekday?.name || ''})`
              : `روز ${projectedDate.day} ${currentMonthObj?.name || `ماه ${projectedDate.month}`}، سال ${projectedDate.year} ${activeCal?.eraLabel || ''} (${projectedWeekday?.name || ''})`)
          : (loadingCalendar ? 'در حال بارگذاری زمان کمپین...' : 'گاه‌شمار کمپین یافت نشد.');

        return (
          <div className="space-y-4">
            {/* World Calendar Interactive Card */}
            <div className="surface-card rounded-[14px] p-4 border border-border space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">
                      {activeCal?.name || 'گاه‌شمار کمپین و زمان جاری جهان'}
                    </h4>
                    <p className="text-xs text-text-muted">
                      {activeCal ? `دوران ${activeCal.eraLabel || 'نامشخص'} | سال مبنا ${activeCal.startYear}` : 'مشاهده گردش ایام، ماه‌ها، فصول و تقویم فعال'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setCalendarModalOpen(true)}
                    className="bg-surface-2 hover:bg-surface-3 text-text-primary text-xs font-bold px-3 py-2 rounded-xl border border-border min-h-[44px] flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-accent" />
                    <span>مشاهده تقویم کامل</span>
                  </Button>

                  {isDm && (
                    <Button
                      type="button"
                      onClick={() => setStructureEditorOpen(true)}
                      className="bg-accent text-on-accent text-xs font-bold px-3.5 py-2 rounded-xl shadow-md min-h-[44px] flex items-center gap-1.5 hover:bg-accent-hover"
                    >
                      <Edit className="w-3.5 h-3.5 shrink-0" />
                      <span>ویرایش تقویم‌ها</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Today's Active Date Banner */}
              <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-accent-hover text-xs font-bold">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>زمان جاری در جهان زروانیا</span>
                </div>
                <div className="text-base sm:text-lg font-black text-accent-hover leading-tight">
                  {todayFormattedText}
                </div>
                <div className="text-xs text-text-muted flex flex-wrap items-center gap-3 pt-0.5">
                  <span>روز مطلق کمپین: <strong className="text-text-primary">{currentEpoch}</strong></span>
                  {projectedWeekday && (
                    <span>روز هفته: <strong className="text-accent-hover">{projectedWeekday.name}</strong></span>
                  )}
                  {activeCal && (
                    <span>طول سال: <strong className="text-text-primary">{activeCal.months.reduce((a, m) => a + (m.days || 0), 0) + (activeCal.offDays?.length || 0)} روز</strong></span>
                  )}
                </div>
              </div>

              {/* Multi-Calendar Switcher */}
              {calendars.length > 1 && (
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <span className="text-xs font-medium text-text-muted shrink-0">گاه‌شمار فعال:</span>
                  <select
                    value={selectedCalId}
                    onChange={e => setSelectedCalId(e.target.value)}
                    className="bg-surface-2 border border-border text-xs rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-accent"
                  >
                    {calendars.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Months Structure Grid */}
            {activeCal && activeCal.months.length > 0 && (
              <div className="surface-card rounded-[14px] p-4 border border-border space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                  <h4 className="text-xs font-bold text-text-primary">
                    ماه‌های سال ({activeCal.months.length} ماه)
                  </h4>
                  <span className="text-[11px] text-text-muted">
                    هفته {activeCal.weekdays?.length || 7} روزه
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {activeCal.months.map((m, idx) => {
                    const isCurrent = projectedDate && !projectedDate.isOffDay && projectedDate.month === idx + 1;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${
                          isCurrent
                            ? 'border-accent bg-accent/15 ring-1 ring-accent/40 text-accent-hover font-bold shadow-sm'
                            : 'border-border bg-surface-2/60 text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                            isCurrent ? 'bg-accent text-on-accent' : 'bg-surface-3 text-text-muted'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-text-primary block">{m.name}</span>
                            {m.season && (
                              <span className="text-[11px] text-text-muted">{m.season}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-end shrink-0">
                          <span className="font-bold text-accent-hover">{m.days} روز</span>
                          {isCurrent && (
                            <span className="block text-[10px] text-accent font-black">ماه جاری</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Off-Days Structure List */}
            {activeCal && activeCal.offDays && activeCal.offDays.length > 0 && (
              <div className="surface-card rounded-[14px] p-4 border border-border space-y-3">
                <div className="border-b border-border pb-2">
                  <h4 className="text-xs font-bold text-role-codm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-role-codm shrink-0" />
                    <span>روزهای برون‌گاه و خارج از ماه ({activeCal.offDays.length} روز اساطیری)</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeCal.offDays.map((od, idx) => {
                    const isCurrent = projectedDate && projectedDate.isOffDay && (projectedDate.offDayIndex || 1) === idx + 1;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 transition ${
                          isCurrent
                            ? 'border-role-codm bg-role-codm/20 ring-1 ring-role-codm/40 text-role-codm font-bold'
                            : 'border-border bg-surface-2/60 text-text-primary'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-role-codm">{idx + 1}. {od.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-role-codm text-on-accent px-1.5 py-0.5 rounded font-black">
                              امروز
                            </span>
                          )}
                        </div>
                        {(od.folkBelief || od.note) && (
                          <p className="text-text-muted text-[11px] leading-relaxed">
                            {od.folkBelief || od.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lore Calendar Events */}
            <div className="surface-card rounded-[14px] p-4 space-y-3">
              <div className="border-b border-border pb-2">
                <h4 className="text-xs font-bold text-text-primary">رویدادها و جشن‌های دوره‌ای اقالیم</h4>
                <p className="text-xs text-text-muted">وقایع نجومی، فصول تغییر جریان و گردهمایی‌های اقوام</p>
              </div>

              <div className="space-y-2">
                {calendarEvents.map((evt, idx) => (
                  <div key={idx} className="surface-2-card rounded-[10px] p-2.5 border border-border flex items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-xs text-text-primary block">{evt.day}</span>
                      <span className="text-xs text-text-muted">{evt.event}</span>
                    </div>
                    <Chip variant="region" region={evt.region as any} />
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar Modals */}
            {calendarModalOpen && (
              <CalendarModal
                isOpen={calendarModalOpen}
                onClose={() => setCalendarModalOpen(false)}
                campaignId={campaignId}
                isDm={Boolean(isDm)}
                activeCalendar={activeCal || undefined}
                timeResponse={campaignTime || undefined}
                onOpenStructureEditor={isDm ? () => {
                  setCalendarModalOpen(false);
                  setStructureEditorOpen(true);
                } : undefined}
              />
            )}

            {structureEditorOpen && isDm && (
              <CalendarStructureModal
                isOpen={structureEditorOpen}
                onClose={() => setStructureEditorOpen(false)}
                campaignId={campaignId}
                userRole={isDm ? 'owner' : 'player'}
                onSaved={() => {
                  loadCalendarData();
                }}
              />
            )}
          </div>
        );
      })()}

      {/* Factions Inner Tab */}
      {subTab === 'factions' && (
        <div className="space-y-4">
          <FactionReputationManager
            campaignId={campaignId}
            userRole={isDm ? 'owner' : 'player'}
          />
        </div>
      )}
    </div>
  );
};
