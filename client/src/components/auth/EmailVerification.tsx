import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface EmailVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ 
  email, 
  onVerificationSuccess,
  onSwitchToLogin 
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { verifyEmail, resendVerificationCode, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      await verifyEmail(code);
      setSuccess('Email verified successfully! Please log in to continue.');
      setTimeout(() => {
        onVerificationSuccess();
      }, 2000);
    } catch (err) {
      setError((err as Error).message || 'Verification failed');
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      await resendVerificationCode(email);
      setSuccess('Verification code sent! Please check your email.');
    } catch (err) {
      setError((err as Error).message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Verify your email
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          We've sent a 6-digit verification code to:
        </p>
        <p className="font-medium text-blue-600 dark:text-blue-400">
          {email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => {
              // Only allow numbers and limit to 6 digits
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setCode(value);
            }}
            maxLength={6}
            placeholder="000000"
            className="w-full px-3 py-2 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Didn't receive the code?
        </p>
        <button
          onClick={handleResendCode}
          disabled={isResending}
          className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-blue-400"
        >
          {isResending ? 'Sending...' : 'Resend code'}
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
};
