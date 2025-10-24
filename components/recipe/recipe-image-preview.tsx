'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Recipe, UserPreferences, FrontendApiKeys } from '@/lib/types';
import { getStoredAPIKeys } from '@/lib/api-key-storage';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import NextImage from 'next/image';
import { Loader2, RefreshCw, Settings } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error' | 'missingKey';

interface RecipeImagePreviewProps {
  recipe: Recipe;
  preferences?: UserPreferences | null;
  onOpenSettings?: () => void;
}

interface CachedImage {
  imageUrl?: string;
  base64?: string;
  prompt?: string;
  updatedAt: string;
}

const CACHE_PREFIX = 'recipe-image-cache:';

function buildFrontendApiKeys(): FrontendApiKeys | undefined {
  try {
    const stored = getStoredAPIKeys();
    if (!stored) return undefined;

    const keys: FrontendApiKeys = {
      deepseek: stored.deepseek,
      doubao: stored.doubao && stored.doubaoEndpointId
        ? {
            key: stored.doubao,
            endpointId: stored.doubaoEndpointId
          }
        : undefined,
      qwen: stored.qwen,
      glm: stored.glm,
      gemini: stored.gemini,
      seedream: stored.seedream,
      seedreamModelId: stored.seedreamModelId
    };

    if (
      !keys.deepseek &&
      !keys.doubao &&
      !keys.qwen &&
      !keys.glm &&
      !keys.gemini &&
      !keys.seedream
    ) {
      return undefined;
    }

    return keys;
  } catch (error) {
    console.error('读取存储的API密钥失败:', error);
    return undefined;
  }
}

function getCacheKey(recipeId: string): string {
  return `${CACHE_PREFIX}${recipeId}`;
}

function getCachedImage(recipeId: string): CachedImage | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getCacheKey(recipeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedImage;
    if (!parsed || (!parsed.imageUrl && !parsed.base64)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedImage(recipeId: string, data: CachedImage): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getCacheKey(recipeId), JSON.stringify(data));
  } catch (error) {
    console.warn('缓存菜谱配图失败:', error);
  }
}

function clearCachedImage(recipeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getCacheKey(recipeId));
  } catch (error) {
    console.warn('清除菜谱配图缓存失败:', error);
  }
}

