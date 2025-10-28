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
  // State untuk foto yang sudah ada (dari database)
  const [existingImages, setExistingImages] =
    useState<ExistingPhoto[]>(existingPhotos);

  // State untuk foto baru yang akan diupload
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  // State untuk track foto yang akan dihapus
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputsRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);

    // Validate file count
    const totalPhotos =
      existingImages.length + previews.length + newFiles.length;
    if (totalPhotos > 20) {
      alert(
        `Maksimal 20 foto. Saat ini: ${existingImages.length + previews.length}`
      );
      return;
    }

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setPreviews((prev) => [...prev, ...newPreviews]);
    setFiles((prev) => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Hapus foto BARU (yang belum diupload)
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

  // Hapus foto LAMA (yang sudah ada di database)
  const removeExistingImage = (photoId: string) => {
    const totalAfterDelete = existingImages.length - 1 + previews.length;

    if (totalAfterDelete < 5) {
      alert("Minimal 5 foto harus tersedia. Upload foto baru terlebih dahulu.");
      return;
    }

    setExistingImages((prev) => prev.filter((img) => img.id !== photoId));
    setDeletedPhotoIds((prev) => [...prev, photoId]);
  };

  // Update hidden inputs untuk form submission
  useEffect(() => {
    if (!hiddenInputsRef.current) return;

    hiddenInputsRef.current.innerHTML = "";

    // Add new photo files
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
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
        <h2 className="text-lg font-semibold text-white">Foto Pemeriksaan</h2>
        <p className="text-sm text-blue-100 mt-1">
          Total: {totalPhotos}/20 foto (Min: 5, Maks: 20)
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Upload Button */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
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

        {/* Hidden inputs for form submission */}
        <div ref={hiddenInputsRef} />

        {/* Existing Images (dari database) */}
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

        {/* New Image Previews (yang akan diupload) */}
        {previews.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">
              Foto baru yang akan diupload ({previews.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-300 bg-blue-50 group"
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
                    <p className="text-blue-300 text-xs font-semibold">
                      ⧗ Baru
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning if photos below minimum */}
        {totalPhotos < 5 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Minimal 5 foto diperlukan. Saat ini: {totalPhotos} foto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
