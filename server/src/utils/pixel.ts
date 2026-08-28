const TRANSPARENT_1X1_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export function transparentPixelGif(): Buffer {
  return TRANSPARENT_1X1_GIF;
}
