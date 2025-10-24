import { Recipe, UserPreferences, Ingredient } from './types';
import { log } from './cloudflare-utils';

export interface SeedreamGenerationOptions {
  modelId?: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9';
  stylePreset?: string;
  negativePrompt?: string;
  sampler?: string;
  steps?: number;
  cfgScale?: number;
  size?: string;
  responseFormat?: 'url' | 'b64_json';
  stream?: boolean;
  watermark?: boolean;
  sequentialImageGeneration?: 'disabled' | 'enabled' | 'auto';
  sequentialImageGenerationOptions?: Record<string, unknown>;
  referenceImages?: string[];
}

export interface SeedreamGenerationResult {
  imageUrl?: string;
  base64?: string;
  requestId?: string;
  prompt: string;
}

const DEFAULT_NEGATIVE_PROMPT = [
  'lowres',
  'deformed hands',
  'overexposed',
  'underexposed',
  'extra limbs',
  'mutated',
  'blurry',
  'text',
  'watermark',
  'logo'
].join(', ');

const DEFAULT_ASPECT_RATIO: SeedreamGenerationOptions['aspectRatio'] = '4:3';
const DEFAULT_STYLE_PRESET = 'food_photography';
const DEFAULT_CFG_SCALE = 7;
const DEFAULT_STEPS = 25;
const DEFAULT_SAMPLER = 'dpmpp_2m';
const DEFAULT_SIZE = '1536x1152';
const DEFAULT_SEEDREAM_MODEL = process.env.SEEDREAM_MODEL_ID || 'seedream-4.0';
const DEFAULT_ENDPOINT =
  process.env.SEEDREAM_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

type SeedreamImageItem = {
  url?: string;
  b64_json?: string;
  base64?: string;
  b64?: string;
};

interface SeedreamAPIResponse {
  data?: SeedreamImageItem[] | {
    task_id?: string;
    images?: SeedreamImageItem[];
    image_urls?: string[];
    image_list?: SeedreamImageItem[];
  };
  request_id?: string;
  code?: number;
  msg?: string;
  message?: string;
}

const INGREDIENT_DESCRIPTORS: Array<{
  match: RegExp;
  zh: string;
  en: string;
}> = [
  { match: /土豆|马铃薯|potato/i, zh: '金黄软糯的土豆块', en: 'golden potato chunks' },
  { match: /金针菇|enoki/i, zh: '散开的金针菇束', en: 'bundled enoki mushrooms' },
  { match: /宽粉|粉条|glass noodle|vermicelli/i, zh: '吸饱汤汁的宽粉条', en: 'wide glass noodles soaked in broth' },
  { match: /上海青|青菜|bok choy/i, zh: '翠绿爽脆的上海青', en: 'vibrant bok choy' },
  { match: /肥牛|牛肉|beef/i, zh: '卷起的肥牛片', en: 'rolled beef slices' },
  { match: /千张|腐竹|tofu skin/i, zh: '折叠整齐的千张卷', en: 'folded tofu sheets' },
  { match: /鱼丸|丸子|fish ball/i, zh: '弹嫩的鱼丸', en: 'springy fish balls' },
  { match: /鸭血|blood curd/i, zh: '鲜嫩的鸭血块', en: 'silky duck blood cubes' },
  { match: /白萝卜|radish|daikon/i, zh: '清甜的白萝卜片', en: 'sweet daikon slices' },
  { match: /牛油火锅底料|hotpot base/i, zh: '牛油火锅底料调制的红汤', en: 'buttery hotpot broth' },
  { match: /香菇|蘑菇|mushroom/i, zh: '玲珑香菇', en: 'decorative shiitake mushrooms' },
  { match: /虾|对虾|prawn|shrimp/i, zh: '鲜嫩的大虾', en: 'succulent prawns' },
];

