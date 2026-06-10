import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'
import { r2 } from '@/lib/r2'
import { getWorkspaceContext } from '@/lib/workspace'

export async function POST(request: Request) {
    let workspaceId: string
    try {
        const ctx = await getWorkspaceContext()
        if (ctx.role === 'viewer') {
            return NextResponse.json({ error: 'Read-only access' }, { status: 403 })
        }
        workspaceId = ctx.workspaceId
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { filename, contentType } = await request.json()
        const key = `${workspaceId}/${Date.now()}-${filename}`

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
