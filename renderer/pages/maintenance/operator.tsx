import React, { useState, useEffect } from "react";
import Link from "next/link";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import { FaMagnifyingGlass, FaXmark, FaPenToSquare, FaPlus } from "react-icons/fa6";
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

  const [isSearching, setIsSearching] = useState(false);

  const fetchOperators = async () => {
    try {
      setIsSearching(true);
      const data = await userService.getUsersByRole(EROLES.OPERATOR, {
        search: searchTerm || undefined,
        location: locationFilter !== "Semua" ? locationFilter : undefined,
      });
      const formattedData = data.map((user: any) => ({
        id: user.id,
        name: user.full_name,
        status: user.is_active ? "Aktif" : "Nonaktif",
        category: user.unit?.category,
        unit: user.unit,
        location: user.location?.name || "-",
        image: user.image,
        raw: user
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
  }, [searchTerm, locationFilter]);

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

  const filteredOperators = localOperators;

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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredOperators.length === 0 && (
                <div className="col-span-full rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/70 p-5 text-slate-400 dark:text-slate-600 dark:text-slate-400 text-center">
                  Tidak ada operator ditemukan.
                </div>
              )}

              {filteredOperators.map((item) => (
                <div
                  key={item.id}
                  onClick={() => router.push(`/maintenance/detail-unit?id=${item.raw.unit.id}`)}
                  className="flex flex-col rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/70 p-5 transition hover:border-amber-400/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950">
                        {item?.unit?.image || item?.category?.image ? (
                          <img src={item?.unit?.image || item?.category?.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-sky-400">
                            {getInitials(item.name)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-white/5 pt-4">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">Unit Assignment</p>
                      {!item.unit || !item.unit.id ? (
                        <p className="font-medium text-slate-500 dark:text-slate-400">
                          -
                        </p>
                      ) : (
                        <Link
                          href={`/maintenance/detail-unit?id=${item.unit.id}`}
                          className="font-medium text-amber-500 hover:text-amber-600 hover:underline dark:text-amber-400 dark:hover:text-amber-300"
                          prefetch={false}
                        >
                          {item.unit.name}
                        </Link>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">Location</p>
                      <p
                        title={item.location}
                        className={`font-medium truncate ${item.location === "-" ? "text-slate-500 dark:text-slate-400" : "text-slate-800 dark:text-slate-200"
                          }`}
                      >
                        {item.location}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {item.unit && item.unit.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnassign(item);
                        }}
                        className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition-all duration-200 hover:bg-rose-100 active:scale-95 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                      >
                        <FaXmark /> Lepas Tugas
                      </button>
                    ) : null}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAssign(item);
                      }}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
                        item.unit && item.unit.id 
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" 
                          : "col-span-2 bg-sky-500 text-white shadow-md shadow-sky-500/20 hover:bg-sky-600 hover:shadow-sky-500/40"
                      }`}
                    >
                      <FaPenToSquare /> {item.unit && item.unit.id ? "Ubah Tugas" : "Atur Penugasan"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </MaintenanceLayout>

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950/80 p-6 backdrop-blur-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
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
    </React.Fragment>
  );
}
