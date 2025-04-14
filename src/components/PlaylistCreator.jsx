import React, { useEffect } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: #2a2a2a;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #3a3a3a;
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 1rem;
  color: white;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
`;

const Label = styled.label`
  font-weight: bold;
  min-width: 120px;
  color: white;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 4px;
  flex: 1;
  background-color: #333;
  color: white;

  &:focus {
    outline: 2px solid #646cff;
    border-color: transparent;
  }
`;

const CreateButton = styled.button`
  padding: ${(props) => {
    if (props.$exportFormat === "spotify") return "0.85rem 1.75rem";
    if (props.$exportFormat === "applemusic") return "0.85rem 1.75rem";
    if (props.$exportFormat === "csv") return "0.75rem 1.5rem";
    if (props.$exportFormat === "json") return "0.75rem 1.5rem";
    return "0.75rem 1.5rem";
  }};
  background-color: ${(props) => {
    if (props.$exportFormat === "spotify") return "#1DB954";
    if (props.$exportFormat === "applemusic") return "#FC3C44";
    if (props.$exportFormat === "csv") return "#ff9800";
    if (props.$exportFormat === "json") return "#2196f3";
    return "#888";
  }};
  color: ${(props) => (props.$exportFormat === "csv" ? "#000" : "white")};
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  align-self: flex-start;
  font-size: ${(props) => {
    if (props.$exportFormat === "spotify") return "1.1rem";
    if (props.$exportFormat === "applemusic") return "1.1rem";
    return "1rem";
  }};

  &:hover {
    background-color: ${(props) => {
      if (props.$exportFormat === "spotify") return "#1AA14A";
      if (props.$exportFormat === "applemusic") return "#E02D3A";
      if (props.$exportFormat === "csv") return "#e68a00";
      if (props.$exportFormat === "json") return "#0b7dda";
      return "#777";
    }};
    transform: translateY(-2px);
  }
`;

const SpotifyPrepButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  align-self: flex-start;
  font-size: 1rem;

  &:hover {
    background-color: #0b7dda;
    transform: translateY(-2px);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Stats = styled.div`
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #aaa;
`;

const StatItem = styled.span`
  margin-right: 1rem;

  strong {
    color: white;
  }
`;

const ExportOptionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ExportOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  background-color: ${(props) =>
    props.$selected ? props.$bgColor + "22" : "#3a3a3a"};
  border: 1px solid ${(props) => (props.$selected ? props.$bgColor : "#444")};
  transition: all 0.2s;
  color: ${(props) =>
    props.$selected && props.$source === "spotify" ? "white" : "#eee"};

  &:hover {
    background-color: ${(props) => props.$bgColor + "33"};
    transform: translateY(-2px);
  }

  img {
    width: 24px;
    height: 24px;
  }

  input {
    margin-right: 5px;
  }
`;

const SpotifyText = styled.span`
  color: white;
  font-weight: ${(props) => (props.$selected ? "bold" : "normal")};
  display: flex;
  align-items: center;
`;

const SpotifyIcon = styled.span`
  color: #1db954;
  font-size: 1.2rem;
  margin-right: 0.5rem;
`;

const AppleMusicIcon = styled.span`
  color: #fc3c44;
  font-size: 1.2rem;
  margin-right: 0.5rem;
`;

const SpotifyInfo = styled.div`
  margin-top: 0rem;
  margin-bottom: 1rem;
  background-color: rgba(29, 185, 84, 0.1);
  border: 1px solid rgba(29, 185, 84, 0.3);
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.9rem;
  color: #eee;
`;

const AppleMusicInfo = styled.div`
  margin-top: 0rem;
  margin-bottom: 1rem;
  background-color: rgba(252, 60, 68, 0.1);
  border: 1px solid rgba(252, 60, 68, 0.3);
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.9rem;
  color: #eee;
`;

