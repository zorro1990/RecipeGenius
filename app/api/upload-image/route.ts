import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/cloudflare-utils';

// export const runtime = 'edge'; // 暂时禁用edge runtime以兼容OpenNext

interface UploadResponse {
  success: boolean;
  data?: {
    imageDataUrl: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    format: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
  error?: string;
  message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    log('info', '开始图片上传处理');

    // 检查Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json({
        success: false,
        error: '请使用multipart/form-data格式上传图片'
      }, { status: 400 });
    }

    // 解析FormData
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: '未找到图片文件'
      }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: `不支持的文件格式。支持的格式：${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`
      }, { status: 400 });
    }

    // 验证文件大小（5MB限制）
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return NextResponse.json({
        success: false,
        error: `文件过大。最大允许5MB，当前文件${(file.size / 1024 / 1024).toFixed(2)}MB`
      }, { status: 400 });
    }

    log('info', '文件验证通过', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 创建Blob并转换为DataURL
    const blob = new Blob([uint8Array], { type: file.type });
    const dataUrl = await blobToDataURL(blob);

    // 获取图片尺寸
    const dimensions = await getImageDimensions(dataUrl);

    // 验证图片尺寸
    const maxDimension = 4096;
    if (dimensions.width > maxDimension || dimensions.height > maxDimension) {
      return NextResponse.json({
        success: false,
        error: `图片尺寸过大。最大允许${maxDimension}x${maxDimension}，当前图片${dimensions.width}x${dimensions.height}`
      }, { status: 400 });
    }

    // 压缩图片（如果需要）
    let compressedDataUrl = dataUrl;
    let compressedSize = file.size;

    if (file.size > 1024 * 1024 || dimensions.width > 1024 || dimensions.height > 1024) {
      try {
        const compressed = await compressImageDataUrl(dataUrl, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.8
        });
        compressedDataUrl = compressed.dataUrl;
        compressedSize = compressed.size;
        
        log('info', '图片压缩完成', {
          originalSize: file.size,
          compressedSize,
          compressionRatio: ((file.size - compressedSize) / file.size * 100).toFixed(2) + '%'
        });
      } catch (error) {
        log('warn', '图片压缩失败，使用原图', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const compressionRatio = file.size > 0 ? (file.size - compressedSize) / file.size : 0;

    log('info', '图片上传处理完成', {
      originalSize: file.size,
      compressedSize,
      compressionRatio: (compressionRatio * 100).toFixed(2) + '%',
      dimensions
    });

    return NextResponse.json({
      success: true,
      data: {
        imageDataUrl: compressedDataUrl,
        originalSize: file.size,
        compressedSize,
        compressionRatio,
        format: file.type,
        dimensions
      }
    });

  } catch (error) {
    log('error', '图片上传处理失败', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      error: '图片处理失败',
      message: '请重试或选择其他图片'
    }, { status: 500 });
  }
}

// 将Blob转换为DataURL
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 获取图片尺寸
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// 压缩图片DataURL
function compressImageDataUrl(
  dataUrl: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    const { maxWidth = 1024, maxHeight = 1024, quality = 0.8 } = options;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // 计算新尺寸
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height);

        // 转换为DataURL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // 计算压缩后的大小
        const size = Math.round((compressedDataUrl.length * 3) / 4);

        resolve({
          dataUrl: compressedDataUrl,
          size
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = reject;
    img.src = dataUrl;
  });
}

// 健康检查
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    service: 'image-upload',
    timestamp: new Date().toISOString(),
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: '5MB',
    maxDimensions: '4096x4096'
  });
}

export const dynamic = 'force-dynamic';
