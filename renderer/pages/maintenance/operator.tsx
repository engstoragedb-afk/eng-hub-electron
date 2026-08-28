import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import { FaMagnifyingGlass, FaXmark, FaPenToSquare, FaPlus, FaList, FaGrip, FaChevronLeft, FaChevronRight, FaArrowDownWideShort, FaArrowUpWideShort, FaEllipsisVertical, FaChevronDown, FaCheck, FaLocationDot } from "react-icons/fa6";
import toast from "react-hot-toast";
import { userService, unitService, locationService, operatorService } from "@/services";
import { EROLES } from "@/common/utils/roles";
import router from "next/router";
import { useSessionStorage } from "@/hooks/useSessionStorage";
import AssignOperatorModal from "@/components/organisms/AssignOperatorModal";
import AddOperatorModal from "@/components/organisms/AddOperatorModal";
import UpdateOperatorProfileModal from "@/components/organisms/UpdateOperatorProfileModal";

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
  const [searchTerm, setSearchTerm] = useSessionStorage("operator_searchTerm", "");
  const [locationFilter, setLocationFilter] = useSessionStorage("operator_locationFilter", "Semua");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const [masterLocations, setMasterLocations] = useState<any[]>([]);
  const [masterUnits, setMasterUnits] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useSessionStorage<'terbaru' | 'terlama'>("operator_sortOrder", 'terbaru');

  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useSessionStorage<'grid' | 'list'>("operator_viewMode", 'grid');
  const [currentPage, setCurrentPage] = useSessionStorage("operator_currentPage", 1);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOperators();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, locationFilter, sortOrder]);

  const previousFiltersRef = React.useRef({ searchTerm, locationFilter, sortOrder });
  useEffect(() => {
    const prev = previousFiltersRef.current;
    if (prev.searchTerm !== searchTerm || prev.locationFilter !== locationFilter || prev.sortOrder !== sortOrder) {
      setCurrentPage(1);
      previousFiltersRef.current = { searchTerm, locationFilter, sortOrder };
    }
  }, [searchTerm, locationFilter, sortOrder]);

  useEffect(() => {
    locationService.getLocations()
      .then(locData => setMasterLocations(locData || []))
      .catch(err => console.error("Failed to load locations:", err));

    unitService.getAllUnitsWithDetail()
      .then(unitData => setMasterUnits(unitData || []))
      .catch(err => {
        console.error("Failed to load units with detail, trying fallback:", err);
        unitService.getAllUnits()
          .then(unitData => setMasterUnits(unitData || []))
          .catch(e => console.error("Failed to load units:", e));
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLocationDropdownOpen(false);
      }
    };
    if (isLocationDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLocationDropdownOpen]);

  // Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isAddOperatorModalOpen, setIsAddOperatorModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] = useState(false);
  const [updateProfileData, setUpdateProfileData] = useState<any>(null);

  useEffect(() => {
    const closeDropdown = () => setActiveDropdown(null);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  const handleSaveAddOperator = async (operatorData: any) => {
    await userService.createUser({
      full_name: operatorData.name,
      email: operatorData.email,
      password: operatorData.password,
      phone: operatorData.phone,
      image: operatorData.image,
      role: EROLES.OPERATOR
    });
    toast.success("Operator berhasil ditambahkan!");
    fetchOperators();
  };

  const handleSaveUpdateProfile = async (data: any) => {
    const payload: any = {
      full_name: data.name,
      email: data.email,
      phone: data.phone,
    };
    if (data.password) {
      payload.password = data.password;
    }
    await userService.update(payload, data.id);
    toast.success("Profile operator berhasil diupdate!");
    fetchOperators();
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
    setIsAssignModalOpen(true);
  };

  const handleCloseAssign = () => {
    setIsAssignModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveAssignment = async (selectedUnitObj: any) => {
    try {
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
            {/* Custom Location Dropdown */}
            <div className="relative" ref={locationDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsLocationDropdownOpen(prev => !prev);
                  setLocationSearch("");
                }}
                className={`h-[46px] min-w-[200px] max-w-[280px] rounded-2xl border transition-all px-4 py-2.5 text-sm flex items-center justify-between gap-2.5 shadow-sm cursor-pointer outline-none ${
                  isLocationDropdownOpen
                    ? "border-sky-500 ring-2 ring-sky-500/20 bg-white dark:bg-slate-900"
                    : "border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-white/20"
                } text-slate-900 dark:text-slate-100`}
                title={locationFilter === "Semua" ? "Semua Lokasi" : locationFilter}
              >
                <div className="flex items-center gap-2 truncate">
                  <FaLocationDot className="text-sky-500 shrink-0 text-xs" />
                  <span className="truncate font-medium">
                    {locationFilter === "Semua" ? "Semua Lokasi" : locationFilter}
                  </span>
                </div>
                <FaChevronDown
                  className={`text-slate-400 dark:text-slate-500 shrink-0 text-xs transition-transform duration-200 ${
                    isLocationDropdownOpen ? "rotate-180 text-sky-500" : ""
                  }`}
                />
              </button>

              {isLocationDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-150">
                  {/* Search inside location dropdown */}
                  <div className="px-3 pb-2 border-b border-slate-100 dark:border-white/5">
                    <div className="relative">
                      <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                      <input
                        autoFocus
                        type="text"
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        placeholder="Cari lokasi..."
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 py-1.5 pl-8 pr-7 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                      />
                      {locationSearch && (
                        <button
                          type="button"
                          onClick={() => setLocationSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <FaXmark size={11} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-60 overflow-y-auto px-1.5 pt-1 space-y-0.5 custom-scrollbar">
                    {(!locationSearch || "semua lokasi".includes(locationSearch.toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => {
                          setLocationFilter("Semua");
                          setIsLocationDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                          locationFilter === "Semua"
                            ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-semibold"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>Semua Lokasi</span>
                        {locationFilter === "Semua" && <FaCheck className="text-sky-500 shrink-0 text-xs ml-2" />}
                      </button>
                    )}

                    {masterLocations
                      .filter(loc => loc.name?.toLowerCase().includes(locationSearch.toLowerCase()))
                      .map((loc) => {
                        const isSelected = locationFilter === loc.name;
                        return (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              setLocationFilter(loc.name);
                              setIsLocationDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-semibold"
                                : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className="truncate pr-2">{loc.name}</span>
                            {isSelected && <FaCheck className="text-sky-500 shrink-0 text-xs ml-2" />}
                          </button>
                        );
                      })}

                    {masterLocations.filter(loc => loc.name?.toLowerCase().includes(locationSearch.toLowerCase())).length === 0 &&
                      locationSearch &&
                      !"semua lokasi".includes(locationSearch.toLowerCase()) && (
                        <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                          Lokasi tidak ditemukan
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
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
              onClick={() => setIsAddOperatorModalOpen(true)}
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

      <AssignOperatorModal
        isOpen={isAssignModalOpen}
        selectedUser={selectedUser}
        masterUnits={masterUnits}
        masterLocations={masterLocations}
        onClose={handleCloseAssign}
        onSave={handleSaveAssignment}
      />

      <AddOperatorModal
        isOpen={isAddOperatorModalOpen}
        onClose={() => setIsAddOperatorModalOpen(false)}
        onSave={handleSaveAddOperator}
      />

      <UpdateOperatorProfileModal
        isOpen={isUpdateProfileModalOpen}
        initialData={updateProfileData}
        onClose={() => setIsUpdateProfileModalOpen(false)}
        onSave={handleSaveUpdateProfile}
      />
    </React.Fragment>
  );
}
