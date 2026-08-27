import React, { useState, useRef, useEffect } from "react";
import { FaTimes, FaCheckCircle, FaImage, FaTrash, FaUpload, FaCalendarAlt, FaClock, FaInfoCircle } from "react-icons/fa";
import { aplUnitService, aplHistoryService } from "@/services";
import { APLSTATUS } from "@/common/utils/status";
import toast from "react-hot-toast";

type CompleteServiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  unit: any;
  onSuccess: () => void;
};

export default function CompleteServiceModal({
  isOpen,
  onClose,
  item,
  unit,
  onSuccess
}: CompleteServiceModalProps) {
  const [newTotal, setNewTotal] = useState<number | string>(
    item?.total !== undefined ? item.total : (unit?.hours || unit?.hm || 0)
  );
  const [newVault, setNewVault] = useState<number | string>(
    item?.vault !== undefined && item?.vault !== null ? item.vault : ""
  );
  const [isVaultFocused, setIsVaultFocused] = useState(false);

  // Sync state when modal opens or item changes
  useEffect(() => {
    if (isOpen && item) {
      setNewTotal(item?.total !== undefined ? item.total : (unit?.hours || unit?.hm || 0));
      setNewVault(item?.vault !== undefined && item?.vault !== null ? item.vault : "");
    }
  }, [isOpen, item, unit]);

  // Default to current date in Indonesia (Asia/Jakarta) YYYY-MM-DD
  const [serviceDate, setServiceDate] = useState<string>(() => {
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      return formatter.format(new Date());
    } catch {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  });

  // Default to current time in Indonesia (Asia/Jakarta - WIB) HH:mm
  const [serviceTime, setServiceTime] = useState<string>(() => {
    try {
      const formatter = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      return formatter.format(new Date()).replace(".", ":");
    } catch {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      return `${hh}:${min}`;
    }
  });

  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFiles = (files: File[]) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const validFiles = files.filter(f => allowedTypes.includes(f.type) || f.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    if (validFiles.length < files.length) {
      toast.error("Hanya file format JPEG, JPG, PNG, dan WEBP yang diperbolehkan.");
    }

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    toast.success(`${validFiles.length} foto berhasil ditambahkan!`, { duration: 2000 });
  };

  // Clipboard Paste Support (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        processImageFiles(imageFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  if (!isOpen || !item || !unit) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processImageFiles(Array.from(files));
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processImageFiles(files);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTotal === "" || isNaN(Number(newTotal))) {
      toast.error("Mohon isi nilai input manual baru yang valid.");
      return;
    }

    if (images.length === 0) {
      toast.error("Wajib mengunggah minimal 1 foto bukti servis / penggantian.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update APL unit with new manual total and new vault
      const updatedAplUnit = await aplUnitService.upsertAplUnit({
        unit_id: unit.id,
        category_apl_id: item.category_apl_id,
        total: Number(newTotal),
        vault: newVault === "" ? item.vault : Number(newVault)
      });

      // 2. Record history of service completion with APLSTATUS.SERVICE
      try {
        const fullDateTime = new Date(`${serviceDate}T${serviceTime || "00:00"}:00`);
        await aplHistoryService.createHistory({
          apl_id: updatedAplUnit?.id || item.id || item.category_apl_id,
          remaining_hours: Number(item.input ?? 0),
          last_hm: Number(unit.hours ?? unit.hm ?? 0),
          last_total: Number(newTotal),
          last_time: isNaN(fullDateTime.getTime()) ? new Date() : fullDateTime,
          status: APLSTATUS.SERVICE,
          images: images.length > 0 ? images : []
        });
      } catch (historyErr) {
        console.log("Service history record:", historyErr);
      }

      toast.success(`Servis untuk ${item.name} berhasil disimpan!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to complete service:", err);
      toast.error(err?.response?.data?.message || err?.message || "Gagal menyimpan data servis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <FaCheckCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Konfirmasi Sudah Di Servis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Unit: <strong className="text-slate-800 dark:text-slate-200">{unit.unit_name || unit.code}</strong> • Komponen: <strong className="text-emerald-700 dark:text-emerald-400">{item.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Read-Only Last Recorded Values (Aligned & Symmetric Stat Cards) */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5">
            <div className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate w-full">
                Manual Terakhir
              </span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                {item.total !== undefined && item.total !== null ? `${item.total}` : "-"}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate w-full">
                HM Terakhir
              </span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                {unit.hours !== undefined && unit.hours !== null ? `${unit.hours}` : "-"}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate w-full">
                Sisa Jam Terakhir
              </span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                {item.input !== undefined && item.input !== null ? `${item.input}` : "-"}
              </span>
            </div>
          </div>

          {/* New Manual Input (Editable) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Input Manual Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              autoFocus
              value={newTotal}
              onChange={(e) => setNewTotal(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Masukkan nilai input manual baru..."
              className="w-full rounded-xl border border-sky-500 focus:border-sky-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20 transition"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Nilai jam baru saat penggantian/servis komponen dilakukan.
            </p>
          </div>

          {/* New Vault Input (Editable) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Vault
            </label>
            <input
              id="apl-service-input-vault"
              type="number"
              value={newVault}
              onChange={(e) => setNewVault(e.target.value === "" ? "" : Number(e.target.value))}
              onFocus={() => setIsVaultFocused(true)}
              onBlur={() => setTimeout(() => setIsVaultFocused(false), 200)}
              placeholder="Masukkan jumlah vault..."
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
            />
            {isVaultFocused && (
              <div className="mt-2 flex flex-wrap gap-2">
                {[150, 300, 500, 1000, 2000, 4000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setNewVault(val);
                      setIsVaultFocused(false);
                    }}
                    className="cursor-pointer rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-600 hover:bg-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:hover:bg-sky-500/30 transition-colors"
                  >
                    {val}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Interval jam penggantian/servis komponen berikutnya.
            </p>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <FaCalendarAlt size={11} className="text-sky-500" />
                <span>Tanggal Servis</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                <FaClock size={11} className="text-sky-500" />
                <span>Jam Servis (WIB)</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={serviceTime}
                onChange={(e) => setServiceTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          {/* Multi-image Evidence Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FaImage size={11} className="text-sky-500" />
                <span>Bukti Gambar / Service (Multi Foto)</span>
                <span className="text-rose-500">*</span>
              </label>
              {images.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400">
                  {images.length} foto terpilih
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />

            {/* Upload Box / Trigger / Dropzone & Paste Target */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition group ${
                isDragging
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 scale-[0.99]"
                  : "border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 bg-slate-50/50 dark:bg-slate-800/30"
              }`}
            >
              <div className="flex flex-col items-center gap-1.5 text-slate-500 dark:text-slate-400 group-hover:text-sky-500">
                <FaUpload size={18} className={isDragging ? "text-sky-500 animate-bounce" : ""} />
                <p className="text-xs font-semibold">
                  Klik untuk unggah, drop file, atau tekan <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-200">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-200">⌘V</kbd> untuk paste foto
                </p>
                <p className="text-[10px] text-slate-400">
                  Format JPG, PNG, WEBP (Bisa multi foto)
                </p>
              </div>
            </div>

            {/* Previews Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2.5 mt-3">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800"
                  >
                    <img
                      src={imgUrl}
                      alt={`Bukti ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 text-white opacity-90 hover:opacity-100 hover:bg-rose-600 transition shadow-xs cursor-pointer"
                      title="Hapus foto"
                    >
                      <FaTrash size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Info Peringatan Gambar */}
            <div className="mt-3 flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs leading-relaxed">
              <FaInfoCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Catatan:</strong> Gambar harus jelas dan menunjukan komponen yang diganti, sistem otomatis akan menolak jika tidak terdeteksi.
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end items-center gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle size={13} />
                  <span>Simpan Servis Selesai</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
