"use client";

import { useState } from "react";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  maxRating?: number;
  size?: number;
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  maxRating = 10,
  size = 18 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value: number) => {
    onRatingChange(value);
  };

  const handleMouseEnter = (value: number) => {
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-1 mr-4">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;
        
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            className="transition-colors cursor-pointer focus:outline-none"
            style={{ fontSize: `${size}px` }}
          >
            <span className={isFilled ? "text-[#006042]" : "text-gray-300"}>
              ★
            </span>
          </button>
        );
      })}
    </div>
  );
}

