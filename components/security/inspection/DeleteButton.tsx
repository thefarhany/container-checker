"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import DeleteModal from "@/components/DeleteModal";
import { deleteInspection } from "@/app/actions/inspections";

export default function DeleteButton({
  inspectionId,
}: {
  inspectionId: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const result = await deleteInspection(inspectionId);
    if (result.success) {
      router.push("/security/dashboard");
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        <Trash2 size={16} />
        Hapus
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
