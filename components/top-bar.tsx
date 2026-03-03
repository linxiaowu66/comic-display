"use client";

import { useProject, type SeriesItem } from "@/lib/project-context";
import { apiFetcher } from "@/lib/api";
import useSWR from "swr";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Film } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ProjectSettings } from "@/components/project-settings";

interface SeriesResponse {
  code: string;
  msg: string;
  result: {
    items: SeriesItem[];
    totalCount: number;
  };
}

export function TopBar() {
  const {
    currentProject,
    setCurrentProject,
    selectedSeries,
    setSelectedSeries,
    availableProjects,
    refreshProjects,
  } = useProject();

  const hasProjects = availableProjects.length > 0;

  const { data: seriesData, isLoading: seriesLoading } = useSWR<SeriesResponse>(
    currentProject?.projectId
      ? [
          "/storyboard/series/getSeries",
          currentProject.token,
          {
            method: "POST" as const,
            params: { projectId: currentProject.projectId, page: 1, size: 100 },
          },
        ]
      : null,
    apiFetcher,
  );

  console.log("[v0] seriesData:", JSON.stringify(seriesData));
  console.log("[v0] seriesLoading:", seriesLoading);

  const seriesList = seriesData?.result?.items ?? [];
  console.log("[v0] seriesList length:", seriesList.length);

  function handleProjectChange(projectId: string) {
    const project = availableProjects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  }

  function handleSeriesChange(seriesId: string) {
    const series = seriesList.find((s) => String(s.id) === seriesId);
    if (series) {
      setSelectedSeries(series);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-2.5">
          <Film className="size-5 text-primary" />
          <span className="text-base font-semibold tracking-tight text-foreground">
            漫剧展示
          </span>
        </div>

        {/* Right: Project selector + Series selector + Settings */}
        <div className="flex items-center gap-4">
          {hasProjects ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">项目</span>
                <Select
                  value={currentProject?.id}
                  onValueChange={handleProjectChange}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="选择项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-5" />

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">剧集</span>
                <Select
                  value={selectedSeries ? String(selectedSeries.id) : undefined}
                  onValueChange={handleSeriesChange}
                  disabled={seriesLoading || seriesList.length === 0}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={
                        seriesLoading
                          ? "加载中..."
                          : seriesList.length === 0
                            ? "暂无剧集"
                            : "选择剧集"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesList.map((series) => (
                      <SelectItem key={series.id} value={String(series.id)}>
                        {series.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator orientation="vertical" className="h-5" />
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>暂无项目配置，点击右侧设置按钮添加</span>
              <Separator orientation="vertical" className="h-5" />
            </div>
          )}

          <ProjectSettings onProjectsChange={refreshProjects} />
        </div>
      </div>
    </header>
  );
}
