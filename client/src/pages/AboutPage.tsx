import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MdSearch,
  MdWork,
  MdPeople,
  MdTrendingUp,
  MdSecurity,
  MdSupport,
  MdLocationOn,
  MdVerifiedUser,
  MdBusinessCenter,
  MdSchool,
} from "react-icons/md";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About <span className="text-primary">Employ</span>
              <span className="text-secondary">.me</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              We're revolutionizing the job market in Ghana by connecting
              talented professionals with forward-thinking employers through
              technology and innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  Get Started Today
                </motion.button>
              </Link>
              <Link to="/jobs">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border border-border bg-card text-foreground px-8 py-3 rounded-xl font-semibold hover:bg-muted transition-colors"
                >
                  Browse Jobs
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                To bridge the gap between talent and opportunity in Ghana's
                growing economy. We believe that everyone deserves access to
                meaningful work, and every business deserves access to
                exceptional talent.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">10,000+</div>
                  <div className="text-sm text-muted-foreground">
                    Active Jobs
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">
                    50,000+
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Job Seekers
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">5,000+</div>
                  <div className="text-sm text-muted-foreground">Employers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">95%</div>
                  <div className="text-sm text-muted-foreground">
                    Success Rate
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <MdLocationOn className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Local Focus</h3>
                <p className="text-sm text-muted-foreground">
                  Deep understanding of the Ghanaian job market
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <MdSecurity className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Secure Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Your data and privacy are our top priority
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <MdSupport className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">24/7 Support</h3>
                <p className="text-sm text-muted-foreground">
                  Always here to help you succeed
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <MdVerifiedUser className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Verified Jobs</h3>
                <p className="text-sm text-muted-foreground">
                  All opportunities are vetted and legitimate
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Job Seekers */}
      <section id="job-seekers" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works for Job Seekers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find your dream job in Ghana with our simple, effective platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MdPeople className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                1. Create Your Profile
              </h3>
              <p className="text-muted-foreground">
                Build a compelling profile that showcases your skills,
                experience, and career aspirations to potential employers.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MdSearch className="w-10 h-10 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">2. Search & Apply</h3>
              <p className="text-muted-foreground">
                Browse thousands of jobs across Ghana, filter by location,
                industry, and salary to find the perfect match.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MdWork className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Get Hired</h3>
              <p className="text-muted-foreground">
                Connect with employers, attend interviews, and land your dream
                job. We support you throughout the entire process.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/signup">
              <button className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                Start Your Job Search
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works - Employers */}
      <section id="employers" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works for Employers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find the best talent in Ghana with our powerful recruitment
              platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MdBusinessCenter className="w-10 h-10 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">1. Post Your Job</h3>
              <p className="text-muted-foreground">
                Create detailed job listings with requirements, benefits, and
                company information to attract the right candidates.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MdPeople className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                2. Review Applications
              </h3>
              <p className="text-muted-foreground">
                Access a pool of qualified candidates, review profiles, and
                shortlist the best matches for your positions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MdTrendingUp className="w-10 h-10 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">3. Hire & Grow</h3>
              <p className="text-muted-foreground">
                Connect with top talent, conduct interviews, and build your
                dream team to drive business growth.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/signup?role=employer">
              <button className="bg-secondary text-secondary-foreground px-8 py-3 rounded-xl font-semibold hover:bg-secondary/90 transition-colors">
                Start Hiring Today
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Employ.me?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We offer the most comprehensive job platform tailored for the
              Ghanaian market
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <MdLocationOn className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Local Expertise</h3>
              <p className="text-muted-foreground">
                Deep understanding of Ghana's job market, salary expectations,
                and cultural nuances.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <MdSchool className="w-12 h-12 text-secondary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Skills Development</h3>
              <p className="text-muted-foreground">
                Access career resources, skill assessments, and professional
                development opportunities.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <MdVerifiedUser className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">
                Verified Opportunities
              </h3>
              <p className="text-muted-foreground">
                All job postings are verified to ensure legitimacy and protect
                job seekers from scams.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <MdTrendingUp className="w-12 h-12 text-secondary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Market Insights</h3>
              <p className="text-muted-foreground">
                Get real-time salary data, hiring trends, and market
                intelligence to make informed decisions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <MdSupport className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Dedicated Support</h3>
              <p className="text-muted-foreground">
                Our local team provides personalized support throughout your job
                search or hiring process.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <MdSecurity className="w-12 h-12 text-secondary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-muted-foreground">
                Advanced security measures protect your personal information and
                maintain privacy.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Join thousands of professionals who have found success through
              Employ.me. Your next opportunity is just a click away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-card text-foreground px-8 py-3 rounded-xl font-semibold hover:bg-muted transition-colors"
                >
                  Join as Job Seeker
                </motion.button>
              </Link>
              <Link to="/signup?role=employer">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-card text-card px-8 py-3 rounded-xl font-semibold hover:bg-card hover:text-foreground transition-colors"
                >
                  Join as Employer
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
