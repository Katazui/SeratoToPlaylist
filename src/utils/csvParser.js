/**
 * Extracts track information from Serato CSV export
 * Handles the specific format of Serato CSV files
 *
 * @param {Array} csvData - Array of objects representing CSV rows
 * @returns {Array} - Array of track objects with name and artist
 */
export const extractTracksFromCsv = (csvData) => {
  if (!csvData || !csvData.length) {
    return [];
  }

  // Filter out rows that represent songs (not headers or session info)
  // In Serato exports, songs usually have name and artist fields
  const tracks = csvData.filter((row) => {
    // Check if this is a song row by verifying it has a name and artist
    // and isn't a header or session info row
    return (
      row.name &&
      row.artist &&
      row.name !== "name" &&
      row.name !== "" &&
      !row.name.includes("/") && // Filter out dates or session info
      !row.name.match(/^\d+\/\d+\/\d+$/) // Filter out date entries
    );
  });

  // Clean and deduplicate the tracks
  const uniqueTracks = [];
  const trackMap = new Map();

  tracks.forEach((row) => {
    // Create a clean track object
    const track = {
      name: cleanTrackName(row.name),
      artist: cleanArtistName(row.artist),
      originalName: row.name,
      originalArtist: row.artist,
    };

    // Create a key for deduplication
    const key = `${track.name}|${track.artist}`;

    // Only add if we haven't seen this track before
    if (!trackMap.has(key)) {
      trackMap.set(key, true);
      uniqueTracks.push(track);
    }
  });

  return uniqueTracks;
};

/**
 * Cleans track names by removing common DJ annotations
 *
 * @param {string} name - Raw track name from CSV
 * @returns {string} - Cleaned track name
 */
const cleanTrackName = (name) => {
  if (!name) return "";

  // Remove common DJ annotations in parentheses
  return name
    .replace(/\([^)]*Intro[^)]*\)/gi, "") // Remove (Intro), (DJ Intro), etc.
    .replace(/\([^)]*Clean[^)]*\)/gi, "") // Remove (Clean), (Clean Edit), etc.
    .replace(/\([^)]*Dirty[^)]*\)/gi, "") // Remove (Dirty), (Dirty Edit), etc.
    .replace(/\([^)]*Acap[^)]*\)/gi, "") // Remove acapella notations
    .replace(/\([^)]*Edit[^)]*\)/gi, "") // Remove edit notations
    .replace(/\([^)]*Mix[^)]*\)/gi, "") // Remove mix notations
    .replace(/\([^)]*Short[^)]*\)/gi, "") // Remove short edit notations
    .replace(/\([^)]*Extended[^)]*\)/gi, "") // Remove extended notations
    .replace(/\([^)]*BPM[^)]*\)/gi, "") // Remove BPM notations
    .replace(/\([^)]*Explicit[^)]*\)/gi, "") // Remove explicit notations
    .replace(/\([^)]*Original[^)]*\)/gi, "") // Remove original mix notations
    .replace(/\(\s*\)/g, "") // Remove empty parentheses
    .replace(/\[.*?\]/g, "") // Remove text in square brackets
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with a single space
    .trim();
};

/**
 * Cleans artist names
 *
 * @param {string} artist - Raw artist name from CSV
 * @returns {string} - Cleaned artist name
 */
const cleanArtistName = (artist) => {
  if (!artist) return "";

  // Clean up artist name
  return artist
    .replace(/,/g, " ") // Replace commas with spaces
    .replace(/\s+ft\.?\s+/gi, " ") // Remove "ft", "ft.", "feat", etc.
    .replace(/\s+feat\.?\s+/gi, " ")
    .replace(/\s+featuring\s+/gi, " ")
    .replace(/\s+&\s+/g, " ") // Remove "&"
    .replace(/\s+and\s+/gi, " ") // Remove "and"
    .replace(/\s+vs\.?\s+/gi, " ") // Remove "vs", "vs.", etc.
    .replace(/\s+x\s+/g, " ") // Remove "x" between artists
    .replace(/\s{2,}/g, " ") // Replace multiple spaces with a single space
    .trim();
};
