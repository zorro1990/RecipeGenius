'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle,
  Camera,
  FileImage
} from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File, compressedDataUrl: string) => void;
  onImageRemove: () => void;
  isUploading?: boolean;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
  className?: string;
}

interface ImagePreview {
  file: File;
  dataUrl: string;
  compressedDataUrl: string;
  originalSize: number;
  compressedSize: number;
}

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  isUploading = false,
  maxSizeInMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  className = ''
}: ImageUploadProps) {
  const [preview, setPreview] = useState<ImagePreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 图片压缩函数
  const compressImage = useCallback(async (file: File, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 计算压缩后的尺寸
        const maxWidth = 1024;
        const maxHeight = 1024;
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
        resolve(compressedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // 验证文件
  const validateFile = useCallback((file: File): string | null => {
    // 检查文件类型
    if (!acceptedFormats.includes(file.type)) {
      return `不支持的文件格式。请选择 ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} 格式的图片。`;
    }

    // 检查文件大小
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `文件大小超过限制。请选择小于 ${maxSizeInMB}MB 的图片。`;
    }

    return null;
  }, [acceptedFormats, maxSizeInMB]);

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setCompressionProgress(0);

    // 验证文件
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // 创建原始预览
      const originalDataUrl = URL.createObjectURL(file);
      
      // 模拟压缩进度
      const progressInterval = setInterval(() => {
        setCompressionProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // 压缩图片
      const compressedDataUrl = await compressImage(file);
      
      // 计算压缩后的大小
      const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);
      
      clearInterval(progressInterval);
      setCompressionProgress(100);

      const imagePreview: ImagePreview = {
        file,
        dataUrl: originalDataUrl,
        compressedDataUrl,
        originalSize: file.size,
        compressedSize
      };

      setPreview(imagePreview);
      onImageSelect(file, compressedDataUrl);

      // 重置进度
      setTimeout(() => setCompressionProgress(0), 1000);

    } catch (error) {
      console.error('图片处理失败:', error);
      setError('图片处理失败，请重试。');
      setCompressionProgress(0);
    }
  }, [validateFile, compressImage, onImageSelect]);

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // 点击选择文件
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 文件输入变化
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // 移除图片
  const handleRemove = useCallback(() => {
    setPreview(null);
    setError(null);
    setCompressionProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove();
  }, [onImageRemove]);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上传区域 */}
      {!preview && (
        <Card 
          className={`border-2 border-dashed transition-all duration-200 cursor-pointer hover:border-primary/50 ${
            isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            {isUploading ? (
              <Loader2 className="size-12 text-primary animate-spin mb-4" />
            ) : (
              <div className="flex items-center justify-center size-16 bg-primary/10 rounded-full mb-4">
                <Upload className="size-8 text-primary" />
              </div>
            )}
            
            <h3 className="text-lg font-semibold mb-2">
              {isUploading ? '识别中...' : '上传食材图片'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {isUploading 
                ? 'AI正在识别图片中的食材，请稍候...'
                : '拖拽图片到此处，或点击选择文件'
              }
            </p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FileImage className="size-4" />
                <span>JPG, PNG, WebP</span>
              </div>
              <div className="flex items-center gap-1">
                <Camera className="size-4" />
                <span>最大 {maxSizeInMB}MB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 压缩进度 */}
      {compressionProgress > 0 && compressionProgress < 100 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>正在处理图片...</span>
            <span>{compressionProgress}%</span>
          </div>
          <Progress value={compressionProgress} className="h-2" />
        </div>
      )}

      {/* 图片预览 */}
      {preview && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={preview.dataUrl}
                  alt="预览"
                  className="w-24 h-24 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={handleRemove}
                >
                  <X className="size-3" />
                </Button>
              </div>
              
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-medium">{preview.file.name}</h4>
                  <p className="text-sm text-gray-600">
                    原始大小: {formatFileSize(preview.originalSize)}
                  </p>
                  <p className="text-sm text-gray-600">
                    压缩后: {formatFileSize(preview.compressedSize)}
                    <span className="text-green-600 ml-1">
                      (节省 {Math.round((1 - preview.compressedSize / preview.originalSize) * 100)}%)
                    </span>
                  </p>
                </div>
                
                {isUploading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="size-4 animate-spin" />
                    <span>AI正在识别食材...</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误信息 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}
