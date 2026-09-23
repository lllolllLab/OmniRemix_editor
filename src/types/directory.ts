export interface DirectoryItem {
  id: string;
  name: string;
  fileId?: string; // links to open editor file if already open or loaded
  type: 'file' | 'folder';
  extension?: string;
  size?: number;
  handle?: FileSystemFileHandle | null;
  children?: DirectoryItem[];
  isOpen?: boolean;
}
