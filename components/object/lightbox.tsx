'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type LightboxMedia = {
    id: string
    signed_url?: string
    name?: string
    description?: string
}

type LightboxProps = {
    media: LightboxMedia[]
    open: boolean
    onOpenChange: (open: boolean) => void
    startIndex?: number
}

// Simple lightbox dialog cycling through all media for the object.
export function Lightbox({ media, open, onOpenChange, startIndex = 0 }: LightboxProps) {
    const [index, setIndex] = useState(startIndex)
    const [prevOpen, setPrevOpen] = useState(open)

    // Reset to the requested image each time the lightbox opens.
    if (open !== prevOpen) {
        setPrevOpen(open)
        if (open) setIndex(Math.min(startIndex, Math.max(media.length - 1, 0)))
    }

    if (media.length === 0) return null
    const item = media[Math.min(index, media.length - 1)]

    function step(delta: number) {
        setIndex((i) => (i + delta + media.length) % media.length)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-4xl p-2"
                onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') step(-1)
                    if (e.key === 'ArrowRight') step(1)
                }}
            >
                <DialogTitle className="sr-only">{item.name || 'Image'}</DialogTitle>
                <DialogDescription className="sr-only">
                    Full-size image preview. Use the arrow keys to move between images.
                </DialogDescription>
                <div className="relative flex items-center justify-center bg-black/95 rounded-md min-h-[60vh]">
                    {item.signed_url ? (
                        <img
                            src={item.signed_url}
                            alt={item.name || 'Image'}
                            className="max-h-[75vh] max-w-full object-contain"
                        />
                    ) : (
                        <p className="text-white/60 text-sm">Image unavailable</p>
                    )}
                    {media.length > 1 && (
                        <>
                            <Button
                                variant="ghost" size="icon"
                                className="absolute left-2 text-white hover:bg-white/20 hover:text-white"
                                onClick={() => step(-1)}
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="ghost" size="icon"
                                className="absolute right-2 text-white hover:bg-white/20 hover:text-white"
                                onClick={() => step(1)}
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </>
                    )}
                </div>
                <div className="flex items-center justify-between px-2 pb-1 text-sm text-muted-foreground">
                    <span>{item.name || ''}</span>
                    <span>{index + 1} of {media.length}</span>
                </div>
            </DialogContent>
        </Dialog>
    )
}
