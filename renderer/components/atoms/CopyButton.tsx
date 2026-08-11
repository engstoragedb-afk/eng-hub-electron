import React, { useState } from "react";

type CopyButtonProps = {
  text: string;
};

export default function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title="Salin"
      className="ml-2 text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-sky-400 transition-colors focus:outline-none"
    >
      {copied ? <i className="fa-solid fa-check text-emerald-400"></i> : <i className="fa-regular fa-copy"></i>}
    </button>
  );
}
