import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { getCodeFromR2, isR2Configured } from "@/lib/r2";
import { PublicUserProfile, PublicProjectCard } from "@/types";
import { UserMenu } from "@/components/auth/UserMenu";
import {
  User,
  Globe,
  Calendar,
  Code2,
  FolderCode,
  ExternalLink,
  ArrowLeft,
  Lock,
  Layers,
  Mail,
  Github,
  Twitter,
  Linkedin,
  MessageSquare,
  Youtube,
} from "lucide-react";

interface Props {
  params: Promise<{ username: string }>;
}

async function getProfileData(username: string): Promise<PublicUserProfile | null> {
  const cleanUsername = username?.trim().toLowerCase();
  if (!cleanUsername || !isMongoConfigured()) return null;

  try {
    const db = await getDb();
    const usersCol = db.collection("users");
    const projectsCol = db.collection("projects");

    const userDoc = await usersCol.findOne({
      username: { $regex: new RegExp(`^${cleanUsername}$`, "i") },
    });

    if (!userDoc) return null;

    const visibility = userDoc.profileVisibility || "public";
    if (visibility === "private") return null;

    const userId = userDoc._id.toString();

    // Proyectos con visibilidad 'public'
    const publicDocs = await projectsCol
      .find({
        userId,
        visibility: "public",
      })
      .sort({ updatedAt: -1 })
      .toArray();

    const featuredProjectIds: string[] = userDoc.featuredProjectIds || [];

    const featuredProjects: PublicProjectCard[] = await Promise.all(
      publicDocs
        .filter((doc) => featuredProjectIds.length === 0 || featuredProjectIds.includes(doc.projectId))
        .slice(0, 6)
        .map(async (doc) => {
          let code: string | undefined = undefined;

          // Solo se lee y envía el código si el usuario activó explícitamente publicCode
          if (doc.publicCode) {
            code = doc.code || "";
            if (doc.r2Key && isR2Configured()) {
              try {
                code = await getCodeFromR2(doc.r2Key);
              } catch {}
            }
          }

          return {
            id: doc.projectId,
            name: doc.name,
            language: doc.language || "cpp",
            compiler: doc.compiler || "",
            options: doc.options || "",
            updatedAt: doc.updatedAt || Date.now(),
            publicCode: Boolean(doc.publicCode),
            code,
            stdin: doc.publicCode ? doc.stdin : undefined,
          };
        })
    );

    const userCollections = Array.isArray(userDoc.collections) ? userDoc.collections : [];
    const collectionsWithCount = userCollections.map((col: { id: string; name: string }) => {
      const count = publicDocs.filter(
        (p) => Array.isArray(p.collectionIds) && p.collectionIds.includes(col.id)
      ).length;
      return {
        id: col.id,
        name: col.name,
        projectCount: count,
      };
    });

    return {
      username: userDoc.username,
      name: userDoc.name || userDoc.username,
      avatarUrl: userDoc.avatarUrl || "",
      bio: userDoc.bio || "",
      website: userDoc.website || "",
      githubUrl: userDoc.githubUrl || `https://github.com/${userDoc.username}`,
      publicEmail: userDoc.isEmailPublic && userDoc.email ? userDoc.email : undefined,
      socials: userDoc.socials || {},
      availableForCollaboration: userDoc.availableForCollaboration ?? true,
      profileVisibility: visibility,
      showActivity: userDoc.showActivity ?? true,
      featuredProjects,
      collections: collectionsWithCount,
      stats: {
        publicProjectsCount: publicDocs.length,
        joinedAt: userDoc.createdAt ? new Date(userDoc.createdAt).getTime() : Date.now(),
      },
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileData(username);

  if (!profile) {
    return {
      title: "Perfil no encontrado | ejecuta.tech",
      robots: { index: false, follow: false },
    };
  }

  const isUnlisted = profile.profileVisibility === "unlisted";

  return {
    title: `${profile.name} (@${profile.username}) | ejecuta.tech`,
    description: profile.bio || `Perfil de desarrollador de @${profile.username} en ejecuta.tech`,
    robots: isUnlisted
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: `${profile.name} (@${profile.username})`,
      description: profile.bio || "Proyectos y código en ejecuta.tech",
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getProfileData(username);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#08090f] text-zinc-100 flex flex-col font-mono selection:bg-neon-green/30 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-[#08090f]/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/playground"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/70 border border-transparent hover:border-zinc-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-neon-green" />
            <span>Playground</span>
          </Link>

          <Link href="/" className="font-bold text-xs tracking-wide text-zinc-200">
            ejecuta<span className="text-neon-green">.tech</span>
          </Link>

          <div className="flex items-center gap-3">
            <UserMenu compact />
          </div>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-4 py-10 flex-1">
        {/* Banner de perfil no listado */}
        {profile.profileVisibility === "unlisted" && (
          <div className="mb-6 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2 font-sans">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Perfil no indexado:</strong> Este perfil no aparece en motores de búsqueda ni listados públicos.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Columna Izquierda: Información de Usuario */}
          <aside className="md:col-span-4 space-y-6">
            <div className="bg-[#0b0e15] border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 rounded-full blur-2xl pointer-events-none" />

              {/* Avatar */}
              <div className="relative mb-4 inline-block">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-24 h-24 rounded-2xl border-2 border-zinc-700 object-cover shadow-xl bg-zinc-900"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-500">
                    <User className="w-10 h-10" />
                  </div>
                )}
                {profile.availableForCollaboration && (
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-neon-green rounded-full border-2 border-[#0b0e15]"
                    title="Disponible para colaborar"
                  />
                )}
              </div>

              {/* Nombres */}
              <h1 className="text-xl font-bold text-white tracking-tight">
                {profile.name}
              </h1>
              <div className="text-xs text-neon-green font-bold">
                @{profile.username}
              </div>

              {/* Estado disponible para colaborar */}
              {profile.availableForCollaboration && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon-green/10 border border-neon-green/30 text-[10px] text-neon-green font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                  <span>Disponible para colaborar</span>
                </div>
              )}

              {/* Biografía */}
              {profile.bio && (
                <p className="mt-4 text-xs text-zinc-300 font-sans leading-relaxed border-t border-zinc-800/80 pt-3">
                  {profile.bio}
                </p>
              )}

              {/* Enlaces, Redes y Metadatos */}
              <div className="mt-5 pt-4 border-t border-zinc-800/80 space-y-2.5 text-xs text-zinc-400 font-sans">
                {/* Botón de GitHub */}
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4 text-white" />
                      <span className="font-mono text-xs font-semibold">GitHub</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                  </a>
                )}

                {/* Correo público */}
                {profile.publicEmail && (
                  <a
                    href={`mailto:${profile.publicEmail}`}
                    className="flex items-center gap-2 hover:text-neon-green transition-colors truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{profile.publicEmail}</span>
                  </a>
                )}

                {/* Sitio web */}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-neon-cyan transition-colors truncate"
                  >
                    <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{profile.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                )}

                {/* Otras Redes Sociales */}
                {profile.socials && Object.values(profile.socials).some(Boolean) && (
                  <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                    {profile.socials.twitter && (
                      <a
                        href={profile.socials.twitter.startsWith("http") ? profile.socials.twitter : `https://x.com/${profile.socials.twitter.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        <Twitter className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate">{profile.socials.twitter.replace(/^https?:\/\/(x|twitter)\.com\//, "@")}</span>
                      </a>
                    )}

                    {profile.socials.linkedin && (
                      <a
                        href={profile.socials.linkedin.startsWith("http") ? profile.socials.linkedin : `https://linkedin.com/in/${profile.socials.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        <Linkedin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">LinkedIn</span>
                      </a>
                    )}

                    {profile.socials.discord && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{profile.socials.discord}</span>
                      </div>
                    )}

                    {profile.socials.youtube && (
                      <a
                        href={profile.socials.youtube.startsWith("http") ? profile.socials.youtube : `https://youtube.com/@${profile.socials.youtube.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                      >
                        <Youtube className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">YouTube</span>
                      </a>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-zinc-500 text-[11px] pt-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>Miembro desde {new Date(profile.stats.joinedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Colecciones públicas */}
            {profile.collections.length > 0 && (
              <div className="bg-[#0b0e15] border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Layers className="w-3.5 h-3.5 text-neon-cyan" />
                  <span>Colecciones</span>
                </div>
                <div className="space-y-1.5">
                  {profile.collections.map((col) => (
                    <div
                      key={col.id}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-black/40 border border-zinc-800/80"
                    >
                      <span className="text-zinc-300 truncate">{col.name}</span>
                      <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        {col.projectCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Columna Derecha: Proyectos Públicos Destacados */}
          <div className="md:col-span-8 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <FolderCode className="w-4 h-4 text-neon-green" />
                  <span>Proyectos Públicos ({profile.stats.publicProjectsCount})</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {profile.featuredProjects.length} destacados
                </span>
              </div>

              {profile.featuredProjects.length === 0 ? (
                <div className="p-8 rounded-2xl border border-zinc-800/80 bg-[#0b0e15] text-center text-zinc-500 text-xs">
                  <Code2 className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p>Este usuario aún no tiene proyectos públicos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.featuredProjects.map((project) => (
                    <ProjectCardItem key={project.id} project={project} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800/60 py-6 text-center text-xs text-zinc-600 font-mono">
        ejecuta.tech • Entorno de ejecución en la nube
      </footer>
    </div>
  );
}

function ProjectCardItem({ project }: { project: PublicProjectCard }) {
  return (
    <div className="p-4 rounded-xl bg-[#0b0e15] border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-white text-xs tracking-wide group-hover:text-neon-green transition-colors truncate">
            {project.name}
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono uppercase shrink-0">
            {project.language}
          </span>
        </div>

        {project.options && (
          <div className="text-[10px] text-zinc-500 font-mono mb-3 truncate">
            {project.options}
          </div>
        )}

        {/* Muestra previa de código solo si el autor activó publicCode */}
        {project.publicCode && project.code && (
          <pre className="p-2.5 rounded-lg bg-black border border-zinc-800/80 text-[10px] text-zinc-400 font-mono overflow-hidden line-clamp-3 mb-3">
            <code>{project.code}</code>
          </pre>
        )}
      </div>

      <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
        {project.publicCode ? (
          <span className="text-neon-cyan flex items-center gap-1 text-[10px]">
            <Code2 className="w-3 h-3" />
            <span>Código visible</span>
          </span>
        ) : (
          <span className="text-zinc-500 flex items-center gap-1 text-[10px]" title="Código privado por decisión del autor">
            <Lock className="w-3 h-3" />
            <span>Código oculto</span>
          </span>
        )}

        <Link
          href={`/playground?loadProject=${project.id}`}
          className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
        >
          <span>Abrir</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
