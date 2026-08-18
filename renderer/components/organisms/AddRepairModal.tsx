import React, { useState, useEffect } from "react";
import { FaXmark, FaCloudArrowUp } from "react-icons/fa6";
import {
  units,
  majorComponents,
  componentList,
  subComponentList,
  actionList,
  problemList,
} from "../../common/data/repairData";
import { toast } from "react-hot-toast";

interface AddRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function AddRepairModal({
  isOpen,
  onClose,
  onSave,
}: AddRepairModalProps) {
  const [unitCode, setUnitCode] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [location, setLocation] = useState("");
  const [hm, setHm] = useState("");
  const [technician, setTechnician] = useState("");
  
  const [majorComponent, setMajorComponent] = useState("");
  const [componentCode, setComponentCode] = useState("");
  const [componentName, setComponentName] = useState("");
  const [subComponent, setSubComponent] = useState("");
  
  const [severity, setSeverity] = useState("");
  const [breakdownType, setBreakdownType] = useState("");
  const [problemType, setProblemType] = useState("");
  const [majorAction, setMajorAction] = useState("");
  const [description, setDescription] = useState("");
  
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Update read-only fields when unitCode changes
  useEffect(() => {
    const selectedUnit = units.find((u) => u.code === unitCode);
    if (selectedUnit) {
      setEquipmentType(selectedUnit.category);
      setLocation(selectedUnit.location);
    } else {
      setEquipmentType("");
      setLocation("");
    }
  }, [unitCode]);

  // Handle component selection to filter subcomponents
  const handleComponentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setComponentName(val);
    const selected = componentList.find((c) => c.name === val);
    if (selected) {
      setComponentCode(selected.code);
    } else {
      setComponentCode("");
    }
    setSubComponent(""); // Reset subcomponent
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages((prev) => [...prev, ...filesArray]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode || !technician || !majorComponent || !severity || !breakdownType || !problemType || !majorAction || !description) {
      toast.error("Mohon isi semua bagian yang wajib diisi (*).");
      return;
    }
    
    // Simulate save
    onSave({
      unitCode,
      equipmentType,
      location,
      hm,
      technician,
      majorComponent,
      componentName,
      subComponent,
      severity,
      breakdownType,
      problemType,
      majorAction,
      description,
      images: selectedImages,
    });
    
    toast.success("Perbaikan berhasil ditambahkan");
    onClose();
  };

  if (!isOpen) return null;

  const filteredSubComponents = componentCode 
    ? subComponentList.filter(s => s.code === componentCode) 
    : subComponentList;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950/80 p-6">
      <div className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/95 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-300 dark:border-white/10 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold">Tambah Perbaikan</h3>
            <p className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">Isi data perbaikan baru dan simpan.</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 transition hover:bg-slate-200 dark:bg-slate-700"
          >
            <FaXmark />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-6 p-6">
          {/* Asset Info */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">Informasi Aset</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Unit Code *</span>
                <input
                  list="unitCodeOptions"
                  type="text"
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                  placeholder="Kode unit"
                  required
                />
                <datalist id="unitCodeOptions">
                  {units.map((u) => (
                    <option key={u.code} value={u.code}>{u.code} — {u.category}</option>
                  ))}
                </datalist>
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Equipment Type</span>
                <input
                  type="text"
                  readOnly
                  value={equipmentType}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/5 bg-slate-200/50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400 outline-none cursor-not-allowed"
                />
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Hour Meter (HM)</span>
                <input
                  type="number"
                  value={hm}
                  onChange={(e) => setHm(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                />
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Location</span>
                <input
                  type="text"
                  readOnly
                  value={location}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/5 bg-slate-200/50 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400 outline-none cursor-not-allowed"
                />
              </label>
            </div>
          </div>

          {/* Repair Info */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">Detail Perbaikan</h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">IC / Technician *</span>
                <input
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                  required
                />
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Major Component *</span>
                <input
                  list="majorComponentOptions"
                  type="text"
                  value={majorComponent}
                  onChange={(e) => setMajorComponent(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                  placeholder="Pilih komponen"
                  required
                />
                <datalist id="majorComponentOptions">
                  {majorComponents.map(m => (
                    <option key={m.code} value={m.name} />
                  ))}
                </datalist>
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Component</span>
                <input
                  list="componentOptions"
                  type="text"
                  value={componentName}
                  onChange={handleComponentChange}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                  placeholder="Pilih komponen..."
                />
                <datalist id="componentOptions">
                  {componentList.map((c, i) => (
                    <option key={i} value={c.name} />
                  ))}
                </datalist>
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Sub Component</span>
                <input
                  list="subComponentOptions"
                  type="text"
                  value={subComponent}
                  onChange={(e) => setSubComponent(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                  placeholder="Pilih sub komponen..."
                />
                <datalist id="subComponentOptions">
                  {filteredSubComponents.map((s, i) => (
                    <option key={i} value={s.name} />
                  ))}
                </datalist>
              </label>
            </div>
          </div>

          {/* Classification Info */}
          <div>
            <h4 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">Klasifikasi</h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Severity *</span>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                  required
                >
                  <option value="" disabled hidden></option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Breakdown Type *</span>
                <select
                  value={breakdownType}
                  onChange={(e) => setBreakdownType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                  required
                >
                  <option value="" disabled hidden></option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Unscheduled">Unscheduled</option>
                </select>
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Problem Type *</span>
                <input
                  list="problemOptions"
                  type="text"
                  value={problemType}
                  onChange={(e) => setProblemType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                  placeholder="Pilih tipe masalah..."
                  required
                />
                <datalist id="problemOptions">
                  {problemList.map((p, i) => (
                    <option key={i} value={p} />
                  ))}
                </datalist>
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Major Action *</span>
                <input
                  list="actionOptions"
                  type="text"
                  value={majorAction}
                  onChange={(e) => setMajorAction(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                  placeholder="Pilih tindakan..."
                  required
                />
                <datalist id="actionOptions">
                  {actionList.map((a, i) => (
                    <option key={i} value={a} />
                  ))}
                </datalist>
              </label>
            </div>
          </div>

          {/* Description & Media */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs flex flex-col">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Problem Description *</span>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50 placeholder:text-slate-400 dark:text-slate-600 resize-none"
                placeholder="Jelaskan masalah secara detail..."
              ></textarea>
            </label>
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Gambar Pendukung (opsional)</span>
              <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 py-5 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                <FaCloudArrowUp className="text-2xl text-slate-400 dark:text-slate-600 dark:text-slate-400 mb-2" />
                <span className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">Klik untuk unggah gambar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {selectedImages.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {selectedImages.map((file, idx) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                      <button 
                        type="button" 
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1"
                      >
                        <FaXmark className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-300 dark:border-white/10 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700/70 bg-white dark:bg-slate-900/90 px-5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:border-amber-300/60 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Simpan Perbaikan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
