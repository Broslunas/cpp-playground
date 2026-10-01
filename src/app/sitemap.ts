import type { MetadataRoute } from "next";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { SUPPORTED_LANGUAGES_LIST } from "@/lib/languages";

const SITE_URL = "https://ejecuta.tech";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes: home + per-language playgrounds.
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/playground`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...SUPPORTED_LANGUAGES_LIST.map((lang) => ({
      url: `${SITE_URL}/${lang.id}/playground`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  if (!isMongoConfigured()) {
    return staticUrls;
  }

  try {
    const db = await getDb();
    // Only public + unlisted (unlisted has noindex anyway, but include for completeness).
    const users = await db
      .collection("users")
      .find(
        { profileVisibility: { $in: ["public", "unlisted"] } },
        { projection: { username: 1, updatedAt: 1, createdAt: 1 } },
      )
      .toArray();

    const profileUrls: MetadataRoute.Sitemap = users
      .filter((u) => typeof u.username === "string" && u.username.length > 0)
      .map((u) => ({
        url: `${SITE_URL}/u/${u.username}`,
        lastModified: u.updatedAt ? new Date(u.updatedAt) : u.createdAt ? new Date(u.createdAt) : now,
        changeFrequency: "weekly",
        priority: 0.6,
      }));

    return [...staticUrls, ...profileUrls];
  } catch {
    // Mongo unreachable at build time → ship the static set, never fail the build.
    return staticUrls;
  }
}
