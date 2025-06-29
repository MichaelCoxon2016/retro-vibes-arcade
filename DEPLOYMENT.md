# Deployment Guide for Retro Vibes Arcade

## Prerequisites
- GitHub repository set up
- Vercel account (free tier works)
- Supabase project configured

## Environment Variables

Add these environment variables in Vercel (Settings → Environment Variables):

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-ref.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | Your Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | `https://retro-vibes-arcade.vercel.app` | Your production URL |
| `NEXT_PUBLIC_APP_NAME` | `Vibe Arcade` | App name for branding |

## Deployment Steps

### 1. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
5. Add the environment variables above
6. Click "Deploy"

### 2. Configure Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update environment variables:
   - Change `NEXT_PUBLIC_APP_URL` to your custom domain

### 3. Update Supabase

After deployment, update your Supabase project:

1. Go to Authentication → URL Configuration
2. Update **Site URL** to your production URL
3. Add your production URL to **Redirect URLs**:
   - `https://retro-vibes-arcade.vercel.app/*`
   - Or your custom domain if using one

### 4. Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test user login
- [ ] Test password reset flow
- [ ] Test Snake game functionality
- [ ] Check console for any errors
- [ ] Verify environment variables are loaded

## Troubleshooting

### Authentication Not Working
- Verify Supabase URLs are added to redirect URLs
- Check that environment variables are set correctly
- Ensure Site URL is set to your production domain

### Games Not Loading
- Check browser console for errors
- Verify all environment variables are present
- Clear browser cache and cookies

### Database Errors
- Ensure Supabase project is not paused
- Verify database migrations ran successfully
- Check RLS policies are enabled

## Monitoring

### Vercel Analytics
- Enable Web Analytics in Vercel project settings
- Monitor performance and user metrics

### Error Tracking
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for user behavior

## Security Considerations

1. **Never expose**:
   - Supabase service role key
   - Database passwords
   - Any secret keys

2. **Always use**:
   - HTTPS in production
   - Environment variables for sensitive data
   - Row Level Security in Supabase

## Updating the App

1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub
4. Vercel automatically deploys from main branch

To deploy from a different branch:
1. Change production branch in Vercel settings
2. Or use preview deployments for testing