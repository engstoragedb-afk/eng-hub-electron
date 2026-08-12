import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { FaArrowLeft, FaExpandAlt, FaTimes, FaSearchPlus, FaCrop, FaImage } from "react-icons/fa";
import toast from "react-hot-toast";

import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import Badge from "@/components/atoms/Badge";
import SectionHeading from "@/components/atoms/SectionHeading";
import EditableText from "@/components/atoms/EditableText";
import CopyButton from "@/components/atoms/CopyButton";
import Lightbox from "@/components/organisms/Lightbox";
import ImageCropModal from "@/components/organisms/ImageCropModal";
import dynamic from 'next/dynamic';
import { unitService, aplUnitService, typeUnitService } from "@/services";

const DetailUnitChart = dynamic(() => import("@/components/organisms/DetailUnitChart"), { 
  ssr: false, 
  loading: () => <div className="w-full h-full min-h-[200px] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">Memuat Grafik...</div> 
});

const categoryImages: Record<string, string> = {
  EXCAVATOR: "/units/exavator.png",
  BULLDOZER: "/units/bulldozer.png",
  VIBRO: "/units/vibro.png",
  "MOTOR GRADER": "/units/motor-grader.png",
  TRUCK: "/units/truck.png",
};

export default function UnitDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [apiUnit, setApiUnit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAplItem, setEditingAplItem] = useState<{category_apl_id: string, name: string, total: number, vault?: number, input: number, schedule: number} | null>(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isSavingApl, setIsSavingApl] = useState(false);
  const [typeUnits, setTypeUnits] = useState<any[]>([]);
  const [isEditingType, setIsEditingType] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isChartModalOpen) {
      timer = setTimeout(() => setIsChartVisible(true), 150);
    } else {
      setIsChartVisible(false);
    }
    return () => clearTimeout(timer);
  }, [isChartModalOpen]);

  useEffect(() => {
    typeUnitService.getTypeUnits()
      .then(res => setTypeUnits(res || []))
      .catch(console.error);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateUnit = async (data: any) => {
    try {
      if (data.image !== undefined) setIsUploadingImage(true);
      const updatedUnit = await unitService.updateUnit(id as string, data);
      setApiUnit(updatedUnit);
    } catch (err) {
      console.error("Failed to update unit:", err);
      alert("Gagal menyimpan perubahan unit.");
    } finally {
      if (data.image !== undefined) setIsUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Hanya file dengan ekstensi JPEG, JPG, dan PNG yang diperbolehkan.");
        e.target.value = ""; 
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleUpdateUnit({ image: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    unitService.getUnitDetails(id as string)
      .then((data) => {
        if (data) {
          setApiUnit(data);
        }
      })
      .catch((err) => console.error("Failed to fetch unit detail:", err))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (editingAplItem || isChartModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [editingAplItem, isChartModalOpen]);

  const unit = apiUnit;

  if (isLoading) {
    return (
      <MaintenanceLayout title="Detail Unit" subtitle="Memuat informasi unit...">
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Mengambil data unit...</p>
          </div>
        </div>
      </MaintenanceLayout>
    );
  }

  if (!unit) {
    return (
      <MaintenanceLayout title="Detail Unit" subtitle="Unit tidak ditemukan">
        <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/70 p-8 text-center text-slate-700 dark:text-slate-300">
          Unit tidak ditemukan. Kembali ke daftar unit untuk memilih data yang
          tersedia.
        </div>
      </MaintenanceLayout>
    );
  }

  const sortedAplData = unit.aplData || [];

  const chartData = {
    labels: sortedAplData.map((item: any) => (!item.total || item.total === 0) ? `${item.name} *` : item.name),
    datasets: [
      {
        label: 'Jam',
        data: sortedAplData.map((item: any) => item.input || 0),
        backgroundColor: sortedAplData.map((item: any) => {
          const val = item.input || 0;
          if (val <= -100) return '#e90c0cff'; 
          if (val < 0) return '#e7791aff'; 
          if (val < 100) return '#fbbf24'; 
          return '#34d399'; 
        }),
        borderRadius: 8,
        barThickness: 16,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setEditingAplItem(sortedAplData[index]);
        setIsChartModalOpen(false);
      }
    },
    layout: {
      padding: {
        left: 20,
        right: 30
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.x} Jam`,
        },
      },
      datalabels: {
        display: false,
      },
    },
    interaction: {
      mode: 'y' as const,
      intersect: false,
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          stepSize: 50,
          color: '#94a3b8',
          font: { size: 10 },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: 'bold' as const },
        },
      },
      y2: {
        position: 'right' as const,
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: 'bold' as const },
          callback: function(value: any, index: number) {
            const dataValue = sortedAplData[index].input || 0;
            return `${dataValue}`;
          }
        }
      },
    },
  };

  return (
    <React.Fragment>
      <MaintenanceLayout title="Detail Unit" subtitle={`Informasi unit ${unit.code}`}>
        <div className="mb-6">
          <button onClick={() => router.back()} className="inline-flex items-center text-sm text-slate-400 dark:text-slate-400 hover:text-amber-500 transition mb-4 cursor-pointer">
            <FaArrowLeft className="mr-2" /> Kembali ke menu sebelumnya
          </button>
        </div>
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-6">
            <div className="flex items-start gap-5">
              <div className="relative group overflow-hidden rounded-2xl h-52 w-64 bg-slate-50 dark:bg-slate-950/70 p-3">
                <div className="flex h-full w-full items-center justify-center">
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Memproses...</span>
                    </div>
                  ) : (
                    <img
                      src={unit.imageUrl || categoryImages[unit.category?.name]}
                      alt={unit.category?.name}
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
                
                {!isUploadingImage && (
                  <div className="absolute inset-0 hidden flex-col items-center justify-center gap-2 bg-slate-900/80 transition-opacity duration-200 group-hover:flex backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="flex w-32 items-center justify-start pl-4 gap-3 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      <FaSearchPlus /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(true)}
                      className="flex w-32 items-center justify-start pl-4 gap-3 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      <FaCrop /> Crop
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-32 items-center justify-start pl-4 gap-3 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 shadow-lg shadow-sky-500/20"
                    >
                      <FaImage /> Ganti
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 dark:text-slate-400">
                      {unit.category?.name}
                    </p>
                    <h2 className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-slate-100">
                      <EditableText value={unit.code} onSave={(val) => handleUpdateUnit({ name: val })} />
                    </h2>
                  </div>
                  <div 
                    onDoubleClick={() => setIsEditingStatus(true)} 
                    className="cursor-pointer" 
                    title="Klik 2 kali untuk mengedit status"
                  >
                    {isEditingStatus ? (
                      <select
                        value={unit.status}
                        onChange={(e) => {
                          setIsEditingStatus(false);
                          if (e.target.value !== unit.status) {
                            handleUpdateUnit({ status: e.target.value === "Siap" ? "READY" : "BREAKDOWN" });
                          }
                        }}
                        onBlur={() => setIsEditingStatus(false)}
                        className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-sky-500 px-3 py-1 outline-none text-sm font-semibold"
                        autoFocus
                      >
                        <option value="Siap">Siap</option>
                        <option value="Breakdown">Breakdown</option>
                      </select>
                    ) : (
                      <Badge tone={unit.status === "Siap" ? "success" : "warning"}>
                        {unit.status}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white dark:bg-slate-900/70 p-4">
                    <p className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">HM SAAT INI</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                      <EditableText value={unit.hm} type="number" onSave={(val) => handleUpdateUnit({ hm: Number(val) })} />
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white dark:bg-slate-900/70 p-4">
                    <p className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">Hours</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                      <EditableText value={unit.hours} type="number" onSave={(val) => handleUpdateUnit({ hours: Number(val) })} />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/80 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <SectionHeading
                    title="JADWAL PEMELIHARAAN"
                    description="Jadwal penggantian indikator berdasarkan batas HM/Jam."
                  />
                </div>
                <button
                  onClick={() => setIsChartModalOpen(true)}
                  className="p-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition flex items-center justify-center text-slate-600 dark:text-slate-300"
                  title="Perbesar Grafik"
                >
                  <FaExpandAlt />
                </button>
              </div>
              <div className="mt-4">
                <div className="w-full relative" style={{ height: `${sortedAplData.length * 45 + 60}px` }}>
                  <DetailUnitChart chartData={chartData} chartOptions={chartOptions} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-white/10">
                <div>
                  <h3 className="mb-1 text-lg font-bold">Ringkasan Unit</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">
                    Informasi utama unit.
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 pt-4">
                <div className="flex items-center justify-between">
                  <span>Type Unit</span>
                  <span
                    className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                    onDoubleClick={() => setIsEditingType(true)}
                    title="Klik 2 kali untuk mengedit type unit"
                  >
                    {isEditingType ? (
                      <select
                        value={unit.type?.id || ""}
                        onChange={(e) => {
                          setIsEditingType(false);
                          if (e.target.value !== (unit.type?.id || "")) {
                            handleUpdateUnit({ type_id: e.target.value });
                          }
                        }}
                        onBlur={() => setIsEditingType(false)}
                        className="rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-sky-500 px-2 py-1 outline-none text-sm max-w-[160px]"
                        autoFocus
                      >
                        <option value="" disabled>Pilih Type</option>
                        {typeUnits.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    ) : (
                      unit.type?.name || "-"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lokasi</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {unit.location?.name ?? '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Operator</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {unit.operator?.full_name ?? unit.operator?.name ?? '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mechanic</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {unit.mechanic?.full_name ?? unit.mechanic?.name ?? (typeof unit.mechanic === 'string' ? unit.mechanic : '-')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status Service</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {unit.service}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-white/10">
                <div>
                  <h3 className="mb-1 text-lg font-bold">Spesifikasi & GPS</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">
                    Informasi tambahan unit.
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 pt-4">
                <div className="flex items-center justify-between">
                  <span>Manufacture Year</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    <EditableText value={unit.manufactureYear} type="number" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Serial Number</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    <EditableText value={unit.serialNumber} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GPS Vendor</span>
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      <EditableText value={unit.gpsVendor || "-"} onSave={(val) => handleUpdateUnit({ gps_vendor: val })} />
                    </span>
                    <CopyButton text={unit.gpsVendor} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>GPS Device ID</span>
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      <EditableText value={unit.gpsDeviceId || "-"} onSave={(val) => handleUpdateUnit({ gps_device_id: val })} />
                    </span>
                    <CopyButton text={unit.gpsDeviceId} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>GPS Portal</span>
                  <div className="flex items-center gap-2 max-w-[60%]">
                    <span className="font-semibold text-sky-400 break-all text-right">
                      <EditableText value={unit.gpsPortal || "NOT LINKED"} onSave={(val) => handleUpdateUnit({ gps_portal: val })} />
                    </span>
                    {unit.gpsPortal && (
                      <a
                        href={unit.gpsPortal}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-sky-400 p-1"
                        title="Buka link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-sky-500/10 p-5">
              <h3 className="mb-2 text-lg font-bold text-sky-100">Catatan</h3>
              <p className="text-sm text-slate-800 dark:text-slate-200">
                Unit terpilih dapat digunakan untuk melihat performa asset,
                jadwal maintenance, serta status operasional yang sedang
                berjalan.
              </p>
            </div>
          </div>
        </section>
      </MaintenanceLayout>

      {/* Modal Edit APL Input */}
      {editingAplItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-50 dark:bg-slate-900 p-6 shadow-xl border border-slate-300 dark:border-white/10">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingAplItem.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400">
                  Sisa Hitungan Sistem (Tampil)
                </label>
                <input
                  type="number"
                  readOnly
                  className="w-full rounded-xl border border-slate-300 bg-slate-200 p-3 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 opacity-70 cursor-not-allowed"
                  value={editingAplItem.input}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm text-slate-500 dark:text-slate-400">
                    Input Manual
                  </label>
                  {editingAplItem.total === undefined && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-md">
                      ⚠️ Perlu Diisi
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={editingAplItem.total !== undefined ? editingAplItem.total : ""}
                  onChange={(e) => setEditingAplItem({ ...editingAplItem, total: e.target.value === "" ? undefined as any : Number(e.target.value) })}
                  className={`w-full rounded-xl border ${editingAplItem.total === undefined ? "border-amber-400 dark:border-amber-500/50 focus:border-amber-500 focus:ring-amber-500" : "border-slate-300 dark:border-white/10 focus:border-sky-500 focus:ring-sky-500"} bg-white p-3 text-slate-900 focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-slate-100 transition`}
                  placeholder="Masukkan angka sebenarnya..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400">
                  Vault*
                </label>
                <input
                  type="number"
                  value={editingAplItem.vault !== undefined ? editingAplItem.vault : ""}
                  onChange={(e) => setEditingAplItem({ ...editingAplItem, vault: e.target.value === "" ? undefined : Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white p-3 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:bg-slate-800 dark:text-slate-100 transition"
                  placeholder="Masukkan jumlah vault..."
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditingAplItem(null)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    try {
                      setIsSavingApl(true);
                      if (editingAplItem && editingAplItem.category_apl_id && editingAplItem.total !== undefined) {
                        await aplUnitService.upsertAplUnit({
                          unit_id: id as string,
                          category_apl_id: editingAplItem.category_apl_id,
                          total: editingAplItem.total,
                          vault: editingAplItem.vault
                        });
                        
                        // Re-fetch unit to update UI
                        const updated = await unitService.getUnitDetails(id as string);
                        setApiUnit(updated);
                      }
                      setEditingAplItem(null);
                    } catch (err) {
                      console.error("Failed to save APL unit data:", err);
                      alert("Gagal menyimpan data APL.");
                    } finally {
                      setIsSavingApl(false);
                    }
                  }}
                  disabled={isSavingApl}
                  className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition shadow-lg cursor-pointer ${isSavingApl ? 'bg-sky-400 cursor-not-allowed shadow-none' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/30'}`}
                >
                  {isSavingApl ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Menyimpan...
                    </div>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isChartModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-3xl p-6 w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Jadwal Pemeliharaan</h3>
                <p className="text-sm text-slate-500 mt-1">Tampilan penuh grafik indikator unit {unit.code}</p>
              </div>
              <button 
                onClick={() => setIsChartModalOpen(false)}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/50 dark:hover:text-rose-400 text-slate-500 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="flex-1 w-full overflow-y-auto pr-2">
               {isChartVisible ? (
                 <div style={{ height: `${Math.max(600, sortedAplData.length * 50 + 60)}px`, minHeight: '100%' }}>
                    <DetailUnitChart chartData={chartData} chartOptions={{ ...chartOptions, maintainAspectRatio: false }} />
                 </div>
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-400">
                   <div className="flex flex-col items-center gap-4">
                     <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
                     <p className="text-sm font-medium">Mempersiapkan Grafik...</p>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={unit?.imageUrl || (unit?.category?.name ? categoryImages[unit.category.name] : "")}
        title={unit?.code || "Preview Gambar"}
        description={`Gambar detail untuk unit ${unit?.code || ""}`}
      />

      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={unit?.imageUrl || (unit?.category?.name ? categoryImages[unit.category.name] : "")}
        title={`Crop Gambar ${unit?.code || ""}`}
        onSave={(previewUrl, blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            handleUpdateUnit({ image: base64String });
            toast.success("Gambar hasil crop berhasil disimpan");
          };
          reader.readAsDataURL(blob);
        }}
      />
    </React.Fragment>
  );
}
