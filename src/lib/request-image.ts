// Request photos can live in private storage or be absolute external URLs.
// External paths need no signing, so both server and client views can use them.
export function externalImageUrl(imagePath?: string | null) {
  return imagePath && /^https?:\/\//i.test(imagePath) ? imagePath : null;
}
