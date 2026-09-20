import { Avatar, Style } from "@dicebear/core";
import definition from "@dicebear/styles/glyphs.json" with { type: "json" };

const glyphStyle = new Style(definition);

export function createGlyphAvatarDataUri(seed: string): string {
  return new Avatar(glyphStyle, {
    seed: seed.trim() || "bbdo-user",
    size: 128,
  }).toDataUri();
}
