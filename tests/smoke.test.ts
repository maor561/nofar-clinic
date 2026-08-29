import { describe, expect, it } from "vitest";
import { strings } from "@/lib/strings";

describe("scaffold smoke", () => {
  it("exposes Hebrew UI strings as a flat key -> string map", () => {
    expect(strings.scaffold_tagline).toBe("ניהול הקשר הטיפולי");
    expect(Object.values(strings).every((v) => typeof v === "string")).toBe(true);
  });
});
