import React, { useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";

interface UpdateOperatorProfileModalProps {
  isOpen: boolean;
  initialData: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function UpdateOperatorProfileModal({
  isOpen,
  initialData,
  onClose,
  onSave
}: UpdateOperatorProfileModalProps) {
  const [updateProfileData, setUpdateProfileData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setUpdateProfileData(initialData);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await onSave(updateProfileData);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-6 dark:bg-slate-900/80 transition-all duration-300 ease-in-out">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Update Profile</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Edit informasi profile operator</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 transition hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <FaXmark />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
            <input
              type="text"
              required
              value={updateProfileData.name}
              onChange={e => setUpdateProfileData({ ...updateProfileData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 dark:focus:border-sky-500 transition-colors"
              placeholder="Masukkan nama lengkap"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={updateProfileData.email}
              onChange={e => setUpdateProfileData({ ...updateProfileData, email: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 dark:focus:border-sky-500 transition-colors"
              placeholder="email@contoh.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">No. Telepon (Opsional)</label>
            <input
              type="text"
              value={updateProfileData.phone}
              onChange={e => setUpdateProfileData({ ...updateProfileData, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 dark:focus:border-sky-500 transition-colors"
              placeholder="0812xxxx..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Update Password (Opsional)</label>
            <input
              type="password"
              value={updateProfileData.password}
              onChange={e => setUpdateProfileData({ ...updateProfileData, password: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 dark:focus:border-sky-500 transition-colors"
              placeholder="Kosongkan jika tidak ingin mengubah password"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full rounded-xl bg-sky-500 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:bg-sky-600 hover:shadow-sky-500/40 active:scale-95 disabled:opacity-50"
            >
              {isUpdatingProfile ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
