'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChefHat, Clock, Users, Star, Heart, Share2, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// 示例菜谱数据
const exampleRecipes = [
  {
    id: '1',
    title: '西红柿鸡蛋面',
    description: '经典家常面条，酸甜可口，营养丰富，制作简单快手',
    image: '🍜',
    cookingTime: 15,
    servings: 2,
    difficulty: 'easy',
    rating: 4.8,
    tags: ['家常菜', '快手菜', '营养丰富', '面食'],
    cuisine: '中式',
    mealType: '午餐',
    ingredients: [
      { name: '面条', quantity: '200', unit: 'g' },
      { name: '西红柿', quantity: '2', unit: '个' },
      { name: '鸡蛋', quantity: '3', unit: '个' },
      { name: '大葱', quantity: '1', unit: '根' },
      { name: '大蒜', quantity: '2', unit: '瓣' }
    ],
    steps: [
      '西红柿洗净切块，鸡蛋打散备用',
      '热锅下油，炒制鸡蛋盛起备用',
      '锅中放油，爆香蒜蓉和葱白',
      '下入西红柿块炒出汁水',
      '加入适量水煮开，下入面条',
      '面条煮至8分熟时加入炒蛋',
      '调味后撒上葱花即可出锅'
    ],
    nutrition: {
      calories: 420,
      protein: 18,
      carbs: 65,
      fat: 12,
      fiber: 4
    },
    tips: [
      '西红柿要充分炒出汁水，这样汤汁更浓郁',
      '鸡蛋要嫩滑，不要炒过头',
      '可以加一点糖提鲜'
    ]
  },
  {
    id: '2',
    title: '蒜蓉西兰花',
    description: '清爽健康的素食菜品，保持蔬菜的鲜嫩口感和营养价值',
    image: '🥦',
    cookingTime: 10,
    servings: 3,
    difficulty: 'easy',
    rating: 4.6,
    tags: ['素食', '健康', '低卡', '快手菜'],
    cuisine: '中式',
    mealType: '午餐',
    ingredients: [
      { name: '西兰花', quantity: '1', unit: '颗' },
      { name: '大蒜', quantity: '4', unit: '瓣' },
      { name: '生抽', quantity: '1', unit: '勺' },
      { name: '盐', quantity: '适量', unit: '' },
      { name: '食用油', quantity: '2', unit: '勺' }
    ],
    steps: [
      '西兰花洗净切成小朵，大蒜切末',
      '锅中烧水，水开后放入西兰花焯水2分钟',
      '捞出西兰花过冷水保持翠绿',
      '热锅下油，爆香蒜末',
      '倒入西兰花大火翻炒',
      '加入生抽和盐调味即可'
    ],
    nutrition: {
      calories: 85,
      protein: 6,
      carbs: 12,
      fat: 3,
      fiber: 5
    },
    tips: [
      '焯水时间不要太长，保持脆嫩口感',
      '过冷水可以保持蔬菜的翠绿色',
      '大火快炒，避免出水'
    ]
  },
  {
    id: '3',
    title: '红烧肉',
    description: '传统经典菜品，肥而不腻，入口即化，色泽红亮诱人',
    image: '🥩',
    cookingTime: 90,
    servings: 4,
    difficulty: 'medium',
    rating: 4.9,
    tags: ['经典菜', '下饭菜', '传统', '炖菜'],
    cuisine: '中式',
    mealType: '晚餐',
    ingredients: [
      { name: '五花肉', quantity: '500', unit: 'g' },
      { name: '冰糖', quantity: '30', unit: 'g' },
      { name: '生抽', quantity: '3', unit: '勺' },
      { name: '老抽', quantity: '1', unit: '勺' },
      { name: '料酒', quantity: '2', unit: '勺' },
      { name: '八角', quantity: '2', unit: '个' },
      { name: '桂皮', quantity: '1', unit: '小段' },
      { name: '香叶', quantity: '2', unit: '片' }
    ],
    steps: [
      '五花肉洗净切成3cm见方的块',
      '冷水下锅焯水去腥，捞出备用',
      '锅中放少量油，下入冰糖炒糖色',
      '糖色呈焦糖色时下入肉块翻炒上色',
      '加入料酒、生抽、老抽翻炒',
      '加入香料和热水没过肉块',
      '大火烧开转小火炖煮1小时',
      '最后大火收汁即可'
    ],
    nutrition: {
      calories: 580,
      protein: 25,
      carbs: 8,
      fat: 48,
      fiber: 0
    },
    tips: [
      '炒糖色是关键，要掌握好火候',
      '炖煮时间要足够，肉质才会软烂',
      '最后收汁要用大火，汤汁浓稠包裹肉块'
    ]
  },
  {
    id: '4',
    title: '麻婆豆腐',
    description: '经典川菜，麻辣鲜香，嫩滑豆腐配上香辣肉末，下饭神器',
    image: '🌶️',
    cookingTime: 20,
    servings: 3,
    difficulty: 'medium',
    rating: 4.7,
    tags: ['川菜', '麻辣', '下饭菜', '经典菜'],
    cuisine: '川菜',
    mealType: '午餐',
    ingredients: [
      { name: '嫩豆腐', quantity: '400', unit: 'g' },
      { name: '猪肉末', quantity: '100', unit: 'g' },
      { name: '豆瓣酱', quantity: '2', unit: '勺' },
      { name: '花椒粉', quantity: '1', unit: '勺' },
      { name: '大蒜', quantity: '3', unit: '瓣' },
      { name: '生抽', quantity: '1', unit: '勺' },
      { name: '淀粉', quantity: '1', unit: '勺' },
      { name: '葱花', quantity: '适量', unit: '' }
    ],
    steps: [
      '豆腐切块，用盐水焯一下去豆腥味',
      '热锅下油，炒制肉末至变色',
      '加入豆瓣酱炒出红油',
      '加入蒜末爆香',
      '倒入适量水烧开',
      '下入豆腐块轻轻推匀',
      '用淀粉水勾芡，撒花椒粉',
      '最后撒上葱花即可'
    ],
    nutrition: {
      calories: 280,
      protein: 20,
      carbs: 12,
      fat: 18,
      fiber: 3
    },
    tips: [
      '豆腐要选用嫩豆腐，口感更佳',
      '豆瓣酱要炒出红油才香',
      '推豆腐时要轻柔，避免弄碎'
    ]
  },
  {
    id: '5',
    title: '蒸蛋羹',
    description: '嫩滑如丝的蒸蛋，营养丰富，老少皆宜，制作简单',
    image: '🥚',
    cookingTime: 15,
    servings: 2,
    difficulty: 'easy',
    rating: 4.5,
    tags: ['儿童友好', '营养丰富', '蒸制', '简单'],
    cuisine: '中式',
    mealType: '早餐',
    ingredients: [
      { name: '鸡蛋', quantity: '3', unit: '个' },
      { name: '温水', quantity: '150', unit: 'ml' },
      { name: '盐', quantity: '少许', unit: '' },
      { name: '香油', quantity: '几滴', unit: '' },
      { name: '生抽', quantity: '几滴', unit: '' }
    ],
    steps: [
      '鸡蛋打散，加入盐调味',
      '倒入温水搅拌均匀',
      '过筛去除泡沫',
      '盖上保鲜膜，用牙签扎几个小孔',
      '水开后蒸10-12分钟',
      '出锅后淋上香油和生抽即可'
    ],
    nutrition: {
      calories: 180,
      protein: 15,
      carbs: 2,
      fat: 12,
      fiber: 0
    },
    tips: [
      '蛋液与水的比例是1:1，口感最佳',
      '一定要过筛，这样蒸出来才嫩滑',
      '保鲜膜可以防止水汽滴落'
    ]
  },
  {
    id: '6',
    title: '番茄牛腩',
    description: '酸甜开胃的炖菜，牛腩软烂入味，番茄汁浓郁，营养丰富',
    image: '🍅',
    cookingTime: 120,
    servings: 4,
    difficulty: 'medium',
    rating: 4.8,
    tags: ['炖菜', '营养丰富', '酸甜', '下饭菜'],
    cuisine: '中式',
    mealType: '晚餐',
    ingredients: [
      { name: '牛腩', quantity: '500', unit: 'g' },
      { name: '番茄', quantity: '3', unit: '个' },
      { name: '洋葱', quantity: '1', unit: '个' },
      { name: '胡萝卜', quantity: '1', unit: '根' },
      { name: '土豆', quantity: '2', unit: '个' },
      { name: '番茄酱', quantity: '2', unit: '勺' },
      { name: '生抽', quantity: '2', unit: '勺' },
      { name: '料酒', quantity: '2', unit: '勺' }
    ],
    steps: [
      '牛腩切块，冷水下锅焯水去血沫',
      '番茄去皮切块，洋葱切丝',
      '胡萝卜和土豆切滚刀块',
      '热锅下油，炒制牛腩至微黄',
      '加入洋葱丝炒香',
      '倒入番茄块炒出汁水',
      '加入番茄酱、生抽、料酒',
      '加水没过食材，大火烧开转小火炖1.5小时',
      '最后30分钟加入胡萝卜和土豆'
    ],
    nutrition: {
      calories: 450,
      protein: 35,
      carbs: 25,
      fat: 22,
      fiber: 4
    },
    tips: [
      '牛腩要选择有筋有肉的部位',
      '番茄要充分炒出汁水',
      '炖煮时间要足够，肉质才会软烂'
    ]
  },
  {
    id: '7',
    title: '凉拌黄瓜',
    description: '清爽解腻的凉菜，脆嫩爽口，制作简单，夏日必备',
    image: '🥒',
    cookingTime: 10,
    servings: 2,
    difficulty: 'easy',
    rating: 4.4,
    tags: ['凉菜', '清爽', '简单', '夏日'],
    cuisine: '中式',
    mealType: '午餐',
    ingredients: [
      { name: '黄瓜', quantity: '2', unit: '根' },
      { name: '大蒜', quantity: '3', unit: '瓣' },
      { name: '生抽', quantity: '2', unit: '勺' },
      { name: '醋', quantity: '1', unit: '勺' },
      { name: '香油', quantity: '1', unit: '勺' },
      { name: '盐', quantity: '适量', unit: '' },
      { name: '糖', quantity: '少许', unit: '' }
    ],
    steps: [
      '黄瓜洗净，用刀拍碎切段',
      '加盐腌制10分钟，挤出水分',
      '大蒜切末',
      '调制料汁：生抽、醋、香油、糖',
      '将料汁和蒜末倒入黄瓜',
      '拌匀即可食用'
    ],
    nutrition: {
      calories: 45,
      protein: 2,
      carbs: 8,
      fat: 1,
      fiber: 2
    },
    tips: [
      '拍黄瓜比切丝更容易入味',
      '腌制后要挤出水分，口感更脆',
      '可以加点花生米增加口感'
    ]
  },
  {
    id: '8',
    title: '糖醋里脊',
    description: '酸甜可口的经典菜，外酥内嫩，色泽金黄，老少皆宜',
    image: '🍖',
    cookingTime: 30,
    servings: 3,
    difficulty: 'medium',
    rating: 4.6,
    tags: ['酸甜', '经典菜', '炸制', '下饭菜'],
    cuisine: '中式',
    mealType: '晚餐',
    ingredients: [
      { name: '里脊肉', quantity: '300', unit: 'g' },
      { name: '鸡蛋', quantity: '1', unit: '个' },
      { name: '淀粉', quantity: '3', unit: '勺' },
      { name: '番茄酱', quantity: '3', unit: '勺' },
      { name: '白醋', quantity: '2', unit: '勺' },
      { name: '糖', quantity: '2', unit: '勺' },
      { name: '生抽', quantity: '1', unit: '勺' }
    ],
    steps: [
      '里脊肉切条，用盐和料酒腌制',
      '加入鸡蛋和淀粉调成糊',
      '油温六成热时下锅炸至金黄',
      '调制糖醋汁：番茄酱、醋、糖、生抽',
      '锅中放少量油，倒入糖醋汁',
      '汁水浓稠时倒入炸好的里脊',
      '快速翻炒裹匀即可'
    ],
    nutrition: {
      calories: 380,
      protein: 28,
      carbs: 25,
      fat: 18,
      fiber: 1
    },
    tips: [
      '肉条要裹匀淀粉糊，炸制才酥脆',
      '油温要控制好，避免炸糊',
      '糖醋汁要调得酸甜适中'
    ]
  },
  {
    id: '9',
    title: '银耳莲子汤',
    description: '滋润养颜的甜品汤，银耳软糯，莲子清香，美容养生',
    image: '🍲',
    cookingTime: 60,
    servings: 4,
    difficulty: 'easy',
    rating: 4.3,
    tags: ['甜品', '养生', '美容', '滋润'],
    cuisine: '中式',
    mealType: '甜品',
    ingredients: [
      { name: '银耳', quantity: '1', unit: '朵' },
      { name: '莲子', quantity: '50', unit: 'g' },
      { name: '冰糖', quantity: '30', unit: 'g' },
      { name: '红枣', quantity: '6', unit: '颗' },
      { name: '枸杞', quantity: '10', unit: 'g' }
    ],
    steps: [
      '银耳提前泡发，撕成小朵',
      '莲子去芯，红枣去核',
      '锅中加水，放入银耳大火煮开',
      '转小火煮30分钟至银耳软糯',
      '加入莲子和红枣继续煮20分钟',
      '最后加入冰糖和枸杞煮5分钟即可'
    ],
    nutrition: {
      calories: 120,
      protein: 4,
      carbs: 28,
      fat: 1,
      fiber: 3
    },
    tips: [
      '银耳要充分泡发，煮出胶质',
      '莲子去芯可以避免苦味',
      '可以用电饭煲煮制，更省事'
    ]
  },
  {
    id: '10',
    title: '宫保鸡丁',
    description: '经典川菜，鸡肉嫩滑，花生香脆，麻辣鲜香，口感丰富',
    image: '🐔',
    cookingTime: 25,
    servings: 3,
    difficulty: 'medium',
    rating: 4.7,
    tags: ['川菜', '麻辣', '经典菜', '下饭菜'],
    cuisine: '川菜',
    mealType: '晚餐',
    ingredients: [
      { name: '鸡胸肉', quantity: '300', unit: 'g' },
      { name: '花生米', quantity: '50', unit: 'g' },
      { name: '干辣椒', quantity: '6', unit: '个' },
      { name: '花椒', quantity: '1', unit: '勺' },
      { name: '大葱', quantity: '2', unit: '段' },
      { name: '生抽', quantity: '2', unit: '勺' },
      { name: '料酒', quantity: '1', unit: '勺' },
      { name: '糖', quantity: '1', unit: '勺' },
      { name: '醋', quantity: '1', unit: '勺' }
    ],
    steps: [
      '鸡肉切丁，用料酒和生抽腌制',
      '花生米炸至酥脆备用',
      '调制宫保汁：生抽、糖、醋',
      '热锅下油，炒制鸡丁至变色',
      '加入干辣椒和花椒爆香',
      '倒入宫保汁炒匀',
      '最后加入花生米和葱段即可'
    ],
    nutrition: {
      calories: 320,
      protein: 32,
      carbs: 12,
      fat: 16,
      fiber: 2
    },
    tips: [
      '鸡肉要切得大小均匀',
      '花生米要炸得酥脆',
      '火候要掌握好，避免炒老'
    ]
  },
  {
    id: '11',
    title: '酸辣土豆丝',
    description: '经典下饭菜，酸辣开胃，土豆丝爽脆，制作简单快手',
    image: '🥔',
    cookingTime: 15,
    servings: 2,
    difficulty: 'easy',
    rating: 4.5,
    tags: ['快手菜', '酸辣', '下饭菜', '素食'],
    cuisine: '中式',
    mealType: '午餐',
    ingredients: [
      { name: '土豆', quantity: '2', unit: '个' },
      { name: '青椒', quantity: '1', unit: '个' },
      { name: '干辣椒', quantity: '3', unit: '个' },
      { name: '花椒', quantity: '10', unit: '粒' },
      { name: '醋', quantity: '2', unit: '勺' },
      { name: '生抽', quantity: '1', unit: '勺' },
      { name: '盐', quantity: '适量', unit: '' }
    ],
    steps: [
      '土豆去皮切丝，用水冲洗淀粉',
      '青椒切丝，干辣椒切段',
      '热锅下油，爆香花椒和干辣椒',
      '倒入土豆丝大火翻炒',
      '加入青椒丝继续炒',
      '调入醋、生抽、盐炒匀即可'
    ],
    nutrition: {
      calories: 150,
      protein: 4,
      carbs: 32,
      fat: 3,
      fiber: 4
    },
    tips: [
      '土豆丝要切得细一些',
      '冲洗淀粉可以保持爽脆',
      '醋要最后放，保持酸味'
    ]
  },
  {
    id: '12',
    title: '红烧茄子',
    description: '经典素食菜品，茄子软糯入味，汤汁浓郁，下饭必备',
    image: '🍆',
    cookingTime: 20,
    servings: 3,
    difficulty: 'easy',
    rating: 4.4,
    tags: ['素食', '下饭菜', '经典菜', '红烧'],
    cuisine: '中式',
    mealType: '午餐',
    ingredients: [
      { name: '茄子', quantity: '2', unit: '根' },
      { name: '大蒜', quantity: '4', unit: '瓣' },
      { name: '生抽', quantity: '3', unit: '勺' },
      { name: '老抽', quantity: '1', unit: '勺' },
      { name: '糖', quantity: '1', unit: '勺' },
      { name: '盐', quantity: '适量', unit: '' },
      { name: '葱花', quantity: '适量', unit: '' }
    ],
    steps: [
      '茄子切滚刀块，用盐腌制10分钟',
      '挤出茄子的水分',
      '热锅下油，炸制茄子至软身',
      '留底油，爆香蒜末',
      '倒入茄子翻炒',
      '加入生抽、老抽、糖调色调味',
      '加少量水焖煮5分钟',
      '最后撒上葱花即可'
    ],
    nutrition: {
      calories: 180,
      protein: 3,
      carbs: 18,
      fat: 12,
      fiber: 6
    },
    tips: [
      '茄子腌制可以减少吸油',
      '炸制时油温要适中',
      '焖煮可以让茄子更入味'
    ]
  },
  {
    id: '13',
    title: '白切鸡',
    description: '经典粤菜，鸡肉鲜嫩，清淡原味，配蘸料食用，营养健康',
    image: '🐓',
    cookingTime: 45,
    servings: 4,
    difficulty: 'medium',
    rating: 4.6,
    tags: ['粤菜', '清淡', '营养', '蒸煮'],
    cuisine: '粤菜',
    mealType: '晚餐',
    ingredients: [
      { name: '土鸡', quantity: '1', unit: '只' },
      { name: '生姜', quantity: '3', unit: '片' },
      { name: '大葱', quantity: '2', unit: '段' },
      { name: '料酒', quantity: '2', unit: '勺' },
      { name: '生抽', quantity: '3', unit: '勺' },
      { name: '香油', quantity: '1', unit: '勺' },
      { name: '蒜蓉', quantity: '2', unit: '勺' }
    ],
    steps: [
      '鸡洗净，锅中加水放入姜片葱段',
      '水开后放入整鸡，加料酒',
      '大火煮开转小火煮25分钟',
      '关火焖10分钟后捞出',
      '立即放入冰水中冷却',
      '晾凉后斩件装盘',
      '调制蘸料：生抽、香油、蒜蓉'
    ],
    nutrition: {
      calories: 220,
      protein: 28,
      carbs: 2,
      fat: 10,
      fiber: 0
    },
    tips: [
      '煮制时间要掌握好，避免过老',
      '冰水冷却可以让鸡皮更紧致',
      '蘸料可以根据个人喜好调整'
    ]
  },
  {
    id: '14',
    title: '紫菜蛋花汤',
    description: '清淡营养的汤品，制作简单，紫菜鲜美，蛋花嫩滑',
    image: '🍜',
    cookingTime: 10,
    servings: 2,
    difficulty: 'easy',
    rating: 4.3,
    tags: ['汤品', '清淡', '简单', '营养'],
    cuisine: '中式',
    mealType: '午餐',
    ingredients: [
      { name: '紫菜', quantity: '10', unit: 'g' },
      { name: '鸡蛋', quantity: '2', unit: '个' },
      { name: '香油', quantity: '几滴', unit: '' },
      { name: '盐', quantity: '适量', unit: '' },
      { name: '胡椒粉', quantity: '少许', unit: '' },
      { name: '葱花', quantity: '适量', unit: '' }
    ],
    steps: [
      '紫菜用水冲洗，鸡蛋打散',
      '锅中加水烧开',
      '放入紫菜煮2分钟',
      '缓慢倒入蛋液，用勺子搅拌',
      '加盐和胡椒粉调味',
      '最后淋香油撒葱花即可'
    ],
    nutrition: {
      calories: 95,
      protein: 8,
      carbs: 3,
      fat: 6,
      fiber: 1
    },
    tips: [
      '蛋液要缓慢倒入，形成蛋花',
      '紫菜不要煮太久，保持鲜味',
      '可以加点虾皮提鲜'
    ]
  },
  {
    id: '15',
    title: '可乐鸡翅',
    description: '创新家常菜，鸡翅嫩滑，酱汁甜香，制作简单，老少皆宜',
    image: '🥤',
    cookingTime: 30,
    servings: 3,
    difficulty: 'easy',
    rating: 4.8,
    tags: ['创新菜', '甜香', '简单', '受欢迎'],
    cuisine: '创新',
    mealType: '晚餐',
    ingredients: [
      { name: '鸡翅', quantity: '8', unit: '个' },
      { name: '可乐', quantity: '300', unit: 'ml' },
      { name: '生抽', quantity: '2', unit: '勺' },
      { name: '老抽', quantity: '1', unit: '勺' },
      { name: '料酒', quantity: '1', unit: '勺' },
      { name: '生姜', quantity: '3', unit: '片' },
      { name: '大葱', quantity: '2', unit: '段' }
    ],
    steps: [
      '鸡翅洗净，两面划几刀',
      '用料酒腌制15分钟去腥',
      '热锅下油，煎制鸡翅至两面金黄',
      '加入姜片葱段爆香',
      '倒入可乐没过鸡翅',
      '加入生抽和老抽调色',
      '大火烧开转小火炖20分钟',
      '最后大火收汁即可'
    ],
    nutrition: {
      calories: 280,
      protein: 22,
      carbs: 18,
      fat: 14,
      fiber: 0
    },
    tips: [
      '鸡翅要煎至金黄，口感更好',
      '可乐的甜味可以代替糖',
      '收汁时要注意火候，避免糊锅'
    ]
  },
  {
    id: '16',
    title: '小笼包',
    description: '经典上海小吃，皮薄馅大，汤汁丰富，制作精细，传统美味',
    image: '🥟',
    cookingTime: 180,
    servings: 4,
    difficulty: 'hard',
    rating: 4.9,
    tags: ['传统', '面食', '精致', '上海菜'],
    cuisine: '沪菜',
    mealType: '早餐',
    ingredients: [
      { name: '面粉', quantity: '300', unit: 'g' },
      { name: '猪肉馅', quantity: '250', unit: 'g' },
      { name: '猪皮冻', quantity: '100', unit: 'g' },
      { name: '生抽', quantity: '2', unit: '勺' },
      { name: '料酒', quantity: '1', unit: '勺' },
      { name: '糖', quantity: '1', unit: '勺' },
      { name: '盐', quantity: '适量', unit: '' },
      { name: '葱姜末', quantity: '适量', unit: '' }
    ],
    steps: [
      '面粉加水和成光滑面团，醒30分钟',
      '肉馅加调料搅拌上劲',
      '加入切碎的猪皮冻拌匀',
      '面团分剂子，擀成薄片',
      '包入馅料，收口捏紧',
      '蒸笼刷油，摆入包子',
      '大火蒸15分钟即可'
    ],
    nutrition: {
      calories: 320,
      protein: 18,
      carbs: 35,
      fat: 12,
      fiber: 2
    },
    tips: [
      '面皮要擀得薄而不破',
      '猪皮冻是汤汁的关键',
      '包制时要留出蒸发空间'
    ]
  },
];

