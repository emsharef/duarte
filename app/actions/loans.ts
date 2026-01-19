'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Loan = {
    id: string
    loan_subject?: string
    loan_direction?: string
    borrower_contact_id?: string
    lender_contact_id?: string
    exhibition_name?: string
    venue?: string
    loan_start_date?: string
    loan_end_date?: string
    actual_return_date?: string
    insurance_value?: number
    insurance_policy_id?: string
    loan_status?: string
    currency?: string
    notes?: string
    created_at?: string
    updated_at?: string
    // Joined data
    borrower?: { id: string; display_name: string; company_name: string }
    lender?: { id: string; display_name: string; company_name: string }
    insurance_policy?: { id: string; policy_subject: string }
    object_count?: number
}

export async function getLoans() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false })
    return data || []
}

export async function getLoansWithDetails() {
    const supabase = await createClient()
    const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false })

    if (!loans) return []

    // Get contacts for borrowers and lenders
    const contactIds = loans
        .flatMap(l => [l.borrower_contact_id, l.lender_contact_id])
        .filter(Boolean)

    const { data: contacts } = await supabase
        .from('contacts')
        .select('id, display_name, company_name, first_name, last_name')
        .in('id', contactIds.length > 0 ? contactIds : ['00000000-0000-0000-0000-000000000000'])

    const contactMap = (contacts || []).reduce((acc, c) => {
        acc[c.id] = {
            id: c.id,
            display_name: c.display_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.company_name || 'Unknown',
            company_name: c.company_name
        }
        return acc
    }, {} as Record<string, { id: string; display_name: string; company_name: string }>)

    // Get insurance policies
    const policyIds = loans.map(l => l.insurance_policy_id).filter(Boolean)
    const { data: policies } = await supabase
        .from('insurance_policies')
        .select('id, policy_subject')
        .in('id', policyIds.length > 0 ? policyIds : ['00000000-0000-0000-0000-000000000000'])

    const policyMap = (policies || []).reduce((acc, p) => {
        acc[p.id] = { id: p.id, policy_subject: p.policy_subject }
        return acc
    }, {} as Record<string, { id: string; policy_subject: string }>)

    // Get object counts for each loan
    const { data: objectLoans } = await supabase
        .from('object_loans')
        .select('loan_id')

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
    const supabase = await createClient()
    const { data } = await supabase
        .from('loans')
        .select('*')
        .eq('id', id)
        .single()
    return data
}

export async function createLoan(data: Partial<Loan>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: loan, error } = await supabase
        .from('loans')
        .insert({
            user_id: user.id,
            loan_subject: data.loan_subject || null,
            loan_direction: data.loan_direction || null,
            borrower_contact_id: data.borrower_contact_id || null,
            lender_contact_id: data.lender_contact_id || null,
            exhibition_name: data.exhibition_name || null,
            venue: data.venue || null,
            loan_start_date: data.loan_start_date || null,
            loan_end_date: data.loan_end_date || null,
            actual_return_date: data.actual_return_date || null,
            insurance_value: data.insurance_value || null,
            insurance_policy_id: data.insurance_policy_id || null,
            loan_status: data.loan_status || 'Pending',
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: loan, error } = await supabase
        .from('loans')
        .update({
            loan_subject: data.loan_subject || null,
            loan_direction: data.loan_direction || null,
            borrower_contact_id: data.borrower_contact_id || null,
            lender_contact_id: data.lender_contact_id || null,
            exhibition_name: data.exhibition_name || null,
            venue: data.venue || null,
            loan_start_date: data.loan_start_date || null,
            loan_end_date: data.loan_end_date || null,
            actual_return_date: data.actual_return_date || null,
            insurance_value: data.insurance_value || null,
            insurance_policy_id: data.insurance_policy_id || null,
            loan_status: data.loan_status || 'Pending',
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

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
