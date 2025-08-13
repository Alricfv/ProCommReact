import { Box, VStack, Heading, SimpleGrid, FormControl, FormLabel, HStack, NumberInput, NumberInputField,
    NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Select, Text, Progress, Alert, AlertIcon,
    Button, Icon
  } from "@chakra-ui/react";

import { FaClock, FaInfoCircle, FaChartLine, FaDatabase, FaTrash, FaDownload, FaUpload } from "react-icons/fa";

const SettingsTab = ({
  durationValue,
  durationUnit,
  handleDurationChange,
  handleDurationUnitChange,
  storagePreference,
  handleStoragePreferenceChange,
  isLocalStorageAvailable,
  storageUsage,
  storagePercentage,
  ESTIMATED_MAX_STORAGE_MB,
  fileInputRef,
  handleImportRecordings,
  handleClearHistory,
  handleExportRecordings,
  recordingHistory,
  secondaryAccent,
  tertiaryAccent,
  cardBg,
  textColor,
}) => (
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
        size="2xl"
        textShadow={`
          0 0 8px #fc6900ff,
          0 0 1px #fc6900ff,
          0 0 32px #fc690010                            
        `}
        color="#fc6900ff"
      >
        Settings
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} width="100%">
        <Box 
          p={6}
          borderRadius="lg"
          bg="rgba(0,0,0,0.2)"
          border="1px solid rgba(255,255,255,0.05)"
        >
          <HStack mb={4}>
            <Icon as={FaClock} color="#fc6900ff" boxSize={5} />
            <Heading size="md" color={textColor}>Recording Settings</Heading>
          </HStack>
          
          <FormControl mb={5}>
            <FormLabel color={textColor}>Default Recording Duration</FormLabel>
            <HStack>
              <NumberInput 
                min={1} 
                max={30} 
                value={durationValue}
                onChange={handleDurationChange}
                bg="rgba(0,0,0,0.2)"
                borderColor="rgba(255,255,255,0.1)"
              >
                <NumberInputField color={textColor} />
                <NumberInputStepper>
                  <NumberIncrementStepper borderColor="rgba(255,255,255,0.1)" color={textColor} />
                  <NumberDecrementStepper borderColor="rgba(255,255,255,0.1)" color={textColor} />
                </NumberInputStepper>
              </NumberInput>
              <Select 
                value={durationUnit} 
                onChange={handleDurationUnitChange}
                width="120px"
                bg="rgba(0,0,0,0.2)"
                borderColor="rgba(255,255,255,0.1)"
                color={textColor}
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
              </Select>
            </HStack>
          </FormControl>
          
          <FormControl mb={5}>
            <FormLabel color={textColor}>Audio Quality</FormLabel>
            <Select 
              defaultValue="high"
              bg="rgba(0,0,0,0.2)"
              borderColor="rgba(255,255,255,0.1)"
              color={textColor}
            >
              <option value="low">Low (64kbps)</option>
              <option value="medium">Medium (96kbps)</option>
              <option value="high">High (128kbps)</option>
            </Select>
          </FormControl>
          
        </Box>
        <Box 
          p={6}
          borderRadius="lg"
          bg="rgba(0,0,0,0.2)"
          border="1px solid rgba(255,255,255,0.05)"
        >
          <HStack mb={4}>
            <Icon as={FaChartLine} color={secondaryAccent} boxSize={5} />
            <Heading size="md" color={textColor}>Analysis Settings</Heading>
          </HStack>
          
          <FormControl mb={5}>
            <FormLabel color={textColor}>Theme</FormLabel>
            <Select 
              defaultValue="dark"
              bg="rgba(0,0,0,0.2)"
              borderColor="rgba(255,255,255,0.1)"
              color={textColor}
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel color={textColor}>Data Storage</FormLabel>
            <Select 
              value={storagePreference}
              onChange={handleStoragePreferenceChange}
              bg="rgba(0,0,0,0.2)"
              borderColor="rgba(255,255,255,0.1)"
              color={textColor}
            >
              <option value="none">Don't Store Data</option>
              <option value="session">Store in Session</option>
              <option value="local">Store Locally</option>
            </Select>
          </FormControl>
        </Box>
      </SimpleGrid>
      
      <Box 
        p={6}
        borderRadius="lg"
        bg="rgba(0,0,0,0.2)"
        border="1px solid rgba(255,255,255,0.05)"
        width="100%"
      >
        <HStack mb={4}>
          <Icon as={FaDatabase} color={tertiaryAccent} boxSize={5} />
          <Heading size="md" color={textColor}>Data Management</Heading>
        </HStack>
        
        <VStack spacing={4} align="start" width="100%">
          <Text color={textColor}>
            {recordingHistory.length} recordings stored ({storagePreference === 'local' ? 'local storage' : 'session only'})
          </Text>
          
          {storagePreference === 'local' && isLocalStorageAvailable && (
            <>
              <Box width="100%">
                <HStack justify="space-between" mb={1}>
                  <Text color={textColor} fontSize="sm">Storage Usage</Text>
                  <Text color={textColor} fontSize="sm">{storageUsage} KB / {ESTIMATED_MAX_STORAGE_MB * 1024} KB</Text>
                </HStack>
                <Progress 
                  value={storagePercentage} 
                  size="sm" 
                  borderRadius="md"
                  colorScheme={storagePercentage > 80 ? "red" : storagePercentage > 60 ? "yellow" : "green"}
                />
                {storagePercentage > 80 && (
                  <Text color="red.300" fontSize="xs" mt={1}>
                    <Icon as={FaInfoCircle} mr={1} />
                    Storage nearly full. Consider clearing old recordings.
                  </Text>
                )}
              </Box>
              
              {!isLocalStorageAvailable && (
                <Alert status="warning" variant="left-accent" borderRadius="md">
                  <AlertIcon />
                  Local storage is not available in your browser. Your recordings won't persist.
                </Alert>
              )}
            </>
          )}
          
          <HStack width="100%" spacing={4}>
            <Button 
              colorScheme="red" 
              variant="outline" 
              size="md"
              leftIcon={<Icon as={FaTrash} />}
              onClick={handleClearHistory}
              isDisabled={recordingHistory.length === 0}
              flex="1"
            >
              Clear History
            </Button>
            
            <Button 
              colorScheme="blue" 
              variant="outline" 
              size="md"
              leftIcon={<Icon as={FaDownload} />}
              onClick={handleExportRecordings}
              isDisabled={recordingHistory.length === 0}
              flex="1"
            >
              Export
            </Button>
            
            <Button 
              colorScheme="green" 
              variant="outline" 
              size="md"
              leftIcon={<Icon as={FaUpload} />}
              onClick={() => fileInputRef.current?.click()}
              flex="1"
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
        </VStack>
      </Box>
      
      <Box 
        p={4} 
        bg={`rgba(192, 132, 252, 0.1)`} 
        borderRadius="md" 
        borderLeft={`3px solid ${tertiaryAccent}`}
        width="100%"
        mt={2}
      >
        <Text color={tertiaryAccent} fontSize="sm">
          <Icon as={FaInfoCircle} mr={2} />
          Local storage persists between browser sessions but has limited space (5-10MB). Session storage is cleared when you close the browser.
        </Text>
      </Box>
    </VStack>
  </Box>
);

export default SettingsTab;
