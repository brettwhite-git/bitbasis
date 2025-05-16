# Cloudflare Deployment & Security Checklist for BitBasis

## Pre-Deployment Preparation
- [ ] Run and fix all linter warnings/errors in Next.js codebase
- [ ] Verify all environment variables are properly defined in Cloudflare Pages
- [ ] Create a `.env.example` file with placeholders for required variables (including Supabase credentials)
- [ ] Remove any debug/console logs from production code
- [ ] Run Lighthouse test locally and address critical issues
- [ ] Ensure all Bitcoin price API endpoints are properly configured and rate-limited

## Cloudflare Pages Configuration
- [ ] Create a new Cloudflare Pages project and connect to Git repository
- [ ] Configure build settings: Framework preset = Next.js, Build command = `npm run build`
- [ ] Set up custom domain (bitbasis.domain.com) and verify DNS configuration
- [ ] Configure environment variables for both production and preview environments
- [ ] Set up branch deployments (Preview/Production)
- [ ] Configure appropriate build cache settings for Next.js
- [ ] Set up continuous deployment from main/master branch

## Security Measures
- [ ] Enable Cloudflare WAF (Web Application Firewall) with appropriate rule sets
- [ ] Configure Cloudflare Bot Management to protect against automated attacks
- [ ] Set up appropriate CORS headers for Supabase API connections
- [ ] Implement rate limiting for API routes via Cloudflare Rate Limiting service
- [ ] Add security headers (CSP, HSTS, X-Frame-Options) in Cloudflare Page Rules
- [ ] Enable HTTPS and enforce SSL using Cloudflare's SSL/TLS settings
- [ ] Configure Cloudflare Access for preview deployments protection
- [ ] Set up Cloudflare Page Shield to detect malicious JavaScript
- [ ] Enable Browser Integrity Check to block suspicious requests

## Budget Management
- [ ] Monitor Workers/Pages usage in Cloudflare dashboard
- [ ] Set up billing alerts in Cloudflare account
- [ ] Configure usage notifications for approaching limits
- [ ] Optimize image usage with Cloudflare Images service
- [ ] Implement appropriate caching strategies for static assets
- [ ] Consider using Cloudflare Workers for cost-effective API endpoints
- [ ] Evaluate Cloudflare R2 for storage needs (if applicable for CSV storage)

## Monitoring & Analytics
- [ ] Enable Cloudflare Web Analytics
- [ ] Set up health checks for API endpoints
- [ ] Configure error alerting through Cloudflare Notifications
- [ ] Enable Cloudflare Logs for detailed request analysis
- [ ] Set up LogPush to external monitoring service (if needed)
- [ ] Configure dashboard for Bitcoin portfolio application metrics

## BitBasis Specific Configurations
- [ ] Ensure Supabase connection works correctly through Cloudflare
- [ ] Test Bitcoin price API endpoints from Coinpaprika through Cloudflare
- [ ] Verify Fear & Greed Index API connections
- [ ] Test CSV upload functionality through Cloudflare's infrastructure
- [ ] Validate all portfolio calculations with production data
- [ ] Test dark mode with Bitcoin theme colors render correctly

## Post-Deployment Verification
- [ ] Verify all API endpoints work correctly
- [ ] Test authentication flows with Supabase Auth
- [ ] Validate database connections and RLS policies
- [ ] Run Lighthouse test on production deployment
- [ ] Test on multiple browsers and devices
- [ ] Verify responsive design for mobile users
- [ ] Test large CSV file uploads (up to 10MB per file)

## Ongoing Maintenance
- [ ] Schedule regular security audits
- [ ] Review performance metrics weekly
- [ ] Monitor and optimize Cloudflare Workers usage
- [ ] Stay updated on Cloudflare feature releases
- [ ] Regularly review access permissions
- [ ] Monitor Bitcoin price API rate limits

## Additional Security Tips
- [ ] Implement progressive rate limiting for login/auth endpoints
- [ ] Use Cloudflare Workers for request filtering and authentication
- [ ] Configure IP blocking rules for suspicious activity
- [ ] Set appropriate cache-control headers for all routes
- [ ] Enable Cloudflare's Advanced DDoS protection
- [ ] Consider implementing Cloudflare Tunnel for secure Supabase connections
