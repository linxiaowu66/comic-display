"use client";

import { useState, useCallback, useEffect } from "react";
import { ProjectProvider, useProject } from "@/lib/project-context";
import { TopBar } from "@/components/top-bar";
import { apiFetcher } from "@/lib/api";
import { MATERIAL_API_HOST } from "@/lib/config";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import type { Character } from "@/lib/types/character";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// ─── Material system types ────────────────────────────────────────────────────

interface MaterialResource {
  material_id: number;
  material_name: string;
  material_status: number;
  material_is_star: number;
  material_resource_url: string;
  audit_member_name: string;
  audit_at: string;
  remark: string;
}

interface MaterialItem {
  id: number;
  name: string;
  eid_name: string;
  task_status: number;
  request_body: string;
  error_type: number;
  error_msg: string;
  tokens: number;
  materials: MaterialResource[];
  created_time: string;
  secondary_type: string;
}

interface MaterialResponse {
  code: number;
  message: string;
  data: {
    list: MaterialItem[];
    total: number;
  };
}

interface ParsedRequestBody {
  extra_data?: {
    display_prompt?: string;
    materials?: string[];
  };
  image?: string;
  prompt?: string;
}

function getMediaType(
  url: string,
  category: number,
): "image" | "video" | "link" {
  const lower = url.toLowerCase().split("?")[0];
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(lower)) return "image";
  if (/\.(mp4|webm|mov|avi|mkv|mp3|wav|ogg|aac|flac)$/.test(lower))
    return "video";
  return category === 5 ? "video" : "image";
}

interface ReferenceImagesProps {
  images: string[];
  name: string;
  onPreview: (src: string, alt: string) => void;
}

