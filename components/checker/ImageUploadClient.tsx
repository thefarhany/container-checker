"use client";

import { useState, useRef } from "react";
import { X, Upload, ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadClientProps {
  onImagesChange: (files: File[]) => void;
  maxImages?: number;
}

export default function ImageUploadClient({
  onImagesChange,
  maxImages = 10,
}: ImageUploadClientProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (
    files: File[]
  ): { valid: File[]; errors: string[] } => {
    const errors: string[] = [];
    const valid: File[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];

    files.forEach((file) => {
      if (file.size > maxSize) {
        errors.push(`${file.name} melebihi ukuran maksimal 5MB`);
      } else if (!validTypes.includes(file.type)) {
        errors.push(`${file.name} bukan format JPG/PNG`);
      } else {
        valid.push(file);
      }
    });

    return { valid, errors };
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const addImages = (files: File[]) => {
    // Check total count
    if (images.length + files.length > maxImages) {
      alert(
        `Maksimal ${maxImages} foto. Anda sudah memiliki ${images.length} foto.`
      );
      return;
    }

    // Validate files
    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    if (valid.length === 0) return;

    // Add new images
    const newImages = [...images, ...valid];
    setImages(newImages);
    onImagesChange(newImages);

    // Create previews
    const newPreviews = valid.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    // Revoke object URL to free memory
    URL.revokeObjectURL(previews[index]);

    setImages(newImages);
    setPreviews(newPreviews);
    onImagesChange(newImages);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400"
        } ${
          images.length >= maxImages
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="checker-photo-upload"
          accept="image/jpeg,image/png,image/jpg"
          multiple
          onChange={handleImageSelect}
          className="hidden"
          disabled={images.length >= maxImages}
        />

        <div className="flex flex-col items-center">
          <div
            className={`p-3 rounded-full mb-3 ${
              isDragging ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            <ImageIcon
              className={`w-8 h-8 ${
                isDragging ? "text-blue-600" : "text-gray-400"
              }`}
            />
          </div>

          {isDragging ? (
            <p className="text-blue-600 font-medium mb-2">
              Lepaskan file di sini
            </p>
          ) : (
            <>
              <p className="text-gray-700 font-medium mb-2">
                Drag & drop foto atau klik tombol di bawah
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= maxImages}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                Pilih Foto
              </button>
            </>
          )}

          <p className="text-xs text-gray-500 mt-3">
            Maksimal {maxImages} foto • Format JPG/PNG • Maks 5MB per foto
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              {images.length} / {maxImages} foto dipilih
            </p>
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  previews.forEach((preview) => URL.revokeObjectURL(preview));
                  setImages([]);
                  setPreviews([]);
                  onImagesChange([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Hapus Semua
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group hover:border-blue-400 transition-colors"
              >
                <Image
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover"
                />

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                  title="Hapus foto"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Filename overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">
                    {images[index].name}
                  </p>
                  <p className="text-white/80 text-[10px]">
                    {(images[index].size / 1024).toFixed(0)} KB
                  </p>
                </div>

                {/* Image number badge */}
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Belum ada foto yang dipilih</p>
        </div>
      )}
    </div>
  );
}
