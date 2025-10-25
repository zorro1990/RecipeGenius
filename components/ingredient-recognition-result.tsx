'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Check, 
  X, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  Sparkles,
  AlertCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngredientRecognitionResult {
  ingredients: string[];
  confidence: number;
  description: string;
  suggestions?: string[];
  categories?: string[];
  processingTime?: number;
}

interface IngredientRecognitionResultProps {
  result: IngredientRecognitionResult;
  onConfirm: (confirmedIngredients: string[]) => void;
  onRetry: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export function IngredientRecognitionResult({
  result,
  onConfirm,
  onRetry,
  onCancel,
  isLoading = false,
  className = ''
}: IngredientRecognitionResultProps) {
  const [editedIngredients, setEditedIngredients] = useState<string[]>(result.ingredients);
  const [newIngredient, setNewIngredient] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<string[]>([]);
  const latestConfirmRef = useRef(onConfirm);

  // 父组件使用内联函数时保持 onConfirm 引用稳定，避免触发无限循环
  useEffect(() => {
    latestConfirmRef.current = onConfirm;
  }, [onConfirm]);

  // 当识别结果更新时刷新本地编辑列表
  useEffect(() => {
    setEditedIngredients(result.ingredients);
  }, [result.ingredients]);

  // 同步当前列表到外部，确保底部 CTA 始终使用最新的食材集合
  useEffect(() => {
    const cleaned = editedIngredients
      .map((ingredient) => ingredient.trim())
      .filter((ingredient) => ingredient.length > 0);
    latestConfirmRef.current(cleaned);
  }, [editedIngredients]);

  // 添加新食材
  const handleAddIngredient = useCallback(() => {
    if (isLoading) return;
    if (newIngredient.trim() && !editedIngredients.includes(newIngredient.trim())) {
      setEditedIngredients(prev => [...prev, newIngredient.trim()]);
      setNewIngredient('');
    }
  }, [newIngredient, editedIngredients, isLoading]);

  // 删除食材
  const handleRemoveIngredient = useCallback((index: number) => {
    if (isLoading) return;
    setEditedIngredients(prev => prev.filter((_, i) => i !== index));
  }, [isLoading]);

  // 开始编辑食材
  const handleStartEdit = useCallback((index: number) => {
    if (isLoading) return;
    setEditingIndex(index);
    setEditingValue(editedIngredients[index]);
  }, [editedIngredients, isLoading]);

  // 保存编辑
  const handleSaveEdit = useCallback(() => {
    if (isLoading) return;
    if (editingIndex !== null && editingValue.trim()) {
      setEditedIngredients(prev => 
        prev.map((item, index) => 
          index === editingIndex ? editingValue.trim() : item
        )
      );
    }
    setEditingIndex(null);
    setEditingValue('');
  }, [editingIndex, editingValue, isLoading]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingValue('');
  }, []);

  // 添加建议的食材
  const handleAddSuggestion = useCallback((suggestion: string) => {
    if (isLoading) return;
    if (!editedIngredients.includes(suggestion)) {
      setEditedIngredients(prev => [...prev, suggestion]);
    }
  }, [editedIngredients, isLoading]);

  const togglePendingSuggestion = useCallback((suggestion: string) => {
    setPendingSuggestions(prev => {
      if (isLoading) {
        return prev;
      }
      if (prev.includes(suggestion)) {
        return prev.filter(item => item !== suggestion);
      }
      return [...prev, suggestion];
    });
  }, [isLoading]);

