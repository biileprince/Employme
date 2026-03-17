import {
  PrismaClient,
  AlertDeliveryChannel,
  NotificationType,
} from "@prisma/client";
import { sendJobAlertMatchEmail } from "./emailService.js";

const prisma = new PrismaClient();

const normalize = (value: string): string => value.trim().toLowerCase();

const normalizeArray = (values: string[]): string[] =>
  values.map(normalize).filter((value) => value.length > 0);

const jobMatchesAlert = (
  job: {
    title: string;
    description: string;
    requirements: string[];
    location: string;
    category: string;
    jobType: string;
    isRemote: boolean;
  },
  alert: {
    keywords: string[];
    locations: string[];
    categories: string[];
    jobTypes: string[];
  },
): boolean => {
  const keywords = normalizeArray(alert.keywords);
  const locations = normalizeArray(alert.locations);

  const hasKeywordFilter = keywords.length > 0;
  const hasLocationFilter = locations.length > 0;
  const hasCategoryFilter = alert.categories.length > 0;
  const hasJobTypeFilter = alert.jobTypes.length > 0;

  if (
    !hasKeywordFilter &&
    !hasLocationFilter &&
    !hasCategoryFilter &&
    !hasJobTypeFilter
  ) {
    return false;
  }

  if (hasKeywordFilter) {
    const searchableText = [
      job.title,
      job.description,
      ...(job.requirements || []),
    ]
      .join(" ")
      .toLowerCase();

    const keywordMatched = keywords.some((keyword) =>
      searchableText.includes(keyword),
    );
    if (!keywordMatched) {
      return false;
    }
  }

  if (hasLocationFilter) {
    const normalizedJobLocation = normalize(job.location || "");
    const locationMatched = locations.some((location) => {
      if (location === "remote") {
        return job.isRemote;
      }

      return normalizedJobLocation.includes(location);
    });

    if (!locationMatched) {
      return false;
    }
  }

  if (hasCategoryFilter && !alert.categories.includes(job.category)) {
    return false;
  }

  if (hasJobTypeFilter && !alert.jobTypes.includes(job.jobType)) {
    return false;
  }

  return true;
};

const createDeliveryRecord = async (
  userId: string,
  jobId: string,
  channel: AlertDeliveryChannel,
): Promise<boolean> => {
  try {
    await prisma.jobAlertDelivery.create({
      data: {
        userId,
        jobId,
        channel,
      },
    });

    return true;
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      return false;
    }

    throw error;
  }
};

export const processPublishedJobAlerts = async (
  jobId: string,
): Promise<void> => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      employer: {
        select: {
          companyName: true,
        },
      },
    },
  });

  if (!job || !job.isActive || !job.isApproved) {
    return;
  }

  const alerts = await prisma.jobAlert.findMany({
    where: {
      isActive: true,
      user: {
        isActive: true,
        role: "JOB_SEEKER",
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const matchedAlerts = alerts.filter((alert) =>
    jobMatchesAlert(job, {
      keywords: alert.keywords,
      locations: alert.locations,
      categories: alert.categories,
      jobTypes: alert.jobTypes,
    }),
  );

  if (matchedAlerts.length === 0) {
    return;
  }

  await prisma.jobAlertMatch.createMany({
    data: matchedAlerts.map((alert) => ({
      jobAlertId: alert.id,
      jobId: job.id,
    })),
    skipDuplicates: true,
  });

  const groupedByUser = new Map<
    string,
    {
      emailEnabled: boolean;
      inAppEnabled: boolean;
      email: string;
      firstName: string | null;
      lastName: string | null;
    }
  >();

  for (const alert of matchedAlerts) {
    const existing = groupedByUser.get(alert.user.id);

    if (!existing) {
      groupedByUser.set(alert.user.id, {
        emailEnabled: alert.emailEnabled,
        inAppEnabled: alert.inAppEnabled,
        email: alert.user.email,
        firstName: alert.user.firstName,
        lastName: alert.user.lastName,
      });
      continue;
    }

    existing.emailEnabled = existing.emailEnabled || alert.emailEnabled;
    existing.inAppEnabled = existing.inAppEnabled || alert.inAppEnabled;
  }

  for (const [userId, preference] of groupedByUser.entries()) {
    if (preference.inAppEnabled) {
      const inAppCreated = await createDeliveryRecord(
        userId,
        job.id,
        AlertDeliveryChannel.IN_APP,
      );

      if (inAppCreated) {
        await prisma.notification.create({
          data: {
            userId,
            type: NotificationType.JOB_ALERT_MATCH,
            title: `New job match: ${job.title}`,
            message: `${job.title} at ${job.employer.companyName} matches your alert.`,
            data: {
              jobId: job.id,
              title: job.title,
              location: job.location,
              category: job.category,
              jobType: job.jobType,
              companyName: job.employer.companyName,
            },
          },
        });
      }
    }

    if (preference.emailEnabled) {
      const emailCreated = await createDeliveryRecord(
        userId,
        job.id,
        AlertDeliveryChannel.EMAIL,
      );

      if (emailCreated && preference.email) {
        const recipientName =
          `${preference.firstName || ""} ${preference.lastName || ""}`.trim() ||
          preference.email.split("@")[0] ||
          "there";

        await sendJobAlertMatchEmail(preference.email, {
          recipientName,
          jobTitle: job.title,
          companyName: job.employer.companyName,
          location: job.location,
          jobType: job.jobType,
          category: job.category,
          jobId: job.id,
        });
      }
    }
  }
};
