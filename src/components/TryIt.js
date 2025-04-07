
import React, { useState } from 'react';
import { Box, Button, VStack, Text, Heading, Container, SimpleGrid, useToast } from '@chakra-ui/react';

export default function TryIt() {
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const toast = useToast();

    const handleRecord = async () => {
        setIsRecording(true);
        try {
            const response = await fetch('/record/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'duration=10'
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Recording failed');
            }
            
            // Wait for 10 seconds
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            toast({
                title: "Recording completed",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Recording failed",
                description: "Please try again",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
        setIsRecording(false);
    };

    const handleTranscribe = async () => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/transcribe/', { method: 'POST' });
            const data = await response.json();
            if (data.transcription) {
                setTranscription(data.transcription);
                toast({
                    title: "Transcription complete",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error('No transcription received');
            }
        } catch (error) {
            toast({
                title: "Transcription failed",
                description: "Please try recording again",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
        setIsAnalyzing(false);
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('/analyze/', { method: 'POST' });
            const data = await response.json();
            if (data.analysis_results) {
                setAnalysis(data.analysis_results);
                toast({
                    title: "Analysis complete",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error('No analysis results received');
            }
        } catch (error) {
            toast({
                title: "Analysis failed",
                description: "Please try again",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
        setIsAnalyzing(false);
    };

    return (
        <Box 
            minHeight="100vh" 
            background="linear-gradient(135deg, #1a1a1a, #2d2d2d)"
            paddingTop="90px"
            color="#ffffff"
        >
            <Container maxW="container.xl" py={10}>
                <VStack spacing={8} align="center">
                    <Heading size="2xl" bgGradient="linear(to-r, #00a6ff, #0074e4)" bgClip="text">
                        Try PROCOMM
                    </Heading>
                    <Text fontSize="xl" textAlign="center" color="#e0e0e0">
                        Record your speech, get instant transcription and detailed analysis
                    </Text>
                    
                    <Button
                        size="lg"
                        colorScheme={isRecording ? "red" : "blue"}
                        onClick={handleRecord}
                        isLoading={isRecording}
                        loadingText="Recording..."
                        w="200px"
                        h="60px"
                        fontSize="lg"
                        boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
                        _hover={{
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)',
                        }}
                        _active={{
                            transform: 'translateY(1px)',
                        }}
                    >
                        {isRecording ? "Recording..." : "Start Recording (10s)"}
                    </Button>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} width="100%">
                        <Box 
                            p={8} 
                            borderRadius="xl" 
                            bg="rgba(255,255,255,0.05)"
                            backdropFilter="blur(10px)"
                            boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
                            height="100%"
                            border="1px solid rgba(255,255,255,0.1)"
                        >
                            <VStack spacing={6}>
                                <Heading size="md" color="#00a6ff">Transcription</Heading>
                                <Button 
                                    onClick={handleTranscribe} 
                                    isDisabled={isRecording}
                                    isLoading={isAnalyzing}
                                    colorScheme="blue"
                                    size="lg"
                                    w="full"
                                >
                                    Get Transcription
                                </Button>
                                <Box 
                                    p={6} 
                                    bg="rgba(0,0,0,0.3)" 
                                    borderRadius="lg" 
                                    width="100%"
                                    minHeight="200px"
                                    border="1px solid rgba(255,255,255,0.05)"
                                >
                                    <Text color="#e0e0e0">{transcription || "Your transcription will appear here..."}</Text>
                                </Box>
                            </VStack>
                        </Box>

                        <Box 
                            p={8} 
                            borderRadius="xl" 
                            bg="rgba(255,255,255,0.05)"
                            backdropFilter="blur(10px)"
                            boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
                            height="100%"
                            border="1px solid rgba(255,255,255,0.1)"
                        >
                            <VStack spacing={6}>
                                <Heading size="md" color="#00a6ff">Speech Analysis</Heading>
                                <Button 
                                    onClick={handleAnalyze} 
                                    isDisabled={isRecording}
                                    isLoading={isAnalyzing}
                                    colorScheme="blue"
                                    size="lg"
                                    w="full"
                                >
                                    Analyze Speech
                                </Button>
                                <Box 
                                    p={6} 
                                    bg="rgba(0,0,0,0.3)" 
                                    borderRadius="lg" 
                                    width="100%"
                                    minHeight="200px"
                                    border="1px solid rgba(255,255,255,0.05)"
                                >
                                    {analysis ? (
                                        <VStack align="start" spacing={3}>
                                            {Object.entries(analysis).map(([key, value]) => (
                                                <Text key={key} color="#e0e0e0">
                                                    <Text as="span" fontWeight="bold" color="#00a6ff">
                                                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                                                    </Text>
                                                    {' '}{value}
                                                </Text>
                                            ))}
                                        </VStack>
                                    ) : (
                                        <Text color="#e0e0e0">Your speech analysis will appear here...</Text>
                                    )}
                                </Box>
                            </VStack>
                        </Box>
                    </SimpleGrid>
                </VStack>
            </Container>
        </Box>
    );
}
