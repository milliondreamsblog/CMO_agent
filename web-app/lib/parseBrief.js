// Parse the LLM-generated brief markdown into structured sections so the UI can
// render tabs + a calendar instead of one long scroll. Robust to heading-name variance.

export function parseBrief(md) {
  const lines = (md || '').split('\n');
  let title = '';
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h1 = line.match(/^#\s+(.+)/);
    if (h2) { cur = { heading: h2[1].trim(), body: [] }; sections.push(cur); continue; }
    if (h1) { title = h1[1].trim(); continue; }
    if (cur) cur.body.push(line);
  }
  const find = (...kws) => sections.find((s) => kws.some((k) => s.heading.toLowerCase().includes(k)));
  return {
    title,
    tldr: find('tl;dr', 'tldr', 'tl dr'),
    analysis: find('analysis'),
    calendar: find('calendar'),
    voice: find('voice'),
    system: find('system'),
    sections,
  };
}

// Split a calendar section's body into day-slots by ### headings.
export function parseSlots(bodyLines) {
  const slots = [];
  let cur = null;
  for (const line of bodyLines || []) {
    const h3 = line.match(/^###\s+(.+)/);
    if (h3) { cur = { title: h3[1].trim(), body: [] }; slots.push(cur); continue; }
    if (cur) cur.body.push(line);
  }
  return slots;
}
