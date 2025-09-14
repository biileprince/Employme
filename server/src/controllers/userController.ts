import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

// Get current user profile
export const getCurrentUser = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      jobSeeker: true,
      employer: true,
      admin: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        imageUrl: user.imageUrl,
        isActive: user.isActive,
        profile: user.jobSeeker || user.employer || user.admin || null
      }
    }
  });
});

// Get all candidates (job seekers with profiles)
export const getCandidates = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const candidates = await prisma.user.findMany({
    where: {
      role: 'JOB_SEEKER',
      isActive: true,
      jobSeeker: {
        isNot: null
      }
    },
    include: {
      jobSeeker: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({
    success: true,
    data: candidates.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      profile: user.jobSeeker
    }))
  });
});

// Update user profile
export const updateProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { firstName, lastName, imageUrl } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      imageUrl: imageUrl || undefined
    },
    include: {
      jobSeeker: true,
      employer: true,
      admin: true
    }
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        imageUrl: updatedUser.imageUrl,
        profile: updatedUser.jobSeeker || updatedUser.employer || updatedUser.admin || null
      }
    }
  });
});

// Create job seeker profile
export const createJobSeekerProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== 'JOB_SEEKER') {
    throw new AppError('Only job seekers can create this profile type', 403);
  }

  // Check if profile already exists
  const existingProfile = await prisma.jobSeeker.findUnique({
    where: { userId: req.user.id }
  });

  if (existingProfile) {
    throw new AppError('Job seeker profile already exists', 409);
  }

  const {
    firstName,
    lastName,
    dateOfBirth,
    location,
    bio,
    skills,
    experience,
    education,
    cvUrl,
    profileImageUrl
  } = req.body;

  const profile = await prisma.jobSeeker.create({
    data: {
      userId: req.user.id,
      firstName: firstName || '',
      lastName: lastName || '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      location: location || null,
      bio: bio || null,
      skills: skills || [],
      experience: experience || null,
      education: education || null,
      cvUrl: cvUrl || null,
      profileImageUrl: profileImageUrl || null
    }
  });

  res.status(201).json({
    success: true,
    message: 'Job seeker profile created successfully',
    data: { profile }
  });
});

// Create employer profile
export const createEmployerProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== 'EMPLOYER') {
    throw new AppError('Only employers can create this profile type', 403);
  }

  // Check if profile already exists
  const existingProfile = await prisma.employer.findUnique({
    where: { userId: req.user.id }
  });

  if (existingProfile) {
    throw new AppError('Employer profile already exists', 409);
  }

  const {
    companyName,
    industry,
    location,
    website,
    description,
    logoUrl,
    founded,
    companySize
  } = req.body;

  if (!companyName) {
    throw new AppError('Company name is required', 400);
  }

  const profile = await prisma.employer.create({
    data: {
      userId: req.user.id,
      companyName,
      industry: industry || null,
      location: location || null,
      website: website || null,
      description: description || null,
      logoUrl: logoUrl || null,
      founded: founded || null,
      companySize: companySize || null
    }
  });

  res.status(201).json({
    success: true,
    message: 'Employer profile created successfully',
    data: { profile }
  });
});

// Update job seeker profile
export const updateJobSeekerProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== 'JOB_SEEKER') {
    throw new AppError('Only job seekers can update this profile type', 403);
  }

  const profile = await prisma.jobSeeker.findUnique({
    where: { userId: req.user.id }
  });

  if (!profile) {
    throw new AppError('Job seeker profile not found', 404);
  }

  const {
    firstName,
    lastName,
    dateOfBirth,
    location,
    bio,
    skills,
    experience,
    education,
    cvUrl,
    profileImageUrl
  } = req.body;

  const updatedProfile = await prisma.jobSeeker.update({
    where: { userId: req.user.id },
    data: {
      firstName: firstName !== undefined ? firstName : profile.firstName,
      lastName: lastName !== undefined ? lastName : profile.lastName,
      dateOfBirth: dateOfBirth !== undefined ? (dateOfBirth ? new Date(dateOfBirth) : null) : profile.dateOfBirth,
      location: location !== undefined ? location : profile.location,
      bio: bio !== undefined ? bio : profile.bio,
      skills: skills !== undefined ? skills : profile.skills,
      experience: experience !== undefined ? experience : profile.experience,
      education: education !== undefined ? education : profile.education,
      cvUrl: cvUrl !== undefined ? cvUrl : profile.cvUrl,
      profileImageUrl: profileImageUrl !== undefined ? profileImageUrl : profile.profileImageUrl
    }
  });

  res.status(200).json({
    success: true,
    message: 'Job seeker profile updated successfully',
    data: { profile: updatedProfile }
  });
});

// Update employer profile
export const updateEmployerProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  if (req.user.role !== 'EMPLOYER') {
    throw new AppError('Only employers can update this profile type', 403);
  }

  const profile = await prisma.employer.findUnique({
    where: { userId: req.user.id }
  });

  if (!profile) {
    throw new AppError('Employer profile not found', 404);
  }

  const {
    companyName,
    industry,
    location,
    website,
    description,
    logoUrl,
    founded,
    companySize,
    phone,
    countryCode,
    firstName,
    lastName
  } = req.body;

  const updatedProfile = await prisma.employer.update({
    where: { userId: req.user.id },
    data: {
      companyName: companyName !== undefined ? companyName : profile.companyName,
      industry: industry !== undefined ? industry : profile.industry,
      location: location !== undefined ? location : profile.location,
      website: website !== undefined ? website : profile.website,
      description: description !== undefined ? description : profile.description,
      logoUrl: logoUrl !== undefined ? logoUrl : profile.logoUrl,
      founded: founded !== undefined ? founded : profile.founded,
      companySize: companySize !== undefined ? companySize : profile.companySize,
      phone: phone !== undefined ? phone : profile.phone,
      countryCode: countryCode !== undefined ? countryCode : profile.countryCode
    },
    include: {
      user: true
    }
  });

  // Also update user info if provided
  if (firstName !== undefined || lastName !== undefined) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Employer profile updated successfully',
    data: { profile: updatedProfile }
  });
});

// Delete user account
export const deleteAccount = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  // In a real application, you might want to:
  // 1. Soft delete instead of hard delete
  // 2. Clean up related data
  // 3. Send confirmation emails
  // 4. Handle ongoing transactions

  await prisma.user.update({
    where: { id: req.user.id },
    data: { isActive: false }
  });

  res.status(200).json({
    success: true,
    message: 'Account deactivated successfully'
  });
});
