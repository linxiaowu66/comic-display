import type { Project } from "@/lib/config";

const STORAGE_KEY = "storyboard_projects";

export function getStoredProjects(): Project[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load projects from storage:", error);
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects to storage:", error);
  }
}

export function addProject(project: Project): void {
  const projects = getStoredProjects();
  projects.push(project);
  saveProjects(projects);
}

export function updateProject(id: string, updatedProject: Project): void {
  const projects = getStoredProjects();
  const index = projects.findIndex((p) => p.id === id);
  if (index !== -1) {
    projects[index] = updatedProject;
    saveProjects(projects);
  }
}

export function deleteProject(id: string): void {
  const projects = getStoredProjects();
  const filtered = projects.filter((p) => p.id !== id);
  saveProjects(filtered);
}
