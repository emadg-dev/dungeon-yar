import React, { useState, useEffect, useMemo } from 'react';
import { 
  Campaign, ContentPack, ContentPackKind, EntityScopeType, CloneEntityType, 
  EntityRef, CloneOptions, CloneManifest, CloneJob, LocationEntry, NPC, 
  ItemLibraryEntry, Encounter, ClassTemplate, LineageTemplate, BackgroundTemplate, 
  Faction, CampaignDoc, GenericCalendarData, RuleSet, LinkedEntityDiff, RewardPackage, User
} from '../../types';
import { api } from '../../services/api';
import { BottomSheet } from '../mobile/BottomSheet';
import { LineageEditorSheet } from './LineageEditorSheet';
import { BackgroundEditorSheet } from './BackgroundEditorSheet';
import { ClassEditorSheet } from './ClassEditorSheet';
import { 
  Library, Search, Filter, Plus, CheckSquare, Square, Copy, Bookmark, 
  Trash2, ExternalLink, RefreshCw, Eye, EyeOff, Sparkles, FolderPlus, 
  Upload, Download, ArrowRight, ArrowLeft, Star, ChevronRight, ChevronDown, 
  Folder, MapPin, Swords, Shield, Scroll, Calendar, Check, AlertTriangle, 
  Layers, Settings, Sliders, Edit, X, Save
} from 'lucide-react';

interface DmLibraryProps {
  currentCampaignId: string;
  currentUser: User | null;
  myCampaigns: Campaign[];
  onRollDice?: (sides: number, count: number, modifier: number, label: string) => void;
  onRefreshCampaignData?: () => void;
}

type EntityTypeFilter = 'all' | 'location' | 'npc' | 'item' | 'encounter' | 'class_template' | 'lineage_template' | 'background_template' | 'faction' | 'calendar' | 'rule_set' | 'campaign_doc';

