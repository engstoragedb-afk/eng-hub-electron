export const dashboardStats = [
  {
    title: "Unit Aktif",
    value: "91",
    description: "+8 dari minggu lalu",
    tone: "info",
    icon: "truck",
  },
  {
    title: "Persentase Siap",
    value: "86%",
    description: "Penempatan sehat",
    tone: "success",
    icon: "check-circle",
  },
  {
    title: "Perbaikan Tertunda",
    value: "14",
    description: "3 prioritas tinggi",
    tone: "warning",
    icon: "screwdriver-wrench",
  },
  {
    title: "WO Terbuka",
    value: "27",
    description: "5 menunggu persetujuan",
    tone: "neutral",
    icon: "clipboard-list",
  },
];

export const activityLogs = [
  {
    title: "User login",
    description: "Admin berhasil login ke sistem.",
    timestamp: "04 Agustus 2026, 09:15",
  },
  {
    title: "Unit updated",
    description: "Data unit PC07 diperbarui oleh Jono.",
    timestamp: "04 Agustus 2026, 08:42",
  },
  {
    title: "Permission changed",
    description: "Peran user Budi diubah menjadi Supervisor.",
    timestamp: "04 Agustus 2026, 08:18",
  },
];

export const auditLogs = [
  {
    title: "Verifikasi data",
    description: "Audit data unit di lokasi HKI EXIT.",
    timestamp: "04 Agustus 2026, 07:52",
  },
  {
    title: "Approval WO",
    description: "Work order WO-2411 disetujui oleh senior.",
    timestamp: "04 Agustus 2026, 07:30",
  },
  {
    title: "Backup sistem",
    description: "Backup database otomatis berhasil.",
    timestamp: "04 Agustus 2026, 06:10",
  },
];

export const categories = [
  { name: "EXCAVATOR", count: 11 },
  { name: "BULLDOZER", count: 3 },
  { name: "VIBRO", count: 2 },
  { name: "MOTOR GRADER", count: 3 },
  { name: "TRUCK", count: 3 },
];

export const units = [
  {
    code: "PC01",
    category: "EXCAVATOR",
    status: "Siap",
    hm: 1200,
    hours: 540,
    location: "Site A",
  },
  {
    code: "PC02",
    category: "EXCAVATOR",
    status: "Siap",
    hm: 1180,
    hours: 510,
    location: "Site A",
  },
  {
    code: "PC03",
    category: "EXCAVATOR",
    status: "Perbaikan",
    hm: 950,
    hours: 430,
    location: "Workshop",
  },
  {
    code: "PC04",
    category: "EXCAVATOR",
    status: "Siap",
    hm: 1410,
    hours: 640,
    location: "Site B",
  },
  {
    code: "PC05",
    category: "EXCAVATOR",
    status: "Siap",
    hm: 1305,
    hours: 560,
    location: "Site C",
  },
  {
    code: "BD01",
    category: "BULLDOZER",
    status: "Siap",
    hm: 1510,
    hours: 690,
    location: "Site A",
  },
  {
    code: "BD03",
    category: "BULLDOZER",
    status: "Siap",
    hm: 1380,
    hours: 580,
    location: "Site C",
  },
  {
    code: "VB01",
    category: "VIBRO",
    status: "Siap",
    hm: 880,
    hours: 390,
    location: "Site B",
  },
  {
    code: "MG02",
    category: "MOTOR GRADER",
    status: "Siap",
    hm: 1250,
    hours: 560,
    location: "Site B",
  },
  {
    code: "TR03",
    category: "TRUCK",
    status: "Perbaikan",
    hm: 1350,
    hours: 610,
    location: "Workshop",
  },
];

export const personel = [
  {
    id: "1",
    name: "Andi Saputra",
    role: "Maintenance",
    status: "Aktif",
    phone: "081234567890",
    email: "andi.saputra@dbeng.com",
  },
  {
    id: "2",
    name: "Rina Pratiwi",
    role: "Operator",
    status: "Aktif",
    phone: "082134567891",
    email: "rina.pratiwi@dbeng.com",
  },
  {
    id: "3",
    name: "Muhammad Fajar",
    role: "Mechanic",
    status: "Nonaktif",
    phone: "083145678912",
    email: "fajar@dbeng.com",
  },
];

export const unitDetails = [
  {
    code: "PC01",
    category: "EXCAVATOR",
    imageUrl: "/images/logo.png",
    status: "Siap",
    hm: 1200,
    hours: 540,
    location: "Site A",
    operator: "Rian",
    mechanic: "Fajar",
    service: "Normal",
    manufactureYear: 2023,
    serialNumber: "J31972",
    gpsVendor: "FOXLOGGER",
    gpsDeviceId: "0356153592926213",
    gpsPortal: "https://tracker.foxlogger.com/",
    aplData: [
      { name: "Oli Mesin", input: 1267, schedule: 1500 },
      { name: "Filter Solar", input: 240, schedule: 250 },
      { name: "Oli Hydraulic", input: 1980, schedule: 2000 },
      { name: "Filter Hydraulic", input: 510, schedule: 500 },
      { name: "Oli Final Drive", input: 1100, schedule: 2000 },
      { name: "Oli Motor Swing", input: 900, schedule: 1000 },
      { name: "Filter Udara", input: 200, schedule: 500 },
      { name: "Oli Dumper", input: 0, schedule: 2000 },
      { name: "Flushing Radiator", input: 2100, schedule: 2000 },
      { name: "Flushing Fuel Tank", input: 1500, schedule: 4000 },
    ],
  },
];
