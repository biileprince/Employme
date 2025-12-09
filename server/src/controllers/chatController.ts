import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { catchAsync, AppError } from "../middleware/errorHandler.js";

const prisma = new PrismaClient();

/**
 * Get eligible contacts for messaging based on user role
 * - Job Seekers: Can message employers from jobs they applied to
 * - Employers: Can message job seekers who applied to their jobs
 * - Admins: Can message all users
 */
export const getEligibleContacts = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let eligibleContacts: any[] = [];

    if (userRole === "ADMIN") {
      // Admins can message all users
      const users = await prisma.user.findMany({
        where: {
          id: { not: userId },
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
          role: true,
          employer: {
            select: {
              companyName: true,
              logoUrl: true,
            },
          },
          jobSeeker: {
            select: {
              firstName: true,
              lastName: true,
              profileImageUrl: true,
            },
          },
        },
        orderBy: {
          firstName: "asc",
        },
      });

      eligibleContacts = users;
    } else if (userRole === "JOB_SEEKER") {
      // Job seekers can message employers from jobs they applied to
      const jobSeekerId = req.user!.profile!.id;

      const applications = await prisma.application.findMany({
        where: { jobSeekerId },
        include: {
          job: {
            include: {
              employer: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      imageUrl: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Extract unique employers
      const employerMap = new Map();
      applications.forEach((app) => {
        const employer = app.job.employer;
        if (!employerMap.has(employer.userId)) {
          employerMap.set(employer.userId, {
            id: employer.user.id,
            firstName: employer.user.firstName,
            lastName: employer.user.lastName,
            email: employer.user.email,
            imageUrl: employer.user.imageUrl,
            role: employer.user.role,
            employer: {
              companyName: employer.companyName,
              logoUrl: employer.logoUrl,
            },
          });
        }
      });

      eligibleContacts = Array.from(employerMap.values());
    } else if (userRole === "EMPLOYER") {
      // Employers can message job seekers who applied to their jobs
      const employerId = req.user!.profile!.id;

      const applications = await prisma.application.findMany({
        where: {
          job: { employerId },
        },
        include: {
          jobSeeker: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  imageUrl: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      // Extract unique job seekers
      const jobSeekerMap = new Map();
      applications.forEach((app) => {
        const jobSeeker = app.jobSeeker;
        if (!jobSeekerMap.has(jobSeeker.userId)) {
          jobSeekerMap.set(jobSeeker.userId, {
            id: jobSeeker.user.id,
            firstName: jobSeeker.user.firstName,
            lastName: jobSeeker.user.lastName,
            email: jobSeeker.user.email,
            imageUrl: jobSeeker.user.imageUrl,
            role: jobSeeker.user.role,
            jobSeeker: {
              firstName: jobSeeker.firstName,
              lastName: jobSeeker.lastName,
              profileImageUrl: jobSeeker.profileImageUrl,
            },
          });
        }
      });

      eligibleContacts = Array.from(jobSeekerMap.values());
    }

    res.status(200).json({
      success: true,
      data: {
        contacts: eligibleContacts,
        count: eligibleContacts.length,
      },
    });
  }
);

/**
 * Get all conversations for the authenticated user
 */
export const getConversations = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          {
            participant1Id: userId,
          },
          {
            participant2Id: userId,
          },
        ],
      },
      include: {
        participant1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            role: true,
            employer: {
              select: {
                companyName: true,
                logoUrl: true,
              },
            },
            jobSeeker: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true,
              },
            },
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            role: true,
            employer: {
              select: {
                companyName: true,
                logoUrl: true,
              },
            },
            jobSeeker: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            isRead: true,
            senderId: true,
            isDeleted: true,
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Filter out conversations deleted by the current user
    const activeConversations = conversations.filter((conv) => {
      if (conv.participant1Id === userId && conv.deletedByParticipant1) {
        return false;
      }
      if (conv.participant2Id === userId && conv.deletedByParticipant2) {
        return false;
      }
      return true;
    });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      activeConversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        return {
          ...conv,
          unreadCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        conversations: conversationsWithUnread,
        count: conversationsWithUnread.length,
      },
    });
  }
);

/**
 * Get or create a conversation between two users
 */
