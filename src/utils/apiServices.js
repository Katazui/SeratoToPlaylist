/**
 * API Services for track matching
 * Supports multiple music APIs with a unified interface
 */

// Base class for all API services
class MusicAPIService {
  constructor() {
    this.name = "Generic API";
    this.enabled = true;
    this.rateLimit = {
      requestsPerMinute: Infinity,
      lastRequest: 0,
      requestCount: 0,
      resetTime: Date.now() + 60000,
    };
    this.bypassRateLimits = false;
  }

  async searchTrack(track, artist) {
    throw new Error("Method not implemented");
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setBypassRateLimits(bypass) {
    this.bypassRateLimits = bypass;
  }

  // Check if request can be made based on rate limit
  canMakeRequest() {
    // If rate limits are bypassed, always return true
    if (this.bypassRateLimits) {
      return true;
    }

    const now = Date.now();

    // Reset counter if a minute has passed
    if (now > this.rateLimit.resetTime) {
      this.rateLimit.requestCount = 0;
      this.rateLimit.resetTime = now + 60000;
    }

    return this.rateLimit.requestCount < this.rateLimit.requestsPerMinute;
  }

  // Update rate limit counter
  trackRequest() {
    // If bypassing rate limits, don't track requests
    if (this.bypassRateLimits) {
      return;
    }

    const now = Date.now();

    // Reset counter if a minute has passed
    if (now > this.rateLimit.resetTime) {
      this.rateLimit.requestCount = 0;
      this.rateLimit.resetTime = now + 60000;
    }

    this.rateLimit.requestCount++;
    this.rateLimit.lastRequest = now;
  }

  // Get time until next request is allowed
  getTimeUntilNextRequest() {
    // If bypassing rate limits, always return 0
    if (this.bypassRateLimits) {
      return 0;
    }

    if (this.canMakeRequest()) {
      return 0;
    }

    return this.rateLimit.resetTime - Date.now();
  }
}

// MusicBrainz API Service
export class MusicBrainzAPI extends MusicAPIService {
  constructor() {
    super();
    this.name = "MusicBrainz";
    this.baseUrl = "https://musicbrainz.org/ws/2";
    this.searchEndpoint = "/recording";
    // Add app identifier to avoid rate limiting
    this.userAgent = "SeratoToPlaylistConverter/1.0.0";
    // MusicBrainz allows 1 request per second
    this.rateLimit.requestsPerMinute = 60;
  }

