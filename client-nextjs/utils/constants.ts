// Shared constants for the application

export const INDUSTRIES = [
  { value: "TECHNOLOGY", label: "Technology" },
  { value: "FINANCE", label: "Finance" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "EDUCATION", label: "Education" },
  { value: "MARKETING", label: "Marketing" },
  { value: "SALES", label: "Sales" },
  { value: "DESIGN", label: "Design" },
  { value: "ENGINEERING", label: "Engineering" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "HUMAN_RESOURCES", label: "Human Resources" },
  { value: "LEGAL", label: "Legal" },
  { value: "CUSTOMER_SERVICE", label: "Customer Service" },
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "CONSULTING", label: "Consulting" },
  { value: "MEDIA", label: "Media" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "NON_PROFIT", label: "Non Profit" },
  { value: "AGRICULTURE", label: "Agriculture" },
  { value: "CONSTRUCTION", label: "Construction" },
  { value: "HOSPITALITY", label: "Hospitality" },
  { value: "TRANSPORTATION", label: "Transportation" },
  { value: "RETAIL", label: "Retail" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "TELECOMMUNICATIONS", label: "Telecommunications" },
  { value: "OTHER", label: "Other" },
];

// Utility function to get display label for category value
export const getCategoryLabel = (value: string): string => {
  const industry = INDUSTRIES.find((ind) => ind.value === value);
  return industry ? industry.label : value;
};

export const JOB_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "FREELANCE", label: "Freelance" },
];

export const EXPERIENCE_LEVELS = [
  { value: "ENTRY_LEVEL", label: "Entry Level (0-2 years)" },
  { value: "MID_LEVEL", label: "Mid Level (2-5 years)" },
  { value: "SENIOR_LEVEL", label: "Senior Level (5-10 years)" },
  { value: "EXECUTIVE", label: "Executive (10+ years)" },
];

// Location search API configuration
export const LOCATION_API_CONFIG = {
  baseUrl: "https://nominatim.openstreetmap.org/search",
  countryCodes: "gh,ng,us,gb,za,ca,au,de,fr,in,sg,ae,sa,ke,ug",
  limit: 5,
};
