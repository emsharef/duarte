import { getWorkspaceContext } from '@/lib/workspace'
import { r2 } from '@/lib/r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ArtworkTable } from '@/components/artwork-table'
import { columns } from '@/components/columns'

export default async function DashboardPage() {
    const { supabase, workspaceId } = await getWorkspaceContext()

    // Fetch objects with related data
    const { data: objects, error } = await supabase
        .from('objects')
        .select(`
      *,
      artists (first_name, last_name, company),
      object_media (r2_key_thumbnail, is_primary)
    `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching objects:', error)
    }

    // Generate signed URLs for thumbnails
    const objectsWithUrls = await Promise.all(
        (objects || []).map(async (obj) => {
            let signedUrl = null
            // Find primary image or first available
            const primaryMedia = obj.object_media?.find((m) => m.is_primary) || obj.object_media?.[0]

            if (primaryMedia?.r2_key_thumbnail) {
                try {
                    const command = new GetObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: primaryMedia.r2_key_thumbnail,
                    })
                    signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })
                } catch (err) {
                    console.error(`Error generating signed URL for ${primaryMedia.r2_key_thumbnail}:`, err)
                }
            }

            return {
                ...obj,
                artist_name: obj.artists ? `${obj.artists.first_name || ''} ${obj.artists.last_name || ''} ${obj.artists.company || ''}`.trim() : 'Unknown',
                signedUrl
            }
        })
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-muted-foreground">Manage your art collection.</p>
                </div>
            </div>
            <ArtworkTable columns={columns} data={objectsWithUrls} />
        </div>
    )
}
