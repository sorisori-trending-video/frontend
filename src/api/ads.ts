export type RankedAd = {
  rank: number;
  pageName: string | null;
  brandedContentPageName: string | null;
  adId: string | null;
  startDate: string | null;
  endDate: string | null;
  publisherPlatform: string[] | null;
  impressionsText: string | null;
  impressionsMid: number | null;
  videoSdUrl: string | null;
  videoPreviewImageUrl: string | null;
  pageLikeCount: number | null;
  pageCategories: string[] | null;
  bodyText: string | null;
  adLibraryUrl: string | null;
};

export type AdsResponse = {
  count: number;
  trending: RankedAd[] | null;
  items: RankedAd[];
  cached: boolean;
};

export async function fetchTopAds(adLibraryUrl: string) {
  const qs = new URLSearchParams({ url: adLibraryUrl });
  const res = await fetch(`/api/ads/top?${qs.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json() as Promise<AdsResponse>;
}

// 프론트 -> 백엔드 요청 바디(얇게): 정규화/기본값 처리는 백엔드가 책임
export type TiktokRequestBody = {
  getTranscripts?: boolean;
  hashtags?: string[];
  hashtagsText?: string; // comma-separated 입력을 그대로 전송
  region?: string;
  scrapeTrending?: boolean;
  sortBy?: string;
};

export type TiktokItem = {
  description: string | null;
  createTime: string | null;
  isAd: boolean | null;
  author: {
    username: string | null;
    avatar: string | null;
    signature: string | null;
    region: string | null;
  };
  music: {
    title: string | null;
    author: string | null;
  };
  videoUrl: string | null;
  thumbnail: string | null;
  playCount: number | null;
  commentCount: number | null;
  shareCount: number | null;
  collectCount: number | null;
  likeCount: number | null;
  url: string | null;
  transcriptUrl: string | null;
  region: string | null;
  hashtags: string[];
  transcript: string | null;
};

export type TiktokResponse = {
  count: number;
  items: TiktokItem[];
};

export async function fetchTiktokTrending(body: TiktokRequestBody = {}) {
  const res = await fetch(`/api/ads/tiktok`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json() as Promise<TiktokResponse>;
}

export type TiktokScraperDateRange =
  | "DEFAULT"
  | "ALL_TIME"
  | "YESTERDAY"
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "LAST_THREE_MONTHS"
  | "LAST_SIX_MONTHS";

export type TiktokScraperSortType = "RELEVANCE" | "MOST_LIKED" | "DATE_POSTED";

export type TiktokScraperRequestBody = {
  startUrls: string[]; // 키워드(또는 URL). 백엔드에서 https://www.tiktok.com/search?q= 로 보정
  dateRange?: TiktokScraperDateRange;
  location?: string; // ISO country code (e.g. KR)
  sortType?: TiktokScraperSortType;
};

export type TiktokScraperItem = {
  id: string | null;
  title: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  bookmarks: number | null;
  uploadedAtFormatted: string | null;
  postPage: string | null;
  "channel.username": string | null;
  "channel.avatar": string | null;
  "video.url": string | null;
  "video.cover": string | null;
  "video.thumbnail": string | null;
};

export type TiktokScraperResponse = {
  count: number;
  items: TiktokScraperItem[];
};

export async function fetchTiktokScraper(body: TiktokScraperRequestBody) {
  const res = await fetch(`/api/ads/tiktok-scraper`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json() as Promise<TiktokScraperResponse>;
}

export type TiktokCreativeCenterTrendingVideosRequest = {
  videos_country: string; // e.g. "KR"
  videos_period: "7" | "30";
  videos_sort_by: "vv" | "like" | "comment" | "repost";
  videos_page?: number; // optional, default 1
};

export type TiktokCreativeCenterTrendingVideo = {
  item_url: string | null;
  title: string | null;
  cover: string | null;
};

export type TiktokCreativeCenterTrendingVideosResponse = {
  input: TiktokCreativeCenterTrendingVideosRequest & { videos_page?: number };
  count: number;
  pagination:
    | {
        has_more?: boolean;
        limit?: number;
        page?: number;
        total_count?: number;
      }
    | null;
  videos: TiktokCreativeCenterTrendingVideo[];
};

export async function fetchTiktokCreativeCenterTrendingVideos(params: TiktokCreativeCenterTrendingVideosRequest) {
  const qs = new URLSearchParams({
    videos_country: params.videos_country,
    videos_period: params.videos_period,
    videos_sort_by: params.videos_sort_by,
  });
  if (typeof params.videos_page === "number" && Number.isFinite(params.videos_page)) {
    qs.set("videos_page", String(params.videos_page));
  }

  const res = await fetch(`/api/ads/tiktok-creative-center/trending-videos?${qs.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json() as Promise<TiktokCreativeCenterTrendingVideosResponse>;
}

export type TiktokCreativeCenterTopAdsDashboardRequest = {
  dashboard_period: "7" | "30" | "180";
  dashboard_sort_by: "impression" | "like" | "play_6s_rate" | "play_2s_rate";
  dashboard_region?: string; // e.g. "KR" (optional)
  dashboard_industry?: string; // e.g. "14103000000" (optional)
  dashboard_page?: number; // e.g. 1 (optional, default 1)
};

export type TiktokCreativeCenterTopAdsDashboardMaterial = {
  ad_title: string | null;
  ctr: number | null;
  like: number | null;
  objective_key: string | null;
  cover: string | null;
  video_url: string | null;
};

export type TiktokCreativeCenterTopAdsDashboardResponse = {
  input: {
    dashboard_period: "7" | "30" | "180";
    dashboard_sort_by: "impression" | "like" | "play_6s_rate" | "play_2s_rate";
    dashboard_region: string[] | null;
    dashboard_industry: string[] | null;
    dashboard_page?: number;
  };
  count: number;
  pagination:
    | {
        has_more?: boolean;
        page?: number;
        size?: number;
        total_count?: number;
      }
    | null;
  materials: TiktokCreativeCenterTopAdsDashboardMaterial[];
};

export async function fetchTiktokCreativeCenterTopAdsDashboard(params: TiktokCreativeCenterTopAdsDashboardRequest) {
  const qs = new URLSearchParams({
    dashboard_period: params.dashboard_period,
    dashboard_sort_by: params.dashboard_sort_by,
  });
  if (params.dashboard_region) qs.set("dashboard_region", params.dashboard_region);
  if (params.dashboard_industry) qs.set("dashboard_industry", params.dashboard_industry);
  if (typeof params.dashboard_page === "number" && Number.isFinite(params.dashboard_page)) {
    qs.set("dashboard_page", String(params.dashboard_page));
  }

  const res = await fetch(`/api/ads/tiktok-creative-center/top-ads-dashboard?${qs.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json() as Promise<TiktokCreativeCenterTopAdsDashboardResponse>;
}
