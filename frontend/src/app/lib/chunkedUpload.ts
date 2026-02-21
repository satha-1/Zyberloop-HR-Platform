/**
 * Chunked file upload utility for large files
 * Splits files into chunks and uploads them sequentially with progress tracking
 */

export interface ChunkedUploadOptions {
  file: File;
  url: string;
  chunkSize?: number; // in bytes, default 1MB
  onProgress?: (progress: number) => void;
  headers?: Record<string, string>;
}

export interface ChunkedUploadResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function uploadFileInChunks(
  options: ChunkedUploadOptions
): Promise<ChunkedUploadResult> {
  const { file, url, chunkSize = 1024 * 1024, onProgress, headers = {} } = options;
  
  const totalChunks = Math.ceil(file.size / chunkSize);
  const chunks: Blob[] = [];
  
  // Split file into chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
  }

  const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const uploadedChunks: number[] = [];

  try {
    // Upload chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      const formData = new FormData();
      formData.append('chunk', chunks[i]);
      formData.append('chunkIndex', i.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('uploadId', uploadId);
      formData.append('fileName', file.name);
      formData.append('fileSize', file.size.toString());
      formData.append('fileType', file.type);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          // Don't set Content-Type, let browser set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload chunk ${i + 1}/${totalChunks}`);
      }

      uploadedChunks.push(i);
      const progress = ((i + 1) / totalChunks) * 100;
      onProgress?.(progress);
    }

    // Finalize upload
    const finalizeResponse = await fetch(`${url}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        uploadId,
        fileName: file.name,
        totalChunks,
      }),
    });

    if (!finalizeResponse.ok) {
      throw new Error('Failed to finalize upload');
    }

    const result = await finalizeResponse.json();
    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    // Cleanup on error
    try {
      await fetch(`${url}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ uploadId }),
      });
    } catch (cleanupError) {
      console.error('Failed to cleanup chunks:', cleanupError);
    }

    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

/**
 * Simple chunked upload using XMLHttpRequest for better progress tracking
 */
export function uploadFileWithProgress(
  file: File,
  url: string,
  onProgress: (progress: number) => void,
  headers: Record<string, string> = {}
): Promise<ChunkedUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    // Set headers
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            success: true,
            data: response.data,
          });
        } catch (error) {
          resolve({
            success: true,
            data: xhr.responseText,
          });
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('POST', url);
    xhr.send(formData);
  });
}
