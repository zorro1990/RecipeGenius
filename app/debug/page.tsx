'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { hasAnyAPIKey, getStoredAPIKeys } from '@/lib/api-key-storage';

export default function DebugPage() {
  const [result, setResult] = useState<string>('');

  const testAPIKeys = () => {
    const hasKeys = hasAnyAPIKey();
    const keys = getStoredAPIKeys();
    
    setResult(`
API密钥检测结果:
- hasAnyAPIKey(): ${hasKeys}
- 存储的密钥: ${JSON.stringify(keys, null, 2)}
    `);
  };

  const testAPICall = async () => {
    try {
      setResult('开始测试API调用...');
      
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ['土豆', '胡萝卜'],
          preferences: {
            dietaryRestrictions: [],
            cuisineType: [],
            cookingTime: 30,
            servings: 2,
            difficulty: 'easy',
            allergies: [],
          },
          apiKeys: getStoredAPIKeys()
        }),
      });

      const data = await response.json();
      
      setResult(`
API调用结果:
- 状态码: ${response.status}
- 响应: ${JSON.stringify(data, null, 2)}
      `);
    } catch (error) {
      setResult(`API调用失败: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>调试工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testAPIKeys}>
              测试API密钥
            </Button>
            <Button onClick={testAPICall}>
              测试API调用
            </Button>
          </div>
          
          {result && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">
                {result}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
