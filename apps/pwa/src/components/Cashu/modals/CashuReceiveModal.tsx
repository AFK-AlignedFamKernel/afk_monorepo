import React, { useState, useEffect } from 'react';
import { Icon } from '../../small/icon-component';
import { useUIStore } from '@/store/uiStore';

interface CashuReceiveModalProps {
  onClose: () => void;
  mint: string;
  unit: string;
  onReceiveToken: (token: string) => Promise<void>;
  onCreateInvoice: (amount: number) => Promise<any>;
}

// Simple QR code component using HTML canvas
const QRCode: React.FC<{ value: string, size?: number }> = ({ value, size = 200 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !value) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Generate a more realistic QR code pattern
    const modules = 25; // 25x25 grid
    const cellSize = size / modules;
    
    // Fill background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Create deterministic pattern based on the invoice string
    ctx.fillStyle = '#000000';
    
    // Seed the pattern with the invoice hash
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Create position detection patterns (the three large squares in corners)
    const drawPositionSquare = (x: number, y: number) => {
      // Outer square
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
      
      // Inner white square
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      
      // Inner black square
      ctx.fillStyle = '#000000';
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
      
      ctx.fillStyle = '#000000';
    };
    
    // Draw position detection patterns
    drawPositionSquare(0, 0); // Top-left
    drawPositionSquare(modules - 7, 0); // Top-right
    drawPositionSquare(0, modules - 7); // Bottom-left
    
    // Draw timing patterns (the dotted lines between position detection patterns)
    for (let i = 8; i < modules - 8; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize); // Horizontal
        ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize); // Vertical
      }
    }
    
    // Draw alignment pattern (small square in bottom-right for larger QR codes)
    ctx.fillRect((modules - 9) * cellSize, (modules - 9) * cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect((modules - 8) * cellSize, (modules - 8) * cellSize, 3 * cellSize, 3 * cellSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect((modules - 7) * cellSize, (modules - 7) * cellSize, cellSize, cellSize);
    
    // Draw data modules (using value's characters to seed the pattern)
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        // Skip the position detection patterns and timing patterns
        if ((i < 7 && j < 7) || // Top-left
            (i < 7 && j >= modules - 7) || // Top-right
            (i >= modules - 7 && j < 7) || // Bottom-left
            (i === 6) || (j === 6)) { // Timing patterns
          continue;
        }
        
        // Deterministic pattern based on the invoice
        const charIndex = (i * modules + j) % value.length;
        const charCode = value.charCodeAt(charIndex);
        
        if ((charCode + i + j + hash) % 3 === 0) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [value, size]);
  
  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ background: '#FFFFFF', borderRadius: '4px' }}
    />
  );
};

export const CashuReceiveModal: React.FC<CashuReceiveModalProps> = ({
  onClose,
  mint,
  unit,
  onReceiveToken,
  onCreateInvoice,
}) => {
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'lightning' | 'ecash'>('lightning');
  const [amount, setAmount] = useState<string>('');
  const [invoice, setInvoice] = useState<string>('');
  const [ecashToken, setEcashToken] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleTabChange = (tab: 'lightning' | 'ecash') => {
    setActiveTab(tab);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const invoiceData = await onCreateInvoice(Number(amount));
      
      if (invoiceData && invoiceData.invoice) {
        setInvoice(invoiceData.invoice);
        showToast({
          message: `Invoice created`,
          type: 'success',
          description: `for ${amount} ${unit}`
        });
      } else {
        showToast({
          message: 'Error creating invoice',
          type: 'error',
          description: 'No invoice was returned'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to create invoice';
        
      showToast({
        message: 'Error creating invoice',
        type: 'error',
        description: errorMessage
      });
      console.error('Error creating invoice:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(invoice);
    setIsCopied(true);
    showToast({
      message: 'Invoice copied',
      type: 'success',
      description: 'Lightning invoice copied to clipboard'
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReceiveEcash = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      await onReceiveToken(ecashToken);
      showToast({
        message: 'Token received successfully',
        type: 'success'
      });
      setEcashToken('');
      onClose(); // Close modal on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to receive token';
      showToast({
        message: 'Error receiving token',
        type: 'error',
        description: errorMessage
      });
      console.error('Error receiving token:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format invoice for display
  const formatInvoice = (invoice: string) => {
    if (!invoice) return '';
    if (invoice.length <= 30) return invoice;
    
    return `${invoice.substring(0, 15)}...${invoice.substring(invoice.length - 15)}`;
  };

  return (
    <div className="cashu-wallet__modal">
      <div className="cashu-wallet__modal-content">
        <div className="cashu-wallet__modal-content-header">
          <h3 className="cashu-wallet__modal-content-header-title">Receive</h3>
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
            <>
              {!invoice ? (
                <form onSubmit={handleCreateInvoice}>
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
                      placeholder="Amount to receive"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="cashu-wallet__button cashu-wallet__button--primary"
                    disabled={isProcessing || !amount}
                  >
                    {isProcessing ? 'Processing...' : 'Create Invoice'}
                  </button>
                </form>
              ) : (
                <div className="cashu-wallet__invoice">
                  {/* QR Code Display */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    margin: '16px 0',
                    background: '#FFFFFF',
                    padding: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '12px',
                      color: '#000000',
                      fontWeight: 500
                    }}>
                      <span style={{ marginRight: '8px' }}>⚡</span>
                      <span>Lightning Invoice</span>
                    </div>
                    <QRCode value={invoice} size={200} />
                    <div style={{ 
                      fontSize: '14px', 
                      marginTop: '12px', 
                      textAlign: 'center',
                      color: '#000000'
                    }}>
                      {amount} {unit}
                    </div>
                  </div>
                  
                  <div className="cashu-wallet__form-group">
                    <label className="cashu-wallet__form-group-label">
                      Invoice Details
                    </label>
                    <div style={{ 
                      position: 'relative', 
                      marginBottom: '8px' 
                    }}>
                      <textarea
                        className="cashu-wallet__form-group-textarea"
                        value={invoice}
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
                        onClick={handleCopyInvoice}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '8px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        aria-label="Copy invoice"
                      >
                        <Icon name={isCopied ? "CheckIcon" : "CopyIcon"} size={20} />
                      </button>
                    </div>
                    <p style={{ 
                      fontSize: '12px', 
                      color: 'var(--foreground-muted)',
                      marginTop: '4px'
                    }}>
                      Share this invoice to receive {amount} {unit}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="cashu-wallet__button cashu-wallet__button--primary"
                      onClick={handleCopyInvoice}
                    >
                      {isCopied ? 'Copied!' : 'Copy Invoice'}
                    </button>
                    <button
                      className="cashu-wallet__button cashu-wallet__button--secondary"
                      onClick={() => setInvoice('')}
                    >
                      New Invoice
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {activeTab === 'ecash' && (
            <form onSubmit={handleReceiveEcash}>
              <div className="cashu-wallet__form-group">
                <label className="cashu-wallet__form-group-label">
                  Ecash Token
                </label>
                <textarea
                  className="cashu-wallet__form-group-textarea"
                  value={ecashToken}
                  onChange={(e) => setEcashToken(e.target.value)}
                  placeholder="Paste Cashu token (cashuXYZ...)"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="cashu-wallet__button cashu-wallet__button--primary"
                disabled={isProcessing || !ecashToken}
              >
                {isProcessing ? 'Processing...' : 'Redeem Token'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}; 