import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Papa from "papaparse";
import SpotifyWebApi from "spotify-web-api-js";
import CsvUploader from "./components/CsvUploader";
import TrackList from "./components/TrackList";
import SpotifyLogin from "./components/SpotifyLogin";
import PlaylistCreator from "./components/PlaylistCreator";
import Spinner from "./components/Spinner";
import { extractTracksFromCsv } from "./utils/csvParser";
import { musicAPI, SpotifyAPI, AppleMusicAPI } from "./utils/apiServices";
import APISettings from "./components/APISettings";

const spotifyApi = new SpotifyWebApi();

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const AppleMusicLoginButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #fc3c44;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    background-color: #e02d3a;
  }
`;

const AppleMusicLoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  background-color: rgba(252, 60, 68, 0.1);
`;

const App = () => {
  const [csvData, setCsvData] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [spotifyToken, setSpotifyToken] = useState("");
  const [appleMusicToken, setAppleMusicToken] = useState("");
  const [appleMusicInstance, setAppleMusicInstance] = useState(null);
  const [isAppleMusicAuthorized, setIsAppleMusicAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [exportFormat, setExportFormat] = useState("csv");
  const [bypassRateLimits, setBypassRateLimits] = useState(false);
  const [apiSettings, setApiSettings] = useState({
    musicbrainz: true,
    discogs: true,
    lastfm: true, // Enable by default, will be disabled if no API key
    spotify: false, // Requires authentication
    applemusic: false, // Requires developer token
  });

  // Exchange authorization code for access token
  const getSpotifyAccessToken = async (code) => {
    try {
      setLoading(true);
      setError("");

      // Get the code verifier from localStorage
      const codeVerifier = localStorage.getItem("spotifyCodeVerifier");

      console.log(
        "Retrieved code verifier from localStorage:",
        codeVerifier ? codeVerifier.substring(0, 20) + "..." : "null"
      );

      if (!codeVerifier) {
        throw new Error("No code verifier found. Please try logging in again.");
      }

      // Call our server-side endpoint to exchange code for token
      console.log(
        "Exchanging code for token with code verifier length:",
        codeVerifier.length
      );

      const response = await fetch("http://127.0.0.1:3001/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          code_verifier: codeVerifier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Token exchange failed:", data);
        throw new Error(data.error || "Failed to get access token");
      }

      console.log("Token exchange successful");

      // Set access token and configure the Spotify API
      const accessToken = data.access_token;
      setSpotifyToken(accessToken);
      spotifyApi.setAccessToken(accessToken);

      // Register Spotify API with the orchestrator
      const spotifyService = new SpotifyAPI(spotifyApi);
      musicAPI.registerService("spotify", spotifyService);

      // Enable Spotify API in settings
      setApiSettings((prev) => ({
        ...prev,
        spotify: true,
      }));

      // Clear URL parameters
      window.history.replaceState({}, document.title, "/");

      setLoading(false);
    } catch (error) {
      console.error("Error getting access token:", error);
      setError("Failed to authenticate with Spotify: " + error.message);
      setLoading(false);
    }
  };

  // Check if authorization code exists in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const urlError = urlParams.get("error");

    // Check for existing Spotify token in localStorage
    const existingToken = localStorage.getItem("spotifyAccessToken");
    const tokenExpiry = localStorage.getItem("spotifyTokenExpiry");

    if (existingToken && tokenExpiry && Date.now() < JSON.parse(tokenExpiry)) {
      // If token exists and is valid, set it and enable Spotify
      setSpotifyToken(existingToken);
      spotifyApi.setAccessToken(existingToken);

      // Register Spotify API with the orchestrator
      const spotifyService = new SpotifyAPI(spotifyApi);
      musicAPI.registerService("spotify", spotifyService);

      // Enable Spotify API in settings
      setApiSettings((prev) => ({
        ...prev,
        spotify: true,
      }));
    }

    // Handle redirection if using localhost
    if (window.location.hostname === "localhost" && (code || urlError)) {
      // Replace localhost with 127.0.0.1 and redirect
      const newUrl = window.location.href.replace("localhost", "127.0.0.1");
      window.location.href = newUrl;
      return;
    }

    if (urlError) {
      setError(`Spotify authentication error: ${urlError}`);
      window.history.replaceState({}, document.title, "/");
      return;
    }

    if (code) {
      // Immediately hide the login container when processing an auth code
      const loginContainer = document.getElementById("spotify-login-container");
      if (loginContainer) {
        loginContainer.style.display = "none";
      }

      // Process the auth code
      getSpotifyAccessToken(code);
    }

    // Configure API services based on initial settings
    Object.entries(apiSettings).forEach(([key, enabled]) => {
      musicAPI.setServiceStatus(key, enabled);
    });
  }, []);

  // Update API settings when they change
  useEffect(() => {
    Object.entries(apiSettings).forEach(([key, enabled]) => {
      musicAPI.setServiceStatus(key, enabled);
    });
  }, [apiSettings]);

  // Handle rate limit bypass toggle
  const handleToggleRateLimitBypass = (bypass) => {
    setBypassRateLimits(bypass);
    musicAPI.setBypassRateLimits(bypass);
  };

  // Check for Discogs credentials
  useEffect(() => {
    const discogsKey = import.meta.env.VITE_DISCOGS_KEY;
    const discogsSecret = import.meta.env.VITE_DISCOGS_SECRET;

    if (!discogsKey || !discogsSecret) {
      console.warn("Discogs API credentials not found in .env file");
      // Set Discogs to disabled if credentials are missing
      setApiSettings((prev) => ({
        ...prev,
        discogs: false,
      }));
    } else {
      console.log("Discogs API credentials found");
    }

    // Check for Last.fm API key
    const lastfmKey = import.meta.env.VITE_LASTFM_API_KEY;
    if (!lastfmKey) {
      console.warn("Last.fm API key not found in .env file");
      // Set Last.fm to disabled if API key is missing
      setApiSettings((prev) => ({
        ...prev,
        lastfm: false,
      }));
    } else {
      console.log("Last.fm API key found");
    }

    // Check for Apple Music developer token
    const appleMusicDevToken = import.meta.env.VITE_APPLE_DEVELOPER_TOKEN;
    const isValidToken =
      appleMusicDevToken &&
      appleMusicDevToken !== "your_token_here" &&
      appleMusicDevToken.length > 20;

    if (isValidToken) {
      console.log("Apple Music developer token found");
      // Enable Apple Music if developer token is available
      setApiSettings((prev) => ({
        ...prev,
        applemusic: true,
      }));

      // Configure Apple Music API
      const appleMusicService = new AppleMusicAPI(appleMusicDevToken);
      musicAPI.registerService("applemusic", appleMusicService);
    } else {
      console.warn("Valid Apple Music developer token not found in .env file");
      // Explicitly disable Apple Music in settings
      setApiSettings((prev) => ({
        ...prev,
        applemusic: false,
      }));
      // Register disabled service
      const appleMusicService = new AppleMusicAPI();
      musicAPI.registerService("applemusic", appleMusicService);
    }
  }, []);

  // Handle Spotify login
  const handleSpotifyLogin = (isLoggedIn) => {
    if (isLoggedIn) {
      // Enable Spotify in the API settings when logged in
      setApiSettings((prev) => ({
        ...prev,
        spotify: true,
      }));

      // If there are existing search results, refresh the search with Spotify enabled
      if (tracks.length > 0) {
        searchTracks(tracks);
      }
    } else {
      // Disable Spotify in API settings when logged out
      setApiSettings((prev) => ({
        ...prev,
        spotify: false,
      }));
      spotifyApi.setAccessToken("");
      setSpotifyToken("");
    }
  };

  const handleCsvUpload = (file) => {
    setLoading(true);
    setError("");

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setCsvData(results.data);
        const extractedTracks = extractTracksFromCsv(results.data);
        setTracks(extractedTracks);
        searchTracks(extractedTracks);
      },
      error: (error) => {
        setError("Error parsing CSV file: " + error.message);
        setLoading(false);
      },
    });
  };

  const searchTracks = async (tracks) => {
    setLoading(true);

    try {
      // Use the musicAPI orchestrator to search for tracks
      const results = await musicAPI.searchTracks(tracks);

      setSearchResults(results);

      // By default, select all matched tracks
      setSelectedTracks(
        results
          .filter((track) => track.matched)
          .map((track) => {
            // If it's from Spotify, use the URI, otherwise use the ID
            if (track.source === "spotify" && track.uri) {
              return track.uri;
            }
            // For other sources, create a custom ID
            return `${track.source}:${track.id}`;
          })
      );
    } catch (error) {
      setError("Error searching tracks: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare tracks specifically for Spotify playlist creation
  const prepareForSpotify = async () => {
    setLoading(true);
    setError("");

    try {
      if (!spotifyToken) {
        throw new Error("Please login to Spotify first");
      }

      if (!searchResults.length) {
        throw new Error(
          "No tracks to prepare. Please upload a CSV file first."
        );
      }

      // Filter tracks that weren't found on Spotify specifically
      const nonSpotifyTracks = searchResults.filter(
        (track) => track.matched && track.source !== "spotify"
      );

      if (nonSpotifyTracks.length === 0) {
        setError("All matched tracks are already from Spotify!");
        setLoading(false);
        return;
      }

      // Set CSV data to a special value to show the right spinner message
      setCsvData({ optimizingForSpotify: true });

      // Attempt to find these tracks on Spotify
      const improvedResults = [...searchResults];
      let spotifyMatchCount = 0;
      let tokenError = false;

      for (let i = 0; i < nonSpotifyTracks.length; i++) {
        const track = nonSpotifyTracks[i];
        try {
          // Search track on Spotify using more precise query
          const trackQuery = track.name.includes(" ")
            ? `"${track.name}"`
            : track.name;
          const artistQuery = track.artist.includes(" ")
            ? `"${track.artist}"`
            : track.artist;
          const query = `track:${trackQuery} artist:${artistQuery}`;

          const response = await spotifyApi.searchTracks(query, { limit: 1 });

          if (response.tracks.items.length > 0) {
            const spotifyTrack = response.tracks.items[0];

            // Find the track in our results array and update it
            const index = improvedResults.findIndex(
              (t) => t.name === track.name && t.artist === track.artist
            );

            if (index !== -1) {
              improvedResults[index] = {
                ...improvedResults[index],
                source: "spotify",
                id: spotifyTrack.id,
                uri: spotifyTrack.uri,
                spotifyName: spotifyTrack.name,
                spotifyArtist: spotifyTrack.artists[0].name,
                matched: true,
                matchConfidence: "high",
              };
              spotifyMatchCount++;
            }
          }
        } catch (err) {
          console.error(`Error matching ${track.name} on Spotify:`, err);
          // Check if error is due to expired token
          if (err.status === 401) {
            tokenError = true;
            break; // Stop processing if token is invalid
          }
        }
      }

      if (tokenError) {
        // Clear token and show login prompt
        setSpotifyToken("");
        localStorage.removeItem("spotifyAccessToken");
        localStorage.removeItem("spotifyTokenExpiry");
        localStorage.removeItem("spotifyRefreshToken");

        // Update API settings
        setApiSettings((prev) => ({
          ...prev,
          spotify: false,
        }));

        throw new Error("Spotify token expired. Please log in again.");
      }

      setSearchResults(improvedResults);

      // Update selected tracks to include newly found Spotify tracks
      setSelectedTracks(
        improvedResults
          .filter((track) => track.matched && track.source === "spotify")
          .map((track) => track.uri)
      );

      if (spotifyMatchCount > 0) {
        alert(
          `Successfully found ${spotifyMatchCount} additional tracks on Spotify!`
        );
      } else {
        setError("Couldn't find any additional tracks on Spotify.");
      }
    } catch (error) {
      setError("Error preparing for Spotify: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrackSelection = (trackId) => {
    setSelectedTracks((prev) => {
      if (prev.includes(trackId)) {
        return prev.filter((id) => id !== trackId);
      } else {
        return [...prev, trackId];
      }
    });
  };

  const handleApiSettingsChange = (newSettings) => {
    setApiSettings(newSettings);
  };

  const handleExportFormatChange = (format) => {
    setExportFormat(format);
  };

  const createPlaylist = async () => {
    // If the export format is 'spotify'
    if (exportFormat === "spotify") {
      if (!spotifyToken) {
        setError(
          "Spotify authentication required to create Spotify playlists. Please log in first."
        );
        return;
      }
      createSpotifyPlaylist();
    } else if (exportFormat === "applemusic") {
      if (!isAppleMusicAuthorized) {
        setError(
          "Apple Music authentication required to create Apple Music playlists. Please log in first."
        );
        return;
      }
      createAppleMusicPlaylist();
    } else if (exportFormat === "csv") {
      exportAsCSV();
    } else if (exportFormat === "json") {
      exportAsJSON();
    } else {
      setError(`Unsupported export format: ${exportFormat}`);
    }
  };

  const getSelectedTrackDetails = () => {
    return searchResults.filter((track) =>
      selectedTracks.includes(
        track.source === "spotify" ? track.uri : `${track.source}:${track.id}`
      )
    );
  };

  const exportAsCSV = () => {
    if (selectedTracks.length === 0) {
      setError("Please select at least one track");
      return;
    }

    try {
      const selectedTrackDetails = getSelectedTrackDetails();

      // Format for CSV
      const csvData = selectedTrackDetails.map((track) => ({
        name: track.name,
        artist: track.artist,
        matchConfidence: track.matchConfidence,
        source: track.source,
      }));

      // Convert to CSV
      const csv = Papa.unparse(csvData);

      // Create a download link
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${playlistName || "Serato_Playlist"}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setError("Error exporting as CSV: " + error.message);
    }
  };

  const exportAsJSON = () => {
    if (selectedTracks.length === 0) {
      setError("Please select at least one track");
      return;
    }

    try {
      const selectedTrackDetails = getSelectedTrackDetails();

      // Create playlist object
      const playlistData = {
        name:
          playlistName || `Serato Playlist ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        trackCount: selectedTrackDetails.length,
        tracks: selectedTrackDetails.map((track) => ({
          name: track.name,
          artist: track.artist,
          matchedName:
            track.source === "spotify" ? track.spotifyName : track.name,
          matchedArtist:
            track.source === "spotify" ? track.spotifyArtist : track.artist,
          id: track.id,
          uri: track.uri,
          source: track.source,
          matchConfidence: track.matchConfidence,
        })),
      };

      // Convert to JSON
      const json = JSON.stringify(playlistData, null, 2);

      // Create a download link
      const blob = new Blob([json], {
        type: "application/json;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${playlistName || "Serato_Playlist"}.json`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setError("Error exporting as JSON: " + error.message);
    }
  };

  const createSpotifyPlaylist = async () => {
    if (!spotifyToken) {
      setError("Spotify authentication required to create Spotify playlists");
      return;
    }

    if (selectedTracks.length === 0) {
      setError("Please select at least one track");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Filter for only Spotify URIs
      const spotifyUris = selectedTracks.filter((id) =>
        id.startsWith("spotify:")
      );

      if (spotifyUris.length === 0) {
        throw new Error(
          "No Spotify tracks selected. Only tracks matched with Spotify can be added to a Spotify playlist. Try using 'Find More Spotify Matches' or select tracks marked with the Spotify label."
        );
      }

      // Get current user's ID
      const user = await spotifyApi.getMe();

      // Create a new playlist
      const name =
        playlistName || `Serato Playlist ${new Date().toLocaleDateString()}`;
      const playlist = await spotifyApi.createPlaylist(user.id, {
        name,
        description: "Created with Serato to Playlist Converter",
        public: false,
      });

      // Add tracks to the playlist (in batches of 100 if needed)
      for (let i = 0; i < spotifyUris.length; i += 100) {
        const batch = spotifyUris.slice(i, i + 100);
        await spotifyApi.addTracksToPlaylist(playlist.id, batch);
      }

      alert(
        `Playlist "${name}" created successfully with ${spotifyUris.length} tracks!`
      );
    } catch (error) {
      setError("Error creating playlist: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Apple Music
  useEffect(() => {
    // Check if Apple Music JS was loaded
    if (window.MusicKit) {
      try {
        // Configure MusicKit JS
        const appleMusicDevToken = import.meta.env.VITE_APPLE_DEVELOPER_TOKEN;
        const isValidToken =
          appleMusicDevToken &&
          appleMusicDevToken !== "your_token_here" &&
          appleMusicDevToken.length > 20;

        if (!isValidToken) {
          console.warn(
            "Valid Apple Music developer token not found in .env file"
          );
          // Disable Apple Music in settings
          setApiSettings((prev) => ({
            ...prev,
            applemusic: false,
          }));
          return;
        }

        // Initialize MusicKit JS
        const musicKitInstance = window.MusicKit.configure({
          developerToken: appleMusicDevToken,
          app: {
            name: "Serato to Playlist Converter",
            build: "1.0.0",
          },
        });

        setAppleMusicInstance(musicKitInstance);

        // Check if already authorized
        if (musicKitInstance.isAuthorized) {
          handleAppleMusicAuthorization(true);
        }

        // Setup event listeners
        musicKitInstance.addEventListener(
          "authorizationStatusDidChange",
          () => {
            handleAppleMusicAuthorization(musicKitInstance.isAuthorized);
          }
        );
      } catch (error) {
        console.error("Error initializing Apple Music:", error);
        // Disable Apple Music in settings on error
        setApiSettings((prev) => ({
          ...prev,
          applemusic: false,
        }));
      }
    } else {
      console.warn("Apple MusicKit JS not loaded");
      // Disable Apple Music in settings if MusicKit isn't available
      setApiSettings((prev) => ({
        ...prev,
        applemusic: false,
      }));
    }
  }, []);

  const handleAppleMusicAuthorization = (isAuthorized) => {
    setIsAppleMusicAuthorized(isAuthorized);

    if (isAuthorized && appleMusicInstance) {
      // Set user's music token
      const userToken = appleMusicInstance.musicUserToken;
      setAppleMusicToken(userToken);

      // Enable Apple Music in the API settings
      setApiSettings((prev) => ({
        ...prev,
        applemusic: true,
      }));

      // Configure the Apple Music API with the user token
      const appleMusicDevToken = import.meta.env.VITE_APPLE_DEVELOPER_TOKEN;
      const appleMusicService = new AppleMusicAPI(
        appleMusicDevToken,
        userToken
      );
      appleMusicService.setStorefront(appleMusicInstance.storefrontId);
      musicAPI.registerService("applemusic", appleMusicService);

      // If there are existing search results, refresh the search with Apple Music enabled
      if (tracks.length > 0) {
        searchTracks(tracks);
      }
    } else {
      setAppleMusicToken("");
    }
  };

  const loginToAppleMusic = async () => {
    if (appleMusicInstance) {
      try {
        await appleMusicInstance.authorize();
      } catch (error) {
        console.error("Apple Music authorization error:", error);
        setError("Failed to authorize with Apple Music: " + error.message);
      }
    } else {
      setError("Apple Music is not initialized properly");
    }
  };

  const disconnectFromAppleMusic = () => {
    if (appleMusicInstance) {
      appleMusicInstance.unauthorize();
      setIsAppleMusicAuthorized(false);
      setAppleMusicToken("");

      // Disable Apple Music in the API settings
      setApiSettings((prev) => ({
        ...prev,
        applemusic: false,
      }));
    }
  };

  const createAppleMusicPlaylist = async () => {
    if (!isAppleMusicAuthorized || !appleMusicInstance) {
      setError(
        "Apple Music authentication required to create Apple Music playlists"
      );
      return;
    }

    if (selectedTracks.length === 0) {
      setError("Please select at least one track");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const selectedTrackDetails = getSelectedTrackDetails();

      // For Apple Music, we need to search for each track in their catalog first
      // unless it's already from Apple Music
      const songIds = [];

      for (const track of selectedTrackDetails) {
        try {
          if (track.source === "applemusic" && track.id) {
            // If track is already from Apple Music, use its ID
            songIds.push(track.id);
          } else {
            // Otherwise search for the track on Apple Music
            const query = `${track.name} ${track.artist}`;
            const results = await appleMusicInstance.api.search(query, {
              types: "songs",
              limit: 1,
            });

            if (results.songs && results.songs.data.length > 0) {
              const appleTrack = results.songs.data[0];
              songIds.push(appleTrack.id);
            }
          }
        } catch (err) {
          console.error(
            `Error finding track "${track.name}" on Apple Music:`,
            err
          );
        }
      }

      if (songIds.length === 0) {
        throw new Error("No tracks could be found on Apple Music");
      }

      // Create a new playlist
      const name =
        playlistName || `Serato Playlist ${new Date().toLocaleDateString()}`;

      const playlist = await appleMusicInstance.api.library.createPlaylist({
        name: name,
        description: "Created with Serato to Playlist Converter",
        items: songIds.map((id) => ({ type: "song", id })),
      });

      alert(
        `Playlist "${name}" created successfully with ${songIds.length} tracks!`
      );
    } catch (error) {
      console.error("Error creating Apple Music playlist:", error);
      setError(
        "Error creating Apple Music playlist: " +
          (error.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h1>Serato to Playlist Converter</h1>

      <APISettings
        settings={apiSettings}
        onChange={handleApiSettingsChange}
        spotifyAuthenticated={!!spotifyToken}
        appleMusicAuthenticated={isAppleMusicAuthorized}
        bypassRateLimits={bypassRateLimits}
        onToggleRateLimitBypass={handleToggleRateLimitBypass}
      />

      {!apiSettings.spotify && !apiSettings.applemusic && (
        <p>
          Music streaming service integration is disabled for searching. You
          need to authorize with Spotify or Apple Music to create playlists.
        </p>
      )}

      {!spotifyToken && (
        <>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>Note:</strong> You need to authorize with Spotify to create
            Spotify playlists.
          </p>
          <SpotifyLogin
            onLogin={handleSpotifyLogin}
            setToken={setSpotifyToken}
          />
        </>
      )}

      {!isAppleMusicAuthorized && (
        <>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>Note:</strong> You need to authorize with Apple Music to
            create Apple Music playlists.
          </p>
          <AppleMusicLoginContainer>
            <h2>Login to Apple Music</h2>
            <p>
              You need to login with your Apple Music account to search for
              tracks and create playlists.
            </p>
            <AppleMusicLoginButton onClick={loginToAppleMusic}>
              🍎 Connect to Apple Music
            </AppleMusicLoginButton>
            <p>
              Note: You'll need an Apple Music subscription to use this tool.
            </p>
          </AppleMusicLoginContainer>
        </>
      )}

      {isAppleMusicAuthorized && (
        <div style={{ marginBottom: "1rem" }}>
          <p>✅ Connected to Apple Music</p>
          <button onClick={disconnectFromAppleMusic}>
            Disconnect from Apple Music
          </button>
        </div>
      )}

      <CsvUploader onUpload={handleCsvUpload} />

      {loading && (
        <Spinner
          message={
            !csvData
              ? "Loading your CSV file..."
              : csvData.optimizingForSpotify
              ? "Optimizing tracks for Spotify..."
              : "Matching tracks with music services..."
          }
        />
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {searchResults.length > 0 && (
        <>
          <PlaylistCreator
            playlistName={playlistName}
            setPlaylistName={setPlaylistName}
            selectedCount={selectedTracks.length}
            totalCount={searchResults.length}
            onCreatePlaylist={createPlaylist}
            spotifyEnabled={!!spotifyToken} // Only require token for playlist creation
            spotifySearchEnabled={apiSettings.spotify && !!spotifyToken}
            appleMusicEnabled={isAppleMusicAuthorized}
            exportFormat={exportFormat}
            onExportFormatChange={handleExportFormatChange}
            onPrepareForSpotify={prepareForSpotify}
            searchResults={searchResults}
          />

          <TrackList
            tracks={searchResults}
            selectedTracks={selectedTracks}
            onToggleSelect={toggleTrackSelection}
          />
        </>
      )}
    </Container>
  );
};

export default App;
