# Deploying to Vercel

This guide explains how to deploy ThreadFlowPro to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Git repository with your code (GitHub, GitLab, or Bitbucket)

## Deployment Steps

1. **Connect your Git repository to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Select the ThreadFlowPro project

2. **Configure project settings**:
   - Framework Preset: Other
   - Build Command: `npm run build:vercel`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

3. **Set up environment variables**:
   - Add all required environment variables from your `.env` file
   - Make sure to include database connection strings, API keys, etc.
   - At minimum, set `NODE_ENV=production`

4. **Deploy**:
   - Click "Deploy" and wait for the build to complete
   - Vercel will provide you with a URL once deployment is successful

## Troubleshooting

If you encounter issues with your deployment:

1. **Check build logs** in the Vercel dashboard for any errors
2. **Verify environment variables** are correctly set
3. **Test locally** before deploying by running:
   ```bash
   npm run test:vercel
   ```
4. **API routes issues**: Make sure all API routes use the Vercel adapter by importing and using `createVercelHandler` from `server/api/vercel-adapter.ts`

## Windows-Specific Instructions

If you're developing on Windows:

1. **Use PowerShell for local builds**:
   - The build script uses PowerShell instead of bash
   - Make sure PowerShell execution policy allows running scripts:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
   ```

2. **Testing the build**:
   ```powershell
   npm run test:vercel
   ```

3. **If you encounter errors**:
   - Run PowerShell as Administrator if needed
   - Make sure Node.js and npm are properly installed
   - Check that your environment variables are set correctly

## Local Development with Vercel Configuration

To test your Vercel configuration locally:

```bash
# Test the Vercel build process
npm run test:vercel

# Run a local server with the production build
npx serve dist/public
```

## Vercel Project Settings

Key settings in our configuration:

- **vercel.json**: Configures build settings and routing
- **vercel-build.ps1**: Handles the build process for Vercel on Windows
- **API Routes**: Server-side code runs as serverless functions
- **Static Assets**: Served from the `dist/public` directory

Remember to update your API endpoints if your application structure changes.

## Limitations

- Vercel's serverless functions have timeout limits (default is 10 seconds)
- Some server-side features might need adjustments to work in a serverless environment
- WebSocket connections require additional configuration or a different provider 