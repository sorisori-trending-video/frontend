import { useEffect, useMemo, useState } from "react";
import {
  createVideoGeneration,
  fetchGenerateCompositeImage,
  fetchGenerateVideoPrompt,
  getVideoGenerationById,
  getVideoGenerationContentUrl,
  type TiktokScraperItem,
  type VideoGenerationStatus,
} from "../api/ads";

const inputBase =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100";
const selectBase =
  `${inputBase} appearance-none [&::-ms-expand]:hidden pr-9 bg-no-repeat bg-[length:1rem] bg-[position:right_0.5rem_center] ` +
  `bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')]`;
const MAX_VIDEO_PROMPT_LENGTH = 2500;

function normalizeVideoPromptText(raw: string): string {
  const compact = raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (compact.length <= MAX_VIDEO_PROMPT_LENGTH) return compact;

  const sliced = compact.slice(0, MAX_VIDEO_PROMPT_LENGTH);
  const cutCandidates = [sliced.lastIndexOf("\n"), sliced.lastIndexOf(". "), sliced.lastIndexOf("! "), sliced.lastIndexOf("? ")];
  const cutIndex = Math.max(...cutCandidates);
  const safe = cutIndex >= 1800 ? sliced.slice(0, cutIndex + 1).trim() : sliced.trim();
  return safe.slice(0, MAX_VIDEO_PROMPT_LENGTH).trim();
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("파일 읽기 실패"));
        return;
      }
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      resolve(base64 ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export type SimilarVideoModalProps = {
  selectedCard: TiktokScraperItem | null;
  onClose: () => void;
};

export function SimilarVideoModal({ selectedCard, onClose }: SimilarVideoModalProps) {
  const [promptLoading, setPromptLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [videoGenerateLoading, setVideoGenerateLoading] = useState(false);
  const [videoGenerationId, setVideoGenerationId] = useState<string | null>(null);
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<VideoGenerationStatus | null>(null);
  const [videoGenerationError, setVideoGenerationError] = useState<string | null>(null);

  const [videoProvider, setVideoProvider] = useState<"sora" | "kling">("kling");
  const [videoModel, setVideoModel] = useState<string>("kling-v3");
  const [videoSize, setVideoSize] = useState<string>("9:16");
  const [videoSeconds, setVideoSeconds] = useState<number>(4);
  const [inputImageUrl, setInputImageUrl] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrlError, setImageUrlError] = useState(false);
  /** 1단계에서 생성한 썸네일+제품 합성 이미지. 있으면 영상 생성 시 이걸 레퍼런스로 사용 */
  const [compositeImageBase64, setCompositeImageBase64] = useState<string | null>(null);
  const [compositeImageMimeType, setCompositeImageMimeType] = useState<string | null>(null);
  /** true: 합성 성공, false: 썸네일만 사용(합성 불가), null: 첫 프레임 이미지 없음 */
  const [compositeSucceeded, setCompositeSucceeded] = useState<boolean | null>(null);
  /** 합성 불가일 때 사유 */
  const [compositeFailureReason, setCompositeFailureReason] = useState<string | null>(null);
  /** 1단계: 이미지 합성 로딩 */
  const [compositeLoading, setCompositeLoading] = useState(false);
  const [compositeError, setCompositeError] = useState<string | null>(null);
  /** 제품명·간단한 설명 (프롬프트 생성 시 대본·스타일 반영용) */
  const [productDescription, setProductDescription] = useState<string>("");

  const filePreviewUrls = useMemo(
    () =>
      imageFiles.map((file, index) => ({
        key: `${file.name}-${file.size}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [imageFiles]
  );

  const primaryImageFile = imageFiles[0] ?? null;

  useEffect(() => {
    return () => {
      filePreviewUrls.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [filePreviewUrls]);

  const showImagePreview = Boolean(imageFiles.length || inputImageUrl.trim());

  /** 1단계: 썸네일 + 제품 합성 이미지 생성 */
  const handleGenerateComposite = async () => {
    if (!selectedCard || imageFiles.length === 0) return;
    const thumbnailUrl = selectedCard["video.thumbnail"] ?? selectedCard["video.cover"] ?? "";
    if (!thumbnailUrl) {
      setCompositeError("참고 영상 썸네일이 없습니다.");
      return;
    }
    setCompositeLoading(true);
    setCompositeError(null);
    try {
      const productImages = await Promise.all(
        imageFiles.map(async (file) => ({
          base64: await readFileAsBase64(file),
          mimeType: file.type || "image/jpeg",
          fileName: file.name,
        }))
      );
      const res = await fetchGenerateCompositeImage({
        thumbnailImageUrl: thumbnailUrl,
        productImages,
        aspectRatio: videoSize === "9:16" ? "9:16" : videoSize === "16:9" ? "16:9" : "1:1",
      });
      setCompositeImageBase64(res.compositeImageBase64);
      setCompositeImageMimeType(res.compositeImageMimeType);
      setCompositeSucceeded(res.compositeSucceeded);
      setCompositeFailureReason(res.compositeFailureReason ?? null);
    } catch (err) {
      setCompositeError(err instanceof Error ? err.message : "이미지 합성 실패");
    } finally {
      setCompositeLoading(false);
    }
  };

  /** 2단계: 영상 프롬프트만 생성 (합성은 1단계에서 완료) */
  const handleGeneratePrompt = async () => {
    if (!selectedCard) return;
    setPromptLoading(true);
    setPromptError(null);
    setGeneratedPrompt(null);
    try {
      const thumbnailUrl = selectedCard["video.thumbnail"] ?? selectedCard["video.cover"] ?? "";
      const videoUrlRaw = selectedCard["video.url"] ?? null;

      const res = await fetchGenerateVideoPrompt({
        title: selectedCard.title,
        channelUsername: selectedCard["channel.username"],
        views: selectedCard.views,
        likes: selectedCard.likes,
        comments: selectedCard.comments,
        shares: selectedCard.shares,
        bookmarks: selectedCard.bookmarks,
        provider: videoProvider,
        model: videoModel,
        size: videoSize,
        seconds: videoSeconds,
        hasImageFile: !!(imageFiles.length || inputImageUrl.trim()),
        thumbnailImageUrl: thumbnailUrl || undefined,
        videoUrl: videoUrlRaw ?? undefined,
        compositeImageBase64: compositeImageBase64 || undefined,
        compositeImageMimeType: compositeImageMimeType ?? undefined,
        productDescription: productDescription.trim() || undefined,
      });
      setGeneratedPrompt(normalizeVideoPromptText(res.prompt));
      setPromptError(null);
    } catch (err) {
      setGeneratedPrompt(null);
      setPromptError(err instanceof Error ? err.message : "프롬프트 생성 실패");
    } finally {
      setPromptLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!generatedPrompt?.trim()) return;
    setVideoGenerateLoading(true);
    setVideoGenerationError(null);
    setVideoGenerationStatus(null);
    setVideoGenerationId(null);
    try {
      let imageFileBase64: string | undefined;
      let imageFileMimeType: string | undefined;
      const hasProductImage = !!(imageFiles.length || inputImageUrl.trim());
      // 합성 성공 시: 합성 이미지 사용. 합성 불가 + 제품 이미지 있음: 제품 이미지 사용. 합성 불가 + 제품 없음: 썸네일 사용.
      if (compositeSucceeded === true && compositeImageBase64) {
        imageFileBase64 = compositeImageBase64;
        imageFileMimeType = compositeImageMimeType ?? "image/png";
      } else if (compositeSucceeded === false && hasProductImage && primaryImageFile) {
        imageFileBase64 = await readFileAsBase64(primaryImageFile);
        imageFileMimeType = primaryImageFile.type || "image/jpeg";
      } else if (compositeSucceeded === false && hasProductImage && !primaryImageFile && inputImageUrl.trim()) {
        // 제품 이미지가 URL만 있는 경우: inputImageUrl로 전달
        imageFileBase64 = undefined;
        imageFileMimeType = undefined;
      } else if (compositeImageBase64) {
        // 합성 불가 + 제품 이미지 없음 → 썸네일 사용
        imageFileBase64 = compositeImageBase64;
        imageFileMimeType = compositeImageMimeType ?? "image/png";
      } else if (primaryImageFile) {
        imageFileBase64 = await readFileAsBase64(primaryImageFile);
        imageFileMimeType = primaryImageFile.type || "image/jpeg";
      }
      const normalizedPrompt = normalizeVideoPromptText(generatedPrompt);
      if (normalizedPrompt !== generatedPrompt) {
        setGeneratedPrompt(normalizedPrompt);
      }

      const created = await createVideoGeneration({
        prompt: normalizedPrompt,
        provider: videoProvider,
        model: videoModel,
        size: videoSize,
        seconds: String(videoSeconds),
        numVideos: 1,
        inputImageUrl: !imageFileBase64 && inputImageUrl.trim() ? inputImageUrl.trim() : undefined,
        imageFileBase64: imageFileBase64 || undefined,
        imageFileMimeType: imageFileMimeType || undefined,
      });
      const id = created?.data?.id ?? null;
      setVideoGenerationId(id);
      setVideoGenerationStatus(created?.data?.status ?? "PROCESSING");
      if (!id) {
        setVideoGenerationError("영상 생성 ID를 받지 못했습니다.");
      }
    } catch (err) {
      setVideoGenerationError(err instanceof Error ? err.message : "영상 생성 요청 실패");
    } finally {
      setVideoGenerateLoading(false);
    }
  };

  useEffect(() => {
    if (!videoGenerationId) return;
    if (videoGenerationStatus === "COMPLETE" || videoGenerationStatus === "FAILED" || videoGenerationStatus === "CANCELLED") {
      return;
    }

    let stop = false;
    const tick = async () => {
      try {
        const detail = await getVideoGenerationById(videoGenerationId);
        if (stop) return;
        const nextStatus = detail?.data?.status ?? null;
        setVideoGenerationStatus(nextStatus);
        if (nextStatus === "FAILED" && detail?.data?.errorMessage) {
          setVideoGenerationError(String(detail.data.errorMessage));
        }
      } catch (err) {
        if (!stop) {
          setVideoGenerationError(err instanceof Error ? err.message : "영상 상태 조회 실패");
        }
      }
    };

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, 5000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [videoGenerationId, videoGenerationStatus]);

  useEffect(() => {
    if (videoProvider === "sora") {
      setVideoModel("sora-2");
    } else {
      const klingModels = ["kling-v3", "kling-v2-6"];
      setVideoModel((prev) => (klingModels.includes(prev) ? prev : "kling-v3"));
    }
  }, [videoProvider]);

  /** Provider 변경 시 해당 provider에서 유효한 size로 초기화 */
  useEffect(() => {
    if (videoProvider === "sora") {
      const soraSizes = ["720x1280", "1280x720", "1024x1792", "1792x1024"];
      setVideoSize((prev) => (soraSizes.includes(prev) ? prev : "720x1280"));
    } else {
      const klingSizes = ["9:16", "16:9", "1:1"];
      setVideoSize((prev) => (klingSizes.includes(prev) ? prev : "9:16"));
    }
  }, [videoProvider]);

  /** Provider/Model 변경 시 해당 조합에서 유효한 seconds로 초기화 */
  useEffect(() => {
    if (videoProvider === "sora") {
      const soraSeconds = [4, 8, 12];
      setVideoSeconds((prev) => (soraSeconds.includes(prev) ? prev : 4));
    } else if (videoModel === "kling-v2-6") {
      const v2Seconds = [5, 10];
      setVideoSeconds((prev) => (v2Seconds.includes(prev) ? prev : 5));
    } else {
      const v3Seconds = Array.from({ length: 13 }, (_, i) => i + 3);
      setVideoSeconds((prev) => (v3Seconds.includes(prev) ? prev : 5));
    }
  }, [videoProvider, videoModel]);

  useEffect(() => {
    if (!selectedCard) return;
    setGeneratedPrompt(null);
    setPromptError(null);
    setVideoGenerationId(null);
    setVideoGenerationStatus(null);
    setVideoGenerationError(null);
    setVideoGenerateLoading(false);
    setVideoProvider("kling");
    setVideoModel("kling-v3");
    setVideoSize("9:16");
    setVideoSeconds(5);
    setInputImageUrl("");
    setImageFiles([]);
    setImageUrlError(false);
    setCompositeImageBase64(null);
    setCompositeImageMimeType(null);
    setCompositeSucceeded(null);
    setCompositeFailureReason(null);
    setCompositeError(null);
  }, [selectedCard]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!selectedCard) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-prompt-modal-title"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h2 id="video-prompt-modal-title" className="text-lg font-semibold text-zinc-900">
            비슷한 영상 제작하기
          </h2>
          <button
            type="button"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <div className="px-4 py-3 text-sm text-zinc-600">
          <div className="rounded-xl bg-zinc-50 px-3 py-2">
            <span className="font-medium text-zinc-800">@{selectedCard["channel.username"] ?? "-"}</span>
            {selectedCard.title && (
              <p className="mt-1 line-clamp-2 text-zinc-700">{selectedCard.title}</p>
            )}
          </div>
        </div>
        <div className="max-h-[60vh] overflow-auto px-4 pb-4">
          {promptError && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <p>{promptError}</p>
              {(promptError.includes("한도를 초과") || /quota|429|exceeded|billing/i.test(promptError)) && (
                <a
                  href="https://platform.openai.com/account/billing"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-medium text-rose-700 underline hover:text-rose-900"
                >
                  OpenAI 결제·플랜 확인 →
                </a>
              )}
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-sm">
            <div className="mb-2 font-semibold text-zinc-800">영상 생성 옵션</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600">Provider</span>
                <select
                  className={selectBase}
                  value={videoProvider}
                  onChange={(e) => setVideoProvider(e.target.value as "sora" | "kling")}
                >
                  <option value="kling">Kling</option>
                  <option value="sora">Sora</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600">Model</span>
                <select
                  className={selectBase}
                  value={videoModel}
                  onChange={(e) => setVideoModel(e.target.value)}
                >
                  {videoProvider === "sora" ? (
                    <>
                      <option value="sora-2">sora-2</option>
                      <option value="sora-2-pro">sora-2-pro</option>
                    </>
                  ) : (
                    <>
                      <option value="kling-v3">kling-v3</option>
                      <option value="kling-v2-6">kling-v2-6</option>
                    </>
                  )}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600">Size</span>
                <select
                  className={selectBase}
                  value={videoSize}
                  onChange={(e) => setVideoSize(e.target.value)}
                >
                  {videoProvider === "sora" ? (
                    <>
                      <option value="720x1280">720×1280</option>
                      <option value="1280x720">1280×720</option>
                      <option value="1024x1792">1024×1792</option>
                      <option value="1792x1024">1792×1024</option>
                    </>
                  ) : (
                    <>
                      <option value="9:16">9:16</option>
                      <option value="16:9">16:9</option>
                      <option value="1:1">1:1</option>
                    </>
                  )}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600">Seconds</span>
                <select
                  className={selectBase}
                  value={videoSeconds}
                  onChange={(e) => setVideoSeconds(Number(e.target.value))}
                >
                  {videoProvider === "sora"
                    ? [4, 8, 12].map((n) => (
                        <option key={n} value={n}>
                          {n}초
                        </option>
                      ))
                    : videoModel === "kling-v2-6"
                      ? [5, 10].map((n) => (
                          <option key={n} value={n}>
                            {n}초
                          </option>
                        ))
                      : [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => (
                          <option key={n} value={n}>
                            {n}초
                          </option>
                        ))}
                </select>
                <p className="mt-1 text-xs text-zinc-500">
                  {videoProvider === "sora"
                    ? "Sora: 4초, 8초, 12초."
                    : videoModel === "kling-v2-6"
                      ? "Kling v2-6: 5초, 10초."
                      : "Kling v3: 3–15초."}
                </p>
              </label>
            </div>
            <div className="mt-3 space-y-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600">이미지 URL (선택, image-to-video)</span>
                <input
                  type="url"
                  className={inputBase}
                  placeholder="https://..."
                  value={inputImageUrl}
                  onChange={(e) => {
                    setInputImageUrl(e.target.value);
                    setImageUrlError(false);
                  }}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600">
                  제품 이미지 파일들 (선택, 여러 장 가능, JPEG/PNG/WebP 최대 10MB)
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full text-sm text-zinc-600 file:mr-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                  onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
                />
                {imageFiles.length > 0 && (
                  <span className="mt-1 block text-xs text-zinc-500">
                    {imageFiles.length}장 선택됨: {imageFiles.map((file) => file.name).join(", ")}
                  </span>
                )}
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600">제품명 및 간단한 설명 (선택)</span>
                <textarea
                  className={`${inputBase} min-h-[80px] resize-y`}
                  placeholder="예: 메디큐브 에이지알 부스터 프로는 일렉트로포레이션(EP) 기술로 화장품 유효 성분을 깊숙이 흡수시켜 물광 효과를 내는 핵심 기능을 중심으로..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={3}
                />
                <p className="mt-1 text-xs text-zinc-500">
                  원본 영상과 비슷하게 만들고, 이 설명을 바탕으로 대본이 생성됩니다.
                </p>
              </label>
            </div>

            {showImagePreview && (
              <div className="mt-3">
                <span className="mb-1.5 block text-xs font-medium text-zinc-600">이미지 미리보기</span>
                <div className="flex justify-center rounded-xl border border-zinc-200 bg-zinc-100/80 p-2">
                  {imageFiles.length > 0 ? (
                    <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
                      {filePreviewUrls.map((file) => (
                        <div key={file.key} className="rounded-lg border border-zinc-200 bg-white p-1">
                          <img src={file.url} alt={file.name} className="h-28 w-full rounded object-contain" />
                          <div className="mt-1 truncate text-[11px] text-zinc-500" title={file.name}>
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : inputImageUrl.trim() ? (
                    imageUrlError ? (
                      <div className="flex max-h-40 items-center justify-center py-8 text-sm text-rose-600">
                        이미지를 불러올 수 없어요. URL을 확인해 주세요.
                      </div>
                    ) : (
                      <img
                        src={inputImageUrl.trim()}
                        alt="업로드 이미지 미리보기"
                        className="max-h-40 max-w-full rounded-lg object-contain"
                        onError={() => setImageUrlError(true)}
                      />
                    )
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* 1단계: 썸네일 + 제품 합성 이미지 */}
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3">
            <div className="mb-2 text-sm font-semibold text-zinc-800">1단계: 첫 프레임 이미지</div>
            <p className="mb-2 text-xs text-zinc-500">
              원본 썸네일(inputImageUrl)에 업로드한 제품 이미지들을 참고 이미지로 합성합니다. 제품 이미지 파일을 넣은 뒤 버튼을 누르세요.
            </p>
            {(selectedCard["video.thumbnail"] ?? selectedCard["video.cover"]) && (
              <div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
                <span className="mb-2 block text-xs font-medium text-zinc-600">inputImageUrl (원본 썸네일) — API에 이 이미지가 전달됩니다</span>
                <div className="flex justify-center rounded-lg border border-zinc-200 bg-white p-2">
                  <img
                    src={selectedCard["video.thumbnail"] ?? selectedCard["video.cover"] ?? ""}
                    alt="원본 썸네일 (inputImageUrl)"
                    className="max-h-40 max-w-full rounded object-contain"
                  />
                </div>
              </div>
            )}
            {compositeLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-zinc-500">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span>이미지 합성 중…</span>
              </div>
            )}
            {!compositeLoading && (
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={imageFiles.length === 0 || !(selectedCard["video.thumbnail"] ?? selectedCard["video.cover"])}
                onClick={handleGenerateComposite}
              >
                이미지 생성하기
              </button>
            )}
            {compositeError && (
              <p className="mt-2 text-sm text-rose-600">{compositeError}</p>
            )}
            {compositeImageBase64 && !compositeLoading && (
              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-600">합성 결과</span>
                  {compositeSucceeded === true && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">합성됨</span>
                  )}
                  {compositeSucceeded === false && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {showImagePreview ? "합성 불가 · 제품 이미지 사용" : "합성 불가 · 썸네일만 사용"}
                    </span>
                  )}
                </div>
                {compositeSucceeded === false && compositeFailureReason && (
                  <p className="mb-2 text-xs text-amber-800">{compositeFailureReason}</p>
                )}
                <div className="flex justify-center rounded-lg border border-zinc-200 bg-white p-2">
                  <img
                    src={`data:${compositeImageMimeType ?? "image/png"};base64,${compositeImageBase64}`}
                    alt="썸네일+제품 합성"
                    className="max-h-48 max-w-full rounded object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2단계: 영상 프롬프트 */}
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3">
            <div className="mb-2 text-sm font-semibold text-zinc-800">2단계: 영상 프롬프트</div>
            {promptLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-zinc-500">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span>영상 프롬프트 생성 중…</span>
              </div>
            )}
            {!generatedPrompt && !promptLoading && (
              <>
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleGeneratePrompt}
                >
                  영상 프롬프트 생성하기
                </button>
                <p className="mt-2 text-center text-xs text-zinc-500">
                  참고 영상의 썸네일·스토리보드를 반영해 비슷한 느낌의 프롬프트를 생성해요.
                </p>
              </>
            )}
            {generatedPrompt && (
              <div className="mt-2 space-y-3">
                <textarea
                  className="h-40 w-full rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 text-sm leading-relaxed text-zinc-800 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={promptLoading}
                  onClick={handleGeneratePrompt}
                >
                  {promptLoading ? "생성 중…" : "프롬프트 다시 생성하기"}
                </button>
                {videoProvider === "kling" && compositeImageBase64 && (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-800">
                    Kling 첫 프레임: 1단계에서 만든 합성 이미지가 사용됩니다.
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={videoGenerateLoading || !generatedPrompt.trim() || videoGenerationStatus === "PROCESSING"}
                  onClick={handleGenerateVideo}
                >
                  {videoGenerateLoading ? "영상 생성 요청 중..." : "이 프롬프트로 영상 생성"}
                </button>
                {videoGenerationId &&
                  (videoGenerationStatus === "PROCESSING" || videoGenerationStatus === "PENDING") && (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span>영상 생성 중…</span>
                    </div>
                  )}
                {videoGenerationId && videoGenerationStatus === "COMPLETE" && (
                  <a
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    href={getVideoGenerationContentUrl(videoGenerationId)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    생성 영상 다운로드
                  </a>
                )}
              </div>

              {videoGenerationError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  {videoGenerationError}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
