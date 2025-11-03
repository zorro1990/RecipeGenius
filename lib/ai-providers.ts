import { FrontendApiKeys } from './types';
import { getStoredAPIKeys, type StoredAPIKeys } from './api-key-storage';
import { getSecureEnvVar, log } from './cloudflare-utils';
import { createDoubaoVisionClient, IngredientRecognitionResult } from './doubao-vision';

const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;

function parseTimeout(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const DEFAULT_PROVIDER_TIMEOUT_MS = parseTimeout(
  process.env.RECIPE_PROVIDER_TIMEOUT_MS,
  FIVE_MINUTES_IN_MS
);
const GEMINI_TIMEOUT_MS = parseTimeout(
  process.env.RECIPE_PROVIDER_TIMEOUT_GEMINI_MS,
  DEFAULT_PROVIDER_TIMEOUT_MS
);
const QWEN_TIMEOUT_MS = parseTimeout(
  process.env.RECIPE_PROVIDER_TIMEOUT_QWEN_MS,
  DEFAULT_PROVIDER_TIMEOUT_MS
);

// AI提供商配置
export interface AIProvider {
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  headers: Record<string, string>;
}

interface GeminiAPIResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

interface QwenAPIResponse {
  output?: {
    text?: string;
  };
  message?: string;
}

interface OpenAIStyleResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
  message?: string;
}

function omitFrontendApiKey(frontendApiKeys: FrontendApiKeys | undefined, providerName: string): FrontendApiKeys | undefined {
  if (!frontendApiKeys) {
    return undefined;
  }

  const updated: FrontendApiKeys = { ...frontendApiKeys };

  switch (providerName) {
    case 'deepseek':
      delete updated.deepseek;
      break;
    case 'doubao':
      delete updated.doubao;
      break;
    case 'qwen':
      delete updated.qwen;
      break;
    case 'glm':
      delete updated.glm;
      break;
    case 'gemini':
      delete updated.gemini;
      break;
    case 'seedream':
      delete updated.seedream;
      break;
    default:
      break;
  }

  return updated;
}

function getProviderTimeoutMs(providerName: string): number {
  switch (providerName) {
    case 'gemini':
      return GEMINI_TIMEOUT_MS;
    case 'qwen':
      return QWEN_TIMEOUT_MS;
    default:
      return DEFAULT_PROVIDER_TIMEOUT_MS;
  }
}

function isAbortError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'AbortError';
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return true;
    }
    if (typeof error.message === 'string' && error.message.toLowerCase().includes('aborted')) {
      return true;
    }
  }

  if (typeof error === 'object' && 'name' in (error as Record<string, unknown>)) {
    const name = (error as { name?: unknown }).name;
    if (typeof name === 'string' && name === 'AbortError') {
      return true;
    }
  }

  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.toLowerCase().includes('aborted')) {
      return true;
    }
  }

  return false;
}

