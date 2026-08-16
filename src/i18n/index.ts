import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { zhCN } from "./locales/zh-CN";

export const SUPPORTED_LANGS = ["en", "zh-CN"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const STORAGE_KEY = "meilisearch-lang";

/** 只接受我们支持的两种语言，其他一律回退英文 */
function normalizeLang(detected: string | undefined | null): string {
  if (!detected) return "en";
  if (detected.startsWith("zh")) return "zh-CN";
  if (detected.startsWith("en")) return "en";
  return "en";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      "zh-CN": { translation: zhCN },
    },
    lng: normalizeLang(localStorage.getItem(STORAGE_KEY)),
    fallbackLng: "en",
    supportedLngs: [...SUPPORTED_LANGS],
    interpolation: { escapeValue: false },
    detection: {
      // 顺序：本地存储 → 浏览器语言 → 英文
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: STORAGE_KEY,
    },
    react: { useSuspense: false },
  });

// 同步 <html lang> 属性（无障碍/拼写检查/翻译插件依赖它）
const applyHtmlLang = (lng: string) => {
  document.documentElement.lang = normalizeLang(lng);
};
i18n.on("languageChanged", applyHtmlLang);
applyHtmlLang(i18n.language ?? "en");

export const changeLanguage = (lang: SupportedLang) => {
  void i18n.changeLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
};

export default i18n;
