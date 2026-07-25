# 🚀 Vercel Deploy - One Click Live

Your OpenSolar clone is ready for production deploy to Vercel Mumbai (bom1) region for Jaipur low latency.

### Option 1: Vercel Dashboard (Recommended)

1. Push to GitHub
```bash
cd /home/user/solar-pro
git init
git add .
git commit -m "SolarDesign Pro - OpenSolar Clone"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/solar-pro.git
git push -u origin main
```

2. Vercel.com -> Add New Project -> Import your GitHub repo
3. Framework: Next.js (auto detected)
4. Env Variables - add:
```
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_SOLAR_API_KEY=your-google-key (optional, mocked if empty)
```
5. Region: Mumbai (bom1) for Jaipur best speed
6. Deploy -> Live URL: https://your-project.vercel.app

### Option 2: Vercel CLI - One Click

```bash
npm i -g vercel
cd /home/user/solar-pro
vercel --prod
# Follow prompts, add env vars when asked
```

### Supabase Setup (2 mins)

1. supabase.com -> New Project -> Region Mumbai
2. SQL Editor -> Paste `supabase-schema.sql` -> Run
3. Updated `supabase-schema.sql` now includes team tables + RLS
4. Authentication -> Enable Email + Google OAuth
   - For Google OAuth: https://console.cloud.google.com -> OAuth Consent -> Add authorized redirect: https://YOUR_PROJECT.supabase.co/auth/v1/callback
   - Copy Client ID/Secret to Supabase Auth settings
5. Settings -> API -> Copy URL and anon key to Vercel env

### Google Solar API (Optional but recommended)

1. console.cloud.google.com -> Enable Solar API
2. API & Services -> Credentials -> Create API Key
3. Restrict key to Solar API + Maps
4. Add to Vercel env as GOOGLE_SOLAR_API_KEY
5. Without key, app uses mocked Jaipur data (works but not real shade)

### Post-Deploy Checklist

- [ ] Test /auth login
- [ ] Create lead -> Draw roof -> Auto panels -> 3D -> Shade Heatmap toggle
- [ ] Proposal PDF print
- [ ] Team invite flow in /team
- [ ] Check Supabase tables have rows

### Cost

- Vercel Hobby: Free
- Supabase Free: 500MB, 50k rows, Auth free
- Google Solar API: $0.01-0.05 per request, $200 free monthly credit (covers ~2000 designs for Jaipur)

Done! Your app is now like OpenSolar 3.0 but hosted in India.

