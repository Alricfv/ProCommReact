import { Box, VStack, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Divider, Badge, Button, Icon, Text } from "@chakra-ui/react";
import { FaUser } from "react-icons/fa";
import { useUser } from '../../context/UserContext';

const ProfileTab = ({
  recordingHistory,
  accentColor,
  secondaryAccent,
  tertiaryAccent,
  cardBg,
  textColor,
  highlightColor,
  setActiveTab
}) => {
  const { username } = useUser();
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
      <VStack spacing={8} align="stretch" width="100%">
        <Heading 
          size="2xl" 
          color="#fc6900ff"
          textShadow={`
            0 0 8px #fc6900ff,
            0 0 1px #fc6900ff,
            0 0 32px #fc690010                            
          `}
        >
          User Profile
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} width="100%">
          <Box 
            p={6}
            borderRadius="lg"
            bg="rgba(0,0,0,0.2)"
            border="1px solid rgba(255,255,255,0.05)"
          >
            <VStack spacing={5} align="center">
              <Icon as={FaUser} boxSize={20} color="#fc6900ff" />
              <Heading size="lg" color={textColor}>
                {username ? username : 'Guest User'}
              </Heading>
              <Badge 
                colorScheme="purple" 
                fontSize="md" 
                py={1} 
                px={3}
              >
                Free Plan
              </Badge>
            </VStack>
          </Box>
        
          <Box 
            p={6}
            borderRadius="lg"
            bg="rgba(0,0,0,0.2)"
            border="1px solid rgba(255,255,255,0.05)"
          >
            <Heading 
              size="md" 
              color="#fc6900ff" 
              mb={4}
            >
              Recent Activity
            </Heading>

            {recordingHistory.length > 0 ? (
              <VStack align="start" spacing={4}>
                <Text color={textColor}>
                  You have {recordingHistory.length} saved recordings
                </Text>
                
                {recordingHistory.slice(-2).map((record, index) => (
                  <Box 
                    key={index} 
                    p={3} 
                    borderRadius="md" 
                    bg="rgba(0,0,0,0.3)" 
                    width="100%"
                    border="1px solid rgba(255, 255, 255, 0.05)"
                  >
                    <Text fontSize="sm" color={`${textColor}60`}>
                      {record.timestamp.toLocaleTimeString()}
                    </Text>
                    <Badge colorScheme={record.analysis.rate_color || "blue"} mt={1}>
                      {record.analysis.speech_rate}
                    </Badge>
                  </Box>
                ))}
                
                <Button 
                  bg="#fc6900ff" 
                  size="sm" 
                  variant="ghost"
                  alignSelf="center"
                  mt={2}
                  onClick={() => setActiveTab("recordings")}
                >
                  View All Activity
                </Button>
              </VStack>
            ) : (
              <Text color={textColor}>No recording history yet</Text>
            )}
          </Box>
        </SimpleGrid>
        
        <Divider borderColor="gray.700" />
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} width="100%">
          <Stat
            bg="rgba(0,0,0,0.2)"
            p={4}
            borderRadius="lg"
            border="1px solid rgba(255,255,255,0.05)"
          >
            <StatLabel>
              Total Recordings
            </StatLabel>
            <StatNumber color="#fc6900ff">
              {recordingHistory.length}
            </StatNumber>
          </Stat>
          
          <Stat
            bg="rgba(0,0,0,0.2)"
            p={4}
            borderRadius="lg"
            border="1px solid rgba(255,255,255,0.05)"
          >
            <StatLabel>Average Speech Rate</StatLabel>
            <StatNumber color="#fc6900ff">
              {recordingHistory.length > 0 
                ? Math.round(recordingHistory.reduce((sum, record) => sum + record.analysis.raw_rate, 0) / recordingHistory.length) 
                : 0} WPM
            </StatNumber>
          </Stat>
          
          <Stat
            bg="rgba(0,0,0,0.2)"
            p={4}
            borderRadius="lg"
            border="1px solid rgba(255,255,255,0.05)"
          >
            <StatLabel>
              User Since
            </StatLabel>
            <StatNumber color="#fc6900ff">
              Today
            </StatNumber>
          </Stat>
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default ProfileTab;
