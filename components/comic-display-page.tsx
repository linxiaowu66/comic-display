"use client";

import { useState, useCallback, useEffect } from "react";
import { ProjectProvider, useProject } from "@/lib/project-context";
import { TopBar } from "@/components/top-bar";
import { apiFetcher } from "@/lib/api";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useCharacters } from "@/lib/hooks/use-characters";
import { CharacterMention } from "@/components/character-mention";
import { ImagePreview } from "@/components/image-preview";

interface NarrationItem {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
  type: number;
  characterId: number;
  emotion: string;
  speed: number;
}

interface StoryboardItem {
  id: number;
  boardIndex: number;
  imagePrompt: string;
  imageList: string[] | null;
  videoPrompt: string;
  videoList: string[] | null;
  videoProps:
    | {
        video_url: string;
        width: number;
        height: number;
      }[]
    | null;
  narrationList: NarrationItem[] | null;
}

interface StoryboardResponse {
  code: string;
  msg: string;
  result: {
    list: StoryboardItem[];
    total: number;
  };
}

function StoryboardList() {
  const { selectedSeries, currentProject, availableProjects, isAdmin } = useProject();
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  // Admin: fetch from upstream API; Non-admin: fetch from server cache
  const { data: storyboardData, isLoading } = useSWR<
    StoryboardResponse | { data: StoryboardItem[] }
  >(
    selectedSeries && currentProject
      ? isAdmin
        ? [
            "/storyboard/api/list",
            currentProject.token,
            {
              method: "POST" as const,
              params: {
                seriesId: selectedSeries.id,
                page: 1,
                size: 500,
              },
            },
          ]
        : `/api/cache?type=storyboard&id=${selectedSeries.id}`
      : null,
    isAdmin
      ? apiFetcher
      : (url: string) => fetch(url).then((r) => r.json()),
  );

  const storyboardListRaw: StoryboardItem[] = isAdmin
    ? (storyboardData as StoryboardResponse)?.result?.list ?? []
    : (storyboardData as { data: StoryboardItem[] })?.data ?? [];

  // Admin: cache storyboard data to server
  useEffect(() => {
    if (isAdmin && storyboardListRaw.length > 0 && selectedSeries?.id) {
      fetch("/api/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "storyboard",
          id: selectedSeries.id,
          data: storyboardListRaw,
        }),
      }).catch(() => {});
    }
  }, [isAdmin, storyboardListRaw, selectedSeries?.id]);

  const {
    characters,
    characterMap,
    isLoading: charactersLoading,
  } = useCharacters(
    currentProject?.projectId || null,
    currentProject?.token || "",
    isAdmin,
  );

  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    node.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        if (node.scrollWidth <= node.clientWidth) return;
        e.preventDefault();
        node.scrollBy({ left: e.deltaY });
      },
      { passive: false },
    );
  }, []);

  const storyboardList = storyboardListRaw;

  if (availableProjects.length === 0) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {isAdmin ? "欢迎使用漫剧展示系统" : "暂无共享项目"}
            </EmptyTitle>
            <EmptyDescription>
              <div className="space-y-2">
                <p>
                  {isAdmin
                    ? "请点击右上角的设置按钮添加项目配置"
                    : "管理员还没有共享任何项目，请联系管理员"}
                </p>
              </div>
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (!selectedSeries) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>未选择剧集</EmptyTitle>
            <EmptyDescription>请先在顶部选择项目和剧集</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (isLoading || charactersLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-4 divide-x divide-border">
                <Skeleton className="h-[200px] rounded-none" />
                <Skeleton className="h-[200px] rounded-none" />
                <Skeleton className="h-[200px] rounded-none" />
                <Skeleton className="h-[200px] rounded-none" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (storyboardList.length === 0) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无数据</EmptyTitle>
            <EmptyDescription>该剧集暂无分镜数据</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Characters List */}
      {!charactersLoading && characters.length > 0 && (
        <div className="bg-muted/30 rounded-lg border border-border/50 p-4">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            角色列表
          </h2>
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40 cursor-grab active:cursor-grabbing"
            style={{
              scrollbarWidth: "thin",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {characters.map((character) => (
              <div
                key={character.id}
                className="flex-shrink-0 w-[180px] bg-background rounded-lg border border-border/50 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                {/* Character Image */}
                <div className="relative aspect-square bg-muted/20 overflow-hidden">
                  {character.resourceUrl && character.resourceUrl.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={character.resourceUrl[0]}
                      alt={character.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground/40">
                      👤
                    </div>
                  )}
                </div>

                {/* Character Info */}
                <div className="p-3 space-y-1">
                  <h3
                    className="font-semibold text-sm truncate"
                    title={character.name}
                  >
                    {character.name}
                  </h3>
                  {character.description && (
                    <p
                      className="text-xs text-muted-foreground line-clamp-2"
                      title={character.description}
                    >
                      {character.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 grid grid-cols-4 border-b border-border bg-background font-medium shadow-sm">
        <div className="p-3 text-center">旁白</div>
        <div className="p-3 text-center border-x border-border">画面提示词</div>
        <div className="p-3 text-center border-r border-border">分镜图</div>
        <div className="p-3 text-center">视频提示词 / 视频</div>
      </div>

      {/* List */}
      {storyboardList.map((item) => (
        <Card
          key={item.id}
          className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow"
        >
          <CardContent className="p-0">
            <div className="grid grid-cols-4 divide-x divide-border items-stretch min-h-[220px]">
              {/* Column 1: Narration List */}
              <div className="p-5 flex flex-col justify-center gap-2 overflow-y-auto max-h-[400px]">
                {item.narrationList && item.narrationList.length > 0 ? (
                  <div className="space-y-2">
                    {item.narrationList.map((narration) => (
                      <div
                        key={narration.index}
                        className="text-sm leading-relaxed border-l-2 border-primary/30 pl-3 py-2 bg-muted/20 rounded-r hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground font-mono">
                            {narration.startTime} - {narration.endTime}
                          </span>
                        </div>
                        <div className="text-foreground/90">
                          {narration.text}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-xs italic text-center py-4">
                    暂无旁白
                  </div>
                )}
              </div>

              {/* Column 2: Image Prompt */}
              <div className="p-5 flex flex-col justify-center text-sm leading-relaxed">
                <div className="text-muted-foreground mb-3 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                    分镜 {item.boardIndex}
                  </span>
                </div>
                <div className="prose prose-sm prose-invert max-w-none text-foreground/90">
                  <CharacterMention
                    html={item.imagePrompt}
                    characterMap={characterMap}
                  />
                </div>
              </div>

              {/* Column 3: Storyboard Image */}
              <div className="p-0 flex items-center justify-center bg-muted/5 overflow-hidden">
                {item.imageList && item.imageList.length > 0 ? (
                  <div
                    className="relative h-full w-full group cursor-zoom-in"
                    onClick={() =>
                      setPreviewImage({
                        src: item.imageList![0],
                        alt: `Storyboard ${item.boardIndex}`,
                      })
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageList[0]}
                      alt={`Storyboard ${item.boardIndex}`}
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm shadow-xl">
                        点击放大
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-xs italic flex flex-col items-center gap-2">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                      ?
                    </div>
                    暂无图片
                  </div>
                )}
              </div>

              {/* Column 4: Video Prompt & Video */}
              <div className="p-5 flex flex-col gap-4 bg-muted/5">
                {item.videoPrompt && (
                  <div className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-3 py-1">
                    <CharacterMention
                      html={item.videoPrompt}
                      characterMap={characterMap}
                    />
                  </div>
                )}
                <div className="flex-1 flex items-center justify-center">
                  {item.videoList && item.videoList.length > 0 ? (
                    <div className="w-full rounded-lg overflow-hidden shadow-lg border border-border bg-black aspect-video group relative">
                      <video
                        src={item.videoList[0]}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : item.videoProps && item.videoProps.length > 0 ? (
                    <div className="w-full rounded-lg overflow-hidden shadow-lg border border-border bg-black aspect-video group relative">
                      <video
                        src={item.videoProps[0].video_url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-xs italic bg-muted/20 w-full aspect-video rounded-lg flex items-center justify-center border border-dashed border-border">
                      暂无视频数据
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Image Preview Dialog */}
      {previewImage && (
        <ImagePreview
          src={previewImage.src}
          alt={previewImage.alt}
          open={!!previewImage}
          onOpenChange={(open) => !open && setPreviewImage(null)}
        />
      )}
    </div>
  );
}

export function ComicDisplayPage() {
  return (
    <ProjectProvider>
      <div className="flex h-screen flex-col bg-background">
        <TopBar />
        <main className="flex-1 overflow-auto min-h-0">
          <div className="container mx-auto py-6 px-4">
            <StoryboardList />
          </div>
        </main>
      </div>
    </ProjectProvider>
  );
}