// 获取可用的AI提供商（支持前端动态API密钥和Cloudflare Workers）
export function getAvailableProviders(frontendApiKeys?: FrontendApiKeys): AIProvider[] {
  const providers: AIProvider[] = [];

  // 获取前端存储的API密钥
  let storedKeys: StoredAPIKeys = {};
  try {
    // 优先使用传入的前端API密钥
    if (frontendApiKeys) {
      storedKeys = {
        deepseek: frontendApiKeys.deepseek,
        doubao: frontendApiKeys.doubao?.key,
        doubaoEndpointId: frontendApiKeys.doubao?.endpointId,
        qwen: frontendApiKeys.qwen,
        glm: frontendApiKeys.glm,
        gemini: frontendApiKeys.gemini,
        seedream: frontendApiKeys.seedream
      };
    } else if (typeof window !== 'undefined') {
      // 只在客户端环境下获取localStorage
      storedKeys = getStoredAPIKeys();
    }
  } catch (error) {
    log('warn', '获取存储的API密钥失败', { error: error instanceof Error ? error.message : error });
  }

  console.log('🔍 API提供商检测:', {
    deepseek: !!storedKeys.deepseek,
    doubao: !!(storedKeys.doubao && storedKeys.doubaoEndpointId),
    qwen: !!storedKeys.qwen,
    glm: !!storedKeys.glm,
    gemini: !!storedKeys.gemini,
    seedream: !!storedKeys.seedream
  });

  // DeepSeek - 最优先，性价比之王，响应快
  const deepseekKey = storedKeys.deepseek || getSecureEnvVar('DEEPSEEK_API_KEY');
  if (deepseekKey) {
    providers.push({
      name: 'deepseek',
      baseUrl: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      apiKey: deepseekKey,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`
      }
    });
    console.log('✅ DeepSeek API 已配置 (优先使用)');
  }

  // 豆包 (字节跳动) - 备用选项，需要端点ID
  const doubaoKey = storedKeys.doubao || getSecureEnvVar('DOUBAO_API_KEY');
  const doubaoEndpoint = storedKeys.doubaoEndpointId || getSecureEnvVar('DOUBAO_ENDPOINT_ID');
  if (doubaoKey && doubaoEndpoint) {
    providers.push({
      name: 'doubao',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      model: doubaoEndpoint, // 使用端点ID
      apiKey: doubaoKey,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doubaoKey}`
      }
    });
    console.log('✅ 豆包文本API 已配置 (备用)');
  }

  // 通义千问 (阿里云)
  const qwenKey = storedKeys.qwen || getSecureEnvVar('QWEN_API_KEY');
  if (qwenKey) {
    providers.push({
      name: 'qwen',
      baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      model: 'qwen-turbo',
      apiKey: qwenKey,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${qwenKey}`
      }
    });
  }

  // 智谱AI (ChatGLM)
  const glmKey = storedKeys.glm || getSecureEnvVar('GLM_API_KEY');
  if (glmKey) {
    providers.push({
      name: 'glm',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: 'glm-4-flash',
      apiKey: glmKey,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${glmKey}`
      }
    });
  }

  // Google Gemini (备用)
  const geminiKey = storedKeys.gemini || getSecureEnvVar('GOOGLE_API_KEY');
  if (geminiKey) {
    providers.push({
      name: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      model: 'gemini-1.5-flash',
      apiKey: geminiKey,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  return providers;
}

// 获取菜谱生成专用的AI提供商（排除豆包，除非用户明确选择）
export function getRecipeAIProviders(frontendApiKeys?: FrontendApiKeys, preferredProvider?: string): AIProvider[] {
  const allProviders = getAvailableProviders(frontendApiKeys);

  // 过滤掉豆包（除非明确指定为首选）
  const nonDoubaoProviders = allProviders.filter(p => p.name !== 'doubao');

  // 如果指定了首选提供商，将其放在第一位
  if (preferredProvider) {
    const preferred = allProviders.find(p => p.name === preferredProvider);
    if (preferred) {
      const others = nonDoubaoProviders.filter(p => p.name !== preferredProvider);
      const orderedProviders = [preferred, ...others];
      console.log('🍳 菜谱生成提供商顺序 (首选: ' + preferredProvider + '):', orderedProviders.map(p => p.name));
      return orderedProviders;
    }
  }

  // 默认排序：deepseek, qwen, glm, gemini
  const defaultOrder = ['deepseek', 'qwen', 'glm', 'gemini'];
  const orderedProviders: AIProvider[] = [];

  defaultOrder.forEach(providerName => {
    const provider = nonDoubaoProviders.find(p => p.name === providerName);
    if (provider) {
      orderedProviders.push(provider);
    }
  });

  // 添加任何剩余的提供商
  nonDoubaoProviders.forEach(provider => {
    if (!orderedProviders.find(p => p.name === provider.name)) {
      orderedProviders.push(provider);
    }
  });

  console.log('🍳 菜谱生成提供商顺序 (默认):', orderedProviders.map(p => p.name));

  return orderedProviders;
}

// 菜谱生成专用AI调用函数
export async function callRecipeAI(prompt: string, frontendApiKeys?: FrontendApiKeys, preferredProvider?: string): Promise<string> {
  const providers = getRecipeAIProviders(frontendApiKeys, preferredProvider);

  if (providers.length === 0) {
    throw new Error('没有可用的菜谱生成AI提供商，请配置至少一个非豆包的API密钥，或在设置中选择豆包作为菜谱生成模型');
  }

  return await executeAICall(providers, prompt, frontendApiKeys);
}

// 通用AI调用函数
export async function callAI(prompt: string, frontendApiKeys?: FrontendApiKeys): Promise<string> {
  const providers = getAvailableProviders(frontendApiKeys);
  
  if (providers.length === 0) {
    throw new Error('没有可用的AI提供商，请配置至少一个API密钥');
  }

  return await executeAICall(providers, prompt, frontendApiKeys);
}

// 执行AI调用的通用函数
async function executeAICall(providers: AIProvider[], prompt: string, frontendApiKeys?: FrontendApiKeys): Promise<string> {
  const [selectedProvider, ...remainingProviders] = providers;
  if (!selectedProvider) {
    throw new Error('没有可用的AI提供商');
  }

  const timeoutMs = getProviderTimeoutMs(selectedProvider.name);
  const timeoutSeconds = Math.round(timeoutMs / 1000);

  try {
    if (selectedProvider.name === 'gemini') {
      const requestBody = {
        contents: [{
          parts: [{ text: prompt }],
        }],
      };

      console.log(`🧠 调用 Gemini API，超时阈值 ${timeoutSeconds} 秒`);
      const response = await fetch(`${selectedProvider.baseUrl}?key=${selectedProvider.apiKey}`, {
        method: 'POST',
        headers: selectedProvider.headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(timeoutMs),
      });

      const responseData = await response.json() as GeminiAPIResponse;
      if (!response.ok) {
        throw new Error(`Gemini API错误: ${responseData.error?.message || '未知错误'}`);
      }

      return responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    if (selectedProvider.name === 'qwen') {
      const requestBody = {
        model: selectedProvider.model,
        input: {
          messages: [{ role: 'user', content: prompt }],
        },
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
        },
      };

      console.log(`🧠 调用 通义千问 API，超时阈值 ${timeoutSeconds} 秒`);
      const response = await fetch(selectedProvider.baseUrl, {
        method: 'POST',
        headers: selectedProvider.headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(timeoutMs),
      });

      const responseData = await response.json() as QwenAPIResponse;
      if (!response.ok) {
        throw new Error(`通义千问API错误: ${responseData.message || '未知错误'}`);
      }

      return responseData.output?.text || '';
    }

    const requestBody = {
      model: selectedProvider.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    };

    console.log(`🧠 调用 ${selectedProvider.name} API，超时阈值 ${timeoutSeconds} 秒`);
    const response = await fetch(selectedProvider.baseUrl, {
      method: 'POST',
      headers: selectedProvider.headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const responseData = await response.json() as OpenAIStyleResponse;
    if (!response.ok) {
      const errorMessage = responseData.error?.message || responseData.message || '未知错误';
      throw new Error(`${selectedProvider.name} API错误: ${errorMessage}`);
    }

    return responseData.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error(`AI调用失败 (${selectedProvider.name}):`, error);

    if (remainingProviders.length > 0) {
      console.log(`尝试使用备用提供商: ${remainingProviders[0].name}`);
      const updatedKeys = omitFrontendApiKey(frontendApiKeys, selectedProvider.name);
      return executeAICall(remainingProviders, prompt, updatedKeys);
    }

    const abortTriggered =
      isAbortError(error) ||
      (error instanceof Error && isAbortError((error as Error & { cause?: unknown }).cause));

    if (abortTriggered) {
      throw new Error(
        `${selectedProvider.name} API 请求在 ${timeoutSeconds} 秒后超时`,
        error instanceof Error ? { cause: error } : undefined
      );
    }

    throw error instanceof Error
      ? new Error(`${selectedProvider.name} API 请求失败: ${error.message}`, { cause: error })
      : error;
  }
}

// 菜谱生成提示词模板
export const RECIPE_PROMPT_TEMPLATE = `
作为一位专业的厨师和营养师，请根据以下信息生成一个详细的菜谱：

食材列表：{ingredients}
用户偏好和限制：{preferences}
菜系特征与风味要求：
{cuisineGuidance}
烹饪时间限制：{timeLimit}分钟
用餐人数：{servings}人
难度要求：{difficulty}

🚨 严格约束条件（必须遵守，关乎用户安全）：
1. 【饮食限制】如果用户设置了饮食限制（如素食、纯素食等），必须100%严格遵守，绝对不能使用任何违反限制的食材
2. 【过敏源安全】如果用户标注了过敏源，这些食材及其制品绝对不能出现在菜谱中，这关乎用户生命安全
3. 【食材冲突处理】如果现有食材与用户的饮食限制或过敏源冲突，必须从食材列表中完全排除这些食材
4. 【替代方案】当排除冲突食材后，使用剩余的安全食材创建菜谱，或建议安全的替代食材
5. 【菜系偏好】必须满足上述菜系特征，无法满足时需给出原因并提供最接近的菜系替代方案

⚠️ 特别注意：
- 纯素食 = 绝对不能有任何动物性食材（肉、鱼、蛋、奶等）
- 大豆过敏 = 不能有豆腐、豆浆、生抽、老抽等任何大豆制品
- 鸡蛋过敏 = 不能有鸡蛋及含鸡蛋的任何制品
- 安全第一，宁可简单也不能违反限制

🧠 难度与步骤规则：
- easy（简单）：至少5个步骤，每步聚焦基础技巧与低风险操作，描述要简洁易懂，并标记skillLevel为"basic"
- medium（中等）：7-9个步骤，需要包含火候控制、分段处理等技巧，skillLevel可混合"basic"与"intermediate"
- hard（困难）：9-12个步骤，涵盖高级技巧（多段火候、预处理、摆盘等），至少一半步骤使用"advanced" skillLevel

✍️ 步骤写作要求：
- 每个步骤需包含动作、关键细节和时间提示，description至少两句话
- duration为整数分钟，体现步骤耗时
- tips字段可选，但若提供必须给出实用提醒或注意事项

请严格按照以下JSON结构返回完整菜谱：
{
  "title": "菜谱名称",
  "description": "简短描述（50字以内）",
  "ingredients": [
    {"name": "食材名", "quantity": "数量", "unit": "单位"}
  ],
  "steps": [
    {
      "index": 1,
      "title": "步骤标题（简短概括核心动作）",
      "description": "详细步骤说明（至少两句，包含具体操作、火候、时间提示和专业建议）",
      "duration": 6,
      "skillLevel": "basic/intermediate/advanced",
      "tips": ["提示1", "提示2"]
    }
  ],
  "cookingTime": 总烹饪时间(分钟),
  "servings": 份数,
  "difficulty": "easy/medium/hard",
  "nutrition": {
    "calories": 卡路里,
    "protein": 蛋白质(g),
    "carbs": 碳水化合物(g),
    "fat": 脂肪(g),
    "fiber": 纤维(g)
  },
  "tags": ["标签1", "标签2"],
  "tips": ["烹饪小贴士1", "烹饪小贴士2"],
  "healthInfo": {
    "filteredIngredients": ["被过滤的食材1", "被过滤的食材2"],
    "filterReasons": ["过滤原因1", "过滤原因2"],
    "healthBenefits": ["健康益处1", "健康益处2"],
    "nutritionHighlights": ["营养重点1", "营养重点2"],
    "healthTips": ["健康建议1", "健康建议2"]
  }
}

请确保：
1. 严格遵守用户的饮食限制、过敏源和健康状况要求
2. 菜谱实用且可操作，步骤数量符合难度要求
3. 食材用量准确，烹饪时间合理
4. 步骤细致且富有指导性，突出火候、口感和安全注意事项
5. 营养信息合理，healthInfo根据健康状况提供具体指导
6. 只返回JSON，不要其他文字
`;

// 营养分析提示词模板
export const NUTRITION_PROMPT_TEMPLATE = `
请分析以下菜谱的营养成分：

菜谱名称：{title}
食材列表：{ingredients}
份数：{servings}

请以JSON格式返回营养分析，包含以下字段：
{
  "calories": 总卡路里,
  "protein": 蛋白质(g),
  "carbs": 碳水化合物(g),
  "fat": 脂肪(g),
  "fiber": 纤维(g),
  "sodium": 钠(mg),
  "sugar": 糖(g),
  "vitamins": ["维生素A", "维生素C"],
  "minerals": ["钙", "铁"],
  "healthScore": 健康评分(1-10),
  "dietaryInfo": ["低脂", "高蛋白", "富含纤维"]
}

请确保营养数据准确合理，只返回JSON格式。
`;

// 图片食材识别功能
export async function recognizeIngredientsFromImage(
  imageDataUrl: string,
  frontendApiKeys?: FrontendApiKeys
): Promise<IngredientRecognitionResult> {
  console.log('🔍 recognizeIngredientsFromImage 调用参数:', {
    hasImageData: !!imageDataUrl,
    imageDataLength: imageDataUrl?.length || 0,
    hasFrontendKeys: !!frontendApiKeys,
    doubaoKey: frontendApiKeys?.doubao?.key ? '***已提供***' : '未提供',
    doubaoEndpoint: frontendApiKeys?.doubao?.endpointId || '未提供'
  });

  // 尝试使用前端API密钥
  if (frontendApiKeys?.doubao?.key && frontendApiKeys.doubao.endpointId) {
    try {
      console.log('🔑 使用前端提供的豆包API密钥');
      const { DoubaoVisionClient } = await import('./doubao-vision');

      // 创建一个临时的客户端实例，绕过构造函数的环境变量检查
      const client = Object.create(DoubaoVisionClient.prototype);
      Reflect.set(client, 'apiKey', frontendApiKeys.doubao.key);
      Reflect.set(client, 'endpointId', frontendApiKeys.doubao.endpointId);
      Reflect.set(client, 'baseUrl', 'https://ark.cn-beijing.volces.com/api/v3/chat/completions');

      console.log('✅ 前端豆包客户端创建成功，开始识别');
      return await client.recognizeIngredients(imageDataUrl);
    } catch (error) {
      console.warn('❌ 前端豆包API调用失败，尝试环境变量配置:', error);
      // 继续尝试环境变量配置
    }
  } else {
    console.log('⚠️ 前端未提供豆包API密钥，尝试环境变量配置');
  }

  // 使用环境变量配置
  const client = createDoubaoVisionClient();
  if (!client) {
    throw new Error('豆包视觉API未配置。请在API设置中配置豆包密钥，或联系管理员配置环境变量。');
  }

  console.log('🔧 使用环境变量配置的豆包客户端');
  return await client.recognizeIngredients(imageDataUrl);
}

// 测试豆包视觉API连接
export async function testDoubaoVisionConnection(
  frontendApiKeys?: FrontendApiKeys
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🧪 测试豆包视觉API连接', {
      hasFrontendKeys: !!frontendApiKeys,
      doubaoKey: frontendApiKeys?.doubao?.key ? '***已提供***' : '未提供',
      doubaoEndpoint: frontendApiKeys?.doubao?.endpointId || '未提供'
    });

    // 尝试使用前端API密钥
    if (frontendApiKeys?.doubao?.key && frontendApiKeys.doubao.endpointId) {
      console.log('🔑 使用前端提供的豆包API密钥进行测试');
      const { DoubaoVisionClient } = await import('./doubao-vision');

      // 创建一个临时的客户端实例，绕过构造函数的环境变量检查
      const client = Object.create(DoubaoVisionClient.prototype);
      Reflect.set(client, 'apiKey', frontendApiKeys.doubao.key);
      Reflect.set(client, 'endpointId', frontendApiKeys.doubao.endpointId);
      Reflect.set(client, 'baseUrl', 'https://ark.cn-beijing.volces.com/api/v3/chat/completions');

      const result = await client.testConnection();
      console.log('✅ 前端豆包API测试结果:', result);
      return result;
    }

    // 使用环境变量配置
    console.log('🔧 使用环境变量配置进行测试');
    const client = createDoubaoVisionClient();
    if (!client) {
      return {
        success: false,
        message: '豆包视觉API未配置'
      };
    }

    return await client.testConnection();
  } catch (error) {
    console.error('❌ 豆包API测试异常:', error);
    return {
      success: false,
      message: `测试失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
