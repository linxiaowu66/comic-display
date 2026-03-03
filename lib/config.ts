export const API_HOST = "https://jzzm.duanju.com/gw";

export interface Project {
  id: string;
  name: string;
  projectId: number;
  token: string;
}

// 默认项目配置（示例）
export const DEFAULT_PROJECTS: Project[] = [];

// 导出用于兼容性
export const PROJECTS = DEFAULT_PROJECTS;
