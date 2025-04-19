export const feltToAddress = (felt: bigint) => {
  try {
    const newStrB = Buffer.from(felt.toString(16), 'ascii');
    return `0x${newStrB.toString()}`;
  } catch (error) {
    console.error("Error converting felt to address", error);
    return null;
  }
};