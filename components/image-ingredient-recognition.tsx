'use client';

import { useState, useCallback } from 'react';
import { ImageUpload } from './image-upload';
import { IngredientRecognitionResult } from './ingredient-recognition-result';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { getStoredAPIKeys } from '@/lib/api-key-storage';
import {
  classifyError,
  getUserFriendlyErrorMessage,
  generateFallbackIngredients,
  RecognitionErrorType
} from '@/lib/image-recognition-fallback';

interface RecognitionResult {
  ingredients: string[];
  confidence: number;
  description: string;
  suggestions?: string[];
  categories?: string[];
  processingTime?: number;
}

interface ImageIngredientRecognitionProps {
  onIngredientsConfirmed: (ingredients: string[]) => void;
  className?: string;
}

type RecognitionState = 'idle' | 'uploading' | 'recognizing' | 'success' | 'confirmed' | 'error';

export function ImageIngredientRecognition({
  onIngredientsConfirmed,
  className = ''
}: ImageIngredientRecognitionProps) {
  const [state, setState] = useState<RecognitionState>('idle');
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    dataUrl: string;
  } | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: string;
    suggestions: string[];
    canRetry: boolean;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // 处理图片选择
  const handleImageSelect = useCallback(async (file: File, compressedDataUrl: string) => {
    setSelectedImage({ file, dataUrl: compressedDataUrl });
    setError(null);
    setState('recognizing');
    setProgress(0);

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 获取前端API密钥
      const apiKeys = getStoredAPIKeys();

      // 调用识别API
      const response = await fetch('/api/recognize-ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUrl: compressedDataUrl,
          apiKeys: {
            doubao: apiKeys.doubao ? {
              key: apiKeys.doubao,
              endpointId: apiKeys.doubaoEndpointId
            } : undefined
          },
          options: {
            maxRetries: 2,
            timeout: 30000
          }
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as any;

      if (!data.success) {
        throw new Error(data.error || '识别失败');
      }

      setRecognitionResult(data.data);
      setState('success');

      // 重置进度
      setTimeout(() => setProgress(0), 1000);

    } catch (error) {
      console.error('食材识别失败:', error);

      // 分析错误类型并提供友好的错误信息
      const errorType = classifyError(error instanceof Error ? error : '识别失败');
      const errorInfo = getUserFriendlyErrorMessage(errorType);

      setError(error instanceof Error ? error.message : '识别失败，请重试');
      setErrorDetails(errorInfo);
      setState('error');
      setProgress(0);

      // 如果是某些特定错误，提供回退方案
      if (errorType === RecognitionErrorType.API_KEY_MISSING ||
          errorType === RecognitionErrorType.API_QUOTA_EXCEEDED) {
        // 可以在这里提供手动输入的建议
        const fallbackResult = generateFallbackIngredients();
        console.log('提供回退建议:', fallbackResult.suggestions);
      }
    }
  }, []);

  // 处理图片移除
  const handleImageRemove = useCallback(() => {
    setSelectedImage(null);
    setRecognitionResult(null);
    setError(null);
    setErrorDetails(null);
    setState('idle');
    setProgress(0);
    setRetryCount(0);
  }, []);

  // 重试识别
  const handleRetry = useCallback(() => {
    if (selectedImage) {
      setRetryCount(prev => prev + 1);
      setError(null);
      setErrorDetails(null);
      handleImageSelect(selectedImage.file, selectedImage.dataUrl);
    }
  }, [selectedImage, handleImageSelect]);

  // 确认食材并直接生成菜谱
  const handleConfirmIngredients = useCallback((ingredients: string[]) => {
    onIngredientsConfirmed(ingredients);
    // 保持识别结果，但切换到确认状态
    setState('confirmed');

    // 直接触发菜谱生成
    setTimeout(() => {
      const generateButton = document.querySelector('[data-generate-button]') as HTMLButtonElement;
      if (generateButton && !generateButton.disabled) {
        generateButton.click();
      }
    }, 500); // 给用户一点时间看到确认状态
  }, [onIngredientsConfirmed]);

  // 取消操作
  const handleCancel = useCallback(() => {
    handleImageRemove();
  }, [handleImageRemove]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题 */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Camera className="size-6 text-primary" />
          <h2 className="text-xl font-semibold">AI图片食材识别</h2>
        </div>
        <p className="text-gray-600">
          上传食材图片，AI将自动识别其中的食材并生成菜谱
        </p>
      </div>

      {/* 图片上传区域 */}
      {state === 'idle' && (
        <ImageUpload
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
          isUploading={false}
          maxSizeInMB={5}
          acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
        />
      )}

      {/* 识别进度 */}
      {state === 'recognizing' && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <Loader2 className="size-12 text-primary animate-spin" />
                  <Sparkles className="size-6 text-yellow-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">AI正在识别食材...</h3>
                <p className="text-gray-600 mb-4">
                  请稍候，这通常需要几秒钟时间
                </p>
              </div>

              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>识别进度</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={progress > 50}
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 识别结果 */}
      {state === 'success' && recognitionResult && (
        <IngredientRecognitionResult
          result={recognitionResult}
          onConfirm={handleConfirmIngredients}
          onRetry={handleRetry}
          onCancel={handleCancel}
          isLoading={false}
        />
      )}

      {/* 确认状态 - 显示已确认的食材和生成按钮 */}
      {state === 'confirmed' && recognitionResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle className="size-6" />
                <h3 className="text-lg font-semibold">食材已确认</h3>
              </div>

              <p className="text-green-600 text-sm">
                已成功识别并添加食材到您的列表中，现在可以生成菜谱了！
              </p>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    // 重置到初始状态，允许重新识别
                    setSelectedImage(null);
                    setRecognitionResult(null);
                    setError(null);
                    setState('idle');
                  }}
                  variant="outline"
                  size="sm"
                >
                  重新识别
                </Button>

                <Button
                  onClick={() => {
                    // 直接触发菜谱生成
                    const generateButton = document.querySelector('[data-generate-button]') as HTMLButtonElement;
                    if (generateButton && !generateButton.disabled) {
                      generateButton.click();
                    } else {
                      // 如果按钮不可用，滚动到生成区域
                      generateButton?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Sparkles className="size-4 mr-2" />
                  立即生成菜谱
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误状态 */}
      {state === 'error' && errorDetails && (
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>
                <div className="space-y-4">
                  <div>
                    <strong>{errorDetails.title}</strong>
                    <p className="mt-1 text-sm">{errorDetails.message}</p>
                    {retryCount > 0 && (
                      <p className="mt-1 text-xs text-gray-600">
                        已重试 {retryCount} 次
                      </p>
                    )}
                  </div>

                  {/* 解决建议 */}
                  {errorDetails.suggestions.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">解决建议：</p>
                      <ul className="text-sm space-y-1">
                        {errorDetails.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-xs mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {errorDetails.canRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        disabled={!selectedImage || retryCount >= 3}
                      >
                        <RefreshCw className="size-4 mr-2" />
                        {retryCount >= 3 ? '已达最大重试次数' : '重试'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      重新选择图片
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // 提供手动输入的回退方案
                        const fallback = generateFallbackIngredients();
                        onIngredientsConfirmed([]);
                      }}
                    >
                      手动输入食材
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* 功能说明 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Sparkles className="size-5" />
            功能特点
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="size-4 text-blue-600" />
              支持JPG、PNG、WebP格式图片
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="size-4 text-blue-600" />
              自动压缩优化，提升识别速度
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="size-4 text-blue-600" />
              AI智能识别，支持多种食材
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="size-4 text-blue-600" />
              可编辑结果，确保准确性
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="size-4 text-blue-600" />
              一键生成菜谱，省时省力
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
