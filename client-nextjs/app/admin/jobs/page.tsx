"use client";

import { motion } from "framer-motion";

export default function AdminJobsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Job Management
        </h2>
        <p className="text-muted-foreground">
          Approve and manage all job postings
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <p className="text-muted-foreground">
          Job approval interface will be implemented here.
        </p>
      </div>
    </motion.div>
  );
}
