import { Avatar, Style } from "@dicebear/core";
import definition from "@dicebear/styles/glyphs.json" with { type: "json" };

const glyphStyle = new Style(definition);

export function createGlyphAvatarDataUri(seed: string): string {
  return new Avatar(glyphStyle, {
    seed: seed.trim() || "bbdo-user",
    size: 128,
    glyphColor: ["#e5251d", "#b91c1c", "#ff4d4d", "#9f1239", "#dc2626", "#f87171", "#7f1d1d"],
  }).toDataUri();
}
