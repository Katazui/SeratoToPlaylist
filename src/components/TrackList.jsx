import React, { useState } from "react";
import styled from "styled-components";

const TrackListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  background-color: ${(props) => (props.$isActive ? "#646cff" : "#333")};
  color: white;
  border: 1px solid ${(props) => (props.$isActive ? "#646cff" : "#333")};

  &:hover {
    border-color: #646cff;
  }
`;

const SourceFilterButton = styled(FilterButton)`
  background-color: ${(props) => {
    if (!props.$isActive) return "#333";
    switch (props.$source) {
      case "musicbrainz":
        return "#BA478F";
      case "discogs":
        return "#F5DF4D";
      case "lastfm":
        return "#D51007";
      case "spotify":
        return "#1DB954";
      case "applemusic":
        return "#FC3C44";
      default:
        return "#646cff";
    }
  }};
  border-color: ${(props) => {
    if (!props.$isActive) return "#333";
    switch (props.$source) {
      case "musicbrainz":
        return "#BA478F";
      case "discogs":
        return "#F5DF4D";
      case "lastfm":
        return "#D51007";
      case "spotify":
        return "#1DB954";
      case "applemusic":
        return "#FC3C44";
      default:
        return "#646cff";
    }
  }};
  color: ${(props) =>
    props.$source === "discogs" && props.$isActive ? "#000" : "white"};
`;

const SearchInput = styled.input`
  padding: 0.6em 1.2em;
  font-size: 1em;
  border-radius: 8px;
  border: 1px solid #333;
  background-color: #1a1a1a;
  color: white;
  flex-grow: 1;
`;

const TrackTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`;

const TableHeader = styled.th`
  padding: 1rem;
  background-color: #333;
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
`;

const ServiceHeader = styled(TableHeader)`
  background-color: ${(props) => {
    switch (props.$source) {
      case "spotify":
        return "rgba(29, 185, 84, 0.2)";
      case "applemusic":
        return "rgba(252, 60, 68, 0.2)";
      case "musicbrainz":
        return "rgba(186, 71, 143, 0.2)";
      case "discogs":
        return "rgba(245, 223, 77, 0.2)";
      case "lastfm":
        return "rgba(213, 16, 7, 0.2)";
      default:
        return "#333";
    }
  }};
  color: ${(props) => (props.$source === "discogs" ? "#000" : "white")};
  border-bottom: 3px solid
    ${(props) => {
      switch (props.$source) {
        case "spotify":
          return "#1DB954";
        case "applemusic":
          return "#FC3C44";
        case "musicbrainz":
          return "#BA478F";
        case "discogs":
          return "#F5DF4D";
        case "lastfm":
          return "#D51007";
        default:
          return "transparent";
      }
    }};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #333;

  &:hover {
    background-color: rgba(100, 108, 255, 0.1);
  }

  background-color: ${(props) => {
    if (props.$matchStatus === "high") return "rgba(29, 185, 84, 0.1)"; // Green for high confidence
    if (props.$matchStatus === "medium") return "rgba(255, 198, 0, 0.1)"; // Yellow for medium confidence
    if (props.$matchStatus === "none") return "rgba(255, 100, 100, 0.1)"; // Red for no match
    return "transparent";
  }};
`;

const TableCell = styled.td`
  padding: 1rem;
  vertical-align: top;
`;

const SourceTableCell = styled(TableCell)`
  background-color: ${(props) => {
    switch (props.$source) {
      case "spotify":
        return "rgba(29, 185, 84, 0.05)";
      case "applemusic":
        return "rgba(252, 60, 68, 0.05)";
      case "musicbrainz":
        return "rgba(186, 71, 143, 0.05)";
      case "discogs":
        return "rgba(245, 223, 77, 0.05)";
      case "lastfm":
        return "rgba(213, 16, 7, 0.05)";
      default:
        return "transparent";
    }
  }};
  border-left: 3px solid
    ${(props) => {
      switch (props.$source) {
        case "spotify":
          return "#1DB954";
        case "applemusic":
          return "#FC3C44";
        case "musicbrainz":
          return "#BA478F";
        case "discogs":
          return "#F5DF4D";
        case "lastfm":
          return "#D51007";
        default:
          return "transparent";
      }
    }};
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const MatchIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.$status === "high" ? "#4CAF50" : "#FFC107"};
`;

