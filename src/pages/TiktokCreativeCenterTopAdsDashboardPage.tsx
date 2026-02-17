import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  fetchTiktokCreativeCenterTopAdsDashboard,
  type TiktokCreativeCenterTopAdsDashboardMaterial,
  type TiktokCreativeCenterTopAdsDashboardRequest,
} from "../api/ads";
import { DASHBOARD_REGION_OPTIONS } from "../utils/dashboardRegionOptions";
import { DASHBOARD_INDUSTRY_OPTIONS } from "../utils/dashboardIndustryOptions";

type SelectOption = { id: string; value: string; subtitle?: string };
type IndustryOption = { id: string; value: string; parentId: string | null };

const OBJECTIVE_LABELS: Record<
  string,
  { short: string; description: string }
> = {
  campaign_objective_traffic: {
    short: "traffic",
    description: "외부 링크로 트래픽 유도",
  },
  campaign_objective_app_install: {
    short: "app install",
    description: "앱 설치",
  },
  campaign_objective_conversion: {
    short: "conversion",
    description: "구매/회원가입 등 특정행동 유도",
  },
  campaign_objective_video_view: {
    short: "video views",
    description: "영상 조회수 증가",
  },
  campaign_objective_reach: {
    short: "reach",
    description: "최대한 많은 사람에게 노출",
  },
  campaign_objective_lead_generation: {
    short: "lead generation",
    description: "고객 정보 확보",
  },
  campaign_objective_product_sales: {
    short: "product sales",
    description: "쇼핑, 상품 판매",
  },
};

