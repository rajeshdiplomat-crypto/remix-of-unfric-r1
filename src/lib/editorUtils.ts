/**
 * Content Intelligence Utilities for Tiptap and HTML
 */

/**
 * Check if content is JSON (Tiptap JSON format) or HTML
 */
export function isJSONContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

/**
 * Safely parse JSON content
 */
function safeParse(content: any): any {
  if (!content) return null;
  if (typeof content === 'object') return content;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Extract text content from a Tiptap node recursively
 */
export function extractTextFromTiptapNode(node: any): string {
  if (!node) return "";
  if (node.text) return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromTiptapNode).join(" ");
  }
  return "";
}

/**
 * Extract image URLs from HTML content
 */
export function extractImagesFromHTML(html: string): string[] {
  if (!html) return [];

  // Use regex for light weight extraction if DOMParser is overkill or in environments where it's not available
  // However, for browser environments, DOMParser is more reliable
  if (typeof window === 'undefined') {
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/gi);
    if (!imgMatch) return [];
    return imgMatch
      .map(m => m.match(/src=["']([^"']+)["']/i)?.[1])
      .filter((src): src is string => !!src && src.startsWith('http'));
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');

  return Array.from(images)
    .map(img => img.src)
    .filter(src => src && src.startsWith('http'));
}

/**
 * Extract image URLs from TipTap JSON content
 */
export function extractImagesFromTiptapJSON(content: string | object | null | undefined): string[] {
  const parsed = safeParse(content);
  if (!parsed) return [];

  const images: string[] = [];
  const walk = (node: any) => {
    if (!node) return;
    if ((node.type === 'image' || node.type === 'imageResize') && node.attrs?.src) {
      const src = node.attrs.src;
      if (typeof src === 'string' && src.startsWith('http')) {
        images.push(src);
      }
    }
    if (Array.isArray(node.content)) {
      node.content.forEach(walk);
    }
  };

  walk(parsed);
  return images;
}

/**
 * Extract a preview string from Tiptap JSON content
 */
export function extractPreviewFromTiptap(content: any, length: number = 150): string {
  const parsed = safeParse(content);
  if (!parsed?.content) return "";

  const textParts: string[] = [];
  parsed.content.forEach((node: any) => {
    // Usually we want to skip headings for previews in journal context, 
    // or just take everything if it's a generic note
    if (node.type === "paragraph" && node.content) {
      const text = extractTextFromTiptapNode(node);
      if (text) textParts.push(text);
    }
  });

  return textParts.join(" ").trim().slice(0, length);
}

/**
 * Extract the first H1 title from Tiptap JSON content
 */
export function extractTitleFromTiptap(content: any): string | null {
  const parsed = safeParse(content);
  if (!parsed?.content) return null;

  const h1 = parsed.content.find((node: any) => node.type === "heading" && node.attrs?.level === 1);
  if (h1) return extractTextFromTiptapNode(h1).trim() || null;
  return null;
}

/**
 * Get word count from Tiptap JSON content
 */
export function getWordCountFromTiptap(content: any): number {
  const parsed = safeParse(content);
  if (!parsed) return 0;

  const text = extractTextFromTiptapNode(parsed);
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Extract structured answers from Tiptap content based on H2 questions
 */
export function extractAnswersFromTiptap(
  content: any,
  questions: { id: string; text: string }[]
): { question_id: string; answer_text: string }[] {
  const parsed = safeParse(content);
  if (!parsed?.content) return [];

  const answers: { question_id: string; answer_text: string }[] = [];
  let currentQuestionId: string | null = null;
  let currentAnswerParts: string[] = [];

  for (const node of parsed.content) {
    if (node.type === "heading" && node.attrs?.level === 2) {
      if (currentQuestionId) {
        answers.push({
          question_id: currentQuestionId,
          answer_text: currentAnswerParts.join("\n").trim()
        });
      }
      const headingText = extractTextFromTiptapNode(node).trim();
      currentQuestionId = questions.find((q) => q.text === headingText)?.id || null;
      currentAnswerParts = [];
    } else if (currentQuestionId) {
      const text = extractTextFromTiptapNode(node);
      if (text) currentAnswerParts.push(text);
    }
  }

  if (currentQuestionId) {
    answers.push({
      question_id: currentQuestionId,
      answer_text: currentAnswerParts.join("\n").trim()
    });
  }

  return answers;
}

/**
 * Convert Tiptap JSON content to simple HTML
 */
export function tiptapJSONToHTML(json: any): string {
  const parsed = safeParse(json);
  if (!parsed?.content) return '';

  const processNode = (node: any): string => {
    if (!node) return '';

    if (node.text) {
      let text = node.text;
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') text = `<strong>${text}</strong>`;
          if (mark.type === 'italic') text = `<em>${text}</em>`;
          if (mark.type === 'underline') text = `<u>${text}</u>`;
          if (mark.type === 'link') text = `<a href="${mark.attrs?.href || '#'}">${text}</a>`;
        }
      }
      return text;
    }

    const children = node.content?.map(processNode).join('') || '';

    switch (node.type) {
      case 'doc': return children;
      case 'paragraph': return `<p>${children || '<br>'}</p>`;
      case 'heading':
        const level = node.attrs?.level || 2;
        return `<h${level}>${children}</h${level}>`;
      case 'bulletList': return `<ul>${children}</ul>`;
      case 'orderedList': return `<ol>${children}</ol>`;
      case 'listItem': return `<li>${children}</li>`;
      case 'taskList': return `<ul data-type="taskList">${children}</ul>`;
      case 'taskItem':
        const checked = node.attrs?.checked ? 'checked' : '';
        return `<li data-type="taskItem" data-checked="${checked}">${children}</li>`;
      case 'image':
      case 'imageResize':
        return `<img src="${node.attrs?.src || ''}" alt="${node.attrs?.alt || ''}" />`;
      case 'hardBreak': return '<br>';
      default: return children;
    }
  };

  return processNode(parsed);
}
