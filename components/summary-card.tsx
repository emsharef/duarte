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
        active: 'border-l-green-500',
        expired: 'border-l-red-500',
        pending: 'border-l-yellow-500',
        default: 'border-l-gray-300'
    }

    const content = (
        <Card className={cn(
            "border-l-4 transition-shadow hover:shadow-md",
            statusColors[status],
            href && "cursor-pointer",
            className
        )}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg text-gray-600">
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
        <Card className="border-dashed bg-gray-50/50">
            <CardContent className="p-3">
                <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 text-gray-400">
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
