interface SeparatorProps {
  className?: string;
}

export default function Separator({ className = "bg-gray-300" }: SeparatorProps) {
  return <div className={`h-[0.5px] mb-4 mt-4 w-full ${className}`}></div>;
}

