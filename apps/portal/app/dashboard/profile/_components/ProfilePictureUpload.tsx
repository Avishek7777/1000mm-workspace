"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { uploadProfilePictureAction, removeProfilePictureAction } from "@/actions/profile";

const INIT = { ok: false as const, error: "" };

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfilePictureUpload({
  currentImage,
  displayName,
}: {
  currentImage: string | null;
  displayName: string;
}) {
  const [preview, setPreview] = useState<string | null>(currentImage);
  const [state, formAction, pending] = useActionState(uploadProfilePictureAction, INIT);
  const [removing, startRemove] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.url) setPreview(state.url + `?t=${Date.now()}`);
  }, [state]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    formRef.current?.requestSubmit();
  }

  function handleRemove() {
    startRemove(async () => {
      await removeProfilePictureAction();
      setPreview(null);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Profile Picture</h2>

      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {preview ? (
            <Image
              src={preview}
              alt={displayName}
              width={80}
              height={80}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-200"
              unoptimized
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-800 text-2xl font-semibold text-teal-100 ring-2 ring-gray-200">
              {initials(displayName)}
            </div>
          )}
          {pending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16 8 8 0 01-8-8z" />
              </svg>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-2">
          <form ref={formRef} action={formAction}>
            <input
              ref={inputRef}
              name="picture"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFileChange}
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {preview ? "Change photo" : "Upload photo"}
            </button>
          </form>

          {preview && (
            <button
              type="button"
              disabled={removing}
              onClick={handleRemove}
              className="block text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {removing ? "Removing…" : "Remove photo"}
            </button>
          )}

          <p className="text-[11px] text-gray-400">JPEG, PNG, or WebP · max 2 MB</p>
        </div>
      </div>

      {state.error && (
        <p className="mt-3 text-xs text-red-600">{state.error}</p>
      )}
      {state.ok && (
        <p className="mt-3 text-xs text-green-600">Photo updated.</p>
      )}
    </div>
  );
}
