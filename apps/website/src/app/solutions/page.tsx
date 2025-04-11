"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  Grid,
  Button,
  Icon,
  Container,
  Stack,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { FaLock, FaUserSecret, FaComments, FaGlobe } from "react-icons/fa";
import { Metadata } from "next";
const metadata: Metadata = {
  title: "AFK Solutions",
  description: "AFK is your all-in-one decentralized platform — combining social, payments, identity, and privacy into a seamless and sovereign experience.",
}
const MotionBox = motion(Box);

const features = [
  {
    icon: FaComments,
    title: "InfoFi: Attention & Knowledge",
    description: "A transparent, fair attention economy where users vote, creators earn, Vaults reward, and businesses engage — without platform gatekeeping.",
    href: "/infofi"
  },
  {
    icon: FaGlobe,
    title: "Uncensorable Social Layer",
    description: "Share freely with Nostr. Coming soon: X, Farcaster, and Lens integrations.",
    // href: "/features/social"
  },
  {
    icon: FaLock,
    title: "Integrated Payments",
    description: "Seamless Bitcoin, Ethereum, and Starknet transactions.",
    // href: "/features/payments"
  },

  // {
  //   icon: FaUserSecret,
  //   title: "Decentralized Identity",
  //   description: "zkDID on Starknet for self-sovereign identity.",
  //   // href: "/features/identity"
  // },
  // {
  //   icon: FaComments,
  //   title: "Encrypted Messaging",
  //   description: "Private chats and groups with end-to-end encryption.",
  //   href: "/features/messaging"
  // }
];

const sectors = [
  { sector: "Finance", problem: "Bankless payments, remittance", solution: "Lightning, USDC, Starknet bridge" },
  { sector: "Social Media", problem: "Censorship, deplatforming", solution: "Nostr + zkDID + relays" },
  { sector: "Insights & Knowledge", problem: "Censorship, gatekeeping", solution: "InfoFi market of Attention" },
  { sector: "Privacy", problem: "Surveillance, doxxing", solution: "Encrypted chat, stealth protocols" },
  // { sector: "Identity", problem: "Web2 login lock-in", solution: "zkDID + universal passport" },
];

export default function FeaturesPage() {
  // const bg = useColorModeValue("gray.50", "gray.900");

  return (
    <Box
      // bg={bg}
      minH="100vh"
    >
      <Navbar />
      <Container maxW="7xl" py={16}>
        <VStack
          // spacing={14}
          align="start">
          <MotionBox
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            w="full"
          >
            <Heading size="2xl" mb={4}>Explore AFK Features</Heading>
            <Text fontSize="xl" color="gray.500" maxW="3xl">
              AFK is your all-in-one decentralized platform — combining social, payments, identity, and privacy into a seamless and sovereign experience.
            </Text>
          </MotionBox>

          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={8} w="full">
            {features.map((feature, i) => (
              <MotionBox
                key={i}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                p={8}
                rounded="2xl"
                shadow="lg"
                // bg={useColorModeValue("white", "gray.800")}
                border="1px solid"
              // borderColor={useColorModeValue("gray.200", "gray.700")}
              >
                <Stack
                  // spacing={"10px"}
                  direction="row" align="center">
                  <Icon as={feature.icon} w={6} h={6} color="green.400" />
                  <Heading size="md">{feature.title}</Heading>
                </Stack>
                <Text mt={3} color="gray.500">{feature.description}</Text>

                {feature.href && (
                  <Link href={feature.href} passHref>
                    <Button mt={4} variant="solid" colorScheme="green">
                      Learn More
                    </Button>
                  </Link>
                )}
              </MotionBox>
            ))}
          </Grid>

          <MotionBox
            w="full"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <Heading size="xl" mb={6}>What We Solve</Heading>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
              {sectors.map((item, idx) => (
                <Box
                  key={idx}
                  p={6}
                  // bg={useColorModeValue("white", "gray.800")}
                  rounded="2xl"
                  shadow="md"
                  border="1px solid"
                // borderColor={useColorModeValue("gray.200", "gray.700")}
                >
                  <Text fontWeight="bold" fontSize="lg">{item.sector}</Text>
                  <Text mt={2}><strong>Problem:</strong> {item.problem}</Text>
                  <Text><strong>Solution:</strong> {item.solution}</Text>
                </Box>
              ))}
            </Grid>
          </MotionBox>

          <Box pt={12} w="full" textAlign="center">
            <Text
              rounded="full" px={10} py={6} fontSize="lg"
              fontWeight="bold"
              fontFamily="mono"
            >Ready to jump in?</Text>
            <Link href="https://afk-community.xyz" passHref
              target="_blank"
            >
              <Button size="lg"
                // colorScheme="b" 
                rounded="full" px={10} py={6} fontSize="lg">
                Join AFK
              </Button>
            </Link>
          </Box>

          {/* <Box pt={12} w="full" textAlign="center">
            <Link href="/about" passHref>
              <Button size="lg"
                // colorScheme="b" 
                rounded="full" px={10} py={6} fontSize="lg">
                Learn More About AFK
              </Button>
            </Link>
          </Box> */}
        </VStack>
      </Container>
      <Footer />
    </Box>
  );
}