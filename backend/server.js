require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoute");
const leadRoutes = require("./routes/leadRoute");
const userRoutes = require("./routes/userRoute");

const app = express();

/* ================= CONNECT DB ================= */
connectDB();

// Start Scheduler
const { startScheduler } = require("./services/scheduler");
startScheduler();

/* ================= MIDDLEWARE ================= */
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL // Allow Production Frontend
  ].filter(Boolean),
  credentials: true
}));

console.log("✅ CORS configured for: http://localhost:5173, http://localhost:5174");

app.use(express.json()); // parse JSON bodies
app.use("/uploads", express.static("uploads")); // Serve uploaded files

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", require("./routes/aiRoute"));
app.use("/api/portals", require("./routes/portalRoute"));
app.use("/api/events", require("./routes/eventRoute"));
app.use("/api/notifications", require("./routes/notificationRoute"));
app.use("/api/partners", require("./routes/partnerRoute"));
app.use("/api/company-profile", require("./routes/companyProfileRoute"));
app.use("/api/proposals", require("./routes/proposalRoute"));
app.use("/api/state-org", require("./routes/stateOrgRoute"));
app.use("/api/credentials", require("./routes/credentialRoute"));
app.use("/api/state-cio", require("./routes/stateCIORoute"));


/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("CRM API is running 🚀");
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.originalUrl}`
  });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    message: "Internal Server Error"
  });
});

/* ================= START SERVER ================= */
/* ================= START SERVER ================= */
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Make io accessible to our router
app.set("io", io);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server (Socket.io) running on http://localhost:${PORT}`);
});