  // 获取置信度颜色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 获取置信度描述
  const getConfidenceDescription = (confidence: number) => {
    if (confidence >= 0.8) return '识别准确度高';
    if (confidence >= 0.6) return '识别准确度中等';
    return '识别准确度较低，请仔细检查';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 识别结果概览 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              AI识别结果
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getConfidenceColor(result.confidence)}>
                {(result.confidence * 100).toFixed(0)}% 准确度
              </Badge>
              {result.processingTime && (
                <Badge variant="outline" className="text-gray-600">
                  <Clock className="size-3 mr-1" />
                  {(result.processingTime / 1000).toFixed(1)}s
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 描述 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>图片描述</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedDescription(prev => !prev)}
              >
                {expandedDescription ? (
                  <>
                    <EyeOff className="size-4 mr-1" />
                    收起识别说明
                  </>
                ) : (
                  <>
                    <Eye className="size-4 mr-1" />
                    展开识别说明
                  </>
                )}
              </Button>
            </div>
            {expandedDescription && (
              <p className="text-sm bg-gray-50 p-2 rounded">{result.description}</p>
            )}
          </div>

          {/* 置信度警告 */}
          {result.confidence < 0.6 && (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription>
                {getConfidenceDescription(result.confidence)}，建议手动检查和调整识别结果。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 识别的食材列表 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>识别的食材 ({editedIngredients.length})</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isLoading}
            >
              重新识别
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 食材列表 */}
          <div className="space-y-2" id="ingredient-list">
            {editedIngredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded transition-shadow"
              >
                {editingIndex === index ? (
                  <>
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                      disabled={isLoading}
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveEdit} disabled={isLoading}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isLoading}>
                      <X className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{ingredient}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(index)}
                      disabled={isLoading}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveIngredient(index)}
                      disabled={isLoading}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}

            {editedIngredients.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                暂无食材，请添加或重新识别
              </div>
            )}
          </div>

          {/* 添加新食材 */}
          <div className="flex gap-2">
            <Input
              placeholder="手动添加食材..."
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddIngredient();
              }}
              disabled={isLoading}
            />
            <Button
              onClick={handleAddIngredient}
              disabled={isLoading || !newIngredient.trim()}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 建议的食材 */}
      {result.suggestions && result.suggestions.length > 0 && (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => !isLoading && setShowSuggestions(true)}
            disabled={isLoading}
          >
            <Sparkles className="size-4 mr-2" />
            查看 AI 建议
          </Button>

          {showSuggestions && (
            <div
              role="dialog"
              aria-labelledby="ai-suggestion-title"
              className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-4"
              onClick={() => setShowSuggestions(false)}
            >
              <div
                className="w-full max-w-xl rounded-t-2xl bg-white shadow-lg"
                onClick={(event) => event.stopPropagation()}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle id="ai-suggestion-title" className="flex items-center gap-2">
                        <Sparkles className="size-5 text-primary" />
                        来自 AI 的建议
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      选中后可以补充到识别结果中，新增项目会标记为「人工补充」。
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {result.suggestions.map((suggestion, index) => {
                        const alreadySelected = editedIngredients.includes(suggestion);
                        const pending = pendingSuggestions.includes(suggestion);
                        return (
                          <Badge
                            key={index}
                            variant={alreadySelected ? 'default' : 'outline'}
                            className={cn(
                              'cursor-pointer transition-colors',
                              alreadySelected && 'bg-primary text-primary-foreground',
                              pending && 'ring-2 ring-primary'
                            )}
                            onClick={() => togglePendingSuggestion(suggestion)}
                          >
                            {suggestion}
                            {!alreadySelected && (
                              <span className="ml-1 text-xs opacity-75">
                                {pending ? '✓' : '+'}
                              </span>
                            )}
                          </Badge>
                        );
                      })}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setPendingSuggestions([])}
                        disabled={isLoading || pendingSuggestions.length === 0}
                      >
                        清空选择
                      </Button>
                      <Button
                        onClick={() => {
                          if (pendingSuggestions.length === 0) {
                            setShowSuggestions(false);
                            return;
                          }
                          pendingSuggestions.forEach(handleAddSuggestion);
                          setPendingSuggestions([]);
                          setShowSuggestions(false);
                        }}
                        disabled={isLoading || pendingSuggestions.length === 0}
                      >
                        添加所选食材
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-end pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          取消本次识别
        </Button>
      </div>

      {/* 使用提示 */}
      <Alert>
        <AlertCircle className="size-4" />
        <AlertDescription>
          <strong>提示：</strong>
          您可以编辑、删除或添加食材。点击编辑图标可以修改食材名称，点击垃圾桶图标可以删除。
          建议的食材可以点击直接添加到列表中。列表内容会实时同步到底部的生成按钮。
        </AlertDescription>
      </Alert>
    </div>
  );
}
