interface HighlightFirstWordProps {
  text: string;
  restColorClass?: string;
}

export default function HighlightFirstWord({
  text,
  restColorClass = "text-text-body",
}: HighlightFirstWordProps) {
  const firstSpaceIndex = text.indexOf(" ");
  if (firstSpaceIndex === -1) {
    return <span className={restColorClass}>{text}</span>;
  }

  const firstWord = text.substring(0, firstSpaceIndex);
  const rest = text.substring(firstSpaceIndex);

  return (
    <>
      <span className="text-primary-dark">{firstWord}</span>
      <span className={restColorClass}>{rest}</span>
    </>
  );
}
