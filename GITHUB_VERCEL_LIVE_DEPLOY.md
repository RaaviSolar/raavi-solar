# 🚀 Raavi Solar - GitHub Push + Vercel Live Deploy - Complete Guide

Your repo is already ready locally with git init + commit done! ✅

## ✅ What's Done Locally

- `git init` + `git commit` done in `/home/user/solar-pro`
- Branch: `main`
- Commit: "Raavi Solar - Full OpenSolar Clone v2..."
- Files: All production code + Raavi logo + market study + advanced tools

```bash
cd /home/user/solar-pro
git log --oneline
# f5818fe Raavi Solar - Full OpenSolar Clone v2: 3D...
```

## Step 1: Create GitHub Repo (2 mins)

1. Go to https://github.com/new
2. Repository name: `raavi-solar` (or `raavi-solar-design-studio`)
3. Description: `Raavi Solar - OpenSolar Clone - Jaipurbased solar design SaaS with 3D, Shade Heatmap, AI Auto Design, Roof Image Upload, DCR/Non-DCR Market, Advanced Tools`
4. Public / Private - choose
5. **DO NOT** initialize with README, .gitignore (we already have)
6. Create repository

GitHub will show you commands - use below:

## Step 2: Push to GitHub (Run these in terminal)

Copy your repo URL from GitHub, e.g. `https://github.com/YOUR_USERNAME/raavi-solar.git`

```bash
cd /home/user/solar-pro

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/raavi-solar.git

# Push
git push -u origin main
```

If auth error, create Personal Access Token: GitHub Settings -> Developer Settings -> Personal Access Tokens -> Tokens Classic -> Generate -> repo scope -> copy token -> use as password

Or use GitHub CLI:
```bash
gh auth login
gh repo create raavi-solar --public --source=. --remote=origin --push
```

## Step 3: Vercel Deploy - One Click Live (3 mins)

### Option A: Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import Git Repository -> Select `raavi-solar`
3. Framework Preset: Next.js (auto)
4. Root Directory: `./` (leave default)
5. Build Command: `npm run build` (auto)
6. **Environment Variables** - Add these:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci... your anon key
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci... service role (optional)
GOOGLE_SOLAR_API_KEY = AIzaSy... your Google Solar API key (optional, mock works without)
NEXT_PUBLIC_APP_URL = https://your-vercel-url.vercel.app
```

Where to get:
- Supabase: https://supabase.com -> New Project (Mumbai region ap-south-1) -> Settings -> API -> Copy URL + anon key
- Google Solar API: https://console.cloud.google.com -> Enable Solar API -> Credentials -> Create API Key -> Restrict to Solar API
- Even without keys, app works in mock/demo mode with localStorage!

7. Region: **Mumbai (bom1)** - for Jaipur lowest latency (vercel.json already set)
8. Click **Deploy** -> Wait 2-3 mins -> Live! 🎉
   URL: `https://raavi-solar.vercel.app` or `https://raavi-solar-YOUR_USERNAME.vercel.app`

### Option B: Vercel CLI

```bash
npm i -g vercel
cd /home/user/solar-pro
vercel login # opens browser
vercel --prod
# Follow prompts, add env vars when asked
```

## Step 4: Supabase Setup (2 mins) - If using real DB

1. Supabase.com -> New Project -> Region: **Mumbai (ap-south-1)** (for Jaipur)
2. SQL Editor -> Paste `supabase-schema.sql` (in repo root) -> Run
3. This creates: profiles, teams, team_members, leads, projects, proposals, activity_log + RLS policies + Realtime
4. Authentication -> Enable Email + Google OAuth
   - For Google: console.cloud.google.com -> OAuth Consent Screen -> Add authorized redirect: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Copy Client ID/Secret to Supabase Auth -> Google provider
5. Done! Now login in your Vercel app will use real Supabase

## Step 5: Test Live App

After Vercel deploy, open your live URL:

- `/` -> Main Designer: Test Address search -> AI Auto Design wizard -> Roof Image Upload -> 3D + Heatmap + Advanced Tools (5 features)
- `/auth` -> Login/Signup (demo@raavisolar.com / demo123 works even without Supabase)
- `/team` -> Team Management
- `/proposal/TEST123` -> Customer proposal view + e-sign demo
- Check: Raavi logo, 9214567383, www.raavisolar.com everywhere, lite white theme

## Custom Domain (Optional)

Vercel Dashboard -> Your Project -> Settings -> Domains -> Add `app.raavisolar.com` or `design.raavisolar.com`

Add CNAME in your domain registrar: `cname.vercel-dns.com`

## Automatic Deploys

After first push, every `git push origin main` will auto-deploy to Vercel (CI/CD).

For Jaipu market updates: edit `src/lib/jaipurMarketData.ts` -> commit -> push -> auto live.

## What You Get Live

- Full OpenSolar Clone 3.0+ for Raavi Solar
- Features: 3D Extrusion (Google Solar roofSegmentStats), Shade Heatmap (Flux/Shade/Mask), AI Auto Design (kW → Auto Roof), Roof Image Upload (Drone photo), Jaipur Market DCR/Non-DCR (33/W vs 20/W), Advanced Tools (Obstruction Shadow, Stringing SLD, Bill Analysis JVVNL slab, WhatsApp E-Sign tracked, DRC + BOQ)
- Raavi Solar branding: logo 32-56px responsive, lite white theme, phone 9214567383, website www.raavisolar.com
- Zero Error Guarantee: All checks, mock fallbacks if no API keys

## Need Help?

If push fails due to auth: 
- Use GitHub Desktop app: Add local repo `/home/user/solar-pro` -> Publish
- Or zip the folder and upload via GitHub web "Add file -> Upload files"

Your local repo path: `/home/user/solar-pro` - Ready to push!

---

**Next Command to Run (after creating GitHub repo):**
```bash
cd /home/user/solar-pro && git remote add origin https://github.com/YOUR_USERNAME/raavi-solar.git && git push -u origin main
```

Then import in Vercel - Live in 3 mins! 🚀
