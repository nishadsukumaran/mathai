"use client";

import type { ConceptImageData } from "@mathai/shared-types";
import { ImageWithFallback } from "./ImageWithFallback";

interface ConceptImageProps {
  data: ConceptImageData;
  className?: string;
}

export function ConceptImage({ data, className }: ConceptImageProps) {
  const { imageUrl, altText, caption } = data;

  return (
    <div
      className={[
        "rounded-2xl bg-white border border-indigo-100 overflow-hidden",
        className ?? "",
      ].join(" ").trim()}
    >
      <div className="p-4">
        <ImageWithFallback src={imageUrl} alt={altText} />
      </div>

      {caption && (
        <div className="px-4 pb-4 text-center">
          <p className="text-gray-700 text-sm font-medium">{caption}</p>
        </div>
      )}
    </div>
  );
}
