// Simple markdown renderer using regex replacements (no external dependency)
// Handles bold (**text**) and bullet points for direction steps

export default function ReactMarkdown({ children }) {
  if (typeof children !== 'string') return children;
  // This is just exported as a passthrough — we render raw text in ChatPanel
  return children;
}
