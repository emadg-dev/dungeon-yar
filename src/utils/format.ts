/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Formatting utilities for platform
 * Guarantees standard English/Latin digits across all UI elements.
 */

/**
 * Converts any Persian (0-9) or Arabic (0-9) digits to standard Latin digits (0-9).
 */
export function toEnglishDigits(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return '';
  const pDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const aDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let s = String(val);
  for (let i = 0; i < 10; i++) {
    s = s.replaceAll(pDigits[i], String(i)).replaceAll(aDigits[i], String(i));
  }
  return s;
}

/**
 * Formats a solar date using English numerals (e.g., 1403/8/10).
 */
export function formatSolarDate(date: string | number | Date): string {
  try {
    return new Date(date).toLocaleDateString('fa-IR-u-nu-latn');
  } catch {
    return String(date);
  }
}

/**
 * Formats a timestamp with English numerals (e.g., 14:32:05).
 */
export function formatTime(
  date: string | number | Date,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
  try {
    return new Date(date).toLocaleTimeString('fa-IR-u-nu-latn', options);
  } catch {
    return String(date);
  }
}

/**
 * Formats full date and time with English numerals.
 */
export function formatDateTime(date: string | number | Date): string {
  try {
    return `${formatSolarDate(date)} ${formatTime(date)}`;
  } catch {
    return String(date);
  }
}
