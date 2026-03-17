"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MdPeople,
  MdSearch,
  MdFilterList,
  MdDelete,
  MdCheckCircle,
  MdCancel,
  MdVerifiedUser,
  MdPersonAdd,
  MdBusiness,
  MdNavigateNext,
  MdNavigateBefore,
  MdVisibility,
  MdClose,
  MdEmail,
  MdAccessTime,
  MdLocationOn,
  MdWork,
  MdCalendarToday,
  MdRefresh,
  MdAttachment,
  MdGroups,
  MdUpdate,
  MdFileDownload,
} from "react-icons/md";
import { adminAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import ExcelJS from "exceljs";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  jobSeeker?: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    location?: string;
    bio?: string;
    skills: string[];
    experience?: string;
    education?: string;
    cvUrl?: string;
    profileImageUrl?: string;
    isProfilePublic: boolean;
    countryCode?: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
  };
  employer?: {
    id: string;
    companyName: string;
    title?: string;
    industry?: string;
    location?: string;
    website?: string;
    description?: string;
    logoUrl?: string;
    founded?: number;
    companySize?: string;
    isVerified: boolean;
    countryCode?: string;
    phone?: string;
    createdAt: string;
    updatedAt: string;
  };
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    updatedAt: string;
  };
  socialAccounts?: {
    id: string;
    provider: string;
    email?: string;
    displayName?: string;
    createdAt: string;
  }[];
  _count?: {
    attachments: number;
    socialAccounts: number;
  };
}

interface UsersData {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminUsersPage() {
  const { user } = useRouteGuard({
    requireAuth: true,
    requireRole: "ADMIN",
  });

  const [data, setData] = useState<UsersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // UI states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("isActive", statusFilter);
      if (search) params.append("search", search);

      const response = await adminAPI.getAllUsers(params);

