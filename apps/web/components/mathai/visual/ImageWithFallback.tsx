"use client";

import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
}

export function ImageWithFallback({ src, alt, className }: ImageWithFallbackProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className="relative">
      {status === "loading" && (
        <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading visual...</span>
        </div>
      )}

      {status === "error" && (
        <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
          <span className="text-gray-400 text-sm">Visual couldn&apos;t load</span>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={[
          "w-full rounded-xl object-contain max-h-80",
          status === "loaded" ? "block" : "hidden",
          className ?? "",
        ].join(" ").trim()}
      />
    </div>
  );
}
