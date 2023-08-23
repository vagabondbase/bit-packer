<p align="center">
  <h1 align="center">Bit Packer</h1>
  <p align="center">Pack multiple numeric values into compact representations.</p>
  <p align="center" style="align: center;">
    <a href="https://www.npmjs.com/package/@vagabondbase/bit-packer">
      <img src="https://img.shields.io/badge/TypeScript-blue" alt="TypeScript" />
    </a>
    <a href="https://www.npmjs.com/package/@vagabondbase/bit-packer">
      <img src="https://img.shields.io/npm/v/@vagabondbase/bit-packer" alt="npm latest release" />
    </a>
    <a href="https://github.com/vagabondbase/bit-packer/actions?query=branch%3Amain">
      <img src="https://github.com/vagabondbase/bit-packer/actions/workflows/main.yml/badge.svg" alt="CI status" />
    </a>
  </p>
</p>

## Installation

```sh
npm install @vagabondbase/bit-packer
```

## Usage

You can encode an array of numbers into a `Buffer` or a `string` (hexadecimal or UTF-16) with `BitPacker.encodeArray()`:

```ts
import { BitPacker } from 'bit-packer';

// Array to buffer
const buffer = BitPacker.encodeArray([1, 2, 3]);

// Array to string
const hexString = BitPacker.encodeArray([1.234, 2.3, 3], {
  fractionDigits: 2,
  returnType: 'string-utf16',
});
```

`BitPacker.encodeArray()` accepts an array of numbers and an optional options object with the following properties:

| Property         | Type                                         | Default Value | Description                                                                       |
| ---------------- | -------------------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| `returnType`     | `'string-hex' \| 'string-utf16' \| 'buffer'` | `'buffer'`    | Specifies the return type for the encoded array.                                  |
| `fractionDigits` | `number`                                     | `0`           | The number of decimal digits allowed for fractional values in the array encoding. |

You can decode either a `Buffer` or a `string` (hexadecimal or utf16le) into an array of numbers with `BitPacker.decodeArray()`:

```ts
import { BitPacker } from 'bit-packer';

// Decode from buffer
const originalArray = BitPacker.decodeArray(buffer);

// Or decode from string (hex or utf-16)
const originalArray = BitPacker.decodeArray(str);
```

**Important**: always use the `returnType` option when you need to encode to string instead of calling `toString()` on the buffer. This is because some encodings (e.g. UTF-8) may produce invalid characters and the resulting string may not be decoded correctly afterwards (e.g. the Unicode replacement character `U+FFFD`, see: [Buffer.toString()](https://nodejs.org/api/buffer.html#buffers-and-character-encodings)).

## Do you need this library?

In some cases this library may be less efficient than a simple `JSON.stringify(array)`. In other cases it may provide a **95% smaller result**.

To understand why, you only need to understand the main idea behind the library:

With 64 bits you can represent the number `1`, but you can also represent the number `99999999999999999`, which has 18 more decimal digits. This means that with the same amount of memory — by packing correctly the numbers — you could represent 19 numbers of one digit, 8 numbers of 2 digits, and so on. The efficiency of the library is inversely proportional to the maximum number of significant digits of the array numbers.

Consider, however, that algorithms such as Gzip or Brotli are extremely efficient with certain types of data, and getting a shorter string does not always lead to an overall lighter result. It is important to make decisions based on the specific data you are handling and the API available in your runtime (in some runtimes using V8 isolates it may not be obvious to be able to manually decompress data).

## Efficiency

Here's a comparison between `JSON.stringify()` and `BitPacker.encodeArray()` for a list of 1,000 random numbers with a desidered precision of 0.01.

### Comparison of string length

- `JSON.stringify()` produces a string of **7,001 characters**
- BitPacker produces a string of **673 UTF-16 characters** (-90%) or 2,692 hex characters (-62%). Hex characters are as handy to store as the output of JSON.stringify because they are just numbers and letters.

### Comparison of buffer length

- `Buffer.from(JSON.stringify())` produces **7,001 bytes** (**1510 bytes** if compressed with gzip)
- BitPacker produces **1346 bytes** (-11%), further compression is not useful

## Motivation

This library was created to solve a problem specific at VagabondBase. We wanted to handle with TypeScript **huge** amounts of data about all the tourist destinations in the world, and we wanted to use an efficient method to store lists of data with a predictable and not-too-variable number of decimal places (e.g. temperatures of a certain city over time).

We thought that making the work public was the best thing to do: the underlying algorithm and mathematics is pretty simple, but there are several edge cases to consider, and it is therefore useful to develop a library with a robust test suite.

## Want to plan a trip?

This library is developed and maintained by [VagabondBase](https://vagabondbase.com/): the all-in-one platform for travel planning.