const NoMatchMessage = styled.div`
  color: #777;
  text-align: center;
  padding: 1rem 0;
`;

const MatchCell = styled.div`
  padding: 0.5rem;
`;

const MatchTitle = styled.div`
  font-weight: bold;
`;

const MatchArtist = styled.div`
  font-size: 0.9rem;
  color: #aaa;
`;

const MatchConfidence = styled.div`
  font-size: 0.8rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
`;

const SourceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  margin-left: 0.5rem;
  background-color: ${(props) => {
    switch (props.$source) {
      case "musicbrainz":
        return "#BA478F";
      case "discogs":
        return "#F5DF4D";
      case "lastfm":
        return "#D51007";
      case "spotify":
        return "#1DB954";
      case "applemusic":
        return "#FC3C44";
      default:
        return "#646cff";
    }
  }};
  color: ${(props) => (props.$source === "discogs" ? "#000" : "white")};
`;

const MatchesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MatchItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.05);
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const MatchText = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 0.5rem;

  strong {
    margin-bottom: 0.25rem;
  }

  span {
    font-size: 0.85rem;
    color: #aaa;
  }
`;

const SourceHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: bold;
`;

const SourceIcon = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 0.5rem;
  background-color: ${(props) => {
    switch (props.$source) {
      case "musicbrainz":
        return "#BA478F";
      case "discogs":
        return "#F5DF4D";
      case "lastfm":
        return "#D51007";
      case "spotify":
        return "#1DB954";
      case "applemusic":
        return "#FC3C44";
      default:
        return "#646cff";
    }
  }};
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;

  button {
    padding: 0.5rem 1rem;
    background-color: ${(props) => (props.$active ? "#646cff" : "#333")};
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background-color: ${(props) => (props.$active ? "#535bf2" : "#444")};
    }
  }
`;

