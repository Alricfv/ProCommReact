import { 
    Box, Flex, Heading, Text, Image, Button, VStack, HStack, Container, 
    Icon,  Divider, SimpleGrid, Circle, Wrap, WrapItem, useBreakpointValue
} from '@chakra-ui/react';

import { Link } from 'react-router-dom';

import { 
    FaRocket, FaUserFriends, FaHeadset, FaMicrophone, FaChartLine, 
    FaLightbulb, FaCode, FaGlobe, FaTools, FaWaveSquare
} from 'react-icons/fa';

import {
    bgGradient, accentColor, textColor, highlightColor, secondaryAccent,
    tertiaryAccent, cardBoxStyles, featureBoxStyles, teamCardStyles, NavBar, MobileHamburgerMenu
} from './Consts.js';

import aboutImage from '../images/about.jpg';

//data for talking about the roles of each group in our team
const teamMembers =[
    {
        role: 'Development',
        icon: FaCode,
        color: accentColor,
        bg: 'rgba(56, 189, 248, 0.2)',
        description: 'Developers & Engineers building our speech technology platform',
        email: 'placeholder1@gmail.com'
    },
    {
        role: 'Design',
        icon: FaUserFriends,
        color: tertiaryAccent,
        bg: 'rgba(192, 132, 252, 0.2)',
        description: 'Designers & Creators of our intuitive user experience',
        email: 'placeholder2@gmail.com'
    },
    {
        role: 'Support',
        icon: FaHeadset,
        color: secondaryAccent,
        bg: 'rgba(74, 222, 128, 0.2)',
        description: 'Support Experts ready to help with any questions',
        email: 'placeholder3@gmail.com'
    }
]