      if (response.success && response.data) {
        setData(response.data as UsersData);
      } else {
        setError("Failed to load users");
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, roleFilter, statusFilter, search]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const handleUserAction = async (userId: string, action: string) => {
    const actionMessages = {
      activate:
        "Are you sure you want to activate this user? They will be able to access the platform.",
      deactivate:
        "Are you sure you want to deactivate this user? They will lose access to the platform.",
      verify: "Are you sure you want to verify this user's email?",
      unverify: "Are you sure you want to unverify this user's email?",
    };

    const confirmMessage =
      actionMessages[action as keyof typeof actionMessages];
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(userId);

      let response;
      if (action === "activate" || action === "deactivate") {
        response = await adminAPI.toggleUserStatus(userId);
      } else if (action === "verify" || action === "unverify") {
        response = await adminAPI.toggleUserVerification(userId);
      } else {
        throw new Error(`Unknown action: ${action}`);
      }

      if (response.success) {
        await fetchUsers();
      } else {
        setError(`Failed to ${action} user`);
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      setError(`Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionLoading(userId);
      const response = await adminAPI.deleteUser(userId);

      if (response.success) {
        await fetchUsers();
      } else {
        setError("Failed to delete user");
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "EMPLOYER":
        return (
          <MdBusiness className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        );
      case "JOB_SEEKER":
        return (
          <MdPersonAdd className="w-5 h-5 text-green-600 dark:text-green-400" />
        );
      case "ADMIN":
        return (
          <MdVerifiedUser className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        );
      default:
        return (
          <MdPeople className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (role) {
      case "EMPLOYER":
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300`;
      case "JOB_SEEKER":
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300`;
      case "ADMIN":
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300`;
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };
  const handleCloseModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
  };

  const exportUsersToExcel = async () => {
    try {
      setIsExporting(true);

      // Fetch all users (without pagination limit)
      const params = new URLSearchParams({
        page: "1",
        limit: "999999", // Get all users
      });

      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("isActive", statusFilter);
      if (search) params.append("search", search);

      const response = await adminAPI.getAllUsers(params);

      if (!response.success || !response.data) {
        throw new Error("Failed to fetch users for export");
      }

      const allUsers = (response.data as UsersData).users;

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Employ.me Admin";
      workbook.created = new Date();

      // Add main users sheet
      const worksheet = workbook.addWorksheet("Users", {
        properties: { tabColor: { argb: "FF1e293b" } },
      });

      // Define columns with styling
      worksheet.columns = [
        { header: "User ID", key: "id", width: 30 },
        { header: "First Name", key: "firstName", width: 20 },
        { header: "Last Name", key: "lastName", width: 20 },
        { header: "Email", key: "email", width: 30 },
        { header: "Role", key: "role", width: 15 },
        { header: "Status", key: "status", width: 12 },
        { header: "Verified", key: "verified", width: 12 },
        { header: "Last Login", key: "lastLogin", width: 20 },
        { header: "Account Created", key: "createdAt", width: 20 },
        { header: "Last Updated", key: "updatedAt", width: 20 },
        { header: "Attachments", key: "attachments", width: 12 },
        { header: "Social Accounts", key: "socialAccounts", width: 15 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1e293b" },
      };
      worksheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getRow(1).height = 25;

      // Add user data
      allUsers.forEach((user) => {
        const row = worksheet.addRow({
          id: user.id,
          firstName:
            user.firstName ||
            user.jobSeeker?.firstName ||
            user.admin?.firstName ||
            "N/A",
          lastName:
            user.lastName ||
            user.jobSeeker?.lastName ||
            user.admin?.lastName ||
            "N/A",
          email: user.email,
          role: user.role.replace("_", " "),
          status: user.isActive ? "Active" : "Inactive",
          verified: user.isVerified ? "Yes" : "No",
          lastLogin: user.lastLogin ? formatDate(user.lastLogin) : "Never",
          createdAt: formatDate(user.createdAt),
          updatedAt: formatDate(user.updatedAt),
          attachments: user._count?.attachments || 0,
          socialAccounts: user._count?.socialAccounts || 0,
        });

        // Conditional formatting for status
        const statusCell = row.getCell("status");
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: user.isActive ? "FFD4EDDA" : "FFF8D7DA",
          },
        };
        statusCell.font = {
          color: { argb: user.isActive ? "FF155724" : "FF721C24" },
          bold: true,
        };

        // Conditional formatting for verified
        const verifiedCell = row.getCell("verified");
        verifiedCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: user.isVerified ? "FFCCE5FF" : "FFFEF3CD",
          },
        };
        verifiedCell.font = {
          color: { argb: user.isVerified ? "FF004085" : "FF856404" },
          bold: true,
        };
      });

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
          if (rowNumber > 1) {
            cell.alignment = { vertical: "middle", wrapText: true };
          }
        });
      });

      // Add Job Seekers sheet
      const jobSeekers = allUsers.filter(
        (u) => u.role === "JOB_SEEKER" && u.jobSeeker
      );
      if (jobSeekers.length > 0) {
        const seekerSheet = workbook.addWorksheet("Job Seekers", {
          properties: { tabColor: { argb: "FF22c55e" } },
        });

        seekerSheet.columns = [
          { header: "User ID", key: "userId", width: 30 },
          { header: "First Name", key: "firstName", width: 20 },
          { header: "Last Name", key: "lastName", width: 20 },
          { header: "Email", key: "email", width: 30 },
          { header: "Date of Birth", key: "dob", width: 15 },
          { header: "Location", key: "location", width: 25 },
          { header: "Phone", key: "phone", width: 20 },
          { header: "Experience", key: "experience", width: 15 },
          { header: "Skills", key: "skills", width: 50 },
          { header: "Education", key: "education", width: 30 },
          { header: "Bio", key: "bio", width: 50 },
          { header: "CV URL", key: "cvUrl", width: 40 },
          { header: "Profile Public", key: "isPublic", width: 15 },
        ];

        // Style header
        seekerSheet.getRow(1).font = {
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        seekerSheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF22c55e" },
        };
        seekerSheet.getRow(1).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        seekerSheet.getRow(1).height = 25;

        jobSeekers.forEach((user) => {
          const seeker = user.jobSeeker!;
          const row = seekerSheet.addRow({
            userId: user.id,
            firstName: seeker.firstName,
            lastName: seeker.lastName,
            email: user.email,
            dob: seeker.dateOfBirth ? formatDate(seeker.dateOfBirth) : "N/A",
            location: seeker.location || "N/A",
            phone: seeker.phone
              ? `${seeker.countryCode || ""}${seeker.phone}`
              : "N/A",
            experience: seeker.experience?.replace("_", " ") || "N/A",
            skills: seeker.skills.join(", ") || "None",
            education: seeker.education || "N/A",
            bio: seeker.bio || "No bio",
            cvUrl: seeker.cvUrl || "No CV",
            isPublic: seeker.isProfilePublic ? "Yes" : "No",
          });

          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin", color: { argb: "FFD1D5DB" } },
              left: { style: "thin", color: { argb: "FFD1D5DB" } },
              bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
              right: { style: "thin", color: { argb: "FFD1D5DB" } },
            };
            cell.alignment = { vertical: "middle", wrapText: true };
          });
        });
      }

      // Add Employers sheet
      const employers = allUsers.filter(
        (u) => u.role === "EMPLOYER" && u.employer
      );
      if (employers.length > 0) {
        const employerSheet = workbook.addWorksheet("Employers", {
          properties: { tabColor: { argb: "FF3b82f6" } },
        });

        employerSheet.columns = [
          { header: "User ID", key: "userId", width: 30 },
          { header: "Email", key: "email", width: 30 },
          { header: "Company Name", key: "companyName", width: 30 },
          { header: "Title", key: "title", width: 20 },
          { header: "Industry", key: "industry", width: 20 },
          { header: "Location", key: "location", width: 25 },
          { header: "Website", key: "website", width: 35 },
          { header: "Phone", key: "phone", width: 20 },
          { header: "Company Size", key: "companySize", width: 15 },
          { header: "Founded", key: "founded", width: 12 },
          { header: "Verified", key: "verified", width: 12 },
          { header: "Description", key: "description", width: 50 },
        ];

        // Style header
        employerSheet.getRow(1).font = {
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        employerSheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF3b82f6" },
        };
        employerSheet.getRow(1).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        employerSheet.getRow(1).height = 25;

        employers.forEach((user) => {
          const employer = user.employer!;
          const row = employerSheet.addRow({
            userId: user.id,
            email: user.email,
            companyName: employer.companyName,
            title: employer.title || "N/A",
            industry: employer.industry || "N/A",
            location: employer.location || "N/A",
            website: employer.website || "N/A",
            phone: employer.phone
              ? `${employer.countryCode || ""}${employer.phone}`
              : "N/A",
            companySize: employer.companySize || "N/A",
            founded: employer.founded || "N/A",
            verified: employer.isVerified ? "Yes" : "No",
            description: employer.description || "No description",
          });

          // Conditional formatting for verified
          const verifiedCell = row.getCell("verified");
          verifiedCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: employer.isVerified ? "FFD4EDDA" : "FFFEF3CD",
            },
          };
          verifiedCell.font = {
            color: { argb: employer.isVerified ? "FF155724" : "FF856404" },
            bold: true,
          };

          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin", color: { argb: "FFD1D5DB" } },
              left: { style: "thin", color: { argb: "FFD1D5DB" } },
              bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
              right: { style: "thin", color: { argb: "FFD1D5DB" } },
            };
            cell.alignment = { vertical: "middle", wrapText: true };
          });
        });
      }

      // Add Admins sheet
      const admins = allUsers.filter((u) => u.role === "ADMIN" && u.admin);
      if (admins.length > 0) {
        const adminSheet = workbook.addWorksheet("Admins", {
          properties: { tabColor: { argb: "FF9333ea" } },
        });

        adminSheet.columns = [
          { header: "User ID", key: "userId", width: 30 },
          { header: "First Name", key: "firstName", width: 20 },
          { header: "Last Name", key: "lastName", width: 20 },
          { header: "Email", key: "email", width: 30 },
          { header: "Account Created", key: "createdAt", width: 20 },
          { header: "Last Login", key: "lastLogin", width: 20 },
        ];

        // Style header
        adminSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        adminSheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF9333ea" },
        };
        adminSheet.getRow(1).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        adminSheet.getRow(1).height = 25;

        admins.forEach((user) => {
          const admin = user.admin!;
          const row = adminSheet.addRow({
            userId: user.id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: user.email,
            createdAt: formatDate(user.createdAt),
            lastLogin: user.lastLogin ? formatDate(user.lastLogin) : "Never",
          });

          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin", color: { argb: "FFD1D5DB" } },
              left: { style: "thin", color: { argb: "FFD1D5DB" } },
              bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
              right: { style: "thin", color: { argb: "FFD1D5DB" } },
            };
            cell.alignment = { vertical: "middle", wrapText: true };
          });
        });
      }

      // Add summary sheet
      const summarySheet = workbook.addWorksheet("Summary", {
        properties: { tabColor: { argb: "FFFF6B35" } },
      });

      summarySheet.mergeCells("A1:B1");
      summarySheet.getCell("A1").value = "User Statistics Summary";
      summarySheet.getCell("A1").font = { size: 16, bold: true };
      summarySheet.getCell("A1").alignment = { horizontal: "center" };
      summarySheet.getRow(1).height = 30;

      const stats = [
        ["Total Users", allUsers.length],
        ["Active Users", allUsers.filter((u) => u.isActive).length],
        ["Inactive Users", allUsers.filter((u) => !u.isActive).length],
        ["Verified Users", allUsers.filter((u) => u.isVerified).length],
        ["", ""],
        ["Job Seekers", allUsers.filter((u) => u.role === "JOB_SEEKER").length],
        [
          "Active Job Seekers",
          allUsers.filter((u) => u.role === "JOB_SEEKER" && u.isActive).length,
        ],
        ["", ""],
        ["Employers", allUsers.filter((u) => u.role === "EMPLOYER").length],
        [
          "Active Employers",
          allUsers.filter((u) => u.role === "EMPLOYER" && u.isActive).length,
        ],
        [
          "Verified Employers",
          allUsers.filter(
            (u) => u.role === "EMPLOYER" && u.employer?.isVerified
          ).length,
        ],
        ["", ""],
        ["Admins", allUsers.filter((u) => u.role === "ADMIN").length],
        ["", ""],
        ["Export Date", new Date().toLocaleString()],
      ];

      summarySheet.getColumn(1).width = 25;
      summarySheet.getColumn(2).width = 20;

      stats.forEach((stat, index) => {
        const row = summarySheet.addRow(stat);
        if (stat[0] === "") return;

        row.getCell(1).font = { bold: true };
        row.getCell(2).font = { bold: true, color: { argb: "FF1e293b" } };
        row.getCell(2).alignment = { horizontal: "right" };

        if (index === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFE5E7EB" },
            };
          });
        }
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `employme-users-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      setIsExporting(false);
    } catch (err) {
      console.error("Failed to export users:", err);
      setError("Failed to export users to Excel");
      setIsExporting(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MdPeople className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage user accounts and permissions
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8"
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-sm sm:text-base"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Role Filter */}
            <div className="relative">
              <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background appearance-none text-sm sm:text-base cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="JOB_SEEKER">Job Seekers</option>
                <option value="EMPLOYER">Employers</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-sm sm:text-base cursor-pointer appearance-none"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={fetchUsers}
              variant="outline"
              className="flex items-center justify-center gap-2 h-12"
            >
              <MdRefresh className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Export to Excel Button */}
          <div className="pt-4 border-t border-border">
            <Button
              onClick={exportUsersToExcel}
              isLoading={isExporting}
              disabled={isExporting || !data || data.users.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <MdFileDownload className="w-5 h-5" />
              <span>{isExporting ? "Exporting..." : "Export to Excel"}</span>
            </Button>
            {data && data.pagination.total > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Export all {data.pagination.total} user
                {data.pagination.total !== 1 ? "s" : ""} with detailed
                information
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6"
        >
          {error}
        </motion.div>
      )}

      {/* Users Table/Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-3 font-medium text-foreground">
                  User
                </th>
                <th className="text-left p-3 font-medium text-foreground">
                  Role
                </th>
                <th className="text-left p-3 font-medium text-foreground">
                  Status
                </th>
                <th className="text-left p-3 font-medium text-foreground">
                  Details
                </th>
                <th className="text-left p-3 font-medium text-foreground">
                  Last Login
                </th>
                <th className="text-left p-3 font-medium text-foreground">
                  Joined
                </th>
                <th className="text-right p-3 font-medium text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : "No Name"}
                        </p>
                        <a
                          href={`mailto:${user.email}`}
                          className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors truncate block"
                          title={user.email}
                        >
                          {user.email}
                        </a>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <span className={getRoleBadge(user.role)}>
                      {user.role === "JOB_SEEKER"
                        ? "Seeker"
                        : user.role === "EMPLOYER"
                        ? "Employer"
                        : "Admin"}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {user.isActive ? (
                        <MdCheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <MdCancel className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-xs ${
                          user.isActive
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                      {user.isVerified && (
                        <MdVerifiedUser className="w-3 h-3 text-blue-500" />
                      )}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="text-xs">
                      {user.role === "EMPLOYER" && user.employer && (
                        <div>
                          <p
                            className="text-foreground font-medium truncate"
                            title={user.employer.companyName}
                          >
                            {user.employer.companyName || "No Company"}
                          </p>
                          <p
                            className="text-muted-foreground truncate"
                            title={user.employer.industry}
                          >
                            {user.employer.industry || "No Industry"}
                          </p>
                        </div>
                      )}
                      {user.role === "JOB_SEEKER" && user.jobSeeker && (
                        <div>
                          <p
                            className="text-foreground truncate"
                            title={user.jobSeeker.location}
                          >
                            {user.jobSeeker.location || "No Location"}
                          </p>
                          <p className="text-muted-foreground truncate">
                            {user.jobSeeker.skills.slice(0, 1).join("")}
                            {user.jobSeeker.skills.length > 1 &&
                              ` +${user.jobSeeker.skills.length - 1}`}
                          </p>
                        </div>
                      )}
                      {user.role === "ADMIN" && (
                        <p className="text-foreground font-medium">
                          Platform Admin
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="p-3">
                    <p className="text-xs text-muted-foreground">
                      {user.lastLogin ? (
                        <span title={formatDate(user.lastLogin)}>
                          {new Date(user.lastLogin).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Never
                        </span>
                      )}
                    </p>
                  </td>

                  <td className="p-3">
                    <p
                      className="text-xs text-muted-foreground"
                      title={formatDate(user.createdAt)}
                    >
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        onClick={() => handleViewUser(user)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading !== null}
                        className="text-xs px-2 py-1"
                      >
                        <MdVisibility className="w-3 h-3" />
                      </Button>

                      {user.role !== "ADMIN" && (
                        <>
                          <Button
                            onClick={() =>
                              handleUserAction(
                                user.id,
                                user.isActive ? "deactivate" : "activate"
                              )
                            }
                            variant="outline"
                            size="sm"
                            isLoading={actionLoading === user.id}
                            disabled={actionLoading !== null}
                            className="text-xs px-2 py-1"
                          >
                            {user.isActive ? "Deact" : "Act"}
                          </Button>

                          <Button
                            onClick={() =>
                              handleUserAction(
                                user.id,
                                user.isVerified ? "unverify" : "verify"
                              )
                            }
                            variant="outline"
                            size="sm"
                            isLoading={actionLoading === user.id}
                            disabled={actionLoading !== null}
                            className="text-xs px-2 py-1"
                          >
                            {user.isVerified ? "Unver" : "Verify"}
                          </Button>

                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            variant="outline"
                            size="sm"
                            isLoading={actionLoading === user.id}
                            disabled={actionLoading !== null}
                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 text-xs px-2 py-1"
                          >
                            <MdDelete className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {data?.users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  {getRoleIcon(user.role)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : "No Name"}
                    </h3>
                    <span className={getRoleBadge(user.role)}>
                      {user.role.replace("_", " ")}
                    </span>
                  </div>
                  <a
                    href={`mailto:${user.email}`}
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors truncate mb-2 block"
                  >
                    {user.email}
                  </a>

                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    <div className="flex items-center gap-1">
                      {user.isActive ? (
                        <MdCheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <MdCancel className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={
                          user.isActive
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {user.isVerified && (
                      <div className="flex items-center gap-1">
                        <MdVerifiedUser className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-600 dark:text-blue-400">
                          Verified
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-3 text-sm">
                {user.role === "EMPLOYER" && user.employer && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MdBusiness className="w-4 h-4" />
                    <span>{user.employer.companyName || "No Company"}</span>
                  </div>
                )}
                {user.role === "JOB_SEEKER" && user.jobSeeker && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MdLocationOn className="w-4 h-4" />
                    <span>{user.jobSeeker.location || "No Location"}</span>
                  </div>
                )}
                {user.role === "ADMIN" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MdVerifiedUser className="w-4 h-4" />
                    <span>Platform Administrator</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">
                    Last Login:{" "}
                    {user.lastLogin ? (
                      formatDate(user.lastLogin)
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Never
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(user.createdAt)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewUser(user)}
                    variant="outline"
                    size="sm"
                    disabled={actionLoading !== null}
                    className="h-10 min-w-[44px] flex items-center justify-center"
                  >
                    <MdVisibility className="w-5 h-5" />
                  </Button>
                  {user.role !== "ADMIN" && (
                    <>
                      <Button
                        onClick={() =>
                          handleUserAction(
                            user.id,
                            user.isActive ? "deactivate" : "activate"
                          )
                        }
                        variant="outline"
                        size="sm"
                        isLoading={actionLoading === user.id}
                        disabled={actionLoading !== null}
                        className="h-10 px-3 text-xs"
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        onClick={() => handleDeleteUser(user.id)}
                        variant="outline"
                        size="sm"
                        isLoading={actionLoading === user.id}
                        disabled={actionLoading !== null}
                        className="h-10 min-w-[44px] flex items-center justify-center text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <MdDelete className="w-5 h-5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="p-4 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Showing {(currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, data.pagination.total)} of{" "}
                {data.pagination.total} users
              </p>

              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="h-10 min-w-[44px] flex items-center justify-center"
                >
                  <MdNavigateBefore className="w-5 h-5" />
                </Button>

                <span className="px-3 py-2 text-sm text-foreground bg-muted rounded-lg min-w-[80px] text-center">
                  {currentPage} of {data.pagination.pages}
                </span>

                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === data.pagination.pages}
                  variant="outline"
                  size="sm"
                  className="h-10 min-w-[44px] flex items-center justify-center"
                >
                  <MdNavigateNext className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {data && data.users.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <MdPeople className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-medium text-foreground mb-2">
            No users found
          </p>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or filters
          </p>
        </motion.div>
      )}

      {/* User Details Modal - Simplified version without full implementation for now */}
      {showUserModal && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  {getRoleIcon(selectedUser.role)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {selectedUser.firstName && selectedUser.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser.jobSeeker
                      ? `${selectedUser.jobSeeker.firstName} ${selectedUser.jobSeeker.lastName}`
                      : selectedUser.admin
                      ? `${selectedUser.admin.firstName} ${selectedUser.admin.lastName}`
                      : "User Details"}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedUser.role.replace("_", " ")} • {selectedUser.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={getRoleBadge(selectedUser.role)}>
                      {selectedUser.role.replace("_", " ")}
                    </span>
                    {selectedUser.isActive ? (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                    {selectedUser.isVerified && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-full flex items-center gap-1">
                        <MdVerifiedUser className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <MdClose className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-8">
              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MdPeople className="w-5 h-5" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        User ID
                      </label>
                      <p className="text-foreground font-mono text-sm bg-muted p-2 rounded">
                        {selectedUser.id}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MdEmail className="w-4 h-4" />
                        Email Address
                      </label>
                      <a
                        href={`mailto:${selectedUser.email}`}
                        className="text-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                      >
                        {selectedUser.email}
                      </a>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Account Status
                      </label>
                      <div className="flex items-center gap-2">
                        {selectedUser.isActive ? (
                          <MdCheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <MdCancel className="w-5 h-5 text-red-500" />
                        )}
                        <span
                          className={`font-medium ${
                            selectedUser.isActive
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {selectedUser.isActive
                            ? "Active Account"
                            : "Inactive Account"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Verification Status
                      </label>
                      <div className="flex items-center gap-2">
                        {selectedUser.isVerified ? (
                          <MdVerifiedUser className="w-5 h-5 text-blue-500" />
                        ) : (
                          <MdCancel className="w-5 h-5 text-gray-400" />
                        )}
                        <span
                          className={`font-medium ${
                            selectedUser.isVerified
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {selectedUser.isVerified
                            ? "Email Verified"
                            : "Email Not Verified"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MdAccessTime className="w-4 h-4" />
                        Last Login
                      </label>
                      <p className="text-foreground">
                        {selectedUser.lastLogin ? (
                          formatDate(selectedUser.lastLogin)
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            Never logged in
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MdCalendarToday className="w-4 h-4" />
                        Account Created
                      </label>
                      <p className="text-foreground">
                        {formatDate(selectedUser.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MdUpdate className="w-4 h-4" />
                        Last Updated
                      </label>
                      <p className="text-foreground">
                        {formatDate(selectedUser.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {selectedUser._count && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <MdAttachment className="w-4 h-4" />
                            Attachments
                          </label>
                          <p className="text-foreground">
                            {selectedUser._count.attachments} files
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <MdGroups className="w-4 h-4" />
                            Social Accounts
                          </label>
                          <p className="text-foreground">
                            {selectedUser._count.socialAccounts} connected
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional role-specific information can be added here */}
              {selectedUser.role === "EMPLOYER" && selectedUser.employer && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MdBusiness className="w-5 h-5" />
                    Company Profile Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Company Name
                      </label>
                      <p className="text-foreground font-medium">
                        {selectedUser.employer.companyName}
                      </p>
                    </div>
                    {selectedUser.employer.industry && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Industry
                        </label>
                        <p className="text-foreground">
                          {selectedUser.employer.industry}
                        </p>
                      </div>
                    )}
                    {selectedUser.employer.location && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Location
                        </label>
                        <p className="text-foreground">
                          {selectedUser.employer.location}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Verification Status
                      </label>
                      <div className="flex items-center gap-2">
                        {selectedUser.employer.isVerified ? (
                          <MdVerifiedUser className="w-5 h-5 text-green-500" />
                        ) : (
                          <MdCancel className="w-5 h-5 text-gray-400" />
                        )}
                        <span
                          className={`font-medium ${
                            selectedUser.employer.isVerified
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {selectedUser.employer.isVerified
                            ? "Company Verified"
                            : "Not Verified"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.role === "JOB_SEEKER" && selectedUser.jobSeeker && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MdWork className="w-5 h-5" />
                    Job Seeker Profile Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.jobSeeker.location && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Location
                        </label>
                        <p className="text-foreground">
                          {selectedUser.jobSeeker.location}
                        </p>
                      </div>
                    )}
                    {selectedUser.jobSeeker.experience && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Experience Level
                        </label>
                        <p className="text-foreground">
                          {selectedUser.jobSeeker.experience.replace("_", " ")}
                        </p>
                      </div>
                    )}
                    {selectedUser.jobSeeker.skills.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Skills ({selectedUser.jobSeeker.skills.length})
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.jobSeeker.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-border sticky bottom-0 bg-card">
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    onClick={handleCloseModal}
                    variant="outline"
                    size="sm"
                  >
                    Close
                  </Button>

                  {selectedUser.role !== "ADMIN" && (
                    <>
                      <Button
                        onClick={() => {
                          handleUserAction(
                            selectedUser.id,
                            selectedUser.isActive ? "deactivate" : "activate"
                          );
                          handleCloseModal();
                        }}
                        variant={selectedUser.isActive ? "outline" : "default"}
                        size="sm"
                        disabled={actionLoading !== null}
                      >
                        {selectedUser.isActive ? "Deactivate" : "Activate"}
                      </Button>

                      <Button
                        onClick={() => {
                          handleUserAction(
                            selectedUser.id,
                            selectedUser.isVerified ? "unverify" : "verify"
                          );
                          handleCloseModal();
                        }}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading !== null}
                      >
                        {selectedUser.isVerified ? "Unverify" : "Verify"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
