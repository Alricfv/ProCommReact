import { Box, VStack, Heading, SimpleGrid, FormControl, FormLabel, HStack, NumberInput, NumberInputField,
    NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Select, Switch, Text, Slider, 
    SliderTrack, SliderFilledTrack, SliderThumb, Progress, Alert, AlertIcon, Button, Icon, Tooltip 
  } from "@chakra-ui/react";

import { FaClock, FaInfoCircle, FaChartLine, FaDatabase, FaTrash, FaDownload, FaUpload } from "react-icons/fa";

const SettingsTab = ({
  durationValue,
  durationUnit,
  handleDurationChange,
  handleDurationUnitChange,
  enableVAD,
  setEnableVAD,
  vadThreshold,
  setVadThreshold,
  silenceThreshold,
  setSilenceThreshold,
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
  accentColor,
  secondaryAccent,
  tertiaryAccent,
  cardBg,
  textColor,
  highlightColor
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
        size="lg" 
        bgGradient={`linear-gradient(90deg, ${accentColor}, ${tertiaryAccent})`}
        bgClip="text"
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
            <Icon as={FaClock} color={accentColor} boxSize={5} />
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
          
          <FormControl mb={5}>
            <FormLabel color={textColor} display="flex" alignItems="center">
              Voice Activity Detection
              <Tooltip 
                label="Automatically detects when you're speaking and can stop recording after silence" 
                placement="top"
                hasArrow
              >
                <Icon as={FaInfoCircle} ml={1} fontSize="xs" color={`${textColor}60`} />
              </Tooltip>
            </FormLabel>
            <Switch 
              isChecked={enableVAD} 
              onChange={(e) => setEnableVAD(e.target.checked)}
              colorScheme="blue"
            />
            <Text fontSize="xs" color={`${textColor}60`} mt={1}>
              Enhances speech analysis by detecting actual speaking time
            </Text>
          </FormControl>
          
          {enableVAD && (
            <>
              <FormControl mb={5}>
                <FormLabel color={textColor}>Voice Detection Sensitivity</FormLabel>
                <HStack>
                  <Text fontSize="sm" color={`${textColor}80`}>Low</Text>
                  <Slider
                    value={vadThreshold}
                    min={5}
                    max={30}
                    step={1}
                    onChange={(val) => setVadThreshold(val)}
                    flex="1"
                  >
                    <SliderTrack bg="rgba(0,0,0,0.3)">
                      <SliderFilledTrack bg={accentColor} />
                    </SliderTrack>
                    <SliderThumb boxSize={4} bg={accentColor} />
                  </Slider>
                  <Text fontSize="sm" color={`${textColor}80`}>High</Text>
                </HStack>
                <Text fontSize="xs" color={`${textColor}60`} mt={1}>
                  Adjust if voice detection is too sensitive or not sensitive enough
                </Text>
              </FormControl>
              
              <FormControl>
                <FormLabel color={textColor}>Auto-Stop After Silence</FormLabel>
                <Select 
                  value={silenceThreshold}
                  onChange={(e) => setSilenceThreshold(Number(e.target.value))}
                  bg="rgba(0,0,0,0.2)"
                  borderColor="rgba(255,255,255,0.1)"
                  color={textColor}
                >
                  <option value={1000}>1 second</option>
                  <option value={2000}>2 seconds</option>
                  <option value={3000}>3 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={0}>Disabled</option>
                </Select>
                <Text fontSize="xs" color={`${textColor}60`} mt={1}>
                  Automatically stops recording after extended silence
                </Text>
              </FormControl>
            </>
          )}
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
