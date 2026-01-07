/**
 * Extract image URLs from HTML content
 */
export function extractImagesFromHTML(html: string): string[] {
  if (!html) return [];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');
  
  return Array.from(images)
    .map(img => img.src)
    .filter(src => src && src.startsWith('http'));
}

/**
 * Check if content is JSON (Tiptap JSON format) or HTML
 */
export function isJSONContent(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

/**
 * Convert Tiptap JSON content to simple HTML (for migration)
 * This is a basic conversion - the editor will handle proper parsing
 */
export function tiptapJSONToHTML(json: string): string {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    if (!parsed?.content) return '';
    
    const processNode = (node: any): string => {
      if (!node) return '';
      
      // Text node
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
      
      // Process children
      const children = node.content?.map(processNode).join('') || '';
      
      // Handle different node types
      switch (node.type) {
        case 'doc':
          return children;
        case 'paragraph':
          return `<p>${children || '<br>'}</p>`;
        case 'heading':
          const level = node.attrs?.level || 2;
          return `<h${level}>${children}</h${level}>`;
        case 'bulletList':
          return `<ul>${children}</ul>`;
        case 'orderedList':
          return `<ol>${children}</ol>`;
        case 'listItem':
          return `<li>${children}</li>`;
        case 'taskList':
          return `<ul data-type="taskList">${children}</ul>`;
        case 'taskItem':
          const checked = node.attrs?.checked ? 'checked' : '';
          return `<li data-type="taskItem" data-checked="${checked}">${children}</li>`;
        case 'image':
          return `<img src="${node.attrs?.src || ''}" alt="${node.attrs?.alt || ''}" />`;
        case 'hardBreak':
          return '<br>';
        default:
          return children;
      }
    };
    
    return processNode(parsed);
  } catch (e) {
    console.error('Failed to convert JSON to HTML:', e);
    return '';
  }
}
