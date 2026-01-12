const DECODER = new TextDecoder();
const ENCODER = new TextEncoder();

export const decodeValue = (value) => {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Uint8Array) {
    return DECODER.decode(value);
  }
  if (value instanceof ArrayBuffer) {
    return DECODER.decode(new Uint8Array(value));
  }
  return undefined;
};

export const encodeString = (input) => {
  return ENCODER.encode(input);
};
