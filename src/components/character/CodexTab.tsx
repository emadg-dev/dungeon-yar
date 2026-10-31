import React, { useState } from 'react';
import { NPC, ItemLibraryEntry, LocationEntry, Character, Quest } from '../../types';
import { SEED_RULES } from '../../data/seed';
import { BookOpen, Users, Sparkles, Compass, Calendar, Search, MapPin, Map as MapIcon, Scroll } from 'lucide-react';
import { Chip } from '../common/Chip';
import { HandoutsTab } from './HandoutsTab';
import { QuestsTab } from '../quest/QuestsTab';
import { FactionReputationManager } from '../campaign/FactionReputationManager';

interface CodexTabProps {
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
  const [subTab, setSubTab] = useState<'quests' | 'locations' | 'handouts' | 'items' | 'creatures' | 'rules' | 'calendar' | 'factions'>('quests');
  const [searchQuery, setSearchQuery] = useState('');

  const factions = [
    {
      name: 'نوژان (Nozhan)',
      motto: 'احیاگران جادو و جریان‌های کهن',
      region: 'ورنا',
      regionColor: 'bg-[#6F9E78]/15 text-[#6F9E78] border-[#6F9E78]/30',
      description: 'استقبال‌کنندگان از جادو؛ این فرقه جادو و تاروپودهای باستانی را با آغوش باز می‌پذیرد و در پی احیای کامل جریان‌های ماورایی زروانیا است.'
    },
    {
      name: 'رهامان (Rohaman)',
      motto: 'نابودکنندگان آثار جادویی و تحریفات زمان',
      region: 'کویر خاموش',
      regionColor: 'bg-[#C97B4A]/15 text-[#C97B4A] border-[#C97B4A]/30',
      description: 'نابودکنندگان جادو؛ مصمم به محو و سوزاندن هرگونه آثار جادویی و پاکسازی تمام بقایای حاصل از فروپاشی زمان.'
    },
    {
      name: 'پیمانداران (Peymandaran)',
      motto: 'پاسداران نظم، ثبات و قوانین مدنی',
      region: 'شان‌شین',
      regionColor: 'bg-[#D6B25E]/15 text-[#D6B25E] border-[#D6B25E]/30',
      description: 'طرفداران کنترل، انضباط و ثبات زمانی؛ آنان بیشترین نفوذ و تسلط اجرایی را در ارکان فعلی قدرت و حکومت در دست دارند.'
    }
  ];

