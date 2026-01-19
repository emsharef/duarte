import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2 } from '@/lib/r2'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const timestamp = Date.now()
        const baseKey = `${user.id}/${timestamp}-${file.name}`

        // Upload Original
        await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: baseKey,
            Body: buffer,
            ContentType: file.type,
        }))

        let mediumKey = null
        let thumbnailKey = null

        // Process Image variants if it's an image
        if (file.type.startsWith('image/')) {
            // Medium (800px width)
            const mediumBuffer = await sharp(buffer)
                .resize(800, null, { withoutEnlargement: true })
                .toBuffer()
            mediumKey = `${user.id}/${timestamp}-medium-${file.name}`
            await r2.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: mediumKey,
                Body: mediumBuffer,
                ContentType: file.type,
            }))

            // Thumbnail (200px width)
            const thumbnailBuffer = await sharp(buffer)
                .resize(200, null, { withoutEnlargement: true })
                .toBuffer()
            thumbnailKey = `${user.id}/${timestamp}-thumbnail-${file.name}`
            await r2.send(new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: thumbnailKey,
                Body: thumbnailBuffer,
                ContentType: file.type,
            }))
        }

        return NextResponse.json({
            success: true,
            keys: {
                original: baseKey,
                medium: mediumKey,
                thumbnail: thumbnailKey
            }
        })
    } catch (error) {
        console.error('Upload failed:', error)
        return NextResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
        )
    }
}
