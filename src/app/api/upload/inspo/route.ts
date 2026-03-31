import { put } from '@vercel/blob';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ ok: false, error: 'No file provided.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        { ok: false, error: 'Only JPG, PNG, or WEBP images are allowed.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return Response.json(
        { ok: false, error: 'File must be 5 MB or smaller.' },
        { status: 400 },
      );
    }

    const extension = file.type.split('/')[1] ?? 'jpg';
    const filename = `inspo/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const blob = await put(filename, file, {
      access: 'public',
    });

    return Response.json({ ok: true, url: blob.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // If Vercel Blob is not configured, return a helpful error
    if (message.includes('BLOB_READ_WRITE_TOKEN') || message.includes('token')) {
      return Response.json(
        {
          ok: false,
          error: 'Image upload is not configured. Please set BLOB_READ_WRITE_TOKEN in your environment variables.',
        },
        { status: 503 },
      );
    }
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
