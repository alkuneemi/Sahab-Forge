export type Lang = "ar" | "en";

/** A flat dictionary of translation keys for a single language. */
export type Dictionary = Record<string, string>;

/** One package of translations for both supported languages. */
export type TranslationPack = Record<Lang, Dictionary>;
