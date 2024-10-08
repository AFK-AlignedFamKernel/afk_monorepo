import {getEncodedToken, Proof, Token} from '@cashu/cashu-ts';
import {getProofs, useCashu} from 'afk_nostr_sdk';
import {useToast} from './modals';

export const usePayment = () => {
  const {meltTokens, wallet} = useCashu();

  const {showToast} = useToast();
  const handlePayInvoice = async (invoice?: string) => {
    if (!invoice) return undefined;
    const proofsLocalStr = getProofs();

    /** TODO add tx history for paid invoice/ecash */
    if (proofsLocalStr) {
      let proofsLocal: Proof[] = JSON.parse(proofsLocalStr);
      console.log('proofsLocal', proofsLocal);
      const proofsSpent = await wallet?.checkProofsSpent(proofsLocal);

      // Filter proofs to spent

      /** TODO better filter of proof based on keysets */
      console.log('proofsSpent', proofsSpent);

      let proofs = Array.from(proofsLocal && proofsLocal);

      if (proofsSpent) {
        proofs = proofs?.filter((p) => !proofsSpent?.includes(p));
        // proofs = Array.from(new Set([...proofsSpent, ...proofsLocal]))
      }
      const lenProof = proofs?.length;
      console.log('proofs', proofs);

      if (lenProof && proofs) {
        // proofs.slice(lenProof-3, lenProof)
        // const proofsKey  = proofs?.filter((p ) => p?.amount == )
        // const tokens = await meltTokens(invoice, proofs?.slice(lenProof - 1, lenProof))
        const tokens = await meltTokens(invoice, proofs?.slice(lenProof - 1, lenProof));
        console.log('tokens', tokens);
        showToast({
          title: 'Payment send',
          type: 'success',
        });
        return tokens;
      }
    } else {
      const tokens = await meltTokens(invoice);
      console.log('tokens', tokens);
      showToast({
        title: 'Payment send',
        type: 'success',
      });
      return tokens;
    }

    return [];
  };

  const handleGenerateEcash = async (amount: number) => {
    try {
      if (!amount) {
        showToast({title: 'Please add a mint amount', type: 'info'});
        return undefined;
      }

      if (!wallet) {
        showToast({title: 'Please connect your wallet', type: 'error'});
        return undefined;
      }

      const proofsLocal = getProofs();
      if (proofsLocal) {
        let proofs: Proof[] = JSON.parse(proofsLocal);

        const proofsSpent = await wallet?.checkProofsSpent(proofs);
        console.log('proofsSpent', proofsSpent);

        proofs = proofs?.filter((p) => {
          if (!proofsSpent?.includes(p)) {
            return p;
          }
        });
        console.log('proofs', proofs);
        const proofsToUsed: Proof[] = [];
        const totalAmount = proofs.reduce((s, t) => (s += t.amount), 0);
        console.log('totalAmount', totalAmount);

        let amountCounter = 0;
        for (let p of proofs?.reverse()) {
          amountCounter += p?.amount;
          proofsToUsed.push(p);

          if (amountCounter >= amount) {
            break;
          }
        }

        const sendCashu = await wallet?.send(amount, proofsToUsed);
        console.log('sendCashu', sendCashu);

        if (sendCashu) {
          const keysets = await wallet?.mint?.getKeySets();
          // unit of keysets
          let unit = keysets?.keysets[0].unit;

          const token = {
            token: [{proofs: proofsToUsed, mint: wallet?.mint?.mintUrl}],
            unit: unit,
          } as Token;
          console.log('keysets', keysets);
          console.log('proofsToUsed', proofsToUsed);
          console.log('token', token);

          const cashuToken = getEncodedToken(token);
          console.log('cashuToken', cashuToken);
          // setCashuTokenCreated(cashuToken)

          showToast({title: 'Cashu created', type: 'success'});

          return cashuToken;
        }
        return undefined;
      }

      return undefined;
    } catch (e) {
      console.log('Error generate cashu token', e);
      showToast({title: 'Error when generate cashu token', type: 'error'});
      return undefined;
    }
  };

  return {
    handlePayInvoice,
    handleGenerateEcash,
  };
};
