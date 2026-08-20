import React, { useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";
import toast from "react-hot-toast";

interface AssignOperatorModalProps {
  isOpen: boolean;
  selectedUser: any;
  masterUnits: any[];
  masterLocations: any[];
  onClose: () => void;
  onSave: (selectedUnitObj: any) => Promise<void>;
}

export default function AssignOperatorModal({
  isOpen,
  selectedUser,
  masterUnits,
  masterLocations,
  onClose,
  onSave
}: AssignOperatorModalProps) {
  const [assignUnit, setAssignUnit] = useState("");
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [assignLocation, setAssignLocation] = useState("Site A");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && selectedUser) {
      setAssignUnit(selectedUser.unit?.name || "");
      setAssignLocation(selectedUser.location !== "-" ? selectedUser.location : "Site A");
    }
  }, [isOpen, selectedUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const selectedUnitObj = masterUnits.find(u => u.name === assignUnit);
    if (!selectedUnitObj) {
      toast.error("Silakan pilih unit yang valid dari daftar");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(selectedUnitObj);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950/80 p-6">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/95 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-300 dark:border-white/10 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Atur Penugasan</h3>
            <p className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">
              Pilih unit dan lokasi untuk <strong>{selectedUser?.name}</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 transition hover:bg-slate-200 dark:bg-slate-700"
          >
            <FaXmark />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5 text-xs relative">
            <span className="block font-semibold text-slate-900 dark:text-slate-100">
              Unit Code
            </span>
            <input
              type="text"
              value={assignUnit}
              onChange={(e) => {
                setAssignUnit(e.target.value);
                setIsUnitDropdownOpen(true);
              }}
              onFocus={() => setIsUnitDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsUnitDropdownOpen(false), 200)}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
              placeholder="Ketik untuk mencari kode unit..."
            />
            {isUnitDropdownOpen && (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 shadow-lg">
                {masterUnits
                  .filter(u => u.name?.toLowerCase().includes(assignUnit.toLowerCase()))
                  .map((u, i) => (
                    <li
                      key={i}
                      onMouseDown={() => {
                        setAssignUnit(u.name);
                        setIsUnitDropdownOpen(false);
                        if (typeof u.location === 'string') {
                            setAssignLocation(u.location);
                        } else if (u.location && u.location.name) {
                            setAssignLocation(u.location.name);
                        } else {
                            setAssignLocation("-");
                        }
                      }}
                      className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {u.name}
                    </li>
                  ))}
                {masterUnits.filter(u => u.name?.toLowerCase().includes(assignUnit.toLowerCase())).length === 0 && (
                  <li className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">Unit tidak ditemukan</li>
                )}
              </ul>
            )}
          </div>

          <label className="block space-y-1.5 text-xs opacity-70">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Location</span>
            <select
              value={assignLocation}
              disabled
              onChange={(e) => setAssignLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-200 dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none cursor-not-allowed"
            >
              <option value="">-- Pilih Lokasi --</option>
              {masterLocations.map((loc, i) => (
                <option key={i} value={loc.name || loc.id}>{loc.name || loc.id}</option>
              ))}
              <option value="-">Tanpa Lokasi</option>
            </select>
          </label>

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
              disabled={isSubmitting}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Penugasan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
