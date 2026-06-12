import { cn } from '@/lib/utils'

// Fraunces renders U+016B (ū) with a misplaced macron, so we draw the
// macron ourselves — positioned over the u at every size.
export function Wordmark({ className }: { className?: string }) {
    return (
        <span className={cn('font-serif font-semibold', className)} aria-label="DūArte">
            <span aria-hidden="true">
                D
                <span className="relative">
                    u
                    <span className="absolute left-1/2 top-[0.12em] h-[0.055em] w-[0.46em] -translate-x-1/2 rounded-full bg-current" />
                </span>
                Arte
            </span>
        </span>
    )
}
