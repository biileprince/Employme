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
} from "react-icons/md";
import { adminAPI } from "../../services/api";
import Button from "../../components/ui/Button";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  jobSeeker?: {
    location?: string;
    skills: string[];
    experience?: string;
  };
  employer?: {
    companyName?: string;
    industry?: string;
    isVerified: boolean;
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MdPeople className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              User Management
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage platform users, roles, and permissions
          </p>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background appearance-none min-w-[150px]"
              >
                <option value="all">All Roles</option>
                <option value="JOB_SEEKER">Job Seekers</option>
                <option value="EMPLOYER">Employers</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background min-w-[130px]"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <Button onClick={fetchUsers} variant="outline">
              Refresh
            </Button>
          </div>
        </motion.div>

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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground">
                    User
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    Role
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    Details
                  </th>
                  <th className="text-left p-4 font-medium text-foreground">
                    Joined
                  </th>
                  <th className="text-right p-4 font-medium text-foreground">
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
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
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
                      <div className="flex items-center justify-end gap-2">
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

          {/* Pagination */}
          {data && data.pagination.pages > 1 && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * 10 + 1} to{" "}
                  {Math.min(currentPage * 10, data.pagination.total)} of{" "}
                  {data.pagination.total} users
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <MdNavigateBefore className="w-4 h-4" />
                  </Button>

                  <span className="px-3 py-1 text-sm text-foreground">
                    {currentPage} of {data.pagination.pages}
                  </span>

                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === data.pagination.pages}
                    variant="outline"
                    size="sm"
                  >
                    <MdNavigateNext className="w-4 h-4" />
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
      </div>
    </div>
  );
}
