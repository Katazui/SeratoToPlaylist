import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  background-color: rgba(25, 20, 20, 0.1);
`;

const LoginButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #1db954;
  color: white;
  border: none;
  font-weight: bold;
  &:hover {
    background-color: #1aa34a;
    border-color: #1aa34a;
  }
`;

const DisconnectButton = styled.button`
  background-color: #666;
  color: white;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  &:hover {
    background-color: #888;
  }
`;

// Spotify logo component
const SpotifyLogo = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM16.5563 16.5563C16.385 16.7275 16.1425 16.8137 15.9 16.8137C15.6575 16.8137 15.415 16.7275 15.2438 16.5563C13.5612 14.8738 11.1125 14.0887 8.4375 14.0887C7.93375 14.0887 7.43 14.1175 6.935 14.1763C6.51875 14.2237 6.125 13.9225 6.07625 13.5062C6.02875 13.09 6.33 12.6962 6.74625 12.6487C7.31 12.585 7.87375 12.5525 8.4375 12.5525C11.5187 12.5525 14.3687 13.4613 16.3438 15.4362C16.6862 15.7788 16.6862 16.3425 16.5563 16.5563ZM17.9 13.7975C17.6887 14.0087 17.3875 14.115 17.0863 14.115C16.785 14.115 16.4838 14.0087 16.2725 13.7975C14.2388 11.765 11.1813 10.825 7.74875 10.825C7.12 10.825 6.49125 10.8613 5.8625 10.935C5.37625 10.9887 4.91625 10.6488 4.8625 10.165C4.80875 9.68125 5.14875 9.21875 5.6325 9.165C6.33625 9.08375 7.0425 9.04375 7.74875 9.04375C11.5775 9.04375 15.0137 10.1062 17.3537 12.445C17.775 12.8662 17.775 13.5337 17.9 13.7975ZM19.1875 10.475C18.9762 10.6862 18.675 10.7925 18.3737 10.7925C18.0725 10.7925 17.7712 10.6862 17.56 10.475C15.1562 8.07125 11.4587 6.92 7.335 6.92C6.48125 6.92 5.6275 6.9675 4.7825 7.065C4.29625 7.125 3.84125 6.78 3.78125 6.29C3.72125 5.8 4.06625 5.345 4.55625 5.285C5.48 5.18 6.4075 5.125 7.335 5.125C11.8825 5.125 15.9587 6.4025 18.67 9.115C19.09 9.535 19.09 10.2025 19.1875 10.475Z"
      fill="white"
    />
  </svg>
);

