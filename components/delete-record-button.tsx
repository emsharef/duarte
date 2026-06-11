'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type DeleteRecordButtonProps = {
    action: () => Promise<void>
    redirectTo: string
    confirmMessage: string
}

export function DeleteRecordButton({ action, redirectTo, confirmMessage }: DeleteRecordButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        if (!confirm(confirmMessage)) return
        setLoading(true)
        try {
            await action()
            router.push(redirectTo)
            router.refresh()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Something went wrong')
            setLoading(false)
        }
    }

    return (
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {loading ? 'Deleting...' : 'Delete'}
        </Button>
    )
}
