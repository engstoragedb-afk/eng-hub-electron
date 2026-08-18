import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { aplHistoryService, aplUnitService, unitService } from "@/services";

type AplEditFormModalProps = {
  editingAplItem: any;
  setEditingAplItem: (item: any) => void;
  apiUnit: any;
  setApiUnit: (unit: any) => void;
  onClose: () => void;
  setPreviewImageUrl: (url: string) => void;
};

export default function AplEditFormModal({
  editingAplItem,
  setEditingAplItem,
  apiUnit,
  setApiUnit,
  onClose,
  setPreviewImageUrl
}: AplEditFormModalProps) {
  const [isReplacingApl, setIsReplacingApl] = useState(false);
  const [replaceRemainingHours, setReplaceRemainingHours] = useState("");
  const [replaceLastHm, setReplaceLastHm] = useState("");
  const [replaceProofImages, setReplaceProofImages] = useState<File[]>([]);
  const [isSavingApl, setIsSavingApl] = useState(false);
  const [isVaultFocused, setIsVaultFocused] = useState(false);

  const handleSaveAplItem = async (closeModal = false, navigateNext = false) => {
    if (!editingAplItem || !editingAplItem.category_apl_id) return;
    if (!isReplacingApl && editingAplItem.total === undefined) return;
    
    try {
      setIsSavingApl(true);
      
      if (isReplacingApl) {
        const base64Images = await Promise.all(
          replaceProofImages.map(file => {
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = error => reject(error);
            });
          })
        );

        const payload = {
           apl_id: editingAplItem.id,
           remaining_hours: Number(replaceRemainingHours),
           last_hm: Number(replaceLastHm),
           input_total: Number(editingAplItem.total),
           images: base64Images
        };
        await aplHistoryService.createHistory(payload);
        await aplUnitService.upsertAplUnit({
          unit_id: apiUnit.id as string,
          category_apl_id: editingAplItem.category_apl_id,
          total: editingAplItem.total,
          vault: editingAplItem.vault
        });
      } else {
        await aplUnitService.upsertAplUnit({
          unit_id: apiUnit.id as string,
          category_apl_id: editingAplItem.category_apl_id,
          total: editingAplItem.total,
          vault: editingAplItem.vault
        });
      }
      
      const updated = await unitService.getUnitDetails(apiUnit.id as string);
      setApiUnit(updated);
      
      if (closeModal) {
        onClose();
      } else if (navigateNext) {
        const sortedAplData = updated?.aplData || [];
        const currentIndex = sortedAplData.findIndex((item: any) => item.category_apl_id === editingAplItem.category_apl_id);
        if (currentIndex !== -1) {
          let nextIndex = currentIndex + 1;
          if (nextIndex >= sortedAplData.length) nextIndex = 0;
          setEditingAplItem(sortedAplData[nextIndex]);
          setIsReplacingApl(false);
          setReplaceRemainingHours("");
          setReplaceLastHm("");
          setReplaceProofImages([]);
        }
      }
    } catch (err) {
      console.error("Failed to save APL unit data:", err);
      alert("Gagal menyimpan data APL.");
    } finally {
      setIsSavingApl(false);
    }
  };

  const handleNavigateAplItem = (direction: 'prev' | 'next') => {
    if (!editingAplItem || !apiUnit?.aplData) return;
    const sortedAplData = apiUnit.aplData || [];
    const currentIndex = sortedAplData.findIndex((item: any) => item.category_apl_id === editingAplItem.category_apl_id);
    if (currentIndex === -1) return;
    
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = sortedAplData.length - 1;
    if (nextIndex >= sortedAplData.length) nextIndex = 0;
    
    setEditingAplItem(sortedAplData[nextIndex]);
    setIsReplacingApl(false);
    setReplaceRemainingHours("");
    setReplaceLastHm("");
    setReplaceProofImages([]);
  };

  if (!editingAplItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSaveAplItem(false, true); }}
        className="flex flex-col md:flex-row items-stretch justify-center w-full max-w-5xl gap-6 transition-all duration-300"
      >
        {/* Card Kiri: Form Bawaan */}
        <div className="w-full max-w-md rounded-[2rem] bg-slate-50 dark:bg-slate-900 p-8 shadow-2xl border border-slate-300 dark:border-white/10 shrink-0 flex flex-col">
          <div className="mb-8 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              {(() => {
                const sortedData = apiUnit?.aplData || [];
                const total = sortedData.length;
                const currentIdx = sortedData.findIndex((item: any) => item.category_apl_id === editingAplItem.category_apl_id);
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
            
            <div className="flex items-start gap-3 p-3 rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-900/20">
              <input
                type="checkbox"
                id="replace-apl"
                className="mt-0.5 h-4 w-4 rounded border-sky-300 text-sky-500 focus:ring-sky-500"
                checked={isReplacingApl}
                onChange={(e) => {
                  setIsReplacingApl(e.target.checked);
                  if (e.target.checked) {
                    setReplaceRemainingHours(editingAplItem.input?.toString() || "0");
                    setReplaceLastHm(apiUnit?.hours?.toString() || "0");
                  }
                }}
              />
              <label htmlFor="replace-apl" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                Apakah unit <span className="font-bold">{apiUnit?.code || 'ini'}</span> baru saja mengganti <span className="font-bold">{editingAplItem.name}</span>?
              </label>
            </div>

            <div className={`space-y-4 ${isReplacingApl ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
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
                autoFocus={!isReplacingApl}
                disabled={isReplacingApl}
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
                disabled={isReplacingApl}
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
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
            {!isReplacingApl && (
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
            )}
          </div>
        </div>

        {/* Card Kanan: Form Penggantian Baru */}
        {isReplacingApl && (
          <div className="w-full max-w-md rounded-[2rem] bg-white dark:bg-slate-950 p-8 shadow-2xl border border-sky-300 dark:border-sky-500/30 shrink-0 flex flex-col animate-in fade-in slide-in-from-left-4 duration-300 relative">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-sky-600 dark:text-sky-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Data Penggantian
              </h3>
              <p className="text-sm text-slate-500 mt-1">Lengkapi data penggantian komponen APL ini.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-sky-800 dark:text-sky-200">
                  Catat Hitungan Sisa Jam
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-300 bg-slate-200 p-2.5 text-slate-900 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 opacity-70 cursor-not-allowed"
                  value={replaceRemainingHours}
                  readOnly
                  disabled
                  placeholder="Masukkan sisa jam..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-sky-800 dark:text-sky-200">
                  HM Terakhir
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-slate-300 bg-slate-200 p-2.5 text-slate-900 focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 opacity-70 cursor-not-allowed"
                  value={replaceLastHm}
                  readOnly
                  disabled
                  placeholder="Masukkan HM terakhir..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-sky-800 dark:text-sky-200">
                  Bukti Foto (Opsional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full rounded-xl border border-sky-300 bg-white p-2 text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-200 dark:border-white/10 dark:bg-slate-800 dark:file:bg-sky-900/30 dark:file:text-sky-400"
                  onChange={(e) => {
                    if (e.target.files) {
                      setReplaceProofImages(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
                {replaceProofImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {replaceProofImages.map((file, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-square shadow-sm">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-110 transition duration-300"
                          onClick={() => setPreviewImageUrl(URL.createObjectURL(file))}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setReplaceProofImages(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 bg-rose-500/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition hover:bg-rose-600 backdrop-blur-sm shadow-md"
                          title="Hapus foto"
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setIsReplacingApl(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
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
                  "Simpan Data"
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
