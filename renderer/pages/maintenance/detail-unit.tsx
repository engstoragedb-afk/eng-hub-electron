import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { FaArrowLeft, FaExpandAlt, FaTimes, FaSearchPlus, FaCrop, FaImage, FaCheckCircle, FaWrench, FaMapMarkerAlt, FaWifi, FaExclamationTriangle, FaEyeSlash, FaHistory, FaCalendarAlt, FaClock, FaTrash, FaEdit, FaEye } from "react-icons/fa";
import toast from "react-hot-toast";
import { EGPSStatus, APLSTATUS } from "@/common/utils/status";

import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import Badge from "@/components/atoms/Badge";
import EditableText from "@/components/atoms/EditableText";
import CopyButton from "@/components/atoms/CopyButton";
import Lightbox from "@/components/organisms/Lightbox";
import ImageCropModal from "@/components/organisms/ImageCropModal";
import dynamic from 'next/dynamic';
import { unitService, typeUnitService, locationService, aplHistoryService } from "@/services";
import GpsLogDrawer from "@/components/organisms/GpsLogDrawer";
import HoursLogDrawer from "@/components/organisms/HoursLogDrawer";
import AplEditFormModal from "@/components/organisms/AplEditFormModal";
import EditServiceHistoryModal from "@/components/organisms/EditServiceHistoryModal";
import CompleteServiceModal from "@/components/organisms/CompleteServiceModal";

const DetailUnitChart = dynamic(() => import("@/components/organisms/DetailUnitChart"), { 
  ssr: false, 
  loading: () => <div className="w-full h-full min-h-[200px] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">Memuat Grafik...</div> 
});

const categoryImages: Record<string, string> = {
  EXCAVATOR: "/units/exavator.png",
  BULLDOZER: "/units/bulldozer.png",
  VIBRO: "/units/vibro.png",
  "MOTOR GRADER": "/units/motor-grader.png",
  TRUCK: "/units/truck.png",
};

