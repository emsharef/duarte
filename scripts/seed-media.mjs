// One-shot: generate abstract images + simple PDFs for the test workspace,
// upload to R2 (original/medium/thumbnail), and emit SQL to link them.
// Usage: node scripts/seed-media.mjs > /tmp/seed-media.sql
import { config } from 'dotenv'
config({ path: '.env.local' })
import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const WS = '940edfb8-f495-4b29-a88a-e831aa2d1880'

const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
})

async function put(key, body, type) {
    await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: body, ContentType: type,
    }))
}

function rnd(seed) {
    let s = seed
    return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function artSvg(seed, w, h) {
    const r = rnd(seed)
    const palettes = [
        ['#1e3a8a', '#93c5fd', '#f5f0e8', '#7c2d2d'],
        ['#14532d', '#86efac', '#fef9ef', '#b45309'],
        ['#581c87', '#e9d5ff', '#faf7f0', '#0f766e'],
        ['#7c2d12', '#fdba74', '#fffbf5', '#1e293b'],
        ['#0c4a6e', '#bae6fd', '#f8f5ee', '#9d174d'],
        ['#3f3f46', '#d4d4d8', '#fafaf6', '#ca8a04'],
    ]
    const p = palettes[Math.floor(r() * palettes.length)]
    let shapes = `<rect width="${w}" height="${h}" fill="${p[2]}"/>`
    const n = 5 + Math.floor(r() * 7)
    for (let i = 0; i < n; i++) {
        const fill = p[Math.floor(r() * p.length)]
        const op = 0.55 + r() * 0.45
        const kind = r()
        if (kind < 0.4) {
            shapes += `<circle cx="${r() * w}" cy="${r() * h}" r="${(0.08 + r() * 0.25) * w}" fill="${fill}" opacity="${op}"/>`
        } else if (kind < 0.75) {
            const rw = (0.15 + r() * 0.5) * w, rh = (0.1 + r() * 0.5) * h
            shapes += `<rect x="${r() * (w - rw)}" y="${r() * (h - rh)}" width="${rw}" height="${rh}" fill="${fill}" opacity="${op}" transform="rotate(${(r() - 0.5) * 30} ${w / 2} ${h / 2})"/>`
        } else {
            shapes += `<path d="M ${r() * w} ${r() * h} Q ${r() * w} ${r() * h} ${r() * w} ${r() * h} T ${r() * w} ${r() * h}" stroke="${fill}" stroke-width="${4 + r() * 18}" fill="none" opacity="${op}"/>`
        }
    }
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${shapes}</svg>`)
}

function minimalPdf(title, lines) {
    const text = [title, '', ...lines].map((l, i) =>
        `BT /F1 ${i === 0 ? 16 : 10} Tf 56 ${760 - i * 22} Td (${l.replace(/[()\\]/g, '')}) Tj ET`
    ).join('\n')
    const objs = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
        `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ]
    let out = '%PDF-1.4\n'
    const offsets = []
    objs.forEach((o, i) => {
        offsets.push(out.length)
        out += `${i + 1} 0 obj\n${o}\nendobj\n`
    })
    const xref = out.length
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
    offsets.forEach((off) => { out += `${String(off).padStart(10, '0')} 00000 n \n` })
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
    return Buffer.from(out, 'latin1')
}

const works = [
    { title: 'Slip Slide Curl Lick', seed: 11, ratio: 1.19 },
    { title: 'Madre Selva', seed: 22, ratio: 1.5 },
    { title: 'ANF 100465', seed: 33, ratio: 0.75 },
    { title: 'Language Series #4', seed: 44, ratio: 1.1 },
    { title: 'Sonakinatography Comp. III', seed: 55, ratio: 1.0 },
    { title: 'Counter Form (video study)', seed: 66, ratio: 0.5625 },
    { title: 'Untitled (maquette)', seed: 77, ratio: 1.33 },
    { title: "We'll Find a Place I", seed: 88, ratio: 1.19 },
    { title: 'Field Notes (diptych)', seed: 99, ratio: 0.75 },
]

