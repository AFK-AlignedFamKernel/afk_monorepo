
import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  Text,
  VStack,
  SimpleGrid,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";


export default function InfoFiPageComponent() {
  return (
    <Container maxW="container.lg" py={16}>
      <VStack spacing={10} textAlign="center">
        <Heading size="2xl">
          Own Your Attention. Earn from Influence.
        </Heading>
        <Text fontSize="xl">
          AFK is the InfoFi platform — a decentralized marketplace for content,
          trends, and reputation across Bitcoin, Ethereum, and Starknet.
        </Text>
        <Stack direction={{ base: "column", md: "row" }} spacing={4}>
          <Button colorScheme="purple" size="lg"
          // rightIcon={<ArrowForwardIcon />}
          >
            Join as User
          </Button>
          <Button variant="outline" colorScheme="purple" size="lg">
            Explore for Business
          </Button>
        </Stack>
      </VStack>

      <Box mt={20}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          <VStack>
            <Heading size="md">👤 Users</Heading>
            <Text>
              Vote, discover, and get rewarded for your engagement. Shape the
              trends you care about.
            </Text>
          </VStack>

          <VStack>
            <Heading size="md">🎨 Creators</Heading>
            <Text color="gray.600">
              Get visibility through merit. Earn from tips, vault rewards, and
              build your reputation.
            </Text>
          </VStack>

          <VStack>
            <Heading size="md">💼 Businesses</Heading>
            <Text color="gray.600">
              Sponsor real topics and creators. Influence transparently and
              engage real communities.
            </Text>
          </VStack>
        </SimpleGrid>
      </Box>

      <Box mt={16} textAlign="center">
        <Text fontSize="sm" color="gray.500">
          ✨ Powered by Ethereum · Bitcoin · Starknet · Nostr
        </Text>
      </Box>
    </Container>
  );
}
