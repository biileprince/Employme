import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MdEmail, MdSend, MdCheckCircle } from "react-icons/md";
import Button from "../ui/Button";

// Animation variants
const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 60,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

// Custom hook for scroll animation
const useScrollAnimation = (threshold: number = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
};

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const { ref, isVisible } = useScrollAnimation(0.1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/newsletter/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        setEmail("");
        setTimeout(() => {
          setIsSuccess(false);
        }, 5000);
      } else {
        setError(result.message || "Failed to subscribe. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      id="newsletter"
      className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          <defs>
            <pattern
              id="newsletter-pattern"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="20" cy="20" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#newsletter-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={fadeInUp}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp} className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-primary-100 dark:bg-primary-800 rounded-full p-4">
                <MdEmail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Stay Updated with the Latest Job Opportunities
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Subscribe to our newsletter and never miss out on the perfect job
              opportunity. Get weekly updates on new job postings, career tips,
              and exclusive insights from Ghana's leading employers.
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="max-w-2xl mx-auto">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-center mb-3">
                  <MdCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  Successfully Subscribed!
                </h3>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Thank you for subscribing to our newsletter. You'll receive
                  job updates and career insights in your inbox.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-stretch">
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                      <MdEmail className="text-muted-foreground w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 border border-border rounded-xl bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    disabled={isLoading}
                    className="h-14 px-8 flex items-center justify-center gap-2 text-base font-semibold whitespace-nowrap md:min-w-[140px]"
                  >
                    {isLoading ? (
                      <span>Subscribing...</span>
                    ) : (
                      <>
                        <MdSend className="w-5 h-5" />
                        <span>Subscribe</span>
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 dark:text-red-400 text-sm text-center mt-3"
                  >
                    {error}
                  </motion.div>
                )}
              </form>
            )}
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="mt-8 text-xs text-muted-foreground"
          >
            <p>
              We respect your privacy. Unsubscribe at any time.
              <span className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer ml-1">
                Read our Privacy Policy
              </span>
            </p>
          </motion.div>

          {/* Newsletter Benefits */}
          <motion.div
            variants={fadeInUp}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
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
                Expert advice on resume writing, interviews, and career growth.
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
                Industry trends and salary insights from top Ghana employers.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;
