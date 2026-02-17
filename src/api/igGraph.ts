export type IgRankedMedia = {
  rank: number;
  id: string;
  mediaType: string | null;
  mediaProductType: string | null;
  caption: string | null;
  permalink: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  likeCount: number | null;
  commentsCount: number | null;
  timestamp: string | null;
  score: number;
};

export type IgTopResponse = {
  hashtag: string;
  hashtagId: string;
  count: number;
  items: IgRankedMedia[];
};

export async function fetchTopIgByHashtag(params: { hashtag: string; limit: number }) {
  const qs = new URLSearchParams({
    hashtag: params.hashtag,
    limit: String(params.limit),
  });

  const res = await fetch(`/api/ig-graph/top?${qs.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json() as Promise<IgTopResponse>;
}
