import React, { useRef } from "react";
import styled from "styled-components";

const UploaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  border: 2px dashed #646cff;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(100, 108, 255, 0.1);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const CsvUploader = ({ onUpload }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      onUpload(file);
    } else {
      alert("Please upload a valid CSV file");
    }
    // Reset the input so the same file can be uploaded again if needed
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer.files.length) {
      const file = event.dataTransfer.files[0];
      if (file.type === "text/csv") {
        onUpload(file);
      } else {
        alert("Please upload a valid CSV file");
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <UploaderContainer
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}>
      <p>Click or drag to upload your Serato CSV file</p>
      <p>Export your history from Serato and upload it here</p>
      <HiddenInput
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleFileChange}
      />
    </UploaderContainer>
  );
};

export default CsvUploader;
