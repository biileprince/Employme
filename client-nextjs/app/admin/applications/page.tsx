"use client";

import { motion } from "framer-motion";

export default function AdminApplicationsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Application Management
        </h2>
        <p className="text-muted-foreground">
          View and manage all job applications
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <p className="text-muted-foreground">
          Application management will be implemented here.
        </p>
      </div>
    </motion.div>
  );
}
