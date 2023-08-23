// Usage: pnpm scripts:compare-with-json

import { BitPacker, EncodeArrayOptions } from '../src';
import * as zlib from 'node:zlib';

const fractionDigits = 2;
const array = Array.from({ length: 1000 }, () => Math.random());

const json = JSON.stringify(array.map(n => n.toFixed(fractionDigits)));
const jsonBuffer = Buffer.from(json);
const jsonBufferGzipped = zlib.gzipSync(jsonBuffer);

const options: EncodeArrayOptions = {
  fractionDigits,
};

const utf16 = BitPacker.encodeArray(array, {
  ...options,
  returnType: 'string-utf16',
});

const hex = BitPacker.encodeArray(array, {
  ...options,
  returnType: 'string-hex',
});

const buffer = BitPacker.encodeArray(array, {
  ...options,
});

const percentChange = (from: number, to: number) => (to / from - 1) * 100;

console.log('String Output:');
console.log(`[JSON.stringify]: ${json.length} characters`);
console.log(
  `[bit-packer]: ${hex.length} hex characters (${percentChange(
    json.length,
    hex.length,
  ).toFixed(0)}%) or ${utf16.length} UTF-16 characters (${percentChange(
    json.length,
    utf16.length,
  ).toFixed(0)}%)`,
);

console.log('\nBuffer Output:');
console.log(
  `[JSON.stringify] ${jsonBufferGzipped.length} bytes gzipped (${jsonBuffer.length} bytes uncompressed)`,
);
console.log(
  `[bit-packer] ${buffer.length} bytes (${percentChange(
    jsonBufferGzipped.length,
    buffer.length,
  ).toFixed(0)}% bytes)`,
);
