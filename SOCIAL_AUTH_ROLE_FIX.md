# Social Authentication Role Selection Fix

## Problem
When users selected a role (JOB_SEEKER or EMPLOYER) before initiating social authentication (Google, Facebook, or LinkedIn), the system was ignoring their selection and always creating accounts with the default "JOB_SEEKER" role.

## Root Cause
The OAuth strategies and LinkedIn controller were hardcoding the role as "JOB_SEEKER" when creating new users, without checking the session for the user's selected role.

## Solution Overview
Implemented a dual-layer role storage system:
1. **Frontend**: Stores selected role in localStorage and passes it as query parameter
2. **Backend**: Captures role in session via middleware before OAuth redirect
3. **OAuth Strategies**: Retrieve role from session when creating users

## Implementation Details

### 1. Frontend Changes (Already Implemented)

#### SocialLogin.tsx
- Stores selected role in localStorage: `localStorage.setItem('pending_social_auth_role', selectedRole)`
- Appends role to OAuth URL: `/auth/${provider}?role=${selectedRole}`

#### SignupPage.tsx
- Retrieves stored role after OAuth callback
- Sends role to backend completion endpoint if needed

### 2. Backend Middleware (Already Implemented)

#### authRoutes.ts - storeRoleInSession Middleware
```typescript
const storeRoleInSession = (req: Request, res: Response, next: NextFunction) => {
  const role = req.query.role as string;
  if (role && (role === 'JOB_SEEKER' || role === 'EMPLOYER')) {
    (req.session as any).pendingOAuthRole = role;
  }
  next();
};
```

Applied to all OAuth initiation routes:
- `/auth/google?role=EMPLOYER`
- `/auth/facebook?role=EMPLOYER`
- `/auth/linkedin?role=EMPLOYER`

### 3. OAuth Strategy Updates (NEW FIX)

#### passport.ts - Google Strategy
**Changed:**
```typescript
passReqToCallback: true,  // Changed from false to true
```

**In User Creation:**
```typescript
const userRole = (req.session as any)?.pendingOAuthRole || "JOB_SEEKER";

const newUser = await prisma.user.create({
  data: {
    email: profile.emails![0].value,
    // ... other fields
    role: userRole,  // Uses session role instead of hardcoded "JOB_SEEKER"
  }
});
```

#### passport.ts - Facebook Strategy
**Same changes as Google:**
- Enabled `passReqToCallback: true`
- Retrieves role from session: `(req.session as any)?.pendingOAuthRole || "JOB_SEEKER"`

#### linkedinAuthController.ts - findOrCreateUser Function
**Updated function signature:**
```typescript
async function findOrCreateUser(req: Request, profileData: any)  // Added req parameter
```

**In User Creation:**
```typescript
role: (req.session as any)?.pendingOAuthRole || "JOB_SEEKER",  // Changed from hardcoded "JOB_SEEKER"
```

### 4. Session Cleanup (NEW FIX)

Added cleanup to prevent role persistence across different login attempts:

#### authController.ts - socialAuthSuccess
```typescript
delete (req.session as any).pendingOAuthRole;  // Clear role after use
```

#### linkedinAuthController.ts - linkedinCallback
```typescript
delete (req.session as any).pendingOAuthRole;  // Clear role after use
```

## How It Works (Complete Flow)

1. **User selects role on signup page** (e.g., EMPLOYER)
   - Frontend stores: `localStorage.setItem('pending_social_auth_role', 'EMPLOYER')`

2. **User clicks "Continue with Google"**
   - Frontend redirects: `window.location.href = '/auth/google?role=EMPLOYER'`

3. **Backend captures role in session**
   - `storeRoleInSession` middleware: `req.session.pendingOAuthRole = 'EMPLOYER'`

4. **OAuth redirect to Google**
   - User authenticates with Google
   - Google redirects back: `/auth/google/callback`

