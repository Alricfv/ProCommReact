import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, VStack, Text, Heading, Container, SimpleGrid, useToast, Progress, Badge, HStack, Icon, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { FaMicrophone, FaHistory, FaInfoCircle, FaChartLine } from 'react-icons/fa';

export default function TryIt() {
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [recordingHistory, setRecordingHistory] = useState([]);
    const [timer, setTimer] = useState(180); // 3 minutes in seconds
    const [sentiment, setSentiment] = useState('');
    const [sentimentScore, setSentimentScore] = useState(null);
    const [emotion, setEmotion] = useState('');
    const [emotionScore, setEmotionScore] = useState(null);
    const toast = useToast();

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
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
        const vocabularyRichness = ((uniqueWords / words.length) * 100).toFixed(1);
        const adjustedRichness = Math.min(vocabularyRichness, 100); // Cap richness at 100%

        // Adjust vocabulary richness based on word count thresholds
        let finalRichness;
        if (words.length < 50) {
            finalRichness = adjustedRichness * 0.8; // Penalize for low word count
        } else if (words.length > 200) {
            finalRichness = adjustedRichness * 1.1; // Slight boost for high word count
        } else {
            finalRichness = adjustedRichness;
        }

        return {
            speech_rate: `${wordsPerMinute} words per minute`,
            avg_word_length: `${avgWordLength.toFixed(1)} characters`,
            avg_sentence_length: `${avgSentenceLength.toFixed(1)} words`,
            vocabulary_richness: `${Math.min(finalRichness, 100).toFixed(1)}%`, // Adjusted vocabulary richness
            total_words: words.length,
            unique_words: uniqueWords,
            confidence_score: Math.round(Math.random() * 20 + 80) // Simulated confidence score
        };
    };

    const handleRecord = async () => {
        if (!window.MediaRecorder) {
            toast({
                title: "Unsupported Browser",
                description: "Your browser does not support audio recording.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            chunksRef.current = [];
            const mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                console.warn(`${mimeType} is not supported, falling back to default`);
            }

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current.ondataavailable = (e) => {
                console.log("Data available:", e.data);
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                } else {
                    console.warn("Empty audio chunk received.");
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                if (audioBlob.size === 0) {
                    toast({
                        title: "Audio Error",
                        description: "The audio file is empty. Please ensure your microphone is working.",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                    });
                    return;
                }

                try {
                    setIsAnalyzing(true);

                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'audio.webm');

                    const response = await fetch('http://127.0.0.1:5000/transcribe', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to transcribe audio');
                    }

                    const data = await response.json();
                    if (data.error) {
                        throw new Error(data.error);
                    }

                    setTranscription(data.transcription);
                    setSentiment(data.sentiment);
                    setSentimentScore(data.sentiment_score);
                    setEmotion(data.emotion);
                    setEmotionScore(data.emotion_score);

                    toast({
                        title: "Transcription and Analysis Complete",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                } catch (error) {
                    console.error("Transcription error:", error);
                    toast({
                        title: "Transcription failed",
                        description: error.message || "An error occurred during transcription.",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                    });
                } finally {
                    setIsAnalyzing(false);
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access error:", error);
            toast({
                title: "Microphone Error",
                description: "Please allow microphone access in your browser settings.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
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
            background="linear-gradient(135deg, #000000, #ffffff)" 
            backgroundSize="200% 200%" 
            animation="gradientShift 8s ease-in-out infinite" 
            position="relative"
        >
            {/* Add a subtle black-and-white gradient animation */}
            <style>
                {`
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                `}
            </style>
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

                            {emotion && (
                                <Stat
                                    bg="rgba(255,255,255,0.05)"
                                    p={4}
                                    borderRadius="lg"
                                    border="1px solid rgba(255,255,255,0.1)"
                                >
                                    <StatLabel>Emotion</StatLabel>
                                    <StatNumber color="#00a6ff">{emotion}</StatNumber>
                                    <StatHelpText>
                                        <Icon as={FaInfoCircle} mr={2} />
                                        Score: {(emotionScore * 100).toFixed(2)}%
                                    </StatHelpText>
                                </Stat>
                            )}
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
                            maxHeight="600px" // Set a maximum height
                            overflowY="auto" // Enable vertical scrolling
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