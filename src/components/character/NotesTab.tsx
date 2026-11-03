import React, { useState, useEffect, useRef, useDeferredValue, startTransition, memo } from 'react';
import { Character, CharacterNote, NoteCategory } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { ConfirmSheet } from '../mobile/ConfirmSheet';
import { VirtualList } from '../common/VirtualList';
import { 
  FileText, Pin, Eye, EyeOff, Search, Plus, 
  Trash2, Edit3, Check, Tag, PinOff 
} from 'lucide-react';
import { ScrollableRow } from '../ui/ScrollableRow';

interface NoteCardRowProps {
  note: CharacterNote;
  categoryLabel: string;
  onTogglePin: (note: CharacterNote) => void;
  onToggleShare: (note: CharacterNote) => void;
  onStartEdit: (note: CharacterNote) => void;
  onDeleteRequest: (id: string, title: string) => void;
}

const NoteCardRow = memo<NoteCardRowProps>(({
  note,
  categoryLabel,
  onTogglePin,
  onToggleShare,
  onStartEdit,
  onDeleteRequest,
}) => (
  <div
    className={`surface-card rounded-[14px] p-3.5 border transition content-visibility-card ${
      note.pinned
        ? 'border-accent/40 card-gold-top shadow-sm'
        : 'border-border'
    }`}
  >
    {/* Card Header */}
    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {note.pinned && (
          <Pin className="w-3.5 h-3.5 text-accent fill-accent shrink-0" />
        )}
        <h4 className="font-extrabold text-xs sm:text-sm text-text-primary truncate">
          {note.title}
        </h4>
        <span className="text-xs px-1.5 py-0.2 rounded-[6px] bg-surface-2 text-text-muted border border-border shrink-0">
          {categoryLabel}
        </span>
      </div>

      {/* Top Action Buttons (Pin, Share with DM, Edit, Delete) */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onTogglePin(note)}
          className={`p-1.5 rounded-[8px] border transition touch-target min-w-[44px] ${
            note.pinned
              ? 'bg-accent/15 text-accent border-accent/30'
              : 'bg-surface-2 text-text-muted border-border hover:text-text-primary'
          }`}
          title={note.pinned ? 'برداشتن سنجاق' : 'سنجاق به بالا'}
          aria-label={note.pinned ? 'برداشتن سنجاق' : 'سنجاق به بالا'}
        >
          {note.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={() => onToggleShare(note)}
          className={`flex items-center gap-1 px-2 py-1 rounded-[8px] text-xs font-bold border transition touch-target min-w-[44px] ${
            note.sharedWithDm
              ? 'bg-success/15 text-success border-success/40'
              : 'bg-surface-2 text-text-muted border-border'
          }`}
          title={note.sharedWithDm ? 'به اشتراک گذاشته شده با دانجن مستر' : 'محرمانه (فقط خودت)'}
          aria-label="تغییر اشتراک‌گذاری با دانجن مستر"
        >
          {note.sharedWithDm ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{note.sharedWithDm ? 'دیده‌شده توسط DM' : 'خصوصی'}</span>
        </button>

        <button
          type="button"
          onClick={() => onStartEdit(note)}
          className="p-1.5 rounded-[8px] bg-surface-2 text-text-muted hover:text-text-primary border border-border touch-target min-w-[44px]"
          title="ویرایش یادداشت"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDeleteRequest(note.id, note.title)}
          className="p-1.5 rounded-[8px] bg-surface-2 text-text-muted hover:text-danger border border-border touch-target min-w-[44px]"
          title="حذف یادداشت"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    {/* Note Body Text */}
    <p className="text-xs text-text-primary/80 whitespace-pre-wrap leading-relaxed select-text">
      {note.body}
    </p>

    {note.sessionTag && (
      <div className="mt-2 pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <span>برچسب جلسه: {note.sessionTag}</span>
        {note.sharedWithDm && (
          <span className="text-success font-bold">دیده‌شده توسط DM</span>
        )}
      </div>
    )}
  </div>
));
NoteCardRow.displayName = 'NoteCardRow';

interface NotesTabProps {
  character: Character;
  notes: CharacterNote[];
  onAddNote: (note: Omit<CharacterNote, 'id' | 'updatedAt'>) => void;
  onUpdateNote: (note: CharacterNote) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({
  character,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<CharacterNote | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; title: string } | null>(null);

  // New Note State
  const [noteTitle, setNoteTitle] = useState(() => localStorage.getItem('zorvania_draft_note_title') || '');
  const [noteBody, setNoteBody] = useState(() => localStorage.getItem('zorvania_draft_note_body') || '');
  const [noteSession, setNoteSession] = useState('جلسه 2');
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('journal');
  const [noteShared, setNoteShared] = useState(false);
  const [notePinned, setNotePinned] = useState(false);

  // Debounced draft autosave (~800 ms)
  const draftTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      if (noteTitle) localStorage.setItem('zorvania_draft_note_title', noteTitle);
      else localStorage.removeItem('zorvania_draft_note_title');
      if (noteBody) localStorage.setItem('zorvania_draft_note_body', noteBody);
      else localStorage.removeItem('zorvania_draft_note_body');
    }, 800);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [noteTitle, noteBody]);

  // Edit Note State
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editSession, setEditSession] = useState('');
  const [editCategory, setEditCategory] = useState<NoteCategory>('journal');
  const [editShared, setEditShared] = useState(false);
  const [editPinned, setEditPinned] = useState(false);

  const categoryLabels: Record<NoteCategory, string> = {
    journal: 'دفترچه وقایع',
    npcs: 'اشخاص و NPCها',
    locations: 'مکان‌ها و نقشه‌ها',
    quests: 'مأموریت‌ها',
    clues: 'سرنخ‌ها و رازها'
  };

  const handleStartEdit = (note: CharacterNote) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditBody(note.body);
    setEditSession(note.sessionTag || '');
    setEditCategory(note.category);
    setEditShared(note.sharedWithDm);
    setEditPinned(note.pinned);
  };

  const handleSaveEdit = () => {
    if (!editingNote || !editTitle.trim()) return;
    onUpdateNote({
      ...editingNote,
      title: editTitle.trim(),
      body: editBody.trim(),
      sessionTag: editSession.trim(),
      category: editCategory,
      sharedWithDm: editShared,
      pinned: editPinned
    });
    setEditingNote(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    onAddNote({
      characterId: character.id,
      ownerId: character.ownerId,
      title: noteTitle.trim(),
      body: noteBody.trim(),
      sessionTag: noteSession.trim(),
      category: noteCategory,
      pinned: notePinned,
      sharedWithDm: noteShared
    });

    setShowAddModal(false);
    setNoteTitle('');
    setNoteBody('');
    localStorage.removeItem('zorvania_draft_note_title');
    localStorage.removeItem('zorvania_draft_note_body');
  };

  const toggleShare = (note: CharacterNote) => {
    onUpdateNote({
      ...note,
      sharedWithDm: !note.sharedWithDm
    });
  };

  const togglePin = (note: CharacterNote) => {
    onUpdateNote({
      ...note,
      pinned: !note.pinned
    });
  };

  const categories = [
    { id: 'all', label: 'همه' },
    { id: 'journal', label: 'دفترچه وقایع' },
    { id: 'quests', label: 'مأموریت‌ها' },
    { id: 'clues', label: 'سرنخ‌ها و رازها' },
    { id: 'npcs', label: 'اشخاص' },
    { id: 'locations', label: 'مکان‌ها' },
  ];

  const deferredSearch = useDeferredValue(searchQuery);

  // Filter and sort with pinned first
  const filteredNotes = notes
    .filter(note => {
      const matchCat = selectedCategory === 'all' || note.category === selectedCategory;
      const matchSearch =
        !deferredSearch ||
        note.title.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        note.body.toLowerCase().includes(deferredSearch.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Search Bar & New Note Button */}
      <div className="surface-card rounded-[14px] p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="جستجو در وقایع و یادداشت‌ها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pe-3 ps-8 rounded-[10px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-text-muted absolute start-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] btn-primary-amber text-xs font-bold transition touch-target min-w-[44px] shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>یادداشت نو</span>
          </button>
        </div>

        {/* Category Chips */}
        <ScrollableRow
          activeKey={selectedCategory}
          dir="rtl"
          className="pb-1 gap-1.5"
        >
          {categories.map(cat => (
            <button
              key={cat.id}
              data-key={cat.id}
              type="button"
              onClick={() => {
                startTransition(() => {
                  setSelectedCategory(cat.id);
                });
              }}
              className={`px-3.5 py-2 rounded-[10px] text-xs font-bold transition whitespace-nowrap shrink-0 snap-start touch-target min-w-[44px] ${
                selectedCategory === cat.id
                  ? 'bg-accent text-on-accent font-black shadow-sm'
                  : 'bg-surface-2 text-text-muted hover:text-text-primary border border-border'
              }`}
            >
              <span className="whitespace-nowrap shrink-0">{cat.label}</span>
            </button>
          ))}
        </ScrollableRow>
      </div>

      {/* Notes List (Pinned first) */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="surface-card rounded-[14px] text-center py-10 text-text-muted text-xs">
            یادداشتی یافت نشد. با فشردن «یادداشت نو» اولین واقعه‌نگاری خود را ثبت کنید.
          </div>
        ) : filteredNotes.length > 50 ? (
          <VirtualList
            items={filteredNotes}
            itemHeight={130}
            height={560}
            keyExtractor={(n) => n.id}
            renderItem={(note) => (
              <div className="pb-3">
                <NoteCardRow
                  note={note}
                  categoryLabel={categoryLabels[note.category] || note.category}
                  onTogglePin={togglePin}
                  onToggleShare={toggleShare}
                  onStartEdit={handleStartEdit}
                  onDeleteRequest={(id, title) => setDeleteConfirm({ isOpen: true, id, title })}
                />
              </div>
            )}
          />
        ) : (
          filteredNotes.map(note => (
            <NoteCardRow
              key={note.id}
              note={note}
              categoryLabel={categoryLabels[note.category] || note.category}
              onTogglePin={togglePin}
              onToggleShare={toggleShare}
              onStartEdit={handleStartEdit}
              onDeleteRequest={(id, title) => setDeleteConfirm({ isOpen: true, id, title })}
            />
          ))
        )}
      </div>

      {/* Edit Full-Screen / Large Bottom Sheet */}
      {editingNote && (
        <BottomSheet
          isOpen={!!editingNote}
          onClose={() => setEditingNote(null)}
          title="ویرایش یادداشت وقایع"
          subtitle={`آخرین تغییرات: ${editingNote.title}`}
        >
          <div className="space-y-3" dir="rtl">
            <div>
              <label className="text-xs text-text-muted block mb-1">عنوان یادداشت:</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full py-2 px-3 rounded-[12px] bg-surface-2 border border-border text-sm text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-text-muted block mb-1">دسته‌بندی:</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as NoteCategory)}
                  className="w-full py-2 px-2 rounded-[12px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="journal">دفترچه وقایع</option>
                  <option value="quests">مأموریت‌ها</option>
                  <option value="clues">سرنخ‌ها و رازها</option>
                  <option value="npcs">اشخاص</option>
                  <option value="locations">مکان‌ها</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-text-muted block mb-1">شماره جلسه:</label>
                <input
                  type="text"
                  value={editSession}
                  onChange={(e) => setEditSession(e.target.value)}
                  className="w-full py-2 px-3 rounded-[12px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1">متن یادداشت:</label>
              <textarea
                rows={6}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full p-3 rounded-[12px] bg-surface-2 border border-border text-xs text-text-primary leading-relaxed focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary touch-target min-w-[44px]">
                <input
                  type="checkbox"
                  checked={editShared}
                  onChange={(e) => setEditShared(e.target.checked)}
                  className="w-4 h-4 rounded text-accent accent-accent"
                />
                <span>به اشتراک گذاشتن با دانجن مستر</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="py-2 px-4 rounded-[12px] text-xs text-text-muted touch-target min-w-[44px]"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="py-2 px-5 rounded-[12px] btn-primary-amber font-bold text-xs touch-target min-w-[44px]"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Add Note Bottom Sheet */}
      <BottomSheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="ثبت یادداشت جدید"
        subtitle="شرح وقایع، سرنخ‌ها و دیالوگ‌های مهم با ساکنان زروانیا"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3" dir="rtl">
          <div>
            <label className="text-xs text-text-muted block mb-1">عنوان یادداشت:</label>
            <input
              type="text"
              required
              placeholder="مثلاً: گفت‌وگو با پیشوای نوژان در معبد سنگی"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full py-2 px-3 rounded-[12px] bg-surface-2 border border-border text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-text-muted block mb-1">دسته‌بندی:</label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value as NoteCategory)}
                className="w-full py-2 px-2 rounded-[12px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="journal">دفترچه وقایع</option>
                <option value="quests">مأموریت‌ها</option>
                <option value="clues">سرنخ‌ها و رازها</option>
                <option value="npcs">اشخاص</option>
                <option value="locations">مکان‌ها</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1">شماره جلسه:</label>
              <input
                type="text"
                value={noteSession}
                onChange={(e) => setNoteSession(e.target.value)}
                className="w-full py-2 px-3 rounded-[12px] bg-surface-2 border border-border text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">متن یادداشت:</label>
            <textarea
              rows={5}
              required
              placeholder="شرح جزئیات..."
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              className="w-full p-3 rounded-[12px] bg-surface-2 border border-border text-xs text-text-primary leading-relaxed focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary touch-target min-w-[44px]">
              <input
                type="checkbox"
                checked={noteShared}
                onChange={(e) => setNoteShared(e.target.checked)}
                className="w-4 h-4 rounded text-accent accent-accent"
              />
              <span>به اشتراک گذاشتن با دانجن مستر</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="py-2 px-4 rounded-[12px] text-xs text-text-muted touch-target min-w-[44px]"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-[12px] btn-primary-amber font-bold text-xs touch-target min-w-[44px]"
              >
                ثبت یادداشت
              </button>
            </div>
          </div>
        </form>
      </BottomSheet>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmSheet
          isOpen={deleteConfirm.isOpen}
          title="حذف یادداشت"
          message={`آیا از حذف «${deleteConfirm.title}» مطمئن هستید؟`}
          confirmLabel="بله، حذف کن"
          cancelLabel="انصراف"
          isDestructive
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            onDeleteNote(deleteConfirm.id);
            setDeleteConfirm(null);
          }}
        />
      )}
    </div>
  );
};
