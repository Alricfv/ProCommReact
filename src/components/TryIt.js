import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, VStack, Text, Heading, Container, SimpleGrid, useToast, Progress, Badge, HStack, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { FaMicrophone, FaChartLine } from 'react-icons/fa';

export default function TryIt() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [recordingHistory, setRecordingHistory] = useState([]);
    const recognitionRef = useRef(null);
    const toast = useToast();

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 3;
            recognition.lang = 'en-US';

            // Increase recognition sensitivity
            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        // Take highest confidence result
                        const alternatives = Array.from(event.results[i]);
                        const bestMatch = alternatives.reduce((prev, current) => 
                            (current.confidence > prev.confidence) ? current : prev
                        );
                        finalTranscript += bestMatch.transcript + ' ';
                    }
                }
                setTranscription(finalTranscript.trim());
            };

            recognition.onerror = (event) => {
                toast({
                    title: "Recognition Error",
                    description: event.error,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        } else {
            toast({
                title: "Browser not supported",
                description: "Your browser doesn't support speech recognition",
                status: "error",
                duration: null,
                isClosable: true,
            });
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [toast]);

    const analyzeSpeech = (text) => {
        const words = text.trim().split(/\s+/);
        const sentences = text.split(/[.!?]+/).filter(Boolean);

        const wordsPerMinute = Math.round((words.length / 5) * 60);
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        const avgSentenceLength = words.length / sentences.length;
        const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
        
        // Stricter vocabulary richness calculation
        const vocabularyRichness = (uniqueWords / words.length * 100).toFixed(1);
        const vocabularyScore = vocabularyRichness > 60 ? 'Excellent' : 
                              vocabularyRichness > 45 ? 'Good' :
                              vocabularyRichness > 30 ? 'Fair' : 'Needs Improvement';
        
        // More detailed clarity score based on sentence structure
        const clarityFactors = {
            optimalSentenceLength: Math.abs(avgSentenceLength - 15) < 5 ? 30 : 15, // Optimal length is 10-20 words
            wordVariety: (uniqueWords / words.length) * 30,
            structureComplexity: Math.min(30, (avgWordLength / 5) * 30) // Reward moderate complexity
        };
        
        const clarityScore = Math.min(100, Math.round(
            clarityFactors.optimalSentenceLength +
            clarityFactors.wordVariety +
            clarityFactors.structureComplexity
        ));

        return {
            speech_rate: `${wordsPerMinute} words per minute`,
            avg_word_length: `${avgWordLength.toFixed(1)} characters`,
            avg_sentence_length: `${avgSentenceLength.toFixed(1)} words`,
            vocabulary_richness: `${vocabularyRichness}% (${vocabularyScore})`,
            total_words: words.length,
            unique_words: uniqueWords,
            confidence_score: clarityScore
        };
    };

    const handleRecord = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                recognitionRef.current?.start();
                setIsRecording(true);
                setTranscription('');
            } catch (error) {
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

        const results = analyzeSpeech(transcription);
        setAnalysis(results);
        setRecordingHistory([...recordingHistory, { transcription, analysis: results, timestamp: new Date() }]);
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
                    <Box textAlign="center" mb={8}>
                        <Heading 
                            size="2xl" 
                            bgGradient="linear(to-r, #00a6ff, #0074e4)" 
                            bgClip="text"
                            mb={4}
                        >
                            Speech Analyzer
                        </Heading>
                        <Text fontSize="xl" color="#e0e0e0" maxW="800px">
                            Enhance your speaking skills with real-time analysis. Simply record your voice
                            and get instant feedback on your speech patterns.
                        </Text>
                    </Box>

                    <Box 
                        p={6} 
                        borderRadius="xl" 
                        bg="rgba(255,255,255,0.05)"
                        backdropFilter="blur(10px)"
                        width="full"
                        maxW="800px"
                        border="1px solid rgba(255,255,255,0.1)"
                    >
                        <VStack spacing={6}>
                            <HStack spacing={4}>
                                <Button
                                    size="lg"
                                    colorScheme={isRecording ? "red" : "blue"}
                                    onClick={handleRecord}
                                    leftIcon={<FaMicrophone />}
                                    w="200px"
                                    h="60px"
                                    fontSize="lg"
                                >
                                    {isRecording ? "Stop Recording" : "Start Recording"}
                                </Button>

                                <Button
                                    onClick={handleAnalyze}
                                    isDisabled={!transcription}
                                    colorScheme="green"
                                    size="lg"
                                    leftIcon={<FaChartLine />}
                                >
                                    Analyze Speech
                                </Button>
                            </HStack>

                            {isRecording && (
                                <Progress
                                    size="sm"
                                    width="100%"
                                    isIndeterminate
                                    colorScheme="blue"
                                />
                            )}

                            <Box 
                                p={6} 
                                bg="rgba(0,0,0,0.3)" 
                                borderRadius="lg" 
                                width="100%"
                                minHeight="150px"
                                border="1px solid rgba(255,255,255,0.05)"
                            >
                                <Text color="#e0e0e0">
                                    {transcription || "Your transcription will appear here..."}
                                </Text>
                            </Box>
                        </VStack>
                    </Box>

                    {analysis && (
                        <SimpleGrid 
                            columns={{ base: 1, md: 2, lg: 3 }} 
                            spacing={6} 
                            width="100%"
                            maxW="800px"
                        >
                            <Stat
                                bg="rgba(255,255,255,0.05)"
                                p={4}
                                borderRadius="lg"
                                border="1px solid rgba(255,255,255,0.1)"
                            >
                                <StatLabel>Speech Rate</StatLabel>
                                <StatNumber color="#00a6ff">{analysis.speech_rate}</StatNumber>
                                <StatHelpText>Ideal: 120-150 WPM</StatHelpText>
                            </Stat>

                            <Stat
                                bg="rgba(255,255,255,0.05)"
                                p={4}
                                borderRadius="lg"
                                border="1px solid rgba(255,255,255,0.1)"
                            >
                                <StatLabel>Vocabulary Richness</StatLabel>
                                <StatNumber color="#00a6ff">{analysis.vocabulary_richness}</StatNumber>
                                <StatHelpText>Higher is better</StatHelpText>
                            </Stat>

                            <Stat
                                bg="rgba(255,255,255,0.05)"
                                p={4}
                                borderRadius="lg"
                                border="1px solid rgba(255,255,255,0.1)"
                            >
                                <StatLabel>Confidence Score</StatLabel>
                                <StatNumber color="#00a6ff">{analysis.confidence_score}%</StatNumber>
                                <StatHelpText>Speech clarity</StatHelpText>
                            </Stat>
                        </SimpleGrid>
                    )}

                    {recordingHistory.length > 0 && (
                        <Box 
                            width="100%" 
                            maxW="800px"
                            mt={8}
                            p={6}
                            bg="rgba(255,255,255,0.05)"
                            borderRadius="xl"
                            border="1px solid rgba(255,255,255,0.1)"
                        >
                            <Heading size="md" mb={4}>Recording History</Heading>
                            <VStack spacing={4} align="stretch">
                                {recordingHistory.slice(-3).map((record, index) => (
                                    <Box 
                                        key={index}
                                        p={4}
                                        bg="rgba(0,0,0,0.3)"
                                        borderRadius="lg"
                                        border="1px solid rgba(255,255,255,0.05)"
                                    >
                                        <Text fontSize="sm" color="#888" mb={2}>
                                            {record.timestamp.toLocaleTimeString()}
                                        </Text>
                                        <Text noOfLines={2} mb={2}>{record.transcription}</Text>
                                        <HStack spacing={4}>
                                            <Badge colorScheme="blue">
                                                {record.analysis.speech_rate}
                                            </Badge>
                                            <Badge colorScheme="green">
                                                Score: {record.analysis.confidence_score}%
                                            </Badge>
                                        </HStack>
                                    </Box>
                                ))}
                            </VStack>
                        </Box>
                    )}
                </VStack>
            </Container>
        </Box>
    );
}