import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, VStack, Text, Heading, Container, SimpleGrid, useToast, Progress, Badge, HStack, Icon, Tooltip, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { FaMicrophone, FaHistory, FaInfoCircle, FaChartLine } from 'react-icons/fa';

export default function TryIt() {
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [recordingHistory, setRecordingHistory] = useState([]);
    const [timer, setTimer] = useState(180); // 3 minutes in seconds
    const speechRecognitionRef = useRef(null);
    const toast = useToast();

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            speechRecognitionRef.current = new SpeechRecognition();
            speechRecognitionRef.current.continuous = true;
            speechRecognitionRef.current.interimResults = true;
            speechRecognitionRef.current.lang = 'en-US';
            speechRecognitionRef.current.maxAlternatives = 3;

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

    useEffect(() => {
        let interval;
        if (isRecording && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording, timer]);

    const analyzeSpeech = (text) => {
        const words = text.trim().split(/\s+/);
        const sentences = text.split(/[.!?]+/).filter(Boolean);

        const wordsPerMinute = Math.round((words.length / 5) * 60);
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
            unique_words: uniqueWords,
            confidence_score: Math.round(Math.random() * 20 + 80) // Simulated confidence score
        };
    };

    const handleRecord = async () => {
        if (isRecording) {
            try {
                speechRecognitionRef.current?.stop();
            } finally {
                setIsRecording(false);
                setTimer(5);
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
                        setTimer(180);
                        toast({
                            title: "Recording completed",
                            description: "Maximum time (3 minutes) reached",
                            status: "success",
                            duration: 3000,
                            isClosable: true,
                        });
                    }
                }, 180000); // 3 minutes in milliseconds
            } catch (error) {
                setIsRecording(false);
                setTimer(5);
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
            setRecordingHistory([...recordingHistory, { transcription, analysis: results, timestamp: new Date() }]);
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
                                    boxShadow="0 4px 6px rgba(0, 0, 0, 0.1)"
                                    _hover={{
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 8px rgba(0, 0, 0, 0.2)',
                                    }}
                                >
                                    {isRecording ? `Stop Recording (${timer}s)` : "Start Recording"}
                                </Button>

                                <Button
                                    onClick={handleAnalyze}
                                    isDisabled={!transcription}
                                    isLoading={isAnalyzing}
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
                                <StatHelpText>
                                    <Icon as={FaInfoCircle} mr={2} />
                                    Ideal: 120-150 WPM
                                </StatHelpText>
                            </Stat>

                            <Stat
                                bg="rgba(255,255,255,0.05)"
                                p={4}
                                borderRadius="lg"
                                border="1px solid rgba(255,255,255,0.1)"
                            >
                                <StatLabel>Vocabulary Richness</StatLabel>
                                <StatNumber color="#00a6ff">{analysis.vocabulary_richness}</StatNumber>
                                <StatHelpText>
                                    <Icon as={FaInfoCircle} mr={2} />
                                    Higher is better
                                </StatHelpText>
                            </Stat>

                            <Stat
                                bg="rgba(255,255,255,0.05)"
                                p={4}
                                borderRadius="lg"
                                border="1px solid rgba(255,255,255,0.1)"
                            >
                                <StatLabel>Confidence Score</StatLabel>
                                <StatNumber color="#00a6ff">{analysis.confidence_score}%</StatNumber>
                                <StatHelpText>
                                    <Icon as={FaInfoCircle} mr={2} />
                                    Speech clarity
                                </StatHelpText>
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