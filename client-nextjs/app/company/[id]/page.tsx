"use client";

import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { motion } from "framer-motion";
import { MdLocationOn, MdBusiness, MdWork } from "react-icons/md";
import { use } from "react";

export default function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Company Header */}
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm mb-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MdBusiness className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Company Name
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <MdLocationOn className="w-5 h-5" />
                    <span>Location</span>
                  </div>
                  <p className="text-muted-foreground">
                    Company details will be loaded here.
                  </p>
                </div>
              </div>
            </div>

            {/* Company Jobs */}
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <MdWork className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  Open Positions
                </h2>
              </div>
              <p className="text-muted-foreground">
                Job listings from this company will appear here.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
