'use client';

import { useState, useCallback } from 'react';
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
  CheckCircle,
  Clock
} from 'lucide-react';

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
  const [showSuggestions, setShowSuggestions] = useState(true);

  // 添加新食材
  const handleAddIngredient = useCallback(() => {
    if (newIngredient.trim() && !editedIngredients.includes(newIngredient.trim())) {
      setEditedIngredients(prev => [...prev, newIngredient.trim()]);
      setNewIngredient('');
    }
  }, [newIngredient, editedIngredients]);

  // 删除食材
  const handleRemoveIngredient = useCallback((index: number) => {
    setEditedIngredients(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 开始编辑食材
  const handleStartEdit = useCallback((index: number) => {
    setEditingIndex(index);
    setEditingValue(editedIngredients[index]);
  }, [editedIngredients]);

  // 保存编辑
  const handleSaveEdit = useCallback(() => {
    if (editingIndex !== null && editingValue.trim()) {
      setEditedIngredients(prev => 
        prev.map((item, index) => 
          index === editingIndex ? editingValue.trim() : item
        )
      );
    }
    setEditingIndex(null);
    setEditingValue('');
  }, [editingIndex, editingValue]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditingValue('');
  }, []);

  // 添加建议的食材
  const handleAddSuggestion = useCallback((suggestion: string) => {
    if (!editedIngredients.includes(suggestion)) {
      setEditedIngredients(prev => [...prev, suggestion]);
    }
  }, [editedIngredients]);

  // 确认食材列表
  const handleConfirm = useCallback(() => {
    onConfirm(editedIngredients.filter(ingredient => ingredient.trim().length > 0));
  }, [editedIngredients, onConfirm]);

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
          <div>
            <p className="text-sm text-gray-600 mb-2">图片描述：</p>
            <p className="text-sm bg-gray-50 p-2 rounded">{result.description}</p>
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
          <div className="space-y-2">
            {editedIngredients.map((ingredient, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
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
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
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
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveIngredient(index)}
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
            />
            <Button onClick={handleAddIngredient} disabled={!newIngredient.trim()}>
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 建议的食材 */}
      {result.suggestions && result.suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>建议添加的食材</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                {showSuggestions ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          {showSuggestions && (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.suggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`cursor-pointer hover:bg-primary hover:text-primary-foreground ${
                      editedIngredients.includes(suggestion) 
                        ? 'bg-primary text-primary-foreground' 
                        : ''
                    }`}
                    onClick={() => handleAddSuggestion(suggestion)}
                  >
                    {suggestion}
                    {!editedIngredients.includes(suggestion) && (
                      <Plus className="size-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* 食材分类 */}
      {result.categories && result.categories.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>食材分类</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.categories.map((category, index) => (
                <Badge key={index} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleConfirm}
          disabled={editedIngredients.length === 0 || isLoading}
          className="flex-1"
        >
          <CheckCircle className="size-4 mr-2" />
          确认使用这些食材 ({editedIngredients.length})
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          取消
        </Button>
      </div>

      {/* 使用提示 */}
      <Alert>
        <AlertCircle className="size-4" />
        <AlertDescription>
          <strong>提示：</strong>
          您可以编辑、删除或添加食材。点击编辑图标可以修改食材名称，点击垃圾桶图标可以删除。
          建议的食材可以点击直接添加到列表中。确认后这些食材将自动填入菜谱生成表单。
        </AlertDescription>
      </Alert>
    </div>
  );
}