  async searchTrack(track, artist) {
    try {
      // Check rate limit before making request
      if (!this.canMakeRequest()) {
        console.warn(
          `MusicBrainz API rate limit reached. Try again in ${Math.ceil(
            this.getTimeUntilNextRequest() / 1000
          )} seconds.`
        );
        return {
          matched: false,
          source: "musicbrainz",
          error: "Rate limit reached",
          matchConfidence: "none",
        };
      }

      // Track this request for rate limiting
      this.trackRequest();

      // Build query - MusicBrainz uses Lucene query syntax
      const query = encodeURIComponent(
        `recording:"${track}" AND artist:"${artist}"`
      );
      const url = `${this.baseUrl}${this.searchEndpoint}?query=${query}&fmt=json&limit=5`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`MusicBrainz API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.recordings && data.recordings.length > 0) {
        const bestMatch = data.recordings[0];
        return {
          name: bestMatch.title,
          artist: bestMatch.artist
            ? bestMatch.artist.name
            : bestMatch["artist-credit"][0].name,
          id: bestMatch.id,
          source: "musicbrainz",
          matched: true,
          matchConfidence: "high",
        };
      }

      return {
        matched: false,
        source: "musicbrainz",
        matchConfidence: "none",
      };
    } catch (error) {
      console.error("MusicBrainz API error:", error);
      return {
        matched: false,
        source: "musicbrainz",
        error: error.message,
        matchConfidence: "none",
      };
    }
  }
}

// Discogs API Service
export class DiscogsAPI extends MusicAPIService {
  constructor() {
    super();
    this.name = "Discogs";
    this.baseUrl = "https://api.discogs.com";
    this.searchEndpoint = "/database/search";
    this.key = import.meta.env.VITE_DISCOGS_KEY;
    this.secret = import.meta.env.VITE_DISCOGS_SECRET;
    // Discogs allows 60 requests per minute for authenticated users
    this.rateLimit.requestsPerMinute = 60;
  }

  async searchTrack(track, artist) {
    try {
      // Check rate limit before making request
      if (!this.canMakeRequest()) {
        console.warn(
          `Discogs API rate limit reached. Try again in ${Math.ceil(
            this.getTimeUntilNextRequest() / 1000
          )} seconds.`
        );
        return {
          matched: false,
          source: "discogs",
          error: "Rate limit reached",
          matchConfidence: "none",
        };
      }

      // Track this request for rate limiting
      this.trackRequest();

      // Build query
      let url = `${this.baseUrl}${this.searchEndpoint}?q=${encodeURIComponent(
        track
      )}&artist=${encodeURIComponent(artist)}&type=release&per_page=5`;

      // Add key and secret if available
      if (this.key && this.secret) {
        url += `&key=${this.key}&secret=${this.secret}`;
        console.log("Using Discogs API with key and secret");
      } else {
        console.warn("Discogs API key and/or secret not found in .env file");
      }

      const response = await fetch(url, {
        headers: {
          "User-Agent": "SeratoToPlaylistConverter/1.0.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Discogs API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const bestMatch = data.results[0];
        return {
          name: bestMatch.title,
          artist: bestMatch.artist || artist, // Fallback to original artist if not provided
          id: bestMatch.id,
          source: "discogs",
          thumb: bestMatch.thumb,
          year: bestMatch.year,
          matched: true,
          matchConfidence: "high",
        };
      }

      return {
        matched: false,
        source: "discogs",
        matchConfidence: "none",
      };
    } catch (error) {
      console.error("Discogs API error:", error);
      return {
        matched: false,
        source: "discogs",
        error: error.message,
        matchConfidence: "none",
      };
    }
  }
}

// Last.fm API Service
export class LastFmAPI extends MusicAPIService {
  constructor(apiKey = null) {
    super();
    this.name = "Last.fm";
    this.baseUrl = "https://ws.audioscrobbler.com/2.0/";
    this.apiKey = apiKey || import.meta.env.VITE_LASTFM_API_KEY;
    // Last.fm allows 5 requests per second = 300 per minute
    this.rateLimit.requestsPerMinute = 300;
  }

  async searchTrack(track, artist) {
    try {
      // Check if API key is available
      if (!this.apiKey) {
        return {
          matched: false,
          source: "lastfm",
          error: "Last.fm API key is required",
          matchConfidence: "none",
        };
      }

      // Check rate limit before making request
      if (!this.canMakeRequest()) {
        console.warn(
          `Last.fm API rate limit reached. Try again in ${Math.ceil(
            this.getTimeUntilNextRequest() / 1000
          )} seconds.`
        );
        return {
          matched: false,
          source: "lastfm",
          error: "Rate limit reached",
          matchConfidence: "none",
        };
      }

      // Track this request for rate limiting
      this.trackRequest();

      // Build query
      const url = `${
        this.baseUrl
      }?method=track.search&track=${encodeURIComponent(
        track
      )}&artist=${encodeURIComponent(artist)}&api_key=${
        this.apiKey
      }&format=json&limit=5`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Last.fm API error: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.results &&
        data.results.trackmatches &&
        data.results.trackmatches.track &&
        data.results.trackmatches.track.length > 0
      ) {
        const bestMatch = data.results.trackmatches.track[0];
        return {
          name: bestMatch.name,
          artist: bestMatch.artist,
          url: bestMatch.url,
          source: "lastfm",
          matched: true,
          matchConfidence: "high",
        };
      }

      return {
        matched: false,
        source: "lastfm",
        matchConfidence: "none",
      };
    } catch (error) {
      console.error("Last.fm API error:", error);
      return {
        matched: false,
        source: "lastfm",
        error: error.message,
        matchConfidence: "none",
      };
    }
  }
}

// Spotify API Service (kept for future integration)
export class SpotifyAPI extends MusicAPIService {
  constructor(spotifyApi = null) {
    super();
    this.name = "Spotify";
    this.spotifyApi = spotifyApi;
    this.enabled = !!spotifyApi; // Only enable if API instance is provided
    // Spotify has a limit of 60 requests per minute
    this.rateLimit.requestsPerMinute = 60;
  }

  setApiInstance(spotifyApi) {
    this.spotifyApi = spotifyApi;
    this.enabled = !!spotifyApi;
  }

  async searchTrack(track, artist) {
    if (!this.isEnabled() || !this.spotifyApi) {
      return {
        matched: false,
        source: "spotify",
        error: "Spotify API is not enabled or initialized",
        matchConfidence: "none",
      };
    }

    // Check if access token is still valid
    try {
      // Check rate limit before making request
      if (!this.canMakeRequest()) {
        console.warn(
          `Spotify API rate limit reached. Try again in ${Math.ceil(
            this.getTimeUntilNextRequest() / 1000
          )} seconds.`
        );
        return {
          matched: false,
          source: "spotify",
          error: "Rate limit reached",
          matchConfidence: "none",
        };
      }

      // Track this request for rate limiting
      this.trackRequest();

      // Build query with quotation marks around terms with spaces for better precision
      const trackQuery = track.includes(" ") ? `"${track}"` : track;
      const artistQuery = artist.includes(" ") ? `"${artist}"` : artist;
      const query = `track:${trackQuery} artist:${artistQuery}`;

      const searchResponse = await this.spotifyApi.searchTracks(query, {
        limit: 1,
      });

      if (searchResponse.tracks.items.length > 0) {
        const bestMatch = searchResponse.tracks.items[0];
        return {
          name: bestMatch.name,
          artist: bestMatch.artists[0].name,
          id: bestMatch.id,
          uri: bestMatch.uri,
          source: "spotify",
          matched: true,
          matchConfidence: "high",
          spotifyName: bestMatch.name,
          spotifyArtist: bestMatch.artists[0].name,
        };
      }

      // Try a more lenient search with just the track name
      const fallbackQuery = `${track}`;
      const fallbackResponse = await this.spotifyApi.searchTracks(
        fallbackQuery,
        { limit: 3 }
      );

      if (fallbackResponse.tracks.items.length > 0) {
        const fallbackMatch = fallbackResponse.tracks.items[0];
        return {
          name: fallbackMatch.name,
          artist: fallbackMatch.artists[0].name,
          id: fallbackMatch.id,
          uri: fallbackMatch.uri,
          source: "spotify",
          matched: true,
          matchConfidence: "medium",
          spotifyName: fallbackMatch.name,
          spotifyArtist: fallbackMatch.artists[0].name,
        };
      }

      return {
        matched: false,
        source: "spotify",
        matchConfidence: "none",
      };
    } catch (error) {
      // Check if error is due to expired/invalid token (401)
      if (error.status === 401) {
        // Mark API as disabled
        this.enabled = false;
        console.error(
          "Spotify API token is invalid or expired. Please log in again."
        );
        return {
          matched: false,
          source: "spotify",
          error:
            "Authentication error: Token expired or invalid. Please log in again.",
          matchConfidence: "none",
        };
      }

      console.error("Spotify API error:", error);
      return {
        matched: false,
        source: "spotify",
        error: error.message || "Unknown Spotify API error",
        matchConfidence: "none",
      };
    }
  }
}

// Apple Music API Service
export class AppleMusicAPI extends MusicAPIService {
  constructor(developerToken = null, musicUserToken = null) {
    super();
    this.name = "Apple Music";
    this.baseUrl = "https://api.music.apple.com/v1";
    this.searchEndpoint = "/catalog/{{storefront}}/search";
    this.developerToken =
      developerToken || import.meta.env.VITE_APPLE_DEVELOPER_TOKEN;
    this.musicUserToken = musicUserToken;
    this.storefront = "us"; // Default to US storefront
    // Apple Music allows around 20 requests per second
    this.rateLimit.requestsPerMinute = 1200;

    // Validate the token and disable service if not valid
    this.validateAndSetEnabled();
  }

  validateAndSetEnabled() {
    // Check if the developer token is valid (basic validation)
    const isValidToken =
      this.developerToken &&
      this.developerToken !== "your_token_here" &&
      this.developerToken.length > 20;

    // Only enable if we have a valid-looking developer token
    this.enabled = isValidToken;

    if (!isValidToken) {
      console.warn(
        "Apple Music API disabled: Invalid or missing developer token"
      );
    }
  }

  setUserToken(musicUserToken) {
    this.musicUserToken = musicUserToken;
    this.validateAndSetEnabled();
  }

  setStorefront(storefront) {
    this.storefront = storefront || "us";
  }

  async searchTrack(track, artist) {
    // Do an early check before making any API calls
    if (
      !this.isEnabled() ||
      !this.developerToken ||
      this.developerToken === "your_token_here"
    ) {
      return {
        matched: false,
        source: "applemusic",
        error: "Apple Music API disabled: Missing developer token",
        matchConfidence: "none",
      };
    }

    try {
      // Check rate limit before making request
      if (!this.canMakeRequest()) {
        console.warn(
          `Apple Music API rate limit reached. Try again in ${Math.ceil(
            this.getTimeUntilNextRequest() / 1000
          )} seconds.`
        );
        return {
          matched: false,
          source: "applemusic",
          error: "Rate limit reached",
          matchConfidence: "none",
        };
      }

      // Track this request for rate limiting
      this.trackRequest();

      // Build query
      const url = `${this.baseUrl}/catalog/${
        this.storefront
      }/search?term=${encodeURIComponent(
        `${track} ${artist}`
      )}&types=songs&limit=5`;

      const headers = {
        Authorization: `Bearer ${this.developerToken}`,
        "Content-Type": "application/json",
      };

      // Add music user token if available (required for some endpoints, not for search)
      if (this.musicUserToken) {
        headers["Music-User-Token"] = this.musicUserToken;
      }

      const response = await fetch(url, {
        headers,
      });

      if (!response.ok) {
        // Handle 401 errors specially to disable the service
        if (response.status === 401) {
          this.enabled = false;
          console.warn(
            "Apple Music API authentication failed. Service has been disabled."
          );
          return {
            matched: false,
            source: "applemusic",
            error:
              "Authentication failed. Please check your Apple Music developer token.",
            matchConfidence: "none",
          };
        }

        throw new Error(`Apple Music API error: ${response.status}`);
      }

      const data = await response.json();

      if (
        data.results &&
        data.results.songs &&
        data.results.songs.data &&
        data.results.songs.data.length > 0
      ) {
        const bestMatch = data.results.songs.data[0];
        return {
          name: bestMatch.attributes.name,
          artist: bestMatch.attributes.artistName,
          id: bestMatch.id,
          url: bestMatch.attributes.url,
          artwork: bestMatch.attributes.artwork,
          album: bestMatch.attributes.albumName,
          source: "applemusic",
          matched: true,
          matchConfidence: "high",
        };
      }

      return {
        matched: false,
        source: "applemusic",
        matchConfidence: "none",
      };
    } catch (error) {
      // Only log if the service is enabled (reduce console noise)
      if (this.isEnabled()) {
        console.error("Apple Music API error:", error);
      }

      // If there's an authentication error, disable the service
      if (
        error.message &&
        (error.message.includes("401") ||
          error.message.includes("authentication") ||
          error.message.includes("unauthorized"))
      ) {
        this.enabled = false;
        console.warn(
          "Apple Music API authentication failed. Service has been disabled."
        );
      }

      return {
        matched: false,
        source: "applemusic",
        error: error.message,
        matchConfidence: "none",
      };
    }
  }
}

// Main service orchestrator
export class MusicAPIOrchestrator {
  constructor() {
    this.services = {
      musicbrainz: new MusicBrainzAPI(),
      discogs: new DiscogsAPI(),
      lastfm: new LastFmAPI(),
      spotify: new SpotifyAPI(),
      applemusic: new AppleMusicAPI(),
    };

    // Rate limit info by service (from most limited to least limited)
    this.rateLimitInfo = {
      musicbrainz: { requestsPerMinute: 60, priority: 1 },
      discogs: { requestsPerMinute: 60, priority: 2 },
      spotify: { requestsPerMinute: 60, priority: 3 },
      lastfm: { requestsPerMinute: 300, priority: 4 },
      applemusic: { requestsPerMinute: 1200, priority: 5 },
    };

    // Set default service order (priority based on rate limits - most generous first to save limited APIs)
    this.serviceOrder = [
      "applemusic",
      "lastfm",
      "spotify",
      "discogs",
      "musicbrainz",
    ];

    // Track difficult searches to prioritize limited APIs for them
    this.difficultTracks = new Map();

    // Rate limit bypass flag
    this.bypassRateLimits = false;

    // Log initial service status
    this.logServiceStatus();
  }

  // Log the status of all services for debugging
  logServiceStatus() {
    const enabledServices = [];
    const disabledServices = [];

    Object.entries(this.services).forEach(([key, service]) => {
      if (service.isEnabled()) {
        enabledServices.push(key);
      } else {
        disabledServices.push(key);
      }
    });

    if (enabledServices.length === 0) {
      console.warn(
        "⚠️ No music API services are enabled. Track matching will not work."
      );
    } else {
      console.log(`Enabled music services: ${enabledServices.join(", ")}`);

      if (disabledServices.length > 0) {
        console.log(`Disabled music services: ${disabledServices.join(", ")}`);
      }
    }
  }

  // Check if any services are enabled
  hasEnabledServices() {
    return Object.values(this.services).some((service) => service.isEnabled());
  }

  // Register a new API service or replace an existing one
  registerService(key, service) {
    this.services[key] = service;

    // If it's a new service, add it to the order
    if (!this.serviceOrder.includes(key)) {
      this.serviceOrder.push(key);
    }

    // Log updated service status
    this.logServiceStatus();
  }

  // Set service order (priority)
  setServiceOrder(orderArray) {
    // Validate that all services in the order exist
    if (orderArray.every((key) => this.services[key])) {
      this.serviceOrder = orderArray;
    } else {
      throw new Error(
        "Invalid service order: one or more services do not exist"
      );
    }
  }

  // Enable or disable a specific service
  setServiceStatus(key, enabled) {
    if (this.services[key]) {
      this.services[key].setEnabled(enabled);

      // Log change for debugging
      console.log(`${key} service ${enabled ? "enabled" : "disabled"}`);

      // Log overall service status after change
      this.logServiceStatus();
    }
  }

  // Set bypass rate limits for all services
  setBypassRateLimits(bypass) {
    this.bypassRateLimits = bypass;
    // Apply setting to all services
    Object.values(this.services).forEach((service) => {
      service.setBypassRateLimits(bypass);
    });

    if (bypass) {
      console.warn(
        "⚠️ API rate limits bypassed. This may result in API services blocking your requests."
      );
    } else {
      console.log(
        "API rate limits enabled. Services will respect rate limits."
      );
    }
  }

  // Get service order based on track difficulty
  getServiceOrderForTrack(track, artist) {
    const trackKey = `${track}:::${artist}`;

    // Get only enabled services
    const enabledServices = (service) =>
      this.services[service] && this.services[service].isEnabled();

    // If this is a difficult track (previously failed searches), use more limited APIs first
    if (this.difficultTracks.has(trackKey)) {
      // For difficult tracks, prioritize APIs with better match quality over rate limits
      return [
        "musicbrainz",
        "discogs",
        "spotify",
        "applemusic",
        "lastfm",
      ].filter(enabledServices);
    }

    // Otherwise use default order (least limited first)
    return this.serviceOrder.filter(enabledServices);
  }

  // Search track across all enabled services according to priority order
  async searchTrack(track, artist) {
    const results = {};
    let bestMatch = null;
    const trackKey = `${track}:::${artist}`;

    // Get service order for this track (may be different based on difficulty)
    const serviceOrderForTrack = this.getServiceOrderForTrack(track, artist);

    // Check if we have any enabled services before attempting to search
    const hasEnabledServices = serviceOrderForTrack.length > 0;
    if (!hasEnabledServices) {
      console.warn(
        "No enabled music services found. Please enable at least one service in API Settings."
      );
      return {
        bestMatch: null,
        allResults: {},
        error: "No enabled music services available",
      };
    }

    // Try each service in order until we get a match
    for (const serviceKey of serviceOrderForTrack) {
      const service = this.services[serviceKey];

      if (
        service &&
        service.isEnabled() &&
        (this.bypassRateLimits || service.canMakeRequest())
      ) {
        try {
          const result = await service.searchTrack(track, artist);
          results[serviceKey] = result;

          // If we got a match and don't have a best match yet, or the match is higher confidence than current best
          if (
            result.matched &&
            (!bestMatch ||
              (result.matchConfidence === "high" &&
                bestMatch.matchConfidence !== "high"))
          ) {
            bestMatch = result;

            // If we got a high confidence match, we can stop
            if (result.matchConfidence === "high") {
              break;
            }
          }
        } catch (error) {
          console.error(`Error with ${service.name} API:`, error);
          results[serviceKey] = {
            matched: false,
            source: serviceKey,
            error: error.message,
            matchConfidence: "none",
          };

          // Disable service if there's a critical error
          if (
            error.message &&
            (error.message.includes("401") ||
              error.message.includes("authentication"))
          ) {
            console.warn(
              `Disabling ${service.name} due to authentication error`
            );
            service.setEnabled(false);
          }
        }
      }
    }

    // If no match was found, mark as difficult track for next time
    if (!bestMatch) {
      this.difficultTracks.set(trackKey, true);
    } else if (this.difficultTracks.has(trackKey)) {
      // If we found a match for a previously difficult track, remove from difficult list
      this.difficultTracks.delete(trackKey);
    }

    return {
      bestMatch,
      allResults: results,
    };
  }

  // Search multiple tracks in batch with improved prioritization
  async searchTracks(tracks) {
    const results = [];

    // Check if we have any enabled services
    const enabledServices = this.serviceOrder.filter(
      (serviceKey) =>
        this.services[serviceKey] && this.services[serviceKey].isEnabled()
    );

    if (enabledServices.length === 0) {
      console.warn(
        "No enabled music services found. Please enable at least one service in API Settings."
      );
      return tracks.map((track) => ({
        ...track,
        matched: false,
        matchConfidence: "none",
        error: "No enabled music services available",
      }));
    }

    // Sort tracks by difficulty - attempt to search previously difficult tracks first
    // This allows us to use our most limited API quotas on the hardest tracks
    const sortedTracks = [...tracks].sort((a, b) => {
      const aKey = `${a.name}:::${a.artist}`;
      const bKey = `${b.name}:::${b.artist}`;
      const aIsDifficult = this.difficultTracks.has(aKey);
      const bIsDifficult = this.difficultTracks.has(bKey);

      if (aIsDifficult && !bIsDifficult) return -1;
      if (!aIsDifficult && bIsDifficult) return 1;
      return 0;
    });

    for (const track of sortedTracks) {
      if (track.name && track.artist) {
        try {
          const result = await this.searchTrack(track.name, track.artist);

          if (result.bestMatch) {
            results.push({
              ...track,
              ...result.bestMatch,
              allResults: result.allResults,
            });
          } else {
            results.push({
              ...track,
              matched: false,
              matchConfidence: "none",
              allResults: result.allResults,
              error: result.error || "No matches found",
            });
          }
        } catch (error) {
          console.error(`Error searching for track ${track.name}:`, error);
          results.push({
            ...track,
            matched: false,
            matchConfidence: "none",
            error: error.message || "Search error",
          });
        }
      } else {
        // If track doesn't have name or artist, mark as unmatched
        results.push({
          ...track,
          matched: false,
          matchConfidence: "none",
          error: "Missing track name or artist",
        });
      }
    }

    return results;
  }
}

// Create and export a singleton instance
export const musicAPI = new MusicAPIOrchestrator();
