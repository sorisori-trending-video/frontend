import { useMemo, useState } from "react";
import { fetchTopAds, type RankedAd } from "../api/ads";
import { buildAdLibraryUrl } from "../utils/buildAdLibraryUrl";

function toLocalYMD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Apify01Page() {
  const [country, setCountry] = useState("KR");
  const [q, setQ] = useState("");
  const [startMin, setStartMin] = useState<string>("");
  const [startMax, setStartMax] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState<boolean | null>(null);
  const [items, setItems] = useState<RankedAd[]>([]);
  const [error, setError] = useState<string>("");
  const [trending, setTrending] = useState<RankedAd | null>(null);

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
    setItems([]);
    setLoading(true);

    try {
      const data = await fetchTopAds(builtUrl);
      setItems(data.items);
      setTrending(data.trending);
      setCached(data.cached);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "요청 실패";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <div className="pageHeader">
        <h1>Apify01 - Ads Top 30</h1>
        <a className="navButton" href="/">
          메인으로
        </a>
      </div>

      <form className="form" onSubmit={onSubmit}>
        <label>
          Country
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder="KR / US / ALL ..."
          />
        </label>

        <label>
          Search Keyword
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색어" />
        </label>

        <label className="row">
          Start Date (optional)
          <input
            type="date"
            value={startMin}
            min={startMinMin}
            max={startMinMax}
            onChange={(e) => {
              const v = e.target.value;
              setStartMin(v);
              if (v && startMax && v > startMax) setStartMax(v);
            }}
            style={{ width: 180 }}
          />
          <button type="button" onClick={() => setStartMin("")} disabled={!startMin} style={{ padding: "8px 10px" }}>
            Clear
          </button>
        </label>

        <label className="row">
          End Date (optional)
          <input
            type="date"
            value={startMax}
            min={startMaxMin}
            max={startMaxMax}
            onChange={(e) => {
              const v = e.target.value;
              setStartMax(v);
              if (v && startMin && v < startMin) setStartMin(v);
            }}
            style={{ width: 180 }}
          />
          <button type="button" onClick={() => setStartMax("")} disabled={!startMax} style={{ padding: "8px 10px" }}>
            Clear
          </button>
        </label>

        <label>
          Built URL (preview)
          <input value={builtUrl} readOnly />
        </label>

        <button type="submit" disabled={loading || !q}>
          {loading ? "불러오는 중..." : "검색"}
        </button>
      </form>

      {trending && (
        <div className="trendingCard">
          <h2>🔥 지금 가장 인기있는 광고</h2>
          <div className="card">
            <div className="leftPanel">
              <div className="top">
                <strong>🔥 NO.1</strong>
                <span className="title">{trending.pageName}</span>
              </div>
              <div className="meta">
                <div>
                  기간: {trending.startDate} ~ {trending.endDate}
                </div>
                <div>플랫폼: {trending.publisherPlatform?.join(", ")}</div>
              </div>

              {trending.bodyText ? (
                <details className="body">
                  <summary>본문 보기</summary>
                  <pre>{trending.bodyText}</pre>
                </details>
              ) : (
                <div className="smallMuted">본문 없음</div>
              )}

              {trending.adLibraryUrl && (
                <a className="smallLink" href={trending.adLibraryUrl} target="_blank" rel="noreferrer">
                  Ad Library에서 보기
                </a>
              )}
            </div>

            <div className="rightPanel">
              {trending.videoSdUrl ? (
                <div className="videoBox">
                  <video
                    className="video"
                    controls
                    preload="none"
                    poster={trending.videoPreviewImageUrl ?? undefined}
                    src={trending.videoSdUrl}
                  />
                  <a className="smallLink" href={trending.videoSdUrl} target="_blank" rel="noreferrer">
                    영상 링크로 열기
                  </a>
                </div>
              ) : (
                <div className="smallMuted">영상 URL 없음</div>
              )}
            </div>
          </div>
        </div>
      )}

      {cached != null && <div className="hint">결과: {items.length}개 {cached ? "(캐시)" : "(실시간)"}</div>}

      {error && <pre className="error">{error}</pre>}

      <ul className="list">
        {items.map((it) => (
          <li key={`${it.rank}-${it.pageName ?? "unknown"}`} className="card">
            <div className="leftPanel">
              <div className="top">
                <strong>#{it.rank}</strong>
                <span className="title">{it.pageName ?? "-"}</span>
              </div>

              <div className="meta">
                <div>
                  기간: {it.startDate?.split("T")[0] ?? "-"} ~ {it.endDate?.split("T")[0] ?? "-"}
                </div>
                <div>노출(추정): {it.impressionsText ?? "-"}</div>
                <div>광고계정 좋아요 수: {it.pageLikeCount ?? "-"}</div>
                <div>카테고리: {it.pageCategories?.length ? it.pageCategories.join(", ") : "-"}</div>
                <div>플랫폼: {it.publisherPlatform?.length ? it.publisherPlatform.join(", ") : "-"}</div>
              </div>

              {it.bodyText ? (
                <details className="body">
                  <summary>본문 보기</summary>
                  <pre>{it.bodyText}</pre>
                </details>
              ) : (
                <div className="smallMuted">본문 없음</div>
              )}

              {it.adLibraryUrl && (
                <a className="smallLink" href={it.adLibraryUrl} target="_blank" rel="noreferrer">
                  Ad Library에서 보기
                </a>
              )}
            </div>

            <div className="rightPanel">
              {it.videoSdUrl ? (
                <div className="videoBox">
                  <video
                    className="video"
                    controls
                    preload="none"
                    poster={it.videoPreviewImageUrl ?? undefined}
                    src={it.videoSdUrl}
                  />
                  <a className="smallLink" href={it.videoSdUrl} target="_blank" rel="noreferrer">
                    영상 링크로 열기
                  </a>
                </div>
              ) : (
                <div className="smallMuted">영상 URL 없음</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
