// components/SendUSDCForm.tsx
import {Box, Button, Text, useToast} from '@chakra-ui/react';
import {useAccount as useAccountStarknet} from '@starknet-react/core';
import {useState} from 'react';
import {useAccount} from 'wagmi';

import {CustomConnectButtonWallet} from '../button/CustomConnectButtonWallet';
// import ConnectWithOtpView from '../dynamic/ConnectWithOtpView';
import CustomModal from '../modal';
import Account from './starknet/AccountStarknet';

const AccountManagement: React.FC = () => {
  const toast = useToast();
  const account = useAccount();
  const {account: accountStarknet} = useAccountStarknet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <Box maxWidth="400px" mx="auto" p={5} borderWidth="1px" borderRadius="md" boxShadow="md">
      {!account?.address && !accountStarknet?.address && (
        <Box>
          <Text>Connect you</Text>
          <Box display="flex">
            <Box>
              <Text>EVM</Text>
              <CustomConnectButtonWallet></CustomConnectButtonWallet>
            </Box>

            <Box>
              <Text>Starknet</Text>
              <Button
                onClick={() => {
                  // connectToStarknet()
                  openModal();
                }}
              >
                Connect
              </Button>
            </Box>

            <CustomModal
              isOpen={isModalOpen}
              onClose={closeModal}
              title="Sample Modal"
              footerContent={
                <Button colorScheme="green" onClick={closeModal}>
                  Confirm
                </Button>
              }
            >
              <Account></Account>
            </CustomModal>
          </Box>
        </Box>
      )}

      {/* <Box>
        <Text>Onboard in Web3 space</Text>
        <Box>
          <ConnectWithOtpView></ConnectWithOtpView>
        </Box>
      </Box> */}
    </Box>
  );
};

export default AccountManagement;