function describeIngredient(ingredient: Ingredient): { zh: string; en: string } {
  const descriptor = INGREDIENT_DESCRIPTORS.find(item => item.match.test(ingredient.name));
  if (descriptor) {
    return descriptor;
  }

  const quantity = ingredient.quantity ? `${ingredient.quantity}${ingredient.unit ?? ''}` : '';
  return {
    zh: `${ingredient.name}${quantity ? `（${quantity}）` : ''}`,
    en: quantity ? `${ingredient.name} (${quantity})` : ingredient.name,
  };
}

function normalizeTags(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return '';
  return tags.map(tag => tag.replace(/[#,]/g, '').trim()).filter(Boolean).join(', ');
}

function buildIngredientNarrative(ingredients: Ingredient[]): {
  zhPrimary: string;
  zhSecondary?: string;
  enHighlights: string;
} {
  const descriptors = ingredients.map(describeIngredient);
  const primaryZh = descriptors.slice(0, 6).map(item => item.zh).join('、');
  const extraZh = descriptors.length > 6
    ? descriptors.slice(6).map(item => item.zh).join('、')
    : undefined;
  const enHighlights = descriptors.slice(0, 6).map(item => item.en).join(', ');

  return {
    zhPrimary: primaryZh,
    zhSecondary: extraZh,
    enHighlights,
  };
}

function deriveCuisine(preferences?: UserPreferences): string {
  if (!preferences?.cuisineType || preferences.cuisineType.length === 0) {
    return 'Modern Chinese home cooking';
  }
  return preferences.cuisineType.join('、');
}

function deriveCookingMood(recipe: Recipe): string {
  if (recipe.tags && recipe.tags.length > 0) {
    return recipe.tags.slice(0, 3).join('、');
  }
  if (recipe.description && recipe.description.length > 0) {
    return recipe.description.slice(0, 24);
  }
  return '色香味俱全的家庭料理';
}

function derivePresentation(difficulty: Recipe['difficulty']): string {
  switch (difficulty) {
    case 'easy':
      return 'home-style plating on a white ceramic plate, cozy morning light';
    case 'medium':
      return 'balanced plating with neat ingredient layering, soft afternoon light';
    case 'hard':
      return 'chef-level plating with artistic garnish, dramatic rim lighting and depth of field';
    default:
      return 'appetizing plating with natural light and gentle steam';
  }
}

export function buildSeedreamPrompt(recipe: Recipe, preferences?: UserPreferences): { prompt: string; negativePrompt: string } {
  const cuisine = deriveCuisine(preferences);
  const { zhPrimary, zhSecondary, enHighlights } = buildIngredientNarrative(recipe.ingredients);
  const mood = deriveCookingMood(recipe);
  const presentation = derivePresentation(recipe.difficulty);
  const tags = normalizeTags(recipe.tags);

  const chineseSection = [
    `主视觉：${recipe.title}，成品热气腾腾，装在浅色陶瓷盘中，柔和自然光强调菜品光泽` ,
    recipe.description ? `口感特色：${recipe.description}` : `风味特色：${mood}`,
    zhPrimary ? `主要食材呈现：${zhPrimary}` : '',
    zhSecondary ? `辅料层次：${zhSecondary}` : '',
    tags ? `风味标签：${tags}` : '',
    '画面干净无文字和水印'
  ].filter(Boolean).join('；');

  const englishStyle = [
    `Cuisine style: ${cuisine}`,
    presentation,
    'focus on the finished dish, clean table setting, intentional garnish',
    `rich texture highlighting ${enHighlights}`,
    'cinematic depth of field with gentle steam',
    'no captions, no text overlay, no watermark',
    'ultra detailed, 8K, photorealistic food photography'
  ].join(', ');

  const prompt = `${chineseSection} ## ${englishStyle}`;
  const negativePrompt = DEFAULT_NEGATIVE_PROMPT;

  return { prompt, negativePrompt };
}

export async function generateSeedreamImage(
  apiKey: string,
  prompt: string,
  options: SeedreamGenerationOptions = {}
): Promise<SeedreamGenerationResult> {
  if (!apiKey) {
    throw new Error('Seedream API Key 未配置');
  }
  if (!prompt || prompt.trim().length < 8) {
    throw new Error('Seedream prompt 不合法');
  }

  const {
    modelId,
    aspectRatio = DEFAULT_ASPECT_RATIO,
    stylePreset = DEFAULT_STYLE_PRESET,
    negativePrompt = DEFAULT_NEGATIVE_PROMPT,
    sampler = DEFAULT_SAMPLER,
    steps = DEFAULT_STEPS,
    cfgScale = DEFAULT_CFG_SCALE,
    size = DEFAULT_SIZE,
    responseFormat,
    stream,
    watermark,
    sequentialImageGeneration,
    sequentialImageGenerationOptions,
    referenceImages,
  } = options;

  const payload: Record<string, unknown> = {
    model: modelId ?? DEFAULT_SEEDREAM_MODEL,
    prompt,
    negative_prompt: negativePrompt,
    aspect_ratio: aspectRatio,
    style_preset: stylePreset,
    sampler,
    steps,
    cfg_scale: cfgScale,
  };

  if (size) {
    payload.size = size;
  }
  if (typeof stream === 'boolean') {
    payload.stream = stream;
  }
  if (typeof watermark === 'boolean') {
    payload.watermark = watermark;
  }
  if (responseFormat) {
    payload.response_format = responseFormat;
  }
  if (sequentialImageGeneration) {
    payload.sequential_image_generation = sequentialImageGeneration;
  }
  if (sequentialImageGenerationOptions) {
    payload.sequential_image_generation_options = sequentialImageGenerationOptions;
  }
  if (referenceImages && referenceImages.length > 0) {
    payload.image = referenceImages;
  }

  log('info', '调用 Seedream 生成图片', {
    endpoint: DEFAULT_ENDPOINT,
    aspectRatio: payload.aspect_ratio,
    stylePreset: payload.style_preset
  });

  const response = await fetch(DEFAULT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120000)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    log('error', 'Seedream API 调用失败', {
      status: response.status,
      statusText: response.statusText,
      errorText: errorText?.slice(0, 500)
    });
    throw new Error(`Seedream 调用失败: ${response.statusText || response.status}`);
  }

  const result = await response.json() as SeedreamAPIResponse;

  let imageCandidates: SeedreamImageItem[] = [];
  const dataField = result?.data;

  if (Array.isArray(dataField)) {
    imageCandidates = dataField;
  } else if (dataField && typeof dataField === 'object') {
    if (Array.isArray(dataField.image_list) && dataField.image_list.length > 0) {
      imageCandidates = dataField.image_list;
    } else if (Array.isArray(dataField.images) && dataField.images.length > 0) {
      imageCandidates = dataField.images;
    } else if (Array.isArray(dataField.image_urls) && dataField.image_urls.length > 0) {
      imageCandidates = dataField.image_urls.map((url) => ({ url }));
    }
  }

  const firstImage = imageCandidates.find((item) => item?.url || item?.b64_json || item?.base64 || item?.b64);
  if (!firstImage) {
    log('warn', 'Seedream API 未返回图片', { result });
    throw new Error('Seedream 未返回图片内容');
  }

  const output: SeedreamGenerationResult = {
    imageUrl: firstImage.url,
    base64: (firstImage as { b64?: string }).b64 ||
      (firstImage as { b64_json?: string }).b64_json ||
      (firstImage as { base64?: string }).base64,
    requestId:
      typeof dataField === 'object' && dataField !== null && !Array.isArray(dataField) && 'task_id' in dataField
        ? (dataField as { task_id?: string }).task_id
        : result.request_id,
    prompt,
  };

  if (!output.imageUrl && !output.base64) {
    throw new Error('Seedream 图片内容解析失败');
  }

  return output;
}
