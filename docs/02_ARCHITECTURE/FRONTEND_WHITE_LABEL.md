# GovFlow White-labeling & Customization Guide

**Complete guide for customizing and white-labeling GovFlow for different organizations, government entities, and industries.**

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Branding (Non-Technical)](#quick-branding-non-technical)
3. [Advanced Branding (Technical)](#advanced-branding-technical)
4. [UI/UX Customization](#uiux-customization)
5. [Workflow Customization](#workflow-customization)
6. [Custom Business Logic](#custom-business-logic)
7. [API Customization & Extensions](#api-customization--extensions)
8. [Multi-Tenancy Configuration](#multi-tenancy-configuration)
9. [Integration Points](#integration-points)
10. [Deployment Specific Customization](#deployment-specific-customization)
11. [Customization Best Practices](#customization-best-practices)

---

## Overview

GovFlow supports multiple levels of customization, from simple branding changes to deep technical modifications:

### Customization Levels

| Level | Complexity | Effort | Impact |
|-------|-----------|--------|--------|
| **Level 1: Branding** | Low | 1-2 days | Visual only |
| **Level 2: Configuration** | Low-Medium | 2-5 days | Workflows, fields |
| **Level 3: UI Customization** | Medium | 1-2 weeks | Components, themes |
| **Level 4: Business Logic** | High | 2-4 weeks | Core functionality |
| **Level 5: Full Customization** | Very High | 4+ weeks | Complete rewrite areas |

### Supported Use Cases

- **Government Agencies** - Compliance, process automation
- **Financial Services** - Approvals, audit trails
- **Healthcare** - HIPAA compliance, workflows
- **Educational Institutions** - Course management workflows
- **Corporate Enterprises** - Department management, multi-site
- **Non-Profits** - Grant management, volunteer coordination

---

## Quick Branding (Non-Technical)

For organizations wanting to white-label without code changes.

### 1.1 Logo and Colors

**Backend Configuration (`.env` file):**

```bash
# Application Name
BRAND_APP_NAME=Your Organization Name
BRAND_COMPANY_NAME=Your Official Company Name
BRAND_SIDEBAR_TITLE=App Name (short)

# Visual Assets (provide full HTTPS URLs)
BRAND_LOGO_URL=https://yourdomain.com/assets/logo.svg
BRAND_FAVICON_URL=https://yourdomain.com/assets/favicon.ico

# Color Scheme
BRAND_PRIMARY_COLOR=#2563eb      # Main action buttons, links
BRAND_SECONDARY_COLOR=#0f172a    # Sidebar, headers
BRAND_ACCENT_COLOR=#6366f1       # Highlights, focus states

# Brand Text
BRAND_TAGLINE=Your Organization's Tagline
BRAND_SUPPORT_EMAIL=support@yourdomain.com
BRAND_WEBSITE_URL=https://yourdomain.com
```

**Asset Requirements:**

| Asset | Format | Size | Notes |
|-------|--------|------|-------|
| Logo | SVG or PNG | 200x200px | Transparent background recommended |
| Favicon | ICO or PNG | 32x32px | Square format |
| Hero Image | JPG/PNG | 1920x1080px | Optional, for login page |

### 1.2 Email Templates

Backend sends branded emails. Customize email sender:

```bash
# Email Sender Address
EMAIL_FROM=Your Organization <noreply@yourdomain.com>

# Email Service Configuration
RESEND_API_KEY=<your-resend-key>
# or
SENDGRID_API_KEY=<your-sendgrid-key>
```

**Email Template Variables Available:**

```
- {APP_NAME}
- {ORGANIZATION_NAME}
- {SUPPORT_EMAIL}
- {USER_NAME}
- {INVITE_LINK}
- {RESET_LINK}
```

### 1.3 Domain Configuration

```bash
# Frontend domain
FRONTEND_URL=https://app.yourdomain.com

# API domain
APP_URL=https://api.yourdomain.com

# CORS configuration
CORS_ORIGINS=https://app.yourdomain.com
```

### 1.4 Google Analytics & Tracking (Optional)

Add tracking code to frontend (requires frontend build):

Edit `gov-flow-ui-files-ref/src/main.jsx`:
```javascript
// Add Google Analytics
import ReactGA from 'react-ga4';

ReactGA.initialize('GA_MEASUREMENT_ID');

// Track page views
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useAnalytics() {
  const location = useLocation();
  useEffect(() => {
    ReactGA.send({ 
      hitType: 'pageview', 
      page: location.pathname 
    });
  }, [location]);
}
```

---

## Advanced Branding (Technical)

For organizations wanting deeper customization with code changes.

### 2.1 Custom Theme System

**Backend Theme Configuration:**

Create `backend/src/services/themeService.js`:
```javascript
export const themePresets = {
  govflow_default: {
    primary: '#2563eb',
    secondary: '#0f172a',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  government: {
    primary: '#003366',
    secondary: '#000000',
    accent: '#0066cc',
    success: '#008000',
    warning: '#ff6600',
    error: '#cc0000',
    info: '#0066ff',
  },
  healthcare: {
    primary: '#004687',
    secondary: '#1e40af',
    accent: '#2563eb',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0284c7',
  },
  corporate: {
    primary: '#1f2937',
    secondary: '#111827',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
};

export function getThemeConfig(tenantId) {
  // Fetch from database or environment
  const themeKey = process.env[`THEME_${tenantId}`] || 'govflow_default';
  return themePresets[themeKey];
}
```

**Frontend Theme Application:**

Edit `gov-flow-ui-files-ref/src/index.css`:
```css
:root {
  --primary: var(--brand-primary, #2563eb);
  --secondary: var(--brand-secondary, #0f172a);
  --accent: var(--brand-accent, #6366f1);
  
  /* Derived colors */
  --primary-light: color-mix(in srgb, var(--primary) 90%, white);
  --primary-dark: color-mix(in srgb, var(--primary) 80%, black);
}

/* Apply to components */
.btn-primary {
  background-color: var(--primary);
  color: white;
}

.sidebar {
  background-color: var(--secondary);
}
```

### 2.2 Custom Logo Component

Create `gov-flow-ui-files-ref/src/components/shared/BrandedLogo.jsx`:
```javascript
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';

export function BrandedLogo({ size = 'md' }) {
  const { data: publicSettings } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: authApi.getAppPublicSettings,
  });

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <img 
      src={publicSettings?.branding?.logoUrl} 
      alt={publicSettings?.branding?.appName}
      className={sizes[size]}
    />
  );
}
```

### 2.3 Layout Customization

**Hide/Show Components via Configuration:**

Create `backend/src/config/layouts.js`:
```javascript
export const layoutConfigs = {
  default: {
    showSidebar: true,
    showNotificationBell: true,
    showUserMenu: true,
    showSearchBar: true,
    showHelpButton: true,
    showFeedbackButton: true,
  },
  minimal: {
    showSidebar: false,
    showNotificationBell: false,
    showUserMenu: true,
    showSearchBar: false,
    showHelpButton: false,
    showFeedbackButton: false,
  },
  enterprise: {
    showSidebar: true,
    showNotificationBell: true,
    showUserMenu: true,
    showSearchBar: true,
    showHelpButton: true,
    showFeedbackButton: true,
    showAuditLog: true,
    showAdvancedReporting: true,
  },
};
```

---

## UI/UX Customization

### 3.1 Custom Pages

**Add New Dashboard Page:**

1. Create page component `gov-flow-ui-files-ref/src/pages/CustomDashboard.jsx`:
```javascript
import { useQuery } from '@tanstack/react-query';
import { analyzeTeamPerformance } from '@/functions/analyzeTeamPerformance';

export function CustomDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['custom-metrics'],
    queryFn: analyzeTeamPerformance,
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Custom Dashboard</h1>
      {/* Your custom dashboard here */}
    </div>
  );
}
```

2. Register in `src/pages.config.js`:
```javascript
import { CustomDashboard } from './pages/CustomDashboard';

export const PAGES = {
  // ... existing pages
  CustomDashboard: {
    component: CustomDashboard,
    title: 'Custom Dashboard',
    icon: 'BarChart3',
    requiresAuth: true,
    roles: ['admin', 'manager'],
  },
};
```

### 3.2 Custom Sidebar Navigation

**Conditional Menu Items:**

Edit `gov-flow-ui-files-ref/src/Layout.jsx`:
```javascript
function getSidebarItems(userRole, tenantConfig) {
  const baseItems = [
    { path: '/MyDashboard', label: 'Dashboard', icon: 'Home' },
    { path: '/Tasks', label: 'Tasks', icon: 'CheckSquare' },
  ];

  if (userRole === 'admin') {
    baseItems.push(
      { path: '/AccessControl', label: 'Access Control', icon: 'Lock' },
      { path: '/DepartmentManagement', label: 'Departments', icon: 'Building2' }
    );
  }

  if (tenantConfig?.enableCustomReporting) {
    baseItems.push(
      { path: '/Reports', label: 'Reports', icon: 'BarChart3' }
    );
  }

  return baseItems;
}
```

### 3.3 Custom Forms and Fields

**Add Custom Task Fields:**

1. Extend Task model in `backend/src/models/Task.js`:
```javascript
const taskSchema = new Schema({
  // ... existing fields
  customFields: {
    type: Map,
    of: new Schema({
      label: String,
      value: mixed,
      type: { type: String, enum: ['text', 'number', 'date', 'select'] },
    }),
  },
}, { timestamps: true });
```

2. Create custom field component `gov-flow-ui-files-ref/src/components/tasks/CustomFieldsForm.jsx`:
```javascript
export function CustomFieldsForm({ task, onUpdate }) {
  return (
    <div className="space-y-4">
      {task?.customFields?.map((field, idx) => (
        <FormField
          key={idx}
          label={field.label}
          type={field.type}
          value={field.value}
          onChange={(val) => handleFieldUpdate(idx, val)}
        />
      ))}
    </div>
  );
}
```

### 3.4 Mobile App Customization

**Progressive Web App (PWA) Features:**

Edit `gov-flow-ui-files-ref/index.html`:
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#2563eb">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

Create `gov-flow-ui-files-ref/public/manifest.json`:
```json
{
  "name": "GovFlow",
  "short_name": "GovFlow",
  "description": "Workflow Management System",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Workflow Customization

### 4.1 Custom Workflow Stages

**Define Custom Stages:**

Create `backend/scripts/setup-workflows.js`:
```javascript
import { WorkflowStage } from '../models/WorkflowStage.js';

export async function setupCustomWorkflows(tenantId, industryType) {
  const stages = {
    government: [
      { order: 1, name: 'Submitted', color: '#3b82f6' },
      { order: 2, name: 'Under Review', color: '#f59e0b' },
      { order: 3, name: 'Department Review', color: '#f59e0b' },
      { order: 4, name: 'Director Approval', color: '#f59e0b' },
      { order: 5, name: 'Approved', color: '#10b981' },
      { order: 6, name: 'Rejected', color: '#ef4444' },
    ],
    healthcare: [
      { order: 1, name: 'Draft', color: '#3b82f6' },
      { order: 2, name: 'Submitted', color: '#3b82f6' },
      { order: 3, name: 'Clinical Review', color: '#f59e0b' },
      { order: 4, name: 'Compliance Check', color: '#f59e0b' },
      { order: 5, name: 'Approved', color: '#10b981' },
      { order: 6, name: 'Archived', color: '#6b7280' },
    ],
    corporate: [
      { order: 1, name: 'Created', color: '#3b82f6' },
      { order: 2, name: 'In Progress', color: '#f59e0b' },
      { order: 3, name: 'Manager Review', color: '#f59e0b' },
      { order: 4, name: 'Completed', color: '#10b981' },
    ],
  };

  const stageConfig = stages[industryType] || stages.corporate;

  for (const stage of stageConfig) {
    await WorkflowStage.create({
      id: generateId(),
      tenantId,
      ...stage,
    });
  }
}
```

### 4.2 Custom Approval Workflows

**Multi-Level Approvals:**

Create `backend/src/services/customApprovalsService.js`:
```javascript
export class CustomApprovalsService {
  async submitForApproval(taskId, tenantConfig) {
    const task = await Task.findById(taskId);
    
    const approvalChain = tenantConfig?.approvalChain || [
      { level: 1, role: 'manager', timeLimit: '24h' },
      { level: 2, role: 'director', timeLimit: '48h' },
      { level: 3, role: 'executive', timeLimit: '72h' },
    ];

    for (const approver of approvalChain) {
      const approverUser = await User.findOne({ 
        role: approver.role,
        department: task.department,
        tenantId,
      });

      await TaskApproval.create({
        id: generateId(),
        taskId,
        approverId: approverUser.id,
        level: approver.level,
        timeLimit: approver.timeLimit,
        status: 'pending',
        tenantId,
      });

      // Notify approver
      await notificationsService.notify({
        userId: approverUser.id,
        message: `Task "${task.title}" awaiting your approval`,
        link: `/TaskDetail?id=${taskId}`,
      });
    }
  }
}
```

### 4.3 Custom Routing Rules

**Email-to-Task Routing:**

Create `backend/src/services/customRoutingService.js`:
```javascript
export async function customEmailRouting(email, tenantConfig) {
  const routingRules = tenantConfig?.customRoutingRules || [];

  for (const rule of routingRules) {
    // Check if email matches rule conditions
    if (matchesRule(email, rule)) {
      // Route to appropriate department/user
      const task = await Task.create({
        id: generateId(),
        title: email.subject,
        description: email.body,
        source_email_id: email.id,
        department_id: rule.targetDepartment,
        assigned_to: rule.targetUser,
        priority: rule.priority || 'medium',
      });

      // Create routing notification
      await Notification.create({
        user_id: rule.targetUser,
        message: `New task from email: ${email.from}`,
        link: `/TaskDetail?id=${task.id}`,
      });
    }
  }
}

function matchesRule(email, rule) {
  // Check subject keywords
  if (rule.subjectKeywords) {
    const matches = rule.subjectKeywords.some(kw => 
      email.subject.toLowerCase().includes(kw.toLowerCase())
    );
    if (!matches) return false;
  }

  // Check sender
  if (rule.fromEmail) {
    if (email.from !== rule.fromEmail) return false;
  }

  return true;
}
```

---

## Custom Business Logic

### 5.1 Custom Task Logic

**Task Automation:**

Create `backend/src/services/customTaskAutomation.js`:
```javascript
export class CustomTaskAutomation {
  async autoAssignTasks(newTask, tenantConfig) {
    // Skill-based assignment
    if (tenantConfig?.useSkillBasedAssignment) {
      const assignee = await this.findMostQualified(newTask);
      newTask.assigned_to = assignee.id;
      newTask.lead_user_id = assignee.id;
    }

    // Load balancing assignment
    if (tenantConfig?.useLoadBalancing) {
      const assignee = await this.findLeastBusyUser(newTask.department);
      newTask.assigned_to = assignee.id;
    }

    // Round-robin assignment
    if (tenantConfig?.useRoundRobin) {
      const assignee = await this.getRoundRobinUser(newTask.department);
      newTask.assigned_to = assignee.id;
    }

    await newTask.save();
  }

  async findMostQualified(task) {
    // Your logic here
  }

  async findLeastBusyUser(departmentId) {
    // Your logic here
  }

  async getRoundRobinUser(departmentId) {
    // Your logic here
  }
}
```

**Task Dependencies & Blocking:**

```javascript
export async function validateTaskDependencies(task) {
  const dependencies = await TaskDependency.find({ 
    targetTaskId: task.id 
  });

  for (const dep of dependencies) {
    const blockerTask = await Task.findById(dep.sourceTaskId);
    
    if (blockerTask.status !== 'completed') {
      throw new Error(
        `Cannot move task: blocked by "${blockerTask.title}"`
      );
    }
  }

  return true;
}
```

### 5.2 Custom Notifications

**Smart Notification Rules:**

Create `backend/src/services/smartNotifications.js`:
```javascript
export class SmartNotificationService {
  async sendSmartNotifications(event, tenantConfig) {
    const rules = tenantConfig?.notificationRules || [];

    for (const rule of rules) {
      if (this.ruleMatches(event, rule)) {
        const notificationMethod = rule.method || 'in-app';
        
        switch (notificationMethod) {
          case 'email':
            await this.sendEmailNotification(event, rule);
            break;
          case 'sms':
            await this.sendSmsNotification(event, rule);
            break;
          case 'slack':
            await this.sendSlackNotification(event, rule);
            break;
          case 'webhook':
            await this.sendWebhookNotification(event, rule);
            break;
          default:
            await this.sendInAppNotification(event, rule);
        }
      }
    }
  }

  ruleMatches(event, rule) {
    // Your matching logic
  }
}
```

### 5.3 Custom Analytics

**Generate Custom Reports:**

Create `backend/src/services/customReportsService.js`:
```javascript
export class CustomReportsService {
  async generateCustomReport(reportType, tenantConfig) {
    switch (reportType) {
      case 'department_performance':
        return this.departmentPerformanceReport(tenantConfig);
      case 'user_productivity':
        return this.userProductivityReport(tenantConfig);
      case 'task_completion_rate':
        return this.taskCompletionReport(tenantConfig);
      case 'budget_utilization':
        return this.budgetUtilizationReport(tenantConfig);
      default:
        return null;
    }
  }

  async departmentPerformanceReport(config) {
    const departments = await Department.find({ tenantId: config.tenantId });
    
    const report = await Promise.all(
      departments.map(async (dept) => {
        const tasks = await Task.find({ department: dept.id });
        const completed = tasks.filter(t => t.status === 'completed').length;
        const avgTime = this.calculateAvgCompletionTime(tasks);
        
        return {
          department: dept.name,
          totalTasks: tasks.length,
          completedTasks: completed,
          completionRate: ((completed / tasks.length) * 100).toFixed(2),
          avgCompletionTime: avgTime,
        };
      })
    );

    return {
      reportType: 'Department Performance',
      generatedAt: new Date(),
      data: report,
    };
  }
}
```

---

## API Customization & Extensions

### 6.1 Custom API Endpoints

**Create Custom Endpoints Route:**

Create `backend/src/routes/customRoutes.js`:
```javascript
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as customService from '../services/customService.js';

const router = express.Router();

// Custom dashboard endpoint
router.get('/custom/dashboard', requireAuth, async (req, res) => {
  try {
    const dashboardData = await customService.getDashboardData(
      req.user.id,
      req.user.tenantId
    );
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Custom reporting endpoint
router.post('/custom/reports/:reportType', requireAuth, async (req, res) => {
  try {
    const report = await customService.generateReport(
      req.params.reportType,
      req.body.filters,
      req.user.tenantId
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Custom webhook endpoint
router.post('/custom/webhooks', async (req, res) => {
  try {
    const result = await customService.handleWebhook(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

Register in `backend/src/app.js`:
```javascript
import customRoutes from './routes/customRoutes.js';
app.use('/api', customRoutes);
```

### 6.2 Custom Middleware

**Authorization Middleware:**

Create `backend/src/middleware/customAuth.js`:
```javascript
export async function enforceCustomRules(req, res, next) {
  const tenantId = req.user?.tenantId;
  const customRules = await getCustomAuthRules(tenantId);

  // IP whitelist check
  if (customRules?.ipWhitelist?.length > 0) {
    const clientIp = req.ip;
    if (!customRules.ipWhitelist.includes(clientIp)) {
      return res.status(403).json({ error: 'IP not whitelisted' });
    }
  }

  // Rate limiting
  if (customRules?.rateLimits) {
    const isAllowed = await checkRateLimit(req.user.id, customRules);
    if (!isAllowed) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
  }

  // Time-based access
  if (customRules?.accessHours) {
    const currentHour = new Date().getHours();
    const [start, end] = customRules.accessHours;
    if (currentHour < start || currentHour >= end) {
      return res.status(403).json({ error: 'Access outside allowed hours' });
    }
  }

  next();
}
```

### 6.3 API Versioning

**Support Multiple API Versions:**

```javascript
// backend/src/routes/v1/tasks.js
export async function getTasks(req, res) {
  const tasks = await Task.find({ tenantId: req.user.tenantId });
  res.json(tasks);
}

// backend/src/routes/v2/tasks.js
export async function getTasks(req, res) {
  const tasks = await Task.find({ tenantId: req.user.tenantId });
  res.json({
    version: '2.0',
    timestamp: new Date(),
    data: tasks,
    pagination: { page: 1, limit: 50, total: tasks.length },
  });
}

// Register both
app.use('/api/v1', routesV1);
app.use('/api/v2', routesV2);
```

---

## Multi-Tenancy Configuration

### 7.1 Tenant Isolation

**Multi-Tenant Model:**

Create `backend/src/models/Tenant.js`:
```javascript
const tenantSchema = new Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  domain: String,
  status: { type: String, enum: ['active', 'inactive', 'suspended'] },
  
  // Configuration
  config: {
    appName: String,
    theme: {
      primaryColor: String,
      secondaryColor: String,
    },
    features: {
      enableEmails: { type: Boolean, default: true },
      enableNotifications: { type: Boolean, default: true },
      enableReporting: { type: Boolean, default: true },
    },
    branding: {
      logoUrl: String,
      faviconUrl: String,
    },
  },

  // Resource limits
  limits: {
    maxUsers: Number,
    maxTasks: Number,
    storageQuotaMb: Number,
  },

  // Subscription
  subscription: {
    plan: { type: String, enum: ['free', 'starter', 'professional', 'enterprise'] },
    status: { type: String, enum: ['active', 'expired', 'trial'] },
    validUntil: Date,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Tenant = model('Tenant', tenantSchema);
```

### 7.2 Tenant Context Middleware

```javascript
export async function tenantContext(req, res, next) {
  // Extract tenant from subdomain, header, or JWT
  const tenantId = extractTenantId(req);
  
  // Load tenant configuration
  const tenant = await Tenant.findById(tenantId);
  
  if (!tenant || tenant.status !== 'active') {
    return res.status(404).json({ error: 'Tenant not found or inactive' });
  }

  // Store in request context
  req.tenant = tenant;
  req.user.tenantId = tenantId;

  next();
}

function extractTenantId(req) {
  // From subdomain: app.tenant1.com
  const match = req.hostname.match(/^([a-z0-9-]+)\./);
  if (match) return match[1];

  // From header
  return req.headers['x-tenant-id'];
}
```

### 7.3 Data Isolation Queries

**Ensure all queries include tenant filter:**

```javascript
// Good - tenant isolated
const tasks = await Task.find({ 
  tenantId: req.user.tenantId,
  assigned_to: userId,
});

// Bad - could leak data across tenants
const tasks = await Task.find({ 
  assigned_to: userId,
});

// Create query builder helper
export function withTenant(query, tenantId) {
  return query.where({ tenantId });
}

// Usage
const tasks = withTenant(
  Task.find({ assigned_to: userId }),
  req.user.tenantId
);
```

---

## Integration Points

### 8.1 External System Integration

**Webhook Integration:**

Create `backend/src/services/webhookService.js`:
```javascript
export class WebhookService {
  async registerWebhook(url, events, tenantId) {
    const webhook = await Webhook.create({
      id: generateId(),
      url,
      events,
      tenantId,
      status: 'active',
    });

    return webhook;
  }

  async triggerWebhooks(event, data, tenantId) {
    const webhooks = await Webhook.find({
      tenantId,
      events: event,
      status: 'active',
    });

    for (const webhook of webhooks) {
      try {
        await axios.post(webhook.url, {
          event,
          data,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error(`Webhook ${webhook.id} failed:`, error);
        // Retry logic, alert admin, etc.
      }
    }
  }
}

// Trigger on task update
Task.post('save', async function(doc) {
  await webhookService.triggerWebhooks('task.updated', doc, doc.tenantId);
});
```

### 8.2 Third-Party API Integration

**CRM Integration (Salesforce, HubSpot, etc.):**

Create `backend/src/services/crmIntegration.js`:
```javascript
export class CRMIntegrationService {
  constructor(platform, credentials) {
    this.platform = platform;
    this.credentials = credentials;
  }

  async syncContacts() {
    if (this.platform === 'salesforce') {
      const sfdc = new Salesforce(this.credentials);
      const contacts = await sfdc.query('SELECT Id, Name, Email FROM Contact');
      
      for (const contact of contacts) {
        await User.findOrCreate({
          email: contact.Email,
          externalId: contact.Id,
          source: 'salesforce',
        });
      }
    }
  }

  async createLeadFromTask(task) {
    const payload = {
      firstName: task.created_by_user?.firstName,
      lastName: task.created_by_user?.lastName,
      email: task.created_by_user?.email,
      company: task.department?.name,
      description: task.title,
    };

    if (this.platform === 'salesforce') {
      await this.sfdc.create('Lead', payload);
    }
  }
}
```

### 8.3 Business Intelligence Integration

**BI Tool Connection (Tableau, PowerBI, etc.):**

```javascript
// Export data in BI-compatible format
export async function exportForBI(tenantId, format = 'csv') {
  const tasks = await Task.find({ tenantId });
  const users = await User.find({ tenantId });
  const departments = await Department.find({ tenantId });

  const dataset = {
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      assignedTo: t.assigned_to,
      department: t.department,
      priority: t.priority,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    })),
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.department,
      role: u.role,
    })),
    departments: departments.map(d => ({
      id: d.id,
      name: d.name,
      parentId: d.parent_id,
    })),
  };

  if (format === 'csv') {
    return convertToCSV(dataset);
  } else if (format === 'json') {
    return dataset;
  }
}
```

---

## Deployment Specific Customization

### 9.1 Government-Specific Requirements

**Compliance & Audit Logging:**

Create `backend/src/middleware/auditLogging.js`:
```javascript
export async function auditLog(req, res, next) {
  const startTime = Date.now();

  // Capture response
  const originalJson = res.json;
  res.json = function(data) {
    // Log audit trail
    AuditLog.create({
      id: generateId(),
      userId: req.user?.id,
      action: `${req.method} ${req.path}`,
      resource: getResourceFromPath(req.path),
      changes: data,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: res.statusCode,
      duration: Date.now() - startTime,
      tenantId: req.user?.tenantId,
      timestamp: new Date(),
    });

    return originalJson.call(this, data);
  };

  next();
}
```

**Data Retention & Deletion:**

```javascript
export async function enforceDataRetention(tenantConfig) {
  const retentionDays = tenantConfig?.dataRetentionDays || 2555; // 7 years

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // Archive old completed tasks
  const oldTasks = await Task.find({
    status: 'completed',
    completedAt: { $lt: cutoffDate },
  });

  await TaskArchive.insertMany(oldTasks);
  await Task.deleteMany({
    status: 'completed',
    completedAt: { $lt: cutoffDate },
  });
}
```

### 9.2 Healthcare-Specific Requirements

**HIPAA Compliance:**

```javascript
export async function enforceHIPAACompliance(req, res, next) {
  // Encrypt sensitive fields
  if (req.body?.patientData) {
    req.body.patientData = encryptData(req.body.patientData);
  }

  // Audit access
  await HIPAAAccessLog.create({
    userId: req.user.id,
    resource: req.path,
    action: req.method,
    timestamp: new Date(),
  });

  // Check for minimum access level
  if (req.user.hipaaAccessLevel < 3) {
    return res.status(403).json({ error: 'Insufficient HIPAA access level' });
  }

  next();
}

function encryptData(data) {
  const key = Buffer.from(process.env.HIPAA_ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return { encrypted, iv: iv.toString('hex') };
}
```

### 9.3 Financial Services Customization

**PCI-DSS Compliance:**

```javascript
export async function enforcePCIDSSCompliance(req, res, next) {
  // Never log payment data
  if (hasPaymentData(req.body)) {
    req.sensitivePayload = true;
  }

  // Enforce encryption for payment routes
  if (req.path.includes('/payments')) {
    if (!req.secure && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'HTTPS required for payment routes' });
    }
  }

  next();
}

export async function tokenizePaymentData(paymentData) {
  // Use Stripe or other tokenization service
  const token = await stripe.tokens.create({
    card: paymentData,
  });

  return token.id; // Store token instead of actual card data
}
```

---

## Customization Best Practices

### 10.1 Code Organization

**Directory Structure for Customizations:**

```
backend/
├── src/
│   ├── core/              # Core GovFlow code
│   ├── customizations/    # Organization-specific code
│   │   ├── handlers/      # Custom event handlers
│   │   ├── middleware/    # Custom middleware
│   │   ├── routes/        # Custom routes
│   │   ├── services/      # Custom business logic
│   │   └── models/        # Custom fields/models
│   └── tenants/           # Tenant-specific configs
│       └── [tenant-id]/
│           ├── config.json
│           ├── workflows.json
│           └── theme.json
```

### 10.2 Version Management

**Track Customizations:**

Create `backend/CUSTOMIZATIONS.md`:
```markdown
# Customizations for [Client Name]

## Level 1: Branding
- Logo: Updated
- Colors: Custom theme applied
- Domain: yourdomain.com

## Level 2: Workflow
- Added custom workflow stages
- Custom approval chain (3 levels)
- Email routing rules configured

## Level 3: Business Logic
- Auto-assignment based on skills
- Custom reporting dashboard
- Department-specific rules

## Level 4: API Extensions
- Custom metrics endpoint
- Webhook integration
- CRM sync (Salesforce)

## Maintenance Notes
- Last updated: 2026-04-15
- Modified by: [Team Member]
- Testing completed: Yes
- Deployment risk: Low
```

### 10.3 Testing Customizations

**Unit Tests for Custom Logic:**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { CustomTaskAutomation } from '../services/customTaskAutomation';

describe('CustomTaskAutomation', () => {
  let automation;
  let mockTenantConfig;

  beforeEach(() => {
    automation = new CustomTaskAutomation();
    mockTenantConfig = {
      useSkillBasedAssignment: true,
    };
  });

  it('should auto-assign based on skills', async () => {
    const mockTask = {
      requiredSkills: ['JavaScript', 'React'],
      department: 'engineering',
    };

    const assignee = await automation.findMostQualified(mockTask);
    expect(assignee).toBeDefined();
    expect(assignee.skills).toContain('JavaScript');
  });

  it('should handle edge cases', async () => {
    const mockTask = { requiredSkills: ['Rare-Skill'] };
    const assignee = await automation.findMostQualified(mockTask);
    expect(assignee).toBeNull();
  });
});
```

### 10.4 Documentation

**Document All Customizations:**

```markdown
# Customization Guide for [Client]

## Overview
This document outlines all customizations made to GovFlow for [Client Organization].

## Architecture Decisions
- Reason for each customization
- Trade-offs considered
- Alternative approaches rejected

## Implementation Details
- Code locations
- API changes
- Database schema extensions

## Testing Results
- Test coverage percentage
- Test results
- Known limitations

## Deployment Instructions
1. Prerequisites
2. Step-by-step deployment
3. Rollback procedure
4. Verification steps

## Maintenance Plan
- Regular updates required
- Monitoring points
- Support contacts
```

### 10.5 Upgrade Path

**Maintain Compatibility with Core Updates:**

```javascript
// Use adapters to stay compatible with core updates
export class CompatibilityAdapter {
  // Map new core functions to custom implementations if needed
  async coreTaskCreate(taskData) {
    // Pre-process with custom logic
    const processedData = await this.customPreprocessor(taskData);
    
    // Call core function
    const task = await coreTaskService.create(processedData);
    
    // Post-process with custom logic
    return await this.customPostprocessor(task);
  }
}
```

---

## Examples by Industry

### E-Government

**Features:**
- Citizen-facing portals
- Case management workflows
- Digital signature support
- Multi-language support
- Accessibility (WCAG) compliance

### Corporate Enterprise

**Features:**
- Department budgeting
- Resource allocation
- Cross-company workflows
- Advanced reporting
- SSO integration

### Healthcare

**Features:**
- Patient management workflows
- Clinical decision support
- HIPAA compliance
- Provider credentialing
- Claims processing

### Financial Services

**Features:**
- Loan origination workflows
- KYC/AML compliance
- Document management
- Audit trails
- Multi-signature approvals

---

## Support and Maintenance

### Customization Change Control

| Phase | Owner | Duration |
|-------|-------|----------|
| Planning | Business Analyst | 1 week |
| Design | Architect | 1 week |
| Development | Developer | 2-4 weeks |
| Testing | QA | 1 week |
| Deployment | DevOps | 2-3 days |
| Documentation | Tech Writer | Ongoing |

### Ongoing Support SLA

- Critical issues: 4-hour response
- Feature enhancements: 2-week turnaround
- Documentation updates: 1-week turnaround

---

## Conclusion

GovFlow is highly customizable at multiple levels. Choose the appropriate customization level for your use case, follow best practices, and maintain clear documentation for long-term success.

For support, contact: support@govflow.ai

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-15  
**Next Review:** 2026-06-15
