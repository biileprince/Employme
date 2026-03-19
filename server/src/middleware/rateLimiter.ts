import rateLimit from "express-rate-limit";

type RateLimiterOptions = {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
};

const createRateLimiter = ({
  windowMs,
  max,
  message,
  skipSuccessfulRequests = false,
}: RateLimiterOptions) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: {
      success: false,
      message,
    },
  });

export const signupRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many signup attempts. Please try again in an hour.",
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts. Please try again later.",
  skipSuccessfulRequests: true,
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many password reset attempts. Please try again later.",
});

export const emailVerificationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many verification attempts. Please try again later.",
});

export const applicationSubmissionRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many application submissions. Please try again later.",
});

export const jobMutationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: "Too many job management requests. Please try again later.",
});

export const attachmentUploadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many upload requests. Please try again later.",
});

export const newsletterRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: "Too many newsletter requests. Please try again later.",
});

export const chatMessageRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many chat messages. Please slow down.",
});

export const chatMutationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: "Too many chat updates. Please try again later.",
});

export const profileMutationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many profile/account changes. Please try again later.",
});

export const savedJobMutationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 80,
  message: "Too many saved job requests. Please try again later.",
});

export const jobAlertMutationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many job alert updates. Please try again later.",
});

export const interviewMutationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: "Too many interview management requests. Please try again later.",
});

export const adminMutationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: "Too many admin update requests. Please try again later.",
});
