# GovFlow Multi-Tenancy & White-labeling Architecture

**Technical architecture guide for implementing white-labeled instances of GovFlow across multiple organizations.**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Multi-Tenancy Models](#multi-tenancy-models)
3. [Data Isolation Strategy](#data-isolation-strategy)
4. [Configuration Management](#configuration-management)
5. [White-labeling Implementation](#white-labeling-implementation)
6. [Deployment Topologies](#deployment-topologies)
7. [Security & Compliance](#security--compliance)
8. [Scaling Considerations](#scaling-considerations)

---

## Architecture Overview

### High-Level White-Labeled Topology

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet / Users                         │
└────────┬────────────────────────────────────────────────────┘
         │
    ┌────┴──────┬──────────────┬─────────────┐
    │            │              │             │
    ▼            ▼              ▼             ▼
┌────────┐ ┌──────────┐ ┌────────────┐ ┌────────────┐
│Org 1   │ │Org 2     │ │Org 3       │ │Org N       │
│Frontend │ │Frontend  │ │Frontend    │ │Frontend    │
└────────┘ └──────────┘ └────────────┘ └────────────┘
    │            │              │             │
    └────┬───────┴──────┬───────┴─────────────┘
         │              │
    ┌────▼──────────────▼────┐
    │  Reverse Proxy / WAF    │
    │  (Route by hostname)    │
    └────┬──────────────────┬─┘
         │                  │
    ┌────▼──────┐      ┌────▼──────────┐
    │  Backend   │      │  Backend      │
    │  Cluster   │      │  Cluster      │
    │  (Org 1-2) │      │  (Org 3-N)    │
    └────┬──────┘      └────┬───────────┘
         │                  │
    ┌────▼──────────────────▼────┐
    │  MongoDB Sharded Cluster    │
    │  Shard 1: org1, org2        │
    │  Shard 2: org3-orgN         │
    └─────────────────────────────┘
```

### Key Components

1. **Frontend Layer** - Branded SPA per organization
2. **Reverse Proxy** - Route to correct backend based on hostname
3. **Backend Layer** - Shared or dedicated instances per tenant
4. **Database Layer** - Logical/physical isolation based on scale
5. **File Storage** - Segregated uploads per tenant

---

## Multi-Tenancy Models

### Model 1: Single Database, Multiple Tenants (Cost-Optimized)

**Best For:** SMBs, departments, small organizations

**Architecture:**
```
All tenants → Single Backend → Single MongoDB Database
  ↓             ↓                 ↓
org1        app:5000         collections with tenantId
org2                         (users, tasks, etc.)
org3
```

**Advantages:**
- Minimal infrastructure cost
- Easy backups (single DB)
- Simple deployment
- Resource pooling

**Disadvantages:**
- Risk of data leakage if queries miss tenantId filter
- Noisy neighbor problem (one org's load affects others)
- Limited customization per tenant
- Compliance/audit complexity

**Implementation:**
```javascript
// Query helper for tenant isolation
export function withTenant(model, tenantId) {
  return {
    find: (query) => model.find({ ...query, tenantId }),
    findById: (id) => model.findOne({ _id: id, tenantId }),
    create: (doc) => model.create({ ...doc, tenantId }),
    updateOne: (q, u) => model.updateOne({ ...q, tenantId }, u),
  };
}

// Usage
const userTasks = await withTenant(Task, 'org1').find({ status: 'open' });
```

### Model 2: Separate Database Per Tenant (Enterprise)

**Best For:** Large organizations, compliance-heavy, white-labeled SaaS

**Architecture:**
```
org1 → Backend 1 → MongoDB Database 1
org2 → Backend 2 → MongoDB Database 2
org3 → Backend 3 → MongoDB Database 3
```

**Advantages:**
- Complete data isolation
- No risk of cross-tenant data leakage
- Easy to comply with data residency requirements
- Simple to give customers their own DB
- High compliance (HIPAA, SOC2, etc.)

**Disadvantages:**
- Higher infrastructure cost
- More complex operations
- Backup/restore management
- Version compatibility across DBs

**Implementation:**
```javascript
// Tenant router
export async function getTenantContext(tenantId) {
  const tenantConfig = await Tenant.findById(tenantId);
  
  // Connect to tenant-specific DB
  const dbUri = tenantConfig.mongoUri;
  const connection = mongoose.createConnection(dbUri);
  
  return {
    tenantId,
    connection,
    models: {
      User: connection.model('User', UserSchema),
      Task: connection.model('Task', TaskSchema),
    }
  };
}

// Usage
const tenantCtx = await getTenantContext('org1');
const users = await tenantCtx.models.User.find({});
```

### Model 3: Hybrid (Recommended for Scale)

**Architecture:**
```
Small orgs (< 100 users)  → Shared Backend → Shared DB (multi-tenant)
Medium orgs (100-1K)      → Shared Backend → Dedicated DB per org
Large orgs (1K+)          → Dedicated Backend → Dedicated DB
```

**Benefits:**
- Cost-effective for small customers
- Compliance for large customers
- Flexibility to scale up
- Predictable pricing tiers

---

## Data Isolation Strategy

### Query-Level Isolation (Model 1)

**Critical:** Always filter by tenantId

```javascript
// REQUIRED on every query
collection.find({ ...query, tenantId })

// WRONG - Missing tenantId
collection.find(query)

// Better - Use middleware to enforce
export function enforceTenantFilter(schema, tenantId) {
  schema.pre('find', function() {
    this.where({ tenantId });
  });
  
  schema.pre('findOne', function() {
    this.where({ tenantId });
  });
}
```

### Index Strategy

```javascript
// Essential indexes for multi-tenant
const TaskSchema = new Schema({
  id: String,
  tenantId: String,  // First field in compound indexes
  userId: String,
  status: String,
  // ...
});

// Compound indexes
TaskSchema.index({ tenantId: 1, userId: 1 });
TaskSchema.index({ tenantId: 1, status: 1 });
TaskSchema.index({ tenantId: 1, createdAt: -1 });

// Prevents accidental cross-tenant queries
TaskSchema.index({ tenantId: 1 });
```

### API-Level Isolation

```javascript
// Extract tenantId from request context
export async function tenantMiddleware(req, res, next) {
  const tenantId = extractTenantId(req);
  
  // Validate tenant exists and is active
  const tenant = await Tenant.findById(tenantId);
  if (!tenant || tenant.status !== 'active') {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  // Add to request context
  req.tenant = tenant;
  req.tenantId = tenantId;
  req.user.tenantId = tenantId;
  
  next();
}

// Extract from different sources
function extractTenantId(req) {
  // From subdomain: org1.app.com
  const subdomain = req.hostname.split('.')[0];
  if (subdomain && subdomain !== 'app' && subdomain !== 'www') {
    return subdomain;
  }
  
  // From JWT claim
  if (req.user?.tenantId) {
    return req.user.tenantId;
  }
  
  // From header
  return req.headers['x-tenant-id'];
}
```

### File Storage Isolation

```javascript
// Segregate uploads by tenant
export function getTenantUploadPath(tenantId, filename) {
  return `/uploads/${tenantId}/${filename}`;
}

// Upload middleware
export async function uploadFile(req, res, next) {
  const tenantId = req.tenantId;
  const filename = `${Date.now()}_${req.file.originalname}`;
  const filepath = getTenantUploadPath(tenantId, filename);
  
  // Store in tenant-specific directory
  const fullPath = path.join(UPLOADS_DIR, tenantId, filename);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.rename(req.file.path, fullPath);
  
  // Store reference
  res.json({ filepath, url: `/uploads/${tenantId}/${filename}` });
}

// Serve with tenant context
app.get('/uploads/:tenantId/:filename', (req, res) => {
  const tenantId = req.params.tenantId;
  const filename = req.params.filename;
  
  // Verify requester is from same tenant
  if (req.tenantId !== tenantId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const filepath = path.join(UPLOADS_DIR, tenantId, filename);
  res.sendFile(filepath);
});
```

---

## Configuration Management

### Tenant Configuration Schema

```javascript
const TenantSchema = new Schema({
  // Identity
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true },  // For subdomain
  domain: { type: String, unique: true }, // Custom domain
  
  // Status
  status: { type: String, enum: ['trial', 'active', 'suspended', 'archived'] },
  createdAt: { type: Date, default: Date.now },
  
  // Subscription
  subscription: {
    plan: { type: String, enum: ['starter', 'professional', 'enterprise'] },
    status: { type: String, enum: ['active', 'trial', 'expired'] },
    validUntil: Date,
    maxUsers: Number,
    maxStorage: Number,
  },
  
  // Branding
  branding: {
    appName: String,
    logoUrl: String,
    faviconUrl: String,
    colors: {
      primary: String,
      secondary: String,
      accent: String,
    },
    domain: String,
    favicon: Buffer,
  },
  
  // Features
  features: {
    enableEmails: { type: Boolean, default: true },
    enableOAuth: { type: Boolean, default: true },
    enableNotifications: { type: Boolean, default: true },
    enableReporting: { type: Boolean, default: true },
    enableWorkflows: { type: Boolean, default: true },
    customFeatures: [String],
  },
  
  // OAuth
  oauth: {
    microsoft: {
      clientId: String,
      clientSecret: String,
      enabled: Boolean,
    },
    google: {
      clientId: String,
      clientSecret: String,
      enabled: Boolean,
    },
  },
  
  // Email
  email: {
    provider: { type: String, enum: ['sendgrid', 'resend', 'smtp'] },
    sendgridKey: String,
    resendKey: String,
    fromEmail: String,
    fromName: String,
    templates: {
      invitation: String,
      reset: String,
    },
  },
  
  // Database (for Model 2)
  mongoUri: String,
  
  // Compliance
  compliance: {
    dataResidency: String,
    encryptionKey: String,
    auditLoggingEnabled: Boolean,
  },
  
  // Integrations
  integrations: {
    salesforce: { enabled: Boolean, token: String },
    slack: { enabled: Boolean, token: String },
    webhooks: [{ url: String, events: [String] }],
  },
});
```

### Runtime Configuration

```javascript
export class TenantConfigService {
  private cache = new Map();
  
  async getConfig(tenantId, forceRefresh = false) {
    if (this.cache.has(tenantId) && !forceRefresh) {
      return this.cache.get(tenantId);
    }
    
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new Error('Tenant not found');
    
    this.cache.set(tenantId, tenant);
    return tenant;
  }
  
  async updateConfig(tenantId, updates) {
    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      updates,
      { new: true }
    );
    
    this.cache.delete(tenantId); // Invalidate cache
    return tenant;
  }
  
  clearCache(tenantId) {
    this.cache.delete(tenantId);
  }
}
```

---

## White-labeling Implementation

### Frontend White-labeling

**Dynamic Branding System:**

```javascript
// frontend/src/hooks/useTenanBranding.js
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';

export function useTenantBranding() {
  const { data: publicSettings } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: authApi.getAppPublicSettings,
    cacheTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  return {
    appName: publicSettings?.branding?.appName || 'GovFlow',
    logoUrl: publicSettings?.branding?.logoUrl,
    faviconUrl: publicSettings?.branding?.faviconUrl,
    primaryColor: publicSettings?.branding?.colors?.primary || '#2563eb',
    secondaryColor: publicSettings?.branding?.colors?.secondary || '#0f172a',
    accentColor: publicSettings?.branding?.colors?.accent || '#6366f1',
  };
}

// Usage in components
export function Layout() {
  const branding = useTenantBranding();
  
  return (
    <div>
      <img src={branding.logoUrl} alt={branding.appName} />
      <style>{`
        :root {
          --primary: ${branding.primaryColor};
          --secondary: ${branding.secondaryColor};
          --accent: ${branding.accentColor};
        }
      `}</style>
    </div>
  );
}
```

### CSS Variables System

```css
/* frontend/src/index.css */

:root {
  /* Default values - overridden by CSS variables */
  --primary: #2563eb;
  --secondary: #0f172a;
  --accent: #6366f1;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  
  /* Derived colors */
  --primary-light: color-mix(in srgb, var(--primary) 90%, white);
  --primary-dark: color-mix(in srgb, var(--primary) 80%, black);
}

/* Apply to components */
.btn-primary {
  background-color: var(--primary);
  color: white;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
}

.sidebar {
  background-color: var(--secondary);
}

.card {
  border-left: 4px solid var(--accent);
}

.input:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 10%, white);
}
```

### Logo Management

```javascript
// backend/src/routes/brandingRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const upload = multer({ dest: UPLOADS_DIR });

router.post('/branding/logo', upload.single('logo'), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const filename = `logo_${tenantId}_${Date.now()}${path.extname(req.file.originalname)}`;
    const filepath = path.join(UPLOADS_DIR, 'branding', filename);
    
    // Move file
    await fs.rename(req.file.path, filepath);
    
    // Update tenant
    await Tenant.findByIdAndUpdate(tenantId, {
      'branding.logoUrl': `/uploads/branding/${filename}`,
    });
    
    res.json({ 
      logoUrl: `/uploads/branding/${filename}`,
      message: 'Logo updated successfully',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/branding/public-settings', async (req, res) => {
  const tenantId = req.tenantId;
  const tenant = await Tenant.findById(tenantId);
  
  res.json({
    branding: {
      appName: tenant.branding.appName,
      logoUrl: tenant.branding.logoUrl,
      faviconUrl: tenant.branding.faviconUrl,
      colors: tenant.branding.colors,
    },
    features: tenant.features,
  });
});
```

### Custom Domain Configuration

```javascript
// DNS configuration required:
// app.org1.com CNAME govflow-app.com
// app.org2.com CNAME govflow-app.com
// api.org1.com CNAME govflow-api.com
// api.org2.com CNAME govflow-api.com

// Nginx configuration
server {
    server_name ~^(.+)\.yourdomain\.com$ api\.(.+)\.yourdomain\.com$;
    
    # Extract subdomain = organization
    set $org_id $1;
    
    # Route to backend with tenant context
    location / {
        proxy_pass http://backend:5000;
        proxy_set_header X-Tenant-Id $org_id;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Deployment Topologies

### Topology 1: Single Deployment (< 5 Organizations)

```
┌─────────────────────────────────┐
│   Shared Infrastructure          │
├─────────────────────────────────┤
│                                  │
│  ┌──────────────────────┐       │
│  │ Backend Instances    │       │
│  │ (2-4 instances)      │       │
│  └────────┬─────────────┘       │
│           │                      │
│  ┌────────▼──────────────┐      │
│  │ Shared MongoDB        │      │
│  │ (Multi-tenant DB)     │      │
│  └───────────────────────┘      │
│                                  │
│  ┌───────────────────────┐      │
│  │ Shared S3/Storage     │      │
│  │ (Tenant-segregated)   │      │
│  └───────────────────────┘      │
│                                  │
└─────────────────────────────────┘

Cost: Low
Complexity: Low
Scalability: Limited
```

**Deployment Steps:**
```bash
# Deploy once for all tenants
cd backend && npm run build
docker build -t govflow:latest .
kubectl apply -f deployment.yaml

# All tenants use same backend/DB
# Isolation via tenantId field
```

### Topology 2: Scaled Deployment (5-50 Organizations)

```
┌─────────────────────────────────────┐
│   Scaled Infrastructure              │
├─────────────────────────────────────┤
│                                      │
│  Tier 1: Small orgs (< 100 users)   │
│  ┌──────────────────────┐           │
│  │ Backend Pool 1 (4x)  │           │
│  └──────┬───────────────┘           │
│         │                            │
│  ┌──────▼──────────────┐            │
│  │ Shared MongoDB 1    │            │
│  │ (Multi-tenant)      │            │
│  └─────────────────────┘            │
│                                      │
│  Tier 2: Medium orgs (100-1K)       │
│  ┌──────────────────────┐           │
│  │ Backend Pool 2 (2x)  │           │
│  └──────┬───────────────┘           │
│         │                            │
│  ┌──────▼──────────────┐            │
│  │ Dedicated DBs (5x)  │            │
│  │ One DB per org      │            │
│  └─────────────────────┘            │
│                                      │
│  Tier 3: Large orgs (1K+)           │
│  ┌──────────────────────┐           │
│  │ Backend Pool 3 (1x)  │           │
│  └──────┬───────────────┘           │
│         │                            │
│  ┌──────▼──────────────┐            │
│  │ Dedicated Setup      │            │
│  │ (Backend + DB)       │            │
│  └─────────────────────┘            │
│                                      │
│  ┌─────────────────────────┐        │
│  │ S3 / Object Storage     │        │
│  │ (Tenant-segregated)     │        │
│  └─────────────────────────┘        │
│                                      │
└─────────────────────────────────────┘

Cost: Medium
Complexity: Medium
Scalability: Good
```

### Topology 3: Enterprise Deployment (50+ Organizations)

```
┌───────────────────────────────────────────┐
│    Enterprise Multi-Region Setup           │
├───────────────────────────────────────────┤
│                                            │
│  Region 1 (USA)                           │
│  ┌────────────────────────────┐           │
│  │ Kubernetes Cluster 1       │           │
│  │ ├─ Backend Pods (Auto)     │           │
│  │ └─ MongoDB Replica Set     │           │
│  └────────────────────────────┘           │
│                                            │
│  Region 2 (EU)                            │
│  ┌────────────────────────────┐           │
│  │ Kubernetes Cluster 2       │           │
│  │ ├─ Backend Pods (Auto)     │           │
│  │ └─ MongoDB Replica Set     │           │
│  └────────────────────────────┘           │
│                                            │
│  Region 3 (APAC)                          │
│  ┌────────────────────────────┐           │
│  │ Kubernetes Cluster 3       │           │
│  │ ├─ Backend Pods (Auto)     │           │
│  │ └─ MongoDB Replica Set     │           │
│  └────────────────────────────┘           │
│                                            │
│  Global Services                           │
│  ┌────────────────────────────┐           │
│  │ Global Load Balancer       │           │
│  ├─ Health Checks             │           │
│  ├─ Route by Geo              │           │
│  └─ DDoS Protection           │           │
│  ┌────────────────────────────┐           │
│  │ Global CDN                 │           │
│  ├─ Frontend Caching          │           │
│  └─ Static Assets             │           │
│  ┌────────────────────────────┐           │
│  │ Backup Management          │           │
│  ├─ Cross-region              │           │
│  └─ Offsite Archive           │           │
│                                            │
└───────────────────────────────────────────┘

Cost: High
Complexity: High
Scalability: Unlimited
```

---

## Security & Compliance

### Data Encryption

```javascript
// At-rest encryption
const mongoose = require('mongoose');
const crypto = require('crypto');

// Transparent encryption
const UserSchema = new Schema({
  id: String,
  tenantId: String,
  email: {
    type: String,
    set: (email) => encryptField(email),
    get: (encrypted) => decryptField(encrypted),
  },
  phone: {
    type: String,
    set: (phone) => encryptField(phone),
    get: (encrypted) => decryptField(encrypted),
  },
});

function encryptField(plaintext) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

function decryptField(encrypted) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const [ivHex, encryptedHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Audit Logging

```javascript
// Comprehensive audit trail
const AuditLogSchema = new Schema({
  tenantId: String,
  userId: String,
  action: String, // 'create', 'update', 'delete', 'view'
  resource: String, // 'task', 'user', 'email'
  resourceId: String,
  changes: {
    before: mixed,
    after: mixed,
  },
  ipAddress: String,
  userAgent: String,
  status: String, // 'success', 'failed'
  reason: String, // reason if failed
  timestamp: { type: Date, default: Date.now },
});

// Index for quick queries
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, userId: 1, timestamp: -1 });
AuditLogSchema.index({ tenantId: 1, action: 1 });

// Middleware to auto-log
export async function auditLogger(req, res, next) {
  const originalJson = res.json;
  
  res.json = function(data) {
    if (req.method !== 'GET') {
      AuditLog.create({
        tenantId: req.tenantId,
        userId: req.user?.id,
        action: req.method,
        resource: extractResource(req.path),
        resourceId: extractResourceId(req),
        changes: {
          before: req.body.before,
          after: data,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: res.statusCode < 400 ? 'success' : 'failed',
        timestamp: new Date(),
      }).catch(console.error);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}
```

### Compliance Frameworks

```javascript
// HIPAA Compliance
export async function enforceHIPAA(req, res, next) {
  if (req.tenant?.compliance?.hipaaRequired) {
    // Enforce HTTPS
    if (!req.secure && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'HTTPS required' });
    }
    
    // Encrypt sensitive fields
    if (req.body?.patientData) {
      req.body.patientData = encryptSensitiveData(req.body.patientData);
    }
    
    // Audit all access
    await auditLogger(req, res, () => {});
  }
  
  next();
}

// GDPR Compliance
export async function enforceGDPR(req, res, next) {
  if (req.tenant?.compliance?.gdprRequired) {
    // Data minimization - only request needed fields
    if (req.method === 'POST') {
      const requiredFields = ['email', 'firstName', 'lastName'];
      const hasUnnecessary = Object.keys(req.body).some(
        k => !requiredFields.includes(k)
      );
      if (hasUnnecessary) {
        return res.status(400).json({ error: 'Unnecessary fields' });
      }
    }
    
    // Right to be forgotten
    if (req.path === '/users/me/delete') {
      await deleteAllUserData(req.user.id);
    }
  }
  
  next();
}

// PCI-DSS Compliance
export async function enforcePCIDSS(req, res, next) {
  if (req.tenant?.compliance?.pciRequired) {
    // No payment data in logs
    if (req.body?.cardNumber) {
      req.skipLogging = true;
    }
    
    // Tokenize payment data
    if (req.path === '/payments') {
      req.body.cardToken = await tokenizeCard(req.body.cardNumber);
      delete req.body.cardNumber;
    }
  }
  
  next();
}
```

---

## Scaling Considerations

### Database Scaling

```javascript
// Monitor collection sizes
async function monitorDatabaseGrowth(tenantId) {
  const stats = await db.collection('tasks').stats();
  
  if (stats.size > 100 * 1024 * 1024) { // > 100MB
    console.warn(`Tenant ${tenantId} approaching threshold`);
    
    // Archive old records
    await archiveOldTasks(tenantId);
    
    // Alert admin
    await notifyAdmin(`${tenantId} storage high`);
  }
}

// Archival strategy
async function archiveOldTasks(tenantId, daysOld = 365) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  
  const oldTasks = await Task.find({
    tenantId,
    completedAt: { $lt: cutoff },
  });
  
  // Export to archive DB
  await TaskArchive.insertMany(oldTasks);
  
  // Delete from hot DB
  await Task.deleteMany({
    tenantId,
    completedAt: { $lt: cutoff },
  });
}
```

### Sharding Strategy

```javascript
// MongoDB sharding key
db.adminCommand({
  enableSharding: 'govflow_prod',
});

// Shard on tenantId + createdAt for good distribution
db.tasks.createIndex({ tenantId: 1, createdAt: 1 });
db.adminCommand({
  shardCollection: 'govflow_prod.tasks',
  key: { tenantId: 1, createdAt: 1 },
});

// Similar for all collections
```

### Caching Strategy

```javascript
// Cache tenant configuration
export class TenantCache {
  private cache = new Map();
  private ttl = 5 * 60 * 1000; // 5 minutes
  
  async get(tenantId) {
    const cached = this.cache.get(tenantId);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const tenant = await Tenant.findById(tenantId);
    this.cache.set(tenantId, {
      data: tenant,
      timestamp: Date.now(),
    });
    
    return tenant;
  }
  
  invalidate(tenantId) {
    this.cache.delete(tenantId);
  }
}

// Cache at multiple levels
const redis = require('redis');
const client = redis.createClient();

export async function getCachedTenant(tenantId) {
  // L1: Memory cache
  const memoryCached = tenantCache.get(tenantId);
  if (memoryCached) return memoryCached;
  
  // L2: Redis cache
  const redisCached = await client.get(`tenant:${tenantId}`);
  if (redisCached) return JSON.parse(redisCached);
  
  // L3: Database
  const tenant = await Tenant.findById(tenantId);
  
  // Populate caches
  await client.setex(`tenant:${tenantId}`, 300, JSON.stringify(tenant));
  tenantCache.set(tenantId, tenant);
  
  return tenant;
}
```

---

## Conclusion

This architecture supports:
- ✅ Multiple white-labeled deployments
- ✅ Flexible data isolation models
- ✅ Compliance with various regulations
- ✅ Scaling from 1 to 1000+ organizations
- ✅ Multi-region high availability
- ✅ Complete customization per tenant

Choose the topology and model that fits your business needs and scale accordingly.

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-15  
**Architecture Review Date:** 2026-06-15
