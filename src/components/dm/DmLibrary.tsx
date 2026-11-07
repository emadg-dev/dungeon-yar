import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import React, { useState, useEffect, useMemo, useDeferredValue, startTransition } from 'react';
import { 
  Campaign, ContentPack, ContentPackKind, EntityScopeType, CloneEntityType, 
  EntityRef, CloneOptions, CloneManifest, CloneJob, LocationEntry, NPC, 
  ItemLibraryEntry, Encounter, ClassTemplate, LineageTemplate, BackgroundTemplate, 
  Faction, CampaignDoc, GenericCalendarData, RuleSet, LinkedEntityDiff, RewardPackage, User
} from '../../types';
import { api } from '../../services/api';
import { BottomSheet } from '../mobile/BottomSheet';
import { VirtualList } from '../common/VirtualList';
import { LineageEditorSheet } from './LineageEditorSheet';
import { BackgroundEditorSheet } from './BackgroundEditorSheet';
import { ClassEditorSheet } from './ClassEditorSheet';
import { ScrollableRow } from '../ui/ScrollableRow';
import { 
  Library, Search, Filter, Plus, CheckSquare, Square, Copy, Bookmark, 
  Trash2, ExternalLink, RefreshCw, Eye, EyeOff, Sparkles, FolderPlus, 
  Upload, Download, ArrowRight, ArrowLeft, Star, ChevronRight, ChevronDown, 
  Folder, MapPin, Swords, Shield, Scroll, Calendar, Check, AlertTriangle, 
  Layers, Settings, Sliders, Edit, X, Save, MoreHorizontal
} from 'lucide-react';

interface DmLibraryProps {
  currentCampaignId: string;
  currentUser: User | null;
  myCampaigns: Campaign[];
  onRollDice?: (sides: number, count: number, modifier: number, label: string) => void;
  onRefreshCampaignData?: () => void;
}

type EntityTypeFilter = 'all' | 'location' | 'npc' | 'item' | 'encounter' | 'class_template' | 'lineage_template' | 'background_template' | 'faction' | 'calendar' | 'rule_set' | 'campaign_doc';

// One label set shared by filter chips, card badges and the import summary
// (previously the same type was called "تقویم" in one place and "گاه‌شمار" in another).
const TYPE_LABEL: Record<string, string> = {
  location: 'مکان',
  npc: 'NPC و هیولا',
  item: 'آیتم',
  encounter: 'مواجهه',
  class_template: 'کلاس',
  lineage_template: 'نژاد و تبار',
  background_template: 'پیشینه',
  faction: 'جناح',
  calendar: 'تقویم',
  rule_set: 'قوانین',
  campaign_doc: 'سند'
};

const TYPE_CHIPS: { id: EntityTypeFilter; label: string }[] = [
  { id: 'all', label: 'همه' },
  ...(Object.keys(TYPE_LABEL).map(id => ({ id: id as EntityTypeFilter, label: TYPE_LABEL[id] })))
];

const EDIT_LABEL: Record<string, string> = {
  class_template: 'ویرایش کلاس',
  lineage_template: 'ویرایش نژاد',
  background_template: 'ویرایش پیشینه'
};

