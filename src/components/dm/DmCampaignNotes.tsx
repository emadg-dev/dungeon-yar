import React, { useState } from 'react';
import { CampaignNote, CampaignNoteCategory } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { BookOpen, Plus, Search, Tag, Trash2, Edit3, Lock } from 'lucide-react';

interface DmCampaignNotesProps {
  campaignNotes: CampaignNote[];
  onCreateNote: (note: Omit<CampaignNote, 'id' | 'updatedAt'>) => void;
  onUpdateNote: (note: CampaignNote) => void;
  onDeleteNote: (id: string) => void;
}

export const DmCampaignNotes: React.FC<DmCampaignNotesProps> = ({
  campaignNotes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<CampaignNote | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CampaignNoteCategory>('session');
  const [sessionNum, setSessionNum] = useState('جلسه ۲');
  const [content, setContent] = useState('');
  const [tagsStr, setTagsStr] = useState('معبد, زروانیا');

  const catLabels: Record<CampaignNoteCategory, string> = {
    session: 'خلاصه جلسات (Sessions)',
    plot: 'خطوط داستانی (Plot Threads)',
    secret: 'رازهای محرمانه DM (Secrets)',
    lore: 'تاریخ و لور جهان (Lore)'
  };

  const handleStartCreate = () => {
    setTitle('');
    setCategory('session');
    setSessionNum('جلسه ۲');
    setContent('');
    setTagsStr('');
    setEditingNote(null);
    setIsCreating(true);
  };

  const handleStartEdit = (note: CampaignNote) => {
    setTitle(note.title);
    setCategory(note.category);
    setSessionNum(note.sessionNumber || '');
    setContent(note.content);
    setTagsStr(note.tags.join(', '));
    setEditingNote(note);
    setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    if (editingNote) {
      onUpdateNote({
        ...editingNote,
        title: title.trim(),
        category,
        sessionNumber: sessionNum.trim(),
        content: content.trim(),
        tags,
        updatedAt: new Date().toISOString()
      });
    } else {
      onCreateNote({
        title: title.trim(),
        category,
        sessionNumber: sessionNum.trim(),
        content: content.trim(),
        tags
      });
    }

    setIsCreating(false);
    setEditingNote(null);
  };

  const filteredNotes = campaignNotes.filter(n => {
    const matchesCat = selectedCat === 'all' || n.category === selectedCat;
    const matchesSearch = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header, Search & Filter */}
      <div className="bg-[#171513] border border-[#2F2A23] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#2F2A23]">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-[#8A8374]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در وقایع، رازها، برچسب‌ها..."
              className="w-full py-2 pr-9 pl-3 rounded-xl bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
            />
          </div>

          <button
            onClick={handleStartCreate}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#E0A030] hover:bg-[#F2C265] text-[#0E0D0C] font-bold text-xs transition"
          >
            <Plus className="w-4 h-4" />
            یادداشت محرمانه تازه
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              selectedCat === 'all'
                ? 'bg-[#E0A030] text-[#0E0D0C] border-[#F2C265]'
                : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23] hover:text-[#EDE6D8]'
            }`}
          >
            همه ({campaignNotes.length})
          </button>
          {(Object.keys(catLabels) as CampaignNoteCategory[]).map(catKey => {
            const count = campaignNotes.filter(n => n.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCat(catKey)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  selectedCat === catKey
                    ? 'bg-[#E0A030] text-[#0E0D0C] border-[#F2C265]'
                    : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23] hover:text-[#EDE6D8]'
                }`}
              >
                {catLabels[catKey]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Create / Edit BottomSheet Modal Form */}
      <BottomSheet
        isOpen={isCreating}
        onClose={() => {
          setIsCreating(false);
        }}
        title={editingNote ? 'ویرایش یادداشت کمپین' : 'ثبت یادداشت جدید دانجن مستر'}
        subtitle="نگارش پیش‌زمینه داستانی، سناریوها و اسرار محرمانه"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-[#C9C0AE] block mb-1">عنوان یادداشت:</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: خط سیر داستانی: بازگشایی دروازه اول"
                className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
              />
            </div>
            <div>
              <label className="text-xs text-[#C9C0AE] block mb-1">دسته‌بندی:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CampaignNoteCategory)}
                className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
              >
                {(Object.keys(catLabels) as CampaignNoteCategory[]).map(c => (
                  <option key={c} value={c}>{catLabels[c]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#C9C0AE] block mb-1">متن یادداشت و اسرار:</label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8] leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs text-[#C9C0AE] block mb-1">برچسب‌ها (با کاما جدا کنید):</label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="جلسه۱, معبد, خط_اصلی"
              className="w-full py-2 px-3 rounded-xl bg-[#131110] border border-[#3A342B] text-sm text-[#EDE6D8]"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="py-2.5 px-4 rounded-xl text-xs text-[#A39A89] touch-target"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-[#E0A030] text-[#0E0D0C] font-bold text-xs touch-target"
            >
              ذخیره یادداشت
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Notes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotes.map(n => (
          <div
            key={n.id}
            className="p-4 rounded-2xl bg-[#171513] border border-[#2F2A23] hover:border-[#E0A030]/30 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#E0A030]/10 text-[#F2C265] border border-[#E0A030]/25">
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[#EDE6D8]">{n.title}</h4>
                    <span className="text-[10px] text-[#8A8374] font-mono">
                      {catLabels[n.category]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(n)}
                    className="p-1.5 rounded-lg bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteNote(n.id)}
                    className="p-1.5 rounded-lg bg-[#201D19] text-[#A39A89] hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#C9C0AE] leading-relaxed whitespace-pre-wrap mb-3">
                {n.content}
              </p>
            </div>

            {/* Tags */}
            {n.tags?.length > 0 && (
              <div className="pt-2 border-t border-[#2F2A23]/80 flex flex-wrap gap-1">
                {n.tags.map((t, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#201D19] text-[#A39A89] flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
