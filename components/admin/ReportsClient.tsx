"use client";

import { useState } from "react";
import { FileSpreadsheet, FileDown, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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

  const exportToCSV = () => {
    setIsExporting(true);

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
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Gagal export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Kontainer");

      // Add title
      worksheet.mergeCells("A1:J1");
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

      // Add date generated
      worksheet.mergeCells("A2:J2");
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

      // Headers
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

      // Set border for headers
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Column widths
      worksheet.getColumn(1).width = 5;
      worksheet.getColumn(2).width = 18;
      worksheet.getColumn(3).width = 18;
      worksheet.getColumn(4).width = 25;
      worksheet.getColumn(5).width = 15;
      worksheet.getColumn(6).width = 20;
      worksheet.getColumn(7).width = 20;
      worksheet.getColumn(8).width = 15;
      worksheet.getColumn(9).width = 100;
      worksheet.getColumn(10).width = 30;

      // Add data with images
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
          allPhotos.length > 0
            ? `${allPhotos.length} foto terlampir`
            : "Tidak ada foto",
        ]);

        dataRow.height = rowHeight;
        dataRow.alignment = { vertical: "middle", wrapText: true };

        // Add borders
        dataRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Add status color
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

        // Add images inline (up to 5 images per row)
        if (allPhotos.length > 0) {
          const maxImages = Math.min(allPhotos.length, 5);
          const imageWidth = 90;
          const imageHeight = 90;

          for (let j = 0; j < maxImages; j++) {
            const photo = allPhotos[j];

            try {
              // Fetch image and convert to ArrayBuffer
              const response = await fetch(photo.url);
              const blob = await response.blob();
              const arrayBuffer = await blob.arrayBuffer();

              const uint8Array = new Uint8Array(arrayBuffer);

              const imageId = workbook.addImage({
                buffer: uint8Array,
                extension: "jpeg",
              });

              // Position images horizontally in column I (index 8)
              worksheet.addImage(imageId, {
                tl: { col: 8 + j * 0.2, row: rowIndex - 1 + 0.15 },
                ext: { width: imageWidth, height: imageHeight },
                editAs: "oneCell",
              });
            } catch (error) {
              console.error(`Error loading image ${j}:`, error);
            }
          }
        }

        rowIndex++;
      }

      // Add summary at the bottom
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
      ]);
      summaryRow.font = { bold: true };
      summaryRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `laporan-kontainer-${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Gagal export Excel. Pastikan gambar dapat diakses.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      <p className="text-sm font-medium text-gray-700 mb-4">
        Export Data ({containers.length} kontainer)
      </p>
      <div className="flex gap-3">
        <button
          onClick={exportToExcel}
          disabled={isExporting || containers.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-5 h-5" />
              Export Excel
            </>
          )}
        </button>
        <button
          onClick={exportToCSV}
          disabled={isExporting || containers.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown className="w-5 h-5" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
