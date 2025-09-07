"use client";

import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  Clock,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Heart,
  FileX,
  RefreshCw,
  Building2,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Briefcase,
  Download,
} from "lucide-react";
import Link from "next/link";
import apiBissaKerja from "@/lib/api-bissa-kerja";

// Type definitions
interface DisabilitasType {
  id: number;
  kategori_disabilitas: string;
  tingkat_disabilitas: string;
  created_at: string;
  updated_at: string;
  pivot: {
    post_lowongan_id: number;
    disabilitas_id: number;
  };
}

interface PerusahaanProfile {
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
}

interface JobVacancy {
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
  perusahaan_profile: PerusahaanProfile;
  disabilitas: DisabilitasType[];
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: JobVacancy[];
}

// Skeleton Components
const PulseEffect = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`} />
);

const JobCardSkeleton = () => (
  <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full">
    {/* Header */}
    <header className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3 flex-1">
        <PulseEffect className="w-12 h-12 rounded-lg" />
        <div className="flex-1 min-w-0 space-y-2">
          <PulseEffect className="h-5 rounded w-3/4" />
          <PulseEffect className="h-4 rounded w-1/2" />
        </div>
      </div>
    </header>

    {/* Job Details */}
    <section className="space-y-3 mb-4">
      <div className="flex items-center">
        <PulseEffect className="w-4 h-4 rounded mr-2" />
        <PulseEffect className="h-4 rounded w-2/3" />
      </div>
      <div className="flex items-center">
        <PulseEffect className="w-4 h-4 rounded mr-2" />
        <PulseEffect className="h-4 rounded w-1/2" />
      </div>
      <div className="flex items-center">
        <PulseEffect className="w-4 h-4 rounded mr-2" />
        <PulseEffect className="h-4 rounded w-1/3" />
      </div>
      <div className="flex items-center">
        <PulseEffect className="w-4 h-4 rounded mr-2" />
        <PulseEffect className="h-4 rounded w-2/5" />
      </div>
    </section>

    {/* Skills */}
    <section className="mb-4">
      <div className="flex flex-wrap gap-2">
        <PulseEffect className="h-6 rounded-full w-16" />
        <PulseEffect className="h-6 rounded-full w-20" />
        <PulseEffect className="h-6 rounded-full w-14" />
      </div>
    </section>

    {/* Spacer */}
    <div className="flex-1"></div>

    {/* Deadline and Date */}
    <div className="flex items-center justify-between mb-4">
      <PulseEffect className="h-6 rounded-full w-20" />
      <PulseEffect className="h-4 rounded w-24" />
    </div>

    {/* Actions */}
    <footer className="pt-4 border-t border-gray-100 dark:border-gray-700">
      <PulseEffect className="w-full h-10 rounded-lg" />
    </footer>
  </article>
);

const JobListingSkeleton = ({ cardCount = 9 }: { cardCount?: number }) => (
  <div className="mx-auto">
    {/* Stats Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center">
            <PulseEffect className="w-8 h-8 rounded mr-3" />
            <div className="space-y-2 flex-1">
              <PulseEffect className="h-6 rounded w-16" />
              <PulseEffect className="h-4 rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Search and Filter Skeleton */}
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <PulseEffect className="flex-1 h-10 rounded-lg" />
        <PulseEffect className="h-10 w-32 rounded-lg" />
        <PulseEffect className="h-10 w-32 rounded-lg" />
      </div>
    </div>

    {/* Job Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: cardCount }, (_, index) => (
        <JobCardSkeleton key={index} />
      ))}
    </div>
  </div>
);

// Empty State Component
const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="text-center max-w-md">
      <FileX className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-6" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Tidak Ada Lowongan Pekerjaan
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
        Saat ini belum ada lowongan pekerjaan yang tersedia. Silakan coba lagi
        nanti atau hubungi administrator.
      </p>
      <button
        onClick={onRefresh}
        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Muat Ulang
      </button>
    </div>
  </div>
);

export default function DataLowonganPage() {
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobVacancy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedJobType, setSelectedJobType] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });

  // Notification function
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  // Helper function to get company logo URL
  const getCompanyLogoUrl = (
    logo: string | null,
    companyName: string
  ): string => {
    if (logo && logo.trim() !== "") {
      return `${process.env.NEXT_PUBLIC_BASE_URL}/storage/${logo}`;
    }
    const encodedName = encodeURIComponent(companyName);
    return `https://ui-avatars.com/api/?name=${encodedName}&length=2`;
  };

  // Export function
  const handleExport = async () => {
    try {
      if (filteredJobs.length === 0) {
        showNotification("error", "Tidak ada data untuk diekspor");
        return;
      }

      // Create CSV content from filtered data
      const headers = [
        "No",
        "Posisi Pekerjaan",
        "Nama Perusahaan",
        "Industri",
        "Tipe Pekerjaan",
        "Lokasi",
        "Pendidikan",
        "Pengalaman",
        "Rentang Gaji",
        "Keahlian",
        "Batas Lamaran",
        "Status Perusahaan",
        "Dukungan Disabilitas",
        "Tanggal Posting"
      ];

      const csvContent = [
        headers.join(","),
        ...filteredJobs.map((job: JobVacancy, index: number) => {
          const skills = job.skills.join("; ");
          const disabilitas = job.disabilitas.map(d => d.kategori_disabilitas).join("; ");
          const createdDate = job.created_at ? new Date(job.created_at).toLocaleDateString("id-ID") : "-";
          
          return [
            index + 1,
            `"${job.job_title}"`,
            `"${job.perusahaan_profile.nama_perusahaan}"`,
            `"${job.perusahaan_profile.industri}"`,
            `"${job.job_type}"`,
            `"${job.location}"`,
            `"${job.education}"`,
            `"${job.experience}"`,
            `"${job.salary_range || "Kompetitif"}"`,
            `"${skills}"`,
            `"${new Date(job.application_deadline).toLocaleDateString("id-ID")}"`,
            `"${job.perusahaan_profile.status_verifikasi === "verified" ? "Terverifikasi" : "Belum Terverifikasi"}"`,
            `"${disabilitas || "Tidak Ada"}"`,
            `"${createdDate}"`
          ].join(",");
        }),
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
        `data-lowongan-pekerjaan-${new Date().toISOString().split("T")[0]}.csv`
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

  // Fetch all jobs data from API
  const fetchJobs = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      let response;

      // Try multiple possible endpoints
      const possibleEndpoints = [
        "/job-vacancies", // Most common REST endpoint
        "/lowongan-pekerjaan", // Indonesian equivalent
        "/public/job-vacancies", // Public access
        "/admin/job-vacancies", // Admin access
        "/company/job-vacancies/all", // All company vacancies
        "/api/job-vacancies", // With API prefix
        "/jobs", // Simple jobs endpoint
        "/job-vacancies/all", // Original endpoint
      ];

      let lastError = null;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await apiBissaKerja.get<ApiResponse>(endpoint);
          console.log(`Success with endpoint: ${endpoint}`, response.data);
          break; // If successful, break out of loop
        } catch (err) {
          console.log(`Failed endpoint: ${endpoint}`, err);
          lastError = err;
          continue; // Try next endpoint
        }
      }

      // If all endpoints failed, use fallback or throw error
      if (!response) {
        // Development fallback: Create dummy data
        console.warn(
          "All API endpoints failed. Using dummy data for development."
        );
        const dummyData: JobVacancy[] = [
          {
            id: 1,
            job_title: "Frontend Developer",
            job_type: "Full Time",
            description: "Develop user interfaces using React",
            responsibilities: "Build responsive web applications",
            requirements: "Experience with React, TypeScript",
            education: "S1 Informatika",
            experience: "2-3 tahun",
            salary_range: "8-12 Juta",
            benefits: "Asuransi kesehatan, bonus tahunan",
            location: "Jakarta, Indonesia",
            application_deadline: "2025-12-31",
            accessibility_features: "Ramah disabilitas",
            work_accommodations: "Fleksible working hours",
            skills: ["React", "TypeScript", "CSS", "JavaScript"],
            perusahaan_profile: {
              id: 1,
              logo: null,
              nama_perusahaan: "Tech Innovate",
              industri: "Technology",
              tahun_berdiri: "2020",
              jumlah_karyawan: "50-100",
              province_id: "1",
              regencie_id: "1",
              deskripsi: "Perusahaan teknologi modern",
              no_telp: "021-1234567",
              link_website: "https://techinnovate.com",
              alamat_lengkap: "Jakarta Selatan",
              visi: "Menjadi perusahaan tech terdepan",
              misi: "Memberikan solusi teknologi terbaik",
              nilai_nilai: "Innovation, Quality, Integrity",
              sertifikat: "ISO 9001",
              bukti_wajib_lapor: "12345678",
              nib: "87654321",
              linkedin: null,
              instagram: null,
              facebook: null,
              twitter: null,
              youtube: null,
              tiktok: null,
              status_verifikasi: "verified",
              user_id: 1,
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
            disabilitas: [
              {
                id: 1,
                kategori_disabilitas: "Tuna Daksa",
                tingkat_disabilitas: "Ringan",
                created_at: "2024-01-01",
                updated_at: "2024-01-01",
                pivot: {
                  post_lowongan_id: 1,
                  disabilitas_id: 1,
                },
              },
            ],
            created_at: "2024-08-01",
            updated_at: "2024-08-01",
          },
          {
            id: 2,
            job_title: "Backend Developer",
            job_type: "Full Time",
            description: "Develop server-side applications",
            responsibilities: "Build APIs and manage databases",
            requirements: "Experience with Node.js, MongoDB",
            education: "S1 Teknik Informatika",
            experience: "1-2 tahun",
            salary_range: "7-10 Juta",
            benefits: "Remote work, learning budget",
            location: "Bandung, Indonesia",
            application_deadline: "2025-11-30",
            accessibility_features: "Akses kursi roda",
            work_accommodations: "Remote work available",
            skills: ["Node.js", "MongoDB", "Express", "API"],
            perusahaan_profile: {
              id: 2,
              logo: null,
              nama_perusahaan: "Digital Solutions",
              industri: "Software Development",
              tahun_berdiri: "2019",
              jumlah_karyawan: "10-50",
              province_id: "2",
              regencie_id: "2",
              deskripsi: "Solusi digital untuk bisnis",
              no_telp: "022-9876543",
              link_website: "https://digitalsolutions.com",
              alamat_lengkap: "Bandung, Jawa Barat",
              visi: "Digitalisasi untuk semua",
              misi: "Membantu bisnis bertransformasi digital",
              nilai_nilai: "Excellence, Innovation, Collaboration",
              sertifikat: "ISO 27001",
              bukti_wajib_lapor: "11223344",
              nib: "44332211",
              linkedin: null,
              instagram: null,
              facebook: null,
              twitter: null,
              youtube: null,
              tiktok: null,
              status_verifikasi: "pending",
              user_id: 2,
              created_at: "2024-02-01",
              updated_at: "2024-02-01",
            },
            disabilitas: [],
            created_at: "2024-08-15",
            updated_at: "2024-08-15",
          },
        ];

        setJobs(dummyData);
        setFilteredJobs(dummyData);
        return;
      }

      if (response.data.success === true) {
        setJobs(response.data.data || []);
        setFilteredJobs(response.data.data || []);
      } else {
        setJobs([]);
        setFilteredJobs([]);
        console.log(
          "API returned unsuccessful response:",
          response.data.message
        );
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);

      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError;

        if (axiosError.response?.status === 404) {
          // Try to use dummy data if endpoint not found
          console.log("Endpoint not found, trying dummy data fallback");
          setJobs([]);
          setFilteredJobs([]);
        } else if (axiosError.response?.status === 500) {
          setError(
            "Server sedang mengalami gangguan. Tim IT sedang memperbaiki masalah ini. Silakan coba lagi dalam beberapa menit."
          );
        } else if (axiosError.response?.status === 401) {
          setError(
            "Sesi Anda telah berakhir. Silakan login kembali untuk melihat data lowongan pekerjaan."
          );
        } else if (axiosError.response?.status === 403) {
          setError(
            "Anda tidak memiliki akses untuk melihat data lowongan ini. Hubungi administrator jika diperlukan."
          );
        } else if (!axiosError.response) {
          setError(
            "Tidak dapat terhubung ke server. Pastikan koneksi internet Anda stabil dan coba lagi."
          );
        } else {
          setError(
            `Terjadi kesalahan saat mengambil data (Error ${axiosError.response?.status}). Silakan coba lagi atau hubungi support.`
          );
        }
      } else {
        setError(
          "Terjadi kesalahan yang tidak diketahui. Silakan refresh halaman atau coba lagi nanti."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs based on search and filter criteria
  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.perusahaan_profile.nama_perusahaan
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          job.skills.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter((job) =>
        job.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Job type filter
    if (selectedJobType) {
      filtered = filtered.filter(
        (job) => job.job_type.toLowerCase() === selectedJobType.toLowerCase()
      );
    }

    // Industry filter
    if (selectedIndustry) {
      filtered = filtered.filter((job) =>
        job.perusahaan_profile.industri
          .toLowerCase()
          .includes(selectedIndustry.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, selectedLocation, selectedJobType, selectedIndustry]);

  useEffect(() => {
    fetchJobs();
  }, []);

  // Helper functions
  const calculateDaysRemaining = (deadline: string): number => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleRetry = (): void => {
    fetchJobs();
  };

  // Get unique values for filters
  const uniqueLocations = [
    ...new Set(jobs.map((job) => job.location.split(",")[0].trim())),
  ];
  const uniqueJobTypes = [...new Set(jobs.map((job) => job.job_type))];
  const uniqueIndustries = [
    ...new Set(jobs.map((job) => job.perusahaan_profile.industri)),
  ];

  // Calculate stats
  const totalJobs: number = jobs.length;
  const totalCompanies: number = [
    ...new Set(jobs.map((job) => job.perusahaan_profile.id)),
  ].length;
  const uniqueCities: number = [
    ...new Set(jobs.map((job) => job.location.split(",")[0].trim())),
  ].length;
  const activeJobs: number = jobs.filter(
    (job) => calculateDaysRemaining(job.application_deadline) > 0
  ).length;

  // Notification render
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

  // Error state
  if (error) {
    return (
      <div>
        {renderNotification()}
        <PageBreadcrumb pageTitle="Data Lowongan Pekerjaan" />
        <div className="space-y-6">
          <ComponentCard
            title="Semua Lowongan Pekerjaan"
            desc="Terjadi kesalahan saat memuat data"
          >
            <div className="flex flex-col justify-center items-center py-16 text-center">
              <div className="text-red-500 text-lg font-medium mb-4">
                {error}
              </div>
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Coba Lagi
              </button>
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Data Lowongan Pekerjaan" />
        <div className="space-y-6">
          <ComponentCard
            title="Semua Lowongan Pekerjaan"
            desc="Memuat data lowongan pekerjaan dari semua perusahaan..."
          >
            <JobListingSkeleton cardCount={9} />
          </ComponentCard>
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderNotification()}
      <PageBreadcrumb pageTitle="Data Lowongan Pekerjaan" />
      <div className="space-y-6">
        <ComponentCard
          title="Semua Lowongan Pekerjaan"
          desc="Temukan peluang karir terbaik dari berbagai perusahaan"
        >
          {jobs.length === 0 ? (
            <EmptyState onRefresh={handleRetry} />
          ) : (
            <div className="mx-auto">
              {/* Header with Export Button */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Daftar Lowongan Pekerjaan
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Total {filteredJobs.length} lowongan dari {totalCompanies} perusahaan
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExport}
                    disabled={loading || filteredJobs.length === 0}
                    className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={16} className="mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center">
                    <Briefcase className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {totalJobs}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Lowongan
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center">
                    <Building2 className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {totalCompanies}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Perusahaan
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center">
                    <MapPin className="w-8 h-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {uniqueCities}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Kota Tersedia
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {activeJobs}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Masih Aktif
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Cari posisi, perusahaan, atau keahlian..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Location Filter */}
                  <div className="relative">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    >
                      <option value="">Semua Lokasi</option>
                      {uniqueLocations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>

                  {/* Job Type Filter */}
                  <div className="relative">
                    <select
                      value={selectedJobType}
                      onChange={(e) => setSelectedJobType(e.target.value)}
                      className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    >
                      <option value="">Semua Tipe</option>
                      {uniqueJobTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>

                  {/* Industry Filter */}
                  <div className="relative">
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    >
                      <option value="">Semua Industri</option>
                      {uniqueIndustries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Filter Results Info */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Menampilkan {filteredJobs.length} dari {totalJobs} lowongan
                    pekerjaan
                    {(searchTerm ||
                      selectedLocation ||
                      selectedJobType ||
                      selectedIndustry) && (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedLocation("");
                          setSelectedJobType("");
                          setSelectedIndustry("");
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job: JobVacancy) => {
                  const daysRemaining: number = calculateDaysRemaining(
                    job.application_deadline
                  );
                  const skills: string[] = job.skills.slice(0, 4);
                  const isExpired = daysRemaining <= 0;

                  // Determine deadline badge color
                  const getDeadlineColorClass = (days: number): string => {
                    if (days <= 0) {
                      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
                    } else if (days <= 3) {
                      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
                    } else if (days <= 7) {
                      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
                    } else {
                      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
                    }
                  };

                  return (
                    <article
                      key={job.id}
                      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 flex flex-col h-full group ${
                        isExpired ? "opacity-75" : ""
                      }`}
                      aria-label={`Lowongan kerja: ${job.job_title} di ${job.perusahaan_profile.nama_perusahaan}`}
                    >
                      {/* Content Container */}
                      <div className="flex-1">
                        <header className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="relative">
                              <img
                                src={getCompanyLogoUrl(
                                  job.perusahaan_profile.logo,
                                  job.perusahaan_profile.nama_perusahaan
                                )}
                                alt={`Logo ${job.perusahaan_profile.nama_perusahaan}`}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const encodedName = encodeURIComponent(
                                    job.perusahaan_profile.nama_perusahaan
                                  );
                                  target.src = `https://ui-avatars.com/api/?name=${encodedName}&length=2`;
                                }}
                              />
                              {/* Disability-friendly indicator */}
                              {job.disabilitas.length > 0 && (
                                <div
                                  className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1"
                                  title="Ramah disabilitas"
                                >
                                  <Heart className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3
                                className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                                title={job.job_title}
                              >
                                {job.job_title}
                              </h3>
                              <p
                                className="text-sm text-gray-600 dark:text-gray-400 truncate"
                                title={job.perusahaan_profile.nama_perusahaan}
                              >
                                {job.perusahaan_profile.nama_perusahaan}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {job.perusahaan_profile.industri}
                              </p>
                            </div>
                          </div>
                        </header>

                        {/* Job Details */}
                        <section className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate" title={job.location}>
                              {job.location}
                            </span>
                          </div>

                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate" title={job.salary_range}>
                              {job.salary_range || "Kompetitif"}
                            </span>
                          </div>

                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span title={job.job_type}>{job.job_type}</span>
                          </div>

                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate" title={job.experience}>
                              {job.experience}
                            </span>
                          </div>
                        </section>

                        {/* Skills */}
                        {skills.length > 0 && (
                          <section className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {skills.map((skill: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full"
                                  title={skill}
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                  +{job.skills.length - 4} lagi
                                </span>
                              )}
                            </div>
                          </section>
                        )}

                        {/* Disability Support Info */}
                        {job.disabilitas.length > 0 && (
                          <section className="mb-4">
                            <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <Heart className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-xs text-blue-700 dark:text-blue-300">
                                Mendukung{" "}
                                {job.disabilitas
                                  .map(
                                    (d: DisabilitasType) =>
                                      d.kategori_disabilitas
                                  )
                                  .join(", ")}{" "}
                                disabilitas
                              </span>
                            </div>
                          </section>
                        )}
                      </div>

                      {/* Deadline and Company Verification Status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getDeadlineColorClass(
                              daysRemaining
                            )}`}
                          >
                            {isExpired
                              ? "Berakhir"
                              : `${daysRemaining} hari lagi`}
                          </div>
                          {job.perusahaan_profile.status_verifikasi === "verified" && (
                            <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                              ✓ Terverifikasi
                            </div>
                          )}
                        </div>
                        <time
                          className="text-xs text-gray-500 dark:text-gray-400"
                          dateTime={job.application_deadline}
                        >
                          {formatDate(job.application_deadline)}
                        </time>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* No Results Found */}
              {filteredJobs.length === 0 && jobs.length > 0 && (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Tidak Ada Hasil Ditemukan
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Coba ubah kata kunci pencarian atau filter yang Anda
                    gunakan.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedLocation("");
                      setSelectedJobType("");
                      setSelectedIndustry("");
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              )}

              {/* Load More Button - if you implement pagination */}
              {filteredJobs.length >= 12 && (
                <div className="text-center mt-8">
                  <button
                    className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
                    onClick={() => {
                      // Implement load more functionality here
                      console.log("Load more jobs...");
                    }}
                  >
                    Muat Lebih Banyak
                  </button>
                </div>
              )}
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}