function objectiveToDisplay(objectiveKey: string | null) {
  if (!objectiveKey) return null;
  const mapped = OBJECTIVE_LABELS[objectiveKey];
  if (!mapped) return { title: objectiveKey, description: objectiveKey };
  return { title: mapped.short, description: mapped.description };
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
          {/* {value?.subtitle && <span className="mt-0.5 block truncate text-xs text-zinc-500">{value.subtitle}</span>} */}
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
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-300 focus:shadow-md focus:shadow-indigo-200"
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

function IndustryDropdown(props: {
  value: IndustryOption | null;
  onChange: (next: IndustryOption | null) => void;
  allOptions: readonly IndustryOption[];
  buttonClassName: string;
  placeholder: string;
}) {
  const { value, onChange, allOptions, buttonClassName, placeholder } = props;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const parents = useMemo(() => allOptions.filter((o) => !o.parentId), [allOptions]);
  const childrenByParent = useMemo(() => {
    const m = new Map<string, IndustryOption[]>();
    for (const o of allOptions) {
      if (!o.parentId) continue;
      const arr = m.get(o.parentId) ?? [];
      arr.push(o);
      m.set(o.parentId, arr);
    }
    // sort children by name for stable UI
    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => a.value.localeCompare(b.value));
      m.set(k, arr);
    }
    return m;
  }, [allOptions]);

  const parentById = useMemo(() => {
    const m = new Map<string, IndustryOption>();
    for (const p of parents) m.set(p.id, p);
    return m;
  }, [parents]);

  const displayValue = useMemo(() => {
    if (!value) return null;
    if (value.parentId) {
      const p = parentById.get(value.parentId);
      return `${p?.value ?? value.parentId} / ${value.value}`;
    }
    return value.value;
  }, [parentById, value]);

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

  const filteredParents = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return parents;
    return parents.filter((p) => {
      if (p.value.toLowerCase().includes(qq)) return true;
      const kids = childrenByParent.get(p.id) ?? [];
      return kids.some((c) => c.value.toLowerCase().includes(qq));
    });
  }, [childrenByParent, parents, q]);

  const effectiveActiveParentId = useMemo(() => {
    if (!filteredParents.length) return null;
    if (activeParentId && filteredParents.some((p) => p.id === activeParentId)) return activeParentId;
    return filteredParents[0].id;
  }, [activeParentId, filteredParents]);

  const activeChildren = useMemo(() => {
    const id = effectiveActiveParentId;
    if (!id) return [];
    const kids = childrenByParent.get(id) ?? [];
    const qq = q.trim().toLowerCase();
    if (!qq) return kids;
    return kids.filter((c) => c.value.toLowerCase().includes(qq));
  }, [childrenByParent, effectiveActiveParentId, q]);

  const activeParent = effectiveActiveParentId ? parentById.get(effectiveActiveParentId) ?? null : null;

  return (
    <div ref={rootRef} className="relative" style={open ? { zIndex: 9999 } : undefined}>
      <button
        type="button"
        className={`${buttonClassName} flex items-center justify-between text-left`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          // open 시점에 active parent를 초기화 (effect에서 setState 하지 않음)
          if (!open) {
            setQ("");
            const preferredParentId = value?.parentId ?? value?.id ?? null;
            const initial =
              preferredParentId && parentById.has(preferredParentId)
                ? preferredParentId
                : parents[0]?.id ?? null;
            setActiveParentId(initial);
            setOpen(true);
          } else {
            setOpen(false);
          }
        }}
      >
        <span className="min-w-0">
          <span className="block truncate text-zinc-900">
            {displayValue ? displayValue : <span className="text-zinc-400">{placeholder}</span>}
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
                placeholder="업종 검색... (상위/하위)"
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

          <div className="grid grid-cols-2 gap-0 border-t border-zinc-100">
            {/* left: parents */}
            <div className="max-h-72 overflow-auto p-1">
              {filteredParents.map((p) => {
                const active = p.id === effectiveActiveParentId;
                const hasChildren = (childrenByParent.get(p.id) ?? []).length > 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                      active ? "bg-indigo-50 font-semibold text-indigo-700" : "text-zinc-900 hover:bg-zinc-50"
                    }`}
                    onClick={() => setActiveParentId(p.id)}
                  >
                    <span className="min-w-0 truncate">{p.value}</span>
                    {hasChildren && <span className="shrink-0 text-zinc-400">›</span>}
                  </button>
                );
              })}
              {filteredParents.length === 0 && (
                <div className="px-3 py-3 text-sm text-zinc-500">검색 결과가 없어요.</div>
              )}
            </div>

            {/* right: children */}
            <div className="max-h-72 overflow-auto border-l border-zinc-100 p-1">
              {activeParent && (
                <button
                  type="button"
                  className="mb-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  onClick={() => {
                    onChange(activeParent);
                    setOpen(false);
                  }}
                >
                  {activeParent.value} (상위 카테고리 선택)
                </button>
              )}

              {activeChildren.map((c) => {
                const active = value?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      active ? "bg-zinc-900 font-semibold text-white" : "text-zinc-900 hover:bg-zinc-50"
                    }`}
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{c.value}</span>
                  </button>
                );
              })}
              {activeParent && activeChildren.length === 0 && (
                <div className="px-3 py-3 text-sm text-zinc-500">하위 업종이 없어요.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatNumber(v: number | null) {
  if (v == null) return "-";
  return new Intl.NumberFormat("ko-KR").format(v);
}

function formatCtr(v: number | null) {
  if (v == null) return "-";
  if (!Number.isFinite(v)) return String(v);

  // 표시용: 0~1이면 ratio(0.24=24%)로 보고 ×100, 그 이상이면 이미 % 값으로 간주
  const pct = v >= 0 && v <= 1 ? v * 100 : v;

  // 보기 좋게: 큰 수는 소수 0, 중간은 1, 작은 수는 2
  const digits = pct >= 10 ? 0 : pct >= 1 ? 1 : 2;
  return `${pct.toFixed(digits)}%`;
}

function MediaPreview(props: {
  title: string;
  cover: string | null;
  videoUrl: string | null;
}) {
  const { title, cover, videoUrl } = props;
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
          onPlay={() => setStarted(true)}
          onEnded={() => setStarted(false)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">video_url 없음</div>
      )}

      {/* cover overlay */}
      {!started && cover && (
        <div className="absolute inset-0">
          <img
            src={cover}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          {videoUrl && (
            <div className="absolute inset-0 bg-black/25" />
          )}
        </div>
      )}

      {/* play button */}
      {!started && videoUrl && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center"
          aria-label="영상 재생"
          onClick={() => {
            const el = videoRef.current;
            if (!el) return;
            setStarted(true);
            // 브라우저 autoplay 정책으로 실패할 수 있어도(예: 음소거 필요) UI는 재생 시도를 표현
            void el.play().catch(() => {
              // 사용자가 controls로 재생할 수 있도록 started는 유지
            });
          }}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg ring-1 ring-zinc-200 transition hover:bg-white">
            <div
              className="ml-1 h-0 w-0 border-y-10 border-y-transparent border-l-16 border-l-zinc-900"
              aria-hidden="true"
            />
          </div>
        </button>
      )}
    </div>
  );
}

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

