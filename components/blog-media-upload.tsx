"use client";

import * as React from "react";
import { ImageIcon, Upload, Video, X } from "lucide-react";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "@/components/auth-provider";
import { firebaseStorage } from "@/lib/firebase/client";
import type { BlogMediaType } from "@/lib/blog";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

function isManagedBlogMedia(value: string): boolean {
  return value.includes("/o/blog%2Fmedia%2F") || value.includes("/blog/media/");
}

export async function deleteManagedBlogMedia(value: string): Promise<void> {
  if (isManagedBlogMedia(value)) await deleteObject(ref(firebaseStorage, value));
}

async function optimizeImage(file: File): Promise<Blob> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = sourceUrl;
    await image.decode();

    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
    if (!blob) throw new Error("Unable to create image file");
    return blob;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export function BlogMediaUpload({
  value,
  persistedValue = "",
  type,
  onChange,
  onUploadingChange,
  disabled = false,
}: {
  value: string;
  persistedValue?: string;
  type: BlogMediaType;
  onChange: (value: string, type: BlogMediaType) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}) {
  const { actualUser } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [previewType, setPreviewType] = React.useState<BlogMediaType>(type);
  const activeSrc = preview || value;
  const activeType = preview ? previewType : type;
  const isDisabled = disabled || uploading;

  React.useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const upload = async (file: File | undefined) => {
    if (!file || isDisabled) return;
    const nextType: BlogMediaType | null = file.type.startsWith("image/")
      ? "image"
      : VIDEO_TYPES.has(file.type)
        ? "video"
        : null;

    if (!nextType) {
      setError("Choose an image, MP4 or WebM file.");
      return;
    }
    if (nextType === "image" && file.size > MAX_IMAGE_BYTES) {
      setError("Choose an image smaller than 8 MB.");
      return;
    }
    if (nextType === "video" && file.size > MAX_VIDEO_BYTES) {
      setError("Choose a video smaller than 50 MB.");
      return;
    }

    setError(null);
    setUploading(true);
    onUploadingChange?.(true);
    setPreviewType(nextType);
    const localPreview = URL.createObjectURL(file);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return localPreview;
    });

    try {
      if (!actualUser?.uid) throw new Error("A signed-in user is required");
      const uploadId = typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const body = nextType === "image" ? await optimizeImage(file) : file;
      const extension = nextType === "image" ? "webp" : (file.name.split(".").pop()?.toLowerCase() || "mp4");
      const contentType = nextType === "image" ? "image/webp" : file.type;
      const result = await uploadBytes(
        ref(firebaseStorage, `blog/media/${actualUser.uid}/${uploadId}.${extension}`),
        body,
        { contentType, cacheControl: "public,max-age=31536000" },
      );
      const nextUrl = await getDownloadURL(result.ref);
      const previousUrl = value;
      onChange(nextUrl, nextType);
      if (previousUrl && previousUrl !== nextUrl && previousUrl !== persistedValue) {
        deleteManagedBlogMedia(previousUrl).catch((cause) => {
          console.warn("Unable to remove unpublished blog media", cause);
        });
      }
      setPreview(null);
    } catch (cause) {
      console.error("Unable to upload blog media", cause);
      setError("Couldn’t upload that file. Check your connection and try again.");
      setPreview(null);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const remove = async () => {
    if (!value || isDisabled) return;
    setUploading(true);
    onUploadingChange?.(true);
    setError(null);
    try {
      onChange("", "image");
      if (value !== persistedValue) {
        deleteManagedBlogMedia(value).catch((cause) => {
          console.warn("Unable to remove unpublished blog media", cause);
        });
      }
    } catch (cause) {
      console.error("Unable to remove blog media", cause);
      setError("Couldn’t remove that file. Try again.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-foreground">Cover media</span>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files[0]);
        }}
        className={`relative overflow-hidden rounded-lg border border-dashed p-3 transition focus-within:ring-2 focus-within:ring-primary/40 ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-foreground/50"} ${isDisabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <button
          type="button"
          disabled={isDisabled}
          aria-busy={uploading}
          onClick={() => inputRef.current?.click()}
          className="block w-full cursor-pointer text-left focus-visible:outline-none disabled:cursor-not-allowed"
        >
          {activeSrc ? (
            <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
              <div className="aspect-video overflow-hidden rounded-md bg-black">
                {activeType === "video" ? (
                  <video src={activeSrc} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeSrc} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="m-0 flex items-center gap-2 text-[13px] font-semibold text-foreground">
                  {activeType === "video" ? <Video aria-hidden="true" className="h-4 w-4" /> : <ImageIcon aria-hidden="true" className="h-4 w-4" />}
                  {uploading ? "Uploading media…" : `Replace ${activeType}`}
                </p>
                <p className="mb-0 mt-1 text-xs leading-relaxed text-muted-foreground">
                  {uploading ? "Saving to Firebase Storage." : "Select a new image or video, or drop it here."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-28 flex-col items-center justify-center gap-2 text-center">
              <Upload aria-hidden="true" className="h-5 w-5 text-primary" />
              <p className="m-0 text-[13px] font-semibold text-foreground">Select or drop an image or video</p>
              <p className="m-0 text-xs text-muted-foreground">Images up to 8 MB · MP4 or WebM up to 50 MB</p>
            </div>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/mp4,video/webm"
          disabled={isDisabled}
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
          className="hidden"
        />
      </div>

      {value && !uploading ? (
        <button
          type="button"
          onClick={() => void remove()}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-50"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />Remove media
        </button>
      ) : null}
      {error ? <p role="alert" className="m-0 text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
