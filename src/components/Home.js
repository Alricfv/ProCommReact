import React from 'react';
import { Box, Flex, Heading, Text, Image, Button } from '@chakra-ui/react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import downloadImage from './download.jpg'; // Import the image

export default function Home() {
    return (
        <Box backgroundColor="#121212" color="#f5f5f7">
            {/* Navigation Bar */}
            <Flex
                as="nav"
                justifyContent="space-between"
                alignItems="center"
                padding="10px 20px"
                backgroundColor="rgba(18, 18, 18, 0.9)" // Dark translucent background
                backdropFilter="blur(10px)" // Blur effect for translucency
                boxShadow="md"
                position="fixed"
                top="0"
                width="100%"
                zIndex="1000" // Ensure the nav bar is above other content
            >
                <Heading size="lg" color="#f5f5f7">
                    ProComm
                </Heading>
                <Flex gap="20px" alignItems="center">
                    {/* About styled as a button */}
                    <Link to="/about" style={{ textDecoration: 'none' }}>
                        <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="#f5f5f7"
                            padding="8px 16px"
                            borderRadius="8px"
                            cursor="pointer"
                            _hover={{ backgroundColor: '#333333' }}
                        >
                            About
                        </Text>
                    </Link>
                    {/* Try it Out as an actual button */}
                    <Button
                        variant="primary"
                        fontSize="lg"
                        size="md"
                        onClick={() => alert('Try it Out! button clicked!')}
                    >
                        Try it Out!
                    </Button>
                </Flex>
            </Flex>

            {/* Hero Section */}
            <Box
                style={{ paddingTop: '90px' }} // Inline style for debugging
                textAlign="center"
                padding="50px 20px"
                background="linear-gradient(to bottom, #121212, #1d1d1f)"
            >
                <Heading size="2xl" fontWeight="bold" marginBottom="20px" color="#f5f5f7">
                    Welcome to ProComm
                </Heading>
                <Text fontSize="lg" marginBottom="40px" color="#cccccc">
                    Revolutionizing communication and collaboration for the modern world.
                </Text>
                <Button
                    size="lg"
                    fontWeight="bold"
                    padding="12px 24px"
                    backgroundColor="#FFFFFF" // White background
                    color="#000000" // Black text
                    _hover={{ backgroundColor: '#e5e5e5' }} // Light gray hover effect
                >
                    Get Started
                </Button>
            </Box>

            {/* Features Section */}
            <Box padding="50px 20px">
                <Flex
                    justifyContent="space-around"
                    alignItems="center"
                    flexWrap="wrap"
                    gap="40px"
                >
                    <Box textAlign="center" maxWidth="300px">
                        <Image
                            src={downloadImage}
                            alt="Feature 1"
                            borderRadius="10px"
                            boxShadow="lg"
                            marginBottom="20px"
                        />
                        <Heading size="md" marginBottom="10px" color="#f5f5f7">
                            Seamless Collaboration
                        </Heading>
                        <Text fontSize="sm" color="#cccccc">
                            Work together effortlessly with tools designed for productivity.
                        </Text>
                    </Box>
                    <Box textAlign="center" maxWidth="300px">
                        <Image
                            src={downloadImage}
                            alt="Feature 2"
                            borderRadius="10px"
                            boxShadow="lg"
                            marginBottom="20px"
                        />
                        <Heading size="md" marginBottom="10px" color="#f5f5f7">
                            Intuitive Design
                        </Heading>
                        <Text fontSize="sm" color="#cccccc">
                            Experience a clean, user-friendly interface that’s easy to navigate.
                        </Text>
                    </Box>
                    <Box textAlign="center" maxWidth="300px">
                        <Image
                            src={downloadImage}
                            alt="Feature 3"
                            borderRadius="10px"
                            boxShadow="lg"
                            marginBottom="20px"
                        />
                        <Heading size="md" marginBottom="10px" color="#f5f5f7">
                            Reliable Support
                        </Heading>
                        <Text fontSize="sm" color="#cccccc">
                            Get help when you need it with our dedicated support team.
                        </Text>
                    </Box>
                </Flex>
            </Box>

            {/* Footer */}
            <Box
                backgroundColor="#1d1d1f"
                color="#f5f5f7"
                textAlign="center"
                padding="20px"
                marginTop="50px"
            >
                <Text fontSize="sm">
                    © 2023 ProComm. All rights reserved.
                </Text>
            </Box>
        </Box>
    );
}

