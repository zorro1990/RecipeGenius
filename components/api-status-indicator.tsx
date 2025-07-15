'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { 
  hasAnyAPIKey, 
  getConfiguredProviders, 
  API_PROVIDERS 
} from '@/lib/api-key-storage';

interface APIStatusIndicatorProps {
  onOpenSettings: () => void;
  className?: string;
}

export function APIStatusIndicator({ onOpenSettings, className = '' }: APIStatusIndicatorProps) {
  const [hasKeys, setHasKeys] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    updateStatus();
  }, []);

  const updateStatus = () => {
    if (typeof window !== 'undefined') {
      setHasKeys(hasAnyAPIKey());
      setProviders(getConfiguredProviders());
    }
  };

  // 监听localStorage变化
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = () => {
      updateStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查状态（处理同页面内的变化）
    const interval = setInterval(updateStatus, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [mounted]);

  if (!mounted) {
    return null; // 避免SSR不匹配
  }

  const getStatusInfo = (): {
    icon: React.ReactNode;
    text: string;
    variant: 'outline' | 'secondary';
    description: string;
    className?: string;
  } => {
    if (!hasKeys) {
      return {
        icon: <Settings className="size-4 text-orange-500" />,
        text: '配置AI服务',
        variant: 'outline' as const,
        description: '点击配置AI提供商',
        className: 'border-orange-200 text-orange-700 hover:bg-orange-50'
      };
    }

    if (providers.length === 1) {
      const provider = providers[0];
      const info = API_PROVIDERS[provider as keyof typeof API_PROVIDERS];
      return {
        icon: <CheckCircle className="size-4 text-green-500" />,
        text: `AI已就绪`,
        variant: 'outline' as const,
        description: `使用${info?.name || provider}`,
        className: 'border-green-200 text-green-700 hover:bg-green-50'
      };
    }

    return {
      icon: <CheckCircle className="size-4 text-blue-500" />,
      text: `${providers.length}个AI服务`,
      variant: 'outline' as const,
      description: '多个提供商已配置',
      className: 'border-blue-200 text-blue-700 hover:bg-blue-50'
    };
  };

  const status = getStatusInfo();

  return (
    <Button
      variant={status.variant}
      size="sm"
      onClick={onOpenSettings}
      className={`flex items-center gap-2 h-auto px-3 py-2 ${status.className || ''} ${className}`}
      title={status.description}
    >
      {status.icon}
      <span className="text-sm font-medium">{status.text}</span>
    </Button>
  );
}

// 简化版本的状态指示器（只显示图标）
export function APIStatusIcon({ onOpenSettings, className = '' }: APIStatusIndicatorProps) {
  const [hasKeys, setHasKeys] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setHasKeys(hasAnyAPIKey());
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = () => {
      if (typeof window !== 'undefined') {
        setHasKeys(hasAnyAPIKey());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onOpenSettings}
      className={`h-8 w-8 p-0 ${className}`}
      title={hasKeys ? 'API已配置 - 点击管理' : '未配置API - 点击设置'}
    >
      {hasKeys ? (
        <CheckCircle className="size-4 text-green-500" />
      ) : (
        <AlertCircle className="size-4 text-amber-500" />
      )}
    </Button>
  );
}
