"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface HistoryItem {
  id: string;
  notes: string | null;
  checked: boolean;
  changedAt: Date;
}

interface ChecklistItem {
  itemText: string;
  category: { name: string };
}

interface SecurityCheckResponse {
  checked: boolean;
  notes: string | null;
  checklistItem: ChecklistItem;
  history?: HistoryItem[];
}

interface Container {
  id: string;
  containerNo: string;
  companyName: string;
  sealNo: string;
  plateNo: string;
  inspectionDate: Date;
  securityCheck: {
    inspectorName: string;
    remarks: string | null;
    user: { name: string } | null;
    photos: { url: string; filename: string }[];
    responses: SecurityCheckResponse[];
    createdAt: Date;
  } | null;
  checkerData: {
    utcNo: string;
    inspectorName: string;
    remarks: string | null;
    user: { name: string } | null;
    photos: { url: string; filename: string }[];
    createdAt: Date;
  } | null;
}

interface ReportsClientProps {
  containers: Container[];
}

export default function ReportsClient({ containers }: ReportsClientProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");

  const downloadImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(",")[1]);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      return null;
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    setExportProgress("Mempersiapkan workbook...");

    try {
      const workbook = new ExcelJS.Workbook();

      // ===== SHEET 1: RINGKASAN =====
      setExportProgress("Membuat sheet ringkasan...");
      const summarySheet = workbook.addWorksheet("Ringkasan");

      summarySheet.mergeCells("A1:L1");
      const titleCell = summarySheet.getCell("A1");
      titleCell.value = "LAPORAN PEMERIKSAAN KONTAINER";
      titleCell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7030A0" },
      };
      summarySheet.getRow(1).height = 35;

      summarySheet.mergeCells("A2:L2");
      const dateCell = summarySheet.getCell("A2");
      dateCell.value = `Tanggal Generate: ${new Date().toLocaleDateString(
        "id-ID",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`;
      dateCell.font = { size: 11, italic: true };
      dateCell.alignment = { horizontal: "center" };

      summarySheet.mergeCells("A3:L3");
      const statsCell = summarySheet.getCell("A3");
      const completed = containers.filter(
        (c) => c.securityCheck && c.checkerData
      ).length;
      const pendingChecker = containers.filter(
        (c) => c.securityCheck && !c.checkerData
      ).length;
      const pendingSecurity = containers.filter((c) => !c.securityCheck).length;
      statsCell.value = `Total: ${containers.length} | Selesai: ${completed} | Pending Checker: ${pendingChecker} | Pending Security: ${pendingSecurity}`;
      statsCell.font = { size: 10, bold: true };
      statsCell.alignment = { horizontal: "center" };

      summarySheet.addRow([]);

      const headerRow = summarySheet.addRow([
        "No.",
        "No. Kontainer",
        "No. Segel",
        "No. Plat",
        "No. UTC",
        "Perusahaan",
        "Tanggal",
        "Inspector Security",
        "Inspector Checker",
        "Status",
        "Total Foto",
        "Keterangan",
      ]);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7030A0" },
      };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.height = 25;

      summarySheet.columns = [
        { width: 5 },
        { width: 18 },
        { width: 15 },
        { width: 15 },
        { width: 18 },
        { width: 28 },
        { width: 15 },
        { width: 20 },
        { width: 20 },
        { width: 15 },
        { width: 10 },
        { width: 30 },
      ];

      containers.forEach((container, index) => {
        const hasSecurity = !!container.securityCheck;
        const hasChecker = !!container.checkerData;
        const status =
          hasSecurity && hasChecker
            ? "Selesai"
            : hasSecurity
            ? "Pending Checker"
            : "Pending Security";
        const totalPhotos =
          (container.securityCheck?.photos?.length || 0) +
          (container.checkerData?.photos?.length || 0);

        const row = summarySheet.addRow([
          index + 1,
          container.containerNo,
          container.sealNo,
          container.plateNo,
          container.checkerData?.utcNo || "-",
          container.companyName,
          new Date(container.inspectionDate).toLocaleDateString("id-ID"),
          container.securityCheck?.inspectorName || "-",
          container.checkerData?.inspectorName || "-",
          status,
          totalPhotos,
          container.securityCheck?.remarks ||
            container.checkerData?.remarks ||
            "-",
        ]);

        row.alignment = { vertical: "middle", wrapText: true };
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        const statusCell = row.getCell(10);
        if (status === "Selesai") {
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFC6EFCE" },
          };
          statusCell.font = { color: { argb: "FF006100" }, bold: true };
        } else {
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFC7CE" },
          };
          statusCell.font = { color: { argb: "FF9C0006" }, bold: true };
        }
      });

      // ===== SHEET 2: DETAIL CHECKLIST (WITH HISTORY) =====
      setExportProgress("Membuat sheet detail checklist...");
      const detailSheet = workbook.addWorksheet("Detail Checklist");

      // Title
      detailSheet.mergeCells("A1:M1");
      const detailTitle = detailSheet.getCell("A1");
      detailTitle.value = "DETAIL CHECKLIST & HISTORY PER KONTAINER";
      detailTitle.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      detailTitle.alignment = { horizontal: "center", vertical: "middle" };
      detailTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7030A0" },
      };
      detailSheet.getRow(1).height = 30;

      detailSheet.addRow([]);

      // ✅ Header row dengan history columns
      const detailHeaderRow = detailSheet.addRow([
        "No. Kontainer",
        "Perusahaan",
        "Kategori",
        "Checklist Item",
        "Status",
        "Catatan Terkini",
        "Inspector",
        "Tanggal Periksa",
        "No. Segel",
        "No. Plat",
        "No. UTC",
        "Jumlah History",
        "Detail History",
      ]);

      detailHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      detailHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF70AD47" },
      };
      detailHeaderRow.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      detailHeaderRow.height = 30;

      // Column widths
      detailSheet.columns = [
        { width: 18 }, // No. Kontainer
        { width: 28 }, // Perusahaan
        { width: 20 }, // Kategori
        { width: 45 }, // Checklist Item
        { width: 8 }, // Status
        { width: 30 }, // Catatan Terkini
        { width: 18 }, // Inspector
        { width: 15 }, // Tanggal Periksa
        { width: 15 }, // No. Segel
        { width: 15 }, // No. Plat
        { width: 18 }, // No. UTC
        { width: 12 }, // Jumlah History
        { width: 60 }, // Detail History
      ];

      // ✅ Flat data structure with history
      const containersWithSecurity = containers.filter((c) => c.securityCheck);

      containersWithSecurity.forEach((container) => {
        const responses = container.securityCheck!.responses || [];

        responses.forEach((response) => {
          const history = response.history || [];

          // Format history text
          const historyText = history
            .map((h, idx) => {
              const dateStr = new Date(h.changedAt).toLocaleString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return `[${history.length - idx}] ${h.checked ? "✓" : "✗"} ${
                h.notes || "Tidak ada catatan"
              } (${dateStr})`;
            })
            .join("\n");

          const row = detailSheet.addRow([
            container.containerNo,
            container.companyName,
            response.checklistItem.category.name,
            response.checklistItem.itemText,
            response.checked ? "✓" : "✗",
            response.notes || "-",
            container.securityCheck!.inspectorName,
            new Date(container.securityCheck!.createdAt).toLocaleDateString(
              "id-ID"
            ),
            container.sealNo,
            container.plateNo,
            container.checkerData?.utcNo || "-",
            history.length,
            historyText || "Tidak ada history",
          ]);

          // Calculate row height based on history count
          const minHeight = 20;
          const historyHeight = Math.max(minHeight, history.length * 15 + 10);
          row.height = Math.min(historyHeight, 200); // Max 200px

          row.alignment = { vertical: "top", wrapText: true };
          row.eachCell((cell, colNum) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };

            // Status column (E) color coding
            if (colNum === 5) {
              if (response.checked) {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFC6EFCE" },
                };
                cell.font = { color: { argb: "FF006100" }, bold: true };
              } else {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFFFC7CE" },
                };
                cell.font = { color: { argb: "FF9C0006" }, bold: true };
              }
              cell.alignment = { horizontal: "center", vertical: "middle" };
            }

            // Jumlah History column (L) center align
            if (colNum === 12) {
              cell.alignment = { horizontal: "center", vertical: "middle" };
            }

            // Detail History column (M) top align with wrap
            if (colNum === 13) {
              cell.alignment = {
                vertical: "top",
                horizontal: "left",
                wrapText: true,
              };
            }
          });
        });
      });

      // ✅ Add AutoFilter
      detailSheet.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: detailSheet.rowCount, column: 13 },
      };

      // ✅ Freeze panes
      detailSheet.views = [
        {
          state: "frozen",
          xSplit: 0,
          ySplit: 3,
          topLeftCell: "A4",
          activeCell: "A4",
        },
      ];

      // ===== SHEET 3: FOTO (HORIZONTAL PER CONTAINER) =====
      setExportProgress("Membuat sheet foto...");
      const photoSheet = workbook.addWorksheet("Foto");

      // ✅ Calculate max photos untuk menentukan merge width
      const maxPhotos = Math.max(
        ...containers.map(
          (c) =>
            (c.securityCheck?.photos?.length || 0) +
            (c.checkerData?.photos?.length || 0)
        ),
        1 // Minimum 1
      );

      // Title merge dinamis berdasarkan jumlah foto terbanyak
      const titleEndColumn = String.fromCharCode(67 + maxPhotos); // C=67, jadi C+maxPhotos untuk kolom akhir
      photoSheet.mergeCells(`A1:${titleEndColumn}1`);
      const photoTitle = photoSheet.getCell("A1");
      photoTitle.value = "DOKUMENTASI FOTO PEMERIKSAAN";
      photoTitle.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      photoTitle.alignment = { horizontal: "center", vertical: "middle" };
      photoTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7030A0" },
      };
      photoSheet.getRow(1).height = 30;

      photoSheet.addRow([]);

      // ✅ Header tanpa "Tipe"
      const photoHeaderRow = photoSheet.addRow([
        "No.",
        "No. Kontainer",
        "Perusahaan",
        "Gambar",
      ]);
      photoHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      photoHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7030A0" },
      };
      photoHeaderRow.alignment = { horizontal: "center", vertical: "middle" };
      photoHeaderRow.height = 25;

      // Set column widths
      photoSheet.getColumn(1).width = 5; // No
      photoSheet.getColumn(2).width = 20; // No. Kontainer
      photoSheet.getColumn(3).width = 30; // Perusahaan

      let rowCounter = 1;
      let currentPhotoRow = 4;

      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        setExportProgress(`Processing images ${i + 1}/${containers.length}...`);

        const allPhotos = [
          ...(container.securityCheck?.photos || []).map((p) => ({
            ...p,
            type: "Security",
          })),
          ...(container.checkerData?.photos || []).map((p) => ({
            ...p,
            type: "Checker",
          })),
        ];

        if (allPhotos.length === 0) continue;

        // ✅ Create row tanpa kolom "Tipe"
        const row = photoSheet.addRow([
          rowCounter++,
          container.containerNo,
          container.companyName,
        ]);

        row.height = 120;
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });

        // ✅ Embed images horizontally starting from column D (index 4)
        for (let j = 0; j < allPhotos.length; j++) {
          const photo = allPhotos[j];

          const colIndex = 4 + j; // Start from column D (4), E (5), F (6), etc.
          if (!photoSheet.getColumn(colIndex).width) {
            photoSheet.getColumn(colIndex).width = 30;
          }

          // Add border to image cell
          const imageCell = photoSheet.getCell(currentPhotoRow, colIndex);
          imageCell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          // Download and embed image
          const base64 = await downloadImageAsBase64(photo.url);
          if (base64) {
            const extension = photo.filename.toLowerCase().endsWith(".png")
              ? "png"
              : "jpeg";
            const imageId = workbook.addImage({
              base64: base64,
              extension: extension,
            });

            photoSheet.addImage(imageId, {
              tl: { col: colIndex - 1, row: currentPhotoRow - 1 },
              ext: { width: 200, height: 110 },
            });
          }
        }

        currentPhotoRow++;
      }

      // Save file
      setExportProgress("Menyimpan file...");
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `laporan-kontainer-lengkap-${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );

      setExportProgress("");
      alert(
        `Export berhasil!\n- ${containers.length} kontainer\n- ${containersWithSecurity.length} dengan checklist`
      );
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Gagal export Excel: " + (error as Error).message);
      setExportProgress("");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <FileSpreadsheet className="h-6 w-6 text-purple-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Export Laporan
          </h3>
          <p className="text-sm text-gray-500">
            Export data dengan gambar berjajar horizontal
          </p>
        </div>
      </div>

      <button
        onClick={exportToExcel}
        disabled={isExporting || containers.length === 0}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">{exportProgress}</span>
          </>
        ) : (
          <>
            <FileSpreadsheet className="h-5 w-5" />
            <span className="text-sm font-medium">
              Export Excel ({containers.length} data)
            </span>
          </>
        )}
      </button>

      {containers.length === 0 && (
        <p className="text-sm text-gray-500 text-center mt-4">
          Tidak ada data untuk diexport.
        </p>
      )}
    </div>
  );
}
