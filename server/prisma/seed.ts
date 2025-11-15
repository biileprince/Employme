import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@employme.com" },
  });

  let adminUser;
  if (existingAdmin) {
    console.log("✅ Admin user already exists: admin@employme.com");
    adminUser = existingAdmin;
  } else {
    // Create Admin User
    adminUser = await prisma.user.create({
      data: {
        email: "admin@employme.com",
        password: await bcrypt.hash("AdminPassword123!", 12),
        firstName: "Admin",
        lastName: "User",
        isVerified: true,
        isActive: true,
        role: "ADMIN",
        admin: {
          create: {
            firstName: "Admin",
            lastName: "User",
          },
        },
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@employme.com");
    console.log("🔒 Password: AdminPassword123!");
  }

  // Create Employers
  console.log("\n👔 Creating employer accounts...");

  const employer1 = await prisma.user.create({
    data: {
      email: "tech@company.com",
      password: await bcrypt.hash("Password123!", 12),
      firstName: "John",
      lastName: "Tech",
      isVerified: true,
      isActive: true,
      role: "EMPLOYER",
      employer: {
        create: {
          companyName: "TechCorp Ghana",
          industry: "Technology",
          location: "Accra, Ghana",
          website: "https://techcorp.com",
          description:
            "Leading technology solutions provider in Ghana, specializing in software development and digital transformation.",
          companySize: "50-100",
          founded: 2015,
          isVerified: true,
        },
      },
    },
  });

  const employer2 = await prisma.user.create({
    data: {
      email: "hr@financecorp.com",
      password: await bcrypt.hash("Password123!", 12),
      firstName: "Mary",
      lastName: "Finance",
      isVerified: true,
      isActive: true,
      role: "EMPLOYER",
      employer: {
        create: {
          companyName: "Finance Solutions Ltd",
          industry: "Finance",
          location: "Kumasi, Ghana",
          website: "https://financecorp.com",
          description:
            "Providing innovative financial services and solutions across West Africa.",
          companySize: "100-200",
          founded: 2010,
          isVerified: true,
        },
      },
    },
  });

  const employer3 = await prisma.user.create({
    data: {
      email: "info@healthplus.com",
      password: await bcrypt.hash("Password123!", 12),
      firstName: "Dr. Sarah",
      lastName: "Medical",
      isVerified: true,
      isActive: true,
      role: "EMPLOYER",
      employer: {
        create: {
          companyName: "HealthPlus Clinic",
          industry: "Healthcare",
          location: "Takoradi, Ghana",
          website: "https://healthplus.com",
          description:
            "Modern healthcare facility providing quality medical services to the community.",
          companySize: "20-50",
          founded: 2018,
          isVerified: false, // Pending verification
        },
      },
    },
  });

  console.log("✅ Created 3 employer accounts");

  // Create Job Seekers
  console.log("\n👨‍💼 Creating job seeker accounts...");

  const jobSeeker1 = await prisma.user.create({
    data: {
      email: "kwame@example.com",
      password: await bcrypt.hash("Password123!", 12),
      firstName: "Kwame",
      lastName: "Mensah",
      isVerified: true,
      isActive: true,
      role: "JOB_SEEKER",
      jobSeeker: {
        create: {
          firstName: "Kwame",
          lastName: "Mensah",
          location: "Accra, Ghana",
          bio: "Experienced software developer with 5 years in full-stack development. Passionate about building scalable applications.",
          skills: ["JavaScript", "React", "Node.js", "Python", "PostgreSQL"],
          experience: "MID_LEVEL",
          education: "BSc Computer Science - University of Ghana",
          phone: "244123456",
          countryCode: "+233",
        },
      },
    },
  });

  const jobSeeker2 = await prisma.user.create({
    data: {
      email: "abena@example.com",
      password: await bcrypt.hash("Password123!", 12),
      firstName: "Abena",
      lastName: "Osei",
      isVerified: true,
      isActive: true,
      role: "JOB_SEEKER",
      jobSeeker: {
        create: {
          firstName: "Abena",
          lastName: "Osei",
          location: "Kumasi, Ghana",
          bio: "Marketing professional with expertise in digital marketing and brand management.",
          skills: [
            "Digital Marketing",
            "SEO",
            "Content Creation",
            "Social Media",
            "Analytics",
          ],
          experience: "SENIOR_LEVEL",
          education: "MBA Marketing - KNUST",
          phone: "244234567",
          countryCode: "+233",
        },
      },
    },
  });

  const jobSeeker3 = await prisma.user.create({
    data: {
      email: "kofi@example.com",
      password: await bcrypt.hash("Password123!", 12),
      firstName: "Kofi",
      lastName: "Agyeman",
      isVerified: true,
      isActive: true,
      role: "JOB_SEEKER",
      jobSeeker: {
        create: {
          firstName: "Kofi",
          lastName: "Agyeman",
          location: "Accra, Ghana",
          bio: "Fresh graduate eager to start a career in software development.",
          skills: ["HTML", "CSS", "JavaScript", "Git"],
          experience: "ENTRY_LEVEL",
          education: "BSc Information Technology - Ashesi University",
          phone: "244345678",
          countryCode: "+233",
        },
      },
    },
  });

  console.log("✅ Created 3 job seeker accounts");

  // Get employer profiles
  const techCorpEmployer = await prisma.employer.findUnique({
    where: { userId: employer1.id },
  });

  const financeEmployer = await prisma.employer.findUnique({
    where: { userId: employer2.id },
  });

  const healthEmployer = await prisma.employer.findUnique({
    where: { userId: employer3.id },
  });

  // Create Jobs
  console.log("\n💼 Creating job listings...");

  const job1 = await prisma.job.create({
    data: {
      employerId: techCorpEmployer!.id,
      title: "Senior Full Stack Developer",
      description:
        "We are looking for an experienced Full Stack Developer to join our growing team. You will work on cutting-edge projects using modern technologies.",
      requirements: [
        "5+ years experience in web development",
        "Strong knowledge of React and Node.js",
        "Experience with PostgreSQL or similar databases",
        "Good understanding of REST APIs",
        "Excellent problem-solving skills",
      ],
      responsibilities: [
        "Develop and maintain web applications",
        "Collaborate with cross-functional teams",
        "Write clean, maintainable code",
        "Participate in code reviews",
        "Mentor junior developers",
      ],
      benefits: [
        "Health Insurance",
        "Remote Work Options",
        "Professional Development",
        "Competitive Salary",
      ],
      location: "Accra, Ghana",
      category: "TECHNOLOGY",
      isRemote: false,
      jobType: "FULL_TIME",
      experience: "SENIOR_LEVEL",
      salaryMin: 8000,
      salaryMax: 12000,
      isActive: true,
      isApproved: true,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  const job2 = await prisma.job.create({
    data: {
      employerId: financeEmployer!.id,
      title: "Financial Analyst",
      description:
        "Join our finance team to analyze financial data and provide insights for business decisions.",
      requirements: [
        "Bachelor's degree in Finance or Accounting",
        "3+ years of experience in financial analysis",
        "Proficiency in Excel and financial software",
        "Strong analytical skills",
        "Attention to detail",
      ],
      responsibilities: [
        "Analyze financial data and trends",
        "Prepare financial reports",
        "Support budgeting and forecasting",
        "Provide recommendations to management",
        "Monitor financial performance",
      ],
      benefits: [
        "Health Insurance",
        "Pension Scheme",
        "Annual Bonus",
        "Training Opportunities",
      ],
      location: "Kumasi, Ghana",
      category: "FINANCE",
      isRemote: false,
      jobType: "FULL_TIME",
      experience: "MID_LEVEL",
      salaryMin: 6000,
      salaryMax: 9000,
      isActive: true,
      isApproved: true,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });

  const job3 = await prisma.job.create({
    data: {
      employerId: techCorpEmployer!.id,
      title: "Junior Frontend Developer",
      description:
        "Great opportunity for a fresh graduate or junior developer to start their career in web development.",
      requirements: [
        "Basic knowledge of HTML, CSS, and JavaScript",
        "Familiarity with React or similar frameworks",
        "Good communication skills",
        "Willingness to learn",
        "Team player",
      ],
      responsibilities: [
        "Develop user interfaces",
        "Work with senior developers",
        "Write clean code",
        "Learn new technologies",
        "Participate in team meetings",
      ],
      benefits: [
        "Health Insurance",
        "Learning Budget",
        "Flexible Hours",
        "Career Growth",
      ],
      location: "Accra, Ghana",
      category: "TECHNOLOGY",
      isRemote: true,
      jobType: "FULL_TIME",
      experience: "ENTRY_LEVEL",
      salaryMin: 3000,
      salaryMax: 5000,
      isActive: true,
      isApproved: true,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  const job4 = await prisma.job.create({
    data: {
      employerId: healthEmployer!.id,
      title: "Registered Nurse",
      description:
        "We are seeking a qualified and compassionate registered nurse to join our medical team.",
      requirements: [
        "Valid nursing license",
        "2+ years clinical experience",
        "Excellent patient care skills",
        "Good communication abilities",
        "Ability to work in shifts",
      ],
      responsibilities: [
        "Provide patient care",
        "Administer medications",
        "Monitor patient conditions",
        "Collaborate with doctors",
        "Maintain medical records",
      ],
      benefits: [
        "Health Insurance",
        "Shift Allowance",
        "Continuous Training",
        "Professional Development",
      ],
      location: "Takoradi, Ghana",
      category: "HEALTHCARE",
      isRemote: false,
      jobType: "FULL_TIME",
      experience: "MID_LEVEL",
      salaryMin: 4000,
      salaryMax: 6000,
      isActive: true,
      isApproved: false, // Pending approval
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
  });

  const job5 = await prisma.job.create({
    data: {
      employerId: financeEmployer!.id,
      title: "Marketing Manager",
      description:
        "Lead our marketing efforts and drive brand awareness in the financial services sector.",
      requirements: [
        "5+ years marketing experience",
        "Experience in financial services preferred",
        "Strong leadership skills",
        "Digital marketing expertise",
        "Strategic thinking",
      ],
      responsibilities: [
        "Develop marketing strategies",
        "Manage marketing team",
        "Oversee campaigns",
        "Analyze market trends",
        "Report to senior management",
      ],
      benefits: [
        "Competitive Salary",
        "Car Allowance",
        "Health Insurance",
        "Performance Bonus",
      ],
      location: "Kumasi, Ghana",
      category: "MARKETING",
      isRemote: false,
      jobType: "FULL_TIME",
      experience: "SENIOR_LEVEL",
      salaryMin: 10000,
      salaryMax: 15000,
      isActive: true,
      isApproved: false, // Pending approval
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Created 5 job listings (3 approved, 2 pending approval)");

  // Get job seeker profiles
  const kwameJobSeeker = await prisma.jobSeeker.findUnique({
    where: { userId: jobSeeker1.id },
  });

  const abenaJobSeeker = await prisma.jobSeeker.findUnique({
    where: { userId: jobSeeker2.id },
  });

  const kofiJobSeeker = await prisma.jobSeeker.findUnique({
    where: { userId: jobSeeker3.id },
  });

  // Create Applications
  console.log("\n📝 Creating job applications...");

  await prisma.application.create({
    data: {
      jobId: job1.id,
      jobSeekerId: kwameJobSeeker!.id,
      coverLetter:
        "I am very interested in this position and believe my 5 years of experience in full-stack development makes me a great fit for your team.",
      status: "PENDING",
    },
  });

  await prisma.application.create({
    data: {
      jobId: job3.id,
      jobSeekerId: kofiJobSeeker!.id,
      coverLetter:
        "As a recent graduate, I am eager to learn and contribute to your development team. I have strong fundamentals and a passion for web development.",
      status: "REVIEWED",
    },
  });

  await prisma.application.create({
    data: {
      jobId: job2.id,
      jobSeekerId: abenaJobSeeker!.id,
      coverLetter:
        "With my MBA in Marketing and experience in brand management, I am confident I can bring valuable insights to your financial analysis team.",
      status: "SHORTLISTED",
    },
  });

  await prisma.application.create({
    data: {
      jobId: job5.id,
      jobSeekerId: abenaJobSeeker!.id,
      coverLetter:
        "I am excited about the Marketing Manager position. My extensive experience in digital marketing aligns perfectly with your requirements.",
      status: "PENDING",
    },
  });

  console.log("✅ Created 4 job applications");

  // Create Saved Jobs
  console.log("\n⭐ Creating saved jobs...");

  await prisma.savedJob.create({
    data: {
      jobId: job2.id,
      jobSeekerId: kwameJobSeeker!.id,
    },
  });

  await prisma.savedJob.create({
    data: {
      jobId: job1.id,
      jobSeekerId: kofiJobSeeker!.id,
    },
  });

  console.log("✅ Created 2 saved jobs");

  // Create Newsletter Subscriptions
  console.log("\n📧 Creating newsletter subscriptions...");

  await prisma.newsletter.createMany({
    data: [
      { email: "subscriber1@example.com", isActive: true },
      { email: "subscriber2@example.com", isActive: true },
      { email: "subscriber3@example.com", isActive: false },
    ],
  });

  console.log("✅ Created 3 newsletter subscriptions");

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Database seeding completed successfully!");
  console.log("=".repeat(50));
  console.log("\n📊 Summary:");
  console.log("- 1 Admin user");
  console.log("- 3 Employers (2 verified, 1 pending)");
  console.log("- 3 Job Seekers");
  console.log("- 5 Jobs (3 approved, 2 pending)");
  console.log("- 4 Applications");
  console.log("- 2 Saved Jobs");
  console.log("- 3 Newsletter Subscribers");
  console.log("\n🔐 Login Credentials:");
  console.log("Admin: admin@employme.com / AdminPassword123!");
  console.log("Employer 1: tech@company.com / Password123!");
  console.log("Employer 2: hr@financecorp.com / Password123!");
  console.log("Employer 3: info@healthplus.com / Password123!");
  console.log("Job Seeker 1: kwame@example.com / Password123!");
  console.log("Job Seeker 2: abena@example.com / Password123!");
  console.log("Job Seeker 3: kofi@example.com / Password123!");
  console.log("=".repeat(50) + "\n");
}

main()
  .then(() => {
    console.log("✅ Seeding process finished!");
  })
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
