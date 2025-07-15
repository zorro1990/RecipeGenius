'use client';

// API密钥存储和管理工具
export interface StoredAPIKeys {
  deepseek?: string;
  doubao?: string;
  doubaoEndpointId?: string;
  qwen?: string;
  glm?: string;
  gemini?: string;
  // 新增：首选菜谱生成模型
  preferredRecipeProvider?: string;
}

// 简单的加密/解密工具（基于Base64和简单混淆）
const ENCRYPTION_KEY = 'recipe-genius-2025';

function simpleEncrypt(text: string): string {
  try {
    const encoded = btoa(text);
    // 简单的字符混淆，使用固定的分隔符
    return encoded.split('').reverse().join('') + '|' + ENCRYPTION_KEY.length.toString();
  } catch {
    return text;
  }
}

function simpleDecrypt(encrypted: string): string {
  try {
    const lastPipeIndex = encrypted.lastIndexOf('|');
    if (lastPipeIndex === -1) {
      return '';
    }

    const keyLengthStr = encrypted.slice(lastPipeIndex + 1);
    const keyLength = parseInt(keyLengthStr);

    if (keyLength !== ENCRYPTION_KEY.length) {
      return '';
    }

    const encoded = encrypted.slice(0, lastPipeIndex).split('').reverse().join('');
    return atob(encoded);
  } catch (error) {
    return '';
  }
}