5. **Passport strategy processes callback**
   - `passReqToCallback: true` gives strategy access to `req`
   - Strategy retrieves role: `const userRole = req.session?.pendingOAuthRole || 'JOB_SEEKER'`
   - Creates user with: `role: userRole` (EMPLOYER, not JOB_SEEKER!)

6. **Session cleanup**
   - After user creation: `delete req.session.pendingOAuthRole`
   - Prevents role bleeding into next auth attempt

7. **User redirected to appropriate dashboard**
   - EMPLOYER → `/employer/dashboard`
   - JOB_SEEKER → `/job-seeker/dashboard`

## Files Modified

### Backend
1. `server/src/middleware/passport.ts`
   - Google strategy: `passReqToCallback: true` + session role retrieval
   - Facebook strategy: `passReqToCallback: true` + session role retrieval

2. `server/src/controllers/linkedinAuthController.ts`
   - Updated `findOrCreateUser(req, profileData)` to accept `req`
   - Changed role from hardcoded to session-based

3. `server/src/controllers/authController.ts`
   - Added `pendingOAuthRole` cleanup in `socialAuthSuccess`

### Frontend (Already Complete)
1. `client/src/components/auth/SocialLogin.tsx` - Role storage and URL parameter
2. `client/src/pages/auth/SignupPage.tsx` - Role retrieval after OAuth
3. `client/src/services/api.ts` - completeSocialAuth endpoint

## Testing Checklist

- [ ] **Google OAuth with EMPLOYER role**
  1. Go to signup page
  2. Select "I'm an Employer"
  3. Click "Continue with Google"
  4. Complete Google auth
  5. Verify user role in database is "EMPLOYER"
  6. Verify redirect to `/employer/dashboard`

- [ ] **Facebook OAuth with EMPLOYER role**
  1. Same steps as Google but with Facebook
  2. Verify "EMPLOYER" role
  3. Verify redirect to `/employer/dashboard`

- [ ] **LinkedIn OAuth with EMPLOYER role**
  1. Same steps as Google but with LinkedIn
  2. Verify "EMPLOYER" role
  3. Verify redirect to `/employer/dashboard`

- [ ] **Default behavior (no role selected)**
  1. Navigate directly to `/auth/google` (no role param)
  2. Should default to "JOB_SEEKER"
  3. Verify redirect to `/job-seeker/dashboard`

- [ ] **Session cleanup verification**
  1. Select EMPLOYER and start OAuth
  2. Cancel/go back
  3. Select JOB_SEEKER and complete OAuth
  4. Verify role is JOB_SEEKER (not EMPLOYER from previous attempt)

## Database Verification

After OAuth authentication, check the database:

```sql
-- Check user's role
SELECT id, email, role FROM "User" WHERE email = 'your-oauth-email@gmail.com';

-- Check if social account is linked
SELECT * FROM "SocialAccount" WHERE "userId" = 'user-id-from-above';

-- Check role-specific profile
SELECT * FROM "Employer" WHERE "userId" = 'user-id-from-above';
-- OR
SELECT * FROM "JobSeeker" WHERE "userId" = 'user-id-from-above';
```

## Key Takeaways

1. **passReqToCallback is critical**: Without setting this to `true` in Passport strategies, the `req` object (and therefore session) is not accessible

2. **Session vs localStorage**: 
   - localStorage is client-side fallback
   - Session is server-side source of truth
   - Both work together for reliability

3. **Clean up after use**: Always delete `pendingOAuthRole` from session after user creation to prevent role bleeding

4. **LinkedIn is different**: It doesn't use Passport, so manual implementation required separate handling

## Monitoring

Add logging to track role selection:

```typescript
// In passport.ts and linkedinAuthController.ts
const userRole = (req.session as any)?.pendingOAuthRole || "JOB_SEEKER";
console.log(`Creating OAuth user with role: ${userRole}`);
```

Check server logs during testing to confirm role is being retrieved correctly.
