type TextPart = {
  type: "text" | "link";
  value: string;
};

const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;

function splitTextWithLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    parts.push({ type: "link", value: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

type TextWithLinksProps = {
  text: string;
  className?: string;
  linkClassName?: string;
};

export function TextWithLinks({
  text,
  className = "",
  linkClassName = "font-medium text-primary-strong underline-offset-2 hover:underline",
}: TextWithLinksProps) {
  const parts = splitTextWithLinks(text);

  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={`whitespace-pre-wrap ${className}`}>
      {parts.map((part, index) =>
        part.type === "link" ? (
          <a
            key={`${part.value}-${index}`}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {part.value}
          </a>
        ) : (
          <span key={`text-${index}`}>{part.value}</span>
        ),
      )}
    </span>
  );
}
