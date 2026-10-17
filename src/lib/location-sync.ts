/** Allows geocoding to replace text only when it is empty or previously auto-filled. */
export function canReplaceLocationText(text: string, wasAutoFilled: boolean) {
  return !text.trim() || wasAutoFilled;
}

/** Keeps a selected map point useful when reverse geocoding returns no address. */
export function coordinatesFallback(value: [number, number]) {
  return `Pinned location (${value[0].toFixed(5)}, ${value[1].toFixed(5)})`;
}