export default function ExamplesPage() {
  const [selectedCuisine, setSelectedCuisine] = useState<string>('全部');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('全部');
  const [selectedMealType, setSelectedMealType] = useState<string>('全部');

  // 筛选选项
  const cuisineOptions = ['全部', '中式', '川菜', '粤菜', '沪菜', '创新'];
  const difficultyOptions = ['全部', 'easy', 'medium', 'hard'];
  const mealTypeOptions = ['全部', '早餐', '午餐', '晚餐', '甜品'];

  // 筛选菜谱
  const filteredRecipes = exampleRecipes.filter(recipe => {
    const cuisineMatch = selectedCuisine === '全部' || recipe.cuisine === selectedCuisine;
    const difficultyMatch = selectedDifficulty === '全部' || recipe.difficulty === selectedDifficulty;
    const mealTypeMatch = selectedMealType === '全部' || recipe.mealType === selectedMealType;
    return cuisineMatch && difficultyMatch && mealTypeMatch;
  });

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="size-5" />
            <ChefHat className="size-6 text-orange-500" />
            <span className="text-xl font-bold">RecipeGenius</span>
          </Link>
          <div className="text-sm text-gray-600">
            示例菜谱展示
          </div>
        </nav>
      </header>

      <div className="container mx-auto px-4 pb-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            精选示例菜谱
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            探索我们精心挑选的经典菜谱，从简单快手到传统经典，总有一款适合你
          </p>
        </div>

        {/* 筛选器 */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="size-5 text-orange-500" />
              <h3 className="text-lg font-semibold">筛选菜谱</h3>
              <Badge variant="outline" className="ml-auto">
                {filteredRecipes.length} 个菜谱
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 菜系筛选 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">菜系</label>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((cuisine) => (
                    <Button
                      key={cuisine}
                      variant={selectedCuisine === cuisine ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCuisine(cuisine)}
                      className="text-xs"
                    >
                      {cuisine}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 难度筛选 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">难度</label>
                <div className="flex flex-wrap gap-2">
                  {difficultyOptions.map((difficulty) => (
                    <Button
                      key={difficulty}
                      variant={selectedDifficulty === difficulty ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDifficulty(difficulty)}
                      className="text-xs"
                    >
                      {getDifficultyText(difficulty)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 餐次筛选 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">餐次</label>
                <div className="flex flex-wrap gap-2">
                  {mealTypeOptions.map((mealType) => (
                    <Button
                      key={mealType}
                      variant={selectedMealType === mealType ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMealType(mealType)}
                      className="text-xs"
                    >
                      {mealType}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 菜谱网格 */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/examples/${recipe.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-4xl">{recipe.image}</div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="size-4 fill-current" />
                    <span className="text-sm font-medium">{recipe.rating}</span>
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-orange-600 transition-colors">
                  {recipe.title}
                </CardTitle>
                <p className="text-gray-600 text-sm">{recipe.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* 基本信息 */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="size-4" />
                    <span>{recipe.cookingTime}分钟</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="size-4" />
                    <span>{recipe.servings}人份</span>
                  </div>
                  <Badge variant={recipe.difficulty === 'easy' ? 'default' : recipe.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                    {getDifficultyText(recipe.difficulty)}
                  </Badge>
                </div>

                {/* 标签 */}
                <div className="flex flex-wrap gap-1">
                  {recipe.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* 营养信息预览 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>热量: {recipe.nutrition.calories}卡</div>
                    <div>蛋白质: {recipe.nutrition.protein}g</div>
                    <div>碳水: {recipe.nutrition.carbs}g</div>
                    <div>脂肪: {recipe.nutrition.fat}g</div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">
                    查看详情
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => e.preventDefault()}>
                    <Heart className="size-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => e.preventDefault()}>
                    <Share2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            </Link>
            ))}
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-12">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium mb-2">没有找到匹配的菜谱</h3>
                <p className="text-sm">尝试调整筛选条件，或者</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSelectedCuisine('全部');
                    setSelectedDifficulty('全部');
                    setSelectedMealType('全部');
                  }}
                >
                  重置筛选条件
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 底部行动区域 */}
        <div className="text-center space-y-4">
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">想要更多个性化菜谱？</h3>
              <p className="opacity-90 mb-4">
                输入你的食材，让AI为你创造独一无二的美味菜谱
              </p>
              <Link href="/ingredients">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-4 font-semibold">
                  开始创作我的菜谱 <ChefHat className="ml-2 size-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <p className="text-sm text-gray-500">
            💡 这些示例菜谱展示了RecipeGenius的AI生成能力
          </p>
        </div>
      </div>
    </div>
  );
}
