import { put, get } from "@vercel/blob";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// --- Blob helpers ---

async function blobGet<T>(pathname: string, fallback: T): Promise<T> {
  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) return fallback;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

async function blobPut(pathname: string, data: unknown): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

// --- Types ---

export interface SharedProject {
  id: string;
  name: string;
  projectId: number;
}

// --- In-memory fallback (used when BLOB_READ_WRITE_TOKEN is not set) ---

const memSharedProjects: SharedProject[] = [];
const memSeriesCache = new Map<number, unknown[]>();
const memCharactersCache = new Map<number, unknown[]>();
const memStoryboardCache = new Map<number, unknown[]>();

// --- Shared Projects ---

export async function getSharedProjects(): Promise<SharedProject[]> {
  if (!USE_BLOB) return [...memSharedProjects];
  return blobGet<SharedProject[]>("shared-projects.json", []);
}

export async function addSharedProject(project: SharedProject): Promise<void> {
  if (!USE_BLOB) {
    const idx = memSharedProjects.findIndex(
      (p) => p.projectId === project.projectId,
    );
    if (idx !== -1) memSharedProjects[idx] = project;
    else memSharedProjects.push(project);
    return;
  }
  const projects = await getSharedProjects();
  const idx = projects.findIndex((p) => p.projectId === project.projectId);
  if (idx !== -1) projects[idx] = project;
  else projects.push(project);
  await blobPut("shared-projects.json", projects);
}

export async function removeSharedProject(projectId: number): Promise<void> {
  if (!USE_BLOB) {
    const idx = memSharedProjects.findIndex((p) => p.projectId === projectId);
    if (idx !== -1) memSharedProjects.splice(idx, 1);
    return;
  }
  const projects = await getSharedProjects();
  await blobPut(
    "shared-projects.json",
    projects.filter((p) => p.projectId !== projectId),
  );
}

// --- Cached Series ---

export async function getCachedSeries(projectId: number): Promise<unknown[]> {
  if (!USE_BLOB) return memSeriesCache.get(projectId) ?? [];
  return blobGet<unknown[]>(`cache/series-${projectId}.json`, []);
}

export async function cacheSeries(
  projectId: number,
  series: unknown[],
): Promise<void> {
  if (!USE_BLOB) {
    memSeriesCache.set(projectId, series);
    return;
  }
  await blobPut(`cache/series-${projectId}.json`, series);
}

// --- Cached Characters ---

export async function getCachedCharacters(
  projectId: number,
): Promise<unknown[]> {
  if (!USE_BLOB) return memCharactersCache.get(projectId) ?? [];
  return blobGet<unknown[]>(`cache/characters-${projectId}.json`, []);
}

export async function cacheCharacters(
  projectId: number,
  characters: unknown[],
): Promise<void> {
  if (!USE_BLOB) {
    memCharactersCache.set(projectId, characters);
    return;
  }
  await blobPut(`cache/characters-${projectId}.json`, characters);
}

// --- Cached Storyboard ---

export async function getCachedStoryboard(
  seriesId: number,
): Promise<unknown[]> {
  if (!USE_BLOB) return memStoryboardCache.get(seriesId) ?? [];
  return blobGet<unknown[]>(`cache/storyboard-${seriesId}.json`, []);
}

export async function cacheStoryboard(
  seriesId: number,
  storyboard: unknown[],
): Promise<void> {
  if (!USE_BLOB) {
    memStoryboardCache.set(seriesId, storyboard);
    return;
  }
  await blobPut(`cache/storyboard-${seriesId}.json`, storyboard);
}
