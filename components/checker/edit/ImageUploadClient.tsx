"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface ExistingPhoto {
  id: string;
  url: string;
  filename: string;
}

interface ImageUploadEditClientProps {
  existingPhotos: ExistingPhoto[];
}

export default function ImageUploadEditClient({
  existingPhotos,
}: ImageUploadEditClientProps) {
  const [existingImages, setExistingImages] =
    useState<ExistingPhoto[]>(existingPhotos);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputsRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setPreviews((prev) => [...prev, ...newPreviews]);
    setFiles((prev) => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeNewImage = (index: number) => {
    setPreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index]);
      updated.splice(index, 1);
      return updated;
    });

    setFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const removeExistingImage = (photoId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== photoId));
    setDeletedPhotoIds((prev) => [...prev, photoId]);
  };

  useEffect(() => {
    if (!hiddenInputsRef.current) return;

    hiddenInputsRef.current.innerHTML = "";

    // Add new photos
    const dataTransfer = new DataTransfer();
    files.forEach((file) => {
      dataTransfer.items.add(file);
    });

    const hiddenInput = document.createElement("input");
    hiddenInput.type = "file";
    hiddenInput.name = "photos";
    hiddenInput.multiple = true;
    hiddenInput.className = "hidden";
    hiddenInput.files = dataTransfer.files;
    hiddenInputsRef.current.appendChild(hiddenInput);

    // Add deleted photo IDs
    deletedPhotoIds.forEach((photoId) => {
      const deletedInput = document.createElement("input");
      deletedInput.type = "hidden";
      deletedInput.name = "deletedPhotoIds";
      deletedInput.value = photoId;
      hiddenInputsRef.current!.appendChild(deletedInput);
    });
  }, [files, deletedPhotoIds]);

  const totalPhotos = existingImages.length + previews.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
        <h2 className="text-lg font-semibold text-white">Foto Checker</h2>
        <p className="text-sm text-purple-100 mt-1">
          Total: {totalPhotos} foto
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Upload Button */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer group"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
              <Upload className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                Klik untuk upload foto tambahan
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, JPEG hingga 5MB
              </p>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div ref={hiddenInputsRef} />

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">
              Foto yang sudah ada ({existingImages.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {existingImages.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-300 bg-green-50 group"
                >
                  <Image
                    src={photo.url}
                    alt={photo.filename}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(photo.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {photo.filename}
                    </p>
                    <p className="text-green-300 text-xs font-semibold">
                      ✓ Tersimpan
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images */}
        {previews.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">
              Foto baru yang akan diupload ({previews.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-purple-300 bg-purple-50 group"
                >
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {files[index]?.name}
                    </p>
                    <p className="text-purple-300 text-xs font-semibold">
                      ⧗ Baru
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
