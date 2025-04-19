export const feltToAddress = (felt: bigint) => {
    const newStrB = Buffer.from(felt.toString(16), 'ascii');
    return `0x${newStrB.toString()}`;
  };