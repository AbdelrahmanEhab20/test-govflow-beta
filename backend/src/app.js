import express from "express";
import cors from "cors";
import morgan from "morgan";
import session from 'express-session';
import path from "node:path";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { attachUser } from "./middleware/auth.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import tasksRoutes from "./routes/tasksRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import departmentsRoutes from "./routes/departmentsRoutes.js";
import workflowRoutes from "./routes/workflowRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import notificationPreferencesRoutes from "./routes/notificationPreferencesRoutes.js";
import routingRulesRoutes from "./routes/routingRulesRoutes.js";
import rbacRoutes from "./routes/rbacRoutes.js";
import approvalsRoutes from "./routes/approvalsRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import microsoftAuthRoutes from './routes/microsoftAuthRoutes.js';
import googleAuthRoutes from './routes/googleAuthRoutes.js';

const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-User-Id"],
    credentials: true,
  }),
);

// ─── Request parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Session (used for OAuth state and callback correlation) ─────────────────
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 1000 * 60 * 30,
    },
  })
);

// ─── Static uploads ───────────────────────────────────────────────────────────
const uploadsPath = path.resolve(process.cwd(), config.uploadsDir);
app.use("/uploads", express.static(uploadsPath));

// ─── HTTP request logging ─────────────────────────────────────────────────────
app.use(morgan("dev"));

// ─── Auth: attach user if header/token present ────────────────────────────────
app.use(attachUser);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use('/auth/microsoft', microsoftAuthRoutes);
app.use('/auth/google', googleAuthRoutes);
app.use(tasksRoutes);
app.use(emailRoutes);
app.use(departmentsRoutes);
app.use(workflowRoutes);
app.use(notificationsRoutes);
app.use(notificationPreferencesRoutes);
app.use(routingRulesRoutes);
app.use(rbacRoutes);
app.use(approvalsRoutes);
app.use(analyticsRoutes);
app.use(usersRoutes);

// ─── Not found ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
