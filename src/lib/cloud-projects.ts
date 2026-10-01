import { Project, AuthUser } from "@/types";

export interface AuthStatusResponse {
  user: AuthUser | null;
  configured: {
    github: boolean;
    mongodb: boolean;
    r2: boolean;
  };
}

export interface SyncResult {
  merged: Project[];
  pushedCount: number;
  pulledCount: number;
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

export async function pushProjectsToCloud(projects: Project[]): Promise<Project[]> {
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
    console.error("Error en push a la nube:", error);
    return [];
  }
}

export async function pullProjectsFromCloud(): Promise<Project[]> {
  return await fetchCloudProjects();
}

/**
 * Sincronización bidireccional inteligente:
 * Compara marcas de tiempo (updatedAt) entre local y nube.
 * - Si local es más reciente -> se sube a la nube (push).
 * - Si la nube es más reciente -> se actualiza en local (pull).
 * - Si solo existe en un lado -> se replica en el otro.
 */
export async function syncBidirectional(localProjects: Project[]): Promise<SyncResult> {
  const cloudProjects = await fetchCloudProjects();
  const cloudMap = new Map<string, Project>(cloudProjects.map((p) => [p.id, p]));
  const localMap = new Map<string, Project>(localProjects.map((p) => [p.id, p]));

  const toPush: Project[] = [];
  const mergedMap = new Map<string, Project>();
  let pulledCount = 0;

  // 1. Evaluar proyectos locales contra nube
  for (const local of localProjects) {
    const cloud = cloudMap.get(local.id);
    if (!cloud) {
      // Solo en local: subir a la nube
      toPush.push(local);
      mergedMap.set(local.id, { ...local, isCloud: true, syncedAt: Date.now() });
    } else {
      // En ambos: comparar timestamps
      if ((local.updatedAt || 0) > (cloud.updatedAt || 0)) {
        toPush.push(local);
        mergedMap.set(local.id, { ...local, isCloud: true, syncedAt: Date.now() });
      } else if ((cloud.updatedAt || 0) > (local.updatedAt || 0)) {
        mergedMap.set(cloud.id, { ...cloud, isCloud: true });
        pulledCount++;
      } else {
        // En sincronía
        mergedMap.set(cloud.id, { ...cloud, isCloud: true });
      }
    }
  }

  // 2. Evaluar proyectos en la nube que no están en local
  for (const cloud of cloudProjects) {
    if (!localMap.has(cloud.id)) {
      mergedMap.set(cloud.id, { ...cloud, isCloud: true });
      pulledCount++;
    }
  }

  // 3. Ejecutar push si hay elementos pendientes
  if (toPush.length > 0) {
    await pushProjectsToCloud(toPush);
  }

  return {
    merged: Array.from(mergedMap.values()),
    pushedCount: toPush.length,
    pulledCount,
  };
}

// Mantener retrocompatibilidad
export const syncBatchProjectsToCloud = pushProjectsToCloud;
