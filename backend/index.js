const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const riskRoutes = require("./routes/risk.js");
const householdRoutes = require("./routes/household");
const statementRoutes = require("./routes/statement");

// Load environment variables from .env file (for local dev)
// On Render, env vars are set in dashboard and don't need .env file
dotenv.config();

const app = express();
app.use(cors());
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
