'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react';
import { getStoredAPIKeys, API_PROVIDERS } from '@/lib/api-key-storage';
import { ApiResponse } from '@/lib/types';

interface APIStatusDashboardProps {
  onOpenSettings?: () => void;
}

export function APIStatusDashboard({ onOpenSettings }: APIStatusDashboardProps) {
  interface EnvironmentApiData {
    environment?: Record<string, boolean>;
  }

  interface FrontendProviderStatus {
    configured?: boolean;
  }

  interface FrontendApiData {
    frontend?: {
      summary?: {
        configured: number;
        total?: number;
      };
      providers?: Record<string, FrontendProviderStatus>;
    };
    report?: {
      recommendations?: string[];
    };
  }

  interface CombinedStatus {
    totalProviders: number;
    frontendConfigured: number;
    envConfigured: number;
    recommendations: string[];
  }

  interface StatusState {
    environment?: EnvironmentApiData;
    frontend?: FrontendApiData;
    combined: CombinedStatus;
  }

  const [status, setStatus] = useState<StatusState | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      // 获取前端API密钥
      const frontendKeys = getStoredAPIKeys();
      
      // 获取环境变量状态
      const envResponse = await fetch('/api/test-ai');
      const envData = await envResponse.json() as ApiResponse<EnvironmentApiData>;

      // 获取前端状态分析
      const frontendResponse = await fetch('/api/frontend-api-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys: frontendKeys })
      });
      const frontendData = await frontendResponse.json() as ApiResponse<FrontendApiData>;

      const envConfiguredCount = envData.data?.environment
        ? Object.values(envData.data.environment).filter(Boolean).length
        : 0;
      const frontendConfiguredCount = frontendData.data?.frontend?.summary?.configured ?? 0;
      const recommendations = frontendData.data?.report?.recommendations ?? [];

      setStatus({
        environment: envData.data,
        frontend: frontendData.data,
        combined: {
          totalProviders: 5,
          frontendConfigured: frontendConfiguredCount,
          envConfigured: envConfiguredCount,
          recommendations,
        }
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('获取API状态失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const getOverallStatus = () => {
    type StatusInfo = {
      color: 'gray' | 'red' | 'green' | 'amber';
      text: string;
      icon: typeof RefreshCw;
    };

    if (!status) return { color: 'gray', text: '检查中...', icon: RefreshCw } satisfies StatusInfo;
    
    const total = status.combined.frontendConfigured + status.combined.envConfigured;
    if (total === 0) {
      return { color: 'red', text: '未配置', icon: XCircle } satisfies StatusInfo;
    } else if (status.combined.frontendConfigured > 0) {
      return { color: 'green', text: '前端配置', icon: CheckCircle } satisfies StatusInfo;
    } else {
      return { color: 'amber', text: '环境变量', icon: AlertTriangle } satisfies StatusInfo;
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      {/* 总体状态 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <overallStatus.icon className={`size-5 text-${overallStatus.color}-500`} />
              API配置状态
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStatus}
                disabled={loading}
              >
                <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              {onOpenSettings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenSettings}
                >
                  <Settings className="size-4 mr-2" />
                  设置
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">检查API配置状态...</p>
            </div>
          ) : status ? (
            <div className="space-y-4">
              {/* 状态概览 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {status.combined.frontendConfigured}
                  </div>
                  <div className="text-sm text-blue-700">前端配置</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {status.combined.envConfigured}
                  </div>
                  <div className="text-sm text-gray-700">环境变量</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {status.combined.frontendConfigured + status.combined.envConfigured}
                  </div>
                  <div className="text-sm text-green-700">总计可用</div>
                </div>
              </div>

              {/* 建议 */}
              {status.combined.recommendations.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">配置建议</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {status.combined.recommendations.slice(0, 3).map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 详细信息切换 */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-500">
                  最后更新: {lastUpdated?.toLocaleTimeString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? <EyeOff className="size-4 mr-2" /> : <Eye className="size-4 mr-2" />}
                  {showDetails ? '隐藏详情' : '显示详情'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-red-600">
              <XCircle className="size-6 mx-auto mb-2" />
              <p>无法获取API状态</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详细信息 */}
      {showDetails && status && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 前端配置详情 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="size-5 text-blue-500" />
                前端API配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(API_PROVIDERS).map(([provider, info]) => {
                  const providerStatus = status.frontend?.frontend?.providers?.[provider];
                  const isConfigured = providerStatus?.configured || false;
                  
                  return (
                    <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{info.icon}</span>
                        <div>
                          <div className="font-medium">{info.name}</div>
                          <div className="text-sm text-gray-600">{info.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConfigured ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="size-3 mr-1" />
                            已配置
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            未配置
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
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 环境变量详情 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                环境变量配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(status.environment?.environment || {}).map(([provider, configured]) => {
                  const info = API_PROVIDERS[provider as keyof typeof API_PROVIDERS];
                  if (!info) return null;
                  
                  return (
                    <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{info.icon}</span>
                        <div>
                          <div className="font-medium">{info.name}</div>
                          <div className="text-sm text-gray-600">环境变量配置</div>
                        </div>
                      </div>
                      {configured ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          <CheckCircle className="size-3 mr-1" />
                          已配置
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          未配置
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  💡 环境变量配置作为备用方案。推荐使用前端API设置界面进行配置，更安全且用户友好。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
