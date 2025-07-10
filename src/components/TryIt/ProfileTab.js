import React from "react";
import { Box, VStack, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, Divider, Badge, Button, Icon, Text, Flex, HStack } from "@chakra-ui/react";
import { FaUser } from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";

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
  const { user, isAuthenticated, logout } = useAuth0();
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
          size="lg" 
          bgGradient={`linear-gradient(90deg, ${accentColor}, ${tertiaryAccent})`}
          bgClip="text"
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
              <Icon as={FaUser} boxSize={20} color={accentColor} />
              <Heading size="lg" color={textColor}>
                {isAuthenticated && user ? (user.name || user.nickname || user.email) : 'Guest User'}
              </Heading>
              <Badge colorScheme="purple" fontSize="md" py={1} px={3}>Free Plan</Badge>
              
              {isAuthenticated && (
                <Button colorScheme="red" width="100%" mt={2} onClick={() => logout({ returnTo: window.location.origin + '/ProCommReact' })}>
                  Sign Out
                </Button>
              )}
              
              {!isAuthenticated && (
                <VStack spacing={3} width="100%" mt={3}>
                  <Button 
                    colorScheme="blue" 
                    size="md"
                    width="100%"
                    leftIcon={<Icon as={FaUser} />}
                  >
                    Create Account
                  </Button>
                  
                  <Button 
                    variant="outline"
                    size="md"
                    width="100%"
                    borderColor="rgba(255, 255, 255, 0.2)"
                    _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
                    color="white"
                  >
                    Login
                  </Button>
                </VStack>
              )}
            </VStack>
          </Box>
        
          <Box 
            p={6}
            borderRadius="lg"
            bg="rgba(0,0,0,0.2)"
            border="1px solid rgba(255,255,255,0.05)"
          >
            <Heading size="md" color={highlightColor} mb={4}>Recent Activity</Heading>
            
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
                  colorScheme="blue" 
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
            <StatLabel>Total Recordings</StatLabel>
            <StatNumber color={accentColor}>{recordingHistory.length}</StatNumber>
          </Stat>
          
          <Stat
            bg="rgba(0,0,0,0.2)"
            p={4}
            borderRadius="lg"
            border="1px solid rgba(255,255,255,0.05)"
          >
            <StatLabel>Average Speech Rate</StatLabel>
            <StatNumber color={accentColor}>
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
            <StatLabel>User Since</StatLabel>
            <StatNumber color={accentColor} fontSize="md">Today</StatNumber>
          </Stat>
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default ProfileTab;
