export function generateClientMetadata({
  pickedSourceAsset,
  estDollarValue
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
      symbol: pickedSourceAsset.symbol.toUpperCase()
    },
    selectedPaymentMethodInfo: {
      paymentMethod: "card",
      title: "Debit or Credit",
      description: "",
      meta: {}
    }
  };
}
