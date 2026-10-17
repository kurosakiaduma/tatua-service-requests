export function canReplaceLocationText(text: string, wasAutoFilled: boolean) {
  return !text.trim() || wasAutoFilled;
}

export function coordinatesFallback(value: [number, number]) {
  return `Pinned location (${value[0].toFixed(5)}, ${value[1].toFixed(5)})`;
}
