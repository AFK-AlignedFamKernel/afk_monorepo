export function generateClientMetadata({
  pickedSourceAsset,
  estDollarValue,
}: {
  pickedSourceAsset: any;
  estDollarValue: number;
}) {
  return {
    id: Math.random(),
    startTimestampMs: Date.now(),
    draftDollarValue: estDollarValue.toFixed(5),
    finalDollarValue: estDollarValue.toFixed(5),
    latestQuote: {},
    depositAddress: null,
    initSettings: {},
    isFastForwarded: false,
    selectedSourceAssetInfo: {
      address: pickedSourceAsset.address,
      chainId: pickedSourceAsset.networkId,
      symbol: pickedSourceAsset.symbol.toUpperCase(),
    },
    selectedPaymentMethodInfo: {
      paymentMethod: "card",
      title: "Debit or Credit",
      description: "",
      meta: {},
    },
  };
}

export function roundUpToFiveDecimalPlaces(inputNumber: string) {
  // Using toFixed to round up to 5 decimal places
  const multiplier = 10 ** 5;
  const roundedString = (
    Math.ceil(parseFloat(inputNumber) * multiplier) / multiplier
  ).toFixed(5);
  // Converting the rounded string back to a number
  const roundedNumber = parseFloat(roundedString);
  return roundedNumber;
}
