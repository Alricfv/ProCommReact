import React from "react";
import { Box, VStack, Heading, Text, Divider, SimpleGrid, HStack } from "@chakra-ui/react";

const AboutTab = ({ accentColor, tertiaryAccent, cardBg, textColor, highlightColor }) => (
  <Box 
    bg={cardBg}
    borderRadius="xl"
    border="1px solid rgba(255, 255, 255, 0.1)"
    boxShadow="0 10px 30px -5px rgba(0, 0, 0, 0.3)"
    p={8}
    maxW="800px"
    mx="auto"
  >
    <VStack spacing={6} align="start">
      <Heading 
        size="lg" 
        bgGradient={`linear-gradient(90deg, ${accentColor}, ${tertiaryAccent})`}
        bgClip="text"
      >
        About ProComm
      </Heading>
      
      <Text color={textColor} fontSize="lg" lineHeight="1.7">
        ProComm is an advanced speech analysis tool designed to help you improve your communication skills.
        Record your speech and get instant feedback on pace, clarity, and vocabulary.
      </Text>
      
      <Divider borderColor="gray.700" />
      
      <Heading size="md" color={highlightColor}>How it works</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} width="100%">
        <Box 
          p={5}
          borderRadius="lg"
          bg="rgba(0,0,0,0.2)"
          border="1px solid rgba(255,255,255,0.05)"
        >
          <HStack mb={3}>
            <Box 
              bg={accentColor} 
              color="white" 
              borderRadius="full" 
              w="30px" 
              h="30px" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              fontWeight="bold"
            >
              1
            </Box>
            <Text fontWeight="bold" color={textColor}>Set Duration</Text>
          </HStack>
          <Text color={textColor}>Choose how long you want to record your speech.</Text>
        </Box>
        
        <Box 
          p={5}
          borderRadius="lg"
          bg="rgba(0,0,0,0.2)"
          border="1px solid rgba(255,255,255,0.05)"
        >
          <HStack mb={3}>
            <Box 
              bg={accentColor} 
              color="white" 
              borderRadius="full" 
              w="30px" 
              h="30px" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              fontWeight="bold"
            >
              2
            </Box>
            <Text fontWeight="bold" color={textColor}>Start Recording</Text>
          </HStack>
          <Text color={textColor}>Click "Start Recording" and speak naturally into your microphone.</Text>
        </Box>
        
        <Box 
          p={5}
          borderRadius="lg"
          bg="rgba(0,0,0,0.2)"
          border="1px solid rgba(255,255,255,0.05)"
        >
          <HStack mb={3}>
            <Box 
              bg={accentColor} 
              color="white" 
              borderRadius="full" 
              w="30px" 
              h="30px" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              fontWeight="bold"
            >
              3
            </Box>
            <Text fontWeight="bold" color={textColor}>Analyze Results</Text>
          </HStack>
          <Text color={textColor}>View the transcription and click "Analyze Speech".</Text>
        </Box>
        
        <Box 
          p={5}
          borderRadius="lg"
          bg="rgba(0,0,0,0.2)"
          border="1px solid rgba(255,255,255,0.05)"
        >
          <HStack mb={3}>
            <Box 
              bg={accentColor} 
              color="white" 
              borderRadius="full" 
              w="30px" 
              h="30px" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              fontWeight="bold"
            >
              4
            </Box>
            <Text fontWeight="bold" color={textColor}>Get Feedback</Text>
          </HStack>
          <Text color={textColor}>Receive detailed analytics about your speaking pattern.</Text>
        </Box>
      </SimpleGrid>
      
      <Box 
        p={4} 
        bg={`rgba(192, 132, 252, 0.1)`} 
        borderRadius="md" 
        borderLeft={`3px solid ${tertiaryAccent}`}
        width="100%"
        mt={4}
      >
        <Text color={tertiaryAccent} fontWeight="bold">
          Practice regularly to track your improvement over time!
        </Text>
      </Box>
    </VStack>
  </Box>
);

export default AboutTab;
