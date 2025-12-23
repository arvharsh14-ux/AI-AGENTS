import * as React from 'react';

import { cn } from '@/lib/utils';

type AlertVariant = 'default' | 'destructive' | 'success';

const alertVariants: Record<AlertVariant, string> = {
  default: 'border-slate-200 bg-white text-slate-900',
  destructive: 'border-red-200 bg-red-50 text-red-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
};

export function Alert({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      role="alert"
      className={cn('rounded-lg border p-4 text-sm', alertVariants[variant], className)}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn('text-sm text-inherit/80', className)} {...props} />;
}
