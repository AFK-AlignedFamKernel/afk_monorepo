// components/ConvertToETH.tsx
import {Box, Button, Input, Spinner, Text} from '@chakra-ui/react';
import axios from 'axios';
import {useEffect, useState} from 'react';

const ConvertToETH: React.FC = () => {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [usdAmount, setUsdAmount] = useState<string>('');
  const [ethAmount, setEthAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch ETH price from CoinGecko API
  useEffect(() => {
    const fetchEthPrice = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        );
        setEthPrice(response.data.ethereum.usd);
      } catch (error) {
        console.error('Error fetching ETH price:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEthPrice();
  }, []);

  // Calculate ETH amount based on entered USD amount
  const handleCalculate = () => {
    if (ethPrice && usdAmount) {
      const usd = parseFloat(usdAmount);
      setEthAmount(usd / ethPrice);
    }
  };

  return (
    <Box maxWidth="400px" mx="auto" p={5} borderWidth="1px" borderRadius="md" boxShadow="md">
      <Text fontSize="2xl" mb={4}>
        Convert USD to ETH
      </Text>
      {loading ? (
        <Spinner size="lg" />
      ) : (
        <>
          {ethPrice && <Text mb={2}>Current ETH Price: ${ethPrice.toFixed(2)} USD</Text>}
          <Input
            placeholder="Enter amount in USD"
            value={usdAmount}
            onChange={(e) => setUsdAmount(e.target.value)}
            mb={4}
          />
          <Button colorScheme="blue" onClick={handleCalculate}>
            Calculate
          </Button>
          {ethAmount !== null && <Text mt={4}>Equivalent in ETH: {ethAmount.toFixed(6)} ETH</Text>}
        </>
      )}
    </Box>
  );
};

export default ConvertToETH;
