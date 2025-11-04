import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { containers, format } = body;

    // Prepare data for export
    const exportData = containers.map(
      (container: {
        containerNo: string;
        companyName: string;
        sealNo: string;
        plateNo: string;
        inspectionDate: Date;
        checkerData?: {
          utcNo: string;
          user: { name: string };
          remarks?: string;
          createdAt: Date;
        };
        securityCheck?: {
          user: { name: string };
          inspectionDate: Date;
          remarks?: string;
        };
      }) => ({
        "No. Kontainer": container.containerNo,
        "No. UTC": container.checkerData?.utcNo || "-",
        Perusahaan: container.companyName,
        "No. Segel": container.sealNo,
        "No. Plat": container.plateNo,
        "Tanggal Pemeriksaan": new Date(
          container.inspectionDate
        ).toLocaleDateString("id-ID"),
        "Security Officer": container.securityCheck?.user.name || "-",
        "Tanggal Security Check": container.securityCheck?.inspectionDate
          ? new Date(container.securityCheck.inspectionDate).toLocaleDateString(
              "id-ID"
            )
          : "-",
        Checker: container.checkerData?.user.name || "-",
        "Tanggal Checker": container.checkerData?.createdAt
          ? new Date(container.checkerData.createdAt).toLocaleDateString(
              "id-ID"
            )
          : "-",
        "Status Security": container.securityCheck ? "Selesai" : "Pending",
        "Status Checker": container.checkerData ? "Selesai" : "Pending",
        "Status Keseluruhan":
          container.securityCheck && container.checkerData
            ? "Selesai"
            : container.securityCheck
            ? "Pending Checker"
            : "Pending Security",
        "Catatan Security": container.securityCheck?.remarks || "-",
        "Catatan Checker": container.checkerData?.remarks || "-",
      })
    );

    if (format === "excel") {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Kontainer");

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // No. Kontainer
        { wch: 15 }, // No. UTC
        { wch: 25 }, // Perusahaan
        { wch: 15 }, // No. Segel
        { wch: 15 }, // No. Plat
        { wch: 18 }, // Tanggal Pemeriksaan
        { wch: 20 }, // Security Officer
        { wch: 18 }, // Tanggal Security Check
        { wch: 20 }, // Checker
        { wch: 18 }, // Tanggal Checker
        { wch: 15 }, // Status Security
        { wch: 15 }, // Status Checker
        { wch: 18 }, // Status Keseluruhan
        { wch: 30 }, // Catatan Security
        { wch: 30 }, // Catatan Checker
      ];
      worksheet["!cols"] = columnWidths;

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="container-report-${
            new Date().toISOString().split("T")[0]
          }.xlsx"`,
        },
      });
    } else {
      // Create CSV file
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="container-report-${
            new Date().toISOString().split("T")[0]
          }.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Gagal export data" }, { status: 500 });
  }
}
