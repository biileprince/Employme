import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LoginForm } from '../../components/auth/LoginForm';
import { EmailVerification } from '../../components/auth/EmailVerification';
import { useAuth } from '../../contexts/AuthContext';
import ladyWithLaptop from '../../assets/images/Ladywithlaptop.jpg';

type LoginStep = 'login' | 'verify-email';

export default function LoginPage() {
  const [currentStep, setCurrentStep] = useState<LoginStep>('login');
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users based on role and profile status
  useEffect(() => {
    if (user) {
      if (user.hasProfile) {
        if (user.role === 'EMPLOYER') {
          navigate('/employer/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, navigate]);

  const handleVerificationRequired = (email: string) => {
    setPendingEmail(email);
    setCurrentStep('verify-email');
  };

  const handleSwitchToForgotPassword = () => {
    // TODO: Implement forgot password flow
    console.log('Forgot password clicked');
  };

  const handleVerificationSuccess = () => {
    setCurrentStep('login');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'login':
        return (
          <div className="min-h-screen flex">
            {/* Left side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 to-primary-800/90 z-10" />
              <img 
                src={ladyWithLaptop} 
                alt="Professional woman with laptop" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-20 flex flex-col justify-center px-12 text-white">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h1 className="text-4xl font-bold mb-6">Welcome back to Employ.me</h1>
                  <p className="text-xl text-primary-100 mb-8">
                    Continue your journey to find the perfect job or hire the best talent in Ghana.
                  </p>
                  <div className="space-y-4 text-primary-100">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mr-3" />
                      <span>Access thousands of job opportunities</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mr-3" />
                      <span>Connect with top employers</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mr-3" />
                      <span>Manage your applications</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
              <div className="max-w-md w-full space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Welcome back
                  </h2>
                  <p className="text-muted-foreground">
                    Sign in to your account to continue
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-card rounded-2xl shadow-xl border border-border p-8"
                  style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
                >
                  <LoginForm 
                    onSwitchToForgotPassword={handleSwitchToForgotPassword}
                    onVerificationRequired={handleVerificationRequired}
                  />
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{' '}
                      <Link
                        to="/signup"
                        className="font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Create account
                      </Link>
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        );

      case 'verify-email':
        return (
          <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-card rounded-2xl shadow-xl border border-border p-8"
              >
                <EmailVerification
                  email={pendingEmail}
                  onVerificationSuccess={handleVerificationSuccess}
                  onSwitchToLogin={() => setCurrentStep('login')}
                />
              </motion.div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderStep();
}
