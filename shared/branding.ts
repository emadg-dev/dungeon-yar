export interface WebManifestConfig {
  id: string;
  name: string;
  short_name: string;
  description: string;
  theme_color: string;
  background_color: string;
  display: string;
  dir: string;
  lang: string;
  start_url: string;
  scope: string;
}

export function isValidShortName(shortName: string): boolean {
  return typeof shortName === 'string' && shortName.length > 0 && shortName.length <= 12;
}

export function buildPageTitle(nameFa: string, nameLatin: string, page?: string): string {
  if (!page || !page.trim()) {
    return `${nameFa} | ${nameLatin}`;
  }
  return `${page.trim()} | ${nameFa}`;
}

export function buildManifest(
  name: string,
  shortName: string,
  description: string
): Partial<WebManifestConfig> {
  if (!isValidShortName(shortName)) {
    throw new Error(`Short name must be <= 12 characters, got ${shortName.length}`);
  }
  return {
    id: '/',
    name,
    short_name: shortName,
    description,
    theme_color: '#0E0D0C',
    background_color: '#0E0D0C',
    display: 'standalone',
    dir: 'rtl',
    lang: 'fa',
    start_url: '/',
    scope: '/',
  };
}
