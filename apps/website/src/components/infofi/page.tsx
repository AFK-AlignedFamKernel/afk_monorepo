'use client';
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
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  Fade,
} from '@chakra-ui/react';
import { FaUser, FaBullhorn, FaCoins, FaStar, FaVoteYea } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { IconType } from 'react-icons/lib';
import { logClickedEvent } from '@/services/analytics';

export default function InfoFiPageComponent() {
  const bg = useColorModeValue('gray.50', 'gray.800');
  const { isOpen, onToggle } = useDisclosure();
  const delay = useBreakpointValue({ base: 0.2, md: 0.1 });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Container maxW="container.lg" py={16}>
      {/* HERO */}
      <VStack spacing={6} textAlign="center">
        <Fade in={mounted} delay={delay}>
          <Heading size="2xl" lineHeight="shorter">
            Own Your Attention. Earn from Influence.
          </Heading>
        </Fade>

        <Fade in={mounted} delay={delay}>
          <Text fontSize="xl" color="gray.600" maxW="720px">
            AFK is building InfoFi — the fair, open marketplace for attention, trends, and content.
            Powered by Ethereum, Bitcoin, Starknet, and Nostr.
          </Text>
        </Fade>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4} pt={4}>
          <Button colorScheme="green" size="lg"
          onClick={() => {
            logClickedEvent('infofi_page_create_your_profile_click');
          }}
          >
            <Link href="https://afk-community.xyz/app/login" target="_blank"
            onClick={() => {
              logClickedEvent('infofi_page_create_your_profile_link_click');
            }}
            >
              Create Your Profile
            </Link>
          </Button>
          <Button variant="outline" colorScheme="green" size="lg"
          onClick={() => {
            logClickedEvent('infofi_page_learn_more_click');
          }}
          >
            <Link href="https://docs.afk-community.xyz/docs/market/infofi" target="_blank"
            onClick={() => {
              logClickedEvent('infofi_page_learn_more_link_click');
            }}
            >
              Learn More
            </Link>
          </Button>
        </Stack>
      </VStack>

      {/* WHO BENEFITS */}
      <Box mt={24}>
        <Heading size="lg" textAlign="center" mb={10}>
          Who is InfoFi For?
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          <Fade in={mounted}>
            <BenefitBlock
              icon={FaUser}
              title="Users"
              description="Discover meaningful content, support niche creators, and earn from curating trends you believe in."
            />
          </Fade>
          <Fade in={mounted} delay={0.1}>
            <BenefitBlock
              icon={FaStar}
              title="Creators"
              description="Earn based on the real value of your ideas, not platform bias. Get tipped, ranked, and rewarded."
            />
          </Fade>
          <Fade in={mounted} delay={0.2}>
            <BenefitBlock
              icon={FaBullhorn}
              title="Businesses"
              description="Sponsor trends transparently. Align your brand with voices that truly matter in culture and innovation."
            />
          </Fade>
        </SimpleGrid>
      </Box>

      {/* INFOFI LOOP */}
      <Box mt={24} textAlign="center">
        <Heading size="lg" mb={4}>
          🔁 How InfoFi Works
        </Heading>
        <Text fontSize="md" color="gray.600" maxW="600px" mx="auto">
          InfoFi turns attention into capital — fairly. No algorithm games, just a loop where value
          flows directly.
        </Text>
        <Text fontSize="md" color="gray.600" maxW="600px" mx="auto">
          Leaderboard of most influencial content creator for a project/topic.
        </Text>
        <Flex direction="column" align="center" mt={10}>
          <Box maxW="600px" bg={bg} p={6} rounded="xl" shadow="lg">
            <Stack spacing={4} textAlign="left" fontSize="md">
              <Text>📥 1. Creators register their Nostr profile</Text>
              <Text>👍 2. Users vote or tip based on merit</Text>
              <Text>🧠 3. Vaults + AI + DAO score the profiles</Text>
              <Text>💸 4. Rewards are distributed every epoch</Text>
              <Text>📣 5. Businesses can sponsor top topics or profiles</Text>
            </Stack>
          </Box>
        </Flex>
      </Box>

      {/* WHY IT MATTERS */}
      <Box mt={24}>
        <Heading size="lg" mb={8} textAlign="center">
          ✨ Why InfoFi Matters
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <FeatureBlock
            icon={FaCoins}
            title="Transparent Monetization"
            description="No more platform cuts or shadow algorithms. Tips and votes go straight to the creator."
          />
          <FeatureBlock
            icon={FaVoteYea}
            title="Community-Governed Trends"
            description="Users decide what matters. Algorithms amplify — but don’t control — attention."
          />
        </SimpleGrid>
      </Box>

      {/* CTA */}
      <Box mt={32} textAlign="center">
        <Heading size="lg">🧬 Join the Sovereign Internet Layer</Heading>
        <Text mt={4} fontSize="md" color="gray.600">
          Co-create a new economic layer for knowledge, ideas, and influence. One that’s fair, open,
          and rewards participation.
        </Text>
        <Stack mt={6} direction="row" spacing={4} justify="center">
          <Button colorScheme="green" size="lg"
          onClick={() => {
            logClickedEvent('infofi_page_start_now_click');
          }}
          >
            <Link href="https://afk-community.xyz/" target="_blank"
            onClick={() => {
              logClickedEvent('infofi_page_start_now_link_click');
            }}
            >
              Start Now
            </Link>
          </Button>
          <Button variant="outline" colorScheme="green" size="lg"
          onClick={() => {
            logClickedEvent('infofi_page_read_the_docs_click');
          }}
          >
            <Link href="https://docs.afk-community.xyz" target="_blank"
              onClick={() => {
                logClickedEvent('infofi_page_read_the_docs_link_click');
              }}
            >
              Read the Docs
            </Link>
          </Button>
        </Stack>
      </Box>

      {/* FOOTER */}
      <Box mt={20} pt={10} borderBottom="1px solid" borderColor="gray.200" textAlign="center">
        <Text fontSize="sm" color="gray.500">
          🚀 Built with Ethereum · Bitcoin · Starknet · Nostr
        </Text>
        <Text fontSize="xs" mt={1} color="gray.400">
          © {new Date().getFullYear()} AFK — The Aligned Fam Kingdom
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
      {icon && <Icon as={icon} boxSize={6} mt={1} color="green.500" />}
      <Box>
        <Heading size="sm">{title}</Heading>
        <Text color="gray.600">{description}</Text>
      </Box>
    </Stack>
  );
}

function BenefitBlock({
  icon,
  title,
  description,
}: {
  icon?: IconType;
  title: string;
  description: string;
}) {
  return (
    <VStack spacing={3} align="center" textAlign="center">
      {icon && <Icon as={icon} boxSize={10} color="green.400" />}
      <Heading size="md">{title}</Heading>
      <Text fontSize="sm" color="gray.600" maxW="280px">
        {description}
      </Text>
    </VStack>
  );
}