function SpotifyLogin({ onLogin, setToken }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate a random string of specified length
  function generateRandomString(length) {
    const charset =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let text = "";
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      text += charset.charAt(randomValues[i] % charset.length);
    }
    return text;
  }

  // Base64 URL encoding function
  function base64UrlEncode(arrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  // Generate code challenge from verifier using SHA-256
  async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return base64UrlEncode(digest);
  }

  // Handle Spotify login
  async function loginToSpotify() {
    try {
      // Generate and store code verifier (between 43-128 chars)
      const codeVerifier = generateRandomString(96);

      // Log the code verifier for debugging
      console.log("Generated code verifier:", codeVerifier);
      console.log("Code verifier length:", codeVerifier.length);

      localStorage.setItem("spotifyCodeVerifier", codeVerifier);

      // Generate random state
      const state = generateRandomString(16);
      localStorage.setItem("spotifyState", state);

      // Generate code challenge from verifier
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      console.log("Generated code challenge:", codeChallenge);

      // Spotify API scopes
      const scope = [
        "user-read-private",
        "user-read-email",
        "playlist-modify-public",
        "playlist-modify-private",
      ].join(" ");

      // Build authorization URL
      const spotifyAuthUrl = new URL("https://accounts.spotify.com/authorize");
      spotifyAuthUrl.searchParams.append(
        "client_id",
        import.meta.env.VITE_SPOTIFY_CLIENT_ID
      );
      spotifyAuthUrl.searchParams.append("response_type", "code");
      spotifyAuthUrl.searchParams.append(
        "redirect_uri",
        "http://127.0.0.1:3000"
      );
      spotifyAuthUrl.searchParams.append("scope", scope);
      spotifyAuthUrl.searchParams.append("code_challenge_method", "S256");
      spotifyAuthUrl.searchParams.append("code_challenge", codeChallenge);
      spotifyAuthUrl.searchParams.append("state", state);

      // Redirect to Spotify authorization
      window.location.href = spotifyAuthUrl.toString();
    } catch (error) {
      console.error("Error starting Spotify auth flow:", error);
    }
  }

  // Exchange code for token
  async function exchangeCodeForToken(code) {
    try {
      // Get the code verifier from localStorage
      const codeVerifier = localStorage.getItem("spotifyCodeVerifier");

      if (!codeVerifier) {
        console.error("No code verifier found in localStorage");
        throw new Error("Authentication failed: No code verifier found");
      }

      console.log("Exchanging code for token");
      console.log("Code verifier:", codeVerifier);
      console.log("Code verifier length:", codeVerifier.length);
      console.log("Code preview:", code.substring(0, 10) + "...");

      // Request access token from server
      const response = await axios.post("http://127.0.0.1:3001/api/token", {
        code,
        code_verifier: codeVerifier,
      });

      // Save token and update state
      const { access_token, refresh_token, expires_in } = response.data;

      if (access_token) {
        localStorage.setItem("spotifyAccessToken", access_token);
        localStorage.setItem("spotifyRefreshToken", refresh_token);
        localStorage.setItem(
          "spotifyTokenExpiry",
          JSON.stringify(Date.now() + expires_in * 1000)
        );

        // Only call setToken if it's a function
        if (typeof setToken === "function") {
          setToken(access_token);
        }

        setIsAuthenticated(true);

        // Only call onLogin if it's a function
        if (typeof onLogin === "function") {
          onLogin(true);
        }

        console.log("Successfully authenticated with Spotify");
      }
    } catch (error) {
      console.error(
        "Error exchanging code for token:",
        error.response?.data || error.message
      );

      // Clear localStorage on error to allow re-authentication
      localStorage.removeItem("spotifyCodeVerifier");
      localStorage.removeItem("spotifyState");
    } finally {
      // Clean up URL parameters
      window.history.replaceState({}, document.title, "/");
    }
  }

  // Check if a token is expired or will expire soon (within 5 minutes)
  function isTokenExpired() {
    const expiryTime = localStorage.getItem("spotifyTokenExpiry");
    if (!expiryTime) return true;

    // Check if token expires in less than 5 minutes
    return Date.now() > JSON.parse(expiryTime) - 5 * 60 * 1000;
  }

  function disconnectFromSpotify() {
    // Remove tokens from localStorage
    localStorage.removeItem("spotifyAccessToken");
    localStorage.removeItem("spotifyRefreshToken");
    localStorage.removeItem("spotifyTokenExpiry");
    localStorage.removeItem("spotifyState");
    localStorage.removeItem("spotifyCodeVerifier");

    // Reset state
    setIsAuthenticated(false);

    // Only call setToken if it's a function
    if (typeof setToken === "function") {
      setToken("");
    }

    // Only call onLogin if it's a function
    if (typeof onLogin === "function") {
      onLogin(false);
    }
  }

  // Check if the URL contains a code parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const storedState = localStorage.getItem("spotifyState");
    const error = urlParams.get("error");

    if (error) {
      console.error("Spotify auth error:", error);
      setLoading(false);
      return;
    }

    // If there's a code in the URL, exchange it for a token
    if (code) {
      // Verify state parameter matches
      if (state && state === storedState) {
        exchangeCodeForToken(code).finally(() => {
          setLoading(false);
        });
      } else {
        console.error("State validation failed");
        localStorage.removeItem("spotifyState");
        localStorage.removeItem("spotifyCodeVerifier");
        setLoading(false);
      }
    } else {
      // Check if there's a token in localStorage
      const token = localStorage.getItem("spotifyAccessToken");

      // Check if token exists and is not expired
      if (token && !isTokenExpired()) {
        // Token is valid
        if (typeof setToken === "function") {
          setToken(token);
        }

        setIsAuthenticated(true);

        if (typeof onLogin === "function") {
          onLogin(true);
        }
      } else if (token && isTokenExpired()) {
        // Token exists but is expired, clear it
        console.log("Spotify token expired, clearing session");
        disconnectFromSpotify();
      }

      setLoading(false);
    }
  }, []);

  return (
    <LoginContainer id="spotify-login-container">
      <h2>Login to Spotify</h2>
      <p>
        You need to login with your Spotify account to search for tracks and
        create playlists.
      </p>
      {loading ? (
        <p>Loading...</p>
      ) : isAuthenticated ? (
        <div className="authenticated">
          <p>✅ Connected to Spotify</p>
          <DisconnectButton onClick={disconnectFromSpotify}>
            Disconnect from Spotify
          </DisconnectButton>
        </div>
      ) : (
        <LoginButton onClick={loginToSpotify}>
          <SpotifyLogo /> Connect to Spotify
        </LoginButton>
      )}
      <p>Note: You'll need a Spotify account to use this tool.</p>
    </LoginContainer>
  );
}

export default SpotifyLogin;