function About() {
    const headingSize = useBreakpointValue({ base: "xl", md: "2xl" });
    return (
        <Box 
            bg="#091018ff"
            color={textColor} 
            minHeight="100vh" 
            zIndex="0"
        >
            {/* Nav Bar */}
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
                        size="30px"
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
                marginTop="80px"
                padding={{ base: "60px 20px", md: "80px 40px" }}
                position="relative"
                overflow="hidden"
                bg="transparent"
            >
                
                <Container maxW="1200px" position="relative" zIndex="2" >
                    {/* Main heading */}
                    <Heading 
                        size={headingSize}
                        textAlign="center" 
                        marginTop="-14"
                        marginBottom="30px" 
                        color="#fc6900ff"
                        textShadow={`
                            0 0 8px #fc6900ff,
                            0 0 1px #fc6900ff,
                            0 0 32px #fc690010
                        `}
                        fontWeight="extrabold"
                        letterSpacing="tight"
                        lineHeight="1.4"
                    >
                        Revolutionizing Communication with ProComm
                    </Heading>
                    
                    <Text 
                        fontSize={{ base: "20px", md: "xl" }} 
                        color={textColor} 
                        textAlign="center" 
                        maxWidth="900px" 
                        margin="0 auto" 
                        marginBottom="60px" 
                        lineHeight="1.8"
                        fontWeight="bold"
                    >
                        ProComm is a cutting-edge platform designed to transform the way you communicate through 
                        state-of-the-art speech analysis technology.<br></br><br></br> Our mission is to provide seamless, 
                        powerful tools that help you become a more effective and confident communicator.
                    </Text>

                    {/* About section with image */}
                    <Flex 
                        justifyContent="center" 
                        alignItems="center" 
                        gap="60px" 
                        flexWrap={{base: "wrap", md: "nowrap"}}
                        marginBottom="70px"
                    >
                        <Box 
                          {...cardBoxStyles}
                          textAlign={{base: "center", md: "left"}} 
                          maxWidth="500px" 
                          padding="40px" 
                          transform={{md: "rotate(-2deg)"}}
                          _hover={{
                            transform: "rotate(0deg) scale(1.02)", 
                            boxShadow: "0 25px 30px -5px rgba(0, 0, 0, 0.3), 0 15px 15px -5px rgba(0, 0, 0, 0.2)"
                           }}
                        >
                            <Circle 
                                size="50px" 
                                bg={`rgba(56, 189, 248, 0.2)`} 
                                display="flex" 
                                alignItems="center" 
                                justifyContent="center" 
                                mb={5} 
                                mx="auto"
                            >
                                <Icon as={FaLightbulb} color={highlightColor} w={6} h={6} />
                            </Circle>
                            <Heading 
                                size="3xl" 
                                color={highlightColor}
                                marginBottom="20px"
                                fontWeight="extrabold"
                                textShadow={`
                                    0 0 8px ${highlightColor},
                                    0 0 1px ${highlightColor},
                                    0 0 32px #fc690010
                                `}
                            >
                                Our Vision
                            </Heading>
                            <Text 
                                fontSize="20px" 
                                color={textColor} 
                                lineHeight="1.8"
                                fontWeight="bold"
                            >
                                At ProComm, we envision a world where anyone can communicate with clarity and confidence. 
                                We're developing AI-powered tools that analyze speech patterns, detect filler words, 
                                and provide real-time feedback to help you become a more polished communicator.
                            </Text>
                        </Box>
                        <Image
                            src={aboutImage}
                            alt="About ProComm"
                            width={{base: "300px", md: "450px"}}
                            height={{base: "300px", md: "450px"}}
                            objectFit="cover"
                            borderRadius="20px"
                            boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                            border="1px solid rgba(255, 255, 255, 0.1)"
                            transform={{md: "rotate(2deg)"}}
                            transition="all 0.3s ease-in-out"
                            _hover={{transform: "rotate(0deg) scale(1.02)", boxShadow: "0 25px 30px -5px rgba(0, 0, 0, 0.3), 0 15px 15px -5px rgba(0, 0, 0, 0.2)"}}
                        />
                    </Flex>

                    {/* Features section with improved styling */}
                    <Box padding="20px 0 50px 0">
                        <Heading 
                            size="3xl" 
                            textAlign="center" 
                            marginBottom="60px" 
                            color={secondaryAccent}
                            textShadow={`
                                0 0 8px ${secondaryAccent},
                                0 0 1px ${secondaryAccent},
                                0 0 32px #fc690010
                            `}
                            fontWeight="extrabold"
                        >
                            Why Choose ProComm?
                        </Heading>

                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
                            <Box 
                                {...featureBoxStyles}
                                textAlign="center" 
                                padding={{base: "30px 20px", md: "40px 30px"}} 
                                _hover={{
                                    transform: "translateY(-10px)",
                                    boxShadow: "0 20px 35px -5px rgba(56, 189, 248, 0.3)"
                                }}
                            >
                                <Circle 
                                    size="60px" 
                                    bg="rgba(56, 189, 248, 0.2)" 
                                    mb={5} mx="auto" 
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="center"
                                >
                                    <Icon as={FaWaveSquare} color={accentColor} w={7} h={7} />
                                </Circle>
                                <Heading 
                                    size="lg" 
                                    color={accentColor} 
                                    marginBottom="16px"
                                >
                                    Advanced Speech Analysis
                                </Heading>
                                <Text 
                                    fontSize="18px" 
                                    color={textColor} 
                                    lineHeight="1.8" 
                                    fontWeight="bold"
                                >
                                    Provides accurate transcription and meaningful insights into your speaking patterns.
                                </Text>
                            </Box>
                            <Box 
                                {...featureBoxStyles}
                                textAlign="center" 
                                padding={{base: "30px 20px", md: "40px 30px"}} 
                                _hover={{
                                    transform: "translateY(-10px)",
                                    boxShadow: "0 20px 35px -5px rgba(192, 132, 252, 0.3)"
                                }}
                            >
                                <Circle 
                                    size="60px" 
                                    bg="rgba(192, 132, 252, 0.2)" 
                                    mb={5} 
                                    mx="auto" 
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="center"
                                >
                                    <Icon as={FaHeadset} color={tertiaryAccent} w={7} h={7} />
                                </Circle>
                                <Heading 
                                    size="lg" 
                                    color={tertiaryAccent} 
                                    marginBottom="16px"
                                >
                                    Filler Word Detection
                                </Heading>
                                <Text 
                                    fontSize="18px" 
                                    color={textColor} 
                                    lineHeight="1.8" 
                                    fontWeight="bold"
                                >
                                    Identifies and tracks your use of filler words, helping you develop more polished and professional speaking habits.
                                </Text>
                            </Box>
                            <Box 
                                {...featureBoxStyles}
                                textAlign="center" 
                                padding={{base: "30px 20px", md: "40px 30px"}} 
                                _hover={{
                                    transform: "translateY(-10px)",
                                    boxShadow: "0 20px 35px -5px rgba(74, 222, 128, 0.3)"
                                }}
                            >
                                <Circle 
                                    size="60px" 
                                    bg="rgba(74, 222, 128, 0.2)" 
                                    mb={5} 
                                    mx="auto" 
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="center"
                                >
                                    <Icon as={FaChartLine} color={secondaryAccent} w={7} h={7} />
                                </Circle>
                                <Heading 
                                    size="lg" 
                                    color={secondaryAccent} 
                                    marginBottom="16px"
                                >
                                    Real-Time Feedback
                                </Heading>
                                <Text fontSize="18px" color={textColor} lineHeight="1.8" fontWeight="bold" align="center">
                                    Get instant feedback on your speaking patterns, track your progress over time.
                                </Text>
                            </Box>
                        </SimpleGrid>
                    </Box>

                    {/* Technology Info Section */}
                    <Box 
                        {...cardBoxStyles}
                        padding="50px 30px" 
                        marginY="70px"

                    >
                        <VStack 
                        spacing={8}
                        >
                            <Heading 
                                textAlign="center"
                                size="xl"
                                textShadow={`
                                    0 0 8px #fc6900ff,
                                    0 0 1px #fc6900ff,
                                    0 0 32px #fc690010
                                `}
                            >
                                Powered by Advanced Technology
                            </Heading>
                            
                            <Divider width="100px" borderColor={accentColor} opacity={0.6} />
                            
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} width="100%">
                                <VStack align="flex-start" spacing={4}>
                                    <HStack>
                                        <Icon as={FaCode} color={accentColor} w={5} h={5} />
                                        <Heading size="md" color={highlightColor}>
                                            Advanced Speech Recognition
                                        </Heading>
                                    </HStack>
                                    <Text fontSize="md" color={textColor} lineHeight="1.8">
                                        Our platform delivers unparalleled speech recognition accuracy,
                                        even in noisy environments or with different accents. Our technology
                                        provides excellent performance while maintaining efficiency.
                                    </Text>
                                </VStack>
                                
                                <VStack align="flex-start" spacing={4}>
                                    <HStack>
                                        <Icon as={FaGlobe} color={tertiaryAccent} w={5} h={5} />
                                        <Heading 
                                            size="md" 
                                            color={highlightColor}
                                        >
                                            Secure Processing
                                        </Heading>
                                    </HStack>
                                    <Text 
                                        fontSize="md" 
                                        color={textColor} 
                                        lineHeight="1.8"
                                    >
                                        Your voice data never leaves our secure servers. Our implementation
                                        processes all data locally, ensuring your privacy while still delivering 
                                        state-of-the-art speech recognition capabilities.
                                    </Text>
                                </VStack>
                                <VStack align="flex-start" spacing={4}>
                                    <HStack>
                                        <Icon as={FaTools} color={secondaryAccent} w={5} h={5} />
                                        <Heading 
                                            size="md" 
                                            color={highlightColor}
                                        >
                                            Enhanced Filler Detection
                                        </Heading>
                                    </HStack>
                                    <Text 
                                        fontSize="md" 
                                        color={textColor} 
                                        lineHeight="1.8"
                                    >
                                        Our sophisticated algorithms detect not only standard filler words but also
                                        variations and partial matches, giving you a comprehensive view of your
                                        speaking habits.
                                    </Text>
                                </VStack>
                                <VStack align="flex-start" spacing={4}>
                                    <HStack>
                                        <Icon as={FaRocket} color={accentColor} w={5} h={5} />
                                        <Heading 
                                            size="md" 
                                            color={highlightColor}
                                        >
                                            Performance Optimization
                                        </Heading>
                                    </HStack>
                                    <Text 
                                        fontSize="md" 
                                        color={textColor} 
                                        lineHeight="1.8">
                                        We've fine-tuned our speech analysis parameters specifically for filler word preservation,
                                        ensuring that our system captures these often subtle speech patterns that other
                                        technologies might miss.
                                    </Text>
                                </VStack>
                            </SimpleGrid>
                        </VStack>
                    </Box>

                    {/* Call to Action Section */}
                    <Box
                        textAlign="center"
                        padding={{base: "40px 20px", md: "60px 40px"}}
                        bg="rgba(15, 23, 42, 0.9)"
                        color={textColor}
                        borderRadius="20px"
                        boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.2)"
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
                            bgGradient="linear-gradient(135deg, #38bdf8 0%, #c084fc 100%)"
                            zIndex="0"
                        />
                        
                        <VStack spacing={6} position="relative" zIndex="1">
                            <Heading 
                                size="2xl" 
                                bgGradient={`linear-gradient(90deg, ${highlightColor}, #f0abfc)`}
                                bgClip="text"
                                fontWeight="bold"
                            >
                                Let's Transform Your Communication Skills!
                            </Heading>
                            <Text 
                                fontSize={{base: "20px", md: "30px"}} 
                                maxW="1000px" 
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

                    {/* Our Team Section */}
                    <Box 
                        {...teamCardStyles}
                        padding={{base: "40px 20px", md: "70px 20px"}} 
                        textAlign="center"
                        marginY="70px"
                        width="100%"
                    >
                        <Heading 
                            size={headingSize}
                            bgGradient={`linear-gradient(90deg, ${tertiaryAccent}, ${accentColor})`}
                            bgClip="text"
                            marginBottom="40px"
                            fontWeight="extrabold"
                        >
                            Our Team
                        </Heading>
                        <Text 
                            fontSize="lg" 
                            color={textColor} 
                            maxWidth="800px" 
                            margin="0 auto" 
                            marginBottom="60px" 
                            lineHeight="1.8"
                        >
                            ProComm is built by a talented team of developers, designers, and speech experts dedicated 
                            to helping you become a better communicator through innovative technology and thoughtful design.
                        </Text>
                        
                        <Wrap spacing="30px" justify="center">
                            {teamMembers.map((member, i) => (
                                <WrapItem key={i}>
                                    <VStack
                                    {...teamCardStyles}
                                    _hover={{
                                        transform: "translateY(-5px)",
                                        boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.3)"
                                    }}
                                    >
                                        <Circle 
                                            size="80px"
                                            bg={member.bg}
                                        >
                                            <Icon
                                                as={member.icon}
                                                color={member.color}
                                                w={8}
                                                h={8}
                                            
                                            />
                                        </Circle>
                                        <Heading
                                            size="md"
                                            color={member.color}
                                        >
                                            {member.role}
                                        </Heading>
                                        <Text color={textColor}>
                                            {member.description}
                                        </Text>
                                    </VStack>
                                </WrapItem>
                            ))}
                        </Wrap>
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
                        <HStack justifyContent="center" spacing={4} mb={4}>
                            <Circle 
                                size="36px" 
                                bg={`rgba(56, 189, 248, 0.1)`} 
                                display="flex" alignItems="center" 
                                justifyContent="center"
                            >
                                <Icon as={FaMicrophone} color={accentColor} w={4} h={4} />
                            </Circle>
                            <Text fontWeight="bold" color={textColor}>ProComm</Text>
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

export default About;