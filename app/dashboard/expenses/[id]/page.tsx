import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getExpense, deleteExpense } from '@/app/actions/expenses'
import { getDocumentsForEntity } from '@/app/actions/documents'
import {
    RecordToolbar, RecordField, RecordSection, RecordEmpty,
    formatRecordDate, formatRecordCurrency,
} from '@/components/record-view'
import { DeleteRecordButton } from '@/components/delete-record-button'
import { FileText } from 'lucide-react'

export default async function ExpensePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const expense = await getExpense(id)

    if (!expense) {
        notFound()
    }

    const documents = await getDocumentsForEntity('expense', id)

    const vendor = expense.vendor_contact as { id?: string; display_name?: string } | null
    const object = expense.object as { id?: string; title?: string; inventory_number?: string | null } | null
    const currency = expense.currency || 'USD'
    const title = expense.description || expense.expense_type || 'Untitled Expense'

    return (
        <div className="space-y-8">
            <RecordToolbar
                backHref="/dashboard/expenses"
                backLabel="Back to Expenses"
                editHref={`/dashboard/expenses/${id}/edit`}
            >
                <DeleteRecordButton
                    action={deleteExpense.bind(null, id)}
                    redirectTo="/dashboard/expenses"
                    confirmMessage="Are you sure you want to delete this expense?"
                />
            </RecordToolbar>

            <div className="border-y py-8 space-y-6">
                <div>
                    <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight">
                        {title}
                    </h1>
                    {expense.expense_type && expense.description && (
                        <p className="mt-1 text-muted-foreground">{expense.expense_type}</p>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                    <RecordField label="Type">{expense.expense_type}</RecordField>
                    <RecordField label="Amount">
                        {formatRecordCurrency(expense.amount, currency)}
                    </RecordField>
                    <RecordField label="Date">{formatRecordDate(expense.expense_date)}</RecordField>
                    <RecordField label="Vendor">
                        {vendor ? (
                            vendor.id ? (
                                <Link href={`/dashboard/contacts/${vendor.id}`} className="hover:underline">
                                    {vendor.display_name || 'Contact'}
                                </Link>
                            ) : (
                                vendor.display_name
                            )
                        ) : null}
                    </RecordField>
                    <RecordField label="Invoice number">{expense.invoice_number}</RecordField>
                    <RecordField label="Object">
                        {object && object.id ? (
                            <Link href={`/dashboard/objects/${object.id}`} className="hover:underline">
                                {object.title || 'Object'}
                            </Link>
                        ) : null}
                    </RecordField>
                </div>
                {expense.description && (
                    <p className="border-l-2 border-primary/30 pl-4 text-sm leading-relaxed text-foreground/85">
                        {expense.description}
                    </p>
                )}
            </div>

            <RecordSection title="Linked object" count={object ? 1 : 0}>
                {!object ? (
                    <RecordEmpty text="No object linked to this expense." />
                ) : (
                    <ul className="border-y divide-y">
                        <li className="flex items-center justify-between gap-4 py-3">
                            <div className="min-w-0">
                                {object.id ? (
                                    <Link href={`/dashboard/objects/${object.id}`} className="text-sm font-medium hover:underline">
                                        {object.title}
                                    </Link>
                                ) : (
                                    <span className="text-sm font-medium">{object.title}</span>
                                )}
                                {object.inventory_number && (
                                    <p className="text-xs text-muted-foreground">{object.inventory_number}</p>
                                )}
                            </div>
                        </li>
                    </ul>
                )}
            </RecordSection>

            <RecordSection title="Documents" count={documents.length}>
                {documents.length === 0 ? (
                    <RecordEmpty text="No documents linked to this expense." />
                ) : (
                    <ul className="border-y divide-y">
                        {documents.map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between gap-4 py-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <Link href={`/dashboard/documents/${doc.id}`} className="truncate text-sm font-medium hover:underline">
                                        {doc.document_name}
                                    </Link>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {[doc.document_type, formatRecordDate(doc.document_date)].filter(Boolean).join(' · ')}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </RecordSection>
        </div>
    )
}
