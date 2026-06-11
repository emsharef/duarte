import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

// Single shared empty-state pattern: quiet dashed panel, one muted line,
// optional icon and at most one action.
export function EmptyState({
    icon: Icon,
    text,
    action,
    className,
}: {
    icon?: LucideIcon
    text: string
    action?: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-3 border border-dashed border-border px-8 py-10 text-center', className)}>
            {Icon ? <Icon className="h-5 w-5 text-muted-foreground/50" strokeWidth={1.5} /> : null}
            <p className="text-[13px] text-muted-foreground">{text}</p>
            {action}
        </div>
    )
}
