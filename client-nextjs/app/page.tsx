"use client";

import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  MdLocationOn,
  MdAttachMoney,
  MdPerson,
  MdSearch,
  MdCheckCircle,
  MdBusiness,
  MdPeople,
  MdHowToReg,
} from "react-icons/md";
import Image from "next/image";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerChildren: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6 },
  },
};

const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6 },
  },
};

export default function Home() {
  const featuredJobs = [
    {
      id: 1,
      title: "Software Developer",
      company: "Ghana Tech Hub",
      location: "Accra, Ghana",
      type: "Full-time",
      salary: "GHS 8,000 - 15,000",
      logo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=64&h=64&fit=crop&crop=center",
    },
    {
      id: 2,
      title: "Digital Marketing Specialist",
      company: "Kumasi Digital",
      location: "Kumasi, Ghana",
      type: "Full-time",
      salary: "GHS 5,000 - 9,000",
      logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=64&h=64&fit=crop&crop=center",
    },
    {
      id: 3,
      title: "Customer Service Rep",
      company: "Call Center Plus",
      location: "Remote Ghana",
      type: "Part-time",
      salary: "GHS 2,500 - 4,000",
      logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=64&h=64&fit=crop&crop=center",
    },
  ];

  const testimonials = [
    {
      name: "Akosua Mensah",
      role: "Accountant in Accra",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
      text: "I was looking for an accounting job for months. Employ.me helped me find a position at a great company in East Legon within 2 weeks. The process was so easy!",
    },
    {
      name: "Kwame Asante",
      role: "IT Support, Kumasi",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
      text: "Fresh out of university, I didn't know where to start looking for jobs. Employ.me showed me opportunities I didn't even know existed in Kumasi!",
    },
    {
      name: "Ama Osei",
      role: "HR Manager",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
      text: "As a business owner, I've found excellent staff through Employ.me. The candidates are serious about working and the platform makes hiring much easier for small businesses like mine.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section with Background Video */}
        <div className="relative flex min-h-[700px] items-center overflow-hidden bg-gradient-to-br from-primary-50 via-background to-secondary-50">
          {/* Video Background - Hidden on light mode for better clarity */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute left-0 top-0 z-0 h-full w-full object-cover opacity-0 dark:opacity-30"
          >
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-business-people-working-in-an-office-4900-large.mp4"
              type="video/mp4"
            />
          </video>

          <div className="container relative z-20 mx-auto px-4">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
              >
                <Card className="border-2 shadow-2xl">
                  <CardContent className="p-8 md:p-10">
                    <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                      Find Your Next Job in
                      <span className="block text-secondary-600">
                        Ghana & Beyond
                      </span>
                    </h1>
                    <p className="mb-8 text-xl leading-relaxed text-muted-foreground md:text-2xl">
                      Ghana&apos;s leading job platform connecting talented
                      professionals with great employers. Whether you&apos;re in
                      Accra, Kumasi, or anywhere else, find opportunities that
                      fit your skills and dreams.
                    </p>
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <Link href="/jobs">
                        <Button
                          size="lg"
                          className="w-full sm:w-auto px-8 py-4 text-lg font-semibold shadow-lg"
                        >
                          Explore Opportunities
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full sm:w-auto px-8 py-4 text-lg font-semibold shadow-lg"
                        >
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                className="relative hidden lg:block"
              >
                <Card className="overflow-hidden border-2 shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop"
                    alt="Professional woman working on laptop"
                    width={600}
                    height={800}
                    className="h-auto w-full object-cover"
                  />
                </Card>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Featured Jobs Section */}
        <section className="relative py-20 bg-muted/20">
          <div className="container relative z-20 mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
              className="mb-16 text-center"
            >
              <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
                Latest Job Openings
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Fresh job opportunities from top companies in Ghana and
                international remote positions
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerChildren}
              className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {featuredJobs.map((job) => (
                <motion.div key={job.id} variants={fadeInUp}>
                  <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={job.logo}
                            alt={`${job.company} logo`}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {job.company.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">
                            {job.title}
                          </CardTitle>
                          <CardDescription className="text-base font-medium">
                            {job.company}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <p className="flex items-center text-muted-foreground">
                          <MdLocationOn className="mr-2 h-5 w-5 flex-shrink-0" />
                          <span>{job.location}</span>
                        </p>
                        <p className="flex items-center text-muted-foreground">
                          <MdAttachMoney className="mr-2 h-5 w-5 flex-shrink-0" />
                          <span>{job.salary}/year</span>
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-sm">
                        {job.type}
                      </Badge>
                      <Link href="/jobs">
                        <Button size="sm" className="font-semibold">
                          View Details
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
              className="mt-12 text-center"
            >
              <Link href="/jobs">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 text-lg font-semibold"
                >
                  View All Jobs
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="relative bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
              className="mb-16 text-center"
            >
              <h2 className="mb-6 text-3xl font-bold text-card-foreground md:text-4xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Connecting job seekers across Ghana with employers looking for
                great talent
              </p>
            </motion.div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
              {/* Job Seekers Section */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={slideInFromLeft}
                className="space-y-8"
              >
                <div className="text-center lg:text-left">
                  <h3 className="mb-4 text-2xl font-bold text-primary md:text-3xl">
                    Looking for a Job?
                  </h3>
                  <p className="mb-8 text-lg text-muted-foreground">
                    Get hired in Ghana with these 3 easy steps
                  </p>
                </div>

                <div className="space-y-6">
                  <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/40">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                            <MdPerson className="h-7 w-7" />
                          </div>
                          <Badge className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                            1
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-2 text-lg font-semibold text-foreground">
                            Create Your Profile
                          </h4>
                          <p className="leading-relaxed text-muted-foreground">
                            Set up your profile with your skills, experience,
                            and what kind of job you&apos;re looking for. Make
                            it easy for employers to find you.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/40">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                            <MdSearch className="h-7 w-7" />
                          </div>
                          <Badge className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                            2
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-2 text-lg font-semibold text-foreground">
                            Search & Find Jobs
                          </h4>
                          <p className="leading-relaxed text-muted-foreground">
                            Browse through hundreds of job listings in Ghana.
                            Use filters to find jobs that match your skills,
                            location, and salary expectations.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/40">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                            <MdCheckCircle className="h-7 w-7" />
                          </div>
                          <Badge className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                            3
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-2 text-lg font-semibold text-foreground">
                            Apply & Get Hired
                          </h4>
                          <p className="leading-relaxed text-muted-foreground">
                            Apply directly to jobs you like and track your
                            applications. Get notifications when employers are
                            interested in your profile.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>

              {/* Employers Section */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={slideInFromRight}
                className="space-y-8"
              >
                <div className="text-center lg:text-left">
                  <h3 className="mb-4 text-2xl font-bold text-secondary md:text-3xl">
                    Need to Hire Staff?
                  </h3>
                  <p className="mb-8 text-lg text-muted-foreground">
                    Find qualified candidates in Ghana quickly and easily
                  </p>
                </div>

                <div className="space-y-6">
                  <Card className="transition-all duration-300 hover:shadow-lg hover:border-secondary/40">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-md">
                            <MdBusiness className="h-7 w-7" />
                          </div>
                          <Badge
                            variant="secondary"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
                          >
                            1
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-2 text-lg font-semibold text-foreground">
                            Post Your Job Openings
                          </h4>
                          <p className="leading-relaxed text-muted-foreground">
                            Create job posts with clear descriptions of what
                            you&apos;re looking for. Include salary ranges and
                            benefits to attract the right people.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="transition-all duration-300 hover:shadow-lg hover:border-secondary/40">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-md">
                            <MdPeople className="h-7 w-7" />
                          </div>
                          <Badge
                            variant="secondary"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
                          >
                            2
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-2 text-lg font-semibold text-foreground">
                            Review Applications
                          </h4>
                          <p className="leading-relaxed text-muted-foreground">
                            See who has applied to your jobs. Check their
                            profiles, experience, and skills to find the best
                            candidates for your company.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="transition-all duration-300 hover:shadow-lg hover:border-secondary/40">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-md">
                            <MdHowToReg className="h-7 w-7" />
                          </div>
                          <Badge
                            variant="secondary"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
                          >
                            3
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-2 text-lg font-semibold text-foreground">
                            Hire the Right People
                          </h4>
                          <p className="leading-relaxed text-muted-foreground">
                            Contact candidates you like and schedule interviews.
                            Build a strong team with people who fit your company
                            culture and needs.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>

            {/* Success Stats */}
            <div className="mt-20 grid grid-cols-2 gap-8 text-center md:grid-cols-4">
              <div>
                <div className="mb-2 text-3xl font-bold text-primary md:text-4xl">
                  50K+
                </div>
                <div className="font-medium text-muted-foreground">
                  Global Opportunities
                </div>
              </div>
              <div>
                <div className="mb-2 text-3xl font-bold text-primary md:text-4xl">
                  250K+
                </div>
                <div className="font-medium text-muted-foreground">
                  Professionals Worldwide
                </div>
              </div>
              <div>
                <div className="mb-2 text-3xl font-bold text-primary md:text-4xl">
                  10K+
                </div>
                <div className="font-medium text-muted-foreground">
                  Leading Companies
                </div>
              </div>
              <div>
                <div className="mb-2 text-3xl font-bold text-primary md:text-4xl">
                  98%
                </div>
                <div className="font-medium text-muted-foreground">
                  Satisfaction Rate
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="relative overflow-hidden bg-linear-to-br from-primary-50 to-secondary-50 py-20 dark:from-primary-900/50 dark:to-secondary-900/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
              className="mb-16 text-center"
            >
              <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
                Success Stories from Ghana
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Real people in Ghana who found great jobs through Employ.me
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerChildren}
              className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              {testimonials.map((testimonial, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="h-full transition-all duration-300 hover:shadow-xl">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary/20">
                          <AvatarImage
                            src={testimonial.image}
                            alt={testimonial.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                            {testimonial.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {testimonial.name}
                          </CardTitle>
                          <CardDescription className="text-base">
                            {testimonial.role}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-relaxed text-muted-foreground mb-4">
                        &quot;{testimonial.text}&quot;
                      </p>
                      <div
                        className="flex gap-1 text-secondary-600"
                        aria-label="5 star rating"
                      >
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-xl">
                            ★
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Dual CTA Section */}
        <section className="bg-gradient-to-br from-muted/30 via-background to-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
                Ready to Take the Next Step?
              </h2>
              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground">
                Whether you&apos;re looking to advance your career or find top
                talent, we&apos;ve got you covered.
              </p>
            </div>

            <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Job Seekers CTA */}
              <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-primary/40">
                <CardContent className="p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                      <MdPerson className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                        For Job Seekers
                      </h3>
                      <p className="text-lg text-muted-foreground">
                        Find your dream career
                      </p>
                    </div>
                  </div>

                  <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                    Find jobs in Accra, Kumasi, Takoradi and all over Ghana.
                    Create your profile and start getting job offers from
                    employers.
                  </p>

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Link href="/signup" className="flex-1">
                      <Button
                        size="lg"
                        className="w-full px-6 py-4 text-lg font-semibold shadow-lg"
                      >
                        Create Profile
                      </Button>
                    </Link>
                    <Link href="/jobs" className="flex-1">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full px-6 py-4 text-lg font-semibold"
                      >
                        Browse Jobs
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Employers CTA */}
              <Card className="relative overflow-hidden border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-secondary/40">
                <CardContent className="p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-secondary-foreground shadow-lg">
                      <MdBusiness className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                        For Employers
                      </h3>
                      <p className="text-lg text-muted-foreground">
                        Hire exceptional talent
                      </p>
                    </div>
                  </div>

                  <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                    Looking for workers in Ghana? Post your job openings and get
                    applications from qualified candidates ready to work.
                  </p>

                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Link href="/signup?role=employer" className="flex-1">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="w-full px-6 py-4 text-lg font-semibold shadow-lg"
                      >
                        Post a Job
                      </Button>
                    </Link>
                    <Link href="/employers" className="flex-1">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full px-6 py-4 text-lg font-semibold"
                      >
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transform Your Career Section */}
            <Card className="overflow-hidden border-2 shadow-2xl">
              <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
                {/* Content Side */}
                <CardContent className="bg-gradient-to-br from-primary to-primary-800 p-8 text-primary-foreground dark:from-primary-600 dark:to-primary-800 lg:p-12">
                  <h3 className="mb-6 text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
                    Ready to Find Your
                    <span className="block text-secondary-300">Next Job?</span>
                  </h3>
                  <p className="mb-8 text-xl leading-relaxed text-white opacity-95">
                    Join thousands of Ghanaians who have found great jobs
                    through Employ.me. Whether you&apos;re a fresh graduate or
                    experienced professional, your next opportunity is here.
                  </p>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Link href="/signup">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="w-full sm:w-auto px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        Start Your Journey
                      </Button>
                    </Link>
                    <Link href="/jobs">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white shadow-lg backdrop-blur-sm hover:bg-white/20 hover:text-white"
                      >
                        Explore Jobs
                      </Button>
                    </Link>
                  </div>
                </CardContent>

                {/* Image Side */}
                <div className="relative min-h-[300px] bg-muted/20 lg:min-h-[400px]">
                  <Image
                    src="https://images.unsplash.com/photo-1556745753-b2904692b3cd?w=800&h=600&fit=crop"
                    alt="Happy professional greeting"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="mb-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-primary-100 dark:bg-primary-800 rounded-full p-4">
                    <MdCheckCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Stay Updated with the Latest Job Opportunities
                </h2>

                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Subscribe to our newsletter and never miss out on the perfect
                  job opportunity. Get weekly updates on new job postings,
                  career tips, and exclusive insights from Ghana&apos;s leading
                  employers.
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="flex flex-col md:flex-row gap-3 items-stretch">
                  <div className="flex-1 relative">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      className="w-full h-14 pl-4 pr-4 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 text-base"
                    />
                  </div>
                  <Button
                    size="lg"
                    className="h-14 px-8 flex items-center justify-center gap-2 text-base font-semibold whitespace-nowrap md:min-w-[140px]"
                  >
                    <span>Subscribe</span>
                  </Button>
                </div>
              </div>

              <div className="mt-8 text-xs text-muted-foreground">
                <p>We respect your privacy. Unsubscribe at any time.</p>
              </div>

              {/* Newsletter Benefits */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-secondary-100 dark:bg-secondary-800 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <MdCheckCircle className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Weekly Job Alerts
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new jobs matching your skills and
                    preferences.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-secondary-100 dark:bg-secondary-800 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <MdCheckCircle className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Career Tips
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Expert advice on resume writing, interviews, and career
                    growth.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-secondary-100 dark:bg-secondary-800 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <MdCheckCircle className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Exclusive Insights
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Industry trends and salary insights from top Ghana
                    employers.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Job Categories Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Browse Jobs by Category
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Find opportunities in your field of expertise across
                Ghana&apos;s growing job market
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  category: "Technology",
                  count: 45,
                  description:
                    "Software development, IT support, data science, and more",
                },
                {
                  category: "Healthcare",
                  count: 23,
                  description:
                    "Medical professionals, healthcare administration, nursing",
                },
                {
                  category: "Finance",
                  count: 18,
                  description:
                    "Banking, accounting, financial planning, investment",
                },
                {
                  category: "Education",
                  count: 31,
                  description:
                    "Teaching positions, educational administration, tutoring",
                },
                {
                  category: "Marketing",
                  count: 27,
                  description:
                    "Digital marketing, brand management, content creation",
                },
                {
                  category: "Sales",
                  count: 19,
                  description:
                    "Sales representatives, business development, account management",
                },
              ].map((cat) => (
                <Link
                  key={cat.category}
                  href={`/jobs?category=${encodeURIComponent(cat.category)}`}
                >
                  <Card className="group h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <MdBusiness className="w-6 h-6" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {cat.category}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {cat.count} open positions
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cat.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/jobs">
                <Button size="lg" className="px-8 py-3 font-semibold">
                  View All Categories
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
