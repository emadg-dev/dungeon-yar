import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  MasterCharacter, MasterBackstory, BackstorySection, BackstoryRelationship, 
  BackstoryTimelineEntry, CharacterRevision, BackstoryComment, BackgroundTemplate, 
  LineageTemplate, NPC, Campaign 
} from '../../types';
import { 
  getBackstoryPrompts, rollPersonalityFromBackground, 
  computeBackstoryCompleteness, DEFAULT_BACKSTORY_PROMPTS 
} from '../../../shared/rules/backstoryEngine';
import { 
  Sparkles, Shield, Lock, Eye, EyeOff, Plus, Trash2, Dices, 
  History, Check, Clock, MessageSquare, AlertTriangle, Printer, 
  ChevronDown, ChevronUp, Bold, Italic, List, CornerDownLeft, RotateCcw
} from 'lucide-react';
import { BottomSheet } from '../mobile/BottomSheet';

interface BackstoryEditorProps {
  character: MasterCharacter;
  campaign?: Campaign | null;
  lineageTemplate?: LineageTemplate | null;
  backgroundTemplate?: BackgroundTemplate | null;
  allBackgroundTemplates?: BackgroundTemplate[];
  availableNpcs?: NPC[];
  isDm?: boolean;
  onUpdateCharacter: (updated: MasterCharacter) => Promise<void>;
  onLoadRevisions: () => Promise<CharacterRevision[]>;
  onRestoreRevision: (revisionId: string) => Promise<MasterCharacter>;
  onToggleReadyForReview: (ready: boolean) => Promise<MasterCharacter>;
  onLoadComments: () => Promise<BackstoryComment[]>;
  onCreateComment: (sectionId: string, body: string) => Promise<BackstoryComment>;
  onResolveComment: (commentId: string, resolved: boolean) => Promise<BackstoryComment>;
  onReviewBackstory?: (status: 'approved' | 'changes_requested', comment?: string) => Promise<MasterCharacter>;
  onPrint?: () => void;
}

