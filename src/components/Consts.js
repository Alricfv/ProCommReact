//a few imports to create some of the components here
import {Flex, HStack, Circle, Icon, Heading, Button} from "@chakra-ui/react"
import {Link} from 'react-router-dom';
import {FaMicrophone} from 'react-icons/fa';

//Styles for aesthetics
export const bgGradient = "linear-gradient(135deg, #000000ff 25%, #4032aeff 50%, #16021eff 100%)";
export const accentColor = "#38bdf8"; 
export const textColor = "#e7e9ebff";
export const highlightColor = "#7dd3fc";
export const secondaryAccent = "#4ade80";
export const tertiaryAccent = "#c084fc"; 

//Styles for UI components
export const cardBoxStyles= {
    bg: "rgba(30, 41, 59, 0.8)",
    borderRadius: "20px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(16px)",
    transition: "all 0.3s ease-in-out"
}

export const featureBoxStyles = {
    textAlign: "center",
    borderRadius: "16px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(16px)",
    transition: "all 0.3s ease"
}

export const teamCardStyles = {
    spacing: 4,
    p: 6,
    borderRadius: "lg",
    bg: "rgba(30, 41, 59, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(16px)",
    minW: "250px",
    transition: "all 0.3s ease"
}

export default function NavBar(){
    return(
        <Flex
            as="nav"
            justifyContent="space-between"
            borderRadius="20px"
            top="8px"
            left="0"
            right="0"
            alignItems="center"
            padding="20px 40px"
            bg="rgba(15, 23, 42, 0.9)"
            backdropFilter="blur(10px)"
            boxShadow="0 4px 30px rgba(0, 0, 0, 0.2)"
            position="fixed"
            maxWidth="1500px"
            width="100%"
            mx="auto"
            zIndex="1000"
        >
            <HStack spacing={3}>
                <Circle
                    size="40px"
                    bg={`rgba(56, 189, 248, 0.2)`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Icon as={FaMicrophone} color={accentColor} w={5} h={5} />
                </Circle>
                <Heading
                    size="lg"
                    bgGradient={`linear-gradient(90deg, ${accentColor}, ${tertiaryAccent})`}
                >
                    ProComm
                </Heading>
            </HStack>
            <HStack spacing="20px">
                <Link to="/about">
                    <Button
                        variant="ghost"
                        _hover={{bg: 'rgba(56, 189, 248, 0.2'}}
                        color={textColor}
                    >
                        About
                    </Button>
                </Link>
                <Link to="/try-it">
                    <Button
                        bg={accentColor}
                        _hover={{bg: '#0ea5e9'}}
                        size="md"
                        boxShadow="0 4px 12px rgba(56, 189, 248, 0.4)"
                    >
                        Try it Out!
                    </Button>
                </Link>
                <Link to="/login-page">
                    <Button
                        variant="outline"
                        color={accentColor}
                        borderColor={accentColor}
                        _hover={{bg: accentColor, color: "#fff"}}
                        ml={2}
                    >
                        Login / Register
                    </Button>
                </Link>
            </HStack>
        </Flex>
    )
}