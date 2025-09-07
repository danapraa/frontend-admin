"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Mail,
  UserCheck,
  X,
  Save,
  Loader2,
  Download,
} from "lucide-react";
import apiBissaKerja from "@/lib/api-bissa-kerja";
import ManagementAdminSkeleton from "@/skeleton/ManagementAdminSkeleton";

// Types and Interfaces based on API response
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  remember_token: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Province {
  id: string;
  name: string;
}

interface Regency {
  id: string;
  name: string;
}

interface AdminApiResponse {
  id: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  province_id: string;
  regencie_id: string | null;
  deleted_at: string | null;
  status: string; // Field status dari database
  user: User;
  province: Province;
  regencies: Regency | null;
}

interface Admin {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "admin";
  status: "active" | "nonactive";
  avatar: string;
  regencyId: string | null;
  company?: string;
  createdAt?: string;
  lastLogin?: string;
  province?: string;
  regency?: string | null;
}

interface AdminFormData {
  name: string;
  email: string;
  password: string;
  role: "admin";
  status: "active" | "nonactive";
  regencyId: string;
}

interface RegencyOption {
  id: string;
  name: string;
  province: {
    id: string;
    name: string;
  };
}

// Create request interface to match API format
interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  regencie_id: string;
  status: string;
}

// Update request interface to match API format
interface UpdateAdminRequest {
  id: number;
  name: string;
  email: string;
  password?: string;
  regencie_id: string;
  status: string;
}

