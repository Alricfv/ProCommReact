import React from 'react';
import { Box, Flex, Heading, Text, Image, Button } from '@chakra-ui/react';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import aboutImage from './about.jpg'; // Replace with an actual image file if available

function About() {
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
                    {/* Home styled as a button */}
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="#f5f5f7"
                            padding="8px 16px"
                            borderRadius="8px"
                            cursor="pointer"
                            _hover={{ backgroundColor: '#333333' }}
                        >
                            Home
                        </Text>
                    </Link>
                    {/* Try it Out as an actual button */}
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => alert('Try it Out! button clicked!')}
                    >
                        Try it Out!
                    </Button>
                </Flex>
            </Flex>

            {/* Main Content */}
            <Box
                marginTop="50px" // Add marginTop to account for the height of the fixed navigation bar
                paddingTop="50px" // Additional padding for spacing
                textAlign="center"
                width="100vw"
                minHeight="100vh"
                background="linear-gradient(135deg, #121212, #1d1d1f)"
                padding="50px"
            >
                <Heading size="2xl" color="#f5f5f7" marginBottom="20px">
                    About ProComm
                </Heading>
                <Text fontSize="lg" color="#cccccc" marginBottom="40px">
                    ProComm is a cutting-edge platform designed to revolutionize communication and collaboration. 
                    Our mission is to provide seamless, efficient, and innovative solutions for individuals and teams worldwide.
                </Text>
                <Flex justifyContent="center" alignItems="center" gap="40px" flexWrap="wrap">
                    <Box maxWidth="500px">
                        <Heading size="lg" color="#f5f5f7" marginBottom="10px">
                            Our Vision
                        </Heading>
                        <Text fontSize="md" color="#cccccc">
                            At ProComm, we envision a world where communication barriers are eliminated, 
                            and collaboration is effortless. We strive to empower people with tools that enhance productivity and creativity.
                        </Text>
                    </Box>
                    <Image
                        src={aboutImage}
                        alt="About ProComm"
                        width="400px"
                        height="400px"
                        objectFit="cover"
                        borderRadius="10px"
                        boxShadow="lg"
                    />
                </Flex>
                <Box marginTop="50px">
                    <Heading size="lg" color="#f5f5f7" marginBottom="10px">
                        Why Choose Us?
                    </Heading>
                    <Text fontSize="md" color="#cccccc">
                        - Innovative features tailored to your needs.<br />
                        - User-friendly interface for seamless navigation.<br />
                        - Dedicated support to ensure your success.<br />
                        - Trusted by thousands of users worldwide.
                    </Text>
                </Box>
            </Box>
        </Box>
    );
}

export default About;