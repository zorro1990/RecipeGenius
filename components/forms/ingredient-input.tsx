'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, Search, Sparkles, ChefHat, Trash2 } from 'lucide-react';
import { cleanIngredients, validateIngredient } from '@/lib/utils';

// 食材分类数据
const INGREDIENT_CATEGORIES = {
  leafy: {
    name: '叶菜类',
    icon: '🥬',
    items: ['上海青', '菠菜', '生菜', '油麦菜', '小白菜', '芥蓝', '空心菜', '娃娃菜']
  },
  fruitVeg: {
    name: '果菜类',
    icon: '🍅',
    items: ['番茄', '黄瓜', '青椒', '彩椒', '苦瓜', '南瓜', '西葫芦', '冬瓜', '丝瓜', '茄子']
  },
  roots: {
    name: '根茎类',
    icon: '🥕',
    items: ['土豆', '胡萝卜', '白萝卜', '红薯', '山药', '芋头', '莲藕', '姜', '蒜']
  },
  mushrooms: {
    name: '菌菇类',
    icon: '🍄',
    items: ['香菇', '金针菇', '平菇', '杏鲍菇', '白玉菇', '木耳', '茶树菇']
  },
  soy: {
    name: '豆制品',
    icon: '🫘',
    items: ['豆腐', '老豆腐', '豆干', '豆皮', '毛豆', '黄豆芽', '腐竹', '素鸡']
  },
  meats: {
    name: '肉禽蛋',
    icon: '🍗',
    items: ['鸡胸肉', '鸡腿', '猪里脊', '牛肉片', '鸭肉', '鸡蛋', '鸭蛋', '鹌鹑蛋']
  },
  seafood: {
    name: '水产海鲜',
    icon: '🐟',
    items: ['鲈鱼', '草鱼', '三文鱼', '虾仁', '带鱼', '花蛤', '鱿鱼', '青口']
  },
  staples: {
    name: '主食谷物',
    icon: '🍚',
    items: ['大米', '糯米', '面条', '意面', '玉米', '燕麦', '馒头', '年糕', '粉丝']
  },
  others: {
    name: '其他',
    icon: '🥘',
    items: ['鱼丸', '贡丸', '午餐肉', '腊肠', '米线', '腐竹结', '湘莲', '墨鱼丸']
  }
};

// 搜索建议数据
const SEARCH_SUGGESTIONS = [
  '鸡蛋', '番茄', '土豆', '洋葱', '大蒜', '生姜', '胡萝卜', '青椒',
  '上海青', '油麦菜', '豆腐', '鸡胸肉', '猪里脊', '牛肉片', '虾仁', '毛豆',
  '芹菜', '菠菜', '茄子', '黄瓜', '冬瓜', '南瓜', '丝瓜', '莲藕', '香菇', '金针菇'
];

interface IngredientInputProps {
  onIngredientsChange: (ingredients: string[]) => void;
  initialIngredients?: string[];
}