export default function UnitDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [apiUnit, setApiUnit] = useState<any>(null);
  const [siblingUnits, setSiblingUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAplItem, setEditingAplItem] = useState<{id: string, category_apl_id: string, name: string, total: number, vault?: number, input: number, schedule: number} | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [typeUnits, setTypeUnits] = useState<any[]>([]);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [brandInput, setBrandInput] = useState("");
  const [isEditingType, setIsEditingType] = useState(false);
  const [typeInput, setTypeInput] = useState("");
  const [isEditingPic, setIsEditingPic] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [locationOptions, setLocationOptions] = useState<any[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);
  const [editingHistoryItem, setEditingHistoryItem] = useState<any | null>(null);
  const [deletingHistoryItem, setDeletingHistoryItem] = useState<any | null>(null);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [servicingItem, setServicingItem] = useState<{ item: any; unit: any } | null>(null);
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<string[]>([]);

  const toggleExpandHistory = (historyId: string) => {
    setExpandedHistoryIds(prev =>
      prev.includes(historyId)
        ? prev.filter(id => id !== historyId)
        : [...prev, historyId]
    );
  };

  const handleDeleteUnit = async () => {
    if (!id) return;
    setIsDeletingUnit(true);
    try {
      await unitService.deleteUnit(id as string);
      toast.success(`Unit ${unit?.code || ""} berhasil dihapus!`);
      setIsDeleteConfirmOpen(false);
      router.push("/maintenance/unit");
    } catch (err: any) {
      console.error("Gagal menghapus unit:", err);
      toast.error(err?.response?.data?.message || err?.message || "Gagal menghapus unit.");
      setIsDeletingUnit(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!deletingHistoryItem?.id) return;
    setIsDeletingHistory(true);
    try {
      await aplHistoryService.deleteHistory(deletingHistoryItem.id);
      toast.success("Riwayat servis berhasil dihapus!");
      setDeletingHistoryItem(null);
      fetchServiceHistory();
    } catch (err: any) {
      console.error("Gagal menghapus riwayat servis:", err);
      toast.error(err?.response?.data?.message || err?.message || "Gagal menghapus riwayat servis.");
    } finally {
      setIsDeletingHistory(false);
    }
  };

  useEffect(() => {
    const isAnyModalOpen = !!(isChartModalOpen || editingAplItem || isCropModalOpen || isLightboxOpen || isDeleteConfirmOpen || editingHistoryItem || deletingHistoryItem || servicingItem);
    if (isAnyModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflowY = 'scroll';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflowY = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflowY = '';
    };
  }, [isChartModalOpen, editingAplItem, isCropModalOpen, isLightboxOpen]);

  const [isGpsLogOpen, setIsGpsLogOpen] = useState(false);
  const [isHoursLogOpen, setIsHoursLogOpen] = useState(false);
  
  const [activeMainTab, setActiveMainTab] = useState<'JADWAL' | 'HISTORY_SERVICE'>('JADWAL');
  const [serviceHistoryList, setServiceHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchServiceHistory = async () => {
    if (!id) return;
    setIsLoadingHistory(true);
    try {
      const data = await aplHistoryService.findAllNoPaginate({
        unit_id: id as string,
      });
      setServiceHistoryList(data || []);
    } catch (err) {
      console.error("Gagal memuat riwayat servis:", err);
      toast.error("Gagal memuat riwayat servis");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchServiceHistory();
    }
  }, [id, activeMainTab]);

  useEffect(() => {
    if (isGpsLogOpen || isHoursLogOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isGpsLogOpen, isHoursLogOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isChartModalOpen) {
      timer = setTimeout(() => setIsChartVisible(true), 150);
    } else {
      setIsChartVisible(false);
    }
    return () => clearTimeout(timer);
  }, [isChartModalOpen]);


  useEffect(() => {
    typeUnitService.getTypeUnits()
      .then(res => setTypeUnits(res || []))
      .catch(console.error);

    locationService.getLocations()
      .then((res: any) => setLocationOptions(res || []))
      .catch(console.error);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusDisplay = (status?: string | null) => {
    if (status === 'READY') return 'Siap';
    if (status === 'RAWAT_JALAN') return 'RJ Rawat Jalan';
    if (status === 'BREAKDOWN') return 'Breakdown';
    return status || 'Siap';
  };

  const getStatusBackend = (display: string) => {
    if (display === 'Siap') return 'READY';
    if (display === 'RJ Rawat Jalan') return 'RAWAT_JALAN';
    if (display === 'Breakdown') return 'BREAKDOWN';
    return display;
  };

  const getGpsStatusColor = (status?: string | null) => {
    switch (status) {
      case EGPSStatus.CONNECTED:
        return "success";
      case EGPSStatus.OFFLINE:
        return "neutral";
      case EGPSStatus.ERROR_NOT_FOUND:
      case EGPSStatus.ERROR_INVALID_DEVICE:
      case EGPSStatus.ERROR_UNAVAILABLE:
        return "warning";
      default:
        return "neutral";
    }
  };

  const getGpsStatusIcon = (status?: string | null) => {
    switch (status) {
      case EGPSStatus.CONNECTED:
        return <FaWifi className="mr-1" />;
      case EGPSStatus.OFFLINE:
        return <FaEyeSlash className="mr-1" />;
      case EGPSStatus.ERROR_NOT_FOUND:
      case EGPSStatus.ERROR_INVALID_DEVICE:
      case EGPSStatus.ERROR_UNAVAILABLE:
        return <FaExclamationTriangle className="mr-1" />;
      default:
        return <FaMapMarkerAlt className="mr-1" />;
    }
  };

  const handleUpdateUnit = async (data: any) => {
    try {
      if (data.image !== undefined) setIsUploadingImage(true);
      const updatedUnit = await unitService.updateUnit(id as string, data);
      setApiUnit(updatedUnit);
    } catch (err) {
      console.error("Failed to update unit:", err);
      alert("Gagal menyimpan perubahan unit.");
    } finally {
      if (data.image !== undefined) setIsUploadingImage(false);
    }
  };

  const handleTypeSelectOrCreate = async (value: string) => {
    const currentType = typeof apiUnit?.type === 'string' ? apiUnit.type : (apiUnit?.type?.name || "");
    if (!value || value === currentType) {
      setIsEditingType(false);
      return;
    }
    const existingType = typeUnits.find(t => t.name.toLowerCase() === value.toLowerCase());
    if (existingType) {
      await handleUpdateUnit({ type_id: existingType.id });
    } else {
      try {
        const newType = await typeUnitService.createTypeUnit(value);
        setTypeUnits(prev => [...prev, newType]);
        await handleUpdateUnit({ type_id: newType.id });
      } catch (err) {
        console.error("Gagal menambahkan Type Unit baru", err);
        toast.error("Gagal menambahkan Type Unit baru");
      }
    }
    setIsEditingType(false);
  };

  const handleLocationSelectOrCreate = async (value: string) => {
    const currentLoc = typeof apiUnit?.location === 'string' ? apiUnit.location : (apiUnit?.location?.name || "");
    if (!value || value === currentLoc) {
      setIsEditingLocation(false);
      return;
    }
    const existingLoc = locationOptions.find(loc => loc.name.toLowerCase() === value.toLowerCase());
    if (existingLoc) {
      await handleUpdateUnit({ location_id: existingLoc.id });
    } else {
      try {
        const newLoc = await locationService.createLocation(value);
        setLocationOptions(prev => [...prev, newLoc]);
        await handleUpdateUnit({ location_id: newLoc.id });
      } catch (err) {
        console.error("Gagal menambahkan Lokasi baru", err);
        toast.error("Gagal menambahkan Lokasi baru");
      }
    }
    setIsEditingLocation(false);
  };

  const isAplEditEligible = (item: any) => {
    const isUnconfigured = (!item.total || item.total === 0) && (!item.vault || item.vault === 0);
    const isUnder50 = (item.input ?? 0) < 50;
    return !isUnder50 || isUnconfigured;
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

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (editingAplItem && isInputFocused && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        target.blur();
        return;
      }

      if (isInputFocused) {
        return;
      }

      if (editingAplItem) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          document.getElementById('apl-input-total')?.focus();
        } else if (e.key === 'q' || e.key === 'Q') {
          e.preventDefault();
          setEditingAplItem(null);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleNavigateAplItem('prev');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNavigateAplItem('next');
        }
      } else {
        if (e.key === 'q' || e.key === 'Q') {
          e.preventDefault();
          if (apiUnit?.aplData && apiUnit.aplData.length > 0) {
            const firstEligible = apiUnit.aplData.find(isAplEditEligible);
            if (firstEligible) {
              setEditingAplItem(firstEligible);
            }
          }
        }
        if (siblingUnits.length > 0 && apiUnit?.id) {
          const currentIndex = siblingUnits.findIndex(u => u.id === apiUnit.id);
          if (currentIndex !== -1) {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              const prevIndex = currentIndex === 0 ? siblingUnits.length - 1 : currentIndex - 1;
              router.replace(`/maintenance/detail-unit?id=${siblingUnits[prevIndex].id}`);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              const nextIndex = currentIndex === siblingUnits.length - 1 ? 0 : currentIndex + 1;
              router.replace(`/maintenance/detail-unit?id=${siblingUnits[nextIndex].id}`);
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [editingAplItem, apiUnit, siblingUnits, router]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Hanya file dengan ekstensi JPEG, JPG, dan PNG yang diperbolehkan.");
        e.target.value = ""; 
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleUpdateUnit({ image: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    unitService.getUnitDetails(id as string)
      .then((data) => {
        if (data) {
          setApiUnit(data);
          const catId = data.category_id || (data as any).categoryId || data.category?.id || (typeof data.category === 'string' ? data.category : null);
          if (catId) {
            unitService.getUnitsByCategory(catId, { limit: 1000 })
              .then((res: any) => {
                if (res && res.data) {
                  setSiblingUnits(res.data);
                } else if (Array.isArray(res)) {
                  setSiblingUnits(res);
                }
              })
              .catch(console.error);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch unit detail:", err))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (editingAplItem || isChartModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [editingAplItem, isChartModalOpen]);

  const unit = apiUnit;

  if (isLoading) {
    return (
      <MaintenanceLayout title="Detail Unit" subtitle="Memuat informasi unit...">
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Mengambil data unit...</p>
          </div>
        </div>
      </MaintenanceLayout>
    );
  }

  if (!unit) {
    return (
      <MaintenanceLayout title="Detail Unit" subtitle="Unit tidak ditemukan">
        <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/70 p-8 text-center text-slate-700 dark:text-slate-300">
          Unit tidak ditemukan. Kembali ke daftar unit untuk memilih data yang
          tersedia.
        </div>
      </MaintenanceLayout>
    );
  }

  const sortedAplData = unit.aplData || [];

  const chartData = {
    labels: sortedAplData.map((item: any) => (!item.total || item.total === 0) ? `${item.name} *` : item.name),
    datasets: [
      {
        label: 'Jam',
        data: sortedAplData.map((item: any) => item.input || 0),
        backgroundColor: sortedAplData.map((item: any) => {
          const val = item.input || 0;
          if (val <= -100) return '#e90c0cff'; 
          if (val < 0) return '#e7791aff'; 
          if (val < 50) return '#fbbf24'; 
          return '#34d399'; 
        }),
        borderRadius: 8,
        barThickness: 16,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    animations: {
      colors: false,
      x: false,
    },
    transitions: {
      active: { animation: { duration: 0 } },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const selectedItem = sortedAplData[index];
        if (selectedItem) {
          const isUnconfigured = (!selectedItem.total || selectedItem.total === 0) && (!selectedItem.vault || selectedItem.vault === 0);
          const isUnder50 = (selectedItem.input ?? 0) < 50;

          if (isUnder50 && !isUnconfigured) {
            setServicingItem({ item: selectedItem, unit: apiUnit || unit });
            setIsChartModalOpen(false);
          } else {
            setEditingAplItem(selectedItem);
            setIsChartModalOpen(false);
          }
        }
      }
    },
    layout: {
      padding: {
        left: 20,
        right: 50
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.x} Jam`,
        },
      },
      datalabels: {
        display: false,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'y' as const,
      intersect: false,
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          stepSize: 50,
          color: '#94a3b8',
          font: { size: 10 },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: 'bold' as const },
        },
      },
      y2: {
        position: 'right' as const,
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: 'bold' as const },
          callback: function(value: any, index: number) {
            const dataValue = sortedAplData[index].input || 0;
            return `${dataValue} Jam`;
          }
        }
      },
    },
  };

  return (
    <React.Fragment>
      <MaintenanceLayout title="Detail Unit" subtitle={`Informasi unit ${unit.code}`}>
        <div className="mb-6">
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center text-sm text-slate-400 dark:text-slate-400 hover:text-amber-500 transition mb-4 cursor-pointer"
          >
            <FaArrowLeft className="mr-2" /> Kembali
          </button>
        </div>
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-6">
            <div className="flex items-start gap-5">
              <div className="relative group overflow-hidden rounded-2xl h-52 w-64 bg-slate-50 dark:bg-slate-950/70 p-3">
                <div className="flex h-full w-full items-center justify-center">
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Memproses...</span>
                    </div>
                  ) : (
                    <img
                      src={unit.imageUrl || categoryImages[unit.category?.name]}
                      alt={unit.category?.name}
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
                
                {!isUploadingImage && (
                  <div className="absolute inset-0 hidden flex-col items-center justify-center gap-2 bg-slate-900/80 transition-opacity duration-200 group-hover:flex backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="flex w-32 items-center justify-start pl-4 gap-3 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      <FaSearchPlus /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(true)}
                      className="flex w-32 items-center justify-start pl-4 gap-3 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      <FaCrop /> Crop
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-32 items-center justify-start pl-4 gap-3 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 shadow-lg shadow-sky-500/20"
                    >
                      <FaImage /> Ganti
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 dark:text-slate-400">
                      {unit.category?.name}
                    </p>
                    <h2 className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-slate-100">
                      <EditableText value={unit.code} onSave={(val) => handleUpdateUnit({ name: val })} />
                    </h2>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div 
                      onDoubleClick={() => setIsEditingStatus(true)} 
                      className="cursor-pointer" 
                      title="Klik 2 kali untuk mengedit status"
                    >
                      {isEditingStatus ? (
                        <select
                          value={getStatusDisplay(unit.status)}
                          onChange={(e) => {
                            setIsEditingStatus(false);
                            if (e.target.value !== getStatusDisplay(unit.status)) {
                              handleUpdateUnit({ status: getStatusBackend(e.target.value) });
                            }
                          }}
                          onBlur={() => setIsEditingStatus(false)}
                          className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-sky-500 px-3 py-1 outline-none text-sm font-semibold"
                          autoFocus
                        >
                          <option value="Siap">Siap</option>
                          <option value="RJ Rawat Jalan">RJ Rawat Jalan</option>
                          <option value="Breakdown">Breakdown</option>
                        </select>
                      ) : (
                        <Badge tone={getStatusDisplay(unit.status) === "Siap" ? "success" : getStatusDisplay(unit.status) === "RJ Rawat Jalan" ? "warning" : "critical"}>
                          {getStatusDisplay(unit.status) === "Siap" ? <FaCheckCircle className="mr-1" /> : <FaWrench className="mr-1" />}
                          {getStatusDisplay(unit.status)}
                        </Badge>
                      )}
                    </div>

                    {unit.gpsVendor && (
                      <Badge tone={getGpsStatusColor(unit.gpsStatus)}>
                        {getGpsStatusIcon(unit.gpsStatus)}
                        {unit.gpsStatus ? unit.gpsStatus.replace('ERROR_', '').replace(/_/g, ' ') : "GPS"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {/* HM Card Hidden 
                  <div className="rounded-2xl bg-white dark:bg-slate-900/70 p-4">
                    <p className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">HM</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                      <EditableText value={unit.hm} type="number" onSave={(val) => handleUpdateUnit({ hm: Number(val) })} />
                    </p>
                  </div>
                  */}
                  <div className="rounded-2xl bg-white dark:bg-slate-900/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">HOURS</p>
                      <button
                        type="button"
                        onClick={() => setIsHoursLogOpen(true)}
                        className="p-1 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 dark:hover:text-sky-400 transition cursor-pointer"
                        title="Riwayat Perubahan Hours"
                      >
                        <FaHistory size={13} />
                      </button>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                      <EditableText value={unit.hours} type="number" onSave={(val) => handleUpdateUnit({ hours: Number(val) })} />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div id="unit-tabs-section" className="mt-6 rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/80 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex gap-6 border-b border-slate-200 dark:border-white/10 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveMainTab('JADWAL')}
                    className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                      activeMainTab === 'JADWAL'
                        ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <FaWrench size={16} /> MAINTENANCE
                  </button>
                  <button
                    onClick={() => setActiveMainTab('HISTORY_SERVICE')}
                    className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                      activeMainTab === 'HISTORY_SERVICE'
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <FaHistory size={15} /> RIWAYAT SERVIS
                    {serviceHistoryList.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        {serviceHistoryList.length}
                      </span>
                    )}
                  </button>
                </div>
                {activeMainTab === 'JADWAL' && (
                  <button
                    onClick={() => setIsChartModalOpen(true)}
                    className="p-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Perbesar Grafik"
                  >
                    <FaExpandAlt />
                  </button>
                )}
                {activeMainTab === 'HISTORY_SERVICE' && (
                  <button
                    onClick={fetchServiceHistory}
                    className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Segarkan Riwayat"
                  >
                    <FaHistory size={12} className={isLoadingHistory ? "animate-spin" : ""} />
                    <span>Segarkan</span>
                  </button>
                )}
              </div>
              <div className="mt-4">
                {activeMainTab === 'JADWAL' ? (
                  <div className="w-full relative" style={{ height: `${sortedAplData.length * 45 + 60}px` }}>
                    <DetailUnitChart chartData={chartData} chartOptions={chartOptions} />
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {isLoadingHistory ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500 dark:border-white/10 dark:border-t-emerald-500" />
                        <p className="text-xs font-semibold text-slate-400">Memuat riwayat servis unit...</p>
                      </div>
                    ) : serviceHistoryList.length === 0 ? (
                      <div className="text-center py-16 bg-white dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-white/10">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <FaHistory size={24} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Riwayat Servis</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                          Riwayat servis akan otomatis tercatat saat konfirmasi servis komponen dilakukan.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {serviceHistoryList.map((history, idx) => {
                          let validImages: string[] = [];
                          try {
                            if (Array.isArray(history.images)) {
                              validImages = history.images.filter(
                                (img: any) =>
                                  typeof img === "string" &&
                                  img.trim() !== "" &&
                                  img !== "null" &&
                                  img !== "undefined" &&
                                  !img.includes("undefined") &&
                                  !img.includes("null")
                              );
                            }
                          } catch (e) {}

                          const compName = sortedAplData.find(
                            (a: any) => a.id === history.apl_id || a.category_apl_id === history.apl_id
                          )?.name || "Komponen Servis";
                          const serviceDateTime = history.last_time || history.created_at;
                          const historyId = String(history.id || idx);
                          const isExpanded = expandedHistoryIds.includes(historyId);

                          return (
                            <div
                              key={idx}
                              className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition"
                            >
                              {/* Top Bar: Component + Status + Date + Action Buttons */}
                              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isExpanded ? "pb-3 border-b border-slate-100 dark:border-white/5" : ""}`}>
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    history.status === APLSTATUS.UPDATE
                                      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  }`}>
                                    <FaWrench size={14} />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                      {compName}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                                        history.status === APLSTATUS.UPDATE
                                          ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300"
                                          : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                      }`}>
                                        {history.status || "SERVICE"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                      <FaCalendarAlt size={12} className="text-slate-400" />
                                      {serviceDateTime
                                        ? new Date(serviceDateTime).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                          })
                                        : "-"}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <FaClock size={12} className="text-slate-400" />
                                      {serviceDateTime
                                        ? new Date(serviceDateTime).toLocaleTimeString("id-ID", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "-"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandHistory(historyId)}
                                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                                        isExpanded
                                          ? "text-sky-600 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-400"
                                          : "text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
                                      }`}
                                      title={isExpanded ? "Tutup Detail" : "Lihat Detail"}
                                    >
                                      <FaEye size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingHistoryItem(history)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 dark:hover:text-sky-400 transition cursor-pointer"
                                      title="Edit Riwayat Servis"
                                    >
                                      <FaEdit size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingHistoryItem(history)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition cursor-pointer"
                                      title="Hapus Riwayat Servis"
                                    >
                                      <FaTrash size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Collapsible Details Content */}
                              {isExpanded && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                  {/* Stat Cards 3 Kolom */}
                                  <div className="grid grid-cols-3 gap-3 my-4">
                                    <div className="p-3 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-500/20 text-center">
                                      <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block mb-0.5">
                                        Input Manual Baru
                                      </span>
                                      <span className="text-lg font-black text-sky-800 dark:text-sky-200">
                                        {history.last_total ?? history.input_total ?? "-"}
                                      </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 text-center">
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                                        HM Terakhir Servis
                                      </span>
                                      <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                                        {history.last_hm ?? "-"}
                                      </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 text-center">
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                                        Sisa Jam Saat Servis
                                      </span>
                                      <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                                        {history.remaining_hours ?? "-"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Foto Bukti Grid */}
                                  {validImages.length > 0 && (
                                    <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                        <FaImage size={12} className="text-sky-500" />
                                        <span>Foto Bukti Servis ({validImages.length})</span>
                                      </p>
                                      <div className="flex flex-wrap gap-2.5">
                                        {validImages.map((img: string, imgIdx: number) => (
                                          <div
                                            key={imgIdx}
                                            onClick={() => setPreviewImageUrl(img)}
                                            className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 cursor-pointer group relative shadow-2xs"
                                            title="Klik untuk melihat foto lebih besar"
                                          >
                                            <img
                                              src={img}
                                              alt={`Bukti Servis ${imgIdx + 1}`}
                                              className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition duration-300 flex items-center justify-center">
                                              <FaSearchPlus
                                                className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md"
                                                size={16}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-white/10">
                <div>
                  <h3 className="mb-1 text-lg font-bold">Ringkasan Unit</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">
                    Informasi utama unit.
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 pt-4">
                <div className="flex items-center justify-between">
                  <span>Brand</span>
                  <span
                    className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-sky-500 transition"
                    onDoubleClick={() => {
                      setBrandInput(unit.brand || "");
                      setIsEditingBrand(true);
                    }}
                    title="Klik 2 kali untuk mengedit brand"
                  >
                    {isEditingBrand ? (
                      <input
                        autoFocus
                        type="text"
                        value={brandInput}
                        onChange={(e) => setBrandInput(e.target.value)}
                        onBlur={() => {
                          setIsEditingBrand(false);
                          const trimmed = brandInput.trim();
                          if (trimmed !== (unit.brand || "")) {
                            handleUpdateUnit({ brand: trimmed || null });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setIsEditingBrand(false);
                            const trimmed = brandInput.trim();
                            if (trimmed !== (unit.brand || "")) {
                              handleUpdateUnit({ brand: trimmed || null });
                            }
                          } else if (e.key === 'Escape') {
                            setIsEditingBrand(false);
                          }
                        }}
                        className="w-48 rounded-lg border border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 shadow-sm outline-none text-right font-semibold"
                        placeholder="Ketik brand..."
                      />
                    ) : (
                      unit.brand || "-"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Type Unit</span>
                  <span
                    className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                    onDoubleClick={() => {
                      setTypeInput(typeof unit.type === 'string' ? unit.type : (unit.type?.name || ""));
                      setIsEditingType(true);
                    }}
                    title="Klik 2 kali untuk mengedit type unit"
                  >
                    {isEditingType ? (
                      <div 
                        className="relative" 
                        tabIndex={0} 
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            handleTypeSelectOrCreate(typeInput);
                          }
                        }}
                      >
                        <div className="w-56 rounded-lg border border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 shadow-sm flex justify-between items-center">
                            <input 
                               autoFocus
                              type="text" 
                              value={typeInput} 
                              onChange={(e) => setTypeInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleTypeSelectOrCreate(typeInput);
                                }
                              }}
                              className="w-full bg-transparent outline-none truncate" 
                              placeholder="Ketik type unit..." 
                            />
                            <span className="text-[10px] ml-2 text-slate-400">▼</span>
                        </div>
                        <ul className="absolute z-50 right-0 top-full mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-xl text-left">
                          {typeUnits.filter(t => t.name.toLowerCase().includes(typeInput.toLowerCase())).map((t: any) => (
                            <li
                              key={t.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (t.id !== (unit.type?.id || "")) {
                                  handleUpdateUnit({ type_id: t.id });
                                }
                                setIsEditingType(false);
                              }}
                              className={`cursor-pointer px-3 py-2 text-xs transition-colors whitespace-normal leading-relaxed ${unit.type?.id === t.id ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 font-medium' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700'}`}
                            >
                              {t.name}
                            </li>
                          ))}
                          {typeInput && !typeUnits.some(t => t.name.toLowerCase() === typeInput.toLowerCase()) && (
                            <li
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleTypeSelectOrCreate(typeInput);
                              }}
                              className="cursor-pointer px-3 py-2 text-xs transition-colors whitespace-normal leading-relaxed text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/30 font-semibold"
                            >
                              + Tambah "{typeInput}"
                            </li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      typeof unit.type === 'string' ? unit.type : (unit.type?.name || "-")
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>PIC</span>
                  <span
                    className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-sky-500 transition"
                    onDoubleClick={() => setIsEditingPic(true)}
                    title="Klik 2 kali untuk mengedit PIC"
                  >
                    {isEditingPic ? (
                      <select
                        autoFocus
                        value={unit.pic || ""}
                        onChange={(e) => {
                          setIsEditingPic(false);
                          const val = e.target.value;
                          if (val !== (unit.pic || "")) {
                            handleUpdateUnit({ pic: val || null });
                          }
                        }}
                        onBlur={() => setIsEditingPic(false)}
                        className="rounded-lg border border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 shadow-sm outline-none cursor-pointer font-semibold"
                      >
                        <option value="">-</option>
                        <option value="KOBELCO">KOBELCO</option>
                        <option value="ENG">ENG</option>
                        <option value="UT">UT</option>
                        <option value="GM">GM</option>
                      </select>
                    ) : (
                      unit.pic || "-"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lokasi</span>
                  <span 
                    className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-sky-500 transition"
                    onDoubleClick={() => {
                      setLocationInput(typeof unit.location === 'string' ? unit.location : (unit.location?.name || ""));
                      setIsEditingLocation(true);
                    }}
                  >
                    {isEditingLocation ? (
                      <div 
                        className="relative" 
                        tabIndex={0} 
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            handleLocationSelectOrCreate(locationInput);
                          }
                        }}
                      >
                        <div className="w-56 rounded-lg border border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 shadow-sm flex justify-between items-center">
                            <input 
                              autoFocus
                              type="text" 
                              value={locationInput} 
                              onChange={(e) => setLocationInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleLocationSelectOrCreate(locationInput);
                                }
                              }}
                              className="w-full bg-transparent outline-none truncate" 
                              placeholder="Ketik lokasi..." 
                            />
                            <span className="text-[10px] ml-2 text-slate-400">▼</span>
                        </div>
                        <ul className="absolute z-50 right-0 top-full mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-xl text-left">
                          {locationOptions.filter(loc => loc.name.toLowerCase().includes(locationInput.toLowerCase())).map((loc: any) => (
                            <li
                              key={loc.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (loc.id !== (unit.location?.id || "")) {
                                  handleUpdateUnit({ location_id: loc.id });
                                }
                                setIsEditingLocation(false);
                              }}
                              className={`cursor-pointer px-3 py-2 text-xs transition-colors whitespace-normal leading-relaxed ${unit.location?.id === loc.id ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 font-medium' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700'}`}
                            >
                              {loc.name}
                            </li>
                          ))}
                          {locationInput && !locationOptions.some(loc => loc.name.toLowerCase() === locationInput.toLowerCase()) && (
                            <li
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleLocationSelectOrCreate(locationInput);
                              }}
                              className="cursor-pointer px-3 py-2 text-xs transition-colors whitespace-normal leading-relaxed text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/30 font-semibold"
                            >
                              + Tambah "{locationInput}"
                            </li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      typeof unit.location === 'string' ? unit.location : (unit.location?.name ?? '-')
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Operator</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {unit.operator?.full_name ?? unit.operator?.name ?? '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mechanic</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {unit.mechanic?.full_name ?? unit.mechanic?.name ?? (typeof unit.mechanic === 'string' ? unit.mechanic : '-')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status Service</span>
                  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                    unit.service === "NORMAL" || unit.service === "Normal"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-500/30"
                    : "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 ring-sky-600/20 dark:ring-sky-500/30"
                  }`}>
                    {unit.service === "NORMAL" || unit.service === "Normal" ? "NORMAL" : `PS ${unit.service} H`}
                  </span>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-300 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/30 transition cursor-pointer active:scale-98"
                    title="Hapus Unit Ini"
                  >
                    <FaTrash size={11} />
                    <span>Hapus Unit</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-white/10">
                <div>
                  <h3 className="mb-1 text-lg font-bold">Spesifikasi & GPS</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">
                    Informasi tambahan unit.
                  </p>
                </div>
                <button
                  onClick={() => setIsGpsLogOpen(true)}
                  className="rounded-xl border border-sky-500 bg-sky-50 dark:bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition cursor-pointer"
                >
                  HISTORY GPS
                </button>
              </div>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300 pt-4">
                <div className="flex items-center justify-between">
                  <span>Manufacture Year</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    <EditableText value={unit.manufactureYear} type="number" onSave={(val) => handleUpdateUnit({ manufacture_year: Number(val) })} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Serial Number</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    <EditableText value={unit.serialNumber} onSave={(val) => handleUpdateUnit({ serial_number: val })} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GPS Vendor</span>
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      <EditableText value={unit.gpsVendor || "-"} onSave={(val) => handleUpdateUnit({ gps_vendor: val })} />
                    </span>
                    <CopyButton text={unit.gpsVendor} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>GPS Device ID</span>
                  <div className="flex items-center">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      <EditableText value={unit.gpsDeviceId || "-"} onSave={(val) => handleUpdateUnit({ gps_device_id: val })} />
                    </span>
                    <CopyButton text={unit.gpsDeviceId} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>GPS Portal</span>
                  <div className="flex items-center gap-2 max-w-[60%]">
                    <span className="font-semibold text-sky-400 break-all text-right">
                      <EditableText value={unit.gpsPortal || "NOT LINKED"} onSave={(val) => handleUpdateUnit({ gps_portal: val })} />
                    </span>
                    {unit.gpsPortal && (
                      <a
                        href={unit.gpsPortal}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-sky-400 p-1"
                        title="Buka link"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-sky-500/10 p-5">
              <h3 className="mb-2 text-lg font-bold text-sky-100">Catatan</h3>
              <p className="text-sm text-slate-800 dark:text-slate-200">
                Unit terpilih dapat digunakan untuk melihat performa asset,
                jadwal maintenance, serta status operasional yang sedang
                berjalan.
              </p>
            </div>
          </div>
        </section>
      </MaintenanceLayout>

      <AplEditFormModal
        key={editingAplItem?.category_apl_id || 'empty'}
        editingAplItem={editingAplItem}
        setEditingAplItem={setEditingAplItem}
        apiUnit={apiUnit}
        setApiUnit={setApiUnit}
        onClose={() => setEditingAplItem(null)}
        setPreviewImageUrl={setPreviewImageUrl}
        onSaveSuccess={fetchServiceHistory}
      />
      {isChartModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 sm:p-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-3xl p-6 w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Jadwal Pemeliharaan</h3>
                <p className="text-sm text-slate-500 mt-1">Tampilan penuh grafik indikator unit {unit.code}</p>
              </div>
              <button 
                onClick={() => setIsChartModalOpen(false)}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/50 dark:hover:text-rose-400 text-slate-500 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="flex-1 w-full overflow-y-auto pr-2">
               {isChartVisible ? (
                 <div style={{ height: `${Math.max(600, sortedAplData.length * 50 + 60)}px`, minHeight: '100%' }}>
                    <DetailUnitChart chartData={chartData} chartOptions={{ ...chartOptions, maintainAspectRatio: false }} />
                 </div>
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-400">
                   <div className="flex flex-col items-center gap-4">
                     <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
                     <p className="text-sm font-medium">Mempersiapkan Grafik...</p>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {previewImageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setPreviewImageUrl(null)}>
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-rose-500 rounded-full p-3 transition"
            onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(null); }}
          >
            <FaTimes size={24} />
          </button>
          <img 
            src={previewImageUrl} 
            alt="Preview Zoom" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Lightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={unit?.imageUrl || (unit?.category?.name ? categoryImages[unit.category.name] : "")}
        title={unit?.code || "Preview Gambar"}
        description={`Gambar detail untuk unit ${unit?.code || ""}`}
      />

      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={unit?.imageUrl || (unit?.category?.name ? categoryImages[unit.category.name] : "")}
        title={`Crop Gambar ${unit?.code || ""}`}
        onSave={(previewUrl, blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            handleUpdateUnit({ image: base64String });
            toast.success("Gambar hasil crop berhasil disimpan");
          };
          reader.readAsDataURL(blob);
        }}
      />

      {/* GPS Log Drawer */}
      <GpsLogDrawer 
        isOpen={isGpsLogOpen} 
        onClose={() => setIsGpsLogOpen(false)} 
        unitId={apiUnit?.id} 
        unitCode={apiUnit?.code}
      />

      {/* Hours Log Drawer */}
      <HoursLogDrawer 
        isOpen={isHoursLogOpen} 
        onClose={() => setIsHoursLogOpen(false)} 
        unitId={apiUnit?.id} 
        unitCode={apiUnit?.code}
      />

      {/* Delete Unit Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <FaExclamationTriangle size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Hapus Unit {unit.code}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Apakah Anda yakin ingin menghapus unit <strong className="text-slate-800 dark:text-slate-200">{unit.code}</strong>? Tindakan ini akan menghapus seluruh data maintenance, log perbaikan, dan riwayat servis terkait unit ini secara permanen.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                disabled={isDeletingUnit}
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingUnit}
                onClick={handleDeleteUnit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {isDeletingUnit ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <FaTrash size={12} />
                    <span>Ya, Hapus Unit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service History Modal */}
      {editingHistoryItem && (
        <EditServiceHistoryModal
          isOpen={!!editingHistoryItem}
          onClose={() => setEditingHistoryItem(null)}
          history={editingHistoryItem}
          componentName={
            sortedAplData.find(
              (a: any) =>
                a.id === editingHistoryItem.apl_id ||
                a.category_apl_id === editingHistoryItem.apl_id
            )?.name || "Komponen Servis"
          }
          onSuccess={fetchServiceHistory}
        />
      )}

      {/* Delete Service History Confirmation Modal */}
      {deletingHistoryItem && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <FaExclamationTriangle size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Hapus Riwayat Servis?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data riwayat servis untuk komponen{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {sortedAplData.find(
                      (a: any) =>
                        a.id === deletingHistoryItem.apl_id ||
                        a.category_apl_id === deletingHistoryItem.apl_id
                    )?.name || "Komponen"}
                  </strong>
                  ? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                disabled={isDeletingHistory}
                onClick={() => setDeletingHistoryItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingHistory}
                onClick={handleDeleteHistory}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {isDeletingHistory ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <FaTrash size={12} />
                    <span>Ya, Hapus Riwayat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Service Modal (For <= 0 Hours) */}
      {servicingItem && (
        <CompleteServiceModal
          isOpen={!!servicingItem}
          onClose={() => setServicingItem(null)}
          item={servicingItem.item}
          unit={servicingItem.unit}
          onSuccess={async () => {
            if (id) {
              const updated = await unitService.getUnitDetails(id as string);
              setApiUnit(updated);
              fetchServiceHistory();
            }
          }}
        />
      )}

    </React.Fragment>
  );
}
