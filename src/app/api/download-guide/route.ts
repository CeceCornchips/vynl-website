import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { GelXGuidePDF } from '@/components/pdf/GelXGuidePDF'
import { sql } from '@/lib/db'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function deriveDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile'
  if (/tablet|ipad/i.test(userAgent)) return 'tablet'
  return 'desktop'
}

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  const ipAddress = forwarded
    ? forwarded.split(',')[0].trim()
    : (req.headers.get('x-real-ip') ?? 'unknown')
  const userAgent = req.headers.get('user-agent') ?? ''
  const deviceType = deriveDeviceType(userAgent)

  try {
    await sql`
      INSERT INTO guide_downloads (ip_address, user_agent, device_type, guide_name)
      VALUES (${ipAddress}, ${userAgent}, ${deviceType}, 'gel-x-retention-guide')
    `
  } catch (err) {
    console.error('[download-guide] tracking insert failed:', err)
  }

  try {
    const buffer = await renderToBuffer(createElement(GelXGuidePDF))

    const uint8Array = new Uint8Array(buffer)

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="vynl-academy-gelx-guide.pdf"',
        'Content-Length': uint8Array.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate PDF'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
