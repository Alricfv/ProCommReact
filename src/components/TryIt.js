
import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, VStack, Text, Heading, Container, SimpleGrid, useToast, Progress } from '@chakra-ui/react';

export default function TryIt() {
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [audioData, setAudioData] = useState(null);
    const mediaRecorderRef = useRef(null);
    const speechRecognitionRef = useRef(null);
    const toast = useToast();

    useEffect(() => {
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window) {
            speechRecognitionRef.current = new webkitSpeechRecognition();
            speechRecognitionRef.current.continuous = true;
            speechRecognitionRef.current.interimResults = true;

            speechRecognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscription(finalTranscript);
                }
            };
        }

        return () => {
            if (speechRecognitionRef.current) {
                speechRecognitionRef.current.stop();
            }
        };
    }, []);

    const analyzeSpeech = (text) => {
        const words = text.trim().split(/\s+/);
        const sentences = text.split(/[.!?]+/).filter(Boolean);
        
        // Calculate metrics
        const wordsPerMinute = Math.round((words.length / 5) * 60); // Assuming 5 seconds of speech
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        const avgSentenceLength = words.length / sentences.length;
        const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
        const vocabularyRichness = (uniqueWords / words.length * 100).toFixed(1);

        return {
            speech_rate: `${wordsPerMinute} words per minute`,
            avg_word_length: `${avgWordLength.toFixed(1)} characters`,
            avg_sentence_length: `${avgSentenceLength.toFixed(1)} words`,
            vocabulary_richness: `${vocabularyRichness}%`,
            total_words: words.length,
            unique_words: uniqueWords
        };
    };

    const handleRecord = async () => {
        if (isRecording) {
            try {
                speechRecognitionRef.current?.stop();
            } finally {
                setIsRecording(false);
            }
        } else {
            try {
                setTranscription('');
                speechRecognitionRef.current?.start();
                setIsRecording(true);
                
                setTimeout(() => {
                    try {
                        speechRecognitionRef.current?.stop();
                    } finally {
                        setIsRecording(false);
                        toast({
                            title: "Recording completed",
                            status: "success",
                            duration: 3000,
                            isClosable: true,
                        });
                    }
                }, 5000);
            } catch (error) {
                setIsRecording(false);
                toast({
                    title: "Recording failed",
                    description: "Please check microphone permissions",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            }
        }
    };

    const handleAnalyze = () => {
        if (!transcription) {
            toast({
                title: "No speech to analyze",
                description: "Please record some speech first",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsAnalyzing(true);
        try {
            const results = analyzeSpeech(transcription);
            setAnalysis(results);
            toast({
                title: "Analysis complete",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
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
                        Speech Analyzer
                    </Heading>
                    <Text fontSize="xl" textAlign="center" color="#e0e0e0">
                        Record your speech for instant analysis
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
                    >
                        {isRecording ? "Stop Recording" : "Start Recording (5s)"}
                    </Button>

                    {isRecording && (
                        <Progress
                            size="sm"
                            width="200px"
                            isIndeterminate
                            colorScheme="blue"
                        />
                    )}

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
                                    isDisabled={!transcription}
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
