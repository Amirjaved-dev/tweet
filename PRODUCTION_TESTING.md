# ThreadFlowPro Production Testing Guide

After deploying your ThreadFlowPro application to production, it's crucial to thoroughly test all functionality to ensure everything works as expected. This guide will walk you through a comprehensive testing process.

## 1. Basic Connectivity Testing

### 1.1. Website Accessibility

- [ ] Verify the website loads at your domain (https://yourdomain.com)
- [ ] Check that HTTPS is working correctly (look for the lock icon in the browser)
- [ ] Test both www and non-www versions of your domain
- [ ] Verify all static assets (images, CSS, JavaScript) load correctly
- [ ] Check that the site loads properly on mobile devices

### 1.2. Server Health

- [ ] Verify PM2 is running your application: `pm2 status`
- [ ] Check server logs for any errors: `pm2 logs threadflowpro`
- [ ] Verify Nginx is running: `sudo systemctl status nginx`
- [ ] Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- [ ] Monitor server resources: `htop` or `top`

## 2. Authentication Testing

### 2.1. User Registration

- [ ] Test creating a new account
- [ ] Verify email verification process works
- [ ] Test password requirements and validation
- [ ] Check that the welcome email is sent correctly

### 2.2. User Login

- [ ] Test logging in with valid credentials
- [ ] Test login with invalid credentials (should show appropriate error)
- [ ] Test "Forgot Password" functionality
- [ ] Verify "Remember Me" functionality works

### 2.3. Authentication Security

- [ ] Test session timeout
- [ ] Verify CSRF protection
- [ ] Test account lockout after multiple failed login attempts (if implemented)
- [ ] Check secure cookie settings

## 3. Core Functionality Testing

### 3.1. Thread Creation and Management

- [ ] Test creating a new thread
- [ ] Verify thread preview functionality
- [ ] Test editing an existing thread
- [ ] Test deleting a thread
- [ ] Verify thread visibility settings work
- [ ] Test thread search functionality

### 3.2. User Dashboard

- [ ] Verify all dashboard statistics load correctly
- [ ] Test filtering and sorting options
- [ ] Check that user preferences save correctly
- [ ] Verify account settings changes apply properly

### 3.3. API Endpoints

- [ ] Test all public API endpoints for correct responses
- [ ] Verify authenticated API endpoints require valid authentication
- [ ] Check API rate limiting (if implemented)
- [ ] Test error handling for invalid API requests

## 4. Payment System Testing

### 4.1. Subscription Plans

- [ ] Verify all subscription plans are displayed correctly
- [ ] Test plan comparison features
- [ ] Check that plan pricing matches your configured values

### 4.2. Payment Process

- [ ] Test subscription purchase flow
- [ ] Verify Coinbase Commerce integration works
- [ ] Test payment webhook processing
- [ ] Verify subscription activation after payment

### 4.3. Subscription Management

- [ ] Test upgrading a subscription
- [ ] Test downgrading a subscription
- [ ] Verify cancellation process
- [ ] Test subscription renewal process

## 5. Performance Testing

### 5.1. Load Time

- [ ] Measure page load times using browser developer tools
- [ ] Check Time to First Byte (TTFB)
- [ ] Verify static asset caching is working
- [ ] Test performance on different networks (3G, 4G, Wi-Fi)

### 5.2. Concurrency

- [ ] Test multiple simultaneous users (if possible)
- [ ] Check database connection pool performance
- [ ] Monitor server resources during peak usage

## 6. Security Testing

### 6.1. Authentication and Authorization

- [ ] Verify authenticated routes cannot be accessed without login
- [ ] Test role-based access controls
- [ ] Check for proper authorization on API endpoints
- [ ] Verify that user data is properly isolated

### 6.2. Data Protection

- [ ] Verify HTTPS is enforced for all connections
- [ ] Check for proper Content Security Policy headers
- [ ] Test cross-site scripting (XSS) protection
- [ ] Verify sensitive data is not exposed in logs

## 7. Email Functionality

- [ ] Test system-generated emails (welcome, password reset, etc.)
- [ ] Verify email templates render correctly
- [ ] Check that email links work properly
- [ ] Test email deliverability to different providers (Gmail, Outlook, etc.)

## 8. Third-Party Integration Testing

### 8.1. Clerk Authentication

- [ ] Verify Clerk sign-up and sign-in flows
- [ ] Test social login options (if enabled)
- [ ] Check Clerk webhooks are properly processed

### 8.2. Supabase

- [ ] Verify database connections are stable
- [ ] Test data querying performance
- [ ] Check Supabase authentication works properly (if used)

### 8.3. OpenRouter API

- [ ] Test thread generation API calls
- [ ] Verify rate limiting and usage tracking
- [ ] Test fallback model configuration

## 9. Error Handling

- [ ] Test application behavior when database is unavailable
- [ ] Verify proper error messages are shown to users
- [ ] Check that error logging works correctly
- [ ] Test application recovery after errors

## 10. Browser Compatibility

- [ ] Test on Chrome, Firefox, Safari, and Edge
- [ ] Verify mobile browser compatibility (iOS Safari, Chrome for Android)
- [ ] Check accessibility features work across browsers
- [ ] Test different screen sizes and resolutions

## 11. Production Specific Testing

- [ ] Verify environment variables are correctly set
- [ ] Check production-only features work properly
- [ ] Test logging levels and log output
- [ ] Verify analytics tracking (if implemented)

## 12. Backup and Recovery Testing

- [ ] Test database backup procedure
- [ ] Verify backup integrity
- [ ] Test restoration from backup
- [ ] Check automated backup scheduling

## Final Checklist

Before considering your production deployment fully verified, ensure:

- [ ] All critical paths have been tested
- [ ] Payment processing works end-to-end
- [ ] User data is secure and properly stored
- [ ] Performance is acceptable under normal load
- [ ] Error handling gracefully manages failures
- [ ] All third-party integrations function correctly
- [ ] Monitoring systems are capturing expected data

## Reporting and Fixing Issues

If you encounter issues during testing:

1. Document the issue with clear steps to reproduce
2. Check server logs for related errors
3. Isolate whether the issue is specific to production
4. Create a development environment reproduction if possible
5. Fix the issue in development first
6. Test the fix thoroughly before deploying to production
7. Deploy using your established deployment process
8. Verify the fix in production

By systematically working through this testing guide, you'll ensure your ThreadFlowPro application is functioning correctly in production and providing a good experience for your users. 