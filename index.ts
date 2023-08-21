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
        // E.g. chunk [1, 2, 3, 4] => 1234
        const chunk = chunks[chunkIndex];
        let value = 0n;
        for (let i = 0; i < chunk.length; i++) {
            value +=
                BigInt(chunk[chunk.length - 1 - i]) *
                (10n ** BigInt(maxNumberOfDigits)) ** BigInt(i);
        }
        buffer.writeBigUInt64LE(value, headerOffset + chunkIndex * 8);
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
        const value = buffer
            .readBigUInt64LE(headerOffset + chunkIndex * 8)
            .toString();

        for (
            let i = 0;
            i <
            Math.floor(value.length / maxNumberOfDigits) * maxNumberOfDigits;
            i += maxNumberOfDigits
        ) {
            let number = parseInt(value.slice(i, i + maxNumberOfDigits), 10);
            if (arrayIncludesZero) {
                number -= 1;
            }
            array.push(number / scale - translate);
        }
    }

    return array;
};

const numberOfDigits = (number: number) => Math.floor(Math.log10(number)) + 1;

const chunk = ({
    array,
    chunkLength,
}: {
    array: number[];
    chunkLength: number;
}) => {
    let chunkedArray = [] as Array<typeof array>;
    for (let i = 0; i < array.length; i++) {
        const chunkIndex = Math.floor(i / chunkLength);
        if (!chunkedArray[chunkIndex]) {
            chunkedArray[chunkIndex] = [];
        }
        chunkedArray[chunkIndex].push(array[i]);
    }
    return chunkedArray;
};
