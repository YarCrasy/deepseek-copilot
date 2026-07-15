import * as assert from "assert";
import { buildApiUrl } from "@/deepseekApi/client/DeepSeekFetch";

suite("DeepSeek URLs", () => {
  test("joins paths without duplicate slashes and preserves a base path", () => {
    assert.strictEqual(buildApiUrl("https://example.test/v1/", "/chat/completions"), "https://example.test/v1/chat/completions");
  });
});
