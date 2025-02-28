import { useAccount, useContract, useSendTransaction } from '@starknet-react/core';
import { BigintIsh } from '@uniswap/sdk-core';
import { daoAA } from 'afk-abi';
import { CairoCustomEnum, CairoOption, CairoOptionVariant } from 'starknet';

enum UserVote {
  Yes,
  No,
  Abstention,
}

export const useAddProposal = (daoAddress: `0x${string}`) => {
  const { account } = useAccount();

  const { contract } = useContract({ abi: daoAA.ABI, address: daoAddress });
  const { send, isPending, isSuccess } = useSendTransaction({});

  const addProposal = async (proposalId: BigintIsh, vote: UserVote) => {
    if (!daoAddress || !contract || !account) return;

    const voteEnum = new CairoCustomEnum({ [UserVote[vote]]: undefined });
    const voteOption = new CairoOption<CairoCustomEnum>(CairoOptionVariant.Some, voteEnum);

    send([contract.populate('cast_vote', [proposalId, voteOption])]);
  };

  return {
    addProposal,
    isPending,
    isSuccess,
  };
};