  const calendarEvents = [
    { day: 'روز نخست مهر', event: 'آغاز سال نو زمانی و اعتدال پاییز', region: 'مشترک' },
    { day: 'شب ۱۰ آبان', event: 'هم‌رسایی ماه و شکاف‌های واقعیت ورنا', region: 'ورنا' },
    { day: 'نیمه آذر', event: 'کاروان‌های بزرگ نمک در کویر خاموش', region: 'کویر خاموش' },
    { day: 'شب یلدا', event: 'جشن آتشین موبدان در سپیدارون', region: 'سپیدارون' },
    { day: 'روز ۲۰ دی', event: 'سالگرد پیمان بزرگ ثبات در شان‌شین', region: 'شان‌شین' },
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
      <div className="surface-card rounded-[14px] p-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setSubTab('quests')}
          className={`flex-1 min-w-[105px] py-2 px-2.5 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
            subTab === 'quests'
              ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <Scroll className="w-3.5 h-3.5" />
          <span>مأموریت‌ها ({quests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('locations')}
          className={`flex-1 min-w-[95px] py-2 px-2.5 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
            subTab === 'locations'
              ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>مکان‌ها ({revealedLocations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('handouts')}
          className={`flex-1 min-w-[105px] py-2 px-2.5 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
            subTab === 'handouts'
              ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>اسناد و نقشه‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('items')}
          className={`flex-1 min-w-[95px] py-2 px-2.5 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
            subTab === 'items'
              ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>اشیاء ({revealedItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('creatures')}
          className={`flex-1 min-w-[105px] py-2 px-2.5 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
            subTab === 'creatures'
              ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>موجودات ({revealedNpcs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('rules')}
          className={`flex-1 min-w-[95px] py-2 px-2.5 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
            subTab === 'rules'
              ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>قوانین ({SEED_RULES.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('calendar')}
          className={`flex-1 min-w-[95px] py-2 px-2.5 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
            subTab === 'calendar'
              ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>گاهشمار</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('factions')}
          className={`flex-1 min-w-[95px] py-2 px-2.5 rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target ${
            subTab === 'factions'
              ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold shadow-sm'
              : 'text-[#A39A89] hover:text-[#EDE6D8]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>جناح‌ها</span>
        </button>
      </div>

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
          <input
            type="text"
            placeholder="جستجو در دانشنامه زروانیا..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2 pe-3 ps-8 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-[#A39A89] absolute start-2.5 top-1/2 -translate-y-1/2" />
        </div>
      )}

      {/* Locations Inner Tab */}
      {subTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredLocations.length === 0 ? (
            <div className="surface-card rounded-[14px] col-span-2 text-center py-10 text-[#A39A89] text-xs">
              مکانی در دانشنامه فاش نشده است. با کشف و کاوش در زروانیا نقاط جدید در این بخش ثبت خواهند شد.
            </div>
          ) : (
            filteredLocations.map(loc => (
              <div key={loc.id} className="surface-card rounded-[14px] p-3.5 border border-[#2F2A23] flex flex-col justify-between gap-2.5 card-gold-top">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-extrabold text-sm text-[#EDE6D8] truncate">{loc.name}</h4>
                    <Chip variant="region" region={loc.region as any} />
                  </div>
                  {loc.imageUrl && (
                    <div className="w-full h-32 rounded-[10px] overflow-hidden border border-[#2F2A23] bg-[#0E0D0C]">
                      <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-[#EDE6D8]/80 leading-relaxed select-text">
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
            <div className="surface-card rounded-[14px] col-span-2 text-center py-10 text-[#A39A89] text-xs">
              شیئی در دانشنامه فاش نشده است.
            </div>
          ) : (
            filteredItems.map(item => (
              <div key={item.id} className="surface-card rounded-[14px] p-3.5 border border-[#2F2A23] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="font-extrabold text-xs text-[#EDE6D8]">{item.name}</span>
                    <Chip variant="region" region={(item.region || 'مشترک') as any} />
                  </div>
                  <p className="text-xs text-[#EDE6D8]/80 leading-relaxed mb-2 select-text">
                    {item.description}
                  </p>
                </div>
                {item.rarity && (
                  <div className="text-[10px] text-[#A39A89] pt-2 border-t border-[#2F2A23]">
                    کمیابی: <span className="text-[#E0A030] font-bold">{item.rarity}</span>
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
            <div className="surface-card rounded-[14px] col-span-2 text-center py-10 text-[#A39A89] text-xs">
              موجودی فاش نشده است.
            </div>
          ) : (
            filteredNpcs.map(npc => (
              <div key={npc.id} className="surface-card rounded-[14px] p-3.5 border border-[#2F2A23] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="font-extrabold text-xs text-[#EDE6D8]">{npc.name}</span>
                    <Chip variant="region" region={(npc.region || 'ورنا') as any} />
                  </div>
                  <p className="text-xs text-[#EDE6D8]/80 leading-relaxed mb-2 select-text">
                    {npc.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#A39A89] pt-2 border-t border-[#2F2A23]">
                  <span>AC: <strong className="text-[#EDE6D8]">{npc.ac}</strong></span>
                  <span>جان: <strong className="text-[#EDE6D8]">{npc.hp.max}</strong></span>
                  {npc.cr && <span>درجه چالش (CR): <strong className="text-[#E0A030]">{npc.cr}</strong></span>}
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
            <div key={rule.id} className="surface-card rounded-[14px] p-3.5 border border-[#2F2A23] card-gold-top">
              <h4 className="font-extrabold text-xs text-[#E0A030] mb-1.5">{rule.title}</h4>
              <p className="text-xs text-[#EDE6D8]/80 leading-relaxed select-text">
                {rule.description || rule.details || rule.summary}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Inner Tab */}
      {subTab === 'calendar' && (
        <div className="surface-card rounded-[14px] p-4 space-y-3">
          <div className="border-b border-[#2F2A23] pb-2">
            <h4 className="text-xs font-bold text-[#EDE6D8]">گاهشمار زمان‌های زروانیا</h4>
            <p className="text-[10px] text-[#A39A89]">وقایع نجومی، فصول تغییر جریان و گردهمایی‌های اقوام</p>
          </div>

          <div className="space-y-2">
            {calendarEvents.map((evt, idx) => (
              <div key={idx} className="surface-2-card rounded-[10px] p-2.5 border border-[#2F2A23] flex items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-xs text-[#EDE6D8] block">{evt.day}</span>
                  <span className="text-[11px] text-[#A39A89]">{evt.event}</span>
                </div>
                <Chip variant="region" region={evt.region as any} />
              </div>
            ))}
          </div>
        </div>
      )}

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
