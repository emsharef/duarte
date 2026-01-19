'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Expense = {
    id: string
    object_id?: string
    expense_type?: string
    expense_date?: string
    vendor_contact_id?: string
    amount?: number
    currency?: string
    description?: string
    invoice_number?: string
    created_at?: string
    // Joined data
    vendor_contact?: { display_name: string }
    object?: { title: string; inventory_number?: string }
}

export async function getExpenses() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('expenses')
        .select(`
            *,
            vendor_contact:contacts!vendor_contact_id(display_name),
            object:objects!object_id(title, inventory_number)
        `)
        .order('expense_date', { ascending: false })
    return data || []
}

export async function getExpensesByObject(objectId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('expenses')
        .select(`
            *,
            vendor_contact:contacts!vendor_contact_id(display_name)
        `)
        .eq('object_id', objectId)
        .order('expense_date', { ascending: false })
    return data || []
}

export async function getExpense(id: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('expenses')
        .select(`
            *,
            vendor_contact:contacts!vendor_contact_id(display_name),
            object:objects!object_id(title, inventory_number)
        `)
        .eq('id', id)
        .single()
    return data
}

export async function createExpense(data: Partial<Expense>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
            user_id: user.id,
            ...data
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/expenses')
    if (data.object_id) {
        revalidatePath('/dashboard')
    }
    return expense
}

export async function updateExpense(id: string, data: Partial<Expense>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: expense, error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/expenses')
    return expense
}

export async function deleteExpense(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/expenses')
}

export async function getExpenseTotalByObject(objectId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('expenses')
        .select('amount, currency')
        .eq('object_id', objectId)

    if (!data) return { total: 0, currency: 'USD' }

    // Group by currency and sum
    const totals = data.reduce((acc, expense) => {
        const curr = expense.currency || 'USD'
        acc[curr] = (acc[curr] || 0) + (expense.amount || 0)
        return acc
    }, {} as Record<string, number>)

    // Return the main currency total (assuming single currency for simplicity)
    const mainCurrency = Object.keys(totals)[0] || 'USD'
    return { total: totals[mainCurrency] || 0, currency: mainCurrency }
}
