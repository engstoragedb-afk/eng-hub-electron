import React, { useState, useRef, useEffect } from "react";
import { FaTimes, FaSave, FaImage, FaTrash, FaUpload, FaCalendarAlt, FaClock, FaInfoCircle, FaWrench } from "react-icons/fa";
import { aplHistoryService } from "@/services";
import { APLSTATUS } from "@/common/utils/status";
import toast from "react-hot-toast";

type EditServiceHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  history: any;
  componentName: string;
  onSuccess: () => void;
};

export default function EditServiceHistoryModal({
  isOpen,
  onClose,
  history,
  componentName,
  onSuccess
}: EditServiceHistoryModalProps) {
  const [status, setStatus] = useState<string>(APLSTATUS.SERVICE);
  const [serviceDate, setServiceDate] = useState<string>("");
  const [serviceTime, setServiceTime] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form state when history item changes or modal opens
  useEffect(() => {
    if (!isOpen || !history) return;

    setStatus(history.status || APLSTATUS.SERVICE);

    const rawDate = history.last_time || history.created_at;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const formatterDate = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
          });
          setServiceDate(formatterDate.format(d));

          const formatterTime = new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          });
          setServiceTime(formatterTime.format(d).replace(".", ":"));
        }
      } catch (e) {
        console.error("Error formatting date:", e);
      }
    }

    if (Array.isArray(history.images)) {
      const validImages = history.images.filter(
        (img: any) =>
          typeof img === "string" &&
          img.trim() !== "" &&
          img !== "null" &&
          img !== "undefined" &&
          !img.includes("undefined") &&
          !img.includes("null")
      );
      setImages(validImages);
    } else {
      setImages([]);
    }
  }, [isOpen, history]);

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

  if (!isOpen || !history) return null;

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
    if (!serviceDate) {
      toast.error("Mohon pilih tanggal servis yang valid.");
      return;
    }

    if (images.length === 0) {
      toast.error("Wajib mengunggah minimal 1 foto bukti servis.");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullDateTime = new Date(`${serviceDate}T${serviceTime || "00:00"}:00`);

      await aplHistoryService.updateHistory(history.id, {
        last_time: isNaN(fullDateTime.getTime()) ? new Date() : fullDateTime,
        images: images,
        status: status
      });

      toast.success(`Riwayat servis ${componentName} berhasil diperbarui!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to update service history:", err);
      toast.error(err?.response?.data?.message || err?.message || "Gagal memperbarui riwayat servis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <FaWrench size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Riwayat Servis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {componentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Read-Only Values for Context */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/5">
            <div className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate w-full">
                Manual Baru
              </span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                {history.last_total ?? history.input_total ?? "-"}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate w-full">
                HM Servis
              </span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                {history.last_hm ?? "-"}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate w-full">
                Sisa Jam
              </span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                {history.remaining_hours ?? "-"}
              </span>
            </div>
          </div>

          {/* Status Selection (SERVICE vs UPDATE) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Status Riwayat <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus(APLSTATUS.SERVICE)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                  status === APLSTATUS.SERVICE
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                }`}
              >
                <span>SERVICE</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus(APLSTATUS.UPDATE)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
                  status === APLSTATUS.UPDATE
                    ? "bg-sky-500 text-white border-sky-600 shadow-sm shadow-sky-500/20"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                }`}
              >
                <span>UPDATE</span>
              </button>
            </div>
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
                  Klik untuk pilih file, drag & drop, atau <span className="font-bold text-sky-600 dark:text-sky-400">Paste (Ctrl+V / ⌘V)</span>
                </p>
                <p className="text-[10px] text-slate-400">JPEG, JPG, PNG, WEBP</p>
              </div>
            </div>

            {/* Note Peringatan */}
            <div className="mt-2.5 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
              <FaInfoCircle size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-[11px] leading-relaxed">
                <strong>Catatan:</strong> Gambar harus jelas dan menunjukan komponen yang diganti, sistem otomatis akan menolak jika tidak terdeteksi.
              </p>
            </div>

            {/* Thumbnail Preview Grid */}
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group shadow-2xs"
                  >
                    <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md transition opacity-90 hover:opacity-100 cursor-pointer"
                      title="Hapus gambar"
                    >
                      <FaTrash size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <FaSave size={13} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
