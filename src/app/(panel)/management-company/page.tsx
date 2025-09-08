"use client";

import React, { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  Search,
  Edit,
  Trash2,
  Building,
  Building2,
  Mail,
  Phone,
  X,
  Save,
  Loader2,
  MapPin,
  Users,
  Eye,
  Globe,
  Calendar,
  Award,
  FileText,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import apiBissaKerja from "@/lib/api-bissa-kerja";
import ManagementCompanySkeleton from "@/skeleton/ManagementCompanySkeleton";

// Base URL for images - adjust this according to your backend configuration
const BASE_IMAGE_URL = "http://localhost:8000/storage";

// Types and Interfaces for Company Management
interface Province {
  id: string;
  name: string;
}

interface Regency {
  id: string;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface CompanyApiResponse {
  id: number;
  logo: string;
  nama_perusahaan: string;
  industri: string;
  tahun_berdiri: string;
  jumlah_karyawan: string;
  province_id: string;
  regencie_id: string;
  deskripsi: string;
  no_telp: string;
  link_website: string;
  alamat_lengkap: string;
  visi: string;
  misi: string;
  nilai_nilai: string;
  sertifikat: string;
  bukti_wajib_lapor: string;
  nib: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  tiktok: string;
  status_verifikasi: string;
  catatan_verifikasi?: string;
  verified_at?: string;
  verified_by?: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  user: User;
  province: Province;
  regency: Regency;
}

interface Company {
  id: number;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  description?: string;
  status: "active" | "inactive" | "pending";
  provinceId: string;
  regencyId: string | null;
  province?: string;
  regency?: string | null;
  createdAt?: string;
  employeeCount?: string;
  logo?: string;
  industri?: string;
  tahunBerdiri?: string;
  website?: string;
  statusVerifikasi?: string;
  catatanVerifikasi?: string;
  verifiedAt?: string;
}

interface CompanyFormData {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  status: "active" | "inactive" | "pending";
  provinceId: string;
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

interface ProvinceOption {
  id: string;
  name: string;
}

// Update request interface to match API format
interface UpdateCompanyRequest {
  id: number;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  description?: string;
  status: string;
  province_id: string;
  regency_id: string;
}

const ManagementCompanyPage: React.FC = () => {
  // State declarations
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<CompanyApiResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [regencies, setRegencies] = useState<RegencyOption[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState<boolean>(false);
  const [isLoadingRegencies, setIsLoadingRegencies] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Verification states
  const [verificationStatus, setVerificationStatus] = useState<string>("");
  const [verificationNote, setVerificationNote] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    status: "active",
    provinceId: "",
    regencyId: "",
  });

  useEffect(() => {
    fetchCompanies();
    fetchProvinces();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered: Company[] = companies;

    if (searchTerm) {
      filtered = filtered.filter(
        (company: Company) =>
          company.companyName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (company.province &&
            company.province
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (company.regency &&
            company.regency.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (company: Company) => company.status === filterStatus
      );
    }

    setFilteredCompanies(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, companies]);

  // Transform API response to Company interface
  const transformApiResponseToCompany = (
    apiData: CompanyApiResponse[]
  ): Company[] => {
    return apiData.map((item) => ({
      id: item.id,
      companyName: item.nama_perusahaan,
      email: item.user.email,
      phone: item.no_telp,
      address: item.alamat_lengkap,
      description: item.deskripsi,
      status:
        item.status_verifikasi === "terverifikasi"
          ? "active"
          : item.status_verifikasi === "ditolak"
          ? "inactive"
          : "pending",
      provinceId: item.province_id,
      regencyId: item.regencie_id,
      province: item.province.name,
      regency: item.regency.name,
      createdAt: new Date(item.created_at).toLocaleDateString("id-ID"),
      employeeCount: item.jumlah_karyawan,
      logo: item.logo,
      industri: item.industri,
      tahunBerdiri: item.tahun_berdiri,
      website: item.link_website,
      statusVerifikasi: item.status_verifikasi,
      catatanVerifikasi: item.catatan_verifikasi,
      verifiedAt: item.verified_at,
    }));
  };

  // Pagination calculations
  const indexOfLastItem: number = currentPage * itemsPerPage;
  const indexOfFirstItem: number = indexOfLastItem - itemsPerPage;
  const currentItems: Company[] = filteredCompanies.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages: number = Math.ceil(filteredCompanies.length / itemsPerPage);

  // Fetch provinces from API
  const fetchProvinces = async (): Promise<void> => {
    try {
      setIsLoadingProvinces(true);
      const response = await apiBissaKerja.get(
        "account-management/get-company-by-location"
      );
      console.log("Fetched Provinces:", response.data);

      if (response.data && Array.isArray(response.data.data)) {
        setProvinces(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setProvinces(response.data);
      } else {
        setProvinces([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch provinces:", error);
      setProvinces([]);
    } finally {
      setIsLoadingProvinces(false);
    }
  };

  // Fetch regencies based on selected province
  const fetchRegencies = async (provinceId: string): Promise<void> => {
    try {
      setIsLoadingRegencies(true);
      const response = await apiBissaKerja.get(
        `account-management/get-regencies/${provinceId}`
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

  // Fetch companies from API
  const fetchCompanies = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError("");
      const response = await apiBissaKerja.get(
        "account-management/get-company-by-location"
      );

      console.log("Fetched Companies:", response.data);

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        const transformedCompanies = transformApiResponseToCompany(
          response.data.data
        );
        setCompanies(transformedCompanies);
        setFilteredCompanies(transformedCompanies);
      } else if (response.data && Array.isArray(response.data.data)) {
        const transformedCompanies = transformApiResponseToCompany(
          response.data.data
        );
        setCompanies(transformedCompanies);
        setFilteredCompanies(transformedCompanies);
      } else if (response.data && Array.isArray(response.data)) {
        const transformedCompanies = transformApiResponseToCompany(
          response.data
        );
        setCompanies(transformedCompanies);
        setFilteredCompanies(transformedCompanies);
      } else {
        console.warn("Unexpected data format:", response.data);
        setCompanies([]);
        setFilteredCompanies([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch companies:", error);
      setError("Gagal mengambil data perusahaan. Silakan coba lagi.");
      setCompanies([]);
      setFilteredCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Verification functions
  const openVerificationModal = (company: Company): void => {
    setSelectedCompany(company);
    setVerificationStatus(company.statusVerifikasi || "belum_verifikasi");
    setVerificationNote(company.catatanVerifikasi || "");
    setError("");
    setShowVerificationModal(true);
  };

  const closeVerificationModal = (): void => {
    setShowVerificationModal(false);
    setSelectedCompany(null);
    setVerificationStatus("");
    setVerificationNote("");
    setError("");
  };

  const handleVerification = async (): Promise<void> => {
    if (!selectedCompany) return;

    try {
      setIsSubmitting(true);
      setError("");

      const response = await apiBissaKerja.patch(
        `account-management/company-verification/${selectedCompany.id}`,
        {
          status_verifikasi: verificationStatus,
          catatan_verifikasi: verificationNote.trim() || null
        }
      );

      if (response.data?.message) {
        alert(response.data.message);
      } else {
        alert("Status verifikasi berhasil diperbarui!");
      }

      // Refresh data perusahaan
      await fetchCompanies();
      closeVerificationModal();

    } catch (error: any) {
      console.error("Failed to update verification status:", error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Gagal memperbarui status verifikasi. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal handlers
  const openEditModal = (company: Company): void => {
    setSelectedCompany(company);
    setFormData({
      companyName: company.companyName,
      email: company.email,
      phone: company.phone,
      address: company.address,
      description: company.description || "",
      status: company.status,
      provinceId: company.provinceId,
      regencyId: company.regencyId || "",
    });

    // Load regencies for the selected province
    if (company.provinceId) {
      fetchRegencies(company.provinceId);
    }

    setError("");
    setShowModal(true);
  };

  const openDeleteModal = (company: Company): void => {
    setSelectedCompany(company);
    setShowDeleteModal(true);
  };

  const openDetailModal = async (company: Company): Promise<void> => {
    try {
      setIsLoadingDetail(true);
      setShowDetailModal(true);

      // Fetch detailed company data from API
      const response = await apiBissaKerja.get(
        `account-management/show-company-by-location/${company.id}`
      );

      if (response.data && response.data.data) {
        setSelectedCompanyDetail(response.data.data);
      } else {
        // If specific endpoint doesn't exist, find from current companies data
        const detailedCompany = companies.find((c) => c.id === company.id);
        if (detailedCompany) {
          // Convert back to API format for consistency
          const apiFormat: CompanyApiResponse = {
            id: detailedCompany.id,
            logo: detailedCompany.logo || "",
            nama_perusahaan: detailedCompany.companyName,
            industri: detailedCompany.industri || "",
            tahun_berdiri: detailedCompany.tahunBerdiri || "",
            jumlah_karyawan: detailedCompany.employeeCount || "",
            province_id: detailedCompany.provinceId,
            regencie_id: detailedCompany.regencyId || "",
            deskripsi: detailedCompany.description || "",
            no_telp: detailedCompany.phone,
            link_website: detailedCompany.website || "",
            alamat_lengkap: detailedCompany.address,
            visi: "",
            misi: "",
            nilai_nilai: "[]",
            sertifikat: "[]",
            bukti_wajib_lapor: "",
            nib: "",
            linkedin: "",
            instagram: "",
            facebook: "",
            twitter: "",
            youtube: "",
            tiktok: "",
            status_verifikasi: detailedCompany.statusVerifikasi || "",
            catatan_verifikasi: detailedCompany.catatanVerifikasi,
            verified_at: detailedCompany.verifiedAt,
            user_id: 0,
            created_at: detailedCompany.createdAt || "",
            updated_at: "",
            user: {
              id: 0,
              name: detailedCompany.companyName,
              email: detailedCompany.email,
              avatar: "",
            },
            province: {
              id: detailedCompany.provinceId,
              name: detailedCompany.province || "",
            },
            regency: {
              id: detailedCompany.regencyId || "",
              name: detailedCompany.regency || "",
            },
          };
          setSelectedCompanyDetail(apiFormat);
        }
      }
    } catch (error) {
      console.error("Failed to fetch company details:", error);
      setError("Gagal mengambil detail perusahaan");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeModals = (): void => {
    setShowModal(false);
    setShowDeleteModal(false);
    setShowDetailModal(false);
    setShowVerificationModal(false);
    setSelectedCompany(null);
    setSelectedCompanyDetail(null);
    setError("");
  };

  // Handle province change
  const handleProvinceChange = (provinceId: string): void => {
    setFormData((prev) => ({
      ...prev,
      provinceId,
      regencyId: "",
    }));

    if (provinceId) {
      fetchRegencies(provinceId);
    } else {
      setRegencies([]);
    }
  };

  // Update function implementation
  const handleUpdate = async (companyId: number): Promise<void> => {
    try {
      setIsSubmitting(true);
      setError("");

      // Validate form data
      if (!formData.companyName.trim()) {
        throw new Error("Nama perusahaan harus diisi");
      }

      if (!formData.email.trim()) {
        throw new Error("Email harus diisi");
      }

      if (!formData.phone.trim()) {
        throw new Error("Nomor telepon harus diisi");
      }

      if (!formData.address.trim()) {
        throw new Error("Alamat harus diisi");
      }

      if (!formData.provinceId) {
        throw new Error("Provinsi harus dipilih");
      }

      if (!formData.regencyId) {
        throw new Error("Kabupaten/Kota harus dipilih");
      }

      // Prepare update data in the exact format expected by API
      const updateData: UpdateCompanyRequest = {
        id: companyId,
        company_name: formData.companyName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        description: formData.description.trim(),
        status: formData.status,
        province_id: formData.provinceId,
        regency_id: formData.regencyId,
      };

      console.log("Updating company with data:", updateData);

      const response = await apiBissaKerja.patch(
        `account-management/company-by-location/${companyId}/update`,
        updateData
      );

      console.log("Update company response:", response.data);

      // Show success message
      if (response.data?.message) {
        alert(response.data.message);
      } else {
        alert("Perusahaan berhasil diperbarui!");
      }

      // Refresh the company list after successful update
      await fetchCompanies();

      closeModals();
    } catch (error: any) {
      console.error("Failed to update company:", error);

      // Handle different types of errors
      if (error.response?.status === 422) {
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
        setError("Perusahaan tidak ditemukan");
      } else if (error.response?.status === 409) {
        setError(error.response.data?.message || "Email sudah digunakan");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Gagal memperbarui data perusahaan. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // CRUD operations - only update functionality
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (selectedCompany) {
      // Update existing company
      await handleUpdate(selectedCompany.id);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!selectedCompany) return;

    try {
      setIsSubmitting(true);

      await apiBissaKerja.delete(
        `account-management/delete-company-by-location/${selectedCompany.id}`
      );

      await fetchCompanies();
      closeModals();
    } catch (error: any) {
      console.error("Failed to delete company:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Gagal menghapus perusahaan. Silakan coba lagi.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (
    field: keyof CompanyFormData,
    value: string
  ): void => {
    if (field === "provinceId") {
      handleProvinceChange(value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

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
      case "inactive":
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "active":
        return "Terverifikasi";
      case "inactive":
        return "Ditolak";
      case "pending":
        return "Belum Verifikasi";
      default:
        return "Tidak Diketahui";
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "terverifikasi":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "ditolak":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "belum_verifikasi":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // Helper function to parse JSON arrays safely
  const parseJsonArray = (jsonString: string): string[] => {
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Helper function to format social media links
  const formatSocialLink = (url: string, platform: string) => {
    if (!url) return null;

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
      >
        {platform}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  };

  // Helper function to get full image URL
  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return "";
    return `${BASE_IMAGE_URL}/${imagePath}`;
  };

  // Statistics calculations
  const totalCompanies: number = companies.length;
  const activeCompanies: number = companies.filter(
    (company: Company) => company.status === "active"
  ).length;
  const inactiveCompanies: number = companies.filter(
    (company: Company) => company.status === "inactive"
  ).length;
  const pendingCompanies: number = companies.filter(
    (company: Company) => company.status === "pending"
  ).length;

  // Loading state
  if (isLoading) {
    return <ManagementCompanySkeleton />;
  }

  // Error state (for fetch errors, not form errors)
  if (error && !showModal && !showDeleteModal && !showVerificationModal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PageBreadcrumb pageTitle="Manajemen Perusahaan" />
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
          <button
            onClick={fetchCompanies}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageBreadcrumb pageTitle="Manajemen Perusahaan" />

      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Manajemen Perusahaan
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
              Kelola data perusahaan yang terdaftar dalam sistem
            </p>
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
                  placeholder="Cari perusahaan, email, telepon, atau wilayah..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Semua Status</option>
                <option value="active">Terverifikasi</option>
                <option value="inactive">Ditolak</option>
                <option value="pending">Belum Verifikasi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Building className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Perusahaan
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {totalCompanies}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Terverifikasi
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {activeCompanies}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <Building className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Ditolak
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {inactiveCompanies}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Building className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                  Belum Verifikasi
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingCompanies}
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
                    Tidak ada data perusahaan yang ditemukan
                  </p>
                </div>
              ) : (
                currentItems.map((company: Company) => (
                  <div
                    key={company.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                          <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {company.companyName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={getStatusBadge(company.status)}>
                              {getStatusLabel(company.status)}
                            </span>
                            {getVerificationIcon(company.statusVerifikasi || "")}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDetailModal(company)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          type="button"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openVerificationModal(company)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                          type="button"
                          title="Verifikasi"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(company)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          type="button"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(company)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          type="button"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {company.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {company.phone}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {company.province}
                        {company.regency && `, ${company.regency}`}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        {company.employeeCount} karyawan
                      </div>
                      <div>
                        <strong>Industri:</strong> {company.industri}
                      </div>
                      <div>
                        <strong>Tahun Berdiri:</strong> {company.tahunBerdiri}
                      </div>
                      <div>
                        <strong>Dibuat:</strong> {company.createdAt}
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
                    Perusahaan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Wilayah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Industri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Karyawan
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        Tidak ada data perusahaan yang ditemukan
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((company: Company) => (
                    <tr
                      key={company.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {company.companyName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={getStatusBadge(company.status)}>
                            {getStatusLabel(company.status)}
                          </span>
                          {getVerificationIcon(company.statusVerifikasi || "")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>{company.email}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {company.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>{company.province}</div>
                        {company.regency && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {company.regency}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>{company.industri}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Berdiri: {company.tahunBerdiri}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {company.employeeCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openDetailModal(company)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            type="button"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openVerificationModal(company)}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                            type="button"
                            title="Verifikasi"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(company)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            type="button"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(company)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            type="button"
                            title="Hapus"
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
                  {Math.min(indexOfLastItem, filteredCompanies.length)} dari{" "}
                  {filteredCompanies.length} data
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

        {/* Verification Modal */}
        {showVerificationModal && selectedCompany && (
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white shadow-2xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Verifikasi Perusahaan
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedCompany.companyName}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleVerification(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status Verifikasi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={verificationStatus}
                    onChange={(e) => setVerificationStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="belum_verifikasi">Belum Verifikasi</option>
                    <option value="terverifikasi">Terverifikasi</option>
                    <option value="ditolak">Ditolak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catatan Verifikasi
                  </label>
                  <textarea
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isSubmitting}
                    placeholder="Tambahkan catatan verifikasi (opsional)"
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {verificationNote.length}/1000 karakter
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeVerificationModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Award className="w-4 h-4" />
                    )}
                    {isSubmitting ? "Memperbarui..." : "Perbarui Status"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedCompanyDetail && (
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md flex items-center justify-center z-99999 p-4">
            <div className="bg-white shadow-2xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Detail Perusahaan
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Informasi lengkap perusahaan
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModals}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  type="button"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Loading state for detail */}
              {isLoadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Memuat detail perusahaan...
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Company Header with Logo and Verification Status */}
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-shrink-0">
                      {selectedCompanyDetail.logo ? (
                        <img
                          src={getImageUrl(selectedCompanyDetail.logo)}
                          alt={`Logo ${selectedCompanyDetail.nama_perusahaan}`}
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            if (target.nextElementSibling) {
                              (
                                target.nextElementSibling as HTMLElement
                              ).style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center ${
                          selectedCompanyDetail.logo ? "hidden" : "flex"
                        }`}
                      >
                        <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedCompanyDetail.nama_perusahaan}
                      </h2>
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span
                          className={getStatusBadge(
                            selectedCompanyDetail.status_verifikasi ===
                              "terverifikasi"
                              ? "active"
                              : selectedCompanyDetail.status_verifikasi ===
                                "ditolak"
                              ? "inactive"
                              : "pending"
                          )}
                        >
                          {getStatusLabel(
                            selectedCompanyDetail.status_verifikasi ===
                              "terverifikasi"
                              ? "active"
                              : selectedCompanyDetail.status_verifikasi ===
                                "ditolak"
                              ? "inactive"
                              : "pending"
                          )}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                          {selectedCompanyDetail.industri}
                        </span>
                        <div className="flex items-center gap-1">
                          {getVerificationIcon(selectedCompanyDetail.status_verifikasi)}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedCompanyDetail.status_verifikasi === "terverifikasi" && "Terverifikasi"}
                            {selectedCompanyDetail.status_verifikasi === "ditolak" && "Ditolak"}
                            {selectedCompanyDetail.status_verifikasi === "belum_verifikasi" && "Belum Verifikasi"}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {selectedCompanyDetail.deskripsi ||
                          "Tidak ada deskripsi"}
                      </p>
                      
                      {/* Verification Details */}
                      {selectedCompanyDetail.catatan_verifikasi && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                            Catatan Verifikasi:
                          </h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            {selectedCompanyDetail.catatan_verifikasi}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rest of the detail modal content remains the same... */}
                  {/* Company Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Informasi Dasar
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Tahun Berdiri:
                            </span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedCompanyDetail.tahun_berdiri}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Jumlah Karyawan:
                            </span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedCompanyDetail.jumlah_karyawan}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              NIB:
                            </span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedCompanyDetail.nib || "Tidak tersedia"}
                            </p>
                          </div>
</div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        Kontak
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Email:
                            </span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedCompanyDetail.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Telepon:
                            </span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedCompanyDetail.no_telp}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Website:
                            </span>
                            {selectedCompanyDetail.link_website ? (
                              <a
                                href={selectedCompanyDetail.link_website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                              >
                                {selectedCompanyDetail.link_website}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <p className="font-medium text-gray-900 dark:text-white">
                                Tidak tersedia
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Lokasi
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Provinsi:
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedCompanyDetail.province.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Kabupaten/Kota:
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedCompanyDetail.regency.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Alamat Lengkap:
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedCompanyDetail.alamat_lengkap}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Company Vision, Mission, Values */}
                  <div className="space-y-6">
                    {/* Vision */}
                    {selectedCompanyDetail.visi && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                          Visi
                        </h4>
                        <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                          {selectedCompanyDetail.visi}
                        </p>
                      </div>
                    )}

                    {/* Mission */}
                    {selectedCompanyDetail.misi && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
                          Misi
                        </h4>
                        <p className="text-green-700 dark:text-green-300 leading-relaxed">
                          {selectedCompanyDetail.misi}
                        </p>
                      </div>
                    )}

                    {/* Values */}
                    {selectedCompanyDetail.nilai_nilai && 
                     selectedCompanyDetail.nilai_nilai !== "[]" && 
                     parseJsonArray(selectedCompanyDetail.nilai_nilai).length > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3">
                          Nilai-Nilai
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-purple-700 dark:text-purple-300">
                          {parseJsonArray(selectedCompanyDetail.nilai_nilai).map(
                            (value: string, index: number) => (
                              <li key={index}>{value}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Social Media Links */}
                  {(selectedCompanyDetail.linkedin ||
                    selectedCompanyDetail.instagram ||
                    selectedCompanyDetail.facebook ||
                    selectedCompanyDetail.twitter ||
                    selectedCompanyDetail.youtube ||
                    selectedCompanyDetail.tiktok) && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Media Sosial
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {formatSocialLink(selectedCompanyDetail.linkedin, "LinkedIn")}
                        {formatSocialLink(selectedCompanyDetail.instagram, "Instagram")}
                        {formatSocialLink(selectedCompanyDetail.facebook, "Facebook")}
                        {formatSocialLink(selectedCompanyDetail.twitter, "Twitter")}
                        {formatSocialLink(selectedCompanyDetail.youtube, "YouTube")}
                        {formatSocialLink(selectedCompanyDetail.tiktok, "TikTok")}
                      </div>
                    </div>
                  )}

                  {/* Certificates */}
                  {selectedCompanyDetail.sertifikat && 
                   selectedCompanyDetail.sertifikat !== "[]" && 
                   parseJsonArray(selectedCompanyDetail.sertifikat).length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Sertifikat
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {parseJsonArray(selectedCompanyDetail.sertifikat).map(
                          (cert: string, index: number) => (
                            <div
                              key={index}
                              className="bg-white dark:bg-gray-800 p-3 rounded border border-orange-200 dark:border-orange-800"
                            >
                              <p className="text-sm text-orange-700 dark:text-orange-300">
                                {cert}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Company Registration Details */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Informasi Registrasi
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Bukti Wajib Lapor:
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedCompanyDetail.bukti_wajib_lapor || "Tidak tersedia"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Tanggal Dibuat:
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedCompanyDetail.created_at).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      {selectedCompanyDetail.verified_at && (
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Tanggal Verifikasi:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(selectedCompanyDetail.verified_at).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex justify-end">
                  <button
                    onClick={closeModals}
                    className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    type="button"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showModal && selectedCompany && (
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white shadow-2xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit Perusahaan
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Perbarui informasi perusahaan
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nama Perusahaan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFormChange("companyName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                      disabled={isSubmitting}
                      maxLength={255}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                      maxLength={255}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFormChange("phone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                      disabled={isSubmitting}
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleFormChange("status", e.target.value as "active" | "inactive" | "pending")
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="active">Terverifikasi</option>
                      <option value="inactive">Ditolak</option>
                      <option value="pending">Belum Verifikasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Provinsi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.provinceId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleFormChange("provinceId", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                      disabled={isSubmitting || isLoadingProvinces}
                    >
                      <option value="">Pilih Provinsi</option>
                      {provinces.map((province: ProvinceOption) => (
                        <option key={province.id} value={province.id}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kabupaten/Kota <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.regencyId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleFormChange("regencyId", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                      disabled={isSubmitting || isLoadingRegencies || !formData.provinceId}
                    >
                      <option value="">Pilih Kabupaten/Kota</option>
                      {regencies.map((regency: RegencyOption) => (
                        <option key={regency.id} value={regency.id}>
                          {regency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleFormChange("address", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={isSubmitting}
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleFormChange("description", e.target.value)
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={isSubmitting}
                    maxLength={1000}
                    placeholder="Deskripsi singkat tentang perusahaan"
                  />
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
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedCompany && (
          <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white shadow-2xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Hapus Perusahaan
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Konfirmasi penghapusan
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Apakah Anda yakin ingin menghapus perusahaan berikut?
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedCompany.companyName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedCompany.email}
                  </p>
                </div>
                <p className="text-red-600 dark:text-red-400 text-sm mt-3 font-medium">
                  Tindakan ini tidak dapat dibatalkan!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default ManagementCompanyPage;