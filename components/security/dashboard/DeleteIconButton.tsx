"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import { deleteInspection } from "@/app/actions/inspections";

export default function DeleteIconButton({
  inspectionId,
}: {
  inspectionId: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteInspection(inspectionId);
      if (result.success) {
        setShowModal(false);
        router.refresh();
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

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-red-600 hover:text-red-900 transition-colors"
        title="Hapus"
      >
        <Trash2 size={18} />
      </button>

      <DeleteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        title="Hapus Pemeriksaan"
        message="Apakah Anda yakin ingin menghapus data pemeriksaan ini? Tindakan ini tidak dapat dibatalkan."
      />
    </>
  );
}
