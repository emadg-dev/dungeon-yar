/**
 * Multi-Campaign Clone Engine (Phase 2 Core Service)
 * Handles dependency resolution, ID remapping, transform pipelines,
 * name conflict handling, dry-run previews, atomic batch cloning, and undo.
 */

import {
  CloneEntityType,
  EntityRef,
  EntityScopeType,
  CloneOptions,
  CloneManifest,
  CloneManifestItem,
  CloneWarning,
  CloneJob,
  NPC,
  ItemLibraryEntry,
  LocationEntry,
  Encounter,
  ClassTemplate,
  LineageTemplate,
  BackgroundTemplate,
  FeatureTemplate,
  WeaponTemplate,
  RewardPackage,
  Faction,
  CampaignDoc,
  GenericCalendarData,
  RuleSet
} from '../types';

export interface CloneEntityBundle {
  classTemplates: ClassTemplate[];
  lineageTemplates: LineageTemplate[];
  backgroundTemplates: BackgroundTemplate[];
  featureTemplates: FeatureTemplate[];
  weaponTemplates: WeaponTemplate[];
  items: ItemLibraryEntry[];
  rewards: RewardPackage[];
  npcs: NPC[];
  locations: LocationEntry[];
  encounters: Encounter[];
  factions: Faction[];
  campaignDocs: CampaignDoc[];
  calendars: GenericCalendarData[];
  genericCalendars?: GenericCalendarData[];
  ruleSets: RuleSet[];
}

export interface CloneSourceParams {
  scopeType: EntityScopeType;
  scopeId: string;
  entityRefs?: EntityRef[];
}

export interface CloneTargetParams {
  scopeType: EntityScopeType;
  scopeId: string;
}

export interface CloneRequest {
  source: CloneSourceParams;
  target: CloneTargetParams;
  options?: CloneOptions;
  overrides?: Record<string, Record<string, any>>; // entityId -> partial override
}

/**
 * Creates unique ID with type prefix
 */
