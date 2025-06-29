# Supabase Setup Guide for Vibe Arcade

## Prerequisites
You need a Supabase account. Sign up at https://supabase.com if you don't have one.

## Step 1: Create a New Supabase Project

1. Go to https://app.supabase.com
2. Click "New project"
3. Fill in:
   - Project name: `vibe-arcade` (or your preferred name)
   - Database password: Choose a strong password (save this!)
   - Region: Choose the closest to you
4. Click "Create new project" and wait for setup to complete

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to Settings → API
2. You'll need:
   - **Project URL**: Something like `https://yourprojectref.supabase.co`
   - **Anon/Public Key**: A long JWT token (safe for client-side)

## Step 3: Update Your .env.local File

Replace the values in your `.env.local` with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Vibe Arcade
```

## Step 4: Set Up Authentication

1. In Supabase dashboard, go to Authentication → Providers
2. Ensure "Email" is enabled
3. Configure email settings:
   - Enable "Confirm email" (recommended)
   - Set up email templates if desired

## Step 5: Create Database Tables

1. Go to SQL Editor in your Supabase dashboard
2. Run the following SQL scripts in order:

### Authentication Schema
```sql
-- This is usually created automatically by Supabase
-- Just verify the auth schema exists
```

### Game Tables
Run the contents of `/supabase/snake-tournament-schema.sql`

### Multiplayer Room Tables
Run the contents of `/supabase/game-rooms-schema-fixed.sql`

## Step 6: Configure Authentication URLs

1. Go to Authentication → URL Configuration
2. Set the **Site URL** to:
   - `https://retro-vibes-arcade.vercel.app`
3. Add to **Redirect URLs**:
   - `http://localhost:3000/*`
   - `http://localhost:3001/*`
   - `http://localhost:3002/*`
   - `https://retro-vibes-arcade.vercel.app/*`

**Note**: The Site URL is used as the default redirect for authentication emails (password reset, magic links, etc.)

## Step 7: Enable Realtime (Optional)

1. Go to Database → Replication
2. Enable replication for tables:
   - `game_rooms`
   - `game_states`
   - `game_events`

## Step 8: Test Your Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Try to sign up at http://localhost:3000/auth/signup

3. Check for any console errors

## Troubleshooting

### Invalid API Key Error
- Double-check that you copied the entire anon key (it's very long)
- Ensure there are no extra spaces or line breaks
- Make sure you're using the anon/public key, not the service key

### 401 Unauthorized Errors
- Check that your Supabase project is active (not paused)
- Verify the project URL is correct
- Ensure RLS policies are properly set up

### Cannot Connect to Database
- Check if your project is paused (free tier pauses after 7 days of inactivity)
- Verify the database password if using direct connections

## Security Notes

- Never commit your `.env.local` file to git
- The anon key is safe for client-side use (it's meant to be public)
- Use Row Level Security (RLS) to protect your data
- Never expose your service role key

## Next Steps

After setup, you should be able to:
1. Create user accounts
2. Log in/out
3. Create game rooms for multiplayer
4. Store high scores

For production deployment, remember to:
- Update redirect URLs in Supabase
- Set up proper email templates
- Configure custom SMTP if needed
- Enable additional security features