/** Full-width, thumb-sized action row used inside bottom sheets. */
const LibrarySheetAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
}> = ({ icon, label, hint, onClick }) => (
  <Button
    type="button"
    onClick={onClick}
    className="w-full min-h-[56px] px-3 py-2 rounded-xl border border-border bg-surface hover:bg-surface-2 flex items-center gap-3 text-start transition"
  >
    <span className="shrink-0 text-accent-hover">{icon}</span>
    <span className="min-w-0">
      <span className="block text-sm font-bold text-text-primary">{label}</span>
      {hint && <span className="block text-xs text-text-muted font-normal mt-0.5">{hint}</span>}
    </span>
  </Button>
);

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
  const deferredSearch = useDeferredValue(searchQuery);
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

  // Header sheets
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [toolsSheetOpen, setToolsSheetOpen] = useState(false);

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
        q: deferredSearch || undefined,
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
  }, [source, typeFilter, deferredSearch, tagFilter, regionFilter, sortBy]);

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

  // Type badge: neutral on purpose. Eleven colours carried no meaning the type filter doesn't already give;
  // colour is now reserved for state (selected, update available, danger).
  const renderTypeBadge = (type: string) => {
    const label = TYPE_LABEL[type];
    if (!label) return null;
    return (
      <span className="px-2 py-0.5 rounded-full text-xs bg-surface-2 text-text-muted border border-border whitespace-nowrap">
        {label}
      </span>
    );
  };

  // Link badge (linked copy / update available)
  const renderLinkBadge = (item: any) => {
    if (item.sourceMode === 'linked' && item.sourceId) {
      const isUpdated = item.copiedAt && item.updatedAt && item.updatedAt > item.copiedAt;
      return (
        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenLinkedDiff(item);
          }}
          className={`inline-flex items-center gap-1 px-2 h-7 rounded-full text-xs font-bold transition whitespace-nowrap ${
            isUpdated
              ? 'bg-accent text-on-accent hover:bg-accent-hover'
              : 'bg-surface-3 text-text-primary hover:brightness-110'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          {isUpdated ? 'به‌روزرسانی موجود است' : 'کپی پیونددار'}
        </Button>
      );
    }
    return null;
  };

  // ---- Derived UI state ----
  const isPackSource = source !== 'current_campaign' && source !== 'my_library';
  const packChoices = [
    { id: 'pack-zorvania', name: 'بسته زروانیا' },
    { id: 'pack-srd-5e', name: 'پایه 5e (SRD)' },
    ...packs
      .filter(p => !p.isDefaultLibrary && p.id !== 'pack-zorvania' && p.id !== 'pack-srd-5e')
      .map(p => ({ id: p.id, name: p.name }))
  ];
  const hasActiveFilters = typeFilter !== 'all' || Boolean(searchQuery) || Boolean(regionFilter) || Boolean(tagFilter);
  const clearFilters = () => {
    setTypeFilter('all');
    setSearchQuery('');
    setRegionFilter('');
    setTagFilter('');
  };
  const allVisibleSelected =
    items.length > 0 && items.every(i => isRefSelected({ type: i.itemType, id: i.id }));
  const toggleSelectAllVisible = () => {
    setSelectedRefs(allVisibleSelected ? [] : items.map(i => ({ type: i.itemType, id: i.id })));
  };

  const handleEditDetail = () => {
    if (!detailItem) return;
    const it = detailItem;
    setDetailItem(null);
    if (it.itemType === 'class_template') setClassEditor({ isOpen: true, item: it });
    else if (it.itemType === 'lineage_template') setLineageEditor({ isOpen: true, item: it });
    else if (it.itemType === 'background_template') setBackgroundEditor({ isOpen: true, item: it });
  };

  // One card, used by both the virtual list and the grid (it was duplicated before).
  // Fixed height so the virtual list's row height is always correct.
  const renderItemCard = (item: any) => {
    const ref = { type: item.itemType, id: item.id };
    const isSelected = isRefSelected(ref);
    const activate = () => {
      if (multiSelectMode) toggleSelectRef(ref);
      else setDetailItem(item);
    };

    return (
      <div
        role="button"
        tabIndex={0}
        aria-pressed={multiSelectMode ? isSelected : undefined}
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate();
          }
        }}
        className={`h-[144px] overflow-hidden rounded-2xl p-3.5 border transition-colors cursor-pointer flex flex-col gap-2 content-visibility-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          isSelected
            ? 'bg-accent/10 border-accent'
            : 'bg-surface border-border hover:border-accent/40'
        }`}
      >
        {/* Title + favourite */}
        <div className="flex items-start gap-2">
          {multiSelectMode && (
            isSelected
              ? <CheckSquare className="w-5 h-5 text-accent-hover shrink-0 mt-1" />
              : <Square className="w-5 h-5 text-text-muted shrink-0 mt-1" />
          )}
          <h4 className="flex-1 min-w-0 text-base font-bold text-text-primary line-clamp-1 leading-7">
            {item.name || item.title}
          </h4>
          <Button
            type="button"
            onClick={(e) => handleToggleFavorite(e, item)}
            aria-label={item.isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
            aria-pressed={Boolean(item.isFavorite)}
            className={`w-10 h-10 -my-1.5 -me-2 rounded-xl flex items-center justify-center shrink-0 transition ${
              item.isFavorite ? 'text-accent-hover' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Star className={`w-5 h-5 ${item.isFavorite ? 'fill-accent-hover' : ''}`} />
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm text-text-muted line-clamp-2 leading-snug">
          {item.description || item.body || item.mechanicalEffect || 'بدون توضیحات تکمیلی.'}
        </p>

        {/* Meta */}
        <div className="mt-auto flex items-center gap-2 overflow-hidden">
          {renderTypeBadge(item.itemType)}
          {item.region && <span className="text-xs text-text-muted truncate">{item.region}</span>}
          {renderLinkBadge(item)}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 text-start ${multiSelectMode ? 'pb-44' : 'pb-20'}`} dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-accent text-on-accent px-4 py-2.5 rounded-xl text-sm font-bold shadow-2xl flex items-center gap-2 max-w-[90vw]"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Page header: a title, one primary action, one overflow */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2 min-w-0">
          <Library className="w-5 h-5 text-accent-hover shrink-0" />
          <span className="truncate">کتابخانه محتوا</span>
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            onClick={() => setCreateSheetOpen(true)}
            className="h-11 px-4 rounded-xl btn-primary text-sm font-extrabold inline-flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>ساخت جدید</span>
          </Button>
          <Button
            type="button"
            onClick={() => setToolsSheetOpen(true)}
            aria-label="ابزارهای بیشتر"
            title="ابزارهای بیشتر"
            className="w-11 h-11 rounded-xl bg-surface-3 text-text-primary hover:brightness-110 flex items-center justify-center"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Find: where to look, what to look for */}
      <div className="surface-card rounded-2xl p-3 border border-border space-y-3">
        {/* Source */}
        <div role="tablist" aria-label="منبع محتوا" className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface-2 border border-border">
          {([
            { id: 'current_campaign', label: 'این کمپین', active: source === 'current_campaign' },
            { id: 'my_library', label: 'کتابخانه‌ی من', active: source === 'my_library' },
            { id: 'packs', label: 'بسته‌های محتوا', active: isPackSource }
          ]).map(seg => (
            <Button
              type="button"
              key={seg.id}
              role="tab"
              aria-selected={seg.active}
              onClick={() => {
                if (seg.id === 'packs') {
                  if (!isPackSource) setSource(packChoices[0].id);
                } else {
                  setSource(seg.id);
                }
              }}
              className={`h-10 rounded-lg text-sm font-bold transition ${
                seg.active ? 'bg-accent text-on-accent' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {seg.label}
            </Button>
          ))}
        </div>

        {isPackSource && (
          <Select noWrapper
            aria-label="انتخاب بسته"
            value={source}
            onChange={e => setSource(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
          >
            {packChoices.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input noWrapper
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس نام، برچسب یا توضیح..."
            className="w-full bg-surface-2 border border-border rounded-xl ps-9 pe-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
          />
        </div>

        {/* Type chips: the only horizontal scroller left on this screen */}
        <ScrollableRow activeKey={typeFilter} className="items-center gap-1.5">
          {TYPE_CHIPS.map(chip => (
            <Button
              key={chip.id}
              type="button"
              data-scroll-key={chip.id}
              aria-pressed={typeFilter === chip.id}
              onClick={() => {
                startTransition(() => {
                  setTypeFilter(chip.id);
                });
              }}
              className={`px-3.5 h-10 rounded-full text-sm font-bold whitespace-nowrap shrink-0 snap-start transition ${
                typeFilter === chip.id
                  ? 'bg-accent text-on-accent'
                  : 'bg-surface-2 border border-border text-text-primary hover:border-accent/40'
              }`}
            >
              {chip.label}
            </Button>
          ))}
        </ScrollableRow>

        {/* Region & sort side by side (they used to stack as two full-width rows on phones) */}
        <div className="grid grid-cols-2 gap-2">
          <Select noWrapper
            aria-label="اقلیم"
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
          >
            <option value="">همه اقلیم‌ها</option>
            <option value="ورنا">ورنا</option>
            <option value="کویر خاموش">کویر خاموش</option>
            <option value="سپیدارون">سپیدارون</option>
            <option value="مهستان">مهستان</option>
            <option value="شانشین">شانشین</option>
            <option value="مشترک">مشترک</option>
          </Select>

          <Select noWrapper
            aria-label="مرتب‌سازی"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
          >
            <option value="newest">جدیدترین</option>
            <option value="name">الفبایی</option>
            <option value="favorite">علاقه‌مندی‌ها اول</option>
          </Select>
        </div>
      </div>

      {/* Results bar: count on one side, selection tools on the other */}
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-sm text-text-muted flex items-center gap-3 min-w-0">
          <span><b className="text-text-primary tabular-nums">{totalCount}</b> مورد</span>
          {hasActiveFilters && (
            <Button type="button" onClick={clearFilters} className="h-9 text-sm font-bold text-accent-hover">
              پاک کردن فیلترها
            </Button>
          )}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          {multiSelectMode && items.length > 0 && (
            <Button type="button" onClick={toggleSelectAllVisible} className="h-10 px-2 text-sm font-bold text-accent-hover">
              {allVisibleSelected ? 'لغو انتخاب همه' : 'انتخاب همه'}
            </Button>
          )}
          <Button
            type="button"
            onClick={() => {
              setMultiSelectMode(!multiSelectMode);
              if (multiSelectMode) setSelectedRefs([]);
            }}
            aria-pressed={multiSelectMode}
            className={`h-10 px-3 rounded-xl text-sm font-bold transition inline-flex items-center gap-1.5 ${
              multiSelectMode
                ? 'bg-accent text-on-accent'
                : 'bg-surface-3 text-text-primary hover:brightness-110'
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>{multiSelectMode ? 'پایان انتخاب' : 'انتخاب'}</span>
          </Button>
        </div>
      </div>

      {/* Results */}
      {loading && items.length === 0 ? (
        <div role="status" className="p-8 text-center text-text-muted text-sm">در حال بارگذاری محتوا...</div>
      ) : items.length === 0 ? (
        <div className="surface-card rounded-2xl p-8 text-center space-y-3 border border-border">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent-hover flex items-center justify-center mx-auto">
            <Library className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-text-primary">موردی یافت نشد</h3>
          <p className="text-sm text-text-muted max-w-sm mx-auto">
            با فیلترهای فعلی در این منبع چیزی پیدا نشد.
          </p>
          {hasActiveFilters && (
            <Button
              type="button"
              onClick={clearFilters}
              className="h-11 px-4 rounded-xl bg-surface-3 text-text-primary text-sm font-bold hover:brightness-110"
            >
              پاک کردن فیلترها
            </Button>
          )}
        </div>
      ) : (
        <div aria-busy={loading} className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {items.length > 50 ? (
            <VirtualList
              items={items}
              itemHeight={156}
              height={600}
              keyExtractor={(item) => `${item.itemType}-${item.id}`}
              renderItem={(item) => <div className="pb-3">{renderItemCard(item)}</div>}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(item => (
                <div key={`${item.itemType}-${item.id}`}>{renderItemCard(item)}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selection action bar: visible for the whole selection mode, so the mode gives feedback */}
      {multiSelectMode && (
        <div className="fixed bottom-16 sm:bottom-6 inset-x-3 mx-auto max-w-xl z-40 bg-surface border border-accent/50 rounded-2xl p-3 shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-accent-hover">
              {selectedRefs.length > 0
                ? `${selectedRefs.length} مورد انتخاب شده`
                : 'کارت‌ها را برای انتخاب لمس کنید'}
            </span>
            {selectedRefs.length > 0 && (
              <Button type="button" onClick={() => setSelectedRefs([])} className="h-9 px-2 text-sm text-text-muted hover:text-text-primary">
                پاک کردن
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              disabled={selectedRefs.length === 0}
              onClick={handleBatchCopyToCurrentCampaign}
              className="h-11 px-2 rounded-xl btn-primary text-sm font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Copy className="w-4 h-4 shrink-0" />
              <span>کپی به این کمپین</span>
            </Button>

            <Button
              type="button"
              disabled={selectedRefs.length === 0}
              onClick={handleBatchSaveToMyLibrary}
              className="h-11 px-2 rounded-xl bg-surface-3 text-text-primary hover:brightness-110 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Bookmark className="w-4 h-4 shrink-0" />
              <span>ذخیره در کتابخانه‌ام</span>
            </Button>
          </div>
        </div>
      )}

      {/* ENTITY DETAIL SHEET */}
      {detailItem && (
        <BottomSheet
          isOpen={Boolean(detailItem)}
          onClose={() => setDetailItem(null)}
          title={detailItem.name || detailItem.title || 'جزئیات'}
        >
          <div className="space-y-4 py-2 text-start" dir="rtl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {renderTypeBadge(detailItem.itemType)}
                {detailItem.region && (
                  <span className="text-xs text-text-muted">اقلیم: {detailItem.region}</span>
                )}
              </div>
              {renderLinkBadge(detailItem)}
            </div>

            <div className="p-3 rounded-xl bg-surface-2/60 border border-border text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {detailItem.description || detailItem.body || detailItem.mechanicalEffect || 'توضیحاتی ثبت نشده است.'}
            </div>

            {/* DM Secret Notes if present */}
            {(detailItem.dmNotes || detailItem.secretNotes) && (
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 text-sm">
                <span className="font-bold block mb-1 text-accent-hover">یادداشت‌های محرمانه مستر</span>
                <p className="text-text-primary">{detailItem.dmNotes || detailItem.secretNotes}</p>
              </div>
            )}

            {/* Tags */}
            {detailItem.tags && detailItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-text-muted">برچسب‌ها:</span>
                {detailItem.tags.map((t: string) => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-surface-3 text-text-primary text-xs">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Actions: one primary, a secondary pair, destructive kept apart */}
            <div className="pt-3 border-t border-border space-y-2">
              <Button
                type="button"
                onClick={() => {
                  const ref: EntityRef = { type: detailItem.itemType, id: detailItem.id };
                  setDetailItem(null);
                  openImportSheet([ref], { scopeType: 'campaign', scopeId: currentCampaignId });
                }}
                className="w-full h-12 px-3 rounded-xl btn-primary font-extrabold text-sm shadow-md flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>کپی به این کمپین</span>
              </Button>

              <div className={`grid gap-2 ${EDIT_LABEL[detailItem.itemType] ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <Button
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
                  className="h-11 px-2 rounded-xl bg-surface-3 text-text-primary hover:brightness-110 font-bold text-sm flex items-center justify-center gap-1.5"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>ذخیره در کتابخانه‌ام</span>
                </Button>

                {EDIT_LABEL[detailItem.itemType] && (
                  <Button
                    type="button"
                    onClick={handleEditDetail}
                    className="h-11 px-2 rounded-xl bg-surface-3 text-text-primary hover:brightness-110 font-bold text-sm flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{EDIT_LABEL[detailItem.itemType]}</span>
                  </Button>
                )}
              </div>

              {detailItem.sourceMode === 'linked' && detailItem.sourceId && (
                <Button
                  type="button"
                  onClick={() => handleDetachLink(detailItem)}
                  className="w-full h-11 rounded-xl text-danger hover:bg-danger/10 font-bold text-sm"
                >
                  قطع پیوند با منبع
                </Button>
              )}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* CREATE SHEET: replaces three differently-coloured buttons in the header */}
      {createSheetOpen && (
      <BottomSheet isOpen={createSheetOpen} onClose={() => setCreateSheetOpen(false)} title="ساخت جدید">
        <div className="space-y-2 pb-2" dir="rtl">
          <LibrarySheetAction
            icon={<Plus className="w-5 h-5" />}
            label="کلاس جدید"
            onClick={() => { setCreateSheetOpen(false); setClassEditor({ isOpen: true, item: null }); }}
          />
          <LibrarySheetAction
            icon={<Plus className="w-5 h-5" />}
            label="نژاد جدید"
            onClick={() => { setCreateSheetOpen(false); setLineageEditor({ isOpen: true, item: null }); }}
          />
          <LibrarySheetAction
            icon={<Plus className="w-5 h-5" />}
            label="پیشینه جدید"
            onClick={() => { setCreateSheetOpen(false); setBackgroundEditor({ isOpen: true, item: null }); }}
          />
        </div>
      </BottomSheet>
      )}

      {/* TOOLS SHEET */}
      {toolsSheetOpen && (
      <BottomSheet isOpen={toolsSheetOpen} onClose={() => setToolsSheetOpen(false)} title="ابزارهای کتابخانه">
        <div className="space-y-2 pb-2" dir="rtl">
          <LibrarySheetAction
            icon={<Upload className="w-5 h-5" />}
            label="صدور و درون‌ریزی بسته‌ها"
            hint="خروجی یا ورودی فایل JSON بسته‌ی محتوا"
            onClick={() => { setToolsSheetOpen(false); setPackExportImportOpen(true); }}
          />
          <LibrarySheetAction
            icon={<Bookmark className="w-5 h-5" />}
            label="ذخیره کمپین به عنوان قالب"
            hint="ساختار دنیا، قوانین و تقویم به شکل قالب ذخیره می‌شود"
            onClick={() => { setToolsSheetOpen(false); setSaveTemplateModalOpen(true); }}
          />
        </div>
      </BottomSheet>
      )}

      {/* 3-STEP IMPORT / CLONE BOTTOM SHEET */}
      {importSheet.isOpen && (
        <BottomSheet
          isOpen={importSheet.isOpen}
          onClose={() => setImportSheet(prev => ({ ...prev, isOpen: false }))}
          title="انتقال محتوا"
        >
          <div className="space-y-4 py-2 text-start" dir="rtl">
            {/* Step indicator */}
            <div className="flex items-start gap-2" aria-label={`مرحله ${importSheet.step} از 3`}>
              {['انتخاب', 'تنظیمات', 'پیش‌نمایش'].map((label, i) => (
                <div key={label} className="flex-1 space-y-1.5">
                  <div className={`h-1 rounded-full ${importSheet.step >= i + 1 ? 'bg-accent' : 'bg-surface-3'}`} />
                  <span className={`block text-xs ${importSheet.step === i + 1 ? 'text-accent-hover font-bold' : 'text-text-muted'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: Selection & Dependencies */}
            {importSheet.step === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-text-primary">
                  تعداد {importSheet.selectedRefs.length} موجودیت برای انتقال به مقصد انتخاب شده است.
                </p>

                <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                    <Input noWrapper
                      type="checkbox"
                      checked={importSheet.includeDependencies}
                      onChange={e => setImportSheet(prev => ({ ...prev, includeDependencies: e.target.checked }))}
                      className="w-5 h-5 accent-accent rounded shrink-0"
                    />
                    <span className="text-xs font-bold text-text-primary">
                      شامل وابستگی‌ها
                    </span>
                  </label>
                  <p className="text-xs text-text-muted pe-6">
                    به‌طور خودکار هیولاها و آیتم‌های مواجهه، یا قابلیت‌ها و سلاح‌های کلاس کپی و لینک‌دهی می‌شوند.
                  </p>

                  <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-border">
                    <Input noWrapper
                      type="checkbox"
                      checked={importSheet.includeChildren}
                      onChange={e => setImportSheet(prev => ({ ...prev, includeChildren: e.target.checked }))}
                      className="w-5 h-5 accent-accent rounded shrink-0"
                    />
                    <span className="text-xs font-bold text-text-primary">
                      شامل زیرمجموعه‌های مکان‌ها
                    </span>
                  </label>
                </div>

                <Button
                  type="button"
                  onClick={handleImportGoToStep2}
                  className="w-full py-3 rounded-xl btn-primary font-extrabold text-xs shadow-md mt-4 min-h-[48px]"
                >
                  مرحله بعد: تنظیمات انتقال
                </Button>
              </div>
            )}

            {/* STEP 2: Options (Visibility, Secrets, Conflicts, Link mode) */}
            {importSheet.step === 2 && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text-primary">نمایش برای بازیکنان</label>
                  <Select noWrapper
                    value={importSheet.options.visibility}
                    onChange={e => setImportSheet(prev => ({
                      ...prev,
                      options: { ...prev.options, visibility: e.target.value as any }
                    }))}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
                  >
                    <option value="hidden">مخفی، فقط برای مستر (پیش‌فرض)</option>
                    <option value="keep">حفظ وضعیت قبلی</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text-primary">اگر نام تکراری بود</label>
                  <Select noWrapper
                    value={importSheet.options.nameConflict}
                    onChange={e => setImportSheet(prev => ({
                      ...prev,
                      options: { ...prev.options, nameConflict: e.target.value as any }
                    }))}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
                  >
                    <option value="rename">تغییر نام با پسوند «کپی» (پیش‌فرض)</option>
                    <option value="skip">کپی نشود</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text-primary">نوع کپی</label>
                  <Select noWrapper
                    value={importSheet.options.keepLink}
                    onChange={e => setImportSheet(prev => ({
                      ...prev,
                      options: { ...prev.options, keepLink: e.target.value as any }
                    }))}
                    className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
                  >
                    <option value="copy">کپی مستقل (پیش‌فرض)</option>
                    <option value="linked">کپی پیونددار (تغییرات منبع اعلام می‌شود)</option>
                  </Select>
                </div>

                <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                    <Input noWrapper
                      type="checkbox"
                      checked={importSheet.options.stripDmSecrets}
                      onChange={e => setImportSheet(prev => ({
                        ...prev,
                        options: { ...prev.options, stripDmSecrets: e.target.checked }
                      }))}
                      className="w-5 h-5 accent-accent rounded shrink-0"
                    />
                    <span className="text-xs font-bold text-text-primary">حذف یادداشت‌های محرمانه مستر</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                    <Input noWrapper
                      type="checkbox"
                      checked={importSheet.options.resetState}
                      onChange={e => setImportSheet(prev => ({
                        ...prev,
                        options: { ...prev.options, resetState: e.target.checked }
                      }))}
                      className="w-5 h-5 accent-accent rounded shrink-0"
                    />
                    <span className="text-xs font-bold text-text-primary">بازنشانی HP و تبدیل مواجهه‌ها به پیش‌نویس</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => setImportSheet(prev => ({ ...prev, step: 1 }))}
                    className="py-3 px-4 rounded-xl bg-surface-3 hover:brightness-110 text-text-primary font-bold text-xs min-h-[48px]"
                  >
                    بازگشت
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImportGoToStep3}
                    className="flex-1 py-3 rounded-xl btn-primary font-extrabold text-xs shadow-md min-h-[48px]"
                  >
                    مشاهده پیش‌نمایش
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Manifest Preview & Confirmation */}
            {importSheet.step === 3 && (
              <div className="space-y-3">
                {importSheet.resultJob ? (
                  /* Result Screen */
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-success">عملیات با موفقیت انجام شد</h3>
                    <p className="text-xs text-text-primary">
                      مجموع {importSheet.resultJob.manifest.totalCount} موجودیت به مقصد منتقل گردید.
                    </p>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button
                        type="button"
                        onClick={() => handleUndoClone(importSheet.resultJob!.id)}
                        className="py-2.5 px-4 rounded-xl bg-danger/15 border border-danger/30 text-danger text-xs font-bold hover:bg-danger/25 min-h-[44px]"
                      >
                        بازگردانی
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setImportSheet(prev => ({ ...prev, isOpen: false }))}
                        className="py-2.5 px-6 rounded-xl btn-primary text-xs font-bold min-h-[44px]"
                      >
                        بستن پنجره
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-text-primary">
                        <span>کل موجودیت‌های تولیدی:</span>
                        <span className="text-accent-hover text-sm">{importSheet.manifest?.totalCount || 0} مورد</span>
                      </div>

                      {/* Counts breakdown */}
                      <div className="grid grid-cols-2 gap-1 text-xs text-text-muted pt-2 border-t border-border">
                        {Object.entries(importSheet.manifest?.countsByType || {}).map(([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span>{TYPE_LABEL[type] ?? type}</span>
                            <span className="text-text-primary font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Conflicts & Warnings */}
                    {importSheet.manifest?.warnings && importSheet.manifest.warnings.length > 0 && (
                      <div className="p-3 rounded-xl bg-accent/10 border border-accent/30 text-xs text-accent-hover space-y-1">
                        <div className="flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-4 h-4 text-accent-hover" />
                          <span>هشدارها و تداخل‌ها:</span>
                        </div>
                        <ul className="list-disc list-inside text-xs text-text-primary space-y-0.5">
                          {importSheet.manifest.warnings.map((w, idx) => (
                            <li key={idx}>{w.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        type="button"
                        onClick={() => setImportSheet(prev => ({ ...prev, step: 2 }))}
                        className="py-3 px-4 rounded-xl bg-surface-3 hover:brightness-110 text-text-primary font-bold text-xs min-h-[48px]"
                      >
                        بازگشت
                      </Button>
                      <Button
                        type="button"
                        disabled={importSheet.isExecuting}
                        onClick={handleExecuteImport}
                        className="flex-1 py-3 rounded-xl btn-primary font-extrabold text-xs shadow-md min-h-[48px]"
                      >
                        {importSheet.isExecuting ? 'در حال کپی...' : 'تأیید و کپی'}
                      </Button>
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
          <div className="space-y-4 py-2 text-start" dir="rtl">
            <p className="text-xs text-text-primary">
              نسخه مبدأ این موجودیت تغییر یافته است. فیلدهای مورد نظر خود را انتخاب کنید و دکمه اعمال را بزنید:
            </p>

            <div className="space-y-2">
              {linkedDiffModal.diff.diffs.map(d => (
                <div key={d.field} className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
                  <div className="text-xs font-bold text-accent-hover">{d.labelFa}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div 
                      onClick={() => setLinkedDiffModal(prev => ({
                        ...prev,
                        chosenFields: { ...prev.chosenFields, [d.field]: 'local' }
                      }))}
                      className={`p-2 rounded-lg border cursor-pointer ${
                        linkedDiffModal.chosenFields[d.field] === 'local'
                          ? 'border-accent bg-accent/10 text-accent-hover'
                          : 'border-border bg-bg text-text-muted'
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
                          ? 'border-success bg-success/10 text-success'
                          : 'border-border bg-bg text-text-muted'
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
              <Button
                type="button"
                onClick={() => setLinkedDiffModal({ isOpen: false, diff: null, chosenFields: {} })}
                className="py-3 px-4 rounded-xl bg-surface-3 text-text-primary text-xs font-bold min-h-[48px]"
              >
                انصراف
              </Button>
              <Button
                type="button"
                onClick={handleApplyLinkedDiff}
                className="flex-1 py-3 rounded-xl btn-primary text-xs font-extrabold shadow-md min-h-[48px]"
              >
                اعمال تغییرات برگزیده
              </Button>
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
          <div className="space-y-4 py-2 text-start" dir="rtl">
            {/* Export section */}
            <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Download className="w-4 h-4 text-accent-hover" />
                <span>صدور بسته به فایل JSON</span>
              </h4>
              <p className="text-xs text-text-muted">
                بسته مورد نظر را برای اشتراک‌گذاری یا نسخه پشتیبان دانلود کنید:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {packs.map(p => (
                  <Button
                    key={p.id}
                    type="button"
                    onClick={() => handleExportPack(p.id)}
                    className="px-3 py-1.5 rounded-lg bg-surface-3 hover:brightness-110 text-accent-hover text-xs font-bold flex items-center gap-1 min-h-[44px]"
                  >
                    <span>{p.name}</span>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Import section */}
            <div className="p-3 rounded-xl bg-surface-2 border border-border space-y-2">
              <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-accent-hover" />
                <span>درون‌ریزی بسته</span>
              </h4>
              <p className="text-xs text-text-muted">
                محتوای فایل JSON با فرمت zorvania-pack/1 را در کادر زیر جای‌گذاری کنید:
              </p>
              <Textarea noWrapper
                value={importJsonText}
                onChange={e => setImportJsonText(e.target.value)}
                placeholder='{"format": "zorvania-pack/1", ...}'
                rows={4}
                className="w-full bg-bg border border-border rounded-xl p-2.5 text-xs text-text-primary font-mono focus:outline-none focus:border-accent"
              />

              {importError && (
                <div className="p-2 rounded-lg bg-danger/15 border border-danger/30 text-danger text-xs">
                  {importError}
                </div>
              )}

              {importPreviewManifest && (
                <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-success text-xs space-y-1">
                  <div className="font-bold">پیش‌نمایش معتبر: {importPreviewManifest.totalCount} مورد یافت شد.</div>
                  <Button
                    type="button"
                    onClick={handleRunImportPack}
                    className="w-full py-2.5 rounded-xl btn-primary text-xs font-extrabold shadow-md mt-2 min-h-[44px]"
                  >
                    درون‌ریزی نهایی به کمپین
                  </Button>
                </div>
              )}

              {!importPreviewManifest && (
                <Button
                  type="button"
                  disabled={!importJsonText.trim()}
                  onClick={handlePreviewImportPack}
                  className="w-full py-2.5 rounded-xl bg-surface-3 hover:brightness-110 text-text-primary text-xs font-bold min-h-[44px]"
                >
                  بررسی فایل
                </Button>
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
          <div className="space-y-4 py-2 text-start" dir="rtl">
            <p className="text-xs text-text-primary leading-relaxed">
              با ایجاد قالب کمپین، ساختار دنیا، تنظیمات قوانین، تقویم و سند جلسه صفر به صورت یک بسته آماده برای ساخت کمپین‌های جدید بازتولید می‌شود.
            </p>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">نام قالب *</label>
              <Input noWrapper
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="مثلاً: قالب کمپین ماجراجویی کویر خاموش"
                className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">توضیحات</label>
              <Textarea noWrapper
                value={templateDesc}
                onChange={e => setTemplateDesc(e.target.value)}
                placeholder="توضیحاتی برای استفاده‌کنندگان از این قالب..."
                rows={3}
                className="w-full bg-surface-2 border border-border rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-surface-2 border border-border">
              <Input noWrapper
                type="checkbox"
                checked={templateStripSecrets}
                onChange={e => setTemplateStripSecrets(e.target.checked)}
                className="w-5 h-5 accent-accent rounded shrink-0"
              />
              <span className="text-xs font-bold text-text-primary">
                حذف اطلاعات محرمانه مستر از قالب
              </span>
            </label>

            <Button
              type="button"
              disabled={!templateName.trim()}
              onClick={handleSaveCampaignAsTemplate}
              className="w-full py-3 rounded-xl btn-primary font-extrabold text-xs shadow-md min-h-[48px]"
            >
              ایجاد و ذخیره قالب
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* Lineage Editor Sheet */}
      {lineageEditor.isOpen && (
        <LineageEditorSheet
          isOpen={lineageEditor.isOpen}
          onClose={() => setLineageEditor({ isOpen: false, item: null })}
          lineage={lineageEditor.item}
          scopeType="campaign"
          scopeId={currentCampaignId}
          onSave={async (data) => {
            if (lineageEditor.item) {
              await api.updateLineageTemplate({ ...lineageEditor.item, ...data });
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
          background={backgroundEditor.item}
          scopeType="campaign"
          scopeId={currentCampaignId}
          onSave={async (data) => {
            if (backgroundEditor.item) {
              await api.updateBackgroundTemplate({ ...backgroundEditor.item, ...data });
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
              await api.updateClassTemplate({ ...classEditor.item, ...data } as any);
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