const docs = [
    { name: 'Invoice MR-2025-184', type: 'Invoice', file: 'invoice-mr-2025-184.pdf', entity: ['acquisition', '20251029 MakeRoom'], lines: ['Make Room Gallery LLC', 'Invoice MR-2025-184 - October 29, 2025', 'Slip Slide Curl Lick - USD 9,500.00', 'Madre Selva - USD 6,900.00', 'Total: USD 16,400.00'] },
    { name: 'Appraisal Gurr Johns 2026', type: 'Appraisal', file: 'appraisal-gurr-johns-2026.pdf', entity: ['valuation', 'Appraisal Gurr Johns 2026'], lines: ['Gurr Johns Inc.', 'Insurance appraisal - April 18, 2026', 'Five works, total appraised value USD 41,800', 'Full schedule attached.'] },
    { name: 'JSMA Loan Agreement', type: 'Loan Agreement', file: 'jsma-loan-agreement.pdf', entity: ['loan', 'JSMA Masterworks 2026'], lines: ['Jordan Schnitzer Museum of Art', 'Outgoing loan agreement', 'Work: We will Find a Place I (HAY002)', 'Period: May 1 - September 23, 2026', 'Insurance value: USD 5,300'] },
    { name: 'Condition Report HOR001', type: 'Condition Report', file: 'condition-hor001.pdf', entity: ['object', 'Language Series #4'], lines: ['Condition report - February 20, 2026', 'Work: Language Series #4, casein on cardboard', 'Overall: good. Surface cleaned, hinges repaired.', 'Examiner: Gurr Johns conservation studio'] },
]

const sql = []
for (const wk of works) {
    const ts = Date.now() + Math.floor(Math.random() * 1000)
    const slug = wk.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const w = 1200, h = Math.round(1200 * wk.ratio)
    const svg = artSvg(wk.seed, w, h)
    const original = await sharp(svg).png().toBuffer()
    const medium = await sharp(original).resize(800).png().toBuffer()
    const thumb = await sharp(original).resize(200).png().toBuffer()
    const kO = `${WS}/${ts}-${slug}.png`
    const kM = `${WS}/${ts}-medium-${slug}.png`
    const kT = `${WS}/${ts}-thumbnail-${slug}.png`
    await put(kO, original, 'image/png')
    await put(kM, medium, 'image/png')
    await put(kT, thumb, 'image/png')
    sql.push(`insert into object_media (workspace_id, object_id, type, r2_key_original, r2_key_medium, r2_key_thumbnail, name, is_primary)
select '${WS}', id, 'image', '${kO}', '${kM}', '${kT}', '${slug}', true from objects where workspace_id = '${WS}' and title = ${wk.title.includes("'") ? `'${wk.title.replace(/'/g, "''")}'` : `'${wk.title}'`};`)
    console.error(`uploaded ${slug}`)
}

for (const d of docs) {
    const ts = Date.now() + Math.floor(Math.random() * 1000)
    const pdf = minimalPdf(d.name, d.lines)
    const key = `${WS}/documents/${ts}-${d.file}`
    await put(key, pdf, 'application/pdf')
    const subj = d.entity[1].replace(/'/g, "''")
    const entitySelect = {
        acquisition: `select id from acquisitions where workspace_id = '${WS}' and acquisition_subject = '${subj}'`,
        valuation: `select id from valuations where workspace_id = '${WS}' and valuation_subject = '${subj}'`,
        loan: `select id from loans where workspace_id = '${WS}' and loan_subject = '${subj}'`,
        object: `select id from objects where workspace_id = '${WS}' and title = '${subj}'`,
    }[d.entity[0]]
    sql.push(`with doc as (
    insert into documents (workspace_id, document_type, document_name, r2_key, file_size, mime_type, original_filename, document_date)
    values ('${WS}', '${d.type}', '${d.name}', '${key}', ${pdf.length}, 'application/pdf', '${d.file}', now()::date)
    returning id
)
insert into entity_documents (workspace_id, document_id, entity_type, entity_id)
select '${WS}', doc.id, '${d.entity[0]}', e.id from doc, (${entitySelect}) e;`)
    console.error(`uploaded ${d.file}`)
}

console.log(sql.join('\n\n'))
