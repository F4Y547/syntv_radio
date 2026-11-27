import { revalidateTag } from "next/cache";
import { bumpSeoGeneration } from "@/lib/seo/cache";
import { PUBLIC_CACHE_TAGS, type PublicCacheTagKey } from "@/lib/seo/tags";
import { invalidatePublicCache } from "./public-cache";

/**
 * Single invalidation entry point for public, unauthenticated directory data.
 * Bumps the shared Redis generation and expires the matching Next cache tags.
 */
export async function invalidatePublicDirectoryCache(tags: PublicCacheTagKey[]): Promise<void> {
  await bumpSeoGeneration();
  await invalidatePublicCache(tags);

  for (const tag of tags) {
    try {
      revalidateTag(PUBLIC_CACHE_TAGS[tag], { expire: 0 });
    } catch {
      console.warn("[public-cache] cache tag revalidation unavailable");
    }
  }
}
