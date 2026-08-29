import { describe, expect, it } from "vitest";
import { strings } from "@/lib/strings";

describe("scaffold smoke", () => {
  it("exposes Hebrew UI strings as a flat key -> string map", () => {
    expect(strings.scaffold_ready_title).toBe("התשתית עלתה");
    expect(Object.values(strings).every((v) => typeof v === "string")).toBe(true);
  });
});
