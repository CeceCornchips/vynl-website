import type { GalleryGridItem, MediaItem } from "@/types";

interface BeholdPost {
  id: string;
  permalink?: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  isPinned?: boolean;
  prunedCaption?: string;
  caption?: string;
}

interface BeholdFeedResponse {
  posts?: BeholdPost[];
}

function imageUrlForPost(post: BeholdPost): string | null {
  if (post.mediaType === "VIDEO") {
    return post.thumbnailUrl ?? post.mediaUrl ?? null;
  }
  return post.mediaUrl ?? null;
}

function altForPost(post: BeholdPost): string {
  const text = post.prunedCaption?.trim() || post.caption?.trim();
  if (text) return text.length > 160 ? `${text.slice(0, 157)}…` : text;
  return "Instagram post";
}

/** Fetches Behold feed, filters pinned posts, returns up to `limit` items with valid images. */
export async function fetchBeholdGalleryItems(limit = 8): Promise<GalleryGridItem[] | null> {
  const url = process.env.NEXT_PUBLIC_BEHOLD_FEED_URL?.trim();
  if (!url) return null;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = (await res.json()) as BeholdFeedResponse;
    const posts = Array.isArray(data.posts) ? data.posts : [];
    const unpinned = posts.filter((p) => p.isPinned !== true);

    const items: GalleryGridItem[] = [];
    for (const post of unpinned) {
      if (items.length >= limit) break;
      const src = imageUrlForPost(post);
      const permalink = post.permalink;
      if (!src || !permalink) continue;

      const media: MediaItem = { src, alt: altForPost(post) };
      items.push({
        id: post.id,
        alt: media.alt,
        aspect: "portrait",
        media,
        href: permalink,
      });
    }

    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}
