import React from "react";
import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
`;

const equalizer = keyframes`
  0% {
    height: 5px;
  }
  50% {
    height: 20px;
  }
  100% {
    height: 5px;
  }
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
  animation: ${pulse} 2s infinite ease-in-out;
`;

const SpinnerCircle = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(100, 108, 255, 0.1);
  border-radius: 50%;
  border-top-color: #646cff;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 15px;
`;

const EqualizerContainer = styled.div`
  display: flex;
  align-items: flex-end;
  height: 30px;
  gap: 3px;
  margin-top: 10px;
`;

// Use attrs to pass animation-related props as inline styles
const EqualizerBar = styled.div.attrs((props) => ({
  style: {
    animationDuration: `${props.$duration}s`,
    animationDelay: `${props.$delay}s`,
  },
}))`
  width: 4px;
  background-color: #646cff;
  border-radius: 2px;
  animation: ${equalizer} infinite ease-in-out;
`;

const SpinnerText = styled.div`
  margin-top: 1rem;
  font-size: 1.1rem;
  font-weight: 500;
  color: #646cff;
`;

const Spinner = ({ message = "Loading..." }) => {
  // Create an array of equalizer bars with different animation durations and delays
  const bars = Array.from({ length: 7 }, (_, i) => ({
    duration: 0.5 + Math.random() * 0.7,
    delay: Math.random() * 0.5,
  }));

  return (
    <SpinnerContainer>
      <SpinnerCircle />

      <EqualizerContainer>
        {bars.map((bar, i) => (
          <EqualizerBar key={i} $duration={bar.duration} $delay={bar.delay} />
        ))}
      </EqualizerContainer>

      <SpinnerText>{message}</SpinnerText>
    </SpinnerContainer>
  );
};

export default Spinner;