function toIndustryOption(o: unknown): IndustryOption {
  const r: Record<string, unknown> = o && typeof o === "object" ? (o as Record<string, unknown>) : {};
  const idRaw = r.id;
  const id = typeof idRaw === "string" || typeof idRaw === "number" ? String(idRaw) : "";

  const valueRaw = r.value;
  const value = typeof valueRaw === "string" ? valueRaw : valueRaw != null ? String(valueRaw) : "";

  const parentRaw = r.parent_id;
  const parentId =
    typeof parentRaw === "string" || typeof parentRaw === "number"
      ? String(parentRaw)
      : null;

  return { id, value, parentId };
}

export default function TiktokCreativeCenterTopAdsDashboardPage() {
  const [dashboardPeriod, setDashboardPeriod] = useState<"7" | "30" | "180">("30");
  const [dashboardSortBy, setDashboardSortBy] = useState<"impression" | "like" | "play_6s_rate" | "play_2s_rate">("impression");
  const [dashboardPage, setDashboardPage] = useState(1);

  const regionOptions = useMemo<SelectOption[]>(() => {
    const raw = Array.isArray(DASHBOARD_REGION_OPTIONS) ? DASHBOARD_REGION_OPTIONS : [];
    return raw.map(toSelectOption).filter((x) => Boolean(x.id) && Boolean(x.value));
  }, []);

  const industryOptions = useMemo<IndustryOption[]>(() => {
    const raw = Array.isArray(DASHBOARD_INDUSTRY_OPTIONS) ? DASHBOARD_INDUSTRY_OPTIONS : [];
    return raw
      .map(toIndustryOption)
      .filter((x) => Boolean(x.id) && Boolean(x.value))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, []);

  const [dashboardRegion, setDashboardRegion] = useState<SelectOption | null>(null);
  const [dashboardIndustry, setDashboardIndustry] = useState<IndustryOption | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [count, setCount] = useState<number | null>(null);
  const [pagination, setPagination] = useState<{ has_more?: boolean; page?: number; size?: number; total_count?: number } | null>(null);
  const [materials, setMaterials] = useState<TiktokCreativeCenterTopAdsDashboardMaterial[]>([]);
  const [openTitleKey, setOpenTitleKey] = useState<string | null>(null);
  const [openObjectiveKey, setOpenObjectiveKey] = useState<string | null>(null);

  const request = useMemo<TiktokCreativeCenterTopAdsDashboardRequest>(() => {
    return {
      dashboard_period: dashboardPeriod,
      dashboard_sort_by: dashboardSortBy,
      dashboard_region: dashboardRegion?.id || undefined,
      dashboard_industry: dashboardIndustry?.id || undefined,
    };
  }, [dashboardIndustry?.id, dashboardPeriod, dashboardRegion?.id, dashboardSortBy]);

  const fetchPage = async (page: number) => {
    const nextPage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    setError("");
    setLoading(true);
    setMaterials([]);
    setCount(null);
    setPagination(null);
    setOpenTitleKey(null);
    setOpenObjectiveKey(null);
    setDashboardPage(nextPage);

    try {
      const data = await fetchTiktokCreativeCenterTopAdsDashboard({ ...request, dashboard_page: nextPage });
      setMaterials(data.materials ?? []);
      setCount(typeof data.count === "number" ? data.count : (data.materials ?? []).length);
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

  const inputBase =
    "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:shadow-md focus:shadow-indigo-200";
  const buttonPrimary =
    "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus:shadow-md focus:shadow-indigo-200";
  const buttonSecondary =
    "inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200";

  const clamp3Style: CSSProperties = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 3,
    overflow: "hidden",
  };

  return (
    <div className="min-h-dvh bg-linear-to-b from-white via-white to-indigo-50/60">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">TikTok Top Ads(Creative Center)</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Top Ads Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              기간/정렬/국가/업종 조건으로 Tiktok Creative Center에서 Top Ads를 조회해요.
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
            <div className="w-full lg:w-[60%]">
              <label className="text-sm font-medium text-zinc-900">
                업종 (선택)
                <IndustryDropdown
                  value={dashboardIndustry}
                  onChange={setDashboardIndustry}
                  allOptions={industryOptions}
                  buttonClassName={`${inputBase} cursor-pointer`}
                  placeholder="선택 안 함"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium text-zinc-900">
                국가 (선택)
                <SearchableDropdown
                  label="국가"
                  value={dashboardRegion}
                  onChange={setDashboardRegion}
                  options={regionOptions}
                  buttonClassName={`${inputBase} cursor-pointer`}
                  placeholder="선택 안 함"
                />
              </label>

              <label className="text-sm font-medium text-zinc-900">
                기간 (필수)
                <select
                  className={`${inputBase}`}
                  value={dashboardPeriod}
                  onChange={(e) => setDashboardPeriod(e.target.value as "7" | "30" | "180")}
                >
                  <option value="7">최근 7일</option>
                  <option value="30">최근 30일</option>
                  <option value="180">최근 180일</option>
                </select>
              </label>

              <label className="text-sm font-medium text-zinc-900">
                정렬 (필수)
                <select
                  className={`${inputBase}`}
                  value={dashboardSortBy}
                  onChange={(e) =>
                    setDashboardSortBy(e.target.value as "impression" | "like" | "play_6s_rate" | "play_2s_rate")
                  }
                >
                  <option value="impression">도달률</option>
                  <option value="like">좋아요 수</option>
                  <option value="play_6s_rate">6초 재생률</option>
                  <option value="play_2s_rate">2초 재생률</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button className={buttonPrimary} type="submit" disabled={loading}>
                {loading ? "불러오는 중..." : "가져오기"}
              </button>

              {(count != null || pagination) && (
                <div className="flex flex-wrap items-center gap-2">
                  {count != null && (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                      <span className="font-medium">가져온 개수</span>
                      <span className="tabular-nums">{count}개</span>
                    </div>
                  )}
                  {/* {pagination && (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                      <span className="font-medium">페이지</span>
                      <span className="tabular-nums">{pagination.page ?? "-"}</span>
                      <span className="text-zinc-400">/</span>
                      <span className="font-medium">총</span>
                      <span className="tabular-nums">{pagination.total_count ?? "-"}</span>
                    </div>
                  )} */}
                </div>
              )}

              <button
                className={buttonSecondary}
                type="button"
                onClick={() => {
                  setError("");
                  setMaterials([]);
                  setCount(null);
                  setPagination(null);
                  setOpenTitleKey(null);
                  setOpenObjectiveKey(null);
                  setDashboardPage(1);
                }}
                disabled={loading}
              >
                결과 초기화
              </button>
            </div>
            <div className="flex w-full flex-row gap-2 rounded-xl border border-amber-400 bg-amber-50 p-4">
              <span className="text-sm text-amber-700 font-semibold">TIP</span>
              <span className="text-sm text-zinc-500">CTR = 광고 클릭률, CTR %가 작을수록 클릭률이 높고 핫한 광고입니다.</span>
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
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">Top Ads</h2>
            </div>
          </div>

          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {materials.map((m, idx) => {
              const key = `${idx}-${m.video_url ?? m.cover ?? m.ad_title ?? "unknown"}`;
              const title = m.ad_title ?? "(제목 없음)";
              const objective = objectiveToDisplay(m.objective_key);
              const isTitleOpen = openTitleKey === key;
              const isObjectiveOpen = openObjectiveKey === key;
              return (
                <li
                  key={key}
                  className={`relative z-0 rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:z-10 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md ${
                    isTitleOpen || isObjectiveOpen ? "z-20" : ""
                  }`}
                >
                  <div className="p-3">
                    <MediaPreview title={title} cover={m.cover} videoUrl={m.video_url} />
                  </div>

                  <div className="px-4 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                        #{idx + 1}
                      </span>
                    </div>

                    <div
                      className="relative mt-3"
                      onClick={() => setOpenTitleKey(key)}
                      onMouseLeave={() => setOpenTitleKey((cur) => (cur === key ? null : cur))}
                    >
                      <button
                        type="button"
                        className="w-full rounded-lg text-left text-sm font-semibold leading-relaxed text-zinc-900 focus-visible:outline-none"
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

                      {/* 전체 타이틀: 카드 크기와 무관하게 overlay로 표시 */}
                      {isTitleOpen && (
                        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm leading-relaxed text-zinc-800 shadow-lg">
                          {title}
                        </div>
                      )}
                    </div>

                    {/* objective_key: CTR/Like 상단에 표시 */}
                    {objective && (
                      <div className="relative mt-3">
                        <button
                          type="button"
                          className="inline-flex items-center rounded-full bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100 focus-visible:outline-none"
                          onClick={() => setOpenObjectiveKey((cur) => (cur === key ? null : key))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setOpenObjectiveKey((cur) => (cur === key ? null : key));
                            }
                            if (e.key === "Escape") setOpenObjectiveKey((cur) => (cur === key ? null : cur));
                          }}
                          aria-expanded={isObjectiveOpen}
                          title={objective.description}
                          onMouseEnter={() => setOpenObjectiveKey(key)}
                          onMouseLeave={() => setOpenObjectiveKey((cur) => (cur === key ? null : cur))}
                        >
                          광고 목적: {objective.title}
                        </button>

                        {/* objective tooltip: hover/터치로 바로 보이도록 커스텀 */}
                        {isObjectiveOpen && (
                          <div className="absolute left-1.5 top-full z-50 mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-sm leading-relaxed text-zinc-800 shadow-lg">
                            {objective.description}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-700">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-zinc-200">
                        <span className="text-zinc-500">CTR</span>
                        <span className="tabular-nums font-semibold text-zinc-900">{formatCtr(m.ctr)}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-zinc-200">
                        <span className="text-zinc-500">Like</span>
                        <span className="tabular-nums font-semibold text-zinc-900">{formatNumber(m.like)}</span>
                      </div>
                    </div>

                    {/* <div className="mt-4 flex flex-wrap gap-2">
                      {m.video_url && (
                        <a
                          className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200"
                          href={m.video_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          새 탭에서 영상 보기
                        </a>
                      )}
                    </div> */}
                  </div>
                </li>
              );
            })}
          </ul>

          {(() => {
            if (!materials.length) return null;

            const currentPage = pagination?.page ?? dashboardPage;
            const size = pagination?.size ?? 20;
            const totalCount = typeof pagination?.total_count === "number" ? pagination.total_count : null;
            const totalPages = totalCount != null && size > 0 ? Math.max(1, Math.ceil(totalCount / size)) : null;

            // 1~10, 11~20 ... 페이지 그룹
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

          {!loading && !error && materials.length === 0 && (
            <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center text-sm text-zinc-600">
              아직 결과가 없어요. 위에서 조건을 선택하고 가져와보세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

