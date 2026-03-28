import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("storage (isolated HOME)", () => {
  let prevHome: string | undefined;
  let testHome: string;

  beforeEach(() => {
    prevHome = process.env.HOME;
    testHome = mkdtempSync(path.join(tmpdir(), "repobridge-test-"));
    process.env.HOME = testHome;
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
    process.env.HOME = prevHome;
    rmSync(testHome, { recursive: true, force: true });
  });

  it("basePath and projectPath are under ~/.repobridge", async () => {
    const { basePath, projectPath } = await import("./storage.js");
    expect(basePath()).toBe(path.join(testHome, ".repobridge"));
    expect(projectPath("my-app")).toBe(path.join(testHome, ".repobridge", "projects", "my-app"));
  });

  it("createProject writes config and sets active project", async () => {
    const { createProject, getProjectConfig, getActiveProject } = await import("./storage.js");
    const cfg = await createProject("p1");
    expect(cfg.name).toBe("p1");
    expect(cfg.repos).toEqual([]);
    const loaded = await getProjectConfig("p1");
    expect(loaded.name).toBe("p1");
    expect(await getActiveProject()).toBe("p1");
  });

  it("addRepoToProject appends a repo", async () => {
    const { createProject, addRepoToProject, getProjectConfig } = await import("./storage.js");
    await createProject("multi");
    const entry = {
      name: "api",
      path: "/tmp/api",
      addedAt: new Date().toISOString(),
    };
    await addRepoToProject("multi", entry);
    const cfg = await getProjectConfig("multi");
    expect(cfg.repos).toHaveLength(1);
    expect(cfg.repos[0]!.name).toBe("api");
  });

  it("deleteProject removes project and clears active when matching", async () => {
    const { createProject, deleteProject, getActiveProject } = await import("./storage.js");
    await createProject("gone");
    expect(await getActiveProject()).toBe("gone");
    await deleteProject("gone");
    expect(await getActiveProject()).toBeUndefined();
  });

  it("throws when adding duplicate repo name", async () => {
    const { createProject, addRepoToProject } = await import("./storage.js");
    await createProject("dup");
    const entry = (name: string) => ({
      name,
      path: "/x",
      addedAt: new Date().toISOString(),
    });
    await addRepoToProject("dup", entry("a"));
    await expect(addRepoToProject("dup", entry("a"))).rejects.toThrow(/already exists/);
  });
});