export function IngredientInput({
  onIngredientsChange,
  initialIngredients = []
}: IngredientInputProps) {
  const [ingredients, setIngredients] = useState<string[]>(initialIngredients);
  const [currentInput, setCurrentInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 搜索建议逻辑
  useEffect(() => {
    if (currentInput.trim()) {
      const filtered = SEARCH_SUGGESTIONS.filter(item =>
        item.includes(currentInput.trim()) && !ingredients.includes(item)
      );
      setFilteredSuggestions(filtered.slice(0, 6));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [currentInput, ingredients]);

  const addIngredient = (ingredient?: string) => {
    setError(null);
    const ingredientToAdd = ingredient || currentInput.trim();

    if (!ingredientToAdd) {
      setError('请输入食材名称');
      return;
    }

    if (!validateIngredient(ingredientToAdd)) {
      setError('食材名称长度应在1-50个字符之间');
      return;
    }

    if (ingredients.includes(ingredientToAdd)) {
      setError('该食材已经添加过了');
      return;
    }

    const newIngredients = [...ingredients, ingredientToAdd];
    setIngredients(newIngredients);
    onIngredientsChange(newIngredients);
    setCurrentInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
    onIngredientsChange(newIngredients);
  };

  const clearAllIngredients = () => {
    setIngredients([]);
    onIngredientsChange([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleBatchAdd = (text: string) => {
    const newIngredients = cleanIngredients([...ingredients, ...text.split(/[,，、\n]/)]);
    setIngredients(newIngredients);
    onIngredientsChange(newIngredients);
  };

  const addFromCategory = (ingredient: string) => {
    if (!ingredients.includes(ingredient)) {
      addIngredient(ingredient);
    }
  };

  return (
    <div className="space-y-6">
      {/* 主要输入区域 */}
      <Card className="border-2 border-dashed border-orange-200 bg-orange-50/30">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <ChefHat className="size-8 text-orange-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900">添加你的食材</h3>
              <p className="text-sm text-gray-600">输入现有食材，AI将为你推荐最佳搭配</p>
            </div>

            <div className="relative">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
                  <Input
                    ref={inputRef}
                    placeholder="搜索或输入食材名称..."
                    value={currentInput}
                    onChange={(e) => {
                      setCurrentInput(e.target.value);
                      setError(null);
                    }}
                    onKeyPress={handleKeyPress}
                    onFocus={() => currentInput && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="pl-10 h-12 text-base border-2 focus:border-orange-400"
                    maxLength={50}
                  />

                  {/* 搜索建议下拉 */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full px-4 py-2 text-left hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0"
                          onClick={() => addIngredient(suggestion)}
                        >
                          <span className="text-gray-700">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => addIngredient()}
                  size="lg"
                  disabled={!currentInput.trim()}
                  className="h-12 px-6 bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="size-5 mr-2" />
                  添加
                </Button>
              </div>

              {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 已选食材展示区域 */}
      {ingredients.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  已选食材 ({ingredients.length})
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllIngredients}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="size-4 mr-1" />
                清空
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              {ingredients.map((ingredient, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                >
                  <span className="font-medium">{ingredient}</span>
                  <X
                    className="size-4 cursor-pointer hover:text-red-600 transition-colors"
                    onClick={() => removeIngredient(index)}
                  />
                </Badge>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 已有 {ingredients.length} 种食材，可以生成丰富的菜谱了！继续添加更多食材获得更多选择。
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-gray-300">
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🥕</div>
              <h3 className="text-lg font-medium mb-2">还没有添加任何食材</h3>
              <p className="text-sm">开始输入你现有的食材，让AI为你创造美味菜谱！</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分类快速添加 */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              快速添加常见食材
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(INGREDIENT_CATEGORIES).map(([key, category]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  className="text-sm"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              调味品可通过搜索或手动输入添加，小众食材请尝试“其他”分类或批量录入。
            </p>

            {selectedCategory ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span>{INGREDIENT_CATEGORIES[selectedCategory as keyof typeof INGREDIENT_CATEGORIES].icon}</span>
                  {INGREDIENT_CATEGORIES[selectedCategory as keyof typeof INGREDIENT_CATEGORIES].name}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {INGREDIENT_CATEGORIES[selectedCategory as keyof typeof INGREDIENT_CATEGORIES].items.map((item) => (
                    <Button
                      key={item}
                      variant="outline"
                      size="sm"
                      onClick={() => addFromCategory(item)}
                      disabled={ingredients.includes(item)}
                      className={`text-sm transition-all ${
                        ingredients.includes(item)
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-orange-50 hover:border-orange-300'
                      }`}
                    >
                      {item}
                      {ingredients.includes(item) && <span className="ml-1 text-green-500">✓</span>}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">选择一个分类查看相关食材</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 批量输入 */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              批量输入食材
            </h3>
            <p className="text-sm text-gray-600">
              粘贴食材清单，支持逗号、换行或顿号分隔，一次性添加多个食材
            </p>

            <div className="space-y-3">
              <textarea
                placeholder="例如：鸡蛋、西红柿、土豆&#10;洋葱，大蒜，生姜&#10;胡萝卜、青椒"
                className="w-full p-4 border-2 border-gray-200 rounded-lg resize-none focus:border-orange-400 focus:outline-none transition-colors"
                rows={4}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    handleBatchAdd(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-1">支持的分隔符：</p>
                <p>• 逗号（,）• 中文逗号（，）• 顿号（、）• 换行</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
