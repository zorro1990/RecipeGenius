// 食材接口
export interface Ingredient {
  name: string;
  quantity?: string;
  unit?: string;
  category?: 'protein' | 'vegetable' | 'grain' | 'dairy' | 'spice' | 'other';
}

// 营养信息接口
export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// 健康信息接口
export interface HealthInfo {
  filteredIngredients: string[]; // 被过滤的食材
  filterReasons: string[]; // 过滤原因
  healthBenefits: string[]; // 健康益处
  nutritionHighlights: string[]; // 营养重点
  healthTips: string[]; // 健康建议
}

// 菜谱接口
export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  cookingTime: number; // 分钟
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  nutrition: NutritionInfo;
  tags: string[];
  tips?: string[];
  healthInfo?: HealthInfo; // 健康信息
  createdAt?: string;
  updatedAt?: string;
}

// 健康状况接口
export interface HealthCondition {
  id: string;
  name: string;
  category: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  forbiddenIngredients: string[]; // 绝对禁止的食材
  limitedIngredients: string[]; // 需要限制的食材
  recommendedIngredients: string[]; // 推荐的食材
  nutritionFocus: string[]; // 营养重点关注
  healthTips: string[]; // 健康建议
  scientificBasis: string; // 科学依据
}

// 用户偏好接口
export interface UserPreferences {
  dietaryRestrictions: string[]; // 饮食限制：素食、无麸质等
  cuisineType: string[]; // 菜系偏好：中式、西式、日式等
  cookingTime: number; // 最大烹饪时间（分钟）
  servings: number; // 用餐人数
  difficulty: 'easy' | 'medium' | 'hard'; // 难度偏好
  allergies?: string[]; // 过敏原
  healthConditions?: string[]; // 健康状况
}

// API响应接口
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 菜谱生成请求接口
export interface RecipeGenerationRequest {
  ingredients: string[];
  preferences: UserPreferences;
}

// 菜谱生成响应接口
export interface RecipeGenerationResponse {
  recipe: Recipe;
}

// 营养分析请求接口
export interface NutritionAnalysisRequest {
  recipe: Recipe;
}

// 营养分析响应接口
export interface NutritionAnalysisResponse {
  nutrition: NutritionInfo;
  recommendations?: string[];
}

// 食材替代建议接口
export interface IngredientAlternative {
  original: string;
  alternatives: string[];
  reason?: string;
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// 加载状态类型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 菜谱难度映射
export const DIFFICULTY_LABELS = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
} as const;

// 常见饮食限制选项
export const DIETARY_RESTRICTIONS = [
  '素食',
  '纯素食',
  '无麸质',
  '低卡路里',
  '低盐',
  '低糖',
  '高蛋白',
  '生酮饮食'
] as const;

// 常见菜系类型
export const CUISINE_TYPES = [
  '中式',
  '西式',
  '日式',
  '韩式',
  '泰式',
  '意式',
  '法式',
  '印度菜',
  '墨西哥菜'
] as const;

// 常见过敏原
export const COMMON_ALLERGENS = [
  '花生',
  '坚果',
  '牛奶',
  '鸡蛋',
  '大豆',
  '小麦',
  '鱼类',
  '贝类'
] as const;

// 健康状况分类
export const HEALTH_CONDITION_CATEGORIES = [
  '代谢性疾病',
  '心血管疾病',
  '消化系统疾病',
  '内分泌疾病',
  '骨骼疾病',
  '肾脏疾病',
  '其他疾病'
] as const;

