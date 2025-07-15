'use client';

import { useState } from 'react';
import { Recipe } from '@/lib/types';
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
    if (currentStep < recipe.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completedCount = completedSteps.size;
  const totalSteps = recipe.steps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

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
          <p className="text-gray-800 leading-relaxed text-lg">
            {recipe.steps[currentStep]}
          </p>
          
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
              disabled={currentStep === recipe.steps.length - 1}
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
            {recipe.steps.map((step, index) => (
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
                  <p className={`leading-relaxed ${
                    completedSteps.has(index) 
                      ? 'text-gray-600 line-through' 
                      : index === currentStep
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-800'
                  }`}>
                    {step}
                  </p>
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
