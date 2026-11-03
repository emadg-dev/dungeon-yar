import { Button } from '../ui/Button';
import React, { useState, startTransition } from 'react';
import { Character, Weapon, Feature, WeaponTemplate, Companion } from '../../types';
import { deriveSheet } from '../../../shared/rules/engine';
import { BottomSheet } from '../mobile/BottomSheet';
import { ConfirmSheet } from '../mobile/ConfirmSheet';
import { 
  Swords, Shield, Zap, Sparkles, Plus, Trash2, 
  ChevronDown, ChevronUp, Flame, Dices, Bot, Heart, Lock
} from 'lucide-react';
import { PipTracker } from '../common/PipTracker';
import { HPBar } from '../common/HPBar';
import { Chip } from '../common/Chip';
import { ScrollableRow } from '../ui/ScrollableRow';

interface CombatTabProps {
  character: Character;
  weaponTemplates: WeaponTemplate[];
  onUpdate: (updated: Character) => void;
  onOpenRestModal: (type: 'short' | 'long' | 'special') => void;
  onRollCheck: (sides: number, count: number, modifier: number, label: string) => void;
  sheetLocked?: boolean | number;
  activeGrants?: any[];
  isDm?: boolean;
  onOpenLockedField?: (fieldName: string) => void;
}

