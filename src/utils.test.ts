import { expect, it, test } from 'vitest';
import { describe } from 'vitest';
import * as utils from './utils';

describe('utils:chunk', () => {
  it('should chunk standard arrays correctly', () => {
    expect(utils.chunk({ array: [1, 2, 3, 4, 5], chunkLength: 2 })).toEqual([
      [1, 2],
      [3, 4],
      [5],
    ]);

    expect(utils.chunk({ array: [1, 2, 3, 4, 5], chunkLength: 1 })).toEqual([
      [1],
      [2],
      [3],
      [4],
      [5],
    ]);
  });

  it('should return an empty array when chunking an empty array', () => {
    expect(utils.chunk({ array: [], chunkLength: 2 })).toEqual([]);
    expect(utils.chunk({ array: [], chunkLength: 3 })).toEqual([]);
  });

  it('should throw an error when chunking an array with an invalid chunk length', () => {
    expect(() =>
      utils.chunk({ array: [1, 2, 3], chunkLength: 1 / 2 }),
    ).toThrow();

    expect(() => utils.chunk({ array: [1, 2, 3], chunkLength: -1 })).toThrow();

    expect(() => utils.chunk({ array: [1, 2, 3], chunkLength: 0 })).toThrow();

    expect(() => utils.chunk({ array: [1, 2, 3], chunkLength: NaN })).toThrow();

    expect(() =>
      utils.chunk({
        array: [1, 2, 3],
        chunkLength: Number.POSITIVE_INFINITY,
      }),
    ).toThrow();

    expect(() =>
      utils.chunk({
        array: [1, 2, 3],
        chunkLength: Number.NEGATIVE_INFINITY,
      }),
    ).toThrow();
  });
});

describe('utils:numberOfDigits', () => {
  it('should return the correct number of digits', () => {
    expect(utils.numberOfDigits(0)).toBe(1);
    expect(utils.numberOfDigits(1)).toBe(1);
    expect(utils.numberOfDigits(-1)).toBe(1);
    expect(utils.numberOfDigits(10)).toBe(2);
    expect(utils.numberOfDigits(-10)).toBe(2);
    expect(utils.numberOfDigits(100)).toBe(3);
    expect(utils.numberOfDigits(-100)).toBe(3);
  });
});

describe('utils:chunkToBigInt, utils:bigIntToChunk', () => {
  it('should return the correct bigint', () => {
    expect(utils.chunkToBigInt([1, 2, 3], { numberOfDigits: 1 })).toBe(123n);

    expect(utils.chunkToBigInt([10, 11, 20, 22], { numberOfDigits: 2 })).toBe(
      1_11_02_22n,
    );

    expect(utils.chunkToBigInt([10, 20, 300], { numberOfDigits: 3 })).toBe(
      10_020_003n,
    );

    expect(utils.chunkToBigInt([1, 20, 300], { numberOfDigits: 3 })).toBe(
      100_020_003n,
    );

    expect(
      utils.bigIntToChunk(
        utils.chunkToBigInt([1, 2, 3], { numberOfDigits: 1 }),
        { numberOfDigits: 1 },
      ),
    ).toEqual([1, 2, 3]);

    expect(
      utils.bigIntToChunk(
        utils.chunkToBigInt([10, 20, 30], { numberOfDigits: 2 }),
        { numberOfDigits: 2 },
      ),
    ).toEqual([10, 20, 30]);

    expect(
      utils.bigIntToChunk(
        utils.chunkToBigInt([1, 22, 3], { numberOfDigits: 2 }),
        { numberOfDigits: 2 },
      ),
    ).toEqual([1, 22, 3]);

    expect(
      utils.bigIntToChunk(
        utils.chunkToBigInt([1, 22, 303], { numberOfDigits: 3 }),
        { numberOfDigits: 3 },
      ),
    ).toEqual([1, 22, 303]);

    expect(
      utils.bigIntToChunk(
        utils.chunkToBigInt([10, 20, 300], {
          numberOfDigits: 3,
        }),
        { numberOfDigits: 3 },
      ),
    ).toEqual([10, 20, 300]);
  });
});
