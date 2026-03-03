"use client";

import { useState } from "react";
import { ProjectProvider, useProject } from "@/lib/project-context";
import { TopBar } from "@/components/top-bar";
import { apiFetcher } from "@/lib/api";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { useCharacters } from "@/lib/hooks/use-characters";
import { CharacterMention } from "@/components/character-mention";
import { ImagePreview } from "@/components/image-preview";

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
  const { selectedSeries, currentProject, availableProjects } = useProject();
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  const {
    data: storyboardData,
    isLoading,
  } = useSWR<StoryboardResponse>(
    selectedSeries && currentProject
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
      : null,
    apiFetcher,
  );

  const { characterMap, isLoading: charactersLoading } = useCharacters(
    currentProject?.projectId || null,
    currentProject?.token || ""
  );

  const storyboardList = storyboardData?.result?.list ?? [];

  // 没有项目配置
  if (availableProjects.length === 0) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>欢迎使用漫剧展示系统</EmptyTitle>
            <EmptyDescription>
              <div className="space-y-2">
                <p>请点击右上角的设置按钮添加项目配置</p>
                <p className="text-xs text-muted-foreground/80">
                  您需要提供项目名称、项目ID和Token来开始使用
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
              <div className="grid grid-cols-3 divide-x divide-border">
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
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-3 border-b border-border bg-muted/50 font-medium sticky top-0 z-10">
        <div className="p-3 text-center">画面提示词</div>
        <div className="p-3 text-center border-x border-border">分镜图</div>
        <div className="p-3 text-center">视频提示词 / 视频</div>
      </div>

      {/* List */}
      {storyboardList.map((item) => (
        <Card key={item.id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="grid grid-cols-3 divide-x divide-border items-stretch min-h-[220px]">
              {/* Column 1: Image Prompt */}
              <div className="p-5 flex flex-col justify-center text-sm leading-relaxed">
                <div className="text-muted-foreground mb-3 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                    SCENE {item.boardIndex}
                  </span>
                </div>
                <div className="prose prose-sm prose-invert max-w-none text-foreground/90">
                  <CharacterMention 
                    html={item.imagePrompt} 
                    characterMap={characterMap} 
                  />
                </div>
              </div>

              {/* Column 2: Storyboard Image */}
              <div className="p-0 flex items-center justify-center bg-muted/5 overflow-hidden">
                {item.imageList && item.imageList.length > 0 ? (
                  <div 
                    className="relative h-full w-full group cursor-zoom-in"
                    onClick={() => setPreviewImage({ 
                      src: item.imageList![0], 
                      alt: `Storyboard ${item.boardIndex}` 
                    })}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageList[0]}
                      alt={`Storyboard ${item.boardIndex}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
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

              {/* Column 3: Video Prompt & Video */}
              <div className="p-5 flex flex-col gap-4 bg-muted/5">
                {item.videoPrompt && (
                  <div className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-3 py-1">
                    {item.videoPrompt}
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
      <div className="flex min-h-screen flex-col bg-background">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4">
             <StoryboardList />
          </div>
        </main>
      </div>
    </ProjectProvider>
  );
}
