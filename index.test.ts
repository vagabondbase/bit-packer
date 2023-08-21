import { expect, it, test } from 'vitest';
import { encodeArray, decodeArray } from './index';

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

it('should throw an error when encoding arrays with non-integers', () => {
    expect(() => encodeArray([1.1])).toThrow();
});

it('should throw an error when encoding arrays with negative numbers', () => {
    expect(() => encodeArray([-1])).toThrow();
});

it('should encode and decode an array of 1M numbers', () => {
    const array = Array(1_000_000).fill(12345);
    expect(decodeArray(encodeArray(array))).toEqual(array);
});

it('should encode and decode arrays of very large numbers', () => {
    const array = Array.from({ length: 100 }, (_, i) =>
        i < 50 ? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER - i,
    );
    expect(decodeArray(encodeArray(array))).toEqual(array);
});

it('should encode and decode arrays of numbers with same amounts of digits', () => {
    const arrays = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        [11, 22, 33, 44, 55, 66, 77, 89],
    ];

    for (const array of arrays) {
        expect(decodeArray(encodeArray(array))).toEqual(array);
    }
});

it('should encode and decode arrays of floats when multiplier is provided', () => {
    const array = [10.123456789, 20.123456789, 30.56789];
    expect(decodeArray(encodeArray(array, { multiplier: 100 }))).toEqual([
        10.12, 20.12, 30.57,
    ]);
});
