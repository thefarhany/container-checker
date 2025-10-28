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

  // Create Checklist Categories & Items
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
