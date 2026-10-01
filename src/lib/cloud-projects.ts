import { Project, AuthUser } from "@/types";

export interface AuthStatusResponse {
  user: AuthUser | null;
  configured: {
    github: boolean;
    mongodb: boolean;
    r2: boolean;
  };
}

export async function fetchAuthStatus(): Promise<AuthStatusResponse> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) {
      return {
        user: null,
        configured: { github: false, mongodb: false, r2: false },
      };
    }
    return await res.json();
  } catch {
    return {
      user: null,
      configured: { github: false, mongodb: false, r2: false },
    };
  }
}

export async function fetchCloudProjects(): Promise<Project[]> {
  try {
    const res = await fetch("/api/projects", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.projects) ? data.projects : [];
  } catch (error) {
    console.error("Error al obtener proyectos de la nube:", error);
    return [];
  }
}

export async function saveProjectToCloud(project: Project): Promise<Project | null> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.project || null;
  } catch (error) {
    console.error("Error al guardar proyecto en la nube:", error);
    return null;
  }
}

export async function deleteProjectFromCloud(projectId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (error) {
    console.error("Error al borrar proyecto de la nube:", error);
    return false;
  }
}

export async function syncBatchProjectsToCloud(projects: Project[]): Promise<Project[]> {
  try {
    const res = await fetch("/api/projects/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projects }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.projects) ? data.projects : [];
  } catch (error) {
    console.error("Error al sincronizar proyectos masivamente:", error);
    return [];
  }
}
