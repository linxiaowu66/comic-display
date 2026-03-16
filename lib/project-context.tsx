"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type Project } from "@/lib/config";
import { useAdmin } from "@/lib/hooks/use-admin";

export interface SeriesItem {
  id: number;
  name: string;
  title: string;
  description: string;
  projectId: number;
  timeDuration: number;
  imageList: string[];
  subtitleFiles: string[];
  ModifySubtitleFiles: string[];
  dubbingFiles: string[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

interface ProjectContextType {
  currentProject: Project;
  setCurrentProject: (project: Project) => void;
  selectedSeries: SeriesItem | null;
  setSelectedSeries: (series: SeriesItem | null) => void;
  selectedCategory: number;
  setSelectedCategory: (category: number) => void;
  availableProjects: Project[];
  refreshProjects: () => void;
  isAdmin: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number>(4);
  const [isInitialized, setIsInitialized] = useState(false);
  const isAdmin = useAdmin();

  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      const loadedProjects: Project[] = (data.projects ?? []).map(
        (p: any) => ({
          id: p.id,
          name: p.name,
          projectId: p.projectId,
          token: p.token || "",
          source: p.source ?? "storyboard",
          fragmentId: p.fragmentId,
          userId: p.userId,
          isShared: p.isShared,
        }),
      );
      setAvailableProjects(loadedProjects);
      if (loadedProjects.length > 0) {
        // preserve current project selection if it still exists
        const match = currentProject
          ? loadedProjects.find((p) => p.projectId === currentProject.projectId)
          : null;
        if (!match && !currentProject) {
          setCurrentProject(loadedProjects[0]);
        } else if (match) {
          setCurrentProject(match);
        } else if (loadedProjects.length > 0) {
          setCurrentProject(loadedProjects[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
      setAvailableProjects([]);
    } finally {
      setIsInitialized(true);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (cancelled) return;
        
        const loadedProjects: Project[] = (data.projects ?? []).map(
          (p: any) => ({
            id: p.id,
            name: p.name,
            projectId: p.projectId,
            token: p.token || "",
            source: p.source ?? "storyboard",
            fragmentId: p.fragmentId,
            userId: p.userId,
            isShared: p.isShared,
          }),
        );
        setAvailableProjects(loadedProjects);
        if (loadedProjects.length > 0 && !currentProject) {
          setCurrentProject(loadedProjects[0]);
        }
      } catch (err) {
        if (!cancelled) setAvailableProjects([]);
      }
      if (!cancelled) setIsInitialized(true);
    }

    // Since isAdmin state could change (e.g., initial SWR load), reloading is fine
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  function handleSetProject(project: Project) {
    setCurrentProject(project);
    setSelectedSeries(null);
    setSelectedCategory(4);
  }

  if (isInitialized && availableProjects.length === 0) {
    return (
      <ProjectContext.Provider
        value={{
          currentProject: null as unknown as Project,
          setCurrentProject: handleSetProject,
          selectedSeries: null,
          setSelectedSeries,
          selectedCategory,
          setSelectedCategory,
          availableProjects: [],
          refreshProjects: loadProjects,
          isAdmin,
        }}
      >
        {children}
      </ProjectContext.Provider>
    );
  }

  if (!isInitialized || !currentProject) {
    return null;
  }

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        setCurrentProject: handleSetProject,
        selectedSeries,
        setSelectedSeries,
        selectedCategory,
        setSelectedCategory,
        availableProjects,
        refreshProjects: loadProjects,
        isAdmin,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
