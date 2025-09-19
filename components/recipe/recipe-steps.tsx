'use client';

import { useState } from 'react';
import { Recipe, RecipeStep } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Lightbulb, Timer, AlertCircle } from 'lucide-react';

interface RecipeStepsProps {
  recipe: Recipe;
}

export function RecipeSteps({ recipe }: RecipeStepsProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);

  const steps = recipe.steps || [];
  const totalSteps = steps.length;

  const getSkillBadge = (skillLevel: RecipeStep['skillLevel']) => {
    switch (skillLevel) {
      case 'basic':
        return {
          label: '基础技巧',
          className: 'bg-green-100 text-green-700'
        };
      case 'intermediate':
        return {
          label: '进阶技巧',
          className: 'bg-yellow-100 text-yellow-700'
        };
      case 'advanced':
        return {
          label: '高级技巧',
          className: 'bg-red-100 text-red-700'
        };
      default:
        return {
          label: '通用技巧',
          className: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const toggleStepCompletion = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex);
    } else {
      newCompleted.add(stepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completedCount = completedSteps.size;
  const progressPercentage = (completedCount / totalSteps) * 100;

  const activeStep = steps[currentStep];
  if (!activeStep) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 制作步骤标题和进度 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">制作步骤</CardTitle>
            <Badge variant="outline" className="text-sm">
              {completedCount}/{totalSteps} 已完成
            </Badge>
          </div>
          
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* 当前步骤高亮显示 */}
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full text-sm font-bold">
              {currentStep + 1}
            </div>
            <span className="text-lg font-semibold">当前步骤</span>
          </div>
          <Timer className="size-5 text-orange-500" />
        </div>
      </CardHeader>
      <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{activeStep.title}</h3>
            <Badge className={getSkillBadge(activeStep.skillLevel).className}>
              {getSkillBadge(activeStep.skillLevel).label}
            </Badge>
            {typeof activeStep.duration === 'number' && (
              <Badge variant="outline" className="text-xs">
                预计 {activeStep.duration} 分钟
              </Badge>
            )}
          </div>
          <p className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap">
            {activeStep.description}
          </p>

          {activeStep.tips && activeStep.tips.length > 0 && (
            <div className="mt-4 space-y-2">
              {activeStep.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-orange-700">
                  <Lightbulb className="size-4 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 0}
              size="sm"
            >
              上一步
            </Button>
            <Button 
              onClick={() => toggleStepCompletion(currentStep)}
              variant={completedSteps.has(currentStep) ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2"
            >
              {completedSteps.has(currentStep) ? (
                <>
                  <CheckCircle2 className="size-4" />
                  已完成
                </>
              ) : (
                <>
                  <Circle className="size-4" />
                  标记完成
                </>
              )}
            </Button>
            <Button 
              onClick={nextStep}
              disabled={currentStep === totalSteps - 1}
              size="sm"
            >
              下一步
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 所有步骤列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">完整步骤</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`flex gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                  index === currentStep 
                    ? 'border-orange-300 bg-orange-50' 
                    : completedSteps.has(index)
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => goToStep(index)}
              >
                <div className="flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStepCompletion(index);
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors"
                  >
                    {completedSteps.has(index) ? (
                      <CheckCircle2 className="size-5 text-green-600" />
                    ) : (
                      <span className={`text-sm font-bold ${
                        index === currentStep ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    )}
                  </button>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${
                      index === currentStep ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {step.title}
                    </span>
                    <Badge className={`${getSkillBadge(step.skillLevel).className} text-[11px]`}> 
                      {getSkillBadge(step.skillLevel).label}
                    </Badge>
                    {typeof step.duration === 'number' && (
                      <Badge variant="outline" className="text-[11px]">
                        {step.duration} 分钟
                      </Badge>
                    )}
                  </div>
                  <p className={`leading-relaxed text-sm ${
                    completedSteps.has(index) 
                      ? 'text-gray-600 line-through' 
                      : index === currentStep
                      ? 'text-gray-900'
                      : 'text-gray-800'
                  }`}>
                    {step.description}
                  </p>
                  {step.tips && step.tips.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-orange-700">
                      {step.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex gap-1">
                          <Lightbulb className="size-3 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 烹饪小贴士 */}
      {recipe.tips && recipe.tips.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <Lightbulb className="size-5" />
              烹饪小贴士
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recipe.tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertCircle className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-800 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 完成庆祝 */}
      {completedCount === totalSteps && (
        <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-xl font-bold mb-2">恭喜完成！</h3>
            <p className="opacity-90">
              你已经完成了所有制作步骤，享受你的美味佳肴吧！
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
