import { buildPageTitle, buildManifest } from '../../shared/branding.ts';

/**
 * Platform branding constants and title helper for the application.
 * This file is the SINGLE SOURCE OF TRUTH for platform branding.
 * Source files must import from here and NEVER hardcode the brand strings.
 */

export const APP_NAME_FA = 'دانجنیار';
export const APP_NAME_LATIN = 'DungeonYar';
export const APP_SHORT_NAME = 'دانجنیار'; // Maximum 12 characters for PWA
export const APP_TAGLINE = 'پلتفرم همراه نقش‌آفرینی رومیزی D&D 5e و جهان‌های سفارشی';

export function pageTitle(page?: string): string {
  return buildPageTitle(APP_NAME_FA, APP_NAME_LATIN, page);
}

export function getAppManifest() {
  return buildManifest(APP_NAME_FA, APP_SHORT_NAME, APP_TAGLINE);
}
