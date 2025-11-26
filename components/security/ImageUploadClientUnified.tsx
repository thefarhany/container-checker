"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";

type UploadMode = "create" | "edit";

interface ExistingPhoto {
  id: string;
  url: string;
  filename: string;
}

interface PreviewItem {
  id: string;
  url: string;
  name: string;
}

interface ImageUploadClientUnifiedProps {
  mode?: UploadMode;
  existingPhotos?: ExistingPhoto[];
}

export default function ImageUploadClientUnified({
  mode = "create",
  existingPhotos = [],
}: ImageUploadClientUnifiedProps) {
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);

    const validFiles = newFiles.filter((file) => {
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      const validSize = file.size <= 5 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        alert(`File ${file.name} bukan gambar yang valid (PNG, JPG, JPEG)`);
        return false;
      }

      if (!validSize) {
        alert(`File ${file.name} terlalu besar (maks 5MB)`);
        return false;
      }

      return true;
    });

    const remainingExistingPhotos =
      existingPhotos.length - deletedPhotoIds.length;
    const totalPhotos =
      previews.length + remainingExistingPhotos + validFiles.length;

    if (totalPhotos > 20) {
      alert(
        `Maksimal 20 foto. Saat ini: ${
          previews.length + remainingExistingPhotos
        }`
      );
      return;
    }

    const newPreviews = validFiles.map((file) => ({
      id: `preview-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setPreviews((prev) => [...prev, ...newPreviews]);
    setFiles((prev) => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeNewImage = (id: string) => {
    setPreviews((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      const removed = prev.find((p) => p.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return updated;
    });

    setFiles((prev) => {
      const index = previews.findIndex((p) => p.id === id);
      if (index !== -1) {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      }
      return prev;
    });
  };

  const deleteExistingPhoto = (photoId: string) => {
    setDeletedPhotoIds((prev) => [...prev, photoId]);
  };

  const undoDeleteExistingPhoto = (photoId: string) => {
    setDeletedPhotoIds((prev) => prev.filter((id) => id !== photoId));
  };

  useEffect(() => {
    const form = fileInputRef.current?.form;
    if (form && files.length > 0) {
      const dataTransfer = new DataTransfer();
      files.forEach((file) => {
        dataTransfer.items.add(file);
      });

      let hiddenInput = form.querySelector(
        'input[name="photos"][type="hidden"]'
      ) as HTMLInputElement | null;

      if (!hiddenInput) {
        hiddenInput = document.createElement("input");
        hiddenInput.type = "file";
        hiddenInput.name = "photos";
        hiddenInput.multiple = true;
        hiddenInput.className = "hidden";
        form.appendChild(hiddenInput);
      }

      hiddenInput.files = dataTransfer.files;
    }
  }, [files]);

  const remainingExistingPhotos = existingPhotos.filter(
    (photo) => !deletedPhotoIds.includes(photo.id)
  );
  const totalNewPhotos = previews.length;
  const totalPhotos = remainingExistingPhotos.length + totalNewPhotos;

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600">
        Total: <span className="font-semibold">{totalPhotos}</span>
        /20 foto (Min: 1, Maks: 20)
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
      >
        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3 group-hover:text-blue-500 transition" />
        <p className="text-base font-medium text-slate-700">
          Klik untuk upload foto
        </p>
        <p className="text-sm text-slate-500 mt-1">PNG, JPG, JPEG hingga 5MB</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        name="photos"
        multiple
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      {isEditMode && existingPhotos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Foto Pemeriksaan Saat Ini ({remainingExistingPhotos.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {existingPhotos.map((photo) => {
              const isDeleted = deletedPhotoIds.includes(photo.id);

              return (
                <div
                  key={photo.id}
                  className={`relative group rounded-lg overflow-hidden border ${
                    isDeleted ? "border-red-300 bg-red-50" : "border-slate-300"
                  }`}
                >
                  <div className="relative w-full h-32 bg-slate-200">
                    <Image
                      src={photo.url}
                      alt={photo.filename}
                      width={300}
                      height={192}
                      className={`w-full h-48 object-cover rounded-lg transition ${
                        isDeleted ? "opacity-30 grayscale" : ""
                      }`}
                      unoptimized
                    />
                  </div>

                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
                    {isDeleted ? (
                      <button
                        type="button"
                        onClick={() => undoDeleteExistingPhoto(photo.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium transition"
                      >
                        Batalkan Hapus
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => deleteExistingPhoto(photo.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {previews.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Foto yang akan diupload ({totalNewPhotos})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((preview) => (
              <div
                key={preview.id}
                className="relative group rounded-lg overflow-hidden border border-slate-300 bg-slate-50"
              >
                <div className="relative w-full h-32 bg-slate-200">
                  <Image
                    src={preview.url}
                    alt={preview.name}
                    width={300}
                    height={192}
                    className="w-full h-48 object-cover rounded-lg"
                    unoptimized
                  />
                </div>

                <div className="absolute inset-0 transition flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeNewImage(preview.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-2 py-1 bg-white border-t border-slate-300">
                  <p className="text-xs text-slate-700 truncate">
                    {preview.name}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">⧗ Baru</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previews.length === 0 &&
        (isCreateMode || remainingExistingPhotos.length === 0) && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">
              {isCreateMode
                ? "Belum ada foto yang dipilih"
                : "Tidak ada foto baru yang akan diupload"}
            </p>
          </div>
        )}
    </div>
  );
}
