"use client";

import Link from "next/link";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { motion } from "framer-motion";
import {
  MdCheckCircle,
  MdPeople,
  MdBusiness,
  MdTrendingUp,
} from "react-icons/md";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary to-primary-600 py-20 text-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
                About Employ.me
              </h1>
              <p className="mx-auto max-w-3xl text-xl text-primary-100">
                Ghana&apos;s leading job platform connecting talented professionals
                with top employers
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="mb-6 text-3xl font-bold text-foreground">
                  Our Mission
                </h2>
                <p className="mb-4 text-lg text-muted-foreground">
                  At Employ.me, we&apos;re dedicated to transforming the job search
                  and recruitment experience in Ghana. Our mission is to bridge
                  the gap between talented professionals and forward-thinking
                  companies.
                </p>
                <p className="text-lg text-muted-foreground">
                  We believe that finding the right job or the right candidate
                  shouldn&apos;t be difficult. That&apos;s why we&apos;ve built a platform that
                  makes the process simple, efficient, and effective for
                  everyone.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="mb-6 text-3xl font-bold text-foreground">
                  Our Vision
                </h2>
                <p className="mb-4 text-lg text-muted-foreground">
                  We envision a Ghana where every professional has access to
                  opportunities that match their skills and aspirations, and
                  where every company can easily find the talent they need to
                  grow.
                </p>
                <p className="text-lg text-muted-foreground">
                  Through technology and innovation, we&apos;re making this vision a
                  reality, one connection at a time.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: MdBusiness, value: "500+", label: "Active Employers" },
                { icon: MdPeople, value: "10,000+", label: "Job Seekers" },
                { icon: MdCheckCircle, value: "5,000+", label: "Jobs Posted" },
                { icon: MdTrendingUp, value: "85%", label: "Success Rate" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="mx-auto mb-4 h-12 w-12 text-primary" />
                  <div className="mb-2 text-4xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center text-3xl font-bold text-foreground"
            >
              Our Core Values
            </motion.h2>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Innovation",
                  description:
                    "We continuously improve our platform with the latest technology to provide the best experience.",
                },
                {
                  title: "Transparency",
                  description:
                    "We believe in clear, honest communication between job seekers and employers.",
                },
                {
                  title: "Quality",
                  description:
                    "We maintain high standards for both job postings and candidate profiles.",
                },
                {
                  title: "Accessibility",
                  description:
                    "Our platform is designed to be easy to use for everyone, regardless of technical expertise.",
                },
                {
                  title: "Community",
                  description:
                    "We foster a supportive environment where professionals can grow and connect.",
                },
                {
                  title: "Excellence",
                  description:
                    "We strive for excellence in everything we do, from customer service to platform performance.",
                },
              ].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <h3 className="mb-3 text-xl font-bold text-foreground">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6 text-3xl font-bold">Ready to Get Started?</h2>
              <p className="mx-auto mb-8 max-w-2xl text-xl text-primary-100">
                Join thousands of professionals and companies already using
                Employ.me
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/auth/signup">
                  <button className="rounded-lg bg-white px-8 py-3 font-semibold text-primary transition-colors hover:bg-primary-50">
                    Create Account
                  </button>
                </Link>
                <Link href="/jobs">
                  <button className="rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-primary">
                    Browse Jobs
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
