export const maintenanceStats = [
  {
    title: "Unit Aktif",
    value: "76",
    description: "Tersedia untuk tugas",
    tone: "success",
    icon: "truck",
  },
  {
    title: "Breakdowns",
    value: "12",
    description: "Menunggu penanganan",
    tone: "warning",
    icon: "list",
  },
  {
    title: "Operator Siap",
    value: "24",
    description: "Siap bekerja",
    tone: "info",
    icon: "user-gear",
  },
  {
    title: "Mechanic Tersedia",
    value: "8",
    description: "Dalam shift",
    tone: "neutral",
    icon: "screwdriver-wrench",
  },
];

export const maintenanceCategories = [
  { name: "EXCAVATOR", count: 11 },
  { name: "BULLDOZER", count: 3 },
  { name: "VIBRO", count: 2 },
  { name: "MOTOR GRADER", count: 3 },
  { name: "TRUCK", count: 3 },
];

export type MaintenanceUnitStatus = "Siap" | "Perbaikan";

export type MaintenanceUnit = {
  id?: string;
  code: string;
  category: string;
  status: MaintenanceUnitStatus;
  hm: number;
  hours: number;
  location: string;
};

export const maintenanceUnits: MaintenanceUnit[] = [
  {
    code: "PC07",
    category: "EXCAVATOR",
    status: "Siap",
    hm: 1420,
    hours: 610,
    location: "Site A",
  },
  {
    code: "DT21",
    category: "TRUCK",
    status: "Perbaikan",
    hm: 1890,
    hours: 720,
    location: "Site B",
  },
  {
    code: "MG15",
    category: "MOTOR GRADER",
    status: "Siap",
    hm: 1100,
    hours: 480,
    location: "Site C",
  },
  {
    code: "BD12",
    category: "BULLDOZER",
    status: "Perbaikan",
    hm: 1560,
    hours: 650,
    location: "Workshop",
  },
];

export const repairs = [
  {
    id: "R-1025",
    unit: "PC07",
    category: "EXCAVATOR",
    status: "Menunggu",
    location: "Site A",
    description: "Sistem hidrolik bocor",
  },
  {
    id: "R-1144",
    unit: "DT21",
    category: "TRUCK",
    status: "Proses",
    location: "Site B",
    description: "Rem tidak responsif",
  },
  {
    id: "R-1310",
    unit: "BD12",
    category: "BULLDOZER",
    status: "Selesai",
    location: "Workshop",
    description: "Mengganti filter oli",
  },
];

export const operators = [
  { id: "OPR01", name: "FAKE OPERATOR", email: "fake@dbeng.com", role: "OPERATOR", status: "Aktif", unit: "PC07", location: "Site A" },
];

export const mechanics = [
  { id: "MEC01", name: "FAKE MECHANIC", email: "fake@dbeng.com", role: "MECHANIC", status: "Aktif", unit: "PC07", location: "Site A" },
  { id: "MEC01", name: "FAKE WELDER", email: "fake@dbeng.com", role: "WELDER", status: "Aktif", unit: "PC07", location: "Site A" },
  { id: "MEC01", name: "FAKE DELIVERY", email: "fake@dbeng.com", role: "DELIVERY", status: "Aktif", unit: "PC07", location: "Site A" },
];