const ManagementAdminPage: React.FC = () => {
  // State declarations
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [regencies, setRegencies] = useState<RegencyOption[]>([]);
  const [isLoadingRegencies, setIsLoadingRegencies] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  // Form state
  const [formData, setFormData] = useState<AdminFormData>({
    name: "",
    email: "",
    password: "",
    role: "admin",
    status: "active",
    regencyId: "",
  });

  // Notification helper
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  // Export function
  const handleExport = async (): Promise<void> => {
    try {
      if (filteredAdmins.length === 0) {
        showNotification("error", "Tidak ada data untuk diekspor");
        return;
      }

      // Create CSV content from filtered data
      const headers = [
        "No",
        "Nama Admin",
        "Email",
        "Status",
        "Provinsi",
        "Kabupaten/Kota",
        "Tanggal Dibuat",
      ];
      
      const csvContent = [
        headers.join(","),
        ...filteredAdmins.map((admin: Admin, index: number) =>
          [
            index + 1,
            `"${admin.name}"`,
            `"${admin.email}"`,
            `"${getStatusLabel(admin.status)}"`,
            `"${admin.province || '-'}"`,
            `"${admin.regency || '-'}"`,
            `"${admin.createdAt || '-'}"`,
          ].join(",")
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `data-admin-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification("success", "Data berhasil diekspor");
    } catch (error: any) {
      showNotification("error", "Terjadi kesalahan saat mengekspor data");
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchRegencies();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered: Admin[] = admins;

    if (searchTerm) {
      filtered = filtered.filter(
        (admin: Admin) =>
          admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (admin.company &&
            admin.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (admin.province &&
            admin.province.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (admin.regency &&
            admin.regency.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (admin: Admin) => admin.status === filterStatus
      );
    }

    setFilteredAdmins(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, admins]);

  // Transform API response to Admin interface
  const transformApiResponseToAdmin = (
    apiData: AdminApiResponse[]
  ): Admin[] => {
    return apiData.map((item) => ({
      id: item.id,
      name: item.user.name,
      email: item.user.email,
      password: "", // Don't store password
      role: "admin" as const,
      status: item.status as "active" | "nonactive", // Gunakan status langsung dari database
      company: item.regencies ? item.regencies.name : item.province.name,
      createdAt: new Date(item.created_at).toLocaleDateString("id-ID"),
      lastLogin: "Tidak diketahui",
      avatar: item.user.avatar,
      province: item.province.name,
      regency: item.regencies?.name || null,
      regencyId: item.regencie_id,
    }));
  };

  // Pagination calculations
  const indexOfLastItem: number = currentPage * itemsPerPage;
  const indexOfFirstItem: number = indexOfLastItem - itemsPerPage;
  const currentItems: Admin[] = filteredAdmins.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages: number = Math.ceil(filteredAdmins.length / itemsPerPage);

  // Fetch regencies from API
  const fetchRegencies = async (): Promise<void> => {
    try {
      setIsLoadingRegencies(true);
      const response = await apiBissaKerja.get(
        "superadmin/get-regency-by-admin-role"
      );
      console.log("Fetched Regencies:", response.data);

      if (response.data && Array.isArray(response.data.data)) {
        setRegencies(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setRegencies(response.data);
      } else {
        setRegencies([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch regencies:", error);
      setRegencies([]);
    } finally {
      setIsLoadingRegencies(false);
    }
  };

  // Fetch admins from API
  const fetchAdmins = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError("");
      const response = await apiBissaKerja.get(
        "superadmin/get-admin-role-by-location"
      );

      if (response.data && Array.isArray(response.data.data)) {
        const transformedAdmins = transformApiResponseToAdmin(
          response.data.data
        );
        setAdmins(transformedAdmins);
        setFilteredAdmins(transformedAdmins);
      } else if (response.data && Array.isArray(response.data)) {
        const transformedAdmins = transformApiResponseToAdmin(response.data);
        setAdmins(transformedAdmins);
        setFilteredAdmins(transformedAdmins);
      } else {
        throw new Error("Format data tidak sesuai");
      }
    } catch (error: any) {
      console.error("Failed to fetch admins:", error);
      setError("Gagal mengambil data admin. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Modal handlers
  const openCreateModal = (): void => {
    setSelectedAdmin(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "admin",
      status: "active",
      regencyId: "",
    });
    setError(""); // Clear any previous errors
    setShowModal(true);
  };

  const openEditModal = (admin: Admin): void => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "", // Password kosong untuk edit
      role: admin.role,
      status: admin.status,
      regencyId: admin.regencyId || "",
    });
    setError(""); // Clear any previous errors
    setShowModal(true);
  };

  const openDeleteModal = (admin: Admin): void => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const closeModals = (): void => {
    setShowModal(false);
    setShowDeleteModal(false);
    setSelectedAdmin(null);
    setError(""); // Clear any errors when closing modal
  };

  // Update function implementation
  const handleUpdate = async (adminId: number): Promise<void> => {
    try {
      setIsSubmitting(true);
      setError("");

      // Validate form data
      if (!formData.name.trim()) {
        throw new Error("Nama lengkap harus diisi");
      }

      if (!formData.email.trim()) {
        throw new Error("Email harus diisi");
      }

      if (!formData.regencyId) {
        throw new Error("Wilayah harus dipilih");
      }

      if (formData.password && formData.password.length < 8) {
        throw new Error("Password minimal 8 karakter");
      }

      // Prepare update data in the exact format expected by API
      const updateData: UpdateAdminRequest = {
        id: adminId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        regencie_id: formData.regencyId,
        status: formData.status,
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        updateData.password = formData.password.trim();
      }

      console.log("Updating admin with data:", updateData);

      const response = await apiBissaKerja.patch(
        `superadmin/admin-role-by-location/${adminId}/update`,
        updateData
      );

      console.log("Update admin response:", response.data);

      // Refresh the admin list after successful update
      await fetchAdmins();

      closeModals();
    } catch (error: any) {
      console.error("Failed to update admin:", error);

      // Handle different types of errors
      if (error.response?.status === 422) {
        // Validation errors from backend
        const validationErrors = error.response.data?.errors;
        if (validationErrors) {
          const errorMessages = Object.entries(validationErrors)
            .map(([field, messages]: [string, any]) => {
              if (Array.isArray(messages)) {
                return messages.join(", ");
              }
              return messages;
            })
            .join("; ");
          setError(errorMessages);
        } else {
          setError(
            error.response.data?.message || "Terjadi kesalahan validasi"
          );
        }
      } else if (error.response?.status === 404) {
        setError("Admin tidak ditemukan");
      } else if (error.response?.status === 409) {
        // Conflict error (e.g., email already exists)
        setError(error.response.data?.message || "Email sudah digunakan");
      } else if (error.response?.data?.message) {
        // Other API errors
        setError(error.response.data.message);
      } else if (error.message) {
        // Custom validation errors
        setError(error.message);
      } else {
        // Generic error
        setError("Gagal memperbarui data admin. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // CRUD operations
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (selectedAdmin) {
      // Update existing admin
      await handleUpdate(selectedAdmin.id);
    } else {
      // Create new admin
      setIsSubmitting(true);
      setError("");

      try {
        // Validate form data for create
        if (!formData.name.trim()) {
          throw new Error("Nama lengkap harus diisi");
        }

        if (!formData.email.trim()) {
          throw new Error("Email harus diisi");
        }

        if (!formData.regencyId) {
          throw new Error("Wilayah harus dipilih");
        }

        if (!formData.password.trim()) {
          throw new Error("Password harus diisi untuk admin baru");
        }

        if (formData.password.length < 8) {
          throw new Error("Password minimal 8 karakter");
        }

        const selectedRegency = regencies.find(
          (r) => r.id === formData.regencyId
        );

        if (!selectedRegency) {
          throw new Error("Wilayah yang dipilih tidak valid");
        }

        // Prepare data in the exact format expected by API
        const createData: CreateAdminRequest = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          regencie_id: formData.regencyId,
          status: formData.status,
        };

        console.log("Creating admin with data:", createData);

        const response = await apiBissaKerja.post(
          "superadmin/create-admin-role-by-location",
          createData
        );

        console.log("Create admin response:", response.data);

        // Show success message
        if (response.data?.message) {
          showNotification("success", response.data.message);
        } else {
          showNotification("success", "Admin berhasil dibuat!");
        }

        await fetchAdmins();
        closeModals();
      } catch (error: any) {
        console.error("Failed to save admin:", error);

        // Handle different types of errors
        if (error.response?.status === 422) {
          // Validation errors from backend
          const validationErrors = error.response.data?.errors;
          if (validationErrors) {
            const errorMessages = Object.entries(validationErrors)
              .map(([field, messages]: [string, any]) => {
                if (Array.isArray(messages)) {
                  return messages.join(", ");
                }
                return messages;
              })
              .join("; ");
            setError(errorMessages);
          } else {
            setError(
              error.response.data?.message || "Terjadi kesalahan validasi"
            );
          }
        } else if (error.response?.status === 409) {
          // Conflict error (e.g., email already exists)
          setError(error.response.data?.message || "Email sudah digunakan");
        } else if (error.response?.data?.message) {
          // Other API errors
          setError(error.response.data.message);
        } else if (error.message) {
          // Custom validation errors
          setError(error.message);
        } else {
          // Generic error
          setError("Gagal menyimpan data admin. Silakan coba lagi.");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!selectedAdmin) return;

    try {
      setIsSubmitting(true);

      // TODO: Implement API delete call here when endpoint is available
      await apiBissaKerja.delete(
        `superadmin/delete-admin-role-by-location/${selectedAdmin.id}`
      );

      // Temporary local deletion
      setAdmins(admins.filter((admin: Admin) => admin.id !== selectedAdmin.id));
      closeModals();

      // TODO: Refresh data after delete when API is available
      // await fetchAdmins();
    } catch (error: any) {
      console.error("Failed to delete admin:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Gagal menghapus admin. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (
    field: keyof AdminFormData,
    value: string
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  // Utility functions
  const getStatusBadge = (status: string): string => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "active":
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case "nonactive":
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
    }
  };

  const getStatusLabel = (status: string): string => {
    return status === "active" ? "Aktif" : "Tidak Aktif";
  };

  // Statistics calculations
  const totalAdmins: number = admins.length;
  const activeAdmins: number = admins.filter(
    (admin: Admin) => admin.status === "active"
  ).length;
  const inactiveAdmins: number = admins.filter(
    (admin: Admin) => admin.status === "nonactive"
  ).length;

  // Loading state
  if (isLoading) {
    return <ManagementAdminSkeleton />;
  }

  // Error state (for fetch errors, not form errors)
  if (error && !showModal && !showDeleteModal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PageBreadcrumb pageTitle="Manajemen Admin" />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
          <button
            onClick={fetchAdmins}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Notification component
  const renderNotification = () =>
    notification.show && (
      <div
        className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === "success"
            ? "bg-green-100 border border-green-500 text-green-700"
            : "bg-red-100 border border-red-500 text-red-700"
        }`}
      >
        <div className="flex items-center">
          {notification.type === "success" ? (
            <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center mr-3">
              <span className="text-xs">✓</span>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center mr-3">
              <span className="text-xs">!</span>
            </div>
          )}
          <span className="font-medium">{notification.message}</span>
          <button
            onClick={() =>
              setNotification((prev) => ({ ...prev, show: false }))
            }
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Notification */}
      {renderNotification()}

      <PageBreadcrumb pageTitle="Manajemen Admin" />

      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Manajemen Admin
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
                Kelola akun administrator sistem
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={isLoading || filteredAdmins.length === 0}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} className="mr-2" />
                Export
              </button>
              <button
                onClick={openCreateModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="sm:inline">Tambah Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Cari admin, email, provinsi, atau kabupaten..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-auto">
              <select
                value={filterStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilterStatus(e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="nonactive">Tidak Aktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Admin
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {totalAdmins}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Admin Aktif
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {activeAdmins}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Admin Tidak Aktif
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {inactiveAdmins}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="space-y-4 p-4">
              {currentItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Tidak ada data admin yang ditemukan
                  </p>
                </div>
              ) : (
                currentItems.map((admin: Admin) => (
                  <div
                    key={admin.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          {admin.avatar ? (
                            <img
                              src={admin.avatar}
                              alt={admin.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {admin.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {admin.name}
                          </p>
                          <span className={getStatusBadge(admin.status)}>
                            {getStatusLabel(admin.status)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(admin)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          type="button"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(admin)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {admin.email}
                      </div>
                      <div>
                        <strong>Wilayah:</strong> {admin.province}
                        {admin.regency && ` - ${admin.regency}`}
                      </div>
                      <div>
                        <strong>Dibuat:</strong> {admin.createdAt}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Wilayah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dibuat
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Tidak ada data admin yang ditemukan
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((admin: Admin) => (
                    <tr
                      key={admin.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              {admin.avatar ? (
                                <img
                                  src={admin.avatar}
                                  alt={admin.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                  {admin.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {admin.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {admin.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(admin.status)}>
                          {getStatusLabel(admin.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>{admin.province}</div>
                        {admin.regency && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {admin.regency}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {admin.createdAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            type="button"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(admin)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Menampilkan {indexOfFirstItem + 1} sampai{" "}
                  {Math.min(indexOfLastItem, filteredAdmins.length)} dari{" "}
                  {filteredAdmins.length} data
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md  flex items-center justify-center z-99999 p-4">
            <div className="bg-white shadow-2xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedAdmin ? "Edit Admin" : "Tambah Admin Baru"}
                </h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  type="button"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Display error message in modal */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleFormChange("name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={isSubmitting}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleFormChange("email", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={isSubmitting}
                    placeholder="Masukkan alamat email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password{" "}
                    {selectedAdmin ? (
                      "(Kosongkan jika tidak ingin mengubah)"
                    ) : (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleFormChange("password", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required={!selectedAdmin}
                    disabled={isSubmitting}
                    minLength={8}
                    placeholder={
                      selectedAdmin
                        ? "Masukkan password baru (opsional)"
                        : "Masukkan password"
                    }
                  />
                  {!selectedAdmin && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Password minimal 8 karakter
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Wilayah <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.regencyId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleFormChange("regencyId", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={isLoadingRegencies || isSubmitting}
                  >
                    <option value="">
                      {isLoadingRegencies
                        ? "Memuat wilayah..."
                        : "Pilih Wilayah"}
                    </option>
                    {regencies.map((regency) => (
                      <option key={regency.id} value={regency.id}>
                        {regency.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingRegencies && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memuat data wilayah...
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      handleFormChange(
                        "status",
                        e.target.value as Admin["status"]
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isSubmitting}
                  >
                    <option value="active">Aktif</option>
                    <option value="nonactive">Tidak Aktif</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoadingRegencies || isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSubmitting
                      ? selectedAdmin
                        ? "Memperbarui..."
                        : "Menyimpan..."
                      : selectedAdmin
                      ? "Perbarui"
                      : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedAdmin && (
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md flex items-center justify-center z-99999 p-4">
            <div className="bg-white shadow-2xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Hapus Admin
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded text-sm">
                  {error}
                </div>
              )}

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Apakah Anda yakin ingin menghapus admin{" "}
                <strong>{selectedAdmin.name}</strong>? Data yang dihapus tidak
                dapat dikembalikan.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  type="button"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  type="button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {isSubmitting ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagementAdminPage;