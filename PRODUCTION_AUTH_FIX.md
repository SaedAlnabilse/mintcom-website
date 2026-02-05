# Production Authentication Fix

## Problem Summary
When deploying to production, users are immediately redirected back to the login page after successful authentication. This works fine in local development.

## Root Cause
This is a **cross-origin cookie issue**. Your frontend and backend are on different domains:
- Frontend: `your-domain.vercel.app` (or Cloudflare Pages)
- Backend: `grateful-liberation-production-d036.up.railway.app`

Browsers block third-party cookies by default in cross-origin scenarios. The `HttpOnly` cookie set by your backend during login is not being sent with subsequent API requests.

## Frontend Fixes Applied

### 1. `src/components/ProtectedRoute.tsx`
- Added `account` to the authentication check to prevent premature redirects
- Added `state={{ from: location.pathname }}` to preserve redirect destination
- Prevents redirect loop by waiting for auth initialization to complete

### 2. `src/context/AuthContext.tsx`
- Added 401 error detection in `initializeAuth()`
- Clears local state when session is invalid (prevents stale auth state)
- Proper error handling for cross-origin cookie failures

### 3. `src/config/api.ts`
- Added `isAuthInit` check to prevent redirect during initialization
- Added debug logging for production diagnostics
- Improved 401 handling to prevent redirect loops

## ⚠️ CRITICAL: Backend Configuration Required

The frontend fixes alone won't solve the issue. Your backend MUST be configured correctly:

### Required Backend Changes

#### 1. CORS Configuration
```javascript
// Express.js example
app.use(cors({
  origin: 'https://your-frontend-domain.vercel.app', // Your actual frontend URL
  credentials: true, // REQUIRED: Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Establishment-Id'],
}));
```

#### 2. Cookie Configuration (CRITICAL)
When setting the HttpOnly cookie during login, you MUST use these options:

```javascript
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: true,        // REQUIRED for HTTPS in production
  sameSite: 'none',    // REQUIRED for cross-origin cookies
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  // domain: '.railway.app' // Optional: only if needed
});
```

**Important settings:**
- `secure: true` - Cookie only sent over HTTPS
- `sameSite: 'none'` - Required for cross-origin requests (must be used with `secure: true`)
- DO NOT set `domain` unless you know what you're doing

#### 3. Login Response
Ensure your login endpoint returns the account data even when using HttpOnly cookies:

```javascript
// Login endpoint
app.post('/api/accounts/login', async (req, res) => {
  // ... validate credentials ...
  
  // Set HttpOnly cookie
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
  });
  
  // Return account data (frontend stores this in localStorage)
  res.json({
    success: true,
    account: userAccount,
    establishments: userEstablishments
  });
});
```

## How to Debug

### 1. Browser DevTools
1. Open your production site
2. Open DevTools → Application → Cookies
3. Check if the `accessToken` cookie is set after login
4. Look at the cookie properties:
   - Should show `HttpOnly`, `Secure`, `SameSite=None`

### 2. Network Tab
1. Login to your app
2. Check the login response headers:
   - Look for `Set-Cookie` header in the Response Headers
3. Check subsequent API requests:
   - Look for `Cookie` header in the Request Headers

### 3. Console Logs
The updated frontend now logs:
```
[API] Production mode - API Base URL: https://...
[API] withCredentials enabled for cross-origin cookie support
[Auth] Session invalid or expired, clearing local state
```

## Quick Checklist

- [ ] Backend CORS allows your frontend origin with `credentials: true`
- [ ] Backend sets cookie with `sameSite: 'none'` and `secure: true`
- [ ] Frontend API calls use `withCredentials: true` (already configured)
- [ ] Both frontend and backend use HTTPS in production
- [ ] Frontend URL is exactly what's configured in CORS (no trailing slash)

## Testing Locally

To test cross-origin locally:
1. Run backend on `http://localhost:3000`
2. Run frontend on `http://localhost:5173` (different port = cross-origin)
3. Temporarily change backend cookie settings for local testing:
   ```javascript
   sameSite: 'none',  // For cross-origin testing
   secure: false,     // For HTTP local testing (browsers may warn)
   ```

## Alternative Solution (If cookies can't be fixed)

If you can't modify the backend, consider switching to **token-based auth**:
1. Store JWT in localStorage (less secure, but works cross-origin)
2. Send token in Authorization header instead of cookies
3. This requires significant backend changes

---

## Next Steps

1. ✅ Frontend fixes are applied - build and deploy
2. ⏳ Update backend cookie settings (see above)
3. ⏳ Test login in production
4. ⏳ Verify cookies are sent with API requests

If you need help with the backend configuration, please share:
- Backend framework (Express.js, Fastify, etc.)
- Current cookie configuration code
- Current CORS configuration