export const getOrCreateConversation = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { participantId } = req.params;

    if (!participantId) {
      throw new AppError("Participant ID is required", 400);
    }

    if (userId === participantId) {
      throw new AppError("Cannot create conversation with yourself", 400);
    }

    // Check if participant exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new AppError("Participant not found", 404);
    }

    // Sort IDs to ensure consistent conversation lookup
    const sortedIds = [userId, participantId].sort();
    const participant1Id = sortedIds[0]!;
    const participant2Id = sortedIds[1]!;

    // Find or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: {
        participant1Id_participant2Id: {
          participant1Id,
          participant2Id,
        },
      },
      include: {
        participant1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            role: true,
            employer: {
              select: {
                companyName: true,
                logoUrl: true,
              },
            },
            jobSeeker: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true,
              },
            },
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            role: true,
            employer: {
              select: {
                companyName: true,
                logoUrl: true,
              },
            },
            jobSeeker: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participant1Id,
          participant2Id,
        },
        include: {
          participant1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
              role: true,
              employer: {
                select: {
                  companyName: true,
                  logoUrl: true,
                },
              },
              jobSeeker: {
                select: {
                  firstName: true,
                  lastName: true,
                  profileImageUrl: true,
                },
              },
            },
          },
          participant2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
              role: true,
              employer: {
                select: {
                  companyName: true,
                  logoUrl: true,
                },
              },
              jobSeeker: {
                select: {
                  firstName: true,
                  lastName: true,
                  profileImageUrl: true,
                },
              },
            },
          },
        },
      });
    } else {
      // If conversation exists but was deleted by either participant, restore it
      if (
        conversation.deletedByParticipant1 ||
        conversation.deletedByParticipant2
      ) {
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            deletedByParticipant1: false,
            deletedByParticipant2: false,
          },
          include: {
            participant1: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
                role: true,
                employer: {
                  select: {
                    companyName: true,
                    logoUrl: true,
                  },
                },
                jobSeeker: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
            participant2: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
                role: true,
                employer: {
                  select: {
                    companyName: true,
                    logoUrl: true,
                  },
                },
                jobSeeker: {
                  select: {
                    firstName: true,
                    lastName: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
          },
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { conversation },
    });
  }
);

/**
 * Get all messages in a conversation
 */
export const getMessages = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { conversationId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  // Verify user is part of the conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  if (
    conversation.participant1Id !== userId &&
    conversation.participant2Id !== userId
  ) {
    throw new AppError("You are not part of this conversation", 403);
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.message.count({
      where: { conversationId },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * Send a message in a conversation
 */
export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { conversationId } = req.params;
  const { content, attachmentUrl, attachmentType } = req.body;

  if (!conversationId) {
    throw new AppError("Conversation ID is required", 400);
  }

  if (!content && !attachmentUrl) {
    throw new AppError("Message content or attachment is required", 400);
  }

  // Verify user is part of the conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  if (
    conversation.participant1Id !== userId &&
    conversation.participant2Id !== userId
  ) {
    throw new AppError("You are not part of this conversation", 403);
  }

  // Create message and update conversation
  const [message] = await Promise.all([
    prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: content || "",
        attachmentUrl,
        attachmentType,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            role: true,
          },
        },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  res.status(201).json({
    success: true,
    data: { message },
  });
});

/**
 * Mark messages as read
 */
export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { conversationId } = req.params;

  // Verify user is part of the conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  if (
    conversation.participant1Id !== userId &&
    conversation.participant2Id !== userId
  ) {
    throw new AppError("You are not part of this conversation", 403);
  }

  // Mark all messages from other participant as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });

  res.status(200).json({
    success: true,
    message: "Messages marked as read",
  });
});

/**
 * Delete a conversation
 */
export const deleteConversation = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (
      conversation.participant1Id !== userId &&
      conversation.participant2Id !== userId
    ) {
      throw new AppError("You are not part of this conversation", 403);
    }

    // Determine which participant is deleting
    const isParticipant1 = conversation.participant1Id === userId;

    // Update the conversation to mark as deleted by this user
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: isParticipant1
        ? { deletedByParticipant1: true }
        : { deletedByParticipant2: true },
    });

    // If both participants have deleted, actually delete the conversation
    if (
      updatedConversation.deletedByParticipant1 &&
      updatedConversation.deletedByParticipant2
    ) {
      await prisma.conversation.delete({
        where: { id: conversationId },
      });
    }

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  }
);

/**
 * Get unread message count for authenticated user
 */
export const getUnreadCount = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;

    // Get all conversations for the user
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
      select: { id: true },
    });

    const conversationIds = conversations.map((conv) => conv.id);

    // Count unread messages across all conversations
    const unreadCount = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        isRead: false,
      },
    });

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  }
);

/**
 * Edit a message
 */
export const editMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { conversationId, messageId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new AppError("Message content is required", 400);
  }

  // Get the message
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  // Check if user is the sender
  if (message.senderId !== userId) {
    throw new AppError("You can only edit your own messages", 403);
  }

  // Check if message belongs to the conversation
  if (message.conversationId !== conversationId) {
    throw new AppError("Message does not belong to this conversation", 400);
  }

  // Update the message
  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      content: content.trim(),
      isEdited: true,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: { message: updatedMessage },
  });
});

/**
 * Delete a message (soft delete)
 */
export const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { conversationId, messageId } = req.params;

  // Get the message
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  // Check if user is the sender
  if (message.senderId !== userId) {
    throw new AppError("You can only delete your own messages", 403);
  }

  // Check if message belongs to the conversation
  if (message.conversationId !== conversationId) {
    throw new AppError("Message does not belong to this conversation", 400);
  }

  // Soft delete the message
  const deletedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      content: "This message was deleted",
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          role: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: { message: deletedMessage },
  });
});
