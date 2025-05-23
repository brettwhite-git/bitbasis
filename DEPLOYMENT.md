# BitBasis Deployment Guide

## Staging Environment Setup

### Prerequisites
- [ ] GitHub repository with your code
- [ ] Supabase remote project (you have: `npcvbxrshuflujcnikon`)
- [ ] Cloudflare Turnstile account (for production CAPTCHA)

## Option 1: Vercel (Recommended)

### 1. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your BitBasis repository
5. Vercel auto-detects Next.js settings

### 2. Configure Environment Variables
In Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Production Supabase
NEXT_PUBLIC_SUPABASE_URL=https://npcvbxrshuflujcnikon.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# Production Turnstile (get from Cloudflare)
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=your-production-site-key
CLOUDFLARE_TURNSTILE_SECRET_KEY=your-production-secret-key

# Database access (for migrations)
SUPABASE_DB_PASSWORD=your-remote-db-password
```

### 3. Set Domain Restrictions
- In Supabase: Add your Vercel domain to allowed origins
- In Turnstile: Add your Vercel domain to allowed domains

## Option 2: Railway (Alternative)

### 1. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Railway auto-deploys

### 2. Environment Setup
Same environment variables as Vercel option

## Option 3: Netlify (Alternative)

### 1. Deploy to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Build settings: `npm run build`
4. Publish directory: `.next`

## Production Environment Variables

### Get Your Production Keys

#### Supabase Production Keys
```bash
# Get from your Supabase dashboard
# Project: npcvbxrshuflujcnikon
NEXT_PUBLIC_SUPABASE_URL=https://npcvbxrshuflujcnikon.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Cloudflare Turnstile Production Keys
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Turnstile tab
3. Create new site widget
4. Add your production domain
5. Copy site key and secret key

### Update Auth Callback URLs
In Supabase → Authentication → URL Configuration:
```bash
Site URL: https://your-app.vercel.app
Additional Redirect URLs: https://your-app.vercel.app/auth/callback
```

## Database Migration to Production

### Push Local Changes to Remote
```bash
# Link to remote (if not already)
export SUPABASE_DB_PASSWORD=your-password
supabase link --project-ref npcvbxrshuflujcnikon

# Push all migrations
supabase db push

# Verify migration status
supabase migration list --linked
```

## Staging Workflow

### Branch-based Staging
1. **Main branch** → Production deployment
2. **Staging branch** → Preview deployment
3. **Feature branches** → Preview deployments

### Vercel Preview Deployments
- Every PR gets a unique preview URL
- Perfect for testing before merging
- Automatic cleanup after PR merge

## Testing Production

### Checklist
- [ ] Authentication flow works
- [ ] Magic links redirect correctly
- [ ] CAPTCHA loads and validates
- [ ] Database queries work
- [ ] Portfolio calculations load
- [ ] CSV upload functionality
- [ ] Email notifications (if implemented)

### Debug Production Issues
```bash
# Check Vercel logs
vercel logs your-deployment-url

# Check Supabase logs
# Go to Supabase Dashboard → Logs
```

## Security Considerations

### Environment Variables
- ✅ Never commit `.env.local` to git
- ✅ Use different keys for staging vs production
- ✅ Restrict Turnstile and Supabase to specific domains
- ✅ Use Vercel's environment variable encryption

### Database Security
- ✅ Row Level Security (RLS) enabled
- ✅ API keys have minimal required permissions
- ✅ Regular backups configured

## Performance Optimization

### Vercel Specific
- Enable Edge Runtime for auth pages
- Configure caching headers
- Optimize images with `next/image`
- Use Vercel Analytics

### General Optimizations
- Enable gzip compression
- Minify CSS/JS (automatic in production)
- Database connection pooling
- CDN for static assets

## Monitoring

### Error Tracking
- Vercel automatically captures errors
- Supabase provides database logs
- Consider adding Sentry for detailed error tracking

### Performance Monitoring
- Vercel Speed Insights (free)
- Core Web Vitals monitoring
- Database query performance in Supabase

## Cost Considerations

### Free Tiers
- **Vercel**: 100GB bandwidth, unlimited deployments
- **Supabase**: 500MB database, 2GB bandwidth
- **Cloudflare**: 1M Turnstile requests/month

### Scaling
- Monitor usage in dashboards
- Set up billing alerts
- Plan for upgrade timing

## Next Steps After Deployment

1. **Custom Domain**: Add your own domain
2. **SSL Certificate**: Automatic with Vercel
3. **Analytics**: Add tracking
4. **Monitoring**: Set up alerts
5. **Backup Strategy**: Regular database backups
6. **CI/CD**: Automated testing pipeline 