// 掩码显示API密钥
export function maskAPIKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '****';
  
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}****${end}`;
}

// 验证API密钥格式
export function validateAPIKeyFormat(provider: string, apiKey: string): boolean {
  if (!apiKey || apiKey.trim().length === 0) return false;
  
  const trimmed = apiKey.trim();
  
  switch (provider) {
    case 'deepseek':
      return trimmed.startsWith('sk-') && trimmed.length > 20;
    case 'doubao':
      return trimmed.length > 10; // 豆包API密钥格式较灵活
    case 'qwen':
      return trimmed.startsWith('sk-') && trimmed.length > 20;
    case 'glm':
      return trimmed.length > 10; // 智谱AI格式较灵活
    case 'gemini':
      return trimmed.startsWith('AIza') && trimmed.length > 30;
    default:
      return trimmed.length > 5;
  }
}

// 存储API密钥到localStorage
export function storeAPIKeys(keys: StoredAPIKeys): void {
  try {
    const encrypted: Record<string, string> = {};

    Object.entries(keys).forEach(([provider, key]) => {
      if (key && key.trim()) {
        encrypted[provider] = simpleEncrypt(key.trim());
      }
    });

    localStorage.setItem('recipe-genius-api-keys', JSON.stringify(encrypted));
  } catch (error) {
    console.error('存储API密钥失败:', error);
    throw new Error('存储API密钥失败');
  }
}

// 从localStorage读取API密钥
export function getStoredAPIKeys(): StoredAPIKeys {
  try {
    const stored = localStorage.getItem('recipe-genius-api-keys');
    if (!stored) return {};

    const encrypted = JSON.parse(stored);
    const decrypted: StoredAPIKeys = {};
    let hasDecryptionFailure = false;

    Object.entries(encrypted).forEach(([provider, encryptedKey]) => {
      if (typeof encryptedKey === 'string') {
        const decryptedKey = simpleDecrypt(encryptedKey);
        if (decryptedKey) {
          (decrypted as any)[provider] = decryptedKey;
        } else {
          hasDecryptionFailure = true;
        }
      }
    });

    // 如果有解密失败的情况，清除旧数据
    if (hasDecryptionFailure && Object.keys(decrypted).length === 0) {
      localStorage.removeItem('recipe-genius-api-keys');
      return {};
    }

    return decrypted;
  } catch (error) {
    console.error('读取API密钥失败:', error);
    // 如果解析失败，清除损坏的数据
    localStorage.removeItem('recipe-genius-api-keys');
    return {};
  }
}

// 清除存储的API密钥
export function clearStoredAPIKeys(): void {
  try {
    localStorage.removeItem('recipe-genius-api-keys');
  } catch (error) {
    console.error('清除API密钥失败:', error);
  }
}

// 清除特定提供商的API密钥
export function clearProviderAPIKey(provider: string): void {
  try {
    const current = getStoredAPIKeys();
    delete (current as any)[provider];
    storeAPIKeys(current);
  } catch (error) {
    console.error(`清除${provider}API密钥失败:`, error);
  }
}

// 检查是否有任何API密钥配置
export function hasAnyAPIKey(): boolean {
  const stored = getStoredAPIKeys();

  // 检查简单字符串密钥
  const hasSimpleKey = Object.entries(stored).some(([provider, key]) => {
    if (provider === 'doubao') return false; // 豆包单独处理
    return key && typeof key === 'string' && key.trim().length > 0;
  });

  // 检查豆包密钥（特殊结构）
  const hasDoubaoKey = stored.doubao &&
    typeof stored.doubao === 'string' &&
    stored.doubao.trim().length > 0;

  console.log('🔍 API密钥检测详情:', {
    stored: JSON.stringify(stored, null, 2),
    hasSimpleKey,
    hasDoubaoKey,
    doubaoValue: stored.doubao,
    doubaoEndpointId: stored.doubaoEndpointId,
    allKeys: Object.keys(stored),
    localStorage: typeof window !== 'undefined' ? localStorage.getItem('recipe-genius-api-keys') : 'N/A'
  });

  return Boolean(hasSimpleKey || hasDoubaoKey);
}

// 获取已配置的提供商列表
export function getConfiguredProviders(): string[] {
  const stored = getStoredAPIKeys();
  return Object.entries(stored)
    .filter(([provider, key]) => {
      if (provider === 'doubao') {
        return key && typeof key === 'string' && key.trim().length > 0;
      }
      return key && typeof key === 'string' && key.trim().length > 0;
    })
    .map(([provider, _]) => provider);
}

// API提供商信息
export const API_PROVIDERS = {
  deepseek: {
    name: 'DeepSeek',
    description: '性价比之王，价格极低、性能优秀',
    website: 'https://platform.deepseek.com',
    keyFormat: 'sk-xxxxxxxx...',
    icon: '🚀',
    features: ['菜谱生成', '营养分析'],
    priority: '推荐',
    usage: '主要用于菜谱生成，响应快速，成本低廉'
  },
  doubao: {
    name: '豆包 (字节跳动)',
    description: '国内访问稳定，支持图片识别',
    website: 'https://console.volcengine.com/ark',
    keyFormat: 'xxxxxxxx-xxxx-xxxx...',
    icon: '🎯',
    requiresEndpoint: true,
    features: ['图片识别', '菜谱生成'],
    priority: '必需',
    usage: '图片识别功能必需，也可用于菜谱生成'
  },
  qwen: {
    name: '通义千问 (阿里云)',
    description: '阿里云生态，企业级稳定性',
    website: 'https://bailian.console.aliyun.com',
    keyFormat: 'sk-xxxxxxxx...',
    icon: '☁️',
    features: ['菜谱生成'],
    priority: '备选',
    usage: '可用于菜谱生成，企业级稳定性'
  },
  glm: {
    name: '智谱AI (ChatGLM)',
    description: '清华技术，中文优化',
    website: 'https://open.bigmodel.cn',
    keyFormat: 'xxxxxxxx...',
    icon: '🧠',
    features: ['菜谱生成'],
    priority: '备选',
    usage: '可用于菜谱生成，中文优化'
  },
  gemini: {
    name: 'Google Gemini',
    description: 'Google AI，功能强大（需科学上网）',
    website: 'https://aistudio.google.com/app/apikey',
    keyFormat: 'AIzaxxxxxxxx...',
    icon: '🌟',
    features: ['菜谱生成'],
    priority: '备选',
    usage: '可用于菜谱生成，需要科学上网'
  }
} as const;

// 获取菜谱生成专用的提供商列表（排除豆包，除非明确选择）
export function getRecipeProviders(): string[] {
  const keys = getStoredAPIKeys();
  const providers: string[] = [];

  // 根据用户首选模型排序
  const preferred = keys.preferredRecipeProvider;

  // 添加首选模型（如果配置了）
  if (preferred && keys[preferred as keyof StoredAPIKeys]) {
    if (preferred === 'doubao' && keys.doubao && keys.doubaoEndpointId) {
      providers.push('doubao');
    } else if (preferred !== 'doubao' && keys[preferred as keyof StoredAPIKeys]) {
      providers.push(preferred);
    }
  }

  // 添加其他可用模型（按推荐顺序，排除豆包和已添加的首选模型）
  const otherProviders = ['deepseek', 'qwen', 'glm', 'gemini'];
  otherProviders.forEach(provider => {
    if (provider !== preferred && keys[provider as keyof StoredAPIKeys]) {
      providers.push(provider);
    }
  });

  return providers;
}

// 设置首选菜谱生成模型
export function setPreferredRecipeProvider(provider: string): void {
  if (typeof window === 'undefined') return;

  try {
    const keys = getStoredAPIKeys();
    keys.preferredRecipeProvider = provider;
    storeAPIKeys(keys);
  } catch (error) {
    console.error('设置首选菜谱模型失败:', error);
  }
}

// 获取首选菜谱生成模型
export function getPreferredRecipeProvider(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const keys = getStoredAPIKeys();
    return keys.preferredRecipeProvider || null;
  } catch (error) {
    console.error('获取首选菜谱模型失败:', error);
    return null;
  }
}
