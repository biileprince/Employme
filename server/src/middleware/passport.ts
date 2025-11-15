import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Type guard for passport user
interface PassportUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        socialAccounts: true,
        jobSeeker: true,
        employer: true,
        admin: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        `http://localhost:${process.env.PORT || 5001}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google OAuth callback received:", {
          profileId: profile.id,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
        });

        // Check if user already exists with this Google ID
        let user = await prisma.user.findFirst({
          where: {
            socialAccounts: {
              some: {
                provider: "google",
                providerId: profile.id,
              },
            },
          },
          include: {
            socialAccounts: true,
            jobSeeker: true,
            employer: true,
            admin: true,
          },
        });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with the same email
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await prisma.user.findUnique({
            where: { email },
            include: {
              socialAccounts: true,
              jobSeeker: true,
              employer: true,
              admin: true,
            },
          });

          if (user) {
            // Link the social account to existing user
            await prisma.socialAccount.create({
              data: {
                userId: user.id,
                provider: "google",
                providerId: profile.id,
                email: email,
                displayName: profile.displayName,
                photos: profile.photos?.[0]?.value || null,
              },
            });

            // Refresh user data
            user = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                socialAccounts: true,
                jobSeeker: true,
                employer: true,
                admin: true,
              },
            });

            return done(null, user || false);
          }
        }

        // Create new user with social account
        if (email) {
          // Get role from session or default to JOB_SEEKER
          const userRole =
            (req.session as any)?.pendingOAuthRole || "JOB_SEEKER";
          console.log("Creating Google user with role:", userRole);

          user = await prisma.user.create({
            data: {
              email,
              firstName: profile.name?.givenName || "",
              lastName: profile.name?.familyName || "",
              imageUrl: profile.photos?.[0]?.value || null,
              password: "", // No password for social login
              isVerified: true, // Social accounts are pre-verified
              role: userRole,
              socialAccounts: {
                create: {
                  provider: "google",
                  providerId: profile.id,
                  email: email,
                  displayName: profile.displayName,
                  photos: profile.photos?.[0]?.value || null,
                },
              },
            },
            include: {
              socialAccounts: true,
              jobSeeker: true,
              employer: true,
              admin: true,
            },
          });

          return done(null, user);
        }

        return done(new Error("No email provided by Google"), false);
      } catch (error) {
        console.error("Google OAuth error:", {
          error: error,
          message: (error as Error).message,
          stack: (error as Error).stack,
          profileId: profile?.id,
          profileEmail: profile?.emails?.[0]?.value,
        });
        return done(error, false);
      }
    }
  )
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || "",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "",
      callbackURL:
        process.env.FACEBOOK_CALLBACK_URL ||
        `http://localhost:${
          process.env.PORT || 5001
        }/api/auth/facebook/callback`,
      profileFields: ["id", "emails", "name", "picture.type(large)"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log("Facebook OAuth callback received:", {
          profileId: profile.id,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
        });

        // Check if user already exists with this Facebook ID
        let user = await prisma.user.findFirst({
          where: {
            socialAccounts: {
              some: {
                provider: "facebook",
                providerId: profile.id,
              },
            },
          },
          include: {
            socialAccounts: true,
            jobSeeker: true,
            employer: true,
            admin: true,
          },
        });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with the same email
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await prisma.user.findUnique({
            where: { email },
            include: {
              socialAccounts: true,
              jobSeeker: true,
              employer: true,
              admin: true,
            },
          });

          if (user) {
            // Link the social account to existing user
            await prisma.socialAccount.create({
              data: {
                userId: user.id,
                provider: "facebook",
                providerId: profile.id,
                email: email,
                displayName: profile.displayName,
                photos: profile.photos?.[0]?.value || null,
              },
            });

            // Refresh user data
            user = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                socialAccounts: true,
                jobSeeker: true,
                employer: true,
                admin: true,
              },
            });

            return done(null, user);
          }
        }

        // Create new user with social account
        if (email) {
          // Get role from session or default to JOB_SEEKER
          const userRole =
            (req.session as any)?.pendingOAuthRole || "JOB_SEEKER";
          console.log("Creating Facebook user with role:", userRole);

          user = await prisma.user.create({
            data: {
              email,
              firstName: profile.name?.givenName || "",
              lastName: profile.name?.familyName || "",
              imageUrl: profile.photos?.[0]?.value || null,
              password: "", // No password for social login
              isVerified: true, // Social accounts are pre-verified
              role: userRole,
              socialAccounts: {
                create: {
                  provider: "facebook",
                  providerId: profile.id,
                  email: email,
                  displayName: profile.displayName,
                  photos: profile.photos?.[0]?.value || null,
                },
              },
            },
            include: {
              socialAccounts: true,
              jobSeeker: true,
              employer: true,
              admin: true,
            },
          });

          return done(null, user);
        }

        return done(new Error("No email provided by Facebook"), null);
      } catch (error) {
        console.error("Facebook OAuth error:", {
          error: error,
          message: (error as Error).message,
          stack: (error as Error).stack,
          profileId: profile?.id,
          profileEmail: profile?.emails?.[0]?.value,
        });
        return done(error, null);
      }
    }
  )
);

export default passport;
