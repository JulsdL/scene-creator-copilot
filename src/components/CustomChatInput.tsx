"use client";

import { type InputProps } from "@copilotkit/react-ui";
import { useChatInput } from "@/lib/chat-input-context";
import { useEffect, useRef, useState } from "react";

type UploadType = "character" | "background";

export function CustomChatInput({ inProgress, onSend }: InputProps) {
  const { inputValue, setInputValue, setInputRef } = useChatInput();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<UploadType>("character");
  const [isUploading, setIsUploading] = useState(false);

  // Register the input ref with context so other components can focus it
  useEffect(() => {
    setInputRef(inputRef as any);
  }, [setInputRef]);

  // Focus and move cursor to end when value changes externally
  useEffect(() => {
    if (inputValue && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const length = inputValue.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [inputValue]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (inProgress || isUploading) return;

    // Handle file upload
    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        // Upload to backend
        const response = await fetch("http://127.0.0.1:8123/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        const uploadedUrl = data.url;

        // Send message to agent
        onSend(`I uploaded a ${uploadType}. URL: ${uploadedUrl}`);

        // Cleanup
        clearFile();
        setInputValue("");
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload file. Please try again.");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Handle normal text message
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col border-t-2 border-black bg-[var(--bg-primary)]">
      {/* File Preview Area */}
      {selectedFile && (
        <div className="p-4 border-b-2 border-black bg-white flex items-center gap-4 animate-in slide-in-from-bottom-2">
          <div className="relative group">
            <img
              src={filePreview || ""}
              alt="Preview"
              className="h-20 w-20 object-cover border-2 border-black"
            />
            <button
              onClick={clearFile}
              className="absolute -top-2 -right-2 bg-[var(--accent-red)] text-white w-5 h-5 flex items-center justify-center border border-black rounded-full hover:scale-110 transition-transform text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase text-neutral-500">Upload Type:</span>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="uploadType"
                  checked={uploadType === "character"}
                  onChange={() => setUploadType("character")}
                  className="accent-black"
                />
                <span className="text-sm font-bold">Character</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="uploadType"
                  checked={uploadType === "background"}
                  onChange={() => setUploadType("background")}
                  className="accent-black"
                />
                <span className="text-sm font-bold">Background</span>
              </label>
            </div>
            <div className="text-xs text-neutral-400 truncate max-w-[200px]">
              {selectedFile.name}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 p-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={inProgress || isUploading || !!selectedFile}
          className="brutalist-btn bg-white text-black px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-2 border-black hover:bg-neutral-100 min-w-[50px]"
          title="Upload Image"
        >
          <span className="text-xl">📎</span>
        </button>

        <textarea
          ref={inputRef}
          disabled={inProgress || isUploading}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedFile ? "Ready to transmit..." : "ENTER COMMAND..."}
          rows={1}
          className="flex-1 px-4 py-3 brutalist-input text-sm resize-none disabled:bg-neutral-200"
          style={{ minHeight: "50px", maxHeight: "150px" }}
        />

        <button
          disabled={inProgress || isUploading || (!inputValue.trim() && !selectedFile)}
          onClick={handleSubmit}
          className="brutalist-btn bg-[var(--accent-red)] text-black px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-widest min-w-[120px]"
        >
          {isUploading ? "SENDING..." : "TRANSMIT"}
        </button>
      </div>
    </div>
  );
}
