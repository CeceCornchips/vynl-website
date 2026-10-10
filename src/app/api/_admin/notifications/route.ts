import { auth } from '@clerk/nextjs/server';
import { getAllNotificationSettings } from '@/lib/notifications-migration';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await getAllNotificationSettings();
    return Response.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
