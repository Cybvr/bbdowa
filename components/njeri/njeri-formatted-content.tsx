import React from "react";

export function FormattedContent({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  const paragraphs = text.split("\n\n");

  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split("\n");
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const isBullet = line.startsWith("• ");
              const content = isBullet ? line.slice(2) : line;

              // Parse bold elements formatted as **bold**
              const parts = content.split(/(\*\*.*?\*\*)/g);

              const renderedParts = parts.map((part, partIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={partIdx} className="font-semibold text-foreground">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              });

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 pl-1">
                    <span className="shrink-0 text-primary font-bold">•</span>
                    <span>{renderedParts}</span>
                  </div>
                );
              }

              return <p key={lIdx}>{renderedParts}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}
