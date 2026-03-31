import { getBusinessProfile } from '@/lib/business-profile';

/** Public endpoint — no auth required — used by the booking page. */
export async function GET() {
  try {
    const profile = await getBusinessProfile();

    // Return only the fields needed for the public booking page
    return Response.json({
      ok: true,
      profile: {
        business_name: profile.business_name,
        tagline: profile.tagline,
        phone: profile.phone,
        address_line1: profile.address_line1,
        suburb: profile.suburb,
        state: profile.state,
        logo_url: profile.logo_url,
        cover_image_url: profile.cover_image_url,
        facebook_url: profile.facebook_url,
        instagram_url: profile.instagram_url,
        tiktok_url: profile.tiktok_url,
        google_business_url: profile.google_business_url,
        online_booking_enabled: profile.online_booking_enabled,
      },
    });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
