import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { getBusinessProfile, getBusinessHours, type BusinessProfile } from '@/lib/business-profile';
import { ensureBusinessProfileTables } from '@/lib/business-profile-migration';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const [profile, hours] = await Promise.all([getBusinessProfile(), getBusinessHours()]);
    return Response.json({ ok: true, profile, hours });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

type PatchBody = Partial<BusinessProfile>;

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureBusinessProfileTables();
    const body = (await request.json()) as PatchBody;
    const b = body;

    // Each field gets its own update so we use parameterised literals safely
    if ('business_name'         in b) await sql`UPDATE business_profile SET business_name         = ${b.business_name         ?? null} WHERE id=1`;
    if ('tagline'               in b) await sql`UPDATE business_profile SET tagline               = ${b.tagline               ?? null} WHERE id=1`;
    if ('description'           in b) await sql`UPDATE business_profile SET description           = ${b.description           ?? null} WHERE id=1`;
    if ('abn'                   in b) await sql`UPDATE business_profile SET abn                   = ${b.abn                   ?? null} WHERE id=1`;
    if ('phone'                 in b) await sql`UPDATE business_profile SET phone                 = ${b.phone                 ?? null} WHERE id=1`;
    if ('email'                 in b) await sql`UPDATE business_profile SET email                 = ${b.email                 ?? null} WHERE id=1`;
    if ('website'               in b) await sql`UPDATE business_profile SET website               = ${b.website               ?? null} WHERE id=1`;
    if ('address_line1'         in b) await sql`UPDATE business_profile SET address_line1         = ${b.address_line1         ?? null} WHERE id=1`;
    if ('address_line2'         in b) await sql`UPDATE business_profile SET address_line2         = ${b.address_line2         ?? null} WHERE id=1`;
    if ('suburb'                in b) await sql`UPDATE business_profile SET suburb                = ${b.suburb                ?? null} WHERE id=1`;
    if ('state'                 in b) await sql`UPDATE business_profile SET state                 = ${b.state                 ?? null} WHERE id=1`;
    if ('postcode'              in b) await sql`UPDATE business_profile SET postcode              = ${b.postcode              ?? null} WHERE id=1`;
    if ('country'               in b) await sql`UPDATE business_profile SET country               = ${b.country               ?? null} WHERE id=1`;
    if ('logo_url'              in b) await sql`UPDATE business_profile SET logo_url              = ${b.logo_url              ?? null} WHERE id=1`;
    if ('cover_image_url'       in b) await sql`UPDATE business_profile SET cover_image_url       = ${b.cover_image_url       ?? null} WHERE id=1`;
    if ('gallery_urls'          in b) await sql`UPDATE business_profile SET gallery_urls          = ${JSON.stringify(b.gallery_urls ?? [])}::jsonb WHERE id=1`;
    if ('facebook_url'          in b) await sql`UPDATE business_profile SET facebook_url          = ${b.facebook_url          ?? null} WHERE id=1`;
    if ('instagram_url'         in b) await sql`UPDATE business_profile SET instagram_url         = ${b.instagram_url         ?? null} WHERE id=1`;
    if ('tiktok_url'            in b) await sql`UPDATE business_profile SET tiktok_url            = ${b.tiktok_url            ?? null} WHERE id=1`;
    if ('google_business_url'   in b) await sql`UPDATE business_profile SET google_business_url   = ${b.google_business_url   ?? null} WHERE id=1`;
    if ('timezone'              in b) await sql`UPDATE business_profile SET timezone              = ${b.timezone              ?? null} WHERE id=1`;
    if ('currency'              in b) await sql`UPDATE business_profile SET currency              = ${b.currency              ?? null} WHERE id=1`;
    if ('date_format'           in b) await sql`UPDATE business_profile SET date_format           = ${b.date_format           ?? null} WHERE id=1`;
    if ('time_format'           in b) await sql`UPDATE business_profile SET time_format           = ${b.time_format           ?? null} WHERE id=1`;
    if ('week_starts_on'        in b) await sql`UPDATE business_profile SET week_starts_on        = ${b.week_starts_on        ?? null} WHERE id=1`;
    if ('getting_here_note'     in b) await sql`UPDATE business_profile SET getting_here_note     = ${b.getting_here_note     ?? null} WHERE id=1`;
    if ('amenities'             in b) await sql`UPDATE business_profile SET amenities             = ${JSON.stringify(b.amenities    ?? [])}::jsonb WHERE id=1`;
    if ('highlights'            in b) await sql`UPDATE business_profile SET highlights            = ${JSON.stringify(b.highlights   ?? [])}::jsonb WHERE id=1`;
    if ('online_booking_enabled' in b) await sql`UPDATE business_profile SET online_booking_enabled = ${b.online_booking_enabled ?? true} WHERE id=1`;
    if ('booking_lead_time_hours' in b) await sql`UPDATE business_profile SET booking_lead_time_hours = ${b.booking_lead_time_hours ?? 2} WHERE id=1`;
    if ('booking_advance_days'  in b) await sql`UPDATE business_profile SET booking_advance_days  = ${b.booking_advance_days  ?? 60} WHERE id=1`;

    await sql`UPDATE business_profile SET updated_at = NOW() WHERE id=1`;

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
