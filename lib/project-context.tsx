"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type Project } from "@/lib/config";
import { getStoredProjects } from "@/lib/storage";
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
  availableProjects: Project[];
  refreshProjects: () => void;
  isAdmin: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isAdmin = useAdmin();

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function loadProjects() {
    if (isAdmin) {
      const storedProjects = getStoredProjects();
      setAvailableProjects(storedProjects);
      if (!currentProject && storedProjects.length > 0) {
        setCurrentProject(storedProjects[0]);
      }
    } else {
      try {
        const res = await fetch("/api/share");
        const data = await res.json();
        const sharedProjects: Project[] = (data.projects ?? []).map(
          (p: { id: string; name: string; projectId: number }) => ({
            id: p.id,
            name: p.name,
            projectId: p.projectId,
            token: "",
          }),
        );
        setAvailableProjects(sharedProjects);
        if (!currentProject && sharedProjects.length > 0) {
          setCurrentProject(sharedProjects[0]);
        }
      } catch {
        setAvailableProjects([]);
      }
    }
    setIsInitialized(true);
  }

  function handleSetProject(project: Project) {
    setCurrentProject(project);
    setSelectedSeries(null);
  }

  if (isInitialized && availableProjects.length === 0) {
    return (
      <ProjectContext.Provider
        value={{
          currentProject: null as unknown as Project,
          setCurrentProject: handleSetProject,
          selectedSeries: null,
          setSelectedSeries,
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
