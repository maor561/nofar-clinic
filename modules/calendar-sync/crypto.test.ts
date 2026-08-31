// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { encryptToken, decryptToken } from "./internal/crypto";

const KEY = Buffer.alloc(32, 7).toString("base64");
let prev: string | undefined;

beforeAll(() => {
  prev = process.env.CALENDAR_TOKEN_KEY;
  process.env.CALENDAR_TOKEN_KEY = KEY;
});
afterAll(() => {
  if (prev === undefined) delete process.env.CALENDAR_TOKEN_KEY;
  else process.env.CALENDAR_TOKEN_KEY = prev;
});

describe("token crypto", () => {
  it("round-trips a refresh token", () => {
    const secret = "1//0abcDEF-google-refresh-token_xyz";
    const blob = encryptToken(secret);
    expect(blob).not.toContain(secret);
    expect(blob.split(":")).toHaveLength(3);
    expect(decryptToken(blob)).toBe(secret);
  });

  it("produces a fresh IV each time", () => {
    expect(encryptToken("same")).not.toBe(encryptToken("same"));
  });

  it("rejects a tampered ciphertext (GCM auth)", () => {
    const [iv, tag, data] = encryptToken("hello").split(":");
    const flipped = Buffer.from(data, "base64");
    flipped[0] ^= 0xff;
    expect(() => decryptToken(`${iv}:${tag}:${flipped.toString("base64")}`)).toThrow();
  });

  it("throws without a key", () => {
    delete process.env.CALENDAR_TOKEN_KEY;
    expect(() => encryptToken("x")).toThrow(/CALENDAR_TOKEN_KEY/);
    process.env.CALENDAR_TOKEN_KEY = KEY;
  });
});
