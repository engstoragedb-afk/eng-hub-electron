import { useState } from "react";
import { useRouter } from "next/router";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import { repairs } from "@/common/data/repairData";
import Link from "next/link";
import { FaArrowLeft, FaCheck } from "react-icons/fa6";
import Lightbox from "@/components/organisms/Lightbox";

export default function MaintenanceRepairDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  // Wait for router to be ready
  if (!router.isReady) return null;
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState({ src: "", title: "", desc: "" });

  const repair = repairs.find((r) => r.code === id);
  
  if (!repair) {
    return (
      <MaintenanceLayout title="Detail Perbaikan" subtitle="Not Found">
        <div className="py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Perbaikan tidak ditemukan</h2>
          <Link href="/maintenance/perbaikan" className="text-amber-500 hover:underline">
            <FaArrowLeft className="inline mr-2" /> Kembali ke Breakdown
          </Link>
        </div>
      </MaintenanceLayout>
    );
  }

  return (
    <MaintenanceLayout
      title="Detail Perbaikan"
      subtitle="Detail kerja perbaikan yang terpilih"
    >
      <div className="mb-6">
        <Link href="/maintenance/perbaikan" className="inline-flex items-center text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-amber-500 transition mb-4">
          <FaArrowLeft className="mr-2" /> Kembali ke Breakdown
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-6">
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-3xl bg-slate-50 dark:bg-slate-950/70 p-4 cursor-pointer group" onClick={() => {
              setLightboxData({
                src: `/units/${repair.image}`,
                title: "Foto Utama",
                desc: "Gambar utama kondisi unit."
              });
              setIsLightboxOpen(true);
            }}>
              <img
                src={`/units/${repair.image}`}
                alt={repair.unit}
                className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/400x400/1e293b/cbd5e1?text=No+Image";
                }}
              />
            </div>
            <div className="flex-1">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 dark:text-slate-400">
                    {repair.code}
                  </p>
                  <h3 className="mt-2 text-4xl font-extrabold">Unit {repair.unit}</h3>
                </div>
                <div className="space-y-2 text-right text-sm flex flex-col items-end gap-2">
                  <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold ${
                    repair.status === 'Selesai' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' :
                    repair.status === 'Proses' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-slate-500/20 text-slate-700 dark:text-slate-300'
                  }`}>
                    {repair.status}
                  </span>
                  <span className={`inline-flex rounded-full px-4 py-2 text-xs font-semibold ${
                    repair.priority === 'Tinggi' ? 'bg-rose-500/20 text-rose-300' :
                    repair.priority === 'Sedang' ? 'bg-orange-500/20 text-orange-300' : 'bg-slate-500/20 text-slate-700 dark:text-slate-300'
                  }`}>
                    Prioritas {repair.priority}
                  </span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white dark:bg-slate-900/70 p-5">
                  <p className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">Tanggal Lapor</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{repair.date}</p>
                </div>
                <div className="rounded-3xl bg-white dark:bg-slate-900/70 p-5">
                  <p className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">Kategori</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{repair.category}</p>
                </div>
                <div className="rounded-3xl bg-white dark:bg-slate-900/70 p-5">
                  <p className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">Lokasi</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{repair.location}</p>
                </div>
                <div className="rounded-3xl bg-white dark:bg-slate-900/70 p-5">
                  <p className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">Status</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{repair.status}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/70 p-6">
            <h4 className="text-lg font-bold">Deskripsi Masalah</h4>
            <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {repair.description}
            </p>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-3 rounded-3xl bg-white dark:bg-slate-900/80 p-3">
            {[1, 2, 3].map((num) => (
              <div 
                key={num} 
                className="h-24 overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-2 cursor-pointer group border border-slate-200 dark:border-white/5 hover:border-amber-500/50 transition-colors"
                onClick={() => {
                  setLightboxData({
                    src: `/units/${repair.image}`,
                    title: `Foto Tambahan ${num}`,
                    desc: "Detail spesifik kondisi kerusakan."
                  });
                  setIsLightboxOpen(true);
                }}
              >
                <img src={`/units/${repair.image}`} alt="Preview" className="h-full w-full object-contain group-hover:scale-110 transition-transform" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
            <h4 className="mb-3 text-lg font-bold">Informasi Tambahan</h4>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>Prioritas</span>
                <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {repair.priority}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {repair.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Kategori</span>
                <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {repair.category}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Lokasi</span>
                <span className="inline-flex items-center rounded-full bg-slate-200 dark:bg-slate-700/70 px-3 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {repair.location}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
            <h4 className="mb-3 text-lg font-bold">Detail Komponen & Klasifikasi</h4>
            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between gap-4">
                <span className="shrink-0">Major Component</span>
                <span className="text-right font-semibold text-slate-900 dark:text-slate-100 break-words">-</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 dark:border-white/5 pt-3">
                <span className="shrink-0">Component</span>
                <span className="text-right font-semibold text-slate-900 dark:text-slate-100 break-words">-</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 dark:border-white/5 pt-3">
                <span className="shrink-0">Sub Component</span>
                <span className="text-right font-semibold text-slate-900 dark:text-slate-100 break-words">-</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 dark:border-white/5 pt-3">
                <span className="shrink-0">Major Action</span>
                <span className="text-right font-semibold text-slate-900 dark:text-slate-100 break-words">-</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 dark:border-white/5 pt-3">
                <span className="shrink-0">Problem Type</span>
                <span className="text-right font-semibold text-slate-900 dark:text-slate-100 break-words">-</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/70 p-5">
            <h4 className="mb-3 text-lg font-bold">Aksi</h4>
            <button className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
              <FaCheck /> Tandai sebagai Selesai
            </button>
          </div>
        </div>
      </section>

      <Lightbox 
        isOpen={isLightboxOpen} 
        onClose={() => setIsLightboxOpen(false)} 
        imageSrc={lightboxData.src}
        title={lightboxData.title}
        description={lightboxData.desc}
      />
    </MaintenanceLayout>
  );
}
