"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import { deleteInspection } from "@/app/actions/inspections";

interface DeleteContainerButtonProps {
  containerId: string;
  variant?: "button" | "icon" | "small";
  redirectTo?: string;
  onDeleteSuccess?: () => void;
}

export default function DeleteContainerButton({
  containerId,
  variant = "small",
  redirectTo,
  onDeleteSuccess,
}: DeleteContainerButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteInspection(containerId);

      if (result.success) {
        setShowModal(false);

        if (onDeleteSuccess) {
          onDeleteSuccess();
        }

        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } else {
        console.error("Delete failed:", result.error);
        alert("Gagal menghapus data: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Terjadi kesalahan saat menghapus data");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderButton = () => {
    switch (variant) {
      case "button":
        return (
          <button
            onClick={() => setShowModal(true)}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Menghapus..." : "Hapus"}
          </button>
        );

      case "icon":
        return (
          <button
            onClick={() => setShowModal(true)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isDeleting ? "Menghapus..." : "Hapus"}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        );

      case "small":
      default:
        return (
          <button
            onClick={() => setShowModal(true)}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? "Hapus..." : "Hapus"}
          </button>
        );
    }
  };

  return (
    <>
      {renderButton()}
      <DeleteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        title="Hapus Pemeriksaan"
        message="Apakah Anda yakin ingin menghapus data pemeriksaan ini? Semua data terkait akan ikut terhapus. Tindakan ini tidak dapat dibatalkan."
      />
    </>
  );
}
