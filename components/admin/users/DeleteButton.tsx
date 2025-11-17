"use client";

import { Trash2 } from "lucide-react";
import { deleteInspectorName } from "@/app/actions/users";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Yakin ingin menghapus "${name}"?`)) return;

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("id", id);
      await deleteInspectorName(formData);
      router.refresh();
    } catch (error) {
      alert("Gagal menghapus user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      title="Hapus"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
