import React from 'react';
import { Box, Flex, Heading, Text, Button, VStack, HStack, Image } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <Box backgroundColor="#0d1117" color="#f0f6fc" fontFamily="'Inter', sans-serif">
            {/* Navigation Bar */}
            <Flex
                as="nav"
                justifyContent="space-between"
                alignItems="center"
                padding="20px 40px"
                backgroundColor="#161b22"
                boxShadow="lg"
                position="fixed"
                top="0"
                width="100%"
                zIndex="1000"
            >
                <Heading size="lg" color="#58a6ff">
                    ProComm
                </Heading>
                <HStack spacing="20px">
                    <Link to="/about">
                        <Button variant="ghost" colorScheme="blue">
                            About
                        </Button>
                    </Link>
                    <Link to="/try-it">
                        <Button colorScheme="blue" size="md">
                            Try it Out!
                        </Button>
                    </Link>
                </HStack>
            </Flex>

            {/* Hero Section */}
            <Box
                as="main"
                textAlign="center"
                marginTop="40px"
                padding="50px 20px"
                background="linear-gradient(135deg, #0d1117, #161b22)"
            >
                <Image
                    src={require('./procommimg.png')}
                    alt="ProComm Logo"
                    marginBottom="50px"
                    width="900px" // Increased width
                    height="auto"
                    style={{ display: 'block', margin: '0 auto' }} // Center the image
                />
                <Heading size="2xl" fontWeight="bold" marginBottom="20px" marginTop="20px" color="#58a6ff">
                    Unlock Your Speaking Potential
                </Heading>
                <Text fontSize="lg" marginBottom="20px" color="#8b949e">
                    ProComm helps you transcribe speech, analyze your speaking patterns, and improve your communication skills effortlessly.
                </Text>
                <Link to="/try-it">
                    <Button
                        size="lg"
                        fontWeight="bold"
                        padding="12px 24px"
                        backgroundColor="#238636"
                        color="#ffffff"
                        _hover={{ backgroundColor: '#2ea043' }}
                    >
                        Get Started
                    </Button>
                </Link>
            </Box>

            {/* Features Section */}
            <Box padding="50px 20px">
                <Heading size="2xl" textAlign="center" marginBottom="40px" color="#4ade80">
                    Why Use ProComm?
                </Heading>

                <Box textAlign="center" marginBottom="20px" padding="20px" backgroundColor="#1e293b" borderRadius="10px" boxShadow="lg">
                    <Heading size="xl" color="#38bdf8" marginBottom="20px">
                        Accurate Speech Transcription
                    </Heading>
                    <Text fontSize="lg" color="#e2e8f0" maxWidth="700px" margin="0 auto" lineHeight="1.8">
                        Convert your speech into text with precision and ease. ProComm ensures every word is captured accurately, making it easier for you to analyze and improve.
                    </Text>
                </Box>

                <Box textAlign="center" marginBottom="20px" padding="20px" backgroundColor="#1e293b" borderRadius="10px" boxShadow="lg">
                    <Heading size="xl" color="#38bdf8" marginBottom="20px">
                        In-Depth Speech Analysis
                    </Heading>
                    <Text fontSize="lg" color="#e2e8f0" maxWidth="700px" margin="0 auto" lineHeight="1.8">
                        Gain insights into your speaking patterns and areas for improvement. ProComm provides detailed feedback to help you become a more confident and effective communicator.
                    </Text>
                </Box>

                <Box textAlign="center" marginBottom="20px" padding="20px" backgroundColor="#1e293b" borderRadius="10px" boxShadow="lg">
                    <Heading size="xl" color="#38bdf8" marginBottom="20px">
                        Enhance Your Communication Skills
                    </Heading>
                    <Text fontSize="lg" color="#e2e8f0" maxWidth="700px" margin="0 auto" lineHeight="1.8">
                        Use actionable feedback to refine your speaking abilities. Whether it’s for public speaking, interviews, or daily conversations, ProComm has you covered.
                    </Text>
                </Box>
            </Box>

            {/* Call to Action Section */}
            <Box
                textAlign="center"
                padding="50px 20px"
                backgroundColor="#161b22"
                color="#f0f6fc"
            >
                <Heading size="lg" marginBottom="20px" color="#58a6ff">
                    Ready to Transform Your Speaking Skills?
                </Heading>
                <Text fontSize="lg" marginBottom="40px" color="#8b949e">
                    Join thousands of users who trust ProComm to improve their communication and confidence.
                </Text>
                <Link to="/try-it">
                    <Button
                        size="lg"
                        fontWeight="bold"
                        padding="12px 24px"
                        backgroundColor="#238636"
                        color="#ffffff"
                        _hover={{ backgroundColor: '#2ea043' }}
                    >
                        Try it Now
                    </Button>
                </Link>
            </Box>

            {/* Footer */}
            <Box
                backgroundColor="#0d1117"
                color="#8b949e"
                textAlign="center"
                padding="20px"
                marginTop="50px"
            >
                <Text fontSize="sm">
                    © 2025 ProComm. All rights reserved.
                </Text>
            </Box>
        </Box>
    );
}

