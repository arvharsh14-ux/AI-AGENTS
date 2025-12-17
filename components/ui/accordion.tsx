import { cn } from '@/lib/utils';

interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  className?: string;
}

interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

export function Accordion({ children, className }: AccordionProps) {
  return (
    <div className={cn('w-full', className)}>
      {children}
    </div>
  );
}

export function AccordionItem({ children, className }: AccordionItemProps) {
  return (
    <div className={cn('border-b', className)}>
      {children}
    </div>
  );
}

export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  return (
    <button
      className={cn(
        'flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        className
      )}
    >
      {children}
    </button>
  );
}

export function AccordionContent({ children, className }: AccordionContentProps) {
  return (
    <div className={cn('overflow-hidden text-sm transition-all', className)}>
      <div className="pb-4 pt-0">{children}</div>
    </div>
  );
}
