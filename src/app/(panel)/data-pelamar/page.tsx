"use client";

import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  Users,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  FileCheck,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Sparkles,
  X,
  Building2,
  ChevronDown,
  User,
  WifiOff,
  ServerCrash,
  Download,
} from "lucide-react";
import apiBissaKerja from "@/lib/api-bissa-kerja";

// Interface untuk response API yang sudah disesuaikan
interface JobApplication {
  id: number;
  lowongan_id: number;
  user_id: number;
  status: "pending" | "reviewed" | "accepted" | "rejected" | "interview";
  feedback: string | null;
  applied_at: string | null;
  reviewed_at: string | null;
  interview_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    created_at: string;
    updated_at: string;
    remember_token: string | null;
    deleted_at: string | null;
  };
  lowongan: {
    id: number;
    job_title: string;
    job_type: string;
    description: string;
    responsibilities: string;
    requirements: string;
    education: string;
    experience: string;
    salary_range: string;
    benefits: string;
    location: string;
    application_deadline: string;
    accessibility_features: string;
    work_accommodations: string;
    skills: string[];
    is_active: number;
    perusahaan_profile_id: number;
    created_at: string;
    updated_at: string;
    perusahaan_profile: {
      id: number;
      logo: string | null;
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
      linkedin: string | null;
      instagram: string | null;
      facebook: string | null;
      twitter: string | null;
      youtube: string | null;
      tiktok: string | null;
      status_verifikasi: string;
      user_id: number;
      created_at: string;
      updated_at: string;
    };
    disabilitas: Array<{
      id: number;
      kategori_disabilitas: string;
      tingkat_disabilitas: string;
      created_at: string;
      updated_at: string;
      pivot: {
        post_lowongan_id: number;
        disabilitas_id: number;
      };
    }>;
  };
}

