'use server'

import { getWorkspaceContext, requireEdit } from '@/lib/workspace'
import { revalidatePath } from 'next/cache'

export type Loan = {
    id: string
    loan_subject?: string | null
    direction?: string | null
    borrower_contact_id?: string | null
    lender_contact_id?: string | null
    exhibition_name?: string | null
    venue?: string | null
    start_date?: string | null
    end_date?: string | null
    actual_return_date?: string | null
    insurance_value?: number | null
    insurance_policy_id?: string | null
    status?: string | null
    currency?: string | null
    notes?: string | null
    created_at?: string
    updated_at?: string
    // Joined data
    borrower?: { id: string; display_name: string; company_name: string }
    lender?: { id: string; display_name: string; company_name: string }
    insurance_policy?: { id: string; policy_subject: string }
    object_count?: number
}

export async function getLoans() {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data } = await supabase
        .from('loans')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
    return data || []
}

export async function getLoansWithDetails() {
    const { supabase, workspaceId } = await getWorkspaceContext()
    const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

    if (!loans) return []

    // Get contacts for borrowers and lenders
    const contactIds = loans
        .flatMap(l => [l.borrower_contact_id, l.lender_contact_id])
        .filter((id): id is string => Boolean(id))

    const { data: contacts } = await supabase
        .from('contacts')
        .select('id, display_name, company_name, first_name, last_name')
        .eq('workspace_id', workspaceId)
        .in('id', contactIds.length > 0 ? contactIds : ['00000000-0000-0000-0000-000000000000'])

    const contactMap = (contacts || []).reduce((acc, c) => {
        acc[c.id] = {
            id: c.id,
            display_name: c.display_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.company_name || 'Unknown',
            company_name: c.company_name ?? ''
        }
        return acc
    }, {} as Record<string, { id: string; display_name: string; company_name: string }>)

    // Get insurance policies
    const policyIds = loans.map(l => l.insurance_policy_id).filter((id): id is string => Boolean(id))
    const { data: policies } = await supabase
        .from('insurance_policies')
        .select('id, policy_subject')
        .eq('workspace_id', workspaceId)
        .in('id', policyIds.length > 0 ? policyIds : ['00000000-0000-0000-0000-000000000000'])

    const policyMap = (policies || []).reduce((acc, p) => {
        acc[p.id] = { id: p.id, policy_subject: p.policy_subject ?? '' }
        return acc
    }, {} as Record<string, { id: string; policy_subject: string }>)

    // Get object counts for each loan
    const { data: objectLoans } = await supabase
        .from('object_loans')
        .select('loan_id')
        .eq('workspace_id', workspaceId)

    const objectCountMap = (objectLoans || []).reduce((acc, ol) => {
        acc[ol.loan_id] = (acc[ol.loan_id] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return loans.map(loan => ({
        ...loan,
        borrower: loan.borrower_contact_id ? contactMap[loan.borrower_contact_id] : undefined,
        lender: loan.lender_contact_id ? contactMap[loan.lender_contact_id] : undefined,
        insurance_policy: loan.insurance_policy_id ? policyMap[loan.insurance_policy_id] : undefined,
        object_count: objectCountMap[loan.id] || 0,
    }))
}

export async function getLoan(id: string) {
    const { supabase } = await getWorkspaceContext()
    const { data } = await supabase
        .from('loans')
        .select('*')
        .eq('id', id)
        .single()
    return data
}

export async function getLoanWithRelations(id: string) {
    const { supabase } = await getWorkspaceContext()
    const { data } = await supabase
        .from('loans')
        .select(`
            *,
            borrower:contacts!borrower_contact_id(id, display_name, company_name),
            lender:contacts!lender_contact_id(id, display_name, company_name),
            insurance_policy:insurance_policies!insurance_policy_id(id, policy_subject, policy_number)
        `)
        .eq('id', id)
        .single()
    return data
}

export async function getLoanObjects(loanId: string) {
    const { supabase } = await getWorkspaceContext()
    const { data } = await supabase
        .from('object_loans')
        .select(`
            loan_value,
            object:objects(
                id,
                title,
                inventory_number,
                artist:artists(first_name, last_name)
            )
        `)
        .eq('loan_id', loanId)
    return data || []
}

export async function createLoan(data: Partial<Loan>) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const { data: loan, error } = await supabase
        .from('loans')
        .insert({
            workspace_id: workspaceId,
            loan_subject: data.loan_subject || null,
            direction: data.direction || null,
            borrower_contact_id: data.borrower_contact_id || null,
            lender_contact_id: data.lender_contact_id || null,
            exhibition_name: data.exhibition_name || null,
            venue: data.venue || null,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            actual_return_date: data.actual_return_date || null,
            insurance_value: data.insurance_value || null,
            insurance_policy_id: data.insurance_policy_id || null,
            status: data.status || 'Pending',
            currency: data.currency || 'USD',
            notes: data.notes || null,
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/loans')
    return loan
}

export async function updateLoan(id: string, data: Partial<Loan>) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    const { data: loan, error } = await supabase
        .from('loans')
        .update({
            loan_subject: data.loan_subject || null,
            direction: data.direction || null,
            borrower_contact_id: data.borrower_contact_id || null,
            lender_contact_id: data.lender_contact_id || null,
            exhibition_name: data.exhibition_name || null,
            venue: data.venue || null,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            actual_return_date: data.actual_return_date || null,
            insurance_value: data.insurance_value || null,
            insurance_policy_id: data.insurance_policy_id || null,
            status: data.status || 'Pending',
            currency: data.currency || 'USD',
            notes: data.notes || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/loans')
    return loan
}

export async function deleteLoan(id: string) {
    const ctx = await getWorkspaceContext()
    requireEdit(ctx)
    const { supabase, workspaceId } = ctx

    // First delete associated object_loans
    await supabase
        .from('object_loans')
        .delete()
        .eq('loan_id', id)

    const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/loans')
}
