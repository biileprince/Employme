import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  changePassword, 
  requestPasswordReset, 
  verifyEmail,
  resendVerificationEmail,
  resetPassword,
  socialAuthSuccess,
  socialAuthFailure,
  linkSocialAccount,
  unlinkSocialAccount
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRegistration, validateLogin } from '../middleware/validation.js';
import passport from '../middleware/passport.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Social Authentication Routes
// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/api/auth/failure' }),
  socialAuthSuccess
);

// LinkedIn OAuth
router.get('/linkedin', passport.authenticate('linkedin', { scope: ['r_emailaddress', 'r_liteprofile'] }));
router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/api/auth/failure' }),
  socialAuthSuccess
);

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/api/auth/failure' }),
  socialAuthSuccess
);

// Social auth failure route
router.get('/failure', socialAuthFailure);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.post('/change-password', authMiddleware, changePassword);
router.post('/link-social', authMiddleware, linkSocialAccount);
router.post('/unlink-social', authMiddleware, unlinkSocialAccount);

export default router;
