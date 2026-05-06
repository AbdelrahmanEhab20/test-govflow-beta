# GovFlow Deployment Checklist

**Quick reference checklist for implementing GovFlow at a new organization.**

---

## Pre-Deployment (Week -2 to -1)

### Our Team Preparation
- [ ] Code review completed
- [ ] All dependencies updated
- [ ] Security audit passed
- [ ] Deployment scripts tested
- [ ] Support team briefed
- [ ] Escalation contacts defined
- [ ] Documentation prepared
- [ ] Training materials ready

### Client Preparation
- [ ] Signed implementation agreement
- [ ] Infrastructure allocated
- [ ] VPN access provided to our team
- [ ] SSH keys generated for servers
- [ ] OAuth apps created (Azure AD, Google)
- [ ] Email service account created (SendGrid/Resend)
- [ ] Database credentials generated
- [ ] Domain registered and DNS configured
- [ ] SSL certificate obtained (or Let's Encrypt ready)
- [ ] User list prepared
- [ ] Organizational structure defined
- [ ] Branding assets provided (logo, colors)

---

## Phase 1: Infrastructure Setup (Days 1-3)

### Networking
- [ ] VPC/VNet created
- [ ] Subnets configured (public, private, data)
- [ ] Security groups/NACLs defined
- [ ] Load balancer configured (if needed)
- [ ] VPN working for team access
- [ ] DNS zones configured

### Monitoring & Logging
- [ ] CloudWatch/Stackdriver configured
- [ ] Log aggregation service set up
- [ ] Alert rules configured (CPU, disk, errors)
- [ ] APM tool installed (optional)
- [ ] Dashboards created

### Backup & Disaster Recovery
- [ ] Backup storage provisioned
- [ ] Backup policies defined
- [ ] RTO/RPO targets documented
- [ ] Recovery procedures tested

### SSL/TLS
- [ ] Domain ownership verified
- [ ] SSL certificate installed
- [ ] Certificate auto-renewal configured
- [ ] HTTPS tested and working

**Sign-off:** Infrastructure Ready _____ Date: _____

---

## Phase 2: Database Setup (Days 2-4)

### Database Installation
- [ ] MongoDB 6.0+ installed
- [ ] Replication configured (if applicable)
- [ ] Authentication enabled
- [ ] Initial admin user created
- [ ] Connection pooling configured
- [ ] Backups scheduled

### Database Configuration
- [ ] Database created: `govflow_prod`
- [ ] App database user created with correct permissions
- [ ] Connection string tested
- [ ] Indexes created
- [ ] Query optimization verified

### Backup Testing
- [ ] First backup completed successfully
- [ ] Restore procedure tested
- [ ] Backup storage location verified
- [ ] Retention policy implemented

**Database Connection String:** ________________________________

**Backup Location:** ________________________________

**Sign-off:** Database Ready _____ Date: _____

---

## Phase 3: Backend Deployment (Days 4-6)

### Code Deployment
- [ ] Repository cloned
- [ ] Branch: `main` checked out
- [ ] `npm install` completed
- [ ] `npm run build` (if applicable) completed
- [ ] Environment variables configured in `.env`

### Environment Configuration
```
Essential variables configured:
□ PORT=5000
□ NODE_ENV=production
□ MONGO_URI=<valid connection string>
□ JWT_SECRET=<strong random secret>
□ SESSION_SECRET=<strong random secret>
□ APP_URL=https://api.yourdomain.com
□ FRONTEND_URL=https://app.yourdomain.com
□ CORS_ORIGINS=https://app.yourdomain.com
□ EMAIL_FROM=GovFlow <noreply@yourdomain.com>
□ BRAND_APP_NAME=<Organization Name>
```

### Backend Service Setup
- [ ] Systemd service file created
- [ ] Service enabled and started
- [ ] Health check: `GET /health` returns 200
- [ ] Logs monitored for errors
- [ ] Process stays running after restart
- [ ] Load balancer health check passing

### Verify Backend
```bash
curl http://localhost:5000/health
# Expected: {"status":"ok","mongodb":"connected"}
```

**Backend URL:** https://api.yourdomain.com

**Sign-off:** Backend Running _____ Date: _____

---

## Phase 4: OAuth Configuration (Days 5-7)

### Microsoft OAuth (Outlook)
- [ ] Azure AD application registered
- [ ] Tenant ID obtained
- [ ] Client ID obtained
- [ ] Client Secret generated
- [ ] Redirect URI configured: `https://api.yourdomain.com/auth/microsoft/callback`
- [ ] API permissions added (Mail.Read, Mail.Send, User.Read, Contacts.Read)
- [ ] Backend env vars configured
- [ ] Test login working

**MICROSOFT_CLIENT_ID:** ________________________________
**MICROSOFT_TENANT:** ________________________________

### Google OAuth (Gmail)
- [ ] Google Cloud project created
- [ ] Gmail API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URI configured: `https://api.yourdomain.com/auth/google/callback`
- [ ] Scopes configured (gmail.readonly, email, profile)
- [ ] Backend env vars configured
- [ ] Test login working

**GOOGLE_CLIENT_ID:** ________________________________

### Email Service (SendGrid or Resend)
- [ ] Account created
- [ ] API key generated
- [ ] Domain verified
- [ ] Test email sent successfully
- [ ] Backend env vars configured

**Email Service:** ☐ SendGrid ☐ Resend
**EMAIL_FROM:** ________________________________

**Sign-off:** OAuth & Email Configured _____ Date: _____

---

## Phase 5: Frontend Deployment (Days 6-8)

### Frontend Build
- [ ] Repository cloned: `gov-flow-ui-files-ref`
- [ ] Branch: `main` checked out
- [ ] `npm install` completed
- [ ] `.env` created with production variables:
  ```
  VITE_API_BASE_URL=https://api.yourdomain.com
  VITE_USE_NODE_BACKEND=true
  ```
- [ ] `npm run build` completed successfully
- [ ] `dist/` directory created with optimized files

### Frontend Deployment
**Option A: AWS CloudFront**
- [ ] S3 bucket created: `govflow-frontend-prod`
- [ ] Build files uploaded to S3
- [ ] CloudFront distribution created
- [ ] SSL certificate attached
- [ ] Custom domain configured
- [ ] Cache invalidation working

**Option B: Nginx**
- [ ] Nginx installed and configured
- [ ] SSL certificate configured
- [ ] Security headers added
- [ ] Gzip compression enabled
- [ ] Service running and enabled

**Option C: Docker**
- [ ] Dockerfile created
- [ ] Image built successfully
- [ ] Container running on port 80/443
- [ ] Mapped to host successfully

### Frontend Verification
- [ ] Frontend loads: https://app.yourdomain.com
- [ ] API connectivity: Can call `/health`
- [ ] CSS/JS/Assets load with correct cache headers
- [ ] SPA routing working (can navigate pages)
- [ ] No console errors in browser

**Frontend URL:** https://app.yourdomain.com

**Sign-off:** Frontend Running _____ Date: _____

---

## Phase 6: Initial Configuration (Days 7-9)

### Database Initialization
- [ ] Collections created with `npm run db:migrate`
- [ ] Indexes created successfully
- [ ] Initial data seeded (optional): `npm run seed`
- [ ] Database collections verified:
  ```
  □ users
  □ departments
  □ tasks
  □ workflow_stages
  □ notifications
  ```

### Branding Configuration
- [ ] Logo URL configured: ________________________________
- [ ] Primary color set: ________________________________
- [ ] Secondary color set: ________________________________
- [ ] Accent color set: ________________________________
- [ ] App name configured: ________________________________
- [ ] Tagline configured: ________________________________
- [ ] Support email configured: ________________________________

### Initial Admin User
- [ ] First admin user created
- [ ] Test login successful
- [ ] Admin dashboard accessible
- [ ] User management page working

**Admin Account Email:** ________________________________

### Organizational Structure
- [ ] Departments created/imported
- [ ] Team members provisioned
- [ ] Roles assigned
- [ ] Permission matrix configured
- [ ] Initial workflow stages set

**Sign-off:** Configuration Complete _____ Date: _____

---

## Phase 7: Integration Testing (Days 8-10)

### API Testing
- [ ] GET /health returns 200
- [ ] POST /auth/dev-login working
- [ ] GET /auth/me returns current user
- [ ] PATCH /auth/me (profile update) working
- [ ] GET /tasks returns task list
- [ ] POST /tasks creates task
- [ ] GET /users returns user list

### OAuth Flow Testing
- [ ] Microsoft OAuth login successful
- [ ] Google OAuth login successful
- [ ] Logout working correctly
- [ ] Session persists on page refresh
- [ ] OAuth tokens stored securely

### Email Integration Testing
- [ ] User invitation email sent
- [ ] Password reset email sent
- [ ] Task assignment notification sent
- [ ] Email templates rendering correctly
- [ ] Sender address correct

### Frontend Feature Testing
- [ ] Login page loads
- [ ] Dashboard displays
- [ ] Task list shows tasks
- [ ] Can create a task
- [ ] Task detail page opens
- [ ] Notifications display
- [ ] User settings accessible
- [ ] Dark mode toggle works (if applicable)

### Cross-Browser Testing
- [ ] Chrome latest ✓
- [ ] Firefox latest ✓
- [ ] Safari latest ✓
- [ ] Edge latest ✓

### Mobile Testing
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Mobile navigation works

**Sign-off:** Integration Testing Passed _____ Date: _____

---

## Phase 8: Performance & Security Testing (Days 9-11)

### Performance Testing
- [ ] API response time < 500ms (p95)
- [ ] Database query time < 100ms (p95)
- [ ] Page load time < 3 seconds
- [ ] Repeat loads < 500ms (caching working)
- [ ] Can handle 100 concurrent users

**Performance Benchmark Results:**
- API Response Time (p95): ________ ms
- DB Query Time (p95): ________ ms
- Page Load Time: ________ seconds

### Security Testing
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] CORS properly configured
- [ ] No sensitive data in logs
- [ ] API rate limiting working
- [ ] Authentication working
- [ ] Authorization enforced
- [ ] SSL certificate valid
- [ ] No mixed content warnings

