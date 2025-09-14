// Define types for our job listings
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements?: string[];
  postedDate?: string;
  deadline?: string;
  isRemote?: boolean;
  experience?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

import { jobsAPI } from '../services/api';

// Jobs loader for the jobs page
export const jobsLoader = async ({ request }: { request: Request }) => {
  try {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams();
    
    // Extract query parameters
    const search = url.searchParams.get('search');
    const location = url.searchParams.get('location');
    const jobType = url.searchParams.get('jobType');
    const experience = url.searchParams.get('experience');
    const page = url.searchParams.get('page') || '1';
    
    if (search) searchParams.append('search', search);
    if (location) searchParams.append('location', location);
    if (jobType) searchParams.append('jobType', jobType);
    if (experience) searchParams.append('experience', experience);
    searchParams.append('page', page);
    searchParams.append('limit', '10');

    const response = await jobsAPI.getAll(searchParams);
    
    if (response.success && response.data) {
      const data = response.data as { jobs: Job[] };
      return { jobs: data.jobs || [] };
    } else {
      // Fallback to mock data if API fails
      console.warn('API failed, using mock data');
      return { jobs: MOCK_JOBS };
    }
  } catch (error) {
    console.error('Error loading jobs:', error);
    // Fallback to mock data
    return { jobs: MOCK_JOBS };
  }
};

// Job detail loader for individual job pages
export const jobDetailLoader = async ({ params }: { params: { id?: string } }) => {
  try {
    if (!params.id) {
      throw new Error('Job ID is required');
    }

    const response = await jobsAPI.getById(params.id);
    
    if (response.success && response.data) {
      const data = response.data as { job: Job; relatedJobs: Job[] };
      return { 
        job: data.job, 
        relatedJobs: data.relatedJobs || [] 
      };
    } else {
      // Fallback to mock data
      const mockJob = MOCK_JOBS.find(job => job.id === params.id);
      const mockRelatedJobs = MOCK_JOBS.filter(job => job.id !== params.id).slice(0, 3);
      
      if (!mockJob) {
        throw new Response('Job not found', { status: 404 });
      }
      
      return { 
        job: mockJob, 
        relatedJobs: mockRelatedJobs 
      };
    }
  } catch (error) {
    console.error('Error loading job details:', error);
    
    // Try to find job in mock data as fallback
    if (params.id) {
      const mockJob = MOCK_JOBS.find(job => job.id === params.id);
      if (mockJob) {
        const mockRelatedJobs = MOCK_JOBS.filter(job => job.id !== params.id).slice(0, 3);
        return { 
          job: mockJob, 
          relatedJobs: mockRelatedJobs 
        };
      }
    }
    
    throw new Response('Job not found', { status: 404 });
  }
};

// Mock data - fallback when API is not available
const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Frontend Developer',
    company: 'TechCorp Ghana',
    location: 'Accra, Ghana',
    type: 'Full-time',
    salary: 'GHS 5,000 - 8,000 monthly',
    description: 'We are looking for a skilled frontend developer to join our team...',
    requirements: ['3+ years of React experience', 'TypeScript proficiency', 'Responsive design skills'],
    postedDate: '2025-08-15',
    deadline: '2025-09-30',
  },
  {
    id: '2',
    title: 'UX Designer',
    company: 'DigitalWave',
    location: 'Kumasi, Ghana',
    type: 'Contract',
    description: 'Join our design team to create beautiful user experiences...',
    requirements: ['UI/UX design skills', 'Figma/Sketch proficiency', 'Understanding of user research'],
    postedDate: '2025-08-20',
  },
  {
    id: '3',
    title: 'Backend Developer',
    company: 'GhanaFintech',
    location: 'Remote (Ghana)',
    type: 'Full-time',
    salary: 'GHS 7,000 - 12,000 monthly',
    description: 'Help us build robust backend systems for financial technology...',
    requirements: ['Node.js experience', 'Database design', 'API development'],
    postedDate: '2025-08-25',
    deadline: '2025-10-10',
  },
  {
    id: '4',
    title: 'Project Manager',
    company: 'BuildTech Solutions',
    location: 'Accra, Ghana',
    type: 'Full-time',
    description: 'Lead our development projects to successful completion...',
    requirements: ['3+ years in project management', 'Technical background', 'Agile methodology'],
    postedDate: '2025-08-28',
  },
  {
    id: '5',
    title: 'Data Analyst',
    company: 'DataInsight Ghana',
    location: 'Tamale, Ghana',
    type: 'Part-time',
    description: 'Analyze and interpret complex data sets to drive business decisions...',
    requirements: ['SQL proficiency', 'Data visualization skills', 'Statistical analysis'],
    postedDate: '2025-09-01',
    deadline: '2025-10-01',
  },
];