const TrackList = ({ tracks, selectedTracks, onToggleSelect }) => {
  const [filter, setFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSpotifyOnly, setShowSpotifyOnly] = useState(false);
  const [viewMode, setViewMode] = useState("simplified"); // simplified or detailed

  // Get all unique sources from tracks
  const sources = [
    "all",
    ...new Set(tracks.filter((t) => t.source).map((t) => t.source)),
  ];

  const filteredTracks = tracks.filter((track) => {
    // Apply match status filter
    if (filter === "matched" && !track.matched) return false;
    if (filter === "unmatched" && track.matched) return false;

    // Apply source filter
    if (sourceFilter !== "all" && track.source !== sourceFilter) return false;

    // Apply Spotify-only filter
    if (showSpotifyOnly && track.source !== "spotify") return false;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (track.name && track.name.toLowerCase().includes(searchLower)) ||
        (track.artist && track.artist.toLowerCase().includes(searchLower)) ||
        (track.originalName &&
          track.originalName.toLowerCase().includes(searchLower)) ||
        (track.originalArtist &&
          track.originalArtist.toLowerCase().includes(searchLower)) ||
        (track.spotifyName &&
          track.spotifyName.toLowerCase().includes(searchLower)) ||
        (track.spotifyArtist &&
          track.spotifyArtist.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Function to get track ID for selection
  const getTrackId = (track) => {
    if (track.source === "spotify" && track.uri) {
      return track.uri;
    }
    return `${track.source}:${track.id}`;
  };

  // Function to get all results for a track
  const getAllSourcesForTrack = (track) => {
    const sources = [];

    if (track.allResults) {
      Object.entries(track.allResults).forEach(([source, result]) => {
        if (result.matched) {
          sources.push({
            source,
            ...result,
          });
        }
      });
    }

    // If the best match isn't in the all results, add it
    if (track.matched && !sources.some((s) => s.source === track.source)) {
      sources.push({
        source: track.source,
        name: track.name,
        artist: track.artist,
        matchConfidence: track.matchConfidence,
        id: track.id,
        uri: track.uri,
      });
    }

    return sources;
  };

  return (
    <TrackListContainer>
      <h2>Track List</h2>

      <ViewToggle>
        <button
          onClick={() => setViewMode("simplified")}
          style={{
            backgroundColor: viewMode === "simplified" ? "#646cff" : "#333",
          }}>
          Simplified View
        </button>
        <button
          onClick={() => setViewMode("detailed")}
          style={{
            backgroundColor: viewMode === "detailed" ? "#646cff" : "#333",
          }}>
          Detailed View
        </button>
      </ViewToggle>

      <FiltersContainer>
        <FilterButton
          $isActive={filter === "all"}
          onClick={() => setFilter("all")}>
          All ({tracks.length})
        </FilterButton>
        <FilterButton
          $isActive={filter === "matched"}
          onClick={() => setFilter("matched")}>
          Matched ({tracks.filter((t) => t.matched).length})
        </FilterButton>
        <FilterButton
          $isActive={filter === "unmatched"}
          onClick={() => setFilter("unmatched")}>
          Unmatched ({tracks.filter((t) => !t.matched).length})
        </FilterButton>

        {sources.length > 1 &&
          sources.map((source) => (
            <SourceFilterButton
              key={source}
              $isActive={sourceFilter === source}
              onClick={() => setSourceFilter(source)}
              $source={source}>
              {source === "all"
                ? "All Sources"
                : source.charAt(0).toUpperCase() + source.slice(1)}
              {source !== "all" &&
                ` (${tracks.filter((t) => t.source === source).length})`}
            </SourceFilterButton>
          ))}

        <FilterButton
          $isActive={showSpotifyOnly}
          onClick={() => setShowSpotifyOnly(!showSpotifyOnly)}
          style={{ backgroundColor: showSpotifyOnly ? "#1DB954" : "#333" }}>
          Spotify Only ({tracks.filter((t) => t.source === "spotify").length})
        </FilterButton>

        <SearchInput
          type="text"
          placeholder="Search tracks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </FiltersContainer>

      <div style={{ overflowX: "auto" }}>
        {viewMode === "simplified" ? (
          <TrackTable>
            <thead>
              <tr>
                <TableHeader style={{ width: "40px" }}>
                  <Checkbox
                    type="checkbox"
                    checked={
                      filteredTracks.length > 0 &&
                      filteredTracks.every((track) => {
                        if (!track.matched) return true; // Skip unmatched tracks
                        const trackId = getTrackId(track);
                        return selectedTracks.includes(trackId);
                      })
                    }
                    onChange={() => {
                      const allSelected =
                        filteredTracks.length > 0 &&
                        filteredTracks.every((track) => {
                          if (!track.matched) return true;
                          const trackId = getTrackId(track);
                          return selectedTracks.includes(trackId);
                        });

                      filteredTracks.forEach((track) => {
                        if (track.matched) {
                          const trackId = getTrackId(track);
                          if (allSelected) {
                            // Unselect this track
                            if (selectedTracks.includes(trackId)) {
                              onToggleSelect(trackId);
                            }
                          } else if (!selectedTracks.includes(trackId)) {
                            // Select this track
                            onToggleSelect(trackId);
                          }
                        }
                      });
                    }}
                  />
                </TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Source</TableHeader>
                <TableHeader>Original Track</TableHeader>
                <TableHeader>Original Artist</TableHeader>
                <TableHeader>Matched Track</TableHeader>
                <TableHeader>Matched Artist</TableHeader>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.map((track, index) => {
                const trackId = getTrackId(track);
                const isSpotify = track.source === "spotify";
                return (
                  <TableRow
                    key={index}
                    $matchStatus={track.matchConfidence}
                    style={
                      isSpotify
                        ? { backgroundColor: "rgba(29, 185, 84, 0.05)" }
                        : {}
                    }>
                    <TableCell>
                      {track.matched && (
                        <Checkbox
                          type="checkbox"
                          checked={selectedTracks.includes(trackId)}
                          onChange={() => onToggleSelect(trackId)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {track.matched ? (
                        <>
                          <MatchIndicator $status={track.matchConfidence} />
                          {track.matchConfidence === "high"
                            ? "Good Match"
                            : "Possible Match"}
                          {isSpotify && (
                            <SourceBadge $source="spotify">Spotify</SourceBadge>
                          )}
                        </>
                      ) : (
                        <>
                          <MatchIndicator $status="none" />
                          No Match
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      {track.source && (
                        <SourceBadge $source={track.source}>
                          {track.source.charAt(0).toUpperCase() +
                            track.source.slice(1)}
                        </SourceBadge>
                      )}
                    </TableCell>
                    <TableCell>{track.originalName || track.name}</TableCell>
                    <TableCell>
                      {track.originalArtist || track.artist}
                    </TableCell>
                    <TableCell>
                      {track.matched
                        ? // For Spotify, use spotifyName, for others use name
                          track.source === "spotify"
                          ? track.spotifyName || track.name
                          : track.name
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {track.matched
                        ? track.source === "spotify"
                          ? track.spotifyArtist || track.artist
                          : track.artist
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTracks.length === 0 && (
                <TableRow>
                  <TableCell colSpan="7" style={{ textAlign: "center" }}>
                    No tracks match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </TrackTable>
        ) : (
          <TrackTable>
            <thead>
              <tr>
                <TableHeader style={{ width: "40px" }}>
                  <Checkbox
                    type="checkbox"
                    checked={
                      filteredTracks.length > 0 &&
                      filteredTracks.every((track) => {
                        if (!track.matched) return true; // Skip unmatched tracks
                        const trackId = getTrackId(track);
                        return selectedTracks.includes(trackId);
                      })
                    }
                    onChange={() => {
                      const allSelected =
                        filteredTracks.length > 0 &&
                        filteredTracks.every((track) => {
                          if (!track.matched) return true;
                          const trackId = getTrackId(track);
                          return selectedTracks.includes(trackId);
                        });

                      filteredTracks.forEach((track) => {
                        if (track.matched) {
                          const trackId = getTrackId(track);
                          if (allSelected) {
                            // Unselect this track
                            if (selectedTracks.includes(trackId)) {
                              onToggleSelect(trackId);
                            }
                          } else if (!selectedTracks.includes(trackId)) {
                            // Select this track
                            onToggleSelect(trackId);
                          }
                        }
                      });
                    }}
                  />
                </TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Original Track</TableHeader>
                <TableHeader colSpan="5" style={{ textAlign: "center" }}>
                  Matched Tracks by Service
                </TableHeader>
              </tr>
              <tr>
                <TableHeader></TableHeader>
                <TableHeader></TableHeader>
                <TableHeader></TableHeader>
                <ServiceHeader $source="spotify">
                  <SourceIcon $source="spotify" /> Spotify
                </ServiceHeader>
                <ServiceHeader $source="applemusic">
                  <SourceIcon $source="applemusic" /> Apple Music
                </ServiceHeader>
                <ServiceHeader $source="musicbrainz">
                  <SourceIcon $source="musicbrainz" /> MusicBrainz
                </ServiceHeader>
                <ServiceHeader $source="discogs">
                  <SourceIcon $source="discogs" /> Discogs
                </ServiceHeader>
                <ServiceHeader $source="lastfm">
                  <SourceIcon $source="lastfm" /> Last.fm
                </ServiceHeader>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.map((track, index) => {
                const trackId = getTrackId(track);
                const allSources = getAllSourcesForTrack(track);

                // Find matches for each service
                const spotifyMatch = allSources.find(
                  (s) => s.source === "spotify"
                );
                const appleMusicMatch = allSources.find(
                  (s) => s.source === "applemusic"
                );
                const musicbrainzMatch = allSources.find(
                  (s) => s.source === "musicbrainz"
                );
                const discogsMatch = allSources.find(
                  (s) => s.source === "discogs"
                );
                const lastfmMatch = allSources.find(
                  (s) => s.source === "lastfm"
                );

                return (
                  <TableRow key={index} $matchStatus={track.matchConfidence}>
                    <TableCell>
                      {track.matched && (
                        <Checkbox
                          type="checkbox"
                          checked={selectedTracks.includes(trackId)}
                          onChange={() => onToggleSelect(trackId)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {track.matched ? (
                        <>
                          <MatchIndicator $status={track.matchConfidence} />
                          {track.matchConfidence === "high"
                            ? "Good Match"
                            : "Possible Match"}
                        </>
                      ) : (
                        <>
                          <MatchIndicator $status="none" />
                          No Match
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      <strong>{track.originalName || track.name}</strong>
                      <div style={{ fontSize: "0.9rem", color: "#aaa" }}>
                        {track.originalArtist || track.artist}
                      </div>
                    </TableCell>

                    <SourceTableCell $source="spotify">
                      {spotifyMatch ? (
                        <MatchCell>
                          <MatchTitle>
                            {spotifyMatch.spotifyName || spotifyMatch.name}
                          </MatchTitle>
                          <MatchArtist>
                            {spotifyMatch.spotifyArtist || spotifyMatch.artist}
                          </MatchArtist>
                          <MatchConfidence>
                            <MatchIndicator
                              $status={spotifyMatch.matchConfidence}
                            />
                            <span style={{ marginLeft: "0.25rem" }}>
                              {spotifyMatch.matchConfidence === "high"
                                ? "Good Match"
                                : "Possible Match"}
                            </span>
                          </MatchConfidence>
                        </MatchCell>
                      ) : (
                        <NoMatchMessage>No Match</NoMatchMessage>
                      )}
                    </SourceTableCell>

                    <SourceTableCell $source="applemusic">
                      {appleMusicMatch ? (
                        <MatchCell>
                          <MatchTitle>
                            {appleMusicMatch.appleMusicName ||
                              appleMusicMatch.name}
                          </MatchTitle>
                          <MatchArtist>
                            {appleMusicMatch.appleMusicArtist ||
                              appleMusicMatch.artist}
                          </MatchArtist>
                          <MatchConfidence>
                            <MatchIndicator
                              $status={appleMusicMatch.matchConfidence}
                            />
                            <span style={{ marginLeft: "0.25rem" }}>
                              {appleMusicMatch.matchConfidence === "high"
                                ? "Good Match"
                                : "Possible Match"}
                            </span>
                          </MatchConfidence>
                        </MatchCell>
                      ) : (
                        <NoMatchMessage>No Match</NoMatchMessage>
                      )}
                    </SourceTableCell>

                    <SourceTableCell $source="musicbrainz">
                      {musicbrainzMatch ? (
                        <MatchCell>
                          <MatchTitle>
                            {musicbrainzMatch.musicbrainzName ||
                              musicbrainzMatch.name}
                          </MatchTitle>
                          <MatchArtist>
                            {musicbrainzMatch.musicbrainzArtist ||
                              musicbrainzMatch.artist}
                          </MatchArtist>
                          <MatchConfidence>
                            <MatchIndicator
                              $status={musicbrainzMatch.matchConfidence}
                            />
                            <span style={{ marginLeft: "0.25rem" }}>
                              {musicbrainzMatch.matchConfidence === "high"
                                ? "Good Match"
                                : "Possible Match"}
                            </span>
                          </MatchConfidence>
                        </MatchCell>
                      ) : (
                        <NoMatchMessage>No Match</NoMatchMessage>
                      )}
                    </SourceTableCell>

                    <SourceTableCell $source="discogs">
                      {discogsMatch ? (
                        <MatchCell>
                          <MatchTitle>
                            {discogsMatch.discogsName || discogsMatch.name}
                          </MatchTitle>
                          <MatchArtist>
                            {discogsMatch.discogsArtist || discogsMatch.artist}
                          </MatchArtist>
                          <MatchConfidence>
                            <MatchIndicator
                              $status={discogsMatch.matchConfidence}
                            />
                            <span style={{ marginLeft: "0.25rem" }}>
                              {discogsMatch.matchConfidence === "high"
                                ? "Good Match"
                                : "Possible Match"}
                            </span>
                          </MatchConfidence>
                        </MatchCell>
                      ) : (
                        <NoMatchMessage>No Match</NoMatchMessage>
                      )}
                    </SourceTableCell>

                    <SourceTableCell $source="lastfm">
                      {lastfmMatch ? (
                        <MatchCell>
                          <MatchTitle>
                            {lastfmMatch.lastfmName || lastfmMatch.name}
                          </MatchTitle>
                          <MatchArtist>
                            {lastfmMatch.lastfmArtist || lastfmMatch.artist}
                          </MatchArtist>
                          <MatchConfidence>
                            <MatchIndicator
                              $status={lastfmMatch.matchConfidence}
                            />
                            <span style={{ marginLeft: "0.25rem" }}>
                              {lastfmMatch.matchConfidence === "high"
                                ? "Good Match"
                                : "Possible Match"}
                            </span>
                          </MatchConfidence>
                        </MatchCell>
                      ) : (
                        <NoMatchMessage>No Match</NoMatchMessage>
                      )}
                    </SourceTableCell>
                  </TableRow>
                );
              })}
              {filteredTracks.length === 0 && (
                <TableRow>
                  <TableCell colSpan="8" style={{ textAlign: "center" }}>
                    No tracks match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </TrackTable>
        )}
      </div>
    </TrackListContainer>
  );
};

export default TrackList;
