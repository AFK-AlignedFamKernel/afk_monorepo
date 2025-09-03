import { getCandlesticksByMemecoinAddress } from './launchpad.js';

// Simple test to verify the candlestick queries can be imported and called
describe('Candlestick Queries', () => {
  it('should export getCandlesticksByMemecoinAddress function', () => {
    expect(typeof getCandlesticksByMemecoinAddress).toBe('function');
  });

  it('should handle getCandlesticksByMemecoinAddress call without throwing', async () => {
    const testTokenAddress = '0x1234567890abcdef';
    
    // This will likely return empty array since the token doesn't exist
    // but it should not throw an error
    const result = await getCandlesticksByMemecoinAddress({
      memecoinAddress: testTokenAddress,
      intervalMinutes: 5,
      limit: 10,
    });
    
    expect(Array.isArray(result)).toBe(true);
  });
});
