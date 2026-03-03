"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { DEFAULT_PROJECTS, type Project } from "@/lib/config"
import { getStoredProjects } from "@/lib/storage"

export interface SeriesItem {
  id: number
  name: string
  title: string
  description: string
  projectId: number
  timeDuration: number
  imageList: string[]
  subtitleFiles: string[]
  ModifySubtitleFiles: string[]
  dubbingFiles: string[]
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

interface ProjectContextType {
  currentProject: Project
  setCurrentProject: (project: Project) => void
  selectedSeries: SeriesItem | null
  setSelectedSeries: (series: SeriesItem | null) => void
  availableProjects: Project[]
  refreshProjects: () => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  function loadProjects() {
    const storedProjects = getStoredProjects()
    const allProjects = storedProjects.length > 0 ? storedProjects : DEFAULT_PROJECTS
    setAvailableProjects(allProjects)
    
    if (!currentProject && allProjects.length > 0) {
      setCurrentProject(allProjects[0])
    }
    
    setIsInitialized(true)
  }

  function handleSetProject(project: Project) {
    setCurrentProject(project)
    setSelectedSeries(null)
  }

  // 如果已初始化但没有项目，渲染空状态
  if (isInitialized && availableProjects.length === 0) {
    return (
      <ProjectContext.Provider
        value={{
          currentProject: null as any,
          setCurrentProject: handleSetProject,
          selectedSeries: null,
          setSelectedSeries,
          availableProjects: [],
          refreshProjects: loadProjects,
        }}
      >
        {children}
      </ProjectContext.Provider>
    )
  }

  // 初始化中或没有当前项目时不渲染
  if (!isInitialized || !currentProject) {
    return null
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
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider")
  }
  return context
}
