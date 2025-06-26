export const useWebln = () => {
  const handleWebln = async () => {
    if (window.webln) {
      try {
        await window.webln.enable();
        const invoice = await window.webln.makeInvoice({
          amount: 1000,
          defaultMemo: 'React Native Zap',
        });
      } catch (error) {}
    } else {
    }
  };

  const handleGetBalance = async () => {
    if (window.webln) {
      try {
        await window.webln.enable();
        // let connected = await window.webln.isEnabled()
        // if(!connected) {

        // }
        // const invoice = await window?.webln?.getBalance();
      } catch (error) {}
    } else {
    }
  };

  const handleMakeInvoice = async (amount: number, memo?: string) => {
    if (window.webln) {
      try {
        await window.webln.enable();
        const invoice = await window.webln.makeInvoice({
          amount: amount ?? 1000,
          defaultMemo: memo ?? 'React Native Zap',
        });
      } catch (error) {}
    } else {
    }
  };

  return {
    handleGetBalance,
    handleMakeInvoice,
    handleWebln,
  };
};
