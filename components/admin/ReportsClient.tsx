"use client";

import { useState } from "react";
import { FileSpreadsheet, FileDown, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface ChecklistItem {
  itemText: string;
  category: {
    name: string;
  };
}

interface SecurityCheckResponse {
  checked: boolean;
  notes: string | null;
  checklistItem: ChecklistItem;
}

interface Container {
  id: string;
  containerNo: string;
  companyName: string;
  sealNo: string;
  plateNo: string;
  inspectionDate: Date;
  securityCheck: {
    user: { name: string } | null;
    photos: { url: string }[];
    responses: SecurityCheckResponse[];
  } | null;
  checkerData: {
    utcNo: string;
    user: { name: string } | null;
    photos: { url: string }[];
  } | null;
}

interface ReportsClientProps {
  containers: Container[];
}

export default function ReportsClient({ containers }: ReportsClientProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");

  const formatChecklistItems = (responses: SecurityCheckResponse[]) => {
    if (!responses || responses.length === 0) return "-";

    return responses
      .map((r) => {
        const status = r.checked ? "✓" : "✗";
        const notes = r.notes ? ` (${r.notes})` : "";
        return `${status} ${r.checklistItem.itemText}${notes}`;
      })
      .join("; ");
  };

  const exportToCSV = () => {
    setIsExporting(true);
    setExportProgress("Generating CSV...");
    try {
      const headers = [
        "No. Kontainer",
        "No. UTC",
        "Perusahaan",
        "No. Segel",
        "No. Plat",
        "Tanggal Pemeriksaan",
        "Security",
        "Checker",
        "Status",
        "Jumlah Foto",
        "Checklist Items",
      ];

      const rows = containers.map((c) => {
        const hasSecurity = !!c.securityCheck;
        const hasChecker = !!c.checkerData;
        const status =
          hasSecurity && hasChecker
            ? "Selesai"
            : hasSecurity
            ? "Pending Checker"
            : "Pending Security";
        const totalPhotos =
          (c.securityCheck?.photos?.length || 0) +
          (c.checkerData?.photos?.length || 0);

        const checklistItems = c.securityCheck?.responses
          ? formatChecklistItems(c.securityCheck.responses)
          : "-";

        return [
          c.containerNo,
          c.checkerData?.utcNo || "-",
          c.companyName,
          c.sealNo,
          c.plateNo,
          new Date(c.inspectionDate).toLocaleDateString("id-ID"),
          c.securityCheck?.user?.name || "-",
          c.checkerData?.user?.name || "-",
          status,
          totalPhotos.toString(),
          checklistItems,
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      saveAs(
        blob,
        `laporan-kontainer-${new Date().toISOString().split("T")[0]}.csv`
      );
      setExportProgress("");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Gagal export CSV");
      setExportProgress("");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    setExportProgress("Mempersiapkan workbook...");

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Kontainer");

      worksheet.mergeCells("A1:K1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "LAPORAN PEMERIKSAAN KONTAINER";
      titleCell.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      worksheet.getRow(1).height = 30;

      worksheet.mergeCells("A2:K2");
      const dateCell = worksheet.getCell("A2");
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
      dateCell.font = { size: 10, italic: true };
      dateCell.alignment = { horizontal: "center" };

      worksheet.addRow([]);

      const headerRow = worksheet.addRow([
        "No.",
        "No. Kontainer",
        "No. UTC",
        "Perusahaan",
        "Tanggal",
        "Security",
        "Checker",
        "Status",
        "Foto",
        "Checklist Items",
        "Keterangan",
      ]);

      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.height = 25;

      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      worksheet.getColumn(1).width = 5;
      worksheet.getColumn(2).width = 18;
      worksheet.getColumn(3).width = 18;
      worksheet.getColumn(4).width = 25;
      worksheet.getColumn(5).width = 15;
      worksheet.getColumn(6).width = 20;
      worksheet.getColumn(7).width = 20;
      worksheet.getColumn(8).width = 15;
      worksheet.getColumn(9).width = 100;
      worksheet.getColumn(10).width = 50;
      worksheet.getColumn(11).width = 30;

      setExportProgress("Mengunduh foto...");
      const allPhotoData: {
        container: number;
        photo: number;
        buffer: ArrayBuffer;
      }[] = [];

      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        const securityPhotos = container.securityCheck?.photos || [];
        const checkerPhotos = container.checkerData?.photos || [];
        const allPhotos = [...securityPhotos, ...checkerPhotos];
        const maxImages = Math.min(allPhotos.length, 5);

        if (maxImages > 0) {
          setExportProgress(
            `Mengunduh foto (${i + 1}/${containers.length})...`
          );

          const photoPromises = allPhotos
            .slice(0, maxImages)
            .map(async (photo, j) => {
              try {
                const response = await fetch(photo.url);
                const arrayBuffer = await response.arrayBuffer();
                return { container: i, photo: j, buffer: arrayBuffer };
              } catch (error) {
                console.error(
                  `Error loading image ${j} for container ${i}:`,
                  error
                );
                return null;
              }
            });

          const results = await Promise.all(photoPromises);
          allPhotoData.push(
            ...(results.filter((r) => r !== null) as typeof allPhotoData)
          );
        }
      }

      setExportProgress("Membuat spreadsheet...");

      let rowIndex = 5;

      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        const securityPhotos = container.securityCheck?.photos || [];
        const checkerPhotos = container.checkerData?.photos || [];
        const allPhotos = [...securityPhotos, ...checkerPhotos];

        const hasSecurity = !!container.securityCheck;
        const hasChecker = !!container.checkerData;
        const status =
          hasSecurity && hasChecker
            ? "Selesai"
            : hasSecurity
            ? "Pending Checker"
            : "Pending Security";

        const checklistText = container.securityCheck?.responses
          ? container.securityCheck.responses
              .map((r) => {
                const statusIcon = r.checked ? "✓" : "✗";
                const notes = r.notes ? ` (${r.notes})` : "";
                return `${statusIcon} ${r.checklistItem.itemText}${notes}`;
              })
              .join("\n")
          : "-";

        const rowHeight = allPhotos.length > 0 ? 150 : 25;

        const dataRow = worksheet.addRow([
          i + 1,
          container.containerNo,
          container.checkerData?.utcNo || "-",
          container.companyName,
          new Date(container.inspectionDate).toLocaleDateString("id-ID"),
          container.securityCheck?.user?.name || "-",
          container.checkerData?.user?.name || "-",
          status,
          "",
          checklistText,
          allPhotos.length > 0
            ? `${allPhotos.length} foto terlampir`
            : "Tidak ada foto",
        ]);

        dataRow.height = rowHeight;
        dataRow.alignment = { vertical: "middle", wrapText: true };

        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        const statusCell = worksheet.getCell(`H${rowIndex}`);
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

        const containerPhotos = allPhotoData.filter((p) => p.container === i);
        for (const photoData of containerPhotos) {
          try {
            const imageId = workbook.addImage({
              buffer: photoData.buffer as unknown as ExcelJS.Buffer,
              extension: "jpeg",
            });

            worksheet.addImage(imageId, {
              tl: {
                col: 8 + photoData.photo * 0.2,
                row: rowIndex - 1 + 0.15,
              },
              ext: { width: 90, height: 90 },
              editAs: "oneCell",
            });
          } catch (error) {
            console.error(`Error adding image:`, error);
          }
        }

        rowIndex++;
      }

      worksheet.addRow([]);

      const summaryRow = worksheet.addRow([
        "",
        "TOTAL",
        "",
        "",
        "",
        "",
        "",
        containers.length.toString(),
        "",
        "",
        "",
      ]);
      summaryRow.font = { bold: true };
      summaryRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };

      setExportProgress("Menyimpan file...");
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `laporan-kontainer-${new Date().toISOString().split("T")[0]}.xlsx`
      );

      setExportProgress("");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Gagal export Excel. Pastikan gambar dapat diakses.");
      setExportProgress("");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Export Data ({containers.length} kontainer)
        </h2>

        {exportProgress && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700">{exportProgress}</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportToCSV}
            disabled={isExporting || containers.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            Export CSV
          </button>
          <button
            onClick={exportToExcel}
            disabled={isExporting || containers.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Export Excel
          </button>
        </div>
      </div>
    </div>
  );
}
