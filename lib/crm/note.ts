export const maxNoteBytes = 2 * 1024 * 1024;
export const maxNoteLength = 8000;
export type ProjectNote = {
  id: string;
  text: string;
  createdAt: string;
  files: { name: string; size: number }[];
};
