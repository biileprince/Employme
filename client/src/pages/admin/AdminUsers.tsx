import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import ExcelJS from "exceljs";
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
  MdLocationOn,
  MdWork,
  MdCalendarToday,
  MdRefresh,
  MdPhone,
  MdLanguage,
  MdSchool,
  MdDescription,
  MdPublic,
  MdAttachment,
  MdGroups,
  MdCake,
  MdUpdate,
  MdImage,
  MdTableChart,
} from "react-icons/md";
import { adminAPI } from "../../services/api";
import Button from "../../components/ui/Button";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
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

export default function AdminUsers() {
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

      if (response.success) {
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
    fetchUsers();
  }, [fetchUsers]);

  const handleUserAction = async (userId: string, action: string) => {
    // Confirmation prompts
    const actionMessages = {
      activate:
        "Are you sure you want to activate this user? They will be able to access the platform.",
      deactivate:
        "Are you sure you want to deactivate this user? They will lose access to the platform.",
      verify:
        "Are you sure you want to verify this user? This will mark their email as verified.",
      unverify:
        "Are you sure you want to unverify this user? This will mark their email as unverified.",
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
        await fetchUsers(); // Refresh the list
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
        await fetchUsers(); // Refresh the list
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
        return <MdBusiness className="w-5 h-5 text-blue-600" />;
      case "JOB_SEEKER":
        return <MdPersonAdd className="w-5 h-5 text-green-600" />;
      case "ADMIN":
        return <MdVerifiedUser className="w-5 h-5 text-purple-600" />;
      default:
        return <MdPeople className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (role) {
      case "EMPLOYER":
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case "JOB_SEEKER":
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case "ADMIN":
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
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
      setActionLoading("export");

      // Fetch all users for export with current filters applied
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // Large limit to get all users
      });

      // Apply current filters to export
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("isActive", statusFilter);
      if (search) params.append("search", search);

      const response = await adminAPI.getAllUsers(params);

      if (response.success) {
        const users = (response.data as UsersData).users;

        // Create Excel workbook using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Users Export", {
          properties: { tabColor: { argb: "FF4F46E5" } },
        });

        // Set worksheet properties
        worksheet.properties.defaultRowHeight = 20;

        // Define columns with proper widths and formatting
        worksheet.columns = [
          { header: "User ID", key: "id", width: 25 },
          { header: "First Name", key: "firstName", width: 15 },
          { header: "Last Name", key: "lastName", width: 15 },
          { header: "Full Name", key: "fullName", width: 25 },
          { header: "Email Address", key: "email", width: 30 },
          { header: "Country Code", key: "countryCode", width: 12 },
          { header: "Phone Number", key: "phone", width: 15 },
          { header: "Full Phone", key: "fullPhone", width: 18 },
          { header: "User Role", key: "role", width: 12 },
          { header: "Account Status", key: "status", width: 12 },
          { header: "Email Verified", key: "verified", width: 12 },
          { header: "Profile Image", key: "imageUrl", width: 20 },
          { header: "Company Name", key: "companyName", width: 25 },
          { header: "Industry", key: "industry", width: 20 },
          { header: "Company Size", key: "companySize", width: 15 },
          { header: "Founded Year", key: "founded", width: 12 },
          { header: "Location", key: "location", width: 20 },
          { header: "Skills", key: "skills", width: 40 },
          { header: "Experience Level", key: "experience", width: 15 },
          { header: "Date of Birth", key: "dateOfBirth", width: 12 },
          { header: "Bio/Description", key: "bio", width: 50 },
          { header: "Website", key: "website", width: 30 },
          { header: "Registration Date", key: "createdAt", width: 15 },
          { header: "Last Updated", key: "updatedAt", width: 15 },
          {
            header: "Days Since Registration",
            key: "daysSinceRegistration",
            width: 18,
          },
          { header: "Account Age Category", key: "ageCategory", width: 18 },
        ];

        // Style the header row
        worksheet.getRow(1).eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4F46E5" },
          };
          cell.font = {
            color: { argb: "FFFFFFFF" },
            bold: true,
            size: 11,
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Add data rows with styling
        users.forEach((user: User, index: number) => {
          const fullName =
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || user.lastName || "N/A";

          const countryCode =
            user.jobSeeker?.countryCode || user.employer?.countryCode || "";
          const phone = user.jobSeeker?.phone || user.employer?.phone || "";
          const fullPhone =
            countryCode && phone ? `${countryCode} ${phone}` : phone || "N/A";

          const registrationDate = new Date(user.createdAt);
          const daysSinceRegistration = Math.floor(
            (new Date().getTime() - registrationDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          let accountAgeCategory = "New (0-30 days)";
          if (daysSinceRegistration > 365)
            accountAgeCategory = "Veteran (1+ years)";
          else if (daysSinceRegistration > 90)
            accountAgeCategory = "Regular (3+ months)";
          else if (daysSinceRegistration > 30)
            accountAgeCategory = "Active (1+ months)";

          const rowData = {
            id: user.id,
            firstName: user.firstName || "N/A",
            lastName: user.lastName || "N/A",
            fullName,
            email: user.email,
            countryCode: countryCode || "N/A",
            phone: phone || "N/A",
            fullPhone,
            role: user.role.replace("_", " "),
            status: user.isActive ? "Active" : "Inactive",
            verified: user.isVerified ? "Verified" : "Unverified",
            imageUrl: user.imageUrl || "No image",
            companyName: user.employer?.companyName || "N/A",
            industry: user.employer?.industry || "N/A",
            companySize: user.employer?.companySize || "N/A",
            founded: user.employer?.founded || "N/A",
            location: user.jobSeeker?.location || "N/A",
            skills: user.jobSeeker?.skills
              ? user.jobSeeker.skills.join("; ")
              : "N/A",
            experience: user.jobSeeker?.experience || "N/A",
            dateOfBirth: user.jobSeeker?.dateOfBirth || "N/A",
            bio: user.jobSeeker?.bio || user.employer?.description || "N/A",
            website: user.employer?.website || "N/A",
            createdAt: formatDate(user.createdAt),
            updatedAt: formatDate(user.updatedAt),
            daysSinceRegistration,
            ageCategory: accountAgeCategory,
          };

          const row = worksheet.addRow(rowData);

          // Alternate row colors for better readability
          if (index % 2 === 0) {
            row.eachCell((cell) => {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF8FAFC" },
              };
            });
          }

          // Style specific cells based on content
          row.getCell("status").font = {
            color: { argb: user.isActive ? "FF16A34A" : "FFDC2626" },
            bold: true,
          };

          row.getCell("verified").font = {
            color: { argb: user.isVerified ? "FF16A34A" : "FFDC2626" },
            bold: true,
          };

          row.getCell("role").font = {
            color: {
              argb:
                user.role === "ADMIN"
                  ? "FF7C3AED"
                  : user.role === "EMPLOYER"
                  ? "FF2563EB"
                  : "FF059669",
            },
            bold: true,
          };

          // Add borders to all cells
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin", color: { argb: "FFE2E8F0" } },
              left: { style: "thin", color: { argb: "FFE2E8F0" } },
              bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
              right: { style: "thin", color: { argb: "FFE2E8F0" } },
            };
            cell.alignment = {
              vertical: "middle",
              wrapText: true,
            };
          });
        });

        // Add summary information
        const summaryRow = worksheet.addRow({});
        summaryRow.getCell(1).value = `Total Users Exported: ${users.length}`;
        summaryRow.getCell(1).font = { bold: true, size: 12 };
        summaryRow.getCell(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFEF3C7" },
        };

        const filterInfoRow = worksheet.addRow({});
        let filterInfo = "Filters Applied: ";
        if (roleFilter !== "all") filterInfo += `Role: ${roleFilter} `;
        if (statusFilter !== "all")
          filterInfo += `Status: ${
            statusFilter === "true" ? "Active" : "Inactive"
          } `;
        if (search) filterInfo += `Search: "${search}" `;
        if (filterInfo === "Filters Applied: ") filterInfo += "None";

        filterInfoRow.getCell(1).value = filterInfo;
        filterInfoRow.getCell(1).font = { italic: true };

        // Freeze the header row
        worksheet.views = [{ state: "frozen", ySplit: 1 }];

        // Generate filename with filter info
        let filename = "Employme_Users_Export";
        if (roleFilter !== "all") filename += `_${roleFilter.toLowerCase()}`;
        if (statusFilter !== "all")
          filename += `_${statusFilter === "true" ? "active" : "inactive"}`;
        if (search) filename += "_filtered";
        filename += `_${new Date().toISOString().split("T")[0]}.xlsx`;

        // Generate Excel file and download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Show success message
        console.log(
          `✅ Successfully exported ${users.length} users to ${filename}`
        );
      }
    } catch (err) {
      console.error("Failed to export users:", err);
      setError("Failed to export users");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        {/* Header - Mobile Optimized */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <MdPeople className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  User Management
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>

            {/* Export Button - Enhanced Responsive Design */}
            <Button
              onClick={exportUsersToExcel}
              variant="primary"
              isLoading={actionLoading === "export"}
              disabled={actionLoading !== null}
              className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 border-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[100px] sm:min-w-[140px]"
            >
              <MdTableChart className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                {actionLoading === "export" ? "Exporting..." : "Export Excel"}
              </span>
            </Button>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Filters - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8"
          >
            {/* Mobile: Search first, then filters in grid */}
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

              {/* Filters in responsive grid - Better Alignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Role Filter */}
                <div className="relative">
                  <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
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
                  fullWidth
                >
                  <MdRefresh className="w-4 h-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6"
          >
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground min-w-[200px]">
                    User
                  </th>
                  <th className="text-left p-4 font-medium text-foreground min-w-[120px]">
                    Role
                  </th>
                  <th className="text-left p-4 font-medium text-foreground min-w-[140px]">
                    Status
                  </th>
                  <th className="text-left p-4 font-medium text-foreground min-w-[180px]">
                    Details
                  </th>
                  <th className="text-left p-4 font-medium text-foreground min-w-[120px]">
                    Joined
                  </th>
                  <th className="text-right p-4 font-medium text-foreground min-w-[200px]">
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
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : "No Name"}
                          </p>
                          <a
                            href={`mailto:${user.email}`}
                            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                          >
                            {user.email}
                          </a>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={getRoleBadge(user.role)}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <MdCheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <MdCancel className="w-5 h-5 text-red-500" />
                        )}
                        <span
                          className={`text-sm ${
                            user.isActive ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                        {user.isVerified && (
                          <MdVerifiedUser className="w-4 h-4 text-blue-500 ml-1" />
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-sm">
                        {user.role === "EMPLOYER" && user.employer && (
                          <div>
                            <p className="text-foreground">
                              {user.employer.companyName || "No Company"}
                            </p>
                            <p className="text-muted-foreground">
                              {user.employer.industry || "No Industry"}
                            </p>
                          </div>
                        )}
                        {user.role === "JOB_SEEKER" && user.jobSeeker && (
                          <div>
                            <p className="text-foreground">
                              {user.jobSeeker.location || "No Location"}
                            </p>
                            <p className="text-muted-foreground">
                              {user.jobSeeker.skills.slice(0, 2).join(", ")}
                              {user.jobSeeker.skills.length > 2 &&
                                ` +${user.jobSeeker.skills.length - 2}`}
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

                    <td className="p-4">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </p>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button
                          onClick={() => handleViewUser(user)}
                          variant="outline"
                          size="sm"
                          disabled={actionLoading !== null}
                        >
                          <MdVisibility className="w-4 h-4 mr-1" />
                          View
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
                            >
                              {user.isActive ? "Deactivate" : "Activate"}
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
                            >
                              {user.isVerified ? "Unverify" : "Verify"}
                            </Button>

                            <Button
                              onClick={() => handleDeleteUser(user.id)}
                              variant="outline"
                              size="sm"
                              isLoading={actionLoading === user.id}
                              disabled={actionLoading !== null}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <MdDelete className="w-4 h-4" />
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

          {/* Mobile Card View - Enhanced for Mobile */}
          <div className="md:hidden">
            {data?.users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                {/* User Header - Mobile Optimized */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "No Name"}
                      </h3>
                      <span
                        className={
                          getRoleBadge(user.role) + " text-xs px-2 py-1"
                        }
                      >
                        {user.role.replace("_", " ")}
                      </span>
                    </div>
                    <a
                      href={`mailto:${user.email}`}
                      className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors truncate mb-2 block"
                    >
                      {user.email}
                    </a>

                    {/* Status Row */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        {user.isActive ? (
                          <MdCheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <MdCancel className="w-4 h-4 text-red-500" />
                        )}
                        <span
                          className={
                            user.isActive ? "text-green-600" : "text-red-600"
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {user.isVerified && (
                        <div className="flex items-center gap-1">
                          <MdVerifiedUser className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-600">Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Details - Mobile Friendly */}
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

                {/* Date and Actions Row */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(user.createdAt)}
                  </p>

                  {/* Mobile Action Buttons - Touch Friendly */}
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
                          className="h-10 min-w-[44px] flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50"
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

          {/* Pagination - Mobile Optimized */}
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

        {/* Comprehensive User Details Modal */}
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
                <div className="flex items-center gap-4">
                  {/* Profile Image or Icon */}
                  <div className="relative">
                    {selectedUser.imageUrl ||
                    selectedUser.jobSeeker?.profileImageUrl ||
                    selectedUser.employer?.logoUrl ? (
                      <img
                        src={
                          selectedUser.imageUrl ||
                          selectedUser.jobSeeker?.profileImageUrl ||
                          selectedUser.employer?.logoUrl ||
                          ""
                        }
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove(
                            "hidden"
                          );
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center ${
                        selectedUser.imageUrl ||
                        selectedUser.jobSeeker?.profileImageUrl ||
                        selectedUser.employer?.logoUrl
                          ? "hidden"
                          : ""
                      }`}
                    >
                      {getRoleIcon(selectedUser.role)}
                    </div>
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
                      {selectedUser.role.replace("_", " ")} •{" "}
                      {selectedUser.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={getRoleBadge(selectedUser.role)}>
                        {selectedUser.role.replace("_", " ")}
                      </span>
                      {selectedUser.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                      {selectedUser.isVerified && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
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
                                ? "text-green-600"
                                : "text-red-600"
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
                                ? "text-blue-600"
                                : "text-gray-600"
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

                {/* Social Accounts */}
                {selectedUser.socialAccounts &&
                  selectedUser.socialAccounts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <MdGroups className="w-5 h-5" />
                        Connected Social Accounts
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUser.socialAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="p-4 border border-border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <MdLanguage className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground capitalize">
                                  {account.provider}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {account.displayName ||
                                    account.email ||
                                    "No display name"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Connected: {formatDate(account.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Job Seeker Detailed Information */}
                {selectedUser.role === "JOB_SEEKER" &&
                  selectedUser.jobSeeker && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <MdWork className="w-5 h-5" />
                        Job Seeker Profile Details
                      </h3>
                      <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Profile Name
                            </label>
                            <p className="text-foreground">
                              {selectedUser.jobSeeker.firstName}{" "}
                              {selectedUser.jobSeeker.lastName}
                            </p>
                          </div>
                          {selectedUser.jobSeeker.dateOfBirth && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                <MdCake className="w-4 h-4" />
                                Date of Birth
                              </label>
                              <p className="text-foreground">
                                {formatDate(selectedUser.jobSeeker.dateOfBirth)}
                              </p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <MdLocationOn className="w-4 h-4" />
                              Location
                            </label>
                            <p className="text-foreground">
                              {selectedUser.jobSeeker.location ||
                                "Not specified"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Experience Level
                            </label>
                            <p className="text-foreground">
                              {selectedUser.jobSeeker.experience?.replace(
                                "_",
                                " "
                              ) || "Not specified"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <MdPhone className="w-4 h-4" />
                              Phone
                            </label>
                            {selectedUser.jobSeeker.countryCode &&
                            selectedUser.jobSeeker.phone ? (
                              <a
                                href={`tel:${selectedUser.jobSeeker.countryCode}${selectedUser.jobSeeker.phone}`}
                                className="text-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                              >
                                {`${selectedUser.jobSeeker.countryCode} ${selectedUser.jobSeeker.phone}`}
                              </a>
                            ) : (
                              <p className="text-foreground">Not provided</p>
                            )}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <MdPublic className="w-4 h-4" />
                              Profile Visibility
                            </label>
                            <p className="text-foreground">
                              {selectedUser.jobSeeker.isProfilePublic
                                ? "Public"
                                : "Private"}
                            </p>
                          </div>
                        </div>

                        {/* Bio */}
                        {selectedUser.jobSeeker.bio && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2">
                              <MdDescription className="w-4 h-4" />
                              Biography
                            </label>
                            <div className="p-4 bg-muted/30 rounded-lg">
                              <p className="text-foreground whitespace-pre-wrap">
                                {selectedUser.jobSeeker.bio}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Education */}
                        {selectedUser.jobSeeker.education && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2">
                              <MdSchool className="w-4 h-4" />
                              Education
                            </label>
                            <div className="p-4 bg-muted/30 rounded-lg">
                              <p className="text-foreground">
                                {selectedUser.jobSeeker.education}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Skills */}
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Skills ({selectedUser.jobSeeker.skills.length})
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {selectedUser.jobSeeker.skills.length > 0 ? (
                              selectedUser.jobSeeker.skills.map(
                                (skill, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                  >
                                    {skill}
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-muted-foreground">
                                No skills listed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CV Information */}
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2">
                            <MdAttachment className="w-4 h-4" />
                            CV/Resume
                          </label>
                          {selectedUser.jobSeeker.cvUrl ? (
                            <div className="p-4 border border-border rounded-lg">
                              <p className="text-foreground mb-2">
                                CV uploaded
                              </p>
                              <Button
                                onClick={() =>
                                  window.open(
                                    selectedUser.jobSeeker?.cvUrl,
                                    "_blank"
                                  )
                                }
                                variant="outline"
                                size="sm"
                              >
                                View CV
                              </Button>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">
                              No CV uploaded
                            </p>
                          )}
                        </div>

                        {/* Profile Timestamps */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Profile Created
                            </label>
                            <p className="text-foreground">
                              {formatDate(selectedUser.jobSeeker.createdAt)}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Profile Updated
                            </label>
                            <p className="text-foreground">
                              {formatDate(selectedUser.jobSeeker.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Employer Detailed Information */}
                {selectedUser.role === "EMPLOYER" && selectedUser.employer && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <MdBusiness className="w-5 h-5" />
                      Company Profile Details
                    </h3>
                    <div className="space-y-6">
                      {/* Company Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Company Name
                          </label>
                          <p className="text-foreground font-medium">
                            {selectedUser.employer.companyName}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Job Title
                          </label>
                          <p className="text-foreground">
                            {selectedUser.employer.title || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Industry
                          </label>
                          <p className="text-foreground">
                            {selectedUser.employer.industry || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <MdLocationOn className="w-4 h-4" />
                            Location
                          </label>
                          <p className="text-foreground">
                            {selectedUser.employer.location || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <MdLanguage className="w-4 h-4" />
                            Website
                          </label>
                          {selectedUser.employer.website ? (
                            <a
                              href={selectedUser.employer.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {selectedUser.employer.website}
                            </a>
                          ) : (
                            <p className="text-foreground">Not provided</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <MdPhone className="w-4 h-4" />
                            Phone
                          </label>
                          {selectedUser.employer.countryCode &&
                          selectedUser.employer.phone ? (
                            <a
                              href={`tel:${selectedUser.employer.countryCode}${selectedUser.employer.phone}`}
                              className="text-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                            >
                              {`${selectedUser.employer.countryCode} ${selectedUser.employer.phone}`}
                            </a>
                          ) : (
                            <p className="text-foreground">Not provided</p>
                          )}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Company Size
                          </label>
                          <p className="text-foreground">
                            {selectedUser.employer.companySize ||
                              "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Founded Year
                          </label>
                          <p className="text-foreground">
                            {selectedUser.employer.founded || "Not specified"}
                          </p>
                        </div>
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
                                  ? "text-green-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {selectedUser.employer.isVerified
                                ? "Company Verified"
                                : "Not Verified"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Company Description */}
                      {selectedUser.employer.description && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2">
                            <MdDescription className="w-4 h-4" />
                            Company Description
                          </label>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-foreground whitespace-pre-wrap">
                              {selectedUser.employer.description}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Company Logo */}
                      {selectedUser.employer.logoUrl && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-2">
                            <MdImage className="w-4 h-4" />
                            Company Logo
                          </label>
                          <div className="p-4 border border-border rounded-lg">
                            <img
                              src={selectedUser.employer.logoUrl}
                              alt="Company Logo"
                              className="h-16 w-auto object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling!.textContent =
                                  "Logo failed to load";
                              }}
                            />
                            <p className="text-muted-foreground text-sm mt-2 hidden">
                              Logo failed to load
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Company Profile Timestamps */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Company Profile Created
                          </label>
                          <p className="text-foreground">
                            {formatDate(selectedUser.employer.createdAt)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Company Profile Updated
                          </label>
                          <p className="text-foreground">
                            {formatDate(selectedUser.employer.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Detailed Information */}
                {selectedUser.role === "ADMIN" && selectedUser.admin && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <MdVerifiedUser className="w-5 h-5" />
                      Administrator Details
                    </h3>
                    <div className="space-y-4">
                      <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Admin Name
                            </label>
                            <p className="text-foreground font-medium">
                              {selectedUser.admin.firstName}{" "}
                              {selectedUser.admin.lastName}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Admin Since
                            </label>
                            <p className="text-foreground">
                              {formatDate(selectedUser.admin.createdAt)}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Last Admin Update
                            </label>
                            <p className="text-foreground">
                              {formatDate(selectedUser.admin.updatedAt)}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">
                              Privileges
                            </label>
                            <p className="font-medium text-primary">
                              Full Platform Access
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-800 font-medium text-sm">
                            ⚠️ Security Notice: This user has administrative
                            privileges and can manage all platform operations.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Actions - Mobile Responsive with Horizontal Layout */}
                <div className="pt-4 border-t border-border sticky bottom-0 bg-card">
                  {/* User ID - Mobile: Center, Desktop: Left */}
                  <div className="text-xs text-muted-foreground font-mono text-center sm:text-left mb-3">
                    ID: {selectedUser.id}
                  </div>

                  {/* Horizontal button layout for both mobile and desktop */}
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                    <Button
                      onClick={handleCloseModal}
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-initial min-w-0 px-3 py-2 text-xs sm:text-sm"
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
                          variant={
                            selectedUser.isActive ? "outline" : "primary"
                          }
                          size="sm"
                          disabled={actionLoading !== null}
                          className="flex-1 sm:flex-initial min-w-0 px-3 py-2 text-xs sm:text-sm"
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
                          className="flex-1 sm:flex-initial min-w-0 px-3 py-2 text-xs sm:text-sm"
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
    </div>
  );
}
