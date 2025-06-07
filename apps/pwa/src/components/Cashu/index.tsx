'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CashuWallet } from './CashuWallet';
import { CashuBalance } from './CashuBalance';
import { CashuActions } from './CashuActions';
import { CashuTransactions } from './CashuTransactions';
import { CashuNoMint } from './CashuNoMint';
import { CashuSendModal } from './modals/CashuSendModal';
import { CashuReceiveModal } from './modals/CashuReceiveModal';
import { CashuSettingsModal } from './modals/CashuSettingsModal';
import { CashuMintModal } from './modals/CashuMintModal';
import { CashuTransactionDetailsModal } from './modals/CashuTransactionDetailsModal';
import { useCashu } from '@/hooks/useCashu';
import { useCashuStore, useCashu as useCashuSDK, useNostrContext, useAuth } from 'afk_nostr_sdk';
import { useUIStore } from '@/store/uiStore';
import { getWalletData, proofsApi, saveWalletData, Transaction } from '@/utils/storage';
import { Icon } from '../small/icon-component';
import { getDecodedToken, MeltQuoteState } from '@cashu/cashu-ts';
import { proofsByMintApi, proofsSpentsByMintApi } from '@/utils/storage';

export default function Cashu() {
  const {
    loading,
    error,
    mints,
    activeMint,
    activeUnit,
    balance,
    transactions,
    addMint,
    setActiveMint,
    setActiveUnit,
    getBalance,
    createInvoice,
    receiveToken,
    createSendToken,
    payLightningInvoice,
    checkWalletReadiness,
    checkInvoiceStatus,
    checkInvoicePaymentStatus,
    setBalance,
    calculateBalanceFromProofs,
  } = useCashu();

  const { ndkCashuWallet, ndk, ndkWallet } = useNostrContext()

  const { wallet, } = useCashuSDK();

  // Direct access to the Cashu store from SDK
  const { setMintUrl } = useCashuStore();

  // UI store for toast messages
  const { showToast, showModal, hideModal } = useUIStore();

  const [activeTab, setActiveTab] = useState<'mints' | 'cashu' | 'transactions'>('transactions');
  const [currentBalance, setCurrentBalance] = useState<number>(balance);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState<boolean>(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [walletReady, setWalletReady] = useState<boolean>(false);
  const [isLoadingProofs, setIsLoadingProofs] = useState<boolean>(false);

  const [checkWallet, setCheckWallet] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isOnboardingChecked, setIsOnboardingChecked] = useState<boolean>(false);

  // console.log("ndkCashuWallet balance", ndkCashuWallet?.balance)
  // console.log("ndkCashuWallet signer", ndkCashuWallet?.signer)


  useEffect(() => {
    if (typeof window !== 'undefined' && !isOnboardingChecked) {
      if (!localStorage.getItem("hasOnboardCashu") || localStorage.getItem("hasOnboardCashu") === "false") {
        localStorage.setItem("hasOnboardCashu", "true");
        showModal(<>
          <div className='flex flex-col gap-2 text-left'>
            <h1 className='text-lg font-bold'> Cashu wallet</h1>
            <p className='text-sm'>This is a beta version of Cashu wallet.</p>
            <p className='text-sm italic'>Use at your own risk. Only use a small amount of funds for testing. </p>
            <p className='text-sm'>We are not responsible for any loss of funds, and we don't have an audit about this Cashu client code at the moment.</p>
            <p className='text-sm'>Cashu is a decentralized cash system that allows you to send and receive cash without intermediaries.</p>
            <p className='text-sm'>You can use this wallet to send and receive cash and lightning invoices without intermediaries.</p>

            <button className='bg-blue-500 text-white px-4 py-2 rounded-md' onClick={() => {
              if (localStorage) {
                localStorage?.setItem("hasOnboardCashu", "true");
              }
              hideModal();
              setIsOnboardingChecked(true)
            }}>I understand</button>
          </div>
        </>)
      }
      setIsOnboardingChecked(true);
    }

   
  }, [isInitialized, isOnboardingChecked])

  const { publicKey } = useAuth();
  useEffect(() => {
    if (checkWallet && publicKey) {
      setCheckWallet(true);
      initWalletNdk();
    }

  }, [activeMint, setActiveMint, checkWallet, publicKey])

  async function initWalletNdk() {

    try {

      if (!activeMint) return;

      if (ndkCashuWallet?.mints?.includes(activeMint)) return;
      if (ndkCashuWallet) {
        ndkCashuWallet.mints = [activeMint]
      }
      const wallet = await ndkCashuWallet?.getCashuWallet(activeMint);
      console.log("wallet", wallet)

      if (!wallet) {
        setWalletReady(false);

      } else {

        // REQUIRED: Publish the wallet's mint list for token/nutzap reception
        await ndkCashuWallet?.publish();
        setWalletReady(true);
      }
      // if (wallet) {
      //   setWalletReady(true);
      // } else {
      //   setWalletReady(false);
      // }
    } catch (error) {
      console.error('Error initializing wallet:', error);
      // setWalletReady(false);
      // showToast({
      //   message: 'Wallet Initialization Error',
      //   type: 'error',
      //   description: error instanceof Error ? error.message : 'Unknown error during wallet initialization'
      // });
    }
    finally {
      setCheckWallet(false);
    }
  }


  // Initialize wallet connection on mount or when active mint changes
  useEffect(() => {
    // Don't re-initialize if already checking or if no mint is selected
    if (!activeMint) return;

    // Store initialization status in ref to prevent multiple calls
    let isInitializing = false;

    async function initializeWallet() {
      // Prevent concurrent initialization calls
      if (isInitializing) return;
      isInitializing = true;

      try {
        setIsBalanceLoading(true);
        setIsLoadingProofs(true);
        console.log('Initializing wallet connection to mint:', activeMint);

        // Check if wallet is ready
        const readinessCheck = await checkWalletReadiness(activeMint);
        console.log("readinessCheck")

        setWalletReady(readinessCheck.ready);

        if (readinessCheck.ready) {
          console.log('Wallet is ready for operations');
          // Update balance
          // const currentBalance = await getBalance();
          // console.log("currentBalance", currentBalance);
          // setCurrentBalance(currentBalance);
        } else {
          try {
            const readinessCheck = await checkWalletReadiness(activeMint);
            console.log("readinessCheck")
            setWalletReady(readinessCheck.ready);
            if (readinessCheck.ready) {
              showToast({
                message: 'Wallet Connected',
                type: 'success'
              });
            } else {
              showToast({
                message: 'Connection Failed',
                type: 'error',
                description: readinessCheck.error
              });
            }
          } catch (err) {
            console.error('Reconnection error:', err);
            console.error('Wallet initialization failed:', readinessCheck.error);
            showToast({
              message: 'Wallet Connection Failed',
              type: 'error',
              description: 'Could not establish wallet connection. Please check your mint settings.'
            });
          } finally {
            setIsBalanceLoading(false);
          }

        }
      } catch (err) {
        console.error('Error initializing wallet:', err);
        setWalletReady(false);
        showToast({
          message: 'Wallet Initialization Error',
          type: 'error',
          description: err instanceof Error ? err.message : 'Unknown error during wallet initialization'
        });
      } finally {
        setIsBalanceLoading(false);
        setIsLoadingProofs(false);
        isInitializing = false;
      }
    }

    initializeWallet();
    // initWalletNdk();

    // This effect should only run when the activeMint changes, not on every render
    // or when related functions change their references
  }, [activeMint]);

  // Fetch current balance
  useEffect(() => {
    if (activeMint && activeUnit && !isInitialized) {
      setIsBalanceLoading(true);
      getBalance()
        .then(balance => {
          setCurrentBalance(balance);
          setIsInitialized(true);
        })
        .catch(err => {
          console.error('Error fetching balance:', err);
        })
        .finally(() => {
          setIsBalanceLoading(false);
        });
    }
  }, [activeMint, activeUnit, getBalance, balance]);

  // Update balance from wallet data
  useEffect(() => {
    setCurrentBalance(balance);
  }, [balance]);

  // Add function to calculate balance from proofs
  // const calculateBalanceFromProofs = async (mintUrl: string) => {
  //   try {
  //     // Get active proofs for the mint
  //     const activeProofs = await proofsByMintApi.getByMintUrl(mintUrl);

  //     // Calculate total from active proofs
  //     const activeBalance = activeProofs.reduce((sum, proof) => sum + (proof.amount || 0), 0);

  //     // Get spent proofs for the mint
  //     const spentProofs = await proofsSpentsByMintApi.getByMintUrl(mintUrl);

  //     // Calculate total from spent proofs
  //     const spentBalance = spentProofs.reduce((sum, proof) => sum + (proof.amount || 0), 0);

  //     // Update the balance in the store
  //     const newBalance = activeBalance - spentBalance;
  //     console.log("newBalance", newBalance);
  //     setBalance(newBalance);
  //     setCurrentBalance(newBalance);

  //     return newBalance;
  //   } catch (error) {
  //     console.error('Error calculating balance from proofs:', error);
  //     return 0;
  //   }
  // };

  // Update balance calculation when active mint changes
  useEffect(() => {
    if (activeMint) {
      calculateBalanceFromProofs(activeMint);
    }
  }, [activeMint]);

  // // Update balance after transactions
  // useEffect(() => {
  //   if (activeMint) {
  //     calculateBalanceFromProofs(activeMint);
  //   }
  // }, [transactions]);

  // Handle creating a lightning invoice
  const handleCreateInvoice = async (amount: number) => {
    if (!amount || amount <= 0) {
      console.error('Invalid amount for invoice creation');
      showToast({
        message: 'Invalid amount',
        type: 'error',
        description: 'Please enter a valid amount greater than 0'
      });
      return null;
    }

    try {
      // Verify wallet is ready before proceeding
      if (!walletReady) {
        console.log('Checking wallet readiness before invoice creation');
        const readinessCheck = await checkWalletReadiness(activeMint);
        if (!readinessCheck.ready) {
          showToast({
            message: 'Wallet not ready',
            type: 'error',
            description: 'Please check mint connection and try again'
          });
          return null;
        }
        setWalletReady(true);
      }

      if (!activeMint) {
        showToast({
          message: 'No mint selected',
          type: 'error',
          description: 'Please add and select a mint first'
        });
        return null;
      }

      console.log(`Creating invoice for ${amount} sats using mint: ${activeMint}`);

      // Single attempt with proper error handling
      const invoiceResult = await createInvoice(activeMint, amount).catch(err => {
        console.error('Error creating invoice:', err);
        showToast({
          message: 'Invoice creation failed',
          type: 'error',
          description: err instanceof Error ? err.message : 'Could not generate Lightning invoice'
        });
        return null;
      });

      if (!invoiceResult || !invoiceResult.invoice) {
        console.error('No valid invoice returned from createInvoice');
        showToast({
          message: 'Invoice generation failed',
          type: 'error',
          description: 'Could not generate a valid Lightning invoice'
        });
        return null;
      }

      // Log the payment hash information for debugging
      console.log('Invoice payment hash:', invoiceResult.paymentHash);
      console.log('Full invoice result:', invoiceResult);

      // The modal will now handle displaying the created invoice
      // We don't close it so the user can see and share the invoice

      // Success toast notification
      showToast({
        message: 'Invoice created',
        type: 'success',
        description: `Share this invoice to receive ${amount} sats`
      });

      return invoiceResult;
    } catch (err) {
      console.error('Invoice creation error:', err);

      showToast({
        message: 'Invoice generation error',
        type: 'error',
        description: err instanceof Error ? err.message : 'Failed to create invoice'
      });

      return null;
    }
  };

  // Handle modal opening/closing
  const handleOpenSendModal = () => setIsSendModalOpen(true);
  const handleCloseSendModal = () => setIsSendModalOpen(false);
  const handleOpenReceiveModal = () => setIsReceiveModalOpen(true);
  const handleCloseReceiveModal = () => setIsReceiveModalOpen(false);
  const handleOpenSettingsModal = () => setIsSettingsModalOpen(true);
  const handleCloseSettingsModal = () => setIsSettingsModalOpen(false);
  const handleOpenMintModal = (defaultMint?: string) => {
    setIsMintModalOpen(true);
    if (defaultMint) {
      setActiveMint(defaultMint);
    }
  }
  const handleCloseMintModal = () => {
    setIsMintModalOpen(false);

    if (activeTab === "mints") {
      setActiveTab("transactions")
    }
  }

  // Handle adding a new mint
  const handleAddMint = async (mintUrl: string, alias: string) => {
    if (!mintUrl) return;

    try {
      await addMint(mintUrl, alias);
      handleCloseMintModal();

      showToast({
        message: 'Mint added successfully',
        type: 'success',
        description: alias || mintUrl
      });

      await setActiveMint(mintUrl);
    } catch (err) {
      console.error('Error adding mint:', err);
      showToast({
        message: 'Failed to add mint',
        type: 'error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  // Handle changing a mint
  const handleChangeMint = async (mintUrl: string) => {
    if (!mintUrl) return;

    try {
      setIsBalanceLoading(true);
      await setActiveMint(mintUrl);

      // Also verify that we can connect to it
      const readinessCheck = await checkWalletReadiness(mintUrl);
      setWalletReady(readinessCheck.ready);

      if (readinessCheck.ready) {
        showToast({
          message: 'Mint selected',
          type: 'success',
          description: mints.find(mint => mint.url === mintUrl)?.alias || mintUrl
        });
      } else {
        showToast({
          message: 'Warning: Mint connection issue',
          type: 'warning',
          description: 'Selected mint may not be functioning correctly'
        });
      }
    } catch (err) {
      console.error('Error changing mint:', err);
      showToast({
        message: 'Error changing mint',
        type: 'error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Handle sending token
  const handleSendToken = async (amount: number) => {
    // Verify wallet is ready first
    if (!walletReady) {
      const readinessCheck = await checkWalletReadiness(activeMint);
      if (!readinessCheck.ready) {
        showToast({
          message: 'Wallet not ready',
          type: 'error',
          description: 'Please check mint connection and try again'
        });
        return null;
      }
      setWalletReady(true);
    }

    try {
      // Check if there are any tokens to spend
      if (balance <= 0) {
        showToast({
          message: 'No tokens available',
          type: 'error',
          description: 'You need to receive tokens first before you can send them'
        });
        throw new Error('No tokens available to send. Please receive some tokens first.');
      }

      const token = await createSendToken(amount);
      console.log('Generated token:', token);

      // Don't close the modal - allow the modal to handle display
      // The modal will stay open to display the token for user to copy

      return token; // Return token data to the modal
    } catch (err) {
      console.error('Error creating send token:', err);

      // Check for specific errors about missing proofs/tokens
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('No tokens available') ||
        errorMessage.includes('reduce') ||
        errorMessage.includes('undefined')) {
        showToast({
          message: 'No tokens available',
          type: 'warning',
          description: 'You need to receive tokens first before you can send them'
        });
      } else {
        showToast({
          message: 'Failed to create token',
          type: 'error',
          description: errorMessage
        });
      }
      return null;
    }
  };

  // Handle receiving token
  const handleReceiveToken = async (token: string) => {
    try {
      // First validate the token format
      if (!token.startsWith('cashu')) {
        throw new Error('Invalid token format: token must start with "cashu"');
      }

      // Try to decode the token to get mint information
      const decodedToken = getDecodedToken(token);
      console.log("decodedToken", decodedToken)
      if (!decodedToken) {
        throw new Error('Could not decode token');
      }

      // Check if the token's mint matches our active mint
      if (decodedToken.mint && decodedToken.mint !== activeMint) {
        showToast({
          message: 'Mint mismatch',
          type: 'warning',
          description: 'This token was issued by a different mint. Please switch to the correct mint to receive it.'
        });
        return false;
      }

      // Try to receive the token
      // const received = await ndkCashuWallet?.receiveToken(token)
      // console.log("received", received)

      // if (!ndkCashuWallet?.signer) {
      //   showToast({
      //     message: 'Wallet not ready',
      //     type: 'error',
      //     description: 'Please check mint connection and try again'
      //   });
      //   return false;
      // }

      let result;
      if (ndkCashuWallet?.signer) {
        const res = await ndkCashuWallet?.receiveToken(token)
        // const res = await receiveToken(token);
        console.log("res", res)
        // res?.proofs.map(proof => {
        //   console.log("proof", proof)
        // })

        result = res;

        if (result?.proofs && result.proofs.length > 0) {
          try {
            // Save proofs to IndexedDB
            await proofsApi.setAll(result.proofs);
            // Recalculate balance after saving proofs

            const walletData = await getWalletData();

            const newBalance = walletData.balance + result.proofs.reduce((sum, proof) => sum + (proof.amount || 0), 0);

            saveWalletData({
              ...walletData,
              balance: newBalance
            });
            console.log("walletData", walletData)
            // await calculateBalanceFromProofs(activeMint);
          } catch (storageError) {
            console.error('Error saving proofs to storage:', storageError);
            showToast({
              message: 'Error saving proofs',
              type: 'error',
              description: 'The token was received but there was an error saving it to storage'
            });
          }
        }
      } else {
        const res = await receiveToken(token);
        result = res;
      }

      if (!result) {
        const res = await receiveToken(token);
        console.log("res", res)
        result = res;
      }
      // Recalculate balance after receiving token
      // if (activeMint) {
      //   await calculateBalanceFromProofs(activeMint);
      // }

      if (!result) {
        return showToast({
          message: "Received ecash error",
          type: "error"
        })
      }

      handleCloseReceiveModal();

      showToast({
        message: 'Token received',
        type: 'success'
      });
      return true;
    } catch (error) {
      console.error('Error receiving token:', error);

      // Handle specific error cases
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('no outputs provided')) {
        showToast({
          message: 'Mint out of outputs',
          type: 'error',
          description: 'The mint currently has no outputs available. Please try again later or contact the mint operator.'
        });
      } else if (errorMessage.includes('invalid')) {
        showToast({
          message: 'Invalid token',
          type: 'error',
          description: 'The token format is invalid or corrupted'
        });
      } else if (errorMessage.includes('spent')) {
        showToast({
          message: 'Token already spent',
          type: 'error',
          description: 'This token has already been spent'
        });
      } else {
        showToast({
          message: 'Failed to receive token',
          type: 'error',
          description: errorMessage
        });
      }
      return false;
    }
  };

  // Handle paying invoice
  const handlePayInvoice = async (invoice: string) => {
    // Verify wallet is ready first
    if (!walletReady) {
      const readinessCheck = await checkWalletReadiness(activeMint);
      if (!readinessCheck.ready) {
        showToast({
          message: 'Wallet not ready',
          type: 'error',
          description: 'Please check mint connection and try again'
        });
        return null;
      }
      setWalletReady(true);
    }

    try {
      const res = await payLightningInvoice(invoice);

      console.log("res", res)
      if (res && res?.success) {
        // Recalculate balance after successful payment
        // if (activeMint) {
        //   await calculateBalanceFromProofs(activeMint);
        // }

        handleCloseSendModal();
        showToast({
          message: 'Invoice paid',
          type: 'success'
        });
        return true;
      }

      showToast({
        message: 'Invoice not paid',
        type: 'error',
        description: 'Please check your invoice and try again'
      });
      return false;
    } catch (err) {
      console.error('Error paying invoice:', err);

      // Check if this is a "Token already spent" error
      if (err instanceof Error && err.message.includes('Token was already spent')) {
        // Recalculate balance even if there was an error
        // if (activeMint) {
        //   await calculateBalanceFromProofs(activeMint);
        // }
        // Let the modal handle this specific error
        throw err;
      }

      showToast({
        message: 'Failed to pay invoice',
        type: 'error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
      return false;
    }
  };


  // Handle checking payment status
  const handleCheckPaymentInvoice = async (_transaction: Transaction) => {
    let transaction = _transaction;


    if (!transaction) {
      console.error('Cannot check payment: no transaction provided');
      return;
    }

    setIsLoadingProofs(true);
    if (!transaction?.mintUrl) {
      transaction.mintUrl = activeMint;
    }

    if (!transaction?.amount) {
      transaction.amount = 0;
    }

    if (!transaction?.status) {
      transaction.status = "pending"
    }
    try {
      // Verify wallet is ready first
      if (!walletReady) {
        const readinessCheck = await checkWalletReadiness(activeMint);
        if (!readinessCheck.ready) {
          throw new Error('Wallet not ready - please check mint connection');
        }
        setWalletReady(true);
      }

      console.log('Checking payment for transaction:', transaction);

      // Check if this is a Lightning invoice with a payment hash or quote
      if (transaction.paymentHash || transaction?.invoice && transaction?.invoiceType === 'lightning' || transaction.quote) {
        // Use the proper checkInvoicePaymentStatus function that handles all details
        const result = await checkInvoicePaymentStatus(transaction);
        console.log('Payment verification result:', result);

        if (result.paid) {
          showToast({
            message: 'Payment confirmed',
            type: 'success',
            description: `${transaction.amount} ${activeUnit || 'sats'} have been added to your wallet`
          });
        } else if (result.error) {
          showToast({
            message: 'Error checking payment',
            type: 'error',
            description: result.error
          });
        } else {
          showToast({
            message: 'Payment not detected',
            type: 'warning',
            description: 'This invoice has not been paid yet'
          });
        }

        return result;
      }
      // For other types of quotes (tokens etc.)
      else if (transaction.token || transaction.invoiceType) {
        // Display info about token transactions
        setTimeout(() => {
          showToast({
            message: 'Token status checked',
            type: 'info',
            description: 'This is a token transaction'
          });
        }, 500);

        return { checked: true, status: 'complete' };
      }
      else {
        showToast({
          message: 'Cannot check status',
          type: 'error',
          description: 'This transaction type does not support status checking'
        });
      }
    } catch (err) {
      console.error('Error checking payment/quote:', err);
      showToast({
        message: 'Error checking status',
        type: 'error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
      return null;
    } finally {
      setIsCheckingPayment(false);
      setIsLoadingProofs(false);
    }
  };
  // Handle checking payment status
  const handleCheckPayment = async (transaction: Transaction) => {
    if (!transaction) {
      console.error('Cannot check payment: no transaction provided');
      return;
    }

    console.log("transaction", transaction)

    setIsCheckingPayment(true);
    setSelectedTransaction(transaction);
    setIsLoadingProofs(true);

    try {
      // Verify wallet is ready first
      if (!walletReady) {
        const readinessCheck = await checkWalletReadiness(activeMint);
        if (!readinessCheck.ready) {
          throw new Error('Wallet not ready - please check mint connection');
        }
        setWalletReady(true);
      }

      console.log('Checking payment for transaction:', transaction);

      // Check if this is a Lightning invoice with a payment hash or quote
      if (transaction.paymentHash || transaction?.invoice && transaction?.invoiceType === 'lightning' || transaction.quote) {
        // Use the proper checkInvoicePaymentStatus function that handles all details
        const result = await checkInvoicePaymentStatus(transaction);
        console.log('Payment verification result:', result);

        if (result.paid) {
          showToast({
            message: 'Payment confirmed',
            type: 'success',
            description: `${transaction.amount} ${activeUnit || 'sats'} have been added to your wallet`
          });
        } else if (result.error) {
          showToast({
            message: 'Error checking payment',
            type: 'error',
            description: result.error
          });
        } else {
          showToast({
            message: 'Payment not detected',
            type: 'warning',
            description: 'This invoice has not been paid yet'
          });
        }

        return result;
      }
      // For other types of quotes (tokens etc.)
      else if (transaction.token || transaction.invoiceType) {
        // Display info about token transactions
        setTimeout(() => {
          showToast({
            message: 'Token status checked',
            type: 'info',
            description: 'This is a token transaction'
          });
        }, 500);

        return { checked: true, status: 'complete' };
      }
      else {
        showToast({
          message: 'Cannot check status',
          type: 'error',
          description: 'This transaction type does not support status checking'
        });
      }
    } catch (err) {
      console.error('Error checking payment/quote:', err);
      showToast({
        message: 'Error checking status',
        type: 'error',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
      return null;
    } finally {
      setIsCheckingPayment(false);
      setIsLoadingProofs(false);
    }
  };

  // Show transaction details
  const handleShowTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  return (
    <>
      <CashuWallet onOpenSettings={handleOpenSettingsModal}>
        {walletReady && !loading && mints.length > 0 && activeMint ? (
          <>
            <CashuBalance
              balance={isBalanceLoading ? 0 : currentBalance}
              unit={activeUnit || 'sat'}
              mintAlias={mints.find(mint => mint.url === activeMint)?.alias || activeMint}
              onChangeMint={handleOpenMintModal}
            />
            <CashuActions
              onSend={handleOpenSendModal}
              onReceive={handleOpenReceiveModal}
            />

            {/* {isLoadingProofs && (
              <div className="cashu-wallet__loading-proofs">
                <div className="cashu-wallet__loading-spinner"></div>
                <p>Loading tokens into wallet...</p>
              </div>
            )}
             */}
            {/* {balance <= 0 && !isLoadingProofs && (
              <div className="cashu-wallet__guidance-message">
                <p>You have no tokens yet. Click "Receive" to get some ecash tokens or create a Lightning invoice to load your wallet.</p>
                <button
                  className="cashu-wallet__button cashu-wallet__button--text"
                  onClick={handleOpenReceiveModal}
                >
                  Receive Tokens First →
                </button>
              </div>
            )} */}

            <div className="cashu-wallet__tabs gap-2">
              <button className={`cashu-wallet__tab ${activeTab === 'transactions' ? 'cashu-wallet__tab--active' : ''}`} onClick={() => setActiveTab('transactions')}>
                Transactions
              </button>
              <button className={`cashu-wallet__tab ${activeTab === 'mints' ? 'cashu-wallet__tab--active' : ''}`} onClick={() => setActiveTab('mints')}>
                Mints
              </button>
            </div>
            {activeTab === 'transactions' && (
              <CashuTransactions
                transactions={transactions}
                onCheckPayment={handleCheckPayment}
                onTransactionClick={handleShowTransactionDetails}
              />
            )}
            {activeTab === "mints" &&
              <CashuMintModal
                onClose={handleCloseMintModal}
                mints={mints}
                activeMint={activeMint}
                onChangeMint={handleChangeMint}
                onOpenSettings={handleOpenSettingsModal}
                onAddMint={handleAddMint}

              ></CashuMintModal>
            }
          </>
        ) : loading ? (
          <div className="cashu-wallet__loading">Loading wallet...</div>
        ) : !activeMint || mints.length === 0 ? (
          <CashuNoMint onAddMint={handleOpenMintModal} />
        ) : !walletReady && activeMint ? (
          <div className="cashu-wallet__error">
            <h3>Wallet Connection Issue</h3>
            <p>Cannot connect to mint: {activeMint}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="cashu-wallet__button cashu-wallet__button--primary"
                onClick={async () => {
                  setIsBalanceLoading(true);
                  try {
                    const readinessCheck = await checkWalletReadiness(activeMint);
                    setWalletReady(readinessCheck.ready);
                    if (readinessCheck.ready) {
                      showToast({
                        message: 'Wallet Connected',
                        type: 'success'
                      });
                    } else {
                      showToast({
                        message: 'Connection Failed',
                        type: 'error',
                        description: readinessCheck.error
                      });
                    }
                  } catch (err) {
                    console.error('Reconnection error:', err);
                  } finally {
                    setIsBalanceLoading(false);
                  }
                }}
              >
                {isBalanceLoading ? 'Connecting...' : 'Reconnect'}
              </button>
              <button
                className="cashu-wallet__button cashu-wallet__button--secondary"
                onClick={handleOpenSettingsModal}
              >
                Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="cashu-wallet__error">
            <h3>Error loading wallet</h3>
            <p>{error}</p>
            <button
              className="cashu-wallet__button cashu-wallet__button--primary"
              onClick={handleOpenSettingsModal}
            >
              Check Settings
            </button>
          </div>
        )}
      </CashuWallet>

      {/* Modals */}
      {isReceiveModalOpen && (
        <CashuReceiveModal
          onClose={handleCloseReceiveModal}
          mint={activeMint || ''}
          unit={activeUnit || 'sat'}
          onReceiveToken={handleReceiveToken}
          onCreateInvoice={handleCreateInvoice}
          onCheckPayment={handleCheckPaymentInvoice}

        />
      )}

      {isSendModalOpen && (
        <CashuSendModal
          onClose={handleCloseSendModal}
          balance={currentBalance}
          unit={activeUnit || 'sat'}
          onSendToken={handleSendToken}
          onPayInvoice={handlePayInvoice}
          activeMint={activeMint || ''}
          activeUnit={activeUnit || 'sat'}
        />
      )}

      {isSettingsModalOpen && (
        <CashuSettingsModal
          onClose={handleCloseSettingsModal}
          mints={mints}
          activeMint={activeMint}
          activeUnit={activeUnit}
          onAddMint={handleOpenMintModal}
          onChangeMint={handleChangeMint}
          onChangeUnit={setActiveUnit}
        />
      )}

      {isMintModalOpen && (
        <CashuMintModal
          onClose={handleCloseMintModal}
          mints={mints}
          activeMint={activeMint}
          onChangeMint={handleChangeMint}
          onOpenSettings={handleOpenSettingsModal}
          onAddMint={handleAddMint}
        />
      )}

      {/* Transaction Details Modal */}

      {selectedTransaction && (
        <CashuTransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onCheckPayment={isCheckingPayment ? null : handleCheckPayment}
          isCheckingPayment={isCheckingPayment}
        />
      )}
    </>
  );
}