function ReferenceImages({ images, name, onPreview }: ReferenceImagesProps) {
  if (images.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs italic">
        <div className="size-10 rounded-full bg-muted flex items-center justify-center">
          ?
        </div>
        暂无参考图
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div
        className="relative h-full w-full group cursor-zoom-in overflow-hidden"
        onClick={() => onPreview(images[0], name)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[0]}
          alt={name}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm shadow-xl">
            点击放大
          </span>
        </div>
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="h-full grid grid-rows-2 gap-px bg-border overflow-hidden">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative group cursor-zoom-in overflow-hidden"
            onClick={() => onPreview(img, `${name} ${i + 1}`)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`${name} ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
            <span className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
              {i + 1}/{images.length}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // 3+ images: main image + thumbnail strip
  const mainImg = images[0];
  const thumbs = images.slice(1, 4);
  const extra = images.length - 4;

  return (
    <div className="h-full flex flex-col gap-px bg-border overflow-hidden">
      {/* Main image */}
      <div
        className="flex-1 relative group cursor-zoom-in overflow-hidden min-h-0"
        onClick={() => onPreview(mainImg, name)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainImg}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        <span className="absolute top-2 left-2 bg-black/55 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
          1/{images.length}
        </span>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-px h-[72px] shrink-0">
        {thumbs.map((img, i) => {
          const isLast = i === thumbs.length - 1 && extra > 0;
          return (
            <div
              key={i}
              className="relative flex-1 group cursor-zoom-in overflow-hidden"
              onClick={() => onPreview(img, `${name} ${i + 2}`)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${name} ${i + 2}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {isLast ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    +{extra + 1}
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MATERIAL_PAGE_SIZE = 20;

// ─── MaterialList component ───────────────────────────────────────────────────

function MaterialList() {
  const { currentProject, selectedCategory, availableProjects, isAdmin } =
    useProject();
  const [page, setPage] = useState(1);
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, currentProject?.id]);

  // Cache key: "{projectId}_{category}" — used for both writing (admin) and reading (non-admin)
  const cacheKey =
    currentProject?.source === "material" && currentProject?.projectId
      ? `${currentProject.projectId}_${selectedCategory}`
      : null;

  // Admin: fetch all data at once from the upstream API
  const { data: apiData, isLoading: apiLoading } = useSWR<MaterialResponse>(
    isAdmin &&
      currentProject?.source === "material" &&
      currentProject?.fragmentId &&
      currentProject?.userId
      ? [
          "/material/task-list",
          currentProject.token,
          {
            method: "POST" as const,
            params: {
              page: 1,
              size: 1000,
              project_id: currentProject.projectId,
              fragment_id: currentProject.fragmentId,
              user_id: currentProject.userId,
              category: selectedCategory,
            },
            apiHost: MATERIAL_API_HOST,
          },
        ]
      : null,
    apiFetcher,
  );

  // Non-admin: fetch from server cache
  const { data: cacheData, isLoading: cacheLoading } = useSWR(
    !isAdmin && currentProject?.source === "material" && cacheKey
      ? `/api/cache?type=material&id=${cacheKey}`
      : null,
    (url: string) => fetch(url).then((r) => r.json()),
  );

  const materialListRaw: MaterialItem[] = isAdmin
    ? (apiData?.data?.list ?? [])
    : (cacheData?.data ?? []);

  // Admin: write fetched data to server cache for non-admin access
  useEffect(() => {
    if (isAdmin && materialListRaw.length > 0 && cacheKey) {
      fetch("/api/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "material",
          id: cacheKey,
          data: materialListRaw,
        }),
      }).catch(() => {});
    }
  }, [isAdmin, materialListRaw, cacheKey]);

  const isLoading = isAdmin ? apiLoading : cacheLoading;
  const list = materialListRaw.slice(
    (page - 1) * MATERIAL_PAGE_SIZE,
    page * MATERIAL_PAGE_SIZE,
  );
  const total = materialListRaw.length;
  const totalPages = Math.ceil(total / MATERIAL_PAGE_SIZE);

  if (availableProjects.length === 0) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {isAdmin ? "欢迎使用漫剧展示系统" : "暂无共享项目"}
            </EmptyTitle>
            <EmptyDescription>
              <p>
                {isAdmin
                  ? "请点击右上角的设置按钮添加项目配置"
                  : "管理员还没有共享任何项目，请联系管理员"}
              </p>
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-border/40">
            <div className="h-[2px] bg-muted" />
            <Skeleton className="h-10 rounded-none" />
            <div className="flex h-[220px]">
              <Skeleton className="w-[200px] shrink-0 rounded-none" />
              <Skeleton className="flex-1 rounded-none" />
              <Skeleton className="w-[280px] shrink-0 rounded-none" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无数据</EmptyTitle>
            <EmptyDescription>该项目下暂无素材数据</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Subtle stats bar */}
      <div className="flex items-center justify-between px-1 py-1">
        <p className="text-xs text-muted-foreground">
          共{" "}
          <span className="font-semibold text-foreground">{total}</span> 条素材
        </p>
        <div className="flex items-center gap-5 text-[11px] text-muted-foreground/60 font-medium uppercase tracking-wider">
          <span>参考图</span>
          <span>·</span>
          <span>提示词</span>
          <span>·</span>
          <span>{selectedCategory === 5 ? "生成视频" : "生成图片"}</span>
        </div>
      </div>

      {/* Item cards */}
      {list.map((item, index) => {
        let parsedBody: ParsedRequestBody = {};
        try {
          parsedBody = JSON.parse(item.request_body);
        } catch {
          // ignore malformed JSON
        }
        const prompt =
          parsedBody?.extra_data?.display_prompt || parsedBody?.prompt || "";

        const refSet = new Set<string>();
        if (parsedBody?.image) refSet.add(parsedBody.image);
        (parsedBody?.extra_data?.materials ?? []).forEach((u) => refSet.add(u));
        const referenceImages = Array.from(refSet).filter(Boolean);

        const serial = String(
          index + (page - 1) * MATERIAL_PAGE_SIZE + 1,
        ).padStart(2, "0");

        return (
          <div
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200"
          >
            {/* Thin top accent line */}
            <div className="h-[2px] bg-linear-to-r from-primary/80 via-primary/30 to-transparent" />

            {/* Minimal header */}
            <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border/30 bg-muted/20">
              <span className="text-[11px] font-mono font-bold text-primary/70 tabular-nums">
                {serial}
              </span>
              <div className="h-3 w-px bg-border" />
              <span className="text-sm font-medium text-foreground">
                {item.name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-border/70 text-muted-foreground">
                {item.eid_name}
              </span>
              <div className="flex-1" />
              <time className="text-[11px] font-mono text-muted-foreground/50">
                {item.created_time}
              </time>
            </div>

            {/* Content row */}
            <div className="flex h-[220px] divide-x divide-border/30">
              {/* Column 1: Reference image — fixed width */}
              <div className="relative w-[200px] shrink-0 overflow-hidden">
                <ReferenceImages
                  images={referenceImages}
                  name={item.name}
                  onPreview={(src, alt) => setPreviewImage({ src, alt })}
                />
                {/* Bottom label overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2 bg-linear-to-t from-black/60 to-transparent pointer-events-none">
                  <span className="text-[10px] text-white/70 font-medium">
                    参考图
                    {referenceImages.length > 1 && (
                      <span className="ml-1 text-white/40">
                        · {referenceImages.length}张
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Column 2: Prompt — flex grow */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 px-5 pt-4 pb-3">
                  <div className="h-px flex-1 bg-border/40" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium shrink-0">
                    提示词
                  </span>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
                <div className="px-5 pb-4 flex-1 overflow-y-auto">
                  {prompt ? (
                    <p className="text-sm leading-[1.9] text-foreground/75">
                      {prompt}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs italic text-center py-6">
                      暂无提示词
                    </p>
                  )}
                </div>
              </div>

              {/* Column 3: Generated output — fixed width */}
              <div className="w-[280px] shrink-0 flex flex-col overflow-hidden bg-muted/10">
                <div className="flex items-center gap-2 px-4 pt-4 pb-3">
                  <div className="h-px flex-1 bg-border/40" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium shrink-0">
                    {selectedCategory === 5 ? "生成视频" : "生成图片"}
                  </span>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
                <div className="px-4 pb-4 flex-1 flex flex-col justify-center gap-2">
                  {item.materials && item.materials.length > 0 ? (
                    item.materials.map((mat) => {
                      const url = mat.material_resource_url;
                      const mediaType = getMediaType(url, selectedCategory);

                      if (mediaType === "video") {
                        return (
                          <div
                            key={mat.material_id}
                            className="w-full overflow-hidden rounded-lg bg-black border border-border/30 shadow-sm aspect-video"
                          >
                            <video
                              src={url}
                              controls
                              className="w-full h-full object-contain"
                            />
                          </div>
                        );
                      }

                      if (mediaType === "image") {
                        return (
                          <div
                            key={mat.material_id}
                            className="relative w-full group cursor-zoom-in rounded-lg overflow-hidden border border-border/30"
                            onClick={() =>
                              setPreviewImage({
                                src: url,
                                alt: mat.material_name,
                              })
                            }
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={mat.material_name}
                              className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 px-3 py-1 rounded-full text-xs backdrop-blur-sm shadow">
                                点击放大
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <a
                          key={mat.material_id}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm underline truncate"
                        >
                          {mat.material_name}
                        </a>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center text-muted-foreground text-xs italic aspect-video rounded-lg border border-dashed border-border/50">
                      暂无素材
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {/* Image preview dialog */}
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

const STORYBOARD_PAGE_SIZE = 20;

// ─── Character detail dialog ──────────────────────────────────────────────────

function CharacterDialog({
  character,
  onClose,
}: {
  character: Character | null;
  onClose: () => void;
}) {
  const [activeImg, setActiveImg] = useState(0);

  if (!character) return null;

  const images = character.resourceUrl ?? [];

  return (
    <Dialog open={!!character} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{character.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Image gallery */}
          {images.length > 0 && (
            <div className="space-y-2">
              {/* Main image */}
              <div className="relative w-full overflow-hidden rounded-xl bg-muted/20 border border-border/40" style={{ maxHeight: 380 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[activeImg]}
                  alt={character.name}
                  className="w-full h-full object-contain"
                  style={{ maxHeight: 380 }}
                />
              </div>

              {/* Thumbnail strip — only shown when there are multiple images */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        i === activeImg
                          ? "border-primary shadow-md"
                          : "border-border/40 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`${character.name} ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prompt */}
          {character.prompt && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium shrink-0">
                  提示词
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <p className="text-sm leading-relaxed text-foreground/80 bg-muted/20 rounded-lg p-3">
                {character.prompt}
              </p>
            </div>
          )}

          {/* Description */}
          {character.description && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium shrink-0">
                  描述
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <p className="text-sm leading-relaxed text-foreground/80 bg-muted/20 rounded-lg p-3">
                {character.description}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  const start = Math.max(1, Math.min(page - half, totalPages - windowSize + 1));
  const end = Math.min(totalPages, start + windowSize - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return (
    <div className="flex items-center justify-center gap-1 py-6">
      <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-sm" onClick={() => onPageChange(1)} disabled={page <= 1}>«</Button>
      <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>‹</Button>
      {pages.map((p) => (
        <Button key={p} variant={p === page ? "default" : "ghost"} size="sm" className="w-8 h-8 p-0 text-xs" onClick={() => onPageChange(p)}>{p}</Button>
      ))}
      <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>›</Button>
      <Button variant="ghost" size="sm" className="w-8 h-8 p-0 text-sm" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages}>»</Button>
      <span className="text-xs text-muted-foreground ml-3">共 {total} 条</span>
    </div>
  );
}

function StoryboardList() {
  const { selectedSeries, currentProject, availableProjects, isAdmin } =
    useProject();
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [selectedSeries?.id]);

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
    isAdmin ? apiFetcher : (url: string) => fetch(url).then((r) => r.json()),
  );

  const storyboardListRaw: StoryboardItem[] = isAdmin
    ? ((storyboardData as StoryboardResponse)?.result?.list ?? [])
    : ((storyboardData as { data: StoryboardItem[] })?.data ?? []);

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
  const totalPages = Math.ceil(storyboardList.length / STORYBOARD_PAGE_SIZE);
  const pagedList = storyboardList.slice(
    (page - 1) * STORYBOARD_PAGE_SIZE,
    page * STORYBOARD_PAGE_SIZE,
  );

  if (availableProjects.length === 0) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {isAdmin ? "欢迎使用漫剧展示系统" : "暂无共享项目"}
            </EmptyTitle>
            <EmptyDescription>
              <p>
                {isAdmin
                  ? "请点击右上角的设置按钮添加项目配置"
                  : "管理员还没有共享任何项目，请联系管理员"}
              </p>
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
          <div key={i} className="rounded-2xl overflow-hidden border border-border/40">
            <div className="h-[2px] bg-muted" />
            <Skeleton className="h-10 rounded-none" />
            <div className="flex h-[260px]">
              <Skeleton className="w-[160px] shrink-0 rounded-none" />
              <Skeleton className="flex-1 rounded-none" />
              <Skeleton className="w-[200px] shrink-0 rounded-none" />
              <Skeleton className="w-[280px] shrink-0 rounded-none" />
            </div>
          </div>
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
      {/* Characters strip */}
      {!charactersLoading && characters.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
          <div className="h-[2px] bg-linear-to-r from-primary/50 via-primary/15 to-transparent" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">
                角色
              </span>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 cursor-grab active:cursor-grabbing"
              style={{ scrollbarWidth: "thin" }}
            >
              {characters.map((character) => (
                <button
                  key={character.id}
                  className="shrink-0 w-[100px] group text-left cursor-pointer"
                  onClick={() => setSelectedCharacter(character)}
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted/30 border border-border/50 group-hover:border-primary/40 transition-all shadow-sm group-hover:shadow-md relative">
                    {character.resourceUrl && character.resourceUrl.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={character.resourceUrl[0]}
                        alt={character.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground/40">
                        👤
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-center pb-1.5">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white font-medium bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        查看详情
                      </span>
                    </div>
                  </div>
                  <p
                    className="mt-1.5 text-xs font-medium truncate text-center text-foreground/80"
                    title={character.name}
                  >
                    {character.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center justify-between px-1 py-1">
        <p className="text-xs text-muted-foreground">
          共{" "}
          <span className="font-semibold text-foreground">
            {storyboardList.length}
          </span>{" "}
          个分镜
        </p>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground/60 font-medium uppercase tracking-wider">
          <span>旁白</span>
          <span>·</span>
          <span>画面提示词</span>
          <span>·</span>
          <span>分镜图</span>
          <span>·</span>
          <span>视频</span>
        </div>
      </div>

      {/* Storyboard cards */}
      {pagedList.map((item) => (
        <div
          key={item.id}
          className="group overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200"
        >
          {/* Thin top accent */}
          <div className="h-[2px] bg-linear-to-r from-primary/80 via-primary/30 to-transparent" />

          {/* Minimal header */}
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border/30 bg-muted/20">
            <span className="text-[11px] font-mono font-bold text-primary/70">
              分镜 {String(item.boardIndex).padStart(2, "0")}
            </span>
            <div className="flex-1" />
          </div>

          {/* 4-column body */}
          <div className="flex h-[260px] divide-x divide-border/30">
            {/* Column 1: Narration */}
            <div className="w-[160px] shrink-0 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium shrink-0">
                  旁白
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="px-3 pb-3 flex-1 overflow-y-auto space-y-1.5">
                {item.narrationList && item.narrationList.length > 0 ? (
                  item.narrationList.map((n) => (
                    <div
                      key={n.index}
                      className="text-xs leading-relaxed border-l-2 border-primary/25 pl-2 py-1 bg-muted/15 rounded-r"
                    >
                      <div className="text-[10px] text-muted-foreground font-mono mb-0.5">
                        {n.startTime} - {n.endTime}
                      </div>
                      <div className="text-foreground/80">{n.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-xs italic">
                    暂无旁白
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Image prompt */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium shrink-0">
                  画面提示词
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="px-4 pb-3 flex-1 overflow-y-auto">
                <div className="text-sm leading-relaxed text-foreground/80 prose prose-sm max-w-none">
                  <CharacterMention
                    html={item.imagePrompt}
                    characterMap={characterMap}
                  />
                </div>
              </div>
            </div>

            {/* Column 3: Storyboard image */}
            <div className="relative w-[200px] shrink-0 overflow-hidden bg-muted/5">
              {item.imageList && item.imageList.length > 0 ? (
                <div
                  className="relative h-full w-full group cursor-zoom-in"
                  onClick={() =>
                    setPreviewImage({
                      src: item.imageList![0],
                      alt: `分镜 ${item.boardIndex}`,
                    })
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageList[0]}
                    alt={`分镜 ${item.boardIndex}`}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 px-3 py-1 rounded-full text-xs backdrop-blur-sm shadow">
                      点击放大
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs italic">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                    ?
                  </div>
                  暂无图片
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2 bg-linear-to-t from-black/50 to-transparent pointer-events-none">
                <span className="text-[10px] text-white/70 font-medium">
                  分镜图
                </span>
              </div>
            </div>

            {/* Column 4: Video prompt + video */}
            <div className="w-[280px] shrink-0 flex flex-col overflow-hidden bg-muted/10">
              <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium shrink-0">
                  视频
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <div className="px-4 pb-3 flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
                {item.videoPrompt && (
                  <div className="text-xs text-foreground/70 leading-relaxed border-l-2 border-primary/25 pl-2 py-1 overflow-y-auto max-h-[72px] shrink-0">
                    <CharacterMention
                      html={item.videoPrompt}
                      characterMap={characterMap}
                    />
                  </div>
                )}
                <div className="flex-1 flex items-center justify-center min-h-0">
                  {item.videoList && item.videoList.length > 0 ? (
                    <div className="w-full rounded-lg overflow-hidden border border-border/30 bg-black aspect-video shadow-sm">
                      <video
                        src={item.videoList[0]}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : item.videoProps && item.videoProps.length > 0 ? (
                    <div className="w-full rounded-lg overflow-hidden border border-border/30 bg-black aspect-video shadow-sm">
                      <video
                        src={item.videoProps[0].video_url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video rounded-lg border border-dashed border-border/50 flex items-center justify-center text-muted-foreground text-xs italic">
                      暂无视频
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={storyboardList.length}
        onPageChange={setPage}
      />

      {/* Image Preview Dialog */}
      {previewImage && (
        <ImagePreview
          src={previewImage.src}
          alt={previewImage.alt}
          open={!!previewImage}
          onOpenChange={(open) => !open && setPreviewImage(null)}
        />
      )}

      {/* Character Detail Dialog */}
      <CharacterDialog
        character={selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
      />
    </div>
  );
}

function ContentArea() {
  const { currentProject } = useProject();
  if (currentProject?.source === "material") {
    return <MaterialList />;
  }
  return <StoryboardList />;
}

export function ComicDisplayPage() {
  return (
    <ProjectProvider>
      <div className="flex h-screen flex-col bg-background">
        <TopBar />
        <main className="flex-1 overflow-auto min-h-0">
          <div className="container mx-auto py-6 px-4">
            <ContentArea />
          </div>
        </main>
      </div>
    </ProjectProvider>
  );
}
