import { useEffect, useMemo, useRef, useState } from "react";
import { fetchTopAds, type RankedAd } from "../api/ads";
import { buildAdLibraryUrl } from "../utils/buildAdLibraryUrl";
import { COUNTRY_OPTIONS } from "../utils/metaCountryOptions";

function CountryDropdown(props: {
  value: string;
  onChange: (next: string) => void;
  options: readonly string[];
  buttonClassName: string;
}) {
  const { value, onChange, options, buttonClassName } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`${buttonClassName} flex items-center justify-between text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-mono">{value}</span>
        <span className="ml-2 text-zinc-400" aria-hidden="true">
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-zinc-200 bg-white shadow-lg">
          <ul className="max-h-56 overflow-auto p-1" role="listbox" aria-label="Country options">
            {options.map((c) => {
              const active = c === value;
              return (
                <li key={c} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      active ? "bg-indigo-50 font-semibold text-indigo-700" : "text-zinc-900 hover:bg-zinc-50"
                    }`}
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                  >
                    {c}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function toLocalYMD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatPageName(it: RankedAd) {
  const base = it.pageName ?? "-";
  return it.brandedContentPageName
    ? `${base} (협찬: ${it.brandedContentPageName})`
    : base;
}

function TrendingCarousel(props: { items: RankedAd[] }) {
  const slides = props.items.slice(0, 5);
  const total = slides.length;
  const [idx, setIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 슬라이드 이동 시 보이지 않는 video는 재생 중단
    const root = rootRef.current;
    if (!root) return;
    const videos = Array.from(root.querySelectorAll("video"));
    videos.forEach((v, i) => {
      if (i !== idx) {
        try {
          v.pause();
        } catch {
          // ignore
        }
      }
    });
  }, [idx]);

  if (total === 0) return null;

  const goPrev = () => setIdx((i) => (i - 1 + total) % total);
  const goNext = () => setIdx((i) => (i + 1) % total);

  return (
    <div ref={rootRef} className="relative">
      <div className="overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {slides.map((ad, i) => (
            <div key={`${ad.adLibraryUrl ?? "ad"}-${i}`} className="min-w-full">
              <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                        NO.{i + 1}
                      </span>
                      <div className="truncate text-sm font-semibold text-zinc-900">{formatPageName(ad)}</div>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      기간: {ad.startDate ?? "-"} ~ {ad.endDate ?? "-"}
                    </div>
                    <div className="mt-2 text-xs text-zinc-600">
                      <span className="font-semibold text-zinc-500">플랫폼</span>{" "}
                      {ad.publisherPlatform?.length ? ad.publisherPlatform.join(", ") : "-"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-2">
                  {ad.videoSdUrl ? (
                    <video
                      className="aspect-video w-full rounded-xl bg-black ring-1 ring-zinc-200"
                      controls
                      preload="none"
                      poster={ad.videoPreviewImageUrl ?? undefined}
                      src={ad.videoSdUrl}
                    />
                  ) : (
                    <div className="px-2 py-10 text-center text-sm text-zinc-500">영상 URL 없음</div>
                  )}
                </div>

                <div className="mt-4">
                  {ad.bodyText ? (
                    <details className="group rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                      <summary className="cursor-pointer select-none text-sm font-semibold text-zinc-900 outline-none">
                        본문 보기
                        <span className="ml-2 text-xs font-medium text-zinc-500 group-open:hidden">(펼치기)</span>
                      </summary>
                      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word rounded-2xl bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-800 ring-1 ring-zinc-200">
                        {ad.bodyText}
                      </pre>
                    </details>
                  ) : (
                    <div className="text-sm text-zinc-500">본문 없음</div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ad.adLibraryUrl && (
                    <a
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
                      href={ad.adLibraryUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ad Library
                    </a>
                  )}
                  {ad.videoSdUrl && (
                    <a className="text-xs font-semibold text-indigo-700 hover:underline" href={ad.videoSdUrl} target="_blank" rel="noreferrer">
                      영상 링크로 열기
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="이전 인기 광고"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-zinc-200 bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="다음 인기 광고"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-zinc-200 bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200"
          >
            →
          </button>

          <div className="mt-4 flex items-center justify-center gap-3">
            {slides.map((_, i) => {
              const active = i === idx;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`인기 광고 ${i + 1}번으로 이동`}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 w-1.5 rounded-full ring-1 transition ${
                    active ? "bg-amber-500 ring-amber-600" : "bg-zinc-200 ring-zinc-300 hover:bg-zinc-300"
                  }`}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function MetaApifyPage() {
  const [country, setCountry] = useState("KR");
  const [q, setQ] = useState("");
  const [startMin, setStartMin] = useState<string>("");
  const [startMax, setStartMax] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState<boolean | null>(null);
  const [items, setItems] = useState<RankedAd[]>([]);
  const [error, setError] = useState<string>("");
  const [trending, setTrending] = useState<RankedAd[]>([]);

  const todayStr = useMemo(() => toLocalYMD(new Date()), []);
  const sevenYearsAgoStr = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 7);
    return toLocalYMD(d);
  }, []);

  const startMinMin = sevenYearsAgoStr;
  const startMinMax = startMax || todayStr;
  const startMaxMin = startMin || sevenYearsAgoStr;
  const startMaxMax = todayStr;

  const trendingKey = useMemo(() => {
    // 검색 결과가 바뀌면 캐러셀을 리셋하기 위한 key
    return trending
      .slice(0, 5)
      .map((x) => x.adLibraryUrl ?? x.videoSdUrl ?? x.pageName ?? "")
      .join("|");
  }, [trending]);

  const builtUrl = useMemo(
    () =>
      buildAdLibraryUrl({
        country: country.trim(),
        q: q.trim(),
        startDateMin: startMin || undefined,
        startDateMax: startMax || undefined,
      }),
    [country, q, startMin, startMax]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTrending([]);
    setItems([]);
    setLoading(true);

    try {
      const data = await fetchTopAds(builtUrl);
      setItems(data.items);
      setTrending(data.trending ?? []);
      setCached(data.cached);
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

  return (
    <div className="min-h-dvh bg-linear-to-b from-white via-white to-indigo-50/60">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Meta Ad Library</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Ads Top 30</h1>
            <p className="mt-1 text-sm text-zinc-600">키워드/국가/기간으로 광고를 조회하고, 상위 노출 광고를 확인해요.</p>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-zinc-900">
                Country
                <CountryDropdown
                  value={country}
                  onChange={setCountry}
                  options={COUNTRY_OPTIONS}
                  buttonClassName={`${inputBase} cursor-pointer`}
                />
              </label>

              <label className="text-sm font-medium text-zinc-900">
                Search keyword
                <input
                  className={inputBase}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="예) 올리브영, 핸드크림, skincare..."
                  autoComplete="off"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <div className="text-sm font-medium text-zinc-900">Start date (optional)</div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    className={`${inputBase} sm:max-w-[220px]`}
                    type="date"
                    value={startMin}
                    min={startMinMin}
                    max={startMinMax}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStartMin(v);
                      if (v && startMax && v > startMax) setStartMax(v);
                    }}
                  />
                  <button className={buttonSecondary} type="button" onClick={() => setStartMin("")} disabled={!startMin}>
                    Clear
                  </button>
                </div>
                <div className="text-xs text-zinc-500">최대 7년 전까지 선택할 수 있어요.</div>
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-medium text-zinc-900">End date (optional)</div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    className={`${inputBase} sm:max-w-[220px]`}
                    type="date"
                    value={startMax}
                    min={startMaxMin}
                    max={startMaxMax}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStartMax(v);
                      if (v && startMin && v < startMin) setStartMin(v);
                    }}
                  />
                  <button className={buttonSecondary} type="button" onClick={() => setStartMax("")} disabled={!startMax}>
                    Clear
                  </button>
                </div>
                <div className="text-xs text-zinc-500">기간을 지정하면 더 정확한 비교가 가능해요.</div>
              </div>
            </div>

            {/* <label className="text-sm font-medium text-zinc-900">
              Built URL (preview)
              <input
                className={`${inputBase} font-mono text-[12px]`}
                value={builtUrl}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
              />
            </label> */}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button className={buttonPrimary} type="submit" disabled={loading || !q.trim()}>
                {loading ? "불러오는 중..." : "검색"}
              </button>

              {cached != null && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                  <span className="font-medium">결과</span>
                  <span className="tabular-nums">{items.length}개</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      cached ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    }`}
                  >
                    {cached ? "캐시" : "실시간"}
                  </span>
                </div>
              )}
            </div>
          </form>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <div className="font-semibold">요청 실패</div>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap wrap-break-word text-xs leading-relaxed">{error}</pre>
          </div>
        )}

        {trending.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-amber-700">Trending</div>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">지금 인기있는 광고 TOP 5</h2>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">TOP 5</span>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-linear-to-b from-amber-50 to-white p-4 shadow-sm sm:p-5">
              <TrendingCarousel key={trendingKey} items={trending} />
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-indigo-700">Results</div>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">상위 광고</h2>
            </div>
          </div>

          <ul className="mt-3 grid gap-3">
            {items.map((it) => (
              <li key={`${it.rank}-${it.pageName ?? "unknown"}`} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[1fr_260px] md:items-start">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                        #{it.rank}
                      </span>
                      <div className="text-sm font-semibold text-zinc-900">{formatPageName(it)}</div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                        <div className="text-xs font-semibold text-zinc-500">기간</div>
                        <div className="mt-0.5">
                          {(it.startDate?.split("T")[0] ?? "-") + " ~ " + (it.endDate?.split("T")[0] ?? "-")}
                        </div>
                      </div>
                      {/* <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                        <div className="text-xs font-semibold text-zinc-500">노출(추정)</div>
                        <div className="mt-0.5">{it.impressionsText ?? "-"}</div>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                        <div className="text-xs font-semibold text-zinc-500">좋아요 수</div>
                        <div className="mt-0.5 tabular-nums">{it.pageLikeCount ?? "-"}</div>
                      </div> */}
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                        <div className="text-xs font-semibold text-zinc-500">플랫폼</div>
                        <div className="mt-0.5">{it.publisherPlatform?.length ? it.publisherPlatform.join(", ") : "-"}</div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-zinc-700">
                      <span className="text-xs font-semibold text-zinc-500">계정주 카테고리</span>
                      <div className="mt-0.5">{it.pageCategories?.length ? it.pageCategories.join(", ") : "-"}</div>
                    </div>

                    <div className="mt-4">
                      {it.bodyText ? (
                        <details className="group rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                          <summary className="cursor-pointer select-none text-sm font-semibold text-zinc-900 outline-none">
                            본문 보기
                            <span className="ml-2 text-xs font-medium text-zinc-500 group-open:hidden">(펼치기)</span>
                          </summary>
                          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word rounded-2xl bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-800 ring-1 ring-zinc-200">
                            {it.bodyText}
                          </pre>
                        </details>
                      ) : (
                        <div className="text-sm text-zinc-500">본문 없음</div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {it.adLibraryUrl && (
                        <a
                          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
                          href={it.adLibraryUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ad Library에서 보기
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm">
                      {it.videoSdUrl ? (
                        <div className="grid gap-2">
                          <video
                            className="aspect-video w-full rounded-2xl bg-black ring-1 ring-zinc-200"
                            controls
                            preload="none"
                            poster={it.videoPreviewImageUrl ?? undefined}
                            src={it.videoSdUrl}
                          />
                          <a className="text-xs font-semibold text-indigo-700 hover:underline" href={it.videoSdUrl} target="_blank" rel="noreferrer">
                            영상 링크로 열기
                          </a>
                        </div>
                      ) : (
                        <div className="px-2 py-10 text-center text-sm text-zinc-500">영상 URL 없음</div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {!loading && !error && items.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center text-sm text-zinc-600">
              아직 결과가 없어요. 위에서 조건을 입력하고 검색해보세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
