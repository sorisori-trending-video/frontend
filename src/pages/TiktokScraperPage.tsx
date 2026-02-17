import { useEffect, useMemo, useRef, useState, type CSSProperties, type ComponentProps } from "react";
import {
  fetchTiktokScraper,
  type TiktokScraperDateRange,
  type TiktokScraperItem,
  type TiktokScraperRequestBody,
} from "../api/ads";
import { DASHBOARD_REGION_OPTIONS } from "../utils/dashboardRegionOptions";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SmsIcon from "@mui/icons-material/Sms";
import ShareIcon from "@mui/icons-material/Share";
import BookmarkIcon from "@mui/icons-material/Bookmark";

function toLocalYMD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatNumber(v: number | null) {
  if (v == null) return "-";
  return new Intl.NumberFormat("ko-KR").format(v);
}

function formatUploadedAt(v: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return `${toLocalYMD(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildHeicFallbacks(src: string): string[] {
  const s = src.trim();
  if (!s) return [];
  const out: string[] = [];
  const swapped = s.replace(/\.heic(\?|$)/i, ".jpeg$1");
  if (swapped !== s) out.push(swapped);
  out.push(`/api/ads/image-proxy?url=${encodeURIComponent(s)}`);
  return Array.from(new Set(out));
}

function SafeImg(props: Omit<ComponentProps<"img">, "src"> & { src: string | null }) {
  const { src, onError, ...rest } = props;
  const [state, setState] = useState<{ src: string | null; idx: number }>({ src, idx: 0 });

  const sources = useMemo(() => {
    if (!src) return [];
    const fallbacks = /\.hei[cf](\?|$)/i.test(src) ? buildHeicFallbacks(src) : [];
    return [src, ...fallbacks];
  }, [src]);

  const idx = state.src === src ? state.idx : 0;
  const cur = sources[idx] ?? src ?? "";
  return (
    <img
      {...rest}
      src={cur}
      onError={(e) => {
        if (idx < sources.length - 1) {
          setState((prev) => {
            const prevIdx = prev.src === src ? prev.idx : 0;
            const nextIdx = Math.min(prevIdx + 1, sources.length - 1);
            return { src, idx: nextIdx };
          });
        }
        onError?.(e);
      }}
    />
  );
}

type SelectOption = { id: string; value: string; subtitle?: string };

function toSelectOption(o: unknown): SelectOption {
  const r: Record<string, unknown> = o && typeof o === "object" ? (o as Record<string, unknown>) : {};
  const idRaw = r.id;
  const id = typeof idRaw === "string" || typeof idRaw === "number" ? String(idRaw) : "";

  const valueRaw = r.value;
  const value = typeof valueRaw === "string" ? valueRaw : valueRaw != null ? String(valueRaw) : "";

  const labelRaw = r.label;
  const subtitle = typeof labelRaw === "string" ? labelRaw : undefined;

  return { id, value, subtitle };
}

function SearchableDropdown(props: {
  label: string;
  value: SelectOption | null;
  onChange: (next: SelectOption | null) => void;
  options: readonly SelectOption[];
  buttonClassName: string;
  placeholder: string;
}) {
  const { label, value, onChange, options, buttonClassName, placeholder } = props;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return options.slice(0, 80);
    const matches = options.filter((o) => {
      const hay = `${o.id} ${o.value} ${o.subtitle ?? ""}`.toLowerCase();
      return hay.includes(qq);
    });
    return matches.slice(0, 80);
  }, [options, q]);

  return (
    <div ref={rootRef} className="relative" style={open ? { zIndex: 9999 } : undefined}>
      <button
        type="button"
        className={`${buttonClassName} flex items-center justify-between text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setQ("");
        }}
      >
        <span className="min-w-0">
          <span className="block truncate text-zinc-900">
            {value ? value.value : <span className="text-zinc-400">{placeholder}</span>}
          </span>
        </span>
        <span className="ml-2 text-zinc-400" aria-hidden="true">
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute mt-2 w-full rounded-xl border border-zinc-200 bg-white shadow-lg" style={{ zIndex: 9999 }}>
          <div className="p-2">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`${label} 검색... (코드/이름)`}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
              <button
                type="button"
                className="shrink-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                title="선택 해제"
              >
                해제
              </button>
            </div>
          </div>

          <ul className="max-h-72 overflow-auto p-1" role="listbox" aria-label={`${label} options`}>
            {filtered.map((o) => {
              const active = value?.id === o.id;
              return (
                <li key={o.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      active ? "bg-indigo-50 font-semibold text-indigo-700" : "text-zinc-900 hover:bg-zinc-50"
                    }`}
                    onClick={() => {
                      onChange(o);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate">{o.value}</div>
                      </div>
                      <div className="shrink-0 font-mono text-xs text-zinc-500">{o.id}</div>
                    </div>
                  </button>
                </li>
              );
            })}

            {filtered.length === 0 && <li className="px-3 py-3 text-sm text-zinc-500">검색 결과가 없어요.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function parseKeywordsText(text: string): string[] {
  const raw = typeof text === "string" ? text : "";
  const pieces = raw
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^#/, ""));

  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of pieces) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function formatKeywordsText(tags: string[]): string {
  const list = Array.isArray(tags) ? tags : [];
  return list.map((t) => t.trim().replace(/^#/, "")).filter(Boolean).join(", ");
}

function addKeywordToText(prev: string, tag: string): string {
  const clean = String(tag ?? "").trim().replace(/^#/, "");
  if (!clean) return prev;
  const cur = parseKeywordsText(prev);
  if (cur.some((t) => t.toLowerCase() === clean.toLowerCase())) return prev;
  return formatKeywordsText([...cur, clean]);
}

function removeKeywordFromText(prev: string, tag: string): string {
  const clean = String(tag ?? "").trim().replace(/^#/, "");
  if (!clean) return prev;
  const cur = parseKeywordsText(prev);
  const next = cur.filter((t) => t.toLowerCase() !== clean.toLowerCase());
  return formatKeywordsText(next);
}

const RECOMMENDED_KEYWORDS: { label: string; tags: string[] }[] = [
  { label: "K-Beauty", tags: ["kbeauty", "koreanskincare", "koreanmakeup", "skincare", "makeup"] },
  { label: "Shop/이커머스", tags: ["oliveyoung", "shop", "ecommerce", "smallbusiness", "onlineshopping"] },
  { label: "콘텐츠", tags: ["ai", "unboxing", "review", "tutorial", "haul"] },
];

function MediaPreview(props: { title: string; thumbnail: string | null; videoUrl: string | null }) {
  const { title, thumbnail, videoUrl } = props;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [started, setStarted] = useState(false);

  return (
    <div className="relative aspect-9/16 w-full overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200">
      {videoUrl ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          controls
          preload="none"
          playsInline
          src={videoUrl}
          poster={thumbnail ?? undefined}
          onPlay={() => setStarted(true)}
          onEnded={() => setStarted(false)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">영상 URL 없음</div>
      )}

      {!started && thumbnail && (
        <div className="absolute inset-0">
          <SafeImg
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          {videoUrl && <div className="absolute inset-0 bg-black/25" />}
        </div>
      )}

      {!started && videoUrl && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center"
          aria-label="영상 재생"
          onClick={() => {
            const el = videoRef.current;
            if (!el) return;
            setStarted(true);
            void el.play().catch(() => {});
          }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg ring-1 ring-zinc-200 transition hover:bg-white">
            <div className="ml-1 h-0 w-0 border-y-10 border-y-transparent border-l-16 border-l-zinc-900" aria-hidden="true" />
          </div>
        </button>
      )}
    </div>
  );
}

const DATE_RANGE_OPTIONS: Array<{ value: TiktokScraperDateRange; label: string }> = [
  { value: "DEFAULT", label: "기본(DEFAULT)" },
  { value: "ALL_TIME", label: "모든 기간" },
  { value: "YESTERDAY", label: "어제" },
  { value: "THIS_WEEK", label: "이번 주" },
  { value: "THIS_MONTH", label: "이번 달" },
  { value: "LAST_THREE_MONTHS", label: "3달 전" },
  { value: "LAST_SIX_MONTHS", label: "6달 전" },
];

export default function TiktokScraperPage() {
  const [keywordsText, setKeywordsText] = useState("kbeauty, koreanmakeup");
  const [dateRange, setDateRange] = useState<TiktokScraperDateRange>("THIS_MONTH");
  const [location, setLocation] = useState<string>("KR");

  const locationOptions = useMemo<SelectOption[]>(() => {
    const raw = Array.isArray(DASHBOARD_REGION_OPTIONS) ? DASHBOARD_REGION_OPTIONS : [];
    return raw.map(toSelectOption).filter((x) => Boolean(x.id) && Boolean(x.value));
  }, []);

  const locationValue = useMemo(() => {
    return locationOptions.find((o) => o.id === location) ?? null;
  }, [location, locationOptions]);

  const parsedKeywords = useMemo(() => parseKeywordsText(keywordsText), [keywordsText]);

  const [loading, setLoading] = useState(false);
  const [fetchedCount, setFetchedCount] = useState<number | null>(null);
  const [items, setItems] = useState<TiktokScraperItem[]>([]);
  const [error, setError] = useState<string>("");

  const [resultQuery, setResultQuery] = useState("");
  const [resultSort, setResultSort] = useState<"rank" | "newest" | "views" | "likes" | "comments" | "shares" | "bookmarks">(
    "rank"
  );

  const requestBody: TiktokScraperRequestBody = useMemo(() => {
    const body: TiktokScraperRequestBody = { startUrls: parsedKeywords };
    if (dateRange) body.dateRange = dateRange;
    if (location) body.location = location;
    // 정렬은 좋아요순으로 고정
    body.sortType = "MOST_LIKED";
    return body;
  }, [dateRange, location, parsedKeywords]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setItems([]);
    setFetchedCount(null);
    setLoading(true);

    try {
      const data = await fetchTiktokScraper(requestBody);
      setItems(data.items);
      setFetchedCount(data.count);
      setResultQuery("");
      setResultSort("rank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "요청 실패";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100";
  const buttonPrimary =
    "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200";
  const buttonSecondary =
    "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200";

  const clamp3Style: CSSProperties = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3,
    overflow: "hidden",
  };

  const keyedItems = useMemo(() => {
    return items.map((it, idx) => {
      const key = `${it.id ?? idx}-${it.postPage ?? it["video.url"] ?? "unknown"}`;
      return { key, rank: idx + 1, it };
    });
  }, [items]);

  const visibleItems = useMemo(() => {
    const q = resultQuery.trim().toLowerCase();
    const matchesQuery = (it: TiktokScraperItem) => {
      if (!q) return true;
      const hay = [it.title ?? "", it["channel.username"] ?? "", it.postPage ?? ""].join(" ").toLowerCase();
      return hay.includes(q);
    };

    const toNum = (v: number | null) => (typeof v === "number" && Number.isFinite(v) ? v : -1);
    const toTime = (v: string | null) => {
      if (!v) return -1;
      const t = new Date(v).getTime();
      return Number.isFinite(t) ? t : -1;
    };

    const filtered = keyedItems.filter((x) => matchesQuery(x.it));
    if (resultSort === "rank") return filtered;

    const sorted = filtered.slice();
    sorted.sort((a, b) => {
      if (resultSort === "newest") return toTime(b.it.uploadedAtFormatted) - toTime(a.it.uploadedAtFormatted);
      if (resultSort === "views") return toNum(b.it.views) - toNum(a.it.views);
      if (resultSort === "likes") return toNum(b.it.likes) - toNum(a.it.likes);
      if (resultSort === "comments") return toNum(b.it.comments) - toNum(a.it.comments);
      if (resultSort === "shares") return toNum(b.it.shares) - toNum(a.it.shares);
      if (resultSort === "bookmarks") return toNum(b.it.bookmarks) - toNum(a.it.bookmarks);
      return 0;
    });
    return sorted;
  }, [keyedItems, resultQuery, resultSort]);

  return (
    <div className="min-h-dvh bg-linear-to-b from-white via-white to-indigo-50/60">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Tiktok scraper</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">TikTok Search Scraper(2)</h1>
            <p className="mt-1 text-sm text-zinc-600">검색 키워드로 틱톡 결과를 가져와요.</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
            >
              메인으로
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-200/70 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-7">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-4 grid-cols-1 xl:w-[60%]">
              <label className="text-sm font-medium text-zinc-900">
                검색 키워드 (쉼표로 구분)
                <input
                  className={inputBase}
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="예) oliveyoung, ai"
                  autoComplete="off"
                />
                <div className="mt-2 grid gap-2">
                  <div className="text-xs font-semibold text-zinc-500">추천 키워드 (클릭하면 추가)</div>
                  <div className="grid gap-2">
                    {RECOMMENDED_KEYWORDS.map((group) => (
                      <div key={group.label} className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-zinc-500">{group.label}</span>
                        {group.tags.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                            onClick={() => setKeywordsText((cur) => addKeywordToText(cur, t))}
                            title={`${t} 추가`}
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>

                  {parsedKeywords.length > 0 && (
                    <div className="mt-1 rounded-2xl border border-zinc-200 bg-white/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-zinc-600">현재 입력된 키워드</div>
                        <button
                          type="button"
                          className="text-xs font-semibold text-zinc-600 hover:underline"
                          onClick={() => setKeywordsText("")}
                        >
                          모두 지우기
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {parsedKeywords.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                            onClick={() => setKeywordsText((cur) => removeKeywordFromText(cur, t))}
                            title="클릭하면 제거"
                          >
                            <span>#{t}</span>
                            <span className="text-indigo-500" aria-hidden="true">
                              ×
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-zinc-500">
                        팁: 입력창에 <span className="font-semibold text-zinc-700">쉼표(,)</span>로 여러 개를 구분해요.
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-zinc-900">
                국가
                <SearchableDropdown
                  label="국가"
                  value={locationValue}
                  onChange={(next) => setLocation((next?.id || "").toUpperCase())}
                  options={locationOptions}
                  buttonClassName={`${inputBase} cursor-pointer`}
                  placeholder="South Korea (KR)"
                />
              </label>
              <label className="text-sm font-medium text-zinc-900">
                기간
                <select
                  className={inputBase}
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as TiktokScraperDateRange)}
                >
                  {DATE_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button className={buttonPrimary} type="submit" disabled={loading}>
                {loading ? "불러오는 중..." : "가져오기"}
              </button>

              {/* {fetchedCount != null && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                  <span className="font-medium">가져온 개수</span>
                  <span className="tabular-nums">{fetchedCount}개</span>
                </div>
              )} */}

              <button
                className={buttonSecondary}
                type="button"
                onClick={() => {
                  setError("");
                  setItems([]);
                  setFetchedCount(null);
                  setResultQuery("");
                  setResultSort("rank");
                }}
                disabled={loading}
              >
                결과 초기화
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <div className="font-semibold">요청 실패</div>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap wrap-break-word text-xs leading-relaxed">{error}</pre>
          </div>
        )}

        <div className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-indigo-700">Results</div>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">검색 결과</h2>
              {(fetchedCount != null || items.length > 0) && (
                <div className="mt-1 text-sm text-zinc-600">
                  전체 {fetchedCount ?? items.length}개
                </div>
              )}
            </div>

            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
              <label className="text-sm font-medium text-zinc-900">
                결과 검색
                <input
                  className={inputBase}
                  value={resultQuery}
                  onChange={(e) => setResultQuery(e.target.value)}
                  placeholder="제목, @계정..."
                  autoComplete="off"
                />
              </label>

              <label className="text-sm font-medium text-zinc-900">
                정렬
                <select className={inputBase} value={resultSort} onChange={(e) => setResultSort(e.target.value as typeof resultSort)}>
                  <option value="rank">기본(가져온 순서)</option>
                  <option value="newest">최신 업로드</option>
                  <option value="views">조회수</option>
                  <option value="likes">좋아요</option>
                  <option value="comments">댓글</option>
                  <option value="shares">공유</option>
                  <option value="bookmarks">저장</option>
                </select>
              </label>
            </div>
          </div>

          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visibleItems.map(({ it, key, rank }) => {
              const title = it.title ?? `@${it["channel.username"] ?? "author"}`;
              const thumbnail = it["video.thumbnail"] ?? it["video.cover"] ?? null;
              const videoUrl = it["video.url"] ?? null;
              const username = it["channel.username"];
              // const avatar = it["channel.avatar"];

              return (
                <li
                  key={key}
                  className="flex h-full flex-col rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="p-3">
                    <MediaPreview title={title} thumbnail={thumbnail} videoUrl={videoUrl} />
                  </div>

                  <div className="flex flex-1 flex-col px-4 pb-4">
                    <div className="flex flex-col items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex shrink-0 items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                          #{rank}
                        </span>
                        {/* {avatar ? (
                          <img
                            src={avatar}
                            alt={username ?? "author"}
                            className="h-8 w-8 shrink-0 rounded-full ring-1 ring-zinc-200"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-100 ring-1 ring-zinc-200" />
                        )} */}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-900" title={username ?? undefined}>
                            @{username ?? "-"}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right text-xs text-zinc-500">
                        <div className="tabular-nums">{formatUploadedAt(it.uploadedAtFormatted)}</div>
                      </div>
                    </div>

                    {it.title && (
                      <div className="mt-3 text-sm leading-relaxed text-zinc-800" style={clamp3Style} title={it.title}>
                        {it.title}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-700">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 ring-1 ring-zinc-200" title="Views">
                        <VisibilityIcon fontSize="small" className="text-zinc-500" />
                        <span className="tabular-nums font-semibold text-zinc-900">{formatNumber(it.views)}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 ring-1 ring-zinc-200" title="Likes">
                        <FavoriteIcon fontSize="small" className="text-rose-500" />
                        <span className="tabular-nums font-semibold text-zinc-900">{formatNumber(it.likes)}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 ring-1 ring-zinc-200" title="Comments">
                        <SmsIcon fontSize="small" className="text-zinc-500" />
                        <span className="tabular-nums font-semibold text-zinc-900">{formatNumber(it.comments)}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 ring-1 ring-zinc-200" title="Shares">
                        <ShareIcon fontSize="small" className="text-zinc-500" />
                        <span className="tabular-nums font-semibold text-zinc-900">{formatNumber(it.shares)}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 ring-1 ring-zinc-200" title="Bookmarks">
                        <BookmarkIcon fontSize="small" className="text-zinc-500" />
                        <span className="tabular-nums font-semibold text-zinc-900">{formatNumber(it.bookmarks)}</span>
                      </div>
                    </div>

                    <div className="mt-auto grid gap-2 pt-4 sm:grid-cols-1">
                      {it.postPage ? (
                        <a
                          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
                          href={it.postPage}
                          target="_blank"
                          rel="noreferrer"
                        >
                          TikTok에서 보기
                        </a>
                      ) : (
                        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-semibold text-zinc-400">
                          TikTok 링크 없음
                        </div>
                      )}

                      {/* {videoUrl ? (
                        <a
                          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                          href={videoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          영상 링크
                        </a>
                      ) : (
                        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-semibold text-zinc-400">
                          영상 링크 없음
                        </div>
                      )} */}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {!loading && !error && items.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center text-sm text-zinc-600">
              아직 결과가 없어요. 위에서 조건을 입력하고 가져와보세요.
            </div>
          )}

          {!loading && !error && items.length > 0 && visibleItems.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center text-sm text-zinc-600">
              검색/정렬 조건에 맞는 결과가 없어요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

