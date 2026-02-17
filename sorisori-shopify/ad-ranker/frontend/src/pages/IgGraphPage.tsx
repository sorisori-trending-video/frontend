import { useState } from "react";
import { fetchTopIgByHashtag, type IgRankedMedia } from "../api/igGraph";

export default function IgGraphPage() {
  const [hashtag, setHashtag] = useState("oliveyoung");
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<IgRankedMedia[]>([]);
  const [resolvedHashtag, setResolvedHashtag] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setItems([]);

    try {
      const data = await fetchTopIgByHashtag({
        hashtag: hashtag.trim().replace(/^#/, ""),
        limit,
      });
      setResolvedHashtag(data.hashtag);
      setItems(data.items);
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

  return (
    <div className="min-h-dvh bg-linear-to-b from-white via-white to-indigo-50/60">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Instagram</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">IG Graph</h1>
            <p className="mt-1 text-sm text-zinc-600">해시태그 기준으로 인기 미디어를 점수화해서 랭킹을 보여줘요.</p>
          </div>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
          >
            메인으로
          </a>
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-200/70 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-7">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <label className="text-sm font-medium text-zinc-900">
                Hashtag
                <input
                  className={inputBase}
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  placeholder="oliveyoung / skincare / 올리브영"
                  autoComplete="off"
                />
              </label>

              <label className="text-sm font-medium text-zinc-900">
                Limit
                <input
                  className={inputBase}
                  type="number"
                  min={1}
                  max={50}
                  value={limit}
                  onChange={(e) => setLimit(Math.min(50, Math.max(1, Number(e.target.value || 1))))}
                />
              </label>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button className={buttonPrimary} type="submit" disabled={loading || !hashtag.trim()}>
                {loading ? "불러오는 중..." : "인기 영상 불러오기"}
              </button>

              {resolvedHashtag && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                  <span className="font-medium">조회</span>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                    #{resolvedHashtag}
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

        <div className="mt-8">
          <div className="text-sm font-semibold text-indigo-700">Results</div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">인기 미디어 랭킹</h2>

          <ul className="mt-3 grid gap-3">
            {items.map((it) => (
              <li key={it.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[1fr_320px] md:items-start">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                        #{it.rank}
                      </span>
                      <div className="text-sm font-semibold text-zinc-900">
                        {it.mediaProductType ?? it.mediaType ?? "MEDIA"}
                        <span className="ml-2 text-xs font-medium text-zinc-500">score</span>{" "}
                        <span className="text-xs font-semibold tabular-nums text-zinc-700">{it.score}</span>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-3">
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                        <div className="text-xs font-semibold text-zinc-500">좋아요</div>
                        <div className="mt-0.5 tabular-nums">{it.likeCount ?? "-"}</div>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                        <div className="text-xs font-semibold text-zinc-500">댓글</div>
                        <div className="mt-0.5 tabular-nums">{it.commentsCount ?? "-"}</div>
                      </div>
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                        <div className="text-xs font-semibold text-zinc-500">업로드</div>
                        <div className="mt-0.5">{it.timestamp ? it.timestamp.split("T")[0] : "-"}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      {it.caption ? (
                        <details className="group rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                          <summary className="cursor-pointer select-none text-sm font-semibold text-zinc-900 outline-none">
                            캡션 보기
                            <span className="ml-2 text-xs font-medium text-zinc-500 group-open:hidden">(펼치기)</span>
                          </summary>
                          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap wrap-break-word rounded-2xl bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-800 ring-1 ring-zinc-200">
                            {it.caption}
                          </pre>
                        </details>
                      ) : (
                        <div className="text-sm text-zinc-500">캡션 없음</div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {it.permalink && (
                        <a
                          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
                          href={it.permalink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          인스타 게시물 열기
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm">
                      {it.mediaUrl ? (
                        <div className="grid gap-2">
                          <video
                            className="aspect-video w-full rounded-2xl bg-black ring-1 ring-zinc-200"
                            controls
                            preload="none"
                            poster={it.thumbnailUrl ?? undefined}
                            src={it.mediaUrl}
                          />
                          <a className="text-xs font-semibold text-indigo-700 hover:underline" href={it.mediaUrl} target="_blank" rel="noreferrer">
                            원본 미디어 열기
                          </a>
                        </div>
                      ) : it.thumbnailUrl ? (
                        <img className="aspect-video w-full rounded-2xl object-cover ring-1 ring-zinc-200" src={it.thumbnailUrl} alt="썸네일" />
                      ) : (
                        <div className="px-2 py-10 text-center text-sm text-zinc-500">미디어 URL 없음</div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {!loading && !error && items.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center text-sm text-zinc-600">
              아직 결과가 없어요. 해시태그를 입력하고 조회해보세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
