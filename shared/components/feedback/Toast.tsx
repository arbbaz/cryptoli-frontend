"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "success", isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out">
      <div
        className={`rounded-md px-4 py-3 shadow-lg border ${
          type === "success"
            ? "bg-primary-bg border-primary-border text-green-text"
            : "bg-red-50 border-red-200 text-alert-red"
        } font-inter text-sm font-medium min-w-[300px] max-w-md`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex-1">{message}</span>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-text-primary hover:text-text-dark transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