export function RecipeImagePreview({ recipe, preferences, onOpenSettings }: RecipeImagePreviewProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [promptPreview, setPromptPreview] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hasSeedreamKey, setHasSeedreamKey] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(getStoredAPIKeys().seedream);
  });
  const [hasSeedreamModelId, setHasSeedreamModelId] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(getStoredAPIKeys().seedreamModelId);
  });

  const cacheData = useMemo(() => {
    if (!isMounted) return null;
    return recipe.id ? getCachedImage(recipe.id) : null;
  }, [isMounted, recipe.id]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectKey = () => {
      const storedKeys = getStoredAPIKeys();
      setHasSeedreamKey(Boolean(storedKeys.seedream));
      setHasSeedreamModelId(Boolean(storedKeys.seedreamModelId));
    };

    const storageListener = (event: StorageEvent) => {
      if (event.key === 'recipe-genius-api-keys') {
        detectKey();
      }
    };

    detectKey();
    window.addEventListener('storage', storageListener);
    const interval = window.setInterval(detectKey, 2000);

    return () => {
      window.removeEventListener('storage', storageListener);
      window.clearInterval(interval);
    };
  }, []);

  const resolveImageSrc = useCallback((data?: CachedImage | null) => {
    if (!data) return null;
    if (data.imageUrl) return data.imageUrl;
    if (data.base64) {
      const prefix = data.base64.startsWith('data:image')
        ? ''
        : 'data:image/png;base64,';
      return `${prefix}${data.base64}`;
    }
    return null;
  }, []);

  const generateImage = useCallback(async (force = false) => {
    if (!recipe?.id) return;
    if (!isMounted) return;

    setError(null);

    if (!force) {
      const cached = getCachedImage(recipe.id);
      const cachedSrc = resolveImageSrc(cached);
      if (cached && cachedSrc) {
        setImageSrc(cachedSrc);
        setPromptPreview(cached.prompt ?? null);
        setStatus('success');
        return;
      }
    }

    const stored = getStoredAPIKeys();
    if (!stored.seedream || !stored.seedreamModelId) {
      setStatus('missingKey');
      setError('尚未配置 Seedream API Key 或模型 ID');
      return;
    }

    const apiKeys = buildFrontendApiKeys();

    setStatus('loading');
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      controller.abort();
    }, 120000);

    try {
      const response = await fetch('/api/generate-recipe-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe,
          preferences,
          apiKeys,
          seedreamModelId: stored.seedreamModelId
        }),
        signal: controller.signal
      });

      const result = await response.json() as {
        success: boolean;
        data?: { imageUrl?: string; base64?: string; prompt: string };
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.success || !result.data) {
        const message = result.error || result.message || '生成菜谱配图失败';
        setError(message);
        setStatus(response.status === 400 && message.includes('Key') ? 'missingKey' : 'error');
        return;
      }

      const src = result.data.imageUrl || (result.data.base64
        ? `data:image/png;base64,${result.data.base64}`
        : null);

      if (!src) {
        setError('未收到有效的图片结果');
        setStatus('error');
        return;
      }

      setImageSrc(src);
      setPromptPreview(result.data.prompt.slice(0, 160));
      setStatus('success');

      saveCachedImage(recipe.id, {
        imageUrl: result.data.imageUrl,
        base64: result.data.base64,
        prompt: result.data.prompt,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('生成图片超时，请稍后重试');
      } else if (err instanceof Error) {
        setError(err.message || '生成菜谱配图失败');
      } else {
        setError('生成菜谱配图失败');
      }
      setStatus('error');
    } finally {
      window.clearTimeout(timer);
    }
  }, [isMounted, preferences, recipe, resolveImageSrc]);

  useEffect(() => {
    if (!recipe?.id || !isMounted) return;

    const cachedSrc = resolveImageSrc(cacheData ?? undefined);
    if (cachedSrc) {
      setImageSrc(cachedSrc);
      setPromptPreview(cacheData?.prompt ?? null);
      setStatus('success');
      return;
    }

    if (!hasSeedreamKey || !hasSeedreamModelId) {
      setStatus('missingKey');
      setError('尚未配置 Seedream API Key 或模型 ID');
      return;
    }

    generateImage();
  }, [cacheData, generateImage, hasSeedreamKey, hasSeedreamModelId, isMounted, recipe?.id, resolveImageSrc]);

  const handleRetry = useCallback(() => {
    if (!recipe?.id) return;
    clearCachedImage(recipe.id);
    generateImage(true);
  }, [generateImage, recipe?.id]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-3">
      {status === 'loading' && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50">
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="size-8 animate-spin text-orange-500" />
            <p className="text-sm text-gray-600">AI 正在生成菜品图片，请稍候...</p>
          </div>
        </div>
      )}

      {status === 'success' && imageSrc && (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="relative w-full overflow-hidden">
            <NextImage
              src={imageSrc}
              alt={`${recipe.title} 的 AI 生成图片`}
              width={960}
              height={720}
              className="w-full object-cover"
              unoptimized
              priority={false}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 border-t bg-gray-50">
            <span>由 Seedream 4.0 生成</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={handleRetry}
            >
              <RefreshCw className="size-3 mr-1" />
              重新生成
            </Button>
          </div>
          {promptPreview && (
            <div className="px-4 pb-3">
              <p className="text-[11px] leading-relaxed text-gray-500">
                提示词预览：{promptPreview}
              </p>
            </div>
          )}
        </div>
      )}

      {(status === 'error' || status === 'missingKey') && (
        <Alert variant="destructive">
          <AlertDescription className="space-y-2">
            <div>{error || '生成菜谱配图失败，请稍后重试。'}</div>
            <div className="flex flex-wrap items-center gap-2">
              {status === 'missingKey' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={onOpenSettings}
                >
                  <Settings className="size-3 mr-1" />
                  前往配置 Seedream Key
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
              >
                <RefreshCw className="size-3 mr-1" />
                重试生成
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status === 'idle' && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50">
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
            <p className="text-sm text-gray-600">
              点击下方按钮生成菜谱配图，展示成品视觉效果。
            </p>
            <Button onClick={() => generateImage(true)} size="sm">
              <RefreshCw className="size-4 mr-2" />
              生成菜谱图片
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