### Backup & Recovery Testing
- [ ] Manual backup completed
- [ ] Restore from backup tested
- [ ] Data integrity verified after restore
- [ ] Recovery time acceptable

**Sign-off:** Performance & Security Approved _____ Date: _____

---

## Phase 9: User Acceptance Testing (Days 10-12)

### UAT Execution
- [ ] UAT test plan created
- [ ] UAT test cases developed
- [ ] UAT environment ready
- [ ] Pilot user group ready (5-10 users)
- [ ] Test scenarios executed
- [ ] Feedback collected

### UAT Test Scenarios
- [ ] User registration and login
- [ ] Task creation and assignment
- [ ] Task status changes through workflow
- [ ] Approval workflows
- [ ] Email notifications
- [ ] Email synchronization
- [ ] Reporting and analytics
- [ ] Role-based access control
- [ ] Department management
- [ ] Search functionality
- [ ] Export functionality

### UAT Results
- [ ] Test cases passed: ____ / ____ (____%)
- [ ] Critical issues: ____
- [ ] High priority issues: ____
- [ ] Medium priority issues: ____
- [ ] Low priority issues: ____
- [ ] UAT sign-off obtained: ☐ Yes

**UAT Sign-off Date:** ________________

**Sign-off:** UAT Complete _____ Date: _____

