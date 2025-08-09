import { 
    Box, Flex, Heading, Text, Button, VStack, HStack, Image, 
    Container, SimpleGrid, Icon, Circle, Divider, useBreakpointValue,
    Badge
} from '@chakra-ui/react';

import { Link } from 'react-router-dom';

import { FaMicrophone, FaChartLine, FaComments, FaCheck, FaRocket} from 'react-icons/fa';

import {
    bgGradient, accentColor, textColor, highlightColor, secondaryAccent,
    tertiaryAccent, cardBoxStyles, featureBoxStyles, teamCardStyles, NavBar, MobileHamburgerMenu
} from './Consts.js';

export default function Home() {
    const headingSize = useBreakpointValue({ base: "xl", md: "3xl" });

    return (
        <Box 
            bg="#091018ff"
            color={textColor}
            minHeight="100vh"
            position="relative"
            width="100%"
            zIndex={0}
            
        >
            {/* Navigation (navbar for PC, hamburger for mobile)*/}
            <Box display ={{ base: "none", md: "block"}}>
                <NavBar />
            </Box> 
            <Flex
                display = {{ base: "block", md: "none"}}
                alignItems="center"
                justifyContent="space-between"
                px={4}
                py={3}
                position="fixed"
                top={0}
                left={0}
                right={0}
                width="100%"
                zIndex={1000}
                bg="transparent"
                backdropFilter="blur(10px)"
            >
                <HStack spacing ={2}>
                    <Circle
                        size="36px"
                        bg={`rgba(56, 189, 248, 0.2)`}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Icon as={FaMicrophone} color={accentColor} w={5} h={5} />
                    </Circle>
                    <Heading
                        size="xl"
                        bgGradient={`linear-gradient(90deg, ${accentColor}, ${tertiaryAccent})`}
                        bgClip="text"
                        fontWeight="extrabold"
                        
                    >
                        ProComm
                    </Heading>
                </HStack>
                <MobileHamburgerMenu />
            </Flex>

            {/* Hero Section */}
            <Box 
                as="main"
                marginTop="5px"
                padding={{ base: "60px 20px", md: "80px 40px" }}
                position="relative"
                overflow="hidden"
                bg="transparent"
            >
                {/* Background effects */}
                
                
                <Container 
                    maxW="1200px" 
                    position="relative" 
                    zIndex="2"
                    px={0}
                >
                    <Heading 
                        size={headingSize} 
                        fontWeight="extrabold" 
                        marginY="20px" 
                        color="#fc6900ff"      
                        textShadow={`
                            0 0 8px #fc6900ff,
                            0 0 1px #fc6900ff,
                            0 0 32px #fc690010                            
                        `}                   
                        letterSpacing="wide"
                        textAlign="center"
                        lineHeight="1.3"
                    >
                        Unlock Your Speaking Potential
                    </Heading>
                    <Box  marginBottom="60px" minHeight="450px">
                        <Image
                            src={require('../images/procommimg.png')}
                            alt="ProComm Logo"
                            display="block"
                            position="absolute"
                            marginTop={{base: "0", md:"40px"}}
                            marginLeft="50px"
                            width={{base: "100%", md: "700px"}}
                            height="auto"
                            ml={0}
                            borderRadius="20px"
                            boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                            border="1px solid rgba(255, 255, 255, 0.1)"
                            transition="all 0.3s ease-in-out"
                            _hover={{transform: "scale(1.02)", boxShadow: "0 25px 30px -5px rgba(0, 0, 0, 0.3), 0 15px 15px -5px rgba(0, 0, 0, 0.2)"}}
                        />
                        
                        <Text 
                            fontSize={{base:"18px", md: "25px"}}
                            marginTop={{base: "200px", md: "70px"}}
                            color={textColor}
                            position="absolute"
                            marginLeft={{base:"0", md:"775px"}}
                            lineHeight="1.8"
                            fontWeight="bold"
                            textAlign="center"
                            maxW="500px"
                            width="100%"
                        >
                            ProComm helps you transcribe speech, analyze your speaking patterns, 
                            and improve your communication skills with advanced speech analysis technology.
                        </Text>
                        <Link to="/try-it">
                            <Button
                                textAlign="center"
                                fontSize="25px"
                                fontWeight="bold"
                                marginTop={{base: "350px", md: "270px"}}
                                marginLeft={{base: "55px", md:"900px"}}
                                px={10}
                                py={8}
                                bg={secondaryAccent}
                                color="white"
                                _hover={{ bg: '#22c55e', transform: "translateY(-2px)" }}
                                _active={{ transform: "translateY(0)" }}
                                transition="all 0.2s"
                                boxShadow="0 4px 12px rgba(74, 222, 128, 0.4)"
                            >
                                Get Started Now
                            </Button>
                        </Link>
                    </Box>

                    {/* Features Section */}
                    <Box >
                        <Heading 
                            size={headingSize} 
                            textAlign="center" 
                            marginTop={{base:"-20", md:"-20"}}
                            marginBottom={{base: "30px", md:"60px"}} 
                            textShadow={`
                            0 0 8px ${secondaryAccent},
                            0 0 1px ${secondaryAccent},
                            0 0 1px ${secondaryAccent}
                            `}
                            color={secondaryAccent}
                            fontWeight="extrabold"
                            lineHeight="1.4"
                        >
                            Why Use ProComm?
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
                            <VStack 
                                spacing={5} 
                                {...cardBoxStyles}
                                transition="all 0.3s ease"
                                _hover={{
                                    transform: "translateY(-10px)",
                                    boxShadow: "0 20px 35px -5px rgba(56, 189, 248, 0.3)"
                                }}
                            >
                                <Circle 
                                    marginTop="10px"
                                    size="60px" 
                                    bg="rgba(56, 189, 248, 0.2)" 
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="center"
                                >
                                    <Icon as={FaMicrophone} color={accentColor} w={7} h={7} />
                                </Circle>
                                <Heading 
                                    size="lg" 
                                    color={accentColor} 
                                    textAlign="center"
                                    marginTop="-3"
                                >
                                   Speech Transcription
                                </Heading>
                                <Text 
                                    textAlign="center" 
                                    color={textColor} 
                                    lineHeight="1.8" 
                                    maxW="300px"
                                    fontWeight="bold" 
                                    marginTop="-3"
                                    paddingBottom="10px"
                                >
                                    Convert your speech into text with precision and ease. 
                                    Our advanced technology ensures every word is captured accurately.
                                </Text>
                            
                            </VStack>
                            <VStack 
                                spacing={5} 
                                {...cardBoxStyles}
                                _hover={{
                                    transform: "translateY(-10px)",
                                    boxShadow: "0 20px 35px -5px rgba(192, 132, 252, 0.3)"
                                }}
                            >
                                <Circle 
                                    marginTop="10px"
                                    size="60px" 
                                    bg="rgba(192, 132, 252, 0.2)" 
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="center"
                                >
                                    <Icon as={FaChartLine} color={tertiaryAccent} w={7} h={7} />
                                </Circle>
                                <Heading 
                                    size="lg" 
                                    color={tertiaryAccent}
                                    marginTop ="-3"
                                    textAlign="center"
                                >
                                    Speech Analysis
                                </Heading>
                                <Text 
                                    textAlign="center" 
                                    color={textColor} 
                                    lineHeight="1.8"
                                    fontWeight="bold"
                                    maxW="300px"
                                    marginTop="-3"
                                >
                                    Gain insights into your speaking patterns and areas for improvement with 
                                    detailed feedback on filler words and speaking habits.
                                </Text>
                            </VStack>
                            <VStack 
                                spacing={5} 
                                {...cardBoxStyles}
                                _hover={{
                                    transform: "translateY(-10px)",
                                    boxShadow: "0 20px 35px -5px rgba(74, 222, 128, 0.3)"
                                }}
                            >
                                <Circle 
                                    marginTop="10px"
                                    size="60px" 
                                    bg="rgba(74, 222, 128, 0.2)" 
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="center"
                                >
                                    <Icon as={FaComments} color={secondaryAccent} w={7} h={7} />
                                </Circle>
                                <Heading 
                                    size="lg" 
                                    color={secondaryAccent}
                                    marginTop="-3"
                                    textAlign="center"
                                >
                                    Feedback
                                </Heading>
                                <Text 
                                    textAlign="center" 
                                    color={textColor} 
                                    lineHeight="1.8"
                                    fontWeight="bold"
                                    maxW="300px"
                                    marginTop="-3"
                                >
                                    Use actionable feedback to refine your speaking abilities for public speaking, 
                                    interviews, presentations, or daily conversations.
                                </Text>
                            </VStack>
                        </SimpleGrid>
                    </Box>

                    {/* Benefits Section */}
                    <Box 
                        padding="50px 30px" 
                        marginY="70px"
                        {...cardBoxStyles}
                    >
                        <VStack spacing={8}>
                            <Heading 
                                textAlign="center"
                                size="2xl"
                                color="#fc6900ff"
                                textShadow={`
                                    0 0 8px #fc6900ff,
                                    0 0 1px #fc6900ff,
                                    0 0 32px #fc690010                            
                                `}
                            >
                                Key Benefits
                            </Heading>

                            <Divider width="100px" borderColor={accentColor} opacity={0.6} />
                            
                            <SimpleGrid 
                                columns={{ base: 1, md: 2 }} 
                                spacing={10} 
                                width="100%"
                            >
                                <HStack align="flex-start" spacing={4}>
                                    <Circle 
                                        size="36px" 
                                        bg="rgba(56, 189, 248, 0.2)" 
                                        flexShrink={0} 
                                        mt={1}
                                    >
                                        <Icon as={FaCheck} color={accentColor} w={4} h={4} />
                                    </Circle>
                                    <VStack align="flex-start" spacing={2}>
                                        <Heading 
                                            size="md" 
                                            color={highlightColor}>
                                            Filler Word Detection
                                        </Heading>
                                        <Text 
                                            fontSize="md" 
                                            color={textColor} 
                                            lineHeight="1.8"
                                        >
                                            Identify and track filler words like "um," "uh," and "like" to 
                                            develop more polished and professional speaking habits.
                                        </Text>
                                    </VStack>
                                </HStack>
                                <HStack align="flex-start" spacing={4}>
                                    <Circle 
                                        size="36px" 
                                        bg="rgba(192, 132, 252, 0.2)" 
                                        flexShrink={0} 
                                        mt={1}
                                    >
                                        <Icon as={FaCheck} color={tertiaryAccent} w={4} h={4} />
                                    </Circle>
                                    <VStack align="flex-start" spacing={2}>
                                        <Heading 
                                            size="md" 
                                            color={highlightColor}
                                        >
                                            Real-Time Feedback
                                        </Heading>
                                        <Text 
                                            fontSize="md" 
                                            color={textColor} 
                                            lineHeight="1.8"
                                        >
                                            Get instant analysis of your speaking patterns, allowing you to 
                                            make improvements on the spot and track your progress over time.
                                        </Text>
                                    </VStack>
                                </HStack>
                                <HStack align="flex-start" spacing={4}>
                                    <Circle 
                                        size="36px" 
                                        bg="rgba(74, 222, 128, 0.2)" 
                                        flexShrink={0} 
                                        mt={1}
                                    >
                                        <Icon as={FaCheck} color={secondaryAccent} w={4} h={4} />
                                    </Circle>
                                    <VStack align="flex-start" spacing={2}>
                                        <Heading 
                                            size="md" 
                                            color={highlightColor}
                                        >
                                            Privacy Protection
                                        </Heading>
                                        <Text 
                                            fontSize="md" 
                                            color={textColor} 
                                            lineHeight="1.8"
                                        >
                                            Your voice data never leaves our secure servers. All processing happens
                                            locally to ensure your privacy and data security.
                                        </Text>
                                    </VStack>
                                </HStack> 
                                <HStack align="flex-start" spacing={4}>
                                    <Circle 
                                        size="36px" 
                                        bg="rgba(56, 189, 248, 0.2)" 
                                        flexShrink={0} 
                                        mt={1}
                                    >
                                        <Icon as={FaCheck} color={accentColor} w={4} h={4} />
                                    </Circle>
                                    <VStack align="flex-start" spacing={2}>
                                        <Heading 
                                        size="md" 
                                        color={highlightColor}
                                        >
                                            Easy to Use
                                        </Heading>
                                        <Text 
                                            fontSize="md" 
                                            color={textColor} 
                                            lineHeight="1.8"
                                        >
                                            Our intuitive interface makes it simple to record, analyze, and improve
                                            your speech without any technical expertise required.
                                        </Text>
                                    </VStack>
                                </HStack>
                            </SimpleGrid>
                        </VStack>
                    </Box>

                    {/* Call to Action Section */}
                    <Box
                        textAlign="center"
                        padding={{base: "40px 20px", md: "60px 40px"}}
                        
                        color={textColor}
                        borderRadius="20px"
                        boxShadow= "0 0 24px 0 #00e226ff"
                        marginY="70px"
                        position="relative"
                        overflow="hidden"
                    >
                        <Box 
                            position="absolute" 
                            top="0" 
                            left="0" 
                            width="100%" 
                            height="100%" 
                            opacity="0.3" 
                            zIndex="0"
                        />
                        <VStack 
                            spacing={6} 
                            position="relative" 
                            zIndex="1"
                        >
                            <Icon as={FaRocket} color={highlightColor} w={10} h={10} />
                            <Heading 
                                size="2xl" 
                                fontWeight="extrabold"
                                bgGradient={`linear-gradient(90deg, ${highlightColor}, #f0abfc)`}
                                bgClip="text"
                                lineHeight="1.4"
                                textShadow={`
                                    0 0 8px ${highlightColor},
                                    0 0 1px ${highlightColor},
                                    0 0 32px ${highlightColor}10
                            `}
                            >
                                Transform Your Speaking Skills!
                            </Heading>
                            <Text 
                                fontSize={{base: "25px", md: "25px"}} 
                                maxW="700px" 
                                mx="auto"
                                fontWeight="bold"
                            >
                                Start your journey to better communication today!
                            </Text>
                            <Link to="/try-it">
                                <Button
                                    size="lg"
                                    fontWeight="bold"
                                    px={8}
                                    py={6}
                                    bg={secondaryAccent}
                                    color="white"
                                    _hover={{ bg: '#22c55e', transform: "translateY(-2px)" }}
                                    _active={{ transform: "translateY(0)" }}
                                    transition="all 0.2s"
                                    boxShadow="0 4px 12px rgba(74, 222, 128, 0.4)"
                                >
                                    Try it Now — Free
                                </Button>
                            </Link>
                        </VStack>
                    </Box>

                    {/* Footer */}
                    <Box
                        backgroundColor="rgba(15, 23, 42, 0.9)"
                        color="#94a3b8"
                        textAlign="center"
                        padding="30px"
                        marginTop="50px"
                        borderRadius="10px"
                        boxShadow="0 -5px 20px -5px rgba(0, 0, 0, 0.1)"
                    >
                        <HStack 
                            justifyContent="center" 
                            spacing={4} 
                            mb={4}
                        >
                            <Circle 
                                size="36px" 
                                bg={`rgba(56, 189, 248, 0.1)`} 
                                display="flex" 
                                alignItems="center" 
                                justifyContent="center"
                            >
                                <Icon as={FaMicrophone} color={accentColor} w={4} h={4} />
                            </Circle>
                            <Text 
                                fontWeight="bold" 
                                color={textColor}
                            >
                                ProComm
                            </Text>
                        </HStack>
                        <Text fontSize="sm">
                            © 2025 ProComm. All rights reserved.
                        </Text>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}

