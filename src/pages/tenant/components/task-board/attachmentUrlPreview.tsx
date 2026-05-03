import { useState } from 'react';

export function tryParseHttpUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}

function looksLikeImageUrl(raw: string): boolean {
  const valid = tryParseHttpUrl(raw);
  if (valid === null) {
    return false;
  }
  try {
    const path = new URL(valid).pathname.toLowerCase();
    return /\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(path);
  } catch {
    return false;
  }
}

export function AttachmentImagePreview({
  alt = 'Attachment preview',
  url,
}: {
  alt?: string;
  url: string;
}) {
  const [broken, setBroken] = useState(false);
  const href = tryParseHttpUrl(url);
  const show =
    href !== null &&
    !broken &&
    (looksLikeImageUrl(url) || url.includes('res.cloudinary.com'));

  if (!show) {
    return null;
  }

  return (
    <div className="border-border/70 bg-muted/20 mt-2 max-w-full overflow-hidden rounded-lg border">
      <img
        alt={alt}
        className="max-h-48 max-w-full object-contain object-center"
        decoding="async"
        loading="lazy"
        src={href}
        onError={() => {
          setBroken(true);
        }}
      />
    </div>
  );
}
