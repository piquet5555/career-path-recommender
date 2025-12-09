import React from 'react';

// A robust lightweight markdown-to-JSX renderer
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  // Normalize line endings and split
  const rawLines = content.replace(/\r\n/g, '\n').split('\n');

  // Group lines into Blocks (Text or Table)
  const blocks: { type: 'table' | 'text'; data: string[] | string }[] = [];
  let currentTableLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();
    
    // Check if line is a code block marker (to skip or handle differently, simplified here)
    if (trimmed.startsWith('```')) {
        if (inTable) {
            blocks.push({ type: 'table', data: currentTableLines });
            currentTableLines = [];
            inTable = false;
        }
        continue; 
    }

    // Heuristic: A table line typically starts and ends with | or contains multiple |
    // We strictly look for lines starting with | to be safe, or containing separators.
    const isTableRow = trimmed.startsWith('|') || (trimmed.split('|').length > 2 && trimmed.includes('-'));

    if (isTableRow) {
      inTable = true;
      currentTableLines.push(trimmed);
    } else {
      if (inTable) {
        // We are currently tracking a table.
        if (!trimmed) {
            // It's an empty line. 
            // HEALING LOGIC: If the table has gaps (newlines) between rows, we ignore the empty line 
            // and keep the table open. If the next non-empty line is NOT a table row, we close it then.
            continue; 
        } else {
            // It's a text line. Close the table.
            blocks.push({ type: 'table', data: currentTableLines });
            currentTableLines = [];
            inTable = false;
            blocks.push({ type: 'text', data: line });
        }
      } else {
        // Standard text line
        blocks.push({ type: 'text', data: line });
      }
    }
  }
  // Flush remaining table if any
  if (currentTableLines.length > 0) {
      blocks.push({ type: 'table', data: currentTableLines });
  }

  return (
    <div className="space-y-3 text-gray-800 leading-relaxed text-sm md:text-base font-normal">
      {blocks.map((block, index) => {
        if (block.type === 'table') {
          return <TableBlock key={index} lines={block.data as string[]} />;
        } else {
          return <TextBlock key={index} line={block.data as string} />;
        }
      })}
    </div>
  );
};

// --- Sub-Components ---

const TableBlock: React.FC<{ lines: string[] }> = ({ lines }) => {
    // Need at least 2 lines (Header + Separator) to be a valid table usually
    if (lines.length < 2) {
        return <div className="whitespace-pre-wrap font-mono text-xs">{lines.join('\n')}</div>;
    }

    // Identify separator line (usually contains ---)
    const separatorIndex = lines.findIndex(line => line.includes('---'));
    
    let headers: string[] = [];
    let bodyRows: string[] = [];

    if (separatorIndex > -1) {
        headers = parseTableLine(lines[separatorIndex - 1] || lines[0]);
        // Body is everything after separator, plus everything before header (unlikely but possible)
        // Usually: Header is line before separator. Body is lines after separator.
        bodyRows = lines.slice(separatorIndex + 1);
    } else {
        // Fallback: Assume first line is header
        headers = parseTableLine(lines[0]);
        bodyRows = lines.slice(1);
    }

    return (
        <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {parseInline(h)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {bodyRows.map((row, i) => {
                        const cells = parseTableLine(row);
                        return (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {cells.map((cell, j) => (
                                    <td key={j} className="px-6 py-4 text-sm text-gray-700 align-top">
                                        {parseInline(cell)}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const TextBlock: React.FC<{ line: string }> = ({ line }) => {
    const trimmed = line.trim();
    if (!trimmed) return <div className="h-2" />;

    // H3
    if (line.startsWith('### ')) {
        return <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">{parseInline(line.replace(/^###\s+/, ''))}</h3>;
    }
    // H2
    if (line.startsWith('## ')) {
        return <h2 className="text-xl font-bold text-indigo-700 mt-8 mb-3 pb-2 border-b border-indigo-100">{parseInline(line.replace(/^##\s+/, ''))}</h2>;
    }
    // H1
    if (line.startsWith('# ')) {
        return <h1 className="text-2xl font-bold text-indigo-900 mt-6 mb-4">{parseInline(line.replace(/^#\s+/, ''))}</h1>;
    }

    // List Item (Unordered)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        return (
        <div className="flex items-start ml-4 mb-1">
            <span className="mr-3 text-indigo-500 mt-1.5 text-[0.6rem] flex-shrink-0">●</span>
            <span className="flex-1">{parseInline(line.replace(/^\s*[\-\*\•]\s+/, ''))}</span>
        </div>
        );
    }

    // List Item (Ordered)
    if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\./);
        const number = match ? match[1] : '1';
        return (
            <div className="flex items-start ml-4 mb-1">
            <span className="mr-3 text-indigo-600 font-semibold min-w-[1.25rem] text-right flex-shrink-0">{number}.</span>
            <span className="flex-1">{parseInline(line.replace(/^\s*\d+\.\s+/, ''))}</span>
            </div>
        );
    }

    // Blockquote
    if (line.startsWith('> ')) {
        return (
            <div className="border-l-4 border-indigo-200 pl-4 py-2 italic text-gray-600 bg-gray-50 rounded-r my-2">
                {parseInline(line.replace(/^>\s+/, ''))}
            </div>
        )
    }

    return <p className="mb-2">{parseInline(line)}</p>;
};


// --- Helpers ---

const parseTableLine = (line: string): string[] => {
    // Remove outer pipes if they exist
    let content = line.trim();
    if (content.startsWith('|')) content = content.substring(1);
    if (content.endsWith('|')) content = content.substring(0, content.length - 1);
    
    return content.split('|').map(c => c.trim());
};

const parseInline = (text: string) => {
  // 1. Handle Bold (**text**)
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    
    // 2. Handle Italic/Emphasis (*text*)
    // We split by single asterisks to catch *Emphasis*.
    // Using a regex that captures content between single *
    const italicParts = part.split(/(\*[^\*]+?\*)/g);
    
    return italicParts.map((subPart, j) => {
        if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length >= 2) {
             // Render as font-semibold to act as "bold" per user preference for *Keys:*
            return <span key={`${i}-${j}`} className="font-semibold text-gray-800">{subPart.slice(1, -1)}</span>;
        }

        // 3. Handle Links [Text](url)
        const linkParts = subPart.split(/(\[.*?\]\(.*?\))/g);
        if (linkParts.length > 1) {
            return linkParts.map((lp, k) => {
                const linkMatch = lp.match(/^\[(.*?)\]\((.*?)\)$/);
                if (linkMatch) {
                    return <a key={`${i}-${j}-${k}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{linkMatch[1]}</a>;
                }
                return lp;
            });
        }
        
        return subPart;
    });
  });
};

export default MarkdownRenderer;