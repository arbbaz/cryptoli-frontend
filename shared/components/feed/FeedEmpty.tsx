"use client";

interface FeedEmptyProps {
  message: string;
}

export default function FeedEmpty({ message }: FeedEmptyProps) {
  return (
    <div className="text-center py-8 text-text-primary" role="status">
      {message}
    </div>
  );
}
