import React from 'react';
import { Box, Flex, Heading, Text, Image, Button, VStack, HStack } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import aboutImage from './about.jpg'; // Replace with an actual image file if available

function About() {
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
                    <Link to="/">
                        <Button variant="ghost" colorScheme="blue">
                            Home
                        </Button>
                    </Link>
                    <Link to="/try-it">
                        <Button colorScheme="blue" size="md">
                            Try it Out!
                        </Button>
                    </Link>
                </HStack>
            </Flex>

            {/* Main Content */}
            <Box 
                as="main"
                marginTop="80px"
                padding="50px 20px"
                background="linear-gradient(135deg, #0d1117, #161b22)"
            >
                <Heading size="2xl" textAlign="center" marginBottom="40px" color="#58a6ff">
                    About ProComm
                </Heading>
                <Text fontSize="lg" color="#8b949e" textAlign="center" maxWidth="800px" margin="0 auto" marginBottom="40px" lineHeight="1.8">
                    ProComm is a cutting-edge platform designed to revolutionize communication and collaboration. 
                    Our mission is to provide seamless, efficient, and innovative solutions for individuals and teams worldwide.
                </Text>

                {/* About section with image */}
                <Flex 
                    justifyContent="center" 
                    alignItems="center" 
                    gap="40px" 
                    flexWrap={{base: "wrap", md: "nowrap"}}
                    marginBottom="50px"
                    padding="20px"
                >
                    <Box 
                        textAlign={{base: "center", md: "left"}} 
                        maxWidth="500px" 
                        backgroundColor="#1e293b" 
                        padding="30px" 
                        borderRadius="10px" 
                        boxShadow="lg"
                    >
                        <Heading size="xl" color="#38bdf8" marginBottom="20px">
                            Our Vision
                        </Heading>
                        <Text fontSize="md" color="#e2e8f0" lineHeight="1.8">
                            At ProComm, we envision a world where communication barriers are eliminated, 
                            and collaboration is effortless. We strive to empower people with tools that enhance productivity and creativity.
                        </Text>
                    </Box>
                    <Image
                        src={aboutImage}
                        alt="About ProComm"
                        width={{base: "300px", md: "400px"}}
                        height={{base: "300px", md: "400px"}}
                        objectFit="cover"
                        borderRadius="10px"
                        boxShadow="lg"
                    />
                </Flex>

                {/* Feature boxes similar to Home page */}
                <Box padding="20px 0 50px 0">
                    <Heading size="2xl" textAlign="center" marginBottom="40px" color="#4ade80">
                        Why Choose ProComm?
                    </Heading>

                    <Box textAlign="center" marginBottom="20px" padding="20px" backgroundColor="#1e293b" borderRadius="10px" boxShadow="lg">
                        <Heading size="xl" color="#38bdf8" marginBottom="20px">
                            Innovative Technology
                        </Heading>
                        <Text fontSize="lg" color="#e2e8f0" maxWidth="700px" margin="0 auto" lineHeight="1.8">
                            Our platform leverages cutting-edge speech analysis technology to provide you with accurate transcription and meaningful insights into your speaking patterns.
                        </Text>
                    </Box>

                    <Box textAlign="center" marginBottom="20px" padding="20px" backgroundColor="#1e293b" borderRadius="10px" boxShadow="lg">
                        <Heading size="xl" color="#38bdf8" marginBottom="20px">
                            User-Friendly Design
                        </Heading>
                        <Text fontSize="lg" color="#e2e8f0" maxWidth="700px" margin="0 auto" lineHeight="1.8">
                            We've designed ProComm with simplicity in mind. Our intuitive interface makes it easy for anyone to analyze their speech and improve their communication skills.
                        </Text>
                    </Box>

                    <Box textAlign="center" marginBottom="20px" padding="20px" backgroundColor="#1e293b" borderRadius="10px" boxShadow="lg">
                        <Heading size="xl" color="#38bdf8" marginBottom="20px">
                            Dedicated Support
                        </Heading>
                        <Text fontSize="lg" color="#e2e8f0" maxWidth="700px" margin="0 auto" lineHeight="1.8">
                            Our team is committed to your success. We provide responsive support and continuous updates to ensure you have the best experience possible.
                        </Text>
                    </Box>
                </Box>

                {/* Call to Action Section */}
                <Box
                    textAlign="center"
                    padding="50px 20px"
                    backgroundColor="#161b22"
                    color="#f0f6fc"
                    borderRadius="10px"
                    marginTop="30px"
                >
                    <Heading size="lg" marginBottom="20px" color="#58a6ff">
                        Ready to Transform Your Communication Skills?
                    </Heading>
                    <Text fontSize="lg" marginBottom="40px" color="#8b949e">
                        Join thousands of users who trust ProComm to improve their speaking confidence and effectiveness.
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

                {/* Our Team Section */}
                <Box padding="50px 20px" textAlign="center">
                    <Heading size="2xl" color="#58a6ff" marginBottom="40px">
                        Our Team
                    </Heading>
                    <Text fontSize="lg" color="#8b949e" maxWidth="700px" margin="0 auto" marginBottom="40px" lineHeight="1.8">
                        ProComm is built by a talented team of developers, designers, and speech experts dedicated to helping you become a better communicator.
                    </Text>
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
        </Box>
    );
}

export default About;