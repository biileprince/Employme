// Shared constants for the application

export const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Marketing',
  'Sales',
  'Design',
  'Engineering',
  'Operations',
  'Human Resources',
  'Legal',
  'Customer Service',
  'Manufacturing',
  'Consulting',
  'Media',
  'Government',
  'Non Profit',
  'Agriculture',
  'Construction',
  'Hospitality',
  'Transportation',
  'Retail',
  'Real Estate',
  'Telecommunications',
  'Other'
];

export const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FREELANCE', label: 'Freelance' }
];

export const EXPERIENCE_LEVELS = [
  { value: 'ENTRY_LEVEL', label: 'Entry Level (0-2 years)' },
  { value: 'MID_LEVEL', label: 'Mid Level (2-5 years)' },
  { value: 'SENIOR_LEVEL', label: 'Senior Level (5-10 years)' },
  { value: 'EXECUTIVE', label: 'Executive (10+ years)' }
];

// Location search API configuration
export const LOCATION_API_CONFIG = {
  baseUrl: 'https://nominatim.openstreetmap.org/search',
  countryCodes: 'gh,ng,us,gb,za,ca,au,de,fr,in,sg,ae,sa,ke,ug',
  limit: 5
};