export default function AllApplicantsPage() {
  // Development mode flag - set to false to disable API calls entirely
  const DEVELOPMENT_MODE = false; // Changed to false to enable API calls
  const USE_MOCK_DATA_ONLY = false; // Set to false to try API calls first

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    JobApplication[]
  >([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0,
    interview: 0,
  });
  const [companies, setCompanies] = useState<
    Array<{ id: number; nama_perusahaan: string }>
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedApplicant, setSelectedApplicant] =
    useState<JobApplication | null>(null);
  const [showApplicantModal, setShowApplicantModal] = useState<boolean>(false);

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Client-side filtering dan sorting
  useEffect(() => {
    let filtered = applications;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (app) =>
          app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.lowongan.job_title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (app.lowongan.perusahaan_profile?.nama_perusahaan || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Company filter
    if (companyFilter !== "all") {
      filtered = filtered.filter(
        (app) => app.lowongan.perusahaan_profile_id.toString() === companyFilter
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "name":
          return a.user.name.localeCompare(b.user.name);
        case "company":
          return (
            a.lowongan.perusahaan_profile?.nama_perusahaan || ""
          ).localeCompare(b.lowongan.perusahaan_profile?.nama_perusahaan || "");
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  }, [applications, searchTerm, statusFilter, companyFilter, sortBy]);

  const fetchAllData = async (): Promise<void> => {
    try {
      setLoading(true);
      setUsingMockData(false);

      // If we're in development mode and want to use mock data only, skip API calls
      if (DEVELOPMENT_MODE && USE_MOCK_DATA_ONLY) {
        console.log("🧪 Development mode: Using mock data only");
        setUsingMockData(true);
        return;
      }

      // Try to fetch real data with retry mechanism
      await fetchWithRetry();
    } catch (err) {
      // Set error for display

      // For now, don't fallback to mock data - show error instead
      setApplications([]);
      setFilteredApplications([]);
      setStats({
        total: 0,
        pending: 0,
        reviewed: 0,
        accepted: 0,
        rejected: 0,
        interview: 0,
      });
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithRetry = async (retries = 2): Promise<void> => {
    for (let i = 0; i <= retries; i++) {
      try {
        // Call the main applications fetch function
        await fetchApplications();

        // Success - break out of retry loop
        break;
      } catch (error) {
        if (i === retries) {
          // Last retry failed
          throw error;
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  };

  const fetchApplications = async (): Promise<void> => {
    try {
      console.log("Fetching applications from API...");

      const response = await apiBissaKerja.get("/master-data-pelamar");

      console.log("API Response:", response.data);

      if (response.data && response.data.success) {
        const applicationsData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        console.log("Applications data:", applicationsData);

        setApplications(applicationsData);
        setFilteredApplications(applicationsData);

        // Calculate stats from the fetched data
        calculateStatsFromData(applicationsData);

        // Extract companies from the data
        extractCompaniesFromData(applicationsData);
      } else {
        throw new Error(
          response.data?.message || "Invalid response format from server"
        );
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      throw error;
    }
  };

  const calculateStatsFromData = (data: JobApplication[]) => {
    const statsCalc = {
      total: data.length,
      pending: data.filter((app) => app.status === "pending").length,
      reviewed: data.filter((app) => app.status === "reviewed").length,
      accepted: data.filter((app) => app.status === "accepted").length,
      rejected: data.filter((app) => app.status === "rejected").length,
      interview: data.filter((app) => app.status === "interview").length,
    };
    setStats(statsCalc);
  };

  const extractCompaniesFromData = (data: JobApplication[]) => {
    const uniqueCompanies = data.reduce((companies, app) => {
      const company = app.lowongan.perusahaan_profile;
      if (company && !companies.find((c) => c.id === company.id)) {
        companies.push({
          id: company.id,
          nama_perusahaan: company.nama_perusahaan,
        });
      }
      return companies;
    }, [] as Array<{ id: number; nama_perusahaan: string }>);
    setCompanies(uniqueCompanies);
  };

  const handleRefresh = async () => {
    await fetchAllData();
  };

  // Export function for applicants data
  const handleExport = async () => {
    try {
      if (filteredApplications.length === 0) {
        showNotification("error", "Tidak ada data untuk diekspor");
        return;
      }

      // Create CSV content from filtered data
      const headers = [
        "No",
        "Nama Pelamar",
        "Email",
        "Posisi",
        "Perusahaan",
        "Industri",
        "Lokasi",
        "Tipe Kerja",
        "Status",
        "Gaji",
        "Pendidikan",
        "Pengalaman",
        "Tanggal Melamar",
        "Kategori Disabilitas",
        "Tingkat Disabilitas",
        "Feedback",
      ];

      const csvContent = [
        headers.join(","),
        ...filteredApplications.map((app: JobApplication, index: number) => [
          index + 1,
          `"${app.user.name}"`,
          `"${app.user.email}"`,
          `"${app.lowongan.job_title}"`,
          `"${app.lowongan.perusahaan_profile?.nama_perusahaan || "N/A"}"`,
          `"${app.lowongan.perusahaan_profile?.industri || "N/A"}"`,
          `"${app.lowongan.location}"`,
          `"${app.lowongan.job_type}"`,
          `"${getStatusConfig(app.status).label}"`,
          `"${app.lowongan.salary_range}"`,
          `"${app.lowongan.education}"`,
          `"${app.lowongan.experience}"`,
          `"${formatDate(app.applied_at || app.created_at)}"`,
          `"${app.lowongan.disabilitas?.map(d => d.kategori_disabilitas).join("; ") || "N/A"}"`,
          `"${app.lowongan.disabilitas?.map(d => d.tingkat_disabilitas).join("; ") || "N/A"}"`,
          `"${app.feedback || "N/A"}"`,
        ].join(",")),
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
        `data-pelamar-${new Date().toISOString().split("T")[0]}.csv`
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

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Menunggu",
          color:
            "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
          icon: Clock,
        };
      case "reviewed":
        return {
          label: "Direview",
          color:
            "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
          icon: FileCheck,
        };
      case "accepted":
        return {
          label: "Diterima",
          color:
            "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
          icon: CheckCircle,
        };
      case "rejected":
        return {
          label: "Ditolak",
          color:
            "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
          icon: XCircle,
        };
      case "interview":
        return {
          label: "Interview",
          color:
            "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
          icon: MessageSquare,
        };
      default:
        return {
          label: "Unknown",
          color:
            "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600",
          icon: AlertCircle,
        };
    }
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ): void => {
    const target = e.target as HTMLImageElement;
    target.src =
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(target.alt || "User") +
      "&background=6366f1&color=fff&size=128";
  };

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <PageBreadcrumb pageTitle="Data Pelamar" />
        <div className="container mx-auto py-6">
          <div className="animate-pulse space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Notification */}
      {renderNotification()}

      <PageBreadcrumb pageTitle="Data Pelamar" />

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                <Users className="w-7 h-7 mr-3 text-blue-500 dark:text-blue-400" />
                Data Pelamar
                {usingMockData && (
                  <span className="ml-3 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                    Demo Data
                  </span>
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Semua data pelamar dari seluruh perusahaan yang terdaftar
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={loading || filteredApplications.length === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            {
              label: "Total Pelamar",
              value: stats.total,
              color: "blue",
              icon: Users,
            },
            {
              label: "Menunggu",
              value: stats.pending,
              color: "amber",
              icon: Clock,
            },
            {
              label: "Direview",
              value: stats.reviewed,
              color: "blue",
              icon: FileCheck,
            },
            {
              label: "Interview",
              value: stats.interview,
              color: "purple",
              icon: MessageSquare,
            },
            {
              label: "Diterima",
              value: stats.accepted,
              color: "emerald",
              icon: CheckCircle,
            },
            {
              label: "Ditolak",
              value: stats.rejected,
              color: "red",
              icon: XCircle,
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
              amber:
                "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
              purple:
                "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
              emerald:
                "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
              red: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
            };

            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      colorClasses[stat.color as keyof typeof colorClasses]
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-2xl font-bold ${
                      colorClasses[
                        stat.color as keyof typeof colorClasses
                      ].split(" ")[0]
                    }`}
                  >
                    {stat.value.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium truncate">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Cari nama, email, posisi, atau perusahaan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all text-gray-900 dark:text-white w-full"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="reviewed">Direview</option>
                <option value="interview">Interview</option>
                <option value="accepted">Diterima</option>
                <option value="rejected">Ditolak</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all text-gray-900 dark:text-white w-full"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="name">Nama A-Z</option>
                <option value="company">Perusahaan A-Z</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Applicants List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Tidak Ada Data
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== "all" || companyFilter !== "all"
                  ? "Tidak ada pelamar yang sesuai dengan filter"
                  : "Belum ada data pelamar"}
              </p>
            </div>
          ) : (
            filteredApplications.map((application) => {
              const statusConfig = getStatusConfig(application.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={application.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Applicant Info */}
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        {application.user.avatar ? (
                          <img
                            src={application.user.avatar}
                            alt={application.user.name}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-white dark:border-gray-700 shadow-md"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl border-2 border-white dark:border-gray-700 shadow-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {application.user.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {application.user.email}
                            </p>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color} flex items-center flex-shrink-0`}
                          >
                            <StatusIcon className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center min-w-0">
                            <Briefcase className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                            <span className="truncate font-medium">
                              {application.lowongan.job_title}
                            </span>
                          </div>
                          <div className="flex items-center min-w-0">
                            <Building2 className="w-4 h-4 mr-2 text-green-500 dark:text-green-400 flex-shrink-0" />
                            <span className="truncate">
                              {application.lowongan.perusahaan_profile
                                ?.nama_perusahaan || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                            <span className="truncate">
                              {application.lowongan.location}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                            <span className="truncate">
                              Melamar:{" "}
                              {formatDate(
                                application.applied_at || application.created_at
                              )}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                            <span className="truncate">
                              {application.lowongan.perusahaan_profile
                                ?.no_telp || "N/A"}
                            </span>
                          </div>
                          {application.lowongan.disabilitas &&
                            application.lowongan.disabilitas.length > 0 && (
                              <div className="flex items-center">
                                <GraduationCap className="w-4 h-4 mr-2 text-red-500 dark:text-red-400 flex-shrink-0" />
                                <span className="truncate text-xs">
                                  {
                                    application.lowongan.disabilitas[0]
                                      .kategori_disabilitas
                                  }
                                </span>
                              </div>
                            )}
                        </div>

                        {application.status === "rejected" &&
                          application.feedback && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <p className="text-sm text-red-800 dark:text-red-300">
                                <span className="font-medium">Feedback: </span>
                                {application.feedback}
                              </p>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedApplicant(application);
                          setShowApplicantModal(true);
                        }}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal for Applicant Detail */}
      {showApplicantModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-99999 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {selectedApplicant.user.avatar ? (
                    <img
                      src={selectedApplicant.user.avatar}
                      alt={selectedApplicant.user.name}
                      className="w-16 h-16 rounded-xl object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedApplicant.user.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedApplicant.user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApplicantModal(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Posisi:
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedApplicant.lowongan.job_title}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Perusahaan:
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedApplicant.lowongan.perusahaan_profile
                      ?.nama_perusahaan || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Lokasi:
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedApplicant.lowongan.location}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Status:
                  </span>
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      getStatusConfig(selectedApplicant.status).color
                    }`}
                  >
                    {React.createElement(
                      getStatusConfig(selectedApplicant.status).icon,
                      { className: "w-4 h-4 mr-2" }
                    )}
                    {getStatusConfig(selectedApplicant.status).label}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Tanggal Melamar:
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatDate(
                      selectedApplicant.applied_at ||
                        selectedApplicant.created_at
                    )}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Tipe Kerja:
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {selectedApplicant.lowongan.job_type}
                  </p>
                </div>
              </div>

              {/* Job Details */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Detail Lowongan
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Deskripsi:
                    </span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedApplicant.lowongan.description}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Requirements:
                    </span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedApplicant.lowongan.requirements}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Pendidikan:
                    </span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedApplicant.lowongan.education}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Pengalaman:
                    </span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedApplicant.lowongan.experience}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      Gaji:
                    </span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {selectedApplicant.lowongan.salary_range}
                    </p>
                  </div>
                  {selectedApplicant.lowongan.skills &&
                    selectedApplicant.lowongan.skills.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Skills:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedApplicant.lowongan.skills.map(
                            (skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-lg"
                              >
                                {skill}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Company Information */}
              {selectedApplicant.lowongan.perusahaan_profile && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Informasi Perusahaan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">
                        Industri:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedApplicant.lowongan.perusahaan_profile.industri}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">
                        Tahun Berdiri:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {
                          selectedApplicant.lowongan.perusahaan_profile
                            .tahun_berdiri
                        }
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">
                        Jumlah Karyawan:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {
                          selectedApplicant.lowongan.perusahaan_profile
                            .jumlah_karyawan
                        }
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">
                        No. Telepon:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {selectedApplicant.lowongan.perusahaan_profile.no_telp}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-medium text-gray-600 dark:text-gray-400">
                        Alamat:
                      </span>
                      <p className="text-gray-900 dark:text-white">
                        {
                          selectedApplicant.lowongan.perusahaan_profile
                            .alamat_lengkap
                        }
                      </p>
                    </div>
                    {selectedApplicant.lowongan.perusahaan_profile
                      .link_website && (
                      <div className="sm:col-span-2">
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          Website:
                        </span>
                        <a
                          href={
                            selectedApplicant.lowongan.perusahaan_profile
                              .link_website
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline ml-2"
                        >
                          {
                            selectedApplicant.lowongan.perusahaan_profile
                              .link_website
                          }
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Disability Information */}
              {selectedApplicant.lowongan.disabilitas &&
                selectedApplicant.lowongan.disabilitas.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
                      Kategori Disabilitas yang Dibutuhkan
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplicant.lowongan.disabilitas.map(
                        (disability) => (
                          <span
                            key={disability.id}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-300 text-sm rounded-full border border-blue-300 dark:border-blue-600"
                          >
                            {disability.kategori_disabilitas} -{" "}
                            {disability.tingkat_disabilitas}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Accessibility Features */}
              {(selectedApplicant.lowongan.accessibility_features ||
                selectedApplicant.lowongan.work_accommodations) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                    Fasilitas Aksesibilitas
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedApplicant.lowongan.accessibility_features && (
                      <div>
                        <span className="font-medium text-green-700 dark:text-green-400">
                          Fasilitas:
                        </span>
                        <p className="text-green-800 dark:text-green-300">
                          {selectedApplicant.lowongan.accessibility_features}
                        </p>
                      </div>
                    )}
                    {selectedApplicant.lowongan.work_accommodations && (
                      <div>
                        <span className="font-medium text-green-700 dark:text-green-400">
                          Akomodasi Kerja:
                        </span>
                        <p className="text-green-800 dark:text-green-300">
                          {selectedApplicant.lowongan.work_accommodations}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Feedback if rejected */}
              {selectedApplicant.status === "rejected" &&
                selectedApplicant.feedback && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                      Feedback Penolakan
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {selectedApplicant.feedback}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}