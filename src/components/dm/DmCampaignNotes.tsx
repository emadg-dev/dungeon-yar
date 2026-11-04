import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState } from 'react';
import { CampaignNote, CampaignNoteCategory } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { ScrollableRow } from '../ui/ScrollableRow';
import { Field, IconButton, StickyFooter, inputCls, textareaCls, primaryBtnCls, secondaryBtnCls } from '../ui/FormLayout';
import { Plus, Search, Tag, Trash2, Edit3, Lock } from 'lucide-react';

interface DmCampaignNotesProps {
  campaignNotes: CampaignNote[];
  onCreateNote: (note: Omit<CampaignNote, 'id' | 'updatedAt'>) => void;
  onUpdateNote: (note: CampaignNote) => void;
  onDeleteNote: (id: string) => void;
}

const CAT_LABELS: Record<CampaignNoteCategory, string> = {
  session: 'جلسه‌ها',
  plot: 'خطوط داستانی',
  secret: 'رازهای DM',
  lore: 'تاریخچه جهان'
};

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

  // Form state (defaults are empty: no hard-coded campaign data)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CampaignNoteCategory>('session');
  const [sessionNum, setSessionNum] = useState('');
  const [content, setContent] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  const handleStartCreate = () => {
    setTitle('');
    setCategory('session');
    setSessionNum('');
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

  const handleDelete = (note: CampaignNote) => {
    if (window.confirm(`یادداشت «${note.title}» حذف شود؟`)) onDeleteNote(note.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsStr.split(/[,،]/).map(t => t.trim()).filter(Boolean);
    const sessionNumber = category === 'session' ? sessionNum.trim() : '';

    if (editingNote) {
      onUpdateNote({
        ...editingNote,
        title: title.trim(),
        category,
        sessionNumber,
        content: content.trim(),
        tags,
        updatedAt: new Date().toISOString()
      });
    } else {
      onCreateNote({ title: title.trim(), category, sessionNumber, content: content.trim(), tags });
    }

    setIsCreating(false);
    setEditingNote(null);
  };

  const q = searchQuery.toLowerCase();
  const filteredNotes = campaignNotes.filter(n => {
    const matchesCat = selectedCat === 'all' || n.category === selectedCat;
    const matchesSearch =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const pillCls = (active: boolean) =>
    `px-4 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 snap-start transition border min-h-[44px] ${
      active
        ? 'bg-accent/15 text-accent-hover border-accent'
        : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
    }`;

  return (
    <div className="space-y-5">
      {/* Toolbar: one row, one primary action */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden />
          <Input noWrapper
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در یادداشت‌ها و برچسب‌ها"
            aria-label="جستجو در یادداشت‌ها"
            className={`${inputCls} ps-10`}
          />
        </div>
        <Button type="button" onClick={handleStartCreate} className={`${primaryBtnCls} shrink-0`}>
          <Plus className="w-4 h-4 shrink-0" />
          <span>یادداشت جدید</span>
        </Button>
      </div>

      {/* Category filter */}
      <ScrollableRow activeKey={selectedCat} className="items-center gap-2 pb-1">
        <Button type="button" data-scroll-key="all" onClick={() => setSelectedCat('all')} className={pillCls(selectedCat === 'all')}>
          همه ({campaignNotes.length})
        </Button>
        {(Object.keys(CAT_LABELS) as CampaignNoteCategory[]).map(catKey => {
          const count = campaignNotes.filter(n => n.category === catKey).length;
          return (
            <Button
              key={catKey}
              type="button"
              data-scroll-key={catKey}
              onClick={() => setSelectedCat(catKey)}
              className={pillCls(selectedCat === catKey)}
            >
              {CAT_LABELS[catKey]} ({count})
            </Button>
          );
        })}
      </ScrollableRow>

      {/* Notes */}
      {filteredNotes.length === 0 ? (
        <div className="py-12 text-center text-sm text-text-muted">
          {campaignNotes.length === 0 ? 'هنوز یادداشتی ثبت نشده است.' : 'یادداشتی با این جستجو پیدا نشد.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map(n => (
            <article
              key={n.id}
              className="flex flex-col p-4 rounded-xl bg-surface border border-border hover:border-accent/40 transition"
            >
              <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-base text-text-primary break-words">{n.title}</h4>
                  <p className="mt-0.5 text-xs text-text-muted flex items-center gap-1.5">
                    {n.category === 'secret' && <Lock className="w-3 h-3 text-accent shrink-0" aria-hidden />}
                    <span>{CAT_LABELS[n.category]}</span>
                    {n.sessionNumber && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{n.sessionNumber}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex -me-2 -mt-2 shrink-0">
                  <IconButton label="ویرایش یادداشت" onClick={() => handleStartEdit(n)}>
                    <Edit3 className="w-4 h-4" />
                  </IconButton>
                  <IconButton label="حذف یادداشت" danger onClick={() => handleDelete(n)}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </header>

              <p className="mt-2 text-sm text-text-primary leading-relaxed whitespace-pre-wrap line-clamp-6">
                {n.content}
              </p>

              {n.tags?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
                  {n.tags.map((t, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-surface-2 text-text-muted inline-flex items-center gap-1">
                      <Tag className="w-3 h-3" aria-hidden />
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Create / edit */}
      <BottomSheet
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title={editingNote ? 'ویرایش یادداشت' : 'یادداشت جدید'}
        subtitle="پیش‌زمینه داستانی، سناریوها و رازهای کمپین"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="عنوان" required>
            <Input noWrapper
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: بازگشایی دروازه اول"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="دسته‌بندی">
              <Select noWrapper
                value={category}
                onChange={(e) => setCategory(e.target.value as CampaignNoteCategory)}
                className={inputCls}
              >
                {(Object.keys(CAT_LABELS) as CampaignNoteCategory[]).map(c => (
                  <option key={c} value={c}>{CAT_LABELS[c]}</option>
                ))}
              </Select>
            </Field>
            {category === 'session' && (
              <Field label="شماره جلسه">
                <Input noWrapper
                  type="text"
                  value={sessionNum}
                  onChange={(e) => setSessionNum(e.target.value)}
                  placeholder="مثلاً: جلسه 2"
                  className={inputCls}
                />
              </Field>
            )}
          </div>

          <Field label="متن">
            <Textarea noWrapper
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={textareaCls}
            />
          </Field>

          <Field label="برچسب‌ها" hint="با ویرگول جدا کنید.">
            <Input noWrapper
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="معبد، خط اصلی"
              className={inputCls}
            />
          </Field>

          <StickyFooter>
            <div className="flex gap-2">
              <Button type="submit" className={`${primaryBtnCls} flex-1 sm:flex-none`}>ذخیره</Button>
              <Button type="button" onClick={() => setIsCreating(false)} className={secondaryBtnCls}>انصراف</Button>
            </div>
          </StickyFooter>
        </form>
      </BottomSheet>
    </div>
  );
};