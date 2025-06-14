import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  Text,
  VStack,
  SimpleGrid,
  Flex,
  Icon,
  Link,
} from '@chakra-ui/react';
import {FaUser, FaBullhorn, FaCoins, FaStar, FaVoteYea} from 'react-icons/fa';
import {IconType} from 'react-icons/lib';

export default function InfoFiPageComponent() {
  return (
    <Container maxW="container.lg" py={16}>
      <VStack spacing={10} textAlign="center">
        <Heading size="2xl">Own Your Attention. Earn from Influence.</Heading>
        <Text fontSize="xl">
          AFK is the InfoFi platform — a decentralized marketplace for content, trends, and
          reputation across Bitcoin, Ethereum, and Starknet.
        </Text>
        <Stack direction={{base: 'column', md: 'row'}} spacing={4}>
          <Button
            colorScheme="green"
            size="lg"
            // rightIcon={<ArrowForwardIcon />}
          >
            Join as User
          </Button>
          <Button variant="outline" colorScheme="green" size="lg">
            Explore for Business
          </Button>
        </Stack>
      </VStack>

      <Box mt={20}>
        <SimpleGrid columns={{base: 1, md: 3}} spacing={10}>
          <VStack>
            <Heading size="md">👤 Users</Heading>
            <Text>
              Vote, discover, and get rewarded for your engagement. Shape the trends you care about.
            </Text>
          </VStack>

          <VStack>
            <Heading size="md">🎨 Creators</Heading>
            <Text>
              Get visibility through merit. Earn from tips, vault rewards, and build your
              reputation.
            </Text>
          </VStack>

          <VStack>
            <Heading size="md">💼 Businesses</Heading>
            <Text>
              Sponsor real topics and creators. Influence transparently and engage real communities.
            </Text>
          </VStack>
        </SimpleGrid>
      </Box>

      <Box mt={24} textAlign="center">
        <Heading size="lg" mb={4}>
          🔁 The InfoFi Loop
        </Heading>
        <Text
          fontSize="md"
          // color="gray.600"
          maxW="600px"
          mx="auto"
        >
          A transparent, fair attention economy where users vote, creators earn, Vaults reward, and
          businesses engage — without platform gatekeeping.
        </Text>
        <Flex direction="column" align="center" mt={10}>
          <Box
            maxW="600px"
            //  bg="gray.50"
            bgColor="gray.50"
            color="gray.600"
            p={6}
            rounded="xl"
            shadow="md"
          >
            <Stack spacing={4} textAlign="left">
              <Text>📥 Creator posts to a Topic Vault</Text>
              <Text>👍 Users vote, tip, and engage</Text>
              <Text>🧠 DAO + AI score content & trends</Text>
              <Text>💰 Vault distributes rewards</Text>
              <Text>📣 Businesses sponsor content directly</Text>
              <Text>🔁 Everyone earns and participates</Text>
            </Stack>
          </Box>
        </Flex>
      </Box>

      <Box mt={24}>
        <Heading size="lg" mb={8} textAlign="center">
          ✨ Why InfoFi Matters
        </Heading>
        <SimpleGrid columns={{base: 1, md: 2}} spacing={8}>
          <FeatureBlock
            // icon={() => <FaCoins />}
            title="Transparent Monetization"
            description="Tips, votes, and Vaults turn content into capital — fairly."
          />
          <FeatureBlock
            // icon={() => <FaVoteYea />}
            title="Community-Governed Trends"
            description="Users and DAOs shape what matters. No centralized algorithm bias."
          />
        </SimpleGrid>
      </Box>

      <Box mt={32} textAlign="center">
        <Heading size="lg">🧬 Join the Sovereign Internet Layer</Heading>
        <Text mt={4} fontSize="md" color="gray.600">
          Become part of the open info economy. Help co-create a freer, fairer future for content,
          community, and capital.
        </Text>
        <Stack mt={6} direction="row" spacing={4} justify="center">
          <Button colorScheme="green" size="lg">
            <Link href="https://afk-community.xyz/app/login" target="_blank">
              Create Your Profile
            </Link>
          </Button>
          <Button variant="outline" colorScheme="green" size="lg">
            <Link href="https://docs.afk-community.xyz/docs/market/infofi" target="_blank">
              Learn More
            </Link>
          </Button>
        </Stack>
      </Box>

      <Box mt={16} textAlign="center">
        <Text fontSize="sm" color="gray.500">
          ✨ Powered by Ethereum · Bitcoin · Starknet · Nostr
        </Text>
      </Box>
    </Container>
  );
}

function FeatureBlock({
  icon,
  title,
  description,
}: {
  icon?: IconType;
  title: string;
  description: string;
}) {
  return (
    <Stack spacing={4} direction="row" align="start">
      {icon && <Icon as={icon} boxSize={6} mt={1} color="purple.500" />}
      <Box>
        <Heading size="sm">{title}</Heading>
        <Text color="gray.600">{description}</Text>
      </Box>
    </Stack>
  );
}
