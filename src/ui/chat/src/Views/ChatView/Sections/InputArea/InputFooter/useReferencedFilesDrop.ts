import { useCallback, useEffect, useState } from "react";
import type { ReferencedFile } from "./types";

interface UseReferencedFilesDropOptions {
  referencedFiles: ReferencedFile[];
  onReferencedFilesChange?: (files: ReferencedFile[]) => void;
}

interface FileDropResultMessage {
  type: "fileDropResult";
  files: Array<{ path: string; name: string; content: string; language: string; type: string; size: number }>;
}

export function useReferencedFilesDrop(options: UseReferencedFilesDropOptions) {
  const { referencedFiles, onReferencedFilesChange } = options;
  const [localFiles, setLocalFiles] = useState<ReferencedFile[]>([]);
  const files = onReferencedFilesChange ? referencedFiles : localFiles;

  const appendFiles = useCallback(
    (newFiles: ReferencedFile[]) => {
      if (newFiles.length === 0) {
        return;
      }

      if (onReferencedFilesChange) {
        onReferencedFilesChange(mergeReferencedFiles(referencedFiles, newFiles));
      } else {
        setLocalFiles((prev) => mergeReferencedFiles(prev, newFiles));
      }
    },
    [onReferencedFilesChange, referencedFiles],
  );

  useEffect(() => {
    const handler = (e: MessageEvent<FileDropResultMessage>) => {
      if (e.data.type !== "fileDropResult") {
        return;
      }

      appendFiles(
        e.data.files.map((file) => ({
          path: file.path,
          name: file.name,
          content: file.content,
          language: file.language,
          type: file.type as "file" | "directory",
          size: file.size,
        })),
      );
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [appendFiles]);

  const removeFile = useCallback(
    (index: number) => {
      if (onReferencedFilesChange) {
        onReferencedFilesChange(referencedFiles.filter((_, i) => i !== index));
      } else {
        setLocalFiles((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [onReferencedFilesChange, referencedFiles],
  );

  return {
    files,
    removeFile,
  };
}

function mergeReferencedFiles(currentFiles: ReferencedFile[], newFiles: ReferencedFile[]): ReferencedFile[] {
  const seen = new Set(currentFiles.map((file) => file.path));
  const uniqueNewFiles = newFiles.filter((file) => {
    if (seen.has(file.path)) {
      return false;
    }
    seen.add(file.path);
    return true;
  });
  return [...currentFiles, ...uniqueNewFiles];
}
