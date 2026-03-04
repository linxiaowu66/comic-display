import fs from "fs";
import path from "path";

const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL
  ? path.join("/tmp", "comic-display-data")
  : path.join(process.cwd(), "data");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export interface SharedProject {
  id: string;
  name: string;
  projectId: number;
}

// --- Shared Projects ---

const PROJECTS_FILE = path.join(DATA_DIR, "shared-projects.json");

export function getSharedProjects(): SharedProject[] {
  return readJson<SharedProject[]>(PROJECTS_FILE, []);
}

export function addSharedProject(project: SharedProject) {
  const projects = getSharedProjects();
  const idx = projects.findIndex((p) => p.projectId === project.projectId);
  if (idx !== -1) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  writeJson(PROJECTS_FILE, projects);
}

export function removeSharedProject(projectId: number) {
  const projects = getSharedProjects().filter((p) => p.projectId !== projectId);
  writeJson(PROJECTS_FILE, projects);
}

// --- Cached Series List ---

export function getCachedSeries(projectId: number): unknown[] {
  const file = path.join(DATA_DIR, "cache", `series-${projectId}.json`);
  return readJson<unknown[]>(file, []);
}

export function cacheSeries(projectId: number, series: unknown[]) {
  const file = path.join(DATA_DIR, "cache", `series-${projectId}.json`);
  writeJson(file, series);
}

// --- Cached Characters ---

export function getCachedCharacters(projectId: number): unknown[] {
  const file = path.join(DATA_DIR, "cache", `characters-${projectId}.json`);
  return readJson<unknown[]>(file, []);
}

export function cacheCharacters(projectId: number, characters: unknown[]) {
  const file = path.join(DATA_DIR, "cache", `characters-${projectId}.json`);
  writeJson(file, characters);
}

// --- Cached Storyboard ---

export function getCachedStoryboard(seriesId: number): unknown[] {
  const file = path.join(DATA_DIR, "cache", `storyboard-${seriesId}.json`);
  return readJson<unknown[]>(file, []);
}

export function cacheStoryboard(seriesId: number, storyboard: unknown[]) {
  const file = path.join(DATA_DIR, "cache", `storyboard-${seriesId}.json`);
  writeJson(file, storyboard);
}
