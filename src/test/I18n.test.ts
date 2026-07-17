import * as assert from "assert";
import { detectUiLocale, translateForLocale } from "@/ui/i18n/I18n";

suite("webview internationalization", () => {
  test("detects supported locales and falls back to English", () => {
    assert.strictEqual(detectUiLocale("es-ES"), "es");
    assert.strictEqual(detectUiLocale("zh-CN"), "zh");
    assert.strictEqual(detectUiLocale("fr-FR"), "en");
  });

  test("translates messages and interpolates named values", () => {
    assert.strictEqual(translateForLocale("es", "Page {page} of {pages} · {count} conversations", { page: 2, pages: 4, count: 80 }), "Página 2 de 4 · 80 conversaciones");
    assert.strictEqual(translateForLocale("zh", "Copy {tool} data", { tool: "read_file" }), "复制 read_file 数据");
  });

  test("keeps unknown messages as an English fallback", () => {
    assert.strictEqual(translateForLocale("es", "Unregistered provider message"), "Unregistered provider message");
  });
});
