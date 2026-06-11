'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { updateWorkspaceSettings } from './actions'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CNY', 'HKD', 'KRW', 'CAD', 'AUD']

export function WorkspaceSettings({
    accessionPrefix,
    defaultCurrency,
}: {
    accessionPrefix: string | null
    defaultCurrency: string
}) {
    const [isPending, startTransition] = useTransition()
    const [prefix, setPrefix] = useState(accessionPrefix ?? '')
    const [currency, setCurrency] = useState(defaultCurrency || 'USD')
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function handleSave() {
        setError(null)
        setSaved(false)
        startTransition(async () => {
            try {
                await updateWorkspaceSettings({
                    accession_prefix: prefix.trim() || null,
                    default_currency: currency,
                })
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Something went wrong')
            }
        })
    }

    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold">Workspace</h2>
            {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            <div className="space-y-4 rounded-md border p-4">
                <div className="grid gap-2">
                    <Label htmlFor="accession_prefix">Accession Prefix</Label>
                    <Input
                        id="accession_prefix"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder="e.g., COLL"
                        className="max-w-xs"
                    />
                    <p className="text-xs text-gray-500">
                        When set, new objects without an inventory number are auto-numbered
                        (e.g., {prefix.trim() || 'COLL'}-{new Date().getFullYear()}-001). Leave blank to disable.
                    </p>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="default_currency">Default Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="default_currency" className="max-w-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CURRENCIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save'}
                    </Button>
                    {saved && <span className="text-sm text-green-600">Saved</span>}
                </div>
            </div>
        </section>
    )
}
