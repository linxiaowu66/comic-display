export interface SharedProject {
  id: string;
  name: string;
  projectId: number;
}

// --- Shared Projects (in-memory) ---

const sharedProjects: SharedProject[] = [];

export function getSharedProjects(): SharedProject[] {
  return [...sharedProjects];
}

export function addSharedProject(project: SharedProject) {
  const idx = sharedProjects.findIndex((p) => p.projectId === project.projectId);
  if (idx !== -1) {
    sharedProjects[idx] = project;
  } else {
    sharedProjects.push(project);
  }
}

export function removeSharedProject(projectId: number) {
  const idx = sharedProjects.findIndex((p) => p.projectId === projectId);
  if (idx !== -1) {
    sharedProjects.splice(idx, 1);
  }
}

// --- API Response Cache (in-memory) ---

const seriesCache = new Map<number, unknown[]>();
const charactersCache = new Map<number, unknown[]>();
const storyboardCache = new Map<number, unknown[]>();

export function getCachedSeries(projectId: number): unknown[] {
  return seriesCache.get(projectId) ?? [];
}

export function cacheSeries(projectId: number, series: unknown[]) {
  seriesCache.set(projectId, series);
}

export function getCachedCharacters(projectId: number): unknown[] {
  return charactersCache.get(projectId) ?? [];
}

export function cacheCharacters(projectId: number, characters: unknown[]) {
  charactersCache.set(projectId, characters);
}

export function getCachedStoryboard(seriesId: number): unknown[] {
  return storyboardCache.get(seriesId) ?? [];
}

export function cacheStoryboard(seriesId: number, storyboard: unknown[]) {
  storyboardCache.set(seriesId, storyboard);
}
