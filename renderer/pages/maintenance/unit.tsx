import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { FaUpload } from "react-icons/fa";
import { createPortal } from "react-dom";

import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import CategoryCard from "@/components/molecules/CategoryCard";
import ImportResultModal from "@/components/organisms/ImportResultModal";
import { categoryUnitsService, unitService } from "@/services";

export default function MaintenanceUnitPage() {
  const router = useRouter();

  const categoryImages: Record<string, string> = {
    EXCAVATOR: "/units/exavator.png",
    BULLDOZER: "/units/bulldozer.png",
    VIBRO: "/units/vibro.png",
    "MOTOR GRADER": "/units/motor-grader.png",
    TRUCK: "/units/truck.png",
  };

  const [categories, setCategories] = useState<any[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ notUpdated: any[] } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCategories = () => {
    categoryUnitsService.getAll()
      .then((data) => {
        if (data) {
          const formatted = data
            .filter((item: any) => item.name !== "NULL" && item.name !== "equipment_group")
            .map((item: any) => ({
              id: item.id,
              name: item.name,
              count: item.units,
              image: item.image,
            }));
          setCategories(formatted);
        }
      })
      .catch((err) => console.error("Failed to fetch category units:", err));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setIsImporting(true);
    try {
      const notUpdated = await unitService.uploadHoursFromExcel(file);
      setImportResult({ notUpdated: notUpdated || [] });
      fetchCategories();
    } catch (err: any) {
      setImportResult({
        notUpdated: [
          {
            reason:
              err?.response?.data?.message ||
              err?.message ||
              "Terjadi kesalahan saat import.",
          },
        ],
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <React.Fragment>
      <MaintenanceLayout
        title="Maintenance Unit"
        subtitle="Kategori unit dan daftar asset perbaikan"
      >
        {/* Hidden Import Input */}
        <input
          ref={importInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImportExcel}
        />

        {/* Action Header above Category Cards */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Pilih Kategori Unit
          </p>

          <button
            onClick={() => importInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/50 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-600 dark:text-violet-400 transition hover:bg-violet-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            title="Import HM dari file Excel"
          >
            {isImporting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <FaUpload size={14} />
            )}
          </button>
        </div>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.name}
              category={category.name}
              count={category.count}
              imageUrl={category.image || categoryImages[category.name]}
              onSelect={() => {
                sessionStorage.removeItem(`unit_filters_${category.name}`);
                router.push(`/maintenance/unit/${encodeURIComponent(category.name)}?id=${category.id}`);
              }}
            />
          ))}
        </section>
      </MaintenanceLayout>

      {/* Import Result Modal */}
      {importResult && mounted && createPortal(
        <ImportResultModal
          importResult={importResult}
          onClose={() => setImportResult(null)}
        />,
        document.body
      )}
    </React.Fragment>
  );
}
