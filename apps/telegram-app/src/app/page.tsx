import {Box, Text} from '@chakra-ui/react';

import {Footer} from './components/Footer';
import {Navbar} from './components/Navbar';

export default function App() {
  return (
    <Box className="min-h-screen w-full relative bg-black text-white">
      <Navbar />
      <Box
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Box>
          <Text>AFK telegram app coming soon</Text>
          <Text>Stay tuned and follow us!</Text>
          <Text>LFG</Text>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
