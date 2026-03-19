import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation errors",
      errors: errors.array(),
    });
    return;
  }

  next();
};

// Registration validation
export const validateRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("firstName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  body("role")
    .optional()
    .isIn(["JOB_SEEKER", "EMPLOYER"])
    .withMessage("Role must be either JOB_SEEKER or EMPLOYER"),
  handleValidationErrors,
];

// Login validation
export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Common pagination query validation
export const validatePaginationQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),
  handleValidationErrors,
];

// Job search query validation
export const validateJobSearchQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be an integer between 1 and 50"),
  query("search")
    .optional()
    .isString()
    .isLength({ max: 120 })
    .withMessage("Search query must be at most 120 characters"),
  query("q")
    .optional()
    .isString()
    .isLength({ max: 120 })
    .withMessage("q must be at most 120 characters"),
  query("location")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("Location must be at most 100 characters"),
  query("salaryMin")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("salaryMin must be a non-negative number"),
  query("salaryMax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("salaryMax must be a non-negative number"),
  query("experience")
    .optional()
    .isIn(["ENTRY_LEVEL", "MID_LEVEL", "SENIOR_LEVEL", "EXECUTIVE"])
    .withMessage("Invalid experience level"),
  query("jobType")
    .optional()
    .isIn([
      "FULL_TIME",
      "PART_TIME",
      "CONTRACT",
      "INTERNSHIP",
      "FREELANCE",
      "REMOTE",
      "remote",
    ])
    .withMessage("Invalid job type"),
  query("isRemote")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isRemote must be true or false"),
  handleValidationErrors,
];

const applicationStatuses = [
  "PENDING",
  "REVIEWED",
  "SHORTLISTED",
  "HIRED",
  "REJECTED",
] as const;

export const validateApplicationListQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be an integer between 1 and 50"),
  query("status")
    .optional()
    .isIn([...applicationStatuses])
    .withMessage("Invalid application status"),
  query("search")
    .optional()
    .isString()
    .isLength({ max: 120 })
    .withMessage("Search query must be at most 120 characters"),
  handleValidationErrors,
];

// Admin list query validation
export const validateAdminUsersQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),
  query("role")
    .optional()
    .isIn(["JOB_SEEKER", "EMPLOYER", "ADMIN"])
    .withMessage("Invalid role filter"),
  query("search")
    .optional()
    .isString()
    .isLength({ max: 120 })
    .withMessage("Search query must be at most 120 characters"),
  handleValidationErrors,
];

export const validateAdminJobsQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),
  query("isActive")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isActive must be true or false"),
  query("isApproved")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isApproved must be true or false"),
  query("search")
    .optional()
    .isString()
    .isLength({ max: 120 })
    .withMessage("Search query must be at most 120 characters"),
  handleValidationErrors,
];

export const validateAdminApplicationsQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),
  query("status")
    .optional()
    .isIn(["all", ...applicationStatuses])
    .withMessage("Invalid application status filter"),
  query("search")
    .optional()
    .isString()
    .isLength({ max: 120 })
    .withMessage("Search query must be at most 120 characters"),
  handleValidationErrors,
];

export const validateAdminEmployersQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),
  query("verificationStatus")
    .optional()
    .isIn(["all", "verified", "pending"])
    .withMessage("verificationStatus must be all, verified, or pending"),
  handleValidationErrors,
];

// Notifications and chat list validation
export const validateNotificationQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),
  handleValidationErrors,
];

export const validateConversationMessagesQuery = [
  param("conversationId")
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage("Valid conversationId is required"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),
  handleValidationErrors,
];
