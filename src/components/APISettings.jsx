import React, { useState } from "react";
import styled from "styled-components";

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background-color: rgba(100, 108, 255, 0.05);
  border-radius: 8px;
`;

const Title = styled.h2`
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const APIOption = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: ${(props) =>
    props.$active ? "rgba(100, 108, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"};
  border-radius: 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${(props) =>
      props.$active ? "rgba(100, 108, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"};
  }
`;

const APIHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const APIName = styled.h3`
  margin: 0;
  font-size: 1.2rem;
`;

const APIDescription = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  margin-left: 0.5rem;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #1db954;
  }

  &:checked + span:before {
    transform: translateX(24px);
  }

  &:disabled + span {
    background-color: #555;
    cursor: not-allowed;
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #333;
  transition: 0.4s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const APIStatus = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: ${(props) => (props.$active ? "#1DB954" : "#888")};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => (props.$active ? "#1DB954" : "#888")};
  margin-right: 0.5rem;
`;

const AdvancedToggle = styled.button`
  background: none;
  border: none;
  color: #646cff;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-size: 0.9rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  align-self: flex-start;

  &:hover {
    color: #535bf2;
  }
`;

const AdvancedSettingsContainer = styled.div`
  margin-top: 0.5rem;
  padding: 1rem;
  background-color: rgba(100, 108, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(100, 108, 255, 0.2);
`;

const AdvancedOption = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: rgba(255, 97, 97, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 97, 97, 0.2);
`;

const WarningIcon = styled.span`
  margin-right: 0.5rem;
`;

const AdvancedOptionDescription = styled.div`
  display: flex;
  flex-direction: column;
`;

const AdvancedOptionTitle = styled.span`
  font-weight: bold;
  margin-bottom: 0.25rem;
`;

const AdvancedOptionText = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const APISettings = ({
  settings,
  onChange,
  spotifyAuthenticated,
  appleMusicAuthenticated,
  bypassRateLimits,
  onToggleRateLimitBypass,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggle = (api) => {
    // Don't toggle if it's Spotify and not authenticated
    if (api === "spotify" && !spotifyAuthenticated) {
      return;
    }

    // Don't toggle if it's Apple Music and not authenticated
    if (api === "applemusic" && !appleMusicAuthenticated) {
      return;
    }

    onChange({
      ...settings,
      [api]: !settings[api],
    });
  };

  const apiDescriptions = {
    musicbrainz: "Open-source music database with comprehensive metadata",
    discogs: "Extensive database of physical music releases",
    lastfm: "Music statistics and metadata with social features",
    spotify: "Commercial streaming service with extensive track catalog",
    applemusic: "Apple Music streaming service with comprehensive library",
  };

  return (
    <SettingsContainer>
      <Title>Music API Settings</Title>
      <SettingsGrid>
        {Object.entries(settings).map(([api, enabled]) => (
          <APIOption key={api} $active={enabled}>
            <APIHeader>
              <APIName>{api.charAt(0).toUpperCase() + api.slice(1)}</APIName>
              <Toggle>
                <ToggleInput
                  type="checkbox"
                  checked={enabled}
                  onChange={() => handleToggle(api)}
                  disabled={
                    (api === "spotify" && !spotifyAuthenticated) ||
                    (api === "applemusic" && !appleMusicAuthenticated)
                  }
                />
                <ToggleSlider />
              </Toggle>
            </APIHeader>
            <APIDescription>{apiDescriptions[api]}</APIDescription>

            <APIStatus $active={enabled}>
              <StatusDot $active={enabled} />
              {enabled ? "Active" : "Inactive"}
              {api === "spotify" &&
                !spotifyAuthenticated &&
                !enabled &&
                " (Login required)"}
              {api === "applemusic" &&
                !appleMusicAuthenticated &&
                !enabled &&
                " (Login required)"}
            </APIStatus>
          </APIOption>
        ))}
      </SettingsGrid>

      <AdvancedToggle onClick={() => setShowAdvanced(!showAdvanced)}>
        {showAdvanced ? "▼ Hide Advanced Settings" : "▶ Show Advanced Settings"}
      </AdvancedToggle>

      {showAdvanced && (
        <AdvancedSettingsContainer>
          <AdvancedOption>
            <AdvancedOptionDescription>
              <AdvancedOptionTitle>
                <WarningIcon>⚠️</WarningIcon>
                Bypass API Rate Limits
              </AdvancedOptionTitle>
              <AdvancedOptionText>
                Forces API requests without respecting rate limits. This may
                result in API services blocking your requests. Use only if you
                know what you're doing.
              </AdvancedOptionText>
            </AdvancedOptionDescription>
            <Toggle>
              <ToggleInput
                type="checkbox"
                checked={bypassRateLimits}
                onChange={() => onToggleRateLimitBypass(!bypassRateLimits)}
              />
              <ToggleSlider />
            </Toggle>
          </AdvancedOption>
        </AdvancedSettingsContainer>
      )}
    </SettingsContainer>
  );
};

export default APISettings;
