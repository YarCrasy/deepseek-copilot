export interface ReferencedFile {
  path: string;
  name: string;
  content?: string;
  language?: string;
  type: "file" | "directory";
  size?: number;
}
