import { cn } from '@/lib/utils';

export type StepStatus = 'complete' | 'current' | 'upcoming';

export interface StepItem {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
}

export interface StepperProps {
  steps: StepItem[];
  className?: string;
}

export function Stepper({ steps, className }: StepperProps) {
  return (
    <ol className={cn('flex w-full flex-col gap-4 md:flex-row md:items-start', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const statusColor =
          step.status === 'complete'
            ? 'border-brand-primary bg-brand-primary text-white'
            : step.status === 'current'
              ? 'border-brand-primary text-brand-primary'
              : 'border-border text-muted-foreground';

        return (
          <li key={step.id} className="relative flex-1">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  statusColor,
                  step.status === 'complete' && 'shadow-[0_10px_20px_-12px_rgba(255,107,61,0.6)]'
                )}
                aria-current={step.status === 'current' ? 'step' : undefined}
              >
                {index + 1}
              </div>

              <div className="space-y-1">
                <p
                  className={cn(
                    'text-base font-semibold text-foreground',
                    step.status === 'upcoming' && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
                {step.description ? (
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                ) : null}
              </div>
            </div>

            {!isLast && (
              <div className="mt-4 hidden h-px w-full translate-y-1 bg-border md:block" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

