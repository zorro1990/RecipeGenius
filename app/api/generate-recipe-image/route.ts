import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/cloudflare-utils';
import { Recipe, UserPreferences, FrontendApiKeys } from '@/lib/types';
import { buildSeedreamPrompt, generateSeedreamImage } from '@/lib/seedream';
import { getSecureEnvVar } from '@/lib/cloudflare-utils';

interface GenerateRecipeImageRequest {
  recipe: Recipe;
  preferences?: UserPreferences;
  apiKeys?: FrontendApiKeys;
  seedreamModelId?: string;
  options?: {
    aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9';
    stylePreset?: string;
    size?: string;
    responseFormat?: 'url' | 'b64_json';
    stream?: boolean;
    watermark?: boolean;
    sequentialImageGeneration?: 'disabled' | 'enabled' | 'auto';
    sequentialImageGenerationOptions?: Record<string, unknown>;
    referenceImages?: string[];
    sampler?: string;
    steps?: number;
    cfgScale?: number;
  };
}

interface GenerateRecipeImageResponse {
  success: boolean;
  data?: {
    imageUrl?: string;
    base64?: string;
    prompt: string;
    negativePrompt: string;
  };
  error?: string;
  message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateRecipeImageResponse>> {
  try {
    const body = await request.json() as GenerateRecipeImageRequest;
    const { recipe, preferences, apiKeys, options, seedreamModelId } = body;

    if (!recipe) {
      return NextResponse.json({
        success: false,
        error: '缺少菜谱数据'
      }, { status: 400 });
    }

    const apiKey = apiKeys?.seedream || getSecureEnvVar('SEEDREAM_API_KEY');
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Seedream API Key 未配置，请先在右上角 API 配置中填写'
      }, { status: 400 });
    }

    let fallbackModelId: string | undefined;
    try {
      fallbackModelId = getSecureEnvVar('SEEDREAM_MODEL_ID');
    } catch {
      fallbackModelId = undefined;
    }

    const modelId = seedreamModelId || apiKeys?.seedreamModelId || fallbackModelId;
    if (!modelId) {
      return NextResponse.json({
        success: false,
        error: 'Seedream 模型 ID 未配置，请在 API 设置中填写（例如 doubao-seedream-4-0-250828）'
      }, { status: 400 });
    }

    const { prompt, negativePrompt } = buildSeedreamPrompt(recipe, preferences);
    log('info', '生成 Seedream 图片提示词', {
      recipeTitle: recipe.title,
      promptPreview: prompt.slice(0, 120)
    });

    const result = await generateSeedreamImage(apiKey, prompt, {
      modelId,
      aspectRatio: options?.aspectRatio,
      stylePreset: options?.stylePreset,
      negativePrompt,
      size: options?.size ?? '2K',
      responseFormat: options?.responseFormat ?? 'url',
      stream: options?.stream ?? false,
      watermark: options?.watermark ?? true,
      sequentialImageGeneration: options?.sequentialImageGeneration ?? 'disabled',
      sequentialImageGenerationOptions: options?.sequentialImageGenerationOptions,
      referenceImages: options?.referenceImages,
      sampler: options?.sampler,
      steps: options?.steps,
      cfgScale: options?.cfgScale
    });

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: result.imageUrl,
        base64: result.base64,
        prompt,
        negativePrompt
      }
    }, { status: 200 });

  } catch (error) {
    log('error', '菜谱配图生成失败', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    const message = error instanceof Error ? error.message : '生成菜谱配图失败';
    return NextResponse.json({
      success: false,
      error: message,
      message: '生成图片时出错，请稍后重试'
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
