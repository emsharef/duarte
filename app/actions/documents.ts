'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { r2 } from '@/lib/r2'
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export type Document = {
    id: string
    document_type?: string
    document_name: string
    description?: string
    r2_key: string
    file_size?: number
    mime_type?: string
    original_filename?: string
    document_date?: string
    created_at?: string
    updated_at?: string
    // Generated
    signed_url?: string
    // Linked entities
    linked_entities?: Array<{ entity_type: string; entity_id: string }>
}

export type EntityDocument = {
    id: string
    document_id: string
    entity_type: string
    entity_id: string
    created_at?: string
}

export async function getDocuments() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
    return data || []
}

export async function getDocumentsWithUrls() {
    const supabase = await createClient()
    const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

    if (!documents) return []

    // Get linked entities for each document
    const documentIds = documents.map(d => d.id)
    const { data: entityLinks } = await supabase
        .from('entity_documents')
        .select('*')
        .in('document_id', documentIds.length > 0 ? documentIds : ['00000000-0000-0000-0000-000000000000'])

    const entityMap = (entityLinks || []).reduce((acc, link) => {
        if (!acc[link.document_id]) {
            acc[link.document_id] = []
        }
        acc[link.document_id].push({ entity_type: link.entity_type, entity_id: link.entity_id })
        return acc
    }, {} as Record<string, Array<{ entity_type: string; entity_id: string }>>)

    // Generate signed URLs
    const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => {
            let signed_url = null
            if (doc.r2_key) {
                try {
                    const command = new GetObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: doc.r2_key,
                    })
                    signed_url = await getSignedUrl(r2, command, { expiresIn: 3600 })
                } catch (err) {
                    console.error(`Error generating signed URL for ${doc.r2_key}:`, err)
                }
            }
            return {
                ...doc,
                signed_url,
                linked_entities: entityMap[doc.id] || [],
            }
        })
    )

    return documentsWithUrls
}

export async function getDocument(id: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()

    if (!data) return null

    // Generate signed URL
    let signed_url = null
    if (data.r2_key) {
        try {
            const command = new GetObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: data.r2_key,
            })
            signed_url = await getSignedUrl(r2, command, { expiresIn: 3600 })
        } catch (err) {
            console.error(`Error generating signed URL for ${data.r2_key}:`, err)
        }
    }

    // Get linked entities
    const { data: entityLinks } = await supabase
        .from('entity_documents')
        .select('*')
        .eq('document_id', id)

    return {
        ...data,
        signed_url,
        linked_entities: entityLinks || [],
    }
}

export async function getDocumentsForEntity(entityType: string, entityId: string) {
    const supabase = await createClient()

    // Get document IDs linked to this entity
    const { data: links } = await supabase
        .from('entity_documents')
        .select('document_id')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

    if (!links || links.length === 0) return []

    const documentIds = links.map(l => l.document_id)

    const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .in('id', documentIds)
        .order('created_at', { ascending: false })

    if (!documents) return []

    // Generate signed URLs
    const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => {
            let signed_url = null
            if (doc.r2_key) {
                try {
                    const command = new GetObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: doc.r2_key,
                    })
                    signed_url = await getSignedUrl(r2, command, { expiresIn: 3600 })
                } catch (err) {
                    console.error(`Error generating signed URL for ${doc.r2_key}:`, err)
                }
            }
            return { ...doc, signed_url }
        })
    )

    return documentsWithUrls
}

export async function uploadDocument(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')

    const documentType = formData.get('document_type') as string
    const documentName = formData.get('document_name') as string
    const description = formData.get('description') as string
    const documentDate = formData.get('document_date') as string

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer())
    const key = `${user.id}/documents/${Date.now()}-${file.name}`

    try {
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        })
        await r2.send(command)
    } catch (error) {
        console.error('Upload failed:', error)
        throw new Error('Failed to upload file')
    }

    // Create document record
    const { data: document, error } = await supabase
        .from('documents')
        .insert({
            user_id: user.id,
            document_type: documentType || null,
            document_name: documentName || file.name,
            description: description || null,
            r2_key: key,
            file_size: file.size,
            mime_type: file.type,
            original_filename: file.name,
            document_date: documentDate || null,
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/documents')
    return document
}

export async function updateDocument(id: string, data: Partial<Document>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: document, error } = await supabase
        .from('documents')
        .update({
            document_type: data.document_type || null,
            document_name: data.document_name,
            description: data.description || null,
            document_date: data.document_date || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/documents')
    return document
}

export async function deleteDocument(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get the document to find the R2 key
    const { data: doc } = await supabase
        .from('documents')
        .select('r2_key')
        .eq('id', id)
        .single()

    if (doc?.r2_key) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: doc.r2_key,
            })
            await r2.send(command)
        } catch (err) {
            console.error('Error deleting file from R2:', err)
        }
    }

    // Delete entity links first (cascade should handle this, but being explicit)
    await supabase
        .from('entity_documents')
        .delete()
        .eq('document_id', id)

    // Delete the document record
    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/documents')
}

export async function linkDocumentToEntity(documentId: string, entityType: string, entityId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('entity_documents')
        .insert({
            document_id: documentId,
            entity_type: entityType,
            entity_id: entityId,
        })

    if (error && !error.message.includes('duplicate')) {
        throw new Error(error.message)
    }
    revalidatePath('/dashboard/documents')
}

export async function unlinkDocumentFromEntity(documentId: string, entityType: string, entityId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('entity_documents')
        .delete()
        .eq('document_id', documentId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/documents')
}
