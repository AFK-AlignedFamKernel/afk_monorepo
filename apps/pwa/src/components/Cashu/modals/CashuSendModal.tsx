import React, { useState } from 'react';
import { Icon } from '../../small/icon-component';
import { useUIStore } from '@/store/uiStore';
import QRCode from 'react-qr-code';
import { useAtomiqLab } from '@/hooks/atomiqlab';
import { useCashu } from '@/hooks/useCashu';
interface CashuSendModalProps {
  onClose: () => void;
  balance: number;
  unit: string;
  onSendToken: (amount: number) => Promise<any>;
  onPayInvoice: (invoice: string) => Promise<any>;
}

export const CashuSendModal: React.FC<CashuSendModalProps> = ({
  onClose,
  balance,
  unit,
  onSendToken,
  onPayInvoice,
}) => {
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'lightning' | 'ecash'>('ecash');
  const [amount, setAmount] = useState<string>('');
  const [invoice, setInvoice] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [showQR, setShowQR] = useState<boolean>(false);
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [type, setType] = useState<"CASHU" | "STRK">("CASHU")

  const { decodeInvoiceAmount } = useCashu();

  const { handlePayInvoice: handlePayInvoiceAtomiq } = useAtomiqLab();

  const handleTabChange = (tab: 'lightning' | 'ecash') => {
    setActiveTab(tab);
    // Reset the generated token when switching tabs
    setGeneratedToken('');
    setShowQR(false);
  };

  const handleSendEcash = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const result = await onSendToken(Number(amount));
      if (result && result.token) {
        // Extract token from result, handle different response formats
        let tokenToDisplay = result.token;

        // Make sure we have a string representation of the token
        if (typeof tokenToDisplay !== 'string') {
          try {
            if (tokenToDisplay.encode) {
              tokenToDisplay = tokenToDisplay.encode();
            } else {
              tokenToDisplay = JSON.stringify(tokenToDisplay);
            }
          } catch (err) {
            console.error('Error encoding token for display:', err);
            tokenToDisplay = JSON.stringify(tokenToDisplay);
          }
        }

        console.log('Token to display:', tokenToDisplay);
        setGeneratedToken(tokenToDisplay);
        setTokenAmount(Number(amount));
        showToast({
          message: 'Ecash token created',
          type: 'success',
          description: `${amount} ${unit}`
        });
      } else {
        throw new Error('Failed to generate token');
      }
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Failed to send ecash';
      let messageTitle = 'Error creating token';
      let messageType = 'error' as 'error' | 'warning' | 'info';

      // Handle Lightning-based balance error specifically
      if (errorMessage.includes('Lightning-based balances cannot be directly sent')) {
        messageTitle = 'Lightning Balance';
        messageType = 'info';
        errorMessage = 'Lightning-based balances cannot be sent directly as tokens. To send tokens, first receive some ecash tokens, or create a Lightning invoice to withdraw your balance.';
      }
      // Check for other specific error messages
      else if (errorMessage.includes('No tokens available') ||
        errorMessage.includes('reduce') ||
        errorMessage.includes('Cannot read properties of undefined')) {
        errorMessage = 'You need to receive tokens first before you can send them. Please use the Receive tab to get some ecash tokens.';
      }

      showToast({
        message: messageTitle,
        type: messageType,
        description: errorMessage
      });
      console.error('Error sending ecash:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayLightningInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (type == "STRK") {
        await handlePayInvoiceAtomiq(invoice);
        showToast({
          message: 'Payment successful',
          type: 'success',
          description: 'Lightning invoice paid'
        });
      } else {
        try {
          const res = await onPayInvoice(invoice);
          console.log(res);
          if (res.status === "success") {
            onClose(); // Close modal on success for payments
            showToast({
              message: 'Payment successful',
              type: 'success',
              description: 'Lightning invoice paid'
            });
            onClose(); // Close modal on success for payments
          } else {
            showToast({
              message: 'Payment failed',
              type: 'error',
              description: res.message
            });
          }
        } catch (err) {
          // Check if this is a "Token already spent" error
          if (err instanceof Error && err.message.includes('Token was already spent')) {
            showToast({
              message: 'Token already spent',
              type: 'warning',
              description: 'The balance has been updated to reflect spent tokens'
            });
            onClose(); // Close modal since we've handled the error
          } else {
            // Handle other errors
            const errorMessage = err instanceof Error ? err.message : 'Failed to pay invoice';
            showToast({
              message: 'Payment failed',
              type: 'error',
              description: errorMessage
            });
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pay invoice';
      showToast({
        message: 'Payment failed',
        type: 'error',
        description: errorMessage
      });
      console.error('Error paying invoice:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToken = async () => {
    if (!generatedToken) return;

    try {
      await navigator.clipboard.writeText(generatedToken);
      setIsCopied(true);
      showToast({
        message: 'Copied to clipboard',
        type: 'success'
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      showToast({
        message: 'Copy failed',
        type: 'error',
        description: 'Could not copy to clipboard'
      });
    }
  };

  const toggleQRCode = () => {
    setShowQR(!showQR);
  };

  const handleCreateNewToken = () => {
    setGeneratedToken('');
    setAmount('');
    setShowQR(false);
  };

  const downloadQRCode = () => {
    if (!showQR) return;

    const svg = document.getElementById('ecash-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `ecash-${tokenAmount}-${unit}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="cashu-wallet__modal">
      <div className="cashu-wallet__modal-content">
        <div className="cashu-wallet__modal-content-header">
          <h3 className="cashu-wallet__modal-content-header-title">Send</h3>
          <button
            className="cashu-wallet__modal-content-header-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="CloseIcon" size={24} />
          </button>
        </div>

        <div className="cashu-wallet__tabs">
          <div
            className={`cashu-wallet__tabs-item ${activeTab === 'lightning' ? 'cashu-wallet__tabs-item--active' : ''}`}
            onClick={() => handleTabChange('lightning')}
          >
            Lightning
          </div>
          <div
            className={`cashu-wallet__tabs-item ${activeTab === 'ecash' ? 'cashu-wallet__tabs-item--active' : ''}`}
            onClick={() => handleTabChange('ecash')}
          >
            Ecash
          </div>
        </div>

        <div className="cashu-wallet__modal-content-body">
          {activeTab === 'lightning' && (
            <form onSubmit={handlePayLightningInvoice}>

              <div className="cashu-wallet__form-group">
                <label className="cashu-wallet__form-group-label">
                  Payment Type
                </label>
                <div className="cashu-wallet__form-group-radio-container">
                  <label className="cashu-wallet__form-group-radio">
                    <input
                      type="radio"
                      name="paymentType"
                      value="CASHU"
                      checked={type === "CASHU"}
                      onChange={() => setType("CASHU")}
                    />
                    <span>Lightning (Cashu)</span>
                  </label>
                  <label className="cashu-wallet__form-group-radio">
                    <input
                      type="radio"
                      name="paymentType"
                      value="STRK"
                      checked={type === "STRK"}
                      onChange={() => setType("STRK")}
                    />
                    <span>Lightning (STRK)</span>
                  </label>
                </div>
              </div>
              <div className="cashu-wallet__form-group">
                <label className="cashu-wallet__form-group-label">
                  Invoice
                </label>
                <textarea
                  className="cashu-wallet__form-group-textarea"
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  placeholder="Paste Lightning Invoice"
                  required
                />
              </div>

              <div className="cashu-wallet__form-group">
                <small className="cashu-wallet__form-group-label">
                  Amount ({unit})
                </small>
                <small>Available balance: {balance} {unit}</small>
              </div>


              {invoice && (
                <div className="cashu-wallet__form-group">
                  <label className="cashu-wallet__form-group-label">
                    Amount
                  </label>
                  {decodeInvoiceAmount(invoice)}
                </div>
              )}

              <button
                type="submit"
                className="cashu-wallet__button cashu-wallet__button--primary"
                disabled={isProcessing || !invoice}
              >
                {isProcessing ? 'Processing...' : 'Pay Invoice'}
              </button>
            </form>
          )}

          {activeTab === 'ecash' && !generatedToken && (
            <form onSubmit={handleSendEcash}>
              <div className="cashu-wallet__form-group">
                <label className="cashu-wallet__form-group-label">
                  Amount ({unit})
                </label>
                <input
                  type="number"
                  className="cashu-wallet__form-group-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max={String(balance)}
                  placeholder="Amount to send"
                  required
                />
                <small>Available balance: {balance} {unit}</small>
              </div>

              <button
                type="submit"
                className="cashu-wallet__button cashu-wallet__button--primary"
                disabled={isProcessing || !amount || Number(amount) > balance}
              >
                {isProcessing ? 'Processing...' : 'Generate Ecash Token'}
              </button>
            </form>
          )}

          {activeTab === 'ecash' && generatedToken && (
            <div className="cashu-wallet__token-result">
              <div className="cashu-wallet__token-info">
                <h4>Ecash Token Generated</h4>
                <div className="cashu-wallet__token-amount">
                  {tokenAmount} {unit}
                </div>
              </div>

              <div className="cashu-wallet__form-group">
                <label className="cashu-wallet__form-group-label">
                  Token
                </label>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <textarea
                    className="cashu-wallet__form-group-textarea"
                    value={generatedToken}
                    readOnly
                    style={{
                      paddingRight: '40px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      minHeight: '80px',
                      whiteSpace: 'nowrap',
                      overflowX: 'auto'
                    }}
                  />
                  <button
                    onClick={handleCopyToken}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    aria-label="Copy"
                  >
                    <Icon name={isCopied ? "CheckIcon" : "CopyIcon"} size={20} />
                  </button>
                </div>
              </div>

              <div className="cashu-wallet__token-actions">
                <button
                  className="cashu-wallet__button cashu-wallet__button--secondary"
                  onClick={toggleQRCode}
                >
                  {showQR ? 'Hide QR Code' : 'Show QR Code'}
                </button>

                <button
                  className="cashu-wallet__button cashu-wallet__button--primary"
                  onClick={handleCreateNewToken}
                >
                  Create New Token
                </button>
              </div>

              {showQR && (
                <div style={{
                  marginTop: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  padding: '16px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div style={{
                    marginBottom: '12px',
                    color: '#000000',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>💸 Ecash Token</span>
                    <span>{tokenAmount} {unit}</span>
                  </div>

                  <QRCode
                    id="ecash-qr-code"
                    value={generatedToken}
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    level="M"
                  />

                  <button
                    onClick={downloadQRCode}
                    className="cashu-wallet__button cashu-wallet__button--secondary"
                    style={{ marginTop: '12px' }}
                  >
                    Download QR Code
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 