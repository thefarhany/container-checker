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
  category: { name: string } | null;
}

interface VehicleInspectionItem {
  itemName: string;
  category: { name: string } | null;
}

interface SecurityCheckResponse {
  checked: boolean;
  notes: string | null;
  checklistItem?: ChecklistItem | null;
  vehicleInspectionItem?: VehicleInspectionItem | null;
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

      // ===== SHEET 2: SECURITY CHECKLIST (hanya checklistItem) =====
      setExportProgress("Membuat sheet security checklist...");
      const detailSheet = workbook.addWorksheet("Security Checklist");

      detailSheet.mergeCells("A1:M1");
      const detailTitle = detailSheet.getCell("A1");
      detailTitle.value = "DETAIL SECURITY CHECKLIST & HISTORY PER KONTAINER";
      detailTitle.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      detailTitle.alignment = { horizontal: "center", vertical: "middle" };
      detailTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7030A0" },
      };
      detailSheet.getRow(1).height = 30;

      detailSheet.addRow([]);
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

      detailSheet.columns = [
        { width: 18 },
        { width: 28 },
        { width: 20 },
        { width: 45 },
        { width: 8 },
        { width: 30 },
        { width: 18 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 18 },
        { width: 12 },
        { width: 60 },
      ];

      const containersWithSecurity = containers.filter((c) => c.securityCheck);
      containersWithSecurity.forEach((container) => {
        const responses = container.securityCheck!.responses || [];
        // ✅ FILTER: Hanya checklistItem
        const securityResponses = responses.filter((r) => r.checklistItem);

        securityResponses.forEach((response) => {
          const history = response.history || [];
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
            response.checklistItem?.category?.name || "-",
            response.checklistItem?.itemText || "-",
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

          const minHeight = 20;
          const historyHeight = Math.max(minHeight, history.length * 15 + 10);
          row.height = Math.min(historyHeight, 200);
          row.alignment = { vertical: "top", wrapText: true };

          row.eachCell((cell, colNum) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };

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

            if (colNum === 12) {
              cell.alignment = { horizontal: "center", vertical: "middle" };
            }

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

      detailSheet.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: detailSheet.rowCount, column: 13 },
      };
      detailSheet.views = [
        {
          state: "frozen",
          xSplit: 0,
          ySplit: 3,
          topLeftCell: "A4",
          activeCell: "A4",
        },
      ];

      // ===== SHEET 3: VEHICLE INSPECTION (hanya vehicleInspectionItem) =====
      setExportProgress("Membuat sheet vehicle inspection...");
      const vehicleSheet = workbook.addWorksheet("Vehicle Inspection");

      vehicleSheet.mergeCells("A1:M1");
      const vehicleTitle = vehicleSheet.getCell("A1");
      vehicleTitle.value = "DETAIL VEHICLE INSPECTION & HISTORY PER KONTAINER";
      vehicleTitle.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      vehicleTitle.alignment = { horizontal: "center", vertical: "middle" };
      vehicleTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" }, // Biru untuk bedakan
      };
      vehicleSheet.getRow(1).height = 30;

      vehicleSheet.addRow([]);
      const vehicleHeaderRow = vehicleSheet.addRow([
        "No. Kontainer",
        "Perusahaan",
        "Kategori",
        "Item Inspeksi",
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
      vehicleHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      vehicleHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF5B9BD5" }, // Biru muda
      };
      vehicleHeaderRow.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      vehicleHeaderRow.height = 30;

      vehicleSheet.columns = [
        { width: 18 },
        { width: 28 },
        { width: 20 },
        { width: 45 },
        { width: 8 },
        { width: 30 },
        { width: 18 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 18 },
        { width: 12 },
        { width: 60 },
      ];

      containersWithSecurity.forEach((container) => {
        const responses = container.securityCheck!.responses || [];
        // ✅ FILTER: Hanya vehicleInspectionItem
        const vehicleResponses = responses.filter(
          (r) => r.vehicleInspectionItem
        );

        vehicleResponses.forEach((response) => {
          const history = response.history || [];
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

          const row = vehicleSheet.addRow([
            container.containerNo,
            container.companyName,
            response.vehicleInspectionItem?.category?.name || "-",
            response.vehicleInspectionItem?.itemName || "-",
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

          const minHeight = 20;
          const historyHeight = Math.max(minHeight, history.length * 15 + 10);
          row.height = Math.min(historyHeight, 200);
          row.alignment = { vertical: "top", wrapText: true };

          row.eachCell((cell, colNum) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };

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

            if (colNum === 12) {
              cell.alignment = { horizontal: "center", vertical: "middle" };
            }

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

      vehicleSheet.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: vehicleSheet.rowCount, column: 13 },
      };
      vehicleSheet.views = [
        {
          state: "frozen",
          xSplit: 0,
          ySplit: 3,
          topLeftCell: "A4",
          activeCell: "A4",
        },
      ];

      // ===== SHEET 4: FOTO =====
      setExportProgress("Membuat sheet foto...");
      const photoSheet = workbook.addWorksheet("Foto");

      const maxPhotos = Math.max(
        ...containers.map(
          (c) =>
            (c.securityCheck?.photos?.length || 0) +
            (c.checkerData?.photos?.length || 0)
        ),
        1
      );

      const titleEndColumn = String.fromCharCode(67 + maxPhotos);
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

      photoSheet.getColumn(1).width = 5;
      photoSheet.getColumn(2).width = 20;
      photoSheet.getColumn(3).width = 30;

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

        for (let j = 0; j < allPhotos.length; j++) {
          const photo = allPhotos[j];
          const colIndex = 4 + j;

          if (!photoSheet.getColumn(colIndex).width) {
            photoSheet.getColumn(colIndex).width = 30;
          }

          const imageCell = photoSheet.getCell(currentPhotoRow, colIndex);
          imageCell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

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

      // ===== SAVE FILE =====
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
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-black mb-2">
          Export Laporan
        </h2>
        <button
          onClick={exportToExcel}
          disabled={isExporting || containers.length === 0}
          className="flex items-center w-full text-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              {exportProgress}
            </>
          ) : (
            <>
              <FileSpreadsheet size={20} />
              Export Excel ({containers.length} data)
            </>
          )}
        </button>
        {containers.length === 0 && (
          <p className="text-sm text-red-600 mt-2">
            Tidak ada data untuk diexport.
          </p>
        )}
      </div>
    </div>
  );
}
