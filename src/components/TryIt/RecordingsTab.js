import React from "react";
import { Box, VStack, Heading, Flex, Text, HStack, Button, Icon, Badge, Progress, SimpleGrid, Stat, StatLabel, StatNumber } from "@chakra-ui/react";
import { FaHistory, FaTrash, FaDownload, FaUpload, FaClock } from "react-icons/fa";

const RecordingsTab = ({
  recordingHistory,
  handleClearHistory,
  handleExportRecordings,
  handleImportRecordings,
  fileInputRef,
  storagePreference,
  isLocalStorageAvailable,
  storageUsage,
  storagePercentage,
  accentColor,
  secondaryAccent,
  tertiaryAccent,
  textColor,
  formatDuration,
  downloadAudioAsMp3,
  cardBg
}) => {
  console.log("RecordingsTab rendered with:", {
    recordingHistoryLength: recordingHistory ? recordingHistory.length : 0,
    recordingHistoryItems: recordingHistory ? recordingHistory.map(r => ({
      timestamp: r.timestamp ? r.timestamp.toString() : "no timestamp",
      hasAudio: !!r.audioBlob,
      hasTranscription: !!r.transcription
    })) : [],
    storagePreference,
    isLocalStorageAvailable
  });
  
  console.log("Recording durations and silence:", recordingHistory.map(r => ({
    duration: r.duration,
    silence: r.analysis && r.analysis.silence_duration
  })));
  
  return (
  <Box 
      bg={cardBg}
      borderRadius="xl"
      border="1px solid rgba(255, 255, 255, 0.1)"
      boxShadow="0 10px 30px -5px rgba(0, 0, 0, 0.3)"
      p={8}
      maxW="800px"
      mx="auto"
  >
    <VStack spacing={8} align="start" width="100%">
      <Heading 
          size="lg" 
          bgGradient={`linear-gradient(90deg, ${accentColor}, ${secondaryAccent})`}
          bgClip="text"
      >
          Recordings
      </Heading>
      
      {recordingHistory.length > 0 ? (
          <>
              <Box 
                  p={4} 
                  borderRadius="lg" 
                  bg="rgba(0,0,0,0.2)"
                  border="1px solid rgba(255,255,255,0.05)"
              >
                  <Flex 
                      justifyContent="space-between" 
                      alignItems="center" 
                      mb={storagePreference === 'local' ? 3 : 0}
                      flexWrap="wrap"
                      gap={2}
                  >
                      <Text color={textColor} fontWeight="medium">
                          <Icon as={FaHistory} mr={2} />
                          {recordingHistory.length} Total Recordings
                      </Text>
                      
                      <HStack spacing={2}>
                          <Button 
                              size="sm" 
                              colorScheme="red" 
                              variant="outline"
                              leftIcon={<Icon as={FaTrash} />}
                              onClick={handleClearHistory}
                              isDisabled={recordingHistory.length === 0}
                          >
                              Clear
                          </Button>
                          
                          <Button 
                              size="sm" 
                              colorScheme="blue" 
                              variant="outline"
                              leftIcon={<Icon as={FaDownload} />}
                              onClick={handleExportRecordings}
                              isDisabled={recordingHistory.length === 0}
                          >
                              Export
                          </Button>
                          
                          <Button 
                              size="sm" 
                              colorScheme="green" 
                              variant="outline"
                              leftIcon={<Icon as={FaUpload} />}
                              onClick={() => fileInputRef.current?.click()}
                          >
                              Import
                              <input 
                                  type="file" 
                                  ref={fileInputRef}
                                  style={{ display: 'none' }}
                                  accept=".json"
                                  onChange={handleImportRecordings}
                              />
                          </Button>
                      </HStack>
                  </Flex>
                  
                  {storagePreference === 'local' && isLocalStorageAvailable && (
                      <>
                          <HStack justify="space-between" mb={1} fontSize="xs">
                              <Text color={`${textColor}80`}>Storage: {storageUsage} KB</Text>
                              <Text color={`${textColor}80`}>{storagePercentage}% used</Text>
                          </HStack>
                          <Progress 
                              value={storagePercentage} 
                              size="xs" 
                              borderRadius="md"
                              colorScheme={storagePercentage > 80 ? "red" : storagePercentage > 60 ? "yellow" : "green"}
                          />
                      </>
                  )}
              </Box>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} width="100%">
                  <Stat
                      bg="rgba(0,0,0,0.2)"
                      p={4}
                      borderRadius="lg"
                      border="1px solid rgba(255,255,255,0.05)"
                  >
                      <StatLabel>Average Speech Rate</StatLabel>
                      <StatNumber color={accentColor}>
                          {Math.round(recordingHistory.reduce((sum, record) => sum + record.analysis.raw_rate, 0) / recordingHistory.length)} WPM
                      </StatNumber>
                  </Stat>
                  
                  <Stat
                      bg="rgba(0,0,0,0.2)"
                      p={4}
                      borderRadius="lg"
                      border="1px solid rgba(255,255,255,0.05)"
                  >
                      <StatLabel>Total Speaking Time</StatLabel>
                      <StatNumber color={secondaryAccent}>
                          {formatDuration(recordingHistory.reduce((sum, record) => sum + record.duration, 0))}
                      </StatNumber>
                  </Stat>
                  
                  <Stat
                      bg="rgba(0,0,0,0.2)"
                      p={4}
                      borderRadius="lg"
                      border="1px solid rgba(255,255,255,0.05)"
                  >
                      <StatLabel>Most Recent</StatLabel>
                      <StatNumber color={tertiaryAccent} fontSize="md">
                          {recordingHistory[recordingHistory.length - 1].timestamp.toLocaleString()}
                      </StatNumber>
                  </Stat>
              </SimpleGrid>
              
              <VStack spacing={4} width="100%" align="stretch" maxHeight="500px" overflowY="auto"
                  sx={{
                      '&::-webkit-scrollbar': {
                          width: '8px',
                          background: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                          background: `rgba(56, 189, 248, 0.5)`,
                          borderRadius: '4px',
                      },
                  }}
              >
                  {recordingHistory.map((record, index) => (
                      <Box 
                          key={index} 
                          p={5}
                          bg="rgba(0,0,0,0.2)"
                          borderRadius="lg"
                          border="1px solid rgba(255,255,255,0.05)"
                          transition="all 0.3s ease"
                          _hover={{
                              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                              transform: "translateY(-2px)",
                              borderColor: `rgba(${accentColor.replace('#', '')}, 0.3)`
                          }}
                      >
                          <Flex justifyContent="space-between" alignItems="center" mb={3}>
                              <Badge 
                                  colorScheme={record.analysis.rate_color || "blue"}
                                  px={3}
                                  py={1}
                                  borderRadius="md"
                                  fontSize="sm"
                              >
                                  {record.analysis.speech_rate}
                              </Badge>
                              
                              <HStack>
                                  <Icon as={FaClock} color={`${textColor}60`} />
                                  <Text fontSize="sm" color={`${textColor}60`}>
                                      {formatDuration(record.duration || 180)}
                                  </Text>
                              </HStack>
                          </Flex>
                          
                          <Text noOfLines={2} mb={3} color={textColor} fontWeight="medium">
                              {record.transcription.length > 100 
                                  ? record.transcription.substring(0, 100) + "..." 
                                  : record.transcription}
                          </Text>
                          
                          <Flex justifyContent="space-between" alignItems="center" mb={3}>
                              <Text fontSize="sm" color={`${textColor}60`}>
                                  {record.timestamp.toLocaleString()}
                              </Text>
                              
                              <HStack spacing={3}>
                                  <Badge 
                                      bg={`${secondaryAccent}30`}
                                      color={secondaryAccent}
                                      px={2}
                                      py={1}
                                      borderRadius="md"
                                      border={`1px solid ${secondaryAccent}50`}
                                  >
                                      Score: {record.analysis.confidence_score}%
                                  </Badge>
                                  
                                  <Badge 
                                      bg={`${tertiaryAccent}30`}
                                      color={tertiaryAccent}
                                      px={2}
                                      py={1}
                                      borderRadius="md"
                                      fontSize="xs"
                                  >
                                      Words: {record.analysis.total_words}
                                  </Badge>
                              </HStack>
                          </Flex>
                          
                          {/* Audio player and download button */}
                          {record.audioUrl && record.audioBlob && (
                              <Box mt={2}>
                                  <Flex justifyContent="space-between" alignItems="center">
                                      <audio 
                                          controls 
                                          src={record.audioUrl}
                                          style={{ 
                                              height: '40px', 
                                              borderRadius: '8px', 
                                              backgroundColor: 'rgba(0,0,0,0.2)' 
                                          }}
                                      />
                                      <Button
                                          size="sm"
                                          leftIcon={<Icon as={FaDownload} />}
                                          colorScheme="blue"
                                          variant="outline"
                                          onClick={() => downloadAudioAsMp3(record.audioBlob, `recording-${record.timestamp.toISOString().slice(0,10)}.mp3`)}
                                          ml={2}
                                      >
                                          MP3
                                      </Button>
                                  </Flex>
                              </Box>
                          )}
                      </Box>
                  ))}
              </VStack>
          </>
      ) : (
          <Box 
              width="100%" 
              py={12} 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center"
              borderRadius="lg"
              bg="rgba(0,0,0,0.2)"
              border="1px dashed rgba(255,255,255,0.1)"
          >
              <Text color={`${textColor}80`} textAlign="center" py={8}>
                  No recordings yet. Start recording to see your history here.
              </Text>
          </Box>
      )}
    </VStack>
  </Box>
);}

export default RecordingsTab;
