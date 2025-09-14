import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (be careful in production!)
  await prisma.application.deleteMany({});
  await prisma.savedJob.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.jobSeeker.deleteMany({});
  await prisma.employer.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🗑️ Cleared existing data');

  // Create sample users with different roles
  const jobSeekerUser = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: '$2a$10$dummy.hash.for.seeding.purposes', // This would be properly hashed in real app
      firstName: 'John',
      lastName: 'Doe',
      isVerified: true,
      role: 'JOB_SEEKER',
      jobSeeker: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          location: 'Accra, Ghana',
          bio: 'Experienced software developer with expertise in React and Node.js',
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          experience: 'MID_LEVEL',
          education: 'BSc Computer Science - University of Ghana',
        }
      }
    }
  });

  const employerUser = await prisma.user.create({
    data: {
      email: 'hr@techcorp.com',
      password: '$2a$10$dummy.hash.for.seeding.purposes',
      firstName: 'Jane',
      lastName: 'Smith',
      isVerified: true,
      role: 'EMPLOYER',
      employer: {
        create: {
          companyName: 'TechCorp Ghana',
          industry: 'Technology',
          location: 'Accra, Ghana',
          website: 'https://techcorp.com',
          description: 'Leading technology company in Ghana specializing in web and mobile development.',
          companySize: '50-100',
          isVerified: true,
        }
      }
    }
  });

  const employerUser2 = await prisma.user.create({
    data: {
      email: 'careers@bankgh.com',
      password: '$2a$10$dummy.hash.for.seeding.purposes',
      firstName: 'Kwame',
      lastName: 'Asante',
      isVerified: true,
      role: 'EMPLOYER',
      employer: {
        create: {
          companyName: 'Bank of Ghana',
          industry: 'Financial Services',
          location: 'Accra, Ghana',
          website: 'https://bog.gov.gh',
          description: 'Central Bank of Ghana - Leading financial institution.',
          companySize: '500+',
          isVerified: true,
        }
      }
    }
  });

  console.log('👥 Created sample users');

  // Get employer profiles for job creation
  const employer1 = await prisma.employer.findUnique({
    where: { userId: employerUser.id }
  });
  
  const employer2 = await prisma.employer.findUnique({
    where: { userId: employerUser2.id }
  });

  if (!employer1 || !employer2) {
    throw new Error('Employer profiles not found');
  }

  // Create sample jobs
  const jobs = [
    {
      employerId: employer1.id,
      title: 'Senior React Developer',
      description: 'We are seeking an experienced React developer to join our dynamic team. You will be responsible for developing user interface components and implementing them following well-known React.js workflows.',
      requirements: [
        '5+ years of experience with React.js',
        'Strong knowledge of JavaScript/TypeScript',
        'Experience with Redux or Context API',
        'Familiarity with RESTful APIs',
        'Bachelor\'s degree in Computer Science or related field'
      ],
      location: 'Accra, Ghana',
      isRemote: false,
      jobType: 'FULL_TIME',
      experience: 'SENIOR_LEVEL',
      salaryMin: 8000,
      salaryMax: 15000,
      deadline: new Date('2025-10-15'),
      isActive: true,
    },
    {
      employerId: employer1.id,
      title: 'Full Stack Developer',
      description: 'Join our team as a Full Stack Developer and work on exciting projects using modern technologies. You will develop both frontend and backend solutions.',
      requirements: [
        '3+ years of full stack development experience',
        'Proficiency in React and Node.js',
        'Database experience (PostgreSQL, MongoDB)',
        'Knowledge of cloud platforms (AWS, Google Cloud)',
        'Strong problem-solving skills'
      ],
      location: 'Kumasi, Ghana',
      isRemote: true,
      jobType: 'FULL_TIME',
      experience: 'MID_LEVEL',
      salaryMin: 6000,
      salaryMax: 12000,
      deadline: new Date('2025-09-30'),
      isActive: true,
    },
    {
      employerId: employer2.id,
      title: 'IT Security Analyst',
      description: 'We are looking for an IT Security Analyst to join our cybersecurity team. You will be responsible for monitoring, analyzing, and responding to security threats.',
      requirements: [
        'Bachelor\'s degree in Cybersecurity or IT',
        '2+ years of experience in IT security',
        'Knowledge of security frameworks (ISO 27001, NIST)',
        'Experience with security tools (SIEM, IDS/IPS)',
        'Professional certifications (CISSP, CEH) preferred'
      ],
      location: 'Accra, Ghana',
      isRemote: false,
      jobType: 'FULL_TIME',
      experience: 'ENTRY_LEVEL',
      salaryMin: 5000,
      salaryMax: 9000,
      deadline: new Date('2025-11-01'),
      isActive: true,
    },
    {
      employerId: employer2.id,
      title: 'Data Analyst',
      description: 'Join our analytics team as a Data Analyst. You will work with large datasets to provide insights that drive business decisions.',
      requirements: [
        'Degree in Statistics, Mathematics, or related field',
        'Proficiency in SQL and Python/R',
        'Experience with data visualization tools (Tableau, Power BI)',
        'Strong analytical and communication skills',
        '1-3 years of experience in data analysis'
      ],
      location: 'Accra, Ghana',
      isRemote: true,
      jobType: 'FULL_TIME',
      experience: 'ENTRY_LEVEL',
      salaryMin: 4000,
      salaryMax: 7000,
      deadline: new Date('2025-10-20'),
      isActive: true,
    },
    {
      employerId: employer1.id,
      title: 'Mobile App Developer (Flutter)',
      description: 'We need a talented Flutter developer to build cross-platform mobile applications. You will work on innovative mobile solutions for our clients.',
      requirements: [
        'Strong experience with Flutter and Dart',
        'Knowledge of mobile app architecture patterns',
        'Experience with REST APIs and state management',
        'Understanding of mobile UI/UX principles',
        'Portfolio of published mobile apps'
      ],
      location: 'Remote',
      isRemote: true,
      jobType: 'CONTRACT',
      experience: 'MID_LEVEL',
      salaryMin: 7000,
      salaryMax: 13000,
      deadline: new Date('2025-09-25'),
      isActive: true,
    }
  ];

  for (const jobData of jobs) {
    await prisma.job.create({
      data: jobData
    });
  }

  console.log('💼 Created sample jobs');

  // Get jobSeeker profile for application creation
  const jobSeeker1 = await prisma.jobSeeker.findUnique({
    where: { userId: jobSeekerUser.id }
  });

  if (!jobSeeker1) {
    throw new Error('JobSeeker profile not found');
  }

  // Create some sample applications
  const job1 = await prisma.job.findFirst({
    where: { title: 'Senior React Developer' }
  });

  if (job1) {
    await prisma.application.create({
      data: {
        jobId: job1.id,
        jobSeekerId: jobSeeker1.id,
        coverLetter: 'I am very interested in this React Developer position. With over 5 years of experience in React development, I believe I would be a great fit for your team.',
        status: 'PENDING',
      }
    });
  }

  console.log('📝 Created sample applications');

  // Create an admin user
  await prisma.user.create({
    data: {
      email: 'admin@employme.com',
      password: '$2a$10$dummy.hash.for.seeding.purposes',
      firstName: 'Admin',
      lastName: 'User',
      isVerified: true,
      role: 'ADMIN',
      admin: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
        }
      }
    }
  });

  console.log('👑 Created admin user');

  console.log('✅ Database seeded successfully!');
  
  // Print summary
  const userCount = await prisma.user.count();
  const jobCount = await prisma.job.count();
  const applicationCount = await prisma.application.count();
  
  console.log(`\n📊 Database Summary:`);
  console.log(`👥 Users: ${userCount}`);
  console.log(`💼 Jobs: ${jobCount}`);
  console.log(`📝 Applications: ${applicationCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
