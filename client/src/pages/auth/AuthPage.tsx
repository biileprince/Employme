import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { RoleSelection } from '../../components/auth/RoleSelection';
import { EmailVerification } from '../../components/auth/EmailVerification';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/auth';
import imagegreet from '../../assets/images/imagegreet.jpg';
import ladyWithLaptop from '../../assets/images/Ladywithlaptop.jpg';
import skyPattern from '../../assets/images/skypattern.jpg';

type AuthStep = 'role-selection' | 'login' | 'register' | 'verify-email';

export default function AuthPage() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole | undefined>();
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users based on role and profile status
  useEffect(() => {
    if (user) {
      // If user is authenticated, redirect based on profile status and role
      if (user.hasProfile) {
        // User has profile, redirect to their respective dashboard
        if (user.role === 'EMPLOYER') {
          navigate('/employer/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        // User doesn't have profile, go to onboarding
        navigate('/onboarding');
      }
    }
  }, [user, navigate]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentStep('register');
  };

  const handleBackToRoleSelection = () => {
    setCurrentStep('role-selection');
    setSelectedRole(undefined);
  };

  const handleVerificationRequired = (email: string) => {
    setPendingEmail(email);
    setCurrentStep('verify-email');
  };

  const handleSwitchToLogin = () => {
    setCurrentStep('login');
  };

  const handleSwitchToRegister = () => {
    if (!selectedRole) {
      setCurrentStep('role-selection');
    } else {
      setCurrentStep('register');
    }
  };

  const handleRegistrationSuccess = (email: string) => {
    setPendingEmail(email);
    setCurrentStep('verify-email');
  };

  const handleSwitchToForgotPassword = () => {
    // TODO: Implement forgot password flow
    console.log('Forgot password clicked');
  };

  const handleVerificationSuccess = () => {
    // After verification, redirect to login page with success message
    setCurrentStep('login');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'role-selection':
        return (
          <RoleSelection
            onRoleSelect={handleRoleSelect}
            selectedRole={selectedRole}
          />
        );

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
                    onSwitchToRegister={handleSwitchToRegister} 
                    onSwitchToForgotPassword={handleSwitchToForgotPassword}
                    onVerificationRequired={handleVerificationRequired}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center"
                >
                  <button
                    onClick={handleBackToRoleSelection}
                    className="text-neutral-600 hover:text-neutral-700 text-sm font-medium transition-colors duration-200"
                  >
                    ← Back to role selection
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        );

      case 'register':
        return (
          <div className="min-h-screen flex">
            {/* Left side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-600/90 to-secondary-800/90 z-10" />
              <img 
                src={imagegreet} 
                alt="Professional greeting" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-20 flex flex-col justify-center px-12 text-white">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h1 className="text-4xl font-bold mb-6">Join Employ.me Today</h1>
                  <p className="text-xl text-secondary-100 mb-8">
                    Start your journey as a {selectedRole === 'JOB_SEEKER' ? 'Job Seeker' : 'Employer'} and unlock endless opportunities.
                  </p>
                  <div className="space-y-4 text-secondary-100">
                    {selectedRole === 'JOB_SEEKER' ? (
                      <>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-neutral-400 rounded-full mr-3" />
                          <span>Create a professional profile</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-neutral-400 rounded-full mr-3" />
                          <span>Apply to dream jobs instantly</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-neutral-400 rounded-full mr-3" />
                          <span>Get job recommendations</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-neutral-400 rounded-full mr-3" />
                          <span>Post unlimited job openings</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-neutral-400 rounded-full mr-3" />
                          <span>Access qualified candidates</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-neutral-400 rounded-full mr-3" />
                          <span>Build your company brand</span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right side - Register Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
              <div className="max-w-md w-full space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Create your account
                  </h2>
                  <p className="text-muted-foreground">
                    Join as a {selectedRole === 'JOB_SEEKER' ? 'Job Seeker' : 'Employer'}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-card rounded-2xl shadow-xl border border-border p-8"
                  style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
                >
                  <RegisterForm
                    role={selectedRole!}
                    onSwitchToLogin={handleSwitchToLogin}
                    onRegistrationSuccess={handleRegistrationSuccess}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center"
                >
                  <button
                    onClick={handleBackToRoleSelection}
                    className="text-neutral-600 hover:text-neutral-700 text-sm font-medium transition-colors duration-200"
                  >
                    ← Change role selection
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        );

      case 'verify-email':
        return (
          <div className="min-h-screen flex">
            {/* Left side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-600/90 to-neutral-800/90 z-10" />
              <img 
                src={skyPattern} 
                alt="Sky pattern background" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-20 flex flex-col justify-center px-12 text-white">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h1 className="text-4xl font-bold mb-6">Almost There!</h1>
                  <p className="text-xl text-neutral-100 mb-8">
                    We've sent a verification code to your email. Please check your inbox to complete your registration.
                  </p>
                  <div className="space-y-4 text-neutral-100">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mr-3" />
                      <span>Check your email inbox</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mr-3" />
                      <span>Enter the 6-digit code</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-secondary-400 rounded-full mr-3" />
                      <span>Start using Employ.me</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right side - Verification Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-background">
              <div className="max-w-md w-full space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Verify your email
                  </h2>
                  <p className="text-muted-foreground">
                    We sent a verification code to {pendingEmail}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-card rounded-2xl shadow-xl border border-border p-8"
                  style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
                >
                  <EmailVerification
                    email={pendingEmail}
                    onVerificationSuccess={handleVerificationSuccess}
                    onSwitchToLogin={handleSwitchToLogin}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center"
                >
                  <button
                    onClick={handleBackToRoleSelection}
                    className="text-neutral-600 hover:text-neutral-700 text-sm font-medium transition-colors duration-200"
                  >
                    ← Start over
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderStep();
}
