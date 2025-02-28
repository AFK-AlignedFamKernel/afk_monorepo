import { useAccount, useContract, useSendTransaction } from '@starknet-react/core';
import { daoAA } from 'afk-abi';
import { CairoCustomEnum } from 'starknet';

export const useAddProposal = (daoAddress: `0x${string}`) => {
  const { account } = useAccount();

  const { contract } = useContract({ abi: daoAA.ABI, address: daoAddress });
  const { send, isPending, isSuccess } = useSendTransaction({});

  const addProposal = async (name: string) => {
    if (!daoAddress || !contract || !account) return;

    // TODO need to be customizable by user
    const proposal_type = new CairoCustomEnum({ Proposal: undefined });
    const proposal_automated_transaction = new CairoCustomEnum({ Transfer: undefined });

    const proposalParams = {
      content: name,
      proposal_type,
      proposal_automated_transaction,
    };

    // TODO send real calldata
    const calldata = [
      {
        to: '0x0',
        selector: '0x0',
        calldata: [],
      },
    ];

    send([contract.populate('create_proposal', [proposalParams, calldata])]);
  };

  return {
    addProposal,
    isPending,
    isSuccess,
  };
};
