import React, { useState } from 'react';
import { Character, CharacterNote, NoteCategory } from '../../types';
import { BottomSheet } from '../mobile/BottomSheet';
import { ConfirmSheet } from '../mobile/ConfirmSheet';
import { 
  FileText, Pin, Eye, EyeOff, Search, Plus, 
  Trash2, Edit3, Check, Tag, PinOff 
} from 'lucide-react';

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
  const [noteSession, setNoteSession] = useState('جلسه ۲');
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('journal');
  const [noteShared, setNoteShared] = useState(false);
  const [notePinned, setNotePinned] = useState(false);

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

  // Filter and sort with pinned first
  const filteredNotes = notes
    .filter(note => {
      const matchCat = selectedCategory === 'all' || note.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.body.toLowerCase().includes(searchQuery.toLowerCase());
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
              className="w-full py-2 pe-3 ps-8 rounded-[10px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-[#A39A89] absolute start-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] btn-primary-amber text-xs font-bold transition touch-target shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>یادداشت نو</span>
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar" dir="rtl">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition whitespace-nowrap touch-target ${
                selectedCategory === cat.id
                  ? 'bg-[#E0A030] text-[#0E0D0C]'
                  : 'bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List (Pinned first) */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="surface-card rounded-[14px] text-center py-10 text-[#A39A89] text-xs">
            یادداشتی یافت نشد. با فشردن «یادداشت نو» اولین واقعه‌نگاری خود را ثبت کنید.
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className={`surface-card rounded-[14px] p-3.5 border transition ${
                note.pinned
                  ? 'border-[#E0A030]/40 card-gold-top shadow-sm'
                  : 'border-[#2F2A23]'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {note.pinned && (
                    <Pin className="w-3.5 h-3.5 text-[#E0A030] fill-[#E0A030] shrink-0" />
                  )}
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#EDE6D8] truncate">
                    {note.title}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#201D19] text-[#A39A89] border border-[#2F2A23] shrink-0">
                    {categoryLabels[note.category] || note.category}
                  </span>
                </div>

                {/* Top Action Buttons (Pin, Share with DM, Edit, Delete) */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Pin Toggle */}
                  <button
                    type="button"
                    onClick={() => togglePin(note)}
                    className={`p-1.5 rounded-[8px] border transition touch-target ${
                      note.pinned
                        ? 'bg-[#E0A030]/15 text-[#E0A030] border-[#E0A030]/30'
                        : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23] hover:text-[#EDE6D8]'
                    }`}
                    title={note.pinned ? 'برداشتن سنجاق' : 'سنجاق به بالا'}
                    aria-label={note.pinned ? 'برداشتن سنجاق' : 'سنجاق به بالا'}
                  >
                    {note.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>

                  {/* "Share with DM" Eye Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleShare(note)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-[8px] text-[10px] font-bold border transition touch-target ${
                      note.sharedWithDm
                        ? 'bg-[#6F9E78]/15 text-[#6F9E78] border-[#6F9E78]/40'
                        : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]'
                    }`}
                    title={note.sharedWithDm ? 'به اشتراک گذاشته شده با دانجن مستر' : 'محرمانه (فقط خودت)'}
                    aria-label="تغییر اشتراک‌گذاری با دانجن مستر"
                  >
                    {note.sharedWithDm ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{note.sharedWithDm ? 'دیده‌شده توسط DM' : 'خصوصی'}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleStartEdit(note)}
                    className="p-1.5 rounded-[8px] bg-[#201D19] text-[#A39A89] hover:text-[#EDE6D8] border border-[#2F2A23] touch-target"
                    title="ویرایش یادداشت"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ isOpen: true, id: note.id, title: note.title })}
                    className="p-1.5 rounded-[8px] bg-[#201D19] text-[#A39A89] hover:text-[#C2512B] border border-[#2F2A23] touch-target"
                    title="حذف یادداشت"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Note Body Text */}
              <p className="text-xs text-[#EDE6D8]/80 whitespace-pre-wrap leading-relaxed select-text">
                {note.body}
              </p>

              {note.sessionTag && (
                <div className="mt-2 pt-2 border-t border-[#2F2A23] flex items-center justify-between text-[10px] text-[#A39A89]">
                  <span>برچسب جلسه: {note.sessionTag}</span>
                  {note.sharedWithDm && (
                    <span className="text-[#6F9E78] font-bold">دیده‌شده توسط DM</span>
                  )}
                </div>
              )}
            </div>
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
              <label className="text-xs text-[#A39A89] block mb-1">عنوان یادداشت:</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full py-2 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#A39A89] block mb-1">دسته‌بندی:</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as NoteCategory)}
                  className="w-full py-2 px-2 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                >
                  <option value="journal">دفترچه وقایع</option>
                  <option value="quests">مأموریت‌ها</option>
                  <option value="clues">سرنخ‌ها و رازها</option>
                  <option value="npcs">اشخاص</option>
                  <option value="locations">مکان‌ها</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#A39A89] block mb-1">شماره جلسه:</label>
                <input
                  type="text"
                  value={editSession}
                  onChange={(e) => setEditSession(e.target.value)}
                  className="w-full py-2 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#A39A89] block mb-1">متن یادداشت:</label>
              <textarea
                rows={6}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full p-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] leading-relaxed focus:border-[#E0A030] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#EDE6D8] touch-target">
                <input
                  type="checkbox"
                  checked={editShared}
                  onChange={(e) => setEditShared(e.target.checked)}
                  className="w-4 h-4 rounded text-[#E0A030] accent-[#E0A030]"
                />
                <span>به اشتراک گذاشتن با دانجن مستر</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="py-2 px-4 rounded-[12px] text-xs text-[#A39A89] touch-target"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="py-2 px-5 rounded-[12px] btn-primary-amber font-bold text-xs touch-target"
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
            <label className="text-xs text-[#A39A89] block mb-1">عنوان یادداشت:</label>
            <input
              type="text"
              required
              placeholder="مثلاً: گفت‌وگو با پیشوای نوژان در معبد سنگی"
              value={noteTitle}
              onChange={(e) => {
                setNoteTitle(e.target.value);
                localStorage.setItem('zorvania_draft_note_title', e.target.value);
              }}
              className="w-full py-2 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-sm text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[#A39A89] block mb-1">دسته‌بندی:</label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value as NoteCategory)}
                className="w-full py-2 px-2 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
              >
                <option value="journal">دفترچه وقایع</option>
                <option value="quests">مأموریت‌ها</option>
                <option value="clues">سرنخ‌ها و رازها</option>
                <option value="npcs">اشخاص</option>
                <option value="locations">مکان‌ها</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[#A39A89] block mb-1">شماره جلسه:</label>
              <input
                type="text"
                value={noteSession}
                onChange={(e) => setNoteSession(e.target.value)}
                className="w-full py-2 px-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#A39A89] block mb-1">متن یادداشت:</label>
            <textarea
              rows={5}
              required
              placeholder="شرح جزئیات..."
              value={noteBody}
              onChange={(e) => {
                setNoteBody(e.target.value);
                localStorage.setItem('zorvania_draft_note_body', e.target.value);
              }}
              className="w-full p-3 rounded-[12px] bg-[#201D19] border border-[#2F2A23] text-xs text-[#EDE6D8] leading-relaxed focus:border-[#E0A030] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#EDE6D8] touch-target">
              <input
                type="checkbox"
                checked={noteShared}
                onChange={(e) => setNoteShared(e.target.checked)}
                className="w-4 h-4 rounded text-[#E0A030] accent-[#E0A030]"
              />
              <span>به اشتراک گذاشتن با دانجن مستر</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="py-2 px-4 rounded-[12px] text-xs text-[#A39A89] touch-target"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-[12px] btn-primary-amber font-bold text-xs touch-target"
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
