import { head } from '@vercel/blob';

const BLOB_URL =
  'https://hwo7y8ihegdsnror.private.blob.vercel-storage.com/SALON-VIDEO.mp4';

export async function GET(request: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new Response('Blob token not configured.', { status: 503 });
  }

  const range = request.headers.get('range');

  try {
    // Resolve the blob metadata so we know the total content length
    const metadata = await head(BLOB_URL, { token });
    const totalSize = metadata.size;

    // Build upstream request headers — forward Range if the browser sent one
    const upstreamHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (range) {
      upstreamHeaders['Range'] = range;
    }

    const upstream = await fetch(BLOB_URL, { headers: upstreamHeaders });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response('Failed to fetch video from storage.', {
        status: upstream.status,
      });
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
    };

    // Pass through Content-Range and Content-Length from the upstream response
    const upstreamContentRange = upstream.headers.get('content-range');
    const upstreamContentLength = upstream.headers.get('content-length');

    if (upstreamContentRange) {
      responseHeaders['Content-Range'] = upstreamContentRange;
    }
    if (upstreamContentLength) {
      responseHeaders['Content-Length'] = upstreamContentLength;
    } else {
      responseHeaders['Content-Length'] = String(totalSize);
    }

    return new Response(upstream.body, {
      status: range ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Error streaming video: ${message}`, { status: 500 });
  }
}
