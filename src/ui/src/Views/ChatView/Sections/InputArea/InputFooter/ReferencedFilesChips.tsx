import type { ReferencedFile } from "./types";

interface ReferencedFilesChipsProps {
  files: ReferencedFile[];
  onRemove: (index: number) => void;
}

function ReferencedFilesChips({ files, onRemove }: ReferencedFilesChipsProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="referencedFiles">
      {files.map((file, index) => (
        <span key={index} className="fileChip" data-tooltip={file.path}>
          <span className="fileChipIcon">{file.type === "directory" ? "📁" : "📄"}</span>
          <span className="fileChipName">{file.name}</span>
          {file.size && file.size > 1_048_576 && <span className="fileChipWarn">⚠️ Large</span>}
          {file.type === "directory" && <span className="fileChipLabel">folder</span>}
          <button className="fileChipRemove" onClick={() => onRemove(index)} aria-label="Remove file">
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}

export default ReferencedFilesChips;
