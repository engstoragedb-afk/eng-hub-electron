import { useState } from "react";
import { aplUnitService, unitService } from "@/services";
import toast from "react-hot-toast";

type AplEditFormModalProps = {
  editingAplItem: any;
  setEditingAplItem: (item: any) => void;
  apiUnit: any;
  setApiUnit: (unit: any) => void;
  onClose: () => void;
  setPreviewImageUrl?: (url: string) => void;
};

export default function AplEditFormModal({
  editingAplItem,
  setEditingAplItem,
  apiUnit,
  setApiUnit,
  onClose,
}: AplEditFormModalProps) {
  const [isSavingApl, setIsSavingApl] = useState(false);
  const [isVaultFocused, setIsVaultFocused] = useState(false);

  const isAplEditEligible = (item: any) => {
    const isUnconfigured = (!item.total || item.total === 0) && (!item.vault || item.vault === 0);
    const isUnder50 = (item.input ?? 0) < 50;
    return !isUnder50 || isUnconfigured;
  };

  const handleSaveAplItem = async (closeModal = false, navigateNext = false) => {
    if (!editingAplItem || !editingAplItem.category_apl_id) return;
    if (editingAplItem.total === undefined) return;
    
    try {
      setIsSavingApl(true);
      
      await aplUnitService.upsertAplUnit({
        unit_id: apiUnit.id as string,
        category_apl_id: editingAplItem.category_apl_id,
        total: editingAplItem.total,
        vault: editingAplItem.vault
      });
      
      const updated = await unitService.getUnitDetails(apiUnit.id as string);
      setApiUnit(updated);
      
      toast.success("Data berhasil disimpan!", { duration: 3000 });
      
      if (closeModal) {
        onClose();
      } else if (navigateNext) {
        const sortedAplData = updated?.aplData || [];
        const editableItems = sortedAplData.filter(isAplEditEligible);
        if (editableItems.length > 0) {
          const currentIndex = editableItems.findIndex((item: any) => item.category_apl_id === editingAplItem.category_apl_id);
          let nextIndex = currentIndex !== -1 ? currentIndex + 1 : 0;
          if (nextIndex >= editableItems.length) nextIndex = 0;
          setEditingAplItem(editableItems[nextIndex]);
        } else {
          onClose();
        }
      }
    } catch (err) {
      console.error("Failed to save APL unit data:", err);
      toast.error("Gagal menyimpan data APL.", { duration: 3000 });
    } finally {
      setIsSavingApl(false);
    }
  };

  const handleNavigateAplItem = (direction: 'prev' | 'next') => {
    if (!editingAplItem || !apiUnit?.aplData) return;
    const sortedAplData = apiUnit.aplData || [];
    const editableItems = sortedAplData.filter(isAplEditEligible);
    if (editableItems.length === 0) return;
    
    const currentIndex = editableItems.findIndex((item: any) => item.category_apl_id === editingAplItem.category_apl_id);
    if (currentIndex === -1) {
      setEditingAplItem(editableItems[0]);
      return;
    }
    
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = editableItems.length - 1;
    if (nextIndex >= editableItems.length) nextIndex = 0;
    
    setEditingAplItem(editableItems[nextIndex]);
  };

  if (!editingAplItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSaveAplItem(false, true); }}
        className="w-full max-w-md rounded-[2rem] bg-slate-50 dark:bg-slate-900 p-8 shadow-2xl border border-slate-300 dark:border-white/10 flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95"
      >
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            {(() => {
              const sortedData = apiUnit?.aplData || [];
              const editableItems = sortedData.filter(isAplEditEligible);
              const total = editableItems.length;
              const currentIdx = editableItems.findIndex((item: any) => item.category_apl_id === editingAplItem.category_apl_id);
              if (total > 0 && currentIdx !== -1) {
                return (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest">
                      Langkah {currentIdx + 1} / {total}
                    </span>
                    <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                      {Array.from({ length: total }).map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIdx ? 'w-6 bg-sky-500' : idx < currentIdx ? 'w-2 bg-sky-200 dark:bg-sky-800' : 'w-2 bg-slate-200 dark:bg-slate-700/50'}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              }
              return <div />;
            })()}

            <div className="flex items-center gap-1 -mt-1 -mr-2">
              <button 
                type="button"
                onClick={() => handleNavigateAplItem('prev')}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 rounded-full transition cursor-pointer"
                title="Sebelumnya"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                type="button"
                onClick={() => handleNavigateAplItem('next')}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 rounded-full transition cursor-pointer"
                title="Selanjutnya"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 w-full mt-2">
            {editingAplItem.name}
          </h3>
        </div>
        
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
              id="apl-input-total"
              type="number"
              autoFocus
              value={editingAplItem.total !== undefined ? editingAplItem.total : ""}
              onChange={(e) => setEditingAplItem({ ...editingAplItem, total: e.target.value === "" ? undefined as any : Number(e.target.value) })}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  document.getElementById('apl-input-vault')?.focus();
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  document.getElementById('apl-input-vault')?.focus();
                }
              }}
              className={`w-full rounded-xl border ${editingAplItem.total === undefined ? "border-amber-400 dark:border-amber-500/50 focus:border-amber-500 focus:ring-amber-500" : "border-slate-300 dark:border-white/10 focus:border-sky-500 focus:ring-sky-500"} bg-white p-3 text-slate-900 focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-slate-100 transition`}
              placeholder="Masukkan angka sebenarnya..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-500 dark:text-slate-400">
              Vault*
            </label>
            <input
              id="apl-input-vault"
              type="number"
              value={editingAplItem.vault !== undefined ? editingAplItem.vault : ""}
              onChange={(e) => setEditingAplItem({ ...editingAplItem, vault: e.target.value === "" ? undefined : Number(e.target.value) })}
              onFocus={() => setIsVaultFocused(true)}
              onBlur={() => setTimeout(() => setIsVaultFocused(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  document.getElementById('apl-input-total')?.focus();
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  document.getElementById('apl-input-total')?.focus();
                }
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white p-3 text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:bg-slate-800 dark:text-slate-100 transition"
              placeholder="Masukkan jumlah vault..."
            />
            {isVaultFocused && (
              <div className="mt-2 flex flex-wrap gap-2">
                {[150, 300, 500, 1000, 2000, 4000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setEditingAplItem({ ...editingAplItem, vault: val });
                      setIsVaultFocused(false);
                    }}
                    className="cursor-pointer rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-600 hover:bg-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:hover:bg-sky-500/30 transition-colors"
                  >
                    {val}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="submit"
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
      </form>
    </div>
  );
}
