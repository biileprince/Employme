import { useState } from 'react';
import { useLoaderData, Link } from 'react-router-dom';
import { 
  HiLocationMarker, 
  HiClock, 
  HiBriefcase, 
  HiCurrencyDollar, 
  HiStar,
  HiHeart,
  HiShare,
  HiOfficeBuilding,
  HiUsers,
  HiGlobeAlt,
  HiCalendar,
  HiAcademicCap,
  HiCheckCircle,
  HiArrowLeft
} from 'react-icons/hi';
import Button from '../../components/ui/Button';
import type { Job } from '../../loaders/jobsLoaders';

const JobDetail = () => {
  const { job, relatedJobs } = useLoaderData() as { job: Job; relatedJobs: Job[] };
  const [isSaved, setIsSaved] = useState(false);

  // Mock company data
  const companyInfo = {
    logo: `https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=120&h=120&fit=crop&crop=center`,
    founded: '2015',
    employees: '50-100',
    industry: 'Technology',
    website: 'www.techcorp.gh',
    rating: 4.5,
    reviews: 127
  };

  const benefits = [
    'Health Insurance',
    'Dental Coverage',
    'Flexible Working Hours',
    'Remote Work Options',
    'Professional Development',
    'Performance Bonuses',
    'Paid Time Off',
    'Life Insurance'
  ];

  const requirements = [
    'Bachelor\'s degree in Computer Science or related field',
    '3+ years of experience in React development',
    'Strong knowledge of JavaScript, TypeScript, and modern web technologies',
    'Experience with REST APIs and GraphQL',
    'Familiarity with version control systems (Git)',
    'Excellent problem-solving and communication skills',
    'Experience with Agile development methodologies',
    'Knowledge of testing frameworks (Jest, React Testing Library)'
  ];

  const responsibilities = [
    'Develop and maintain high-quality React applications',
    'Collaborate with cross-functional teams to define and implement new features',
    'Write clean, maintainable, and well-documented code',
    'Participate in code reviews and technical discussions',
    'Optimize applications for maximum speed and scalability',
    'Stay up-to-date with emerging technologies and industry trends',
    'Mentor junior developers and contribute to team knowledge sharing',
    'Ensure applications meet accessibility and performance standards'
  ];

  const getCompanyLogo = (companyName: string) => {
    const logos: Record<string, string> = {
      'TechCorp Ghana': 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=120&h=120&fit=crop&crop=center',
      'DigitalWave': 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=120&h=120&fit=crop&crop=center',
      'GhanaFintech': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=120&h=120&fit=crop&crop=center',
      'BuildTech Solutions': 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=120&h=120&fit=crop&crop=center',
      'DataInsight Ghana': 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=120&h=120&fit=crop&crop=center',
    };
    return logos[companyName] || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=120&h=120&fit=crop&crop=center';
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-border dark:border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              to="/jobs" 
              className="flex items-center gap-2 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span>Back to Jobs</span>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <img 
                src={getCompanyLogo(job.company)} 
                alt={`${job.company} logo`}
                className="w-24 h-24 rounded-xl object-cover border-2 border-border dark:border-gray-700 shadow-lg"
              />
            </div>

            {/* Job Header Info */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground dark:text-white mb-2">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-semibold text-primary dark:text-blue-400">
                      {job.company}
                    </h2>
                    <div className="flex items-center gap-1">
                      <HiStar className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm text-muted-foreground dark:text-gray-400">
                        {companyInfo.rating} ({companyInfo.reviews} reviews)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-muted-foreground dark:text-gray-400">
                      <HiLocationMarker className="w-5 h-5 mr-2 text-primary dark:text-blue-400" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground dark:text-gray-400">
                      <HiBriefcase className="w-5 h-5 mr-2 text-primary dark:text-blue-400" />
                      <span>{job.type}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground dark:text-gray-400">
                      <HiCurrencyDollar className="w-5 h-5 mr-2 text-primary dark:text-blue-400" />
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground dark:text-gray-400">
                      <HiClock className="w-5 h-5 mr-2 text-primary dark:text-blue-400" />
                      <span>Posted 2 days ago</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 dark:bg-blue-500/20 text-primary dark:text-blue-400">
                      Full-time
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                      Remote
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                      Urgent Hiring
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      isSaved 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' 
                        : 'bg-background dark:bg-gray-800 border-border dark:border-gray-700 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white'
                    }`}
                  >
                    <HiHeart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    <span>{isSaved ? 'Saved' : 'Save Job'}</span>
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border dark:border-gray-700 bg-background dark:bg-gray-800 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors">
                    <HiShare className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                  
                  <Button size="lg" className="px-8">
                    Apply Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Job Description */}
            <div className="bg-card dark:bg-gray-900 rounded-xl border border-border dark:border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-4">
                Job Description
              </h3>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-muted-foreground dark:text-gray-300 leading-relaxed mb-4">
                  {job.description}
                </p>
                <p className="text-muted-foreground dark:text-gray-300 leading-relaxed">
                  We are looking for a talented React Developer to join our dynamic team. You will be responsible 
                  for developing and implementing user interface components using React.js concepts and workflows 
                  such as Redux, Flux, and Webpack. You will also be responsible for profiling and improving 
                  front-end performance and documenting our front-end codebase.
                </p>
              </div>
            </div>

            {/* Key Responsibilities */}
            <div className="bg-card dark:bg-gray-900 rounded-xl border border-border dark:border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-4">
                Key Responsibilities
              </h3>
              <ul className="space-y-3">
                {responsibilities.map((responsibility, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <HiCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground dark:text-gray-300">{responsibility}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="bg-card dark:bg-gray-900 rounded-xl border border-border dark:border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-4">
                Requirements
              </h3>
              <ul className="space-y-3">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <HiAcademicCap className="w-5 h-5 text-primary dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground dark:text-gray-300">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div className="bg-card dark:bg-gray-900 rounded-xl border border-border dark:border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-4">
                Benefits & Perks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <HiCheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-muted-foreground dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Company Info */}
            <div className="bg-card dark:bg-gray-900 rounded-xl border border-border dark:border-gray-800 p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                About {job.company}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <HiOfficeBuilding className="w-5 h-5 text-primary dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Industry</p>
                    <p className="font-medium text-foreground dark:text-white">{companyInfo.industry}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <HiUsers className="w-5 h-5 text-primary dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Company Size</p>
                    <p className="font-medium text-foreground dark:text-white">{companyInfo.employees} employees</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <HiCalendar className="w-5 h-5 text-primary dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Founded</p>
                    <p className="font-medium text-foreground dark:text-white">{companyInfo.founded}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <HiGlobeAlt className="w-5 h-5 text-primary dark:text-blue-400" />
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Website</p>
                    <a 
                      href={`https://${companyInfo.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-primary dark:text-blue-400 hover:underline"
                    >
                      {companyInfo.website}
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border dark:border-gray-700">
                <Button variant="outline" fullWidth>
                  View Company Profile
                </Button>
              </div>
            </div>

            {/* Similar Jobs */}
            <div className="bg-card dark:bg-gray-900 rounded-xl border border-border dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                Similar Jobs
              </h3>
              
              <div className="space-y-4">
                {relatedJobs?.slice(0, 3).map((relatedJob) => (
                  <Link 
                    key={relatedJob.id} 
                    to={`/jobs/${relatedJob.id}`}
                    className="block p-4 bg-background dark:bg-gray-800 rounded-lg border border-border dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <h4 className="font-medium text-foreground dark:text-white mb-1 line-clamp-2">
                      {relatedJob.title}
                    </h4>
                    <p className="text-sm text-primary dark:text-blue-400 mb-2">
                      {relatedJob.company}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-gray-400">
                      <span>{relatedJob.location}</span>
                      <span>{relatedJob.salary}</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-4">
                <Link to="/jobs">
                  <Button variant="outline" fullWidth>
                    View All Jobs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Apply Button (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border dark:border-gray-800 p-4 lg:hidden">
        <div className="flex gap-3">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`flex items-center justify-center w-12 h-12 rounded-lg border transition-colors ${
              isSaved 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' 
                : 'border-border dark:border-gray-700 text-muted-foreground dark:text-gray-400'
            }`}
          >
            <HiHeart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <Button size="lg" fullWidth>
            Apply Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
