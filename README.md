# Employ.me - MVP Job Listing Platform

## Project Overview

Employ.me is a lean job-listing web application focused on connecting employers and job seekers in Ghana. The platform enables employers to post job opportunities and job seekers to find and apply for positions that match their skills and preferences.

## Target Region & Audience
- **Region:** Ghana
- **Language:** English
- **Platform:** Responsive web (mobile apps planned for future)
- **Initial audience:** Small employers and active job seekers

## User Roles & Core Functionality

### 1. Employer
- Register and create company profile
- Post and manage job listings
- View and filter applicants
- Message applicants
- Receive notifications about applications

### 2. Job Seeker
- Register and build professional profile
- Search and filter job listings
- Save favorite jobs for later
- Apply to jobs with resume upload
- Message potential employers
- Receive job alerts and notifications

### 3. Admin
- Review reported listings
- Suspend inappropriate content
- View platform metrics and analytics
- Export basic reports (CSV)
- Manage user accounts

## Technical Requirements

### Development Stack
- **Frontend:** React v19.1 with TypeScript (via Vite)
- **Styling:** Tailwind CSS v4.1
- **Animations:** Framer Motion
- **Backend:** Node.js with Express (module pattern)
- **Real-time messaging:** Socket.io
- **Database:** PostgreSQL with Prisma ORM
- **File storage:** Cloudinary (S3 for future implementation)
- **Search:** PostgreSQL full-text search
- **Email:** Mailtrap for development
- **Authentication:** Email and phone verification

### Security Requirements
- SSL for all traffic
- Rate limiting for posting and messaging
- Secure storage for resumes
- Phone verification via SMS for employers

## Feature Implementation

### Week 1: Authentication & User Profiles
- [ ] User registration (email, phone)
- [ ] Login system with password reset
- [ ] User profile creation for both employers and job seekers
- [ ] Basic responsive layout templates

### Week 2: Employer Features
- [ ] Company profile creation
- [ ] Job posting form with all required fields:
  - Title, company, location
  - Salary range
  - Job type (full-time, part-time, contract)
  - Description
  - Required skills/tags
  - File attachments
- [ ] Database schema design and implementation

### Week 3: Search & Discovery
- [ ] Job search functionality with filters:
  - Keywords
  - Location
  - Job type
  - Salary range
  - Experience level
- [ ] Job details page
- [ ] Save/bookmark jobs feature

### Week 4: Application & Communication
- [ ] Resume upload functionality
- [ ] Job application flow
- [ ] Basic messaging system between employers and applicants
- [ ] Notification system (in-app and email)

### Week 5: Admin & Moderation
- [ ] Admin dashboard
- [ ] Content moderation tools
- [ ] Basic spam detection
- [ ] Report listing functionality
- [ ] Simple analytics (active listings, new signups, applications)
- [ ] CSV export functionality



## Acceptance Criteria
- Employer can post a job and it appears in search within one minute
- Job seeker can find a job via keyword search and apply with a resume upload
- Employer receives applicant data and can initiate a message thread
- Admin can review and suspend flagged listings from the dashboard
- All core functionality works across devices (responsive)

## Success Metrics
- Time to first application per listing
- Active listings per week
- Apply rate per listing (views vs. applications)
- User retention after first week

## Out of Scope for MVP
- Advanced AI matching algorithms
- Video interview functionality
- Complex payment gateway integrations
- Subscription management beyond promoted listings
- Mobile native apps (planned for future)
- Multi-language support

## Important Notes
- Focus on usability and essential functionality
- Prioritize performance and responsive design
- Build with scalability in mind for future enhancements
- Ensure robust error handling and user feedback
- Maintain consistent design language throughout
- Implement proper data validation and security measures

You are building Employ.me - a hybrid job platform where:

Unauthenticated users can browse job listings

Authenticated users gain additional capabilities based on their role

some of the UI/UX should follow the layout pattern of https://jiji.com.gh/

## Getting Started

### Prerequisites
- Node.js (latest LTS)
- PostgreSQL
- Git

### Installation

2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables (see .env.example)
4. Initialize database:
   ```
   npx prisma migrate dev
   ```
5. Start development server:
   ```
   npm run dev
   ```# Employme