---

## Phase 10: Pre-Go-Live (Days 12-13)

### 72 Hours Before Go-Live
- [ ] Infrastructure all-green
- [ ] All endpoints verified working
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Backup verified working
- [ ] Support team online
- [ ] Communication sent to users
- [ ] Monitoring active

### 24 Hours Before Go-Live
- [ ] Final full backup completed
- [ ] DNS records ready to switch (not yet)
- [ ] SSL certificates valid (renewal check)
- [ ] All services running
- [ ] Error logs clean
- [ ] Database health check passed
- [ ] Team in war room
- [ ] Rollback procedure reviewed

### 1 Hour Before Go-Live
- [ ] War room with stakeholders active
- [ ] Monitoring dashboard open and visible
- [ ] Rollback procedure printed/ready
- [ ] Support team standby list confirmed
- [ ] Client stakeholders notified
- [ ] Go/No-Go decision made: ☐ GO ☐ NO-GO

**Go/No-Go Decision:** ☐ GO ☐ NO-GO

**Authorization:** ________________ Date: __________

**Sign-off:** Ready for Go-Live _____ Date: _____

---

## Phase 11: Go-Live Execution (Day 14)

### Go-Live Steps (Execute in Order)

1. **Enable DNS (10 minutes)**
   - [ ] DNS records updated
   - [ ] DNS propagation verified
   - [ ] API responding at production domain
   - [ ] Frontend responding at production domain

2. **Activate Features (10 minutes)**
   - [ ] OAuth enabled
   - [ ] Email sending enabled
   - [ ] User provisioning enabled
   - [ ] Notifications enabled

3. **Migrate Initial Data (30 minutes)**
   - [ ] User list imported
   - [ ] Departments created
   - [ ] Initial workflow stages configured
   - [ ] Pilot users activated

4. **Monitor System (Ongoing)**
   - [ ] Error logs monitored
   - [ ] User logins tracked
   - [ ] API response times monitored
   - [ ] Database performance monitored
   - [ ] Support tickets created for issues

### Go-Live Monitoring
- [ ] First user login successful
- [ ] No error spike in logs
- [ ] API performance stable
- [ ] Database performance stable
- [ ] Email sending working
- [ ] Notifications working

**Go-Live Completion Time:** ________

**First User Login Time:** ________

**Go-Live Status:** ☐ Successful ☐ Issues Encountered

**Sign-off:** Go-Live Complete _____ Date: _____

---

## Phase 12: Post-Go-Live (Week 2-4)

