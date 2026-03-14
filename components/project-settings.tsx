"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Settings as SettingsIcon, Share2, Check, Loader2, Video, Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Project } from "@/lib/config";
import { getStoredProjects, saveProjects, deleteProject } from "@/lib/storage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/user-management";
import { LoginRecords } from "@/components/login-records";

interface ProjectSettingsProps {
  onProjectsChange: () => void;
}

export function ProjectSettings({ onProjectsChange }: ProjectSettingsProps) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    projectId: "",
    token: "",
    source: "storyboard" as "storyboard" | "material",
    fragmentId: "",
    userId: "",
  });
  const [sharedProjectIds, setSharedProjectIds] = useState<Set<number>>(new Set());
  const [sharingId, setSharingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/share")
        .then((res) => res.json())
        .then((data) => {
          const ids = new Set<number>(
            (data.projects ?? []).map((p: { projectId: number }) => p.projectId)
          );
          setSharedProjectIds(ids);
        })
        .catch(() => {});
    }
  }, [open]);

  async function handleShareProject(project: Project) {
    setSharingId(project.id);
    try {
      await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: project.id,
          name: project.name,
          projectId: project.projectId,
          source: project.source,
        }),
      });
      setSharedProjectIds((prev) => new Set(prev).add(project.projectId));
    } catch (error) {
      console.error("Failed to share:", error);
    } finally {
      setSharingId(null);
    }
  }

  async function handleUnshareProject(project: Project) {
    setSharingId(project.id);
    try {
      await fetch(`/api/share?projectId=${project.projectId}`, {
        method: "DELETE",
      });
      setSharedProjectIds((prev) => {
        const next = new Set(prev);
        next.delete(project.projectId);
        return next;
      });
    } catch (error) {
      console.error("Failed to unshare:", error);
    } finally {
      setSharingId(null);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      const loadedProjects = getStoredProjects();
      setProjects(loadedProjects);
      setIsAdding(loadedProjects.length === 0);
    }
  }

  function handleAddProject() {
    const isMaterial = newProject.source === "material";
    if (!newProject.name || !newProject.projectId || !newProject.token) return;
    if (isMaterial && (!newProject.fragmentId || !newProject.userId)) return;

    const project: Project = {
      id: `custom-${Date.now()}`,
      name: newProject.name,
      projectId: parseInt(newProject.projectId, 10),
      token: newProject.token,
      source: newProject.source,
      ...(isMaterial && {
        fragmentId: parseInt(newProject.fragmentId, 10),
        userId: parseInt(newProject.userId, 10),
      }),
    };

    const updatedProjects = [...projects, project];
    setProjects(updatedProjects);
    saveProjects(updatedProjects);

    setNewProject({ name: "", projectId: "", token: "", source: "storyboard", fragmentId: "", userId: "" });
    setIsAdding(false);
    onProjectsChange();
  }

  function handleDeleteProject(id: string) {
    deleteProject(id);
    setProjects(projects.filter((p) => p.id !== id));
    onProjectsChange();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <SettingsIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>系统设置</DialogTitle>
          <DialogDescription>
            管理您的项目配置和系统用户。
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none p-0 bg-transparent mb-4">
            <TabsTrigger 
              value="projects" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2"
            >
              项目配置
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2"
            >
              用户管理
            </TabsTrigger>
            <TabsTrigger 
              value="logins"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2"
            >
              登录日志
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4 m-0">
            {/* Project List */}
            <div className="space-y-3">
              {projects.length === 0 && !isAdding && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-4 rounded-full bg-primary/10 p-3">
                      <SettingsIcon className="size-8 text-primary" />
                    </div>
                    <p className="text-sm font-medium mb-2">
                      还没有项目配置
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      添加第一个项目开始使用系统
                    </p>
                  </CardContent>
                </Card>
              )}

              {projects.map((project) => {
                const isShared = sharedProjectIds.has(project.projectId);
                const isProcessing = sharingId === project.id;

                return (
                  <Card key={project.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base">{project.name}</CardTitle>
                            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                              project.source === "material"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-purple-500/10 text-purple-600"
                            }`}>
                              {project.source === "material" ? "素材系统" : "漫剧系统"}
                            </span>
                            {isShared && (
                              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                已共享
                              </span>
                            )}
                          </div>
                          <CardDescription className="text-xs">
                            项目ID: {project.projectId}
                            {project.source === "material" && project.fragmentId && (
                              <> · 任务ID: {project.fragmentId}</>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant={isShared ? "secondary" : "outline"}
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            disabled={isProcessing}
                            onClick={() =>
                              isShared
                                ? handleUnshareProject(project)
                                : handleShareProject(project)
                            }
                          >
                            {isProcessing ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : isShared ? (
                              <Check className="size-3.5" />
                            ) : (
                              <Share2 className="size-3.5" />
                            )}
                            {isShared ? "取消共享" : "共享"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Token</Label>
                          <div className="mt-1 rounded-md bg-muted px-3 py-2 font-mono text-xs break-all">
                            {project.token.substring(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Add New Project Form */}
              {isAdding && (
                <Card className="border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">添加新项目</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Source type selector */}
                    <div className="space-y-2">
                      <Label>系统类型</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewProject({ ...newProject, source: "storyboard", fragmentId: "", userId: "" })}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                            newProject.source === "storyboard"
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <Video className="size-4" />
                          漫剧系统
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewProject({ ...newProject, source: "material" })}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                            newProject.source === "material"
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <Image className="size-4" />
                          素材系统
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-name">项目名称</Label>
                      <Input
                        id="project-name"
                        placeholder="例如：我的项目"
                        value={newProject.name}
                        onChange={(e) =>
                          setNewProject({ ...newProject, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-id">项目ID</Label>
                      <Input
                        id="project-id"
                        type="number"
                        placeholder="例如：2806"
                        value={newProject.projectId}
                        onChange={(e) =>
                          setNewProject({ ...newProject, projectId: e.target.value })
                        }
                      />
                    </div>

                    {newProject.source === "material" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="fragment-id">任务ID（fragment_id）</Label>
                          <Input
                            id="fragment-id"
                            type="number"
                            placeholder="例如：23963"
                            value={newProject.fragmentId}
                            onChange={(e) =>
                              setNewProject({ ...newProject, fragmentId: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="user-id">用户ID（user_id）</Label>
                          <Input
                            id="user-id"
                            type="number"
                            placeholder="例如：3717"
                            value={newProject.userId}
                            onChange={(e) =>
                              setNewProject({ ...newProject, userId: e.target.value })
                            }
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="project-token">Token</Label>
                      <Input
                        id="project-token"
                        placeholder="粘贴您的项目Token"
                        value={newProject.token}
                        onChange={(e) =>
                          setNewProject({ ...newProject, token: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddProject}
                        disabled={
                          !newProject.name ||
                          !newProject.projectId ||
                          !newProject.token ||
                          (newProject.source === "material" && (!newProject.fragmentId || !newProject.userId))
                        }
                      >
                        保存
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAdding(false);
                          setNewProject({ name: "", projectId: "", token: "", source: "storyboard", fragmentId: "", userId: "" });
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />

            {/* Add Button */}
            {!isAdding && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="mr-2 size-4" />
                添加项目
              </Button>
            )}

            {/* Help Text */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4 text-xs text-muted-foreground space-y-2">
                <p className="font-medium">💡 使用说明：</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>项目配置保存在浏览器本地存储中</li>
                  <li>清除浏览器数据会导致配置丢失</li>
                  <li>Token信息仅存储在本地，不会上传到服务器</li>
                  <li>如需在其他设备使用，需要重新配置</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="m-0">
            <UserManagement />
          </TabsContent>

          <TabsContent value="logins" className="m-0">
            <LoginRecords />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
