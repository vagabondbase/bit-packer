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
        throw new Error(
            'The chunk length must be a finite number greater than 0',
        );
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
