import * as assert from "assert";
import { detectUiLocale, getUiLocale, setInterfaceLanguage, subscribeUiLocale, translateForLocale } from "@/ui/i18n/I18n";
import { en } from "@/ui/i18n/locales/en";
import { es } from "@/ui/i18n/locales/es";
import { zh } from "@/ui/i18n/locales/zh";

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

  test("keeps translated catalogs aligned", () => {
    assert.strictEqual(Object.keys(en).length, 177);
    assert.deepStrictEqual(Object.keys(es).sort(), Object.keys(en).sort());
    assert.deepStrictEqual(Object.keys(zh).sort(), Object.keys(es).sort());
    for (const [source, translation] of Object.entries(es)) {
      assert.deepStrictEqual(placeholders(translation), placeholders(source), `Spanish placeholders differ for: ${source}`);
    }
    for (const [source, translation] of Object.entries(zh)) {
      assert.deepStrictEqual(placeholders(translation), placeholders(source), `Chinese placeholders differ for: ${source}`);
    }
  });

  test("changes the selected interface language and notifies subscribers", () => {
    let notifications = 0;
    const unsubscribe = subscribeUiLocale(() => {notifications += 1;});

    setInterfaceLanguage("es");
    assert.strictEqual(getUiLocale(), "es");
    assert.strictEqual(notifications, 1);

    unsubscribe();
    setInterfaceLanguage("en");
    assert.strictEqual(notifications, 1);
  });
});

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map((match) => match[1]).sort();
}
