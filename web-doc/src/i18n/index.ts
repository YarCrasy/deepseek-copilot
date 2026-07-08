import { changelog as enChangelog } from "./en/changelog";
import { intro as enIntro } from "./en/intro";
import { overview as enOverview } from "./en/overview";
import { references as enReferences } from "./en/references";
import { technicalDecisions as enTechnicalDecisions } from "./en/technical-decisions";
import { userManual as enUserManual } from "./en/user-manual";
import { changelog as esChangelog } from "./es/changelog";
import { intro as esIntro } from "./es/intro";
import { overview as esOverview } from "./es/overview";
import { references as esReferences } from "./es/references";
import { technicalDecisions as esTechnicalDecisions } from "./es/technical-decisions";
import { userManual as esUserManual } from "./es/user-manual";
import type { OverviewContent, PageContent, PageSlug } from "./types";
import { changelog as zhChangelog } from "./zh/changelog";
import { intro as zhIntro } from "./zh/intro";
import { overview as zhOverview } from "./zh/overview";
import { references as zhReferences } from "./zh/references";
import { technicalDecisions as zhTechnicalDecisions } from "./zh/technical-decisions";
import { userManual as zhUserManual } from "./zh/user-manual";

export const languages = ["en", "es", "zh"] as const;

export type Language = (typeof languages)[number];
export type { OverviewContent, PageContent, PageSlug };

export const languageLabels: Record<Language, string> = {
  en: "English",
  es: "Español",
  zh: "中文",
};

export const pageSlugs = ["intro", "changelog", "references", "technical-decisions", "user-manual"] as const satisfies readonly PageSlug[];

export const homeContent: Record<Language, OverviewContent> = {
  en: enOverview,
  es: esOverview,
  zh: zhOverview,
};

export const pageContent: Record<Language, Record<PageSlug, PageContent>> = {
  en: {
    intro: enIntro,
    changelog: enChangelog,
    references: enReferences,
    "technical-decisions": enTechnicalDecisions,
    "user-manual": enUserManual,
  },
  es: {
    intro: esIntro,
    changelog: esChangelog,
    references: esReferences,
    "technical-decisions": esTechnicalDecisions,
    "user-manual": esUserManual,
  },
  zh: {
    intro: zhIntro,
    changelog: zhChangelog,
    references: zhReferences,
    "technical-decisions": zhTechnicalDecisions,
    "user-manual": zhUserManual,
  },
};

export const navLabels: Record<Language, Record<PageSlug, string>> = Object.fromEntries(
  languages.map((lang) => [
    lang,
    Object.fromEntries(pageSlugs.map((slug) => [slug, pageContent[lang][slug].navTitle])) as Record<PageSlug, string>,
  ]),
) as Record<Language, Record<PageSlug, string>>;

export function isLanguage(value: string | undefined): value is Language {
  return languages.includes(value as Language);
}

function sitePath(path = ""): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.replace(/^\//, "");
  return normalizedPath ? `${base}/${normalizedPath}` : `${base}/`;
}

export function docsPath(lang: Language, slug?: PageSlug): string {
  return sitePath(slug ? `${lang}/${slug}/` : `${lang}/`);
}

export function anchorId(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
