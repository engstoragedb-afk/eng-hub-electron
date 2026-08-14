import { useState } from "react";
import { useRouter } from "next/router";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import { repairs } from "@/common/data/repairData";
import Link from "next/link";
import { FaArrowLeft, FaCheck, FaRegCalendarAlt, FaMapMarkerAlt, FaTags, FaExclamationCircle } from "react-icons/fa";
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

      <div className="bg-white dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden mb-10">
        
        {/* Unified Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              <span className="text-slate-400 font-medium mr-2">WO-{repair.code}</span>
              {repair.unit}
            </h3>
            <div className="flex gap-2">
              <span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                repair.status === 'Selesai' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                repair.status === 'Proses' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
              }`}>
                {repair.status}
              </span>
              <span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                repair.priority === 'Tinggi' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                repair.priority === 'Sedang' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
              }`}>
                {repair.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body: Split into two columns inside the card */}
        <div className="flex flex-col xl:flex-row">
          
          {/* Left Side: Visuals & Description */}
          <div className="flex-[1.5] p-8 xl:border-r border-slate-100 dark:border-white/5">
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              {/* Main Image */}
              <div 
                className="shrink-0 h-48 w-48 rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden cursor-pointer group border border-slate-100 dark:border-white/5"
                onClick={() => {
                  setLightboxData({
                    src: `/units/${repair.image}`,
                    title: "Foto Utama",
                    desc: "Gambar utama kondisi unit."
                  });
                  setIsLightboxOpen(true);
                }}
              >
                <img
                  src={`/units/${repair.image}`}
                  alt={repair.unit}
                  className="h-full w-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/400x400/1e293b/cbd5e1?text=No+Image";
                  }}
                />
              </div>
              
              {/* Description directly inline */}
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <FaExclamationCircle className="text-amber-500" /> Laporan Kerusakan
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                  {repair.description}
                </p>
              </div>
            </div>

            {/* Gallery */}
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Lampiran Foto Tambahan (3)</h4>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3].map((num) => (
                <div 
                  key={num} 
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950 p-2 cursor-pointer group border border-slate-100 dark:border-white/5 hover:border-amber-400 transition-colors"
                  onClick={() => {
                    setLightboxData({
                      src: `/units/${repair.image}`,
                      title: `Foto Tambahan ${num}`,
                      desc: "Detail spesifik kondisi kerusakan."
                    });
                    setIsLightboxOpen(true);
                  }}
                >
                  <img src={`/units/${repair.image}`} alt="Preview" className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Data & Action */}
          <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/30">
            <div className="p-8 flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6 border-b border-slate-200 dark:border-white/10 pb-4">Data Operasional</h4>
              
              {/* Unified Data Table */}
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                  <span className="text-slate-500 flex items-center gap-2"><FaRegCalendarAlt className="text-slate-400" /> Tanggal Lapor</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{repair.date}</span>
                </div>
                <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                  <span className="text-slate-500 flex items-center gap-2"><FaMapMarkerAlt className="text-slate-400" /> Lokasi</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{repair.location}</span>
                </div>
                <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                  <span className="text-slate-500 flex items-center gap-2"><FaTags className="text-slate-400" /> Kategori Unit</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{repair.category}</span>
                </div>
                
                <div className="my-6 border-t border-slate-200 dark:border-white/10 pt-6">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6">Klasifikasi Komponen</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                      <span className="text-slate-500">Major Component</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">-</span>
                    </div>
                    <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                      <span className="text-slate-500">Component</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">-</span>
                    </div>
                    <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                      <span className="text-slate-500">Sub Component</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">-</span>
                    </div>
                    <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                      <span className="text-slate-500">Problem Type</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">-</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bottom */}
            <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 mt-auto rounded-br-[2rem]">
              <button className="w-full flex items-center justify-center gap-3 rounded-xl bg-amber-500 px-4 py-4 text-sm font-bold text-slate-950 transition-all hover:bg-amber-400 active:scale-[0.98] shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.23)]">
                <FaCheck size={16} /> Tandai Selesai
              </button>
            </div>
          </div>

        </div>
      </div>

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
