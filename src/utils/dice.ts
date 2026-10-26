import { DiceRollResult } from '../types';

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  if (mod > 0) return `+${mod}`;
  if (mod < 0) return `${mod}`;
  return '+0';
}

export function getProficiencyBonus(level: number): number {
  return Math.ceil(1 + (level || 1) / 4);
}

export function rollDice(
  count: number,
  sides: number,
  modifier: number = 0,
  advantage?: 'adv' | 'dis',
  label: string = 'تاس'
): DiceRollResult {
  const rolls: number[] = [];

  if (advantage === 'adv' || advantage === 'dis') {
    // 2d20 roll
    const r1 = Math.floor(Math.random() * sides) + 1;
    const r2 = Math.floor(Math.random() * sides) + 1;
    rolls.push(r1, r2);
    const chosen = advantage === 'adv' ? Math.max(r1, r2) : Math.min(r1, r2);
    const total = chosen + modifier;
    return {
      id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      label,
      diceCount: count,
      diceSides: sides,
      rolls,
      modifier,
      advantage,
      total,
      isCritical: chosen === 20 && sides === 20,
      isFumble: chosen === 1 && sides === 20
    };
  }

  let sum = 0;
  for (let i = 0; i < count; i++) {
    const val = Math.floor(Math.random() * sides) + 1;
    rolls.push(val);
    sum += val;
  }

  const total = sum + modifier;

  return {
    id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    label,
    diceCount: count,
    diceSides: sides,
    rolls,
    modifier,
    total,
    isCritical: count === 1 && sides === 20 && rolls[0] === 20,
    isFumble: count === 1 && sides === 20 && rolls[0] === 1
  };
}
