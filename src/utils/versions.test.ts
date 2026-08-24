import { describe, it, expect } from "vitest";
import {
  parseVersion,
  compareVersions,
  sortVersions,
  filterVersions,
  isValidVersion,
  normalizeVersion,
  stripV,
} from "@/utils/versions";
import type { NodeVersion } from "@/types";

const makeVersion = (version: string, overrides: Partial<NodeVersion> = {}): NodeVersion => ({
  version,
  major: parseInt(version.replace("v", "").split(".")[0]),
  minor: parseInt(version.replace("v", "").split(".")[1]),
  patch: parseInt(version.replace("v", "").split(".")[2]),
  lts: false,
  current: false,
  installed: true,
  active: false,
  ...overrides,
});

describe("parseVersion", () => {
  it("parses standard semver", () => {
    expect(parseVersion("22.14.0")).toEqual({ major: 22, minor: 14, patch: 0 });
  });
  it("parses with v prefix", () => {
    expect(parseVersion("v20.10.5")).toEqual({ major: 20, minor: 10, patch: 5 });
  });
  it("returns null for invalid", () => {
    expect(parseVersion("latest")).toBeNull();
    expect(parseVersion("22.14")).toBeNull();
    expect(parseVersion("not-a-version")).toBeNull();
  });
});

describe("compareVersions", () => {
  it("correctly orders versions", () => {
    expect(compareVersions("22.0.0", "20.0.0")).toBeGreaterThan(0);
    expect(compareVersions("20.0.0", "22.0.0")).toBeLessThan(0);
    expect(compareVersions("22.0.0", "22.0.0")).toBe(0);
    expect(compareVersions("22.1.0", "22.0.9")).toBeGreaterThan(0);
  });
});

describe("sortVersions", () => {
  const versions = [
    makeVersion("v18.20.0", { lts: "Hydrogen" as unknown as false }),
    makeVersion("v22.14.0"),
    makeVersion("v20.10.0", { lts: "Iron" as unknown as false }),
  ];

  it("sorts newest first", () => {
    const sorted = sortVersions(versions, "newest");
    expect(sorted[0].version).toBe("v22.14.0");
    expect(sorted[2].version).toBe("v18.20.0");
  });

  it("sorts oldest first", () => {
    const sorted = sortVersions(versions, "oldest");
    expect(sorted[0].version).toBe("v18.20.0");
  });

  it("sorts lts-first then by version", () => {
    const sorted = sortVersions(versions, "lts-first");
    // LTS versions should come first
    expect(sorted[0].lts).not.toBe(false);
    expect(sorted[1].lts).not.toBe(false);
  });
});

describe("filterVersions", () => {
  const versions = [
    makeVersion("v22.14.0", { active: true }),
    makeVersion("v20.10.0", { lts: "Iron" as unknown as false }),
    makeVersion("v18.20.0", { lts: "Hydrogen" as unknown as false }),
  ];

  it("returns all for 'all' filter", () => {
    expect(filterVersions(versions, "all", "")).toHaveLength(3);
  });

  it("filters by search", () => {
    expect(filterVersions(versions, "all", "22")).toHaveLength(1);
    expect(filterVersions(versions, "all", "22")[0].version).toBe("v22.14.0");
  });

  it("filters active versions", () => {
    const active = filterVersions(versions, "active", "");
    expect(active).toHaveLength(1);
    expect(active[0].active).toBe(true);
  });
});

describe("isValidVersion", () => {
  it("accepts valid versions", () => {
    expect(isValidVersion("22.14.0")).toBe(true);
    expect(isValidVersion("v22.14.0")).toBe(true);
    expect(isValidVersion("0.10.0")).toBe(true);
  });

  it("rejects injection attempts", () => {
    expect(isValidVersion("20.10.0 && whoami")).toBe(false);
    expect(isValidVersion("20.10.0; rm -rf /")).toBe(false);
    expect(isValidVersion("latest")).toBe(false);
    expect(isValidVersion("")).toBe(false);
    expect(isValidVersion("lts/iron")).toBe(false);
  });
});

describe("normalizeVersion / stripV", () => {
  it("adds v prefix", () => {
    expect(normalizeVersion("22.14.0")).toBe("v22.14.0");
    expect(normalizeVersion("v22.14.0")).toBe("v22.14.0");
  });
  it("strips v prefix", () => {
    expect(stripV("v22.14.0")).toBe("22.14.0");
    expect(stripV("22.14.0")).toBe("22.14.0");
  });
});
