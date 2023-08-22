import { expect, expectTypeOf, it, test } from 'vitest';
import { encodeArray, decodeArray } from './index';

test('Typescript types', () => {
  expectTypeOf(encodeArray([1])).toEqualTypeOf<Buffer>();

  expectTypeOf(
    encodeArray([1], { returnType: 'buffer' }),
  ).toEqualTypeOf<Buffer>();

  expectTypeOf(
    encodeArray([1], { returnType: 'string' }),
  ).toEqualTypeOf<string>();
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
  const array = Array(100).fill(Number.MAX_SAFE_INTEGER);
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

it('should encode and decode arrays of numbers with different amounts of digits', () => {
  const array = [1, 2, 34, 567, 8999];
  expect(decodeArray(encodeArray(array))).toEqual(array);
});

it('should encode and decode arrays of numbers with different amounts of digits containing zeros', () => {
  const array = [0, 1, 10, 100, 101, 110, 111];
  expect(decodeArray(encodeArray(array))).toEqual(array);
});

it('should encode and decode arrays of negative numbers when a proper "preTransform.scale" value is provided', () => {
  const array = [-10.123456789, -20.123456789, -30.56789];
  expect(
    decodeArray(encodeArray(array, { preTransform: { scale: -100 } })),
  ).toEqual([-10.12, -20.12, -30.57]);
});

it('should encode and decode arrays of negative numbers when a proper "preTransform.translate" value is provided', () => {
  const array = [-10, -20, -30];

  expect(
    decodeArray(encodeArray(array, { preTransform: { translate: 30 } })),
  ).toEqual(array);

  expect(() =>
    encodeArray(array, { preTransform: { translate: 29 } }),
  ).toThrow();
});
