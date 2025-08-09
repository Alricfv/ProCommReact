//a few imports to create some of the components here
import {Flex, HStack, Circle, Icon, Heading, Button, IconButton, Drawer, 
    DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody,
    useDisclosure, VStack, Link
} from "@chakra-ui/react"

import {Link as RouterLink} from 'react-router-dom';

import {FaMicrophone} from 'react-icons/fa';

import {HamburgerIcon} from '@chakra-ui/icons';

//Styles for aesthetics
export const bgGradient = "linear-gradient(135deg, #000000ff 25%, #4032aeff 50%, #16021eff 100%)";
export const accentColor = "#38bdf8"; 
export const textColor = "#e7e9ebff";
export const highlightColor = "#7dd3fc";
export const secondaryAccent = "#4ade80";
export const tertiaryAccent = "#c084fc"; 

//Styles for UI components
export const cardBoxStyles= {
    
    borderRadius: "20px",
    boxShadow: "0 0 14px 0 #fc6900ff",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(16px)",
    transition: "all 0.3s ease-in-out"
}

export const featureBoxStyles = {
    textAlign: "center",
    borderRadius: "16px",
    boxShadow: "0 0 24px 0 #0a336bff",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(16px)",
    transition: "all 0.3s ease"
}

export const teamCardStyles = {
    spacing: 4,
    p: 6,
    borderRadius: "lg",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 0 24px 0 #0a336bff",
    backdropFilter: "blur(16px)",
    minW: "250px",
    transition: "all 0.3s ease"
}

export function NavBar(){
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
                    <Icon as={FaMicrophone} color="#fc6900ff" w={5} h={5} />
                </Circle>
                <Heading
                    size="xl"
                    color= "#fc6900ff"
                    fontWeight="extrabold"
                   
                >
                    ProComm
                </Heading>
            </HStack>
            <HStack spacing="20px">
                <Link as={RouterLink} to="/">
                    <Button
                        variant="ghost"
                        _hover={{bg: "#000000"}}
                        color={textColor}
                    >
                        Home
                    </Button>
                </Link>
                <Link as={RouterLink} to="/about">
                    <Button
                        variant="ghost"
                        _hover={{bg: '#000000'}}
                        color={textColor}
                    >
                        About
                    </Button>
                </Link>
                <Link as={RouterLink} to="/try-it">
                    <Button
                        textColor={textColor}
                        bg="#fc6900ff"
                        _hover={{bg: '#000000'}}
                        size="md"
                        boxShadow={`
                            0 0 8px #fc6900ff,
                            0 0 1px #fc6900ff,
                            0 0 32px #fc690010
                        `}
                    >
                        Try it Out!
                    </Button>
                </Link>
                <Link as={RouterLink} to="/login-page">
                    <Button
                        variant="outline"
                        color="#fc6900ff"
                        borderColor="#fc6900ff"
                        _hover={{bg: "#000000"}}
                        ml={2}
                    >
                        Login / Register
                    </Button>
                </Link>
            </HStack>
        </Flex>
    )
}

export function MobileHamburgerMenu(){
    const {isOpen, onOpen, onClose} = useDisclosure();

    return(
        <>
            <IconButton
                aria-label="Open Menu"
                icon={<HamburgerIcon />}
                display={{ base: "block", md: "none"}}
                onClick={onOpen}
                position="fixed"
                top={4}
                right={4}
                zIndex={1000}
                bg="white"
                color="purple.700"
                _hover={{ bg: "gray.100"}}
            />
            <Drawer
                placement="right"
                onClose={onClose}
                isOpen={isOpen}
            >
                <DrawerOverlay />
                <DrawerContent bgGradient={bgGradient}>
                    <DrawerCloseButton />
                    <DrawerHeader>
                        Menu
                    </DrawerHeader>
                    <DrawerBody>
                        <VStack align="start" spacing={4}>
                            <Link
                                as={RouterLink} 
                                to="/" 
                                onClick={onClose}
                            >
                                Home
                            </Link>
                            <Link
                                as={RouterLink}
                                to="/about"
                                onClick={onClose}
                            >
                                About
                            </Link>
                            <Link
                                as={RouterLink}
                                to="/try-it"
                                onClick={onClose}
                            >
                                Try it Out!   
                            </Link>
                            <Link
                                as={RouterLink}
                                to="/login-page"
                                onClick={onClose}
                            >
                                Login / Register
                            </Link>
                        </VStack>
                    </DrawerBody>
                </DrawerContent>

            </Drawer>

            
        </>
    )
}