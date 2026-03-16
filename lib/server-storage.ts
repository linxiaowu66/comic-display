import { put, get } from "@vercel/blob";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// --- Blob helpers ---

async function blobGet<T>(pathname: string, fallback: T): Promise<T> {
  try {
    // Cast options to any to bypass TS complaining about useCache: false (which prevents Vercel edge caching)
    const result = await get(pathname, { access: "private", useCache: false } as any);
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
  source?: "storyboard" | "material";
  token?: string;
  fragmentId?: number;
  userId?: number;
  isShared?: boolean;
}

export interface AppUser {
  id: string;
  username: string;
  password: string; // generated 10-char string
  createdAt: number;
}

export interface LoginRecord {
  id: string;
  username: string;
  ip: string;
  timestamp: number;
}

// --- In-memory fallback (used when BLOB_READ_WRITE_TOKEN is not set) ---
// Use globalThis to persist in-memory data across hot reloads in Next.js dev mode
const globalAny = globalThis as any;

if (!globalAny.memSharedProjects) {
  globalAny.memSharedProjects = [];
  globalAny.memUsers = [];
  globalAny.memLoginRecords = [];
  globalAny.memSeriesCache = new Map<number, unknown[]>();
  globalAny.memCharactersCache = new Map<number, unknown[]>();
  globalAny.memStoryboardCache = new Map<number, unknown[]>();
  globalAny.memMaterialCache = new Map<string, unknown[]>();
}

const memSharedProjects: SharedProject[] = globalAny.memSharedProjects;
const memUsers: AppUser[] = globalAny.memUsers;
const memLoginRecords: LoginRecord[] = globalAny.memLoginRecords;
const memSeriesCache: Map<number, unknown[]> = globalAny.memSeriesCache;
const memCharactersCache: Map<number, unknown[]> = globalAny.memCharactersCache;
const memStoryboardCache: Map<number, unknown[]> = globalAny.memStoryboardCache;
const memMaterialCache: Map<string, unknown[]> = globalAny.memMaterialCache;

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
    if (idx !== -1) {
      const oldProject = memSharedProjects[idx];
      memSharedProjects[idx] = { ...oldProject, ...project };
      if (!project.token && oldProject.token) {
        memSharedProjects[idx].token = oldProject.token;
      }
    } else {
      memSharedProjects.push(project);
    }
    return;
  }
  
  const projects = await getSharedProjects();
  const idx = projects.findIndex((p) => p.projectId === project.projectId);
  if (idx !== -1) {
    const oldProject = projects[idx];
    projects[idx] = { ...oldProject, ...project };
    if (!project.token && oldProject.token) {
      projects[idx].token = oldProject.token;
    }
  } else {
    projects.push(project);
  }
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

// --- Users ---

export async function getUsers(): Promise<AppUser[]> {
  let users: AppUser[] = [];
  if (!USE_BLOB) {
    users = [...memUsers];
  } else {
    users = await blobGet<AppUser[]>("app-users.json", []);
  }

  return users;
}

export async function saveUsers(users: AppUser[]): Promise<void> {
  if (!USE_BLOB) {
    memUsers.length = 0;
    memUsers.push(...users);
    return;
  }
  await blobPut("app-users.json", users);
}

export async function getUser(username: string): Promise<AppUser | undefined> {
  const users = await getUsers();
  return users.find((u) => u.username === username);
}

// --- Login Records ---

export async function getLoginRecords(): Promise<LoginRecord[]> {
  if (!USE_BLOB) return [...memLoginRecords];
  return blobGet<LoginRecord[]>("login-records.json", []);
}

export async function addLoginRecord(record: LoginRecord): Promise<void> {
  if (!USE_BLOB) {
    memLoginRecords.push(record);
    return;
  }
  const records = await getLoginRecords();
  records.push(record);
  await blobPut("login-records.json", records);
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

// --- Cached Material (key = "{projectId}_{category}") ---

export async function getCachedMaterial(key: string): Promise<unknown[]> {
  if (!USE_BLOB) return memMaterialCache.get(key) ?? [];
  return blobGet<unknown[]>(`cache/material-${key}.json`, []);
}

export async function cacheMaterial(
  key: string,
  data: unknown[],
): Promise<void> {
  if (!USE_BLOB) {
    memMaterialCache.set(key, data);
    return;
  }
  await blobPut(`cache/material-${key}.json`, data);
}
