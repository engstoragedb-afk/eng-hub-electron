import React, { useState, useRef, useEffect } from "react";

type EditableTextProps = {
  value: string | number;
  onSave?: (newValue: string) => void;
  className?: string;
  type?: "text" | "number";
};

export default function EditableText({ value, onSave, className = "", type = "text" }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (onSave && currentValue !== String(value)) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setCurrentValue(String(value));
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-sky-500 rounded px-2 py-1 outline-none w-full ${className}`}
        style={{ fontSize: "inherit", fontWeight: "inherit", lineHeight: "inherit" }}
      />
    );
  }

  return (
    <span
      onDoubleClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-slate-200/50 dark:bg-white/5 rounded px-1 -ml-1 transition-colors ${className}`}
      title="Klik 2 kali untuk mengedit"
    >
      {currentValue}
    </span>
  );
}
