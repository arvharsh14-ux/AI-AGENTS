import * as React from 'react';
import type { SlotProps } from '@radix-ui/react-slot';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  Partial<Pick<SlotProps, 'children'>> & {
    asChild?: boolean;
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  ghost: 'bg-transparent text-slate-900 hover:bg-slate-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'md', asChild, type, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        type={asChild ? undefined : type ?? 'button'}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
