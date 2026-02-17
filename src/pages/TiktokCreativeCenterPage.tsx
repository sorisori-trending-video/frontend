import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  fetchTiktokCreativeCenterTrendingVideos,
  type TiktokCreativeCenterTrendingVideo,
  type TiktokCreativeCenterTrendingVideosRequest,
} from "../api/ads";
import { TRENDING_REGION_OPTIONS } from "../utils/trendingRegionOptions";

type SelectOption = { id: string; value: string; subtitle?: string };

function SearchableDropdown(props: {
  label: string;
  value: SelectOption | null;
  onChange: (next: SelectOption | null) => void;
  options: readonly SelectOption[];
  buttonClassName: string;
  placeholder: string;
  allowClear?: boolean;
}) {
  const { label, value, onChange, options, buttonClassName, placeholder, allowClear = true } = props;
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
                placeholder={`${label} 검색... (id/이름)`}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />
              {allowClear && (
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
              )}
            </div>
          </div>

          <ul className="max-h-56 overflow-auto p-1" role="listbox" aria-label={`${label} options`}>
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
                      {/* <div className="shrink-0 font-mono text-xs text-zinc-500">{o.id}</div> */}
                    </div>
                  </button>
                </li>
              );
            })}

            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-zinc-500">검색 결과가 없어요.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function TiktokCreativeCenterPage() {
  const [videosCountry, setVideosCountry] = useState("KR");
  const [videosPeriod, setVideosPeriod] = useState<"7" | "30">("7");
  const [videosSortBy, setVideosSortBy] = useState<"vv" | "like" | "comment" | "repost">("vv");
  const [videosPage, setVideosPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [count, setCount] = useState<number | null>(null);
  const [videos, setVideos] = useState<TiktokCreativeCenterTrendingVideo[]>([]);
  const [openTitleKey, setOpenTitleKey] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ has_more?: boolean; limit?: number; page?: number; total_count?: number } | null>(null);

  const countryOptions = useMemo<SelectOption[]>(() => {
    const raw = Array.isArray(TRENDING_REGION_OPTIONS) ? TRENDING_REGION_OPTIONS : [];
    return raw.map((o) => ({
      id: String(o.id),
      value: String(o.value),
      subtitle: String(o.label),
    }));
  }, []);

  const selectedCountry = useMemo<SelectOption | null>(() => {
    const found = countryOptions.find((o) => o.id === videosCountry);
    return found ?? null;
  }, [countryOptions, videosCountry]);

  const request = useMemo<TiktokCreativeCenterTrendingVideosRequest>(() => {
    return {
      videos_country: videosCountry,
      videos_period: videosPeriod,
      videos_sort_by: videosSortBy,
    };
  }, [videosCountry, videosPeriod, videosSortBy]);

  const fetchPage = async (page: number) => {
    const nextPage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    setError("");
    setLoading(true);
    setVideos([]);
    setCount(null);
    setPagination(null);
    setOpenTitleKey(null);
    setVideosPage(nextPage);

    try {
      const data = await fetchTiktokCreativeCenterTrendingVideos({ ...request, videos_page: nextPage });
      setVideos(data.videos ?? []);
      setCount(typeof data.count === "number" ? data.count : (data.videos ?? []).length);
      setPagination(data.pagination ?? null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "요청 실패";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchPage(1);
  };

  const clamp3Style: CSSProperties = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3,
    overflow: "hidden",
  };

  const inputBase =
    "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:shadow-md focus:shadow-indigo-200";
  const buttonPrimary =
    "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus:shadow-md focus:shadow-indigo-200";
  const buttonSecondary =
    "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200";

  return (
    <div className="min-h-dvh bg-linear-to-b from-white via-white to-indigo-50/60">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">TikTok Trending Videos(Creative Center)</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Trending Videos
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Tiktok Creative Center에서 국가별 실시간 인기영상을 조회해요.
            </p>
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

        <div className="relative z-50 mt-6 rounded-3xl border border-zinc-200/70 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-7">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium text-zinc-900">
                국가
                <SearchableDropdown
                  label="국가"
                  value={selectedCountry}
                  onChange={(next) => setVideosCountry(next?.id ?? "KR")}
                  options={countryOptions}
                  buttonClassName={`${inputBase} cursor-pointer`}
                  placeholder="국가 선택"
                  allowClear={false}
                />
              </label>

              <label className="text-sm font-medium text-zinc-900">
                기간
                <select className={`${inputBase} font-mono`} value={videosPeriod} onChange={(e) => setVideosPeriod(e.target.value as "7" | "30")}>
                  <option value="7">최근 7일</option>
                  <option value="30">최근 30일</option>
                </select>
              </label>

              <label className="text-sm font-medium text-zinc-900">
                정렬
                <select
                  className={`${inputBase}`}
                  value={videosSortBy}
                  onChange={(e) => setVideosSortBy(e.target.value as "vv" | "like" | "comment" | "repost")}
                >
                  <option value="vv">인기도 순</option>
                  <option value="like">좋아요 순</option>
                  <option value="comment">댓글 순</option>
                  <option value="repost">리포스트 순</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button className={buttonPrimary} type="submit" disabled={loading}>
                {loading ? "불러오는 중..." : "가져오기"}
              </button>

              {count != null && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                  <span className="font-medium">가져온 개수</span>
                  <span className="tabular-nums">{count}개</span>
                </div>
              )}

              <button
                className={buttonSecondary}
                type="button"
                onClick={() => {
                  setError("");
                  setVideos([]);
                  setCount(null);
                  setPagination(null);
                  setOpenTitleKey(null);
                  setVideosPage(1);
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
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-indigo-700">Results</div>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">Trending Videos</h2>
            </div>
          </div>

          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {videos.map((v, idx) => {
              const key = `${idx}-${v.item_url ?? "unknown"}`;
              const title = v.title ?? "(제목 없음)";
              const isTitleOpen = openTitleKey === key;
              return (
                <li
                  key={key}
                  className={`relative z-0 rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:z-10 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md ${
                    isTitleOpen ? "z-20" : ""
                  }`}
                >
                  <div className="p-3">
                    <div className="aspect-9/16 w-full overflow-hidden rounded-2xl bg-zinc-100">
                      {v.cover ? (
                        <img
                          src={v.cover}
                          alt={v.title ?? "cover"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">cover 없음</div>
                      )}
                    </div>
                    <div
                      className="relative mt-3"
                      onClick={() => setOpenTitleKey(key)}
                      onMouseLeave={() => setOpenTitleKey((cur) => (cur === key ? null : cur))}
                    >
                      <button
                        type="button"
                        className="min-h-15 w-full rounded-lg text-left text-sm leading-5 text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                        style={clamp3Style}
                        onClick={() => setOpenTitleKey((cur) => (cur === key ? null : key))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenTitleKey((cur) => (cur === key ? null : key));
                          }
                          if (e.key === "Escape") setOpenTitleKey((cur) => (cur === key ? null : cur));
                        }}
                        aria-expanded={isTitleOpen}
                        title={title}
                      >
                        {title}
                      </button>

                      {isTitleOpen && (
                        <div className="absolute -left-3 top-full z-50 mt-2 w-[calc(100%+1.5rem)] rounded-xl border border-zinc-200 bg-white p-2.5 text-sm leading-relaxed text-zinc-800 shadow-lg">
                          {title}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {v.item_url && (
                        <a
                          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
                          href={v.item_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          TikTok에서 보기
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {(() => {
            if (!videos.length) return null;

            const currentPage = pagination?.page ?? videosPage;
            const size = pagination?.limit ?? 20;
            const totalCount = typeof pagination?.total_count === "number" ? pagination.total_count : null;
            const totalPages = totalCount != null && size > 0 ? Math.max(1, Math.ceil(totalCount / size)) : null;

            const groupStart = Math.floor((Math.max(1, currentPage) - 1) / 10) * 10 + 1;
            const groupEnd = totalPages != null ? Math.min(groupStart + 9, totalPages) : groupStart + 9;
            const pages = Array.from({ length: Math.max(0, groupEnd - groupStart + 1) }, (_, i) => groupStart + i);

            const canPrev = currentPage > 1;
            const canNext = totalPages != null ? currentPage < totalPages : Boolean(pagination?.has_more);

            return (
              <div className="mt-6 flex justify-center">
                <nav className="inline-flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
                  <button
                    type="button"
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => fetchPage(currentPage - 1)}
                    disabled={loading || !canPrev}
                    aria-label="이전 페이지"
                  >
                    &lt;
                  </button>

                  {pages.map((p) => {
                    const active = p === currentPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`min-w-10 rounded-xl px-3 py-2 text-sm font-semibold ${
                          active ? "bg-indigo-600 text-white" : "text-zinc-700 hover:bg-zinc-50"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                        onClick={() => fetchPage(p)}
                        disabled={loading || (totalPages != null && (p < 1 || p > totalPages))}
                        aria-current={active ? "page" : undefined}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => fetchPage(currentPage + 1)}
                    disabled={loading || !canNext}
                    aria-label="다음 페이지"
                  >
                    &gt;
                  </button>
                </nav>
              </div>
            );
          })()}

          {!loading && !error && videos.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center text-sm text-zinc-600">
              아직 결과가 없어요. 위에서 조건을 입력하고 가져와보세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

