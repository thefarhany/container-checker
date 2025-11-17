"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";

interface PreviewItem {
  id: string;
  url: string;
  name: string;
}

interface Photo {
  id: string;
  url: string;
  filename: string;
}

interface ImageUploadClientUnifiedProps {
  mode: "create" | "edit" | "view";
  existingPhotos?: Photo[];
  disabled?: boolean;
}

export default function ImageUploadClientUnified({
  mode,
  existingPhotos = [],
  disabled = false,
}: ImageUploadClientUnifiedProps) {
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const mainInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) => {
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

    if (validFiles.length === 0) return;

    const totalPhotos =
      previews.length + validFiles.length + existingPhotos.length;
    if (totalPhotos > 10) {
      alert("Maksimal 10 foto");
      return;
    }

    const newPreviews = validFiles.map((file) => ({
      id: `preview-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setPreviews((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return prev.filter((_, i) => i !== index);
    });

    if (mainInputRef.current) {
      const dt = new DataTransfer();
      const currentFiles = Array.from(mainInputRef.current.files || []);
      currentFiles.forEach((file, i) => {
        if (i !== index) {
          dt.items.add(file);
        }
      });
      mainInputRef.current.files = dt.files;
    }
  };

  const triggerUpload = () => {
    if (!disabled) {
      mainInputRef.current?.click();
    }
  };

  const totalPhotos = existingPhotos.length + previews.length;

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Upload Foto <span className="text-red-500">*</span>
      </label>
      <p className="mb-2 text-xs text-gray-500">
        Total: {totalPhotos}/10 foto (Min: 1, Maks: 10)
      </p>

      <input
        ref={mainInputRef}
        type="file"
        name="photos"
        multiple
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {mode !== "view" && (
        <div
          onClick={triggerUpload}
          className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${
            disabled
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50"
          }`}
        >
          <Upload
            className={`h-12 w-12 mb-4 ${
              disabled ? "text-gray-300" : "text-gray-400"
            }`}
          />
          <p
            className={`text-sm font-medium ${
              disabled ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {disabled ? "Upload tidak tersedia" : "Klik untuk upload foto"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, JPEG hingga 5MB
          </p>
        </div>
      )}

      {(previews.length > 0 || existingPhotos.length > 0) && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">
            {mode === "view"
              ? `Foto Checker (${existingPhotos.length})`
              : `Foto yang akan diupload (${totalPhotos})`}
          </h4>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {existingPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
              >
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="truncate text-xs text-white">
                    {photo.filename}
                  </p>
                </div>
              </div>
            ))}
            {previews.map((preview, index) => (
              <div
                key={preview.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
              >
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="h-full w-full object-cover"
                />
                {mode !== "view" && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="truncate text-xs text-white">{preview.name}</p>
                  <span className="text-xs text-green-300">⧗ Baru</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previews.length === 0 &&
        existingPhotos.length === 0 &&
        mode !== "view" && (
          <p className="text-sm text-gray-500">Belum ada foto yang dipilih</p>
        )}
    </div>
  );
}
