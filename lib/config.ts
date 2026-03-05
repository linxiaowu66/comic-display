export const API_HOST = "https://jzzm.duanju.com/gw";
export const MATERIAL_API_HOST = "https://aiapi.duanju.com";

export interface Project {
  id: string;
  name: string;
  projectId: number;
  token: string;
  source?: "storyboard" | "material";
  fragmentId?: number;
  userId?: number;
}

// 默认项目配置（示例）
export const DEFAULT_PROJECTS: Project[] = [];

// 导出用于兼容性
export const PROJECTS = DEFAULT_PROJECTS;
