# GovFlow Implementation Guide

**Complete step-by-step guide for deploying GovFlow to a new organization or government entity.**

---

## Table of Contents

1. [Pre-Implementation Checklist](#pre-implementation-checklist)
2. [Our Team's Responsibilities](#our-teams-responsibilities)
3. [Client's Responsibilities](#clients-responsibilities)
4. [Phase 1: Infrastructure Setup](#phase-1-infrastructure-setup)
5. [Phase 2: Backend Deployment](#phase-2-backend-deployment)
6. [Phase 3: Database Setup](#phase-3-database-setup)
7. [Phase 4: Frontend Deployment](#phase-4-frontend-deployment)
8. [Phase 5: OAuth & Email Integration](#phase-5-oauth--email-integration)
9. [Phase 6: White-labeling & Customization](#phase-6-white-labeling--customization)
10. [Phase 7: Testing & UAT](#phase-7-testing--uat)
11. [Phase 8: Go-Live](#phase-8-go-live)
12. [Post-Implementation Support](#post-implementation-support)

---

## Pre-Implementation Checklist

Before starting deployment, ensure both parties have reviewed and prepared:

### Our Team (GovFlow)
- [ ] Latest source code cloned and reviewed
- [ ] All documentation updated for the current version
- [ ] Deployment checklist prepared
- [ ] Support team briefed and on-call schedule set
- [ ] Access credentials and secrets generated

### Client Organization
- [ ] Budget allocated for infrastructure
- [ ] Executive sponsor identified
- [ ] Implementation lead / technical contact designated
- [ ] Security & compliance team involved
- [ ] Infrastructure team ready
- [ ] IT policies reviewed (CORS, firewall rules, VPN access)

**Deliverable:** Signed Implementation Agreement with timeline and responsibilities

---

## Our Team's Responsibilities

### Pre-Deployment
1. **Architecture Review**
   - Assess client infrastructure (cloud provider, on-premise, hybrid)
   - Recommend deployment topology
   - Identify scalability and HA requirements
   - Document network security requirements

2. **Customization Scoping**
   - Review branding requirements
   - Identify custom integrations needed
   - Assess workflow customizations required
   - Document non-standard requirements

3. **Environment Preparation**
   - Provision development/staging/production environments
   - Configure CI/CD pipelines
   - Set up monitoring and logging infrastructure
   - Prepare rollback procedures

### During Deployment
1. **Technical Setup**
   - Deploy and configure backend services
   - Initialize database and schemas
   - Configure OAuth providers
   - Set up file storage and CDN

2. **Customization Implementation**
   - Apply branding and theming
   - Implement custom business logic
   - Configure integrations
   - Set up API customizations

3. **Quality Assurance**
   - Conduct integration testing
   - Perform security testing
   - Validate performance benchmarks
   - Execute backup/recovery drills

4. **Knowledge Transfer**
   - Provide system documentation
   - Conduct training sessions
   - Create runbooks for common tasks
   - Establish support channels

### Post-Deployment
1. **Monitoring & Optimization**
   - Monitor system performance
   - Optimize database queries
   - Fine-tune caching strategies
   - Adjust resource allocation

2. **Support & Maintenance**
   - Provide 24/7 support (as per SLA)
   - Issue patches and hotfixes
   - Conduct monthly performance reviews
   - Plan for scalability upgrades

---

## Client's Responsibilities

### Pre-Deployment
1. **Infrastructure Provisioning**
   - Allocate servers (cloud or on-premise)
   - Configure networking (VPCs, firewalls, VPNs)
   - Provision SSL/TLS certificates
   - Set up backup and disaster recovery

2. **Access & Permissions**
   - Grant our team appropriate access
   - Configure VPN/bastion host access
   - Set up user accounts for deployment
   - Provide documentation on security policies

3. **Integration Preparation**
   - Configure Microsoft Azure AD / Entra ID (for OAuth)
   - Configure Google Workspace (if using Gmail)
   - Prepare email infrastructure (SMTP, SendGrid/Resend account)
   - Document existing systems to integrate with

4. **Business Requirements**
   - Define organizational structure (departments, roles)
   - Document workflow requirements
   - Prepare user list and role mappings
   - Document reporting requirements

### During Deployment
1. **Testing & Validation**
   - Participate in UAT
   - Validate business processes
   - Test integrations
   - Provide feedback and change requests

2. **Data Preparation**
   - Migrate legacy data (if applicable)
   - Prepare user provisioning data
   - Set up initial organizational structure
   - Create pilot user groups

3. **Change Management**
   - Communicate deployment timeline to organization
   - Prepare user communication plan
   - Identify power users for early adoption
   - Plan for training rollout

### Post-Deployment
1. **Ongoing Operations**
   - Monitor system health
   - Report issues to support team
   - Manage user provisioning/deprovisioning
   - Maintain backup procedures

2. **Optimization**
   - Provide feedback on performance
   - Report bugs and feature requests
   - Participate in monthly reviews
   - Plan for growth

---

## Phase 1: Infrastructure Setup

### 1.1 Cloud vs. On-Premise Decision

**Cloud Deployment (Recommended for most organizations)**
- Faster deployment time
- Automatic scaling and HA built-in
- Lower operational overhead
- Easier backup and disaster recovery

**Supported Cloud Providers:**
- AWS (Recommended)
- Microsoft Azure
- Google Cloud Platform
- Any provider with MongoDB support

**On-Premise Deployment**
- Higher infrastructure costs
- More IT overhead
- Greater control over data
- Longer deployment timeline

### 1.2 Minimum Infrastructure Requirements

#### For Small Organization (< 100 users)

**Backend Server:**
- CPU: 2-4 cores
- RAM: 4-8 GB
- Disk: 50 GB SSD
- OS: Ubuntu 22.04 LTS or similar

**Database Server:**
- CPU: 2 cores
- RAM: 4 GB
- Disk: 100 GB SSD (+ 50% growth buffer)
- Dedicated MongoDB instance or managed service

**Frontend (Static Files):**
- CDN with SSL/TLS
- Geo-distributed for performance
- Storage: 5-10 GB

#### For Medium Organization (100-1000 users)

**Backend Server (Load Balanced):**
- 2-3 instances: 4 cores, 8-16 GB RAM each
- Auto-scaling group
- Load balancer (ALB/NLB)

**Database Cluster:**
- MongoDB Replica Set (3+ nodes)
- 4+ cores, 16+ GB RAM per node
- Disk: 500 GB+ SSD

**Frontend:**
- CDN with multiple edge locations
- Storage: 20-50 GB
- Caching: CloudFront/Akamai

#### For Large Organization (1000+ users)

**Backend Cluster:**
- 4-8+ instances: 8 cores, 32 GB RAM each
- Kubernetes (EKS/GKE/AKS)
- Auto-scaling based on load

**Database Cluster:**
- MongoDB Sharded Cluster
- 8+ cores, 32+ GB RAM per shard
- Dedicated replica sets for each shard
- Disk: Multi-terabyte with replication

**Frontend:**
- Global CDN with DDoS protection
- Content versioning
- Regional caching

### 1.3 Infrastructure Deployment Checklist

**Network Setup**
- [ ] VPC/VNet created
- [ ] Subnets configured (public, private, database)
- [ ] Internet Gateway / NAT Gateway configured
- [ ] Security groups / NACLs defined
- [ ] VPN access configured (for team access)
- [ ] DNS records configured

**Monitoring & Logging**
- [ ] CloudWatch / Azure Monitor / Stackdriver configured
- [ ] Log aggregation (ELK, CloudWatch Logs, etc.) set up
- [ ] Alerting rules configured (CPU, memory, disk, errors)
- [ ] APM tool configured (optional but recommended)

**Backup & DR**
- [ ] Backup strategy defined and tested
- [ ] Disaster recovery plan documented
- [ ] RTO/RPO targets agreed upon
- [ ] Backup storage location secured

**SSL/TLS**
- [ ] Domain name registered
- [ ] SSL certificate obtained (Let's Encrypt or commercial)
- [ ] Certificate auto-renewal configured
- [ ] HTTPS enforced on all endpoints

---

## Phase 2: Backend Deployment

### 2.1 Backend Prerequisites

**Our Team Provides:**
- Latest backend source code
- Deployment documentation
- Environment variable template
- Deployment scripts (optional)

**Client Must Have:**
- Node.js 18+ installed
- npm 9+ or yarn installed
- Git access (to clone repository)
- SSH access to deployment servers

### 2.2 Backend Deployment Steps

#### Step 1: Clone Repository
```bash
cd /opt/govflow
git clone https://github.com/GovFlowTeam/govflow-backend.git backend
cd backend
```

#### Step 2: Install Dependencies
```bash
npm install --production
# or with npm ci for exact versions
npm ci --production
```

#### Step 3: Environment Configuration
```bash
cp .env.example .env
# Edit .env with production values (see Section 2.3)
nano .env
```

#### Step 4: Database Migration & Seed
```bash
# Create initial collections and indexes
npm run db:migrate

# Optional: seed initial data
npm run seed
```

#### Step 5: Start Backend Service

**Using systemd (recommended for production):**

Create `/etc/systemd/system/govflow-backend.service`:
```ini
[Unit]
Description=GovFlow Backend Service
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=govflow
WorkingDirectory=/opt/govflow/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable govflow-backend
sudo systemctl start govflow-backend
sudo systemctl status govflow-backend
```

**Using Docker (alternative):**
```bash
# Build Docker image (from backend directory)
docker build -t govflow-backend:latest .

# Run container
docker run -d \
  --name govflow-backend \
  -p 5000:5000 \
  --env-file .env \
  --restart always \
  govflow-backend:latest
```

#### Step 6: Verify Backend Health
```bash
curl http://localhost:5000/health
# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2026-04-15T10:30:00Z",
#   "mongodb": "connected"
# }
```

### 2.3 Production Environment Variables

Create `.env` file with the following variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
APP_URL=https://api.govflow.yourdomain.com
FRONTEND_URL=https://govflow.yourdomain.com

# MongoDB Connection
MONGO_URI=mongodb+srv://user:password@cluster0.mongodb.net/govflow_prod?retryWrites=true&w=majority

# Security & JWT
JWT_SECRET=<generate-strong-random-secret>
JWT_EXPIRES_IN=7d
SESSION_SECRET=<generate-strong-random-secret>

# Tenant Configuration
DEFAULT_TENANT_ID=<client-tenant-id>

# File Uploads
UPLOADS_DIR=/var/govflow/uploads
UPLOADS_MAX_SIZE=52428800  # 50MB

# CORS Configuration
CORS_ORIGINS=https://govflow.yourdomain.com,https://app.govflow.yourdomain.com

# Email Configuration (Resend or SendGrid)
RESEND_API_KEY=<get-from-resend.com>
# OR
SENDGRID_API_KEY=<get-from-sendgrid.com>
SENDGRID_INVITE_TEMPLATE_ID=<template-id>
SENDGRID_RESET_TEMPLATE_ID=<template-id>

EMAIL_FROM="GovFlow <noreply@govflow.yourdomain.com>"
BRAND_APP_NAME=<Organization Name>
BRAND_COMPANY_NAME=<Organization Name>

# Microsoft OAuth (for Outlook)
MICROSOFT_CLIENT_ID=<from-azure-portal>
MICROSOFT_CLIENT_SECRET=<from-azure-portal>
MICROSOFT_TENANT=<your-tenant-id>
MICROSOFT_REDIRECT_URI=https://api.govflow.yourdomain.com/auth/microsoft/callback

# Google OAuth (for Gmail)
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
GOOGLE_REDIRECT_URI=https://api.govflow.yourdomain.com/auth/google/callback

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### 2.4 Backend Health Checks

Create monitoring script `/opt/govflow/scripts/health-check.sh`:
```bash
#!/bin/bash

HEALTH_URL="http://localhost:5000/health"
RESPONSE=$(curl -s -w "%{http_code}" $HEALTH_URL)
HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "Backend is healthy"
  exit 0
else
  echo "Backend health check failed: $HTTP_CODE"
  exit 1
fi
```

### 2.5 Backend Deployment Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Port already in use | Another service on port 5000 | Change PORT env var or stop conflicting service |
| MongoDB connection error | DB not running or wrong URI | Verify MongoDB is running and connection string is correct |
| Module not found errors | Dependencies not installed | Run `npm install` again |
| CORS errors in frontend | CORS_ORIGINS not configured | Add frontend origin to CORS_ORIGINS |
| Permission denied on uploads | Incorrect directory permissions | `chmod 755 /var/govflow/uploads` |

---

## Phase 3: Database Setup

### 3.1 MongoDB Installation Options

#### Option A: Managed MongoDB Atlas (Recommended)
- No operational overhead
- Automatic backups
- Built-in monitoring
- Easier to scale

**Setup Steps:**
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create organization and project
3. Create cluster:
   - Cloud provider: AWS/Azure/GCP (match your backend location)
   - Region: Same as backend for lower latency
   - Tier: Shared (M2) for dev, M10+ for production
4. Create database user
5. Get connection string: `mongodb+srv://user:password@...`
6. Add IP whitelist (your backend server IP)
7. Set `MONGO_URI` in backend `.env`

#### Option B: Self-Managed MongoDB on Cloud VM
**AWS EC2 Example:**

1. Launch instance:
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.large (minimum for production)
   - Storage: 100GB+ GP3 SSD

2. Install MongoDB:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod
```

3. Configure replication (for HA):
```javascript
// Connect to mongo shell
mongo
rs.initiate()
rs.conf()
```

4. Create database and user:
```javascript
use govflow_prod
db.createUser({
  user: "govflow_app",
  pwd: "<strong-password>",
  roles: ["readWrite"]
})
```

#### Option C: Docker Container
```bash
docker run -d \
  --name govflow-mongo \
  -p 27017:27017 \
  -v /data/mongodb:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=<password> \
  --restart always \
  mongo:6.0
```

### 3.2 Database Initialization

**From backend directory:**
```bash
# Create schema and indexes
npm run db:migrate

# Optional: seed sample data
npm run seed

# Verify collections were created
mongo "mongodb://user:pass@host/govflow_prod"
> show collections
> db.users.count()
```

### 3.3 Database Backup Strategy

**Automated Backups (MongoDB Atlas):**
- Enable daily snapshots (automatic)
- 30-day retention
- Set up AWS S3 export for compliance archives

**Manual Backups (Self-Managed):**

Daily backup script `/opt/govflow/scripts/backup-mongo.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/govflow_$DATE.gz"

mkdir -p $BACKUP_DIR

mongodump \
  --uri="mongodb://user:pass@localhost/govflow_prod" \
  --gzip \
  --archive="$BACKUP_FILE"

# Keep only 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

Schedule with cron:
```bash
# Backup daily at 2 AM
0 2 * * * /opt/govflow/scripts/backup-mongo.sh
```

### 3.4 Database Monitoring

**Setup MongoDB monitoring:**
```bash
# Enable MongoDB profiling
mongo govflow_prod
db.setProfilingLevel(1, { slowms: 100 })  # Log queries > 100ms

# Check profiling data
db.system.profile.find().limit(5).pretty()

# Create index usage statistics view
db.system.profile.aggregate([
  { $group: { _id: "$plan.stage", count: { $sum: 1 } } }
])
```

**Key metrics to monitor:**
- Connection count
- Active operations
- Index usage
- Replication lag (if using replicas)
- Disk space usage
- Memory usage
- Lock time

---

## Phase 4: Frontend Deployment

### 4.1 Frontend Build Process

#### Step 1: Build Frontend Bundle
```bash
cd gov-flow-ui-files-ref
npm install --production
npm run build
```

This generates optimized files in `dist/` directory.

#### Step 2: Production Environment Configuration

Create `.env` for production build:
```bash
VITE_API_BASE_URL=https://api.govflow.yourdomain.com
VITE_USE_NODE_BACKEND=true
VITE_DEV_USER_ID=  # Empty in production

# Branding (optional overrides - use backend config instead)
# VITE_BRAND_APP_NAME=Organization Name
```

#### Step 3: Build with Production Config
```bash
npm run build
# Output: dist/ directory with optimized bundles
```

### 4.2 Deployment Options

#### Option A: CDN (Recommended for Global Distribution)

**Using AWS CloudFront:**

1. Create S3 bucket:
```bash
aws s3api create-bucket \
  --bucket govflow-frontend-prod \
  --region us-east-1

# Block public access but allow CloudFront
aws s3api put-bucket-policy --bucket govflow-frontend-prod \
  --policy file://policy.json
```

2. Upload build files:
```bash
aws s3 sync dist/ s3://govflow-frontend-prod/ \
  --cache-control "max-age=3600,public" \
  --exclude "index.html" \
  --exclude "*.map"

# index.html with no cache
aws s3 cp dist/index.html s3://govflow-frontend-prod/index.html \
  --cache-control "max-age=0,must-revalidate" \
  --content-type "text/html"
```

3. Create CloudFront distribution:
```bash
# Using AWS Console or:
aws cloudfront create-distribution --distribution-config file://cf-config.json
```

4. Attach SSL certificate and custom domain
5. Update DNS to point to CloudFront distribution

#### Option B: Traditional Web Server

**Using Nginx:**

1. Install Nginx:
```bash
apt-get install -y nginx
```

2. Configure `/etc/nginx/sites-available/govflow`:
```nginx
server {
    listen 443 ssl http2;
    server_name govflow.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/govflow.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/govflow.yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
    gzip_min_length 1000;

    # Frontend static files
    root /var/www/govflow/dist;
    
    # Serve static assets with long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend-backend:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA routing - serve index.html for all non-file requests
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "public, must-revalidate, proxy-revalidate";
    }

    # Deny access to dotfiles
    location ~ /\. {
        deny all;
    }
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name govflow.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

3. Enable site:
```bash
ln -s /etc/nginx/sites-available/govflow /etc/nginx/sites-enabled/
nginx -t  # Test config
systemctl restart nginx
```

#### Option C: Docker Container

Create `Dockerfile.frontend`:
```dockerfile
# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -f Dockerfile.frontend -t govflow-frontend:latest .
docker run -d -p 80:80 --name govflow-frontend govflow-frontend:latest
```

### 4.3 SSL/TLS Certificate Setup

**Using Let's Encrypt (Free):**
```bash
# Install certbot
apt-get install -y certbot python3-certbot-nginx

# Get certificate
certbot certonly --nginx -d govflow.yourdomain.com -d api.govflow.yourdomain.com

# Auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

**Commercial Certificate:**
1. Generate CSR on your server
2. Purchase certificate from provider
3. Install certificate files
4. Update web server config to point to certificate

### 4.4 Frontend Deployment Verification

Test deployment:
```bash
# Check frontend loads
curl https://govflow.yourdomain.com/

# Check API connectivity
curl https://govflow.yourdomain.com/api/health

# Validate SSL certificate
openssl s_client -connect govflow.yourdomain.com:443
```

---

## Phase 5: OAuth & Email Integration

### 5.1 Microsoft OAuth Setup (Outlook)

**Steps Our Team Provides:**
- OAuth flow documentation
- Integration code

**Steps Client Must Complete:**

1. **Azure AD Application Registration:**
   - Login to [Azure Portal](https://portal.azure.com)
   - Go to Azure Active Directory → App registrations
   - Click "New registration"
   - Name: "GovFlow"
   - Supported account types: "Accounts in any organizational directory"
   - Redirect URI: `https://api.govflow.yourdomain.com/auth/microsoft/callback`

2. **Configure API Permissions:**
   - API permissions → Add permission
   - Select "Microsoft Graph"
   - Delegated permissions:
     - `Mail.Read`
     - `Mail.Send`
     - `Contacts.Read`
     - `User.Read`
     - `offline_access`

3. **Generate Client Secret:**
   - Certificates & secrets → New client secret
   - Copy secret value (save securely)

4. **Get Tenant ID:**
   - App registration overview page
   - Copy "Directory (tenant) ID"

5. **Provide to GovFlow Team:**
   ```
   MICROSOFT_CLIENT_ID=<Application (client) ID>
   MICROSOFT_CLIENT_SECRET=<Secret Value>
   MICROSOFT_TENANT=<Directory (tenant) ID>
   ```

6. **Update backend `.env`:**
   ```bash
   MICROSOFT_CLIENT_ID=xxx
   MICROSOFT_CLIENT_SECRET=xxx
   MICROSOFT_TENANT=xxx
   MICROSOFT_REDIRECT_URI=https://api.govflow.yourdomain.com/auth/microsoft/callback
   MICROSOFT_GRAPH_SCOPES=offline_access User.Read Mail.Read Mail.Send Contacts.Read
   ```

7. **Test OAuth Flow:**
   - Navigate to Settings → Email → Connect Outlook
   - Should redirect to Microsoft login
   - After consent, should show connected mailbox

### 5.2 Google OAuth Setup (Gmail)

**Steps Client Must Complete:**

1. **Google Cloud Project Setup:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project: "GovFlow"
   - Enable APIs:
     - Gmail API
     - Google People API

2. **Create OAuth Consent Screen:**
   - APIs & Services → OAuth consent screen
   - Choose "Internal" (for now)
   - Fill in app details
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`

3. **Create OAuth 2.0 Credential:**
   - Credentials → Create Credentials → OAuth 2.0 Client ID
   - Choose "Web application"
   - Authorized redirect URIs:
     - `https://api.govflow.yourdomain.com/auth/google/callback`
   - Save Client ID and Secret

4. **Provide to GovFlow Team:**
   ```
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   ```

5. **Update backend `.env`:**
   ```bash
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   GOOGLE_REDIRECT_URI=https://api.govflow.yourdomain.com/auth/google/callback
   GOOGLE_GMAIL_SCOPES=openid email profile https://www.googleapis.com/auth/gmail.readonly
   ```

6. **Test OAuth Flow:**
   - Navigate to Settings → Email → Connect Gmail
   - Should redirect to Google login
   - After consent, should show connected mailbox

### 5.3 Email Configuration (SendGrid or Resend)

#### Option A: SendGrid

1. **Create SendGrid Account:**
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Create API key

2. **Verify Sender Domain:**
   - Settings → Sender authentication
   - Create domain authentication
   - Add DNS records as instructed
   - Click "Verify"

3. **Create Email Templates:**
   - Marketing → Templates
   - Create two templates:
     - User Invitation
     - Password Reset

4. **Update backend `.env`:**
   ```bash
   SENDGRID_API_KEY=<api-key>
   SENDGRID_INVITE_TEMPLATE_ID=<template-id>
   SENDGRID_RESET_TEMPLATE_ID=<template-id>
   EMAIL_FROM="GovFlow <noreply@govflow.yourdomain.com>"
   ```

#### Option B: Resend

1. **Create Resend Account:**
   - Sign up at [resend.com](https://resend.com)
   - Create API key

2. **Add Domain:**
   - Domains → Add Domain
   - Follow DNS setup instructions
   - Click "Verify"

3. **Update backend `.env`:**
   ```bash
   RESEND_API_KEY=<api-key>
   EMAIL_FROM="GovFlow <onboarding@govflow.yourdomain.com>"
   ```

### 5.4 Testing Email Integration

```bash
# Send test invitation email
curl -X POST http://localhost:5000/users/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "email": "testuser@yourdomain.com",
    "role": "user"
  }'

# Check email logs
mongo govflow_prod
db.emailmessages.find().sort({_id: -1}).limit(5)
```

---

## Phase 6: White-labeling & Customization

*See `WHITELABEL_CUSTOMIZATION_GUIDE.md` for detailed white-labeling instructions.*

### 6.1 Quick Branding Configuration

**Backend Branding (`.env`):**
```bash
BRAND_APP_NAME=Your Organization Name
BRAND_COMPANY_NAME=Your Organization Name
BRAND_LOGO_URL=https://yourdomain.com/logo.svg
BRAND_FAVICON_URL=https://yourdomain.com/favicon.svg
BRAND_PRIMARY_COLOR=#2563eb
BRAND_SECONDARY_COLOR=#0f172a
BRAND_ACCENT_COLOR=#6366f1
BRAND_SIDEBAR_TITLE=Your App Name
BRAND_TAGLINE=Your Tagline
BRAND_SUPPORT_EMAIL=support@yourdomain.com
BRAND_WEBSITE_URL=https://yourdomain.com
BRAND_SHOW_GOVFLOW_CREDIT=false
```

### 6.2 Custom Domain Setup

```bash
# Update frontend URLs
FRONTEND_URL=https://yourapplication.yourdomain.com
API_BASE_URL=https://api.yourapplication.yourdomain.com

# Update backend
APP_URL=https://yourapplication.yourdomain.com
CORS_ORIGINS=https://yourapplication.yourdomain.com
```

### 6.3 Advanced Customizations

See `WHITELABEL_CUSTOMIZATION_GUIDE.md` for:
- Custom workflow stages
- Custom fields and forms
- Custom business logic
- API extensions
- Theme customization

---

## Phase 7: Testing & UAT

### 7.1 Testing Checklist

**Functional Testing**
- [ ] User registration and login
- [ ] Task creation and assignment
- [ ] Email synchronization
- [ ] Notifications delivery
- [ ] Approval workflows
- [ ] Reporting and analytics
- [ ] Role-based access control
- [ ] Department management
- [ ] Calendar views
- [ ] Kanban board functionality

**Performance Testing**
- [ ] Response time < 2 seconds for standard queries
- [ ] Database query performance optimized
- [ ] Frontend load time < 3 seconds
- [ ] Load test: 100+ concurrent users
- [ ] Mobile responsiveness verified

**Security Testing**
- [ ] Authentication/authorization working
- [ ] CORS properly configured
- [ ] No sensitive data in logs
- [ ] SQL injection / XSS vulnerabilities checked
- [ ] SSL/TLS certificate valid
- [ ] File upload restrictions enforced

**Integration Testing**
- [ ] Microsoft OAuth working
- [ ] Google OAuth working
- [ ] Email sending working
- [ ] Notification system working
- [ ] External API integrations working

**UAT (User Acceptance Testing)**
- [ ] Business processes match requirements
- [ ] User workflows tested with real users
- [ ] Data accuracy verified
- [ ] Performance acceptable to users
- [ ] Documentation clear and complete

### 7.2 Performance Benchmarks

Target metrics:
- API response time (p95): < 500ms
- Database query time (p95): < 100ms
- Frontend page load (fully loaded): < 3 seconds
- Asset caching effective (repeat loads < 500ms)

### 7.3 Rollback Plan

Before going live, prepare rollback procedure:
```bash
# Database backup
mongodump --archive=backup_pre_go_live.gz

# Previous frontend build saved
cp -r /var/www/govflow/dist /var/www/govflow/dist.backup

# Backend version pinned
git tag -a v1.0.0-production -m "Production release"
```

---

## Phase 8: Go-Live

### 8.1 Pre-Go-Live Checklist

**72 Hours Before**
- [ ] Final security audit completed
- [ ] All environments tested
- [ ] Support team briefed
- [ ] Communication sent to users
- [ ] Monitoring alerts configured
- [ ] Escalation contacts confirmed

**24 Hours Before**
- [ ] Final database backup
- [ ] DNS propagation verified
- [ ] SSL certificate valid
- [ ] All services running
- [ ] Logs monitored for errors

**1 Hour Before**
- [ ] Team in war room
- [ ] Monitoring dashboard open
- [ ] Rollback procedure ready
- [ ] Support team available
- [ ] Client stakeholders notified

### 8.2 Go-Live Steps

1. **Enable Production DNS:**
   - Update DNS to point to production servers
   - Verify DNS propagation

2. **Enable Features:**
   - Activate all OAuth providers
   - Enable email notifications
   - Activate user provisioning

3. **Migrate Initial Data:**
   - Import user list
   - Set up organizational structure
   - Create initial workflows

4. **Monitor System:**
   - Watch error logs
   - Monitor performance metrics
   - Check database health
   - Monitor user logins

### 8.3 Post-Go-Live Monitoring

**First Week:**
- [ ] Team on 24/7 on-call
- [ ] Daily performance reports
- [ ] Bug triage and hotfix
- [ ] User feedback collection
- [ ] Daily stand-ups

**First Month:**
- [ ] Weekly performance reports
- [ ] Optimization based on usage
- [ ] Training completion tracking
- [ ] User adoption metrics
- [ ] Process refinement

---

## Post-Implementation Support

### Support SLA

| Category | Response Time | Resolution Time |
|----------|---------------|-----------------|
| Critical (System Down) | 15 minutes | 4 hours |
| High (Major Feature Broken) | 1 hour | 8 hours |
| Medium (Feature Partially Broken) | 4 hours | 24 hours |
| Low (Enhancement Request) | 24 hours | 30 days |

### Support Channels

- **Email:** support@govflow.ai
- **Slack:** #govflow-support (if configured)
- **Portal:** https://support.govflow.ai
- **Phone:** +1 (XXX) XXX-XXXX (for critical issues)

### Regular Maintenance

**Weekly:**
- Monitor system logs for errors
- Check backup completion
- Review performance metrics
- Update security patches

**Monthly:**
- Performance optimization review
- Database statistics analysis
- Capacity planning review
- User feedback review

**Quarterly:**
- Security audit
- Compliance review
- Disaster recovery drill
- Strategic planning

### Escalation Matrix

| Issue | Level 1 | Level 2 | Level 3 |
|-------|---------|---------|---------|
| Bugs | Support Team | Senior Engineer | Architect |
| Performance | DevOps | Infrastructure | Cloud Architect |
| Security | Security Team | Chief Security Officer | External Auditor |
| Data Issues | DBA | Data Architect | CTO |

---

## Appendices

### A. Networking Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet / Users                          │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
        ┌──────────────────┐
        │  CDN / Cloudflare │
        │ (SSL + DDoS)      │
        └────────┬─────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
    ▼                           ▼
┌──────────────┐         ┌──────────────┐
│ Frontend     │         │ Backend API  │
│ (React SPA)  │         │ (Express)    │
│ Static HTML  │         │ Port 5000    │
│ CSS/JS/Assets│         └──────┬───────┘
└──────────────┘                │
                                ▼
                         ┌──────────────────────┐
                         │  MongoDB Database    │
                         │  (Replica Set)       │
                         │  Port 27017          │
                         └──────────────────────┘
```

### B. Environment Variables Checklist

**Development:**
- [ ] PORT=5000
- [ ] NODE_ENV=development
- [ ] MONGO_URI=mongodb://localhost:27017/govflow_dev
- [ ] JWT_SECRET=<dev-secret>
- [ ] ALLOW_DEV_LOGIN=true

**Production:**
- [ ] PORT=5000
- [ ] NODE_ENV=production
- [ ] MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/govflow_prod
- [ ] JWT_SECRET=<strong-random-secret>
- [ ] ALLOW_DEV_LOGIN=false
- [ ] All OAuth credentials configured
- [ ] Email service configured
- [ ] CORS_ORIGINS configured
- [ ] SSL certificates configured

### C. Health Check Endpoints

```bash
# Backend health
GET /health
Response: { status: "ok", mongodb: "connected" }

# API health with auth
GET /auth/me
Headers: Authorization: Bearer <token>

# Database connectivity
# Internal monitoring
```

### D. Backup and Recovery Procedure

**Daily Backup (Automated):**
```bash
0 2 * * * /opt/govflow/scripts/backup-mongo.sh
```

**Recovery Steps:**
```bash
# Stop the application
sudo systemctl stop govflow-backend

# Restore from backup
mongorestore --archive=/var/backups/mongodb/govflow_20260415_020000.gz

# Verify data
mongo govflow_prod
db.users.count()

# Start application
sudo systemctl start govflow-backend
```

### E. Common Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| CORS errors | Frontend can't reach API | Add correct origin to CORS_ORIGINS |
| OAuth fails | Users can't login | Verify OAuth credentials and redirect URIs |
| Email not sending | Invitations not received | Check SendGrid/Resend API key and domain verification |
| Database slow | Performance degradation | Check indexes, analyze slow queries, add replicas |
| High memory usage | Out of memory errors | Increase server RAM or optimize queries |
| SSL certificate errors | Browser warnings | Renew certificate or fix domain configuration |

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-04-15 | 1.0 | Initial version |

---

**Document Owner:** GovFlow Implementation Team  
**Last Updated:** 2026-04-15  
**Next Review:** 2026-05-15
