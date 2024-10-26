// components/SendUSDCForm.tsx
import { useState, useEffect } from 'react';
import { Box, Button, Input, Text, Stack, useToast, Select } from '@chakra-ui/react';
import { useSendTransaction, useAccount, useWriteContract } from 'wagmi';
import { useAccount as useAccountStarknet } from '@starknet-react/core';
import { CustomConnectButtonWallet } from '../../app/components/button/CustomConnectButtonWallet';
import Account from '../../app/components/button/starknet/AccountStarknet';
import CustomModal from '../../app/components/modal';
import ConnectWithOtpView from '../../app/components/dynamic/ConnectWithOtpView';

const AccountManagement: React.FC= () => {
  const toast = useToast();
  const account = useAccount()
  const { account: accountStarknet } = useAccountStarknet()
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <Box maxWidth="400px" mx="auto" p={5} borderWidth="1px" borderRadius="md" boxShadow="md">

      {!account?.address && !accountStarknet?.address
        &&

        <Box>
          <Text>

            Connect you
          </Text>
          <Box
            display="flex"
          >
            <Box>
              <Text>EVM</Text>
              <CustomConnectButtonWallet></CustomConnectButtonWallet>
            </Box>

            <Box>
              <Text>Starknet</Text>
              <Button onClick={() => {
                // connectToStarknet()
                openModal()
              }

              } >Connect</Button>
            </Box>

            <CustomModal
              isOpen={isModalOpen}
              onClose={closeModal}
              title="Sample Modal"
              footerContent={<Button colorScheme="green" onClick={closeModal}>Confirm</Button>}
            >
              <Account></Account>
            </CustomModal>

          </Box>

        </Box>

      }


      <Box>
        <Text>Onboard in Web3 space</Text>
        <Box>
        <ConnectWithOtpView></ConnectWithOtpView>
        </Box>
      </Box>

    </Box>
  );
};

export default AccountManagement;
