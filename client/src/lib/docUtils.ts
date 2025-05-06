import { Document } from "docx";

export function highlightDifferences(
  original: string,
  tailored: string
): { added: string[]; removed: string[]; modified: string[] } {
  // This is a simplified implementation
  // In a real app, this would use a proper diff algorithm
  
  const originalLines = original.split("\n");
  const tailoredLines = tailored.split("\n");
  
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];
  
  // Find added lines (in tailored but not in original)
  tailoredLines.forEach(line => {
    if (!originalLines.includes(line) && line.trim().length > 0) {
      added.push(line);
    }
  });
  
  // Find removed lines (in original but not in tailored)
  originalLines.forEach(line => {
    if (!tailoredLines.includes(line) && line.trim().length > 0) {
      removed.push(line);
    }
  });
  
  // Simple modification detection (needs improvement in real implementation)
  originalLines.forEach((line, i) => {
    if (i < tailoredLines.length) {
      const tailoredLine = tailoredLines[i];
      if (line !== tailoredLine && 
          !added.includes(tailoredLine) && 
          !removed.includes(line) &&
          line.trim().length > 0 &&
          tailoredLine.trim().length > 0) {
        modified.push(`${line} → ${tailoredLine}`);
      }
    }
  });
  
  return { added, removed, modified };
}

export function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} bytes`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export function getFileTypeIcon(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case 'docx':
    case 'doc':
      return 'file-text';
    case 'pdf':
      return 'file-type-pdf';
    case 'gdoc':
      return 'file-text';
    default:
      return 'file';
  }
}

export function getDocumentTypeLabel(type: string): string {
  switch (type) {
    case 'cv':
      return 'CV / Resume';
    case 'cover':
      return 'Cover Letter';
    case 'both':
      return 'CV & Cover Letter';
    default:
      return 'Document';
  }
}
