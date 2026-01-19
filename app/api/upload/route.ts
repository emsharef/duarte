import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'
import { r2 } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { filename, contentType } = await request.json()
        const key = `${user.id}/${Date.now()}-${filename}`

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        })

        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })

        return NextResponse.json({ signedUrl, key })
    } catch (error) {
        console.error('Error generating signed URL:', error)
        return NextResponse.json(
            { error: 'Failed to generate signed URL' },
            { status: 500 }
        )
    }
}
