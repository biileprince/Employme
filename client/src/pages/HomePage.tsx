import { Link } from "react-router-dom";
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
import backgroundVideo from "../assets/backgroundvideo.mp4";
import ladyWithLaptop from "../assets/images/Ladywithlaptop.jpg";
import imageGreet from "../assets/images/imagegreet.jpg";

const HomePage = () => {
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
                Find Your Dream Job in
                <span className="text-secondary-400 block">Ghana</span>
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8 font-medium leading-relaxed drop-shadow-md">
                Connect with top employers and discover opportunities that match
                your skills and aspirations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/jobs">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-4 font-semibold shadow-lg"
                  >
                    Browse Jobs
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Featured Jobs
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover the latest job opportunities from top companies across
              Ghana
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* This would be mapped from actual job data */}
            {[
              {
                id: 1,
                title: "Software Developer",
                company: "TechCorp Ghana",
                location: "Accra, Ghana",
                type: "Full-time",
                salary: "GHS 5,000 - 8,000",
                logo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=64&h=64&fit=crop&crop=center",
              },
              {
                id: 2,
                title: "UX Designer",
                company: "DigitalWave",
                location: "Kumasi, Ghana",
                type: "Contract",
                salary: "GHS 4,000 - 6,000",
                logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=64&h=64&fit=crop&crop=center",
              },
              {
                id: 3,
                title: "Marketing Manager",
                company: "GrowthCo",
                location: "Remote",
                type: "Full-time",
                salary: "GHS 6,000 - 9,000",
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
                    {job.salary}/month
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-secondary/10 text-secondary">
                    {job.type}
                  </span>
                  <Link to={`/jobs/${job.id}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      className="font-semibold"
                    >
                      Apply Now
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/jobs">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 font-semibold"
              >
                View All Jobs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-card relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-card-foreground mb-6">
              How It Works
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Connect talented job seekers with leading employers across Ghana
            </p>
          </div>

          {/* Two-column layout for Job Seekers and Employers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Job Seekers Section */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                  For Job Seekers
                </h3>
                <p className="text-lg text-muted-foreground mb-8">
                  Find your dream job in 3 simple steps
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
                      Build your professional profile to showcase your skills
                      and experience to potential employers.
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
                      Find Matching Jobs
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Search and filter through thousands of job listings to
                      find opportunities that match your skills.
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
                      Apply with Ease
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Submit your application with a single click and track your
                      application status in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employers Section */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-secondary mb-4">
                  For Employers
                </h3>
                <p className="text-lg text-muted-foreground mb-8">
                  Hire top talent efficiently and effectively
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
                      Post Your Jobs
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Create detailed job listings to attract the right
                      candidates for your open positions.
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
                      Review Candidates
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Browse through qualified candidates and review their
                      profiles, skills, and experience.
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
                      Hire the Best
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Connect with top talent and build your dream team with our
                      streamlined hiring process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                2,500+
              </div>
              <div className="text-muted-foreground font-medium">
                Active Jobs
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                15,000+
              </div>
              <div className="text-muted-foreground font-medium">
                Job Seekers
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                800+
              </div>
              <div className="text-muted-foreground font-medium">Companies</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                95%
              </div>
              <div className="text-muted-foreground font-medium">
                Success Rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden min-h-[600px]">
        {/* Background video */}
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

        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-primary-800/85 to-secondary-900/90 z-10"></div>

        <div className="container mx-auto px-4 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-black/20 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                Ready to Start Your
                <span className="text-secondary-300 block">Job Search?</span>
              </h2>
              <p className="text-xl text-white mb-8 leading-relaxed font-medium drop-shadow-md">
                Join thousands of job seekers who have found their dream jobs
                through Employ.me. Your next career opportunity is just a click
                away.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="text-lg px-8 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Create Your Profile Now
                  </Button>
                </Link>
                <Link to="/jobs">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm text-lg px-8 py-4 font-semibold shadow-lg"
                  >
                    Browse Jobs
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block relative">
              {/* Enhanced decorative background shapes */}
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-secondary-500/30 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary-400/40 rounded-full blur-lg"></div>
              <div className="absolute top-8 -right-8 w-16 h-16 bg-white/20 rotate-12 rounded-lg backdrop-blur-sm"></div>
              <div className="absolute -top-4 right-1/3 w-12 h-12 bg-secondary-400/25 rotate-45"></div>

              <img
                src={imageGreet}
                alt="Happy professional greeting"
                className="rounded-2xl shadow-2xl w-full h-auto object-cover border-4 border-white/20 relative z-10"
              />

              {/* Enhanced geometric patterns - more visible */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute top-6 right-6 w-8 h-8 border-3 border-secondary-400/80 rounded-full bg-white/10 backdrop-blur-sm"></div>
                <div className="absolute bottom-12 left-12 w-10 h-10 bg-primary-400/70 rotate-45 rounded-sm shadow-lg"></div>
                <div className="absolute top-1/2 right-4 w-6 h-6 bg-secondary-500/80 rounded-full shadow-md"></div>
                <div className="absolute bottom-6 right-1/3 w-5 h-5 bg-white/60 rounded-full"></div>
                <div className="absolute top-1/3 left-6 w-4 h-4 bg-secondary-300/70 rotate-12"></div>
                <div className="absolute bottom-1/3 right-8 w-3 h-3 bg-primary-300/80 rounded-full"></div>
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

      {/* Job Categories Section */}
      <JobCategories />
    </div>
  );
};

export default HomePage;
