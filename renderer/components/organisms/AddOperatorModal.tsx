import React, { useState, useEffect } from "react";
import { FaXmark } from "react-icons/fa6";

interface AddOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (operatorData: any) => Promise<void>;
}

export default function AddOperatorModal({
  isOpen,
  onClose,
  onSave
}: AddOperatorModalProps) {
  const [newOperator, setNewOperator] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  useEffect(() => {
    if (isOpen) {
      setNewOperator({
        name: "",
        email: "",
        phone: "",
        image: "",
        password: generatePassword()
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(newOperator);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 dark:text-slate-500 transition hover:text-slate-600 dark:hover:text-slate-300"
        >
          <FaXmark size={24} />
        </button>
        <h3 className="mb-6 text-xl font-bold text-slate-900 dark:text-slate-100">Tambah Operator Baru</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Nama Lengkap</label>
            <input
              type="text"
              required
              value={newOperator.name}
              onChange={e => {
                const name = e.target.value;
                const email = name ? `${name.toLowerCase().replaceAll(' ', '')}@example.com` : '';
                setNewOperator({ ...newOperator, name, email });
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              placeholder="Masukkan nama..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Email</label>
            <input
              type="email"
              required
              value={newOperator.email}
              onChange={e => setNewOperator({ ...newOperator, email: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              placeholder="Masukkan email..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">No. Telepon (Opsional)</label>
            <input
              type="text"
              value={newOperator.phone}
              onChange={e => setNewOperator({ ...newOperator, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              placeholder="0812xxxx..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Password Sementara</label>
            <input
              type="text"
              readOnly
              value={newOperator.password}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
            />
            <p className="mt-1 text-[10px] text-amber-500">*Password digenerate secara otomatis</p>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Operator"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
