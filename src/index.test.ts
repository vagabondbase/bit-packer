import { expect, expectTypeOf, it, test } from 'vitest';
import { encodeArray, decodeArray } from './index';
import * as zlib from 'node:zlib';

const testEncodeAndDecode = (...args: Parameters<typeof encodeArray>) => {
  const [array, options] = args;

  const hexEncoded = encodeArray(array, {
    ...options,
    returnType: 'string-hex',
  });
  const utf16Encoded = encodeArray(array, {
    ...options,
    returnType: 'string-utf16',
  });
  const buffer = encodeArray(array, { ...options, returnType: 'buffer' });
  const gzipBuffer = zlib.gzipSync(buffer);
  const deflateBuffer = zlib.deflateSync(buffer);
  const brotliBuffer = zlib.brotliCompressSync(buffer);

  expect(decodeArray(hexEncoded)).toEqual(array);
  expect(decodeArray(utf16Encoded)).toEqual(array);
  expect(decodeArray(buffer)).toEqual(array);
  expect(decodeArray(zlib.gunzipSync(gzipBuffer))).toEqual(array);
  expect(decodeArray(zlib.inflateSync(deflateBuffer))).toEqual(array);
  expect(decodeArray(zlib.brotliDecompressSync(brotliBuffer))).toEqual(array);

  for (const encoding of ['hex', 'utf16le'] as const) {
    const reEncodedBuffer = Buffer.from(buffer.toString(encoding), encoding);
    expect(decodeArray(reEncodedBuffer)).toEqual(array);
  }
};

test('Typescript types', () => {
  expectTypeOf(encodeArray([1])).toEqualTypeOf<Buffer>();

  expectTypeOf(
    encodeArray([1], { returnType: 'buffer' }),
  ).toEqualTypeOf<Buffer>();

  expectTypeOf(
    encodeArray([1], { returnType: 'string-hex' }),
  ).toEqualTypeOf<string>();

  expectTypeOf(
    encodeArray([1], { returnType: 'string-utf16' }),
  ).toEqualTypeOf<string>();
});

it('should include the correct npm version in the header', () => {
  const encoded = encodeArray([1234]);
  expect(encoded.readUInt8(0)).toEqual(
    parseInt(process.env.npm_package_version || ''),
  );
});

it('should encode arrays of length 1', () => {
  const arrays = [[0], [1], [2]];

  for (const array of arrays) {
    expect(decodeArray(encodeArray(array))).toEqual(array);
  }
});

it('should throw an error when encoding arrays with non-finite numbers', () => {
  expect(() => encodeArray([NaN])).toThrow();
  expect(() => encodeArray([Infinity])).toThrow();
  expect(() => encodeArray([-Infinity])).toThrow();
});

it('should throw an error when encoding arrays with non-safe integers', () => {
  expect(() => encodeArray([Number.MAX_SAFE_INTEGER + 1])).toThrow();
});

it('should encode and decode an array of 1M numbers', () => {
  const array = Array.from({ length: 1_000_000 }, (_, i) => i - 500_000);
  testEncodeAndDecode(array);
});

it('should encode and decode arrays of very large numbers', () => {
  const array = Array(100).fill(Number.MAX_SAFE_INTEGER);
  testEncodeAndDecode(array);
});

it('should encode and decode arrays of numbers with same amounts of digits', () => {
  const arrays = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    [11, 22, 33, 44, 55, 66, 77, 89],
  ];

  for (const array of arrays) {
    testEncodeAndDecode(array);
  }
});

it('should encode and decode arrays of numbers with different amounts of digits', () => {
  const array = [1, 2, 34, 567, 8999];
  testEncodeAndDecode(array);
});

it('should encode and decode arrays of numbers with different amounts of digits containing zeros', () => {
  const array = [0, 1, 10, 100, 101, 110, 111];
  testEncodeAndDecode(array);
});

it('should encode and decode arrays of negative decimal numbers', () => {
  expect(
    decodeArray(
      encodeArray([-10.12, -20.123456789, -30.56789, -40.6], {
        fractionDigits: 2,
      }),
    ),
  ).toEqual([-10.12, -20.12, -30.57, -40.6]);
});

it('should encode and decode arrays of decimal numbers and integers', () => {
  expect(
    decodeArray(
      encodeArray([1, 10, -11, -20.123456789, 30.56789, -40.6], {
        fractionDigits: 2,
      }),
    ),
  ).toEqual([1, 10, -11, -20.12, 30.57, -40.6]);
});

it('should encode and decode arrays of negative integers', () => {
  const array = [0, -1, -10, -20, -21];
  testEncodeAndDecode(array);
});

it('should encode and decode arrays of negative and positive integers', () => {
  // Do not forget that -0 is a thing in JS
  const array = [0, -1, -10, -20, -21].flatMap(n => (n === 0 ? n : [n, -n]));
  testEncodeAndDecode(array);
});
