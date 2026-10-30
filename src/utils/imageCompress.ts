/**
 * Client-side WebP image compression for Handouts & Maps (Step 4.3).
 * Enforces the 400 KB per-file cap while maintaining high visual clarity.
 */

import { MAX_HANDOUT_MEDIA_BYTES } from '../../shared/rules/handoutEngine';

export interface CompressedImageResult {
  dataBase64: string;
  sizeBytes: number;
  width: number;
  height: number;
  mimeType: string;
  fileName: string;
}

/**
 * Compresses an image file to WebP format, scaling down if dimensions exceed maxDim,
 * and stepping down quality until the size is under maxSizeBytes (default 400 KB).
 */
export async function compressImageToWebp(
  file: File | Blob,
  fileName: string = 'handout.webp',
  maxSizeBytes: number = MAX_HANDOUT_MEDIA_BYTES,
  maxDimension: number = 2048
): Promise<CompressedImageResult> {
  // If not running in browser environment (e.g. tests), return mock or direct read
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      dataBase64: '',
      sizeBytes: file.size,
      width: 800,
      height: 600,
      mimeType: 'image/webp',
      fileName
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('قالب تصویر پشتیبانی نمی‌شود یا فایل خراب است.'));
      img.onload = async () => {
        try {
          let { width, height } = img;

          // Scale down proportionally if larger than maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('عدم امکان ایجاد کانتکست گرافیکی Canvas');
          }

          // Smooth rendering for maps and drawings
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Quality stepping: 0.88 -> 0.78 -> 0.68 -> 0.55
          const qualities = [0.88, 0.78, 0.68, 0.58, 0.45];
          let bestDataUrl = '';
          let bestSizeBytes = 0;

          for (const q of qualities) {
            const dataUrl = canvas.toDataURL('image/webp', q);
            // Calculate actual byte size from base64
            const clean = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            const size = Math.round((clean.length * 3) / 4);

            bestDataUrl = dataUrl;
            bestSizeBytes = size;

            if (size <= maxSizeBytes) {
              break;
            }
          }

          // If still over 400KB, try scaling down dimensions by 75%
          if (bestSizeBytes > maxSizeBytes) {
            canvas.width = Math.round(width * 0.75);
            canvas.height = Math.round(height * 0.75);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/webp', 0.65);
            const clean = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            bestDataUrl = dataUrl;
            bestSizeBytes = Math.round((clean.length * 3) / 4);
          }

          if (bestSizeBytes > maxSizeBytes) {
            throw new Error(
              `حجم تصویر پس از فشرده‌سازی (${Math.round(bestSizeBytes / 1024)} کیلوبایت) بیش از سقف ۴۰۰ کیلوبایت است.`
            );
          }

          const cleanBase64 = bestDataUrl.includes(',') ? bestDataUrl.split(',')[1] : bestDataUrl;

          resolve({
            dataBase64: cleanBase64,
            sizeBytes: bestSizeBytes,
            width: canvas.width,
            height: canvas.height,
            mimeType: 'image/webp',
            fileName: fileName.replace(/\.[^/.]+$/, '') + '.webp'
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}

export function base64ToFile(compressed: CompressedImageResult): File {
  const byteCharacters = atob(compressed.dataBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: compressed.mimeType });
  return new File([blob], compressed.fileName, { type: compressed.mimeType });
}
