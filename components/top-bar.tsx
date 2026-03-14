"use client";

import { useEffect } from "react";
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
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const MATERIAL_CATEGORIES = [
  { value: 4, label: "分镜图" },
  { value: 5, label: "分镜视频" },
];

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
    selectedCategory,
    setSelectedCategory,
    availableProjects,
    refreshProjects,
    isAdmin,
  } = useProject();

  const router = useRouter();
  const { data: userData, mutate: mutateUser } = useSWR<{ username: string }>("/api/auth/me", (url: string) => fetch(url).then(res => res.json()));

  const isMaterial = currentProject?.source === "material";

  const hasProjects = availableProjects.length > 0;

  // Admin: fetch from API; Non-admin: fetch cached from server (storyboard only)
  const { data: seriesData, isLoading: seriesLoading } = useSWR<
    SeriesResponse | { data: SeriesItem[] }
  >(
    !isMaterial && currentProject?.projectId
      ? isAdmin
        ? [
            "/storyboard/series/getSeries",
            currentProject.token,
            {
              method: "POST" as const,
              params: {
                projectId: currentProject.projectId,
                page: 1,
                size: 100,
              },
            },
          ]
        : `/api/cache?type=series&id=${currentProject.projectId}`
      : null,
    isAdmin ? apiFetcher : (url: string) => fetch(url).then((r) => r.json()),
  );

  const seriesList: SeriesItem[] = isAdmin
    ? (seriesData as SeriesResponse)?.result?.items ?? []
    : (seriesData as { data: SeriesItem[] })?.data ?? [];

  // Admin: cache series data to server when fetched
  useEffect(() => {
    if (!isMaterial && isAdmin && seriesList.length > 0 && currentProject?.projectId) {
      fetch("/api/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "series",
          id: currentProject.projectId,
          data: seriesList,
        }),
      }).catch(() => {});
    }
  }, [isMaterial, isAdmin, seriesList, currentProject?.projectId]);

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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("isJzOwner");
    mutateUser(undefined);
    router.push("/login");
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

              {isMaterial ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">素材类型</span>
                  <Select
                    value={String(selectedCategory)}
                    onValueChange={(v) => setSelectedCategory(Number(v))}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="选择素材类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={String(cat.value)}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
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
              )}

              <Separator orientation="vertical" className="h-5" />
            </>
          ) : isAdmin ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>暂无项目配置，点击右侧设置按钮添加</span>
              <Separator orientation="vertical" className="h-5" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>暂无共享项目</span>
            </div>
          )}

          {isAdmin && <ProjectSettings onProjectsChange={refreshProjects} />}
          
          <Separator orientation="vertical" className="h-5" />
          
          <div className="flex items-center gap-3">
            {userData?.username && (
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                {userData.username}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout} title="退出登录" className="size-8 text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
