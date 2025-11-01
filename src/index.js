import express from "express";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();
const app = express();
const port = 3000;

// parse JSON bodies for POST requests
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log(process.env.DB_PASSWORD);

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM test_table");
    // send only the rows as JSON so the client receives usable data
    return res.json({ messages: result.rows });
  } catch (err) {
    console.error("Database error on GET /:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO test_table (message) VALUES ($1) RETURNING *",
      [message]
    );
    res.status(201).json(result.rows[0]); // return inserted row
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Ensure required table exists, then start the server
(async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS test_table (
      id SERIAL PRIMARY KEY,
      message TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`);
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (err) {
    console.error("Failed to ensure DB schema:", err);
    process.exit(1);
  }
})();