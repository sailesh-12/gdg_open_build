const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const riskRoutes = require("./routes/risk.js");
const householdRoutes = require("./routes/household");
const statementRoutes = require("./routes/statement");

// Load environment variables from .env file (for local dev)
// On Render, env vars are set in dashboard and don't need .env file
dotenv.config();

// CORS configuration for Vercel and local development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://gdg-open-build.vercel.app'
    ];

    // Check if origin matches exactly or is a Vercel deployment
    if (allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());



// Custom error handler for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Invalid JSON payload:", err.message);
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  next();
});

app.use("/household", householdRoutes);
app.use("/risk", riskRoutes);
app.use("/statement", statementRoutes);

app.get("/", (req, res) => {
  res.send("GDG Open Build Backend");
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
