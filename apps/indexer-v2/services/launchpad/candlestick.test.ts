import { generateCandlesticks, generateCandlesticksAsync } from './candlestick.service';

// Simple test to verify the candlestick service can be imported and called
describe('Candlestick Service', () => {
  it('should export generateCandlesticks function', () => {
    expect(typeof generateCandlesticks).toBe('function');
  });

  it('should export generateCandlesticksAsync function', () => {
    expect(typeof generateCandlesticksAsync).toBe('function');
  });

  it('should call generateCandlesticksAsync without throwing', () => {
    const testTokenAddress = '0x1234567890abcdef';
    expect(() => {
      generateCandlesticksAsync(testTokenAddress);
    }).not.toThrow();
  });
});
