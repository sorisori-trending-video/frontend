type BuildArgs = {
  country: string;          // ex) "KR" | "US" | "ALL"
  q: string;                // 검색어
  startDateMin?: string;    // "YYYY-MM-DD"
  startDateMax?: string;    // "YYYY-MM-DD"
};

export function buildAdLibraryUrl({
  country,
  q,
  startDateMin,
  startDateMax,
}: BuildArgs) {
  const u = new URL("https://www.facebook.com/ads/library/");
  const p = u.searchParams;

  // ✅ 고정 파라미터(네가 말한 “나머지 그대로”)
  p.set("active_status", "active");
  p.set("ad_type", "all");
  p.set("is_targeted_country", "false");
  p.set("media_type", "video");
  p.set("search_type", "keyword_unordered");
  p.set("sort_data[direction]", "desc");
  p.set("sort_data[mode]", "total_impressions");

  // ✅ 가변 파라미터
  p.set("country", country);
  p.set("q", q);

  // start_date는 빈 값이면 넣지 않음(백엔드 sanitize 없이도 깔끔)
  if (startDateMin) p.set("start_date[min]", startDateMin);
  if (startDateMax) p.set("start_date[max]", startDateMax);

  return u.toString();
}