const PlaylistCreator = ({
  playlistName,
  setPlaylistName,
  selectedCount,
  totalCount,
  onCreatePlaylist,
  spotifyEnabled,
  spotifySearchEnabled,
  appleMusicEnabled,
  exportFormat,
  onExportFormatChange,
  onPrepareForSpotify,
  searchResults,
}) => {
  // Generate a default playlist name if none exists
  useEffect(() => {
    if (!playlistName) {
      const today = new Date().toLocaleDateString();
      setPlaylistName(`Serato Playlist ${today}`);
    }
  }, [playlistName, setPlaylistName]);

  // Update export format based on service availability
  useEffect(() => {
    if (exportFormat === "spotify" && !spotifyEnabled) {
      onExportFormatChange("csv");
    }
    if (exportFormat === "applemusic" && !appleMusicEnabled) {
      onExportFormatChange("csv");
    }
  }, [spotifyEnabled, appleMusicEnabled, exportFormat, onExportFormatChange]);

  const handleExportFormatChange = (e) => {
    onExportFormatChange(e.target.value);
  };

  const excludedCount = totalCount - selectedCount;

  // Calculate how many tracks need Spotify optimization
  const nonSpotifyTracks = searchResults
    ? searchResults.filter(
        (track) => track.matched && track.source !== "spotify"
      ).length
    : 0;

  // Calculate how many tracks need Apple Music optimization
  const nonAppleMusicTracks = searchResults
    ? searchResults.filter(
        (track) => track.matched && track.source !== "applemusic"
      ).length
    : 0;

  return (
    <Container>
      <Title>Create Playlist</Title>

      <InputGroup>
        <Label htmlFor="playlist-name">Playlist Name:</Label>
        <Input
          id="playlist-name"
          type="text"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          placeholder="Enter playlist name"
        />
      </InputGroup>

      <ExportOptionsRow>
        <Label>Export Format:</Label>

        {spotifyEnabled && (
          <ExportOption
            htmlFor="export-spotify"
            $selected={exportFormat === "spotify"}
            $bgColor="#1DB954"
            style={{
              padding:
                exportFormat === "spotify"
                  ? "0.85rem 1.35rem"
                  : "0.75rem 1.25rem",
              transform: exportFormat === "spotify" ? "scale(1.05)" : "none",
              boxShadow:
                exportFormat === "spotify"
                  ? "0 4px 12px rgba(29, 185, 84, 0.2)"
                  : "none",
            }}>
            <input
              id="export-spotify"
              type="radio"
              value="spotify"
              checked={exportFormat === "spotify"}
              onChange={handleExportFormatChange}
              style={{ display: "none" }}
            />
            <SpotifyText $selected={exportFormat === "spotify"}>
              <SpotifyIcon>🎵</SpotifyIcon> Spotify Playlist
            </SpotifyText>
          </ExportOption>
        )}

        {appleMusicEnabled && (
          <ExportOption
            htmlFor="export-applemusic"
            $selected={exportFormat === "applemusic"}
            $bgColor="#FC3C44"
            style={{
              padding:
                exportFormat === "applemusic"
                  ? "0.85rem 1.35rem"
                  : "0.75rem 1.25rem",
              transform: exportFormat === "applemusic" ? "scale(1.05)" : "none",
              boxShadow:
                exportFormat === "applemusic"
                  ? "0 4px 12px rgba(252, 60, 68, 0.2)"
                  : "none",
            }}>
            <input
              id="export-applemusic"
              type="radio"
              value="applemusic"
              checked={exportFormat === "applemusic"}
              onChange={handleExportFormatChange}
              style={{ display: "none" }}
            />
            <SpotifyText $selected={exportFormat === "applemusic"}>
              <AppleMusicIcon>🍎</AppleMusicIcon> Apple Music Playlist
            </SpotifyText>
          </ExportOption>
        )}

        <ExportOption
          htmlFor="export-csv"
          $selected={exportFormat === "csv"}
          $bgColor="#ff9800">
          <input
            id="export-csv"
            type="radio"
            value="csv"
            checked={exportFormat === "csv"}
            onChange={handleExportFormatChange}
            style={{ display: "none" }}
          />
          CSV File
        </ExportOption>

        <ExportOption
          htmlFor="export-json"
          $selected={exportFormat === "json"}
          $bgColor="#2196f3">
          <input
            id="export-json"
            type="radio"
            value="json"
            checked={exportFormat === "json"}
            onChange={handleExportFormatChange}
            style={{ display: "none" }}
          />
          JSON File
        </ExportOption>
      </ExportOptionsRow>

      {spotifyEnabled && exportFormat === "spotify" && nonSpotifyTracks > 0 && (
        <SpotifyInfo>
          <p>
            <strong>{nonSpotifyTracks} tracks</strong> matched from other
            sources can be optimized for Spotify. Use the "Find More Spotify
            Matches" button to search these tracks on Spotify.
          </p>
        </SpotifyInfo>
      )}

      {appleMusicEnabled &&
        exportFormat === "applemusic" &&
        nonAppleMusicTracks > 0 && (
          <AppleMusicInfo>
            <p>
              <strong>{nonAppleMusicTracks} tracks</strong> matched from other
              sources can be used to create an Apple Music playlist.
            </p>
          </AppleMusicInfo>
        )}

      <ButtonGroup>
        <CreateButton
          onClick={onCreatePlaylist}
          $exportFormat={exportFormat}
          disabled={selectedCount === 0}>
          {exportFormat === "spotify"
            ? "Create Spotify Playlist"
            : exportFormat === "applemusic"
            ? "Create Apple Music Playlist"
            : exportFormat === "csv"
            ? "Export as CSV"
            : "Export as JSON"}
        </CreateButton>

        {spotifySearchEnabled && exportFormat === "spotify" && (
          <SpotifyPrepButton onClick={onPrepareForSpotify}>
            Find More Spotify Matches
          </SpotifyPrepButton>
        )}
      </ButtonGroup>

      <Stats>
        <StatItem>
          Selected: <strong>{selectedCount}</strong>
        </StatItem>
        <StatItem>
          Excluded: <strong>{excludedCount}</strong>
        </StatItem>
        <StatItem>
          Total: <strong>{totalCount}</strong>
        </StatItem>
        {exportFormat === "spotify" && (
          <StatItem>
            Spotify Tracks:{" "}
            <strong>
              {searchResults.filter((t) => t.source === "spotify").length}
            </strong>
          </StatItem>
        )}
      </Stats>
    </Container>
  );
};

export default PlaylistCreator;
