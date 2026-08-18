import React, { useState, useEffect } from "react";
import { FaXmark, FaMagnifyingGlassPlus, FaMagnifyingGlassMinus, FaRotateRight } from "react-icons/fa6";

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  title: string;
  description: string;
}

export default function Lightbox({ isOpen, onClose, imageSrc, title, description }: LightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSensitivity = 0.1;
    // zoom in for scroll up (deltaY < 0), zoom out for scroll down
    const delta = e.deltaY < 0 ? zoomSensitivity : -zoomSensitivity;
    setScale((prev) => Math.min(Math.max(0.5, prev + delta), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-slate-950/90 p-6">
      <div className="relative w-full max-w-5xl rounded-3xl border border-slate-700/80 bg-slate-50 dark:bg-slate-950/95 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header/Controls */}
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded-full backdrop-blur-sm border border-slate-200 dark:border-white/5">
          <button onClick={() => setScale((s) => Math.min(s + 0.25, 5))} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:bg-slate-700" title="Zoom In">
            <FaMagnifyingGlassPlus />
          </button>
          <button onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:bg-slate-700" title="Zoom Out">
            <FaMagnifyingGlassMinus />
          </button>
          <button onClick={resetZoom} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 transition hover:bg-slate-200 dark:bg-slate-700" title="Reset Zoom">
            <FaRotateRight />
          </button>
          <div className="w-px h-5 bg-slate-300/50 dark:bg-white/10 mx-1"></div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 transition hover:bg-rose-500 hover:text-white"
            aria-label="Tutup preview"
          >
            <FaXmark />
          </button>
        </div>

        <div className="flex flex-col gap-0 sm:flex-row h-full">
          {/* Image Container with Zoom & Pan */}
          <div 
            className="flex-1 relative overflow-hidden bg-white dark:bg-slate-900/40 flex items-center justify-center cursor-move select-none touch-none min-h-[50vh] sm:min-h-[600px]"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={imageSrc}
              alt="Preview gambar"
              className="max-h-full max-w-full object-contain transition-transform duration-75 ease-out pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              }}
            />
          </div>

          <div className="w-full sm:w-72 shrink-0 p-6 border-t sm:border-t-0 sm:border-l border-slate-300 dark:border-white/10 flex flex-col justify-center bg-white dark:bg-slate-900/20">
            <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h4>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{description}</p>
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400 space-y-2">
              <p>💡 <b>Tips Navigasi:</b></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Gunakan <i>scroll mouse</i> untuk Zoom In / Out.</li>
                <li>Klik-tahan lalu geser untuk memindahkan posisi gambar <i>(pan)</i>.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
