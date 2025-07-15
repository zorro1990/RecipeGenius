'use client';

import { HealthInfo } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Shield, Lightbulb, Target, AlertTriangle } from 'lucide-react';

interface HealthInfoProps {
  healthInfo: HealthInfo;
}

export function HealthInfoComponent({ healthInfo }: HealthInfoProps) {
  const {
    filteredIngredients,
    filterReasons,
    healthBenefits,
    nutritionHighlights,
    healthTips
  } = healthInfo;

  return (
    <div className="space-y-4">
      {/* 健康关怀标题 */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Heart className="size-5 text-red-500" />
            💙 为您的健康精心定制
          </CardTitle>
          <CardDescription className="text-blue-600">
            我们根据您的健康状况，为您量身打造了这道营养菜谱
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 过滤说明 */}
      {filteredIngredients.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Shield className="size-5" />
              🛡️ 健康保护
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-orange-700 mb-2">
                为了您的健康，我们贴心地过滤了以下食材：
              </p>
              <div className="flex flex-wrap gap-2">
                {filteredIngredients.map((ingredient, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>
            {filterReasons.length > 0 && (
              <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-2">过滤原因：</p>
                <ul className="text-sm text-orange-700 space-y-1">
                  {filterReasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="size-4 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 健康益处 */}
      {healthBenefits.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Heart className="size-5" />
              💚 健康益处
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 mb-3">
              这道菜谱对您的健康特别有益：
            </p>
            <ul className="space-y-2">
              {healthBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                  <span className="text-green-500 mt-1">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 营养重点 */}
      {nutritionHighlights.length > 0 && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Target className="size-5" />
              🎯 营养重点
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-700 mb-3">
              根据您的健康状况，特别关注以下营养要素：
            </p>
            <div className="flex flex-wrap gap-2">
              {nutritionHighlights.map((highlight, index) => (
                <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                  {highlight}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 健康建议 */}
      {healthTips.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Lightbulb className="size-5" />
              💡 健康建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-3">
              为了更好地管理您的健康状况，建议您：
            </p>
            <ul className="space-y-2">
              {healthTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-700">
                  <Lightbulb className="size-4 mt-0.5 flex-shrink-0 text-blue-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 温馨提醒 */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Heart className="size-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800 mb-1">
                💛 温馨提醒
              </p>
              <p className="text-xs text-yellow-700">
                以上建议仅供参考，具体的饮食调整请咨询您的主治医生。
                坚持健康饮食，配合适量运动，定期体检，是管理健康的最佳方式。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
