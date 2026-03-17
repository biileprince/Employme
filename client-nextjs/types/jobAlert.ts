export type JobType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "FREELANCE";

export type JobCategory =
  | "TECHNOLOGY"
  | "FINANCE"
  | "HEALTHCARE"
  | "EDUCATION"
  | "MARKETING"
  | "SALES"
  | "DESIGN"
  | "ENGINEERING"
  | "OPERATIONS"
  | "HUMAN_RESOURCES"
  | "LEGAL"
  | "CUSTOMER_SERVICE"
  | "MANUFACTURING"
  | "CONSULTING"
  | "MEDIA"
  | "GOVERNMENT"
  | "NON_PROFIT"
  | "AGRICULTURE"
  | "CONSTRUCTION"
  | "HOSPITALITY"
  | "TRANSPORTATION"
  | "RETAIL"
  | "REAL_ESTATE"
  | "TELECOMMUNICATIONS"
  | "OTHER";

export interface JobAlert {
  id: string;
  name: string;
  keywords: string[];
  locations: string[];
  jobTypes: JobType[];
  categories: JobCategory[];
  emailEnabled: boolean;
  inAppEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    matches: number;
  };
}

export interface JobAlertNotification {
  id: string;
  userId: string;
  type: "JOB_ALERT_MATCH";
  title: string;
  message: string;
  data?: {
    jobId?: string;
    title?: string;
    location?: string;
    category?: string;
    jobType?: string;
    companyName?: string;
  };
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}
