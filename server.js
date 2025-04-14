import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import bodyParser from "body-parser";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.static(path.join(__dirname, "dist")));
app.use(bodyParser.json());

// Spotify API credentials from environment variables
const CLIENT_ID =
  process.env.VITE_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET =
  process.env.VITE_SPOTIFY_CLIENT_SECRET || process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://127.0.0.1:3000";

// Route to exchange code for token
app.post("/api/token", async (req, res) => {
  try {
    const { code, code_verifier } = req.body;

    if (!code || !code_verifier) {
      return res.status(400).json({
        error:
          "Missing required parameters: code and code_verifier are required",
      });
    }

    console.log(
      `Exchanging code for token. Code verifier length: ${code_verifier.length}`
    );
    console.log(`Code verifier sample: ${code_verifier.substring(0, 10)}...`);
    console.log(`Code sample: ${code.substring(0, 10)}...`);

    // Exchange the authorization code for an access token
    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    if (CLIENT_SECRET) {
      params.append("client_secret", CLIENT_SECRET);
    }
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", REDIRECT_URI);
    params.append("code_verifier", code_verifier);

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Return the access token and related data
    return res.json(response.data);
  } catch (error) {
    console.error(
      "Token exchange error:",
      error.response?.data || error.message
    );
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error_description || error.message,
      details: error.response?.data || {},
    });
  }
});

// Serve React app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Spotify client ID: ${CLIENT_ID ? "✅ Set" : "❌ Missing"}`);
  console.log(
    `Spotify client secret: ${
      CLIENT_SECRET ? "✅ Set" : "❌ Missing (optional for PKCE)"
    }`
  );
  console.log(`Redirect URI: ${REDIRECT_URI}`);
});
