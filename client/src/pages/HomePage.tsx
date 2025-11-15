import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
import Button from "../components/ui/Button";
import JobCategories from "../components/features/JobCategories";
import Newsletter from "../components/features/Newsletter";
import backgroundVideo from "../assets/backgroundvideo.mp4";
import ladyWithLaptop from "../assets/images/Ladywithlaptop.jpg";
import imageGreet from "../assets/images/imagegreet.jpg";
import {
  useScrollAnimation,
  fadeInUp,
  staggerChildrenVariants,
  slideInFromLeft,
  slideInFromRight,
} from "../utils/scrollTransitions";

const HomePage = () => {
  const { ref: featuresRef, isVisible: featuresVisible } =
    useScrollAnimation(0.2);
  const { ref: aboutRef, isVisible: aboutVisible } = useScrollAnimation(0.2);
  const { ref: benefitsRef, isVisible: benefitsVisible } =
    useScrollAnimation(0.2);

  return (
    <div>
      {/* Hero Section */}
      <div className="relative min-h-[700px] flex items-center overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src={backgroundVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Subtle gradient overlay for text readability without dark background */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/10 z-10"></div>

        <div className="container mx-auto px-4 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                Find Your Next Job in
                <span className="text-secondary-400 block">Ghana & Beyond</span>
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8 font-medium leading-relaxed drop-shadow-md">
                Ghana's leading job platform connecting talented professionals
                with great employers. Whether you're in Accra, Kumasi, or
                anywhere else, find opportunities that fit your skills and
                dreams.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/jobs">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-4 font-semibold shadow-lg"
                  >
                    Explore Opportunities
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm text-lg px-8 py-4 font-semibold shadow-lg"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block relative">
              {/* Enhanced decorative shapes around image */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-secondary-500/40 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-primary-500/30 rounded-full blur-2xl"></div>
              <div className="absolute top-1/2 -right-6 w-20 h-20 bg-secondary-400/50 rotate-45 rounded-lg backdrop-blur-sm"></div>
              <div className="absolute -top-6 left-1/3 w-16 h-16 bg-white/30 rounded-full backdrop-blur-sm"></div>

              <img
                src={ladyWithLaptop}
                alt="Professional woman working on laptop"
                className="rounded-2xl shadow-2xl w-full h-auto object-cover border-4 border-white/30 relative z-10"
              />

              {/* Enhanced geometric pattern overlay - more visible and animated */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden z-50">
                <div className="absolute top-6 left-6 w-10 h-10 border-3 border-secondary-400/90 rounded-full bg-white/20 backdrop-blur-sm animate-pulse z-50"></div>
                <div className="absolute bottom-16 right-16 w-12 h-12 bg-primary-400/80 rotate-45 rounded-sm shadow-lg z-50"></div>
                <div className="absolute top-1/3 left-4 w-8 h-8 bg-secondary-500/90 rounded-full shadow-md z-50"></div>
                <div className="absolute bottom-8 left-8 w-6 h-6 bg-white/70 rounded-full z-50"></div>
                <div className="absolute top-2/3 right-4 w-5 h-5 bg-secondary-300/80 rotate-12 rounded-sm z-50"></div>
                <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-primary-300/90 rounded-full z-50"></div>

                {/* Additional decorative lines */}
                <div className="absolute top-12 right-8 w-12 h-1 bg-secondary-400/60 rotate-45 z-50"></div>
                <div className="absolute bottom-12 left-12 w-8 h-1 bg-primary-400/70 rotate-12 z-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Jobs Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background video with different opacity for variety */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-30"
        >
          <source src={backgroundVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Light overlay for readability */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10"></div>

        <div className="container mx-auto px-4 relative z-20">
          <motion.div
            ref={featuresRef}
            initial="hidden"
            animate={featuresVisible ? "visible" : "hidden"}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Latest Job Openings
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Fresh job opportunities from top companies in Ghana and
              international remote positions
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={featuresVisible ? "visible" : "hidden"}
            variants={staggerChildrenVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* This would be mapped from actual job data */}
            {[
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
            ].map((job) => (
              <div
                key={job.id}
                className="bg-card text-card-foreground rounded-2xl border border-border p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4 mb-6">
                  <img
                    src={job.logo}
                    alt={`${job.company} logo`}
                    className="w-16 h-16 rounded-xl object-cover border border-border"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-primary mb-2 leading-tight">
                      {job.title}
                    </h3>
                    <p className="text-lg text-muted-foreground font-medium">
                      {job.company}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="flex items-center text-muted-foreground">
                    <MdLocationOn className="w-5 h-5 mr-2" />
                    {job.location}
                  </p>
                  <p className="flex items-center text-muted-foreground">
                    <MdAttachMoney className="w-5 h-5 mr-2" />
                    {job.salary}/year
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-secondary/10 text-secondary">
                    {job.type}
                  </span>
                  <Link to={`/jobs`}>
                    <Button
                      variant="primary"
                      size="sm"
                      className="font-semibold"
                    >
                      View Jobs
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            animate={featuresVisible ? "visible" : "hidden"}
            variants={fadeInUp}
            className="text-center mt-12"
          >
            <Link to="/jobs">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 font-semibold"
              >
                View All Jobs
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-card relative">
        <div className="container mx-auto px-4">
          <motion.div
            ref={aboutRef}
            initial="hidden"
            animate={aboutVisible ? "visible" : "hidden"}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-card-foreground mb-6">
              How It Works
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connecting job seekers across Ghana with employers looking for
              great talent
            </p>
          </motion.div>

          {/* Two-column layout for Job Seekers and Employers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Job Seekers Section */}
            <motion.div
              initial="hidden"
              animate={aboutVisible ? "visible" : "hidden"}
              variants={slideInFromLeft}
              className="space-y-8"
            >
              <div className="text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                  Looking for a Job?
                </h3>
                <p className="text-lg text-muted-foreground mb-8">
                  Get hired in Ghana with these 3 easy steps
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-4 group">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <MdPerson className="w-8 h-8" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 text-card-foreground">
                      Create Your Profile
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Set up your profile with your skills, experience, and what
                      kind of job you're looking for. Make it easy for employers
                      to find you.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <MdSearch className="w-8 h-8" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 text-card-foreground">
                      Search & Find Jobs
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Browse through hundreds of job listings in Ghana. Use
                      filters to find jobs that match your skills, location, and
                      salary expectations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <MdCheckCircle className="w-8 h-8" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 text-card-foreground">
                      Apply & Get Hired
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Apply directly to jobs you like and track your
                      applications. Get notifications when employers are
                      interested in your profile.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Employers Section */}
            <motion.div
              initial="hidden"
              animate={aboutVisible ? "visible" : "hidden"}
              variants={slideInFromRight}
              className="space-y-8"
            >
              <div className="text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-secondary mb-4">
                  Need to Hire Staff?
                </h3>
                <p className="text-lg text-muted-foreground mb-8">
                  Find qualified candidates in Ghana quickly and easily
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-4 group">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <MdBusiness className="w-8 h-8" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 text-card-foreground">
                      Post Your Job Openings
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Create job posts with clear descriptions of what you're
                      looking for. Include salary ranges and benefits to attract
                      the right people.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <MdPeople className="w-8 h-8" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 text-card-foreground">
                      Review Applications
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      See who has applied to your jobs. Check their profiles,
                      experience, and skills to find the best candidates for
                      your company.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <MdHowToReg className="w-8 h-8" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 text-card-foreground">
                      Hire the Right People
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Contact candidates you like and schedule interviews. Build
                      a strong team with people who fit your company culture and
                      needs.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Success Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                50K+
              </div>
              <div className="text-muted-foreground font-medium">
                Global Opportunities
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                250K+
              </div>
              <div className="text-muted-foreground font-medium">
                Professionals Worldwide
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                10K+
              </div>
              <div className="text-muted-foreground font-medium">
                Leading Companies
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                98%
              </div>
              <div className="text-muted-foreground font-medium">
                Satisfaction Rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/50 dark:to-secondary-900/50 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            ref={benefitsRef}
            initial="hidden"
            animate={benefitsVisible ? "visible" : "hidden"}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Success Stories from Ghana
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Real people in Ghana who found great jobs through Employ.me
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={benefitsVisible ? "visible" : "hidden"}
            variants={staggerChildrenVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <div className="bg-card text-card-foreground rounded-2xl p-8 shadow-sm border border-border hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <img
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face"
                  alt="Akosua Mensah"
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                />
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-card-foreground">
                    Akosua Mensah
                  </h4>
                  <p className="text-muted-foreground">Accountant in Accra</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                "I was looking for an accounting job for months. Employ.me
                helped me find a position at a great company in East Legon
                within 2 weeks. The process was so easy!"
              </p>
              <div className="flex text-secondary-500">{"★".repeat(5)}</div>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl p-8 shadow-sm border border-border hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face"
                  alt="Kwame Asante"
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                />
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-card-foreground">
                    Kwame Asante
                  </h4>
                  <p className="text-muted-foreground">IT Support, Kumasi</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                "Fresh out of university, I didn't know where to start looking
                for jobs. Employ.me showed me opportunities I didn't even know
                existed in Kumasi!"
              </p>
              <div className="flex text-secondary-500">{"★".repeat(5)}</div>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl p-8 shadow-sm border border-border hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-6">
                <img
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
                  alt="Ama Osei"
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                />
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-card-foreground">
                    Ama Osei
                  </h4>
                  <p className="text-muted-foreground">HR Manager</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                "As a business owner, I've found excellent staff through
                Employ.me. The candidates are serious about working and the
                platform makes hiring much easier for small businesses like
                mine."
              </p>
              <div className="flex text-secondary-500">{"★".repeat(5)}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-primary-900 dark:via-background dark:to-secondary-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              Ready to Take the Next Step?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Whether you're looking to advance your career or find top talent,
              we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Job Seekers CTA */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary-500/20 rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <MdPerson className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold">
                      For Job Seekers
                    </h3>
                    <p className="text-primary-100 text-lg">
                      Find your dream career
                    </p>
                  </div>
                </div>

                <p className="text-primary-100 text-lg mb-8 leading-relaxed">
                  Find jobs in Accra, Kumasi, Takoradi and all over Ghana.
                  Create your profile and start getting job offers from
                  employers.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/signup" className="flex-1">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full text-lg px-6 py-4 font-semibold bg-secondary-500 hover:bg-secondary-600 text-white border-none shadow-lg"
                    >
                      Create Profile
                    </Button>
                  </Link>
                  <Link to="/jobs" className="flex-1">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full text-lg px-6 py-4 font-semibold bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
                    >
                      Browse Jobs
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Employers CTA */}
            <div className="bg-gradient-to-br from-secondary-600 to-secondary-800 dark:from-secondary-700 dark:to-secondary-900 rounded-3xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <MdBusiness className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold">
                      For Employers
                    </h3>
                    <p className="text-secondary-100 text-lg">
                      Hire exceptional talent
                    </p>
                  </div>
                </div>

                <p className="text-secondary-100 text-lg mb-8 leading-relaxed">
                  Looking for workers in Ghana? Post your job openings and get
                  applications from qualified candidates ready to work.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/signup?role=employer" className="flex-1">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full text-lg px-6 py-4 font-semibold bg-primary-600 hover:bg-primary-700 text-white border-none shadow-lg"
                    >
                      Post Jobs
                    </Button>
                  </Link>
                  <Link to="/auth/login" className="flex-1">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full text-lg px-6 py-4 font-semibold bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Transform Your Career Section with Mobile-Visible Image */}
          <div className="bg-card dark:bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Content Side */}
              <div className="p-8 lg:p-12 bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 text-white">
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  Ready to Find Your
                  <span className="text-secondary-300 block">Next Job?</span>
                </h3>
                <p className="text-xl text-primary-100 mb-8 leading-relaxed">
                  Join thousands of Ghanaians who have found great jobs through
                  Employ.me. Whether you're a fresh graduate or experienced
                  professional, your next opportunity is here.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/signup">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="text-lg px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-secondary-500 hover:bg-secondary-600 text-white border-none"
                    >
                      Start Your Journey
                    </Button>
                  </Link>
                  <Link to="/jobs">
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-lg px-8 py-4 font-semibold bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm shadow-lg"
                    >
                      Explore Jobs
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Image Side - Now visible on mobile too */}
              <div className="relative min-h-[300px] lg:min-h-[400px]">
                {/* Enhanced decorative background shapes */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-secondary-500/30 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-primary-400/40 rounded-full blur-lg"></div>
                <div className="absolute top-8 right-8 w-12 h-12 bg-white/20 rotate-12 rounded-lg backdrop-blur-sm"></div>
                <div className="absolute top-4 left-1/3 w-8 h-8 bg-secondary-400/25 rotate-45"></div>

                <img
                  src={imageGreet}
                  alt="Happy professional greeting"
                  className="w-full h-full object-cover relative z-10"
                />

                {/* Enhanced geometric patterns */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-6 right-6 w-6 h-6 border-2 border-secondary-400/80 rounded-full bg-white/10 backdrop-blur-sm"></div>
                  <div className="absolute bottom-12 left-6 w-8 h-8 bg-primary-400/70 rotate-45 rounded-sm shadow-lg"></div>
                  <div className="absolute top-1/2 right-4 w-4 h-4 bg-secondary-500/80 rounded-full shadow-md"></div>
                  <div className="absolute bottom-6 right-1/3 w-3 h-3 bg-white/60 rounded-full"></div>
                  <div className="absolute top-1/3 left-4 w-2 h-2 bg-secondary-300/70 rotate-12"></div>
                  <div className="absolute bottom-1/3 right-6 w-2 h-2 bg-primary-300/80 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced background decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full text-white">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="currentColor"
              opacity="0.1"
            />
            <circle
              cx="150"
              cy="50"
              r="30"
              fill="currentColor"
              opacity="0.05"
            />
            <circle
              cx="50"
              cy="150"
              r="40"
              fill="currentColor"
              opacity="0.08"
            />
          </svg>
        </div>
      </section>

      {/* Newsletter Section */}
      <Newsletter />

      {/* Job Categories Section */}
      <JobCategories />
    </div>
  );
};

export default HomePage;
