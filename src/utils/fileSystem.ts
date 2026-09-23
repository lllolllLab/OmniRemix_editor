import { EditorFile } from '../types';

export interface OpenedFileResult {
  id: string;
  name: string;
  content: string;
  handle?: FileSystemFileHandle | null;
}

/**
 * Open one or multiple local HTML files via File System Access API or file input fallback
 */
export async function openLocalHtmlFiles(): Promise<OpenedFileResult[]> {
  // 1. Try File System Access API
  if ('showOpenFilePicker' in window) {
    try {
      const picker = (window as unknown as {
        showOpenFilePicker: (options?: unknown) => Promise<FileSystemFileHandle[]>;
      }).showOpenFilePicker;

      const handles = await picker({
        multiple: true,
        types: [
          {
            description: 'HTML Files',
            accept: {
              'text/html': ['.html', '.htm'],
              'text/plain': ['.txt', '.svg'],
            },
          },
        ],
      });

      const results: OpenedFileResult[] = [];
      for (const handle of handles) {
        const file = await handle.getFile();
        const content = await file.text();
        results.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: handle.name,
          content,
          handle,
        });
      }
      return results;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        return [];
      }
      console.warn('showOpenFilePicker failed, falling back to input:', err);
    }
  }

  // 2. Fallback using file input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.html,.htm,text/html,text/plain';

    input.onchange = async () => {
      const files = input.files;
      if (!files || files.length === 0) {
        resolve([]);
        return;
      }

      const results: OpenedFileResult[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const content = await f.text();
        results.push({
          id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          name: f.name,
          content,
          handle: null,
        });
      }
      resolve(results);
    };

    input.click();
  });
}

/**
 * Save current file to disk directly (if handle exists) or prompt save as
 */
export async function saveLocalFile(
  file: EditorFile,
  promptSaveAs = false
): Promise<{ success: boolean; handle?: FileSystemFileHandle | null; error?: string }> {
  // If file already has a handle and user didn't explicitly request "Save As"
  if (file.handle && !promptSaveAs) {
    try {
      const writable = await (file.handle as unknown as {
        createWritable: () => Promise<FileSystemWritableFileStream>;
      }).createWritable();
      await writable.write(file.content);
      await writable.close();
      return { success: true, handle: file.handle };
    } catch (err) {
      console.warn('Failed to write using existing handle, prompting Save As:', err);
    }
  }

  // Use showSaveFilePicker if available
  if ('showSaveFilePicker' in window) {
    try {
      const picker = (window as unknown as {
        showSaveFilePicker: (options?: unknown) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker;

      const handle = await picker({
        suggestedName: file.name.endsWith('.html') || file.name.endsWith('.htm') ? file.name : `${file.name}.html`,
        types: [
          {
            description: 'HTML File',
            accept: { 'text/html': ['.html', '.htm'] },
          },
        ],
      });

      const writable = await (handle as unknown as {
        createWritable: () => Promise<FileSystemWritableFileStream>;
      }).createWritable();
      await writable.write(file.content);
      await writable.close();

      return { success: true, handle };
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        return { success: false, error: 'User cancelled' };
      }
      console.warn('showSaveFilePicker failed, downloading blob:', err);
    }
  }

  // Fallback: Blob download
  try {
    const blob = new Blob([file.content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.endsWith('.html') || file.name.endsWith('.htm') ? file.name : `${file.name}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, handle: null };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
