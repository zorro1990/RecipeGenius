'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle, 
  Loader2, 
  ExternalLink,
  Trash2,
  Shield,
  Key
} from 'lucide-react';
import {
  StoredAPIKeys,
  storeAPIKeys,
  getStoredAPIKeys,
  clearStoredAPIKeys,
  clearProviderAPIKey,
  maskAPIKey,
  validateAPIKeyFormat,
  API_PROVIDERS,
  setPreferredRecipeProvider,
  getPreferredRecipeProvider
} from '@/lib/api-key-storage';

interface APISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

interface ProviderState {
  apiKey: string;
  endpointId?: string;
  isVisible: boolean;
  isValidating: boolean;
  isValid: boolean | null;
  error: string | null;
}

export function APISettingsModal({ isOpen, onClose, onKeysUpdated }: APISettingsModalProps) {
  const [providers, setProviders] = useState<Record<string, ProviderState>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [preferredRecipeProvider, setPreferredRecipeProviderState] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'image' | 'recipe'>('image');

  // 初始化状态
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredAPIKeys();
      const initialState: Record<string, ProviderState> = {};

      Object.keys(API_PROVIDERS).forEach(provider => {
        initialState[provider] = {
          apiKey: (stored as any)[provider] || '',
          endpointId: provider === 'doubao' ? stored.doubaoEndpointId || '' : undefined,
          isVisible: false,
          isValidating: false,
          isValid: null,
          error: null
        };
      });

      setProviders(initialState);

      // 加载首选菜谱生成模型
      const preferred = getPreferredRecipeProvider();
      setPreferredRecipeProviderState(preferred || '');
    }
  }, [isOpen]);

  // 更新提供商状态
  const updateProvider = (provider: string, updates: Partial<ProviderState>) => {
    setProviders(prev => ({
      ...prev,
      [provider]: { ...prev[provider], ...updates }
    }));
  };

  // 自动保存API密钥
  const autoSaveAPIKeys = async () => {
    try {
      const keysToStore: StoredAPIKeys = {};

      Object.entries(providers).forEach(([provider, state]) => {
        if (state.apiKey.trim()) {
          (keysToStore as any)[provider] = state.apiKey.trim();
          if (provider === 'doubao' && state.endpointId?.trim()) {
            keysToStore.doubaoEndpointId = state.endpointId.trim();
          }
        }
      });

      console.log('🔄 自动保存API密钥:', Object.keys(keysToStore));
      storeAPIKeys(keysToStore);
      onKeysUpdated?.();
    } catch (error) {
      console.error('自动保存API密钥失败:', error);
    }
  };

  // 测试豆包API连接
  const testDoubaoAPI = async (apiKey: string, endpointId: string) => {
    updateProvider('doubao', { isValidating: true, error: null });

    try {
      const response = await fetch('/api/test-doubao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, endpointId })
      });

      const result = await response.json() as any;

      if (result.success) {
        updateProvider('doubao', {
          isValid: true,
          isValidating: false,
          error: null
        });
        console.log('✅ 豆包API测试成功:', result.response);
        // 测试成功后自动保存
        setTimeout(autoSaveAPIKeys, 500);
      } else {
        updateProvider('doubao', {
          isValid: false,
          isValidating: false,
          error: result.error || '豆包API测试失败'
        });
        console.error('❌ 豆包API测试失败:', result);
      }
    } catch (error) {
      updateProvider('doubao', {
        isValid: false,
        isValidating: false,
        error: '网络错误，请检查连接'
      });
      console.error('❌ 豆包API测试异常:', error);
    }
  };

  // 验证API密钥
  const validateAPIKey = async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) {
      updateProvider(provider, { isValid: null, error: null });
      return;
    }

    if (!validateAPIKeyFormat(provider, apiKey)) {
      updateProvider(provider, {
        isValid: false,
        error: '密钥格式不正确'
      });
      return;
    }

    updateProvider(provider, { isValidating: true, error: null });

    try {
      // 调用测试API
      const testData = {
        provider,
        apiKey: apiKey.trim(),
        endpointId: provider === 'doubao' ? providers[provider]?.endpointId : undefined
      };

      const response = await fetch('/api/test-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const result = await response.json() as any;

      if (result.success) {
        updateProvider(provider, {
          isValid: true,
          isValidating: false,
          error: null
        });
        // 验证成功后自动保存
        setTimeout(autoSaveAPIKeys, 500);
      } else {
        updateProvider(provider, {
          isValid: false,
          isValidating: false,
          error: result.error || '验证失败'
        });
      }
    } catch (error) {
      updateProvider(provider, {
        isValid: false,
        isValidating: false,
        error: '网络错误，请检查连接'
      });
    }
  };

  // 保存API密钥
  const handleSave = async () => {
    console.log('🎯 handleSave被调用');
    setIsSaving(true);

    try {
      const keysToStore: StoredAPIKeys = {};

      console.log('📋 当前providers状态:', providers);

      Object.entries(providers).forEach(([provider, state]) => {
        console.log(`🔍 检查${provider}:`, {
          hasApiKey: !!state.apiKey,
          apiKeyLength: state.apiKey?.length || 0,
          trimmedLength: state.apiKey?.trim().length || 0,
          endpointId: state.endpointId
        });

        if (state.apiKey.trim()) {
          (keysToStore as any)[provider] = state.apiKey.trim();
          if (provider === 'doubao' && state.endpointId?.trim()) {
            keysToStore.doubaoEndpointId = state.endpointId.trim();
          }
        }
      });

      console.log('💾 准备保存的密钥:', Object.keys(keysToStore));
      storeAPIKeys(keysToStore);

      // 保存首选菜谱生成模型
      if (preferredRecipeProvider) {
        setPreferredRecipeProvider(preferredRecipeProvider);
      }

      onKeysUpdated?.();
      onClose();
    } catch (error) {
      console.error('保存API密钥失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 清除所有密钥
  const handleClearAll = () => {
    if (confirm('确定要清除所有API密钥吗？此操作不可撤销。')) {
      clearStoredAPIKeys();
      setProviders(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(provider => {
          updated[provider] = {
            ...updated[provider],
            apiKey: '',
            endpointId: '',
            isValid: null,
            error: null
          };
        });
        return updated;
      });
      onKeysUpdated?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Key className="size-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">API密钥设置</h2>
              <p className="text-sm text-gray-600">配置AI提供商的API密钥以使用智能菜谱生成功能</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        {/* 标签页导航 */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('image')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'image'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📸 图片识别配置
            </button>
            <button
              onClick={() => setActiveTab('recipe')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'recipe'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              🍳 菜谱生成配置
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {/* 安全警告 */}
          {showWarning && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="size-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-amber-800 mb-1">安全提示</h3>
                    <p className="text-sm text-amber-700 mb-3">
                      API密钥将加密存储在您的浏览器本地，不会上传到服务器。请妥善保管您的API密钥，不要与他人分享。
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowWarning(false)}
                      className="text-amber-700 hover:text-amber-800"
                    >
                      我知道了
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 图片识别配置 */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📸</span>
                  <span className="font-medium text-blue-800">图片识别功能</span>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  使用豆包1.6视觉模型识别图片中的食材。需要配置豆包API密钥和端点ID。
                </p>
                <div className="text-xs text-blue-600 bg-white/50 p-2 rounded">
                  💡 豆包模型专门用于图片识别，响应速度快，识别准确率高
                </div>
              </div>

              {/* 豆包配置 */}
              {(() => {
                const provider = 'doubao';
                const info = API_PROVIDERS[provider];
                const state = providers[provider] || {
                  apiKey: '',
                  isVisible: false,
                  isValidating: false,
                  isValid: null,
                  error: null
                };

                return (
                  <Card key={provider} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{info.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-lg">{info.name}</CardTitle>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                图片识别专用
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{info.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {state.isValid === true && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Check className="size-3 mr-1" />
                              已验证
                            </Badge>
                          )}
                          {state.isValid === false && (
                            <Badge variant="destructive">
                              <AlertTriangle className="size-3 mr-1" />
                              验证失败
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* API密钥输入 */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          API密钥 <span className="text-gray-500">({info.keyFormat})</span>
                        </label>
                        <div className="relative">
                          <Input
                            type={state.isVisible ? 'text' : 'password'}
                            placeholder={`输入${info.name}的API密钥`}
                            value={state.apiKey}
                            onChange={(e) => {
                              updateProvider(provider, {
                                apiKey: e.target.value,
                                isValid: null,
                                error: null
                              });
                            }}
                            onBlur={() => {
                              if (state.apiKey.trim()) {
                                validateAPIKey(provider, state.apiKey);
                              }
                            }}
                            className="pr-20"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {state.isValidating && (
                              <Loader2 className="size-4 animate-spin text-gray-400" />
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => updateProvider(provider, { isVisible: !state.isVisible })}
                              className="h-8 w-8 p-0"
                            >
                              {state.isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* 豆包端点ID */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          端点ID <span className="text-gray-500">(必填)</span>
                        </label>
                        <Input
                          placeholder="输入豆包的端点ID"
                          value={state.endpointId || ''}
                          onChange={(e) => updateProvider(provider, { endpointId: e.target.value })}
                        />
                      </div>

                      {/* 申请API密钥链接 */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="text-sm text-gray-600">
                          还没有API密钥？
                        </div>
                        <a
                          href={info.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
                        >
                          获取API密钥
                          <ExternalLink className="size-3" />
                        </a>
                      </div>

                      {/* API连接测试按钮 */}
                      {state.apiKey && state.endpointId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testDoubaoAPI(state.apiKey, state.endpointId!)}
                          disabled={state.isValidating}
                          className="w-full"
                        >
                          {state.isValidating ? (
                            <>
                              <Loader2 className="size-4 mr-2 animate-spin" />
                              测试中...
                            </>
                          ) : (
                            <>
                              🧪 测试图片识别API连接
                            </>
                          )}
                        </Button>
                      )}

                      {/* 错误信息 */}
                      {state.error && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {state.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}

          {/* 菜谱生成配置 */}
          {activeTab === 'recipe' && (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🍳</span>
                  <span className="font-medium text-green-800">菜谱生成功能</span>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  选择用于生成菜谱的AI模型。推荐使用DeepSeek（性价比高）或通义千问（稳定性好）。
                </p>
                <div className="text-xs text-green-600 bg-white/50 p-2 rounded">
                  💡 可以配置多个模型作为备用，系统会自动故障转移
                </div>
              </div>

              {/* 首选模型选择 */}
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>🎯</span>
                    首选菜谱生成模型
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    选择优先使用的菜谱生成模型，如果失败会自动尝试其他已配置的模型
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(API_PROVIDERS)
                      .filter(([provider]) => provider !== 'doubao') // 排除豆包
                      .map(([provider, info]) => {
                        const state = providers[provider];
                        const isConfigured = state?.apiKey?.trim();

                        return (
                          <label
                            key={provider}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              preferredRecipeProvider === provider
                                ? 'border-green-500 bg-green-50'
                                : isConfigured
                                ? 'border-gray-200 hover:border-gray-300'
                                : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                            }`}
                          >
                            <input
                              type="radio"
                              name="preferredRecipeProvider"
                              value={provider}
                              checked={preferredRecipeProvider === provider}
                              onChange={(e) => setPreferredRecipeProviderState(e.target.value)}
                              disabled={!isConfigured}
                              className="text-green-600"
                            />
                            <span className="text-xl">{info.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{info.name}</span>
                                {!isConfigured && (
                                  <Badge variant="outline" className="text-xs">
                                    未配置
                                  </Badge>
                                )}
                                {isConfigured && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                    已配置
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{info.description}</p>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* 其他模型配置 */}
              <div className="space-y-4">
                {Object.entries(API_PROVIDERS)
                  .filter(([provider]) => provider !== 'doubao') // 排除豆包
                  .map(([provider, info]) => {
              const state = providers[provider] || {
                apiKey: '',
                isVisible: false,
                isValidating: false,
                isValid: null,
                error: null
              };

              return (
                <Card key={provider} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{info.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{info.name}</CardTitle>
                            {(info as any).priority && (
                              <Badge
                                variant={(info as any).priority === '推荐' ? 'default' :
                                        (info as any).priority === '必需' ? 'secondary' : 'outline'}
                                className={
                                  (info as any).priority === '推荐' ? 'bg-green-100 text-green-700' :
                                  (info as any).priority === '必需' ? 'bg-blue-100 text-blue-700' : ''
                                }
                              >
                                {(info as any).priority}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{info.description}</p>
                          {(info as any).features && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-gray-500">功能：</span>
                              {(info as any).features.map((feature: string, idx: number) => (
                                <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {state.isValid === true && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Check className="size-3 mr-1" />
                            已验证
                          </Badge>
                        )}
                        {state.isValid === false && (
                          <Badge variant="destructive">
                            <AlertTriangle className="size-3 mr-1" />
                            验证失败
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(info.website, '_blank')}
                        >
                          <ExternalLink className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* API密钥输入 */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        API密钥 <span className="text-gray-500">({info.keyFormat})</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={state.isVisible ? 'text' : 'password'}
                          placeholder={`输入${info.name}的API密钥`}
                          value={state.apiKey}
                          onChange={(e) => {
                            updateProvider(provider, { 
                              apiKey: e.target.value,
                              isValid: null,
                              error: null 
                            });
                          }}
                          onBlur={() => {
                            if (state.apiKey.trim()) {
                              validateAPIKey(provider, state.apiKey);
                            }
                          }}
                          className="pr-20"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {state.isValidating && (
                            <Loader2 className="size-4 animate-spin text-gray-400" />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateProvider(provider, { isVisible: !state.isVisible })}
                            className="h-8 w-8 p-0"
                          >
                            {state.isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                          {state.apiKey && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                clearProviderAPIKey(provider);
                                updateProvider(provider, { 
                                  apiKey: '',
                                  endpointId: '',
                                  isValid: null,
                                  error: null 
                                });
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 豆包端点ID */}
                    {provider === 'doubao' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          端点ID <span className="text-gray-500">(必填)</span>
                        </label>
                        <Input
                          placeholder="输入豆包的端点ID"
                          value={state.endpointId || ''}
                          onChange={(e) => updateProvider(provider, { endpointId: e.target.value })}
                        />
                      </div>
                    )}

                    {/* 申请API密钥链接 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="text-sm text-gray-600">
                        还没有API密钥？
                      </div>
                      <a
                        href={info.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
                      >
                        获取API密钥
                        <ExternalLink className="size-3" />
                      </a>
                    </div>

                    {/* API连接测试按钮 */}
                    {state.apiKey && (provider !== 'doubao' || state.endpointId) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (provider === 'doubao') {
                            testDoubaoAPI(state.apiKey, state.endpointId!);
                          } else {
                            validateAPIKey(provider, state.apiKey);
                          }
                        }}
                        disabled={state.isValidating}
                        className="w-full"
                      >
                        {state.isValidating ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            测试中...
                          </>
                        ) : (
                          <>
                            🧪 测试{info.name}API连接
                          </>
                        )}
                      </Button>
                    )}

                    {/* 错误信息 */}
                    {state.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {state.error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="size-4 mr-2" />
            清除所有密钥
          </Button>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              验证成功后自动保存
            </div>
            <Button onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