export function generateId(prefix: string = 'ent'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Dependency graph analyzer
 */
export class DependencyResolver {
  /**
   * Find dependencies for a single entity reference given an entity bundle
   */
  static getDependencies(
    ref: EntityRef,
    bundle: CloneEntityBundle,
    includeChildren: boolean = true
  ): EntityRef[] {
    const deps: EntityRef[] = [];

    switch (ref.type) {
      case 'encounter': {
        const enc = bundle.encounters.find(e => e.id === ref.id);
        if (enc && enc.participants) {
          for (const p of enc.participants) {
            if (p.npcTemplateId) {
              deps.push({ type: 'npc', id: p.npcTemplateId });
            }
          }
        }
        if (enc?.locationId) {
          deps.push({ type: 'location', id: enc.locationId });
        }
        break;
      }

      case 'npc': {
        const npc = bundle.npcs.find(n => n.id === ref.id);
        if (npc && npc.lootDrops) {
          // If lootDrops contains known item ids or names
          for (const it of bundle.items) {
            if (npc.lootDrops.includes(it.name) || npc.lootDrops.includes(it.id)) {
              deps.push({ type: 'item', id: it.id });
            }
          }
        }
        break;
      }

      case 'item': {
        const item = bundle.items.find(i => i.id === ref.id);
        if (item?.weaponData?.id) {
          deps.push({ type: 'weapon_template', id: item.weaponData.id });
        }
        break;
      }

      case 'class_template': {
        const cls = bundle.classTemplates.find(c => c.id === ref.id);
        if (cls) {
          if (cls.startingFeatures) {
            for (const feat of cls.startingFeatures) {
              deps.push({ type: 'feature_template', id: feat.id });
            }
          }
          if (cls.starterWeaponOptions) {
            for (const w of cls.starterWeaponOptions) {
              const wId = typeof w === 'string' ? w : (w as any).id || (w as any).name;
              if (wId) {
                deps.push({ type: 'weapon_template', id: wId });
              }
            }
          }
        }
        break;
      }

      case 'location': {
        const loc = bundle.locations.find(l => l.id === ref.id);
        if (loc) {
          if (includeChildren) {
            // Find child locations
            const children = bundle.locations.filter(l => l.parentId === loc.id);
            for (const child of children) {
              deps.push({ type: 'location', id: child.id });
            }
          }
          // Linked NPCs located in this location
          const linkedNpcs = bundle.npcs.filter(n => n.locationTag === loc.name || (n.tags && n.tags.includes(loc.id)));
          for (const n of linkedNpcs) {
            deps.push({ type: 'npc', id: n.id });
          }
        }
        break;
      }

      case 'faction': {
        // Factions are standalone or reference regions
        break;
      }

      default:
        break;
    }

    return deps;
  }

  /**
   * Resolve all direct and transitive dependencies
   */
  static resolveAll(
    initialRefs: EntityRef[],
    bundle: CloneEntityBundle,
    options: CloneOptions = {}
  ): { resolvedRefs: EntityRef[]; dependencyTree: Record<string, EntityRef[]> } {
    const includeDeps = options.includeDependencies !== 'none';
    const includeChildren = options.includeChildren !== false;

    const visited = new Set<string>();
    const resolved: EntityRef[] = [];
    const dependencyTree: Record<string, EntityRef[]> = {};

    const queue: EntityRef[] = [...initialRefs];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.type}:${current.id}`;
      if (visited.has(key)) continue;
      visited.add(key);
      resolved.push(current);

      if (includeDeps) {
        const children = this.getDependencies(current, bundle, includeChildren);
        dependencyTree[current.id] = children;
        for (const child of children) {
          const childKey = `${child.type}:${child.id}`;
          if (!visited.has(childKey)) {
            queue.push(child);
          }
        }
      } else {
        dependencyTree[current.id] = [];
      }
    }

    return { resolvedRefs: resolved, dependencyTree };
  }
}

/**
 * Transforms an entity according to clone options
 */
export function transformEntity(
  type: CloneEntityType,
  rawEntity: any,
  options: CloneOptions = {},
  overrides?: Record<string, any>
): any {
  const entity = JSON.parse(JSON.stringify(rawEntity));

  // Apply user-provided per-entity overrides first
  if (overrides) {
    Object.assign(entity, overrides);
  }

  // 1. Strip DM secrets
  if (options.stripDmSecrets) {
    delete entity.dmNotes;
    delete entity.dm_notes;
    delete entity.secretNotes;
    delete entity.secret_notes;
    delete entity.tacticsTips;
    if (entity.dmOnly) {
      delete entity.dmOnly;
    }
  }

  // 2. Visibility
  if (options.visibility === 'hidden') {
    if ('revealed' in entity) entity.revealed = false;
    if ('isRevealed' in entity) entity.isRevealed = false;
    if ('visibility' in entity && type === 'campaign_doc') entity.visibility = 'dm_only';
  } else if (options.visibility === 'keep') {
    // Preserve existing visibility
  }

  // 3. Reset state
  if (options.resetState) {
    if (type === 'encounter') {
      entity.status = 'draft';
      entity.round = 0;
      entity.currentParticipantId = null;
      if (entity.participants) {
        entity.participants = entity.participants.map((p: any) => ({
          ...p,
          hp: p.maxHp || p.hp,
          initiative: null,
          initiativeStatus: 'none',
          status: 'active',
          conditions: []
        }));
      }
      entity.events = [];
    } else if (type === 'npc' && entity.hp) {
      entity.hp.current = entity.hp.max;
    }
  }

  // 4. Name suffix
  if (options.nameSuffix && entity.name) {
    entity.name = `${entity.name} ${options.nameSuffix}`;
  }

  // 5. Tag additions
  if (options.tagAdd && options.tagAdd.length > 0) {
    const existingTags: string[] = Array.isArray(entity.tags) ? entity.tags : [];
    entity.tags = Array.from(new Set([...existingTags, ...options.tagAdd]));
  }

  // 6. Region override
  if (options.regionOverride && 'region' in entity) {
    entity.region = options.regionOverride;
  }

  return entity;
}

/**
 * Checks for name conflicts against existing target entities
 */
export function checkNameConflict(
  type: CloneEntityType,
  name: string,
  targetBundle: CloneEntityBundle
): { hasConflict: boolean; targetId?: string } {
  let existing: { id: string; name?: string; title?: string } | undefined;

  switch (type) {
    case 'class_template':
      existing = targetBundle.classTemplates.find(c => c.name === name);
      break;
    case 'lineage_template':
      existing = targetBundle.lineageTemplates?.find(l => l.name === name);
      break;
    case 'background_template':
      existing = targetBundle.backgroundTemplates?.find(b => b.name === name);
      break;
    case 'feature_template':
      existing = targetBundle.featureTemplates.find(f => f.name === name);
      break;
    case 'weapon_template':
      existing = targetBundle.weaponTemplates.find(w => w.name === name);
      break;
    case 'item':
      existing = targetBundle.items.find(i => i.name === name);
      break;
    case 'reward':
      existing = targetBundle.rewards.find(r => r.title === name);
      break;
    case 'npc':
      existing = targetBundle.npcs.find(n => n.name === name);
      break;
    case 'location':
      existing = targetBundle.locations.find(l => l.name === name);
      break;
    case 'encounter':
      existing = targetBundle.encounters.find(e => e.name === name);
      break;
    case 'faction':
      existing = targetBundle.factions.find(f => f.name === name);
      break;
    case 'campaign_doc':
      existing = targetBundle.campaignDocs.find(d => d.title === name);
      break;
    default:
      break;
  }

  return {
    hasConflict: Boolean(existing),
    targetId: existing?.id
  };
}

/**
 * Generates a preview manifest without performing any mutations
 */
export function previewClone(
  request: CloneRequest,
  sourceBundle: CloneEntityBundle,
  targetBundle: CloneEntityBundle
): CloneManifest {
  const options = request.options || {};
  const overrides = request.overrides || {};

  // 1. Gather all entity refs if not explicitly provided
  let initialRefs: EntityRef[] = request.source.entityRefs || [];
  if (initialRefs.length === 0) {
    // Bring all entities from source scope
    initialRefs = [
      ...sourceBundle.classTemplates.map(c => ({ type: 'class_template' as const, id: c.id })),
      ...(sourceBundle.lineageTemplates || []).map(l => ({ type: 'lineage_template' as const, id: l.id })),
      ...(sourceBundle.backgroundTemplates || []).map(b => ({ type: 'background_template' as const, id: b.id })),
      ...sourceBundle.featureTemplates.map(f => ({ type: 'feature_template' as const, id: f.id })),
      ...sourceBundle.weaponTemplates.map(w => ({ type: 'weapon_template' as const, id: w.id })),
      ...sourceBundle.items.map(i => ({ type: 'item' as const, id: i.id })),
      ...sourceBundle.rewards.map(r => ({ type: 'reward' as const, id: r.id })),
      ...sourceBundle.npcs.map(n => ({ type: 'npc' as const, id: n.id })),
      ...sourceBundle.locations.map(l => ({ type: 'location' as const, id: l.id })),
      ...sourceBundle.encounters.map(e => ({ type: 'encounter' as const, id: e.id })),
      ...sourceBundle.factions.map(f => ({ type: 'faction' as const, id: f.id })),
      ...sourceBundle.campaignDocs.map(d => ({ type: 'campaign_doc' as const, id: d.id })),
      ...sourceBundle.calendars.map(c => ({ type: 'calendar' as const, id: c.id || 'cal_default' })),
      ...sourceBundle.ruleSets.map(r => ({ type: 'rule_set' as const, id: r.id }))
    ];
  }

  // 2. Resolve dependencies
  const { resolvedRefs, dependencyTree } = DependencyResolver.resolveAll(initialRefs, sourceBundle, options);

  // Check limits
  if (resolvedRefs.length > 500) {
    throw new Error('تعداد موجودیت‌های انتخاب‌شده از سقف ۵۰۰ مورد بیشتر است.');
  }

  const items: CloneManifestItem[] = [];
  const countsByType: Record<string, number> = {};
  const conflicts: { type: CloneEntityType; originalId: string; name: string; targetId?: string }[] = [];
  const warnings: CloneWarning[] = [];

  for (const ref of resolvedRefs) {
    let name = '';
    const deps = dependencyTree[ref.id] || [];

    // Lookup entity name
    switch (ref.type) {
      case 'class_template':
        name = sourceBundle.classTemplates.find(c => c.id === ref.id)?.name || 'کلاس';
        break;
      case 'lineage_template':
        name = sourceBundle.lineageTemplates?.find(l => l.id === ref.id)?.name || 'نژاد';
        break;
      case 'background_template':
        name = sourceBundle.backgroundTemplates?.find(b => b.id === ref.id)?.name || 'پیشینه';
        break;
      case 'feature_template':
        name = sourceBundle.featureTemplates.find(f => f.id === ref.id)?.name || 'قابلیت';
        break;
      case 'weapon_template':
        name = sourceBundle.weaponTemplates.find(w => w.id === ref.id)?.name || 'سلاح';
        break;
      case 'item':
        name = sourceBundle.items.find(i => i.id === ref.id)?.name || 'آیتم';
        break;
      case 'reward':
        name = sourceBundle.rewards.find(r => r.id === ref.id)?.title || 'پاداش';
        break;
      case 'npc':
        name = sourceBundle.npcs.find(n => n.id === ref.id)?.name || 'NPC';
        break;
      case 'location':
        name = sourceBundle.locations.find(l => l.id === ref.id)?.name || 'مکان';
        break;
      case 'encounter':
        name = sourceBundle.encounters.find(e => e.id === ref.id)?.name || 'مواجهه';
        break;
      case 'faction':
        name = sourceBundle.factions.find(f => f.id === ref.id)?.name || 'جناح';
        break;
      case 'campaign_doc':
        name = sourceBundle.campaignDocs.find(d => d.id === ref.id)?.title || 'سند';
        break;
      case 'calendar':
        name = sourceBundle.calendars.find(c => c.id === ref.id)?.name || 'گاه‌شمار';
        break;
      case 'rule_set':
        name = 'قوانین و تنظیمات پایه ۵e';
        break;
    }

    // Check conflict
    const conflict = checkNameConflict(ref.type, name, targetBundle);
    let action: 'create' | 'skip' | 'rename' = 'create';

    if (conflict.hasConflict) {
      conflicts.push({ type: ref.type, originalId: ref.id, name, targetId: conflict.targetId });
      if (options.nameConflict === 'skip') {
        action = 'skip';
        warnings.push({
          code: 'NAME_CONFLICT_SKIPPED',
          entityId: ref.id,
          entityName: name,
          message: `موجودیت «${name}» در مقصد وجود دارد و صرف‌نظر شد.`
        });
      } else {
        action = 'rename';
        warnings.push({
          code: 'NAME_CONFLICT_RENAMED',
          entityId: ref.id,
          entityName: name,
          message: `نام «${name}» تکراری است و پسوند (کپی) به آن افزوده خواهد شد.`
        });
      }
    }

    items.push({
      type: ref.type,
      originalId: ref.id,
      name,
      hasConflict: conflict.hasConflict,
      action,
      dependencies: deps,
      overrides: overrides[ref.id]
    });

    countsByType[ref.type] = (countsByType[ref.type] || 0) + 1;
  }

  return {
    totalCount: items.length,
    countsByType,
    items,
    dependencyTree,
    conflicts,
    warnings
  };
}

/**
 * Executes cloning in-memory, returning the new entities and an ID map
 */
export function executeClone(
  request: CloneRequest,
  sourceBundle: CloneEntityBundle,
  targetBundle: CloneEntityBundle
): {
  createdEntities: CloneEntityBundle;
  idMap: Record<string, string>;
  warnings: CloneWarning[];
  manifest: CloneManifest;
} {
  const manifest = previewClone(request, sourceBundle, targetBundle);
  const options = request.options || {};
  const overrides = request.overrides || {};

  const idMap: Record<string, string> = {};
  const warnings: CloneWarning[] = [...manifest.warnings];

  // 1. Generate new IDs for all entities that will be created
  for (const item of manifest.items) {
    if (item.action === 'skip') continue;
    idMap[item.originalId] = generateId(item.type.substring(0, 3));
  }

  const created: CloneEntityBundle = {
    classTemplates: [],
    lineageTemplates: [],
    backgroundTemplates: [],
    featureTemplates: [],
    weaponTemplates: [],
    items: [],
    rewards: [],
    npcs: [],
    locations: [],
    encounters: [],
    factions: [],
    campaignDocs: [],
    calendars: [],
    ruleSets: []
  };

  const now = Date.now();
  const keepLink = options.keepLink === 'linked';

  // 2. Clone each type with remapped IDs
  for (const item of manifest.items) {
    if (item.action === 'skip') continue;
    const newId = idMap[item.originalId];
    const entityOverride = overrides[item.originalId];

    switch (item.type) {
      case 'weapon_template': {
        const orig = sourceBundle.weaponTemplates.find(w => w.id === item.originalId);
        if (!orig) break;
        const copy: WeaponTemplate = transformEntity('weapon_template', orig, options, entityOverride);
        copy.id = newId;
        copy.scopeType = request.target.scopeType;
        copy.scopeId = request.target.scopeId;
        copy.sourceId = keepLink ? orig.id : null;
        copy.sourceMode = keepLink ? 'linked' : 'copy';
        copy.copiedAt = keepLink ? now : null;
        if (item.action === 'rename') copy.name = `${copy.name} (کپی)`;
        created.weaponTemplates.push(copy);
        break;
      }

      case 'feature_template': {
        const orig = sourceBundle.featureTemplates.find(f => f.id === item.originalId);
        if (!orig) break;
        const copy: FeatureTemplate = transformEntity('feature_template', orig, options, entityOverride);
        copy.id = newId;
        copy.scopeType = request.target.scopeType;
        copy.scopeId = request.target.scopeId;
        copy.sourceId = keepLink ? orig.id : null;
        copy.sourceMode = keepLink ? 'linked' : 'copy';
        copy.copiedAt = keepLink ? now : null;
        if (item.action === 'rename') copy.name = `${copy.name} (کپی)`;
        created.featureTemplates.push(copy);
        break;
      }

      case 'item': {
        const orig = sourceBundle.items.find(i => i.id === item.originalId);
        if (!orig) break;
        const copy: ItemLibraryEntry = transformEntity('item', orig, options, entityOverride);
        copy.id = newId;
        copy.scopeType = request.target.scopeType;
        copy.scopeId = request.target.scopeId;
        copy.sourceId = keepLink ? orig.id : null;
        copy.sourceMode = keepLink ? 'linked' : 'copy';
        copy.copiedAt = keepLink ? now : null;
        if (item.action === 'rename') copy.name = `${copy.name} (کپی)`;
        // Remap weaponData template id if present
        if (copy.weaponData?.id && idMap[copy.weaponData.id]) {
          copy.weaponData.id = idMap[copy.weaponData.id];
        }
        created.items.push(copy);
        break;
      }

      case 'reward': {
        const orig = sourceBundle.rewards.find(r => r.id === item.originalId);
        if (!orig) break;
        const copy: RewardPackage = transformEntity('reward', orig, options, entityOverride);
        copy.id = newId;
        copy.scopeType = request.target.scopeType;
        copy.scopeId = request.target.scopeId;
        copy.sourceId = keepLink ? orig.id : null;
        copy.sourceMode = keepLink ? 'linked' : 'copy';
        copy.copiedAt = keepLink ? now : null;
        if (item.action === 'rename') copy.title = `${copy.title} (کپی)`;
        // Remap items inside package
        if (copy.items) {
          copy.items = copy.items.map(it => {
            if (idMap[it.id]) {
              return { ...it, id: idMap[it.id] };
            }
            return it;
          });
        }
        created.rewards.push(copy);
        break;
      }

      case 'class_template': {
        const orig = sourceBundle.classTemplates.find(c => c.id === item.originalId);
        if (!orig) break;
        const copy: ClassTemplate = transformEntity('class_template', orig, options, entityOverride);
        copy.id = newId;
        copy.scopeType = request.target.scopeType;
        copy.scopeId = request.target.scopeId;
        copy.sourceId = keepLink ? orig.id : null;
        copy.sourceMode = keepLink ? 'linked' : 'copy';
        copy.copiedAt = keepLink ? now : null;
        if (item.action === 'rename') copy.name = `${copy.name} (کپی)`;
        // Remap starting feature templates
        if (copy.startingFeatures) {
          copy.startingFeatures = copy.startingFeatures.map(f => {
            if (idMap[f.id]) {
              return { ...f, id: idMap[f.id] };
            }
            return f;
          });
        }
        // Remap starter weapon options
        if (copy.starterWeaponOptions) {
          copy.starterWeaponOptions = copy.starterWeaponOptions.map((w: any) => (typeof w === 'string' ? (idMap[w] || w) : w));
        }
        created.classTemplates.push(copy);
        break;
      }

      case 'lineage_template': {
        const orig = sourceBundle.lineageTemplates?.find(l => l.id === item.originalId);
        if (!orig) break;
        const copy: LineageTemplate = transformEntity('lineage_template', orig, options, entityOverride);
        copy.id = newId;
        copy.scopeType = request.target.scopeType;
        copy.scopeId = request.target.scopeId;
        copy.sourceId = keepLink ? orig.id : null;
        copy.sourceMode = keepLink ? 'linked' : 'copy';
        copy.copiedAt = keepLink ? now : null;
        if (item.action === 'rename') copy.name = `${copy.name} (کپی)`;
        created.lineageTemplates.push(copy);
        break;
      }

      case 'background_template': {
        const orig = sourceBundle.backgroundTemplates?.find(b => b.id === item.originalId);
        if (!orig) break;
        const copy: BackgroundTemplate = transformEntity('background_template', orig, options, entityOverride);
        copy.id = newId;
        copy.scopeType = request.target.scopeType;
        copy.scopeId = request.target.scopeId;
        copy.sourceId = keepLink ? orig.id : null;
        copy.sourceMode = keepLink ? 'linked' : 'copy';
        copy.copiedAt = keepLink ? now : null;
        if (item.action === 'rename') copy.name = `${copy.name} (کپی)`;
        created.backgroundTemplates.push(copy);
        break;
      }

      case 'npc': {
        const orig = sourceBundle.npcs.find(n => n.id === item.originalId);
        if (!orig) break;
        const copy: NPC = transformEntity('npc', orig, options, entityOverride);
        copy.id = newId;
        copy.scopeType = request.target.scopeType;
        copy.scopeId = request.target.scopeId;
        copy.sourceId = keepLink ? orig.id : null;
        copy.sourceMode = keepLink ? 'linked' : 'copy';
        copy.copiedAt = keepLink ? now : null;
        if (item.action === 'rename') copy.name = `${copy.name} (کپی)`;
        created.npcs.push(copy);
        break;
      }

      case 'location': {
        const orig = sourceBundle.locations.find(l => l.id === item.originalId);
        if (!orig) break;
        const copy: LocationEntry = transformEntity('location', orig, options, entityOverride);
        copy.id = newId;
        copy.scopeType = request.target.scopeType;
        copy.scopeId = request.target.scopeId;
        copy.sourceId = keepLink ? orig.id : null;
        copy.sourceMode = keepLink ? 'linked' : 'copy';
        copy.copiedAt = keepLink ? now : null;
        if (item.action === 'rename') copy.name = `${copy.name} (کپی)`;
        // Remap parentId
        if (copy.parentId) {
          if (idMap[copy.parentId]) {
            copy.parentId = idMap[copy.parentId];
          } else {
            // Parent not cloned; decouple to null with a warning
            copy.parentId = null;
            warnings.push({
              code: 'LOCATION_PARENT_NOT_FOUND',
              entityId: copy.id,
              entityName: copy.name,
              message: `والد مکان «${copy.name}» کپی نشد و به مکان سطح‌اول تبدیل گردید.`
            });
          }
        }
        created.locations.push(copy);
        break;
      }

      case 'encounter': {
        const orig = sourceBundle.encounters.find(e => e.id === item.originalId);
        if (!orig) break;
        const copy: Encounter = transformEntity('encounter', orig, options, entityOverride);
        copy.id = newId;
        copy.scopeType = request.target.scopeType;
        copy.scopeId = request.target.scopeId;
        copy.sourceId = keepLink ? orig.id : null;
        copy.sourceMode = keepLink ? 'linked' : 'copy';
        copy.copiedAt = keepLink ? now : null;
        if (item.action === 'rename') copy.name = `${copy.name} (کپی)`;
        // Remap locationId
        if (copy.locationId) {
          if (idMap[copy.locationId]) {
            copy.locationId = idMap[copy.locationId];
          } else {
            copy.locationId = null;
            warnings.push({
              code: 'ENCOUNTER_LOCATION_NOT_FOUND',
              entityId: copy.id,
              entityName: copy.name,
              message: `مکان مواجهه «${copy.name}» در مقصد یافت نشد و لینک آن حذف شد.`
            });
          }
        }
        // Remap participants NPC template IDs
        if (copy.participants) {
          copy.participants = copy.participants.map(p => {
            const remappedNpcId = p.npcTemplateId && idMap[p.npcTemplateId] ? idMap[p.npcTemplateId] : p.npcTemplateId;
            return {
              ...p,
              id: generateId('part'),
              encounterId: newId,
              npcTemplateId: remappedNpcId
            };
          });
        }
        created.encounters.push(copy);
        break;
      }

      case 'faction': {
        const orig = sourceBundle.factions.find(f => f.id === item.originalId);
        if (!orig) break;
        const copy: Faction = transformEntity('faction', orig, options, entityOverride);
        copy.id = newId;
        copy.scopeType = request.target.scopeType;
        copy.scopeId = request.target.scopeId;
        copy.sourceId = keepLink ? orig.id : null;
        copy.sourceMode = keepLink ? 'linked' : 'copy';
        copy.copiedAt = keepLink ? now : null;
        if (item.action === 'rename') copy.name = `${copy.name} (کپی)`;
        created.factions.push(copy);
        break;
      }

      case 'campaign_doc': {
        const orig = sourceBundle.campaignDocs.find(d => d.id === item.originalId);
        if (!orig) break;
        const copy: CampaignDoc = transformEntity('campaign_doc', orig, options, entityOverride);
        copy.id = newId;
        copy.campaignId = request.target.scopeId;
        if (item.action === 'rename') copy.title = `${copy.title} (کپی)`;
        created.campaignDocs.push(copy);
        break;
      }

      case 'calendar': {
        const orig = sourceBundle.calendars.find(c => c.id === item.originalId);
        if (!orig) break;
        const copy: GenericCalendarData = {
          ...orig,
          id: newId
        };
        created.calendars.push(copy);
        break;
      }

      case 'rule_set': {
        const orig = sourceBundle.ruleSets.find(r => r.id === item.originalId);
        if (!orig) break;
        const copy: RuleSet = {
          ...orig,
          id: newId,
          scopeType: request.target.scopeType,
          scopeId: request.target.scopeId
        };
        created.ruleSets.push(copy);
        break;
      }
    }
  }

  manifest.idMap = idMap;
  manifest.createdIds = {
    classTemplates: created.classTemplates.map(c => c.id),
    lineageTemplates: created.lineageTemplates.map(l => l.id),
    backgroundTemplates: created.backgroundTemplates.map(b => b.id),
    featureTemplates: created.featureTemplates.map(f => f.id),
    weaponTemplates: created.weaponTemplates.map(w => w.id),
    items: created.items.map(i => i.id),
    rewards: created.rewards.map(r => r.id),
    npcs: created.npcs.map(n => n.id),
    locations: created.locations.map(l => l.id),
    encounters: created.encounters.map(e => e.id),
    factions: created.factions.map(f => f.id),
    campaignDocs: created.campaignDocs.map(d => d.id),
    calendars: created.calendars.map(c => c.id || ''),
    ruleSets: created.ruleSets.map(r => r.id)
  };

  return {
    createdEntities: created,
    idMap,
    warnings,
    manifest
  };
}
