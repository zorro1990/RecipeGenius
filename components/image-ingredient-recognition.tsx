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
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info
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

interface RecognizeApiResponse {
  success: boolean;
  data?: RecognitionResult;
  error?: string;
  message?: string;
}

interface ImageIngredientRecognitionProps {
  onIngredientsConfirmed: (ingredients: string[]) => void;
  className?: string;
  isGenerating?: boolean;
}

type RecognitionState = 'idle' | 'uploading' | 'recognizing' | 'success' | 'error';

export function ImageIngredientRecognition({
  onIngredientsConfirmed,
  className = '',
  isGenerating = false
}: ImageIngredientRecognitionProps) {
  const [state, setState] = useState<RecognitionState>('idle');
  const [selectedImage, setSelectedImage] = useState<{
    file: File;
    dataUrl: string;
  } | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: string;
    suggestions: string[];
    canRetry: boolean;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [showFeatureInfo, setShowFeatureInfo] = useState(false);

  // 处理图片选择
  const handleImageSelect = useCallback(async (file: File, compressedDataUrl: string) => {
    setSelectedImage({ file, dataUrl: compressedDataUrl });
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
            timeout: 60000
          }
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const responseBody = await response.json() as RecognizeApiResponse;

      if (!response.ok) {
        throw new Error(responseBody.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!responseBody.success || !responseBody.data) {
        throw new Error(responseBody.error || '识别失败');
      }

      setRecognitionResult(responseBody.data);
      setState('success');

      // 重置进度
      setTimeout(() => setProgress(0), 1000);

    } catch (error) {
      console.error('食材识别失败:', error);

      // 分析错误类型并提供友好的错误信息
      const errorType = classifyError(error instanceof Error ? error : '识别失败');
      const errorInfo = getUserFriendlyErrorMessage(errorType);

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
    setErrorDetails(null);
    setState('idle');
    setProgress(0);
    setRetryCount(0);
  }, []);

  // 重试识别
  const handleRetry = useCallback(() => {
    if (selectedImage) {
      setRetryCount(prev => prev + 1);
      setErrorDetails(null);
      handleImageSelect(selectedImage.file, selectedImage.dataUrl);
    }
  }, [selectedImage, handleImageSelect]);

  // 确认食材并直接生成菜谱
  const handleIngredientsUpdate = useCallback((ingredients: string[]) => {
    onIngredientsConfirmed(ingredients);
  }, [onIngredientsConfirmed]);

  // 取消操作
  const handleCancel = useCallback(() => {
    handleImageRemove();
    onIngredientsConfirmed([]);
  }, [handleImageRemove, onIngredientsConfirmed]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题 */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Camera className="size-6 text-primary" />
          <h2 className="text-xl font-semibold">AI图片食材识别</h2>
        </div>
        <div className="space-y-3">
          <p className="text-gray-600">
            上传食材图片，AI 将自动识别其中的食材并生成菜谱
          </p>
          <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-primary" />
              <span>支持 JPG / PNG / WebP，单张图片不超过 5MB</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
              onClick={() => setShowFeatureInfo(prev => !prev)}
              aria-expanded={showFeatureInfo}
              aria-controls="ingredient-upload-features"
            >
              <span>{showFeatureInfo ? '收起功能亮点' : '了解更多功能亮点'}</span>
              {showFeatureInfo ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {showFeatureInfo && (
        <Card id="ingredient-upload-features" className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Sparkles className="size-5" />
              功能亮点
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ul className="space-y-2 text-sm text-left">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 size-4 text-blue-600" />
                <span>自动压缩与优化，确保上传快速稳定</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 size-4 text-blue-600" />
                <span>识别结果可编辑，保留手动补充的灵活性</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 size-4 text-blue-600" />
                <span>识别成功后即可一键生成专属菜谱</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

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
          onConfirm={handleIngredientsUpdate}
          onRetry={handleRetry}
          onCancel={handleCancel}
          isLoading={isGenerating}
        />
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
                        generateFallbackIngredients();
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

      {/* 功能说明入口已移至顶部折叠 */}
    </div>
  );
}
