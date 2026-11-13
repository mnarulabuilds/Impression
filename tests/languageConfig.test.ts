import { describe, expect, it } from "vitest";
import {
  getAllLanguageCodes,
  getFillerWords,
  getLanguageConfig,
  getSpeechRecognitionLang,
  isRTL,
} from "../config/languageConfig";

describe("language configuration", () => {
  it("lists supported language codes and resolves speech recognition locales", () => {
    expect(getAllLanguageCodes()).toContain("en");
    expect(getSpeechRecognitionLang("ja")).toBe("ja-JP");
  });

  it("uses English as a fallback for unknown language codes", () => {
    expect(getLanguageConfig("unknown")).toEqual(getLanguageConfig("en"));
    expect(getFillerWords("unknown")).toEqual(getFillerWords("en"));
  });

  it("identifies right-to-left languages", () => {
    expect(isRTL("ar")).toBe(true);
    expect(isRTL("en")).toBe(false);
    expect(isRTL("unknown")).toBe(false);
  });
});
