export const numberOfDigits = (number: number) =>
  number === 0 ? 1 : Math.floor(Math.log10(Math.abs(number))) + 1;

export const chunk = ({
  array,
  chunkLength,
}: {
  array: number[];
  chunkLength: number;
}) => {
  if (!Number.isSafeInteger(chunkLength) || chunkLength < 1) {
    throw new Error('The chunk length must be a finite number greater than 0');
  }

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

// Example for [10, 20, 300] and numberOfDigits 3: ["10", "20", "300"] => ["01", "02", "003"] (reversed) => ["010", "020", "003"] (added right padding) => 10_020_003n (joined converted to bigint)
export const chunkToBigInt = (
  numbers: number[],
  { numberOfDigits: inputNumberOfDigits }: { numberOfDigits: number },
): bigint => {
  const string = numbers
    .map(n => {
      const bigInt = BigInt(n);
      const reversedString = [...bigInt.toString()].reverse().join('');
      return reversedString.padEnd(inputNumberOfDigits, '0');
    })
    .join('');

  let value = 0n;
  for (let i = 0; i < string.length; i++) {
    value += BigInt(string[i]) * 10n ** BigInt(string.length - i - 1);
  }

  return value;
};

export const bigIntToChunk = (
  bigInt: bigint,
  { numberOfDigits }: { numberOfDigits: number },
): number[] => {
  let string = bigInt.toString();
  const mod = string.length % numberOfDigits;
  if (mod !== 0) {
    string =
      Array(numberOfDigits - mod)
        .fill('0')
        .join('') + string;
  }

  const numbers = [] as number[];
  // Example for 10_020_003n with numberOfDigits = 3
  for (let i = 0; i < string.length; i += numberOfDigits) {
    const subString = [...string.slice(i, i + numberOfDigits)] // [..."010"] or [..."020"] or [..."003"]
      .reverse() // ["0", "1", "0"] or ["0", "2", "0"] or ["3", "0", "0"]
      .join(''); // "010" or "020" or "300"
    numbers.push(Number(subString)); // 10 or 20 or 300
  }
  return numbers;
};