export const CombatTab: React.FC<CombatTabProps> = ({
  character,
  weaponTemplates,
  onUpdate,
  onOpenRestModal,
  onRollCheck,
  sheetLocked = true,
  activeGrants = [],
  isDm = false,
  onOpenLockedField
}) => {
  const [showAddWeapon, setShowAddWeapon] = useState(false);
  const [showAddFeature, setShowAddFeature] = useState(false);
  const [featureFilter, setFeatureFilter] = useState<'all' | 'short' | 'long' | 'session' | 'season'>('all');
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'weapon' | 'feature'; id: string; name: string } | null>(null);

  // New Weapon State
  const [customWeaponName, setCustomWeaponName] = useState('');
  const [customWeaponDamage, setCustomWeaponDamage] = useState('1d8');
  const [customWeaponType, setCustomWeaponType] = useState('برشی (Slashing)');
  const [customWeaponRange, setCustomWeaponRange] = useState('تن به تن');
  const [customWeaponProperties, setCustomWeaponProperties] = useState('چندمنظوره');
  const [customWeaponKind, setCustomWeaponKind] = useState<'special' | 'showy'>('special');
  const [customAbilityName, setCustomAbilityName] = useState('');
  const [customAbilityDesc, setCustomAbilityDesc] = useState('');
  const [customAbilityMaxUses, setCustomAbilityMaxUses] = useState(1);

  // New Feature State
  const [featureName, setFeatureName] = useState('');
  const [featureDesc, setFeatureDesc] = useState('');
  const [featureSource, setFeatureSource] = useState('کلاس');
  const [featureUsage, setFeatureUsage] = useState<'none' | 'short' | 'long'>('short');
  const [featureMaxUses, setFeatureMaxUses] = useState(1);

  const now = Date.now();
  const validGrants = (activeGrants || []).filter(g =>
    g && g.status === 'active' &&
    (!g.expires_at || g.expires_at > now) &&
    (!g.expiresAt || g.expiresAt > now) &&
    (g.uses_left == null || g.uses_left > 0)
  );

  const isCombatLocked = Boolean(sheetLocked) && !isDm && !validGrants.some(g =>
    g.preset === 'full' || g.preset === 'respec' ||
    (Array.isArray(g.fields) && (g.fields.includes('*') || g.fields.includes('features') || g.fields.includes('addItem')))
  );

  const derived = deriveSheet({ character });
  const profBonus = derived.proficiencyBonus;
  const strMod = derived.abilityModifiers.str;
  const dexMod = derived.abilityModifiers.dex;

  // Weapon ability pip toggle
  const toggleWeaponAbilityUse = (weaponId: string, index: number) => {
    const updated = character.weapons.map(w => {
      if (w.id === weaponId) {
        const maxUses = w.specialAbility?.usesPerRest || w.abilityMaxUses || 1;
        const current = w.abilityUsed || 0;
        const next = index < current ? index : index + 1;
        return { ...w, abilityUsed: Math.min(maxUses, Math.max(0, next)) };
      }
      return w;
    });
    onUpdate({ ...character, weapons: updated });
  };

  // Feature use pip toggle
  const toggleFeatureUse = (featureId: string, index: number) => {
    const updated = character.features.map(f => {
      if (f.id === featureId) {
        const maxUses = f.maxUses || 1;
        const current = f.usedCount || 0;
        const next = index < current ? index : index + 1;
        return { ...f, usedCount: Math.min(maxUses, Math.max(0, next)) };
      }
      return f;
    });
    onUpdate({ ...character, features: updated });
  };

  // Companion HP adjust
  const adjustCompanionHp = (compId: string, delta: number) => {
    if (!character.companions) return;
    const updated = character.companions.map(c => {
      if (c.id === compId) {
        const max = c.hp.max;
        const next = Math.max(0, Math.min(max, c.hp.current + delta));
        return { ...c, hp: { ...c.hp, current: next } };
      }
      return c;
    });
    onUpdate({ ...character, companions: updated });
  };

  const toggleExpandFeature = (id: string) => {
    setExpandedFeatures(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Roll weapon damage
  const rollWeaponDamage = (weapon: Weapon) => {
    const diceMatch = weapon.damageDice.match(/(\d+)d(\d+)/i);
    let count = 1;
    let sides = 8;
    if (diceMatch) {
      count = parseInt(diceMatch[1]);
      sides = parseInt(diceMatch[2]);
    }
    const bonusMatch = weapon.damageDice.match(/\+\s*(\d+)/);
    const bonus = bonusMatch ? parseInt(bonusMatch[1]) : strMod;
    onRollCheck(sides, count, bonus, `صدمه‌ی ${weapon.name}`);
  };

  const filteredFeatures = character.features.filter(f => {
    if (featureFilter === 'all') return true;
    if (featureFilter === 'short') return f.usageType === 'short';
    if (featureFilter === 'long') return f.usageType === 'long';
    if (featureFilter === 'session') return f.usageType === 'session';
    if (featureFilter === 'season') return f.usageType === 'season';
    return true;
  });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Weapons Section */}
      <div className="surface-card rounded-[14px] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-accent" />
            <div>
              <h3 className="text-xs font-bold text-text-primary">سلاح‌ها و حملات مبارزه</h3>
              <p className="text-xs text-text-muted">سلاح‌های ویژه زروانیا و ضربات تاکتیکی</p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              if (isCombatLocked) {
                onOpenLockedField?.('addItem');
              } else {
                setShowAddWeapon(true);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-xs font-bold transition touch-target min-w-[44px]"
          >
            {isCombatLocked ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isCombatLocked ? 'سلاح جدید (قفل DM)' : 'سلاح جدید'}</span>
          </Button>
        </div>

        {character.weapons.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-6">
            سلاحی ثبت نشده است. از دکمه «سلاح جدید» استفاده کنید.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {character.weapons.map((w) => {
              const isSpecial = w.kind === 'special' || w.isSpecial;
              const maxUses = w.specialAbility?.usesPerRest || w.abilityMaxUses || 0;
              const usedCount = w.abilityUsed || 0;
              const abilityTitle = w.specialAbility?.name || w.abilityName;
              const abilityDescription = w.specialAbility?.description || w.abilityDesc;
              const attackBonus = (w.properties?.includes('Finesse') || w.range?.includes('دوربرد'))
                ? dexMod + profBonus
                : strMod + profBonus;

              return (
                <div
                  key={w.id}
                  className="surface-card rounded-[14px] p-3.5 flex flex-col justify-between transition border border-border hover:border-border/80 content-visibility-card"
                >
                  <div>
                    {/* Header: Name + Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-text-primary">{w.name}</span>
                        {isSpecial ? (
                          <span className="text-xs px-2 py-0.5 rounded-[6px] font-bold bg-accent/15 text-accent border border-accent/40">
                            ویژه (Special)
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-[6px] font-bold bg-surface-2 text-text-muted border border-border">
                            پرزرق‌وبرق (Showy)
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => setDeleteConfirm({ isOpen: true, type: 'weapon', id: w.id, name: w.name })}
                        className="text-text-muted hover:text-danger p-2 touch-target min-w-[44px]"
                        title="حذف سلاح"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-bg p-2 rounded-[10px] border border-border mb-2.5">
                      <div>
                        <span className="text-text-muted block text-xs">تاس صدمه:</span>
                        <span className="font-extrabold text-accent font-mono dice-ltr">{w.damageDice}</span>
                        <span className="text-xs text-text-muted ms-1">({w.damageType})</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-xs">برد و خواص:</span>
                        <span className="text-text-primary text-xs truncate block">{w.range} • {w.properties}</span>
                      </div>
                    </div>

                    {/* Special Ability with PipTracker */}
                    {isSpecial && abilityTitle && (
                      <div className="p-2.5 rounded-[10px] bg-surface-2 border border-border mb-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-accent flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            {abilityTitle}
                          </span>
                        </div>
                        <p className="text-xs text-text-primary/80 leading-relaxed mb-2">
                          {abilityDescription}
                        </p>
                        {maxUses > 0 && (
                          <PipTracker
                            label="مصرف در هر استراحت"
                            current={usedCount}
                            max={maxUses}
                            resetType="short"
                            onToggle={(idx) => toggleWeaponAbilityUse(w.id, idx)}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Two Big Roll Buttons: Attack & Damage (>= 44px) */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <Button
                      type="button"
                      onClick={() => onRollCheck(20, 1, attackBonus, `حمله‌ی ${w.name}`)}
                      className="py-2.5 px-3 rounded-[12px] bg-surface-2 hover:bg-surface-2/80 active:bg-bg text-text-primary text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] border border-border"
                    >
                      <Dices className="w-4 h-4 text-accent" />
                      <span>حمله</span>
                      <span className="font-mono text-accent dice-ltr font-extrabold">(+{attackBonus})</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={() => rollWeaponDamage(w)}
                      className="py-2.5 px-3 rounded-[12px] btn-primary-amber text-xs font-bold transition flex items-center justify-center gap-1.5 touch-target min-w-[44px] shadow-md"
                    >
                      <Flame className="w-4 h-4" />
                      <span>صدمه</span>
                      <span className="font-mono dice-ltr font-extrabold">({w.damageDice})</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Companion Cards with their own HP (if present) */}
      {character.companions && character.companions.length > 0 && (
        <div className="surface-card rounded-[14px] p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <Bot className="w-5 h-5 text-success" />
            <h3 className="text-xs font-bold text-text-primary">همراهان و سازه‌های نبرد</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {character.companions.map(comp => (
              <div key={comp.id} className="surface-2-card rounded-[12px] p-3 border border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-extrabold text-xs text-text-primary">{comp.name}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-[6px] bg-success/15 text-success border border-success/30 font-bold">
                    AC {comp.ac}
                  </span>
                </div>

                <div className="my-2">
                  <HPBar
                    current={comp.hp.current}
                    max={comp.hp.max}
                    onAdjust={(delta) => adjustCompanionHp(comp.id, delta)}
                    compact
                  />
                </div>

                {comp.attack && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs">
                    <span className="text-text-muted text-xs truncate">{comp.attack.name}</span>
                    <Button
                      type="button"
                      onClick={() => onRollCheck(20, 1, 4, `حمله همراه ${comp.name}`)}
                      className="px-2 py-1 rounded-[8px] bg-surface text-accent border border-border font-mono text-xs font-bold dice-ltr touch-target min-w-[44px]"
                    >
                      {comp.attack.toHit} ({comp.attack.damage})
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features & Abilities Section (Collapsible cards with outside pips and filter chips) */}
      <div className="surface-card rounded-[14px] p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <div>
              <h3 className="text-xs font-bold text-text-primary">استعدادها و توانایی‌ها (Features)</h3>
              <p className="text-xs text-text-muted">ویژگی‌های کلاسی، نژادی و موهبت‌های زروانیا</p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              if (isCombatLocked) {
                onOpenLockedField?.('features');
              } else {
                setShowAddFeature(true);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-xs font-bold transition touch-target min-w-[44px] self-end sm:self-auto"
          >
            {isCombatLocked ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isCombatLocked ? 'توانایی نو (قفل DM)' : 'توانایی نو'}</span>
          </Button>
        </div>

        {/* Filter Chips: All / Short / Long / Session / Season */}
        <ScrollableRow
          activeKey={featureFilter}
          dir="rtl"
          wrapperClassName="mb-3"
          className="pb-2 gap-1.5"
        >
          {[
            { id: 'all', label: 'همه' },
            { id: 'short', label: 'استراحت کوتاه' },
            { id: 'long', label: 'استراحت بلند' },
            { id: 'session', label: 'جلسه' },
            { id: 'season', label: 'فصل' },
          ].map(chip => (
            <Button
              key={chip.id}
              data-key={chip.id}
              type="button"
              onClick={() => {
                startTransition(() => {
                  setFeatureFilter(chip.id as any);
                });
              }}
              className={`px-3.5 py-2 rounded-[10px] text-xs font-bold transition whitespace-nowrap shrink-0 snap-start touch-target min-w-[44px] ${
                featureFilter === chip.id
                  ? 'bg-accent text-on-accent font-black shadow-sm'
                  : 'bg-surface-2 text-text-muted hover:text-text-primary border border-border'
              }`}
            >
              <span className="whitespace-nowrap shrink-0">{chip.label}</span>
            </Button>
          ))}
        </ScrollableRow>

        {/* Feature Cards Grid (Collapsible, pips outside card) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFeatures.map((feat) => {
            const hasUses = feat.usageType !== 'none' && (feat.maxUses || 0) > 0;
            const isExpanded = !!expandedFeatures[feat.id];

            return (
              <div
                key={feat.id}
                className="surface-card rounded-[14px] p-3 border border-border transition flex flex-col justify-between"
              >
                <div>
                  {/* Collapsible header */}
                  <div
                    onClick={() => toggleExpandFeature(feat.id)}
                    className="flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none touch-target min-w-[44px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-text-primary">{feat.name}</span>
                      <span className="text-xs px-1.5 py-0.2 rounded-[6px] bg-surface-2 text-text-muted border border-border">
                        {feat.source}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ isOpen: true, type: 'feature', id: feat.id, name: feat.name });
                        }}
                        className="text-text-muted hover:text-danger p-1.5 touch-target min-w-[44px]"
                        title="حذف توانایی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      )}
                    </div>
                  </div>

                  {/* Collapsible Description Body */}
                  {isExpanded && (
                    <p className="text-xs text-text-primary/80 leading-relaxed mt-2 pt-2 border-t border-border">
                      {feat.description}
                    </p>
                  )}
                </div>

                {/* Pips Outside Card */}
                {hasUses && (
                  <div className="mt-3 pt-2 border-t border-border">
                    <PipTracker
                      label={`استفاده (${feat.usageType === 'short' ? 'کوتاه' : 'بلند'})`}
                      current={feat.usedCount || 0}
                      max={feat.maxUses || 1}
                      resetType={feat.usageType as any}
                      onToggle={(idx) => toggleFeatureUse(feat.id, idx)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Sheet */}
      {deleteConfirm && (
        <ConfirmSheet
          isOpen={deleteConfirm.isOpen}
          title={`حذف ${deleteConfirm.type === 'weapon' ? 'سلاح' : 'توانایی'}`}
          message={`آیا از حذف «${deleteConfirm.name}» مطمئن هستید؟`}
          confirmLabel="بله، حذف کن"
          cancelLabel="انصراف"
          isDestructive
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            if (deleteConfirm.type === 'weapon') {
              onUpdate({
                ...character,
                weapons: character.weapons.filter(w => w.id !== deleteConfirm.id)
              });
            } else {
              onUpdate({
                ...character,
                features: character.features.filter(f => f.id !== deleteConfirm.id)
              });
            }
            setDeleteConfirm(null);
          }}
        />
      )}
    </div>
  );
};