// 常见健康状况
export const COMMON_HEALTH_CONDITIONS: HealthCondition[] = [
  // 代谢性疾病
  {
    id: 'diabetes',
    name: '糖尿病',
    category: '代谢性疾病',
    description: '血糖控制异常，需要严格控制糖分摄入',
    severity: 'severe',
    forbiddenIngredients: ['白糖', '红糖', '蜂蜜', '糖果', '甜饮料', '蛋糕', '甜点', '果脯'],
    limitedIngredients: ['白米', '白面', '土豆', '红薯', '玉米', '香蕉', '葡萄'],
    recommendedIngredients: ['燕麦', '糙米', '全麦面包', '绿叶蔬菜', '瘦肉', '鱼类', '豆腐'],
    nutritionFocus: ['碳水化合物', '血糖指数', '膳食纤维'],
    healthTips: [
      '少食多餐，控制总热量摄入',
      '选择低血糖指数的食物',
      '餐后适量运动有助于血糖控制',
      '定期监测血糖变化'
    ],
    scientificBasis: '糖尿病患者胰岛素分泌不足或作用异常，需要控制碳水化合物摄入以维持血糖稳定'
  },
  {
    id: 'gout',
    name: '痛风',
    category: '代谢性疾病',
    description: '尿酸代谢异常，需要严格限制高嘌呤食物',
    severity: 'severe',
    forbiddenIngredients: [
      // 动物内脏
      '动物内脏', '猪肝', '鸡肝', '牛肝', '羊肝', '猪肾', '猪心', '鸡胗', '鸭胗',
      // 海鲜贝类
      '海鲜', '贝类', '蛤蜊', '青口', '扇贝', '牡蛎', '生蚝', '海蛎', '蚌', '螺',
      '虾', '螃蟹', '龙虾', '海虾', '河虾', '基围虾', '白虾', '对虾',
      // 鱼类
      '沙丁鱼', '凤尾鱼', '鲭鱼', '秋刀鱼', '带鱼', '黄花鱼', '鲱鱼',
      // 汤类
      '肉汤', '浓汤', '骨头汤', '鸡汤', '鱼汤', '海鲜汤', '火锅汤底',
      // 酒类
      '啤酒', '白酒', '红酒', '黄酒', '料酒',
      // 豆类
      '黄豆', '豌豆', '蚕豆', '绿豆', '红豆', '黑豆', '芸豆'
    ],
    limitedIngredients: ['红肉', '猪肉', '牛肉', '羊肉', '鸭肉', '鹅肉', '菠菜', '芦笋'],
    recommendedIngredients: ['低脂奶制品', '鸡蛋', '白菜', '萝卜', '冬瓜', '樱桃', '苹果'],
    nutritionFocus: ['嘌呤含量', '尿酸水平', '水分摄入'],
    healthTips: [
      '多喝水，每天至少2000ml',
      '避免饮酒，特别是啤酒',
      '控制体重，避免肥胖',
      '急性发作期严格限制嘌呤摄入'
    ],
    scientificBasis: '痛风是由于嘌呤代谢紊乱导致尿酸升高，高嘌呤食物会加重病情'
  },
  {
    id: 'hyperlipidemia',
    name: '高血脂',
    category: '代谢性疾病',
    description: '血脂异常，需要控制胆固醇和饱和脂肪摄入',
    severity: 'moderate',
    forbiddenIngredients: ['蛋黄', '动物内脏', '肥肉', '猪油', '牛油', '奶油', '黄油'],
    limitedIngredients: ['红肉', '全脂奶制品', '椰子油', '棕榈油', '油炸食品'],
    recommendedIngredients: ['深海鱼', '坚果', '橄榄油', '燕麦', '豆类', '蔬菜', '水果'],
    nutritionFocus: ['胆固醇', '饱和脂肪', 'Omega-3脂肪酸'],
    healthTips: [
      '选择不饱和脂肪酸丰富的食物',
      '增加膳食纤维摄入',
      '适量运动有助于改善血脂',
      '定期检查血脂水平'
    ],
    scientificBasis: '饱和脂肪和胆固醇会升高血液中的低密度脂蛋白，增加心血管疾病风险'
  },

  // 心血管疾病
  {
    id: 'hypertension',
    name: '高血压',
    category: '心血管疾病',
    description: '血压升高，需要严格控制钠盐摄入',
    severity: 'moderate',
    forbiddenIngredients: ['咸菜', '腌制品', '咸鱼', '咸肉', '火腿', '香肠', '方便面', '薯片'],
    limitedIngredients: ['生抽', '老抽', '蚝油', '豆瓣酱', '味精', '鸡精', '盐'],
    recommendedIngredients: ['新鲜蔬菜', '水果', '低脂奶制品', '瘦肉', '鱼类', '豆类'],
    nutritionFocus: ['钠含量', '钾含量', '镁含量'],
    healthTips: [
      '每日盐摄入量不超过6克',
      '多吃富含钾的食物如香蕉、菠菜',
      '保持适当体重',
      '规律运动，戒烟限酒'
    ],
    scientificBasis: '高钠摄入会导致体内水钠潴留，增加血管压力，升高血压'
  },
  {
    id: 'heart_disease',
    name: '心脏病',
    category: '心血管疾病',
    description: '心脏功能异常，需要心脏友好的饮食',
    severity: 'severe',
    forbiddenIngredients: ['反式脂肪', '人造黄油', '油炸食品', '加工肉类', '高盐食品'],
    limitedIngredients: ['饱和脂肪', '胆固醇', '精制糖', '咖啡因'],
    recommendedIngredients: ['深海鱼', '坚果', '橄榄油', '全谷物', '豆类', '蔬菜', '水果'],
    nutritionFocus: ['Omega-3脂肪酸', '抗氧化剂', '膳食纤维'],
    healthTips: [
      '选择富含Omega-3的鱼类',
      '增加抗氧化食物摄入',
      '控制总热量和体重',
      '避免过度劳累和情绪激动'
    ],
    scientificBasis: 'Omega-3脂肪酸和抗氧化剂有助于保护心血管健康，减少炎症反应'
  },

  // 消化系统疾病
  {
    id: 'gastritis',
    name: '胃病',
    category: '消化系统疾病',
    description: '胃黏膜炎症，需要温和易消化的饮食',
    severity: 'mild',
    forbiddenIngredients: ['辣椒', '胡椒', '咖啡', '浓茶', '酒精', '醋', '柠檬', '生蒜'],
    limitedIngredients: ['油腻食物', '粗纤维食物', '冷饮', '碳酸饮料'],
    recommendedIngredients: ['小米粥', '面条', '蒸蛋', '嫩豆腐', '南瓜', '胡萝卜'],
    nutritionFocus: ['易消化性', '温和性', '营养密度'],
    healthTips: [
      '少食多餐，细嚼慢咽',
      '避免过冷过热的食物',
      '保持规律的饮食时间',
      '减少精神压力'
    ],
    scientificBasis: '刺激性食物会加重胃黏膜炎症，温和易消化的食物有助于胃黏膜修复'
  }
];
