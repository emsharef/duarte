'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Pencil, Plus, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ObjectWithRelations, updateObjectInsurance } from '@/app/dashboard/objects/actions'
import {
    createInsurancePolicy, getInsurancePolicies, linkObjectToPolicy, unlinkObjectFromPolicy,
} from '@/app/actions/insurance'
import { LinkDialog } from './link-dialog'
import { EmptyState, SectionHeader, contactName, formatCurrency, formatDate, toastError } from './shared'

type Row = NonNullable<ObjectWithRelations['insurance']>[number]

export function InsuranceTab({ object, canEdit }: { object: ObjectWithRelations; canEdit: boolean }) {
    const router = useRouter()
    const rows = object.insurance || []
    const [addOpen, setAddOpen] = useState(false)
    const [editRow, setEditRow] = useState<Row | null>(null)
    const [subject, setSubject] = useState('')
    const [policyNumber, setPolicyNumber] = useState('')
    const [insuredValue, setInsuredValue] = useState('')
    const [saving, setSaving] = useState(false)

    function openAdd() {
        setSubject('')
        setPolicyNumber('')
        setInsuredValue('')
        setAddOpen(true)
    }

    async function handleAdd(mode: 'existing' | 'new', selectedId: string | null) {
        let policyId = selectedId
        if (mode === 'new') {
            const policy = await createInsurancePolicy({
                policy_subject: subject || undefined,
                policy_number: policyNumber || undefined,
                is_active: true,
            })
            policyId = policy.id
        }
        if (!policyId) throw new Error('No policy selected')
        await linkObjectToPolicy(object.id, policyId, insuredValue ? Number(insuredValue) : undefined)
        router.refresh()
    }

    async function handleEdit() {
        if (!editRow?.policy?.id) return
        setSaving(true)
        try {
            await updateObjectInsurance(object.id, editRow.policy.id, insuredValue ? Number(insuredValue) : undefined)
            setEditRow(null)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to update insured value')
        } finally {
            setSaving(false)
        }
    }

    async function handleUnlink(row: Row) {
        if (!row.policy?.id || !confirm('Unlink this policy from the object?')) return
        try {
            await unlinkObjectFromPolicy(object.id, row.policy.id)
            router.refresh()
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'Failed to unlink policy')
        }
    }

    return (
        <div>
            <SectionHeader
                title="Insurance"
                action={canEdit && (
                    <Button variant="outline" size="sm" onClick={openAdd}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                )}
            />
            {rows.length === 0 ? <EmptyState text="No insurance policies linked." /> : (
                <div className="space-y-2">
                    {rows.map((row, i) => (
                        <div key={row.policy?.id ?? i} className="flex items-start justify-between p-4 border rounded-lg">
                            <div className="text-sm space-y-0.5">
                                <p className="font-medium">
                                    {row.policy?.policy_subject || contactName(row.policy?.insurer)}
                                </p>
                                <p className="text-muted-foreground">
                                    {row.policy?.policy_number && `Policy #${row.policy.policy_number} · `}
                                    {row.policy?.coverage_type && `${row.policy.coverage_type} · `}
                                    {formatDate(row.policy?.start_date)} – {formatDate(row.policy?.end_date)}
                                </p>
                                <p className="text-muted-foreground">
                                    Insured value: {formatCurrency(row.insured_value)}
                                </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                {canEdit && (
                                    <>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit insured value"
                                            onClick={() => {
                                                setEditRow(row)
                                                setInsuredValue(row.insured_value?.toString() || '')
                                            }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="Unlink"
                                            onClick={() => handleUnlink(row)}>
                                            <Unlink className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                                <Link href="/dashboard/insurance">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Open insurance">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <LinkDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                title="Add insurance"
                noun="policy"
                loadOptions={async () => (await getInsurancePolicies()).map((p) => ({
                    id: p.id,
                    label: p.policy_subject || p.policy_number || 'Untitled policy',
                }))}
                createFields={(
                    <div className="space-y-3">
                        <div className="grid gap-2">
                            <Label>Policy subject</Label>
                            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Fine art policy 2026" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Policy number</Label>
                            <Input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
                        </div>
                    </div>
                )}
                valueFields={(
                    <div className="grid gap-2">
                        <Label>Insured value</Label>
                        <Input type="number" value={insuredValue} onChange={(e) => setInsuredValue(e.target.value)} placeholder="0.00" />
                    </div>
                )}
                onSubmit={handleAdd}
            />

            <Dialog open={!!editRow} onOpenChange={(open) => { if (!open) setEditRow(null) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit insured value</DialogTitle>
                        <DialogDescription>
                            Update the insured value for this object on the policy.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label>Insured value</Label>
                        <Input type="number" value={insuredValue} onChange={(e) => setInsuredValue(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
