# ThreadFlowPro - Vercel Deployment Guide

This guide provides detailed, step-by-step instructions for deploying ThreadFlowPro to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- Your ThreadFlowPro codebase in a Git repository (GitHub, GitLab, or Bitbucket)
- [Node.js](https://nodejs.org/) (v18 or later) installed on your local machine

## Local Preparation

Before deploying to Vercel, make sure your application is properly configured:

1. **Test the Vercel build locally**:
   ```powershell
   npm run test:vercel
   ```

   This script creates a test build to verify that your application can be successfully deployed to Vercel.

2. **Verify API endpoints**:
   All API endpoints should use the Vercel adapter pattern:
   ```typescript
   import { createVercelHandler } from './vercel-adapter';
   
   export default createVercelHandler((req, res) => {
     // Your API logic here
   });
   ```

## Deployment Steps

### 1. Connect Your Repository to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Select ThreadFlowPro project

### 2. Configure Build Settings

In the Vercel deployment configuration screen:

1. **Framework Preset**: Select "Other"
2. **Build Command**: `npm run build:vercel`
3. **Output Directory**: `dist/public`
4. **Install Command**: `npm install`

### 3. Environment Variables

Add the following environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `NODE_ENV` | `production` | Set environment to production |
| `VERCEL` | `1` | Indicates Vercel deployment |

Also add any other environment variables your application needs, such as:
- Database connection strings
- API keys
- Authentication secrets

### 4. Deploy

Click the "Deploy" button and wait for the build to complete.

## After Deployment

### Testing Your Deployment

1. **Check main application**:
   Visit your Vercel deployment URL to verify the frontend is working correctly.

2. **Test API endpoints**:
   Make requests to `/api/health` and other endpoints to verify they're working.

### Setting Up a Custom Domain

1. In Vercel dashboard, go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Follow Vercel's instructions for DNS configuration

### Monitoring and Logs

1. In the Vercel dashboard, go to your project
2. Click "Deployments" to see all deployments
3. Select a deployment to view build logs
4. Click "Functions" to see serverless function metrics

## Troubleshooting

### Common Issues

1. **Build failures**:
   - Check the build logs in Vercel
   - Verify that your `vercel.json` and `vercel-build.ps1` files are correct
   - Test locally with `npm run test:vercel`

2. **API routes not working**:
   - Ensure all API files use the Vercel adapter pattern
   - Check that routes are correctly defined in `vercel.json`

3. **Environment variables issues**:
   - Verify environment variables are set in Vercel dashboard
   - Check your code isn't relying on variables not available in Vercel

4. **Static assets not loading**:
   - Verify assets are being correctly included in the build
   - Check the path references in your HTML/CSS/JS

## Next Steps

After successful deployment:

1. **Set up CI/CD**: Configure automatic deployments when you push to your repository
2. **Add monitoring**: Set up error tracking and performance monitoring
3. **Configure scaling**: Adjust Vercel's serverless function settings as needed for your workload

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/cli) for advanced deployment scenarios
- [Vercel Edge Functions](https://vercel.com/features/edge-functions) for global deployment options 