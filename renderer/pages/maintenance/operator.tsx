import React, { useState, useEffect } from "react";
import Link from "next/link";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import { FaMagnifyingGlass, FaXmark, FaPenToSquare, FaPlus, FaList, FaGrip, FaChevronLeft, FaChevronRight, FaArrowDownWideShort, FaArrowUpWideShort, FaEllipsisVertical } from "react-icons/fa6";
import toast from "react-hot-toast";
import { userService, unitService, locationService, operatorService } from "@/services";
import { EROLES } from "@/common/utils/roles";
import router from "next/router";

// Helper to get initials
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default function MaintenanceOperatorPage() {
  const [localOperators, setLocalOperators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("Semua");
  const [masterLocations, setMasterLocations] = useState<any[]>([]);
  const [masterUnits, setMasterUnits] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<'terbaru' | 'terlama'>('terbaru');

  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const fetchOperators = async () => {
    try {
      setIsSearching(true);
      const data = await userService.getUsersByRole(EROLES.OPERATOR, {
        search: searchTerm || undefined,
        location: locationFilter !== "Semua" ? locationFilter : undefined,
      });
      const formattedData = data.map((user: any, index: number) => ({
        id: user.id,
        name: user.full_name,
        status: user.is_active ? "Aktif" : "Nonaktif",
        category: user.unit?.category,
        unit: user.unit,
        location: user.location?.name || "-",
        image: user.image,
        raw: user,
        originalIndex: index,
        createdAt: user.created_at || user.createdAt || null
      }));
      setLocalOperators(formattedData);
    } catch (error) {
      console.error("Gagal mengambil data operator:", error);
      toast.error("Gagal mengambil data operator.");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const STORAGE_KEY = `operator_filters`;
  const isRestoringRef = React.useRef(true);
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.searchTerm !== undefined) setSearchTerm(parsed.searchTerm);
        if (parsed.locationFilter !== undefined) setLocationFilter(parsed.locationFilter);
        if (parsed.sortOrder !== undefined) setSortOrder(parsed.sortOrder);
        if (parsed.viewMode !== undefined) setViewMode(parsed.viewMode);
        if (parsed.currentPage !== undefined) setCurrentPage(parsed.currentPage);
      } catch (e) {}
    }
    
    setTimeout(() => {
      isRestoringRef.current = false;
      setIsRestored(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (isRestoringRef.current || !isRestored) return;
    const filters = { searchTerm, locationFilter, sortOrder, viewMode, currentPage };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [searchTerm, locationFilter, sortOrder, viewMode, currentPage, isRestored]);

  useEffect(() => {
    if (!isRestored) return; // Wait until restore is complete before fetching
    if (!isRestoringRef.current) {
      // Only reset page to 1 if this is a user-initiated change, not during restore
      // But wait, the dependency array has isRestored. When isRestored becomes true, 
      // this effect runs. We don't want to reset page then.
      // We will handle resetting page in a separate effect or just check if it's the first run after restore.
    }
    const timer = setTimeout(() => {
      fetchOperators();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, locationFilter, sortOrder, isRestored]);

  const previousFiltersRef = React.useRef({ searchTerm, locationFilter, sortOrder });
  useEffect(() => {
    if (!isRestored) return;
    const prev = previousFiltersRef.current;
    if (prev.searchTerm !== searchTerm || prev.locationFilter !== locationFilter || prev.sortOrder !== sortOrder) {
      setCurrentPage(1);
      previousFiltersRef.current = { searchTerm, locationFilter, sortOrder };
    }
  }, [searchTerm, locationFilter, sortOrder, isRestored]);

  useEffect(() => {
    Promise.all([
      locationService.getLocations(),
      unitService.getAllUnits()
    ]).then(([locData, unitData]) => {
      setMasterLocations(locData || locData || []);
      setMasterUnits(unitData || []);
    }).catch(err => {
      console.error("Failed to load options", err);
    });
  }, []);

  // Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form state
  const [assignUnit, setAssignUnit] = useState("");
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [assignLocation, setAssignLocation] = useState("Site A");

  // Add Operator Modal state
  const [isAddOperatorModalOpen, setIsAddOperatorModalOpen] = useState(false);
  const [newOperator, setNewOperator] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] = useState(false);
  const [updateProfileData, setUpdateProfileData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    password: ""
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    const closeDropdown = () => setActiveDropdown(null);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleOpenAddModal = () => {
    setNewOperator({
      name: "",
      email: "",
      phone: "",
      image: "",
      password: generatePassword()
    });
    setIsAddOperatorModalOpen(true);
  };

  // const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  //     if (!allowedTypes.includes(file.type)) {
  //       toast.error("Hanya file dengan ekstensi JPEG, JPG, dan PNG yang diperbolehkan.");
  //       e.target.value = "";
  //       return;
  //     }

  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setNewOperator(prev => ({ ...prev, image: reader.result as string }));
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handleSubmitAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userService.createUser({
        full_name: newOperator.name,
        email: newOperator.email,
        password: newOperator.password,
        phone: newOperator.phone,
        image: newOperator.image,
        role: EROLES.OPERATOR
      });
      toast.success("Operator berhasil ditambahkan!");
      setIsAddOperatorModalOpen(false);
      fetchOperators(); // Refresh list after adding
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan operator.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const payload: any = {
        full_name: updateProfileData.name,
        email: updateProfileData.email,
        phone: updateProfileData.phone,
      };
      if (updateProfileData.password) {
        payload.password = updateProfileData.password;
      }
      await userService.update(payload, updateProfileData.id);
      toast.success("Profile operator berhasil diupdate!");
      setIsUpdateProfileModalOpen(false);
      fetchOperators();
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate profile operator.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  useEffect(() => {
    if (isAssignModalOpen || isAddOperatorModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAssignModalOpen, isAddOperatorModalOpen]);

  const filteredOperators = [...localOperators].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    
    if (timeA && timeB) {
      return sortOrder === 'terbaru' ? timeB - timeA : timeA - timeB;
    }
    
    return sortOrder === 'terbaru' 
      ? b.originalIndex - a.originalIndex 
      : a.originalIndex - b.originalIndex;
  });
  
  const totalPages = Math.ceil(filteredOperators.length / itemsPerPage);
  const paginatedOperators = filteredOperators.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (isAssignModalOpen || isAddOperatorModalOpen) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        setCurrentPage(p => Math.max(1, p - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPage(p => Math.min(totalPages, p + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, isAssignModalOpen, isAddOperatorModalOpen]);

  const handleOpenAssign = (operator: any) => {
    setSelectedUser(operator);
    setAssignUnit(operator.unit?.name || "");
    setAssignLocation(operator.location !== "-" ? operator.location : "Site A");
    setIsAssignModalOpen(true);
  };

  const handleCloseAssign = () => {
    setIsAssignModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const selectedUnitObj = masterUnits.find(u => u.name === assignUnit);

      if (!selectedUnitObj) {
        toast.error("Silakan pilih unit yang valid dari daftar");
        return;
      }

      await operatorService.assignOperator({
        user_id: selectedUser.id,
        unit_id: selectedUnitObj.id
      });

      setLocalOperators(prev => prev.map(op => {
        if (op.id === selectedUser.id) {
          return {
            ...op,
            unit: selectedUnitObj,
            location: typeof selectedUnitObj.location === 'string' ? selectedUnitObj.location : (selectedUnitObj.location?.name || "-"),
            raw: {
              ...op.raw,
              unit: {
                ...op.raw?.unit,
                id: selectedUnitObj.id,
                name: selectedUnitObj.name
              }
            }
          };
        }
        return op;
      }));

      toast.success(`Penugasan ${selectedUser.name} berhasil diperbarui`);
      handleCloseAssign();
    } catch (error) {
      console.error("Gagal menyimpan penugasan:", error);
      toast.error("Gagal menyimpan penugasan operator");
    }
  };

  const handleUnassign = async (operator: any) => {
    if (!window.confirm(`Apakah Anda yakin ingin melepas tugas dari operator ${operator.name}?`)) return;

    try {
      await operatorService.unassignOperator(operator.id);
      
      setLocalOperators(prev => prev.map(op => {
        if (op.id === operator.id) {
          return {
            ...op,
            unit: null,
            location: "-",
            raw: {
              ...op.raw,
              unit: null
            }
          };
        }
        return op;
      }));

      toast.success(`Operator ${operator.name} berhasil dibebastugaskan`);
    } catch (error) {
      console.error("Gagal melepas penugasan:", error);
      toast.error("Gagal melepas penugasan operator");
    }
  };

  return (
    <React.Fragment>
      <MaintenanceLayout title="Operator" subtitle="Manajemen Operator">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-4">
            <div className="relative">
              {isSearching ? (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500 dark:border-slate-600 dark:border-t-sky-500" />
              ) : (
                <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 dark:text-slate-400" />
              )}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama atau ID..."
                className="w-64 rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
              />
            </div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
            >
              <option value="Semua">Semua Lokasi</option>
              {masterLocations.map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'terbaru' ? 'terlama' : 'terbaru')}
              className="flex shrink-0 items-center justify-center h-[46px] w-[46px] rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-500 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-all shadow-sm dark:hover:text-sky-400"
              title={`Urutkan: ${sortOrder === 'terbaru' ? 'Terbaru' : 'Terlama'}`}
            >
              {sortOrder === 'terbaru' ? <FaArrowDownWideShort size={18} /> : <FaArrowUpWideShort size={18} />}
            </button>
            <div className="flex items-center rounded-2xl bg-slate-200/50 dark:bg-slate-800 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center rounded-xl p-2.5 transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                title="Tampilan Grid"
              >
                <FaGrip className="text-lg" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center rounded-xl p-2.5 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                title="Tampilan List"
              >
                <FaList className="text-lg" />
              </button>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:bg-sky-600 hover:shadow-sky-500/40 active:scale-95"
            >
              <FaPlus /> Tambah
            </button>
          </div>
        </div>

        <section className="mt-8">
          {isLoading ? (
            <div className="flex h-[30vh] items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Mengambil data operator...</p>
              </div>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid' ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}>
              {filteredOperators.length === 0 && (
                <div className="col-span-full rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/70 p-5 text-slate-400 dark:text-slate-600 text-center">
                  Tidak ada operator ditemukan.
                </div>
              )}

              {paginatedOperators.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.raw?.unit?.id) {
                      router.push(`/maintenance/detail-unit?id=${item.raw.unit.id}`);
                    }
                  }}
                  className={`relative ${activeDropdown === item.id ? 'z-20' : 'z-10'} flex ${viewMode === 'grid' ? 'flex-col p-6' : 'flex-row items-center justify-between p-4 px-6'} rounded-[20px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/80 transition-all hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 dark:hover:bg-slate-800 cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)]`}
                >
                  <div className={`flex items-center gap-4 ${viewMode === 'grid' ? 'mb-5' : 'w-1/3'}`}>
                    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-950 ${viewMode === 'grid' ? 'h-[52px] w-[52px] shadow-sm' : 'h-10 w-10'}`}>
                      {item?.unit?.image || item?.category?.image ? (
                        <img src={item?.unit?.image || item?.category?.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className={`${viewMode === 'grid' ? 'text-lg' : 'text-sm'} font-bold text-sky-400`}>
                          {getInitials(item.name)}
                        </span>
                      )}
                    </div>
                    <div className={`${viewMode === 'grid' ? 'text-[17px]' : 'text-base'} font-bold text-slate-800 dark:text-slate-100 tracking-tight flex-1`}>
                      {item.name}
                    </div>
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === item.id ? null : item.id);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <FaEllipsisVertical />
                      </button>
                      {activeDropdown === item.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-white/10 z-10 py-1 overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(null);
                              setUpdateProfileData({
                                id: item.id,
                                name: item.name,
                                email: item.raw?.email || "",
                                phone: item.raw?.phone || "",
                                password: ""
                              });
                              setIsUpdateProfileModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-2.5 text-[13.5px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            Update Profile
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-5 mb-6' : 'flex items-center w-1/3 gap-8'}`}>
                    <div className={viewMode === 'list' ? 'flex-1' : ''}>
                      <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500 mb-1">Unit Assignment</p>
                      {!item.unit || !item.unit.id ? (
                        <p className="font-semibold text-slate-500 dark:text-slate-400">-</p>
                      ) : (
                        <Link
                          href={`/maintenance/detail-unit?id=${item.unit.id}`}
                          className="font-bold text-[15px] text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
                          prefetch={false}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.unit.name}
                        </Link>
                      )}
                    </div>
                    <div className={viewMode === 'list' ? 'flex-1' : 'overflow-hidden'}>
                      <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500 mb-1">Location</p>
                      <p title={item.location} className={`font-semibold text-[15px] truncate ${item.location === "-" ? "text-slate-500 dark:text-slate-400" : "text-slate-700 dark:text-slate-200"}`}>
                        {item.location}
                      </p>
                    </div>
                  </div>

                  <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 gap-3 mt-auto' : 'flex items-center justify-end w-1/3 gap-3'}`}>
                    {item.unit && item.unit.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnassign(item);
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl bg-rose-50/80 px-4 py-2.5 text-[13.5px] font-bold text-rose-600 transition-all duration-200 hover:bg-rose-100 active:scale-95 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 ${viewMode === 'list' ? 'w-auto py-2' : ''}`}
                      >
                        <FaXmark size={14} className="stroke-[2px]" /> Lepas{viewMode === 'grid' ? ' Tugas' : ''}
                      </button>
                    ) : null}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAssign(item);
                      }}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-bold transition-all duration-200 active:scale-95 ${
                        item.unit && item.unit.id 
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" 
                          : `${viewMode === 'grid' ? 'col-span-2' : ''} bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20`
                      } ${viewMode === 'list' ? 'w-auto py-2' : ''}`}
                    >
                      <FaPenToSquare size={14} /> {item.unit && item.unit.id ? `Ubah${viewMode === 'grid' ? ' Tugas' : ''}` : "Atur Penugasan"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <FaChevronLeft size={14} />
                </button>
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                        currentPage === page
                          ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <FaChevronRight size={14} />
                </button>
              </div>
            )}
            </>
          )}
        </section>
      </MaintenanceLayout>

      {/* Assignment Modal */}
      {isAssignModalOpen && (
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
                onClick={handleCloseAssign}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 transition hover:bg-slate-200 dark:bg-slate-700"
              >
                <FaXmark />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4">
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
                  onClick={handleCloseAssign}
                  className="rounded-xl border border-slate-700/70 bg-white dark:bg-slate-900/90 px-5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:border-amber-300/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                >
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddOperatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setIsAddOperatorModalOpen(false)}
              className="absolute right-6 top-6 text-slate-400 dark:text-slate-500 transition hover:text-slate-600 dark:hover:text-slate-300"
            >
              <FaXmark size={24} />
            </button>
            <h3 className="mb-6 text-xl font-bold text-slate-900 dark:text-slate-100">Tambah Operator Baru</h3>
            <form onSubmit={handleSubmitAddOperator} className="space-y-4">
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
      )}

      {/* Update Profile Modal */}
      {isUpdateProfileModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-6 dark:bg-slate-900/80 transition-all duration-300 ease-in-out">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Update Profile</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400">Edit informasi profile operator</p>
              </div>
              <button
                onClick={() => setIsUpdateProfileModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 transition hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <FaXmark />
              </button>
            </div>

            <form onSubmit={handleSubmitUpdateProfile} className="flex flex-col gap-5 p-6">
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
      )}
    </React.Fragment>
  );
}
