'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
    icon: ReactNode
    title: string
    subtitle?: string
    details?: Array<{ label: string; value: string }>
    href?: string
    status?: 'active' | 'expired' | 'pending' | 'default'
    className?: string
}

export function SummaryCard({
    icon,
    title,
    subtitle,
    details,
    href,
    status = 'default',
    className
}: SummaryCardProps) {
    const statusColors = {
        active: 'border-l-emerald-700/60',
        expired: 'border-l-red-700/60',
        pending: 'border-l-amber-600/60',
        default: 'border-l-border'
    }

    const content = (
        <Card className={cn(
            "border-l-2 shadow-none transition-colors hover:bg-accent/40",
            statusColors[status],
            href && "cursor-pointer",
            className
        )}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-md bg-muted p-2 text-muted-foreground">
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{title}</h4>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                        )}
                        {details && details.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {details.map((detail, idx) => (
                                    <div key={idx} className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">{detail.label}</span>
                                        <span className="font-medium">{detail.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    if (href) {
        return <Link href={href}>{content}</Link>
    }

    return content
}

interface EmptySummaryCardProps {
    icon: ReactNode
    title: string
    actionHref?: string
    onAction?: () => void
}

export function EmptySummaryCard({
    icon,
    title,
    actionHref,
    onAction
}: EmptySummaryCardProps) {
    const content = (
        <Card className="border-dashed bg-transparent shadow-none">
            <CardContent className="p-3">
                <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 text-muted-foreground/60">
                        {icon}
                    </div>
                    <span className="text-sm text-muted-foreground">{title}</span>
                </div>
            </CardContent>
        </Card>
    )

    if (actionHref) {
        return <Link href={actionHref} className="block hover:opacity-80 transition-opacity">{content}</Link>
    }

    if (onAction) {
        return <button onClick={onAction} className="w-full text-left hover:opacity-80 transition-opacity">{content}</button>
    }

    return content
}
