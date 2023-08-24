import { bigIntToChunk, chunk, chunkToBigInt, numberOfDigits } from './utils';

const CONSTANTS = {
  headerLength: 1 + 1 + 4 + 4,
  majorVersion: 0,
} as const;

export type EncodeArrayOptions =
  | undefined
  | {
      returnType?: 'string-hex' | 'string-utf16' | 'buffer';
      fractionDigits?: number;
    };

type EncodeArrayReturnMap<T extends EncodeArrayOptions> = T extends {
  returnType: 'string-hex';
}
  ? string
  : T extends { returnType: 'string-utf16' }
  ? string
  : Buffer;

export const encodeArray = <T extends EncodeArrayOptions>(
  inputArray: number[],
  options?: T,
) => {
  const scale = Math.pow(10, options?.fractionDigits ?? 0);

  let array = [] as typeof inputArray;

  let minValue = Math.round(inputArray[0] * scale);
  for (let i = 0; i < inputArray.length; i++) {
    const number = Math.round(inputArray[i] * scale);
    array[i] = number;
    if (number < minValue) {
      minValue = number;
    }
  }

  let translate = 0;
  if (minValue < 0) {
    translate = Math.abs(minValue) + 1;
  } else if (inputArray.includes(0)) {
    translate = 1;
  }

  for (let i = 0; i < inputArray.length; i++) {
    const number = array[i] + translate;

    if (!Number.isFinite(number)) {
      throw new Error(
        'Array must only contain finite numbers (no NaN, Infinity or -Infinity)',
      );
    }

    if (!Number.isSafeInteger(number)) {
      throw new Error(
        "Array must only contain safe integers strictly positive – or numbers that can be transformed into such through scaling and translation by the library. There's probably nothing you can do about this, besides providing a different array.",
      );
    }

    array[i] = number;
  }

  let maxNumberOfDigits = numberOfDigits(array[0]);
  for (let i = 1; i < array.length; i++) {
    const digits = numberOfDigits(array[i]);
    if (digits > maxNumberOfDigits) {
      maxNumberOfDigits = digits;
    }
  }

  // A chunk is a subarray of the original array that is encoded into a single number.
  // 19 is the number of digits in 2^64 - 1 - 1
  const chunkLength = Math.floor(19 / maxNumberOfDigits);
  const chunks = chunk({ array, chunkLength });

  const buffer = Buffer.alloc(CONSTANTS.headerLength + chunks.length * 8);
  buffer.writeUint8(CONSTANTS.majorVersion); // 1 byte for package version
  buffer.writeUint8(maxNumberOfDigits, 1); // 1 byte for maxNumberOfDigits
  buffer.writeFloatLE(scale, 2); // 4 bytes for `preTransform.scale`
  buffer.writeFloatLE(translate, 6); // 4 bytes for `preTransform.translate`

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    buffer.writeBigUInt64LE(
      chunkToBigInt(chunk, { numberOfDigits: maxNumberOfDigits }),
      CONSTANTS.headerLength + chunkIndex * 8,
    );
  }

  if (
    !options ||
    !('returnType' in options) ||
    options.returnType === 'buffer'
  ) {
    return buffer as EncodeArrayReturnMap<T>;
  } else {
    return buffer.toString(
      options.returnType === 'string-hex' ? 'hex' : 'utf16le',
    ) as EncodeArrayReturnMap<T>;
  }
};

export const decodeArray = (encodedArray: Buffer | string) => {
  const buffer =
    typeof encodedArray === 'string'
      ? Buffer.from(
          encodedArray,
          /^[0-9A-Fa-f]*$/.test(encodedArray) ? 'hex' : 'utf16le',
        )
      : encodedArray;

  const array: number[] = [];

  const maxNumberOfDigits = buffer.readUInt8(1);
  const scale = buffer.readFloatLE(2);
  const translate = buffer.readFloatLE(6);

  for (
    let chunkIndex = 0;
    chunkIndex < (buffer.length - CONSTANTS.headerLength) / 8;
    chunkIndex++
  ) {
    const bigIntValue = buffer.readBigUInt64LE(
      CONSTANTS.headerLength + chunkIndex * 8,
    );

    const chunk = bigIntToChunk(bigIntValue, {
      numberOfDigits: maxNumberOfDigits,
    });

    for (let i = 0; i < chunk.length; i++) {
      let value = (chunk[i] - translate) / scale;
      array.push(value);
    }
  }

  return array;
};

export const BitPacker = {
  encodeArray,
  decodeArray,
};