export const DmLibrary: React.FC<DmLibraryProps> = ({
  currentCampaignId,
  currentUser,
  myCampaigns,
  onRollDice,
  onRefreshCampaignData
}) => {
  // Source selector
  const [source, setSource] = useState<string>('current_campaign');
  const [typeFilter, setTypeFilter] = useState<EntityTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'favorite'>('newest');

  // Data
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [packs, setPacks] = useState<ContentPack[]>([]);

  // Multi-select state
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedRefs, setSelectedRefs] = useState<EntityRef[]>([]);

  // Detail Sheet state
  const [detailItem, setDetailItem] = useState<any | null>(null);

  // Import / Clone Sheet state (3 steps)
  const [importSheet, setImportSheet] = useState<{
    isOpen: boolean;
    step: 1 | 2 | 3;
    sourceScope: { scopeType: EntityScopeType; scopeId: string };
    targetScope: { scopeType: EntityScopeType; scopeId: string };
    selectedRefs: EntityRef[];
    includeDependencies: boolean;
    includeChildren: boolean;
    options: CloneOptions;
    overrides: Record<string, any>;
    manifest: CloneManifest | null;
    isExecuting: boolean;
    resultJob: CloneJob | null;
  }>({
    isOpen: false,
    step: 1,
    sourceScope: { scopeType: 'campaign', scopeId: currentCampaignId },
    targetScope: { scopeType: 'campaign', scopeId: currentCampaignId },
    selectedRefs: [],
    includeDependencies: true,
    includeChildren: true,
    options: {
      includeDependencies: 'auto',
      includeChildren: true,
      stripDmSecrets: false,
      resetState: true,
      visibility: 'hidden',
      nameConflict: 'rename',
      keepLink: 'copy'
    },
    overrides: {},
    manifest: null,
    isExecuting: false,
    resultJob: null
  });

  // Pack Management Modal
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [newPackDesc, setNewPackDesc] = useState('');
  const [newPackKind, setNewPackKind] = useState<ContentPackKind>('pack');
  const [newPackVis, setNewPackVis] = useState<'private' | 'instance'>('private');

  // Pack Export/Import Sheet
  const [packExportImportOpen, setPackExportImportOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importPreviewManifest, setImportPreviewManifest] = useState<CloneManifest | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Save Campaign As Template Modal
  const [saveTemplateModalOpen, setSaveTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateStripSecrets, setTemplateStripSecrets] = useState(true);

  // Generic Calendar Editor Modal
  const [calendarEditorOpen, setCalendarEditorOpen] = useState(false);
  const [calendarData, setCalendarData] = useState<GenericCalendarData | null>(null);

  // Location Tree Modal / Move-to sheet
  const [locationTreeModalOpen, setLocationTreeModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [locationToMove, setLocationToMove] = useState<LocationEntry | null>(null);

  // Part B: Linked Diff Modal
  const [linkedDiffModal, setLinkedDiffModal] = useState<{
    isOpen: boolean;
    diff: LinkedEntityDiff | null;
    chosenFields: Record<string, 'local' | 'source'>;
  }>({
    isOpen: false,
    diff: null,
    chosenFields: {}
  });

  // Template Editors (Class, Lineage, Background)
  const [classEditor, setClassEditor] = useState<{ isOpen: boolean; item: ClassTemplate | null }>({
    isOpen: false,
    item: null
  });
  const [lineageEditor, setLineageEditor] = useState<{ isOpen: boolean; item: LineageTemplate | null }>({
    isOpen: false,
    item: null
  });
  const [backgroundEditor, setBackgroundEditor] = useState<{ isOpen: boolean; item: BackgroundTemplate | null }>({
    isOpen: false,
    item: null
  });

  // Toast / feedback message
  const [toast, setToast] = useState<string | null>(null);
  const showFeedback = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load Packs
  const loadPacks = async () => {
    try {
      const p = await api.listPacks();
      setPacks(p);
    } catch {}
  };

  // Load Library Items
  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.getLibraryItems({
        source,
        type: typeFilter === 'all' ? undefined : typeFilter,
        q: searchQuery || undefined,
        tag: tagFilter || undefined,
        region: regionFilter || undefined,
        sort: sortBy,
        limit: 100
      });
      setItems(res.items);
      setTotalCount(res.total);
    } catch (e: any) {
      showFeedback(e.message || 'خطا در بارگذاری محتوا');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacks();
  }, []);

  useEffect(() => {
    loadItems();
  }, [source, typeFilter, searchQuery, tagFilter, regionFilter, sortBy]);

  // Toggle favorite
  const handleToggleFavorite = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    try {
      const newState = await api.toggleFavorite(item.itemType, item.id);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isFavorite: newState } : i));
      showFeedback(newState ? 'به علاقه‌مندی‌ها افزوده شد' : 'از علاقه‌مندی‌ها حذف شد');
    } catch (err: any) {
      showFeedback(err.message || 'خطا در تغییر علاقه‌مندی');
    }
  };

  // Multi-select toggle
  const toggleSelectRef = (ref: EntityRef) => {
    setSelectedRefs(prev => {
      const exists = prev.some(r => r.type === ref.type && r.id === ref.id);
      if (exists) {
        return prev.filter(r => !(r.type === ref.type && r.id === ref.id));
      } else {
        return [...prev, ref];
      }
    });
  };

  const isRefSelected = (ref: EntityRef) => {
    return selectedRefs.some(r => r.type === ref.type && r.id === ref.id);
  };

  // Batch actions
  const handleBatchCopyToCurrentCampaign = () => {
    if (selectedRefs.length === 0) return;
    openImportSheet(selectedRefs, { scopeType: 'campaign', scopeId: currentCampaignId });
  };

  const handleBatchSaveToMyLibrary = async () => {
    if (selectedRefs.length === 0) return;
    try {
      const res = await api.saveToLibrary({ entityRefs: selectedRefs });
      showFeedback(`${res.count} مورد با موفقیت در کتابخانه‌ی شما ذخیره شد.`);
      setSelectedRefs([]);
      setMultiSelectMode(false);
      loadItems();
    } catch (e: any) {
      showFeedback(e.message || 'خطا در ذخیره در کتابخانه');
    }
  };

  // Open 3-step import wizard sheet
  const openImportSheet = async (
    refs: EntityRef[], 
    target: { scopeType: EntityScopeType; scopeId: string }
  ) => {
    // Determine source scope based on current source
    let sourceScope: { scopeType: EntityScopeType; scopeId: string } = {
      scopeType: 'campaign',
      scopeId: currentCampaignId
    };
    if (source === 'my_library') {
      const myLib = packs.find(p => p.ownerId === currentUser?.id && p.isDefaultLibrary);
      sourceScope = { scopeType: 'pack', scopeId: myLib?.id || 'pack-zorvania' };
    } else if (source.startsWith('pack-') || source.startsWith('pack_')) {
      sourceScope = { scopeType: 'pack', scopeId: source };
    } else if (source.startsWith('camp-') || source === 'zorvania-c1' || source === 'campaign-srd-test') {
      sourceScope = { scopeType: 'campaign', scopeId: source };
    }

    setImportSheet({
      isOpen: true,
      step: 1,
      sourceScope,
      targetScope: target,
      selectedRefs: refs,
      includeDependencies: true,
      includeChildren: true,
      options: {
        includeDependencies: 'auto',
        includeChildren: true,
        stripDmSecrets: target.scopeType === 'campaign' && sourceScope.scopeType === 'pack',
        resetState: true,
        visibility: 'hidden',
        nameConflict: 'rename',
        keepLink: 'copy'
      },
      overrides: {},
      manifest: null,
      isExecuting: false,
      resultJob: null
    });
  };

  // Advance from Step 1 to Step 2
  const handleImportGoToStep2 = () => {
    setImportSheet(prev => ({ ...prev, step: 2 }));
  };

  // Advance from Step 2 to Step 3 (Runs previewClone)
  const handleImportGoToStep3 = async () => {
    try {
      const manifest = await api.previewClone({
        source: {
          scopeType: importSheet.sourceScope.scopeType,
          scopeId: importSheet.sourceScope.scopeId,
          entityRefs: importSheet.selectedRefs
        },
        target: {
          scopeType: importSheet.targetScope.scopeType,
          scopeId: importSheet.targetScope.scopeId
        },
        options: {
          ...importSheet.options,
          includeDependencies: importSheet.includeDependencies ? 'auto' : 'none',
          includeChildren: importSheet.includeChildren
        },
        overrides: importSheet.overrides
      });
      setImportSheet(prev => ({ ...prev, manifest, step: 3 }));
    } catch (err: any) {
      showFeedback(err.message || 'خطا در محاسبه پیش‌نمایش کلون');
    }
  };

  // Run the clone in Step 3
  const handleExecuteImport = async () => {
    setImportSheet(prev => ({ ...prev, isExecuting: true }));
    try {
      const job = await api.runClone({
        source: {
          scopeType: importSheet.sourceScope.scopeType,
          scopeId: importSheet.sourceScope.scopeId,
          entityRefs: importSheet.selectedRefs
        },
        target: {
          scopeType: importSheet.targetScope.scopeType,
          scopeId: importSheet.targetScope.scopeId
        },
        options: {
          ...importSheet.options,
          includeDependencies: importSheet.includeDependencies ? 'auto' : 'none',
          includeChildren: importSheet.includeChildren
        },
        overrides: importSheet.overrides
      });
      setImportSheet(prev => ({ ...prev, isExecuting: false, resultJob: job }));
      showFeedback(`کلون با موفقیت انجام شد (${job.manifest.totalCount} مورد)`);
      if (onRefreshCampaignData) onRefreshCampaignData();
      loadItems();
    } catch (err: any) {
      setImportSheet(prev => ({ ...prev, isExecuting: false }));
      showFeedback(err.message || 'خطا در اجرای کلون');
    }
  };

  // Undo the clone
  const handleUndoClone = async (jobId: string) => {
    try {
      const res = await api.undoCloneJob(jobId, true);
      showFeedback(`عملیات بازگردانی شد (${res.undoneCount} مورد حذف شد)`);
      setImportSheet(prev => ({ ...prev, isOpen: false }));
      if (onRefreshCampaignData) onRefreshCampaignData();
      loadItems();
    } catch (err: any) {
      showFeedback(err.message || 'خطا در لغو کلون');
    }
  };

  // Part B: Linked Diff inspection
  const handleOpenLinkedDiff = async (item: any) => {
    try {
      const diff = await api.getLinkedEntityDiff(item.itemType, item.id);
      if (!diff) {
        showFeedback('اطلاعات منبع در دسترس نیست.');
        return;
      }
      const initialChosen: Record<string, 'local' | 'source'> = {};
      diff.diffs.forEach(d => {
        initialChosen[d.field] = 'source';
      });
      setLinkedDiffModal({
        isOpen: true,
        diff,
        chosenFields: initialChosen
      });
    } catch (err: any) {
      showFeedback(err.message || 'خطا در بررسی پیوند');
    }
  };

  // Apply chosen diff fields
  const handleApplyLinkedDiff = async () => {
    if (!linkedDiffModal.diff) return;
    try {
      await api.applyLinkedDiff(
        linkedDiffModal.diff.entityType,
        linkedDiffModal.diff.entityId,
        linkedDiffModal.chosenFields
      );
      showFeedback('تغییرات برگزیده با موفقیت اعمال شد.');
      setLinkedDiffModal({ isOpen: false, diff: null, chosenFields: {} });
      loadItems();
    } catch (err: any) {
      showFeedback(err.message || 'خطا در اعمال تغییرات پیوند');
    }
  };

  // Detach link
  const handleDetachLink = async (item: any) => {
    try {
      await api.detachLink(item.itemType, item.id);
      showFeedback('پیوند قطع شد و موجودیت به کپی مستقل تبدیل گردید.');
      setDetailItem(null);
      loadItems();
    } catch (err: any) {
      showFeedback(err.message || 'خطا در قطع پیوند');
    }
  };

  // Calendar Editor Save
  const handleSaveCalendar = async () => {
    if (!calendarData) return;
    try {
      await api.updateGenericCalendar(calendarData);
      showFeedback('گاه‌شمار با موفقیت ذخیره شد.');
      setCalendarEditorOpen(false);
      loadItems();
    } catch (err: any) {
      showFeedback(err.message || 'خطا در ذخیره گاه‌شمار');
    }
  };

  // Save Campaign As Template
  const handleSaveCampaignAsTemplate = async () => {
    if (!templateName.trim()) return;
    try {
      const pack = await api.saveCampaignAsTemplate(currentCampaignId, {
        name: templateName.trim(),
        description: templateDesc.trim(),
        stripSecrets: templateStripSecrets
      });
      showFeedback(`قالب «${pack.name}» با موفقیت ایجاد گردید.`);
      setSaveTemplateModalOpen(false);
      setTemplateName('');
      setTemplateDesc('');
      loadPacks();
    } catch (err: any) {
      showFeedback(err.message || 'خطا در ایجاد قالب');
    }
  };

  // Pack Export
  const handleExportPack = async (packId: string) => {
    try {
      const data = await api.exportPack(packId, { embedMedia: true });
      const str = JSON.stringify(data, null, 2);
      const blob = new Blob([str], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pack-${packId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showFeedback('فایل بسته‌ی محتوا با موفقیت خروجی گرفته شد.');
    } catch (err: any) {
      showFeedback(err.message || 'خطا در صدور بسته');
    }
  };

  // Pack Import Preview
  const handlePreviewImportPack = async () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJsonText);
      const manifest = await api.previewImportPack(parsed);
      setImportPreviewManifest(manifest);
    } catch (err: any) {
      setImportError(err.message || 'فرمت JSON بسته نامعتبر است.');
    }
  };

  // Pack Import Run
  const handleRunImportPack = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const job = await api.runImportPack(parsed, { scopeType: 'campaign', scopeId: currentCampaignId });
      showFeedback(`بسته با موفقیت وارد شد (${job.manifest.totalCount} مورد)`);
      setPackExportImportOpen(false);
      setImportJsonText('');
      setImportPreviewManifest(null);
      if (onRefreshCampaignData) onRefreshCampaignData();
      loadItems();
    } catch (err: any) {
      setImportError(err.message || 'خطا در درون‌ریزی بسته');
    }
  };

  // Render Entity Type Badges
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'location':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#6F9E78]/20 text-[#6F9E78] border border-[#6F9E78]/30">مکان</span>;
      case 'npc':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#9B72CF]/20 text-[#9B72CF] border border-[#9B72CF]/30">NPC / هیولا</span>;
      case 'item':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30">آیتم / سلاح</span>;
      case 'encounter':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#C2512B]/20 text-[#E8836B] border border-[#C2512B]/30">مواجهه</span>;
      case 'class_template':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#7FB4D6]/20 text-[#7FB4D6] border border-[#7FB4D6]/30">کلاس</span>;
      case 'lineage_template':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#D4A373]/20 text-[#D4A373] border border-[#D4A373]/30">نژاد و تبار</span>;
      case 'background_template':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#8B9D83]/20 text-[#8B9D83] border border-[#8B9D83]/30">پیشینه</span>;
      case 'faction':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E0A030]/20 text-[#F2C265] border border-[#E0A030]/30">جناح</span>;
      case 'calendar':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#7FB4D6]/20 text-[#7FB4D6] border border-[#7FB4D6]/30">گاه‌شمار</span>;
      case 'rule_set':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#2F2A23]/20 text-[#EDE6D8] border border-[#2F2A23]/30">قوانین</span>;
      case 'campaign_doc':
        return <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#9B72CF]/20 text-[#9B72CF] border border-[#9B72CF]/30">سند</span>;
      default:
        return null;
    }
  };

  // Render Link Badge (Part B)
  const renderLinkBadge = (item: any) => {
    if (item.sourceMode === 'linked' && item.sourceId) {
      const isUpdated = item.copiedAt && item.updatedAt && item.updatedAt > item.copiedAt;
      return (
        <span 
          onClick={(e) => {
            e.stopPropagation();
            handleOpenLinkedDiff(item);
          }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
            isUpdated 
              ? 'bg-[#E0A030] text-[#0E0D0C] animate-pulse hover:bg-[#F2C265]' 
              : 'bg-[#2F2A23] text-[#EDE6D8] hover:bg-[#3A342B]'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          {isUpdated ? 'به‌روزرسانی موجود است' : 'کپی پیونددار'}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 pb-20 text-right" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#E0A030] text-[#0E0D0C] px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Bar: Source Switcher & Global Actions */}
      <div className="surface-card rounded-2xl p-4 border border-[#2F2A23] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-[#F2C265]" />
            <h2 className="text-base font-bold text-[#EDE6D8]">کتابخانه و مخزن محتوا (DM Library)</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#2F2A23] text-[#EDE6D8]">
              {totalCount} مورد
            </span>
          </div>

          {/* Action shortcuts */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMultiSelectMode(!multiSelectMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 min-h-[36px] ${
                multiSelectMode 
                  ? 'bg-[#E0A030] text-[#0E0D0C] shadow-md' 
                  : 'bg-[#2F2A23] hover:bg-[#3A342B] text-[#EDE6D8]'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{multiSelectMode ? 'خروج از انتخاب' : 'انتخاب دسته‌ای'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPackExportImportOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#EDE6D8] text-xs font-bold transition flex items-center gap-1.5 min-h-[36px]"
              title="صدور یا درون‌ریزی بسته"
            >
              <Upload className="w-4 h-4" />
              <span>بسته‌ها</span>
            </button>

            <button
              type="button"
              onClick={() => setSaveTemplateModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#E0A030]/15 border border-[#E0A030]/30 text-[#F2C265] hover:bg-[#E0A030]/25 text-xs font-bold transition flex items-center gap-1.5 min-h-[36px]"
            >
              <Bookmark className="w-4 h-4" />
              <span>ذخیره به عنوان قالب</span>
            </button>

            <button
              type="button"
              onClick={() => setClassEditor({ isOpen: true, item: null })}
              className="px-3 py-1.5 rounded-xl bg-[#7FB4D6]/20 border border-[#7FB4D6]/40 text-[#7FB4D6] hover:bg-[#7FB4D6]/30 text-xs font-bold transition flex items-center gap-1 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>کلاس جدید</span>
            </button>

            <button
              type="button"
              onClick={() => setLineageEditor({ isOpen: true, item: null })}
              className="px-3 py-1.5 rounded-xl bg-[#D4A373]/20 border border-[#D4A373]/40 text-[#D4A373] hover:bg-[#D4A373]/30 text-xs font-bold transition flex items-center gap-1 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>نژاد جدید</span>
            </button>

            <button
              type="button"
              onClick={() => setBackgroundEditor({ isOpen: true, item: null })}
              className="px-3 py-1.5 rounded-xl bg-[#8B9D83]/20 border border-[#8B9D83]/40 text-[#8B9D83] hover:bg-[#8B9D83]/30 text-xs font-bold transition flex items-center gap-1 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>پیشینه جدید</span>
            </button>
          </div>
        </div>

        {/* Source Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#2F2A23]">
          <span className="text-xs text-[#A39A89] ml-1">منبع:</span>
          <button
            type="button"
            onClick={() => setSource('current_campaign')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              source === 'current_campaign'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold'
                : 'bg-[#2F2A23]/80 hover:bg-[#2F2A23] text-[#EDE6D8]'
            }`}
          >
            این کمپین
          </button>
          <button
            type="button"
            onClick={() => setSource('my_library')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              source === 'my_library'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold'
                : 'bg-[#2F2A23]/80 hover:bg-[#2F2A23] text-[#EDE6D8]'
            }`}
          >
            کتابخانه‌ی من
          </button>
          <button
            type="button"
            onClick={() => setSource('pack-zorvania')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              source === 'pack-zorvania'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold'
                : 'bg-[#2F2A23]/80 hover:bg-[#2F2A23] text-[#EDE6D8]'
            }`}
          >
            بسته زروانیا
          </button>
          <button
            type="button"
            onClick={() => setSource('pack-srd-5e')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              source === 'pack-srd-5e'
                ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold'
                : 'bg-[#2F2A23]/80 hover:bg-[#2F2A23] text-[#EDE6D8]'
            }`}
          >
            پایه ۵e (SRD)
          </button>

          {/* Dynamic User Packs */}
          {packs.filter(p => !p.isDefaultLibrary && p.id !== 'pack-zorvania' && p.id !== 'pack-srd-5e').map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSource(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                source === p.id
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-extrabold'
                  : 'bg-[#2F2A23]/80 hover:bg-[#2F2A23] text-[#EDE6D8]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="surface-card rounded-2xl p-3 border border-[#2F2A23] space-y-3">
        {/* Entity Type Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'همه' },
            { id: 'location', label: 'مکان' },
            { id: 'npc', label: 'NPC و هیولا' },
            { id: 'item', label: 'آیتم' },
            { id: 'encounter', label: 'مواجهه' },
            { id: 'class_template', label: 'کلاس' },
            { id: 'lineage_template', label: 'نژاد و تبار' },
            { id: 'background_template', label: 'پیشینه' },
            { id: 'faction', label: 'جناح' },
            { id: 'calendar', label: 'تقویم' },
            { id: 'rule_set', label: 'قوانین' },
            { id: 'campaign_doc', label: 'اسناد' }
          ].map(chip => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setTypeFilter(chip.id as EntityTypeFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[36px] ${
                typeFilter === chip.id
                  ? 'bg-[#E0A030] text-[#0E0D0C] font-black shadow-sm'
                  : 'bg-[#201D19] border border-[#2F2A23] text-[#EDE6D8] hover:border-[#3A342B]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Search, Region & Sort row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-[#A39A89] absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام، برچسب یا توصیف..."
              className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl pr-9 pl-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[40px]"
            />
          </div>

          {/* Region Filter */}
          <div>
            <select
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[40px]"
            >
              <option value="">همه اقلیم‌ها</option>
              <option value="ورنا">ورنا</option>
              <option value="کویر خاموش">کویر خاموش</option>
              <option value="سپیدارون">سپیدارون</option>
              <option value="مهستان">مهستان</option>
              <option value="شانشین">شانشین</option>
              <option value="مشترک">مشترک</option>
            </select>
          </div>

          {/* Sort dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[40px]"
            >
              <option value="newest">جدیدترین</option>
              <option value="name">بر اساس نام الفبایی</option>
              <option value="favorite">علاقه‌مندی‌ها در بالا</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Entities List / Grid */}
      {loading ? (
        <div className="p-8 text-center text-[#A39A89] text-xs">در حال بارگذاری محتوا...</div>
      ) : items.length === 0 ? (
        <div className="surface-card rounded-2xl p-8 text-center space-y-3 border border-[#2F2A23]">
          <div className="w-12 h-12 rounded-full bg-[#E0A030]/10 text-[#F2C265] flex items-center justify-center mx-auto">
            <Library className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#EDE6D8]">موردی یافت نشد</h3>
          <p className="text-xs text-[#A39A89] max-w-sm mx-auto">
            هیچ موجودیتی با فیلترهای مشخص‌شده در این منبع پیدا نشد. منبع یا عبارت جستجو را تغییر دهید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => {
            const isSelected = isRefSelected({ type: item.itemType, id: item.id });
            return (
              <div
                key={`${item.itemType}-${item.id}`}
                onClick={() => {
                  if (multiSelectMode) {
                    toggleSelectRef({ type: item.itemType, id: item.id });
                  } else {
                    setDetailItem(item);
                  }
                }}
                className={`relative rounded-2xl p-4 border transition-all cursor-pointer shadow-md flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#E0A030]/10 border-[#E0A030] ring-1 ring-[#E0A030]'
                    : 'bg-[#171513] border-[#2F2A23] hover:border-[#E0A030]/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {multiSelectMode && (
                        <div className="text-[#F2C265]">
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#A39A89]" />}
                        </div>
                      )}
                      <h4 className="text-sm font-bold text-[#EDE6D8] hover:text-[#F2C265] transition-colors line-clamp-1">
                        {item.name || item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {renderTypeBadge(item.itemType)}
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, item)}
                        className={`p-1 rounded-lg transition ${
                          item.isFavorite ? 'text-[#F2C265]' : 'text-[#8A8374] hover:text-[#A39A89]'
                        }`}
                        title="علاقه‌مندی"
                      >
                        <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-[#F2C265]' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#A39A89] mt-2 line-clamp-2 leading-relaxed">
                    {item.description || item.body || item.mechanicalEffect || 'بدون توضیحات تکمیلی.'}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#2F2A23]/60 flex items-center justify-between text-[11px] text-[#A39A89]">
                  <div className="flex items-center gap-2">
                    {item.region && (
                      <span className="px-2 py-0.5 rounded-md bg-[#2F2A23] text-[#EDE6D8]">
                        {item.region}
                      </span>
                    )}
                    {renderLinkBadge(item)}
                  </div>

                  <div className="flex items-center gap-1 text-[#F2C265] text-xs font-semibold">
                    <span>مشاهده جزئیات</span>
                    <ChevronLeftIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Action Bar in Multi-Select Mode */}
      {multiSelectMode && selectedRefs.length > 0 && (
        <div className="fixed bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-1/2 sm:translate-x-1/2 z-40 bg-[#1A1815] border border-[#E0A030]/50 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 max-w-xl">
          <div className="text-xs font-bold text-[#F2C265]">
            {selectedRefs.length} مورد انتخاب شده
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchCopyToCurrentCampaign}
              className="px-3 py-1.5 rounded-xl btn-primary-amber text-xs font-bold shadow-md flex items-center gap-1 min-h-[36px]"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>کپی به این کمپین</span>
            </button>

            <button
              type="button"
              onClick={handleBatchSaveToMyLibrary}
              className="px-3 py-1.5 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#EDE6D8] text-xs font-bold flex items-center gap-1 min-h-[36px]"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>ذخیره در کتابخانه‌ام</span>
            </button>
          </div>
        </div>
      )}

      {/* ENTITY DETAIL SHEET */}
      {detailItem && (
        <BottomSheet
          isOpen={Boolean(detailItem)}
          onClose={() => setDetailItem(null)}
          title={detailItem.name || detailItem.title || 'جزئیات موجودیت'}
        >
          <div className="space-y-4 py-2 text-right" dir="rtl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {renderTypeBadge(detailItem.itemType)}
                {detailItem.region && (
                  <span className="px-2 py-0.5 rounded-md bg-[#2F2A23] text-[#EDE6D8] text-xs">
                    اقلیم: {detailItem.region}
                  </span>
                )}
              </div>
              {renderLinkBadge(detailItem)}
            </div>

            <div className="p-3 rounded-xl bg-[#201D19]/60 border border-[#2F2A23] text-xs text-[#EDE6D8] leading-relaxed whitespace-pre-wrap">
              {detailItem.description || detailItem.body || detailItem.mechanicalEffect || 'توضیحاتی ثبت نشده است.'}
            </div>

            {/* DM Secret Notes if present */}
            {(detailItem.dmNotes || detailItem.secretNotes) && (
              <div className="p-3 rounded-xl bg-[#E0A030]/10 border border-[#E0A030]/30 text-xs text-[#F2C265]">
                <span className="font-bold block mb-1">یادداشت‌های محرمانه دانجن مستر:</span>
                <p className="text-[#EDE6D8]">{detailItem.dmNotes || detailItem.secretNotes}</p>
              </div>
            )}

            {/* Tags */}
            {detailItem.tags && detailItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-[#A39A89]">برچسب‌ها:</span>
                {detailItem.tags.map((t: string) => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-[#2F2A23] text-[#EDE6D8] text-[10px]">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Actions Footer */}
            <div className="pt-3 border-t border-[#2F2A23] flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const ref: EntityRef = { type: detailItem.itemType, id: detailItem.id };
                  setDetailItem(null);
                  openImportSheet([ref], { scopeType: 'campaign', scopeId: currentCampaignId });
                }}
                className="flex-1 py-2.5 px-3 rounded-xl btn-primary-amber font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Copy className="w-4 h-4" />
                <span>کپی به این کمپین</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.saveToLibrary({ entityRefs: [{ type: detailItem.itemType, id: detailItem.id }] });
                    showFeedback('در کتابخانه‌ی شما ذخیره شد.');
                    setDetailItem(null);
                    loadItems();
                  } catch (e: any) {
                    showFeedback(e.message || 'خطا در ذخیره');
                  }
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#EDE6D8] font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Bookmark className="w-4 h-4" />
                <span>ذخیره در کتابخانه‌ام</span>
              </button>

              {/* Edit Template buttons */}
              {detailItem.itemType === 'class_template' && (
                <button
                  type="button"
                  onClick={() => {
                    setClassEditor({ isOpen: true, item: detailItem });
                    setDetailItem(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#7FB4D6]/20 border border-[#7FB4D6]/40 text-[#7FB4D6] hover:bg-[#7FB4D6]/30 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Edit className="w-4 h-4" />
                  <span>ویرایش کلاس</span>
                </button>
              )}

              {detailItem.itemType === 'lineage_template' && (
                <button
                  type="button"
                  onClick={() => {
                    setLineageEditor({ isOpen: true, item: detailItem });
                    setDetailItem(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#D4A373]/20 border border-[#D4A373]/40 text-[#D4A373] hover:bg-[#D4A373]/30 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Edit className="w-4 h-4" />
                  <span>ویرایش نژاد</span>
                </button>
              )}

              {detailItem.itemType === 'background_template' && (
                <button
                  type="button"
                  onClick={() => {
                    setBackgroundEditor({ isOpen: true, item: detailItem });
                    setDetailItem(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#8B9D83]/20 border border-[#8B9D83]/40 text-[#8B9D83] hover:bg-[#8B9D83]/30 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Edit className="w-4 h-4" />
                  <span>ویرایش پیشینه</span>
                </button>
              )}

              {/* Detach Link button if linked copy */}
              {detailItem.sourceMode === 'linked' && detailItem.sourceId && (
                <button
                  type="button"
                  onClick={() => handleDetachLink(detailItem)}
                  className="py-2.5 px-3 rounded-xl bg-[#C2512B]/15 border border-[#C2512B]/30 text-[#E8836B] hover:bg-[#C2512B]/25 font-bold text-xs min-h-[44px]"
                >
                  قطع پیوند
                </button>
              )}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* 3-STEP IMPORT / CLONE BOTTOM SHEET */}
      {importSheet.isOpen && (
        <BottomSheet
          isOpen={importSheet.isOpen}
          onClose={() => setImportSheet(prev => ({ ...prev, isOpen: false }))}
          title={
            importSheet.step === 1 ? 'مرحله ۱: انتخاب و وابستگی‌ها' :
            importSheet.step === 2 ? 'مرحله ۲: گزینه‌های سفارشی‌سازی' :
            'مرحله ۳: پیش‌نمایش و تأیید نهایی'
          }
        >
          <div className="space-y-4 py-2 text-right" dir="rtl">
            {/* Step Indicators */}
            <div className="flex items-center justify-between text-xs font-bold text-[#A39A89] border-b border-[#2F2A23] pb-2">
              <span className={importSheet.step === 1 ? 'text-[#F2C265] font-black' : ''}>۱. انتخاب</span>
              <span className={importSheet.step === 2 ? 'text-[#F2C265] font-black' : ''}>۲. تنظیمات تبدیل</span>
              <span className={importSheet.step === 3 ? 'text-[#F2C265] font-black' : ''}>۳. پیش‌نمایش</span>
            </div>

            {/* STEP 1: Selection & Dependencies */}
            {importSheet.step === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-[#EDE6D8]">
                  تعداد {importSheet.selectedRefs.length} موجودیت برای انتقال به مقصد انتخاب شده است.
                </p>

                <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importSheet.includeDependencies}
                      onChange={e => setImportSheet(prev => ({ ...prev, includeDependencies: e.target.checked }))}
                      className="w-4 h-4 accent-[#E0A030] rounded"
                    />
                    <span className="text-xs font-bold text-[#EDE6D8]">
                      شامل تمام وابستگی‌ها (Dependency Resolution)
                    </span>
                  </label>
                  <p className="text-[11px] text-[#A39A89] pr-6">
                    به‌طور خودکار هیولاها و آیتم‌های مواجهه، یا قابلیت‌ها و سلاح‌های کلاس کپی و لینک‌دهی می‌شوند.
                  </p>

                  <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-[#2F2A23]">
                    <input
                      type="checkbox"
                      checked={importSheet.includeChildren}
                      onChange={e => setImportSheet(prev => ({ ...prev, includeChildren: e.target.checked }))}
                      className="w-4 h-4 accent-[#E0A030] rounded"
                    />
                    <span className="text-xs font-bold text-[#EDE6D8]">
                      شامل زیرمجموعه‌ها و فرزندان مکان‌ها (Children)
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleImportGoToStep2}
                  className="w-full py-3 rounded-xl btn-primary-amber font-extrabold text-xs shadow-md mt-4 min-h-[48px]"
                >
                  مرحله بعد: تنظیمات انتقال
                </button>
              </div>
            )}

            {/* STEP 2: Options (Visibility, Secrets, Conflicts, Link mode) */}
            {importSheet.step === 2 && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#EDE6D8]">وضعیت پدیداری (Visibility)</label>
                  <select
                    value={importSheet.options.visibility}
                    onChange={e => setImportSheet(prev => ({
                      ...prev,
                      options: { ...prev.options, visibility: e.target.value as any }
                    }))}
                    className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[40px]"
                  >
                    <option value="hidden">مخفی (فقط در دید دانجن مستر - پیش‌فرض)</option>
                    <option value="keep">حفظ وضعیت قبلی پدیداری</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#EDE6D8]">مدیریت تداخل نام (Name Conflicts)</label>
                  <select
                    value={importSheet.options.nameConflict}
                    onChange={e => setImportSheet(prev => ({
                      ...prev,
                      options: { ...prev.options, nameConflict: e.target.value as any }
                    }))}
                    className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[40px]"
                  >
                    <option value="rename">تغییر نام با پسوند (کپی) - پیش‌فرض</option>
                    <option value="skip">صرف‌نظر از کپی موجودیت تکراری (Skip)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#EDE6D8]">نوع کپی و اتصال (Link Mode - Part B)</label>
                  <select
                    value={importSheet.options.keepLink}
                    onChange={e => setImportSheet(prev => ({
                      ...prev,
                      options: { ...prev.options, keepLink: e.target.value as any }
                    }))}
                    className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[40px]"
                  >
                    <option value="copy">کپی کاملاً مستقل (Copy - پیش‌فرض)</option>
                    <option value="linked">کپی پیونددار با اعلام تغییرات منبع (Linked Copy)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importSheet.options.stripDmSecrets}
                      onChange={e => setImportSheet(prev => ({
                        ...prev,
                        options: { ...prev.options, stripDmSecrets: e.target.checked }
                      }))}
                      className="w-4 h-4 accent-[#E0A030] rounded"
                    />
                    <span className="text-xs font-bold text-[#EDE6D8]">حذف یادداشت‌های محرمانه مستر (Strip Secrets)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importSheet.options.resetState}
                      onChange={e => setImportSheet(prev => ({
                        ...prev,
                        options: { ...prev.options, resetState: e.target.checked }
                      }))}
                      className="w-4 h-4 accent-[#E0A030] rounded"
                    />
                    <span className="text-xs font-bold text-[#EDE6D8]">بازنشانی HP و تبدیل مواجهه‌ها به پیش‌نویس (Reset State)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setImportSheet(prev => ({ ...prev, step: 1 }))}
                    className="py-3 px-4 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#EDE6D8] font-bold text-xs min-h-[48px]"
                  >
                    بازگشت
                  </button>
                  <button
                    type="button"
                    onClick={handleImportGoToStep3}
                    className="flex-1 py-3 rounded-xl btn-primary-amber font-extrabold text-xs shadow-md min-h-[48px]"
                  >
                    محاسبه پیش‌نمایش (Preview Dry-Run)
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Manifest Preview & Confirmation */}
            {importSheet.step === 3 && (
              <div className="space-y-3">
                {importSheet.resultJob ? (
                  /* Result Screen */
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#6F9E78]/20 text-[#6F9E78] flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-[#6F9E78]">عملیات با موفقیت انجام شد</h3>
                    <p className="text-xs text-[#EDE6D8]">
                      مجموع {importSheet.resultJob.manifest.totalCount} موجودیت به مقصد منتقل گردید.
                    </p>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleUndoClone(importSheet.resultJob!.id)}
                        className="py-2.5 px-4 rounded-xl bg-[#C2512B]/15 border border-[#C2512B]/30 text-[#E8836B] text-xs font-bold hover:bg-[#C2512B]/25 min-h-[44px]"
                      >
                        لغو عملیات (Undo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportSheet(prev => ({ ...prev, isOpen: false }))}
                        className="py-2.5 px-6 rounded-xl btn-primary-amber text-xs font-bold min-h-[44px]"
                      >
                        بستن پنجره
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#EDE6D8]">
                        <span>کل موجودیت‌های تولیدی:</span>
                        <span className="text-[#F2C265] text-sm">{importSheet.manifest?.totalCount || 0} مورد</span>
                      </div>

                      {/* Counts breakdown */}
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-[#A39A89] pt-2 border-t border-[#2F2A23]">
                        {Object.entries(importSheet.manifest?.countsByType || {}).map(([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span>{type}:</span>
                            <span className="text-[#EDE6D8] font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Conflicts & Warnings */}
                    {importSheet.manifest?.warnings && importSheet.manifest.warnings.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#E0A030]/10 border border-[#E0A030]/30 text-xs text-[#F2C265] space-y-1">
                        <div className="flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-4 h-4 text-[#F2C265]" />
                          <span>هشدارها و تداخل‌ها:</span>
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-[#EDE6D8] space-y-0.5">
                          {importSheet.manifest.warnings.map((w, idx) => (
                            <li key={idx}>{w.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setImportSheet(prev => ({ ...prev, step: 2 }))}
                        className="py-3 px-4 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#EDE6D8] font-bold text-xs min-h-[48px]"
                      >
                        بازگشت
                      </button>
                      <button
                        type="button"
                        disabled={importSheet.isExecuting}
                        onClick={handleExecuteImport}
                        className="flex-1 py-3 rounded-xl btn-primary-amber font-extrabold text-xs shadow-md min-h-[48px]"
                      >
                        {importSheet.isExecuting ? 'در حال کلون...' : 'تأیید و اجرای کلون (Run)'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </BottomSheet>
      )}

      {/* PART B: LINKED FIELD DIFF MODAL */}
      {linkedDiffModal.isOpen && linkedDiffModal.diff && (
        <BottomSheet
          isOpen={linkedDiffModal.isOpen}
          onClose={() => setLinkedDiffModal({ isOpen: false, diff: null, chosenFields: {} })}
          title={`تطبیق تغییرات: ${linkedDiffModal.diff.sourceName}`}
        >
          <div className="space-y-4 py-2 text-right" dir="rtl">
            <p className="text-xs text-[#EDE6D8]">
              نسخه مبدأ این موجودیت تغییر یافته است. فیلدهای مورد نظر خود را انتخاب کنید و دکمه اعمال را بزنید:
            </p>

            <div className="space-y-2">
              {linkedDiffModal.diff.diffs.map(d => (
                <div key={d.field} className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
                  <div className="text-xs font-bold text-[#F2C265]">{d.labelFa}</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div 
                      onClick={() => setLinkedDiffModal(prev => ({
                        ...prev,
                        chosenFields: { ...prev.chosenFields, [d.field]: 'local' }
                      }))}
                      className={`p-2 rounded-lg border cursor-pointer ${
                        linkedDiffModal.chosenFields[d.field] === 'local'
                          ? 'border-[#E0A030] bg-[#E0A030]/10 text-[#F2C265]'
                          : 'border-[#2F2A23] bg-[#0E0D0C] text-[#A39A89]'
                      }`}
                    >
                      <span className="font-bold block mb-1">نسخه من (کمپین):</span>
                      <span className="line-clamp-2">{JSON.stringify(d.localValue)}</span>
                    </div>

                    <div 
                      onClick={() => setLinkedDiffModal(prev => ({
                        ...prev,
                        chosenFields: { ...prev.chosenFields, [d.field]: 'source' }
                      }))}
                      className={`p-2 rounded-lg border cursor-pointer ${
                        linkedDiffModal.chosenFields[d.field] === 'source'
                          ? 'border-[#6F9E78] bg-[#6F9E78]/10 text-[#6F9E78]'
                          : 'border-[#2F2A23] bg-[#0E0D0C] text-[#A39A89]'
                      }`}
                    >
                      <span className="font-bold block mb-1">نسخه مبدأ جدید:</span>
                      <span className="line-clamp-2">{JSON.stringify(d.sourceValue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLinkedDiffModal({ isOpen: false, diff: null, chosenFields: {} })}
                className="py-3 px-4 rounded-xl bg-[#2F2A23] text-[#EDE6D8] text-xs font-bold min-h-[48px]"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleApplyLinkedDiff}
                className="flex-1 py-3 rounded-xl btn-primary-amber text-xs font-extrabold shadow-md min-h-[48px]"
              >
                اعمال تغییرات برگزیده
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* PACK EXPORT / IMPORT MODAL */}
      {packExportImportOpen && (
        <BottomSheet
          isOpen={packExportImportOpen}
          onClose={() => setPackExportImportOpen(false)}
          title="مدیریت و صدور/ورود بسته‌های محتوا"
        >
          <div className="space-y-4 py-2 text-right" dir="rtl">
            {/* Export section */}
            <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
              <h4 className="text-xs font-bold text-[#EDE6D8] flex items-center gap-1.5">
                <Download className="w-4 h-4 text-[#F2C265]" />
                <span>صدور بسته به فایل JSON</span>
              </h4>
              <p className="text-[11px] text-[#A39A89]">
                بسته مورد نظر را برای اشتراک‌گذاری یا نسخه پشتیبان دانلود کنید:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {packs.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleExportPack(p.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#2F2A23] hover:bg-[#3A342B] text-[#F2C265] text-xs font-bold flex items-center gap-1 min-h-[36px]"
                  >
                    <span>{p.name}</span>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Import section */}
            <div className="p-3 rounded-xl bg-[#201D19] border border-[#2F2A23] space-y-2">
              <h4 className="text-xs font-bold text-[#EDE6D8] flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-[#F2C265]" />
                <span>درون‌ریزی فایل بسته (Import JSON)</span>
              </h4>
              <p className="text-[11px] text-[#A39A89]">
                محتوای فایل JSON با فرمت zorvania-pack/1 را در کادر زیر جای‌گذاری کنید:
              </p>
              <textarea
                value={importJsonText}
                onChange={e => setImportJsonText(e.target.value)}
                placeholder='{"format": "zorvania-pack/1", ...}'
                rows={4}
                className="w-full bg-[#0E0D0C] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] font-mono focus:outline-none focus:border-[#E0A030]"
              />

              {importError && (
                <div className="p-2 rounded-lg bg-[#C2512B]/15 border border-[#C2512B]/30 text-[#E8836B] text-[11px]">
                  {importError}
                </div>
              )}

              {importPreviewManifest && (
                <div className="p-3 rounded-xl bg-[#6F9E78]/10 border border-[#6F9E78]/30 text-[#6F9E78] text-xs space-y-1">
                  <div className="font-bold">پیش‌نمایش معتبر: {importPreviewManifest.totalCount} مورد یافت شد.</div>
                  <button
                    type="button"
                    onClick={handleRunImportPack}
                    className="w-full py-2.5 rounded-xl btn-primary-amber text-xs font-extrabold shadow-md mt-2 min-h-[44px]"
                  >
                    درون‌ریزی نهایی به کمپین
                  </button>
                </div>
              )}

              {!importPreviewManifest && (
                <button
                  type="button"
                  disabled={!importJsonText.trim()}
                  onClick={handlePreviewImportPack}
                  className="w-full py-2.5 rounded-xl bg-[#2F2A23] hover:bg-[#3A342B] text-[#EDE6D8] text-xs font-bold min-h-[44px]"
                >
                  بررسی و اعتبارسنجی فایل (Preview)
                </button>
              )}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* SAVE CAMPAIGN AS TEMPLATE MODAL */}
      {saveTemplateModalOpen && (
        <BottomSheet
          isOpen={saveTemplateModalOpen}
          onClose={() => setSaveTemplateModalOpen(false)}
          title="ذخیره کمپین به عنوان قالب"
        >
          <div className="space-y-4 py-2 text-right" dir="rtl">
            <p className="text-xs text-[#EDE6D8] leading-relaxed">
              با ایجاد قالب کمپین، ساختار دنیا، تنظیمات قوانین، تقویم و سند جلسه صفر به صورت یک بسته آماده برای ساخت کمپین‌های جدید بازتولید می‌شود.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">نام قالب *</label>
              <input
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="مثلاً: قالب کمپین ماجراجویی کویر خاموش"
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl px-3 py-2 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030] min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#EDE6D8] mb-1">توضیحات</label>
              <textarea
                value={templateDesc}
                onChange={e => setTemplateDesc(e.target.value)}
                placeholder="توضیحاتی برای استفاده‌کنندگان از این قالب..."
                rows={3}
                className="w-full bg-[#201D19] border border-[#2F2A23] rounded-xl p-2.5 text-xs text-[#EDE6D8] focus:outline-none focus:border-[#E0A030]"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-[#201D19] border border-[#2F2A23]">
              <input
                type="checkbox"
                checked={templateStripSecrets}
                onChange={e => setTemplateStripSecrets(e.target.checked)}
                className="w-4 h-4 accent-[#E0A030] rounded"
              />
              <span className="text-xs font-bold text-[#EDE6D8]">
                حذف اطلاعات محرمانه دانجن مستر از قالب (Strip Secrets)
              </span>
            </label>

            <button
              type="button"
              disabled={!templateName.trim()}
              onClick={handleSaveCampaignAsTemplate}
              className="w-full py-3 rounded-xl btn-primary-amber font-extrabold text-xs shadow-md min-h-[48px]"
            >
              ایجاد و ذخیره قالب
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Lineage Editor Sheet */}
      {lineageEditor.isOpen && (
        <LineageEditorSheet
          isOpen={lineageEditor.isOpen}
          onClose={() => setLineageEditor({ isOpen: false, item: null })}
          initialData={lineageEditor.item}
          scopeType="campaign"
          scopeId={currentCampaignId}
          onSave={async (data) => {
            if (lineageEditor.item) {
              await api.updateLineageTemplate(lineageEditor.item.id, data);
              showFeedback('نژاد با موفقیت به‌روزرسانی شد');
            } else {
              await api.createLineageTemplate({
                ...data,
                scopeType: 'campaign',
                scopeId: currentCampaignId
              } as any);
              showFeedback('نژاد جدید با موفقیت ایجاد شد');
            }
            loadItems();
          }}
        />
      )}

      {/* Background Editor Sheet */}
      {backgroundEditor.isOpen && (
        <BackgroundEditorSheet
          isOpen={backgroundEditor.isOpen}
          onClose={() => setBackgroundEditor({ isOpen: false, item: null })}
          initialData={backgroundEditor.item}
          scopeType="campaign"
          scopeId={currentCampaignId}
          onSave={async (data) => {
            if (backgroundEditor.item) {
              await api.updateBackgroundTemplate(backgroundEditor.item.id, data);
              showFeedback('پیشینه با موفقیت به‌روزرسانی شد');
            } else {
              await api.createBackgroundTemplate({
                ...data,
                scopeType: 'campaign',
                scopeId: currentCampaignId
              } as any);
              showFeedback('پیشینه جدید با موفقیت ایجاد شد');
            }
            loadItems();
          }}
        />
      )}

      {/* Class Editor Sheet */}
      {classEditor.isOpen && (
        <ClassEditorSheet
          isOpen={classEditor.isOpen}
          onClose={() => setClassEditor({ isOpen: false, item: null })}
          initialData={classEditor.item}
          scopeType="campaign"
          scopeId={currentCampaignId}
          onSave={async (data) => {
            if (classEditor.item) {
              await api.updateClassTemplate(classEditor.item.id, data);
              showFeedback('کلاس با موفقیت به‌روزرسانی شد');
            } else {
              await api.createClassTemplate({
                ...data,
                scopeType: 'campaign',
                scopeId: currentCampaignId
              } as any);
              showFeedback('کلاس جدید با موفقیت ایجاد شد');
            }
            loadItems();
          }}
        />
      )}
    </div>
  );
};

// Mini icon helper
const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