### First Week Monitoring
- [ ] 24/7 on-call coverage active
- [ ] Daily performance reports
- [ ] Daily error log review
- [ ] Daily stand-ups
- [ ] User feedback collected
- [ ] Bug triage and hotfixes applied
- [ ] No critical issues unresolved

### First Month Optimization
- [ ] Weekly performance reports
- [ ] Database query optimization
- [ ] Cache tuning completed
- [ ] User adoption metrics tracked
- [ ] Feedback incorporated
- [ ] Process refinements made
- [ ] Training completion tracked

### SLA Verification
- [ ] Critical issue response time: ___ minutes (Target: 15)
- [ ] High issue response time: ___ hours (Target: 1)
- [ ] System uptime: ___% (Target: 99.5%)
- [ ] User satisfaction: ___/10 (Target: 8+)

**Sign-off:** Post-Go-Live Complete _____ Date: _____

---

## Common Issues & Quick Fixes

### Issue: CORS Errors
**Symptoms:** Frontend can't reach API
**Fix:** Check `CORS_ORIGINS` env var matches frontend domain
```bash
CORS_ORIGINS=https://app.yourdomain.com
# Restart backend: systemctl restart govflow-backend
```

### Issue: OAuth Not Working
**Symptoms:** OAuth login fails
**Fix:** Verify OAuth credentials in `.env` and redirect URIs in OAuth provider settings
```
MICROSOFT_CLIENT_ID=xxx (check Azure Portal)
MICROSOFT_CLIENT_SECRET=xxx (regenerate if needed)
Redirect URI must match exactly
```

### Issue: Email Not Sending
**Symptoms:** Invitations/password resets not received
**Fix:** Check email service API key and domain verification
- SendGrid: Verify sender domain in Settings
- Resend: Verify domain in Domains section

### Issue: Database Connection Error
**Symptoms:** Backend won't start, "MongoDB connection error"
**Fix:** Verify MongoDB is running and connection string is correct
```bash
# Test connection
mongodb+srv://user:pass@cluster.mongodb.net/govflow_prod
# Verify password doesn't have special chars (URL encode if needed)
```

### Issue: Slow Performance
**Symptoms:** API responses > 2 seconds
**Fix:** Check database indexes and add read replicas if needed
```bash
mongo govflow_prod
> db.tasks.find().explain("executionStats")
# Check if COLLSCAN or using index
```

---

## Sign-Off & Acceptance

### Client Acceptance
- [ ] All functionality working as specified
- [ ] Performance acceptable
- [ ] Training completed
- [ ] Support process understood
- [ ] Go-live successful

**Client Representative:** _________________ Date: _______

**Title:** _________________________________

### Our Team Acceptance
- [ ] Deployment completed successfully
- [ ] Documentation handed over
- [ ] Support process established
- [ ] Monitoring configured
- [ ] SLA understood

**GovFlow Team Lead:** _________________ Date: _______

### Project Manager Acceptance
- [ ] All deliverables completed
- [ ] No critical open issues
- [ ] Client satisfied
- [ ] System stable
- [ ] Handover complete

**Project Manager:** _________________ Date: _______

---

## Post-Implementation Contacts

### Client Support Contacts
- **Primary Contact:** _________________ Phone: __________
- **Technical Contact:** _________________ Phone: __________
- **Executive Sponsor:** _________________ Phone: __________

### GovFlow Support Team
- **Support Email:** support@govflow.ai
- **On-Call Phone:** +1 (XXX) XXX-XXXX
- **Slack Channel:** #client-name (if applicable)
- **Project Manager:** _________________ 
- **Technical Lead:** _________________
- **Account Manager:** _________________

---

## Documentation Handover

**Provided to Client:**
- [ ] Implementation Guide overview
- [ ] System architecture diagram
- [ ] API documentation
- [ ] Admin user guide
- [ ] Support procedures
- [ ] Emergency contacts
- [ ] Runbook for common tasks
- [ ] Backup/recovery procedures
- [ ] Monitoring dashboard access

**Locations:**
- Documentation Portal: https://docs.govflow.yourdomain.com
- Monitoring Dashboard: https://monitoring.govflow.yourdomain.com
- Support Portal: https://support.govflow.ai

---

## Final Notes

**Project Duration:** __________ weeks
**Total Effort:** __________ hours
**Client Satisfaction:** __________/10
**System Uptime (First Month):** __________% 
**Critical Issues:** __________
**Budget Variance:** __________

**Lessons Learned:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Recommendations for Next Implementation:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Checklist Completed By:** _________________ Date: _______

**Reviewed By:** _________________ Date: _______

---

*This checklist should be printed and kept handy during deployment. Update it as you progress through each phase. Keep a copy for the project file.*
