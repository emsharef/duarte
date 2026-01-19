'use server'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2 } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'

export async function uploadImage(formData: FormData) {
    console.log('Server Action: uploadImage called')
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const file = formData.get('file') as File
    if (!file) {
        throw new Error('No file provided')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = `${user.id}/${Date.now()}-${file.name}`

    try {
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        })

        await r2.send(command)
        return { success: true, key }
    } catch (error) {
        console.error('Upload failed:', error)
        return { success: false, error: 'Upload failed' }
    }
}
