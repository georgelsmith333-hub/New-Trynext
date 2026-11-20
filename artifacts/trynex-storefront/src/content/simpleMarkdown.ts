export type InlineSegment =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "link"; text: string; href: string };

export type MarkdownBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "unordered-list"; items: string[] };

const INLINE_PATTERN = /\[([^\]]+)\]\((\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;

export function parseInlineMarkdown(value: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = INLINE_PATTERN.exec(value)) !== null) {
    if (match.index > cursor) segments.push({ type: "text", text: value.slice(cursor, match.index) });
    if (match[1] && match[2]) segments.push({ type: "link", text: match[1], href: match[2] });
    else if (match[3]) segments.push({ type: "strong", text: match[3] });
    cursor = match.index + match[0].length;
  }

  if (cursor < value.length) segments.push({ type: "text", text: value.slice(cursor) });
  return segments;
}

export function parseSimpleMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.trim().split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(##|###)\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1] === "##" ? 2 : 3, text: heading[2].trim() });
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, "").trim());
        index += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, "").trim());
        index += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || /^(#{2,3})\s+/.test(next) || /^\d+\.\s+/.test(next) || /^[-*]\s+/.test(next)) break;
      paragraphLines.push(next);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineHtml(value: string): string {
  return parseInlineMarkdown(value).map((segment) => {
    if (segment.type === "link") {
      return `<a href="${escapeHtml(segment.href)}">${escapeHtml(segment.text)}</a>`;
    }
    if (segment.type === "strong") return `<strong>${escapeHtml(segment.text)}</strong>`;
    return escapeHtml(segment.text);
  }).join("");
}

export function renderSimpleMarkdownHtml(markdown: string): string {
  return parseSimpleMarkdown(markdown).map((block) => {
    if (block.type === "heading") {
      const tag = block.level === 2 ? "h2" : "h3";
      return `<${tag}>${inlineHtml(block.text)}</${tag}>`;
    }
    if (block.type === "ordered-list" || block.type === "unordered-list") {
      const tag = block.type === "ordered-list" ? "ol" : "ul";
      return `<${tag}>${block.items.map((item) => `<li>${inlineHtml(item)}</li>`).join("")}</${tag}>`;
    }
    return `<p>${inlineHtml(block.text)}</p>`;
  }).join("\n");
}
