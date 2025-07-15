// 图片处理工具函数

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ImageInfo {
  width: number;
  height: number;
  size: number;
  type: string;
  dataUrl: string;
}

// 压缩图片
export async function compressImage(
  file: File, 
  options: ImageCompressionOptions = {}
): Promise<{ dataUrl: string; blob: Blob; info: ImageInfo }> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // 计算新的尺寸
        const { width: newWidth, height: newHeight } = calculateNewDimensions(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        // 绘制图片
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图片压缩失败'));
              return;
            }

            const dataUrl = canvas.toDataURL(format, quality);
            const info: ImageInfo = {
              width: newWidth,
              height: newHeight,
              size: blob.size,
              type: format,
              dataUrl
            };

            resolve({ dataUrl, blob, info });
          },
          format,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = URL.createObjectURL(file);
  });
}

// 计算新的图片尺寸
export function calculateNewDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // 如果图片尺寸小于最大限制，保持原尺寸
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // 计算缩放比例
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);

  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  return { width, height };
}

// 验证图片文件
export function validateImageFile(
  file: File,
  options: {
    maxSizeInMB?: number;
    allowedTypes?: string[];
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<{ isValid: boolean; error?: string }> {
  const {
    maxSizeInMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxWidth = 4096,
    maxHeight = 4096
  } = options;

  return new Promise((resolve) => {
    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      resolve({
        isValid: false,
        error: `不支持的文件格式。支持的格式：${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`
      });
      return;
    }

    // 检查文件大小
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      resolve({
        isValid: false,
        error: `文件大小超过限制。最大允许 ${maxSizeInMB}MB，当前文件 ${(file.size / 1024 / 1024).toFixed(2)}MB`
      });
      return;
    }

    // 检查图片尺寸
    const img = new Image();
    img.onload = () => {
      if (img.width > maxWidth || img.height > maxHeight) {
        resolve({
          isValid: false,
          error: `图片尺寸超过限制。最大允许 ${maxWidth}x${maxHeight}，当前图片 ${img.width}x${img.height}`
        });
      } else {
        resolve({ isValid: true });
      }
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      resolve({
        isValid: false,
        error: '无法读取图片文件，请确保文件未损坏'
      });
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  });
}

// 将DataURL转换为Blob
export function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

// 将Blob转换为DataURL
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 获取图片的EXIF信息并自动旋转
export function getImageOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const dataView = new DataView(arrayBuffer);
      
      // 检查是否为JPEG文件
      if (dataView.getUint16(0) !== 0xFFD8) {
        resolve(1); // 默认方向
        return;
      }

      let offset = 2;
      let marker;
      
      while (offset < dataView.byteLength) {
        marker = dataView.getUint16(offset);
        offset += 2;
        
        if (marker === 0xFFE1) { // EXIF marker
          const exifLength = dataView.getUint16(offset);
          offset += 2;
          
          // 查找方向信息
          // 这里简化处理，实际项目中可能需要更完整的EXIF解析
          resolve(1); // 默认方向
          return;
        } else {
          offset += dataView.getUint16(offset);
        }
      }
      
      resolve(1); // 默认方向
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// 根据EXIF方向旋转图片
export function rotateImageByOrientation(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  orientation: number
): void {
  const { width, height } = img;
  
  switch (orientation) {
    case 2:
      // 水平翻转
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      // 180度旋转
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      // 垂直翻转
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      // 90度旋转 + 水平翻转
      canvas.width = height;
      canvas.height = width;
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      // 90度旋转
      canvas.width = height;
      canvas.height = width;
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      // 270度旋转 + 水平翻转
      canvas.width = height;
      canvas.height = width;
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      // 270度旋转
      canvas.width = height;
      canvas.height = width;
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      // 默认方向，无需变换
      break;
  }
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 检查浏览器是否支持WebP格式
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

// 获取最佳的图片格式
export async function getBestImageFormat(originalType: string): Promise<string> {
  // 如果原始格式是PNG且支持WebP，转换为WebP以获得更好的压缩
  if (originalType === 'image/png' && await supportsWebP()) {
    return 'image/webp';
  }
  
  // 如果原始格式是JPEG，保持JPEG格式
  if (originalType === 'image/jpeg') {
    return 'image/jpeg';
  }
  
  // 默认使用JPEG格式
  return 'image/jpeg';
}
