var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../shared/rules/engine.ts
var FULL_CASTER_SLOTS = {
  // [1st..9th]
  1: [2],
  2: [3],
  3: [4, 2],
  4: [4, 3],
  5: [4, 3, 2],
  6: [4, 3, 3],
  7: [4, 3, 3, 1],
  8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1],
  12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1]
};
var HALF_CASTER_SLOTS = {
  // book columns "اسلات۱ / اسلات۲"
  1: [],
  2: [2],
  3: [3],
  4: [3],
  5: [4, 2],
  6: [4, 2],
  7: [4, 3],
  8: [4, 3],
  9: [4, 3],
  10: [4, 3],
  11: [4, 3],
  12: [4, 3],
  13: [4, 3],
  14: [4, 3],
  15: [4, 3],
  16: [4, 3],
  17: [4, 4],
  18: [4, 4],
  19: [4, 4],
  20: [4, 4]
};
var FIXED_HP_TABLE = {
  "\u0641\u0631\u0647\u062F\u0627\u0631": [12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 100, 108, 116, 124, 132, 140, 148, 156, 164],
  "\u0645\u0648\u0628\u062F \u0622\u0630\u0631\u06CC\u0646": [9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81, 87, 93, 99, 105, 111, 117, 123],
  "\u062F\u06CC\u0648\u0627\u0646\u0632\u0627\u062F": [11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91, 99, 107, 115, 123, 131, 139, 147, 155, 163],
  "\u067E\u06CC\u0645\u0627\u0646\u0628\u0627\u0646": [11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 95, 102, 109, 116, 123, 130, 137, 144],
  "\u0633\u0627\u06CC\u0647\u062E\u0648\u0627\u0646": [7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 87, 92, 97, 102],
  "\u0645\u0647\u0622\u0634\u0646\u0627": [9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81, 87, 93, 99, 105, 111, 117, 123]
};
var DIVINE_SMITE_DICE = {
  1: "0",
  2: "2d8",
  3: "2d8",
  4: "3d8",
  5: "3d8",
  6: "3d8",
  7: "4d8",
  8: "4d8",
  9: "4d8",
  10: "4d8",
  11: "5d8",
  12: "5d8",
  13: "5d8",
  14: "5d8",
  15: "6d8",
  16: "6d8",
  17: "6d8",
  18: "6d8",
  19: "6d8",
  20: "6d8"
};
var MARTIAL_ARTS_DIE_TABLE = {
  1: "1d4",
  2: "1d4",
  3: "1d4",
  4: "1d4",
  5: "1d6",
  6: "1d6",
  7: "1d6",
  8: "1d6",
  9: "1d6",
  10: "1d6",
  11: "1d8",
  12: "1d8",
  13: "1d8",
  14: "1d8",
  15: "1d8",
  16: "1d8",
  17: "1d10",
  18: "1d10",
  19: "1d10",
  20: "1d10"
};
var CLASS_BASE_CON_MOD = {
  "\u0641\u0631\u0647\u062F\u0627\u0631": 2,
  // CON 15 (+2) / 14 (+2)
  "\u0645\u0648\u0628\u062F \u0622\u0630\u0631\u06CC\u0646": 1,
  // CON 13 (+1)
  "\u062F\u06CC\u0648\u0627\u0646\u0632\u0627\u062F": 3,
  // CON 16 (+3)
  "\u067E\u06CC\u0645\u0627\u0646\u0628\u0627\u0646": 2,
  // CON 14 (+2)
  "\u0633\u0627\u06CC\u0647\u062E\u0648\u0627\u0646": 1,
  // CON 12 (+1)
  "\u0645\u0647\u0622\u0634\u0646\u0627": 1
  // CON 12 (+1)
};
var STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
var POINT_BUY_COST_TABLE = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9
};
function normalizeClassName(rawName) {
  if (!rawName) return "";
  let clean = rawName.split("(")[0].trim();
  clean = clean.replace(/[\u200C\s]/g, "");
  if (clean.includes("\u0641\u0631\u0647\u062F\u0627\u0631")) return "\u0641\u0631\u0647\u062F\u0627\u0631";
  if (clean.includes("\u0645\u0648\u0628\u062F") || clean.includes("\u0622\u0630\u0631\u06CC\u0646")) return "\u0645\u0648\u0628\u062F \u0622\u0630\u0631\u06CC\u0646";
  if (clean.includes("\u062F\u06CC\u0648\u0627\u0646\u0632\u0627\u062F")) return "\u062F\u06CC\u0648\u0627\u0646\u0632\u0627\u062F";
  if (clean.includes("\u067E\u06CC\u0645\u0627\u0646\u0628\u0627\u0646")) return "\u067E\u06CC\u0645\u0627\u0646\u0628\u0627\u0646";
  if (clean.includes("\u0633\u0627\u06CC\u0647\u062E\u0648\u0627\u0646")) return "\u0633\u0627\u06CC\u0647\u062E\u0648\u0627\u0646";
  if (clean.includes("\u0645\u0647\u0622\u0634\u0646\u0627")) return "\u0645\u0647\u0622\u0634\u0646\u0627";
  return clean;
}
__name(normalizeClassName, "normalizeClassName");
function abilityModifier(score) {
  const safeScore = Number.isFinite(score) ? score : 10;
  return Math.floor((safeScore - 10) / 2);
}
__name(abilityModifier, "abilityModifier");
function proficiencyBonus(level, ruleSet) {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  if (ruleSet?.proficiencyBonusTable && ruleSet.proficiencyBonusTable[safeLevel] !== void 0) {
    return ruleSet.proficiencyBonusTable[safeLevel];
  }
  return Math.ceil(1 + safeLevel / 4);
}
__name(proficiencyBonus, "proficiencyBonus");
function computeSaves(abilities, saveProficiencies = {}, profBonus = 2) {
  const keys = ["str", "dex", "con", "int", "wis", "cha"];
  const result = {};
  const isProf = /* @__PURE__ */ __name((key) => {
    if (Array.isArray(saveProficiencies)) {
      const lowerArr = saveProficiencies.map((k) => String(k).toLowerCase());
      return lowerArr.includes(key.toLowerCase());
    }
    return Boolean(saveProficiencies[key] || saveProficiencies[key.toUpperCase()]);
  }, "isProf");
  const abRecord = abilities;
  for (const k of keys) {
    const score = abRecord[k] ?? abRecord[k.toUpperCase()] ?? 10;
    const baseMod = abilityModifier(score);
    const proficient = isProf(k);
    result[k] = {
      modifier: baseMod + (proficient ? profBonus : 0),
      proficient
    };
  }
  return result;
}
__name(computeSaves, "computeSaves");
var STANDARD_5E_SKILLS = {
  athletics: { ability: "str", nameFa: "\u0648\u0631\u0632\u0634\u06A9\u0627\u0631\u06CC (Athletics)" },
  acrobatics: { ability: "dex", nameFa: "\u0622\u06A9\u0631\u0648\u0628\u0627\u062A\u06CC\u06A9 (Acrobatics)" },
  sleight_of_hand: { ability: "dex", nameFa: "\u062A\u0631\u062F\u0633\u062A\u06CC (Sleight of Hand)" },
  stealth: { ability: "dex", nameFa: "\u067E\u0646\u0647\u0627\u0646\u200C\u06A9\u0627\u0631\u06CC (Stealth)" },
  arcana: { ability: "int", nameFa: "\u0639\u0644\u0648\u0645 \u06A9\u0647\u0646 (Arcana)" },
  history: { ability: "int", nameFa: "\u062A\u0627\u0631\u06CC\u062E (History)" },
  investigation: { ability: "int", nameFa: "\u062C\u0633\u062A\u062C\u0648 \u0648 \u062A\u062D\u0642\u06CC\u0642 (Investigation)" },
  nature: { ability: "int", nameFa: "\u0637\u0628\u06CC\u0639\u062A (Nature)" },
  religion: { ability: "int", nameFa: "\u0627\u062F\u06CC\u0627\u0646 (Religion)" },
  animal_handling: { ability: "wis", nameFa: "\u0645\u0647\u0627\u0631 \u062D\u06CC\u0648\u0627\u0646\u0627\u062A (Animal Handling)" },
  insight: { ability: "wis", nameFa: "\u062F\u0631\u06A9 \u0646\u06CC\u062A (Insight)" },
  medicine: { ability: "wis", nameFa: "\u067E\u0632\u0634\u06A9\u06CC (Medicine)" },
  perception: { ability: "wis", nameFa: "\u0627\u062F\u0631\u0627\u06A9 \u0648 \u0647\u0648\u0634\u06CC\u0627\u0631\u06CC (Perception)" },
  survival: { ability: "wis", nameFa: "\u0628\u0642\u0627 \u0648 \u0631\u062F\u06CC\u0627\u0628\u06CC (Survival)" },
  deception: { ability: "cha", nameFa: "\u0641\u0631\u06CC\u0628\u200C\u06A9\u0627\u0631\u06CC (Deception)" },
  intimidation: { ability: "cha", nameFa: "\u0627\u0631\u0639\u0627\u0628 \u0648 \u062A\u0647\u062F\u06CC\u062F (Intimidation)" },
  performance: { ability: "cha", nameFa: "\u0646\u0645\u0627\u06CC\u0634 \u0648 \u0627\u062C\u0631\u0627 (Performance)" },
  persuasion: { ability: "cha", nameFa: "\u0645\u062A\u0642\u0627\u0639\u062F\u0633\u0627\u0632\u06CC (Persuasion)" }
};
function computeSkills(abilities, skillsOrProficiencies = [], profBonus = 2) {
  const result = {};
  const abRecord = abilities;
  if (Array.isArray(skillsOrProficiencies)) {
    for (const s of skillsOrProficiencies) {
      const key = (s.key || s.id || "").toLowerCase();
      if (!key) continue;
      const abilityKey = (s.ability || "str").toLowerCase();
      const score = abRecord[abilityKey] ?? abRecord[abilityKey.toUpperCase()] ?? 10;
      const baseMod = abilityModifier(score);
      const proficient = Boolean(s.proficient);
      const expertise = Boolean(s.expertise);
      const customBonus = s.bonus || 0;
      const profMultiplier = expertise ? 2 : proficient ? 1 : 0;
      const modifier = baseMod + profMultiplier * profBonus + customBonus;
      result[key] = {
        modifier,
        proficient,
        expertise,
        labelFa: s.nameFa
      };
    }
  } else if (skillsOrProficiencies && typeof skillsOrProficiencies === "object") {
    for (const [key, meta] of Object.entries(STANDARD_5E_SKILLS)) {
      const profVal = skillsOrProficiencies[key] ?? skillsOrProficiencies[key.toUpperCase()];
      const proficient = profVal === true || profVal === "proficient" || profVal === "expertise";
      const expertise = profVal === "expertise" || profVal === "expert";
      const score = abRecord[meta.ability] ?? abRecord[meta.ability.toUpperCase()] ?? 10;
      const baseMod = abilityModifier(score);
      const profMultiplier = expertise ? 2 : proficient ? 1 : 0;
      result[key] = {
        modifier: baseMod + profMultiplier * profBonus,
        proficient,
        expertise,
        labelFa: meta.nameFa
      };
    }
  }
  return result;
}
__name(computeSkills, "computeSkills");
function computeAC(paramsOrFormula, maybeAbilities, maybeEquipmentState) {
  let params;
  if (paramsOrFormula && typeof paramsOrFormula === "object" && "abilities" in paramsOrFormula && !("base" in paramsOrFormula)) {
    params = paramsOrFormula;
  } else {
    params = {
      acFormula: paramsOrFormula,
      abilities: maybeAbilities || {},
      hasShield: maybeEquipmentState?.hasShield,
      hasArmor: maybeEquipmentState?.hasArmor,
      armorType: maybeEquipmentState?.armorType,
      inventory: maybeEquipmentState?.inventory,
      manualOverride: maybeEquipmentState?.manualOverride,
      className: maybeEquipmentState?.className
    };
  }
  if (params.manualOverride !== void 0 && params.manualOverride !== null && params.manualOverride > 0) {
    return params.manualOverride;
  }
  const abilities = params.abilities || {};
  const dexMod = abilityModifier(abilities.dex ?? 10);
  const wisMod = abilityModifier(abilities.wis ?? 10);
  const conMod = abilityModifier(abilities.con ?? 10);
  const intMod = abilityModifier(abilities.int ?? 10);
  let equippedArmorBaseAc = null;
  let equippedArmorType = params.armorType || null;
  let hasShield = Boolean(params.hasShield);
  if (params.inventory && Array.isArray(params.inventory)) {
    for (const item of params.inventory) {
      if (!item.equipped) continue;
      const cat = (item.category || "").toLowerCase();
      const name = (item.name || "").toLowerCase();
      const type = (item.armorType || "").toLowerCase();
      if (type === "shield" || cat === "shield" || name.includes("\u0633\u067E\u0631") || name.includes("shield")) {
        hasShield = true;
      } else if (type === "heavy" || type === "medium" || type === "light" || cat === "armor" || name.includes("\u0632\u0631\u0647")) {
        equippedArmorType = type || (name.includes("\u0633\u0646\u06AF\u06CC\u0646") ? "heavy" : name.includes("\u0645\u062A\u0648\u0633\u0637") ? "medium" : "light");
        if (item.baseAc) {
          equippedArmorBaseAc = item.baseAc;
        }
      }
    }
  }
  const shieldBonus = hasShield ? 2 : 0;
  const normalizedClass = normalizeClassName(params.className || params.classTemplateId);
  if (params.acFormula && typeof params.acFormula === "object") {
    const form = params.acFormula;
    if (form.unarmored) {
      let total = form.base || 10;
      if (form.abilityMods && Array.isArray(form.abilityMods)) {
        for (const ab of form.abilityMods) {
          const k = String(ab).toLowerCase();
          const score = abilities[k] ?? 10;
          total += abilityModifier(score);
        }
      }
      return total;
    } else {
      let total = form.base || 10;
      if (equippedArmorType === "heavy") {
        total = equippedArmorBaseAc || 16;
      } else if (equippedArmorType === "medium") {
        const base = equippedArmorBaseAc || form.base || 14;
        total = base + Math.min(2, Math.max(0, dexMod));
      } else {
        const base = equippedArmorBaseAc || form.base || 10;
        total = base + dexMod;
      }
      return total + shieldBonus;
    }
  }
  const formulaStr = typeof params.acFormula === "string" ? params.acFormula : "";
  if (normalizedClass === "\u0641\u0631\u0647\u062F\u0627\u0631" || formulaStr.includes("18\u060C \u0645\u0633\u062A\u0642\u0644 \u0627\u0632 DEX") || formulaStr.includes("16 (\u0632\u0631\u0647 \u0633\u0646\u06AF\u06CC\u0646) + 2 (\u0633\u067E\u0631)") || equippedArmorType === "heavy" && (hasShield || params.hasShield)) {
    return 18;
  }
  if (normalizedClass === "\u0645\u0648\u0628\u062F \u0622\u0630\u0631\u06CC\u0646" || formulaStr.includes("10 + DEX mod + WIS mod") || formulaStr.includes("Unarmored Defense") && formulaStr.includes("WIS")) {
    return 10 + dexMod + wisMod;
  }
  if (normalizedClass === "\u0645\u0647\u0622\u0634\u0646\u0627") {
    return 10 + dexMod + wisMod;
  }
  if (normalizedClass === "\u062F\u06CC\u0648\u0627\u0646\u0632\u0627\u062F") {
    if (formulaStr.includes("CON mod")) {
      return 12 + conMod + shieldBonus;
    }
    return 10 + dexMod + shieldBonus;
  }
  if (equippedArmorType === "heavy") {
    return (equippedArmorBaseAc || 16) + shieldBonus;
  }
  if (equippedArmorType === "medium") {
    return (equippedArmorBaseAc || 14) + Math.min(2, Math.max(0, dexMod)) + shieldBonus;
  }
  if (equippedArmorType === "light") {
    return (equippedArmorBaseAc || 11) + dexMod + shieldBonus;
  }
  return 10 + dexMod + shieldBonus;
}
__name(computeAC, "computeAC");
function computeMaxHp(params) {
  const level = Math.max(1, Math.min(20, Math.floor(params.level || 1)));
  const normalizedClass = normalizeClassName(params.className || params.classTemplate?.name || params.classTemplate?.id);
  const conMod = params.conModifier !== void 0 ? params.conModifier : abilityModifier(params.abilities?.con ?? 10);
  const mode = params.hpMode || "fixed_table";
  if (mode === "fixed_table") {
    let baseHp = 10;
    const table = FIXED_HP_TABLE[normalizedClass];
    if (table && table.length >= level) {
      baseHp = table[level - 1];
    } else if (params.classTemplate?.fixedHpByLevel) {
      const fixedMap = params.classTemplate.fixedHpByLevel;
      if (Array.isArray(fixedMap) && fixedMap.length >= level) {
        baseHp = fixedMap[level - 1];
      } else if (typeof fixedMap === "object" && fixedMap[level] !== void 0) {
        baseHp = fixedMap[level];
      }
    } else {
      const hitDie2 = params.hitDie || params.classTemplate?.hitDie || 8;
      const perLevel = Math.floor(hitDie2 / 2) + 1;
      baseHp = hitDie2 + (level - 1) * perLevel;
    }
    if (params.settings?.conAdjustFixedTable) {
      let classBaseConMod = CLASS_BASE_CON_MOD[normalizedClass];
      if (classBaseConMod === void 0 && params.classTemplate?.baseAbilityScores?.con !== void 0) {
        classBaseConMod = abilityModifier(params.classTemplate.baseAbilityScores.con);
      }
      if (classBaseConMod === void 0) {
        classBaseConMod = 2;
      }
      baseHp += (conMod - classBaseConMod) * level;
    }
    return Math.max(1, baseHp);
  }
  const rawHitDie = params.hitDie || params.classTemplate?.hitDie || 8;
  const hitDie = typeof rawHitDie === "string" ? parseInt(rawHitDie.replace(/\D/g, ""), 10) || 8 : Number(rawHitDie) || 8;
  const avgIncrease = Math.floor(hitDie / 2) + 1;
  if (mode === "average") {
    const hpAtLvl1 = hitDie + conMod;
    const hpLater = (level - 1) * (avgIncrease + conMod);
    return Math.max(1, hpAtLvl1 + hpLater);
  }
  if (mode === "roll") {
    const hpAtLvl1 = hitDie + conMod;
    let rollSum = 0;
    if (params.rolls && Array.isArray(params.rolls)) {
      for (let i = 0; i < level - 1; i++) {
        rollSum += (params.rolls[i] || avgIncrease) + conMod;
      }
    } else {
      rollSum = (level - 1) * (avgIncrease + conMod);
    }
    return Math.max(1, hpAtLvl1 + rollSum);
  }
  return Math.max(1, 10);
}
__name(computeMaxHp, "computeMaxHp");
function computeSpellDcAndAttack(abilityKeyOrMod, abilityScoreOrPb = 2, profBonusOrBonus = 0, bonusArg = 0) {
  let mod;
  let pb;
  let bonus;
  if (typeof abilityKeyOrMod === "number") {
    mod = abilityKeyOrMod;
    pb = abilityScoreOrPb;
    bonus = profBonusOrBonus;
  } else {
    const rawVal = abilityScoreOrPb;
    mod = rawVal > 5 || rawVal < -5 ? abilityModifier(rawVal) : rawVal;
    pb = profBonusOrBonus;
    bonus = bonusArg;
  }
  return {
    dc: 8 + pb + mod + bonus,
    attackBonus: pb + mod + bonus
  };
}
__name(computeSpellDcAndAttack, "computeSpellDcAndAttack");
function computeSlots(casterTypeOrClass, level) {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  const normalized = normalizeClassName(casterTypeOrClass).toLowerCase();
  if (normalized === "\u0645\u0648\u0628\u062F \u0622\u0630\u0631\u06CC\u0646" || normalized === "\u0633\u0627\u06CC\u0647\u062E\u0648\u0627\u0646" || normalized.includes("full") || normalized === "hamoun" || normalized === "shideh") {
    return [...FULL_CASTER_SLOTS[safeLevel] || []];
  }
  if (normalized === "\u0641\u0631\u0647\u062F\u0627\u0631" || normalized === "\u067E\u06CC\u0645\u0627\u0646\u0628\u0627\u0646" || normalized === "\u062F\u06CC\u0648\u0627\u0646\u0632\u0627\u062F" || normalized.includes("half") || normalized === "pardis" || normalized === "mana" || normalized === "saman") {
    return [...HALF_CASTER_SLOTS[safeLevel] || []];
  }
  return [];
}
__name(computeSlots, "computeSlots");
function divineSmiteDice(level) {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  return DIVINE_SMITE_DICE[safeLevel] || "2d8";
}
__name(divineSmiteDice, "divineSmiteDice");
function martialArtsDie(level) {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  return MARTIAL_ARTS_DIE_TABLE[safeLevel] || "1d4";
}
__name(martialArtsDie, "martialArtsDie");
function computeClassResources(classTemplateOrName, level, abilities = {}) {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  const normalized = normalizeClassName(
    typeof classTemplateOrName === "string" ? classTemplateOrName : classTemplateOrName?.name
  );
  const abRecord = abilities;
  const intMod = abilityModifier(abRecord.int ?? 10);
  const conMod = abilityModifier(abRecord.con ?? 10);
  const result = {};
  if (normalized === "\u0641\u0631\u0647\u062F\u0627\u0631") {
    result["divine_smite"] = {
      name: "\u0636\u0631\u0628\u062A \u0627\u06CC\u0632\u062F\u06CC (Divine Smite)",
      max: safeLevel >= 2 ? 1 : 0,
      currentDice: divineSmiteDice(safeLevel),
      resetType: "short",
      formula: "1 per short rest"
    };
  }
  if (normalized === "\u0633\u0627\u06CC\u0647\u062E\u0648\u0627\u0646") {
    result["reality_fatigue"] = {
      name: "\u062E\u0633\u062A\u06AF\u06CC \u0648\u0627\u0642\u0639\u06CC\u062A (Reality Fatigue)",
      max: Math.max(1, intMod + 1),
      resetType: "long",
      formula: "INT mod + 1"
    };
  }
  if (normalized === "\u0645\u0647\u0622\u0634\u0646\u0627") {
    result["moment_points"] = {
      name: "\u0627\u0645\u062A\u06CC\u0627\u0632 \u0644\u062D\u0638\u0647 (Moment Points)",
      max: safeLevel,
      currentDice: martialArtsDie(safeLevel),
      resetType: "short",
      formula: "= level"
    };
  }
  if (normalized === "\u062F\u06CC\u0648\u0627\u0646\u0632\u0627\u062F") {
    result["construct_companion"] = {
      name: "\u0627\u0646\u0631\u0698\u06CC \u0633\u0627\u0632\u0647 \u0647\u0645\u0631\u0627\u0647",
      max: safeLevel >= 3 ? Math.max(1, 2 * safeLevel + 2 * conMod) : 0,
      resetType: "long",
      formula: "2\xD7level + 2\xD7con"
    };
  }
  return result;
}
__name(computeClassResources, "computeClassResources");
function featuresUnlockedAtLevel(classTemplate, level, subclassId) {
  if (!classTemplate) return [];
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  const features = [];
  if (classTemplate.startingFeatures && Array.isArray(classTemplate.startingFeatures)) {
    features.push(...classTemplate.startingFeatures);
  }
  if (classTemplate.featuresByLevel) {
    for (let lvl = 1; lvl <= safeLevel; lvl++) {
      const list = classTemplate.featuresByLevel[lvl];
      if (Array.isArray(list)) {
        features.push(...list.map((f) => ({ ...f, levelUnlocked: lvl })));
      }
    }
  }
  if (classTemplate.subclasses && Array.isArray(classTemplate.subclasses)) {
    const sub = classTemplate.subclasses.find((s) => s.id === subclassId || s.name === subclassId) || classTemplate.subclasses[0];
    if (sub && sub.featuresByLevel && safeLevel >= (sub.unlockLevel || 3)) {
      for (let lvl = sub.unlockLevel || 3; lvl <= safeLevel; lvl++) {
        const subList = sub.featuresByLevel[lvl];
        if (Array.isArray(subList)) {
          features.push(...subList.map((f) => ({ ...f, levelUnlocked: lvl, isSubclass: true })));
        }
      }
    }
  }
  return features;
}
__name(featuresUnlockedAtLevel, "featuresUnlockedAtLevel");
function pointBuyCost(scores) {
  const scoreList = Array.isArray(scores) ? scores : Object.values(scores);
  let total = 0;
  for (const s of scoreList) {
    if (s < 8) return Infinity;
    if (s > 15) return Infinity;
    total += POINT_BUY_COST_TABLE[s] ?? 0;
  }
  return total;
}
__name(pointBuyCost, "pointBuyCost");
function validatePointBuy(scores, budget = 27) {
  const scoreList = Array.isArray(scores) ? scores : Object.values(scores);
  const errors = [];
  if (scoreList.length !== 6) {
    errors.push(`\u062A\u0639\u062F\u0627\u062F \u0627\u0645\u062A\u06CC\u0627\u0632\u0627\u062A \u0628\u0627\u06CC\u062F \u06F6 \u0639\u062F\u062F \u0628\u0627\u0634\u062F\u060C \u0627\u0645\u0627 ${scoreList.length} \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0627\u0633\u062A.`);
  }
  for (const s of scoreList) {
    if (s < 8 || s > 15) {
      errors.push(`\u0627\u0645\u062A\u06CC\u0627\u0632 ${s} \u062E\u0627\u0631\u062C \u0627\u0632 \u0645\u062D\u062F\u0648\u062F\u0647 \u0645\u062C\u0627\u0632 Point Buy (\u06F8 \u062A\u0627 \u06F1\u06F5) \u0627\u0633\u062A.`);
    }
  }
  const cost = pointBuyCost(scoreList);
  if (cost > budget) {
    errors.push(`\u0645\u062C\u0645\u0648\u0639 \u0627\u0645\u062A\u06CC\u0627\u0632 \u0647\u0632\u06CC\u0646\u0647 (${cost}) \u0627\u0632 \u0633\u0642\u0641 \u0645\u062C\u0627\u0632 (${budget}) \u0628\u06CC\u0634\u062A\u0631 \u0627\u0633\u062A.`);
  }
  return {
    valid: errors.length === 0,
    cost,
    errors
  };
}
__name(validatePointBuy, "validatePointBuy");
function validateStandardArray(scores) {
  const list = Array.isArray(scores) ? [...scores] : Object.values(scores);
  if (list.length !== 6) return false;
  const sortedActual = [...list].sort((a, b) => b - a);
  const sortedExpected = [...STANDARD_ARRAY].sort((a, b) => b - a);
  for (let i = 0; i < 6; i++) {
    if (sortedActual[i] !== sortedExpected[i]) return false;
  }
  return true;
}
__name(validateStandardArray, "validateStandardArray");
function rollAbilityScores(randomFn = Math.random) {
  const rolls = [];
  const scores = [];
  for (let i = 0; i < 6; i++) {
    const dice = [];
    for (let d = 0; d < 4; d++) {
      const val = Math.floor(randomFn() * 6) + 1;
      dice.push(Math.max(1, Math.min(6, val)));
    }
    const sorted = [...dice].sort((a, b) => a - b);
    const sum = sorted[1] + sorted[2] + sorted[3];
    rolls.push(dice);
    scores.push(sum);
  }
  return { rolls, scores };
}
__name(rollAbilityScores, "rollAbilityScores");

// ../shared/rules/wizardEngine.ts
function validateIdentityStep(master, lineage, campaignHasLineages = true) {
  const errors = [];
  const warnings = [];
  const name = String(master?.name || "").trim();
  if (!name) {
    errors.push("\u0646\u0627\u0645 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
  } else if (name.length > 50) {
    errors.push("\u0646\u0627\u0645 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0646\u0628\u0627\u06CC\u062F \u0628\u06CC\u0634 \u0627\u0632 \u06F5\u06F0 \u062D\u0631\u0641 \u0628\u0627\u0634\u062F.");
  }
  if (master?.portraitUrl) {
    if (master.portraitUrl.startsWith("data:")) {
      const b64Part = master.portraitUrl.split(",")[1] || "";
      const estimatedBytes = Math.ceil(b64Part.length * 3 / 4);
      if (estimatedBytes > 153600) {
        errors.push(`\u0627\u0646\u062F\u0627\u0632\u0647 \u062A\u0635\u0648\u06CC\u0631 \u067E\u0631\u062A\u0631\u0647 (${Math.round(estimatedBytes / 1024)}KB) \u0627\u0632 \u0633\u0642\u0641 \u06F1\u06F5\u06F0 \u06A9\u06CC\u0644\u0648\u0628\u0627\u06CC\u062A \u0628\u06CC\u0634\u062A\u0631 \u0627\u0633\u062A.`);
      }
    }
  }
  if (campaignHasLineages && !lineage && !master?.race) {
    warnings.push("\u0647\u06CC\u0686 \u062A\u0628\u0627\u0631 \u06CC\u0627 \u0646\u0698\u0627\u062F\u06CC \u0628\u0631\u0627\u06CC \u0634\u062E\u0635\u06CC\u062A \u062A\u0639\u06CC\u06CC\u0646 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A\u061B \u0646\u0698\u0627\u062F \u067E\u06CC\u0634\u200C\u0641\u0631\u0636 \u0622\u062F\u0645\u06CC \u062F\u0631 \u0646\u0638\u0631 \u06AF\u0631\u0641\u062A\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F.");
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
__name(validateIdentityStep, "validateIdentityStep");
function validateClassStep(className, allowedCampaignClasses = []) {
  const errors = [];
  const warnings = [];
  const cleanName = String(className || "").trim();
  if (!cleanName) {
    errors.push("\u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0644\u0627\u0633 \u0628\u0627\u0632\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
  } else if (allowedCampaignClasses.length > 0) {
    const matched = allowedCampaignClasses.find(
      (c) => c.name.trim() === cleanName || c.id === cleanName
    );
    if (!matched) {
      errors.push(`\u06A9\u0644\u0627\u0633 \xAB${cleanName}\xBB \u062F\u0631 \u0627\u06CC\u0646 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.`);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
__name(validateClassStep, "validateClassStep");
function calculateFinalAbilities(baseScores, lineage, lineageChoices) {
  const finalScores = {
    str: baseScores.str || 10,
    dex: baseScores.dex || 10,
    con: baseScores.con || 10,
    int: baseScores.int || 10,
    wis: baseScores.wis || 10,
    cha: baseScores.cha || 10
  };
  if (!lineage) return finalScores;
  const bonuses = lineage.abilityBonuses;
  if (!bonuses) return finalScores;
  if (bonuses.mode === "fixed" && bonuses.fixed) {
    for (const [key, val] of Object.entries(bonuses.fixed)) {
      const lower = key.toLowerCase();
      if (typeof val === "number" && finalScores[lower] !== void 0) {
        finalScores[lower] = (finalScores[lower] || 10) + val;
      }
    }
  } else if (bonuses.mode === "choose" && lineageChoices) {
    for (const [key, val] of Object.entries(lineageChoices)) {
      const lower = key.toLowerCase();
      if (typeof val === "number" && finalScores[lower] !== void 0) {
        finalScores[lower] = (finalScores[lower] || 10) + val;
      }
    }
  }
  return finalScores;
}
__name(calculateFinalAbilities, "calculateFinalAbilities");
function validateAbilitiesStep(method, baseScores, build, classTemplate, allowedMethods = ["standard_array", "point_buy", "roll", "class_base", "manual"]) {
  const errors = [];
  const warnings = [];
  if (!allowedMethods.includes(method)) {
    errors.push(`\u0631\u0648\u0634 \u0627\u0646\u062A\u062E\u0627\u0628 \u0648\u06CC\u0698\u06AF\u06CC\u200C\u0647\u0627\u06CC \xAB${method}\xBB \u062F\u0631 \u0627\u06CC\u0646 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.`);
    return { valid: false, errors, warnings };
  }
  const scoresList = [
    baseScores.str || 10,
    baseScores.dex || 10,
    baseScores.con || 10,
    baseScores.int || 10,
    baseScores.wis || 10,
    baseScores.cha || 10
  ];
  if (method === "standard_array") {
    const isValid = validateStandardArray(scoresList);
    if (!isValid) {
      errors.push("\u0627\u0645\u062A\u06CC\u0627\u0632\u0627\u062A \u0648\u06CC\u0698\u06AF\u06CC\u200C\u0647\u0627 \u0645\u0637\u0627\u0628\u0642 \u0628\u0627 \u0622\u0631\u0627\u06CC\u0647 \u0627\u0633\u062A\u0627\u0646\u062F\u0627\u0631\u062F (15, 14, 13, 12, 10, 8) \u0646\u06CC\u0633\u062A.");
    }
  } else if (method === "point_buy") {
    const pbResult = validatePointBuy(scoresList, 27);
    if (!pbResult.valid) {
      errors.push(...pbResult.errors);
    }
  } else if (method === "roll") {
    if (!build.rolls || !build.rolls.scores || build.rolls.scores.length !== 6) {
      errors.push("\u062A\u0627\u0633\u200C\u0647\u0627\u06CC \u0633\u0631\u0648\u0631 \u0628\u0631\u0627\u06CC \u0648\u06CC\u0698\u06AF\u06CC\u200C\u0647\u0627 \u062B\u0628\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.");
    } else {
      const sortedActual = [...scoresList].sort((a, b) => b - a);
      const sortedRolls = [...build.rolls.scores].sort((a, b) => b - a);
      for (let i = 0; i < 6; i++) {
        if (sortedActual[i] !== sortedRolls[i]) {
          errors.push("\u0627\u0645\u062A\u06CC\u0627\u0632\u0627\u062A \u0648\u06CC\u0698\u06AF\u06CC \u0628\u0627 \u0646\u062A\u0627\u06CC\u062C \u067E\u0631\u062A\u0627\u0628 \u062A\u0627\u0633 \u0633\u0631\u0648\u0631 \u0645\u0637\u0627\u0628\u0642\u062A \u0646\u062F\u0627\u0631\u062F.");
          break;
        }
      }
    }
  } else if (method === "class_base") {
    if (classTemplate?.baseAbilityScores) {
      const base = classTemplate.baseAbilityScores;
      for (const key of ["str", "dex", "con", "int", "wis", "cha"]) {
        if (base[key] !== void 0 && baseScores[key] !== base[key]) {
          warnings.push(`\u0627\u0645\u062A\u06CC\u0627\u0632 ${key.toUpperCase()} \u0628\u0627 \u067E\u0627\u06CC\u0647 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u06CC \u06A9\u0644\u0627\u0633 \u0645\u062A\u0641\u0627\u0648\u062A \u0627\u0633\u062A.`);
        }
      }
    }
  } else if (method === "manual") {
    for (const s of scoresList) {
      if (s < 3 || s > 18) {
        errors.push(`\u0627\u0645\u062A\u06CC\u0627\u0632 ${s} \u062E\u0627\u0631\u062C \u0627\u0632 \u0645\u062D\u062F\u0648\u062F\u0647 \u0637\u0628\u06CC\u0639\u06CC \u0648\u06CC\u0698\u06AF\u06CC\u200C\u0647\u0627\u06CC D&D (\u06F3 \u062A\u0627 \u06F1\u06F8) \u0627\u0633\u062A.`);
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
__name(validateAbilitiesStep, "validateAbilitiesStep");
function validateBackgroundAndSkillsStep(build, classTemplate, background, lineage) {
  const errors = [];
  const warnings = [];
  const taggedProficiencies = [];
  const addedKeys = /* @__PURE__ */ new Set();
  if (lineage?.proficiencies?.skills) {
    for (const sk of lineage.proficiencies.skills) {
      const lower = sk.toLowerCase();
      if (!addedKeys.has(lower)) {
        addedKeys.add(lower);
        taggedProficiencies.push({ key: lower, source: "lineage" });
      }
    }
  }
  if (background?.skillProficiencies) {
    for (const sk of background.skillProficiencies) {
      const lower = sk.toLowerCase();
      if (!addedKeys.has(lower)) {
        addedKeys.add(lower);
        taggedProficiencies.push({ key: lower, source: "background" });
      } else {
        warnings.push(`\u0645\u0647\u0627\u0631\u062A \xAB${lower}\xBB \u0647\u0645 \u062F\u0631 \u062A\u0628\u0627\u0631 \u0648 \u0647\u0645 \u062F\u0631 \u067E\u06CC\u0634\u06CC\u0646\u0647 \u0648\u062C\u0648\u062F \u062F\u0627\u0631\u062F.`);
      }
    }
  }
  const classPicks = build.skillChoices?.fromClass || [];
  const classAllowedCount = classTemplate?.skillChoices?.count ?? 2;
  const classAllowedOptions = (classTemplate?.skillChoices?.options || []).map((o) => o.toLowerCase());
  if (classTemplate?.skillChoices && classPicks.length !== classAllowedCount) {
    errors.push(`\u0634\u0645\u0627 \u0628\u0627\u06CC\u062F \u062F\u0642\u06CC\u0642\u0627\u064B ${classAllowedCount} \u0645\u0647\u0627\u0631\u062A \u0627\u0632 \u06A9\u0644\u0627\u0633 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F\u060C \u0627\u0645\u0627 ${classPicks.length} \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0631\u062F\u0647\u200C\u0627\u06CC\u062F.`);
  }
  for (const sk of classPicks) {
    const lower = sk.toLowerCase();
    if (classAllowedOptions.length > 0 && !classAllowedOptions.includes(lower)) {
      errors.push(`\u0645\u0647\u0627\u0631\u062A \xAB${lower}\xBB \u062F\u0631 \u0645\u06CC\u0627\u0646 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u0645\u062C\u0627\u0632 \u06A9\u0644\u0627\u0633 \u0646\u06CC\u0633\u062A.`);
    }
    if (addedKeys.has(lower)) {
      warnings.push(`\u0645\u0647\u0627\u0631\u062A \xAB${lower}\xBB \u0642\u0628\u0644\u0627\u064B \u0627\u0632 \u067E\u06CC\u0634\u06CC\u0646\u0647 \u06CC\u0627 \u062A\u0628\u0627\u0631 \u06A9\u0633\u0628 \u0634\u062F\u0647 \u0628\u0648\u062F\u061B \u062A\u0648\u0635\u06CC\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F \u0645\u0647\u0627\u0631\u062A \u062F\u06CC\u06AF\u0631\u06CC \u0628\u0631\u06AF\u0632\u06CC\u0646\u06CC\u062F.`);
    } else {
      addedKeys.add(lower);
      taggedProficiencies.push({ key: lower, source: "class" });
    }
  }
  return {
    result: {
      valid: errors.length === 0,
      errors,
      warnings
    },
    taggedProficiencies
  };
}
__name(validateBackgroundAndSkillsStep, "validateBackgroundAndSkillsStep");
var CANON_STARTER_WEAPONS = [
  {
    id: "w_special_sun_blade",
    name: "\u062A\u06CC\u063A \u0645\u0647\u0631\u06AF\u0627\u0646 (\u062E\u0646\u062C\u0631 \u062A\u0627\u0628\u0646\u062F\u0647)",
    kind: "special",
    damageDice: "1d6",
    damageType: "\u0622\u0630\u0631\u06CC\u0646/\u0633\u0631\u062F",
    tradeoffFa: "\u0633\u0644\u0627\u062D \u062F\u0627\u0631\u0627\u06CC \u0642\u0627\u0628\u0644\u06CC\u062A \u0645\u06A9\u0627\u0646\u06CC\u06A9\u06CC \u0648\u06CC\u0698\u0647: \u06CC\u06A9\u200C\u0628\u0627\u0631 \u062F\u0631 \u0647\u0631 \u0627\u0633\u062A\u0631\u0627\u062D\u062A \u06A9\u0648\u062A\u0627\u0647\u060C \u0634\u0644\u06CC\u06A9 \u0622\u0630\u0631\u06CC\u0646 \u0628\u0627 \u06F1d\u06F6 \u0622\u0633\u06CC\u0628 \u0627\u0636\u0627\u0641\u0647.",
    tradeoffEn: "Special ability with short-rest recharge.",
    specialAbility: {
      name: "\u0622\u0630\u0631\u062E\u0634 \u0645\u0647\u0631\u06AF\u0627\u0646",
      description: "\u06CC\u06A9\u200C\u0628\u0627\u0631 \u062F\u0631 \u0647\u0631 \u0627\u0633\u062A\u0631\u0627\u062D\u062A \u06A9\u0648\u062A\u0627\u0647\u060C \u06F1d\u06F6 \u0622\u0633\u06CC\u0628 \u0622\u062A\u0634 \u0627\u0636\u0627\u0641\u0647 \u0628\u0647 \u0636\u0631\u0628\u0647 \u0627\u0636\u0627\u0641\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F.",
      usesPerRest: 1,
      restType: "short"
    }
  },
  {
    id: "w_showy_ceremonial_blade",
    name: "\u0634\u0645\u0634\u06CC\u0631 \u0632\u0631\u06CC\u0646 \u0634\u0627\u0647\u0627\u0646\u0647 (\u0627\u0633\u0644\u062D\u0647 \u062A\u0634\u0631\u06CC\u0641\u0627\u062A\u06CC \u0648 \u0628\u0627\u0648\u0642\u0627\u0631)",
    kind: "showy",
    damageDice: "1d8",
    damageType: "\u0628\u0631\u0646\u062F\u0647",
    tradeoffFa: "\u0633\u0644\u0627\u062D \u0628\u062F\u0648\u0646 \u062C\u0627\u062F\u0648 \u0627\u0645\u0627 \u0633\u0627\u062E\u062A\u0647 \u0627\u0633\u062A\u0627\u062F\u0627\u0646 \u0622\u0647\u0646\u06AF\u0631\u06CC\u061B \u067E\u0631\u0633\u062A\u06CC\u0698 \u0627\u062C\u062A\u0645\u0627\u0639\u06CC \u0648 \u0628\u0631\u062A\u0631\u06CC (Advantage) \u062F\u0631 \u062A\u0639\u0627\u0645\u0644\u0627\u062A \u0627\u0634\u0631\u0627\u0641\u06CC \u0648 \u062F\u0631\u0628\u0627\u0631.",
    tradeoffEn: "Showy non-magical craftsmanship with high social prestige and court advantage.",
    showyBonus: {
      description: "\u067E\u0631\u0633\u062A\u06CC\u0698 \u0634\u0627\u0647\u0627\u0646\u0647: \u0628\u0631\u062A\u0631\u06CC \u062F\u0631 \u062A\u0627\u0633\u200C\u0647\u0627\u06CC \u0645\u062A\u0642\u0627\u0639\u062F\u0633\u0627\u0632\u06CC (Persuasion) \u062F\u0631 \u0628\u0627\u0631\u06AF\u0627\u0647\u200C\u0647\u0627 \u0648 \u0645\u062D\u0627\u0641\u0644 \u0627\u0634\u0631\u0627\u0641\u06CC.",
      socialAdvantage: true
    }
  }
];
function validateEquipmentStep(build, classTemplate) {
  const errors = [];
  const warnings = [];
  if (classTemplate?.startingEquipmentChoices && classTemplate.startingEquipmentChoices.length > 0) {
    const selectedGroups = build.equipmentChoices?.groups || {};
    for (const group of classTemplate.startingEquipmentChoices) {
      if (!selectedGroups[group.id]) {
        warnings.push(`\u06AF\u0632\u06CC\u0646\u0647 \u062A\u062C\u0647\u06CC\u0632\u0627\u062A \u0627\u0632 \u062F\u0633\u062A\u0647 \xAB${group.id}\xBB \u0627\u0646\u062A\u062E\u0627\u0628 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A\u061B \u0627\u0646\u062A\u062E\u0627\u0628 \u067E\u06CC\u0634\u200C\u0641\u0631\u0636 \u0627\u0639\u0645\u0627\u0644 \u0645\u06CC\u200C\u0634\u0648\u062F.`);
      }
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
__name(validateEquipmentStep, "validateEquipmentStep");
function computeAuthoritativeParticipation(input) {
  const {
    masterData,
    build,
    campaignId,
    campaignSettings,
    classTemplate,
    lineageTemplate,
    backgroundTemplate
  } = input;
  const level = Math.max(1, Math.min(20, Math.floor(input.entryLevel || campaignSettings?.startingLevel || 1)));
  const vIdentity = validateIdentityStep(masterData, lineageTemplate, Boolean(lineageTemplate));
  const vClass = validateClassStep(classTemplate?.name || "", classTemplate ? [classTemplate] : []);
  const baseScores = build.pointBuy?.scores || build.rolls?.assigned || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const vAbilities = validateAbilitiesStep(
    build.abilityMethod || "standard_array",
    baseScores,
    build,
    classTemplate,
    campaignSettings?.abilityScoreMethods || ["standard_array", "point_buy", "roll", "class_base", "manual"]
  );
  const finalAbilities = calculateFinalAbilities(baseScores, lineageTemplate, build.lineageAbilityChoices);
  const { result: vSkills, taggedProficiencies } = validateBackgroundAndSkillsStep(
    build,
    classTemplate,
    backgroundTemplate,
    lineageTemplate
  );
  const vEquip = validateEquipmentStep(build, classTemplate);
  const starterWeaponKind = build.equipmentChoices?.starterWeaponChoice || "standard";
  const starterWeaponId = build.equipmentChoices?.starterWeaponId;
  const starterWeapDef = CANON_STARTER_WEAPONS.find((w) => w.id === starterWeaponId) || CANON_STARTER_WEAPONS[0];
  const weapons = [
    {
      id: `w-starter-${Date.now()}`,
      templateId: starterWeapDef.id,
      name: starterWeapDef.name,
      damageDice: starterWeapDef.damageDice,
      damageType: starterWeapDef.damageType,
      range: "\u0646\u0632\u062F\u06CC\u06A9",
      properties: starterWeapDef.kind === "special" ? "\u0648\u06CC\u0698\u0647 (\u062C\u0627\u062F\u0648\u06CC\u06CC)" : "\u062A\u0634\u0631\u06CC\u0641\u0627\u062A\u06CC (\u0628\u0627\u0648\u0642\u0627\u0631)",
      kind: starterWeapDef.kind,
      isSpecial: starterWeapDef.kind === "special",
      isShowy: starterWeapDef.kind === "showy",
      specialAbility: starterWeapDef.specialAbility,
      abilityName: starterWeapDef.specialAbility?.name,
      abilityDesc: starterWeapDef.specialAbility?.description,
      abilityMaxUses: starterWeapDef.specialAbility?.usesPerRest,
      abilityUsed: 0,
      abilityReset: starterWeapDef.specialAbility?.restType
    }
  ];
  const inventory = [
    {
      id: `inv-starter-${Date.now()}`,
      name: "\u06A9\u0648\u0644\u0647 \u067E\u0634\u062A\u06CC \u0645\u0627\u062C\u0631\u0627\u062C\u0648",
      category: "misc",
      quantity: 1,
      weight: 5,
      description: "\u0644\u0648\u0627\u0632\u0645 \u0627\u0648\u0644\u06CC\u0647 \u0633\u0641\u0631\u060C \u0637\u0646\u0627\u0628\u060C \u062C\u06CC\u0631\u0647 \u0648 \u0645\u0634\u0639\u0644.",
      equipped: false
    }
  ];
  if (backgroundTemplate?.startingEquipment) {
    const bgEquip = Array.isArray(backgroundTemplate.startingEquipment) ? backgroundTemplate.startingEquipment : [backgroundTemplate.startingEquipment];
    for (const eq of bgEquip) {
      const eqName = typeof eq === "string" ? eq : eq.label || eq.items && eq.items.join(", ") || "\u0627\u0628\u0632\u0627\u0631 \u067E\u06CC\u0634\u06CC\u0646\u0647";
      inventory.push({
        id: `inv-bg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: eqName,
        category: "misc",
        quantity: 1,
        weight: 1,
        description: `\u062A\u062C\u0647\u06CC\u0632\u0627\u062A \u0622\u063A\u0627\u0632\u06CC\u0646 \u0627\u0632 \u067E\u06CC\u0634\u06CC\u0646\u0647 ${backgroundTemplate.name}`,
        equipped: false
      });
    }
  }
  const profBonus = proficiencyBonus(level);
  const dexMod = abilityModifier(finalAbilities.dex || 10);
  const conMod = abilityModifier(finalAbilities.con || 10);
  const saveProfMap = {};
  if (classTemplate?.savingThrowProficiencies) {
    for (const k of classTemplate.savingThrowProficiencies) {
      saveProfMap[k.toLowerCase()] = true;
    }
  }
  const saves = computeSaves(finalAbilities, saveProfMap, profBonus);
  const skillProfMap = {};
  for (const tp of taggedProficiencies) {
    skillProfMap[tp.key] = true;
  }
  const skills = computeSkills(finalAbilities, skillProfMap, profBonus);
  const ac = computeAC({
    acFormula: classTemplate?.acFormula,
    className: classTemplate?.name,
    classTemplateId: classTemplate?.id,
    abilities: finalAbilities,
    inventory
  });
  const rawHpMode = campaignSettings?.hpMode;
  const hpMode = rawHpMode === "roll" ? "roll" : rawHpMode === "manual" ? "average" : "fixed_table";
  const maxHp = computeMaxHp({
    className: classTemplate?.name,
    level,
    abilities: finalAbilities,
    conModifier: conMod,
    hpMode,
    settings: {
      conAdjustFixedTable: campaignSettings?.conAdjustFixedTable ?? true
    },
    classTemplate,
    hitDie: typeof classTemplate?.hitDie === "string" ? parseInt(classTemplate.hitDie.replace(/\D/g, ""), 10) || 8 : classTemplate?.hitDie
  });
  let spellSlots = void 0;
  let spellsKnownPrepared = void 0;
  if (classTemplate && (classTemplate.spellcasting?.ability || classTemplate.spellcastingStruct)) {
    const spellAbility = (classTemplate.spellcasting?.ability || "int").toLowerCase();
    const spellMod = abilityModifier(finalAbilities[spellAbility] || 10);
    const { dc, attackBonus } = computeSpellDcAndAttack(spellAbility, spellMod, profBonus);
    const slots = computeSlots(classTemplate.name, level);
    spellSlots = { slots, dc, attackBonus, ability: spellAbility };
    spellsKnownPrepared = {
      cantrips: build.spellChoices?.cantrips || [],
      spells: build.spellChoices?.spellsKnown || []
    };
  }
  const customResources = [];
  const classRes = computeClassResources(classTemplate?.name, level, finalAbilities);
  for (const [key, val] of Object.entries(classRes)) {
    customResources.push({
      id: key,
      name: val.name,
      current: val.max,
      max: val.max,
      dieType: val.currentDice || null,
      resetOn: val.resetType || "short",
      formula: val.formula
    });
  }
  const features = featuresUnlockedAtLevel(classTemplate, level, build.subclassId || void 0);
  const hitDice = {
    current: level,
    max: level,
    die: `d${classTemplate?.hitDie || 8}`
  };
  const initialStatus = campaignSettings?.approval?.onCreate === true ? "pending_approval" : "active";
  const sheetLocked = campaignSettings?.sheetLock !== "free";
  const allErrors = [
    ...vIdentity.errors,
    ...vClass.errors,
    ...vAbilities.errors,
    ...vSkills.errors,
    ...vEquip.errors
  ];
  const allWarnings = [
    ...vIdentity.warnings,
    ...vClass.warnings,
    ...vAbilities.warnings,
    ...vSkills.warnings,
    ...vEquip.warnings
  ];
  const participation = {
    campaignId,
    status: initialStatus,
    className: classTemplate?.name || "\u0645\u0627\u062C\u0631\u0627\u062C\u0648",
    classId: classTemplate?.id || null,
    subclassName: build.subclassId || void 0,
    level,
    xp: 0,
    abilityScores: finalAbilities,
    savingThrows: saves,
    currentHp: maxHp,
    maxHp,
    tempHp: 0,
    hitDice,
    acOverride: null,
    speedOverride: lineageTemplate?.speed || 30,
    deathSaves: { successes: 0, failures: 0 },
    conditions: [],
    inventory,
    weapons,
    currency: { gold: 15, silver: 5, copper: 0 },
    customResources,
    spellsKnownPrepared,
    spellSlots,
    features,
    notes: "",
    dmNotes: "",
    build,
    sheetLocked,
    joinedAt: Date.now(),
    updatedAt: Date.now(),
    characterName: masterData.name,
    characterRace: lineageTemplate?.name || masterData.race || "\u0622\u062F\u0645\u06CC",
    characterPortraitUrl: masterData.portraitUrl,
    characterAppearance: masterData.appearance,
    characterBackstory: masterData.backstory
  };
  if (level > 1) {
    runLevelProgressionHook(participation, build, level, campaignSettings, classTemplate);
  }
  return {
    participation,
    validation: {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  };
}
__name(computeAuthoritativeParticipation, "computeAuthoritativeParticipation");
function runLevelProgressionHook(participation, build, targetLevel, settings, classTemplate) {
  participation.level = targetLevel;
  participation.hitDice.current = targetLevel;
  participation.hitDice.max = targetLevel;
  participation.features = featuresUnlockedAtLevel(classTemplate, targetLevel, build.subclassId || void 0);
}
__name(runLevelProgressionHook, "runLevelProgressionHook");
function createSnapshot(participation, label, createdBy) {
  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    participationId: participation.id,
    label,
    state: {
      level: participation.level,
      xp: participation.xp,
      abilityScores: participation.abilityScores,
      currentHp: participation.currentHp,
      maxHp: participation.maxHp,
      tempHp: participation.tempHp,
      hitDice: participation.hitDice,
      inventory: participation.inventory,
      weapons: participation.weapons,
      currency: participation.currency,
      customResources: participation.customResources,
      spellsKnownPrepared: participation.spellsKnownPrepared,
      spellSlots: participation.spellSlots,
      features: participation.features
    },
    build: participation.build || { abilityMethod: "standard_array", skillChoices: {}, equipmentChoices: {} },
    level: participation.level,
    createdBy,
    createdAt: Date.now()
  };
}
__name(createSnapshot, "createSnapshot");

// ../shared/rules/levelUpEngine.ts
var XP_THRESHOLDS = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14e3,
  7: 23e3,
  8: 34e3,
  9: 48e3,
  10: 64e3,
  11: 85e3,
  12: 1e5,
  13: 12e4,
  14: 14e4,
  15: 165e3,
  16: 195e3,
  17: 225e3,
  18: 265e3,
  19: 305e3,
  20: 355e3
};
var DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19];
function parseHitDieValue(hitDie) {
  if (typeof hitDie === "number") return hitDie;
  if (typeof hitDie === "string") {
    const match2 = hitDie.match(/\d+/);
    if (match2) return parseInt(match2[0], 10);
  }
  return 8;
}
__name(parseHitDieValue, "parseHitDieValue");
var LOCKED_CORE_FIELDS = /* @__PURE__ */ new Set([
  "level",
  "className",
  "classId",
  "subclassName",
  "abilityScores",
  "maxHp",
  "hitDice",
  "features",
  "sheetLocked",
  "speedOverride",
  "acOverride"
]);
function isFieldLockedForPlayer(fieldName) {
  return LOCKED_CORE_FIELDS.has(fieldName);
}
__name(isFieldLockedForPlayer, "isFieldLockedForPlayer");
function computeLevelUpDiff(params) {
  const { participation, classTemplate, payload } = params;
  const errors = [];
  const fromLevel = participation.level;
  const toLevel = params.nextLevel ?? fromLevel + 1;
  if (toLevel !== fromLevel + 1) {
    errors.push(`\u0633\u0637\u062D \u0647\u062F\u0641 (${toLevel}) \u0628\u0627\u06CC\u062F \u062F\u0642\u06CC\u0642\u0627\u064B \u06CC\u06A9 \u0633\u0637\u062D \u0628\u0627\u0644\u0627\u062A\u0631 \u0627\u0632 \u0633\u0637\u062D \u0641\u0639\u0644\u06CC (${fromLevel}) \u0628\u0627\u0634\u062F.`);
  }
  if (toLevel > 20) {
    errors.push("\u0631\u0633\u06CC\u062F\u0646 \u0628\u0647 \u0633\u0637\u0648\u062D \u0641\u0631\u0627\u062A\u0631 \u0627\u0632 \u0633\u0637\u062D \u06F2\u06F0 \u0627\u0645\u06A9\u0627\u0646\u200C\u067E\u0630\u06CC\u0631 \u0646\u06CC\u0633\u062A.");
  }
  const asiLevels = classTemplate?.asiLevels || DEFAULT_ASI_LEVELS;
  const isAsiLevel = asiLevels.includes(toLevel);
  const newAbilities = { ...participation.abilityScores };
  const abilityChanges = {};
  if (isAsiLevel) {
    const mode = payload.asiMode || "plus2";
    if (mode === "plus2") {
      const stat = payload.asiChoices?.stat1 || "str";
      const before = newAbilities[stat] || 10;
      const after = Math.min(20, before + 2);
      newAbilities[stat] = after;
      abilityChanges[stat] = { before, after };
    } else if (mode === "plus1plus1") {
      const s1 = payload.asiChoices?.stat1 || "str";
      const s2 = payload.asiChoices?.stat2 || "dex";
      if (s1 === s2) {
        errors.push("\u062F\u0631 \u062D\u0627\u0644\u062A \u0627\u0641\u0632\u0627\u06CC\u0634 \u062F\u0648\u06AF\u0627\u0646\u0647 (+\u06F1 / +\u06F1) \u0628\u0627\u06CC\u062F \u062F\u0648 \u0648\u06CC\u0698\u06AF\u06CC \u0645\u062A\u0641\u0627\u0648\u062A \u0627\u0646\u062A\u062E\u0627\u0628 \u0634\u0648\u0646\u062F.");
      }
      const b1 = newAbilities[s1] || 10;
      const b2 = newAbilities[s2] || 10;
      const a1 = Math.min(20, b1 + 1);
      const a2 = Math.min(20, b2 + 1);
      newAbilities[s1] = a1;
      newAbilities[s2] = a2;
      abilityChanges[s1] = { before: b1, after: a1 };
      abilityChanges[s2] = { before: b2, after: a2 };
    }
  }
  const hitDie = parseHitDieValue(classTemplate?.hitDie);
  const conMod = abilityModifier(newAbilities.con ?? participation.abilityScores.con ?? 10);
  let hpGain = 1;
  let hpBreakdown = "";
  if (payload.hpMode === "fixed") {
    const baseFixed = Math.floor(hitDie / 2) + 1;
    hpGain = Math.max(1, baseFixed + conMod);
    hpBreakdown = `\u067E\u0627\u06CC\u0647 \u062B\u0627\u0628\u062A \u06A9\u0644\u0627\u0633\u06CC (${baseFixed}) + \u062A\u0639\u062F\u06CC\u0644 \u0628\u0646\u06CC\u0647 (${conMod >= 0 ? `+${conMod}` : conMod}) = +${hpGain} \u062C\u0627\u0646`;
  } else if (payload.hpMode === "roll") {
    const rawRoll = payload.hpRoll || Math.floor(hitDie / 2) + 1;
    if (rawRoll < 1 || rawRoll > hitDie) {
      errors.push(`\u062A\u0627\u0633 \u067E\u0631\u062A\u0627\u0628 \u0634\u062F\u0647 \u0628\u0631\u0627\u06CC \u062C\u0627\u0646 (${rawRoll}) \u0628\u0627\u06CC\u062F \u0628\u06CC\u0646 \u06F1 \u0648 ${hitDie} \u0628\u0627\u0634\u062F.`);
    }
    hpGain = Math.max(1, rawRoll + conMod);
    hpBreakdown = `\u067E\u0631\u062A\u0627\u0628 \u062A\u0627\u0633 1d${hitDie} (${rawRoll}) + \u062A\u0639\u062F\u06CC\u0644 \u0628\u0646\u06CC\u0647 (${conMod >= 0 ? `+${conMod}` : conMod}) = +${hpGain} \u062C\u0627\u0646`;
  } else {
    hpGain = Math.max(1, payload.hpRoll || Math.floor(hitDie / 2) + 1);
    hpBreakdown = `\u0645\u06CC\u0632\u0627\u0646 \u062A\u0639\u06CC\u06CC\u0646 \u0634\u062F\u0647 \u062F\u0633\u062A\u06CC: +${hpGain} \u062C\u0627\u0646`;
  }
  const oldMaxHp = participation.maxHp;
  const newMaxHp = oldMaxHp + hpGain;
  const newCurrentHp = participation.currentHp + hpGain;
  let unlockedSubclass = void 0;
  const subclassUnlockLevel = classTemplate?.subclasses?.[0]?.unlockLevel ?? 3;
  if (toLevel === subclassUnlockLevel && !participation.subclassName && (classTemplate?.subclasses?.length || 0) > 0) {
    if (!payload.chosenSubclass) {
      errors.push(`\u062F\u0631 \u0633\u0637\u062D ${subclassUnlockLevel} \u0627\u0646\u062A\u062E\u0627\u0628 \u0632\u06CC\u0631\u06A9\u0644\u0627\u0633 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.`);
    } else {
      const found = classTemplate?.subclasses?.find((s) => s.name === payload.chosenSubclass || s.id === payload.chosenSubclass);
      if (!found) {
        errors.push(`\u0632\u06CC\u0631\u06A9\u0644\u0627\u0633 \u0627\u0646\u062A\u062E\u0627\u0628 \u0634\u062F\u0647 \xAB${payload.chosenSubclass}\xBB \u062F\u0631 \u0627\u06CC\u0646 \u06A9\u0644\u0627\u0633 \u062A\u0639\u0631\u06CC\u0641 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.`);
      } else {
        unlockedSubclass = found.name;
      }
    }
  }
  const newFeatures = [];
  if (classTemplate?.featuresByLevel?.[toLevel]) {
    for (const f of classTemplate.featuresByLevel[toLevel]) {
      newFeatures.push({ name: f.name, description: f.description });
    }
  } else if (classTemplate?.features?.[toLevel]) {
    newFeatures.push({ name: `\u0642\u0627\u0628\u0644\u06CC\u062A \u0633\u0637\u062D ${toLevel}`, description: String(classTemplate.features[toLevel]) });
  }
  if (unlockedSubclass && classTemplate?.subclasses) {
    const sub = classTemplate.subclasses.find((s) => s.name === unlockedSubclass);
    if (sub?.featuresByLevel?.[toLevel]) {
      for (const sf of sub.featuresByLevel[toLevel]) {
        newFeatures.push({ name: sf.name, description: sf.description });
      }
    }
  }
  const isCaster = Boolean(classTemplate?.spellcasting);
  let newSpellsResult = void 0;
  let updatedSpellSlots = participation.spellSlots;
  let updatedSpells = participation.spellsKnownPrepared;
  if (isCaster) {
    const newSlots = classTemplate?.spellcasting?.slotsByLevel?.[toLevel] || classTemplate?.spellcasting?.slotsTable?.[toLevel] || null;
    if (newSlots) {
      updatedSpellSlots = {
        ...participation.spellSlots || {},
        slots: Array.isArray(newSlots) ? newSlots : participation.spellSlots?.slots
      };
    }
    if (payload.newSpells) {
      newSpellsResult = {
        cantrips: payload.newSpells.cantrips || [],
        spells: payload.newSpells.spells || []
      };
      const existingCantrips = participation.spellsKnownPrepared?.cantrips || [];
      const existingSpells = participation.spellsKnownPrepared?.spells || [];
      updatedSpells = {
        cantrips: Array.from(/* @__PURE__ */ new Set([...existingCantrips, ...newSpellsResult.cantrips])),
        spells: Array.from(/* @__PURE__ */ new Set([...existingSpells, ...newSpellsResult.spells]))
      };
    }
  }
  let newCompanion = void 0;
  if (classTemplate?.companion && classTemplate.companion.fromLevel === toLevel) {
    newCompanion = {
      name: payload.newCompanionName || classTemplate.companion.name,
      type: "companion"
    };
  }
  const oldProfBonus = proficiencyBonus(fromLevel);
  const newProfBonus = proficiencyBonus(toLevel);
  const diff = {
    fromLevel,
    toLevel,
    hpGain,
    newMaxHp,
    oldMaxHp,
    hpBreakdown,
    abilityChanges: Object.keys(abilityChanges).length > 0 ? abilityChanges : void 0,
    newFeatures,
    unlockedSubclass,
    newSpells: newSpellsResult,
    newCompanion,
    oldProfBonus,
    newProfBonus
  };
  const mergedFeatures = [
    ...participation.features || [],
    ...newFeatures.map((f) => ({
      id: `feat-${toLevel}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: f.name,
      description: f.description,
      source: `\u06A9\u0644\u0627\u0633 \u0633\u0637\u062D ${toLevel}`,
      usageType: "none",
      usedCount: 0
    }))
  ];
  const nextParticipation = {
    ...participation,
    level: toLevel,
    maxHp: newMaxHp,
    currentHp: newCurrentHp,
    abilityScores: newAbilities,
    subclassName: unlockedSubclass || participation.subclassName,
    hitDice: {
      ...participation.hitDice,
      max: toLevel,
      current: Math.min(toLevel, participation.hitDice.current + 1),
      die: `d${hitDie}`
    },
    features: mergedFeatures,
    spellSlots: updatedSpellSlots,
    spellsKnownPrepared: updatedSpells,
    levelUpAvailable: false,
    updatedAt: Date.now()
  };
  return {
    validation: {
      valid: errors.length === 0,
      errors
    },
    diff,
    nextParticipation
  };
}
__name(computeLevelUpDiff, "computeLevelUpDiff");

// ../src/data/calendar.ts
var INITIAL_CALENDAR = {
  id: "zorvania-calendar",
  year: 1500,
  month: 1,
  day: 1,
  isOffDay: false,
  currentFestival: "\u062C\u0634\u0646 \u0641\u0631\u0647\u06AF\u0627\u0646 (\u0622\u063A\u0627\u0632 \u0628\u0647\u0627\u0631 \u0648 \u0646\u0648\u0631\u0648\u0632 \u0632\u0631\u0648\u0627\u0646\u06CC\u0627)",
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
};

// ../shared/rules/sessionEngine.ts
function filterSessionForViewer(session, role) {
  const isDm = role === "owner" || role === "co_dm" || role === "dm";
  if (isDm) return session;
  const clone = { ...session };
  delete clone.dmNotes;
  return clone;
}
__name(filterSessionForViewer, "filterSessionForViewer");
function canUserRsvp(role) {
  return role === "owner" || role === "co_dm" || role === "player" || role === "dm";
}
__name(canUserRsvp, "canUserRsvp");
function canUserVote(role) {
  return role === "owner" || role === "co_dm" || role === "player" || role === "dm";
}
__name(canUserVote, "canUserVote");
function validatePollOptions(options) {
  if (!Array.isArray(options) || options.length < 2) {
    return { valid: false, error: "\u0628\u0631\u0627\u06CC \u0646\u0638\u0631\u0633\u0646\u062C\u06CC \u062A\u0627\u0631\u06CC\u062E \u062D\u062F\u0627\u0642\u0644 \u06F2 \u06AF\u0632\u06CC\u0646\u0647 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." };
  }
  if (options.length > 5) {
    return { valid: false, error: "\u062D\u062F\u0627\u06A9\u062B\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u06F5 \u06AF\u0632\u06CC\u0646\u0647 \u062A\u0627\u0631\u06CC\u062E \u067E\u06CC\u0634\u0646\u0647\u0627\u062F \u062F\u0647\u06CC\u062F." };
  }
  const normalized = [];
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (!opt || !opt.startsAt) {
      return { valid: false, error: `\u06AF\u0632\u06CC\u0646\u0647 \u0634\u0645\u0627\u0631\u0647 ${i + 1} \u062A\u0627\u0631\u06CC\u062E \u0645\u0639\u062A\u0628\u0631\u06CC \u0646\u062F\u0627\u0631\u062F.` };
    }
    const date = new Date(opt.startsAt);
    if (isNaN(date.getTime())) {
      return { valid: false, error: `\u0642\u0627\u0644\u0628 \u062A\u0627\u0631\u06CC\u062E \u06AF\u0632\u06CC\u0646\u0647 \u0634\u0645\u0627\u0631\u0647 ${i + 1} \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.` };
    }
    normalized.push({
      id: opt.id && opt.id.trim() ? opt.id.trim() : `opt-${Date.now()}-${i + 1}`,
      startsAt: date.toISOString()
    });
  }
  return { valid: true, normalized };
}
__name(validatePollOptions, "validatePollOptions");
function buildAttendanceHistoryEvent(sessionNumber, sessionTitle, sessionId, campaignId) {
  return {
    id: `hist-ses-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    eventType: "major_deed",
    payload: {
      title: `\u062D\u0636\u0648\u0631 \u062F\u0631 \u062C\u0644\u0633\u0647 ${sessionNumber}`,
      description: sessionTitle ? `\u0634\u0631\u06A9\u062A \u062F\u0631 \u062C\u0644\u0633\u0647 \xAB${sessionTitle}\xBB` : `\u062D\u0636\u0648\u0631 \u0648 \u0645\u0634\u0627\u0631\u06A9\u062A \u062F\u0631 \u062C\u0644\u0633\u0647 ${sessionNumber}`,
      sessionNumber,
      sessionId,
      campaignId
    }
  };
}
__name(buildAttendanceHistoryEvent, "buildAttendanceHistoryEvent");

// ../shared/rules/recapEngine.ts
function canUserCreateRecap(role, allowPlayerRecaps = false) {
  if (!role) return false;
  if (role === "owner" || role === "co_dm" || role === "dm") return true;
  if (role === "player") return Boolean(allowPlayerRecaps);
  return false;
}
__name(canUserCreateRecap, "canUserCreateRecap");
function canUserEditRecap(recap, role, currentUserId) {
  if (!role) return false;
  if (role === "owner" || role === "co_dm" || role === "dm") return true;
  if (currentUserId && recap.authorId === currentUserId) return true;
  return false;
}
__name(canUserEditRecap, "canUserEditRecap");
function validateRecapPayload(payload) {
  if (!payload.title || !payload.title.trim()) {
    return { valid: false, error: "\u0639\u0646\u0648\u0627\u0646 \u062E\u0644\u0627\u0635\u0647 \u062C\u0644\u0633\u0647 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062E\u0627\u0644\u06CC \u0628\u0627\u0634\u062F." };
  }
  if (!payload.body || !payload.body.trim()) {
    return { valid: false, error: "\u0645\u062A\u0646 \u062E\u0644\u0627\u0635\u0647 \u062C\u0644\u0633\u0647 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062E\u0627\u0644\u06CC \u0628\u0627\u0634\u062F." };
  }
  return { valid: true };
}
__name(validateRecapPayload, "validateRecapPayload");
function buildHighlightHistoryEvent(highlight, sessionNumber) {
  const sessionPart = sessionNumber !== void 0 ? ` \u062F\u0631 \u062C\u0644\u0633\u0647 ${sessionNumber}` : "";
  return {
    characterId: highlight.characterId || "",
    title: `\u0631\u0648\u06CC\u062F\u0627\u062F \u0628\u0631\u062C\u0633\u062A\u0647${sessionPart}`,
    description: highlight.text,
    eventType: "milestone",
    timestamp: highlight.createdAt || Date.now(),
    sessionNumber,
    payload: {
      title: `\u0631\u0648\u06CC\u062F\u0627\u062F \u0628\u0631\u062C\u0633\u062A\u0647${sessionPart}`,
      description: highlight.text,
      sessionNumber,
      sessionId: highlight.sessionId,
      highlightId: highlight.id
    }
  };
}
__name(buildHighlightHistoryEvent, "buildHighlightHistoryEvent");

// ../shared/rules/handoutEngine.ts
var MAX_HANDOUT_MEDIA_BYTES = 400 * 1024;
var DEFAULT_CAMPAIGN_MEDIA_QUOTA_BYTES = 20 * 1024 * 1024;
function validateHandoutPayload(data) {
  const title = (data.title || "").trim();
  if (!title) {
    return { valid: false, error: "\u0639\u0646\u0648\u0627\u0646 \u0633\u0646\u062F \u06CC\u0627 \u0646\u0642\u0634\u0647 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062E\u0627\u0644\u06CC \u0628\u0627\u0634\u062F." };
  }
  if (title.length > 100) {
    return { valid: false, error: "\u0639\u0646\u0648\u0627\u0646 \u0633\u0646\u062F \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0628\u06CC\u0634 \u0627\u0632 \u06F1\u06F0\u06F0 \u0646\u0648\u06CC\u0633\u0647 \u0628\u0627\u0634\u062F." };
  }
  const kind = data.kind;
  if (!kind || !["text", "image", "map"].includes(kind)) {
    return { valid: false, error: "\u0646\u0648\u0639 \u0633\u0646\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A (\u0628\u0627\u06CC\u062F \u0645\u062A\u0646\u060C \u062A\u0635\u0648\u06CC\u0631 \u06CC\u0627 \u0646\u0642\u0634\u0647 \u0628\u0627\u0634\u062F)." };
  }
  if (kind === "text") {
    const body = (data.body || "").trim();
    if (!body) {
      return { valid: false, error: "\u0645\u062A\u0646 \u0633\u0646\u062F \u0645\u062A\u0646\u06CC \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062E\u0627\u0644\u06CC \u0628\u0627\u0634\u062F." };
    }
  }
  if (data.visibility && !["hidden", "revealed", "selected"].includes(data.visibility)) {
    return { valid: false, error: "\u0648\u0636\u0639\u06CC\u062A \u0646\u0645\u0627\u06CC\u0634 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A." };
  }
  if (data.visibility === "selected") {
    if (!data.recipients || data.recipients.length === 0) {
      return { valid: false, error: "\u0628\u0631\u0627\u06CC \u0646\u0645\u0627\u06CC\u0634 \u0627\u062E\u062A\u0635\u0627\u0635\u06CC\u060C \u0628\u0627\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06CC\u06A9 \u0645\u0627\u062C\u0631\u0627\u062C\u0648 \u0627\u0646\u062A\u062E\u0627\u0628 \u0634\u0648\u062F." };
    }
  }
  return { valid: true };
}
__name(validateHandoutPayload, "validateHandoutPayload");
function filterPinsForPlayer(pins = [], isDm = false) {
  if (isDm) return pins;
  return pins.filter((p) => Boolean(p.revealed === 1 || p.revealed === true));
}
__name(filterPinsForPlayer, "filterPinsForPlayer");
function filterHandoutsForPlayer(handouts, participationId, isDm = false) {
  if (isDm) return handouts;
  const filtered = [];
  for (const h of handouts) {
    if (h.visibility === "revealed") {
      filtered.push({
        ...h,
        pins: filterPinsForPlayer(h.pins, false)
      });
    } else if (h.visibility === "selected") {
      if (participationId && h.recipients && h.recipients.includes(participationId)) {
        filtered.push({
          ...h,
          pins: filterPinsForPlayer(h.pins, false)
        });
      }
    }
  }
  return filtered;
}
__name(filterHandoutsForPlayer, "filterHandoutsForPlayer");
function clampCoordinates(x, y) {
  const clamp = /* @__PURE__ */ __name((val) => Math.max(0, Math.min(100, Math.round(val * 100) / 100)), "clamp");
  return {
    x: clamp(x),
    y: clamp(y)
  };
}
__name(clampCoordinates, "clampCoordinates");

// ../shared/rules/questEngine.ts
function canUserManageQuests(userRole) {
  if (typeof userRole === "boolean") return userRole;
  return userRole === "owner" || userRole === "co_dm" || userRole === "dm";
}
__name(canUserManageQuests, "canUserManageQuests");
function canUserToggleObjective(userRole, allowPlayerTick) {
  if (typeof userRole === "boolean") {
    if (userRole) return true;
    return Boolean(allowPlayerTick);
  }
  if (canUserManageQuests(userRole)) return true;
  if (userRole === "player" && allowPlayerTick) return true;
  return false;
}
__name(canUserToggleObjective, "canUserToggleObjective");
function filterQuestForViewer(quest, userRole, userParticipationId) {
  const isDm = canUserManageQuests(userRole);
  if (isDm) {
    return { ...quest };
  }
  if (quest.status === "hidden") {
    return null;
  }
  if (quest.participantIds && quest.participantIds.length > 0) {
    if (!userParticipationId || !quest.participantIds.includes(userParticipationId)) {
      return null;
    }
  }
  const visibleObjectives = (quest.objectives || []).filter((obj) => obj.visible !== false);
  return {
    ...quest,
    dmNotes: void 0,
    objectives: visibleObjectives
  };
}
__name(filterQuestForViewer, "filterQuestForViewer");
function filterQuestsForViewer(quests, userRole, userParticipationId) {
  return quests.map((q) => filterQuestForViewer(q, userRole, userParticipationId)).filter((q) => q !== null);
}
__name(filterQuestsForViewer, "filterQuestsForViewer");
function validateQuestPayload(data) {
  const errors = [];
  if (!data.title || !data.title.trim()) {
    errors.push("\u0639\u0646\u0648\u0627\u0646 \u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
  }
  const validStatuses = ["hidden", "active", "completed", "failed", "abandoned"];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push("\u0648\u0636\u0639\u06CC\u062A \u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
  }
  if (data.objectives && Array.isArray(data.objectives)) {
    for (let i = 0; i < data.objectives.length; i++) {
      const obj = data.objectives[i];
      if (!obj.text || !obj.text.trim()) {
        errors.push(`\u0645\u062A\u0646 \u0647\u062F\u0641 \u0634\u0645\u0627\u0631\u0647 ${i + 1} \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062E\u0627\u0644\u06CC \u0628\u0627\u0634\u062F.`);
      }
    }
  }
  return { valid: errors.length === 0, errors, error: errors[0] };
}
__name(validateQuestPayload, "validateQuestPayload");

// ../shared/rules/notifications.ts
function sanitizePayloadForPlayer(payload, isDm) {
  if (isDm) {
    return { ...payload };
  }
  const cleanPayload = {
    title: payload.title,
    body: payload.body,
    campaignId: payload.campaignId,
    campaignTitle: payload.campaignTitle,
    targetType: payload.targetType,
    targetId: payload.targetId,
    link: payload.link,
    actorName: payload.actorName
  };
  if (payload.metadata) {
    const cleanMeta = { ...payload.metadata };
    delete cleanMeta.dmNotes;
    delete cleanMeta.secretNotes;
    delete cleanMeta.dmAdvice;
    delete cleanMeta.internalNotes;
    delete cleanMeta.secret;
    cleanPayload.metadata = cleanMeta;
  }
  return cleanPayload;
}
__name(sanitizePayloadForPlayer, "sanitizePayloadForPlayer");
function computeLazySessionReminders(params) {
  const { userId, sessions, existingNotifications, nowMs = Date.now(), horizonHours = 24 } = params;
  const horizonMs = horizonHours * 60 * 60 * 1e3;
  const newReminders = [];
  for (const s of sessions) {
    if (s.status === "cancelled" || s.status === "done") {
      continue;
    }
    if (!s.scheduledAt) {
      continue;
    }
    const scheduledTime = new Date(s.scheduledAt).getTime();
    if (isNaN(scheduledTime)) {
      continue;
    }
    const diff = scheduledTime - nowMs;
    if (diff <= 0 || diff > horizonMs) {
      continue;
    }
    const userRsvp = s.rsvps?.find((r) => r.userId === userId);
    const hasConfirmed = userRsvp && (userRsvp.status === "yes" || userRsvp.status === "no");
    if (hasConfirmed) {
      continue;
    }
    const alreadyReminded = existingNotifications.some((n) => {
      if (n.userId !== userId || n.type !== "rsvp_reminder") return false;
      if (n.payload.targetId === s.id) return true;
      if (n.payload.metadata?.sessionId === s.id) return true;
      return false;
    });
    if (alreadyReminded) {
      continue;
    }
    const hoursLeft = Math.max(1, Math.round(diff / (60 * 60 * 1e3)));
    const item = {
      id: `remind_${s.id}_${userId}_${Math.floor(scheduledTime / (60 * 60 * 1e3))}`,
      userId,
      campaignId: s.campaignId,
      type: "rsvp_reminder",
      payload: {
        title: `\u06CC\u0627\u062F\u0622\u0648\u0631\u06CC \u062C\u0644\u0633\u0647: ${s.title}`,
        body: `\u062C\u0644\u0633\u0647 \u0634\u0645\u0627\u0631\u0647 ${s.number} \u062D\u062F\u0648\u062F ${hoursLeft} \u0633\u0627\u0639\u062A \u062F\u06CC\u06AF\u0631 \u0622\u063A\u0627\u0632 \u0645\u06CC\u200C\u0634\u0648\u062F. \u0644\u0637\u0641\u0627\u064B \u0648\u0636\u0639\u06CC\u062A \u062D\u0636\u0648\u0631 \u062E\u0648\u062F \u0631\u0627 \u0645\u0634\u062E\u0635 \u0641\u0631\u0645\u0627\u06CC\u06CC\u062F.`,
        campaignId: s.campaignId,
        targetType: "session",
        targetId: s.id,
        link: `/campaign/${s.campaignId}/sessions?session=${s.id}`,
        metadata: {
          sessionId: s.id,
          sessionNumber: s.number,
          scheduledAt: s.scheduledAt
        }
      },
      readAt: null,
      createdAt: nowMs,
      campaignTitle: void 0,
      isRead: false
    };
    newReminders.push(item);
  }
  return newReminders;
}
__name(computeLazySessionReminders, "computeLazySessionReminders");

// ../shared/rules/offlineEngine.ts
function getFieldLabelFa(field) {
  switch (field) {
    case "currentHp":
      return "\u062C\u0627\u0646 \u0641\u0639\u0644\u06CC (HP)";
    case "tempHp":
      return "\u062C\u0627\u0646 \u0645\u0648\u0642\u062A (Temp HP)";
    case "notes":
      return "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A\u200C\u0647\u0627\u06CC \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631";
    case "inventory":
      return "\u06A9\u0648\u0644\u0647\u200C\u067E\u0634\u062A\u06CC \u0648 \u062A\u062C\u0647\u06CC\u0632\u0627\u062A";
    case "customResources":
      return "\u0645\u0646\u0627\u0628\u0639 \u0648 \u0642\u0627\u0628\u0644\u06CC\u062A\u200C\u0647\u0627\u06CC \u0645\u0635\u0631\u0641\u06CC";
    default:
      return "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631";
  }
}
__name(getFieldLabelFa, "getFieldLabelFa");
function detectConflict(edit, serverEntity) {
  const serverRev = Number(serverEntity.revision) || 1;
  const baseRev = Number(edit.baseRevision) || 1;
  if (serverRev > baseRev) {
    const serverVal = serverEntity[edit.field];
    const clientVal = edit.value;
    const areValuesEqual = JSON.stringify(serverVal) === JSON.stringify(clientVal);
    if (!areValuesEqual) {
      return {
        id: `conflict-${edit.id}-${Date.now()}`,
        editId: edit.id,
        campaignId: edit.campaignId,
        participationId: edit.participationId,
        field: edit.field,
        fieldLabelFa: getFieldLabelFa(edit.field),
        clientValue: clientVal,
        serverValue: serverVal,
        baseRevision: baseRev,
        serverRevision: serverRev,
        timestamp: Date.now(),
        resolved: false
      };
    }
  }
  return null;
}
__name(detectConflict, "detectConflict");

// ../shared/permissions.ts
function can(role, action, context) {
  if (action.startsWith("platform:")) {
    const isPlatformAdmin = context?.platformRole === "admin";
    if (action === "platform:create_campaign") {
      if (isPlatformAdmin) return true;
      if (context?.allowCampaignCreation === "admin" || context?.allowCampaignCreation === false) {
        return false;
      }
      return true;
    }
    return isPlatformAdmin;
  }
  if (!role) {
    return false;
  }
  switch (action) {
    // Campaign management & members
    case "campaign:edit_settings":
      return role === "owner";
    case "campaign:transfer_ownership":
      return role === "owner";
    case "campaign:delete_archive":
      return role === "owner";
    case "campaign:invite_members":
      return role === "owner" || role === "co_dm";
    case "campaign:approve_reject_joins":
      return role === "owner" || role === "co_dm";
    case "campaign:change_member_roles":
      if (role === "owner") return true;
      if (role === "co_dm") {
        if (context?.targetRole === "owner" || context?.targetRole === "co_dm") return false;
        if (context?.newRole === "owner" || context?.newRole === "co_dm") return false;
        return true;
      }
      return false;
    case "campaign:kick_member":
      if (role === "owner") return true;
      if (role === "co_dm") {
        if (context?.targetRole === "owner" || context?.targetRole === "co_dm") return false;
        return true;
      }
      return false;
    case "campaign:leave":
      return role !== "owner";
    // Characters & play state
    case "character:view_sheet":
      return true;
    case "character:edit_core":
      return role === "owner" || role === "co_dm";
    case "character:edit_live_state":
      if (role === "owner" || role === "co_dm") return true;
      if (role === "player") return Boolean(context?.isOwn);
      return false;
    case "character:grant_rewards":
      return role === "owner" || role === "co_dm";
    case "character:manage_inventory":
      if (role === "owner" || role === "co_dm") return true;
      if (role === "player") return Boolean(context?.isOwn);
      return false;
    case "character:level_up":
      if (role === "owner" || role === "co_dm") return true;
      if (role === "player") return Boolean(context?.isOwn);
      return false;
    case "character:respec":
      return role === "owner" || role === "co_dm";
    case "character:delete":
      if (role === "owner" || role === "co_dm") return true;
      if (role === "player") return Boolean(context?.isOwn);
      return false;
    // Dice & rolls
    case "dice:roll_table":
      return role === "owner" || role === "co_dm" || role === "player";
    case "dice:roll_secret":
      return role === "owner" || role === "co_dm";
    case "dice:view_feed":
      return true;
    // All members can view feed; secret rolls are stripped at response level
    case "dice:clear_log":
      return role === "owner" || role === "co_dm";
    // DM tools & campaign content
    case "dm_tools:run_encounters":
      return role === "owner" || role === "co_dm";
    case "dm_tools:bestiary":
      return role === "owner" || role === "co_dm";
    case "dm_tools:items_loot":
      return role === "owner" || role === "co_dm";
    case "dm_tools:handouts_maps":
      return role === "owner" || role === "co_dm";
    case "dm_tools:quests":
      return role === "owner" || role === "co_dm";
    case "dm_tools:sessions_scheduling":
      return role === "owner" || role === "co_dm";
    case "dm_tools:recaps":
      return role === "owner" || role === "co_dm";
    case "dm_tools:campaign_notes":
      return role === "owner" || role === "co_dm";
    case "dm_tools:world_tools":
      return role === "owner" || role === "co_dm";
    default:
      return false;
  }
}
__name(can, "can");
function canChangeMemberRole(actorRole, targetCurrentRole, newRole) {
  if (!actorRole) {
    return { allowed: false, reason: "\u0639\u0636\u0648 \u06A9\u0645\u067E\u06CC\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F." };
  }
  if (targetCurrentRole === "owner") {
    return { allowed: false, reason: "\u0646\u0642\u0634 \u0645\u0627\u0644\u06A9 \u062A\u0646\u0647\u0627 \u0627\u0632 \u0637\u0631\u06CC\u0642 \u0627\u0646\u062A\u0642\u0627\u0644 \u0645\u0627\u0644\u06A9\u06CC\u062A \u06A9\u0645\u067E\u06CC\u0646 \u062A\u063A\u06CC\u06CC\u0631 \u0645\u06CC\u200C\u06CC\u0627\u0628\u062F." };
  }
  if (actorRole === "owner") {
    if (newRole === "owner") {
      return { allowed: false, reason: "\u0628\u0631\u0627\u06CC \u0627\u0646\u062A\u0635\u0627\u0628 \u0645\u0627\u0644\u06A9 \u062C\u062F\u06CC\u062F\u060C \u0627\u0632 \u06AF\u0632\u06CC\u0646\u0647 \xAB\u0627\u0646\u062A\u0642\u0627\u0644 \u0645\u0627\u0644\u06A9\u06CC\u062A \u06A9\u0645\u067E\u06CC\u0646\xBB \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u06A9\u0646\u06CC\u062F." };
    }
    return { allowed: true };
  }
  if (actorRole === "co_dm") {
    if (targetCurrentRole === "co_dm") {
      return { allowed: false, reason: "\u062F\u0633\u062A\u06CC\u0627\u0631 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0646\u0642\u0634 \u0633\u0627\u06CC\u0631 \u062F\u0633\u062A\u06CC\u0627\u0631\u0627\u0646 \u06CC\u0627 \u0645\u0627\u0644\u06A9 \u0631\u0627 \u062A\u063A\u06CC\u06CC\u0631 \u062F\u0647\u062F." };
    }
    if (newRole === "owner" || newRole === "co_dm") {
      return { allowed: false, reason: "\u0641\u0642\u0637 \u0645\u0627\u0644\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0639\u0636\u0648\u06CC \u0631\u0627 \u0628\u0647 \u0639\u0646\u0648\u0627\u0646 \u062F\u0633\u062A\u06CC\u0627\u0631 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0645\u0646\u0635\u0648\u0628 \u06A9\u0646\u062F." };
    }
    return { allowed: true };
  }
  return { allowed: false, reason: "\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u06CC\u0627 \u0645\u0627\u0644\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u062C\u0627\u0632 \u0628\u0647 \u062A\u063A\u06CC\u06CC\u0631 \u0646\u0642\u0634 \u0627\u0639\u0636\u0627 \u0647\u0633\u062A\u0646\u062F." };
}
__name(canChangeMemberRole, "canChangeMemberRole");
function canKickMember(actorRole, targetRole) {
  if (!actorRole) {
    return { allowed: false, reason: "\u0639\u0636\u0648 \u06A9\u0645\u067E\u06CC\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F." };
  }
  if (targetRole === "owner") {
    return { allowed: false, reason: "\u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646 \u0645\u0627\u0644\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0631\u0627 \u0627\u062E\u0631\u0627\u062C \u06A9\u0631\u062F." };
  }
  if (actorRole === "owner") {
    return { allowed: true };
  }
  if (actorRole === "co_dm") {
    if (targetRole === "co_dm") {
      return { allowed: false, reason: "\u062F\u0633\u062A\u06CC\u0627\u0631 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062F\u0633\u062A\u06CC\u0627\u0631 \u062F\u06CC\u06AF\u0631\u06CC \u0631\u0627 \u0627\u062E\u0631\u0627\u062C \u06A9\u0646\u062F." };
    }
    return { allowed: true };
  }
  return { allowed: false, reason: "\u0641\u0642\u0637 \u0645\u0627\u0644\u06A9 \u06CC\u0627 \u062F\u0633\u062A\u06CC\u0627\u0631 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u0627\u062E\u0631\u0627\u062C \u0627\u0639\u0636\u0627 \u0647\u0633\u062A\u0646\u062F." };
}
__name(canKickMember, "canKickMember");
function canCreateInviteForRole(actorRole, targetInviteRole) {
  if (!actorRole || actorRole !== "owner" && actorRole !== "co_dm") {
    return { allowed: false, reason: "\u0641\u0642\u0637 \u0645\u0627\u0644\u06A9 \u06CC\u0627 \u062F\u0633\u062A\u06CC\u0627\u0631 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u0633\u0627\u062E\u062A \u06A9\u062F \u062F\u0639\u0648\u062A \u0647\u0633\u062A\u0646\u062F." };
  }
  if (targetInviteRole === "owner" || targetInviteRole === "co_dm") {
    return { allowed: false, reason: "\u06A9\u062F \u062F\u0639\u0648\u062A \u0647\u0631\u06AF\u0632 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0646\u0642\u0634 \u0645\u0627\u0644\u06A9 \u06CC\u0627 \u062F\u0633\u062A\u06CC\u0627\u0631 DM \u0631\u0627 \u0627\u0639\u0637\u0627 \u06A9\u0646\u062F." };
  }
  return { allowed: true };
}
__name(canCreateInviteForRole, "canCreateInviteForRole");
function filterDiceFeedForRole(rolls, viewerRole, viewerUserId) {
  if (!Array.isArray(rolls)) return [];
  const isDm = viewerRole === "owner" || viewerRole === "co_dm";
  if (isDm) return rolls;
  return rolls.filter((r) => {
    if (r.visibility === "dm_only") {
      return r.userId === viewerUserId;
    }
    return true;
  });
}
__name(filterDiceFeedForRole, "filterDiceFeedForRole");

// api/[[route]].ts
var COMMON_PASSWORDS = /* @__PURE__ */ new Set([
  "12345678",
  "123456789",
  "1234567890",
  "1234567",
  "password",
  "password1",
  "password123",
  "qwertyui",
  "qwertyuiop",
  "asdfghjk",
  "asdfghjkl",
  "zxcvbnm",
  "11111111",
  "00000000",
  "123123123",
  "admin123",
  "administrator",
  "welcome1",
  "welcome123",
  "iloveyou",
  "sunshine",
  "princess",
  "football",
  "monkey123",
  "shadow123",
  "dragon123",
  "master123",
  "zorvania",
  "zorvania123",
  "letmein1",
  "trustno1",
  "starwars",
  "superman",
  "michael1",
  "jessica1",
  "charlie1",
  "whatever",
  "donald123",
  "killer123",
  "hunter12",
  "batman123",
  "superman1",
  "pass1234",
  "secret12",
  "secret123",
  "computer1",
  "internet1",
  "freedom1",
  "mercedes1",
  "server123",
  "root1234",
  "oracle123",
  "database1",
  "gamemaster",
  "dungeonmaster",
  "dungeon1"
]);
function base64UrlEncode(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64ToBytes(b64) {
  const standard = b64.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard + "=".repeat((4 - standard.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(base64ToBytes, "base64ToBytes");
async function sha256Hex(message) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(message));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
async function hashIp(ip, salt) {
  return sha256Hex(`${ip}::${salt}`);
}
__name(hashIp, "hashIp");
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
    // 32 bytes
  );
  const saltB64 = base64UrlEncode(salt);
  const hashB64 = base64UrlEncode(derivedBits);
  return `pbkdf2$sha256$100000$${saltB64}$${hashB64}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, storedHashRecord) {
  try {
    const parts = storedHashRecord.split("$");
    if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
      return { valid: false, needsRehash: false };
    }
    const iterations = parseInt(parts[2], 10);
    const salt = base64ToBytes(parts[3]);
    const expectedHashBytes = base64ToBytes(parts[4]);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      expectedHashBytes.length * 8
    );
    const derivedBytes = new Uint8Array(derivedBits);
    if (derivedBytes.length !== expectedHashBytes.length) {
      return { valid: false, needsRehash: false };
    }
    let diff = 0;
    for (let i = 0; i < derivedBytes.length; i++) {
      diff |= derivedBytes[i] ^ expectedHashBytes[i];
    }
    const valid = diff === 0;
    const needsRehash = valid && iterations !== 1e5;
    return { valid, needsRehash };
  } catch {
    return { valid: false, needsRehash: false };
  }
}
__name(verifyPassword, "verifyPassword");
async function dummyHashWork() {
  try {
    const salt = new Uint8Array(16);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode("dummy-password"), { name: "PBKDF2" }, false, ["deriveBits"]);
    await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 1e5, hash: "SHA-256" }, keyMaterial, 256);
  } catch {
  }
}
__name(dummyHashWork, "dummyHashWork");
function generateRandomToken(bytesCount = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(bytesCount));
  return base64UrlEncode(bytes);
}
__name(generateRandomToken, "generateRandomToken");
var SESSION_COOKIE_NAME = "__Host-zsession";
var SLIDING_EXPIRY_MS = 14 * 24 * 60 * 60 * 1e3;
var ABSOLUTE_MAX_MS = 60 * 24 * 60 * 60 * 1e3;
var SLIDING_EXTEND_THRESHOLD_MS = 24 * 60 * 60 * 1e3;
function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match2 = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match2 ? decodeURIComponent(match2[2]) : null;
}
__name(parseCookie, "parseCookie");
function makeSessionCookie(token, maxAgeSeconds) {
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}
__name(makeSessionCookie, "makeSessionCookie");
function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
__name(clearSessionCookie, "clearSessionCookie");
function validatePassword(password, email, displayName) {
  if (!password || password.length < 8) {
    return "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0627\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06F8 \u0646\u0648\u06CC\u0633\u0647 (\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631) \u0628\u0627\u0634\u062F.";
  }
  if (password.length > 128) {
    return "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0646\u0628\u0627\u06CC\u062F \u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 \u06F1\u06F2\u06F8 \u0646\u0648\u06CC\u0633\u0647 \u0628\u0627\u0634\u062F.";
  }
  const cleanPass = password.toLowerCase().trim();
  if (cleanPass === email.toLowerCase().trim()) {
    return "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0628\u0627 \u0627\u06CC\u0645\u06CC\u0644 \u06CC\u06A9\u0633\u0627\u0646 \u0628\u0627\u0634\u062F.";
  }
  if (displayName && cleanPass === displayName.toLowerCase().trim()) {
    return "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0628\u0627 \u0646\u0627\u0645 \u0646\u0645\u0627\u06CC\u0634\u06CC \u06CC\u06A9\u0633\u0627\u0646 \u0628\u0627\u0634\u062F.";
  }
  if (COMMON_PASSWORDS.has(cleanPass)) {
    return "\u0627\u06CC\u0646 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0633\u06CC\u0627\u0631 \u0631\u0627\u06CC\u062C \u0648 \u0646\u0627\u0627\u0645\u0646 \u0627\u0633\u062A\u061B \u0644\u0637\u0641\u0627\u064B \u0631\u0645\u0632 \u0642\u0648\u06CC\u200C\u062A\u0631\u06CC \u0628\u0631\u06AF\u0632\u06CC\u0646\u06CC\u062F.";
  }
  return null;
}
__name(validatePassword, "validatePassword");
var SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'self'; font-src 'self' data: https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'",
  "Cache-Control": "no-store"
};
var onRequest = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace(/^\/api/, "");
  const ipHashSalt = env.IP_HASH_SALT || "zorvania-ip-salt-default-secret";
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "127.0.0.1";
  const clientIpHash = await hashIp(clientIp, ipHashSalt);
  const userAgent = request.headers.get("User-Agent") || "unknown";
  const rawDmEmails = env.DM_EMAILS || "dm@zorvania.ir";
  const dmEmails = rawDmEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const registrationMode = env.REGISTRATION_MODE || "invite";
  const json = /* @__PURE__ */ __name((data, status = 200, extraHeaders = {}) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...SECURITY_HEADERS,
        ...extraHeaders
      }
    });
  }, "json");
  const error = /* @__PURE__ */ __name((msg, status = 400, extraHeaders = {}) => {
    return json({ error: msg }, status, extraHeaders);
  }, "error");
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const xRequestedWith = request.headers.get("X-Requested-With");
    if (!xRequestedWith || xRequestedWith.toLowerCase() !== "zorvania") {
      return error("\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A (CSRF Header \u0645\u0641\u0642\u0648\u062F \u0627\u0633\u062A).", 403);
    }
    const origin = request.headers.get("Origin");
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== url.host) {
          return error("\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0627\u0632 \u0645\u0628\u062F\u0623 \u063A\u06CC\u0631\u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
        }
      } catch {
        return error("\u0645\u0628\u062F\u0623 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.", 403);
      }
    }
  }
  const now = Date.now();
  if (Math.random() < 0.05 && env.DB) {
    context.waitUntil?.(
      (async () => {
        try {
          const oneDayAgo = now - 24 * 60 * 60 * 1e3;
          await env.DB.prepare("DELETE FROM login_attempts WHERE created_at < ?").bind(oneDayAgo).run();
        } catch {
        }
      })()
    );
  }
  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
  let currentSession = null;
  let currentUser = null;
  let setCookieHeader = null;
  if (sessionToken && env.DB) {
    const tokenHash = await sha256Hex(sessionToken);
    const sessionRes = await env.DB.prepare(
      `SELECT s.*, u.id as u_id, u.email as u_email, u.display_name as u_display_name, 
              u.password_hash as u_password_hash, u.role as u_role, u.platform_role as u_platform_role, u.status as u_status, 
              u.must_change_password as u_must_change_password, u.created_at as u_created_at, 
              u.last_login_at as u_last_login_at, u.deleted_at as u_deleted_at, 
              u.active_character_id as u_active_character_id, u.avatar_url as u_avatar_url
       FROM auth_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND s.absolute_expires_at > ?
         AND u.status = 'active' AND u.deleted_at IS NULL`
    ).bind(tokenHash, now, now).first();
    if (sessionRes) {
      currentSession = {
        id: sessionRes.id,
        user_id: sessionRes.user_id,
        token_hash: sessionRes.token_hash,
        created_at: sessionRes.created_at,
        last_seen_at: sessionRes.last_seen_at,
        expires_at: sessionRes.expires_at,
        absolute_expires_at: sessionRes.absolute_expires_at,
        user_agent: sessionRes.user_agent,
        ip_hash: sessionRes.ip_hash,
        revoked_at: sessionRes.revoked_at
      };
      currentUser = {
        id: sessionRes.u_id,
        email: sessionRes.u_email,
        display_name: sessionRes.u_display_name,
        password_hash: sessionRes.u_password_hash,
        role: sessionRes.u_role,
        platform_role: sessionRes.u_platform_role || (dmEmails.includes(sessionRes.u_email) ? "admin" : "user"),
        status: sessionRes.u_status,
        must_change_password: sessionRes.u_must_change_password,
        created_at: sessionRes.u_created_at,
        last_login_at: sessionRes.u_last_login_at,
        deleted_at: sessionRes.u_deleted_at,
        active_character_id: sessionRes.u_active_character_id,
        avatar_url: sessionRes.u_avatar_url
      };
      if (now - currentSession.last_seen_at > SLIDING_EXTEND_THRESHOLD_MS) {
        const nextExpires = Math.min(now + SLIDING_EXPIRY_MS, currentSession.absolute_expires_at);
        await env.DB.prepare(
          "UPDATE auth_sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?"
        ).bind(now, nextExpires, currentSession.id).run();
        const remainingSeconds = Math.max(1, Math.floor((nextExpires - now) / 1e3));
        setCookieHeader = makeSessionCookie(sessionToken, remainingSeconds);
      }
    }
  }
  const audit = /* @__PURE__ */ __name(async (action, targetId = null, meta = null) => {
    if (!env.DB) return;
    try {
      const auditId = `audit-${Date.now()}-${generateRandomToken(4)}`;
      await env.DB.prepare(
        "INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(auditId, currentUser?.id || null, action, targetId, meta ? JSON.stringify(meta) : null, Date.now()).run();
    } catch {
    }
  }, "audit");
  const getCampaignMemberUserIds = /* @__PURE__ */ __name(async (campaignId, excludeUserId) => {
    if (!env.DB) return [];
    try {
      const rows = await env.DB.prepare(
        'SELECT user_id FROM campaign_members WHERE campaign_id = ? AND status = "active"'
      ).bind(campaignId).all();
      const ids = (rows.results || []).map((r) => String(r.user_id));
      return excludeUserId ? ids.filter((id) => id !== excludeUserId) : ids;
    } catch {
      return [];
    }
  }, "getCampaignMemberUserIds");
  const getCampaignDmUserIds = /* @__PURE__ */ __name(async (campaignId, excludeUserId) => {
    if (!env.DB) return [];
    try {
      const rows = await env.DB.prepare(
        'SELECT user_id FROM campaign_members WHERE campaign_id = ? AND status = "active" AND role IN ("owner", "co_dm")'
      ).bind(campaignId).all();
      const ids = (rows.results || []).map((r) => String(r.user_id));
      return excludeUserId ? ids.filter((id) => id !== excludeUserId) : ids;
    } catch {
      return [];
    }
  }, "getCampaignDmUserIds");
  const notify = /* @__PURE__ */ __name(async (userIds, type, payload, campaignId) => {
    if (!env.DB) return;
    const targetUserIds = Array.isArray(userIds) ? userIds : [userIds];
    if (targetUserIds.length === 0) return;
    const campId = campaignId !== void 0 ? campaignId : payload.campaignId || null;
    const timestamp = Date.now();
    for (const uid of targetUserIds) {
      if (!uid) continue;
      try {
        const prefRow = await env.DB.prepare(
          "SELECT types, push_enabled FROM notification_prefs WHERE user_id = ? AND (campaign_id = ? OR campaign_id IS NULL) ORDER BY campaign_id DESC LIMIT 1"
        ).bind(uid, campId).first();
        let isMuted = false;
        if (prefRow) {
          try {
            const typesObj = JSON.parse(prefRow.types || "{}");
            if (typesObj[type] === false) {
              isMuted = true;
            }
          } catch {
          }
        }
        if (isMuted) continue;
        let isDm = false;
        if (campId) {
          const mem = await env.DB.prepare(
            "SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ?"
          ).bind(campId, uid).first();
          isDm = mem?.role === "owner" || mem?.role === "co_dm";
        }
        const sanitized = sanitizePayloadForPlayer(payload, isDm);
        const notifId = `notif-${timestamp}-${generateRandomToken(4)}`;
        await env.DB.prepare(
          "INSERT INTO notifications (id, user_id, campaign_id, type, payload, read_at, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)"
        ).bind(notifId, uid, campId, type, JSON.stringify(sanitized), timestamp).run();
      } catch (err) {
        console.error("Error in notify helper:", err);
      }
    }
  }, "notify");
  const checkRateLimit = /* @__PURE__ */ __name(async (key, maxAttempts, windowMs) => {
    if (!env.DB) return true;
    const windowStart = Date.now() - windowMs;
    const countRow = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM login_attempts WHERE key = ? AND success = 0 AND created_at > ?"
    ).bind(key, windowStart).first();
    return (countRow?.count || 0) < maxAttempts;
  }, "checkRateLimit");
  const recordAttempt = /* @__PURE__ */ __name(async (key, success) => {
    if (!env.DB) return;
    try {
      await env.DB.prepare(
        "INSERT INTO login_attempts (key, created_at, success) VALUES (?, ?, ?)"
      ).bind(key, Date.now(), success ? 1 : 0).run();
    } catch {
    }
  }, "recordAttempt");
  if (path === "/auth/register" && method === "POST") {
    if (!env.DB) return error("\u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A.", 500);
    const canRegister = await checkRateLimit(`reg_ip:${clientIpHash}`, 10, 60 * 60 * 1e3);
    if (!canRegister) {
      return error("\u062A\u0639\u062F\u0627\u062F \u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0627\u0632 \u0627\u06CC\u0646 \u0622\u062F\u0631\u0633 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0633\u0627\u0639\u062A\u06CC \u062F\u06CC\u06AF\u0631 \u0627\u0645\u062A\u062D\u0627\u0646 \u06A9\u0646\u06CC\u062F.", 429, { "Retry-After": "3600" });
    }
    try {
      const body = await request.json();
      const rawEmail = String(body.email || "").toLowerCase().trim();
      const rawPassword = String(body.password || "");
      const rawDisplayName = String(body.displayName || "").trim();
      const inviteCode = String(body.inviteCode || "").trim();
      if (!rawEmail || !rawEmail.includes("@")) {
        return error("\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644 \u0645\u0639\u062A\u0628\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
      }
      if (!rawDisplayName || rawDisplayName.length < 2 || rawDisplayName.length > 40) {
        return error("\u0646\u0627\u0645 \u0646\u0645\u0627\u06CC\u0634\u06CC \u0628\u0627\u06CC\u062F \u0628\u06CC\u0646 \u06F2 \u062A\u0627 \u06F4\u06F0 \u0646\u0648\u06CC\u0633\u0647 \u0628\u0627\u0634\u062F.");
      }
      const passError = validatePassword(rawPassword, rawEmail, rawDisplayName);
      if (passError) return error(passError);
      const isDmEmail = dmEmails.includes(rawEmail);
      let assignedCharacterId = null;
      if (!isDmEmail && registrationMode !== "open") {
        if (!inviteCode) {
          return error("\u0628\u0631\u0627\u06CC \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0628\u0647 \u06A9\u062F \u062F\u0639\u0648\u062A \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0627\u0632 \u0627\u0633\u062A.");
        }
        const inviteHash = await sha256Hex(inviteCode);
        const inviteRow = await env.DB.prepare(
          "SELECT * FROM invites WHERE code_hash = ? AND revoked_at IS NULL"
        ).bind(inviteHash).first();
        if (!inviteRow) {
          return error("\u06A9\u062F \u062F\u0639\u0648\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
        }
        if (inviteRow.expires_at > 0 && inviteRow.expires_at < now) {
          return error("\u0627\u06CC\u0646 \u06A9\u062F \u062F\u0639\u0648\u062A \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.");
        }
        if (inviteRow.used_count >= inviteRow.max_uses) {
          return error("\u0627\u06CC\u0646 \u06A9\u062F \u062F\u0639\u0648\u062A \u0642\u0628\u0644\u0627\u064B \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A.");
        }
        const updateRes = await env.DB.prepare(
          "UPDATE invites SET used_count = used_count + 1 WHERE id = ? AND used_count < max_uses AND revoked_at IS NULL"
        ).bind(inviteRow.id).run();
        if (!updateRes.meta?.changes && updateRes.changes === 0) {
          return error("\u06A9\u062F \u062F\u0639\u0648\u062A \u0647\u0645\u200C\u0627\u06A9\u0646\u0648\u0646 \u0628\u0647 \u062D\u062F\u0627\u06A9\u062B\u0631 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0631\u0633\u06CC\u062F\u0647 \u0627\u0633\u062A.");
        }
        if (inviteRow.assign_character_id) {
          assignedCharacterId = inviteRow.assign_character_id;
        }
      }
      const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(rawEmail).first();
      if (existing) {
        return error("\u06A9\u0627\u0631\u0628\u0631\u06CC \u0628\u0627 \u0627\u06CC\u0646 \u0627\u06CC\u0645\u06CC\u0644 \u067E\u06CC\u0634\u200C\u062A\u0631 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u06A9\u0631\u062F\u0647 \u0627\u0633\u062A.", 409);
      }
      const userId = `user-${Date.now()}-${generateRandomToken(4)}`;
      const passwordHash = await hashPassword(rawPassword);
      const userRole = isDmEmail ? "dm" : "player";
      await env.DB.prepare(
        `INSERT INTO users (id, email, display_name, password_hash, role, status, must_change_password, created_at, last_login_at, active_character_id)
         VALUES (?, ?, ?, ?, ?, 'active', 0, ?, ?, ?)`
      ).bind(userId, rawEmail, rawDisplayName, passwordHash, userRole, now, now, assignedCharacterId).run();
      if (assignedCharacterId) {
        await env.DB.prepare(
          "UPDATE characters SET owner_id = ? WHERE id = ?"
        ).bind(userId, assignedCharacterId).run();
      }
      const rawToken = generateRandomToken(32);
      const tokenHash = await sha256Hex(rawToken);
      const sessionId = `sess-${Date.now()}-${generateRandomToken(4)}`;
      const expiresAt = now + SLIDING_EXPIRY_MS;
      const absoluteExpiresAt = now + ABSOLUTE_MAX_MS;
      await env.DB.prepare(
        `INSERT INTO auth_sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(sessionId, userId, tokenHash, now, now, expiresAt, absoluteExpiresAt, userAgent.substring(0, 200), clientIpHash).run();
      await audit("register", userId, { email: rawEmail, role: userRole });
      const cookieStr = makeSessionCookie(rawToken, Math.floor(SLIDING_EXPIRY_MS / 1e3));
      return json({
        user: {
          id: userId,
          email: rawEmail,
          name: rawDisplayName,
          displayName: rawDisplayName,
          role: userRole,
          status: "active",
          mustChangePassword: false,
          activeCharacterId: assignedCharacterId
        }
      }, 201, { "Set-Cookie": cookieStr });
    } catch (e) {
      return error(e.message || "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0646\u0627\u0645.", 500);
    }
  }
  if (path === "/auth/login" && method === "POST") {
    if (!env.DB) return error("\u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A.", 500);
    try {
      const body = await request.json();
      const rawEmail = String(body.email || "").toLowerCase().trim();
      const rawPassword = String(body.password || "");
      const emailKey = `login_email:${await sha256Hex(rawEmail)}`;
      const ipKey = `login_ip:${clientIpHash}`;
      const emailAllowed = await checkRateLimit(emailKey, 5, 15 * 60 * 1e3);
      const ipAllowed = await checkRateLimit(ipKey, 20, 15 * 60 * 1e3);
      if (!emailAllowed || !ipAllowed) {
        return error("\u062A\u0639\u062F\u0627\u062F \u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u06F1\u06F5 \u062F\u0642\u06CC\u0642\u0647 \u062F\u06CC\u06AF\u0631 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F.", 429, { "Retry-After": "900" });
      }
      const userRow = await env.DB.prepare(
        "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL"
      ).bind(rawEmail).first();
      if (!userRow || userRow.status === "disabled") {
        await dummyHashWork();
        await recordAttempt(emailKey, false);
        await recordAttempt(ipKey, false);
        return error("\u0627\u06CC\u0645\u06CC\u0644 \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A.", 401);
      }
      const { valid, needsRehash } = await verifyPassword(rawPassword, userRow.password_hash);
      if (!valid) {
        await recordAttempt(emailKey, false);
        await recordAttempt(ipKey, false);
        return error("\u0627\u06CC\u0645\u06CC\u0644 \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A.", 401);
      }
      if (needsRehash) {
        const newHash = await hashPassword(rawPassword);
        await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(newHash, userRow.id).run();
      }
      await recordAttempt(emailKey, true);
      await recordAttempt(ipKey, true);
      await env.DB.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").bind(now, userRow.id).run();
      const rawToken = generateRandomToken(32);
      const tokenHash = await sha256Hex(rawToken);
      const sessionId = `sess-${Date.now()}-${generateRandomToken(4)}`;
      const expiresAt = now + SLIDING_EXPIRY_MS;
      const absoluteExpiresAt = now + ABSOLUTE_MAX_MS;
      await env.DB.prepare(
        `INSERT INTO auth_sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(sessionId, userRow.id, tokenHash, now, now, expiresAt, absoluteExpiresAt, userAgent.substring(0, 200), clientIpHash).run();
      await audit("login", userRow.id);
      const cookieStr = makeSessionCookie(rawToken, Math.floor(SLIDING_EXPIRY_MS / 1e3));
      return json({
        user: {
          id: userRow.id,
          email: userRow.email,
          name: userRow.display_name,
          displayName: userRow.display_name,
          role: userRow.role,
          status: userRow.status,
          mustChangePassword: userRow.must_change_password === 1,
          activeCharacterId: userRow.active_character_id
        }
      }, 200, { "Set-Cookie": cookieStr });
    } catch (e) {
      return error(e.message || "\u062E\u0637\u0627 \u062F\u0631 \u0648\u0631\u0648\u062F.", 500);
    }
  }
  if (path === "/auth/logout" && method === "POST") {
    if (currentSession && env.DB) {
      await env.DB.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE id = ?").bind(now, currentSession.id).run();
      await audit("logout", currentUser?.id);
    }
    return json({ message: "\u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062E\u0627\u0631\u062C \u0634\u062F\u06CC\u062F." }, 200, { "Set-Cookie": clearSessionCookie() });
  }
  if (path === "/auth/logout-all" && method === "POST") {
    if (!currentUser) return error("\u0627\u0628\u062A\u062F\u0627 \u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F.", 401);
    await env.DB.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?").bind(now, currentUser.id).run();
    await audit("logout-all", currentUser.id);
    return json({ message: "\u062A\u0645\u0627\u0645 \u0646\u0634\u0633\u062A\u200C\u0647\u0627\u06CC \u0641\u0639\u0627\u0644 \u0634\u0645\u0627 \u062E\u0627\u062A\u0645\u0647 \u06CC\u0627\u0641\u062A\u0646\u062F." }, 200, { "Set-Cookie": clearSessionCookie() });
  }
  if (path === "/auth/me" && method === "GET") {
    if (!currentUser) {
      return json({ user: null, activeCharacterId: null, mustChangePassword: false }, 200);
    }
    return json({
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.display_name,
        displayName: currentUser.display_name,
        role: currentUser.role,
        platformRole: currentUser.platform_role || (dmEmails.includes(currentUser.email) ? "admin" : "user"),
        status: currentUser.status,
        mustChangePassword: currentUser.must_change_password === 1,
        activeCharacterId: currentUser.active_character_id,
        avatarUrl: currentUser.avatar_url
      },
      activeCharacterId: currentUser.active_character_id,
      mustChangePassword: currentUser.must_change_password === 1
    }, 200, setCookieHeader ? { "Set-Cookie": setCookieHeader } : {});
  }
  if (path === "/auth/reset" && method === "POST") {
    if (!env.DB) return error("\u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A.", 500);
    const canReset = await checkRateLimit(`reset_ip:${clientIpHash}`, 10, 60 * 60 * 1e3);
    if (!canReset) {
      return error("\u062A\u0639\u062F\u0627\u062F \u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u062A\u063A\u06CC\u06CC\u0631 \u0631\u0645\u0632 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 429, { "Retry-After": "3600" });
    }
    try {
      const body = await request.json();
      const token = String(body.token || "").trim();
      const newPassword = String(body.newPassword || "");
      if (!token) return error("\u062A\u0648\u06A9\u0646 \u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u0631\u0645\u0632 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
      const tokenHash = await sha256Hex(token);
      const resetRow = await env.DB.prepare(
        "SELECT * FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?"
      ).bind(tokenHash, now).first();
      if (!resetRow) {
        return error("\u0644\u06CC\u0646\u06A9 \u062A\u063A\u06CC\u06CC\u0631 \u0631\u0645\u0632 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u06CC\u0627 \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.", 400);
      }
      const targetUser = await env.DB.prepare(
        "SELECT * FROM users WHERE id = ? AND deleted_at IS NULL"
      ).bind(resetRow.user_id).first();
      if (!targetUser || targetUser.status === "disabled") {
        return error("\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u06CC\u0627 \u062D\u0630\u0641 \u0634\u062F\u0647 \u0627\u0633\u062A.", 400);
      }
      const passErr = validatePassword(newPassword, targetUser.email, targetUser.display_name);
      if (passErr) return error(passErr);
      const newHash = await hashPassword(newPassword);
      await env.DB.prepare("UPDATE password_resets SET used_at = ? WHERE id = ?").bind(now, resetRow.id).run();
      await env.DB.prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?").bind(newHash, targetUser.id).run();
      await env.DB.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?").bind(now, targetUser.id).run();
      const rawToken = generateRandomToken(32);
      const newSessionTokenHash = await sha256Hex(rawToken);
      const sessionId = `sess-${Date.now()}-${generateRandomToken(4)}`;
      const expiresAt = now + SLIDING_EXPIRY_MS;
      const absoluteExpiresAt = now + ABSOLUTE_MAX_MS;
      await env.DB.prepare(
        `INSERT INTO auth_sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(sessionId, targetUser.id, newSessionTokenHash, now, now, expiresAt, absoluteExpiresAt, userAgent.substring(0, 200), clientIpHash).run();
      await audit("password-reset", targetUser.id);
      const cookieStr = makeSessionCookie(rawToken, Math.floor(SLIDING_EXPIRY_MS / 1e3));
      return json({
        message: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F.",
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.display_name,
          displayName: targetUser.display_name,
          role: targetUser.role,
          status: targetUser.status,
          mustChangePassword: false,
          activeCharacterId: targetUser.active_character_id
        }
      }, 200, { "Set-Cookie": cookieStr });
    } catch (e) {
      return error(e.message || "\u062E\u0637\u0627 \u062F\u0631 \u062A\u063A\u06CC\u06CC\u0631 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631.", 500);
    }
  }
  if (!currentUser) {
    return error("\u0646\u0634\u0633\u062A \u0634\u0645\u0627 \u062A\u0645\u0627\u0645 \u0634\u062F\u0647 \u06CC\u0627 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F.", 401);
  }
  const actor = currentUser;
  const isPlatformAdmin = /* @__PURE__ */ __name(() => {
    return actor.platform_role === "admin" || actor.role === "admin" || dmEmails.includes(actor.email.toLowerCase());
  }, "isPlatformAdmin");
  const parseBlob = /* @__PURE__ */ __name((value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }, "parseBlob");
  const mapCampaignRow = /* @__PURE__ */ __name((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || "",
    coverMediaId: r.cover_media_id || null,
    tone: r.tone || void 0,
    status: r.status,
    ownerId: r.owner_id,
    sourcePackId: r.source_pack_id || null,
    settings: parseBlob(r.settings, {}),
    wizardState: r.wizard_state ? parseBlob(r.wizard_state, null) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    myRole: r.my_role || void 0,
    memberCount: r.member_count != null ? Number(r.member_count) : void 0,
    characterCount: r.character_count != null ? Number(r.character_count) : void 0,
    membershipStatus: r.membership_status || "active",
    isReadOnly: r.status === "archived" || r.membership_status === "left" || r.membership_status === "removed"
  }), "mapCampaignRow");
  const getMembershipRole = /* @__PURE__ */ __name(async (campId, userId) => {
    const row = await env.DB.prepare(
      "SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND status = 'active'"
    ).bind(campId, userId).first();
    return row?.role || null;
  }, "getMembershipRole");
  const loadCharacterBlobs = /* @__PURE__ */ __name(async () => {
    const res = actor.role === "dm" ? await env.DB.prepare("SELECT id, data, revision FROM characters").all() : await env.DB.prepare("SELECT id, data, revision FROM characters WHERE owner_id = ?").bind(actor.id).all();
    return res.results || [];
  }, "loadCharacterBlobs");
  const saveCharacterBlob = /* @__PURE__ */ __name(async (id, blob, nextRevision) => {
    blob.revision = nextRevision;
    blob.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare("UPDATE characters SET data = ?, revision = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(blob), nextRevision, now, id).run();
    return blob;
  }, "saveCharacterBlob");
  if (path === "/home" && method === "GET") {
    const memRes = await env.DB.prepare(
      `SELECT c.*, m.role AS my_role, m.status AS membership_status,
              (SELECT COUNT(*) FROM campaign_members cm WHERE cm.campaign_id = c.id AND cm.status = 'active') AS member_count,
              (SELECT COUNT(*) FROM character_participations cp WHERE cp.campaign_id = c.id AND cp.status = 'active') AS character_count
         FROM campaign_members m
         JOIN campaigns c ON c.id = m.campaign_id
        WHERE m.user_id = ? AND c.deleted_at IS NULL
        ORDER BY c.updated_at DESC`
    ).bind(actor.id).all();
    const myCampaigns = (memRes.results || []).map(mapCampaignRow);
    for (const c of myCampaigns) {
      try {
        const nextSessRow = await env.DB.prepare(
          `SELECT id, number, title, scheduled_at FROM sessions
            WHERE campaign_id = ? AND status IN ('planned', 'confirmed') AND scheduled_at IS NOT NULL
            ORDER BY scheduled_at ASC LIMIT 1`
        ).bind(c.id).first();
        if (nextSessRow && nextSessRow.scheduled_at) {
          c.nextSession = {
            id: nextSessRow.id,
            number: nextSessRow.number,
            title: nextSessRow.title,
            scheduledAt: nextSessRow.scheduled_at
          };
        } else {
          c.nextSession = null;
        }
      } catch {
        c.nextSession = null;
      }
      try {
        const unreadRow = await env.DB.prepare(
          `SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND campaign_id = ? AND read_at IS NULL`
        ).bind(actor.id, c.id).first();
        c.unreadCount = Number(unreadRow?.cnt || 0);
      } catch {
        c.unreadCount = 0;
      }
      try {
        const finalPartRow = await env.DB.prepare(
          `SELECT cp.id, cp.character_id, cp.level, cp.class_name, cp.subclass_name, cp.status, cp.sessions_attended, ch.name as char_name
             FROM character_participations cp
             JOIN characters ch ON ch.id = cp.character_id
            WHERE cp.campaign_id = ? AND ch.owner_id = ?
            ORDER BY cp.updated_at DESC LIMIT 1`
        ).bind(c.id, actor.id).first();
        if (finalPartRow) {
          c.finalCharacterState = {
            participationId: finalPartRow.id,
            characterId: finalPartRow.character_id,
            characterName: finalPartRow.char_name,
            className: finalPartRow.class_name,
            subclassName: finalPartRow.subclass_name || void 0,
            level: finalPartRow.level,
            status: finalPartRow.status,
            sessionsAttended: finalPartRow.sessions_attended || 0
          };
        } else {
          c.finalCharacterState = null;
        }
      } catch {
        c.finalCharacterState = null;
      }
    }
    const charRes = await env.DB.prepare("SELECT id, data FROM characters WHERE owner_id = ?").bind(actor.id).all();
    const myCharacters = [];
    const charIds = [];
    for (const row of charRes.results || []) {
      const parsed = parseBlob(row.data, null);
      if (parsed && parsed.status !== "archived") {
        myCharacters.push(parsed);
        charIds.push(row.id);
      }
    }
    if (charIds.length > 0) {
      const placeholders = charIds.map(() => "?").join(",");
      const partRes = await env.DB.prepare(
        `SELECT id, character_id, campaign_id, status, level, sessions_attended, class_name FROM character_participations WHERE character_id IN (${placeholders})`
      ).bind(...charIds).all();
      const byChar = {};
      for (const p of partRes.results || []) {
        (byChar[p.character_id] = byChar[p.character_id] || []).push({
          id: p.id,
          characterId: p.character_id,
          campaignId: p.campaign_id,
          status: p.status,
          level: p.level,
          sessionsAttended: p.sessions_attended || 0,
          className: p.class_name
        });
      }
      for (const c of myCharacters) {
        c.participations = byChar[c.id] || [];
        const parts = c.participations;
        const campIds = new Set(parts.map((p) => p.campaignId).filter(Boolean));
        c.campaignsCount = campIds.size;
        c.sessionsAttendedTotal = parts.reduce((acc, p) => acc + (p.sessionsAttended || 0), 0);
        c.highestLevel = parts.reduce((max, p) => Math.max(max, p.level || 1), 1);
      }
    }
    const isGlobalDm = actor.role === "dm";
    const myDmIds = new Set(
      myCampaigns.filter((c) => c.myRole === "owner" || c.myRole === "co_dm").map((c) => c.id)
    );
    const inviteRes = await env.DB.prepare(
      "SELECT * FROM campaign_invites WHERE revoked_at IS NULL ORDER BY created_at DESC"
    ).all();
    const pendingInvites = (inviteRes.results || []).filter((i) => i.expires_at > now && i.used_count < i.max_uses && (isGlobalDm || myDmIds.has(i.campaign_id))).map((i) => ({
      id: i.id,
      campaignId: i.campaign_id,
      role: i.role,
      label: i.label,
      createdBy: i.created_by,
      createdAt: i.created_at,
      expiresAt: i.expires_at,
      maxUses: i.max_uses,
      usedCount: i.used_count,
      assignParticipationId: i.assign_participation_id,
      revokedAt: i.revoked_at
    }));
    const apprRes = await env.DB.prepare(
      `SELECT p.id, p.character_id, p.campaign_id, p.status, p.level, p.class_name, p.pending_level_up, p.pending_change, p.joined_at, p.updated_at,
              ch.name AS char_name, ch.data AS char_data, u.display_name AS player_name, c.name AS campaign_name
         FROM character_participations p
         JOIN characters ch ON ch.id = p.character_id
         LEFT JOIN users u ON u.id = ch.owner_id
         JOIN campaigns c ON c.id = p.campaign_id
        WHERE p.status = 'pending_approval' 
           OR (p.pending_level_up IS NOT NULL AND p.pending_level_up != '')
           OR (p.pending_change IS NOT NULL AND p.pending_change != '')`
    ).all();
    const pendingApprovals = [];
    for (const p of apprRes.results || []) {
      if (!isGlobalDm && !myDmIds.has(p.campaign_id)) continue;
      const charBlob = parseBlob(p.char_data, null);
      const levelUp = parseBlob(p.pending_level_up, null);
      const pendingChange = parseBlob(p.pending_change, null);
      if (p.status === "pending_approval") {
        pendingApprovals.push({
          campaignId: p.campaign_id,
          campaignName: p.campaign_name,
          type: "create",
          participationId: p.id,
          characterId: p.character_id,
          characterName: p.char_name || charBlob?.name || "\u0634\u062E\u0635\u06CC\u062A \u062C\u062F\u06CC\u062F",
          playerName: p.player_name || "\u06A9\u0627\u0631\u0628\u0631",
          level: p.level,
          requestedAt: p.joined_at,
          details: { className: p.class_name, race: charBlob?.race }
        });
      } else if (pendingChange && pendingChange.type === "level_up") {
        pendingApprovals.push({
          campaignId: p.campaign_id,
          campaignName: p.campaign_name,
          type: "level_up",
          participationId: p.id,
          characterId: p.character_id,
          characterName: p.char_name || charBlob?.name || "\u0634\u062E\u0635\u06CC\u062A",
          playerName: p.player_name || "\u06A9\u0627\u0631\u0628\u0631",
          level: pendingChange.diff?.toLevel || p.level + 1,
          requestedAt: pendingChange.requestedAt || p.updated_at,
          details: { diff: pendingChange.diff, payload: pendingChange.payload }
        });
      } else if (pendingChange && pendingChange.type === "sheet_change") {
        pendingApprovals.push({
          campaignId: p.campaign_id,
          campaignName: p.campaign_name,
          type: "sheet_change",
          participationId: p.id,
          characterId: p.character_id,
          characterName: p.char_name || charBlob?.name || "\u0634\u062E\u0635\u06CC\u062A",
          playerName: p.player_name || "\u06A9\u0627\u0631\u0628\u0631",
          level: p.level,
          requestedAt: pendingChange.requestedAt || p.updated_at,
          details: pendingChange
        });
      } else if (levelUp) {
        pendingApprovals.push({
          campaignId: p.campaign_id,
          campaignName: p.campaign_name,
          type: "level_up",
          participationId: p.id,
          characterId: p.character_id,
          characterName: p.char_name || charBlob?.name || "\u0634\u062E\u0635\u06CC\u062A",
          playerName: p.player_name || "\u06A9\u0627\u0631\u0628\u0631",
          level: levelUp.targetLevel || p.level,
          requestedAt: levelUp.requestedAt || p.updated_at,
          details: levelUp.diff
        });
      }
    }
    const backstoryReviewRes = await env.DB.prepare(
      `SELECT ch.id as char_id, ch.name as char_name, ch.data as char_data, ch.updated_at,
              u.display_name as player_name, cp.campaign_id, c.name as campaign_name, cp.id as part_id, cp.level
         FROM characters ch
         JOIN character_participations cp ON cp.character_id = ch.id
         JOIN campaigns c ON c.id = cp.campaign_id
         LEFT JOIN users u ON u.id = ch.owner_id
        WHERE ch.ready_for_review = 1`
    ).all();
    for (const br of backstoryReviewRes.results || []) {
      if (!isGlobalDm && !myDmIds.has(br.campaign_id)) continue;
      const charBlob = parseBlob(br.char_data, null);
      if (charBlob?.reviewStatus === "approved") continue;
      pendingApprovals.push({
        campaignId: br.campaign_id,
        campaignName: br.campaign_name,
        type: "backstory_review",
        participationId: br.part_id,
        characterId: br.char_id,
        characterName: br.char_name || charBlob?.name || "\u0634\u062E\u0635\u06CC\u062A",
        playerName: br.player_name || "\u06A9\u0627\u0631\u0628\u0631",
        level: br.level || 1,
        requestedAt: br.updated_at,
        details: { backstory: charBlob?.backstory }
      });
    }
    return json({
      user: {
        id: actor.id,
        email: actor.email,
        name: actor.display_name,
        displayName: actor.display_name,
        role: actor.role,
        status: actor.status,
        mustChangePassword: actor.must_change_password === 1,
        activeCharacterId: actor.active_character_id || null,
        avatarUrl: actor.avatar_url || null
      },
      myCampaigns,
      myCharacters,
      pendingInvites,
      pendingApprovals
    });
  }
  if (path === "/campaigns" && method === "GET") {
    const memRes = await env.DB.prepare(
      `SELECT c.*, m.role AS my_role,
              (SELECT COUNT(*) FROM campaign_members cm WHERE cm.campaign_id = c.id AND cm.status = 'active') AS member_count,
              (SELECT COUNT(*) FROM character_participations cp WHERE cp.campaign_id = c.id AND cp.status = 'active') AS character_count
         FROM campaign_members m
         JOIN campaigns c ON c.id = m.campaign_id
        WHERE m.user_id = ? AND m.status = 'active' AND c.deleted_at IS NULL
        ORDER BY c.updated_at DESC`
    ).bind(actor.id).all();
    return json((memRes.results || []).map(mapCampaignRow));
  }
  if (path.match(/^\/c\/[^/]+$/) && method === "GET") {
    const campId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!row) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const mc = await env.DB.prepare("SELECT COUNT(*) AS n FROM campaign_members WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    const cc = await env.DB.prepare("SELECT COUNT(*) AS n FROM character_participations WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    return json(mapCampaignRow({
      ...row,
      my_role: myRole || "owner",
      member_count: mc?.n ?? 0,
      character_count: cc?.n ?? 0
    }));
  }
  if (path.match(/^\/c\/[^/]+\/members$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0634\u0645\u0627 \u0639\u0636\u0648 \u0622\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
    const res = await env.DB.prepare(
      `SELECT m.campaign_id, m.user_id, m.role, m.status, m.joined_at, u.display_name, u.email, u.avatar_url
         FROM campaign_members m
         JOIN users u ON u.id = m.user_id
        WHERE m.campaign_id = ?
        ORDER BY m.joined_at ASC`
    ).bind(campId).all();
    return json((res.results || []).map((r) => ({
      campaignId: r.campaign_id,
      userId: r.user_id,
      role: r.role,
      status: r.status,
      joinedAt: r.joined_at,
      userName: r.display_name,
      userEmail: r.email,
      userAvatarUrl: r.avatar_url
    })));
  }
  if (path.match(/^\/c\/[^/]+\/invites$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0634\u0645\u0627 \u0639\u0636\u0648 \u0622\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
    if (!can(myRole, "campaign:invite_members")) {
      return error("\u0641\u0642\u0637 \u0645\u0627\u0644\u06A9 \u06CC\u0627 \u062F\u0633\u062A\u06CC\u0627\u0631 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u0645\u0634\u0627\u0647\u062F\u0647 \u062F\u0639\u0648\u062A\u200C\u0646\u0627\u0645\u0647\u200C\u0647\u0627 \u0647\u0633\u062A\u0646\u062F.", 403);
    }
    const res = await env.DB.prepare(
      "SELECT * FROM campaign_invites WHERE campaign_id = ? AND revoked_at IS NULL ORDER BY created_at DESC"
    ).bind(campId).all();
    return json((res.results || []).map((r) => ({
      id: r.id,
      campaignId: r.campaign_id,
      role: r.role,
      label: r.label,
      createdBy: r.created_by,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      maxUses: r.max_uses,
      usedCount: r.used_count,
      assignParticipationId: r.assign_participation_id,
      revokedAt: r.revoked_at
    })));
  }
  if (path.match(/^\/c\/[^/]+\/invites$/) && method === "POST") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0634\u0645\u0627 \u0639\u0636\u0648 \u0622\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
    if (!can(myRole, "campaign:invite_members")) {
      return error("\u0641\u0642\u0637 \u0645\u0627\u0644\u06A9 \u06CC\u0627 \u062F\u0633\u062A\u06CC\u0627\u0631 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u0633\u0627\u062E\u062A \u06A9\u062F \u062F\u0639\u0648\u062A \u0647\u0633\u062A\u0646\u062F.", 403);
    }
    const body = await request.json();
    const requestedRole = body.role === "spectator" ? "spectator" : "player";
    const inviteCheck = canCreateInviteForRole(myRole, requestedRole);
    if (!inviteCheck.allowed) {
      return error(inviteCheck.reason || "\u06A9\u062F \u062F\u0639\u0648\u062A \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0646\u0642\u0634 \u0645\u0627\u0644\u06A9 \u06CC\u0627 \u062F\u0633\u062A\u06CC\u0627\u0631 DM \u0631\u0627 \u0627\u0639\u0637\u0627 \u06A9\u0646\u062F.", 400);
    }
    const role = requestedRole;
    const label = String(body.label || "\u062F\u0639\u0648\u062A \u062C\u062F\u06CC\u062F").trim();
    const expiresInDays = Math.max(1, Math.min(365, parseInt(String(body.expiresInDays || 30), 10)));
    const maxUses = Math.max(1, parseInt(String(body.maxUses || 1), 10));
    const assignParticipationId = body.assignParticipationId || null;
    const rawCode = `inv-${generateRandomToken(6)}`;
    const codeHash = await sha256Hex(rawCode);
    const inviteId = `cinv-${Date.now()}-${generateRandomToken(4)}`;
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1e3;
    await env.DB.prepare(
      `INSERT INTO campaign_invites (id, campaign_id, code_hash, role, label, created_by, created_at, expires_at, max_uses, used_count, assign_participation_id, revoked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NULL)`
    ).bind(inviteId, campId, codeHash, role, label, actor.id, now, expiresAt, maxUses, assignParticipationId).run();
    await audit("campaign-invite-create", inviteId, { campaignId: campId, role, label, maxUses, expiresAt });
    return json({
      id: inviteId,
      campaignId: campId,
      code: rawCode,
      role,
      label,
      createdBy: actor.id,
      createdAt: now,
      expiresAt,
      maxUses,
      usedCount: 0,
      assignParticipationId,
      revokedAt: null
    }, 201);
  }
  if (path.match(/^\/c\/[^/]+\/invites\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const inviteId = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0634\u0645\u0627 \u0639\u0636\u0648 \u0622\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
    if (!can(myRole, "campaign:invite_members")) {
      return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    }
    const res = await env.DB.prepare(
      "UPDATE campaign_invites SET revoked_at = ? WHERE id = ? AND campaign_id = ? AND revoked_at IS NULL"
    ).bind(now, inviteId, campId).run();
    const changes = res?.meta?.changes ?? 0;
    if (changes === 0) return error("\u062F\u0639\u0648\u062A\u200C\u0646\u0627\u0645\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    await audit("campaign-invite-revoke", inviteId, { campaignId: campId });
    return json({ success: true });
  }
  if (path === "/invites/accept" && method === "POST") {
    const canAcceptInvite = await checkRateLimit("invite_accept_user:" + actor.id, 10, 15 * 60 * 1e3);
    if (!canAcceptInvite) return error("\u062A\u0639\u062F\u0627\u062F \u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u067E\u0630\u06CC\u0631\u0634 \u062F\u0639\u0648\u062A \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u06A9\u0645\u06CC \u0628\u0639\u062F \u0627\u0645\u062A\u062D\u0627\u0646 \u06A9\u0646\u06CC\u062F.", 429);
    const body = await request.json();
    const code = String(body.code || "").trim();
    if (!code) return error("\u06A9\u062F \u062F\u0639\u0648\u062A \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F.");
    const codeHash = await sha256Hex(code);
    const inv = await env.DB.prepare(
      "SELECT * FROM campaign_invites WHERE code_hash = ? OR id = ?"
    ).bind(codeHash, code).first();
    if (!inv || inv.revoked_at) return error("\u06A9\u062F \u062F\u0639\u0648\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u06CC\u0627 \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.", 404);
    if (inv.expires_at > 0 && inv.expires_at < now) return error("\u0627\u06CC\u0646 \u06A9\u062F \u062F\u0639\u0648\u062A \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.");
    if (inv.used_count >= inv.max_uses) return error("\u0627\u06CC\u0646 \u06A9\u062F \u062F\u0639\u0648\u062A \u0642\u0628\u0644\u0627\u064B \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A.");
    if (!inv.campaign_id) return error("\u0627\u06CC\u0646 \u06A9\u062F \u062F\u0639\u0648\u062A \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A.");
    const campId = inv.campaign_id;
    const camp = await env.DB.prepare("SELECT id FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0627\u06CC\u0646 \u062F\u0639\u0648\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const existing = await env.DB.prepare(
      "SELECT status FROM campaign_members WHERE campaign_id = ? AND user_id = ?"
    ).bind(campId, actor.id).first();
    if (existing && existing.status === "active") return error("\u0634\u0645\u0627 \u0647\u0645\u200C\u0627\u06A9\u0646\u0648\u0646 \u0639\u0636\u0648 \u0627\u06CC\u0646 \u06A9\u0645\u067E\u06CC\u0646 \u0647\u0633\u062A\u06CC\u062F.");
    const memberRole = inv.role === "spectator" ? "spectator" : "player";
    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at) VALUES (?, ?, ?, 'active', ?)
       ON CONFLICT(campaign_id, user_id) DO UPDATE SET role = excluded.role, status = 'active', joined_at = excluded.joined_at`
    ).bind(campId, actor.id, memberRole, now).run();
    await env.DB.prepare(
      "UPDATE campaign_invites SET used_count = used_count + 1 WHERE id = ? AND used_count < max_uses"
    ).bind(inv.id).run();
    await audit("campaign-invite-accept", inv.id, { campaignId: campId, role: memberRole });
    try {
      const dmIds = await getCampaignDmUserIds(campId, actor.id);
      await notify(
        dmIds,
        "campaign_joined",
        {
          title: "\u0639\u0636\u0648 \u062C\u062F\u06CC\u062F \u0628\u0647 \u06A9\u0645\u067E\u06CC\u0646 \u067E\u06CC\u0648\u0633\u062A",
          body: `${actor.display_name} \u0628\u0627 \u0646\u0642\u0634 \xAB${memberRole}\xBB \u0628\u0647 \u06A9\u0645\u067E\u06CC\u0646 \xAB${camp.name || "\u06A9\u0645\u067E\u06CC\u0646"}\xBB \u067E\u06CC\u0648\u0633\u062A.`,
          campaignId: campId,
          targetType: "member",
          targetId: actor.id,
          link: `/campaign/${campId}/members`,
          actorName: actor.display_name
        },
        campId
      );
    } catch {
    }
    return json({ campaignId: campId, role: memberRole });
  }
  if (path === "/settings/campaign" && method === "GET") {
    const campId = url.searchParams.get("campaignId");
    if (!campId) return json({ allowPlayerCreateCharacter: true });
    const row = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!row) return json({ allowPlayerCreateCharacter: true });
    const settings = parseBlob(row.settings, {});
    return json({ allowPlayerCreateCharacter: settings.allowPlayerCreateCharacter ?? true });
  }
  if (path === "/settings/campaign" && method === "PUT") {
    const body = await request.json();
    const campId = body.campaignId || url.searchParams.get("campaignId");
    if (!campId) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0641\u0639\u0627\u0644 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.");
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== "dm" && myRole !== "owner" && myRole !== "co_dm") {
      return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    }
    const row = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!row) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const settings = parseBlob(row.settings, {});
    if (typeof body.allowPlayerCreateCharacter === "boolean") {
      settings.allowPlayerCreateCharacter = body.allowPlayerCreateCharacter;
    }
    await env.DB.prepare("UPDATE campaigns SET settings = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(settings), now, campId).run();
    return json({ allowPlayerCreateCharacter: settings.allowPlayerCreateCharacter ?? true });
  }
  if (path === "/rewards" && method === "GET") {
    const res = await env.DB.prepare("SELECT data FROM rewards").all();
    return json((res.results || []).map((r) => parseBlob(r.data, null)).filter(Boolean));
  }
  if (path === "/weapon-templates" && method === "GET") {
    const res = await env.DB.prepare("SELECT data FROM weapon_templates").all();
    return json((res.results || []).map((r) => parseBlob(r.data, null)).filter(Boolean));
  }
  if (path === "/class-templates" && method === "GET") {
    const res = await env.DB.prepare("SELECT data FROM class_templates").all();
    return json((res.results || []).map((r) => parseBlob(r.data, null)).filter(Boolean));
  }
  if (path === "/campaign-notes" && method === "GET") {
    if (actor.role !== "dm") return json([]);
    const res = await env.DB.prepare("SELECT data FROM campaign_notes").all();
    return json((res.results || []).map((r) => parseBlob(r.data, null)).filter(Boolean));
  }
  if (path === "/characters/group-rest" && method === "POST") {
    const body = await request.json();
    const type = body.type === "long" || body.type === "special" ? body.type : "short";
    const notes = String(body.notes || "");
    const rows = await loadCharacterBlobs();
    const updated = [];
    for (const row of rows) {
      const char = parseBlob(row.data, null);
      if (!char) continue;
      const hp = { current: 0, max: 0, temp: 0, ...char.hp || {} };
      let exhaustion = char.exhaustion || 0;
      const features = (char.features || []).map((f) => {
        if (type === "long") return { ...f, usedCount: 0 };
        if (type === "short" && f.usageType === "short") return { ...f, usedCount: 0 };
        return f;
      });
      const weapons = (char.weapons || []).map((w) => {
        if (type === "long") return { ...w, abilityUsed: 0 };
        if (type === "short" && (w.specialAbility?.restType === "short" || w.abilityReset === "short")) {
          return { ...w, abilityUsed: 0 };
        }
        return w;
      });
      if (type === "long") {
        hp.current = hp.max;
        hp.temp = 0;
        if (exhaustion > 0) exhaustion -= 1;
      } else if (type === "special") {
        hp.current = Math.min(hp.max, hp.current + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + 2);
        if (exhaustion > 0) exhaustion -= 1;
      }
      const restEntry = {
        id: `rest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: (/* @__PURE__ */ new Date()).toLocaleDateString("fa-IR"),
        type,
        notes: notes || (type === "long" ? "\u0627\u0633\u062A\u0631\u0627\u062D\u062A \u06A9\u0627\u0645\u0644 \u06AF\u0631\u0648\u0647\u06CC" : type === "short" ? "\u0627\u0633\u062A\u0631\u0627\u062D\u062A \u06A9\u0648\u062A\u0627\u0647 \u06AF\u0631\u0648\u0647\u06CC" : "\u0627\u0633\u062A\u0631\u0627\u062D\u062A \u0648\u06CC\u0698\u0647 \u062F\u0631 \u0627\u0631\u062F\u0648\u06AF\u0627\u0647 \u067E\u0631\u06CC\u0627\u0646")
      };
      const nextRevision = Number(row.revision || 0) + 1;
      const saved = await saveCharacterBlob(row.id, {
        ...char,
        hp,
        exhaustion,
        features,
        weapons,
        restLog: [restEntry, ...char.restLog || []]
      }, nextRevision);
      updated.push(saved);
    }
    return json(updated);
  }
  if (path === "/characters/group-resources" && method === "POST") {
    const body = await request.json();
    const rationsDelta = Number(body.rations || 0);
    const oilDelta = Number(body.lanternOil || 0);
    const rows = await loadCharacterBlobs();
    const updated = [];
    for (const row of rows) {
      const char = parseBlob(row.data, null);
      if (!char) continue;
      const saved = await saveCharacterBlob(row.id, {
        ...char,
        rations: Math.max(0, (char.rations || 0) + rationsDelta),
        lanternOil: Math.max(0, (char.lanternOil || 0) + oilDelta)
      }, Number(row.revision || 0) + 1);
      updated.push(saved);
    }
    return json(updated);
  }
  const requireCampaignDm = /* @__PURE__ */ __name(async (campId) => {
    const myRole = await getMembershipRole(campId, actor.id);
    return myRole === "owner" || myRole === "co_dm";
  }, "requireCampaignDm");
  if (path === "/campaigns" && method === "POST") {
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) return error("\u0646\u0627\u0645 \u06A9\u0645\u067E\u06CC\u0646 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const campId = `camp-${Date.now()}-${generateRandomToken(4)}`;
    const defaultSettings = {
      units: "feet",
      startingLevel: 1,
      maxEntryLevel: 20,
      abilityScoreMethods: ["standard_array", "point_buy", "roll", "manual"],
      approval: { onCreate: false, onLevelUp: false },
      backstoryVisibility: "party",
      diceVisibility: "table",
      allowPlayerRollPrivate: true,
      allowPlayerCreateCharacter: true,
      encounterDefaults: { showExactHp: false, showAc: false, showConditions: true, showDefeated: true, playerInitiativeRolls: true }
    };
    const settings = { ...defaultSettings, ...body.settings || {} };
    const description = String(body.description || "");
    const tone = body.tone ? String(body.tone) : null;
    const sourcePackId = body.packId ? String(body.packId) : null;
    await env.DB.prepare(
      `INSERT INTO campaigns (id, name, description, tone, status, owner_id, source_pack_id, settings, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`
    ).bind(campId, name, description, tone, actor.id, sourcePackId, JSON.stringify(settings), now, now).run();
    await env.DB.prepare(
      "INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at) VALUES (?, ?, 'owner', 'active', ?)"
    ).bind(campId, actor.id, now).run();
    await audit("campaign-create", campId, { name });
    const row = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(campId).first();
    return json(mapCampaignRow({ ...row, my_role: "owner", member_count: 1, character_count: 0 }), 201);
  }
  if (path.match(/^\/c\/[^/]+$/) && method === "PATCH") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0634\u0645\u0627 \u0639\u0636\u0648 \u0622\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
    if (!can(myRole, "campaign:edit_settings")) {
      return error("\u0641\u0642\u0637 \u0645\u0627\u0644\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u062C\u0627\u0632 \u0628\u0647 \u062A\u063A\u06CC\u06CC\u0631 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u06CC\u0627 \u0648\u0636\u0639\u06CC\u062A \u06A9\u0645\u067E\u06CC\u0646 \u0627\u0633\u062A.", 403);
    }
    const row = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!row) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const next = {
      name: body.name !== void 0 ? String(body.name) : row.name,
      description: body.description !== void 0 ? String(body.description) : row.description,
      tone: body.tone !== void 0 ? body.tone : row.tone,
      status: body.status !== void 0 && ["draft", "active", "paused", "archived"].includes(body.status) ? body.status : row.status,
      settings: body.settings !== void 0 && body.settings ? body.settings : parseBlob(row.settings, {})
    };
    await env.DB.prepare(
      "UPDATE campaigns SET name = ?, description = ?, tone = ?, status = ?, settings = ?, updated_at = ? WHERE id = ?"
    ).bind(next.name, next.description, next.tone, next.status, JSON.stringify(next.settings), now, campId).run();
    await audit("campaign-update", campId, { fields: Object.keys(body) });
    const updated = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(campId).first();
    const mc = await env.DB.prepare("SELECT COUNT(*) AS n FROM campaign_members WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    const cc = await env.DB.prepare("SELECT COUNT(*) AS n FROM character_participations WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    return json(mapCampaignRow({ ...updated, my_role: myRole || "owner", member_count: mc?.n ?? 0, character_count: cc?.n ?? 0 }));
  }
  if (path.match(/^\/c\/[^/]+\/members\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const campId = parts[2];
    const targetUserId = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0634\u0645\u0627 \u0639\u0636\u0648 \u0622\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
    if (!can(myRole, "campaign:change_member_roles")) {
      return error("\u0634\u0645\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0644\u0627\u0632\u0645 \u0628\u0631\u0627\u06CC \u062A\u063A\u06CC\u06CC\u0631 \u0646\u0642\u0634 \u0627\u0639\u0636\u0627 \u0631\u0627 \u0646\u062F\u0627\u0631\u06CC\u062F.", 403);
    }
    const member = await env.DB.prepare(
      "SELECT * FROM campaign_members WHERE campaign_id = ? AND user_id = ?"
    ).bind(campId, targetUserId).first();
    if (!member) return error("\u0639\u0636\u0648 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const nextRole = body.role && ["owner", "co_dm", "player", "spectator"].includes(body.role) ? body.role : member.role;
    const nextStatus = body.status && ["invited", "active", "left", "removed"].includes(body.status) ? body.status : member.status;
    if (body.role && body.role !== member.role) {
      const roleCheck = canChangeMemberRole(myRole, member.role, nextRole);
      if (!roleCheck.allowed) {
        return error(roleCheck.reason || "\u062A\u063A\u06CC\u06CC\u0631 \u0646\u0642\u0634 \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
      }
    }
    await env.DB.prepare("UPDATE campaign_members SET role = ?, status = ? WHERE campaign_id = ? AND user_id = ?").bind(nextRole, nextStatus, campId, targetUserId).run();
    await audit("campaign-member-update", targetUserId, { campaignId: campId, role: nextRole, status: nextStatus, actorRole: myRole });
    const u = await env.DB.prepare("SELECT display_name, email, avatar_url FROM users WHERE id = ?").bind(targetUserId).first();
    return json({
      campaignId: campId,
      userId: targetUserId,
      role: nextRole,
      status: nextStatus,
      joinedAt: member.joined_at,
      userName: u?.display_name,
      userEmail: u?.email,
      userAvatarUrl: u?.avatar_url
    });
  }
  if (path.match(/^\/c\/[^/]+\/members\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const targetUserId = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0634\u0645\u0627 \u0639\u0636\u0648 \u0622\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
    if (!can(myRole, "campaign:kick_member")) {
      return error("\u0634\u0645\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0644\u0627\u0632\u0645 \u0628\u0631\u0627\u06CC \u0627\u062E\u0631\u0627\u062C \u0627\u0639\u0636\u0627 \u0631\u0627 \u0646\u062F\u0627\u0631\u06CC\u062F.", 403);
    }
    const member = await env.DB.prepare(
      "SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ?"
    ).bind(campId, targetUserId).first();
    if (!member) return error("\u0639\u0636\u0648 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const kickCheck = canKickMember(myRole, member.role);
    if (!kickCheck.allowed) {
      return error(kickCheck.reason || "\u0627\u0645\u06A9\u0627\u0646 \u0627\u062E\u0631\u0627\u062C \u0627\u06CC\u0646 \u0639\u0636\u0648 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 403);
    }
    await env.DB.prepare("UPDATE campaign_members SET status = 'removed' WHERE campaign_id = ? AND user_id = ?").bind(campId, targetUserId).run();
    await audit("campaign-member-remove", targetUserId, { campaignId: campId, actorRole: myRole });
    return json({ success: true });
  }
  if (path.match(/^\/c\/[^/]+\/transfer-ownership$/) && method === "POST") {
    const campId = path.split("/")[2];
    const body = await request.json();
    const newOwnerId = String(body.newOwnerId || "");
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0634\u0645\u0627 \u0639\u0636\u0648 \u0622\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
    if (!can(myRole, "campaign:transfer_ownership")) {
      return error("\u0641\u0642\u0637 \u0645\u0627\u0644\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0645\u0627\u0644\u06A9\u06CC\u062A \u0631\u0627 \u0645\u0646\u062A\u0642\u0644 \u06A9\u0646\u062F.", 403);
    }
    const camp = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const newOwnerMem = await env.DB.prepare(
      "SELECT user_id FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND status = 'active'"
    ).bind(campId, newOwnerId).first();
    if (!newOwnerMem) return error("\u0634\u062E\u0635 \u0627\u0646\u062A\u062E\u0627\u0628\u200C\u0634\u062F\u0647 \u0628\u0627\u06CC\u062F \u0627\u0628\u062A\u062F\u0627 \u0639\u0636\u0648 \u0641\u0639\u0627\u0644 \u06A9\u0645\u067E\u06CC\u0646 \u0628\u0627\u0634\u062F.", 400);
    if (newOwnerId === camp.owner_id) return error("\u0627\u06CC\u0646 \u0634\u062E\u0635 \u0647\u0645\u200C\u0627\u06A9\u0646\u0648\u0646 \u0645\u0627\u0644\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0627\u0633\u062A.", 400);
    await env.DB.prepare("UPDATE campaign_members SET role = 'co_dm' WHERE campaign_id = ? AND user_id = ?").bind(campId, camp.owner_id).run();
    await env.DB.prepare("UPDATE campaign_members SET role = 'owner' WHERE campaign_id = ? AND user_id = ?").bind(campId, newOwnerId).run();
    await env.DB.prepare("UPDATE campaigns SET owner_id = ?, updated_at = ? WHERE id = ?").bind(newOwnerId, now, campId).run();
    await audit("campaign-transfer-ownership", campId, { newOwnerId });
    const updated = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(campId).first();
    const mc = await env.DB.prepare("SELECT COUNT(*) AS n FROM campaign_members WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    const cc = await env.DB.prepare("SELECT COUNT(*) AS n FROM character_participations WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    return json(mapCampaignRow({ ...updated, my_role: await getMembershipRole(campId, actor.id) || void 0, member_count: mc?.n ?? 0, character_count: cc?.n ?? 0 }));
  }
  const mapDiceRoll = /* @__PURE__ */ __name((r) => ({
    id: r.id,
    campaignId: r.campaign_id,
    userId: r.user_id,
    userName: r.user_name,
    characterId: r.character_id,
    characterName: r.character_name,
    rollType: r.roll_type,
    diceExpression: r.dice_expression,
    total: r.total,
    details: parseBlob(r.details, { rolls: [r.total], modifier: 0 }),
    visibility: r.visibility,
    createdAt: r.created_at
  }), "mapDiceRoll");
  if (path.match(/^\/c\/[^/]+\/dice$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0634\u0645\u0627 \u0639\u0636\u0648 \u0622\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
    const res = await env.DB.prepare(
      "SELECT * FROM dice_rolls WHERE campaign_id = ? ORDER BY created_at DESC, id DESC LIMIT 500"
    ).bind(campId).all();
    let rolls = (res.results || []).map(mapDiceRoll);
    rolls = filterDiceFeedForRole(rolls, myRole, actor.id);
    const after = url.searchParams.get("after");
    if (after) {
      const idx = rolls.findIndex((r) => r.id === after);
      if (idx !== -1) rolls = rolls.slice(0, idx);
    }
    const limit = Math.max(1, Math.min(200, parseInt(url.searchParams.get("limit") || "50", 10)));
    return json(rolls.slice(0, limit));
  }
  if (path.match(/^\/c\/[^/]+\/dice$/) && method === "POST") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u0634\u0645\u0627 \u0639\u0636\u0648 \u0622\u0646 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
    if (!can(myRole, "dice:roll_table")) {
      return error("\u062A\u0645\u0627\u0634\u0627\u0686\u06CC\u0627\u0646 \u0645\u062C\u0627\u0632 \u0628\u0647 \u067E\u0631\u062A\u0627\u0628 \u062A\u0627\u0633 \u0646\u06CC\u0633\u062A\u0646\u062F.", 403);
    }
    const camp = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const settings = parseBlob(camp.settings, {});
    const body = await request.json();
    let vis = body.visibility === "dm_only" ? "dm_only" : "table";
    if (!can(myRole, "dice:roll_secret") && !settings.allowPlayerRollPrivate) {
      vis = "table";
    }
    const rollId = `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const details = {
      rolls: Array.isArray(body.results) ? body.results : [Number(body.total || 0) - Number(body.modifier || 0)],
      modifier: Number(body.modifier || 0),
      advantage: body.mode === "normal" ? void 0 : body.mode,
      isCritical: !!body.nat20,
      isFumble: !!body.nat1,
      label: body.label || "\u067E\u0631\u062A\u0627\u0628 \u062A\u0627\u0633"
    };
    await env.DB.prepare(
      `INSERT INTO dice_rolls (id, campaign_id, user_id, character_id, user_name, character_name, roll_type, dice_expression, total, details, visibility, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      rollId,
      campId,
      actor.id,
      actor.active_character_id || null,
      actor.display_name,
      null,
      String(body.label || "dice_roll"),
      String(body.formula || ""),
      Number(body.total || 0),
      JSON.stringify(details),
      vis,
      now
    ).run();
    const row = await env.DB.prepare("SELECT * FROM dice_rolls WHERE id = ?").bind(rollId).first();
    return json(mapDiceRoll(row), 201);
  }
  const decodeBase64 = /* @__PURE__ */ __name((b64) => {
    const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }, "decodeBase64");
  const encodeBase64 = /* @__PURE__ */ __name((bytes) => {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }, "encodeBase64");
  if (path === "/media" && method === "POST") {
    const canUpload = await checkRateLimit("upload_user:" + actor.id, 30, 3600 * 1e3);
    if (!canUpload) return error("\u062A\u0639\u062F\u0627\u062F \u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u0631\u0633\u0627\u0646\u0647 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A (\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F3\u06F0 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u062F\u0631 \u0633\u0627\u0639\u062A).", 429);
    const body = await request.json();
    const sizeBytes = Number(body.sizeBytes || 0);
    if (!body.mimeType || !body.dataBase64) return error("\u0641\u0627\u06CC\u0644 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
    const campaignId = body.campaignId ? String(body.campaignId) : null;
    if (campaignId) {
      const myRole = await getMembershipRole(campaignId, actor.id);
      if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
      if (sizeBytes > 400 * 1024) {
        return error("\u062D\u062C\u0645 \u062A\u0635\u0648\u06CC\u0631 \u0646\u0628\u0627\u06CC\u062F \u0628\u06CC\u0634 \u0627\u0632 \u06F4\u06F0\u06F0 \u06A9\u06CC\u0644\u0648\u0628\u0627\u06CC\u062A \u0628\u0627\u0634\u062F. \u0644\u0637\u0641\u0627\u064B \u0642\u0628\u0644 \u0627\u0632 \u0627\u0631\u0633\u0627\u0644 \u062A\u0635\u0648\u06CC\u0631 \u0631\u0627 \u0641\u0634\u0631\u062F\u0647 \u06A9\u0646\u06CC\u062F.", 413);
      }
      let currentTotal = 0;
      try {
        const qRow = await env.DB.prepare("SELECT COALESCE(SUM(size_bytes), 0) AS total FROM media WHERE campaign_id = ?").bind(campaignId).first();
        currentTotal = Number(qRow?.total || 0);
      } catch {
      }
      if (currentTotal + sizeBytes > 20 * 1024 * 1024) {
        return error("\u0633\u0647\u0645\u06CC\u0647 \u0630\u062E\u06CC\u0631\u0647\u200C\u0633\u0627\u0632\u06CC \u0631\u0633\u0627\u0646\u0647\u200C\u0647\u0627\u06CC \u0627\u06CC\u0646 \u06A9\u0645\u067E\u06CC\u0646 (\u06F2\u06F0 \u0645\u06AF\u0627\u0628\u0627\u06CC\u062A) \u067E\u0631 \u0627\u0633\u062A.", 400);
      }
    } else {
      if (sizeBytes > 150 * 1024) {
        return error("\u062D\u062C\u0645 \u062A\u0635\u0648\u06CC\u0631 \u0646\u0628\u0627\u06CC\u062F \u0628\u06CC\u0634 \u0627\u0632 \u06F1\u06F5\u06F0 \u06A9\u06CC\u0644\u0648\u0628\u0627\u06CC\u062A \u0628\u0627\u0634\u062F. \u0644\u0637\u0641\u0627\u064B \u0642\u0628\u0644 \u0627\u0632 \u0627\u0631\u0633\u0627\u0644 \u062A\u0635\u0648\u06CC\u0631 \u0631\u0627 \u0641\u0634\u0631\u062F\u0647 \u06A9\u0646\u06CC\u062F.", 413);
      }
      const quota = await env.DB.prepare('SELECT COALESCE(SUM(size_bytes), 0) AS total FROM media WHERE owner_id = ? AND (campaign_id IS NULL OR campaign_id = "")').bind(actor.id).first();
      if (Number(quota?.total || 0) + sizeBytes > 5 * 1024 * 1024) {
        return error("\u0633\u0647\u0645\u06CC\u0647 \u0630\u062E\u06CC\u0631\u0647\u200C\u0633\u0627\u0632\u06CC \u0634\u0645\u0627 (\u06F5 \u0645\u06AF\u0627\u0628\u0627\u06CC\u062A) \u067E\u0631 \u0627\u0633\u062A.", 400);
      }
    }
    const bytes = decodeBase64(String(body.dataBase64));
    const mediaId = `media-${Date.now()}-${generateRandomToken(3)}`;
    try {
      await env.DB.prepare(
        "INSERT INTO media (id, owner_id, campaign_id, mime_type, size_bytes, data, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(mediaId, actor.id, campaignId, String(body.mimeType), sizeBytes, bytes, body.width ?? null, body.height ?? null, now).run();
    } catch {
      await env.DB.prepare(
        "INSERT INTO media (id, owner_id, mime_type, size_bytes, data, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(mediaId, actor.id, String(body.mimeType), sizeBytes, bytes, body.width ?? null, body.height ?? null, now).run();
    }
    const urlOut = `/api/media/${mediaId}`;
    return json({ id: mediaId, url: urlOut, sizeBytes }, 201);
  }
  if (path.match(/^\/media\/[^/]+$/) && method === "GET") {
    const mediaId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT * FROM media WHERE id = ?").bind(mediaId).first();
    if (!row) return error("\u0631\u0633\u0627\u0646\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    try {
      const handout = await env.DB.prepare("SELECT id, campaign_id, visibility FROM handouts WHERE media_id = ?").bind(mediaId).first();
      if (handout) {
        const myRole = await getMembershipRole(handout.campaign_id, actor.id);
        const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
        if (!isDm) {
          if (handout.visibility === "hidden") {
            return error("\u0631\u0633\u0627\u0646\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
          }
          if (handout.visibility === "selected") {
            const hasRecip = await env.DB.prepare(`
              SELECT 1 FROM handout_recipients hr
              JOIN character_participations cp ON hr.participation_id = cp.id
              JOIN characters c ON cp.character_id = c.id
              WHERE hr.handout_id = ? AND c.owner_id = ?
            `).bind(handout.id, actor.id).first();
            if (!hasRecip) {
              return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
            }
          }
          if (!myRole) {
            return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
          }
        }
      }
    } catch {
    }
    let bytes;
    const d = row.data;
    if (d instanceof Uint8Array) bytes = d;
    else if (d instanceof ArrayBuffer) bytes = new Uint8Array(d);
    else if (Array.isArray(d)) bytes = Uint8Array.from(d);
    else if (typeof d === "string") bytes = new TextEncoder().encode(d);
    else bytes = new Uint8Array(0);
    const accept = request.headers.get("accept") || "";
    const urlObj = new URL(request.url);
    if (urlObj.searchParams.get("format") === "json" || accept.includes("application/json") && !accept.includes("image/")) {
      return json({
        id: row.id,
        ownerId: row.owner_id,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        dataBase64: encodeBase64(bytes),
        width: row.width,
        height: row.height,
        createdAt: row.created_at
      });
    }
    return new Response(bytes.buffer, {
      status: 200,
      headers: {
        "Content-Type": row.mime_type || "image/webp",
        "Content-Length": String(row.size_bytes),
        "Cache-Control": "private, max-age=86400"
      }
    });
  }
  if (path.match(/^\/media\/[^/]+$/) && method === "DELETE") {
    const mediaId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id FROM media WHERE id = ?").bind(mediaId).first();
    if (!row) return error("\u0631\u0633\u0627\u0646\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (row.owner_id !== actor.id && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    await env.DB.prepare("DELETE FROM media WHERE id = ?").bind(mediaId).run();
    return json({ success: true });
  }
  const checkCharAuthorOrCampaignDm = /* @__PURE__ */ __name(async (charId) => {
    if (actor.role === "dm") return true;
    const char = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(charId).first();
    if (!char) return false;
    if (char.owner_id === actor.id) return true;
    const dmPart = await env.DB.prepare(
      `SELECT cm.role FROM character_participations cp
         JOIN campaign_members cm ON cm.campaign_id = cp.campaign_id
        WHERE cp.character_id = ? AND cm.user_id = ? AND cm.role IN ('owner', 'co_dm')`
    ).bind(charId, actor.id).first();
    return Boolean(dmPart);
  }, "checkCharAuthorOrCampaignDm");
  const checkCampaignDmForChar = /* @__PURE__ */ __name(async (charId) => {
    if (actor.role === "dm") return true;
    const dmPart = await env.DB.prepare(
      `SELECT cm.role FROM character_participations cp
         JOIN campaign_members cm ON cm.campaign_id = cp.campaign_id
        WHERE cp.character_id = ? AND cm.user_id = ? AND cm.role IN ('owner', 'co_dm')`
    ).bind(charId, actor.id).first();
    return Boolean(dmPart);
  }, "checkCampaignDmForChar");
  if (path.match(/^\/characters\/[^/]+$/) && method === "PATCH") {
    const charId = path.split("/")[2];
    const charData = await request.json();
    const row = await env.DB.prepare("SELECT owner_id, revision, data FROM characters WHERE id = ?").bind(charId).first();
    if (!row || actor.role !== "dm" && row.owner_id !== actor.id) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (charData.revision != null && row.revision !== charData.revision) {
      return error("\u0634\u062E\u0635\u06CC\u062A \u062A\u0648\u0633\u0637 \u0634\u062E\u0635 \u062F\u06CC\u06AF\u0631\u06CC \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F\u0647 \u0627\u0633\u062A\u061B \u0644\u0637\u0641\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u06A9\u0646\u06CC\u062F.", 409);
    }
    const nextRevision = row.revision + 1;
    const oldChar = parseBlob(row.data, {});
    const updatedChar = { ...charData, revision: nextRevision, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    const readyForReview = updatedChar.readyForReview ? 1 : 0;
    await env.DB.prepare(
      "UPDATE characters SET name = ?, class_name = ?, level = ?, data = ?, revision = ?, ready_for_review = ?, updated_at = ? WHERE id = ?"
    ).bind(
      updatedChar.name || "\u0634\u062E\u0635\u06CC\u062A \u0628\u06CC\u200C\u0646\u0627\u0645",
      updatedChar.className || "",
      updatedChar.level || 1,
      JSON.stringify(updatedChar),
      nextRevision,
      readyForReview,
      now,
      charId
    ).run();
    if (updatedChar.backstory && JSON.stringify(oldChar?.backstory) !== JSON.stringify(updatedChar.backstory)) {
      const revId = `rev-${Date.now()}-${generateRandomToken(3)}`;
      await env.DB.prepare(
        "INSERT INTO character_revisions (id, character_id, backstory, changed_by, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(revId, charId, JSON.stringify(updatedChar.backstory), actor.id, now).run();
      const revs = await env.DB.prepare(
        "SELECT id FROM character_revisions WHERE character_id = ? ORDER BY created_at DESC"
      ).bind(charId).all();
      if (revs.results && revs.results.length > 10) {
        const toDelete = revs.results.slice(10).map((r) => r.id);
        for (const delId of toDelete) {
          await env.DB.prepare("DELETE FROM character_revisions WHERE id = ?").bind(delId).run();
        }
      }
    }
    return json(updatedChar);
  }
  if (path.match(/^\/characters\/[^/]+\/revisions$/) && method === "GET") {
    const charId = path.split("/")[2];
    if (!await checkCharAuthorOrCampaignDm(charId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const rows = await env.DB.prepare(
      "SELECT * FROM character_revisions WHERE character_id = ? ORDER BY created_at DESC LIMIT 10"
    ).bind(charId).all();
    const list = (rows.results || []).map((r) => ({
      id: r.id,
      characterId: r.character_id,
      backstory: parseBlob(r.backstory, {}),
      changedBy: r.changed_by,
      createdAt: r.created_at
    }));
    return json(list);
  }
  if (path.match(/^\/characters\/[^/]+\/revisions$/) && method === "POST") {
    const charId = path.split("/")[2];
    if (!await checkCharAuthorOrCampaignDm(charId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    const backstory = body.backstory || {};
    const revId = `rev-${Date.now()}-${generateRandomToken(3)}`;
    await env.DB.prepare(
      "INSERT INTO character_revisions (id, character_id, backstory, changed_by, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(revId, charId, JSON.stringify(backstory), actor.id, now).run();
    return json({ id: revId, characterId: charId, backstory, changedBy: actor.id, createdAt: now }, 201);
  }
  if (path.match(/^\/characters\/[^/]+\/revisions\/[^/]+\/restore$/) && method === "POST") {
    const parts = path.split("/");
    const charId = parts[2];
    const revId = parts[4];
    if (!await checkCharAuthorOrCampaignDm(charId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const revRow = await env.DB.prepare("SELECT backstory FROM character_revisions WHERE id = ? AND character_id = ?").bind(revId, charId).first();
    if (!revRow) return error("\u0648\u06CC\u0631\u0627\u06CC\u0634 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const charRow = await env.DB.prepare("SELECT data, revision FROM characters WHERE id = ?").bind(charId).first();
    if (!charRow) return error("\u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const char = parseBlob(charRow.data, {});
    char.backstory = parseBlob(revRow.backstory, {});
    const nextRevision = (charRow.revision || 0) + 1;
    char.revision = nextRevision;
    char.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare("UPDATE characters SET data = ?, revision = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(char), nextRevision, now, charId).run();
    return json(char);
  }
  if (path.match(/^\/characters\/[^/]+\/ready-for-review$/) && method === "POST") {
    const charId = path.split("/")[2];
    if (!await checkCharAuthorOrCampaignDm(charId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    const ready = body.ready !== false;
    const charRow = await env.DB.prepare("SELECT data, revision FROM characters WHERE id = ?").bind(charId).first();
    if (!charRow) return error("\u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const char = parseBlob(charRow.data, {});
    char.readyForReview = ready;
    char.reviewStatus = ready ? "pending" : "none";
    const nextRevision = (charRow.revision || 0) + 1;
    char.revision = nextRevision;
    char.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare("UPDATE characters SET data = ?, ready_for_review = ?, revision = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(char), ready ? 1 : 0, nextRevision, now, charId).run();
    return json(char);
  }
  if (path.match(/^\/characters\/[^/]+\/backstory-comments$/) && method === "GET") {
    const charId = path.split("/")[2];
    if (!await checkCharAuthorOrCampaignDm(charId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const rows = await env.DB.prepare(
      `SELECT c.*, u.display_name, u.role as user_role
         FROM backstory_comments c
         LEFT JOIN users u ON u.id = c.author_id
        WHERE c.character_id = ?
        ORDER BY c.created_at ASC`
    ).bind(charId).all();
    const comments = (rows.results || []).map((r) => ({
      id: r.id,
      characterId: r.character_id,
      sectionId: r.section_id,
      authorId: r.author_id,
      authorName: r.display_name || "\u06A9\u0627\u0631\u0628\u0631",
      authorRole: r.user_role === "dm" ? "\u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631" : "\u0628\u0627\u0632\u06CC\u06A9\u0646",
      body: r.body,
      resolved: r.resolved === 1,
      createdAt: r.created_at
    }));
    return json(comments);
  }
  if (path.match(/^\/characters\/[^/]+\/backstory-comments$/) && method === "POST") {
    const charId = path.split("/")[2];
    if (!await checkCharAuthorOrCampaignDm(charId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    const sectionId = String(body.sectionId || "general");
    const commentBody = String(body.body || "").trim();
    if (!commentBody) return error("\u0645\u062A\u0646 \u062F\u06CC\u062F\u06AF\u0627\u0647 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062E\u0627\u0644\u06CC \u0628\u0627\u0634\u062F.");
    const commentId = `comm-${Date.now()}-${generateRandomToken(4)}`;
    await env.DB.prepare(
      "INSERT INTO backstory_comments (id, character_id, section_id, author_id, body, resolved, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)"
    ).bind(commentId, charId, sectionId, actor.id, commentBody, now).run();
    try {
      const charOwnerRow = await env.DB.prepare("SELECT owner_id, name FROM characters WHERE id = ?").bind(charId).first();
      if (charOwnerRow && charOwnerRow.owner_id !== actor.id) {
        await notify(
          String(charOwnerRow.owner_id),
          "backstory_comment",
          {
            title: "\u062F\u06CC\u062F\u06AF\u0627\u0647 \u062C\u062F\u06CC\u062F \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0628\u0631 \u067E\u06CC\u0634\u06CC\u0646\u0647",
            body: `${actor.display_name} \u062F\u06CC\u062F\u06AF\u0627\u0647\u06CC \u0628\u0631 \u067E\u06CC\u0634\u06CC\u0646\u0647 ${charOwnerRow.name || "\u0634\u062E\u0635\u06CC\u062A"} \u062B\u0628\u062A \u06A9\u0631\u062F: "${commentBody.slice(0, 80)}"`,
            targetType: "backstory",
            targetId: charId,
            link: `/character/${charId}?tab=backstory`,
            actorName: actor.display_name
          }
        );
      }
    } catch {
    }
    return json({
      id: commentId,
      characterId: charId,
      sectionId,
      authorId: actor.id,
      authorName: actor.display_name,
      authorRole: actor.role === "dm" ? "\u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631" : "\u0628\u0627\u0632\u06CC\u06A9\u0646",
      body: commentBody,
      resolved: false,
      createdAt: now
    }, 201);
  }
  if (path.match(/^\/characters\/[^/]+\/backstory-comments\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const charId = parts[2];
    const commentId = parts[4];
    if (!await checkCharAuthorOrCampaignDm(charId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    const resolved = body.resolved ? 1 : 0;
    await env.DB.prepare("UPDATE backstory_comments SET resolved = ? WHERE id = ? AND character_id = ?").bind(resolved, commentId, charId).run();
    const row = await env.DB.prepare(
      `SELECT c.*, u.display_name, u.role as user_role
         FROM backstory_comments c
         LEFT JOIN users u ON u.id = c.author_id
        WHERE c.id = ?`
    ).bind(commentId).first();
    return json({
      id: row.id,
      characterId: row.character_id,
      sectionId: row.section_id,
      authorId: row.author_id,
      authorName: row.display_name || "\u06A9\u0627\u0631\u0628\u0631",
      authorRole: row.user_role === "dm" ? "\u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631" : "\u0628\u0627\u0632\u06CC\u06A9\u0646",
      body: row.body,
      resolved: row.resolved === 1,
      createdAt: row.created_at
    });
  }
  if (path.match(/^\/characters\/[^/]+\/backstory-review$/) && method === "POST") {
    const charId = path.split("/")[2];
    if (!await checkCampaignDmForChar(charId)) return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u062A\u0623\u06CC\u06CC\u062F \u06CC\u0627 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0627\u0635\u0644\u0627\u062D \u067E\u06CC\u0634\u06CC\u0646\u0647 \u0627\u0633\u062A.", 403);
    const body = await request.json();
    const status = body.status === "approved" ? "approved" : "changes_requested";
    const comment = String(body.comment || "").trim();
    const charRow = await env.DB.prepare("SELECT owner_id, data, revision FROM characters WHERE id = ?").bind(charId).first();
    if (!charRow) return error("\u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const char = parseBlob(charRow.data, {});
    char.reviewStatus = status;
    char.reviewComment = comment;
    if (status === "approved") {
      char.readyForReview = false;
    }
    const nextRevision = (charRow.revision || 0) + 1;
    char.revision = nextRevision;
    char.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare("UPDATE characters SET data = ?, ready_for_review = ?, revision = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(char), status === "approved" ? 0 : 1, nextRevision, now, charId).run();
    await env.DB.prepare(
      "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, NULL, ?, ?, ?)"
    ).bind(
      `hist-rev-${Date.now()}-${generateRandomToken(3)}`,
      charId,
      "major_deed",
      JSON.stringify({
        title: status === "approved" ? "\u062A\u0623\u06CC\u06CC\u062F \u0631\u0633\u0645\u06CC \u067E\u06CC\u0634\u06CC\u0646\u0647 \u062F\u0627\u0633\u062A\u0627\u0646\u06CC" : "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0627\u0635\u0644\u0627\u062D \u067E\u06CC\u0634\u06CC\u0646\u0647",
        description: comment || (status === "approved" ? "\u067E\u06CC\u0634\u06CC\u0646\u0647 \u0648 \u062E\u0627\u0633\u062A\u06AF\u0627\u0647 \u0634\u062E\u0635\u06CC\u062A \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u062A\u0623\u06CC\u06CC\u062F \u0634\u062F." : "\u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u06CC\u0627\u062F\u062F\u0627\u0634\u062A\u200C\u0647\u0627\u06CC\u06CC \u0628\u0631\u0627\u06CC \u0628\u0647\u0628\u0648\u062F \u067E\u06CC\u0634\u06CC\u0646\u0647 \u062F\u0631\u062C \u06A9\u0631\u062F.")
      }),
      now
    ).run();
    try {
      if (charRow.owner_id && charRow.owner_id !== actor.id) {
        await notify(
          String(charRow.owner_id),
          "approval_decided",
          {
            title: status === "approved" ? "\u067E\u06CC\u0634\u06CC\u0646\u0647 \u062F\u0627\u0633\u062A\u0627\u0646\u06CC \u062A\u0623\u06CC\u06CC\u062F \u0634\u062F" : "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0627\u0635\u0644\u0627\u062D \u067E\u06CC\u0634\u06CC\u0646\u0647 \u062F\u0627\u0633\u062A\u0627\u0646\u06CC",
            body: comment || (status === "approved" ? "\u067E\u06CC\u0634\u06CC\u0646\u0647 \u062F\u0627\u0633\u062A\u0627\u0646\u06CC \u0634\u062E\u0635\u06CC\u062A \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u062A\u0623\u06CC\u06CC\u062F \u06AF\u0631\u062F\u06CC\u062F." : "\u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0628\u0627\u0632\u0646\u06AF\u0631\u06CC \u062F\u0631 \u067E\u06CC\u0634\u06CC\u0646\u0647 \u062F\u0627\u0633\u062A\u0627\u0646\u06CC \u062F\u0627\u0631\u062F."),
            targetType: "backstory",
            targetId: charId,
            link: `/character/${charId}?tab=backstory`,
            actorName: actor.display_name
          }
        );
      }
    } catch {
    }
    return json(char);
  }
  if (path.match(/^\/characters\/[^/]+\/status$/) && method === "POST") {
    const charId = path.split("/")[2];
    const body = await request.json();
    if (!["active", "retired", "dead", "archived"].includes(body.status)) return error("\u0648\u0636\u0639\u06CC\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
    const row = await env.DB.prepare("SELECT owner_id, data, revision FROM characters WHERE id = ?").bind(charId).first();
    if (!row || actor.role !== "dm" && row.owner_id !== actor.id) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const char = parseBlob(row.data, null);
    if (!char) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    char.status = body.status;
    if (body.note !== void 0) char.statusNote = body.note;
    const saved = await saveCharacterBlob(charId, char, Number(row.revision || 0) + 1);
    return json(saved);
  }
  if (path.match(/^\/characters\/[^/]+\/history$/) && method === "GET") {
    const charId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(charId).first();
    if (!row) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const isOwner = row.owner_id === actor.id;
    const isGlobalDm = actor.role === "dm";
    const filterCampId = url.searchParams.get("campaignId") || void 0;
    let dmCampaignIds = [];
    if (!isOwner && !isGlobalDm) {
      const dmMemberships = await env.DB.prepare(
        `SELECT cm.campaign_id FROM campaign_members cm
           JOIN character_participations cp ON cp.campaign_id = cm.campaign_id
          WHERE cm.user_id = ? AND cm.role IN ('owner', 'co_dm') AND cm.status = 'active'
            AND cp.character_id = ?`
      ).bind(actor.id, charId).all();
      dmCampaignIds = (dmMemberships.results || []).map((m) => m.campaign_id);
      if (dmCampaignIds.length === 0) {
        return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0628\u0647 \u062A\u0627\u0631\u06CC\u062E\u0686\u0647 \u0627\u06CC\u0646 \u0634\u062E\u0635\u06CC\u062A \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
      }
    }
    const res = await env.DB.prepare(
      `SELECT h.*, c.name AS campaign_name
         FROM character_history_events h
         LEFT JOIN campaigns c ON c.id = h.campaign_id
        WHERE h.character_id = ?
        ORDER BY h.timestamp DESC`
    ).bind(charId).all();
    const allEvents = (res.results || []).map((r) => ({
      id: r.id,
      characterId: r.character_id,
      campaignId: r.campaign_id,
      campaignName: r.campaign_name || void 0,
      eventType: r.event_type,
      payload: parseBlob(r.payload, {}),
      timestamp: r.timestamp
    }));
    let filteredEvents = allEvents;
    if (!isOwner && !isGlobalDm) {
      const allowedSet = new Set(dmCampaignIds);
      filteredEvents = allEvents.filter((e) => e.campaignId && allowedSet.has(e.campaignId));
    }
    if (filterCampId) {
      filteredEvents = filteredEvents.filter((e) => e.campaignId === filterCampId);
    }
    return json(filteredEvents);
  }
  if (path.match(/^\/characters\/[^/]+\/history$/) && method === "POST") {
    const charId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(charId).first();
    if (!row || actor.role !== "dm" && row.owner_id !== actor.id) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const eventTypes = ["joined", "level_up", "death", "major_deed", "retired", "custom", "milestone", "status_change", "session_attendance"];
    const eventType = eventTypes.includes(body.eventType) ? body.eventType : "custom";
    let campaignId = null;
    if (body.campaignId) {
      const camp = await env.DB.prepare("SELECT id FROM campaigns WHERE id = ?").bind(body.campaignId).first();
      campaignId = camp ? body.campaignId : null;
    }
    const eventId = `hist-${Date.now()}-${generateRandomToken(3)}`;
    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
    await env.DB.prepare(
      "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(eventId, charId, campaignId, eventType, JSON.stringify(payload), now).run();
    let campaignName;
    if (campaignId) {
      const camp = await env.DB.prepare("SELECT name FROM campaigns WHERE id = ?").bind(campaignId).first();
      campaignName = camp?.name;
    }
    return json({ id: eventId, characterId: charId, campaignId, campaignName, eventType, payload, timestamp: now }, 201);
  }
  if (path.match(/^\/characters\/[^/]+\/give-item$/) && method === "POST") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0634\u06CC\u0621 \u0627\u0647\u062F\u0627 \u06A9\u0646\u062F.", 403);
    const charId = path.split("/")[2];
    const body = await request.json();
    const item = body.item || {};
    const row = await env.DB.prepare("SELECT data, revision FROM characters WHERE id = ?").bind(charId).first();
    if (!row) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const char = parseBlob(row.data, null);
    if (!char) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const invItem = {
      id: `inv-${Date.now()}`,
      name: item.name,
      quantity: 1,
      weight: 1,
      description: item.description,
      category: item.category === "artifact" ? "artifact" : item.category === "weapon" ? "weapon" : "treasure",
      equipped: false,
      isQuestItem: item.category === "quest",
      isNewBadge: true,
      mechanicalEffect: item.mechanicalEffect,
      secretNotes: item.secretNotes,
      weaponData: item.weaponData
    };
    char.inventory = [invItem, ...char.inventory || []];
    if (item.category === "weapon" || item.weaponData) {
      const wData = item.weaponData;
      const newWeapon = {
        id: `w-${Date.now()}`,
        templateId: wData?.id,
        name: wData?.name || item.name,
        damageDice: wData?.damageDice || "1d6",
        damageType: wData?.damageType || "\u0633\u0631\u062F",
        range: wData?.range || "\u0646\u0632\u062F\u06CC\u06A9",
        properties: wData?.properties || "\u2014",
        kind: wData?.kind || "special",
        isSpecial: wData?.kind === "special",
        isShowy: wData?.kind === "showy",
        specialAbility: wData?.specialAbility,
        abilityName: wData?.specialAbility?.name,
        abilityDesc: wData?.specialAbility?.description,
        abilityMaxUses: wData?.specialAbility?.usesPerRest,
        abilityUsed: 0,
        abilityReset: wData?.specialAbility?.restType
      };
      char.weapons = [newWeapon, ...char.weapons || []];
    }
    const saved = await saveCharacterBlob(charId, char, Number(row.revision || 0) + 1);
    return json(saved);
  }
  const PART_SELECT = `
    SELECT p.*, c.name AS campaign_name, ch.data AS char_data
      FROM character_participations p
      JOIN campaigns c ON c.id = p.campaign_id
      LEFT JOIN characters ch ON ch.id = p.character_id
  `;
  const mapParticipation = /* @__PURE__ */ __name((r) => {
    const charBlob = parseBlob(r.char_data, null);
    return {
      id: r.id,
      characterId: r.character_id,
      campaignId: r.campaign_id,
      campaignName: r.campaign_name,
      status: r.status,
      classId: r.class_id || null,
      className: r.class_name || "",
      subclassName: r.subclass_name || void 0,
      level: r.level,
      xp: r.xp,
      abilityScores: parseBlob(r.ability_scores, { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),
      currentHp: r.current_hp,
      maxHp: r.max_hp,
      tempHp: r.temp_hp,
      hitDice: parseBlob(r.hit_dice, { current: 0, max: 0, die: "d8" }),
      acOverride: r.ac_override ?? null,
      speedOverride: r.speed_override ?? null,
      deathSaves: parseBlob(r.death_saves, { successes: 0, failures: 0 }),
      conditions: parseBlob(r.conditions, []),
      inventory: parseBlob(r.inventory, []),
      weapons: parseBlob(r.weapons, []),
      currency: parseBlob(r.currency, { gold: 0, silver: 0, copper: 0 }),
      customResources: parseBlob(r.custom_resources, []),
      spellsKnownPrepared: parseBlob(r.spells_known_prepared, void 0),
      spellSlots: parseBlob(r.spell_slots, void 0),
      features: parseBlob(r.features, []),
      notes: r.notes || "",
      dmNotes: r.dm_notes || "",
      build: parseBlob(r.build, null),
      sheetLocked: r.sheet_locked === 1,
      levelUpAvailable: r.level_up_available === 1,
      pendingLevelUp: parseBlob(r.pending_level_up, null),
      pendingChange: parseBlob(r.pending_change, null),
      joinedAt: r.joined_at,
      updatedAt: r.updated_at,
      characterName: charBlob?.name,
      characterRace: charBlob?.race,
      characterPortraitUrl: charBlob?.portraitUrl
    };
  }, "mapParticipation");
  if (path.match(/^\/c\/[^/]+\/participations$/) && method === "GET") {
    const cid = path.split("/")[2];
    const camp = await env.DB.prepare("SELECT id FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(cid).first();
    if (camp) {
      const myRole = await getMembershipRole(cid, actor.id);
      if (!myRole && actor.role !== "dm") return error("\u06A9\u0645\u067E\u06CC\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
      const isDmUser = myRole === "owner" || myRole === "co_dm" || actor.role === "dm";
      const res2 = await env.DB.prepare(`${PART_SELECT} WHERE p.campaign_id = ? ORDER BY p.joined_at DESC`).bind(cid).all();
      const mapped = (res2.results || []).map(mapParticipation).map((p) => isDmUser ? p : { ...p, dmNotes: "" });
      return json(mapped);
    }
    const char = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(cid).first();
    if (!char || char.owner_id !== actor.id && actor.role !== "dm") return json([]);
    const res = await env.DB.prepare(`${PART_SELECT} WHERE p.character_id = ? ORDER BY p.joined_at DESC`).bind(cid).all();
    return json((res.results || []).map(mapParticipation));
  }
  if (path.match(/^\/c\/[^/]+\/participations$/) && method === "POST") {
    const campId = path.split("/")[2];
    const body = await request.json();
    const camp = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u0627\u0628\u062A\u062F\u0627 \u0628\u0627\u06CC\u062F \u0628\u0647 \u0627\u06CC\u0646 \u06A9\u0645\u067E\u06CC\u0646 \u0628\u067E\u06CC\u0648\u0646\u062F\u06CC\u062F.", 403);
    if (!body.characterId) return error("\u0634\u062E\u0635\u06CC\u062A \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F.");
    const settings = parseBlob(camp.settings, {});
    const maxLevel = Number(settings.maxEntryLevel || 20);
    let level = 1;
    if (body.entryMode === "campaign_start") {
      level = Number(settings.startingLevel || 1);
    } else if (body.entryMode === "new_level") {
      level = Math.min(Math.max(1, Number(body.entryLevel || 1)), maxLevel);
    } else if (body.entryMode === "same_level") {
      level = Math.min(Number(body.entryLevel || 1), maxLevel);
    }
    const existing = await env.DB.prepare(
      "SELECT id FROM character_participations WHERE campaign_id = ? AND character_id = ?"
    ).bind(campId, body.characterId).first();
    if (existing) return error("\u0627\u06CC\u0646 \u0634\u062E\u0635\u06CC\u062A \u062F\u0631 \u0627\u06CC\u0646 \u06A9\u0645\u067E\u06CC\u0646 \u062D\u0636\u0648\u0631 \u062F\u0627\u0631\u062F.", 400);
    const charRow = await env.DB.prepare("SELECT owner_id, data FROM characters WHERE id = ?").bind(body.characterId).first();
    if (!charRow || actor.role !== "dm" && charRow.owner_id !== actor.id) {
      return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0628\u062F\u0623 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    const charBlob = parseBlob(charRow.data, null);
    const hp = 10 + (level - 1) * 6;
    const initialStatus = settings.approval?.onCreate ? "pending_approval" : "active";
    const partId = `part-${Date.now()}-${generateRandomToken(3)}`;
    const abilityScores = JSON.stringify({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    const hitDice = JSON.stringify({ current: level, max: level, die: "d8" });
    const deathSaves = JSON.stringify({ successes: 0, failures: 0 });
    const currency = JSON.stringify({ gold: 10, silver: 0, copper: 0 });
    await env.DB.prepare(
      `INSERT INTO character_participations
         (id, character_id, campaign_id, status, class_id, class_name, subclass_name, level, xp, ability_scores,
          current_hp, max_hp, temp_hp, hit_dice, ac_override, speed_override, death_saves, conditions, inventory,
          weapons, currency, custom_resources, spells_known_prepared, spell_slots, features, notes, dm_notes,
          pending_level_up, joined_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, NULL, ?, 0, ?, ?, ?, 0, ?, NULL, NULL, ?, '[]', '[]', '[]', ?, '[]', NULL, NULL, '[]', '', '', NULL, ?, ?)`
    ).bind(
      partId,
      body.characterId,
      campId,
      initialStatus,
      "\u0645\u0627\u062C\u0631\u0627\u062C\u0648",
      level,
      abilityScores,
      hp,
      hp,
      hitDice,
      deathSaves,
      currency,
      now,
      now
    ).run();
    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at) VALUES (?, ?, 'player', 'active', ?)
       ON CONFLICT(campaign_id, user_id) DO NOTHING`
    ).bind(campId, actor.id, now).run();
    const campName = camp.name;
    await env.DB.prepare(
      "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      `hist-${Date.now()}-${generateRandomToken(3)}`,
      body.characterId,
      campId,
      "joined",
      JSON.stringify({
        title: `\u067E\u06CC\u0648\u0633\u062A\u0646 \u0628\u0647 \u06A9\u0645\u067E\u06CC\u0646 ${campName}`,
        description: `\u0648\u0631\u0648\u062F \u062F\u0631 \u062D\u0627\u0644\u062A ${body.entryMode === "campaign_start" ? "\u0634\u0631\u0648\u0639 \u06A9\u0645\u067E\u06CC\u0646" : "\u0633\u0637\u062D " + level} (\u0633\u0637\u062D ${level})`,
        level
      }),
      now
    ).run();
    await audit("participation-create", partId, { campaignId: campId, characterId: body.characterId, status: initialStatus });
    const created = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(created), 201);
  }
  if (path.match(/^\/characters\/[^/]+\/legacy-join$/) && method === "POST") {
    const charId = path.split("/")[2];
    const body = await request.json();
    const targetCampaignId = body.targetCampaignId;
    const notes = String(body.notes || "").trim();
    if (!targetCampaignId) return error("\u0634\u0646\u0627\u0633\u0647 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u0642\u0635\u062F \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.", 400);
    const charRow = await env.DB.prepare("SELECT owner_id, data FROM characters WHERE id = ?").bind(charId).first();
    if (!charRow || actor.role !== "dm" && charRow.owner_id !== actor.id) {
      return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    const charBlob = parseBlob(charRow.data, null);
    if (!charBlob) return error("\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0634\u062E\u0635\u06CC\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.", 400);
    if (charBlob.status === "dead") {
      return error("\u0634\u062E\u0635\u06CC\u062A \u062F\u0631\u06AF\u0630\u0634\u062A\u0647 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062F\u0631 \u06A9\u0645\u067E\u06CC\u0646 \u062F\u06CC\u06AF\u0631\u06CC \u0634\u0631\u06A9\u062A \u06A9\u0646\u062F.", 400);
    }
    const campRow = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(targetCampaignId).first();
    if (!campRow) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0642\u0635\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (campRow.status === "archived") {
      return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0642\u0635\u062F \u0628\u0627\u06CC\u06AF\u0627\u0646\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.", 400);
    }
    const existingPart = await env.DB.prepare(
      `SELECT id, status FROM character_participations WHERE character_id = ? AND campaign_id = ?`
    ).bind(charId, targetCampaignId).first();
    if (existingPart && existingPart.status !== "retired" && existingPart.status !== "dead") {
      return error("\u0627\u06CC\u0646 \u0634\u062E\u0635\u06CC\u062A \u0647\u0645\u200C\u0627\u06A9\u0646\u0648\u0646 \u062F\u0631 \u0627\u06CC\u0646 \u06A9\u0645\u067E\u06CC\u0646 \u062D\u0636\u0648\u0631 \u062F\u0627\u0631\u062F.", 400);
    }
    const campSettings = parseBlob(campRow.settings, {});
    const startingLevel = Number(campSettings.startingLevel || 1);
    const maxEntryLevel = Number(campSettings.maxEntryLevel || 20);
    const requiresApproval = Boolean(campSettings.approval?.onCreate);
    const initialLevel = Math.max(1, Math.min(startingLevel, maxEntryLevel));
    const initialStatus = requiresApproval ? "pending_approval" : "active";
    const hp = 10 + (initialLevel - 1) * 6;
    const partId = `part-${Date.now()}-${generateRandomToken(3)}`;
    const abilityScores = JSON.stringify(charBlob.abilityScores || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    const hitDice = JSON.stringify({ current: initialLevel, max: initialLevel, die: "d8" });
    const deathSaves = JSON.stringify({ successes: 0, failures: 0 });
    const currency = JSON.stringify(charBlob.currency || { gold: 10, silver: 0, copper: 0 });
    const className = charBlob.className || "\u0645\u0627\u062C\u0631\u0627\u062C\u0648";
    await env.DB.prepare(
      `INSERT INTO character_participations
         (id, character_id, campaign_id, status, class_id, class_name, subclass_name, level, xp, ability_scores,
          current_hp, max_hp, temp_hp, hit_dice, ac_override, speed_override, death_saves, conditions, inventory,
          weapons, currency, custom_resources, spells_known_prepared, spell_slots, features, notes, dm_notes,
          pending_level_up, joined_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, NULL, ?, 0, ?, ?, ?, 0, ?, NULL, NULL, ?, '[]', '[]', '[]', ?, '[]', NULL, NULL, '[]', ?, '', NULL, ?, ?)`
    ).bind(
      partId,
      charId,
      targetCampaignId,
      initialStatus,
      className,
      initialLevel,
      abilityScores,
      hp,
      hp,
      hitDice,
      deathSaves,
      currency,
      notes,
      now,
      now
    ).run();
    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at)
       VALUES (?, ?, 'player', 'active', ?)
       ON CONFLICT(campaign_id, user_id) DO UPDATE SET status = 'active'`
    ).bind(targetCampaignId, actor.id, now).run();
    const campName = campRow.name;
    await env.DB.prepare(
      "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      `hist-${Date.now()}-${generateRandomToken(3)}`,
      charId,
      targetCampaignId,
      "joined",
      JSON.stringify({
        title: `\u0648\u0631\u0648\u062F \u0645\u06CC\u0631\u0627\u062B\u06CC \u0628\u0647 \u06A9\u0645\u067E\u06CC\u0646 ${campName}`,
        description: `\u0634\u0631\u0648\u0639 \u0645\u0634\u0627\u0631\u06A9\u062A \u0645\u06CC\u0631\u0627\u062B\u06CC \u0628\u0627 \u0633\u0637\u062D ${initialLevel}${notes ? " \u2022 \u06CC\u0627\u062F\u062F\u0627\u0634\u062A: " + notes : ""}`,
        level: initialLevel,
        isLegacyJoin: true
      }),
      now
    ).run();
    const created = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(created), 201);
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    const part = await env.DB.prepare("SELECT * FROM character_participations WHERE id = ? AND campaign_id = ?").bind(partId, campId).first();
    if (!part) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u06A9\u0645\u067E\u06CC\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (myRole === "spectator") return error("\u062A\u0645\u0627\u0634\u0627\u0686\u06CC \u062F\u0633\u062A\u0631\u0633\u06CC \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062E\u0635\u06CC\u062A \u0631\u0627 \u0646\u062F\u0627\u0631\u062F.", 403);
    const charRow = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(part.character_id).first();
    const isCharOwner = charRow?.owner_id === actor.id;
    const isDmActor = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    if (!isDmActor && !isCharOwner) {
      return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    }
    const body = await request.json();
    if (!isDmActor && body.dmNotes !== void 0) {
      delete body.dmNotes;
    }
    if (!isDmActor && part.sheet_locked === 1) {
      for (const k of Object.keys(body)) {
        if (isFieldLockedForPlayer(k)) {
          return error("\u0628\u0631\u06AF\u0647 \u0634\u062E\u0635\u06CC\u062A \u0642\u0641\u0644 \u0627\u0633\u062A. \u0645\u0634\u062E\u0635\u0627\u062A \u067E\u0627\u06CC\u0647 \u0641\u0642\u0637 \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u06CC\u0627 \u0627\u0632 \u0637\u0631\u06CC\u0642 \u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \u0631\u0633\u0645\u06CC \u0642\u0627\u0628\u0644 \u062A\u063A\u06CC\u06CC\u0631 \u0627\u0633\u062A. \u0628\u0631\u0627\u06CC \u062A\u063A\u06CC\u06CC\u0631 \u0627\u06CC\u0646 \u0645\u0648\u0627\u0631\u062F \u0627\u0632 \u06AF\u0632\u06CC\u0646\u0647 \xAB\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u063A\u06CC\u06CC\u0631 \u0628\u0647 DM\xBB \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u06A9\u0646\u06CC\u062F.", 403);
        }
      }
    }
    const colMap = {
      status: "status",
      level: "level",
      xp: "xp",
      className: "class_name",
      subclassName: "subclass_name",
      classId: "class_id",
      currentHp: "current_hp",
      maxHp: "max_hp",
      tempHp: "temp_hp",
      acOverride: "ac_override",
      speedOverride: "speed_override",
      notes: "notes",
      dmNotes: "dm_notes",
      abilityScores: "ability_scores",
      hitDice: "hit_dice",
      deathSaves: "death_saves",
      conditions: "conditions",
      inventory: "inventory",
      weapons: "weapons",
      currency: "currency",
      customResources: "custom_resources",
      spellsKnownPrepared: "spells_known_prepared",
      spellSlots: "spell_slots",
      features: "features",
      pendingLevelUp: "pending_level_up",
      build: "build",
      sheetLocked: "sheet_locked"
    };
    const sets = [];
    const binds = [];
    for (const [key, col] of Object.entries(colMap)) {
      if (body[key] === void 0) continue;
      if (key === "status" && !["draft", "pending_approval", "active", "rejected", "retired", "dead"].includes(body[key])) {
        return error("\u0648\u0636\u0639\u06CC\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
      }
      const value = key === "sheetLocked" ? body[key] ? 1 : 0 : body[key];
      sets.push(`${col} = ?`);
      binds.push(value !== null && typeof value === "object" ? JSON.stringify(value) : value);
    }
    if (sets.length > 0) {
      sets.push("updated_at = ?");
      binds.push(now);
      binds.push(partId, campId);
      await env.DB.prepare(`UPDATE character_participations SET ${sets.join(", ")} WHERE id = ? AND campaign_id = ?`).bind(...binds).run();
    }
    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    const mapped = mapParticipation(updated);
    if (!isDmActor) {
      mapped.dmNotes = "";
    }
    return json(mapped);
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/(approve|reject|request_changes)$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    const action = parts[5];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const part = await env.DB.prepare("SELECT * FROM character_participations WHERE id = ? AND campaign_id = ?").bind(partId, campId).first();
    if (!part) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json().catch(() => ({}));
    const comment = body?.comment || "";
    const pending = parseBlob(part.pending_level_up, null);
    let nextStatus = part.status;
    let nextLevel = part.level;
    let nextPending = null;
    if (action === "approve") {
      if (pending) {
        nextLevel = Number(pending.targetLevel || part.level);
        nextPending = null;
        const camp = await env.DB.prepare("SELECT name FROM campaigns WHERE id = ?").bind(campId).first();
        await env.DB.prepare(
          "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(
          `hist-lvl-${Date.now()}-${generateRandomToken(3)}`,
          part.character_id,
          campId,
          "level_up",
          JSON.stringify({
            title: `\u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \u0628\u0647 ${nextLevel} \u062A\u0623\u06CC\u06CC\u062F \u0634\u062F`,
            oldLevel: part.level,
            newLevel: nextLevel,
            description: comment || "\u062A\u0623\u06CC\u06CC\u062F \u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631",
            campaignName: camp?.name
          }),
          now
        ).run();
      } else {
        nextStatus = "active";
      }
    } else if (action === "reject") {
      nextPending = null;
      if (!pending) nextStatus = "rejected";
    }
    await env.DB.prepare(
      "UPDATE character_participations SET status = ?, level = ?, pending_level_up = ?, updated_at = ? WHERE id = ? AND campaign_id = ?"
    ).bind(nextStatus, nextLevel, nextPending ? JSON.stringify(nextPending) : null, now, partId, campId).run();
    await audit(`participation-${action}`, partId, { campaignId: campId, comment });
    try {
      const partUser = await env.DB.prepare("SELECT user_id, character_id FROM character_participations WHERE id = ?").bind(partId).first();
      if (partUser && partUser.user_id) {
        const charInfo = await env.DB.prepare("SELECT name FROM characters WHERE id = ?").bind(partUser.character_id).first();
        const actionLabelFa = action === "approve" ? "\u062A\u0623\u06CC\u06CC\u062F \u0634\u062F" : action === "reject" ? "\u0631\u062F \u0634\u062F" : "\u0646\u06CC\u0627\u0632\u0645\u0646\u062F \u0627\u0635\u0644\u0627\u062D \u0627\u0633\u062A";
        await notify(
          String(partUser.user_id),
          "approval_decided",
          {
            title: `\u0646\u062A\u06CC\u062C\u0647 \u0628\u0631\u0631\u0633\u06CC \u0634\u062E\u0635\u06CC\u062A: ${actionLabelFa}`,
            body: comment || `\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0634\u062E\u0635\u06CC\u062A \xAB${charInfo?.name || "\u0634\u062E\u0635\u06CC\u062A \u0634\u0645\u0627"}\xBB \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 ${actionLabelFa}.`,
            campaignId: campId,
            targetType: "approval",
            targetId: partId,
            link: `/campaign/${campId}/character/${partId}`,
            actorName: actor.display_name
          },
          campId
        );
      }
    } catch {
    }
    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(updated));
  }
  if (path.match(/^\/c\/[^/]+\/xp-awards$/) && method === "POST") {
    const campId = path.split("/")[2];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A. \u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u0627\u0639\u0637\u0627\u06CC \u062A\u062C\u0631\u0628\u0647 \u0627\u0633\u062A.", 403);
    const body = await request.json();
    const amount = Number(body.amount || 0);
    if (amount <= 0) return error("\u0645\u06CC\u0632\u0627\u0646 \u062A\u062C\u0631\u0628\u0647 \u0628\u0627\u06CC\u062F \u0639\u062F\u062F\u06CC \u0645\u062B\u0628\u062A \u0628\u0627\u0634\u062F.");
    const reason = String(body.reason || "\u067E\u0627\u062F\u0627\u0634 \u062A\u062C\u0631\u0628\u0647 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631").trim();
    const targetPartId = body.participationId || null;
    const awardId = `xp-${Date.now()}-${generateRandomToken(3)}`;
    await env.DB.prepare(
      `INSERT INTO xp_awards (id, campaign_id, participation_id, amount, reason, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(awardId, campId, targetPartId, amount, reason, actor.id, now).run();
    const campRow = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ?").bind(campId).first();
    const campSettings = parseBlob(campRow?.settings, {});
    const isXpMode = campSettings.levelingMode === "xp";
    if (targetPartId) {
      const partRow = await env.DB.prepare("SELECT id, level, xp FROM character_participations WHERE id = ? AND campaign_id = ?").bind(targetPartId, campId).first();
      if (partRow) {
        const newXp = (partRow.xp || 0) + amount;
        let ready = 0;
        if (isXpMode && partRow.level < 20) {
          const nextThresh = XP_THRESHOLDS[partRow.level + 1];
          if (typeof nextThresh === "number" && newXp >= nextThresh) ready = 1;
        }
        await env.DB.prepare(
          "UPDATE character_participations SET xp = ?, level_up_available = CASE WHEN ? = 1 THEN 1 ELSE level_up_available END, updated_at = ? WHERE id = ?"
        ).bind(newXp, ready, now, targetPartId).run();
      }
    } else {
      const allParts = await env.DB.prepare('SELECT id, level, xp FROM character_participations WHERE campaign_id = ? AND status = "active"').bind(campId).all();
      for (const p of allParts.results || []) {
        const newXp = (p.xp || 0) + amount;
        let ready = 0;
        if (isXpMode && p.level < 20) {
          const nextThresh = XP_THRESHOLDS[p.level + 1];
          if (typeof nextThresh === "number" && newXp >= nextThresh) ready = 1;
        }
        await env.DB.prepare(
          "UPDATE character_participations SET xp = ?, level_up_available = CASE WHEN ? = 1 THEN 1 ELSE level_up_available END, updated_at = ? WHERE id = ?"
        ).bind(newXp, ready, now, p.id).run();
      }
    }
    await audit("award-xp", campId, { amount, reason, targetPartId });
    return json({ id: awardId, campaignId: campId, participationId: targetPartId, amount, reason, createdBy: actor.id, createdAt: now }, 201);
  }
  if (path.match(/^\/c\/[^/]+\/xp-awards$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const rows = await env.DB.prepare("SELECT * FROM xp_awards WHERE campaign_id = ? ORDER BY created_at DESC LIMIT 50").bind(campId).all();
    const list = (rows.results || []).map((r) => ({
      id: r.id,
      campaignId: r.campaign_id,
      participationId: r.participation_id,
      amount: r.amount,
      reason: r.reason,
      createdBy: r.created_by,
      createdAt: r.created_at
    }));
    return json(list);
  }
  if (path.match(/^\/c\/[^/]+\/milestone-level-up$/) && method === "POST") {
    const campId = path.split("/")[2];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    const targetPartId = body.participationId || "all";
    const ready = body.ready !== false ? 1 : 0;
    let updatedCount = 0;
    if (targetPartId === "all") {
      const res = await env.DB.prepare(
        'UPDATE character_participations SET level_up_available = ?, updated_at = ? WHERE campaign_id = ? AND status = "active"'
      ).bind(ready, now, campId).run();
      updatedCount = res.meta?.changes || 0;
    } else {
      const res = await env.DB.prepare(
        "UPDATE character_participations SET level_up_available = ?, updated_at = ? WHERE id = ? AND campaign_id = ?"
      ).bind(ready, now, targetPartId, campId).run();
      updatedCount = res.meta?.changes || 0;
    }
    await audit("milestone-level-up", campId, { targetPartId, ready });
    return json({ success: true, updatedCount });
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/level-up$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    const rawPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ? AND p.campaign_id = ?`).bind(partId, campId).first();
    if (!rawPart) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const myRole = await getMembershipRole(campId, actor.id);
    const charRow = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(rawPart.character_id).first();
    const isCharOwner = charRow?.owner_id === actor.id;
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    if (!isDm && !isCharOwner) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const campRow = await env.DB.prepare("SELECT name, settings FROM campaigns WHERE id = ?").bind(campId).first();
    const campSettings = parseBlob(campRow?.settings, {});
    let classTemplate = null;
    const ctRow = await env.DB.prepare(
      'SELECT * FROM class_templates WHERE (id = ? OR name = ?) AND ((scope_type = "campaign" AND scope_id = ?) OR scope_type = "pack")'
    ).bind(rawPart.class_id || rawPart.class_name, rawPart.class_name, campId).first();
    if (ctRow) {
      classTemplate = { ...parseBlob(ctRow.data, {}), ...ctRow };
    }
    const payload = await request.json();
    const mappedPart = mapParticipation(rawPart);
    const { validation, diff, nextParticipation } = computeLevelUpDiff({
      participation: mappedPart,
      classTemplate,
      payload
    });
    if (!validation.valid) {
      return error(`\u062E\u0637\u0627 \u062F\u0631 \u0627\u0639\u062A\u0628\u0627\u0631\u0633\u0646\u062C\u06CC \u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D: ${validation.errors.join(" | ")}`, 400);
    }
    const requiresApproval = Boolean(campSettings.approval?.onLevelUp) && !isDm;
    if (requiresApproval) {
      const pendingObj = {
        fromLevel: diff.fromLevel,
        toLevel: diff.toLevel,
        diff,
        payload,
        requestedAt: now
      };
      await env.DB.prepare(
        "UPDATE character_participations SET pending_change = ?, updated_at = ? WHERE id = ?"
      ).bind(JSON.stringify(pendingObj), now, partId).run();
      await audit("level-up-request", partId, { campaignId: campId, targetLevel: diff.toLevel });
      const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
      return json(mapParticipation(updated));
    } else {
      const snapBefore = createSnapshot(mappedPart, `\u0642\u0628\u0644 \u0627\u0632 \u0627\u0631\u062A\u0642\u0627 \u0628\u0647 \u0633\u0637\u062D ${diff.toLevel}`, actor.id);
      await env.DB.prepare(
        `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(snapBefore.id, partId, snapBefore.label, JSON.stringify(snapBefore.state), JSON.stringify(snapBefore.build), snapBefore.level, actor.id, now).run();
      await env.DB.prepare(
        `UPDATE character_participations SET
           level = ?, max_hp = ?, current_hp = ?, ability_scores = ?, subclass_name = ?,
           hit_dice = ?, features = ?, spell_slots = ?, spells_known_prepared = ?,
           level_up_available = 0, pending_change = NULL, updated_at = ?
         WHERE id = ?`
      ).bind(
        nextParticipation.level,
        nextParticipation.maxHp,
        nextParticipation.currentHp,
        JSON.stringify(nextParticipation.abilityScores),
        nextParticipation.subclassName || null,
        JSON.stringify(nextParticipation.hitDice),
        JSON.stringify(nextParticipation.features),
        nextParticipation.spellSlots ? JSON.stringify(nextParticipation.spellSlots) : null,
        nextParticipation.spellsKnownPrepared ? JSON.stringify(nextParticipation.spellsKnownPrepared) : null,
        now,
        partId
      ).run();
      const snapAfter = createSnapshot(nextParticipation, `\u0627\u0631\u062A\u0642\u0627 \u0628\u0647 \u0633\u0637\u062D ${diff.toLevel}`, actor.id);
      await env.DB.prepare(
        `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(snapAfter.id, partId, snapAfter.label, JSON.stringify(snapAfter.state), JSON.stringify(snapAfter.build), snapAfter.level, actor.id, now + 1).run();
      const allSnapsRes = await env.DB.prepare(
        "SELECT id FROM participation_snapshots WHERE participation_id = ? ORDER BY created_at DESC"
      ).bind(partId).all();
      const sList = allSnapsRes.results || [];
      if (sList.length > 10) {
        for (const dId of sList.slice(10).map((s) => s.id)) {
          await env.DB.prepare("DELETE FROM participation_snapshots WHERE id = ?").bind(dId).run();
        }
      }
      await env.DB.prepare(
        "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(
        `hist-lvl-${Date.now()}-${generateRandomToken(3)}`,
        rawPart.character_id,
        campId,
        "level_up",
        JSON.stringify({
          title: `\u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \u0628\u0647 ${diff.toLevel}`,
          description: diff.hpBreakdown,
          oldLevel: diff.fromLevel,
          newLevel: diff.toLevel,
          level: diff.toLevel,
          campaignName: campRow?.name
        }),
        now
      ).run();
      await audit("level-up-complete", partId, { campaignId: campId, newLevel: diff.toLevel });
      const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
      return json(mapParticipation(finalPart));
    }
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/approve-level-up$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const rawPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ? AND p.campaign_id = ?`).bind(partId, campId).first();
    if (!rawPart) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const pendingChange = parseBlob(rawPart.pending_change, null);
    if (!pendingChange) return error("\u0647\u06CC\u0686 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D\u06CC \u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u062A\u0623\u06CC\u06CC\u062F \u0646\u06CC\u0633\u062A.", 400);
    const body = await request.json().catch(() => ({}));
    const comment = body?.comment || "";
    let classTemplate = null;
    const ctRow = await env.DB.prepare(
      'SELECT * FROM class_templates WHERE (id = ? OR name = ?) AND ((scope_type = "campaign" AND scope_id = ?) OR scope_type = "pack")'
    ).bind(rawPart.class_id || rawPart.class_name, rawPart.class_name, campId).first();
    if (ctRow) {
      classTemplate = { ...parseBlob(ctRow.data, {}), ...ctRow };
    }
    const mappedPart = mapParticipation(rawPart);
    const { diff, nextParticipation } = computeLevelUpDiff({
      participation: mappedPart,
      classTemplate,
      payload: pendingChange.payload || { hpMode: "fixed" }
    });
    const snapBefore = createSnapshot(mappedPart, `\u0642\u0628\u0644 \u0627\u0632 \u0627\u0631\u062A\u0642\u0627 \u0628\u0647 \u0633\u0637\u062D ${diff.toLevel}`, actor.id);
    await env.DB.prepare(
      `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(snapBefore.id, partId, snapBefore.label, JSON.stringify(snapBefore.state), JSON.stringify(snapBefore.build), snapBefore.level, actor.id, now).run();
    await env.DB.prepare(
      `UPDATE character_participations SET
         level = ?, max_hp = ?, current_hp = ?, ability_scores = ?, subclass_name = ?,
         hit_dice = ?, features = ?, spell_slots = ?, spells_known_prepared = ?,
         level_up_available = 0, pending_change = NULL, updated_at = ?
       WHERE id = ?`
    ).bind(
      nextParticipation.level,
      nextParticipation.maxHp,
      nextParticipation.currentHp,
      JSON.stringify(nextParticipation.abilityScores),
      nextParticipation.subclassName || null,
      JSON.stringify(nextParticipation.hitDice),
      JSON.stringify(nextParticipation.features),
      nextParticipation.spellSlots ? JSON.stringify(nextParticipation.spellSlots) : null,
      nextParticipation.spellsKnownPrepared ? JSON.stringify(nextParticipation.spellsKnownPrepared) : null,
      now,
      partId
    ).run();
    const snapAfter = createSnapshot(nextParticipation, `\u062A\u0623\u06CC\u06CC\u062F \u0627\u0631\u062A\u0642\u0627 \u0628\u0647 \u0633\u0637\u062D ${diff.toLevel}`, actor.id);
    await env.DB.prepare(
      `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(snapAfter.id, partId, snapAfter.label, JSON.stringify(snapAfter.state), JSON.stringify(snapAfter.build), snapAfter.level, actor.id, now + 1).run();
    const campRow = await env.DB.prepare("SELECT name FROM campaigns WHERE id = ?").bind(campId).first();
    await env.DB.prepare(
      "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      `hist-lvl-${Date.now()}-${generateRandomToken(3)}`,
      rawPart.character_id,
      campId,
      "level_up",
      JSON.stringify({
        title: `\u062A\u0623\u06CC\u06CC\u062F \u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \u0628\u0647 ${diff.toLevel} \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631`,
        description: comment || diff.hpBreakdown,
        oldLevel: diff.fromLevel,
        newLevel: diff.toLevel,
        level: diff.toLevel,
        campaignName: campRow?.name
      }),
      now
    ).run();
    await audit("approve-level-up", partId, { campaignId: campId, targetLevel: diff.toLevel });
    try {
      const partUser = await env.DB.prepare("SELECT user_id, character_id FROM character_participations WHERE id = ?").bind(partId).first();
      if (partUser && partUser.user_id) {
        const charInfo = await env.DB.prepare("SELECT name FROM characters WHERE id = ?").bind(partUser.character_id).first();
        await notify(
          String(partUser.user_id),
          "approval_decided",
          {
            title: `\u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \u062A\u0623\u06CC\u06CC\u062F \u0634\u062F: \u0633\u0637\u062D ${diff.toLevel}`,
            body: comment || `\u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \xAB${charInfo?.name || "\u0634\u062E\u0635\u06CC\u062A \u0634\u0645\u0627"}\xBB \u0628\u0647 \u0633\u0637\u062D ${diff.toLevel} \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u062A\u0623\u06CC\u06CC\u062F \u06AF\u0631\u062F\u06CC\u062F.`,
            campaignId: campId,
            targetType: "approval",
            targetId: partId,
            link: `/campaign/${campId}/character/${partId}`,
            actorName: actor.display_name
          },
          campId
        );
      }
    } catch {
    }
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart));
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/reject-level-up$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json().catch(() => ({}));
    await env.DB.prepare("UPDATE character_participations SET pending_change = NULL, updated_at = ? WHERE id = ?").bind(now, partId).run();
    await audit("reject-level-up", partId, { campaignId: campId, comment: body?.comment });
    try {
      const partUser = await env.DB.prepare("SELECT user_id, character_id FROM character_participations WHERE id = ?").bind(partId).first();
      if (partUser && partUser.user_id) {
        const charInfo = await env.DB.prepare("SELECT name FROM characters WHERE id = ?").bind(partUser.character_id).first();
        await notify(
          String(partUser.user_id),
          "approval_decided",
          {
            title: `\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \u0631\u062F \u0634\u062F`,
            body: body?.comment || `\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \u0628\u0631\u0627\u06CC \xAB${charInfo?.name || "\u0634\u062E\u0635\u06CC\u062A \u0634\u0645\u0627"}\xBB \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0631\u062F \u06AF\u0631\u062F\u06CC\u062F.`,
            campaignId: campId,
            targetType: "approval",
            targetId: partId,
            link: `/campaign/${campId}/character/${partId}`,
            actorName: actor.display_name
          },
          campId
        );
      }
    } catch {
    }
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart));
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/undo-level-up$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const rawPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ? AND p.campaign_id = ?`).bind(partId, campId).first();
    if (!rawPart) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (rawPart.level <= 1) return error("\u0633\u0637\u062D \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06F1 \u0627\u0633\u062A \u0648 \u0627\u0645\u06A9\u0627\u0646 \u0644\u063A\u0648 \u0627\u0631\u062A\u0642\u0627 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 400);
    const targetLevel = rawPart.level - 1;
    const snap = await env.DB.prepare(
      "SELECT * FROM participation_snapshots WHERE participation_id = ? AND level = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(partId, targetLevel).first();
    if (snap) {
      const state = parseBlob(snap.state, {});
      await env.DB.prepare(
        `UPDATE character_participations SET
           level = ?, max_hp = ?, current_hp = ?, ability_scores = ?,
           hit_dice = ?, features = ?, updated_at = ?
         WHERE id = ?`
      ).bind(
        targetLevel,
        state.maxHp || Math.max(1, rawPart.max_hp - 6),
        Math.min(state.maxHp || rawPart.max_hp - 6, rawPart.current_hp),
        state.abilityScores ? JSON.stringify(state.abilityScores) : rawPart.ability_scores,
        state.hitDice ? JSON.stringify(state.hitDice) : rawPart.hit_dice,
        state.features ? JSON.stringify(state.features) : rawPart.features,
        now,
        partId
      ).run();
    } else {
      await env.DB.prepare(
        `UPDATE character_participations SET
           level = ?, max_hp = MAX(1, max_hp - 6), current_hp = MIN(current_hp, MAX(1, max_hp - 6)),
           hit_dice = json_set(hit_dice, '$.max', ?, '$.current', MIN(?, json_extract(hit_dice, '$.current'))),
           updated_at = ?
         WHERE id = ?`
      ).bind(targetLevel, targetLevel, targetLevel, now, partId).run();
    }
    await env.DB.prepare(
      "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      `hist-undo-${Date.now()}-${generateRandomToken(3)}`,
      rawPart.character_id,
      campId,
      "custom",
      JSON.stringify({
        title: "\u0644\u063A\u0648 \u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \u0627\u062E\u06CC\u0631",
        description: `\u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 \u0633\u0637\u062D ${targetLevel} \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631`,
        level: targetLevel
      }),
      now
    ).run();
    await audit("undo-level-up", partId, { campaignId: campId, targetLevel });
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart));
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/dm-override$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const rawPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ? AND p.campaign_id = ?`).bind(partId, campId).first();
    if (!rawPart) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const overrideData = body.data || {};
    const reason = String(body.reason || "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u0645\u0633\u062A\u0642\u06CC\u0645 \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631").trim();
    const colMap = {
      level: "level",
      xp: "xp",
      className: "class_name",
      subclassName: "subclass_name",
      classId: "class_id",
      currentHp: "current_hp",
      maxHp: "max_hp",
      tempHp: "temp_hp",
      abilityScores: "ability_scores",
      hitDice: "hit_dice",
      sheetLocked: "sheet_locked",
      speedOverride: "speed_override",
      acOverride: "ac_override",
      notes: "notes",
      dmNotes: "dm_notes"
    };
    const sets = [];
    const binds = [];
    for (const [key, col] of Object.entries(colMap)) {
      if (overrideData[key] === void 0) continue;
      const val = key === "sheetLocked" ? overrideData[key] ? 1 : 0 : overrideData[key];
      sets.push(`${col} = ?`);
      binds.push(val !== null && typeof val === "object" ? JSON.stringify(val) : val);
    }
    if (sets.length > 0) {
      sets.push("updated_at = ?");
      binds.push(now, partId);
      await env.DB.prepare(`UPDATE character_participations SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();
    }
    await env.DB.prepare(
      "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      `hist-dmedit-${Date.now()}-${generateRandomToken(3)}`,
      rawPart.character_id,
      campId,
      "custom",
      JSON.stringify({
        title: "\u0648\u06CC\u0631\u0627\u06CC\u0634 DM",
        description: reason,
        modifiedFields: Object.keys(overrideData)
      }),
      now
    ).run();
    await audit("dm-override", partId, { campaignId: campId, reason, fields: Object.keys(overrideData) });
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart));
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/respec-window$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    const open = Boolean(body.open);
    await env.DB.prepare("UPDATE character_participations SET sheet_locked = ?, updated_at = ? WHERE id = ?").bind(open ? 0 : 1, now, partId).run();
    await audit("respec-window", partId, { campaignId: campId, open });
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart));
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/sheet-change-request$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    const rawPart = await env.DB.prepare("SELECT id, character_id FROM character_participations WHERE id = ? AND campaign_id = ?").bind(partId, campId).first();
    if (!rawPart) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const requestedChanges = String(body.requestedChanges || "").trim();
    if (!requestedChanges) return error("\u0634\u0631\u062D \u062A\u063A\u06CC\u06CC\u0631\u0627\u062A \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const reason = String(body.reason || "").trim();
    const reqId = `scr-${Date.now()}-${generateRandomToken(3)}`;
    await env.DB.prepare(
      `INSERT INTO sheet_change_requests (id, campaign_id, participation_id, user_id, requested_changes, reason, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(reqId, campId, partId, actor.id, requestedChanges, reason, now, now).run();
    await audit("sheet-change-request", partId, { campaignId: campId, reqId });
    return json({ id: reqId, campaignId: campId, participationId: partId, userId: actor.id, requestedChanges, reason, status: "pending", createdAt: now, updatedAt: now }, 201);
  }
  if (path.match(/^\/c\/[^/]+\/sheet-change-requests$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const rows = await env.DB.prepare(
      `SELECT scr.*, u.display_name AS player_name, ch.name AS character_name
         FROM sheet_change_requests scr
         JOIN users u ON u.id = scr.user_id
         JOIN character_participations p ON p.id = scr.participation_id
         LEFT JOIN characters ch ON ch.id = p.character_id
        WHERE scr.campaign_id = ?
        ORDER BY scr.created_at DESC`
    ).bind(campId).all();
    const list = (rows.results || []).map((r) => ({
      id: r.id,
      campaignId: r.campaign_id,
      participationId: r.participation_id,
      userId: r.user_id,
      requestedChanges: r.requested_changes,
      reason: r.reason,
      status: r.status,
      reviewComment: r.review_comment,
      characterName: r.character_name,
      playerName: r.player_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    return json(list);
  }
  if (path.match(/^\/c\/[^/]+\/sheet-change-requests\/[^/]+\/review$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const reqId = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const reqRow = await env.DB.prepare("SELECT * FROM sheet_change_requests WHERE id = ? AND campaign_id = ?").bind(reqId, campId).first();
    if (!reqRow) return error("\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const action = body.action === "approve" ? "approved" : "rejected";
    const comment = String(body.comment || "").trim();
    await env.DB.prepare("UPDATE sheet_change_requests SET status = ?, review_comment = ?, updated_at = ? WHERE id = ?").bind(action, comment, now, reqId).run();
    if (action === "approved") {
      const partRow = await env.DB.prepare("SELECT * FROM character_participations WHERE id = ?").bind(reqRow.participation_id).first();
      if (partRow) {
        const snap = createSnapshot(mapParticipation(partRow), `\u067E\u06CC\u0634 \u0627\u0632 \u0627\u0639\u0645\u0627\u0644 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u063A\u06CC\u06CC\u0631: ${(reqRow.requested_changes || "").slice(0, 30)}`, actor.id);
        await env.DB.prepare(
          `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(snap.id, reqRow.participation_id, snap.label, JSON.stringify(snap.state), JSON.stringify(snap.build), snap.level, actor.id, now).run();
        const patch = body.modifiedPatch || parseBlob(reqRow.patch, null);
        if (patch && typeof patch === "object" && Object.keys(patch).length > 0) {
          const colMap = {
            level: "level",
            xp: "xp",
            className: "class_name",
            subclassName: "subclass_name",
            currentHp: "current_hp",
            maxHp: "max_hp",
            tempHp: "temp_hp",
            abilityScores: "ability_scores",
            hitDice: "hit_dice",
            sheetLocked: "sheet_locked",
            notes: "notes"
          };
          const sets = [];
          const binds = [];
          for (const [k, c] of Object.entries(colMap)) {
            if (patch[k] !== void 0) {
              sets.push(`${c} = ?`);
              const val = k === "sheetLocked" ? patch[k] ? 1 : 0 : patch[k];
              binds.push(val !== null && typeof val === "object" ? JSON.stringify(val) : val);
            }
          }
          if (sets.length > 0) {
            sets.push("updated_at = ?");
            binds.push(now, reqRow.participation_id);
            await env.DB.prepare(`UPDATE character_participations SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();
          }
        } else {
          await env.DB.prepare("UPDATE character_participations SET sheet_locked = 0, updated_at = ? WHERE id = ?").bind(now, reqRow.participation_id).run();
        }
        await env.DB.prepare(
          "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(
          `hist-scr-${Date.now()}-${generateRandomToken(3)}`,
          partRow.character_id,
          campId,
          "custom",
          JSON.stringify({
            title: "\u062A\u0623\u06CC\u06CC\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u063A\u06CC\u06CC\u0631 \u0634\u06CC\u062A",
            description: `\u062F\u0631\u062E\u0648\u0627\u0633\u062A \xAB${reqRow.requested_changes}\xBB \u062A\u0648\u0633\u0637 DM \u062A\u0623\u06CC\u06CC\u062F \u0634\u062F.${comment ? " \u06CC\u0627\u062F\u062F\u0627\u0634\u062A: " + comment : ""}`,
            decidedBy: actor.id
          }),
          now
        ).run();
      }
    }
    await audit("sheet-change-review", reqId, { action, comment });
    const updated = await env.DB.prepare("SELECT * FROM sheet_change_requests WHERE id = ?").bind(reqId).first();
    return json(updated);
  }
  if (path.match(/^\/c\/[^/]+\/edit-grants$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const partId = url.searchParams.get("participationId");
    let q = "SELECT * FROM edit_grants WHERE 1=1";
    const binds = [];
    if (partId) {
      q += " AND participation_id = ?";
      binds.push(partId);
    }
    q += " ORDER BY created_at DESC";
    const rows = await env.DB.prepare(q).bind(...binds).all();
    const list = (rows.results || []).map((r) => ({
      id: r.id,
      campaignId: campId,
      participationId: r.participation_id,
      scope: r.scope,
      preset: r.preset,
      fields: parseBlob(r.fields, []),
      expiresAt: r.expires_at,
      usesLeft: r.uses_left,
      reason: r.reason,
      status: r.status,
      grantedBy: r.granted_by,
      createdAt: r.created_at
    }));
    return json(list);
  }
  if (path.match(/^\/c\/[^/]+\/edit-grants$/) && method === "POST") {
    const campId = path.split("/")[2];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    const partId = body.participationId;
    if (!partId) return error("\u0634\u0646\u0627\u0633\u0647 \u0645\u0634\u0627\u0631\u06A9\u062A \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const grantId = `eg-${Date.now()}-${generateRandomToken(4)}`;
    const scope = body.scope === "fields" ? "fields" : "preset";
    const preset = body.preset || null;
    const fields = JSON.stringify(body.fields || []);
    const expiresAt = Number(body.expiresAt) || now + 24 * 36e5;
    const usesLeft = body.usesLeft !== void 0 ? Number(body.usesLeft) : 1;
    const reason = String(body.reason || "\u0645\u062C\u0648\u0632 \u0648\u06CC\u0631\u0627\u06CC\u0634 DM").trim();
    await env.DB.prepare(
      `INSERT INTO edit_grants (id, participation_id, scope, preset, fields, expires_at, uses_left, reason, status, granted_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    ).bind(grantId, partId, scope, preset, fields, expiresAt, usesLeft, reason, actor.id, now).run();
    const partRow = await env.DB.prepare("SELECT character_id FROM character_participations WHERE id = ?").bind(partId).first();
    if (partRow) {
      await env.DB.prepare(
        "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(
        `hist-grant-${Date.now()}-${generateRandomToken(3)}`,
        partRow.character_id,
        campId,
        "custom",
        JSON.stringify({
          title: "\u0627\u0639\u0637\u0627\u06CC \u0645\u062C\u0648\u0632 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u06CC\u062A",
          description: `\u0645\u062C\u0648\u0632 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0645\u0648\u0642\u062A \u062A\u0648\u0633\u0637 DM: ${reason}`,
          grantId,
          grantedBy: actor.id
        }),
        now
      ).run();
    }
    await audit("create-edit-grant", grantId, { campaignId: campId, partId, scope, preset, usesLeft });
    return json({
      id: grantId,
      campaignId: campId,
      participationId: partId,
      scope,
      preset,
      fields: body.fields || [],
      expiresAt,
      usesLeft,
      reason,
      status: "active",
      grantedBy: actor.id,
      createdAt: now
    }, 201);
  }
  if (path.match(/^\/c\/grants\/[^/]+\/revoke$/) && method === "POST") {
    const grantId = path.split("/")[3];
    const grantRow = await env.DB.prepare("SELECT * FROM edit_grants WHERE id = ?").bind(grantId).first();
    if (!grantRow) return error("\u0645\u062C\u0648\u0632 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    await env.DB.prepare('UPDATE edit_grants SET status = "revoked" WHERE id = ?').bind(grantId).run();
    await audit("revoke-edit-grant", grantId, {});
    return json({ ...grantRow, status: "revoked" });
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/status$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    const part = await env.DB.prepare("SELECT * FROM character_participations WHERE id = ? AND campaign_id = ?").bind(partId, campId).first();
    if (!part) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== "dm" && myRole !== "owner" && myRole !== "co_dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    if (!["pending_approval", "active", "rejected", "retired", "dead"].includes(body.status)) {
      return error("\u0648\u0636\u0639\u06CC\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
    }
    await env.DB.prepare("UPDATE character_participations SET status = ?, updated_at = ? WHERE id = ? AND campaign_id = ?").bind(body.status, now, partId, campId).run();
    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(updated));
  }
  if (path === "/c/wizard/roll-abilities" && method === "POST") {
    const random = /* @__PURE__ */ __name(() => {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return arr[0] / (4294967295 + 1);
    }, "random");
    const { rolls, scores } = rollAbilityScores(random);
    return json({ rolls, scores });
  }
  if ((path === "/c/wizard/drafts" || path.match(/^\/c\/[^/]+\/participations\/drafts$/)) && method === "GET") {
    const cid = path.startsWith("/c/wizard") ? null : path.split("/")[2];
    let query = `${PART_SELECT} WHERE p.status = 'draft'`;
    const params = [];
    if (cid && cid !== "all") {
      query += " AND p.campaign_id = ?";
      params.push(cid);
    }
    query += " AND ch.owner_id = ? ORDER BY p.updated_at DESC";
    params.push(actor.id);
    const res = await env.DB.prepare(query).bind(...params).all();
    return json((res.results || []).map(mapParticipation));
  }
  if (path.match(/^\/c\/[^/]+\/participations\/draft$/) && method === "POST") {
    const campId = path.split("/")[2];
    const body = await request.json();
    const camp = await env.DB.prepare("SELECT id, name FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    let charId = body.characterId;
    let masterCharRow = null;
    if (charId) {
      masterCharRow = await env.DB.prepare("SELECT id, data FROM characters WHERE id = ?").bind(charId).first();
    }
    if (!charId || !masterCharRow) {
      charId = `char-${Date.now()}-${generateRandomToken(3)}`;
      const masterBlob = {
        id: charId,
        ownerId: actor.id,
        name: body.masterData?.name || body.name || "\u067E\u06CC\u0634\u200C\u0646\u0648\u06CC\u0633 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631",
        race: body.masterData?.race || body.race || "\u0622\u062F\u0645\u06CC",
        appearance: body.masterData?.appearance || "",
        portraitUrl: body.masterData?.portraitUrl || "",
        backstory: body.masterData?.backstory || { summary: "" },
        status: "active"
      };
      await env.DB.prepare(
        "INSERT INTO characters (id, owner_id, name, class_name, level, data, revision, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)"
      ).bind(charId, actor.id, masterBlob.name, body.className || "\u0645\u0627\u062C\u0631\u0627\u062C\u0648", body.level || 1, JSON.stringify(masterBlob), now).run();
    } else if (body.masterData) {
      const existingBlob = parseBlob(masterCharRow.data, {});
      const updatedBlob = { ...existingBlob, ...body.masterData, updatedAt: now };
      await env.DB.prepare("UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ?").bind(updatedBlob.name || masterCharRow.name, JSON.stringify(updatedBlob), now, charId).run();
    }
    let partId = body.id || body.participationId;
    let existingPart = null;
    if (partId) {
      existingPart = await env.DB.prepare("SELECT id FROM character_participations WHERE id = ?").bind(partId).first();
    } else {
      existingPart = await env.DB.prepare('SELECT id FROM character_participations WHERE campaign_id = ? AND character_id = ? AND status = "draft"').bind(campId, charId).first();
      if (existingPart) partId = existingPart.id;
    }
    const buildJson = JSON.stringify(body.build || {});
    const level = body.level || 1;
    const abilityScores = JSON.stringify(body.build?.pointBuy?.scores || body.build?.rolls?.assigned || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    const hp = 10;
    const hitDice = JSON.stringify({ current: level, max: level, die: "d8" });
    const deathSaves = JSON.stringify({ successes: 0, failures: 0 });
    const currency = JSON.stringify({ gold: 15, silver: 0, copper: 0 });
    if (existingPart) {
      await env.DB.prepare(
        `UPDATE character_participations SET
           class_name = ?, level = ?, ability_scores = ?, build = ?, sheet_locked = 1, updated_at = ?
         WHERE id = ?`
      ).bind(body.className || "\u0645\u0627\u062C\u0631\u0627\u062C\u0648", level, abilityScores, buildJson, now, partId).run();
    } else {
      partId = `part-draft-${Date.now()}-${generateRandomToken(3)}`;
      await env.DB.prepare(
        `INSERT INTO character_participations
           (id, character_id, campaign_id, status, class_name, level, xp, ability_scores,
            current_hp, max_hp, temp_hp, hit_dice, death_saves, conditions, inventory, weapons,
            currency, custom_resources, features, notes, dm_notes, build, sheet_locked, joined_at, updated_at)
         VALUES (?, ?, ?, 'draft', ?, ?, 0, ?, ?, ?, 0, ?, ?, '[]', '[]', '[]', ?, '[]', '[]', '', '', ?, 1, ?, ?)`
      ).bind(partId, charId, campId, body.className || "\u0645\u0627\u062C\u0631\u0627\u062C\u0648", level, abilityScores, hp, hp, hitDice, deathSaves, currency, buildJson, now, now).run();
    }
    const saved = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(saved));
  }
  if (path.match(/^\/c\/[^/]+\/participations\/wizard-submit$/) && method === "POST") {
    const campId = path.split("/")[2];
    const body = await request.json();
    const camp = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const campSettings = parseBlob(camp.settings, {});
    let classTemplate = null;
    const classIdOrName = body.classId || body.className || body.build?.className;
    if (classIdOrName) {
      const ctRow = await env.DB.prepare(
        'SELECT * FROM class_templates WHERE (id = ? OR name = ?) AND ((scope_type = "campaign" AND scope_id = ?) OR scope_type = "pack")'
      ).bind(classIdOrName, classIdOrName, campId).first();
      if (ctRow) {
        classTemplate = { ...parseBlob(ctRow.data, {}), ...ctRow };
      }
    }
    let lineageTemplate = null;
    if (body.build?.lineageId) {
      const linRow = await env.DB.prepare("SELECT * FROM lineage_templates WHERE id = ?").bind(body.build.lineageId).first();
      if (linRow) {
        lineageTemplate = {
          ...linRow,
          abilityBonuses: parseBlob(linRow.ability_bonuses, {}),
          proficiencies: parseBlob(linRow.proficiencies, {}),
          traits: parseBlob(linRow.traits, [])
        };
      }
    }
    let backgroundTemplate = null;
    if (body.build?.backgroundId) {
      const bgRow = await env.DB.prepare("SELECT * FROM background_templates WHERE id = ?").bind(body.build.backgroundId).first();
      if (bgRow) {
        backgroundTemplate = {
          ...bgRow,
          skillProficiencies: parseBlob(bgRow.skill_proficiencies, []),
          startingEquipment: parseBlob(bgRow.starting_equipment, [])
        };
      }
    }
    const { participation: computed, validation } = computeAuthoritativeParticipation({
      masterData: body.masterData || {},
      build: body.build,
      campaignId: campId,
      campaignSettings: campSettings,
      classTemplate,
      lineageTemplate,
      backgroundTemplate,
      entryLevel: body.entryLevel || campSettings.startingLevel || 1
    });
    if (!validation.valid && validation.errors.length > 0) {
      return error(`\u062E\u0637\u0627 \u062F\u0631 \u0627\u0639\u062A\u0628\u0627\u0631\u0633\u0646\u062C\u06CC \u0642\u0648\u0627\u0646\u06CC\u0646 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631: ${validation.errors.join(" | ")}`, 400);
    }
    let charId = body.characterId;
    const masterBlob = {
      id: charId || `char-${Date.now()}-${generateRandomToken(3)}`,
      ownerId: actor.id,
      name: body.masterData?.name || computed.characterName || "\u0634\u062E\u0635\u06CC\u062A",
      race: body.masterData?.race || computed.characterRace || "\u0622\u062F\u0645\u06CC",
      appearance: body.masterData?.appearance || "",
      portraitUrl: body.masterData?.portraitUrl || "",
      backstory: body.masterData?.backstory || { summary: "" },
      status: "active"
    };
    if (charId) {
      await env.DB.prepare("UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ?").bind(masterBlob.name, JSON.stringify(masterBlob), now, charId).run();
    } else {
      charId = masterBlob.id;
      await env.DB.prepare(
        "INSERT INTO characters (id, owner_id, name, class_name, level, data, revision, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)"
      ).bind(charId, actor.id, masterBlob.name, computed.className, computed.level, JSON.stringify(masterBlob), now).run();
    }
    let partId = body.participationId;
    const existing = partId ? await env.DB.prepare("SELECT id FROM character_participations WHERE id = ?").bind(partId).first() : null;
    if (existing) {
      await env.DB.prepare(
        `UPDATE character_participations SET
           character_id = ?, status = ?, class_id = ?, class_name = ?, subclass_name = ?, level = ?, xp = ?,
           ability_scores = ?, current_hp = ?, max_hp = ?, temp_hp = 0, hit_dice = ?, ac_override = ?,
           speed_override = ?, death_saves = ?, conditions = ?, inventory = ?, weapons = ?, currency = ?,
           custom_resources = ?, spells_known_prepared = ?, spell_slots = ?, features = ?, notes = ?, dm_notes = ?,
           build = ?, sheet_locked = ?, updated_at = ?
         WHERE id = ?`
      ).bind(
        charId,
        computed.status,
        computed.classId,
        computed.className,
        computed.subclassName || null,
        computed.level,
        computed.xp,
        JSON.stringify(computed.abilityScores),
        computed.currentHp,
        computed.maxHp,
        JSON.stringify(computed.hitDice),
        computed.acOverride,
        computed.speedOverride,
        JSON.stringify(computed.deathSaves),
        JSON.stringify(computed.conditions),
        JSON.stringify(computed.inventory),
        JSON.stringify(computed.weapons),
        JSON.stringify(computed.currency),
        JSON.stringify(computed.customResources),
        computed.spellsKnownPrepared ? JSON.stringify(computed.spellsKnownPrepared) : null,
        computed.spellSlots ? JSON.stringify(computed.spellSlots) : null,
        JSON.stringify(computed.features),
        computed.notes,
        computed.dmNotes,
        JSON.stringify(computed.build),
        computed.sheetLocked ? 1 : 0,
        now,
        partId
      ).run();
    } else {
      partId = `part-${Date.now()}-${generateRandomToken(3)}`;
      await env.DB.prepare(
        `INSERT INTO character_participations
           (id, character_id, campaign_id, status, class_id, class_name, subclass_name, level, xp,
            ability_scores, current_hp, max_hp, temp_hp, hit_dice, ac_override, speed_override,
            death_saves, conditions, inventory, weapons, currency, custom_resources, spells_known_prepared,
            spell_slots, features, notes, dm_notes, build, sheet_locked, joined_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        partId,
        charId,
        campId,
        computed.status,
        computed.classId,
        computed.className,
        computed.subclassName || null,
        computed.level,
        computed.xp,
        JSON.stringify(computed.abilityScores),
        computed.currentHp,
        computed.maxHp,
        JSON.stringify(computed.hitDice),
        computed.acOverride,
        computed.speedOverride,
        JSON.stringify(computed.deathSaves),
        JSON.stringify(computed.conditions),
        JSON.stringify(computed.inventory),
        JSON.stringify(computed.weapons),
        JSON.stringify(computed.currency),
        JSON.stringify(computed.customResources),
        computed.spellsKnownPrepared ? JSON.stringify(computed.spellsKnownPrepared) : null,
        computed.spellSlots ? JSON.stringify(computed.spellSlots) : null,
        JSON.stringify(computed.features),
        computed.notes,
        computed.dmNotes,
        JSON.stringify(computed.build),
        computed.sheetLocked ? 1 : 0,
        now,
        now
      ).run();
    }
    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at)
       VALUES (?, ?, 'player', 'active', ?)
       ON CONFLICT(campaign_id, user_id) DO NOTHING`
    ).bind(campId, actor.id, now).run();
    await env.DB.prepare(
      "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      `hist-${Date.now()}-${generateRandomToken(3)}`,
      charId,
      campId,
      "joined",
      JSON.stringify({
        title: `\u067E\u06CC\u0648\u0633\u062A\u0646 \u0628\u0647 \u06A9\u0645\u067E\u06CC\u0646 ${camp.name}`,
        description: `\u0622\u0641\u0631\u06CC\u0646\u0634 \u06A9\u0627\u0645\u0644 \u0634\u062E\u0635\u06CC\u062A \u062F\u0631 \u0633\u0637\u062D ${computed.level} \u0628\u0627 \u0648\u06CC\u0632\u0627\u0631\u062F`,
        level: computed.level
      }),
      now
    ).run();
    const fullPart = {
      id: partId,
      characterId: charId,
      ...computed
    };
    const snap = createSnapshot(fullPart, `\u0622\u0641\u0631\u06CC\u0646\u0634 \u0634\u062E\u0635\u06CC\u062A (\u0633\u0637\u062D ${computed.level})`, actor.id);
    await env.DB.prepare(
      `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      snap.id,
      partId,
      snap.label,
      JSON.stringify(snap.state),
      JSON.stringify(snap.build),
      snap.level,
      actor.id,
      now
    ).run();
    const allSnapsRes = await env.DB.prepare(
      "SELECT id, created_at FROM participation_snapshots WHERE participation_id = ? ORDER BY created_at DESC"
    ).bind(partId).all();
    const snapsList = allSnapsRes.results || [];
    if (snapsList.length > 10) {
      const toDelete = snapsList.slice(10).map((s) => s.id);
      for (const dId of toDelete) {
        await env.DB.prepare("DELETE FROM participation_snapshots WHERE id = ?").bind(dId).run();
      }
    }
    await audit("participation-wizard-submit", partId, { campaignId: campId, characterId: charId, status: computed.status });
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart), 201);
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/snapshots$/) && method === "GET") {
    const parts = path.split("/");
    const partId = parts[4];
    const rows = await env.DB.prepare(
      "SELECT * FROM participation_snapshots WHERE participation_id = ? ORDER BY created_at DESC LIMIT 10"
    ).bind(partId).all();
    const list = (rows.results || []).map((r) => ({
      id: r.id,
      participationId: r.participation_id,
      label: r.label,
      state: parseBlob(r.state, {}),
      build: parseBlob(r.build, {}),
      level: r.level,
      createdBy: r.created_by,
      createdAt: r.created_at
    }));
    return json(list);
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/snapshots$/) && method === "POST") {
    const parts = path.split("/");
    const partId = parts[4];
    const body = await request.json();
    const label = String(body.label || "\u0639\u06A9\u0633 \u0644\u062D\u0638\u0647\u200C\u0627\u06CC").trim();
    const part = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    if (!part) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const fullPart = mapParticipation(part);
    const snap = createSnapshot(fullPart, label, actor.id);
    await env.DB.prepare(
      `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(snap.id, partId, snap.label, JSON.stringify(snap.state), JSON.stringify(snap.build), snap.level, actor.id, now).run();
    const allSnaps = await env.DB.prepare(
      "SELECT id, created_at FROM participation_snapshots WHERE participation_id = ? ORDER BY created_at DESC"
    ).bind(partId).all();
    const snapsList = allSnaps.results || [];
    if (snapsList.length > 10) {
      const toDelete = snapsList.slice(10).map((s) => s.id);
      for (const dId of toDelete) {
        await env.DB.prepare("DELETE FROM participation_snapshots WHERE id = ?").bind(dId).run();
      }
    }
    return json(snap, 201);
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/snapshots\/[^/]+\/restore$/) && method === "POST") {
    const parts = path.split("/");
    const partId = parts[4];
    const snapId = parts[6];
    const snap = await env.DB.prepare("SELECT * FROM participation_snapshots WHERE id = ? AND participation_id = ?").bind(snapId, partId).first();
    if (!snap) return error("\u0639\u06A9\u0633 \u0644\u062D\u0638\u0647\u200C\u0627\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const state = parseBlob(snap.state, {});
    const build = parseBlob(snap.build, {});
    await env.DB.prepare(
      `UPDATE character_participations SET
         level = ?, ability_scores = ?, current_hp = ?, max_hp = ?, temp_hp = ?,
         hit_dice = ?, inventory = ?, weapons = ?, currency = ?, custom_resources = ?,
         spells_known_prepared = ?, spell_slots = ?, features = ?, build = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      snap.level,
      JSON.stringify(state.abilityScores || {}),
      state.currentHp || 10,
      state.maxHp || 10,
      state.tempHp || 0,
      JSON.stringify(state.hitDice || {}),
      JSON.stringify(state.inventory || []),
      JSON.stringify(state.weapons || []),
      JSON.stringify(state.currency || {}),
      JSON.stringify(state.customResources || []),
      state.spellsKnownPrepared ? JSON.stringify(state.spellsKnownPrepared) : null,
      state.spellSlots ? JSON.stringify(state.spellSlots) : null,
      JSON.stringify(state.features || []),
      JSON.stringify(build),
      now,
      partId
    ).run();
    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(updated));
  }
  if (path.match(/^\/items\/[^/]+$/) && method === "PUT") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0646\u062F.", 403);
    const itemId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT id FROM items WHERE id = ?").bind(itemId).first();
    if (!row) return error("\u0634\u06CC\u0621 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const data = await request.json();
    const updated = { ...data, id: itemId, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "UPDATE items SET name = ?, category = ?, is_revealed = ?, data = ?, updated_at = ? WHERE id = ?"
    ).bind(updated.name || "\u0634\u06CC\u0621", updated.category || "general", updated.isRevealed ? 1 : 0, JSON.stringify(updated), now, itemId).run();
    return json(updated);
  }
  if (path.match(/^\/items\/[^/]+$/) && method === "DELETE") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062D\u0630\u0641 \u06A9\u0646\u062F.", 403);
    const itemId = path.split("/")[2];
    const res = await env.DB.prepare("DELETE FROM items WHERE id = ?").bind(itemId).run();
    if ((res?.meta?.changes ?? 0) === 0) return error("\u0634\u06CC\u0621 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    await audit("item-delete", itemId, {});
    return json({ success: true });
  }
  if (path === "/rewards" && method === "POST") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u067E\u0627\u062F\u0627\u0634 \u0628\u0633\u0627\u0632\u062F.", 403);
    const body = await request.json();
    const rewardId = `rew-${Date.now()}-${generateRandomToken(3)}`;
    const newRew = {
      ...body,
      id: rewardId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.DB.prepare(
      "INSERT INTO rewards (id, scope_type, scope_id, created_by, title, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(rewardId, "campaign", "zorvania-c1", actor.id, newRew.title || "\u067E\u0627\u062F\u0627\u0634", JSON.stringify(newRew), now).run();
    return json(newRew, 201);
  }
  if (path.match(/^\/rewards\/[^/]+\/distribute$/) && method === "POST") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u067E\u0627\u062F\u0627\u0634 \u062A\u0648\u0632\u06CC\u0639 \u06A9\u0646\u062F.", 403);
    const rewardId = path.split("/")[2];
    const body = await request.json();
    const charIds = Array.isArray(body.characterIds) ? body.characterIds : [];
    const rewRow = await env.DB.prepare("SELECT data FROM rewards WHERE id = ?").bind(rewardId).first();
    if (!rewRow) return error("\u067E\u0627\u062F\u0627\u0634 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const rew = parseBlob(rewRow.data, {}) || {};
    const rows = await loadCharacterBlobs();
    const updated = [];
    for (const row of rows) {
      const char = parseBlob(row.data, null);
      if (!char) continue;
      if (!charIds.includes(row.id)) {
        updated.push(char);
        continue;
      }
      const currencies = { gold: 0, silver: 0, copper: 0, ...char.currencies || {} };
      currencies.gold = Number(currencies.gold || 0) + Number(rew.gold || 0);
      currencies.silver = Number(currencies.silver || 0) + Number(rew.silver || 0);
      const newItems = (rew.items || []).map((it) => ({
        ...it,
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      }));
      char.currencies = currencies;
      char.inventory = [...newItems, ...char.inventory || []];
      const saved = await saveCharacterBlob(row.id, char, Number(row.revision || 0) + 1);
      updated.push(saved);
    }
    return json(updated);
  }
  if (path === "/campaign-notes" && method === "POST") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0628\u0646\u0648\u06CC\u0633\u062F.", 403);
    const body = await request.json();
    const noteId = `cn-${Date.now()}-${generateRandomToken(3)}`;
    const newNote = { ...body, id: noteId, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "INSERT INTO campaign_notes (id, scope_type, scope_id, title, category, session_number, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(noteId, "campaign", "zorvania-c1", newNote.title || "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A", newNote.category || "session", newNote.sessionNumber || null, JSON.stringify(newNote), now).run();
    return json(newNote, 201);
  }
  if (path.match(/^\/campaign-notes\/[^/]+$/) && method === "PUT") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0646\u062F.", 403);
    const noteId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT id FROM campaign_notes WHERE id = ?").bind(noteId).first();
    if (!row) return error("\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const updated = { ...body, id: noteId, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "UPDATE campaign_notes SET title = ?, category = ?, session_number = ?, data = ?, updated_at = ? WHERE id = ?"
    ).bind(updated.title || "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A", updated.category || "session", updated.sessionNumber || null, JSON.stringify(updated), now, noteId).run();
    return json(updated);
  }
  if (path.match(/^\/campaign-notes\/[^/]+$/) && method === "DELETE") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062D\u0630\u0641 \u06A9\u0646\u062F.", 403);
    const noteId = path.split("/")[2];
    const res = await env.DB.prepare("DELETE FROM campaign_notes WHERE id = ?").bind(noteId).run();
    if ((res?.meta?.changes ?? 0) === 0) return error("\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    await audit("campaign-note-delete", noteId, {});
    return json({ success: true });
  }
  if (path === "/me" && method === "PATCH") {
    const body = await request.json();
    const displayName = String(body.displayName || "").trim();
    if (!displayName || displayName.length < 2 || displayName.length > 40) {
      return error("\u0646\u0627\u0645 \u0646\u0645\u0627\u06CC\u0634\u06CC \u0628\u0627\u06CC\u062F \u0628\u06CC\u0646 \u06F2 \u062A\u0627 \u06F4\u06F0 \u0646\u0648\u06CC\u0633\u0647 \u0628\u0627\u0634\u062F.");
    }
    await env.DB.prepare("UPDATE users SET display_name = ? WHERE id = ?").bind(displayName, currentUser.id).run();
    await audit("update-profile", currentUser.id, { displayName });
    return json({
      id: currentUser.id,
      email: currentUser.email,
      name: displayName,
      displayName,
      role: currentUser.role,
      status: currentUser.status,
      activeCharacterId: currentUser.active_character_id
    });
  }
  if (path === "/me/password" && method === "POST") {
    const body = await request.json();
    const currentPass = String(body.currentPassword || "");
    const newPass = String(body.newPassword || "");
    const { valid } = await verifyPassword(currentPass, currentUser.password_hash);
    if (!valid) {
      return error("\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0641\u0639\u0644\u06CC \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A.", 400);
    }
    const passErr = validatePassword(newPass, currentUser.email, currentUser.display_name);
    if (passErr) return error(passErr);
    const newHash = await hashPassword(newPass);
    await env.DB.prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?").bind(newHash, currentUser.id).run();
    if (currentSession) {
      await env.DB.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ? AND id != ?").bind(now, currentUser.id, currentSession.id).run();
    }
    await audit("password-change", currentUser.id);
    return json({ success: true, message: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A." });
  }
  if (path === "/me/email" && method === "POST") {
    const body = await request.json();
    const currentPass = String(body.currentPassword || "");
    const newEmail = String(body.newEmail || "").toLowerCase().trim();
    if (!newEmail || !newEmail.includes("@")) {
      return error("\u0627\u06CC\u0645\u06CC\u0644 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
    }
    const { valid } = await verifyPassword(currentPass, currentUser.password_hash);
    if (!valid) {
      return error("\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0641\u0639\u0644\u06CC \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A.", 400);
    }
    const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ? AND id != ?").bind(newEmail, currentUser.id).first();
    if (exists) {
      return error("\u0627\u06CC\u0646 \u0627\u06CC\u0645\u06CC\u0644 \u062A\u0648\u0633\u0637 \u06A9\u0627\u0631\u0628\u0631 \u062F\u06CC\u06AF\u0631\u06CC \u062B\u0628\u062A \u0634\u062F\u0647 \u0627\u0633\u062A.", 409);
    }
    await env.DB.prepare("UPDATE users SET email = ? WHERE id = ?").bind(newEmail, currentUser.id).run();
    await audit("email-change", currentUser.id, { newEmail });
    return json({
      id: currentUser.id,
      email: newEmail,
      name: currentUser.display_name,
      displayName: currentUser.display_name,
      role: currentUser.role
    });
  }
  if (path === "/me/sessions" && method === "GET") {
    const res = await env.DB.prepare(
      "SELECT id, user_id, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash FROM auth_sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY last_seen_at DESC"
    ).bind(currentUser.id, now).all();
    const sessions = (res.results || []).map((s) => ({
      id: s.id,
      userId: s.user_id,
      createdAt: s.created_at,
      lastSeenAt: s.last_seen_at,
      expiresAt: s.expires_at,
      absoluteExpiresAt: s.absolute_expires_at,
      userAgent: s.user_agent,
      isCurrent: s.id === currentSession?.id
    }));
    return json(sessions);
  }
  if (path.match(/^\/me\/sessions\/[^/]+$/) && method === "DELETE") {
    const targetSessionId = path.split("/")[3];
    await env.DB.prepare(
      "UPDATE auth_sessions SET revoked_at = ? WHERE id = ? AND user_id = ?"
    ).bind(now, targetSessionId, currentUser.id).run();
    if (targetSessionId === currentSession?.id) {
      return json({ message: "\u0646\u0634\u0633\u062A \u0641\u0639\u0644\u06CC \u0644\u063A\u0648 \u0634\u062F." }, 200, { "Set-Cookie": clearSessionCookie() });
    }
    return json({ success: true });
  }
  if (path === "/me/active-character" && method === "PUT") {
    const body = await request.json();
    const charId = body.characterId;
    if (charId) {
      const char = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(charId).first();
      if (!char) return error("\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
      if (currentUser.role !== "dm" && char.owner_id !== currentUser.id) {
        return error("\u0634\u0645\u0627 \u0645\u0627\u0644\u06A9 \u0627\u06CC\u0646 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
      }
    }
    await env.DB.prepare("UPDATE users SET active_character_id = ? WHERE id = ?").bind(charId || null, currentUser.id).run();
    return json({ success: true, activeCharacterId: charId });
  }
  if (path === "/me/export" && method === "GET") {
    const charRows = await env.DB.prepare("SELECT data FROM characters WHERE owner_id = ?").bind(currentUser.id).all();
    const noteRows = await env.DB.prepare("SELECT data FROM notes WHERE owner_id = ?").bind(currentUser.id).all();
    const exportData = {
      user: {
        id: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.display_name,
        role: currentUser.role
      },
      characters: (charRows.results || []).map((r) => JSON.parse(r.data)),
      notes: (noteRows.results || []).map((r) => JSON.parse(r.data)),
      exportedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return json(exportData);
  }
  if (path.startsWith("/users") || path.startsWith("/invites") || path.startsWith("/audit")) {
    if (currentUser.role !== "dm") {
      return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A\u061B \u0646\u06CC\u0627\u0632\u0645\u0646\u062F \u0646\u0642\u0634 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631.", 403);
    }
  }
  if (path === "/users" && method === "GET") {
    const search = url.searchParams.get("search") || "";
    const roleFilter = url.searchParams.get("role");
    const statusFilter = url.searchParams.get("status");
    let query = "SELECT * FROM users WHERE deleted_at IS NULL";
    const params = [];
    if (roleFilter && (roleFilter === "dm" || roleFilter === "player")) {
      query += " AND role = ?";
      params.push(roleFilter);
    }
    if (statusFilter && (statusFilter === "active" || statusFilter === "disabled")) {
      query += " AND status = ?";
      params.push(statusFilter);
    }
    query += " ORDER BY created_at DESC";
    const usersRes = await env.DB.prepare(query).bind(...params).all();
    let usersList = usersRes.results || [];
    if (search) {
      const s = search.toLowerCase();
      usersList = usersList.filter((u) => u.display_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    const charRes = await env.DB.prepare("SELECT id, owner_id, name FROM characters").all();
    const charsByOwner = {};
    for (const c of charRes.results || []) {
      if (c.owner_id) {
        if (!charsByOwner[c.owner_id]) charsByOwner[c.owner_id] = [];
        charsByOwner[c.owner_id].push(c.name);
      }
    }
    const sessRes = await env.DB.prepare(
      "SELECT user_id, COUNT(*) as c FROM auth_sessions WHERE revoked_at IS NULL AND expires_at > ? GROUP BY user_id"
    ).bind(now).all();
    const sessionCountByUser = {};
    for (const s of sessRes.results || []) {
      sessionCountByUser[s.user_id] = s.c;
    }
    const results = usersList.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.display_name,
      displayName: u.display_name,
      role: u.role,
      status: u.status,
      mustChangePassword: u.must_change_password === 1,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
      activeCharacterId: u.active_character_id,
      characterNames: charsByOwner[u.id] || [],
      activeSessionCount: sessionCountByUser[u.id] || 0
    }));
    return json(results);
  }
  if (path.match(/^\/users\/[^/]+$/) && method === "PATCH") {
    const targetUserId = path.split("/")[2];
    const body = await request.json();
    const targetUser = await env.DB.prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL").bind(targetUserId).first();
    if (!targetUser) return error("\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const isTargetProtectedDm = dmEmails.includes(targetUser.email.toLowerCase());
    if (body.role && body.role !== targetUser.role) {
      if (isTargetProtectedDm && body.role !== "dm") {
        return error("\u0627\u0645\u06A9\u0627\u0646 \u062A\u0646\u0632\u0644 \u0631\u062A\u0628\u0647 \u0627\u06CC\u0645\u06CC\u0644\u200C\u0647\u0627\u06CC \u0627\u0635\u0644\u06CC \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 403);
      }
      if (targetUser.role === "dm" && body.role === "player") {
        const dmCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'dm' AND status = 'active' AND deleted_at IS NULL").first();
        if ((dmCount?.c || 0) <= 1) {
          return error("\u062D\u062F\u0627\u0642\u0644 \u06CC\u06A9 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0641\u0639\u0627\u0644 \u0628\u0627\u06CC\u062F \u062F\u0631 \u0633\u06CC\u0633\u062A\u0645 \u0628\u0627\u0642\u06CC \u0628\u0645\u0627\u0646\u062F.", 400);
        }
      }
    }
    if (body.status && body.status !== targetUser.status) {
      if (isTargetProtectedDm && body.status === "disabled") {
        return error("\u0627\u0645\u06A9\u0627\u0646 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u06A9\u0631\u062F\u0646 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0627\u0635\u0644\u06CC \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 403);
      }
      if (targetUser.role === "dm" && body.status === "disabled") {
        const activeDmCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'dm' AND status = 'active' AND deleted_at IS NULL").first();
        if ((activeDmCount?.c || 0) <= 1) {
          return error("\u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646 \u062A\u0646\u0647\u0627 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0641\u0639\u0627\u0644 \u0631\u0627 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u06A9\u0631\u062F.", 400);
        }
      }
    }
    const nextDisplayName = body.displayName ? String(body.displayName).trim() : targetUser.display_name;
    const nextRole = body.role === "dm" || body.role === "player" ? body.role : targetUser.role;
    const nextStatus = body.status === "active" || body.status === "disabled" ? body.status : targetUser.status;
    await env.DB.prepare(
      "UPDATE users SET display_name = ?, role = ?, status = ? WHERE id = ?"
    ).bind(nextDisplayName, nextRole, nextStatus, targetUserId).run();
    if (nextStatus === "disabled") {
      await env.DB.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?").bind(now, targetUserId).run();
    }
    await audit("user-update", targetUserId, { displayName: nextDisplayName, role: nextRole, status: nextStatus });
    return json({
      id: targetUserId,
      email: targetUser.email,
      name: nextDisplayName,
      displayName: nextDisplayName,
      role: nextRole,
      status: nextStatus
    });
  }
  if (path.match(/^\/users\/[^/]+\/reset-token$/) && method === "POST") {
    const targetUserId = path.split("/")[2];
    const targetUser = await env.DB.prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL").bind(targetUserId).first();
    if (!targetUser) return error("\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const resetToken = generateRandomToken(32);
    const tokenHash = await sha256Hex(resetToken);
    const resetId = `reset-${Date.now()}-${generateRandomToken(4)}`;
    const expiresAt = now + 24 * 60 * 60 * 1e3;
    await env.DB.prepare(
      "INSERT INTO password_resets (id, user_id, token_hash, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(resetId, targetUserId, tokenHash, currentUser.id, now, expiresAt).run();
    await audit("create-reset-token", targetUserId);
    const resetLink = `${url.origin}/#reset-password?token=${resetToken}`;
    return json({
      resetToken,
      resetLink,
      expiresAt
    });
  }
  if (path.match(/^\/users\/[^/]+\/revoke-sessions$/) && method === "POST") {
    const targetUserId = path.split("/")[2];
    await env.DB.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?").bind(now, targetUserId).run();
    await audit("revoke-user-sessions", targetUserId);
    return json({ success: true, message: "\u062A\u0645\u0627\u0645 \u0646\u0634\u0633\u062A\u200C\u0647\u0627\u06CC \u06A9\u0627\u0631\u0628\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0644\u063A\u0648 \u0634\u062F\u0646\u062F." });
  }
  if (path.match(/^\/users\/[^/]+\/assign-character$/) && method === "POST") {
    const targetUserId = path.split("/")[2];
    const body = await request.json();
    const charId = body.characterId;
    const targetUser = await env.DB.prepare("SELECT id, active_character_id FROM users WHERE id = ? AND deleted_at IS NULL").bind(targetUserId).first();
    if (!targetUser) return error("\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const char = await env.DB.prepare("SELECT id FROM characters WHERE id = ?").bind(charId).first();
    if (!char) return error("\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    await env.DB.prepare("UPDATE characters SET owner_id = ? WHERE id = ?").bind(targetUserId, charId).run();
    if (!targetUser.active_character_id) {
      await env.DB.prepare("UPDATE users SET active_character_id = ? WHERE id = ?").bind(charId, targetUserId).run();
    }
    await audit("assign-character", targetUserId, { characterId: charId });
    return json({ success: true });
  }
  if (path.match(/^\/users\/[^/]+$/) && method === "DELETE") {
    const targetUserId = path.split("/")[2];
    if (targetUserId === currentUser.id) {
      return error("\u0634\u0645\u0627 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062E\u0648\u062F \u0631\u0627 \u062D\u0630\u0641 \u06A9\u0646\u06CC\u062F.", 400);
    }
    const targetUser = await env.DB.prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL").bind(targetUserId).first();
    if (!targetUser) return error("\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (dmEmails.includes(targetUser.email.toLowerCase())) {
      return error("\u0627\u0645\u06A9\u0627\u0646 \u062D\u0630\u0641 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0627\u0635\u0644\u06CC \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 403);
    }
    if (targetUser.role === "dm") {
      const dmCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'dm' AND status = 'active' AND deleted_at IS NULL").first();
      if ((dmCount?.c || 0) <= 1) {
        return error("\u0627\u0645\u06A9\u0627\u0646 \u062D\u0630\u0641 \u062A\u0646\u0647\u0627 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0641\u0639\u0627\u0644 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 400);
      }
    }
    await env.DB.prepare("UPDATE users SET deleted_at = ?, status = ? WHERE id = ?").bind(now, "disabled", targetUserId).run();
    await env.DB.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?").bind(now, targetUserId).run();
    await env.DB.prepare("UPDATE characters SET owner_id = NULL WHERE owner_id = ?").bind(targetUserId).run();
    await audit("user-delete", targetUserId);
    return json({ success: true, message: "\u06A9\u0627\u0631\u0628\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062D\u0630\u0641 \u0634\u062F." });
  }
  if (path === "/invites" && method === "POST") {
    const body = await request.json();
    const label = String(body.label || "\u062F\u0639\u0648\u062A \u062C\u062F\u06CC\u062F").trim();
    const expiresInDays = Math.max(1, Math.min(365, parseInt(body.expiresInDays || 30, 10)));
    const maxUses = Math.max(1, parseInt(body.maxUses || 1, 10));
    const assignCharacterId = body.assignCharacterId || null;
    const rawCode = generateRandomToken(16);
    const codeHash = await sha256Hex(rawCode);
    const inviteId = `inv-${Date.now()}-${generateRandomToken(4)}`;
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1e3;
    await env.DB.prepare(
      "INSERT INTO invites (id, code_hash, label, created_by, created_at, expires_at, max_uses, used_count, assign_character_id) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)"
    ).bind(inviteId, codeHash, label, currentUser.id, now, expiresAt, maxUses, assignCharacterId).run();
    await audit("invite-create", inviteId, { label, maxUses, expiresAt, assignCharacterId });
    const inviteLink = `${url.origin}/#register?code=${rawCode}`;
    return json({
      invite: {
        id: inviteId,
        label,
        createdBy: currentUser.id,
        createdAt: now,
        expiresAt,
        maxUses,
        usedCount: 0,
        assignCharacterId,
        code: rawCode,
        inviteLink
      }
    }, 201);
  }
  if (path === "/invites" && method === "GET") {
    const res = await env.DB.prepare("SELECT * FROM invites ORDER BY created_at DESC").all();
    const invites = (res.results || []).map((r) => {
      let status = "active";
      if (r.revoked_at) status = "revoked";
      else if (r.expires_at > 0 && r.expires_at < now) status = "expired";
      else if (r.used_count >= r.max_uses) status = "used";
      return {
        id: r.id,
        label: r.label,
        createdBy: r.created_by,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
        maxUses: r.max_uses,
        usedCount: r.used_count,
        assignCharacterId: r.assign_character_id,
        revokedAt: r.revoked_at,
        status
      };
    });
    return json(invites);
  }
  if (path.match(/^\/invites\/[^/]+$/) && method === "DELETE") {
    const inviteId = path.split("/")[2];
    await env.DB.prepare("UPDATE invites SET revoked_at = ? WHERE id = ?").bind(now, inviteId).run();
    await audit("invite-revoke", inviteId);
    return json({ success: true });
  }
  if (path === "/audit" && method === "GET") {
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));
    const res = await env.DB.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?").bind(limit).all();
    const items = (res.results || []).map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      action: r.action,
      targetId: r.target_id,
      meta: r.meta ? JSON.parse(r.meta) : null,
      createdAt: r.created_at
    }));
    return json(items);
  }
  if (path === "/characters" && method === "GET") {
    let results = [];
    if (currentUser.role === "dm") {
      const stmt = await env.DB.prepare("SELECT data FROM characters").all();
      results = stmt.results || [];
    } else {
      const stmt = await env.DB.prepare("SELECT data FROM characters WHERE owner_id = ?").bind(currentUser.id).all();
      results = stmt.results || [];
    }
    return json(results.map((row) => JSON.parse(row.data)));
  }
  if (path.match(/^\/characters\/[^/]+$/) && method === "GET") {
    const charId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id, data FROM characters WHERE id = ?").bind(charId).first();
    if (!row || currentUser.role !== "dm" && row.owner_id !== currentUser.id) {
      return error("\u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    return json(JSON.parse(row.data));
  }
  if (path === "/characters" && method === "POST") {
    const charData = await request.json();
    const charId = `char-${Date.now()}-${generateRandomToken(4)}`;
    const newChar = {
      ...charData,
      id: charId,
      ownerId: currentUser.id,
      revision: 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.DB.prepare(
      "INSERT INTO characters (id, owner_id, name, class_name, level, data, revision, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      charId,
      currentUser.id,
      newChar.name || "\u0634\u062E\u0635\u06CC\u062A \u0646\u0648",
      newChar.className || "",
      newChar.level || 1,
      JSON.stringify(newChar),
      1,
      now
    ).run();
    if (!currentUser.active_character_id) {
      await env.DB.prepare("UPDATE users SET active_character_id = ? WHERE id = ?").bind(charId, currentUser.id).run();
    }
    return json(newChar, 201);
  }
  if (path.match(/^\/characters\/[^/]+$/) && method === "PUT") {
    const charId = path.split("/")[2];
    const charData = await request.json();
    const row = await env.DB.prepare("SELECT owner_id, revision FROM characters WHERE id = ?").bind(charId).first();
    if (!row || currentUser.role !== "dm" && row.owner_id !== currentUser.id) {
      return error("\u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    if (row.revision !== charData.revision) {
      return error("\u062A\u0639\u0627\u0631\u0636 \u062F\u0631 \u0630\u062E\u06CC\u0631\u0647\u200C\u0633\u0627\u0632\u06CC: \u062F\u0627\u062F\u0647\u200C\u0647\u0627 \u062A\u0648\u0633\u0637 \u06A9\u0627\u0631\u0628\u0631 \u062F\u06CC\u06AF\u0631\u06CC \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A\u0647\u200C\u0627\u0646\u062F.", 409);
    }
    const nextRevision = row.revision + 1;
    const updatedChar = {
      ...charData,
      revision: nextRevision,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.DB.prepare(
      "UPDATE characters SET name = ?, class_name = ?, level = ?, data = ?, revision = ?, updated_at = ? WHERE id = ?"
    ).bind(
      updatedChar.name,
      updatedChar.className,
      updatedChar.level,
      JSON.stringify(updatedChar),
      nextRevision,
      now,
      charId
    ).run();
    return json(updatedChar);
  }
  if (path.match(/^\/characters\/[^/]+$/) && method === "DELETE") {
    const charId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(charId).first();
    if (!row || currentUser.role !== "dm" && row.owner_id !== currentUser.id) {
      return error("\u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    await env.DB.prepare("DELETE FROM characters WHERE id = ?").bind(charId).run();
    return json({ success: true });
  }
  if (path === "/notes" && method === "GET") {
    const charFilter = url.searchParams.get("characterId");
    let stmt;
    if (currentUser.role === "dm") {
      stmt = charFilter ? env.DB.prepare("SELECT data FROM notes WHERE character_id = ? AND (shared_with_dm = 1 OR owner_id = ?)").bind(charFilter, currentUser.id) : env.DB.prepare("SELECT data FROM notes WHERE shared_with_dm = 1 OR owner_id = ?").bind(currentUser.id);
    } else {
      stmt = charFilter ? env.DB.prepare("SELECT data FROM notes WHERE owner_id = ? AND character_id = ?").bind(currentUser.id, charFilter) : env.DB.prepare("SELECT data FROM notes WHERE owner_id = ?").bind(currentUser.id);
    }
    const res = await stmt.all();
    return json((res.results || []).map((r) => JSON.parse(r.data)));
  }
  if (path === "/notes" && method === "POST") {
    const noteData = await request.json();
    const noteId = `note-${Date.now()}-${generateRandomToken(4)}`;
    const newNote = {
      ...noteData,
      id: noteId,
      ownerId: currentUser.id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.DB.prepare(
      "INSERT INTO notes (id, character_id, owner_id, title, shared_with_dm, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      noteId,
      newNote.characterId || null,
      currentUser.id,
      newNote.title,
      newNote.sharedWithDm ? 1 : 0,
      JSON.stringify(newNote),
      now
    ).run();
    return json(newNote, 201);
  }
  if (path.match(/^\/notes\/[^/]+$/) && method === "PUT") {
    const noteId = path.split("/")[2];
    const noteData = await request.json();
    const row = await env.DB.prepare("SELECT owner_id FROM notes WHERE id = ?").bind(noteId).first();
    if (!row || currentUser.role !== "dm" && row.owner_id !== currentUser.id) {
      return error("\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    const updated = { ...noteData, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "UPDATE notes SET title = ?, shared_with_dm = ?, data = ?, updated_at = ? WHERE id = ?"
    ).bind(updated.title, updated.sharedWithDm ? 1 : 0, JSON.stringify(updated), now, noteId).run();
    return json(updated);
  }
  if (path.match(/^\/notes\/[^/]+$/) && method === "DELETE") {
    const noteId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id FROM notes WHERE id = ?").bind(noteId).first();
    if (!row || currentUser.role !== "dm" && row.owner_id !== currentUser.id) {
      return error("\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    await env.DB.prepare("DELETE FROM notes WHERE id = ?").bind(noteId).run();
    return json({ success: true });
  }
  if (path === "/npcs" && method === "GET") {
    let stmt;
    if (currentUser.role === "dm") {
      stmt = env.DB.prepare("SELECT data FROM npcs");
    } else {
      stmt = env.DB.prepare("SELECT data FROM npcs WHERE is_revealed = 1");
    }
    const res = await stmt.all();
    return json((res.results || []).map((r) => JSON.parse(r.data)));
  }
  if (path === "/npcs" && method === "POST") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = `npc-${Date.now()}`;
    const newNpc = { ...data, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "INSERT INTO npcs (id, scope_type, scope_id, name, type, is_revealed, location_tag, session_tag, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, "campaign", "zorvania-c1", newNpc.name, newNpc.type, newNpc.isRevealed ? 1 : 0, newNpc.locationTag || "", newNpc.sessionTag || "", JSON.stringify(newNpc), now).run();
    return json(newNpc, 201);
  }
  if (path.match(/^\/npcs\/[^/]+$/) && method === "PUT") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    const data = await request.json();
    const updated = { ...data, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "UPDATE npcs SET name = ?, type = ?, is_revealed = ?, location_tag = ?, session_tag = ?, data = ?, updated_at = ? WHERE id = ?"
    ).bind(updated.name, updated.type, updated.isRevealed ? 1 : 0, updated.locationTag || "", updated.sessionTag || "", JSON.stringify(updated), now, id).run();
    return json(updated);
  }
  if (path.match(/^\/npcs\/[^/]+$/) && method === "DELETE") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    await env.DB.prepare("DELETE FROM npcs WHERE id = ?").bind(id).run();
    return json({ success: true });
  }
  if (path === "/items" && method === "GET") {
    let stmt;
    if (currentUser.role === "dm") {
      stmt = env.DB.prepare("SELECT data FROM items");
    } else {
      stmt = env.DB.prepare("SELECT data FROM items WHERE is_revealed = 1");
    }
    const res = await stmt.all();
    return json((res.results || []).map((r) => JSON.parse(r.data)));
  }
  if (path === "/items" && method === "POST") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = `item-${Date.now()}`;
    const newItem = { ...data, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "INSERT INTO items (id, scope_type, scope_id, name, category, is_revealed, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, "campaign", "zorvania-c1", newItem.name, newItem.category, newItem.isRevealed ? 1 : 0, JSON.stringify(newItem), now).run();
    return json(newItem, 201);
  }
  if (path === "/live" && method === "GET") {
    if (!env.DB) {
      return json({ activeEncounterId: null, version: 0, serverTime: Date.now() }, 200, {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      });
    }
    const row = await env.DB.prepare(
      "SELECT id, version FROM encounters WHERE status IN ('active', 'paused') ORDER BY updated_at DESC LIMIT 1"
    ).first();
    return json(
      {
        activeEncounterId: row?.id || null,
        version: row ? Number(row.version) : 0,
        serverTime: Date.now()
      },
      200,
      { "Cache-Control": "no-store, no-cache, must-revalidate" }
    );
  }
  if (path === "/locations" && method === "GET") {
    if (!env.DB) return json([]);
    if (currentUser?.role === "dm") {
      const res = await env.DB.prepare("SELECT * FROM locations ORDER BY created_at ASC").all();
      const list = (res.results || []).map((r) => ({
        id: r.id,
        name: r.name,
        region: r.region,
        description: r.description,
        imageUrl: r.image_url,
        dmNotes: r.dm_notes,
        revealed: r.revealed === 1,
        parentId: r.parent_id,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
      return json(list);
    } else {
      const res = await env.DB.prepare(
        "SELECT id, name, region, description, image_url, revealed, parent_id, created_at, updated_at FROM locations WHERE revealed = 1 ORDER BY name ASC"
      ).all();
      const list = (res.results || []).map((r) => ({
        id: r.id,
        name: r.name,
        region: r.region,
        description: r.description,
        imageUrl: r.image_url,
        revealed: true,
        parentId: r.parent_id,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
      return json(list);
    }
  }
  if (path === "/locations" && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = `loc-${Date.now()}-${generateRandomToken(4)}`;
    const locName = String(data.name || "").trim();
    if (!locName) return error("\u0646\u0627\u0645 \u0645\u06A9\u0627\u0646 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const region = data.region || "\u0648\u0631\u0646\u0627";
    const desc = data.description || "";
    const imgUrl = data.imageUrl || "";
    const dmNotes = data.dmNotes || "";
    const revealed = data.revealed ? 1 : 0;
    const parentId = data.parentId || null;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO locations (id, scope_type, scope_id, name, region, description, image_url, dm_notes, revealed, parent_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, "campaign", "zorvania-c1", locName, region, desc, imgUrl, dmNotes, revealed, parentId, t, t).run();
    await audit("create_location", id, { name: locName, region });
    return json({
      id,
      name: locName,
      region,
      description: desc,
      imageUrl: imgUrl,
      dmNotes,
      revealed: revealed === 1,
      parentId,
      createdAt: t,
      updatedAt: t
    }, 201);
  }
  if (path.startsWith("/locations/") && method === "PATCH") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const locId = path.replace("/locations/", "");
    const existing = await env.DB.prepare("SELECT * FROM locations WHERE id = ?").bind(locId).first();
    if (!existing) return error("\u0645\u06A9\u0627\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const data = await request.json();
    const locName = data.name !== void 0 ? String(data.name).trim() : existing.name;
    const region = data.region !== void 0 ? data.region : existing.region;
    const desc = data.description !== void 0 ? data.description : existing.description;
    const imgUrl = data.imageUrl !== void 0 ? data.imageUrl : existing.image_url;
    const dmNotes = data.dmNotes !== void 0 ? data.dmNotes : existing.dm_notes;
    const revealed = data.revealed !== void 0 ? data.revealed ? 1 : 0 : existing.revealed;
    const parentId = data.parentId !== void 0 ? data.parentId : existing.parent_id;
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE locations SET name = ?, region = ?, description = ?, image_url = ?, dm_notes = ?, revealed = ?, parent_id = ?, updated_at = ? WHERE id = ?`
    ).bind(locName, region, desc, imgUrl, dmNotes, revealed, parentId, t, locId).run();
    await audit("update_location", locId, { name: locName, revealed: revealed === 1 });
    return json({
      id: locId,
      name: locName,
      region,
      description: desc,
      imageUrl: imgUrl,
      dmNotes,
      revealed: revealed === 1,
      parentId,
      createdAt: existing.created_at,
      updatedAt: t
    });
  }
  if (path.startsWith("/locations/") && method === "DELETE") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const locId = path.replace("/locations/", "");
    await env.DB.prepare("DELETE FROM locations WHERE id = ?").bind(locId).run();
    await audit("delete_location", locId);
    return json({ success: true });
  }
  const computeQualitativeHealth = /* @__PURE__ */ __name((hp, maxHp) => {
    if (maxHp <= 0 || hp <= 0) return "\u0631\u0648 \u0628\u0647 \u0645\u0631\u06AF";
    const pct = hp / maxHp * 100;
    if (pct > 75) return "\u0633\u0627\u0644\u0645";
    if (pct >= 25) return "\u0632\u062E\u0645\u06CC";
    return "\u0646\u06CC\u0645\u0647\u200C\u062C\u0627\u0646";
  }, "computeQualitativeHealth");
  const buildPlayerEncounterSnapshot = /* @__PURE__ */ __name(async (encRow) => {
    const encId = encRow.id;
    let settings = { showExactHp: false, showAc: false, showConditions: true, showDefeated: true, playerInitiativeRolls: true };
    try {
      if (typeof encRow.settings === "string") settings = JSON.parse(encRow.settings);
      else if (encRow.settings) settings = encRow.settings;
    } catch {
    }
    let locData = null;
    if (encRow.location_id) {
      const locRow = await env.DB.prepare(
        "SELECT id, name, region, description, image_url, revealed FROM locations WHERE id = ?"
      ).bind(encRow.location_id).first();
      if (locRow) {
        locData = {
          id: locRow.id,
          name: locRow.name,
          region: locRow.region,
          description: locRow.revealed === 1 ? locRow.description : void 0,
          imageUrl: locRow.revealed === 1 ? locRow.image_url : void 0
        };
      }
    }
    const partRows = await env.DB.prepare(
      "SELECT * FROM encounter_participants WHERE encounter_id = ? ORDER BY initiative DESC, sort_index ASC"
    ).bind(encId).all();
    const playerParticipants = [];
    for (const p of partRows.results || []) {
      if (p.visibility === "hidden") continue;
      if (p.status === "defeated" && settings.showDefeated === false) continue;
      if (p.visibility === "announced") {
        playerParticipants.push({
          id: p.id,
          kind: p.kind,
          displayNameForPlayers: "\u0645\u0648\u062C\u0648\u062F \u0646\u0627\u0634\u0646\u0627\u062E\u062A\u0647",
          healthStatus: "\u0633\u0627\u0644\u0645",
          status: p.status,
          initiative: p.initiative,
          initiativeStatus: p.initiative_status,
          phase: null,
          sortIndex: p.sort_index,
          characterId: null,
          isAlly: false
        });
        continue;
      }
      let currentHp = p.hp;
      let maxHp = p.max_hp;
      if (p.kind === "character" && p.character_id) {
        const charRow = await env.DB.prepare("SELECT data FROM characters WHERE id = ?").bind(p.character_id).first();
        if (charRow?.data) {
          try {
            const charData = JSON.parse(charRow.data);
            if (charData.hp) {
              currentHp = charData.hp.current;
              maxHp = charData.hp.max;
            }
          } catch {
          }
        }
      }
      const healthStatus = computeQualitativeHealth(currentHp, maxHp);
      const isAlly = p.kind === "character";
      const isOwnCharacter = currentUser && p.character_id && currentUser.active_character_id === p.character_id;
      let conditions = void 0;
      if (settings.showConditions !== false) {
        try {
          conditions = typeof p.conditions === "string" ? JSON.parse(p.conditions) : p.conditions || [];
        } catch {
          conditions = [];
        }
      }
      let exactHp = void 0;
      if (settings.showExactHp === true || isAlly || isOwnCharacter) {
        exactHp = { current: currentHp, max: maxHp };
      }
      let exactAc = void 0;
      if (settings.showAc === true || isAlly || isOwnCharacter) {
        exactAc = p.ac;
      }
      playerParticipants.push({
        id: p.id,
        kind: p.kind,
        displayNameForPlayers: p.display_name_for_players || p.instance_name,
        healthStatus,
        status: p.status,
        conditions,
        exactHp,
        exactAc,
        initiative: p.initiative,
        initiativeStatus: p.initiative_status,
        phase: p.phase,
        sortIndex: p.sort_index,
        characterId: p.character_id,
        isAlly
      });
    }
    const eventRows = await env.DB.prepare(
      "SELECT * FROM encounter_events WHERE encounter_id = ? AND visible_to_players = 1 ORDER BY created_at ASC"
    ).bind(encId).all();
    const events = (eventRows.results || []).map((e) => ({
      id: e.id,
      encounterId: e.encounter_id,
      round: e.round,
      type: e.type,
      text: e.text,
      visibleToPlayers: true,
      createdAt: e.created_at
    }));
    return {
      id: encRow.id,
      name: encRow.name,
      locationId: encRow.location_id,
      location: locData,
      status: encRow.status,
      round: encRow.round,
      currentParticipantId: encRow.current_participant_id,
      settings,
      version: encRow.version,
      participants: playerParticipants,
      events
    };
  }, "buildPlayerEncounterSnapshot");
  const buildDmEncounterSnapshot = /* @__PURE__ */ __name(async (encRow) => {
    const encId = encRow.id;
    let settings = { showExactHp: false, showAc: false, showConditions: true, showDefeated: true, playerInitiativeRolls: true };
    try {
      if (typeof encRow.settings === "string") settings = JSON.parse(encRow.settings);
      else if (encRow.settings) settings = encRow.settings;
    } catch {
    }
    let locData = null;
    if (encRow.location_id) {
      const locRow = await env.DB.prepare("SELECT * FROM locations WHERE id = ?").bind(encRow.location_id).first();
      if (locRow) {
        locData = {
          id: locRow.id,
          name: locRow.name,
          region: locRow.region,
          description: locRow.description,
          imageUrl: locRow.image_url,
          dmNotes: locRow.dm_notes,
          revealed: locRow.revealed === 1,
          parentId: locRow.parent_id,
          createdAt: locRow.created_at,
          updatedAt: locRow.updated_at
        };
      }
    }
    const partRows = await env.DB.prepare(
      "SELECT * FROM encounter_participants WHERE encounter_id = ? ORDER BY initiative DESC, sort_index ASC"
    ).bind(encId).all();
    const participants = (partRows.results || []).map((p) => ({
      id: p.id,
      encounterId: p.encounter_id,
      kind: p.kind,
      npcTemplateId: p.npc_template_id,
      characterId: p.character_id,
      instanceName: p.instance_name,
      displayNameForPlayers: p.display_name_for_players,
      maxHp: p.max_hp,
      hp: p.hp,
      ac: p.ac,
      acState: p.ac_state,
      conditions: typeof p.conditions === "string" ? JSON.parse(p.conditions) : p.conditions || [],
      initiative: p.initiative,
      initiativeStatus: p.initiative_status,
      visibility: p.visibility,
      status: p.status,
      phase: p.phase,
      groupId: p.group_id,
      sortIndex: p.sort_index,
      addedAtRound: p.added_at_round,
      revision: p.revision || 1,
      notes: p.notes,
      createdAt: p.created_at
    }));
    const eventRows = await env.DB.prepare(
      "SELECT * FROM encounter_events WHERE encounter_id = ? ORDER BY created_at ASC"
    ).bind(encId).all();
    const events = (eventRows.results || []).map((e) => ({
      id: e.id,
      encounterId: e.encounter_id,
      round: e.round,
      type: e.type,
      text: e.text,
      visibleToPlayers: e.visible_to_players === 1,
      createdAt: e.created_at
    }));
    return {
      id: encRow.id,
      name: encRow.name,
      locationId: encRow.location_id,
      location: locData,
      status: encRow.status,
      round: encRow.round,
      currentParticipantId: encRow.current_participant_id,
      sessionTag: encRow.session_tag,
      settings,
      version: encRow.version,
      dmNotes: encRow.dm_notes,
      startedAt: encRow.started_at,
      endedAt: encRow.ended_at,
      createdBy: encRow.created_by,
      createdAt: encRow.created_at,
      updatedAt: encRow.updated_at,
      participants,
      events
    };
  }, "buildDmEncounterSnapshot");
  if (path === "/encounters/active" && method === "GET") {
    if (!env.DB) return error("\u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A.", 500);
    const encRow = await env.DB.prepare(
      "SELECT * FROM encounters WHERE status IN ('active', 'paused') ORDER BY updated_at DESC LIMIT 1"
    ).first();
    if (!encRow) return error("\u0647\u06CC\u0686 \u0645\u0628\u0627\u0631\u0632\u0647 \u0641\u0639\u0627\u0644\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const snapshot = await buildPlayerEncounterSnapshot(encRow);
    return json(snapshot);
  }
  if (path.startsWith("/encounters/") && path.includes("/view") && method === "GET") {
    const encId = path.replace("/encounters/", "").replace("/view", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (currentUser?.role !== "dm" && encRow.status === "draft") {
      return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    const since = url.searchParams.get("since");
    if (since && Number(since) === Number(encRow.version)) {
      return json({ notModified: true });
    }
    const etag = `W/"enc-${encRow.id}-${encRow.version}"`;
    if (request.headers.get("If-None-Match") === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag, ...SECURITY_HEADERS } });
    }
    if (currentUser?.role === "dm") {
      const dmSnapshot = await buildDmEncounterSnapshot(encRow);
      return json(dmSnapshot, 200, { ETag: etag });
    } else {
      const playerSnapshot = await buildPlayerEncounterSnapshot(encRow);
      return json(playerSnapshot, 200, { ETag: etag });
    }
  }
  if (path.startsWith("/encounters/") && path.endsWith("/initiative") && method === "POST") {
    if (!currentUser) return error("\u0646\u0634\u0633\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.", 401);
    const encId = path.replace("/encounters/", "").replace("/initiative", "");
    const body = await request.json();
    const { characterId, value } = body;
    if (!characterId) return error("\u0634\u0646\u0627\u0633\u0647 \u0634\u062E\u0635\u06CC\u062A \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 1 || numValue > 40) {
      return error("\u0645\u0642\u062F\u0627\u0631 \u0627\u0628\u062A\u06A9\u0627\u0631 \u0639\u0645\u0644 \u0628\u0627\u06CC\u062F \u0628\u06CC\u0646 \u06F1 \u062A\u0627 \u06F4\u06F0 \u0628\u0627\u0634\u062F.", 400);
    }
    if (currentUser.role !== "dm") {
      const charRow = await env.DB.prepare("SELECT owner_id, name FROM characters WHERE id = ?").bind(characterId).first();
      if (!charRow || charRow.owner_id !== currentUser.id) {
        return error("\u0634\u0645\u0627 \u0641\u0642\u0637 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0628\u0631\u0627\u06CC \u0634\u062E\u0635\u06CC\u062A \u0645\u062A\u0639\u0644\u0642 \u0628\u0647 \u062E\u0648\u062F \u0627\u0628\u062A\u06A9\u0627\u0631 \u0639\u0645\u0644 \u0628\u06CC\u0646\u062F\u0627\u0632\u06CC\u062F.", 403);
      }
    }
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const participant = await env.DB.prepare(
      "SELECT * FROM encounter_participants WHERE encounter_id = ? AND character_id = ?"
    ).bind(encId, characterId).first();
    if (!participant) return error("\u0627\u06CC\u0646 \u0634\u062E\u0635\u06CC\u062A \u062F\u0631 \u0645\u0628\u0627\u0631\u0632\u0647 \u062D\u0636\u0648\u0631 \u0646\u062F\u0627\u0631\u062F.", 404);
    let settings = {};
    try {
      settings = typeof encRow.settings === "string" ? JSON.parse(encRow.settings) : encRow.settings || {};
    } catch {
    }
    const newStatus = settings.playerInitiativeRolls === false ? "set" : "pending";
    const newVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare(
      "UPDATE encounter_participants SET initiative = ?, initiative_status = ?, revision = revision + 1 WHERE id = ?"
    ).bind(numValue, newStatus, participant.id).run();
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(newVersion, t, encId).run();
    const charName = participant.display_name_for_players || participant.instance_name;
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'round', ?, 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, `${charName} \u0627\u0628\u062A\u06A9\u0627\u0631 \u0639\u0645\u0644 ${numValue} \u0631\u0627 \u062B\u0628\u062A \u06A9\u0631\u062F.`, t).run();
    return json({ success: true, initiative: numValue, initiativeStatus: newStatus });
  }
  if (path === "/encounters" && method === "GET") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const statusFilter = url.searchParams.get("status");
    const locFilter = url.searchParams.get("locationId");
    let query = "SELECT * FROM encounters WHERE 1=1";
    const bindings = [];
    if (statusFilter) {
      query += " AND status = ?";
      bindings.push(statusFilter);
    }
    if (locFilter) {
      query += " AND location_id = ?";
      bindings.push(locFilter);
    }
    query += " ORDER BY updated_at DESC";
    const rows = await env.DB.prepare(query).bind(...bindings).all();
    const results = [];
    for (const r of rows.results || []) {
      const full = await buildDmEncounterSnapshot(r);
      results.push(full);
    }
    return json(results);
  }
  if (path === "/encounters" && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const body = await request.json();
    const id = `enc-${Date.now()}-${generateRandomToken(4)}`;
    const encName = String(body.name || "\u0645\u0628\u0627\u0631\u0632\u0647 \u062C\u062F\u06CC\u062F").trim();
    const locationId = body.locationId || null;
    const sessionTag = body.sessionTag || "";
    const dmNotes = body.dmNotes || "";
    const settings = JSON.stringify({
      showExactHp: Boolean(body.settings?.showExactHp),
      showAc: Boolean(body.settings?.showAc),
      showConditions: body.settings?.showConditions !== false,
      showDefeated: body.settings?.showDefeated !== false,
      playerInitiativeRolls: body.settings?.playerInitiativeRolls !== false
    });
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO encounters (
         id, scope_type, scope_id, name, location_id, status, round, current_participant_id, session_tag,
         settings, version, dm_notes, started_at, ended_at, created_by, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'draft', 0, NULL, ?, ?, 1, ?, NULL, NULL, ?, ?, ?)`
    ).bind(id, "campaign", "zorvania-c1", encName, locationId, sessionTag, settings, dmNotes, currentUser?.id || null, t, t).run();
    const created = await buildDmEncounterSnapshot({
      id,
      name: encName,
      location_id: locationId,
      status: "draft",
      round: 0,
      current_participant_id: null,
      session_tag: sessionTag,
      settings,
      version: 1,
      dm_notes: dmNotes,
      created_by: currentUser?.id,
      created_at: t,
      updated_at: t
    });
    return json(created, 201);
  }
  if (path.startsWith("/encounters/") && method === "GET" && !path.includes("/view") && !path.includes("/participants") && !path.includes("/events")) {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const full = await buildDmEncounterSnapshot(encRow);
    return json(full);
  }
  if (path.startsWith("/encounters/") && method === "PATCH" && !path.includes("/participants")) {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const data = await request.json();
    const newName = data.name !== void 0 ? String(data.name).trim() : encRow.name;
    const newLocId = data.locationId !== void 0 ? data.locationId : encRow.location_id;
    const newSessionTag = data.sessionTag !== void 0 ? data.sessionTag : encRow.session_tag;
    const newDmNotes = data.dmNotes !== void 0 ? data.dmNotes : encRow.dm_notes;
    const newSettings = data.settings !== void 0 ? JSON.stringify(data.settings) : encRow.settings;
    const newStatus = data.status !== void 0 ? data.status : encRow.status;
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE encounters SET name = ?, location_id = ?, session_tag = ?, dm_notes = ?, settings = ?, status = ?, version = ?, updated_at = ? WHERE id = ?`
    ).bind(newName, newLocId, newSessionTag, newDmNotes, newSettings, newStatus, nextVersion, t, encId).run();
    const updatedRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    const full = await buildDmEncounterSnapshot(updatedRow);
    return json(full);
  }
  if (path.startsWith("/encounters/") && path.endsWith("/start") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/start", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const partRow = await env.DB.prepare(
      "SELECT id FROM encounter_participants WHERE encounter_id = ? AND status = 'active' ORDER BY initiative DESC, sort_index ASC LIMIT 1"
    ).bind(encId).first();
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE encounters SET status = 'active', round = 1, current_participant_id = ?, started_at = ?, version = ?, updated_at = ? WHERE id = ?`
    ).bind(partRow?.id || null, t, nextVersion, t, encId).run();
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, 1, 'start', '\u0645\u0628\u0627\u0631\u0632\u0647 \u0622\u063A\u0627\u0632 \u0634\u062F (\u062F\u0648\u0631 \u06F1)', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, t).run();
    try {
      const campId = encRow.scope_id || "zorvania-c1";
      const memberIds = await getCampaignMemberUserIds(campId, actor.id);
      await notify(
        memberIds,
        "encounter_started",
        {
          title: `\u0646\u0628\u0631\u062F \u0641\u0639\u0627\u0644 \u0622\u063A\u0627\u0632 \u0634\u062F: ${encRow.name}`,
          body: `\u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0631\u0648\u06CC\u0627\u0631\u0648\u06CC\u06CC \xAB${encRow.name}\xBB \u0631\u0627 \u0622\u063A\u0627\u0632 \u06A9\u0631\u062F. \u0648\u0627\u0631\u062F \u0635\u0641\u062D\u0647 \u0646\u0628\u0631\u062F \u0634\u0648\u06CC\u062F.`,
          campaignId: campId,
          targetType: "encounter",
          targetId: encId,
          link: `/encounters?active=${encId}`,
          actorName: actor.display_name
        },
        campId
      );
    } catch {
    }
    return json({ success: true, status: "active", round: 1, currentParticipantId: partRow?.id || null, version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/pause") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/pause", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare("UPDATE encounters SET status = 'paused', version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'round', '\u0645\u0628\u0627\u0631\u0632\u0647 \u0645\u0648\u0642\u062A\u0627\u064B \u0645\u062A\u0648\u0642\u0641 \u0634\u062F.', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, t).run();
    return json({ success: true, status: "paused", version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/resume") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/resume", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare("UPDATE encounters SET status = 'active', version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'round', '\u0645\u0628\u0627\u0631\u0632\u0647 \u0645\u062C\u062F\u062F\u0627\u064B \u0627\u0632 \u0633\u0631 \u06AF\u0631\u0641\u062A\u0647 \u0634\u062F.', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, t).run();
    return json({ success: true, status: "active", version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/end") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/end", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare("UPDATE encounters SET status = 'ended', ended_at = ?, version = ?, updated_at = ? WHERE id = ?").bind(t, nextVersion, t, encId).run();
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'end', '\u0645\u0628\u0627\u0631\u0632\u0647 \u0628\u0627 \u067E\u06CC\u0631\u0648\u0632\u06CC \u0628\u0647 \u067E\u0627\u06CC\u0627\u0646 \u0631\u0633\u06CC\u062F.', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, t).run();
    return json({ success: true, status: "ended", version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/next-turn") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/next-turn", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const partRows = await env.DB.prepare(
      "SELECT * FROM encounter_participants WHERE encounter_id = ? AND initiative IS NOT NULL ORDER BY initiative DESC, sort_index ASC"
    ).bind(encId).all();
    const activeParts = (partRows.results || []).filter((p) => p.status === "active");
    if (activeParts.length === 0) return error("\u0647\u06CC\u0686 \u0645\u0628\u0627\u0631\u0632 \u0641\u0639\u0627\u0644\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.");
    const currentIndex = activeParts.findIndex((p) => p.id === encRow.current_participant_id);
    let nextRound = encRow.round || 1;
    let nextIndex = 0;
    if (currentIndex === -1 || currentIndex >= activeParts.length - 1) {
      nextIndex = 0;
      nextRound = nextRound + 1;
    } else {
      nextIndex = currentIndex + 1;
    }
    const nextPart = activeParts[nextIndex];
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare(
      "UPDATE encounters SET current_participant_id = ?, round = ?, version = ?, updated_at = ? WHERE id = ?"
    ).bind(nextPart.id, nextRound, nextVersion, t, encId).run();
    if (nextRound > (encRow.round || 1)) {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'round', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, nextRound, `\u0622\u063A\u0627\u0632 \u062F\u0648\u0631 ${nextRound}`, t).run();
    }
    const pName = nextPart.display_name_for_players || nextPart.instance_name;
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'turn', ?, 1, ?)`
    ).bind(`evt-${t + 1}-${generateRandomToken(4)}`, encId, nextRound, `\u0646\u0648\u0628\u062A \u0628\u0647 ${pName} \u0631\u0633\u06CC\u062F.`, t + 1).run();
    return json({ success: true, currentParticipantId: nextPart.id, round: nextRound, version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/prev-turn") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/prev-turn", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const partRows = await env.DB.prepare(
      "SELECT * FROM encounter_participants WHERE encounter_id = ? AND initiative IS NOT NULL ORDER BY initiative DESC, sort_index ASC"
    ).bind(encId).all();
    const activeParts = (partRows.results || []).filter((p) => p.status === "active");
    if (activeParts.length === 0) return error("\u0647\u06CC\u0686 \u0645\u0628\u0627\u0631\u0632 \u0641\u0639\u0627\u0644\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.");
    const currentIndex = activeParts.findIndex((p) => p.id === encRow.current_participant_id);
    let nextRound = encRow.round || 1;
    let prevIndex = 0;
    if (currentIndex <= 0) {
      prevIndex = activeParts.length - 1;
      nextRound = Math.max(1, nextRound - 1);
    } else {
      prevIndex = currentIndex - 1;
    }
    const prevPart = activeParts[prevIndex];
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare(
      "UPDATE encounters SET current_participant_id = ?, round = ?, version = ?, updated_at = ? WHERE id = ?"
    ).bind(prevPart.id, nextRound, nextVersion, t, encId).run();
    return json({ success: true, currentParticipantId: prevPart.id, round: nextRound, version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/participants") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/participants", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const items = Array.isArray(body.participants) ? body.participants : [body];
    const announceReinforcements = Boolean(body.announceReinforcements);
    const announcementText = body.announcementText || "\u0646\u06CC\u0631\u0648\u0647\u0627\u06CC \u06A9\u0645\u06A9\u06CC \u0627\u0632 \u0631\u0627\u0647 \u0631\u0633\u06CC\u062F\u0646\u062F!";
    const createdList = [];
    const t = Date.now();
    const maxSortRow = await env.DB.prepare("SELECT MAX(sort_index) as m FROM encounter_participants WHERE encounter_id = ?").bind(encId).first();
    let currentSort = (maxSortRow?.m ?? 0) + 1;
    for (const item of items) {
      const pid = `part-${Date.now()}-${generateRandomToken(4)}`;
      const kind = item.kind || "monster";
      const npcTemplateId = item.npcTemplateId || null;
      const characterId = item.characterId || null;
      const instanceName = item.instanceName || "\u0645\u0648\u062C\u0648\u062F";
      const displayNameForPlayers = item.displayNameForPlayers || instanceName;
      const maxHp = Number(item.maxHp || 10);
      const hp = Number(item.hp !== void 0 ? item.hp : maxHp);
      const ac = String(item.ac || "10");
      const acState = item.acState || null;
      const conditions = JSON.stringify(item.conditions || []);
      const initiative = item.initiative !== void 0 && item.initiative !== null ? Number(item.initiative) : null;
      const initiativeStatus = initiative !== null ? "set" : "none";
      const visibility = item.visibility || "revealed";
      const status = item.status || "active";
      const phase = item.phase || null;
      const groupId = item.groupId || null;
      const notes = item.notes || "";
      const addedAtRound = encRow.round || 0;
      await env.DB.prepare(
        `INSERT INTO encounter_participants (
           id, encounter_id, kind, npc_template_id, character_id, instance_name,
           display_name_for_players, max_hp, hp, ac, ac_state, conditions, initiative,
           initiative_status, visibility, status, phase, group_id, sort_index,
           added_at_round, revision, notes, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      ).bind(
        pid,
        encId,
        kind,
        npcTemplateId,
        characterId,
        instanceName,
        displayNameForPlayers,
        maxHp,
        hp,
        ac,
        acState,
        conditions,
        initiative,
        initiativeStatus,
        visibility,
        status,
        phase,
        groupId,
        currentSort++,
        addedAtRound,
        notes,
        t
      ).run();
      createdList.push({
        id: pid,
        encounterId: encId,
        kind,
        npcTemplateId,
        characterId,
        instanceName,
        displayNameForPlayers,
        maxHp,
        hp,
        ac,
        visibility,
        status,
        initiative,
        initiativeStatus,
        revision: 1
      });
    }
    if (announceReinforcements) {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'add', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, announcementText, t).run();
    }
    const nextVersion = (encRow.version || 0) + 1;
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    return json({ success: true, created: createdList, version: nextVersion }, 201);
  }
  if (path.startsWith("/encounters/") && path.includes("/participants/") && method === "PATCH") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const parts = path.split("/");
    const encId = parts[2];
    const pid = parts[4];
    const partRow = await env.DB.prepare("SELECT * FROM encounter_participants WHERE id = ? AND encounter_id = ?").bind(pid, encId).first();
    if (!partRow) return error("\u0645\u0628\u0627\u0631\u0632 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const data = await request.json();
    if (data.revision !== void 0 && Number(data.revision) !== Number(partRow.revision)) {
      return error("\u062A\u063A\u06CC\u06CC\u0631\u0627\u062A \u062A\u0648\u0633\u0637 \u062A\u0628 \u06CC\u0627 \u06A9\u0627\u0631\u0628\u0631 \u062F\u06CC\u06AF\u0631\u06CC \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.", 409);
    }
    const newHp = data.hp !== void 0 ? Number(data.hp) : partRow.hp;
    const newMaxHp = data.maxHp !== void 0 ? Number(data.maxHp) : partRow.max_hp;
    const newAc = data.ac !== void 0 ? String(data.ac) : partRow.ac;
    const newAcState = data.acState !== void 0 ? data.acState : partRow.ac_state;
    const newConditions = data.conditions !== void 0 ? JSON.stringify(data.conditions) : partRow.conditions;
    const newInit = data.initiative !== void 0 ? data.initiative === null ? null : Number(data.initiative) : partRow.initiative;
    const newInitStatus = data.initiativeStatus !== void 0 ? data.initiativeStatus : newInit !== null ? "set" : partRow.initiative_status;
    const newVisibility = data.visibility !== void 0 ? data.visibility : partRow.visibility;
    const newStatus = data.status !== void 0 ? data.status : partRow.status;
    const newPhase = data.phase !== void 0 ? data.phase : partRow.phase;
    const newName = data.instanceName !== void 0 ? data.instanceName : partRow.instance_name;
    const newDisplayName = data.displayNameForPlayers !== void 0 ? data.displayNameForPlayers : partRow.display_name_for_players;
    const newNotes = data.notes !== void 0 ? data.notes : partRow.notes;
    const newSortIndex = data.sortIndex !== void 0 ? Number(data.sortIndex) : partRow.sort_index;
    const newRevision = (partRow.revision || 1) + 1;
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE encounter_participants SET 
         hp = ?, max_hp = ?, ac = ?, ac_state = ?, conditions = ?, initiative = ?, 
         initiative_status = ?, visibility = ?, status = ?, phase = ?, instance_name = ?, 
         display_name_for_players = ?, notes = ?, sort_index = ?, revision = ?
       WHERE id = ?`
    ).bind(
      newHp,
      newMaxHp,
      newAc,
      newAcState,
      newConditions,
      newInit,
      newInitStatus,
      newVisibility,
      newStatus,
      newPhase,
      newName,
      newDisplayName,
      newNotes,
      newSortIndex,
      newRevision,
      pid
    ).run();
    if (partRow.kind === "character" && partRow.character_id && data.hp !== void 0) {
      const charRow = await env.DB.prepare("SELECT data FROM characters WHERE id = ?").bind(partRow.character_id).first();
      if (charRow?.data) {
        try {
          const cData = JSON.parse(charRow.data);
          cData.hp = { ...cData.hp, current: newHp, max: newMaxHp };
          await env.DB.prepare("UPDATE characters SET data = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(cData), t, partRow.character_id).run();
        } catch {
        }
      }
    }
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    const nextEncVersion = (encRow?.version || 0) + 1;
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(nextEncVersion, t, encId).run();
    if (data.status === "defeated" && partRow.status !== "defeated") {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'defeat', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow?.round || 1, `${partRow.display_name_for_players || partRow.instance_name} \u0634\u06A9\u0633\u062A \u062E\u0648\u0631\u062F.`, t).run();
    } else if (data.visibility === "revealed" && partRow.visibility !== "revealed") {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'reveal', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow?.round || 1, `${newDisplayName || newName} \u0622\u0634\u06A9\u0627\u0631 \u0634\u062F!`, t).run();
    }
    return json({ success: true, revision: newRevision, version: nextEncVersion });
  }
  if (path.startsWith("/encounters/") && path.includes("/participants/") && method === "DELETE") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const parts = path.split("/");
    const encId = parts[2];
    const pid = parts[4];
    await env.DB.prepare("DELETE FROM encounter_participants WHERE id = ? AND encounter_id = ?").bind(pid, encId).run();
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    const nextVersion = (encRow?.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    return json({ success: true, version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/events") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/events", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const text = String(body.text || "").trim();
    if (!text) return error("\u0645\u062A\u0646 \u0631\u0648\u06CC\u062F\u0627\u062F \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const visible = body.visibleToPlayers !== false ? 1 : 0;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'note', ?, ?, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, text, visible, t).run();
    const nextVersion = (encRow.version || 0) + 1;
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    return json({ success: true, version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/loot") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/loot", "");
    const body = await request.json();
    const { characterId, item } = body;
    if (!characterId || !item || !item.name) return error("\u0634\u0646\u0627\u0633\u0647 \u0634\u062E\u0635\u06CC\u062A \u0648 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0622\u06CC\u062A\u0645 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const charRow = await env.DB.prepare("SELECT * FROM characters WHERE id = ?").bind(characterId).first();
    if (!charRow) return error("\u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const charData = JSON.parse(charRow.data);
    const newItem = {
      id: `item-${Date.now()}-${generateRandomToken(4)}`,
      name: item.name,
      category: item.category || "loot",
      quantity: item.quantity || 1,
      weight: item.weight || 0.5,
      description: item.description || "",
      mechanicalEffect: item.mechanicalEffect || "",
      secretNotes: item.secretNotes || "",
      isNew: true
    };
    charData.inventory = [...charData.inventory || [], newItem];
    const t = Date.now();
    await env.DB.prepare("UPDATE characters SET data = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(charData), t, characterId).run();
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    const nextVersion = (encRow?.version || 0) + 1;
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'note', ?, 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow?.round || 1, `\u063A\u0646\u06CC\u0645\u062A ${item.name} \u0628\u0647 ${charRow.name} \u0627\u0647\u062F\u0627 \u0634\u062F.`, t).run();
    return json({ success: true, version: nextVersion, item: newItem });
  }
  if (path === "/calendar" && method === "GET") {
    const row = await env.DB.prepare("SELECT * FROM campaign_calendar WHERE id = ?").bind("zorvania-calendar").first();
    if (!row) {
      return json({
        id: "zorvania-calendar",
        year: 1500,
        month: 1,
        day: 1,
        isOffDay: false,
        currentFestival: "\u062C\u0634\u0646 \u0641\u0631\u0647\u06AF\u0627\u0646",
        updatedAt: now
      });
    }
    return json({
      id: row.id,
      year: row.year,
      month: row.month,
      day: row.day,
      isOffDay: row.is_off_day === 1,
      offDayIndex: row.off_day_index,
      currentFestival: row.current_festival,
      updatedAt: row.updated_at
    });
  }
  if (path === "/calendar" && method === "PUT") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    await env.DB.prepare(
      "INSERT INTO campaign_calendar (id, year, month, day, is_off_day, off_day_index, current_festival, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET year = excluded.year, month = excluded.month, day = excluded.day, is_off_day = excluded.is_off_day, off_day_index = excluded.off_day_index, current_festival = excluded.current_festival, updated_at = excluded.updated_at"
    ).bind("zorvania-calendar", data.year, data.month, data.day, data.isOffDay ? 1 : 0, data.offDayIndex || 0, data.currentFestival || "", now).run();
    return json({ ...data, updatedAt: now });
  }
  if (path === "/endings" && method === "GET") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const row = await env.DB.prepare("SELECT data FROM campaign_endings WHERE id = ?").bind("zorvania-endings").first();
    if (!row) {
      return json({ id: "zorvania-endings", updatedAt: now });
    }
    return json(JSON.parse(row.data));
  }
  if (path === "/endings" && method === "PUT") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    await env.DB.prepare(
      "INSERT INTO campaign_endings (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at"
    ).bind("zorvania-endings", JSON.stringify({ ...data, updatedAt: now }), now).run();
    return json({ ...data, updatedAt: now });
  }
  if (path === "/shanshin-encounters" && method === "GET") {
    const res = await env.DB.prepare("SELECT * FROM shanshin_encounters ORDER BY id ASC").all();
    return json(res.results || []);
  }
  if (path === "/library" && method === "GET") {
    const source = url.searchParams.get("source") || "current_campaign";
    const type = url.searchParams.get("type") || "";
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const tag = url.searchParams.get("tag") || "";
    const region = url.searchParams.get("region") || "";
    const sort = url.searchParams.get("sort") || "newest";
    let scopeType = "campaign";
    let scopeId = "zorvania-c1";
    if (source === "my_library") {
      const libRow = await env.DB.prepare("SELECT id FROM content_packs WHERE owner_id = ? AND is_default_library = 1").bind(currentUser.id).first();
      scopeType = "pack";
      scopeId = libRow?.id || "pack-zorvania";
    } else if (source.startsWith("pack-") || source.startsWith("pack_")) {
      scopeType = "pack";
      scopeId = source;
    } else if (source.startsWith("camp-") || source === "zorvania-c1") {
      scopeType = "campaign";
      scopeId = source;
    }
    const itemsList = [];
    if (!type || type === "location") {
      const rows = await env.DB.prepare("SELECT * FROM locations WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({ ...r, itemType: "location", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "npc") {
      const rows = await env.DB.prepare("SELECT * FROM npcs WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({ ...r, itemType: "npc", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "item") {
      const rows = await env.DB.prepare("SELECT * FROM items WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({ ...r, itemType: "item", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "encounter") {
      const rows = await env.DB.prepare("SELECT * FROM encounters WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({ ...r, itemType: "encounter", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "faction") {
      const rows = await env.DB.prepare("SELECT * FROM factions WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({ ...r, itemType: "faction", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "class_template") {
      const rows = await env.DB.prepare("SELECT * FROM class_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        let parsed = {};
        try {
          parsed = JSON.parse(r.data);
        } catch {
        }
        itemsList.push({ ...parsed, ...r, itemType: "class_template", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "lineage_template") {
      const rows = await env.DB.prepare("SELECT * FROM lineage_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({
          ...r,
          itemType: "lineage_template",
          name: r.name,
          tags: JSON.parse(r.tags || "[]"),
          abilityBonuses: JSON.parse(r.ability_bonuses || "{}"),
          traits: JSON.parse(r.traits || "[]"),
          languages: JSON.parse(r.languages || "[]"),
          proficiencies: JSON.parse(r.proficiencies || "{}"),
          resistances: JSON.parse(r.resistances || "[]"),
          senses: JSON.parse(r.senses || "{}"),
          sublineages: JSON.parse(r.sublineages || "[]"),
          nameSuggestions: JSON.parse(r.name_suggestions || "[]"),
          backstoryPrompts: JSON.parse(r.backstory_prompts || "[]")
        });
      }
    }
    if (!type || type === "background_template") {
      const rows = await env.DB.prepare("SELECT * FROM background_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({
          ...r,
          itemType: "background_template",
          name: r.name,
          tags: JSON.parse(r.tags || "[]"),
          skillProficiencies: JSON.parse(r.skill_proficiencies || "[]"),
          toolProficiencies: JSON.parse(r.tool_proficiencies || "[]"),
          languages: JSON.parse(r.languages || "[]"),
          startingEquipment: JSON.parse(r.starting_equipment || "[]"),
          personalityTables: JSON.parse(r.personality_tables || "{}")
        });
      }
    }
    let filtered = itemsList;
    if (q) {
      filtered = filtered.filter((i) => i.name && i.name.toLowerCase().includes(q) || i.description && i.description.toLowerCase().includes(q));
    }
    if (tag) {
      filtered = filtered.filter((i) => i.tags && i.tags.includes(tag));
    }
    if (region) {
      filtered = filtered.filter((i) => i.region === region);
    }
    return json({ items: filtered, total: filtered.length });
  }
  if (path === "/clone/preview" && method === "POST") {
    const canClone = await checkRateLimit("clone_user:" + actor.id, 10, 3600 * 1e3);
    if (!canClone) return error("\u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u06A9\u067E\u06CC \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A (\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F1\u06F0 \u0628\u0627\u0631 \u062F\u0631 \u0633\u0627\u0639\u062A).", 429);
    const body = await request.json();
    const source = body.source;
    if (!source || !source.scopeType || !source.scopeId) {
      return error("\u0645\u0634\u062E\u0635\u0627\u062A \u0645\u0646\u0628\u0639 \u06A9\u067E\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    }
    if (source.scopeType === "campaign") {
      const srcRole = await getMembershipRole(source.scopeId, actor.id);
      if (srcRole !== "owner" && srcRole !== "co_dm" && !isPlatformAdmin()) {
        return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0646\u0628\u0639 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
      }
    }
    const target = body.target;
    if (target?.scopeType === "campaign") {
      const tgtRole = await getMembershipRole(target.scopeId, actor.id);
      if (tgtRole !== "owner" && tgtRole !== "co_dm" && !isPlatformAdmin()) {
        return error("\u0634\u0645\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0648\u06CC\u0631\u0627\u06CC\u0634 \u062F\u0631 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u0642\u0635\u062F \u0646\u062F\u0627\u0631\u06CC\u062F.", 403);
      }
    }
    return json({
      totalCount: 0,
      items: [],
      conflicts: [],
      warnings: []
    });
  }
  if (path === "/clone/run" && method === "POST") {
    const canClone = await checkRateLimit("clone_user:" + actor.id, 10, 3600 * 1e3);
    if (!canClone) return error("\u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u06A9\u067E\u06CC \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A (\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F1\u06F0 \u0628\u0627\u0631 \u062F\u0631 \u0633\u0627\u0639\u062A).", 429);
    const body = await request.json();
    const source = body.source;
    if (!source || !source.scopeType || !source.scopeId) {
      return error("\u0645\u0634\u062E\u0635\u0627\u062A \u0645\u0646\u0628\u0639 \u06A9\u067E\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    }
    if (source.scopeType === "campaign") {
      const srcRole = await getMembershipRole(source.scopeId, actor.id);
      if (srcRole !== "owner" && srcRole !== "co_dm" && !isPlatformAdmin()) {
        return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0646\u0628\u0639 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
      }
    }
    const target = body.target;
    if (target?.scopeType === "campaign") {
      const tgtRole = await getMembershipRole(target.scopeId, actor.id);
      if (tgtRole !== "owner" && tgtRole !== "co_dm" && !isPlatformAdmin()) {
        return error("\u0634\u0645\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0648\u06CC\u0631\u0627\u06CC\u0634 \u062F\u0631 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u0642\u0635\u062F \u0646\u062F\u0627\u0631\u06CC\u062F.", 403);
      }
    }
    const jobId = `job-${Date.now()}-${generateRandomToken(4)}`;
    const job = {
      id: jobId,
      scopeType: target?.scopeType || "campaign",
      scopeId: target?.scopeId || "camp",
      sourceType: source.scopeType,
      sourceId: source.scopeId,
      status: "completed",
      options: body.options || {},
      createdEntities: [],
      manifest: { totalCount: 0, items: [], conflicts: [], warnings: [] },
      warnings: [],
      executedAt: Date.now()
    };
    await audit("clone_executed", target?.scopeId || null, { source, target, jobId });
    return json(job);
  }
  if (path === "/clone-jobs" && method === "GET") {
    return json([]);
  }
  if (path === "/packs" && method === "GET") {
    const kind = url.searchParams.get("kind");
    let q = 'SELECT * FROM content_packs WHERE visibility = "instance" OR owner_id = ?';
    const params = [currentUser.id];
    if (kind) {
      q += " AND kind = ?";
      params.push(kind);
    }
    const res = await env.DB.prepare(q).bind(...params).all();
    return json(res.results || []);
  }
  if (path === "/packs" && method === "POST") {
    const data = await request.json();
    const packId = `pack-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO content_packs (id, owner_id, name, description, version, visibility, kind, tags, is_default_library, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).bind(packId, currentUser.id, data.name, data.description || "", "1.0.0", data.visibility || "private", data.kind || "pack", JSON.stringify(data.tags || []), t, t).run();
    return json({ id: packId, name: data.name, kind: data.kind || "pack", createdAt: t }, 201);
  }
  if (path === "/favorites" && method === "GET") {
    const res = await env.DB.prepare("SELECT * FROM favorites WHERE user_id = ?").bind(currentUser.id).all();
    return json(res.results || []);
  }
  if (path === "/favorites" && method === "PUT") {
    const data = await request.json();
    const existing = await env.DB.prepare("SELECT * FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?").bind(currentUser.id, data.entityType, data.entityId).first();
    let isFavorite = false;
    if (existing) {
      await env.DB.prepare("DELETE FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?").bind(currentUser.id, data.entityType, data.entityId).run();
      isFavorite = false;
    } else {
      await env.DB.prepare("INSERT INTO favorites (user_id, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?)").bind(currentUser.id, data.entityType, data.entityId, Date.now()).run();
      isFavorite = true;
    }
    return json({ isFavorite });
  }
  if (path === "/campaigns/draft" && method === "POST") {
    const data = await request.json();
    const campId = `camp-draft-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    const defaultSettings = JSON.stringify({
      units: "feet",
      startingLevel: 1,
      maxEntryLevel: 20,
      abilityScoreMethods: ["standard_array", "point_buy", "roll", "manual"],
      approval: { onCreate: false, onLevelUp: false },
      backstoryVisibility: "party",
      diceVisibility: "table",
      allowPlayerRollPrivate: true,
      allowPlayerCreateCharacter: true,
      encounterDefaults: {
        showExactHp: false,
        showAc: false,
        showConditions: true,
        showDefeated: true,
        playerInitiativeRolls: true
      }
    });
    const initWizard = JSON.stringify({
      step: 1,
      completed: [],
      startMode: data.startMode || "empty",
      sourceId: data.sourceId || null,
      answers: { name: "\u06A9\u0645\u067E\u06CC\u0646 \u062C\u062F\u06CC\u062F" }
    });
    await env.DB.prepare(
      `INSERT INTO campaigns (id, name, description, status, owner_id, settings, wizard_state, created_at, updated_at)
       VALUES (?, '\u06A9\u0645\u067E\u06CC\u0646 \u062C\u062F\u06CC\u062F', '', 'draft', ?, ?, ?, ?, ?)`
    ).bind(campId, currentUser.id, defaultSettings, initWizard, t, t).run();
    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at)
       VALUES (?, ?, 'owner', 'active', ?)`
    ).bind(campId, currentUser.id, t).run();
    return json({ id: campId, name: "\u06A9\u0645\u067E\u06CC\u0646 \u062C\u062F\u06CC\u062F", status: "draft", wizardState: JSON.parse(initWizard) }, 201);
  }
  if (path.match(/^\/campaigns\/[^/]+\/wizard$/) && method === "PATCH") {
    const campId = path.split("/")[2];
    const data = await request.json();
    const camp = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const currentWiz = camp.wizard_state ? JSON.parse(camp.wizard_state) : { step: 1, answers: {} };
    const mergedWiz = {
      ...currentWiz,
      ...data,
      answers: {
        ...currentWiz.answers || {},
        ...data.answers || {}
      }
    };
    const newName = mergedWiz.answers.name || camp.name;
    const newDesc = mergedWiz.answers.description || camp.description;
    const t = Date.now();
    await env.DB.prepare(
      "UPDATE campaigns SET name = ?, description = ?, wizard_state = ?, updated_at = ? WHERE id = ?"
    ).bind(newName, newDesc, JSON.stringify(mergedWiz), t, campId).run();
    return json({ id: campId, name: newName, description: newDesc, wizardState: mergedWiz });
  }
  if (path.match(/^\/campaigns\/[^/]+\/launch$/) && method === "POST") {
    const campId = path.split("/")[2];
    const t = Date.now();
    await env.DB.prepare("UPDATE campaigns SET status = 'active', updated_at = ? WHERE id = ?").bind(t, campId).run();
    return json({ success: true, id: campId, status: "active" });
  }
  if (path.match(/^\/c\/[^/]+\/factions$/) && method === "GET") {
    const cId = path.split("/")[2];
    const rows = await env.DB.prepare('SELECT * FROM factions WHERE scope_type = "campaign" AND scope_id = ?').bind(cId).all();
    const list = (rows.results || []).map((r) => ({
      ...r,
      revealed: r.revealed === 1,
      tags: JSON.parse(r.tags || "[]")
    }));
    return json(list);
  }
  if (path.match(/^\/c\/[^/]+\/factions$/) && method === "POST") {
    const cId = path.split("/")[2];
    const data = await request.json();
    const fId = `fac-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO factions (id, scope_type, scope_id, name, description, attitude, region, revealed, dm_notes, tags, source_mode, created_at, updated_at)
       VALUES (?, 'campaign', ?, ?, ?, ?, ?, ?, ?, ?, 'copy', ?, ?)`
    ).bind(fId, cId, data.name, data.description || "", data.attitude || "", data.region || "", data.revealed ? 1 : 0, data.dmNotes || "", JSON.stringify(data.tags || []), t, t).run();
    return json({ id: fId, name: data.name, ...data, createdAt: t, updatedAt: t }, 201);
  }
  if (path.match(/^\/c\/[^/]+\/docs$/) && method === "GET") {
    const cId = path.split("/")[2];
    const rows = await env.DB.prepare("SELECT * FROM campaign_docs WHERE campaign_id = ? ORDER BY sort_index ASC").bind(cId).all();
    return json(rows.results || []);
  }
  if (path.match(/^\/c\/[^/]+\/docs$/) && method === "POST") {
    const cId = path.split("/")[2];
    const data = await request.json();
    const dId = `cdoc-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO campaign_docs (id, campaign_id, kind, title, body, visibility, sort_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(dId, cId, data.kind || "session_zero", data.title, data.body || "", data.visibility || "party", data.sortIndex || 0, t, t).run();
    return json({ id: dId, ...data, createdAt: t, updatedAt: t }, 201);
  }
  if (path === "/generic-calendar" && method === "GET") {
    const row = await env.DB.prepare("SELECT * FROM calendars ORDER BY updated_at DESC LIMIT 1").first();
    if (!row) {
      return json({
        id: "cal-zorvania",
        name: "\u06AF\u0627\u0647\u200C\u0634\u0645\u0627\u0631 \u0634\u0627\u0647\u200C\u0631\u0648\u0632\u0627\u0646 (\u0632\u0631\u0648\u0627\u0646\u06CC\u0627)",
        eraLabel: "\u067E.\u0631.\u0646",
        startYear: 1500,
        months: [],
        festivals: [],
        offDays: []
      });
    }
    return json({
      id: row.id,
      name: row.name,
      eraLabel: row.era_label,
      startYear: row.start_year,
      months: JSON.parse(row.months || "[]"),
      festivals: [],
      offDays: JSON.parse(row.off_days || "[]"),
      weekdays: JSON.parse(row.weekdays || "[]")
    });
  }
  if (path === "/class-templates" && method === "GET") {
    const scopeType = url.searchParams.get("scopeType") || "campaign";
    const scopeId = url.searchParams.get("scopeId") || "zorvania-c1";
    const rows = await env.DB.prepare("SELECT * FROM class_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
    const list = (rows.results || []).map((r) => {
      let parsed = {};
      try {
        parsed = JSON.parse(r.data);
      } catch {
      }
      return { ...parsed, ...r, tags: JSON.parse(r.tags || "[]") };
    });
    return json(list);
  }
  if (path === "/class-templates" && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = data.id || `class-${Date.now()}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO class_templates (id, scope_type, scope_id, name, data, tags, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, data.scopeType || "campaign", data.scopeId || "zorvania-c1", data.name, JSON.stringify(data), JSON.stringify(data.tags || []), t).run();
    return json({ ...data, id, updatedAt: t }, 201);
  }
  if (path.startsWith("/class-templates/") && (method === "PUT" || method === "PATCH")) {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    const data = await request.json();
    const t = Date.now();
    await env.DB.prepare(
      "UPDATE class_templates SET name = ?, data = ?, tags = ?, updated_at = ? WHERE id = ?"
    ).bind(data.name, JSON.stringify(data), JSON.stringify(data.tags || []), t, id).run();
    return json({ ...data, id, updatedAt: t });
  }
  if (path.startsWith("/class-templates/") && method === "DELETE") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    await env.DB.prepare("DELETE FROM class_templates WHERE id = ?").bind(id).run();
    return json({ success: true });
  }
  if (path === "/lineage-templates" && method === "GET") {
    const scopeType = url.searchParams.get("scopeType") || "campaign";
    const scopeId = url.searchParams.get("scopeId") || "zorvania-c1";
    const rows = await env.DB.prepare("SELECT * FROM lineage_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
    const list = (rows.results || []).map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || "[]"),
      abilityBonuses: JSON.parse(r.ability_bonuses || "{}"),
      traits: JSON.parse(r.traits || "[]"),
      languages: JSON.parse(r.languages || "[]"),
      proficiencies: JSON.parse(r.proficiencies || "{}"),
      resistances: JSON.parse(r.resistances || "[]"),
      senses: JSON.parse(r.senses || "{}"),
      sublineages: JSON.parse(r.sublineages || "[]"),
      nameSuggestions: JSON.parse(r.name_suggestions || "[]"),
      backstoryPrompts: JSON.parse(r.backstory_prompts || "[]")
    }));
    return json(list);
  }
  if (path.startsWith("/lineage-templates/") && method === "GET") {
    const id = path.split("/")[2];
    const r = await env.DB.prepare("SELECT * FROM lineage_templates WHERE id = ?").bind(id).first();
    if (!r) return error("\u0646\u0698\u0627\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    return json({
      ...r,
      tags: JSON.parse(r.tags || "[]"),
      abilityBonuses: JSON.parse(r.ability_bonuses || "{}"),
      traits: JSON.parse(r.traits || "[]"),
      languages: JSON.parse(r.languages || "[]"),
      proficiencies: JSON.parse(r.proficiencies || "{}"),
      resistances: JSON.parse(r.resistances || "[]"),
      senses: JSON.parse(r.senses || "{}"),
      sublineages: JSON.parse(r.sublineages || "[]"),
      nameSuggestions: JSON.parse(r.name_suggestions || "[]"),
      backstoryPrompts: JSON.parse(r.backstory_prompts || "[]")
    });
  }
  if (path === "/lineage-templates" && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = data.id || `lin-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO lineage_templates (
        id, scope_type, scope_id, source_id, source_mode, tags, name, description,
        size, speed, ability_bonuses, traits, languages, proficiencies, resistances,
        senses, sublineages, name_suggestions, backstory_prompts, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.scopeType || "campaign",
      data.scopeId || "zorvania-c1",
      data.sourceId || null,
      data.sourceMode || "copy",
      JSON.stringify(data.tags || []),
      data.name,
      data.description || "",
      data.size || "\u0645\u062A\u0648\u0633\u0637 (Medium)",
      data.speed || 30,
      JSON.stringify(data.abilityBonuses || {}),
      JSON.stringify(data.traits || []),
      JSON.stringify(data.languages || []),
      JSON.stringify(data.proficiencies || {}),
      JSON.stringify(data.resistances || []),
      JSON.stringify(data.senses || {}),
      JSON.stringify(data.sublineages || []),
      JSON.stringify(data.nameSuggestions || []),
      JSON.stringify(data.backstoryPrompts || []),
      t,
      t
    ).run();
    return json({ ...data, id, createdAt: t, updatedAt: t }, 201);
  }
  if (path.startsWith("/lineage-templates/") && (method === "PUT" || method === "PATCH")) {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    const data = await request.json();
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE lineage_templates SET
        name = ?, description = ?, size = ?, speed = ?, ability_bonuses = ?,
        traits = ?, languages = ?, proficiencies = ?, resistances = ?, senses = ?,
        sublineages = ?, name_suggestions = ?, backstory_prompts = ?, tags = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      data.name,
      data.description || "",
      data.size || "\u0645\u062A\u0648\u0633\u0637 (Medium)",
      data.speed || 30,
      JSON.stringify(data.abilityBonuses || {}),
      JSON.stringify(data.traits || []),
      JSON.stringify(data.languages || []),
      JSON.stringify(data.proficiencies || {}),
      JSON.stringify(data.resistances || []),
      JSON.stringify(data.senses || {}),
      JSON.stringify(data.sublineages || []),
      JSON.stringify(data.nameSuggestions || []),
      JSON.stringify(data.backstoryPrompts || []),
      JSON.stringify(data.tags || []),
      t,
      id
    ).run();
    return json({ ...data, id, updatedAt: t });
  }
  if (path.startsWith("/lineage-templates/") && method === "DELETE") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    await env.DB.prepare("DELETE FROM lineage_templates WHERE id = ?").bind(id).run();
    return json({ success: true });
  }
  if (path === "/background-templates" && method === "GET") {
    const scopeType = url.searchParams.get("scopeType") || "campaign";
    const scopeId = url.searchParams.get("scopeId") || "zorvania-c1";
    const rows = await env.DB.prepare("SELECT * FROM background_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
    const list = (rows.results || []).map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || "[]"),
      skillProficiencies: JSON.parse(r.skill_proficiencies || "[]"),
      toolProficiencies: JSON.parse(r.tool_proficiencies || "[]"),
      languages: JSON.parse(r.languages || "[]"),
      startingEquipment: JSON.parse(r.starting_equipment || "[]"),
      featureName: r.feature_name,
      featureDescription: r.feature_description,
      personalityTables: JSON.parse(r.personality_tables || "{}")
    }));
    return json(list);
  }
  if (path.startsWith("/background-templates/") && method === "GET") {
    const id = path.split("/")[2];
    const r = await env.DB.prepare("SELECT * FROM background_templates WHERE id = ?").bind(id).first();
    if (!r) return error("\u067E\u06CC\u0634\u06CC\u0646\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    return json({
      ...r,
      tags: JSON.parse(r.tags || "[]"),
      skillProficiencies: JSON.parse(r.skill_proficiencies || "[]"),
      toolProficiencies: JSON.parse(r.tool_proficiencies || "[]"),
      languages: JSON.parse(r.languages || "[]"),
      startingEquipment: JSON.parse(r.starting_equipment || "[]"),
      featureName: r.feature_name,
      featureDescription: r.feature_description,
      personalityTables: JSON.parse(r.personality_tables || "{}")
    });
  }
  if (path === "/background-templates" && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = data.id || `bg-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO background_templates (
        id, scope_type, scope_id, source_id, source_mode, tags, name, description,
        skill_proficiencies, tool_proficiencies, languages, starting_equipment,
        feature_name, feature_description, personality_tables, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.scopeType || "campaign",
      data.scopeId || "zorvania-c1",
      data.sourceId || null,
      data.sourceMode || "copy",
      JSON.stringify(data.tags || []),
      data.name,
      data.description || "",
      JSON.stringify(data.skillProficiencies || []),
      JSON.stringify(data.toolProficiencies || []),
      JSON.stringify(data.languages || []),
      JSON.stringify(data.startingEquipment || []),
      data.featureName || "",
      data.featureDescription || "",
      JSON.stringify(data.personalityTables || {}),
      t,
      t
    ).run();
    return json({ ...data, id, createdAt: t, updatedAt: t }, 201);
  }
  if (path.startsWith("/background-templates/") && (method === "PUT" || method === "PATCH")) {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    const data = await request.json();
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE background_templates SET
        name = ?, description = ?, skill_proficiencies = ?, tool_proficiencies = ?,
        languages = ?, starting_equipment = ?, feature_name = ?, feature_description = ?,
        personality_tables = ?, tags = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      data.name,
      data.description || "",
      JSON.stringify(data.skillProficiencies || []),
      JSON.stringify(data.toolProficiencies || []),
      JSON.stringify(data.languages || []),
      JSON.stringify(data.startingEquipment || []),
      data.featureName || "",
      data.featureDescription || "",
      JSON.stringify(data.personalityTables || {}),
      JSON.stringify(data.tags || []),
      t,
      id
    ).run();
    return json({ ...data, id, updatedAt: t });
  }
  if (path.startsWith("/background-templates/") && method === "DELETE") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    await env.DB.prepare("DELETE FROM background_templates WHERE id = ?").bind(id).run();
    return json({ success: true });
  }
  const loadFullSession = /* @__PURE__ */ __name(async (campId, sid, viewerRole) => {
    const s = await env.DB.prepare("SELECT * FROM sessions WHERE id = ? AND campaign_id = ?").bind(sid, campId).first();
    if (!s) return null;
    const rsvpRes = await env.DB.prepare(
      `SELECT r.session_id, r.user_id, r.status, r.note, r.updated_at, u.display_name, u.avatar_url
         FROM session_rsvps r
         LEFT JOIN users u ON u.id = r.user_id
        WHERE r.session_id = ?`
    ).bind(sid).all();
    const rsvps = (rsvpRes.results || []).map((r) => ({
      sessionId: r.session_id,
      userId: r.user_id,
      status: r.status,
      note: r.note || void 0,
      updatedAt: r.updated_at,
      userName: r.display_name || void 0,
      userAvatarUrl: r.avatar_url || void 0
    }));
    let poll = void 0;
    const pollRow = await env.DB.prepare("SELECT * FROM session_polls WHERE session_id = ?").bind(sid).first();
    if (pollRow) {
      const voteRes = await env.DB.prepare(
        `SELECT v.poll_id, v.option_id, v.user_id, v.choice, u.display_name
           FROM session_poll_votes v
           LEFT JOIN users u ON u.id = v.user_id
          WHERE v.poll_id = ?`
      ).bind(pollRow.id).all();
      const votes = (voteRes.results || []).map((v) => ({
        pollId: v.poll_id,
        optionId: v.option_id,
        userId: v.user_id,
        choice: v.choice,
        userName: v.display_name || void 0
      }));
      const options = parseBlob(pollRow.options, []);
      const userVotes = {};
      for (const v of votes) {
        if (v.userId === actor.id) {
          userVotes[v.optionId] = v.choice;
        }
      }
      poll = {
        id: pollRow.id,
        sessionId: sid,
        options,
        status: pollRow.status,
        votes,
        totalVotes: votes.length,
        userVotes
      };
    }
    const attRes = await env.DB.prepare("SELECT * FROM session_attendance WHERE session_id = ?").bind(sid).all();
    const attendance = (attRes.results || []).map((a) => ({
      sessionId: a.session_id,
      participationId: a.participation_id,
      attended: Number(a.attended) === 1
    }));
    const myRsvp = rsvps.find((r) => r.userId === actor.id)?.status;
    const sessionObj = {
      id: s.id,
      campaignId: s.campaign_id,
      number: Number(s.number),
      title: s.title,
      scheduledAt: s.scheduled_at || null,
      durationMinutes: s.duration_minutes ? Number(s.duration_minutes) : 240,
      placeText: s.place_text || void 0,
      onlineUrl: s.online_url || void 0,
      status: s.status,
      inWorldDate: s.in_world_date || void 0,
      dmNotes: s.dm_notes || void 0,
      createdBy: s.created_by,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      rsvps,
      myRsvp,
      poll,
      attendance
    };
    const isDm = actor.role === "dm" || viewerRole === "owner" || viewerRole === "co_dm";
    return filterSessionForViewer(sessionObj, isDm ? "dm" : viewerRole || "player");
  }, "loadFullSession");
  if (path.match(/^\/c\/[^/]+\/sessions$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const sRes = await env.DB.prepare(
      `SELECT id FROM sessions
        WHERE campaign_id = ?
        ORDER BY CASE WHEN scheduled_at IS NULL THEN 1 ELSE 0 END, scheduled_at ASC, number ASC, created_at ASC`
    ).bind(campId).all();
    const list = [];
    for (const r of sRes.results || []) {
      const full = await loadFullSession(campId, r.id, myRole);
      if (full) list.push(full);
    }
    return json(list);
  }
  if (path.match(/^\/c\/[^/]+\/sessions$/) && method === "POST") {
    const campId = path.split("/")[2];
    if (!await requireCampaignDm(campId)) return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u0627\u06CC\u062C\u0627\u062F \u062C\u0644\u0633\u0647 \u0627\u0633\u062A.", 403);
    const body = await request.json();
    const title = String(body.title || "").trim();
    if (!title) return error("\u0639\u0646\u0648\u0627\u0646 \u062C\u0644\u0633\u0647 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.", 400);
    let sessionNum = Number(body.number);
    if (!sessionNum || isNaN(sessionNum)) {
      const maxRow = await env.DB.prepare("SELECT MAX(number) as mn FROM sessions WHERE campaign_id = ?").bind(campId).first();
      sessionNum = (maxRow?.mn || 0) + 1;
    }
    const sid = `ses-${Date.now()}-${generateRandomToken(4)}`;
    const scheduledAt = body.scheduledAt ? String(body.scheduledAt) : null;
    const duration = body.durationMinutes ? Number(body.durationMinutes) : 240;
    const placeText = body.placeText ? String(body.placeText) : null;
    const onlineUrl = body.onlineUrl ? String(body.onlineUrl) : null;
    const inWorldDate = body.inWorldDate ? String(body.inWorldDate) : null;
    const dmNotes = body.dmNotes ? String(body.dmNotes) : null;
    const status = body.status && ["planned", "confirmed", "done", "cancelled"].includes(body.status) ? body.status : scheduledAt ? "confirmed" : "planned";
    const pollOptions = body.pollOptions;
    if (pollOptions && Array.isArray(pollOptions) && pollOptions.length > 0) {
      const pVal = validatePollOptions(pollOptions);
      if (!pVal.valid) {
        return error(pVal.error || "\u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u0646\u0638\u0631\u0633\u0646\u062C\u06CC \u062A\u0627\u0631\u06CC\u062E \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.", 400);
      }
      const pollId = `poll-${Date.now()}-${generateRandomToken(4)}`;
      const formattedOpts = pollOptions.map((o, idx) => ({
        id: o.id || `opt-${idx + 1}`,
        startsAt: String(o.startsAt)
      }));
      await env.DB.prepare(
        `INSERT INTO session_polls (id, session_id, options, status)
         VALUES (?, ?, ?, 'open')`
      ).bind(pollId, sid, JSON.stringify(formattedOpts)).run();
    }
    await env.DB.prepare(
      `INSERT INTO sessions (
        id, campaign_id, number, title, scheduled_at, duration_minutes,
        place_text, online_url, status, in_world_date, dm_notes, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      sid,
      campId,
      sessionNum,
      title,
      scheduledAt,
      duration,
      placeText,
      onlineUrl,
      status,
      inWorldDate,
      dmNotes,
      actor.id,
      now,
      now
    ).run();
    await audit("session-create", sid, { campaignId: campId, number: sessionNum, title });
    try {
      const memberIds = await getCampaignMemberUserIds(campId, actor.id);
      if (pollOptions && pollOptions.length > 0) {
        await notify(
          memberIds,
          "poll_opened",
          {
            title: `\u0646\u0638\u0631\u0633\u0646\u062C\u06CC \u0632\u0645\u0627\u0646 \u062C\u0644\u0633\u0647 ${sessionNum}: ${title}`,
            body: `\u0646\u0638\u0631\u0633\u0646\u062C\u06CC \u0628\u0631\u0627\u06CC \u062A\u0639\u06CC\u06CC\u0646 \u062A\u0627\u0631\u06CC\u062E \u062C\u0644\u0633\u0647 \u0634\u0645\u0627\u0631\u0647 ${sessionNum} \u0627\u06CC\u062C\u0627\u062F \u0634\u062F. \u0644\u0637\u0641\u0627\u064B \u0628\u0647 \u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627 \u0631\u0623\u06CC \u062F\u0647\u06CC\u062F.`,
            campaignId: campId,
            targetType: "session",
            targetId: sid,
            link: `/campaign/${campId}/sessions?session=${sid}`,
            actorName: actor.display_name
          },
          campId
        );
      } else {
        await notify(
          memberIds,
          "session_scheduled",
          {
            title: `\u062C\u0644\u0633\u0647 ${sessionNum} \u0632\u0645\u0627\u0646\u200C\u0628\u0646\u062F\u06CC \u0634\u062F: ${title}`,
            body: scheduledAt ? `\u062C\u0644\u0633\u0647 \u062C\u062F\u06CC\u062F \u0628\u0631\u0627\u06CC \u062A\u0627\u0631\u06CC\u062E \u0632\u0645\u0627\u0646\u200C\u0628\u0646\u062F\u06CC \u06AF\u0631\u062F\u06CC\u062F.` : `\u062C\u0644\u0633\u0647 \u0634\u0645\u0627\u0631\u0647 ${sessionNum} \u0628\u0631\u0646\u0627\u0645\u0647\u200C\u0631\u06CC\u0632\u06CC \u0634\u062F.`,
            campaignId: campId,
            targetType: "session",
            targetId: sid,
            link: `/campaign/${campId}/sessions?session=${sid}`,
            actorName: actor.display_name
          },
          campId
        );
      }
    } catch {
    }
    const created = await loadFullSession(campId, sid, "owner");
    return json(created, 201);
  }
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+$/) && method === "GET") {
    const parts = path.split("/");
    const campId = parts[2];
    const sid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const s = await loadFullSession(campId, sid, myRole);
    if (!s) return error("\u062C\u0644\u0633\u0647 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    return json(s);
  }
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const campId = parts[2];
    const sid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const existing = await env.DB.prepare("SELECT * FROM sessions WHERE id = ? AND campaign_id = ?").bind(sid, campId).first();
    if (!existing) return error("\u062C\u0644\u0633\u0647 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const title = body.title !== void 0 ? String(body.title).trim() : existing.title;
    const number = body.number !== void 0 ? Number(body.number) : existing.number;
    const scheduledAt = body.scheduledAt !== void 0 ? body.scheduledAt ? String(body.scheduledAt) : null : existing.scheduled_at;
    const duration = body.durationMinutes !== void 0 ? Number(body.durationMinutes) : existing.duration_minutes;
    const placeText = body.placeText !== void 0 ? body.placeText ? String(body.placeText) : null : existing.place_text;
    const onlineUrl = body.onlineUrl !== void 0 ? body.onlineUrl ? String(body.onlineUrl) : null : existing.online_url;
    const status = body.status !== void 0 && ["planned", "confirmed", "done", "cancelled"].includes(body.status) ? body.status : existing.status;
    const inWorldDate = body.inWorldDate !== void 0 ? body.inWorldDate ? String(body.inWorldDate) : null : existing.in_world_date;
    const dmNotes = body.dmNotes !== void 0 ? body.dmNotes ? String(body.dmNotes) : null : existing.dm_notes;
    await env.DB.prepare(
      `UPDATE sessions SET
        title = ?, number = ?, scheduled_at = ?, duration_minutes = ?,
        place_text = ?, online_url = ?, status = ?, in_world_date = ?,
        dm_notes = ?, updated_at = ?
       WHERE id = ? AND campaign_id = ?`
    ).bind(
      title,
      number,
      scheduledAt,
      duration,
      placeText,
      onlineUrl,
      status,
      inWorldDate,
      dmNotes,
      now,
      sid,
      campId
    ).run();
    await audit("session-update", sid, { campaignId: campId });
    try {
      const memberIds = await getCampaignMemberUserIds(campId, actor.id);
      if (status === "cancelled" && existing.status !== "cancelled") {
        await notify(
          memberIds,
          "session_cancelled",
          {
            title: `\u0644\u063A\u0648 \u062C\u0644\u0633\u0647 ${number}: ${title}`,
            body: `\u062C\u0644\u0633\u0647 \u0634\u0645\u0627\u0631\u0647 ${number} \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0644\u063A\u0648 \u0634\u062F.`,
            campaignId: campId,
            targetType: "session",
            targetId: sid,
            link: `/campaign/${campId}/sessions`,
            actorName: actor.display_name
          },
          campId
        );
      } else if (scheduledAt !== existing.scheduled_at || placeText !== existing.place_text || onlineUrl !== existing.online_url) {
        await notify(
          memberIds,
          "session_changed",
          {
            title: `\u062A\u063A\u06CC\u06CC\u0631 \u0645\u0634\u062E\u0635\u0627\u062A \u062C\u0644\u0633\u0647 ${number}: ${title}`,
            body: `\u0632\u0645\u0627\u0646 \u06CC\u0627 \u0645\u06A9\u0627\u0646 \u062C\u0644\u0633\u0647 \u0634\u0645\u0627\u0631\u0647 ${number} \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F.`,
            campaignId: campId,
            targetType: "session",
            targetId: sid,
            link: `/campaign/${campId}/sessions?session=${sid}`,
            actorName: actor.display_name
          },
          campId
        );
      }
    } catch {
    }
    const updated = await loadFullSession(campId, sid, "owner");
    return json(updated);
  }
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const sid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    await env.DB.prepare("DELETE FROM session_attendance WHERE session_id = ?").bind(sid).run();
    const poll = await env.DB.prepare("SELECT id FROM session_polls WHERE session_id = ?").bind(sid).first();
    if (poll) {
      await env.DB.prepare("DELETE FROM session_poll_votes WHERE poll_id = ?").bind(poll.id).run();
      await env.DB.prepare("DELETE FROM session_polls WHERE id = ?").bind(poll.id).run();
    }
    await env.DB.prepare("DELETE FROM session_rsvps WHERE session_id = ?").bind(sid).run();
    await env.DB.prepare("DELETE FROM sessions WHERE id = ? AND campaign_id = ?").bind(sid, campId).run();
    await audit("session-delete", sid, { campaignId: campId });
    return json({ success: true });
  }
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+\/rsvp$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const sid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!canUserRsvp(myRole) && actor.role !== "dm") {
      return error("\u062A\u0645\u0627\u0634\u0627\u0686\u06CC\u0627\u0646 \u06CC\u0627 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0628\u062F\u0648\u0646 \u0639\u0636\u0648\u06CC\u062A \u0645\u062C\u0627\u0632 \u0628\u0647 \u062B\u0628\u062A \u062D\u0636\u0648\u0631 \u0646\u06CC\u0633\u062A\u0646\u062F.", 403);
    }
    const s = await env.DB.prepare("SELECT * FROM sessions WHERE id = ? AND campaign_id = ?").bind(sid, campId).first();
    if (!s) return error("\u062C\u0644\u0633\u0647 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (s.status === "cancelled") return error("\u062C\u0644\u0633\u0647 \u0644\u063A\u0648 \u0634\u062F\u0647 \u0627\u0633\u062A.", 400);
    const body = await request.json();
    const rsvpStatus = body.status;
    if (!["yes", "no", "maybe"].includes(rsvpStatus)) {
      return error("\u0648\u0636\u0639\u06CC\u062A \u062D\u0636\u0648\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A (\u0628\u0627\u06CC\u062F yes\u060C no \u06CC\u0627 maybe \u0628\u0627\u0634\u062F).", 400);
    }
    const note = body.note ? String(body.note).trim() : null;
    await env.DB.prepare(
      `INSERT INTO session_rsvps (session_id, user_id, status, note, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(session_id, user_id) DO UPDATE SET
         status = excluded.status,
         note = excluded.note,
         updated_at = excluded.updated_at`
    ).bind(sid, actor.id, rsvpStatus, note, now).run();
    await audit("session-rsvp", sid, { status: rsvpStatus, note });
    return json({
      sessionId: sid,
      userId: actor.id,
      status: rsvpStatus,
      note: note || void 0,
      updatedAt: now
    });
  }
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+\/poll\/vote$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const sid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!canUserVote(myRole) && actor.role !== "dm") {
      return error("\u062A\u0645\u0627\u0634\u0627\u0686\u06CC\u0627\u0646 \u06CC\u0627 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646 \u0628\u062F\u0648\u0646 \u0639\u0636\u0648\u06CC\u062A \u0645\u062C\u0627\u0632 \u0628\u0647 \u0631\u0623\u06CC\u200C\u062F\u0647\u06CC \u062F\u0631 \u0646\u0638\u0631\u0633\u0646\u062C\u06CC \u0646\u06CC\u0633\u062A\u0646\u062F.", 403);
    }
    const poll = await env.DB.prepare("SELECT * FROM session_polls WHERE session_id = ?").bind(sid).first();
    if (!poll) return error("\u0646\u0638\u0631\u0633\u0646\u062C\u06CC \u062A\u0627\u0631\u06CC\u062E\u06CC \u0628\u0631\u0627\u06CC \u0627\u06CC\u0646 \u062C\u0644\u0633\u0647 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 404);
    if (poll.status !== "open") return error("\u0627\u06CC\u0646 \u0646\u0638\u0631\u0633\u0646\u062C\u06CC \u0628\u0633\u062A\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A.", 400);
    const body = await request.json();
    const optionId = String(body.optionId || "");
    const choice = body.choice;
    if (!["yes", "maybe", "no"].includes(choice)) {
      return error("\u06AF\u0632\u06CC\u0646\u0647 \u0631\u0623\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.", 400);
    }
    const options = parseBlob(poll.options, []);
    if (!options.some((o) => o.id === optionId)) {
      return error("\u06AF\u0632\u06CC\u0646\u0647 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u062F\u0631 \u0646\u0638\u0631\u0633\u0646\u062C\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 400);
    }
    await env.DB.prepare(
      `INSERT INTO session_poll_votes (poll_id, option_id, user_id, choice)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(poll_id, option_id, user_id) DO UPDATE SET
         choice = excluded.choice`
    ).bind(poll.id, optionId, actor.id, choice).run();
    await audit("session-poll-vote", poll.id, { optionId, choice });
    const full = await loadFullSession(campId, sid, myRole);
    return json(full?.poll || { success: true });
  }
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+\/poll\/confirm$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const sid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u0646\u0647\u0627\u06CC\u06CC\u200C\u0633\u0627\u0632\u06CC \u062A\u0627\u0631\u06CC\u062E \u062C\u0644\u0633\u0647 \u0627\u0633\u062A.", 403);
    const poll = await env.DB.prepare("SELECT * FROM session_polls WHERE session_id = ?").bind(sid).first();
    if (!poll) return error("\u0646\u0638\u0631\u0633\u0646\u062C\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const optionId = String(body.optionId || "");
    const options = parseBlob(poll.options, []);
    const chosen = options.find((o) => o.id === optionId);
    if (!chosen) return error("\u06AF\u0632\u06CC\u0646\u0647 \u062A\u0627\u0631\u06CC\u062E \u0627\u0646\u062A\u062E\u0627\u0628\u200C\u0634\u062F\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    await env.DB.prepare(
      `UPDATE sessions SET
        scheduled_at = ?,
        status = 'confirmed',
        updated_at = ?
       WHERE id = ? AND campaign_id = ?`
    ).bind(chosen.startsAt, now, sid, campId).run();
    await env.DB.prepare("UPDATE session_polls SET status = 'closed' WHERE id = ?").bind(poll.id).run();
    await audit("session-poll-confirm", sid, { optionId, startsAt: chosen.startsAt });
    try {
      const memberIds = await getCampaignMemberUserIds(campId, actor.id);
      await notify(
        memberIds,
        "poll_closed",
        {
          title: "\u062A\u0627\u0631\u06CC\u062E \u0646\u0647\u0627\u06CC\u06CC \u062C\u0644\u0633\u0647 \u0645\u0634\u062E\u0635 \u0634\u062F",
          body: `\u0646\u0638\u0631\u0633\u0646\u062C\u06CC \u062A\u0627\u0631\u06CC\u062E \u0628\u0633\u062A\u0647 \u0634\u062F \u0648 \u062C\u0644\u0633\u0647 \u0628\u0631 \u0627\u0633\u0627\u0633 \u0622\u0631\u0627\u06CC \u06AF\u0631\u0648\u0647 \u0628\u0631\u0627\u06CC \u062A\u0627\u0631\u06CC\u062E \u0645\u0642\u0631\u0631 \u0646\u0647\u0627\u06CC\u06CC \u06AF\u0631\u062F\u06CC\u062F.`,
          campaignId: campId,
          targetType: "session",
          targetId: sid,
          link: `/campaign/${campId}/sessions?session=${sid}`,
          actorName: actor.display_name
        },
        campId
      );
    } catch {
    }
    const updated = await loadFullSession(campId, sid, "owner");
    return json(updated);
  }
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+\/attendance$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const sid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u062B\u0628\u062A \u062D\u0636\u0648\u0631 \u0648 \u063A\u06CC\u0627\u0628 \u0627\u0633\u062A.", 403);
    const s = await env.DB.prepare("SELECT * FROM sessions WHERE id = ? AND campaign_id = ?").bind(sid, campId).first();
    if (!s) return error("\u062C\u0644\u0633\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const attendanceList = body.attendance || [];
    await env.DB.prepare("UPDATE sessions SET status = 'done', updated_at = ? WHERE id = ? AND campaign_id = ?").bind(now, sid, campId).run();
    for (const item of attendanceList) {
      if (!item.participationId) continue;
      const attendedInt = item.attended ? 1 : 0;
      await env.DB.prepare(
        `INSERT INTO session_attendance (session_id, participation_id, attended)
         VALUES (?, ?, ?)
         ON CONFLICT(session_id, participation_id) DO UPDATE SET
           attended = excluded.attended`
      ).bind(sid, item.participationId, attendedInt).run();
      if (item.attended) {
        await env.DB.prepare(
          "UPDATE character_participations SET sessions_attended = COALESCE(sessions_attended, 0) + 1 WHERE id = ?"
        ).bind(item.participationId).run();
        const part = await env.DB.prepare("SELECT character_id FROM character_participations WHERE id = ?").bind(item.participationId).first();
        if (part?.character_id) {
          const hist = buildAttendanceHistoryEvent(Number(s.number), s.title, sid, campId);
          await env.DB.prepare(
            `INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(
            hist.id,
            part.character_id,
            campId,
            hist.eventType,
            JSON.stringify(hist.payload),
            now
          ).run();
        }
      }
    }
    await audit("session-attendance", sid, { campaignId: campId, count: attendanceList.length });
    const updated = await loadFullSession(campId, sid, "owner");
    return json({ success: true, session: updated });
  }
  const mapRecapRow = /* @__PURE__ */ __name((r) => ({
    id: r.id,
    sessionId: r.session_id,
    campaignId: r.campaign_id,
    authorId: r.author_id,
    authorName: r.author_name || "\u06A9\u0627\u0631\u0628\u0631",
    sessionNumber: r.session_number !== null ? Number(r.session_number) : void 0,
    sessionTitle: r.session_title || void 0,
    title: r.title,
    body: r.body,
    visibility: r.visibility,
    status: r.status,
    linkedNpcIds: parseBlob(r.linked_npcs, []),
    linkedLocationIds: parseBlob(r.linked_locations, []),
    linkedQuestIds: parseBlob(r.linked_quests, []),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at)
  }), "mapRecapRow");
  if (path.match(/^\/c\/[^/]+\/recaps$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    const urlObj = new URL(request.url);
    const sessionIdParam = urlObj.searchParams.get("sessionId");
    const searchParam = urlObj.searchParams.get("search");
    let query = `
      SELECT r.*, u.display_name AS author_name, s.number AS session_number, s.title AS session_title
      FROM session_recaps r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN sessions s ON r.session_id = s.id
      WHERE r.campaign_id = ?
    `;
    const params = [campId];
    if (!isDm) {
      query += ` AND ( (r.status = 'published' AND r.visibility = 'party') OR r.author_id = ? )`;
      params.push(actor.id);
    }
    if (sessionIdParam) {
      query += ` AND r.session_id = ?`;
      params.push(sessionIdParam);
    }
    if (searchParam && searchParam.trim()) {
      query += ` AND (r.title LIKE ? OR r.body LIKE ?)`;
      params.push(`%${searchParam.trim()}%`, `%${searchParam.trim()}%`);
    }
    query += ` ORDER BY r.created_at DESC`;
    const res = await env.DB.prepare(query).bind(...params).all();
    const list = (res.results || []).map(mapRecapRow);
    return json(list);
  }
  if (path.match(/^\/c\/[^/]+\/recaps\/latest$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    let query = `
      SELECT r.*, u.display_name AS author_name, s.number AS session_number, s.title AS session_title
      FROM session_recaps r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN sessions s ON r.session_id = s.id
      WHERE r.campaign_id = ?
    `;
    const params = [campId];
    if (!isDm) {
      query += ` AND r.status = 'published' AND r.visibility = 'party'`;
    }
    query += ` ORDER BY r.created_at DESC LIMIT 1`;
    const row = await env.DB.prepare(query).bind(...params).first();
    return json(row ? mapRecapRow(row) : null);
  }
  if (path.match(/^\/c\/[^/]+\/recaps$/) && method === "POST") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const campRow = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ?").bind(campId).first();
    const campSettings = parseBlob(campRow?.settings, {});
    const isDmGlobal = actor.role === "dm";
    const effectiveRole = isDmGlobal ? "owner" : myRole || "player";
    if (!canUserCreateRecap(effectiveRole, campSettings.allowPlayerRecaps)) {
      return error("\u0634\u0645\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0644\u0627\u0632\u0645 \u0628\u0631\u0627\u06CC \u0646\u06AF\u0627\u0631\u0634 \u062E\u0644\u0627\u0635\u0647 \u062C\u0644\u0633\u0647 \u0631\u0627 \u0646\u062F\u0627\u0631\u06CC\u062F.", 403);
    }
    const body = await request.json();
    const val = validateRecapPayload({ title: body.title, body: body.body });
    if (!val.valid) return error(val.error || "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.", 400);
    const recapId = `recap-${Date.now()}-${generateRandomToken(4)}`;
    const sessionId = body.sessionId ? String(body.sessionId) : "";
    const title = String(body.title).trim();
    const recapBody = String(body.body).trim();
    const visibility = body.visibility === "dm_only" ? "dm_only" : "party";
    const status = body.status === "draft" ? "draft" : "published";
    const linkedNpcs = JSON.stringify(body.linkedNpcIds || []);
    const linkedLocs = JSON.stringify(body.linkedLocationIds || []);
    const linkedQuests = JSON.stringify(body.linkedQuestIds || []);
    await env.DB.prepare(
      `INSERT INTO session_recaps (
        id, session_id, campaign_id, author_id, title, body, visibility,
        status, linked_npcs, linked_locations, linked_quests, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      recapId,
      sessionId,
      campId,
      actor.id,
      title,
      recapBody,
      visibility,
      status,
      linkedNpcs,
      linkedLocs,
      linkedQuests,
      now,
      now
    ).run();
    await audit("recap-create", recapId, { campaignId: campId, sessionId, title });
    const row = await env.DB.prepare(`
      SELECT r.*, u.display_name AS author_name, s.number AS session_number, s.title AS session_title
      FROM session_recaps r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN sessions s ON r.session_id = s.id
      WHERE r.id = ?
    `).bind(recapId).first();
    return json(mapRecapRow(row), 201);
  }
  if (path.match(/^\/c\/[^/]+\/recaps\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const campId = parts[2];
    const recapId = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const existing = await env.DB.prepare("SELECT * FROM session_recaps WHERE id = ? AND campaign_id = ?").bind(recapId, campId).first();
    if (!existing) return error("\u062E\u0644\u0627\u0635\u0647 \u062C\u0644\u0633\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const isDmGlobal = actor.role === "dm";
    const effectiveRole = isDmGlobal ? "owner" : myRole || "player";
    if (!canUserEditRecap({ authorId: existing.author_id }, effectiveRole, actor.id)) {
      return error("\u0634\u0645\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0644\u0627\u0632\u0645 \u0628\u0631\u0627\u06CC \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0627\u06CC\u0646 \u062E\u0644\u0627\u0635\u0647 \u0631\u0627 \u0646\u062F\u0627\u0631\u06CC\u062F.", 403);
    }
    const body = await request.json();
    const title = body.title !== void 0 ? String(body.title).trim() : existing.title;
    const recapBody = body.body !== void 0 ? String(body.body).trim() : existing.body;
    const visibility = body.visibility !== void 0 && ["party", "dm_only"].includes(body.visibility) ? body.visibility : existing.visibility;
    const status = body.status !== void 0 && ["draft", "published"].includes(body.status) ? body.status : existing.status;
    const linkedNpcs = body.linkedNpcIds !== void 0 ? JSON.stringify(body.linkedNpcIds) : existing.linked_npcs;
    const linkedLocs = body.linkedLocationIds !== void 0 ? JSON.stringify(body.linkedLocationIds) : existing.linked_locations;
    const linkedQuests = body.linkedQuestIds !== void 0 ? JSON.stringify(body.linkedQuestIds) : existing.linked_quests;
    await env.DB.prepare(
      `UPDATE session_recaps SET
        title = ?, body = ?, visibility = ?, status = ?,
        linked_npcs = ?, linked_locations = ?, linked_quests = ?, updated_at = ?
       WHERE id = ? AND campaign_id = ?`
    ).bind(
      title,
      recapBody,
      visibility,
      status,
      linkedNpcs,
      linkedLocs,
      linkedQuests,
      now,
      recapId,
      campId
    ).run();
    await audit("recap-update", recapId, { campaignId: campId });
    const row = await env.DB.prepare(`
      SELECT r.*, u.display_name AS author_name, s.number AS session_number, s.title AS session_title
      FROM session_recaps r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN sessions s ON r.session_id = s.id
      WHERE r.id = ?
    `).bind(recapId).first();
    return json(mapRecapRow(row));
  }
  if (path.match(/^\/c\/[^/]+\/recaps\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const recapId = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const existing = await env.DB.prepare("SELECT author_id FROM session_recaps WHERE id = ? AND campaign_id = ?").bind(recapId, campId).first();
    if (!existing) return error("\u062E\u0644\u0627\u0635\u0647 \u062C\u0644\u0633\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const isDmGlobal = actor.role === "dm";
    const effectiveRole = isDmGlobal ? "owner" : myRole || "player";
    if (!canUserEditRecap({ authorId: existing.author_id }, effectiveRole, actor.id)) {
      return error("\u0634\u0645\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0644\u0627\u0632\u0645 \u0628\u0631\u0627\u06CC \u062D\u0630\u0641 \u0627\u06CC\u0646 \u062E\u0644\u0627\u0635\u0647 \u0631\u0627 \u0646\u062F\u0627\u0631\u06CC\u062F.", 403);
    }
    await env.DB.prepare("DELETE FROM session_recaps WHERE id = ? AND campaign_id = ?").bind(recapId, campId).run();
    await audit("recap-delete", recapId, { campaignId: campId });
    return json({ success: true });
  }
  if (path.match(/^\/c\/[^/]+\/highlights$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    const urlObj = new URL(request.url);
    const sessionIdParam = urlObj.searchParams.get("sessionId");
    let query = `
      SELECT h.*, cp.character_name, u.display_name AS player_name
      FROM session_highlights h
      LEFT JOIN character_participations cp ON h.participation_id = cp.id
      LEFT JOIN characters c ON cp.character_id = c.id
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE h.campaign_id = ?
    `;
    const params = [campId];
    if (!isDm) {
      query += ` AND h.visible_to_player = 1`;
    }
    if (sessionIdParam) {
      query += ` AND h.session_id = ?`;
      params.push(sessionIdParam);
    }
    query += ` ORDER BY h.created_at ASC`;
    const res = await env.DB.prepare(query).bind(...params).all();
    const list = (res.results || []).map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      campaignId: r.campaign_id,
      participationId: r.participation_id,
      characterId: r.character_id,
      characterName: r.character_name,
      playerName: r.player_name,
      text: r.text,
      visibleToPlayer: Boolean(r.visible_to_player),
      createdAt: Number(r.created_at)
    }));
    return json(list);
  }
  if (path.match(/^\/c\/[^/]+\/highlights$/) && method === "POST") {
    const campId = path.split("/")[2];
    if (!await requireCampaignDm(campId)) return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u062B\u0628\u062A \u0631\u0648\u06CC\u062F\u0627\u062F \u0628\u0631\u062C\u0633\u062A\u0647 \u0627\u0633\u062A.", 403);
    const body = await request.json();
    const text = String(body.text || "").trim();
    if (!text) return error("\u0645\u062A\u0646 \u0631\u0648\u06CC\u062F\u0627\u062F \u0628\u0631\u062C\u0633\u062A\u0647 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062E\u0627\u0644\u06CC \u0628\u0627\u0634\u062F.", 400);
    const hlId = `hl-${Date.now()}-${generateRandomToken(4)}`;
    const sessionId = body.sessionId ? String(body.sessionId) : "";
    const participationId = body.participationId ? String(body.participationId) : null;
    const characterId = body.characterId ? String(body.characterId) : null;
    const visibleToPlayer = body.visibleToPlayer === false || body.visibleToPlayer === 0 ? 0 : 1;
    await env.DB.prepare(
      `INSERT INTO session_highlights (
        id, session_id, campaign_id, participation_id, character_id, text, visible_to_player, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(hlId, sessionId, campId, participationId, characterId, text, visibleToPlayer, now).run();
    if (characterId) {
      const sess = await env.DB.prepare("SELECT number FROM sessions WHERE id = ?").bind(sessionId).first();
      const hist = buildHighlightHistoryEvent({
        id: hlId,
        sessionId,
        campaignId: campId,
        characterId,
        text,
        visibleToPlayer,
        createdAt: now
      }, sess?.number ? Number(sess.number) : void 0);
      await env.DB.prepare(
        `INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        `hist-hl-${Date.now()}-${generateRandomToken(3)}`,
        characterId,
        campId,
        hist.eventType,
        JSON.stringify(hist.payload),
        now
      ).run();
    }
    await audit("highlight-create", hlId, { campaignId: campId, sessionId, text });
    return json({
      id: hlId,
      sessionId,
      campaignId: campId,
      participationId,
      characterId,
      text,
      visibleToPlayer: Boolean(visibleToPlayer),
      createdAt: now
    }, 201);
  }
  if (path.match(/^\/c\/[^/]+\/highlights\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const highlightId = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    await env.DB.prepare("DELETE FROM session_highlights WHERE id = ? AND campaign_id = ?").bind(highlightId, campId).run();
    await audit("highlight-delete", highlightId, { campaignId: campId });
    return json({ success: true });
  }
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+\/close$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const sid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const s = await env.DB.prepare("SELECT * FROM sessions WHERE id = ? AND campaign_id = ?").bind(sid, campId).first();
    if (!s) return error("\u062C\u0644\u0633\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    await env.DB.prepare("UPDATE sessions SET status = 'done', updated_at = ? WHERE id = ? AND campaign_id = ?").bind(now, sid, campId).run();
    let createdRecap = null;
    if (body.recap && body.recap.title && body.recap.body) {
      const recapId = `recap-${Date.now()}-${generateRandomToken(4)}`;
      const title = String(body.recap.title).trim();
      const rBody = String(body.recap.body).trim();
      const visibility = body.recap.visibility === "dm_only" ? "dm_only" : "party";
      const status = body.recap.status === "draft" ? "draft" : "published";
      const linkedNpcs = JSON.stringify(body.recap.linkedNpcIds || []);
      const linkedLocs = JSON.stringify(body.recap.linkedLocationIds || []);
      const linkedQuests = JSON.stringify(body.recap.linkedQuestIds || []);
      await env.DB.prepare(
        `INSERT INTO session_recaps (
          id, session_id, campaign_id, author_id, title, body, visibility,
          status, linked_npcs, linked_locations, linked_quests, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(recapId, sid, campId, actor.id, title, rBody, visibility, status, linkedNpcs, linkedLocs, linkedQuests, now, now).run();
      const rRow = await env.DB.prepare(`
        SELECT r.*, u.display_name AS author_name, s.number AS session_number, s.title AS session_title
        FROM session_recaps r
        LEFT JOIN users u ON r.author_id = u.id
        LEFT JOIN sessions s ON r.session_id = s.id
        WHERE r.id = ?
      `).bind(recapId).first();
      createdRecap = mapRecapRow(rRow);
    }
    if (body.xpAward && body.xpAward.amount > 0) {
      const amount = Number(body.xpAward.amount);
      if (body.xpAward.isPartyWide || !body.xpAward.participationId) {
        await env.DB.prepare(
          "UPDATE character_participations SET xp = COALESCE(xp, 0) + ?, updated_at = ? WHERE campaign_id = ? AND status = 'active'"
        ).bind(amount, now, campId).run();
      } else {
        await env.DB.prepare(
          "UPDATE character_participations SET xp = COALESCE(xp, 0) + ?, updated_at = ? WHERE id = ? AND campaign_id = ?"
        ).bind(amount, now, body.xpAward.participationId, campId).run();
      }
    }
    if (body.milestoneLevelUps && Array.isArray(body.milestoneLevelUps) && body.milestoneLevelUps.length > 0) {
      for (const pId of body.milestoneLevelUps) {
        await env.DB.prepare(
          "UPDATE character_participations SET level_up_available = 1, updated_at = ? WHERE id = ? AND campaign_id = ?"
        ).bind(now, pId, campId).run();
      }
    }
    const createdHighlights = [];
    if (body.highlights && Array.isArray(body.highlights) && body.highlights.length > 0) {
      for (const hl of body.highlights) {
        if (!hl.text || !hl.text.trim()) continue;
        const hlId = `hl-${Date.now()}-${generateRandomToken(4)}`;
        const pId = hl.participationId ? String(hl.participationId) : null;
        const cId = hl.characterId ? String(hl.characterId) : null;
        const vis = hl.visibleToPlayer === false ? 0 : 1;
        await env.DB.prepare(
          `INSERT INTO session_highlights (
            id, session_id, campaign_id, participation_id, character_id, text, visible_to_player, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(hlId, sid, campId, pId, cId, hl.text.trim(), vis, now).run();
        if (cId) {
          const hist = buildHighlightHistoryEvent({
            id: hlId,
            sessionId: sid,
            campaignId: campId,
            characterId: cId,
            text: hl.text.trim(),
            visibleToPlayer: vis,
            createdAt: now
          }, s.number ? Number(s.number) : void 0);
          await env.DB.prepare(
            `INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(
            `hist-hl-${Date.now()}-${generateRandomToken(3)}`,
            cId,
            campId,
            hist.eventType,
            JSON.stringify(hist.payload),
            now
          ).run();
        }
        createdHighlights.push({
          id: hlId,
          sessionId: sid,
          campaignId: campId,
          participationId: pId,
          characterId: cId,
          text: hl.text.trim(),
          visibleToPlayer: Boolean(vis),
          createdAt: now
        });
      }
    }
    await audit("session-close", sid, { campaignId: campId });
    const updatedSession = await loadFullSession(campId, sid, "owner");
    return json({
      session: updatedSession,
      recap: createdRecap,
      highlights: createdHighlights
    });
  }
  const populateHandoutExtras = /* @__PURE__ */ __name(async (handoutRows, isDm, actorPartId) => {
    if (!handoutRows || handoutRows.length === 0) return [];
    const handoutIds = handoutRows.map((h) => h.id);
    const recipientsMap = {};
    for (const hId of handoutIds) {
      recipientsMap[hId] = [];
    }
    try {
      const qPlaceholders = handoutIds.map(() => "?").join(",");
      const recips = await env.DB.prepare(
        `SELECT handout_id, participation_id FROM handout_recipients WHERE handout_id IN (${qPlaceholders})`
      ).bind(...handoutIds).all();
      for (const r of recips.results || []) {
        if (!recipientsMap[r.handout_id]) recipientsMap[r.handout_id] = [];
        recipientsMap[r.handout_id].push(r.participation_id);
      }
    } catch {
    }
    const pinsMap = {};
    for (const hId of handoutIds) {
      pinsMap[hId] = [];
    }
    try {
      const qPlaceholders = handoutIds.map(() => "?").join(",");
      const pinRows = await env.DB.prepare(
        `SELECT * FROM map_pins WHERE handout_id IN (${qPlaceholders})`
      ).bind(...handoutIds).all();
      for (const p of pinRows.results || []) {
        if (!pinsMap[p.handout_id]) pinsMap[p.handout_id] = [];
        pinsMap[p.handout_id].push({
          id: p.id,
          handoutId: p.handout_id,
          x: Number(p.x),
          y: Number(p.y),
          label: p.label,
          note: p.note,
          revealed: Number(p.revealed)
        });
      }
    } catch {
    }
    const items = handoutRows.map((h) => ({
      id: h.id,
      campaignId: h.campaign_id,
      title: h.title,
      kind: h.kind,
      body: h.body || "",
      mediaId: h.media_id || null,
      mediaUrl: h.media_id ? `/api/media/${h.media_id}` : h.media_url || null,
      visibility: h.visibility || "hidden",
      revealedAt: h.revealed_at ? Number(h.revealed_at) : null,
      tags: parseBlob(h.tags, []),
      sortIndex: Number(h.sort_index || 0),
      createdBy: h.created_by,
      createdByName: h.created_by_name || "\u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631",
      createdAt: Number(h.created_at),
      updatedAt: Number(h.updated_at),
      recipients: recipientsMap[h.id] || [],
      pins: pinsMap[h.id] || []
    }));
    return filterHandoutsForPlayer(items, actorPartId, isDm);
  }, "populateHandoutExtras");
  if (path.match(/^\/c\/[^/]+\/handouts$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    let actorPartId = null;
    if (!isDm) {
      const partRow = await env.DB.prepare(`
        SELECT cp.id FROM character_participations cp
        JOIN characters c ON cp.character_id = c.id
        WHERE cp.campaign_id = ? AND c.owner_id = ? AND cp.status = 'active'
        LIMIT 1
      `).bind(campId, actor.id).first();
      actorPartId = partRow?.id || null;
    }
    const rows = await env.DB.prepare(`
      SELECT h.*, u.display_name AS created_by_name
      FROM handouts h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.campaign_id = ?
      ORDER BY h.sort_index ASC, h.created_at DESC
    `).bind(campId).all();
    const handouts = await populateHandoutExtras(rows.results || [], isDm, actorPartId);
    return json(handouts);
  }
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+$/) && method === "GET") {
    const parts = path.split("/");
    const campId = parts[2];
    const hid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    let actorPartId = null;
    if (!isDm) {
      const partRow = await env.DB.prepare(`
        SELECT cp.id FROM character_participations cp
        JOIN characters c ON cp.character_id = c.id
        WHERE cp.campaign_id = ? AND c.owner_id = ? AND cp.status = 'active'
        LIMIT 1
      `).bind(campId, actor.id).first();
      actorPartId = partRow?.id || null;
    }
    const row = await env.DB.prepare(`
      SELECT h.*, u.display_name AS created_by_name
      FROM handouts h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.id = ? AND h.campaign_id = ?
    `).bind(hid, campId).first();
    if (!row) return error("\u0633\u0646\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const list = await populateHandoutExtras([row], isDm, actorPartId);
    if (list.length === 0) return error("\u0633\u0646\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    return json(list[0]);
  }
  if (path.match(/^\/c\/[^/]+\/handouts$/) && method === "POST") {
    const campId = path.split("/")[2];
    if (!await requireCampaignDm(campId)) return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u0627\u06CC\u062C\u0627\u062F \u0627\u0633\u0646\u0627\u062F \u0627\u0633\u062A.", 403);
    const body = await request.json();
    const val = validateHandoutPayload(body);
    if (!val.valid) return error(val.error || "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.", 400);
    const hId = `handout-${Date.now()}-${generateRandomToken(4)}`;
    const title = String(body.title).trim();
    const kind = body.kind || "text";
    const hBody = body.body ? String(body.body).trim() : null;
    const mediaId = body.mediaId ? String(body.mediaId) : null;
    const visibility = body.visibility || "hidden";
    const revealedAt = visibility === "revealed" || visibility === "selected" ? now : null;
    const tags = JSON.stringify(Array.isArray(body.tags) ? body.tags : []);
    const sortIndex = Number(body.sortIndex || 0);
    await env.DB.prepare(
      `INSERT INTO handouts (
        id, campaign_id, title, kind, body, media_id, visibility,
        revealed_at, tags, sort_index, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      hId,
      campId,
      title,
      kind,
      hBody,
      mediaId,
      visibility,
      revealedAt,
      tags,
      sortIndex,
      actor.id,
      now,
      now
    ).run();
    if (visibility === "selected" && Array.isArray(body.recipients)) {
      for (const pId of body.recipients) {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO handout_recipients (handout_id, participation_id) VALUES (?, ?)"
        ).bind(hId, pId).run();
      }
    }
    if (kind === "map" && Array.isArray(body.pins)) {
      for (const p of body.pins) {
        const pinId = `pin-${Date.now()}-${generateRandomToken(3)}`;
        const coords = clampCoordinates(Number(p.x || 0), Number(p.y || 0));
        await env.DB.prepare(
          "INSERT INTO map_pins (id, handout_id, x, y, label, note, revealed) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(pinId, hId, coords.x, coords.y, String(p.label || "\u0646\u0634\u0627\u0646\u06AF\u0631"), p.note ? String(p.note) : null, p.revealed === false ? 0 : 1).run();
      }
    }
    if (visibility !== "hidden") {
      await audit("handout-reveal", hId, { campaignId: campId, title, visibility });
    } else {
      await audit("handout-create", hId, { campaignId: campId, title, kind });
    }
    const createdRow = await env.DB.prepare(`
      SELECT h.*, u.display_name AS created_by_name
      FROM handouts h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.id = ?
    `).bind(hId).first();
    const list = await populateHandoutExtras([createdRow], true);
    return json(list[0], 201);
  }
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const campId = parts[2];
    const hid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const existing = await env.DB.prepare("SELECT * FROM handouts WHERE id = ? AND campaign_id = ?").bind(hid, campId).first();
    if (!existing) return error("\u0633\u0646\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const title = body.title !== void 0 ? String(body.title).trim() : existing.title;
    const hBody = body.body !== void 0 ? String(body.body).trim() : existing.body;
    const mediaId = body.mediaId !== void 0 ? body.mediaId ? String(body.mediaId) : null : existing.media_id;
    const visibility = body.visibility !== void 0 ? body.visibility : existing.visibility;
    const sortIndex = body.sortIndex !== void 0 ? Number(body.sortIndex) : existing.sort_index;
    const tags = body.tags !== void 0 ? JSON.stringify(body.tags) : existing.tags;
    let revealedAt = existing.revealed_at;
    if (visibility !== existing.visibility && (visibility === "revealed" || visibility === "selected")) {
      revealedAt = now;
      await audit("handout-reveal", hid, { campaignId: campId, title, visibility });
    }
    await env.DB.prepare(`
      UPDATE handouts SET
        title = ?, body = ?, media_id = ?, visibility = ?,
        revealed_at = ?, tags = ?, sort_index = ?, updated_at = ?
      WHERE id = ? AND campaign_id = ?
    `).bind(
      title,
      hBody,
      mediaId,
      visibility,
      revealedAt,
      tags,
      sortIndex,
      now,
      hid,
      campId
    ).run();
    if (body.recipients !== void 0 && Array.isArray(body.recipients)) {
      await env.DB.prepare("DELETE FROM handout_recipients WHERE handout_id = ?").bind(hid).run();
      for (const pId of body.recipients) {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO handout_recipients (handout_id, participation_id) VALUES (?, ?)"
        ).bind(hid, pId).run();
      }
    }
    if (body.pins !== void 0 && Array.isArray(body.pins)) {
      await env.DB.prepare("DELETE FROM map_pins WHERE handout_id = ?").bind(hid).run();
      for (const p of body.pins) {
        const pinId = p.id || `pin-${Date.now()}-${generateRandomToken(3)}`;
        const coords = clampCoordinates(Number(p.x || 0), Number(p.y || 0));
        await env.DB.prepare(
          "INSERT INTO map_pins (id, handout_id, x, y, label, note, revealed) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(pinId, hid, coords.x, coords.y, String(p.label || "\u0646\u0634\u0627\u0646\u06AF\u0631"), p.note ? String(p.note) : null, p.revealed === false ? 0 : 1).run();
      }
    }
    await audit("handout-update", hid, { campaignId: campId, title });
    const updatedRow = await env.DB.prepare(`
      SELECT h.*, u.display_name AS created_by_name
      FROM handouts h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.id = ?
    `).bind(hid).first();
    const list = await populateHandoutExtras([updatedRow], true);
    return json(list[0]);
  }
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const hid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    await env.DB.prepare("DELETE FROM handouts WHERE id = ? AND campaign_id = ?").bind(hid, campId).run();
    await audit("handout-delete", hid, { campaignId: campId });
    return json({ success: true });
  }
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+\/reveal$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const hid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const existing = await env.DB.prepare("SELECT * FROM handouts WHERE id = ? AND campaign_id = ?").bind(hid, campId).first();
    if (!existing) return error("\u0633\u0646\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const mode = body.visibility;
    if (!["revealed", "hidden", "selected"].includes(mode)) {
      return error("\u0648\u0636\u0639\u06CC\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.", 400);
    }
    const revealedAt = mode !== "hidden" ? now : existing.revealed_at;
    await env.DB.prepare(
      "UPDATE handouts SET visibility = ?, revealed_at = ?, updated_at = ? WHERE id = ? AND campaign_id = ?"
    ).bind(mode, revealedAt, now, hid, campId).run();
    if (mode === "selected" && Array.isArray(body.recipients)) {
      await env.DB.prepare("DELETE FROM handout_recipients WHERE handout_id = ?").bind(hid).run();
      for (const pId of body.recipients) {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO handout_recipients (handout_id, participation_id) VALUES (?, ?)"
        ).bind(hid, pId).run();
      }
    }
    await audit("handout-reveal", hid, { campaignId: campId, title: existing.title, visibility: mode });
    try {
      if (mode === "revealed") {
        const memberIds = await getCampaignMemberUserIds(campId, actor.id);
        await notify(
          memberIds,
          "handout_revealed",
          {
            title: `\u0633\u0646\u062F \u062C\u062F\u06CC\u062F \u0622\u0634\u06A9\u0627\u0631 \u0634\u062F: ${existing.title}`,
            body: `\u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0633\u0646\u062F \u06CC\u0627 \u0646\u0642\u0634\u0647 \xAB${existing.title}\xBB \u0631\u0627 \u0628\u0631\u0627\u06CC \u06AF\u0631\u0648\u0647 \u0622\u0634\u06A9\u0627\u0631 \u06A9\u0631\u062F.`,
            campaignId: campId,
            targetType: "handout",
            targetId: hid,
            link: `/campaign/${campId}/handouts?handout=${hid}`,
            actorName: actor.display_name
          },
          campId
        );
      } else if (mode === "selected" && Array.isArray(body.recipients) && body.recipients.length > 0) {
        const placeholders = body.recipients.map(() => "?").join(",");
        const partUsers = await env.DB.prepare(
          `SELECT user_id FROM character_participations WHERE id IN (${placeholders})`
        ).bind(...body.recipients).all();
        const userIds = (partUsers.results || []).map((r) => String(r.user_id)).filter((id) => id !== actor.id);
        if (userIds.length > 0) {
          await notify(
            userIds,
            "handout_revealed",
            {
              title: `\u0633\u0646\u062F \u0627\u062E\u062A\u0635\u0627\u0635\u06CC \u0622\u0634\u06A9\u0627\u0631 \u0634\u062F: ${existing.title}`,
              body: `\u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0633\u0646\u062F \u06CC\u0627 \u0646\u0642\u0634\u0647 \xAB${existing.title}\xBB \u0631\u0627 \u062F\u0631 \u0627\u062E\u062A\u06CC\u0627\u0631 \u0634\u0645\u0627 \u0642\u0631\u0627\u0631 \u062F\u0627\u062F.`,
              campaignId: campId,
              targetType: "handout",
              targetId: hid,
              link: `/campaign/${campId}/handouts?handout=${hid}`,
              actorName: actor.display_name
            },
            campId
          );
        }
      }
    } catch {
    }
    const updatedRow = await env.DB.prepare(`
      SELECT h.*, u.display_name AS created_by_name
      FROM handouts h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.id = ?
    `).bind(hid).first();
    const list = await populateHandoutExtras([updatedRow], true);
    return json(list[0]);
  }
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+\/pins$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const hid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    const pinId = `pin-${Date.now()}-${generateRandomToken(3)}`;
    const coords = clampCoordinates(Number(body.x || 0), Number(body.y || 0));
    const label = String(body.label || "\u0646\u0634\u0627\u0646\u06AF\u0631 \u062C\u062F\u06CC\u062F").trim();
    const note = body.note ? String(body.note).trim() : null;
    const revealed = body.revealed === false || body.revealed === 0 ? 0 : 1;
    await env.DB.prepare(
      "INSERT INTO map_pins (id, handout_id, x, y, label, note, revealed) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(pinId, hid, coords.x, coords.y, label, note, revealed).run();
    return json({
      id: pinId,
      handoutId: hid,
      x: coords.x,
      y: coords.y,
      label,
      note,
      revealed
    }, 201);
  }
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+\/pins\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const campId = parts[2];
    const hid = parts[4];
    const pid = parts[6];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const existing = await env.DB.prepare("SELECT * FROM map_pins WHERE id = ? AND handout_id = ?").bind(pid, hid).first();
    if (!existing) return error("\u0646\u0634\u0627\u0646\u06AF\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const x = body.x !== void 0 ? clampCoordinates(Number(body.x), Number(existing.y)).x : existing.x;
    const y = body.y !== void 0 ? clampCoordinates(Number(existing.x), Number(body.y)).y : existing.y;
    const label = body.label !== void 0 ? String(body.label).trim() : existing.label;
    const note = body.note !== void 0 ? String(body.note).trim() : existing.note;
    const revealed = body.revealed !== void 0 ? body.revealed === false || body.revealed === 0 ? 0 : 1 : existing.revealed;
    await env.DB.prepare(
      "UPDATE map_pins SET x = ?, y = ?, label = ?, note = ?, revealed = ? WHERE id = ? AND handout_id = ?"
    ).bind(x, y, label, note, revealed, pid, hid).run();
    return json({
      id: pid,
      handoutId: hid,
      x,
      y,
      label,
      note,
      revealed
    });
  }
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+\/pins\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const hid = parts[4];
    const pid = parts[6];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    await env.DB.prepare("DELETE FROM map_pins WHERE id = ? AND handout_id = ?").bind(pid, hid).run();
    return json({ success: true });
  }
  const populateQuestExtras = /* @__PURE__ */ __name(async (questRows, isDm, actorPartId) => {
    if (!questRows || questRows.length === 0) return [];
    const questIds = questRows.map((q) => q.id);
    const participantsMap = {};
    try {
      const qpRows = await env.DB.prepare(
        `SELECT quest_id, participation_id FROM quest_participants WHERE quest_id IN (${questIds.map(() => "?").join(",")})`
      ).bind(...questIds).all();
      for (const row of qpRows.results || []) {
        if (!participantsMap[row.quest_id]) {
          participantsMap[row.quest_id] = [];
        }
        participantsMap[row.quest_id].push(row.participation_id);
      }
    } catch {
    }
    const items = questRows.map((q) => ({
      id: q.id,
      campaignId: q.campaign_id,
      title: q.title,
      description: q.description || "",
      status: q.status || "active",
      giverNpcId: q.giver_npc_id || null,
      giverNpcName: q.giver_npc_name || null,
      locationId: q.location_id || null,
      locationName: q.location_name || null,
      objectives: parseBlob(q.objectives, []),
      rewardRef: q.reward_ref ? parseBlob(q.reward_ref, null) : null,
      participantIds: participantsMap[q.id] || [],
      sessionStartedId: q.session_started_id || null,
      sessionEndedId: q.session_ended_id || null,
      dmNotes: q.dm_notes || null,
      sortIndex: Number(q.sort_index || 0),
      createdAt: Number(q.created_at),
      updatedAt: Number(q.updated_at)
    }));
    return filterQuestsForViewer(items, isDm, actorPartId);
  }, "populateQuestExtras");
  if (path.match(/^\/c\/[^/]+\/quests$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    let actorPartId = null;
    if (!isDm) {
      const partRow = await env.DB.prepare(`
        SELECT cp.id FROM character_participations cp
        JOIN characters c ON cp.character_id = c.id
        WHERE cp.campaign_id = ? AND c.owner_id = ? AND cp.status = 'active'
        LIMIT 1
      `).bind(campId, actor.id).first();
      actorPartId = partRow?.id || null;
    }
    const rows = await env.DB.prepare(`
      SELECT q.*, l.name AS location_name, n.name AS giver_npc_name
      FROM quests q
      LEFT JOIN locations l ON q.location_id = l.id
      LEFT JOIN npcs n ON q.giver_npc_id = n.id
      WHERE q.campaign_id = ?
      ORDER BY q.sort_index ASC, q.created_at ASC
    `).bind(campId).all();
    const quests = await populateQuestExtras(rows.results || [], isDm, actorPartId);
    return json(quests);
  }
  if (path.match(/^\/c\/[^/]+\/quests\/[^/]+$/) && method === "GET") {
    const parts = path.split("/");
    const campId = parts[2];
    const qid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    let actorPartId = null;
    if (!isDm) {
      const partRow = await env.DB.prepare(`
        SELECT cp.id FROM character_participations cp
        JOIN characters c ON cp.character_id = c.id
        WHERE cp.campaign_id = ? AND c.owner_id = ? AND cp.status = 'active'
        LIMIT 1
      `).bind(campId, actor.id).first();
      actorPartId = partRow?.id || null;
    }
    const row = await env.DB.prepare(`
      SELECT q.*, l.name AS location_name, n.name AS giver_npc_name
      FROM quests q
      LEFT JOIN locations l ON q.location_id = l.id
      LEFT JOIN npcs n ON q.giver_npc_id = n.id
      WHERE q.id = ? AND q.campaign_id = ?
    `).bind(qid, campId).first();
    if (!row) return error("\u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const list = await populateQuestExtras([row], isDm, actorPartId);
    if (list.length === 0) return error("\u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F \u06CC\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    return json(list[0]);
  }
  if (path.match(/^\/c\/[^/]+\/quests$/) && method === "POST") {
    const campId = path.split("/")[2];
    if (!await requireCampaignDm(campId)) return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0628\u0647 \u062B\u0628\u062A \u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u0627\u0633\u062A.", 403);
    const body = await request.json();
    const val = validateQuestPayload(body);
    if (!val.valid) return error(val.error || "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.", 400);
    const qId = `quest-${Date.now()}-${generateRandomToken(4)}`;
    const title = String(body.title).trim();
    const description = body.description ? String(body.description).trim() : "";
    const status = body.status || "active";
    const giverNpcId = body.giverNpcId ? String(body.giverNpcId) : null;
    const locationId = body.locationId ? String(body.locationId) : null;
    const objectives = JSON.stringify(Array.isArray(body.objectives) ? body.objectives : []);
    const rewardRef = body.rewardRef ? JSON.stringify(body.rewardRef) : null;
    const sessionStartedId = body.sessionStartedId ? String(body.sessionStartedId) : null;
    const sessionEndedId = body.sessionEndedId ? String(body.sessionEndedId) : null;
    const dmNotes = body.dmNotes ? String(body.dmNotes).trim() : null;
    const sortIndex = Number(body.sortIndex || 0);
    await env.DB.prepare(`
      INSERT INTO quests (
        id, campaign_id, title, description, status, giver_npc_id,
        location_id, objectives, reward_ref, session_started_id,
        session_ended_id, dm_notes, sort_index, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      qId,
      campId,
      title,
      description,
      status,
      giverNpcId,
      locationId,
      objectives,
      rewardRef,
      sessionStartedId,
      sessionEndedId,
      dmNotes,
      sortIndex,
      now,
      now
    ).run();
    if (Array.isArray(body.participantIds)) {
      for (const pId of body.participantIds) {
        if (pId) {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO quest_participants (quest_id, participation_id) VALUES (?, ?)"
          ).bind(qId, String(pId)).run();
        }
      }
    }
    await audit("quest-create", qId, { campaignId: campId, title });
    const createdRow = await env.DB.prepare(`
      SELECT q.*, l.name AS location_name, n.name AS giver_npc_name
      FROM quests q
      LEFT JOIN locations l ON q.location_id = l.id
      LEFT JOIN npcs n ON q.giver_npc_id = n.id
      WHERE q.id = ?
    `).bind(qId).first();
    const list = await populateQuestExtras([createdRow], true, null);
    return json(list[0], 201);
  }
  if (path.match(/^\/c\/[^/]+\/quests\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const campId = parts[2];
    const qid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const existing = await env.DB.prepare("SELECT * FROM quests WHERE id = ? AND campaign_id = ?").bind(qid, campId).first();
    if (!existing) return error("\u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const title = body.title !== void 0 ? String(body.title).trim() : existing.title;
    const description = body.description !== void 0 ? String(body.description).trim() : existing.description;
    const status = body.status !== void 0 ? body.status : existing.status;
    const giverNpcId = body.giverNpcId !== void 0 ? body.giverNpcId ? String(body.giverNpcId) : null : existing.giver_npc_id;
    const locationId = body.locationId !== void 0 ? body.locationId ? String(body.locationId) : null : existing.location_id;
    const objectives = body.objectives !== void 0 ? JSON.stringify(body.objectives) : existing.objectives;
    const rewardRef = body.rewardRef !== void 0 ? body.rewardRef ? JSON.stringify(body.rewardRef) : null : existing.reward_ref;
    const sessionStartedId = body.sessionStartedId !== void 0 ? body.sessionStartedId ? String(body.sessionStartedId) : null : existing.session_started_id;
    const sessionEndedId = body.sessionEndedId !== void 0 ? body.sessionEndedId ? String(body.sessionEndedId) : null : existing.session_ended_id;
    const dmNotes = body.dmNotes !== void 0 ? body.dmNotes ? String(body.dmNotes).trim() : null : existing.dm_notes;
    const sortIndex = body.sortIndex !== void 0 ? Number(body.sortIndex) : existing.sort_index;
    await env.DB.prepare(`
      UPDATE quests SET
        title = ?, description = ?, status = ?, giver_npc_id = ?,
        location_id = ?, objectives = ?, reward_ref = ?, session_started_id = ?,
        session_ended_id = ?, dm_notes = ?, sort_index = ?, updated_at = ?
      WHERE id = ? AND campaign_id = ?
    `).bind(
      title,
      description,
      status,
      giverNpcId,
      locationId,
      objectives,
      rewardRef,
      sessionStartedId,
      sessionEndedId,
      dmNotes,
      sortIndex,
      now,
      qid,
      campId
    ).run();
    if (body.participantIds !== void 0 && Array.isArray(body.participantIds)) {
      await env.DB.prepare("DELETE FROM quest_participants WHERE quest_id = ?").bind(qid).run();
      for (const pId of body.participantIds) {
        if (pId) {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO quest_participants (quest_id, participation_id) VALUES (?, ?)"
          ).bind(qid, String(pId)).run();
        }
      }
    }
    await audit("quest-update", qid, { campaignId: campId, title, status });
    const updatedRow = await env.DB.prepare(`
      SELECT q.*, l.name AS location_name, n.name AS giver_npc_name
      FROM quests q
      LEFT JOIN locations l ON q.location_id = l.id
      LEFT JOIN npcs n ON q.giver_npc_id = n.id
      WHERE q.id = ?
    `).bind(qid).first();
    const list = await populateQuestExtras([updatedRow], true, null);
    return json(list[0]);
  }
  if (path.match(/^\/c\/[^/]+\/quests\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const qid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    await env.DB.prepare("DELETE FROM quest_participants WHERE quest_id = ?").bind(qid).run();
    await env.DB.prepare("DELETE FROM quests WHERE id = ? AND campaign_id = ?").bind(qid, campId).run();
    await audit("quest-delete", qid, { campaignId: campId });
    return json({ success: true });
  }
  if (path.match(/^\/c\/[^/]+\/quests\/[^/]+\/objectives\/[^/]+\/toggle$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const qid = parts[4];
    const oid = parts[6];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    const campRow = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ?").bind(campId).first();
    const cSettings = campRow ? parseBlob(campRow.settings, {}) : {};
    const allowPlayerTick = Boolean(cSettings.allowPlayerTickQuestObjectives);
    if (!canUserToggleObjective(isDm, allowPlayerTick)) {
      return error("\u0634\u0645\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0639\u0644\u0627\u0645\u062A\u200C\u0632\u062F\u0646 \u0627\u0647\u062F\u0627\u0641 \u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u0631\u0627 \u0646\u062F\u0627\u0631\u06CC\u062F.", 403);
    }
    const questRow = await env.DB.prepare("SELECT * FROM quests WHERE id = ? AND campaign_id = ?").bind(qid, campId).first();
    if (!questRow) return error("\u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (!isDm && questRow.status === "hidden") {
      return error("\u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    const objectives = parseBlob(questRow.objectives, []);
    const targetObj = objectives.find((o) => o.id === oid);
    if (!targetObj) return error("\u0647\u062F\u0641 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u062F\u0631 \u0627\u06CC\u0646 \u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (!isDm && !targetObj.visible) {
      return error("\u0647\u062F\u0641 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    const body = await request.json().catch(() => ({}));
    targetObj.done = body.done !== void 0 ? Boolean(body.done) : !targetObj.done;
    await env.DB.prepare("UPDATE quests SET objectives = ?, updated_at = ? WHERE id = ? AND campaign_id = ?").bind(JSON.stringify(objectives), now, qid, campId).run();
    await audit("quest-objective-toggle", qid, { objectiveId: oid, done: targetObj.done });
    return json({ success: true, objective: targetObj, objectives });
  }
  if (path.match(/^\/c\/[^/]+\/quests\/[^/]+\/complete$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const qid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const questRow = await env.DB.prepare("SELECT * FROM quests WHERE id = ? AND campaign_id = ?").bind(qid, campId).first();
    if (!questRow) return error("\u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json().catch(() => ({}));
    const markDone = body.markObjectivesDone !== false;
    const grantRewards = Boolean(body.grantRewards);
    const sessionEndedId = body.sessionEndedId ? String(body.sessionEndedId) : questRow.session_ended_id;
    let objectives = parseBlob(questRow.objectives, []);
    if (markDone) {
      objectives = objectives.map((o) => ({ ...o, done: true }));
    }
    await env.DB.prepare(`
      UPDATE quests SET
        status = 'completed', objectives = ?, session_ended_id = ?, updated_at = ?
      WHERE id = ? AND campaign_id = ?
    `).bind(JSON.stringify(objectives), sessionEndedId, now, qid, campId).run();
    let rewardGranted = false;
    const rewardRef = questRow.reward_ref ? parseBlob(questRow.reward_ref, null) : null;
    if (grantRewards && rewardRef && rewardRef.xp && rewardRef.xp > 0) {
      try {
        const partRows = await env.DB.prepare(
          "SELECT participation_id FROM quest_participants WHERE quest_id = ?"
        ).bind(qid).all();
        let recipientPartIds = (partRows.results || []).map((r) => r.participation_id);
        if (recipientPartIds.length === 0) {
          const allPartRows = await env.DB.prepare(
            "SELECT id FROM character_participations WHERE campaign_id = ? AND status = 'active'"
          ).bind(campId).all();
          recipientPartIds = (allPartRows.results || []).map((r) => r.id);
        }
        const xpAmount = Number(rewardRef.xp);
        for (const pId of recipientPartIds) {
          const cp = await env.DB.prepare("SELECT play_state FROM character_participations WHERE id = ?").bind(pId).first();
          if (cp && cp.play_state) {
            const playState = parseBlob(cp.play_state, {});
            const currentXp = Number(playState.xp || 0);
            playState.xp = currentXp + xpAmount;
            await env.DB.prepare("UPDATE character_participations SET play_state = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(playState), now, pId).run();
            const histId = `hist-${Date.now()}-${generateRandomToken(4)}`;
            await env.DB.prepare(`
              INSERT INTO character_history_events (
                id, participation_id, event_type, old_data, new_data,
                actor_id, note, created_at
              ) VALUES (?, ?, 'milestone', ?, ?, ?, ?, ?)
            `).bind(
              histId,
              pId,
              JSON.stringify({ xp: currentXp }),
              JSON.stringify({ xp: playState.xp, rewardQuestId: qid }),
              actor.id,
              `\u067E\u0627\u062F\u0627\u0634 \u062A\u06A9\u0645\u06CC\u0644 \u0645\u0623\u0645\u0648\u0631\u06CC\u062A: ${questRow.title} (+${xpAmount} XP)`,
              now
            ).run();
          }
        }
        rewardGranted = true;
      } catch {
      }
    }
    await audit("quest-complete", qid, { campaignId: campId, title: questRow.title, rewardGranted });
    try {
      const memberIds = await getCampaignMemberUserIds(campId, actor.id);
      await notify(
        memberIds,
        "quest_updated",
        {
          title: `\u0645\u0623\u0645\u0648\u0631\u06CC\u062A \u062A\u06A9\u0645\u06CC\u0644 \u0634\u062F: ${questRow.title}`,
          body: `\u0645\u0623\u0645\u0648\u0631\u06CC\u062A \xAB${questRow.title}\xBB \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647 \u067E\u0627\u06CC\u0627\u0646 \u0631\u0633\u06CC\u062F.`,
          campaignId: campId,
          targetType: "quest",
          targetId: qid,
          link: `/campaign/${campId}/quests?quest=${qid}`,
          actorName: actor.display_name
        },
        campId
      );
    } catch {
    }
    const updatedRow = await env.DB.prepare(`
      SELECT q.*, l.name AS location_name, n.name AS giver_npc_name
      FROM quests q
      LEFT JOIN locations l ON q.location_id = l.id
      LEFT JOIN npcs n ON q.giver_npc_id = n.id
      WHERE q.id = ?
    `).bind(qid).first();
    const list = await populateQuestExtras([updatedRow], true, null);
    return json({ success: true, quest: list[0], rewardGranted });
  }
  const formatReputationRow = /* @__PURE__ */ __name((r) => {
    const labels = parseBlob(r.labels, [
      { threshold: -50, label: "\u062F\u0634\u0645\u0646 \u062E\u0648\u0646\u06CC" },
      { threshold: -10, label: "\u062E\u0635\u0645\u0627\u0646\u0647" },
      { threshold: 0, label: "\u0628\u06CC\u200C\u0637\u0631\u0641" },
      { threshold: 20, label: "\u062F\u0648\u0633\u062A\u0627\u0646\u0647" },
      { threshold: 60, label: "\u0645\u062A\u062D\u062F" }
    ]);
    const val = Number(r.value || 0);
    const sorted = [...labels].sort((a, b) => a.threshold - b.threshold);
    let currentLabel = sorted[0]?.label || "\u0628\u06CC\u200C\u0637\u0631\u0641";
    for (const item of sorted) {
      if (val >= item.threshold) currentLabel = item.label;
    }
    return {
      id: r.id,
      campaignId: r.campaign_id,
      factionId: r.faction_id,
      participationId: r.participation_id || null,
      value: val,
      min: Number(r.min ?? -100),
      max: Number(r.max ?? 100),
      labels,
      visible: Boolean(r.visible),
      updatedAt: Number(r.updated_at),
      factionName: r.faction_name || r.faction_id,
      factionDescription: r.faction_description || "",
      factionRegion: r.faction_region || "",
      characterName: r.character_name || void 0,
      currentLabel
    };
  }, "formatReputationRow");
  if (path.match(/^\/c\/[^/]+\/reputation$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    let actorPartId = null;
    if (!isDm) {
      const partRow = await env.DB.prepare(`
        SELECT cp.id FROM character_participations cp
        JOIN characters c ON cp.character_id = c.id
        WHERE cp.campaign_id = ? AND c.owner_id = ? AND cp.status = 'active'
        LIMIT 1
      `).bind(campId, actor.id).first();
      actorPartId = partRow?.id || null;
    }
    let query = `
      SELECT fr.*, f.name AS faction_name, f.description AS faction_description, f.region AS faction_region,
             c.name AS character_name
      FROM faction_reputation fr
      LEFT JOIN factions f ON fr.faction_id = f.id
      LEFT JOIN character_participations cp ON fr.participation_id = cp.id
      LEFT JOIN characters c ON cp.character_id = c.id
      WHERE fr.campaign_id = ?
    `;
    if (!isDm) {
      query += ` AND fr.visible = 1 AND (fr.participation_id IS NULL OR fr.participation_id = ?)`;
    }
    query += ` ORDER BY fr.updated_at DESC`;
    const stmt = isDm ? env.DB.prepare(query).bind(campId) : env.DB.prepare(query).bind(campId, actorPartId || "");
    const rows = await stmt.all();
    const result = (rows.results || []).map(formatReputationRow);
    return json(result);
  }
  if (path.match(/^\/c\/[^/]+\/reputation\/[^/]+$/) && method === "GET") {
    const parts = path.split("/");
    const campId = parts[2];
    const rid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    const row = await env.DB.prepare(`
      SELECT fr.*, f.name AS faction_name, f.description AS faction_description, f.region AS faction_region,
             c.name AS character_name
      FROM faction_reputation fr
      LEFT JOIN factions f ON fr.faction_id = f.id
      LEFT JOIN character_participations cp ON fr.participation_id = cp.id
      LEFT JOIN characters c ON cp.character_id = c.id
      WHERE fr.id = ? AND fr.campaign_id = ?
    `).bind(rid, campId).first();
    if (!row) return error("\u0631\u06A9\u0648\u0631\u062F \u0634\u0647\u0631\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (!isDm && !row.visible) return error("\u0631\u06A9\u0648\u0631\u062F \u0634\u0647\u0631\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    return json(formatReputationRow(row));
  }
  if (path.match(/^\/c\/[^/]+\/reputation$/) && method === "POST") {
    const campId = path.split("/")[2];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json().catch(() => ({}));
    if (!body.factionId) return error("\u0634\u0646\u0627\u0633\u0647 \u062C\u0646\u0627\u062D \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.", 400);
    const id = body.id || `rep-${campId}-${now}-${generateRandomToken(4)}`;
    const factionId = String(body.factionId);
    const participationId = body.participationId ? String(body.participationId) : null;
    const value = typeof body.value === "number" ? body.value : 0;
    const min = typeof body.min === "number" ? body.min : -100;
    const max = typeof body.max === "number" ? body.max : 100;
    const labels = JSON.stringify(body.labels || [
      { threshold: -50, label: "\u062F\u0634\u0645\u0646 \u062E\u0648\u0646\u06CC" },
      { threshold: -10, label: "\u062E\u0635\u0645\u0627\u0646\u0647" },
      { threshold: 0, label: "\u0628\u06CC\u200C\u0637\u0631\u0641" },
      { threshold: 20, label: "\u062F\u0648\u0633\u062A\u0627\u0646\u0647" },
      { threshold: 60, label: "\u0645\u062A\u062D\u062F" }
    ]);
    const visible = body.visible !== false ? 1 : 0;
    await env.DB.prepare(`
      INSERT INTO faction_reputation (
        id, campaign_id, faction_id, participation_id, value, min, max, labels, visible, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, campId, factionId, participationId, value, min, max, labels, visible, now).run();
    await audit("reputation-create", id, { campaignId: campId, factionId, value });
    const createdRow = await env.DB.prepare(`
      SELECT fr.*, f.name AS faction_name, f.description AS faction_description, f.region AS faction_region,
             c.name AS character_name
      FROM faction_reputation fr
      LEFT JOIN factions f ON fr.faction_id = f.id
      LEFT JOIN character_participations cp ON fr.participation_id = cp.id
      LEFT JOIN characters c ON cp.character_id = c.id
      WHERE fr.id = ?
    `).bind(id).first();
    return json(formatReputationRow(createdRow));
  }
  if (path.match(/^\/c\/[^/]+\/reputation\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const campId = parts[2];
    const rid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const existing = await env.DB.prepare("SELECT * FROM faction_reputation WHERE id = ? AND campaign_id = ?").bind(rid, campId).first();
    if (!existing) return error("\u0631\u06A9\u0648\u0631\u062F \u0634\u0647\u0631\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json().catch(() => ({}));
    const value = typeof body.value === "number" ? body.value : existing.value;
    const min = typeof body.min === "number" ? body.min : existing.min;
    const max = typeof body.max === "number" ? body.max : existing.max;
    const labels = body.labels ? JSON.stringify(body.labels) : existing.labels;
    const visible = body.visible !== void 0 ? body.visible ? 1 : 0 : existing.visible;
    const participationId = body.participationId !== void 0 ? body.participationId ? String(body.participationId) : null : existing.participation_id;
    await env.DB.prepare(`
      UPDATE faction_reputation SET
        value = ?, min = ?, max = ?, labels = ?, visible = ?, participation_id = ?, updated_at = ?
      WHERE id = ? AND campaign_id = ?
    `).bind(value, min, max, labels, visible, participationId, now, rid, campId).run();
    const updatedRow = await env.DB.prepare(`
      SELECT fr.*, f.name AS faction_name, f.description AS faction_description, f.region AS faction_region,
             c.name AS character_name
      FROM faction_reputation fr
      LEFT JOIN factions f ON fr.faction_id = f.id
      LEFT JOIN character_participations cp ON fr.participation_id = cp.id
      LEFT JOIN characters c ON cp.character_id = c.id
      WHERE fr.id = ?
    `).bind(rid).first();
    return json(formatReputationRow(updatedRow));
  }
  if (path.match(/^\/c\/[^/]+\/reputation\/[^/]+\/adjust$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const rid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const rep = await env.DB.prepare("SELECT * FROM faction_reputation WHERE id = ? AND campaign_id = ?").bind(rid, campId).first();
    if (!rep) return error("\u0631\u06A9\u0648\u0631\u062F \u0634\u0647\u0631\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json().catch(() => ({}));
    const delta = Number(body.delta || 0);
    const reason = String(body.reason || "\u062A\u063A\u06CC\u06CC\u0631 \u0634\u0647\u0631\u062A");
    const sessionId = body.sessionId ? String(body.sessionId) : null;
    const min = Number(rep.min ?? -100);
    const max = Number(rep.max ?? 100);
    const currentVal = Number(rep.value || 0);
    const newVal = Math.min(max, Math.max(min, currentVal + delta));
    const actualDelta = newVal - currentVal;
    await env.DB.prepare("UPDATE faction_reputation SET value = ?, updated_at = ? WHERE id = ?").bind(newVal, now, rid).run();
    const logId = `replog-${now}-${generateRandomToken(4)}`;
    await env.DB.prepare(`
      INSERT INTO reputation_log (id, reputation_id, delta, reason, session_id, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(logId, rid, actualDelta, reason, sessionId, actor.id, now).run();
    const logEntry = {
      id: logId,
      reputationId: rid,
      delta: actualDelta,
      reason,
      sessionId,
      createdBy: actor.id,
      createdByName: actor.display_name,
      createdAt: now
    };
    const updatedRow = await env.DB.prepare(`
      SELECT fr.*, f.name AS faction_name, f.description AS faction_description, f.region AS faction_region,
             c.name AS character_name
      FROM faction_reputation fr
      LEFT JOIN factions f ON fr.faction_id = f.id
      LEFT JOIN character_participations cp ON fr.participation_id = cp.id
      LEFT JOIN characters c ON cp.character_id = c.id
      WHERE fr.id = ?
    `).bind(rid).first();
    return json({ reputation: formatReputationRow(updatedRow), log: logEntry });
  }
  if (path.match(/^\/c\/[^/]+\/reputation\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const rid = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    await env.DB.prepare("DELETE FROM faction_reputation WHERE id = ? AND campaign_id = ?").bind(rid, campId).run();
    return json({ success: true });
  }
  if (path.match(/^\/c\/[^/]+\/reputation-logs$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const url2 = new URL(request.url);
    const reputationId = url2.searchParams.get("reputationId");
    let query = `
      SELECT rl.*, u.name AS created_by_name
      FROM reputation_log rl
      JOIN faction_reputation fr ON rl.reputation_id = fr.id
      LEFT JOIN users u ON rl.created_by = u.id
      WHERE fr.campaign_id = ?
    `;
    const params = [campId];
    if (reputationId) {
      query += ` AND rl.reputation_id = ?`;
      params.push(reputationId);
    }
    query += ` ORDER BY rl.created_at DESC LIMIT 100`;
    const rows = await env.DB.prepare(query).bind(...params).all();
    const logs = (rows.results || []).map((r) => ({
      id: r.id,
      reputationId: r.reputation_id,
      delta: Number(r.delta),
      reason: r.reason,
      sessionId: r.session_id || null,
      createdBy: r.created_by,
      createdByName: r.created_by_name || "\u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631",
      createdAt: Number(r.created_at)
    }));
    return json(logs);
  }
  if (path.match(/^\/c\/[^/]+\/treasury$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const campRow = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ?").bind(campId).first();
    const settings = parseBlob(campRow?.settings, {});
    const locked = Boolean(settings.treasuryLocked);
    const requireApproval = Boolean(settings.treasuryRequireApproval);
    const itemRows = await env.DB.prepare(`
      SELECT * FROM party_items WHERE campaign_id = ? ORDER BY created_at DESC
    `).bind(campId).all();
    const items = (itemRows.results || []).map((r) => ({
      id: r.id,
      campaignId: r.campaign_id,
      name: r.name,
      quantity: Number(r.quantity),
      description: r.description || "",
      category: r.category || "misc",
      notes: r.notes || "",
      revision: Number(r.revision || 1),
      createdAt: Number(r.created_at),
      updatedAt: r.updated_at ? Number(r.updated_at) : void 0
    }));
    let currRow = await env.DB.prepare("SELECT * FROM party_currency WHERE campaign_id = ?").bind(campId).first();
    if (!currRow) {
      await env.DB.prepare(`
        INSERT INTO party_currency (campaign_id, balances, revision, updated_at)
        VALUES (?, '{}', 1, ?)
      `).bind(campId, now).run();
      currRow = { campaign_id: campId, balances: "{}", revision: 1, updated_at: now };
    }
    const currency = {
      campaignId: currRow.campaign_id,
      balances: parseBlob(currRow.balances, {}),
      revision: Number(currRow.revision || 1),
      updatedAt: Number(currRow.updated_at)
    };
    return json({ items, currency, locked, requireApproval });
  }
  if (path.match(/^\/c\/[^/]+\/treasury\/currency$/) && method === "PATCH") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    const campRow = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ?").bind(campId).first();
    const settings = parseBlob(campRow?.settings, {});
    if (settings.treasuryLocked && !isDm) {
      return error("\u062E\u0632\u0627\u0646\u0647 \u06AF\u0631\u0648\u0647 \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0642\u0641\u0644 \u0634\u062F\u0647 \u0627\u0633\u062A.", 403);
    }
    const body = await request.json().catch(() => ({}));
    const balances = body.balances || {};
    const expectedRevision = body.expectedRevision;
    const note = body.note;
    let currRow = await env.DB.prepare("SELECT * FROM party_currency WHERE campaign_id = ?").bind(campId).first();
    if (!currRow) {
      await env.DB.prepare(`
        INSERT INTO party_currency (campaign_id, balances, revision, updated_at)
        VALUES (?, '{}', 1, ?)
      `).bind(campId, now).run();
      currRow = { campaign_id: campId, balances: "{}", revision: 1, updated_at: now };
    }
    if (expectedRevision !== void 0 && Number(currRow.revision) !== Number(expectedRevision)) {
      return error("\u062E\u0637\u0627\u06CC \u0647\u0645\u0632\u0645\u0627\u0646\u06CC: \u0645\u0648\u062C\u0648\u062F\u06CC \u0633\u06A9\u0647\u200C\u0647\u0627\u06CC \u062E\u0632\u0627\u0646\u0647 \u0647\u0645\u200C\u0632\u0645\u0627\u0646 \u062A\u0648\u0633\u0637 \u06A9\u0627\u0631\u0628\u0631 \u062F\u06CC\u06AF\u0631\u06CC \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A\u0647 \u0627\u0633\u062A.", 409);
    }
    const nextRevision = Number(currRow.revision) + 1;
    await env.DB.prepare(`
      UPDATE party_currency SET balances = ?, revision = ?, updated_at = ? WHERE campaign_id = ?
    `).bind(JSON.stringify(balances), nextRevision, now, campId).run();
    const logId = `tlog-${now}-${generateRandomToken(4)}`;
    const currSummary = Object.entries(balances).map(([k, v]) => `${v} ${k}`).join("\u060C ");
    await env.DB.prepare(`
      INSERT INTO treasury_log (id, campaign_id, actor_participation_id, type, item_ref, qty, note, created_at)
      VALUES (?, ?, NULL, 'currency', ?, NULL, ?, ?)
    `).bind(logId, campId, currSummary, note || "\u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0645\u0648\u062C\u0648\u062F\u06CC \u0633\u06A9\u0647\u200C\u0647\u0627\u06CC \u062E\u0632\u0627\u0646\u0647", now).run();
    return json({
      campaignId: campId,
      balances,
      revision: nextRevision,
      updatedAt: now
    });
  }
  if (path.match(/^\/c\/[^/]+\/treasury\/items$/) && method === "POST") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    const campRow = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ?").bind(campId).first();
    const settings = parseBlob(campRow?.settings, {});
    if (settings.treasuryLocked && !isDm) {
      return error("\u062E\u0632\u0627\u0646\u0647 \u06AF\u0631\u0648\u0647 \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0642\u0641\u0644 \u0634\u062F\u0647 \u0627\u0633\u062A.", 403);
    }
    const body = await request.json().catch(() => ({}));
    if (!body.name || !body.name.trim()) return error("\u0646\u0627\u0645 \u0622\u06CC\u062A\u0645 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.", 400);
    const id = body.id || `pitem-${campId}-${now}-${generateRandomToken(4)}`;
    const name = body.name.trim();
    const quantity = Math.max(1, Number(body.quantity || 1));
    const description = body.description || "";
    const category = body.category || "misc";
    const notes = body.notes || "";
    const note = body.note;
    await env.DB.prepare(`
      INSERT INTO party_items (id, campaign_id, name, quantity, description, category, notes, revision, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(id, campId, name, quantity, description, category, notes, now, now).run();
    const logId = `tlog-${now}-${generateRandomToken(4)}`;
    await env.DB.prepare(`
      INSERT INTO treasury_log (id, campaign_id, actor_participation_id, type, item_ref, qty, note, created_at)
      VALUES (?, ?, NULL, 'add', ?, ?, ?, ?)
    `).bind(logId, campId, name, quantity, note || `\u0627\u0641\u0632\u0648\u062F\u0646 ${quantity} \u0639\u062F\u062F ${name} \u0628\u0647 \u062E\u0632\u0627\u0646\u0647`, now).run();
    return json({
      id,
      campaignId: campId,
      name,
      quantity,
      description,
      category,
      notes,
      revision: 1,
      createdAt: now,
      updatedAt: now
    });
  }
  if (path.match(/^\/c\/[^/]+\/treasury\/items\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const campId = parts[2];
    const iid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    const campRow = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ?").bind(campId).first();
    const settings = parseBlob(campRow?.settings, {});
    if (settings.treasuryLocked && !isDm) {
      return error("\u062E\u0632\u0627\u0646\u0647 \u06AF\u0631\u0648\u0647 \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0642\u0641\u0644 \u0634\u062F\u0647 \u0627\u0633\u062A.", 403);
    }
    const existing = await env.DB.prepare("SELECT * FROM party_items WHERE id = ? AND campaign_id = ?").bind(iid, campId).first();
    if (!existing) return error("\u0622\u06CC\u062A\u0645 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json().catch(() => ({}));
    if (body.expectedRevision !== void 0 && Number(existing.revision) !== Number(body.expectedRevision)) {
      return error("\u062E\u0637\u0627\u06CC \u0647\u0645\u0632\u0645\u0627\u0646\u06CC: \u0627\u06CC\u0646 \u0622\u06CC\u062A\u0645 \u062A\u0648\u0633\u0637 \u0628\u0627\u0632\u06CC\u06A9\u0646 \u062F\u06CC\u06AF\u0631\u06CC \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0635\u0641\u062D\u0647 \u0631\u0627 \u062A\u0627\u0632\u0647\u200C\u0633\u0627\u0632\u06CC \u06A9\u0646\u06CC\u062F.", 409);
    }
    const name = body.name ? body.name.trim() : existing.name;
    const quantity = body.quantity !== void 0 ? Math.max(1, Number(body.quantity)) : existing.quantity;
    const description = body.description !== void 0 ? body.description : existing.description;
    const category = body.category !== void 0 ? body.category : existing.category;
    const notes = body.notes !== void 0 ? body.notes : existing.notes;
    const nextRevision = Number(existing.revision) + 1;
    await env.DB.prepare(`
      UPDATE party_items SET
        name = ?, quantity = ?, description = ?, category = ?, notes = ?, revision = ?, updated_at = ?
      WHERE id = ? AND campaign_id = ?
    `).bind(name, quantity, description, category, notes, nextRevision, now, iid, campId).run();
    return json({
      id: iid,
      campaignId: campId,
      name,
      quantity,
      description,
      category,
      notes,
      revision: nextRevision,
      createdAt: Number(existing.created_at),
      updatedAt: now
    });
  }
  if (path.match(/^\/c\/[^/]+\/treasury\/items\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const iid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    const campRow = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ?").bind(campId).first();
    const settings = parseBlob(campRow?.settings, {});
    if (settings.treasuryLocked && !isDm) {
      return error("\u062E\u0632\u0627\u0646\u0647 \u06AF\u0631\u0648\u0647 \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0642\u0641\u0644 \u0634\u062F\u0647 \u0627\u0633\u062A.", 403);
    }
    const existing = await env.DB.prepare("SELECT * FROM party_items WHERE id = ? AND campaign_id = ?").bind(iid, campId).first();
    if (!existing) return error("\u0622\u06CC\u062A\u0645 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json().catch(() => ({}));
    if (body.expectedRevision !== void 0 && Number(existing.revision) !== Number(body.expectedRevision)) {
      return error("\u062E\u0637\u0627\u06CC \u0647\u0645\u0632\u0645\u0627\u0646\u06CC: \u0627\u06CC\u0646 \u0622\u06CC\u062A\u0645 \u062A\u0648\u0633\u0637 \u0628\u0627\u0632\u06CC\u06A9\u0646 \u062F\u06CC\u06AF\u0631\u06CC \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0635\u0641\u062D\u0647 \u0631\u0627 \u062A\u0627\u0632\u0647\u200C\u0633\u0627\u0632\u06CC \u06A9\u0646\u06CC\u062F.", 409);
    }
    await env.DB.prepare("DELETE FROM party_items WHERE id = ? AND campaign_id = ?").bind(iid, campId).run();
    const logId = `tlog-${now}-${generateRandomToken(4)}`;
    await env.DB.prepare(`
      INSERT INTO treasury_log (id, campaign_id, actor_participation_id, type, item_ref, qty, note, created_at)
      VALUES (?, ?, NULL, 'remove', ?, ?, ?, ?)
    `).bind(logId, campId, existing.name, Number(existing.quantity), body.note || `\u062D\u0630\u0641 ${existing.name} \u0627\u0632 \u062E\u0632\u0627\u0646\u0647`, now).run();
    return json({ success: true });
  }
  if (path.match(/^\/c\/[^/]+\/treasury\/transfer$/) && method === "POST") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const isDm = actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
    const campRow = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ?").bind(campId).first();
    const settings = parseBlob(campRow?.settings, {});
    if (settings.treasuryLocked && !isDm) {
      return error("\u062E\u0632\u0627\u0646\u0647 \u06AF\u0631\u0648\u0647 \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646\u200C\u0645\u0633\u062A\u0631 \u0642\u0641\u0644 \u0634\u062F\u0647 \u0627\u0633\u062A.", 403);
    }
    const body = await request.json().catch(() => ({}));
    const direction = body.direction;
    const partId = String(body.participationId);
    const qty = Math.max(1, Number(body.quantity || 1));
    if (!direction || !partId) return error("\u062C\u0647\u062A \u0627\u0646\u062A\u0642\u0627\u0644 \u0648 \u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.", 400);
    const partRow = await env.DB.prepare("SELECT * FROM character_participations WHERE id = ? AND campaign_id = ?").bind(partId, campId).first();
    if (!partRow) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    let playState = parseBlob(partRow.play_state, {});
    let inv = Array.isArray(playState.inventory) ? playState.inventory : [];
    let affectedPartyItem = null;
    let logType = "transfer_out";
    let logItemRef = "";
    if (direction === "to_inventory") {
      const itemId = String(body.itemId);
      const partyItemRow = await env.DB.prepare("SELECT * FROM party_items WHERE id = ? AND campaign_id = ?").bind(itemId, campId).first();
      if (!partyItemRow) return error("\u0622\u06CC\u062A\u0645 \u062F\u0631 \u062E\u0632\u0627\u0646\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
      if (body.currentRevision !== void 0 && Number(partyItemRow.revision) !== Number(body.currentRevision)) {
        return error("\u062E\u0637\u0627\u06CC \u0647\u0645\u0632\u0645\u0627\u0646\u06CC: \u0627\u06CC\u0646 \u0622\u06CC\u062A\u0645 \u0647\u0645\u200C\u0632\u0645\u0627\u0646 \u062A\u0648\u0633\u0637 \u0628\u0627\u0632\u06CC\u06A9\u0646 \u062F\u06CC\u06AF\u0631\u06CC \u0628\u0631\u062F\u0627\u0634\u062A\u0647 \u06CC\u0627 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0635\u0641\u062D\u0647 \u0631\u0627 \u062A\u0627\u0632\u0647\u200C\u0633\u0627\u0632\u06CC \u06A9\u0646\u06CC\u062F.", 409);
      }
      if (Number(partyItemRow.quantity) < qty) {
        return error(`\u0645\u0648\u062C\u0648\u062F\u06CC \u06A9\u0627\u0641\u06CC \u062F\u0631 \u062E\u0632\u0627\u0646\u0647 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F (\u0645\u0648\u062C\u0648\u062F\u06CC \u0641\u0639\u0644\u06CC: ${partyItemRow.quantity}).`, 400);
      }
      logItemRef = partyItemRow.name;
      logType = "transfer_out";
      if (Number(partyItemRow.quantity) === qty) {
        await env.DB.prepare("DELETE FROM party_items WHERE id = ? AND campaign_id = ?").bind(itemId, campId).run();
        affectedPartyItem = null;
      } else {
        const nextQty = Number(partyItemRow.quantity) - qty;
        const nextRev = Number(partyItemRow.revision) + 1;
        await env.DB.prepare(`
          UPDATE party_items SET quantity = ?, revision = ?, updated_at = ? WHERE id = ? AND campaign_id = ?
        `).bind(nextQty, nextRev, now, itemId, campId).run();
        affectedPartyItem = {
          ...partyItemRow,
          quantity: nextQty,
          revision: nextRev,
          updatedAt: now
        };
      }
      const existingInvIdx = inv.findIndex((ci) => ci.name && ci.name.trim().toLowerCase() === partyItemRow.name.trim().toLowerCase());
      if (existingInvIdx >= 0) {
        inv[existingInvIdx].quantity = Number(inv[existingInvIdx].quantity || 1) + qty;
      } else {
        inv.push({
          id: `inv-${now}-${generateRandomToken(4)}`,
          name: partyItemRow.name,
          quantity: qty,
          category: partyItemRow.category || "misc",
          description: partyItemRow.description || "",
          weight: 1,
          isEquipped: false
        });
      }
    } else {
      const itemName = String(body.itemName || "").trim();
      const existingInvIdx = inv.findIndex((ci) => body.itemId && ci.id === body.itemId || ci.name === itemName);
      if (existingInvIdx === -1) return error("\u0622\u06CC\u062A\u0645 \u062F\u0631 \u06A9\u0648\u0644\u0647\u200C\u067E\u0634\u062A\u06CC \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
      const charItem = inv[existingInvIdx];
      if (Number(charItem.quantity || 1) < qty) {
        return error(`\u0645\u0648\u062C\u0648\u062F\u06CC \u062F\u0631 \u06A9\u0648\u0644\u0647\u200C\u067E\u0634\u062A\u06CC \u06A9\u0627\u0641\u06CC \u0646\u06CC\u0633\u062A (\u0645\u0648\u062C\u0648\u062F\u06CC: ${charItem.quantity}).`, 400);
      }
      logItemRef = charItem.name;
      logType = "transfer_in";
      if (Number(charItem.quantity || 1) === qty) {
        inv.splice(existingInvIdx, 1);
      } else {
        inv[existingInvIdx].quantity = Number(charItem.quantity) - qty;
      }
      const partyMatch = await env.DB.prepare("SELECT * FROM party_items WHERE campaign_id = ? AND name = ?").bind(campId, charItem.name).first();
      if (partyMatch) {
        const nextQty = Number(partyMatch.quantity) + qty;
        const nextRev = Number(partyMatch.revision) + 1;
        await env.DB.prepare("UPDATE party_items SET quantity = ?, revision = ?, updated_at = ? WHERE id = ?").bind(nextQty, nextRev, now, partyMatch.id).run();
        affectedPartyItem = { ...partyMatch, quantity: nextQty, revision: nextRev, updatedAt: now };
      } else {
        const newId = `pitem-${campId}-${now}-${generateRandomToken(4)}`;
        await env.DB.prepare(`
          INSERT INTO party_items (id, campaign_id, name, quantity, description, category, notes, revision, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, '', 1, ?, ?)
        `).bind(newId, campId, charItem.name, qty, charItem.description || "", charItem.category || "misc", now, now).run();
        affectedPartyItem = {
          id: newId,
          campaignId: campId,
          name: charItem.name,
          quantity: qty,
          description: charItem.description || "",
          category: charItem.category || "misc",
          revision: 1,
          createdAt: now,
          updatedAt: now
        };
      }
    }
    playState.inventory = inv;
    await env.DB.prepare("UPDATE character_participations SET play_state = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(playState), now, partId).run();
    const logId = `tlog-${now}-${generateRandomToken(4)}`;
    const note = body.note || (direction === "to_inventory" ? `\u0627\u0646\u062A\u0642\u0627\u0644 ${qty} \u0639\u062F\u062F ${logItemRef} \u0628\u0647 \u06A9\u0648\u0644\u0647\u200C\u067E\u0634\u062A\u06CC \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631` : `\u0627\u0646\u062A\u0642\u0627\u0644 ${qty} \u0639\u062F\u062F ${logItemRef} \u0628\u0647 \u062E\u0632\u0627\u0646\u0647 \u06AF\u0631\u0648\u0647`);
    await env.DB.prepare(`
      INSERT INTO treasury_log (id, campaign_id, actor_participation_id, type, item_ref, qty, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(logId, campId, partId, logType, logItemRef, qty, note, now).run();
    const treasuryLog = {
      id: logId,
      campaignId: campId,
      actorParticipationId: partId,
      type: logType,
      itemRef: logItemRef,
      qty,
      note,
      createdAt: now
    };
    return json({
      partyItem: affectedPartyItem,
      characterInventory: inv,
      treasuryLog
    });
  }
  if (path.match(/^\/c\/[^/]+\/treasury\/logs$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 404);
    const url2 = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(url2.searchParams.get("limit") || 50)));
    const rows = await env.DB.prepare(`
      SELECT tl.*, c.name AS actor_name
      FROM treasury_log tl
      LEFT JOIN character_participations cp ON tl.actor_participation_id = cp.id
      LEFT JOIN characters c ON cp.character_id = c.id
      WHERE tl.campaign_id = ?
      ORDER BY tl.created_at DESC
      LIMIT ?
    `).bind(campId, limit).all();
    const logs = (rows.results || []).map((r) => ({
      id: r.id,
      campaignId: r.campaign_id,
      actorParticipationId: r.actor_participation_id || null,
      actorName: r.actor_name || void 0,
      type: r.type,
      itemRef: r.item_ref || null,
      qty: r.qty !== null ? Number(r.qty) : null,
      note: r.note || "",
      createdAt: Number(r.created_at)
    }));
    return json(logs);
  }
  if (path === "/notifications" && method === "GET") {
    const url2 = new URL(request.url);
    const filterCampId = url2.searchParams.get("campaign_id");
    const unreadOnly = url2.searchParams.get("unread_only") === "true";
    try {
      const campRows = await env.DB.prepare(
        'SELECT campaign_id FROM campaign_members WHERE user_id = ? AND status = "active"'
      ).bind(actor.id).all();
      const userCampIds = (campRows.results || []).map((r) => String(r.campaign_id));
      if (userCampIds.length > 0) {
        const placeholders = userCampIds.map(() => "?").join(",");
        const sessRows = await env.DB.prepare(`
          SELECT * FROM sessions
          WHERE campaign_id IN (${placeholders})
            AND status IN ('planned', 'confirmed')
            AND scheduled_at IS NOT NULL
        `).bind(...userCampIds).all();
        const sessionsList = [];
        for (const sr of sessRows.results || []) {
          const rsvps = await env.DB.prepare("SELECT * FROM session_rsvps WHERE session_id = ?").bind(sr.id).all();
          sessionsList.push({
            id: String(sr.id),
            campaignId: String(sr.campaign_id),
            number: Number(sr.number),
            title: String(sr.title),
            scheduledAt: sr.scheduled_at,
            durationMinutes: Number(sr.duration_minutes || 180),
            status: sr.status,
            createdBy: String(sr.created_by),
            createdAt: Number(sr.created_at),
            updatedAt: Number(sr.updated_at),
            rsvps: (rsvps.results || []).map((r) => ({
              sessionId: String(r.session_id),
              userId: String(r.user_id),
              status: r.status,
              updatedAt: Number(r.updated_at)
            }))
          });
        }
        const existingNotifs = await env.DB.prepare(
          'SELECT * FROM notifications WHERE user_id = ? AND type = "rsvp_reminder"'
        ).bind(actor.id).all();
        const existingItems = (existingNotifs.results || []).map((n) => ({
          id: String(n.id),
          userId: String(n.user_id),
          campaignId: n.campaign_id || null,
          type: n.type,
          payload: parseBlob(n.payload, {}),
          readAt: n.read_at ? Number(n.read_at) : null,
          createdAt: Number(n.created_at)
        }));
        const reminders = computeLazySessionReminders({
          userId: actor.id,
          sessions: sessionsList,
          existingNotifications: existingItems,
          nowMs: now,
          horizonHours: 24
        });
        for (const rem of reminders) {
          await env.DB.prepare(`
            INSERT INTO notifications (id, user_id, campaign_id, type, payload, read_at, created_at)
            VALUES (?, ?, ?, ?, ?, NULL, ?)
          `).bind(rem.id, rem.userId, rem.campaignId, rem.type, JSON.stringify(rem.payload), rem.createdAt).run();
        }
      }
    } catch (e) {
      console.warn("Lazy session reminder evaluation failed:", e);
    }
    let query = `
      SELECT n.*, c.name AS campaign_title
      FROM notifications n
      LEFT JOIN campaigns c ON n.campaign_id = c.id
      WHERE n.user_id = ?
    `;
    const params = [actor.id];
    if (filterCampId) {
      query += " AND n.campaign_id = ?";
      params.push(filterCampId);
    }
    if (unreadOnly) {
      query += " AND n.read_at IS NULL";
    }
    query += " ORDER BY n.created_at DESC LIMIT 100";
    const rows = await env.DB.prepare(query).bind(...params).all();
    const items = (rows.results || []).map((r) => {
      const payload = parseBlob(r.payload, {});
      return {
        id: String(r.id),
        userId: String(r.user_id),
        campaignId: r.campaign_id || null,
        type: r.type,
        payload,
        readAt: r.read_at ? Number(r.read_at) : null,
        createdAt: Number(r.created_at),
        campaignTitle: r.campaign_title || payload.campaignTitle || void 0,
        isRead: !!r.read_at
      };
    });
    return json(items);
  }
  if (path.match(/^\/notifications\/[^/]+\/read$/) && method === "POST") {
    const notifId = path.split("/")[2];
    await env.DB.prepare("UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?").bind(now, notifId, actor.id).run();
    return json({ success: true, id: notifId, readAt: now });
  }
  if (path === "/notifications/read-all" && method === "POST") {
    let body = {};
    try {
      body = await request.json();
    } catch {
    }
    const campId = body.campaignId || new URL(request.url).searchParams.get("campaign_id");
    if (campId) {
      await env.DB.prepare("UPDATE notifications SET read_at = ? WHERE user_id = ? AND campaign_id = ? AND read_at IS NULL").bind(now, actor.id, campId).run();
    } else {
      await env.DB.prepare("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL").bind(now, actor.id).run();
    }
    return json({ success: true, readAt: now });
  }
  if (path.match(/^\/notifications\/[^/]+$/) && method === "DELETE") {
    const notifId = path.split("/")[2];
    await env.DB.prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?").bind(notifId, actor.id).run();
    return json({ success: true, id: notifId });
  }
  if (path === "/notifications/preferences" && method === "GET") {
    const url2 = new URL(request.url);
    const campId = url2.searchParams.get("campaign_id");
    let row;
    if (campId) {
      row = await env.DB.prepare("SELECT * FROM notification_prefs WHERE user_id = ? AND campaign_id = ?").bind(actor.id, campId).first();
    }
    if (!row) {
      row = await env.DB.prepare("SELECT * FROM notification_prefs WHERE user_id = ? AND campaign_id IS NULL").bind(actor.id).first();
    }
    const pref = {
      id: row?.id ? String(row.id) : void 0,
      userId: actor.id,
      campaignId: campId || null,
      types: row ? parseBlob(row.types, {}) : {},
      pushEnabled: row ? row.push_enabled !== 0 : true,
      updatedAt: row ? Number(row.updated_at) : void 0
    };
    return json(pref);
  }
  if (path === "/notifications/preferences" && method === "PUT") {
    const body = await request.json();
    const campId = body.campaignId || null;
    const typesObj = body.types || {};
    const pushEnabled = body.pushEnabled !== void 0 ? body.pushEnabled ? 1 : 0 : 1;
    const prefId = `pref-${actor.id}-${campId || "global"}`;
    await env.DB.prepare(`
      INSERT INTO notification_prefs (id, user_id, campaign_id, types, push_enabled, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, campaign_id) DO UPDATE SET
        types = excluded.types,
        push_enabled = excluded.push_enabled,
        updated_at = excluded.updated_at
    `).bind(prefId, actor.id, campId, JSON.stringify(typesObj), pushEnabled, now).run();
    return json({
      id: prefId,
      userId: actor.id,
      campaignId: campId,
      types: typesObj,
      pushEnabled: !!pushEnabled,
      updatedAt: now
    });
  }
  if (path === "/push/subscribe" && method === "POST") {
    const body = await request.json();
    const endpoint = String(body.endpoint || "").trim();
    if (!endpoint) return error("\u0622\u062F\u0631\u0633 \u067E\u0627\u06CC\u0627\u0646\u0647 \u0627\u0639\u0644\u0627\u0646 (Endpoint) \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.", 400);
    const keys = body.keys || {};
    const userAgent2 = request.headers.get("user-agent") || body.userAgent || "";
    const subId = `sub-${now}-${generateRandomToken(4)}`;
    await env.DB.prepare(`
      INSERT INTO push_subscriptions (id, user_id, endpoint, keys, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        user_id = excluded.user_id,
        keys = excluded.keys,
        user_agent = excluded.user_agent,
        created_at = excluded.created_at
    `).bind(subId, actor.id, endpoint, JSON.stringify(keys), userAgent2, now).run();
    return json({ success: true, subscriptionId: subId });
  }
  if (path === "/push/unsubscribe" && method === "POST") {
    const body = await request.json();
    const endpoint = String(body.endpoint || "").trim();
    if (endpoint) {
      await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?").bind(endpoint, actor.id).run();
    }
    return json({ success: true });
  }
  if (path === "/sync/edits" && method === "POST") {
    const body = await request.json();
    const edits = Array.isArray(body.edits) ? body.edits : [];
    const syncedIds = [];
    const conflicts = [];
    for (const edit of edits) {
      if (edit.field === "notes") {
        const note = await env.DB.prepare("SELECT * FROM notes WHERE id = ? OR character_id = ?").bind(edit.participationId, edit.characterId).first();
        if (note) {
          const conflict = detectConflict(edit, { revision: Number(note.revision) || 1, notes: note.data });
          if (conflict) {
            conflicts.push(conflict);
            await env.DB.prepare(`
              INSERT INTO sync_conflicts (id, campaign_id, entity_type, entity_id, participation_id, field, base_revision, server_revision, client_value, server_value, resolved, user_id, created_at)
              VALUES (?, ?, 'note', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            `).bind(conflict.id, edit.campaignId, note.id, edit.participationId, edit.field, conflict.baseRevision, conflict.serverRevision, JSON.stringify(conflict.clientValue), JSON.stringify(conflict.serverValue), actor.id, now).run();
            continue;
          }
          await env.DB.prepare("UPDATE notes SET data = ?, revision = COALESCE(revision, 1) + 1, updated_at = ? WHERE id = ?").bind(String(edit.value), now, note.id).run();
          syncedIds.push(edit.id);
        } else {
          syncedIds.push(edit.id);
        }
      } else {
        const part = await env.DB.prepare("SELECT * FROM character_participations WHERE id = ?").bind(edit.participationId).first();
        if (!part) {
          syncedIds.push(edit.id);
          continue;
        }
        const serverObj = {
          revision: Number(part.revision) || 1,
          currentHp: Number(part.current_hp),
          tempHp: Number(part.temp_hp),
          inventory: parseBlob(part.inventory, []),
          customResources: parseBlob(part.custom_resources, [])
        };
        const conflict = detectConflict(edit, serverObj);
        if (conflict) {
          conflicts.push(conflict);
          await env.DB.prepare(`
            INSERT INTO sync_conflicts (id, campaign_id, entity_type, entity_id, participation_id, field, base_revision, server_revision, client_value, server_value, resolved, user_id, created_at)
            VALUES (?, ?, 'character_participation', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
          `).bind(conflict.id, edit.campaignId, part.id, edit.participationId, edit.field, conflict.baseRevision, conflict.serverRevision, JSON.stringify(conflict.clientValue), JSON.stringify(conflict.serverValue), actor.id, now).run();
          continue;
        }
        if (edit.field === "currentHp") {
          await env.DB.prepare("UPDATE character_participations SET current_hp = ?, revision = COALESCE(revision, 1) + 1, updated_at = ? WHERE id = ?").bind(Number(edit.value), now, part.id).run();
        } else if (edit.field === "tempHp") {
          await env.DB.prepare("UPDATE character_participations SET temp_hp = ?, revision = COALESCE(revision, 1) + 1, updated_at = ? WHERE id = ?").bind(Number(edit.value), now, part.id).run();
        } else if (edit.field === "inventory") {
          await env.DB.prepare("UPDATE character_participations SET inventory = ?, revision = COALESCE(revision, 1) + 1, updated_at = ? WHERE id = ?").bind(JSON.stringify(edit.value), now, part.id).run();
        } else if (edit.field === "customResources") {
          await env.DB.prepare("UPDATE character_participations SET custom_resources = ?, revision = COALESCE(revision, 1) + 1, updated_at = ? WHERE id = ?").bind(JSON.stringify(edit.value), now, part.id).run();
        }
        syncedIds.push(edit.id);
      }
    }
    return json({ syncedIds, conflicts });
  }
  if (path.startsWith("/sync/conflicts/") && path.endsWith("/resolve") && method === "POST") {
    const parts = path.split("/");
    const conflictId = parts[3];
    const body = await request.json();
    const resolution = body.resolution === "server" ? "server" : "client";
    const row = await env.DB.prepare("SELECT * FROM sync_conflicts WHERE id = ?").bind(conflictId).first();
    if (row && resolution === "client") {
      const clientVal = JSON.parse(row.client_value);
      if (row.entity_type === "character_participation") {
        if (row.field === "currentHp") {
          await env.DB.prepare("UPDATE character_participations SET current_hp = ?, revision = COALESCE(revision, 1) + 1, updated_at = ? WHERE id = ?").bind(Number(clientVal), now, row.entity_id).run();
        } else if (row.field === "tempHp") {
          await env.DB.prepare("UPDATE character_participations SET temp_hp = ?, revision = COALESCE(revision, 1) + 1, updated_at = ? WHERE id = ?").bind(Number(clientVal), now, row.entity_id).run();
        } else if (row.field === "inventory") {
          await env.DB.prepare("UPDATE character_participations SET inventory = ?, revision = COALESCE(revision, 1) + 1, updated_at = ? WHERE id = ?").bind(JSON.stringify(clientVal), now, row.entity_id).run();
        } else if (row.field === "customResources") {
          await env.DB.prepare("UPDATE character_participations SET custom_resources = ?, revision = COALESCE(revision, 1) + 1, updated_at = ? WHERE id = ?").bind(JSON.stringify(clientVal), now, row.entity_id).run();
        }
      }
    }
    await env.DB.prepare("UPDATE sync_conflicts SET resolved = 1, resolution = ?, resolved_at = ? WHERE id = ?").bind(resolution, now, conflictId).run();
    return json({ success: true });
  }
  if (path === "/sync/conflicts" && method === "GET") {
    const campId = url.searchParams.get("campaignId");
    let q = "SELECT * FROM sync_conflicts WHERE resolved = 0";
    const params = [];
    if (campId) {
      q += " AND campaign_id = ?";
      params.push(campId);
    }
    const rows = await env.DB.prepare(q).bind(...params).all();
    const conflicts = (rows.results || []).map((r) => ({
      id: r.id,
      editId: r.id,
      campaignId: r.campaign_id,
      participationId: r.participation_id,
      field: r.field,
      fieldLabelFa: getFieldLabelFa(r.field),
      clientValue: parseBlob(r.client_value, r.client_value),
      serverValue: parseBlob(r.server_value, r.server_value),
      baseRevision: Number(r.base_revision),
      serverRevision: Number(r.server_revision),
      timestamp: Number(r.created_at),
      resolved: false
    }));
    return json(conflicts);
  }
  if (path === "/account/export" && method === "GET") {
    const userRes = await env.DB.prepare("SELECT id, email, display_name, created_at, avatar_url FROM users WHERE id = ?").bind(actor.id).first();
    const charactersRes = await env.DB.prepare("SELECT * FROM characters WHERE owner_id = ? AND deleted_at IS NULL").bind(actor.id).all();
    const characters = (charactersRes.results || []).map((c) => ({
      ...c,
      data: parseBlob(c.data, {})
    }));
    const charIds = characters.map((c) => c.id);
    let participations = [];
    if (charIds.length > 0) {
      const pRes = await env.DB.prepare(`SELECT * FROM character_participations WHERE character_id IN (${charIds.map(() => "?").join(",")})`).bind(...charIds).all();
      participations = (pRes.results || []).map((p) => ({
        ...p,
        inventory: parseBlob(p.inventory, []),
        currency: parseBlob(p.currency, {}),
        customResources: parseBlob(p.custom_resources, []),
        preparedSpells: parseBlob(p.prepared_spells, []),
        deathSaves: parseBlob(p.death_saves, {})
      }));
    }
    const notesRes = await env.DB.prepare("SELECT * FROM notes WHERE author_id = ?").bind(actor.id).all();
    const diceRes = await env.DB.prepare("SELECT * FROM dice_rolls WHERE user_id = ? ORDER BY created_at DESC LIMIT 200").bind(actor.id).all();
    const diceHistory = (diceRes.results || []).map((d) => ({
      ...d,
      rolls: parseBlob(d.rolls, {})
    }));
    let sessionsAttended = [];
    const partIds = participations.map((p) => p.id);
    if (partIds.length > 0) {
      const attRes = await env.DB.prepare(`SELECT * FROM session_attendance WHERE participation_id IN (${partIds.map(() => "?").join(",")})`).bind(...partIds).all();
      sessionsAttended = attRes.results || [];
    }
    const recapsRes = await env.DB.prepare("SELECT * FROM session_recaps WHERE author_id = ?").bind(actor.id).all();
    const exportData = {
      user: userRes,
      characters,
      characterParticipations: participations,
      notes: notesRes.results || [],
      diceHistory,
      sessionsAttended,
      recapDrafts: recapsRes.results || [],
      exportedAt: Date.now()
    };
    await audit("account_export", actor.id);
    return json(exportData);
  }
  if (path === "/account/delete" && method === "POST") {
    const body = await request.json();
    const rawPassword = String(body.password || "");
    const mode = body.mode === "remove_all" ? "remove_all" : "anonymize";
    const userRow = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(actor.id).first();
    if (!userRow) return error("\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const validPass = await verifyPassword(rawPassword, userRow.password_hash);
    if (!validPass) {
      return error("\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0641\u0639\u0644\u06CC \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A.", 400);
    }
    const t = Date.now();
    if (mode === "anonymize") {
      const anonEmail = `deleted-user-${actor.id.substring(0, 8)}@anonymized.local`;
      await env.DB.prepare(
        `UPDATE users SET email = ?, display_name = '\u06A9\u0627\u0631\u0628\u0631 \u062D\u0630\u0641\u200C\u0634\u062F\u0647', password_hash = 'REDACTED', status = 'disabled', deleted_at = ? WHERE id = ?`
      ).bind(anonEmail, t, actor.id).run();
    } else {
      await env.DB.prepare(
        `UPDATE users SET status = 'disabled', deleted_at = ? WHERE id = ?`
      ).bind(t, actor.id).run();
      await env.DB.prepare("UPDATE characters SET deleted_at = ? WHERE owner_id = ?").bind(t, actor.id).run();
    }
    const ownedCampaigns = await env.DB.prepare('SELECT id FROM campaigns WHERE owner_id = ? AND status != "archived"').bind(actor.id).all();
    for (const c of ownedCampaigns.results || []) {
      const cid = c.id;
      const coDm = await env.DB.prepare('SELECT user_id FROM campaign_members WHERE campaign_id = ? AND role = "co_dm" AND status = "active" LIMIT 1').bind(cid).first();
      if (coDm) {
        await env.DB.prepare("UPDATE campaigns SET owner_id = ?, updated_at = ? WHERE id = ?").bind(coDm.user_id, t, cid).run();
        await env.DB.prepare('UPDATE campaign_members SET role = "owner" WHERE campaign_id = ? AND user_id = ?').bind(cid, coDm.user_id).run();
      } else {
        await env.DB.prepare('UPDATE campaigns SET status = "archived", updated_at = ? WHERE id = ?').bind(t, cid).run();
      }
    }
    await env.DB.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?").bind(t, actor.id).run();
    await audit("account_deleted", actor.id, { mode });
    return json({ success: true, mode }, 200, { "Set-Cookie": clearSessionCookie() });
  }
  if (path.match(/^\/c\/[^/]+\/audit-log$/) && method === "GET") {
    const cId = path.split("/")[2];
    const myRole = await getMembershipRole(cId, actor.id);
    if (!myRole && !isPlatformAdmin()) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (myRole !== "owner" && myRole !== "co_dm" && !isPlatformAdmin()) {
      return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u06CC\u0627 \u0645\u062F\u06CC\u0631 \u06A9\u0645\u067E\u06CC\u0646 \u0628\u0647 \u0644\u0627\u06AF \u0639\u0645\u0644\u06CC\u0627\u062A \u062F\u0633\u062A\u0631\u0633\u06CC \u062F\u0627\u0631\u062F.", 403);
    }
    const limitParam = Math.min(200, Math.max(10, Number(url.searchParams.get("limit") || 50)));
    const logs = await env.DB.prepare(
      `SELECT a.id, a.actor_id, a.action, a.target_id, a.meta, a.created_at, u.display_name as actor_name
       FROM audit_log a
       LEFT JOIN users u ON a.actor_id = u.id
       WHERE a.target_id = ? OR a.meta LIKE ?
       ORDER BY a.created_at DESC LIMIT ?`
    ).bind(cId, `%${cId}%`, limitParam).all();
    const items = (logs.results || []).map((l) => ({
      id: l.id,
      actorId: l.actor_id,
      actorName: l.actor_name || "\u0633\u06CC\u0633\u062A\u0645",
      action: l.action,
      targetId: l.target_id,
      meta: parseBlob(l.meta, void 0),
      createdAt: Number(l.created_at)
    }));
    return json(items);
  }
  if (path === "/admin/users" && method === "GET") {
    if (!isPlatformAdmin()) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const usersRes = await env.DB.prepare(`
      SELECT u.id, u.email, u.display_name, u.role, u.platform_role, u.status, u.must_change_password, u.created_at, u.last_login_at,
             (SELECT COUNT(*) FROM campaign_members cm WHERE cm.user_id = u.id AND cm.status = 'active') AS campaigns_count,
             (SELECT COALESCE(SUM(size_bytes), 0) FROM media m WHERE m.owner_id = u.id) AS storage_used_bytes
      FROM users u
      WHERE u.deleted_at IS NULL
      ORDER BY u.created_at DESC
    `).all();
    const list = (usersRes.results || []).map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      role: u.role,
      platformRole: u.platform_role || "user",
      status: u.status,
      mustChangePassword: u.must_change_password === 1,
      createdAt: Number(u.created_at),
      lastLoginAt: u.last_login_at ? Number(u.last_login_at) : null,
      campaignsCount: Number(u.campaigns_count || 0),
      storageUsedBytes: Number(u.storage_used_bytes || 0)
    }));
    return json(list);
  }
  if (path.match(/^\/admin\/users\/[^/]+\/toggle-status$/) && method === "POST") {
    if (!isPlatformAdmin()) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const targetUid = path.split("/")[3];
    if (targetUid === actor.id) return error("\u0627\u0645\u06A9\u0627\u0646 \u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A \u062D\u0633\u0627\u0628 \u062E\u0648\u062F\u062A\u0627\u0646 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.");
    const target = await env.DB.prepare("SELECT id, status FROM users WHERE id = ?").bind(targetUid).first();
    if (!target) return error("\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const nextStatus = target.status === "active" ? "disabled" : "active";
    await env.DB.prepare("UPDATE users SET status = ? WHERE id = ?").bind(nextStatus, targetUid).run();
    if (nextStatus === "disabled") {
      await env.DB.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?").bind(now, targetUid).run();
    }
    await audit("admin_toggle_user_status", targetUid, { newStatus: nextStatus });
    return json({ success: true, newStatus: nextStatus });
  }
  if (path.match(/^\/admin\/users\/[^/]+\/reset-link$/) && method === "POST") {
    if (!isPlatformAdmin()) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const targetUid = path.split("/")[3];
    const target = await env.DB.prepare("SELECT id, email, display_name FROM users WHERE id = ? AND deleted_at IS NULL").bind(targetUid).first();
    if (!target) return error("\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const token = generateRandomToken(32);
    const tokenHash = await sha256Hex(token);
    const expiresAt = now + 24 * 3600 * 1e3;
    await env.DB.prepare(
      "INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(`reset-${Date.now()}-${generateRandomToken(4)}`, targetUid, tokenHash, expiresAt, now).run();
    await audit("admin_generate_reset_link", targetUid);
    return json({ token, resetUrl: `/reset?token=${token}` });
  }
  if (path.match(/^\/admin\/users\/[^/]+\/revoke-sessions$/) && method === "POST") {
    if (!isPlatformAdmin()) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const targetUid = path.split("/")[3];
    const res = await env.DB.prepare("UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL").bind(now, targetUid).run();
    const count = res?.meta?.changes || res?.changes || 0;
    await audit("admin_revoke_sessions", targetUid, { count });
    return json({ success: true, revokedCount: count });
  }
  if (path === "/admin/campaigns" && method === "GET") {
    if (!isPlatformAdmin()) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const campsRes = await env.DB.prepare(`
      SELECT c.id, c.name, c.owner_id, c.status, c.created_at, c.updated_at,
             u.display_name AS owner_name, u.email AS owner_email,
             (SELECT COUNT(*) FROM campaign_members cm WHERE cm.campaign_id = c.id AND cm.status = 'active') AS member_count,
             (SELECT COALESCE(SUM(size_bytes), 0) FROM media m WHERE m.campaign_id = c.id) AS storage_used_bytes
      FROM campaigns c
      LEFT JOIN users u ON c.owner_id = u.id
      ORDER BY c.updated_at DESC
    `).all();
    const list = (campsRes.results || []).map((c) => ({
      id: c.id,
      name: c.name,
      ownerId: c.owner_id,
      ownerName: c.owner_name || "\u0646\u0627\u0645\u0634\u062E\u0635",
      ownerEmail: c.owner_email || "",
      status: c.status,
      memberCount: Number(c.member_count || 0),
      storageUsedBytes: Number(c.storage_used_bytes || 0),
      createdAt: Number(c.created_at),
      updatedAt: Number(c.updated_at),
      lastActivityAt: Number(c.updated_at)
    }));
    return json(list);
  }
  if (path.match(/^\/admin\/campaigns\/[^/]+\/archive$/) && method === "POST") {
    if (!isPlatformAdmin()) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const cId = path.split("/")[3];
    await env.DB.prepare("UPDATE campaigns SET status = 'archived', updated_at = ? WHERE id = ?").bind(now, cId).run();
    await audit("admin_archive_campaign", cId);
    return json({ success: true });
  }
  if (path.match(/^\/admin\/campaigns\/[^/]+\/restore$/) && method === "POST") {
    if (!isPlatformAdmin()) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const cId = path.split("/")[3];
    await env.DB.prepare("UPDATE campaigns SET status = 'active', updated_at = ? WHERE id = ?").bind(now, cId).run();
    await audit("admin_restore_campaign", cId);
    return json({ success: true });
  }
  if (path === "/admin/settings" && method === "GET") {
    if (!isPlatformAdmin()) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const row = await env.DB.prepare('SELECT * FROM instance_settings WHERE id = "default"').first();
    const settings = {
      allowCampaignCreation: row ? Number(row.allow_campaign_creation) === 1 : true,
      registrationMode: row?.registration_mode || "invite",
      perUserMediaQuotaBytes: row ? Number(row.per_user_media_quota_bytes) : 5 * 1024 * 1024,
      perCampaignMediaQuotaBytes: row ? Number(row.per_campaign_media_quota_bytes) : 20 * 1024 * 1024,
      storageWarningThresholdBytes: row ? Number(row.storage_warning_threshold_bytes) : 800 * 1024 * 1024
    };
    return json(settings);
  }
  if (path === "/admin/settings" && method === "PUT") {
    if (!isPlatformAdmin()) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    const allowCamp = body.allowCampaignCreation !== false ? 1 : 0;
    const regMode = body.registrationMode === "open" ? "open" : "invite";
    const userQuota = Number(body.perUserMediaQuotaBytes) || 5 * 1024 * 1024;
    const campQuota = Number(body.perCampaignMediaQuotaBytes) || 20 * 1024 * 1024;
    const warnThreshold = Number(body.storageWarningThresholdBytes) || 800 * 1024 * 1024;
    await env.DB.prepare(`
      INSERT INTO instance_settings (id, allow_campaign_creation, registration_mode, per_user_media_quota_bytes, per_campaign_media_quota_bytes, storage_warning_threshold_bytes, updated_at)
      VALUES ('default', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        allow_campaign_creation = excluded.allow_campaign_creation,
        registration_mode = excluded.registration_mode,
        per_user_media_quota_bytes = excluded.per_user_media_quota_bytes,
        per_campaign_media_quota_bytes = excluded.per_campaign_media_quota_bytes,
        storage_warning_threshold_bytes = excluded.storage_warning_threshold_bytes,
        updated_at = excluded.updated_at
    `).bind(allowCamp, regMode, userQuota, campQuota, warnThreshold, now).run();
    await audit("admin_update_settings", "default", body);
    return json({
      allowCampaignCreation: allowCamp === 1,
      registrationMode: regMode,
      perUserMediaQuotaBytes: userQuota,
      perCampaignMediaQuotaBytes: campQuota,
      storageWarningThresholdBytes: warnThreshold
    });
  }
  if (path === "/admin/storage" && method === "GET") {
    if (!isPlatformAdmin()) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const tablesToCount = [
      { table: "media", labelFa: "\u062A\u0635\u0627\u0648\u06CC\u0631 \u0648 \u0631\u0633\u0627\u0646\u0647\u200C\u0647\u0627", estBytes: 15e4 },
      { table: "character_participations", labelFa: "\u0645\u0634\u0627\u0631\u06A9\u062A\u200C\u0647\u0627\u06CC \u0634\u062E\u0635\u06CC\u062A\u200C\u0647\u0627", estBytes: 8192 },
      { table: "characters", labelFa: "\u0647\u0648\u06CC\u062A \u0634\u062E\u0635\u06CC\u062A\u200C\u0647\u0627", estBytes: 4096 },
      { table: "encounters", labelFa: "\u0646\u0628\u0631\u062F\u0647\u0627 \u0648 \u0645\u0628\u0627\u0631\u0632\u0627\u062A", estBytes: 6144 },
      { table: "encounter_events", labelFa: "\u0631\u0648\u06CC\u062F\u0627\u062F\u0647\u0627\u06CC \u0646\u0628\u0631\u062F", estBytes: 512 },
      { table: "campaigns", labelFa: "\u06A9\u0645\u067E\u06CC\u0646\u200C\u0647\u0627", estBytes: 4096 },
      { table: "sessions", labelFa: "\u062C\u0644\u0633\u0627\u062A \u0628\u0627\u0632\u06CC", estBytes: 2048 },
      { table: "handouts", labelFa: "\u062F\u0633\u062A\u200C\u0646\u0648\u0634\u062A\u0647\u200C\u0647\u0627 \u0648 \u0646\u0642\u0634\u0647\u200C\u0647\u0627", estBytes: 2048 },
      { table: "notes", labelFa: "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A\u200C\u0647\u0627", estBytes: 2048 },
      { table: "audit_log", labelFa: "\u0644\u0627\u06AF \u0639\u0645\u0644\u06CC\u0627\u062A \u0648 \u0627\u0645\u0646\u06CC\u062A", estBytes: 512 },
      { table: "dice_rolls", labelFa: "\u062A\u0627\u0631\u06CC\u062E\u0686\u0647 \u062A\u0627\u0633\u200C\u0647\u0627", estBytes: 512 },
      { table: "notifications", labelFa: "\u0627\u0639\u0644\u0627\u0646\u200C\u0647\u0627", estBytes: 512 },
      { table: "auth_sessions", labelFa: "\u0646\u0634\u0633\u062A\u200C\u0647\u0627\u06CC \u0641\u0639\u0627\u0644 \u06A9\u0627\u0631\u0628\u0631\u0627\u0646", estBytes: 512 }
    ];
    const tablesInfo = [];
    let totalBytes = 0;
    for (const t of tablesToCount) {
      let count = 0;
      try {
        if (t.table === "media") {
          const sumRow = await env.DB.prepare("SELECT COUNT(*) as c, COALESCE(SUM(size_bytes), 0) as s FROM media").first();
          count = Number(sumRow?.c || 0);
          const actualBytes = Number(sumRow?.s || 0);
          tablesInfo.push({
            table: t.table,
            labelFa: t.labelFa,
            count,
            estimatedBytes: actualBytes
          });
          totalBytes += actualBytes;
          continue;
        } else {
          const cRow = await env.DB.prepare(`SELECT COUNT(*) as c FROM ${t.table}`).first();
          count = Number(cRow?.c || 0);
        }
      } catch {
      }
      const bytes = count * t.estBytes;
      totalBytes += bytes;
      tablesInfo.push({
        table: t.table,
        labelFa: t.labelFa,
        count,
        estimatedBytes: bytes
      });
    }
    const setRow = await env.DB.prepare('SELECT storage_warning_threshold_bytes FROM instance_settings WHERE id = "default"').first();
    const thresholdBytes = setRow ? Number(setRow.storage_warning_threshold_bytes) : 800 * 1024 * 1024;
    const isOverThreshold = totalBytes >= thresholdBytes;
    const warningPercent = Math.min(100, Math.round(totalBytes / thresholdBytes * 100));
    return json({
      tables: tablesInfo,
      totalBytes,
      thresholdBytes,
      isOverThreshold,
      warningPercent
    });
  }
  if (path === "/admin/cleanup" && method === "POST") {
    if (!isPlatformAdmin()) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    const dryRun = body.dryRun !== false;
    const expiredSessionsRow = await env.DB.prepare("SELECT COUNT(*) as c FROM auth_sessions WHERE expires_at < ? OR revoked_at IS NOT NULL").bind(now).first();
    const expiredSessions = Number(expiredSessionsRow?.c || 0);
    const expiredResetsRow = await env.DB.prepare("SELECT COUNT(*) as c FROM password_resets WHERE expires_at < ? OR used_at IS NOT NULL").bind(now).first();
    const oldPasswordResets = Number(expiredResetsRow?.c || 0);
    const expiredInvitesRow = await env.DB.prepare("SELECT COUNT(*) as c FROM campaign_invites WHERE (expires_at > 0 AND expires_at < ?) OR used_count >= max_uses OR revoked_at IS NOT NULL").bind(now).first();
    const expiredInvites = Number(expiredInvitesRow?.c || 0);
    const oldLoginAttemptsRow = await env.DB.prepare("SELECT COUNT(*) as c FROM rate_limits WHERE window_start < ?").bind(now - 24 * 3600 * 1e3).first();
    const oldLoginAttempts = Number(oldLoginAttemptsRow?.c || 0);
    let orphanMedia = 0;
    try {
      const orphanRow = await env.DB.prepare(`
        SELECT COUNT(*) as c FROM media m
        WHERE m.id NOT IN (SELECT media_id FROM handouts WHERE media_id IS NOT NULL)
          AND m.id NOT IN (SELECT avatar_media_id FROM users WHERE avatar_media_id IS NOT NULL)
          AND m.id NOT IN (SELECT cover_media_id FROM campaigns WHERE cover_media_id IS NOT NULL)
          AND m.campaign_id IS NULL
          AND m.created_at < ?
      `).bind(now - 3600 * 1e3).first();
      orphanMedia = Number(orphanRow?.c || 0);
    } catch {
    }
    const counts = {
      orphanMedia,
      expiredInvites,
      expiredSessions,
      oldLoginAttempts,
      oldPasswordResets
    };
    const cleanedTotal = orphanMedia + expiredInvites + expiredSessions + oldLoginAttempts + oldPasswordResets;
    if (!dryRun) {
      await env.DB.prepare("DELETE FROM auth_sessions WHERE expires_at < ? OR revoked_at IS NOT NULL").bind(now).run();
      await env.DB.prepare("DELETE FROM password_resets WHERE expires_at < ? OR used_at IS NOT NULL").bind(now).run();
      await env.DB.prepare("DELETE FROM campaign_invites WHERE (expires_at > 0 AND expires_at < ?) OR used_count >= max_uses OR revoked_at IS NOT NULL").bind(now).run();
      await env.DB.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(now - 24 * 3600 * 1e3).run();
      try {
        await env.DB.prepare(`
          DELETE FROM media
          WHERE id NOT IN (SELECT media_id FROM handouts WHERE media_id IS NOT NULL)
            AND id NOT IN (SELECT avatar_media_id FROM users WHERE avatar_media_id IS NOT NULL)
            AND id NOT IN (SELECT cover_media_id FROM campaigns WHERE cover_media_id IS NOT NULL)
            AND campaign_id IS NULL
            AND created_at < ?
        `).bind(now - 3600 * 1e3).run();
      } catch {
      }
      await audit("admin_cleanup_run", "system", { counts, cleanedTotal });
    }
    return json({
      dryRun,
      counts,
      executedAt: Date.now(),
      cleanedTotal
    });
  }
  return error(`\u0645\u0633\u06CC\u0631\u06CC \u0628\u0627 \u0645\u0634\u062E\u0635\u0627\u062A ${method} ${path} \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.`, 404);
}, "onRequest");

// ../.wrangler/tmp/pages-anckPm/functionsRoutes-0.6870153819938583.mjs
var routes = [
  {
    routePath: "/api/:route*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// C:/Users/e.ghosi/AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// C:/Users/e.ghosi/AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Centralized Role-Based Access Control (RBAC) Module for DungeonYar.
 * Defines roles across Platform and Campaign layers, the permission matrix,
 * evaluation helpers, role transitions, and response filtering rules.
 * Used by both Cloudflare Pages Functions and the React client.
 */
