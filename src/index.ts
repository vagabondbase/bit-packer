import { bigIntToChunk, chunk, chunkToBigInt, numberOfDigits } from './utils';

const bufferEncoding: BufferEncoding = 'utf16le';
const headerOffset = 1 + 1 + 4 + 4;

export type EncodeArrayOptions = {
    preTransform?: {
        scale?: number;
        translate?: number;
    };
};

export const encodeArray = (
    inputArray: number[],
    options?: EncodeArrayOptions,
) => {
    const scale = options?.preTransform?.scale || 1;
    const translate = options?.preTransform?.translate || 0;

    let array = [] as typeof inputArray;
    const arrayIncludesZero = inputArray.includes(0);
    for (let i = 0; i < inputArray.length; i++) {
        let number = inputArray[i];

        if (options?.preTransform) {
            number = Math.round(number * scale + translate);
        }

        if (!Number.isFinite(number)) {
            throw new Error(
                'Array must only contain finite numbers (no NaN, Infinity or -Infinity)',
            );
        }

        if (!Number.isSafeInteger(number)) {
            throw new Error(
                'Array must only contain safe integers or floats that can be converted to safe integers (the conversion is done by multiplying each number by the provided multiplier and rounding the result. You must provide a multiplier if you want to encode floats)',
            );
        }

        if (number < 0) {
            throw new Error('Array must only contain positive numbers');
        }

        array[i] = arrayIncludesZero ? number + 1 : number;
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

    const buffer = Buffer.alloc(headerOffset + chunks.length * 8);
    buffer.writeUint8(maxNumberOfDigits); // 1 byte for maxNumberOfDigits
    buffer.writeUint8(arrayIncludesZero ? 1 : 0, 1); // 1 byte for arrayIncludesZero
    buffer.writeFloatLE(scale, 2); // 4 bytes for `preTransform.scale`
    buffer.writeFloatLE(translate, 6); // 4 bytes for `preTransform.translate`

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        buffer.writeBigUInt64LE(
            chunkToBigInt(chunk, { numberOfDigits: maxNumberOfDigits }),
            headerOffset + chunkIndex * 8,
        );
    }

    return buffer.toString(bufferEncoding);
};

export const decodeArray = (encodedArray: string) => {
    const buffer = Buffer.from(encodedArray, bufferEncoding);
    const array: number[] = [];

    const maxNumberOfDigits = buffer.readUInt8(0);
    const arrayIncludesZero = buffer.readUInt8(1) === 1;
    const scale = buffer.readFloatLE(2);
    const translate = buffer.readFloatLE(6);

    for (
        let chunkIndex = 0;
        chunkIndex < (buffer.length - headerOffset) / 8;
        chunkIndex++
    ) {
        const bigIntValue = buffer.readBigUInt64LE(
            headerOffset + chunkIndex * 8,
        );

        const chunk = bigIntToChunk(bigIntValue, {
            numberOfDigits: maxNumberOfDigits,
        });

        for (let i = 0; i < chunk.length; i++) {
            let value = chunk[i];

            if (arrayIncludesZero) {
                value -= 1;
            }

            array.push(value / scale - translate);
        }
    }

    return array;
};
