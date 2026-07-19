export type TranslationCatalog = Readonly<Record<string, string>>;

export function mergeCatalogSections(...sections: TranslationCatalog[]): TranslationCatalog {
  const catalog: Record<string, string> = {};
  for (const section of sections) {
    for (const [key, value] of Object.entries(section)) {
      if (Object.prototype.hasOwnProperty.call(catalog, key)) {
        throw new Error(`Duplicate translation key: ${key}`);
      }
      catalog[key] = value;
    }
  }
  return catalog;
}
