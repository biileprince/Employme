"use client";

import { motion } from "framer-motion";
import { MdPeople, MdWork, MdBusiness, MdDescription } from "react-icons/md";

export default function AdminDashboardPage() {
  const stats = [
    {
      label: "Total Users",
      value: "0",
      icon: MdPeople,
      color: "text-blue-500",
    },
    {
      label: "Employers",
      value: "0",
      icon: MdBusiness,
      color: "text-purple-500",
    },
    { label: "Active Jobs", value: "0", icon: MdWork, color: "text-green-500" },
    {
      label: "Applications",
      value: "0",
      icon: MdDescription,
      color: "text-orange-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Admin Dashboard
        </h2>
        <p className="text-muted-foreground">
          Overview of platform metrics and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-card border border-border rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-xl font-bold text-foreground mb-4">
          Recent Activity
        </h3>
        <p className="text-muted-foreground">
          Platform activity and recent changes will be displayed here.
        </p>
      </motion.div>
    </div>
  );
}
