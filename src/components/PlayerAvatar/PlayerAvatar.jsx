import { useEffect, useState } from 'react';

/**
 * Renders a player's photo with a graceful fallback.
 *
 * 1. Tries the `imageUrl` set on the player record (typically a local file
 *    in `public/players/{id}.jpg`).
 * 2. If that 404s or fails to load, swaps in a deterministic pravatar avatar
 *    keyed by the player's id so every player still gets a stable image.
 *
 * Drop a file in `public/players/{id}.jpg` and it appears automatically — no
 * code changes needed.
 */

const fallbackUrl = (id) => `https://i.pravatar.cc/150?u=${id}`;

export default function PlayerAvatar({ player, alt, ...rest }) {
  const [src, setSrc] = useState(player.imageUrl);

  // If the player switches (e.g. inside the showcase) reset to the primary URL.
  useEffect(() => {
    setSrc(player.imageUrl);
  }, [player.id, player.imageUrl]);

  const handleError = () => {
    const fb = fallbackUrl(player.id);
    if (src !== fb) setSrc(fb);
  };

  return (
    <img
      src={src}
      alt={alt ?? player.name}
      loading="lazy"
      onError={handleError}
      {...rest}
    />
  );
}
