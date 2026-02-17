export default function HomePage() {
  return (
    <div className="min-h-dvh bg-linear-to-b from-white via-white to-indigo-50/60">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="rounded-3xl border border-zinc-200/70 bg-white/70 p-7 shadow-sm backdrop-blur sm:p-10">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-indigo-700">Ad intelligence</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Ad Ranker</h1>
            <p className="text-zinc-600">기능을 선택하세요.</p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              href="/meta-apify"
              className="group rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Meta Apify</div>
                  <div className="mt-1 text-sm text-zinc-600">Meta Ad Library 기반 Top 30 광고를 빠르게 조회</div>
                </div>
                <span className="mt-0.5 text-zinc-400 transition group-hover:text-indigo-600">→</span>
              </div>
            </a>

            <a
              href="/tiktok-apify"
              className="group rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">TikTok Search Scraper(1)</div>
                  <div className="mt-1 text-sm text-zinc-600">해시태그 검색어로 틱톡의 인기 영상 조회</div>
                </div>
                <span className="mt-0.5 text-zinc-400 transition group-hover:text-indigo-600">→</span>
              </div>
            </a>

            <a
              href="/tiktok-scraper"
              className="group rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">TikTok Search Scraper(2)</div>
                  <div className="mt-1 text-sm text-zinc-600">검색 키워드로 틱톡 결과 조회 (검색속도가 더 빠르고 가격이 낮음)</div>
                </div>
                <span className="mt-0.5 text-zinc-400 transition group-hover:text-indigo-600">→</span>
              </div>
            </a>

            <a
              href="/tiktok-creative-center"
              className="group rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Creative Center - TikTok Trending Videos</div>
                  <div className="mt-1 text-sm text-zinc-600">틱톡의 국가별 실시간 인기 영상 조회</div>
                </div>
                <span className="mt-0.5 text-zinc-400 transition group-hover:text-indigo-600">→</span>
              </div>
            </a>

            <a
              href="/tiktok-creative-center/top-ads-dashboard"
              className="group rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">Creative Center - TikTok Top Ads</div>
                  <div className="mt-1 text-sm text-zinc-600">기간/정렬/지역/업종 조건으로 Tiktok Creative Center에서 Top Ads 조회</div>
                </div>
                <span className="mt-0.5 text-zinc-400 transition group-hover:text-indigo-600">→</span>
              </div>
            </a>

            {/* <a
              href="/ig-graph"
              className="group rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">IG Graph</div>
                  <div className="mt-1 text-sm text-zinc-600">해시태그 기준 인스타그램의 인기 영상 랭킹을 조회</div>
                </div>
                <span className="mt-0.5 text-zinc-400 transition group-hover:text-indigo-600">→</span>
              </div>
            </a> */}
          </div>

          {/* <div className="mt-8 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-sm text-zinc-600">
            <div className="font-medium text-zinc-800">Tip</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                결과 카드의 링크는 새 탭으로 열려요. (안전하게 <span className="font-mono">noopener</span> 적용)
              </li>
              <li>검색 전 Built URL이 어떻게 만들어지는지 미리 확인할 수 있어요.</li>
            </ul>
          </div> */}
        </div>

        {/* <div className="mt-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} Ad Ranker
        </div> */}
      </div>
    </div>
  );
}
