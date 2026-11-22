const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db");

connectDB();

const app = express();
// Enable trust proxy for Railway's single-hop load balancer (1 = one proxy level)
app.set("trust proxy", 1);

// Gzip compress all responses — reduces JSON size by ~70%
app.use(compression());

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://www.kalaagalyaherbals.in",
  "https://kalaagalyaherbals.in",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for cross-domain API compatibility under load balancer
  },
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Security: Sanitize inputs to prevent NoSQL injection
app.use(mongoSanitize());

// Security: Global rate limiter — 1000 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health" || req.path === "/api/health" // Skip health checks from rate limits
});
app.use(globalLimiter);

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Dedicated Load Balancer Health Check Endpoints
const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production"
  });
};
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/admin/orders", require("./routes/adminOrderRoutes"));
app.use("/api/admin/whatsapp-orders", require("./routes/adminWhatsAppOrderRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/banners", require("./routes/bannerRoutes"));
app.use("/api/queries", require("./routes/queryRoutes"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Kala Agalya Herbals API Server is running cleanly." });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Graceful shutdown handling for load balancer instance rotation & auto-scaling
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Gracefully shutting down server...`);
  server.close(() => {
    console.log("HTTP server closed. Exiting process.");
    process.exit(0);
  });
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
