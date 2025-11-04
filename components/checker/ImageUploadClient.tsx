"use client";

import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { Upload, X } from "lucide-react";

interface ImageUploadClientProps {
  images: File[];
  setImages: Dispatch<SetStateAction<File[]>>;
  maxImages?: number;
}

export default function ImageUploadClient({
  images,
  setImages,
  maxImages = 20,
}: ImageUploadClientProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB");
      return false;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError("Hanya format JPG/PNG yang diizinkan");
      return false;
    }

    return true;
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      setError(null);
      const newFiles = Array.from(files);
      const validFiles: File[] = [];

      for (const file of newFiles) {
        if (validFiles.length + images.length >= maxImages) {
          setError(`Maksimal ${maxImages} foto`);
          break;
        }

        if (validateFile(file)) {
          validFiles.push(file);
        }
      }

      if (validFiles.length > 0) {
        setImages((prev) => [...prev, ...validFiles]);
      }
    },
    [images.length, maxImages, setImages]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400"
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="text-center">
          {isDragging ? (
            <>
              <Upload className="mx-auto h-12 w-12 text-blue-500" />
              <p className="mt-2 text-sm font-medium text-blue-600">
                Lepaskan file di sini
              </p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-700">
                Drag & drop foto atau klik tombol di bawah
              </p>
            </>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Maksimal {maxImages} foto • Format JPG/PNG • Maks 5MB per foto
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {images.length} / {maxImages} foto dipilih
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                  <p className="text-xs text-white truncate">{image.name}</p>
                  <p className="text-xs text-gray-300">
                    {(image.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">Belum ada foto yang dipilih</p>
        </div>
      )}
    </div>
  );
}