export const BackstoryEditor: React.FC<BackstoryEditorProps> = ({
  character,
  campaign,
  lineageTemplate,
  backgroundTemplate,
  allBackgroundTemplates = [],
  availableNpcs = [],
  isDm = false,
  onUpdateCharacter,
  onLoadRevisions,
  onRestoreRevision,
  onToggleReadyForReview,
  onLoadComments,
  onCreateComment,
  onResolveComment,
  onReviewBackstory,
  onPrint
}) => {
  const [backstory, setBackstory] = useState<MasterBackstory>(() => {
    return character.backstory || {
      summary: '',
      origin: '',
      personality: { traits: '', ideals: '', bonds: '', flaws: '' },
      goals: '',
      relationships: [],
      timeline: [],
      sections: [],
      dmOnly: { secrets: '', hooks: '' }
    };
  });

  // Revisions & Comments state
  const [revisions, setRevisions] = useState<CharacterRevision[]>([]);
  const [isRevisionSheetOpen, setIsRevisionSheetOpen] = useState(false);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  const [comments, setComments] = useState<BackstoryComment[]>([]);
  const [activeCommentSection, setActiveCommentSection] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // DM Review Dialog
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'changes_requested'>('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Autosave state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const dirtyRef = useRef(false);
  const saveTimeoutRef = useRef<any>(null);

  // Guided prompts state
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});
  const promptsGuide = useMemo(() => getBackstoryPrompts(lineageTemplate), [lineageTemplate]);
  const completeness = useMemo(() => computeBackstoryCompleteness(backstory), [backstory]);

  // Active textarea ref for rich-text toolbar
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Initial load of comments & revisions
  useEffect(() => {
    onLoadComments().then(setComments).catch(() => {});
  }, [character.id]);

  const handleOpenRevisions = async () => {
    setIsRevisionSheetOpen(true);
    setLoadingRevisions(true);
    try {
      const list = await onLoadRevisions();
      setRevisions(list);
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleRestore = async (revisionId: string) => {
    const updated = await onRestoreRevision(revisionId);
    setBackstory(updated.backstory);
    setIsRevisionSheetOpen(false);
  };

  // Debounced Autosave
  const triggerAutosave = useCallback((nextBackstory: MasterBackstory) => {
    setSaveStatus('dirty');
    dirtyRef.current = true;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await onUpdateCharacter({
          ...character,
          backstory: nextBackstory
        });
        setSaveStatus('saved');
        dirtyRef.current = false;
      } catch {
        setSaveStatus('dirty');
      }
    }, 1200);
  }, [character, onUpdateCharacter]);

  const updateBackstoryField = <K extends keyof MasterBackstory>(field: K, val: MasterBackstory[K]) => {
    setBackstory(prev => {
      const next = { ...prev, [field]: val };
      triggerAutosave(next);
      return next;
    });
  };

  const updatePersonalityField = (pField: 'traits' | 'ideals' | 'bonds' | 'flaws', val: string) => {
    setBackstory(prev => {
      const next = {
        ...prev,
        personality: {
          ...(prev.personality || { traits: '', ideals: '', bonds: '', flaws: '' }),
          [pField]: val
        }
      };
      triggerAutosave(next);
      return next;
    });
  };

  const updateDmOnlyField = (dmField: 'secrets' | 'hooks', val: string) => {
    setBackstory(prev => {
      const next = {
        ...prev,
        dmOnly: {
          ...(prev.dmOnly || { secrets: '', hooks: '' }),
          [dmField]: val
        }
      };
      triggerAutosave(next);
      return next;
    });
  };

  // Rich Text Helpers (applies formatting to current or target field)
  const applyFormatting = (prefix: string, suffix: string = '') => {
    const el = activeTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const replacement = `${prefix}${selected || 'متن'}${suffix}`;
    const nextText = text.substring(0, start) + replacement + text.substring(end);
    
    el.value = nextText;
    // Dispatch input event to update React state
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
    el.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
  };

  // Roll from background table
  const handleRollPersonality = (pField: 'traits' | 'ideals' | 'bonds' | 'flaws') => {
    const targetBg = backgroundTemplate || allBackgroundTemplates[0];
    const rolled = rollPersonalityFromBackground(targetBg, pField);
    if (rolled) {
      const current = backstory.personality?.[pField] || '';
      const combined = current.trim() ? `${current.trim()}\n• ${rolled}` : rolled;
      updatePersonalityField(pField, combined);
    }
  };

  // Relationship handlers
  const handleAddRelationship = () => {
    const newRel: BackstoryRelationship = {
      name: '',
      note: '',
      shareWithParty: true
    };
    updateBackstoryField('relationships', [...(backstory.relationships || []), newRel]);
  };

  const handleUpdateRelationship = (idx: number, updates: Partial<BackstoryRelationship>) => {
    const list = [...(backstory.relationships || [])];
    list[idx] = { ...list[idx], ...updates };
    updateBackstoryField('relationships', list);
  };

  const handleDeleteRelationship = (idx: number) => {
    const list = (backstory.relationships || []).filter((_, i) => i !== idx);
    updateBackstoryField('relationships', list);
  };

  // Timeline handlers
  const handleAddTimeline = () => {
    const newEntry: BackstoryTimelineEntry = {
      label: 'مقطع زمانی',
      text: '',
      shareWithParty: true
    };
    updateBackstoryField('timeline', [...(backstory.timeline || []), newEntry]);
  };

  const handleUpdateTimeline = (idx: number, updates: Partial<BackstoryTimelineEntry>) => {
    const list = [...(backstory.timeline || [])];
    list[idx] = { ...list[idx], ...updates };
    updateBackstoryField('timeline', list);
  };

  const handleDeleteTimeline = (idx: number) => {
    const list = (backstory.timeline || []).filter((_, i) => i !== idx);
    updateBackstoryField('timeline', list);
  };

  // Custom sections handlers
  const handleAddCustomSection = () => {
    const newSec: BackstorySection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: 'بخش سفارشی جدید',
      text: '',
      shareWithParty: false
    };
    updateBackstoryField('sections', [...(backstory.sections || []), newSec]);
  };

  const handleUpdateCustomSection = (id: string, updates: Partial<BackstorySection>) => {
    const list = (backstory.sections || []).map(s => s.id === id ? { ...s, ...updates } : s);
    updateBackstoryField('sections', list);
  };

  const handleDeleteCustomSection = (id: string) => {
    const list = (backstory.sections || []).filter(s => s.id !== id);
    updateBackstoryField('sections', list);
  };

  // Comments handlers
  const handleAddComment = async (sectionId: string) => {
    if (!newCommentText.trim()) return;
    setSubmittingComment(true);
    try {
      const created = await onCreateComment(sectionId, newCommentText.trim());
      setComments(prev => [...prev, created]);
      setNewCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleResolve = async (commentId: string, currentResolved: boolean) => {
    const updated = await onResolveComment(commentId, !currentResolved);
    setComments(prev => prev.map(c => c.id === commentId ? updated : c));
  };

  // Review handlers
  const handleToggleReady = async () => {
    const nextReady = !character.readyForReview;
    await onToggleReadyForReview(nextReady);
  };

  const handleSubmitDmReview = async () => {
    if (!onReviewBackstory) return;
    setIsSubmittingReview(true);
    try {
      await onReviewBackstory(reviewAction, reviewComment.trim());
      setIsReviewModalOpen(false);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Helper for filtered NPCs in relationships
  const visibleNpcs = useMemo(() => {
    if (isDm) return availableNpcs;
    return availableNpcs.filter(npc => (npc as any).visibility !== 'hidden');
  }, [availableNpcs, isDm]);

  const getSectionCommentCount = (sectionId: string) => {
    return comments.filter(c => c.sectionId === sectionId).length;
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Action Bar & Review Status */}
      <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          {/* Ready For Review Button */}
          <button
            type="button"
            onClick={handleToggleReady}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[44px] ${
              character.readyForReview
                ? 'bg-[#6F9E78] text-[#0E0D0C] shadow-md shadow-[#6F9E78]/20'
                : 'bg-[#201D19] text-[#EDE6D8] border border-[#2F2A23] hover:border-[#E0A030]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{character.readyForReview ? 'آماده‌ی بازبینی (در صف DM)' : 'علامت‌گذاری به عنوان: آماده‌ی بازبینی'}</span>
          </button>

          {/* Review Status Badge */}
          {character.reviewStatus === 'approved' && (
            <span className="text-xs px-2.5 py-1 rounded-xl bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>تأیید شده توسط راوی</span>
            </span>
          )}
          {character.reviewStatus === 'changes_requested' && (
            <span className="text-xs px-2.5 py-1 rounded-xl bg-[#C2512B]/20 text-[#E8836B] border border-[#C2512B]/30 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>نیازمند اصلاحات راوی</span>
            </span>
          )}

          {/* DM Action Button */}
          {isDm && onReviewBackstory && (
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#E0A030] text-[#0E0D0C] hover:bg-[#F2C265] min-h-[44px]"
            >
              داوری و ثبت نظر راوی
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Autosave status indicator */}
          <span className="text-[11px] text-[#A39A89] px-2">
            {saveStatus === 'saving' ? 'در حال ذخیره...' : saveStatus === 'dirty' ? 'تغییرات ذخیره‌نشده' : 'ذخیره خودکار فعال'}
          </span>

          {/* Revision History Button */}
          <button
            type="button"
            onClick={handleOpenRevisions}
            className="p-2 rounded-xl bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 text-xs"
            title="تاریخچه ویرایش‌ها"
          >
            <History className="w-4 h-4 text-[#F2C265]" />
            <span className="hidden sm:inline">تاریخچه</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={onPrint || (() => window.print())}
            className="p-2 rounded-xl bg-[#201D19] border border-[#2F2A23] text-[#A39A89] hover:text-[#EDE6D8] min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 text-xs"
            title="چاپ کاراکترشیت و پیشینه A4"
          >
            <Printer className="w-4 h-4 text-[#7FB4D6]" />
            <span className="hidden sm:inline">چاپ A4</span>
          </button>
        </div>
      </div>

      {/* Completeness & Guided Prompts Bar */}
      <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#F2C265]">میزان تکمیل ارکان پیشینه داستانی:</span>
          <span className="font-mono font-bold text-[#EDE6D8]">{completeness.percentage}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#131110] overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#E0A030] to-[#6F9E78] transition-all duration-300" 
            style={{ width: `${completeness.percentage}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
          {completeness.checklist.map((item, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-lg border ${
                item.passed
                  ? 'bg-[#6F9E78]/15 border-[#6F9E78]/30 text-[#6F9E78]'
                  : 'bg-[#201D19] border-[#2F2A23] text-[#8A8374]'
              }`}
            >
              {item.passed ? '✓' : '○'} {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Rich Text Toolbar */}
      <div className="sticky top-2 z-20 rounded-xl bg-[#131110]/95 backdrop-blur border border-[#2F2A23] p-1.5 flex items-center gap-1 shadow-md">
        <span className="text-[10px] text-[#8A8374] px-2 font-bold hidden sm:inline">ابزار نگارش:</span>
        <button
          type="button"
          onClick={() => applyFormatting('**', '**')}
          className="p-2 rounded-lg text-xs hover:bg-[#201D19] text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
          title="برجسته (Bold)"
        >
          <Bold className="w-3.5 h-3.5" />
          <span className="text-[10px]">درشت</span>
        </button>
        <button
          type="button"
          onClick={() => applyFormatting('*', '*')}
          className="p-2 rounded-lg text-xs hover:bg-[#201D19] text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
          title="مورب (Italic)"
        >
          <Italic className="w-3.5 h-3.5" />
          <span className="text-[10px]">مورب</span>
        </button>
        <button
          type="button"
          onClick={() => applyFormatting('\n• ')}
          className="p-2 rounded-lg text-xs hover:bg-[#201D19] text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
          title="فهرست نقطه‌ای"
        >
          <List className="w-3.5 h-3.5" />
          <span className="text-[10px]">فهرست</span>
        </button>
        <button
          type="button"
          onClick={() => applyFormatting('\n\n')}
          className="p-2 rounded-lg text-xs hover:bg-[#201D19] text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
          title="بند جدید"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
          <span className="text-[10px]">بند جدید</span>
        </button>
      </div>

      {/* SECTION 1: SUMMARY */}
      <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F2C265] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E0A030]" />
            خلاصه هویت و منش کلی (Summary)
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpandedPrompts(p => ({ ...p, summary: !p.summary }))}
              className="text-[11px] text-[#A39A89] hover:text-[#F2C265] flex items-center gap-1"
            >
              <span>راهنمای نگارش</span>
              {expandedPrompts.summary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveCommentSection(activeCommentSection === 'summary' ? null : 'summary')}
              className="px-2 py-1 rounded-lg bg-[#201D19] border border-[#2F2A23] text-xs text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{getSectionCommentCount('summary')}</span>
            </button>
          </div>
        </div>

        {expandedPrompts.summary && (
          <div className="p-3 rounded-xl bg-[#100E0D] border border-[#2F2A23] text-xs text-[#C9C0AE] space-y-1">
            {promptsGuide.prompts.summary.map((p, idx) => (
              <p key={idx}>💡 {p}</p>
            ))}
          </div>
        )}

        <textarea
          ref={activeTextareaRef}
          value={backstory.summary || ''}
          onChange={e => updateBackstoryField('summary', e.target.value)}
          rows={3}
          className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-3 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none leading-relaxed"
          placeholder="شخصیت خود را در یک بند جامع معرفی کنید..."
        />

        {/* Section Comments Thread */}
        {activeCommentSection === 'summary' && renderCommentThread('summary')}
      </div>

      {/* SECTION 2: ORIGIN */}
      <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F2C265] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#7FB4D6]" />
            خاستگاه، زادگاه و نقطه عطف (Origin)
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpandedPrompts(p => ({ ...p, origin: !p.origin }))}
              className="text-[11px] text-[#A39A89] hover:text-[#F2C265] flex items-center gap-1"
            >
              <span>راهنمای تبار و زادگاه</span>
              {expandedPrompts.origin ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveCommentSection(activeCommentSection === 'origin' ? null : 'origin')}
              className="px-2 py-1 rounded-lg bg-[#201D19] border border-[#2F2A23] text-xs text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{getSectionCommentCount('origin')}</span>
            </button>
          </div>
        </div>

        {expandedPrompts.origin && (
          <div className="p-3 rounded-xl bg-[#100E0D] border border-[#2F2A23] text-xs text-[#C9C0AE] space-y-1.5">
            {promptsGuide.prompts.origin.map((p, idx) => (
              <p key={idx}>💡 {p}</p>
            ))}
            {promptsGuide.lineageSpecific.length > 0 && (
              <div className="pt-2 border-t border-[#2F2A23] text-[#F2C265]">
                <span className="font-bold block mb-1">پرسش‌های ویژه تبار {lineageTemplate?.name}:</span>
                {promptsGuide.lineageSpecific.map((lp, idx) => (
                  <p key={idx}>🌟 {lp}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <textarea
          value={backstory.origin || ''}
          onChange={e => updateBackstoryField('origin', e.target.value)}
          rows={3}
          className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-3 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none leading-relaxed"
          placeholder="در چه سرزمینی زاده شدید و چه رخدادی مسیر زندگی شما را دگرگون کرد..."
        />

        {activeCommentSection === 'origin' && renderCommentThread('origin')}
      </div>

      {/* SECTION 3: PERSONALITY PILLARS */}
      <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F2C265]">ارکان شخصیتی و روحی (Traits, Ideals, Bonds, Flaws)</h3>
          <button
            type="button"
            onClick={() => setActiveCommentSection(activeCommentSection === 'personality' ? null : 'personality')}
            className="px-2 py-1 rounded-lg bg-[#201D19] border border-[#2F2A23] text-xs text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{getSectionCommentCount('personality')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Traits */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#EDE6D8]">ویژگی‌های رفتاری (Traits)</label>
              <button
                type="button"
                onClick={() => handleRollPersonality('traits')}
                className="text-[11px] text-[#F2C265] hover:text-[#E0A030] flex items-center gap-1"
                title="تاس تصادفی از جدول پیشینه"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>تاس از پیشینه</span>
              </button>
            </div>
            <textarea
              value={backstory.personality?.traits || ''}
              onChange={e => updatePersonalityField('traits', e.target.value)}
              rows={2}
              className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
            />
          </div>

          {/* Ideals */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#EDE6D8]">آرمان‌ها و باورها (Ideals)</label>
              <button
                type="button"
                onClick={() => handleRollPersonality('ideals')}
                className="text-[11px] text-[#F2C265] hover:text-[#E0A030] flex items-center gap-1"
                title="تاس تصادفی از جدول پیشینه"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>تاس از پیشینه</span>
              </button>
            </div>
            <textarea
              value={backstory.personality?.ideals || ''}
              onChange={e => updatePersonalityField('ideals', e.target.value)}
              rows={2}
              className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
            />
          </div>

          {/* Bonds */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#EDE6D8]">پیمان‌ها و دلبستگی‌ها (Bonds)</label>
              <button
                type="button"
                onClick={() => handleRollPersonality('bonds')}
                className="text-[11px] text-[#F2C265] hover:text-[#E0A030] flex items-center gap-1"
                title="تاس تصادفی از جدول پیشینه"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>تاس از پیشینه</span>
              </button>
            </div>
            <textarea
              value={backstory.personality?.bonds || ''}
              onChange={e => updatePersonalityField('bonds', e.target.value)}
              rows={2}
              className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
            />
          </div>

          {/* Flaws */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#EDE6D8]">نقایص و هراس‌ها (Flaws)</label>
              <button
                type="button"
                onClick={() => handleRollPersonality('flaws')}
                className="text-[11px] text-[#F2C265] hover:text-[#E0A030] flex items-center gap-1"
                title="تاس تصادفی از جدول پیشینه"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>تاس از پیشینه</span>
              </button>
            </div>
            <textarea
              value={backstory.personality?.flaws || ''}
              onChange={e => updatePersonalityField('flaws', e.target.value)}
              rows={2}
              className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
            />
          </div>
        </div>

        {activeCommentSection === 'personality' && renderCommentThread('personality')}
      </div>

      {/* SECTION 4: GOALS */}
      <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F2C265]">اهداف، مقاصد و آرزوها (Goals)</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpandedPrompts(p => ({ ...p, goals: !p.goals }))}
              className="text-[11px] text-[#A39A89] hover:text-[#F2C265] flex items-center gap-1"
            >
              <span>راهنما</span>
              {expandedPrompts.goals ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveCommentSection(activeCommentSection === 'goals' ? null : 'goals')}
              className="px-2 py-1 rounded-lg bg-[#201D19] border border-[#2F2A23] text-xs text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{getSectionCommentCount('goals')}</span>
            </button>
          </div>
        </div>

        {expandedPrompts.goals && (
          <div className="p-3 rounded-xl bg-[#100E0D] border border-[#2F2A23] text-xs text-[#C9C0AE] space-y-1">
            {promptsGuide.prompts.goals.map((p, idx) => (
              <p key={idx}>💡 {p}</p>
            ))}
          </div>
        )}

        <textarea
          value={backstory.goals || ''}
          onChange={e => updateBackstoryField('goals', e.target.value)}
          rows={2}
          className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-3 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none leading-relaxed"
          placeholder="چه هدفی شما را در میان خطرات به پیش می‌راند..."
        />

        {activeCommentSection === 'goals' && renderCommentThread('goals')}
      </div>

      {/* SECTION 5: RELATIONSHIPS */}
      <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F2C265]">ارتباطات، یاران و پیوند با NPCها (Relationships)</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCommentSection(activeCommentSection === 'relationships' ? null : 'relationships')}
              className="px-2 py-1 rounded-lg bg-[#201D19] border border-[#2F2A23] text-xs text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{getSectionCommentCount('relationships')}</span>
            </button>
            <button
              type="button"
              onClick={handleAddRelationship}
              className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 flex items-center gap-1 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              افزودن رابطه
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {(backstory.relationships || []).length === 0 ? (
            <p className="text-xs text-[#8A8374] text-center py-4 border border-dashed border-[#2F2A23] rounded-xl">
              هنوز ارتباط یا پیوندی با اشخاص ثبت نشده است.
            </p>
          ) : (
            backstory.relationships.map((rel, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#131110] border border-[#2F2A23] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={rel.name}
                      onChange={e => handleUpdateRelationship(idx, { name: e.target.value })}
                      placeholder="نام شخص یا همراه..."
                      className="bg-[#0E0D0C] border border-[#2F2A23] rounded-lg px-2.5 py-1.5 text-xs text-[#EDE6D8] focus:border-[#E0A030]"
                    />
                    {/* Link to Campaign NPC */}
                    <select
                      value={rel.npcRef || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const matched = visibleNpcs.find(n => n.id === val);
                        handleUpdateRelationship(idx, {
                          npcRef: val || undefined,
                          name: matched ? matched.name : rel.name
                        });
                      }}
                      className="bg-[#0E0D0C] border border-[#2F2A23] rounded-lg px-2 py-1.5 text-xs text-[#A39A89]"
                    >
                      <option value="">-- بدون پیوند با NPC کمپین --</option>
                      {visibleNpcs.map(npc => (
                        <option key={npc.id} value={npc.id}>
                          {npc.name} {isDm && (npc as any).visibility === 'hidden' ? '(پنهان - DM)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Share with party toggle */}
                    <button
                      type="button"
                      onClick={() => handleUpdateRelationship(idx, { shareWithParty: rel.shareWithParty === false })}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 min-h-[36px] ${
                        rel.shareWithParty !== false
                          ? 'bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30'
                          : 'bg-[#201D19] text-[#A39A89] border border-[#3A342B]'
                      }`}
                    >
                      {rel.shareWithParty !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{rel.shareWithParty !== false ? 'مشترک' : 'محرمانه'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRelationship(idx)}
                      className="p-1.5 text-[#D66138] hover:bg-[#C2512B]/20 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={rel.note}
                  onChange={e => handleUpdateRelationship(idx, { note: e.target.value })}
                  placeholder="یادداشت درباره پیوند، تاریخچه یا احساس نسبت به این شخص..."
                  className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-lg px-2.5 py-1.5 text-xs text-[#C9C0AE]"
                />
              </div>
            ))
          )}
        </div>

        {activeCommentSection === 'relationships' && renderCommentThread('relationships')}
      </div>

      {/* SECTION 6: TIMELINE */}
      <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F2C265]">خط زمانی رویدادهای گذشته (Timeline)</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCommentSection(activeCommentSection === 'timeline' ? null : 'timeline')}
              className="px-2 py-1 rounded-lg bg-[#201D19] border border-[#2F2A23] text-xs text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{getSectionCommentCount('timeline')}</span>
            </button>
            <button
              type="button"
              onClick={handleAddTimeline}
              className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 flex items-center gap-1 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              افزودن رویداد
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {(backstory.timeline || []).length === 0 ? (
            <p className="text-xs text-[#8A8374] text-center py-4 border border-dashed border-[#2F2A23] rounded-xl">
              رویدادی در خط زمانی پیش از بازی ثبت نشده است.
            </p>
          ) : (
            backstory.timeline.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#131110] border border-[#2F2A23] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => handleUpdateTimeline(idx, { label: e.target.value })}
                    placeholder="مقطع یا سال (مثلاً بهار ۱۴۹۵)..."
                    className="bg-[#0E0D0C] border border-[#2F2A23] rounded-lg px-2.5 py-1 text-xs text-[#F2C265] font-bold flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateTimeline(idx, { shareWithParty: item.shareWithParty === false })}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 min-h-[36px] ${
                        item.shareWithParty !== false
                          ? 'bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30'
                          : 'bg-[#201D19] text-[#A39A89] border border-[#3A342B]'
                      }`}
                    >
                      {item.shareWithParty !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{item.shareWithParty !== false ? 'مشترک' : 'محرمانه'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTimeline(idx)}
                      className="p-1 text-[#D66138] hover:bg-[#C2512B]/20 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={item.text}
                  onChange={e => handleUpdateTimeline(idx, { text: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-lg p-2 text-xs text-[#C9C0AE]"
                  placeholder="شرح رویداد..."
                />
              </div>
            ))
          )}
        </div>

        {activeCommentSection === 'timeline' && renderCommentThread('timeline')}
      </div>

      {/* SECTION 7: CUSTOM SECTIONS */}
      <div className="rounded-2xl bg-[#171513] border border-[#2F2A23] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F2C265]">بخش‌های سفارشی پیشینه (Custom Sections)</h3>
          <button
            type="button"
            onClick={handleAddCustomSection}
            className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/25 flex items-center gap-1 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            افزودن بخش سفارشی
          </button>
        </div>

        <div className="space-y-3">
          {(backstory.sections || []).length === 0 ? (
            <p className="text-xs text-[#8A8374] text-center py-4 border border-dashed border-[#2F2A23] rounded-xl">
              بخش سفارشی افزوده‌ای وجود ندارد.
            </p>
          ) : (
            backstory.sections.map(sec => (
              <div key={sec.id} className="p-4 rounded-xl bg-[#131110] border border-[#2F2A23] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={sec.title}
                    onChange={e => handleUpdateCustomSection(sec.id, { title: e.target.value })}
                    className="bg-transparent text-sm font-bold text-[#F2C265] focus:outline-none flex-1 border-b border-transparent focus:border-[#E0A030]"
                    placeholder="عنوان بخش..."
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateCustomSection(sec.id, { shareWithParty: !sec.shareWithParty })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 min-h-[36px] ${
                        sec.shareWithParty
                          ? 'bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30'
                          : 'bg-[#201D19] text-[#A39A89] border border-[#3A342B]'
                      }`}
                    >
                      {sec.shareWithParty ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{sec.shareWithParty ? 'مشترک با یاران' : 'فقط دانجن مستر'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCommentSection(activeCommentSection === sec.id ? null : sec.id)}
                      className="px-2 py-1 rounded-lg bg-[#201D19] border border-[#2F2A23] text-xs text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{getSectionCommentCount(sec.id)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomSection(sec.id)}
                      className="p-1.5 text-[#D66138] hover:bg-[#C2512B]/20 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={sec.text}
                  onChange={e => handleUpdateCustomSection(sec.id, { text: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-lg p-2.5 text-xs text-[#C9C0AE]"
                  placeholder="متن بخش سفارشی..."
                />
                {activeCommentSection === sec.id && renderCommentThread(sec.id)}
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 8: DM ONLY SECRETS & HOOKS */}
      <div className="rounded-2xl bg-[#1A1210] border border-[#C2512B]/30 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#E8836B] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#D66138]" />
            رازها و قلاب‌های محرمانه (فقط دانجن مستر و صاحب کاراکتر)
          </h3>
          <button
            type="button"
            onClick={() => setActiveCommentSection(activeCommentSection === 'dm_secrets' ? null : 'dm_secrets')}
            className="px-2 py-1 rounded-lg bg-[#201D19] border border-[#2F2A23] text-xs text-[#A39A89] hover:text-[#EDE6D8] flex items-center gap-1 min-h-[36px]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{getSectionCommentCount('dm_secrets')}</span>
          </button>
        </div>
        <p className="text-xs text-[#E8836B]/60">
          این فیلدها هرگز توسط سرور به سایر بازیکنان یا اعضای گروه نشان داده نمی‌شوند.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#E8836B]/80 mb-1">رازهای مگو (Secrets)</label>
            <textarea
              value={backstory.dmOnly?.secrets || ''}
              onChange={e => updateDmOnlyField('secrets', e.target.value)}
              rows={2}
              className="w-full bg-[#131110] border border-[#C2512B]/40 rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#C2512B]"
              placeholder="رازی تاریک از گذشته..."
            />
          </div>
          <div>
            <label className="block text-xs text-[#E8836B]/80 mb-1">قلاب‌های داستانی (Hooks)</label>
            <textarea
              value={backstory.dmOnly?.hooks || ''}
              onChange={e => updateDmOnlyField('hooks', e.target.value)}
              rows={2}
              className="w-full bg-[#131110] border border-[#C2512B]/40 rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#C2512B]"
              placeholder="انگیزه‌ها یا عهدنامه‌هایی که راوی می‌تواند در ماجرا دخیل کند..."
            />
          </div>
        </div>

        {activeCommentSection === 'dm_secrets' && renderCommentThread('dm_secrets')}
      </div>

      {/* Revision History Bottom Sheet */}
      <BottomSheet
        isOpen={isRevisionSheetOpen}
        onClose={() => setIsRevisionSheetOpen(false)}
        title="تاریخچه ویرایش‌های پیشینه (۱۰ نسخه اخیر)"
      >
        <div className="space-y-3 py-2 text-right" dir="rtl">
          {loadingRevisions ? (
            <p className="text-xs text-[#A39A89] text-center py-4">در حال بارگذاری تاریخچه...</p>
          ) : revisions.length === 0 ? (
            <p className="text-xs text-[#8A8374] text-center py-4">هنوز نسخه‌ای در تاریخچه ثبت نشده است.</p>
          ) : (
            revisions.map((rev, idx) => {
              const dateStr = new Date(rev.createdAt).toLocaleString('fa-IR');
              return (
                <div key={rev.id || idx} className="p-3.5 rounded-xl bg-[#141210] border border-[#2F2A23] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#F2C265] block">{dateStr}</span>
                    <p className="text-[11px] text-[#A39A89] mt-0.5 line-clamp-1">
                      {rev.backstory?.summary || rev.backstory?.origin || 'پیشینه'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(rev.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#E0A030]/20 border border-[#E0A030]/40 text-[#F2C265] text-xs font-bold hover:bg-[#E0A030]/30 min-h-[36px] flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بازگردانی</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </BottomSheet>

      {/* DM Review Modal */}
      {isReviewModalOpen && (
        <BottomSheet
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title="داوری و بازبینی پیشینه داستانی"
        >
          <div className="space-y-4 py-2 text-right" dir="rtl">
            <p className="text-xs text-[#A39A89]">
              شما به عنوان دانجن مستر می‌توانید پیشینه نگاشته‌شده توسط بازیکن را تأیید کرده یا درخواست اصلاح همراه با یادداشت ارسال کنید.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReviewAction('approved')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                  reviewAction === 'approved'
                    ? 'bg-[#6F9E78] text-[#0E0D0C] border-[#6F9E78]'
                    : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]'
                }`}
              >
                تأیید رسمی پیشینه
              </button>
              <button
                type="button"
                onClick={() => setReviewAction('changes_requested')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition ${
                  reviewAction === 'changes_requested'
                    ? 'bg-[#C2512B] text-[#EDE6D8] border-[#C2512B]'
                    : 'bg-[#201D19] text-[#A39A89] border-[#2F2A23]'
                }`}
              >
                درخواست اصلاحات
              </button>
            </div>

            <div>
              <label className="block text-xs text-[#EDE6D8] mb-1 font-bold">یادداشت و راهنمایی دانجن مستر:</label>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                rows={3}
                placeholder="توضیحاتی برای بازیکن درباره نقاط قوت یا موارد نیازمند هماهنگی بیشتر با لور جهان..."
                className="w-full bg-[#131110] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:border-[#E0A030]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-[#A39A89]"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleSubmitDmReview}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E0A030] text-[#0E0D0C] hover:bg-[#F2C265]"
              >
                {isSubmittingReview ? 'در حال ثبت...' : 'ثبت داوری'}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );

  // Sub-render for section comment thread
  function renderCommentThread(sectionId: string) {
    const secComments = comments.filter(c => c.sectionId === sectionId);

    return (
      <div className="mt-3 p-3.5 rounded-xl bg-[#0E0D0C] border border-[#2F2A23] space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-[#2F2A23] pb-2">
          <span className="font-bold text-[#F2C265] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            دیدگاه‌های این بخش ({secComments.length})
          </span>
          <span className="text-[10px] text-[#8A8374]">فقط نویسنده و راوی کمپین می‌بینند</span>
        </div>

        {secComments.length === 0 ? (
          <p className="text-[11px] text-[#8A8374] py-1">هنوز دیدگاهی ثبت نشده است.</p>
        ) : (
          <div className="space-y-2">
            {secComments.map(c => (
              <div
                key={c.id}
                className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                  c.resolved
                    ? 'bg-[#141822]/40 border-[#6F9E78]/30 opacity-70'
                    : 'bg-[#171513] border-[#2F2A23]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#EDE6D8]">{c.authorName || 'کاربر'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#201D19] text-[#A39A89]">
                      {c.authorRole}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleResolve(c.id, c.resolved)}
                    className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                      c.resolved
                        ? 'bg-[#6F9E78]/20 text-[#6F9E78]'
                        : 'bg-[#201D19] text-[#8A8374] hover:text-[#EDE6D8]'
                    }`}
                  >
                    {c.resolved ? '✓ حل شد' : 'علامت به عنوان حل شده'}
                  </button>
                </div>
                <p className="text-[11px] text-[#C9C0AE] leading-relaxed whitespace-pre-wrap">{c.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add comment input */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={activeCommentSection === sectionId ? newCommentText : ''}
            onChange={e => setNewCommentText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment(sectionId);
              }
            }}
            placeholder="درج دیدگاه، پرسش یا پیشنهاد اصلاح..."
            className="flex-1 bg-[#131110] border border-[#2F2A23] rounded-lg px-2.5 py-1.5 text-xs text-[#EDE6D8] focus:border-[#E0A030] focus:outline-none"
          />
          <button
            type="button"
            disabled={submittingComment || !newCommentText.trim()}
            onClick={() => handleAddComment(sectionId)}
            className="px-3 py-1.5 rounded-lg bg-[#E0A030] text-[#0E0D0C] text-xs font-bold hover:bg-[#F2C265] disabled:opacity-50 min-h-[36px]"
          >
            {submittingComment ? '...' : 'ارسال'}
          </button>
        </div>
      </div>
    );
  }
};
