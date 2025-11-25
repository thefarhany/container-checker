import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create Users
  await prisma.user.upsert({
    where: { email: "security@company.com" },
    update: {},
    create: {
      email: "security@company.com",
      name: "Security User",
      role: "SECURITY",
      password: hashedPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: "checker@company.com" },
    update: {},
    create: {
      email: "checker@company.com",
      name: "Checker User",
      role: "CHECKER",
      password: hashedPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      name: "Admin User",
      role: "ADMIN",
      password: hashedPassword,
    },
  });

  console.log("✅ Users seeded");

  // Create Checklist Categories & Items (CONTAINER)
  const categories = [
    {
      name: "Outside/Undercarriage",
      description: "Pemeriksaan bagian luar dan bawah kontainer",
      order: 1,
      items: [
        {
          itemText: "Cek kerusakan struktural (lubang, perbaikan, penyok)",
          description: "Periksa apakah ada kerusakan pada struktur kontainer",
          order: 1,
        },
        {
          itemText: "Rangka/pilar pendukung terlihat",
          description: "Pastikan rangka utama dalam kondisi baik",
          order: 2,
        },
        {
          itemText: "Tidak ada benda asing terpasang",
          description: "Pastikan tidak ada benda mencurigakan",
          order: 3,
        },
      ],
    },
    {
      name: "Inside/Outside Doors",
      description: "Pemeriksaan pintu bagian dalam dan luar",
      order: 2,
      items: [
        {
          itemText: "Mekanisme kunci aman & berfungsi",
          description: "Cek kunci dapat dibuka dan ditutup dengan baik",
          order: 1,
        },
        {
          itemText: "Baut tidak kendur",
          description: "Periksa semua baut terpasang kuat",
          order: 2,
        },
        {
          itemText: "Engsel berfungsi baik",
          description: "Pastikan engsel tidak rusak atau aus",
          order: 3,
        },
      ],
    },
    {
      name: "Right Side",
      description: "Pemeriksaan sisi kanan kontainer",
      order: 3,
      items: [
        {
          itemText: "Tidak ada perbaikan mencurigakan pada rangka/pilar",
          description: "Periksa apakah ada tanda perbaikan tidak standar",
          order: 1,
        },
        {
          itemText: "Perbaikan di dalam terlihat dari luar dan sebaliknya",
          description: "Cross-check dari dalam dan luar",
          order: 2,
        },
      ],
    },
    {
      name: "Left Side",
      description: "Pemeriksaan sisi kiri kontainer",
      order: 4,
      items: [
        {
          itemText: "Tidak ada perbaikan mencurigakan pada rangka/pilar",
          order: 1,
        },
        {
          itemText: "Perbaikan di dalam terlihat dari luar dan sebaliknya",
          order: 2,
        },
      ],
    },
    {
      name: "Front Wall",
      description: "Pemeriksaan dinding depan",
      order: 5,
      items: [
        {
          itemText: "Material bergelombang sesuai standar",
          order: 1,
        },
        {
          itemText: "Blok kanan-kiri atas dalam kontainer berfungsi",
          order: 2,
        },
        {
          itemText: "Ventilasi terlihat",
          order: 3,
        },
      ],
    },
    {
      name: "Roof/Ceiling",
      description: "Pemeriksaan atap/langit-langit",
      order: 6,
      items: [
        {
          itemText: "Rangka pendukung terlihat",
          order: 1,
        },
        {
          itemText: "Ventilasi tidak tertutup",
          order: 2,
        },
        {
          itemText: "Tidak ada benda asing terpasang",
          order: 3,
        },
      ],
    },
    {
      name: "Floor",
      description: "Pemeriksaan lantai kontainer",
      order: 7,
      items: [
        {
          itemText: "Lantai datar, tidak bergelombang",
          order: 1,
        },
        {
          itemText: "Tidak ada tonjolan atau kerusakan ganjil",
          order: 2,
        },
      ],
    },
    {
      name: "Seal Verification",
      description: "Verifikasi segel kontainer",
      order: 8,
      items: [
        {
          itemText: "Segel sesuai dengan surat jalan",
          order: 1,
        },
        {
          itemText: "Standar PAS ISO 17712",
          order: 2,
        },
        {
          itemText: "Tidak rusak atau dirusak",
          order: 3,
        },
      ],
    },
  ];

  for (const category of categories) {
    const { items, ...categoryData } = category;
    const createdCategory = await prisma.checklistCategory.upsert({
      where: { name: category.name },
      update: {},
      create: categoryData,
    });

    for (const item of items) {
      await prisma.checklistItem.upsert({
        where: {
          categoryId_order: {
            categoryId: createdCategory.id,
            order: item.order,
          },
        },
        update: {},
        create: {
          ...item,
          categoryId: createdCategory.id,
        },
      });
    }
  }

  console.log("✅ Checklist categories and items seeded");

  // ========== CREATE VEHICLE INSPECTION CATEGORIES & ITEMS ==========
  const vehicleCategories = [
    {
      name: "Common Items",
      description: "Standar PP/No.55/2012 & OSHA 29 CFR 1910",
      order: 1,
      items: [
        {
          itemName: "Wheel tire (ban)",
          standard:
            "Not inflated, as manufacturing standard (Tidak bocor, kondisi masih aman sesuai dengan pabrikan)",
          order: 1,
        },
        {
          itemName: "Fuel cap (tutup bahan bakar)",
          standard:
            "Tight, as manufacturing standard (rapat, sesuai standar pabrikan)",
          order: 2,
        },
        {
          itemName: "Fuel tank (tangki bahan bakar)",
          standard: "Not leak (tidak bocor)",
          order: 3,
        },
        {
          itemName: "Accu cover (tutup aki)",
          standard:
            "Cover all surface with isolator material ex.rubber (menutup seluruh permukaan dengan material isolator ex.karet)",
          order: 4,
        },
        {
          itemName: "Rearview mirror (Spion)",
          standard: "Clear (Jelas)",
          order: 5,
        },
        {
          itemName: "Horn (Klakson)",
          standard: "Work (Berfungsi dengan baik)",
          order: 6,
        },
        {
          itemName: "Engine (Mesin)",
          standard:
            "Work, No leak, noise (berfungsi, tidak bocor, tidak berisik)",
          order: 7,
        },
        {
          itemName: "Brake (Rem)",
          standard: "Work (Berfungsi dengan baik)",
          order: 8,
        },
        {
          itemName: "Hand brake (Rem Tangan)",
          standard: "Work (Berfungsi dengan baik)",
          order: 9,
        },
        {
          itemName: "Head, brake, signal light (Lampu besar, rem, sein)",
          standard: "Work (Berfungsi dengan baik)",
          order: 10,
        },
        {
          itemName: "Cabin indicator (Indikator pada kabin)",
          standard: "Work (Berfungsi dengan baik)",
          order: 11,
        },
        {
          itemName: "Wiper",
          standard: "Work (Berfungsi dengan baik)",
          order: 12,
        },
        {
          itemName: "Decline alarm (Alarm Mundur)",
          standard: "Work (berfungsi dengan baik)",
          order: 13,
        },
        {
          itemName: "Emission (Emisi gas buang)",
          standard: "Lulus dari Dinas Perhubungan",
          order: 14,
        },
      ],
    },
    {
      name: "Special Requirements",
      description: "Persyaratan Khusus untuk Kendaraan Pengangkut B3",
      order: 2,
      items: [
        {
          itemName: "Hazard sign (Simbol rambu B3)",
          standard:
            "As manufacturing standard (sesuai dengan standar pabrikan)",
          order: 1,
        },
        {
          itemName: "Ladder (Tangga)",
          standard: "Accessible, not damage (Mudah diakses dan tidak rusak)",
          order: 2,
        },
        {
          itemName: "Fire extinguisher (Alat pemadam api ringan)",
          standard: "Min.rating 80BC (minimal 2 tabung dengan rating 80 BC)",
          order: 3,
        },
        {
          itemName: "Safety cone/segitiga pengaman",
          standard: "Tersedia dan minimal 2 ea.",
          order: 4,
        },
        {
          itemName: "Flame arrestor",
          standard: "Tersedia dan terpasang",
          order: 5,
        },
        {
          itemName: "Certificate from highway dept. (Surat Ijin dari Dishub)",
          standard:
            "Passed government regulation no. B-III/DEP.IV/LH/01/2012 (copy document shall be attached)",
          order: 6,
        },
        {
          itemName: "Driving license B2 (SIM B2 Umum)",
          standard: "Tersedia dan masih berlaku",
          order: 7,
        },
        {
          itemName: "Special PPE",
          standard:
            "Safety helmet min req. 2 unit; Safety glass/goggles min req. 2 unit; Face shield min req. 2 unit; Safety shoes or safety boot min req. 2 unit",
          order: 8,
        },
      ],
    },
  ];

  for (const category of vehicleCategories) {
    const { items, ...categoryData } = category;
    const createdCategory = await prisma.vehicleInspectionCategory.upsert({
      where: { name: category.name },
      update: {},
      create: categoryData,
    });

    for (const item of items) {
      await prisma.vehicleInspectionItem.upsert({
        where: {
          categoryId_order: {
            categoryId: createdCategory.id,
            order: item.order,
          },
        },
        update: {},
        create: {
          ...item,
          categoryId: createdCategory.id,
        },
      });
    }
  }

  console.log("✅ Vehicle inspection categories and items seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
