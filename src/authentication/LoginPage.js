import { useState, useEffect } from 'react';
import edinburghImg from '../images/edinburgh.jpg';
import { useUser } from '../context/UserContext';
import { Box, Text, Button, Input, Heading, VStack, FormControl, FormLabel, Alert, AlertIcon } from '@chakra-ui/react';
import api from '../utils/api';
import {NavBar} from '../components/Consts.js';

const speechQuotes= {
  "~ Ralph Waldo Emerson": "Speech is power: speech is to persuade, to convert, to compel.",
  "~ Mark Twain": "The right word may be effective, but no word was ever as effective as a right timed pause.",
  "~ Oliver Wendell Holmes": "Speak clearly, if you speak at all; carve every word before you let it fall.",
  "~ Rob Brown": "If you can speak, you can influence. If you can influence, you can change lives.",
  "~ Even Esar": "Public speaking is the art of diluting a two-minute idea with a two-hour vocabulary.",
  "~ Dale Carnegie": "Great speakers are not born, they are trained.",
  "~ Maggie Kuhn": "Speak your mind, even if your voice shakes.",
  "~ W.B Yeats": "Think like a wise man but communicate in the language of the people.",
  "~ James Humes": "Every time you speak, you are auditioning for leadership.",
  "~ Patrick Rothfuss": "Words can light fires in the minds of men. Words can wring tears from the hardest hearts.",
  "~ Arthur Ashe": "One important key to success is self-confidence. An important key to self-confidence is preparation."
}

export default function LoginPage() {

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [isLogin, setIsLogin] = useState(true); 
  const { setUsername: setUserContext } = useUser();
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [quoteText, setQuoteText] = useState('');

  //Random quote selection
  useEffect(() => {
    const authors = Object.keys(speechQuotes);
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    setQuoteAuthor(randomAuthor);
    setQuoteText(speechQuotes[randomAuthor]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/login' : '/signup';
      const formBody = new URLSearchParams(
        isLogin ? { email, password } : { email, password, username }
      );

      const response = await api.fetchWithFallback(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: formBody.toString(),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(isLogin ? 'Login successful! Redirecting...' : 'Registration successful! Redirecting...');
        localStorage.setItem('user_email', email);

        let finalUsername = username;

        if (isLogin) {
          try {
            const userInfoRes = await api.fetchWithFallback(`/user-info?email=${encodeURIComponent(email)}`);
            if (userInfoRes.ok){
              const userInfo = await userInfoRes.json();
              if (userInfo.username) 
                finalUsername = userInfo.username;
            }
          } catch(e) {
            console.error('Failed to fetch user information:', e);
          }
        }
        localStorage.setItem('username', finalUsername);
        setUserContext(finalUsername);

        setTimeout(() => {
          window.location.href = '/ProCommReact/try-it';
        }, 1000);
      } else {
        setError(data.error);
      }
    } catch (err){
      setError('Server error, Please try again.');
    }
    setLoading(false);
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="flex-start"
      justifyContent="flex-start"
      style={{
        backgroundImage: `url(${edinburghImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <NavBar />
      {/* Login/Signup Form */}
      <Box
        width={{ base: '90vw', sm: '350px', md: '400px' }}
        ml={{ base: 2, sm: 8, md: 20 }}
        mt={{ base: 24, sm: 32, md: 40 }}
        p={8}
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
        bg="rgba(255,255,255,0.97)"
        
      >
        <Heading mb={6} color="gray.800">
          {isLogin ? 'Login' : 'Sign Up'}
        </Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            {error  && (
              <Alert status={"error"}>
                <AlertIcon />
                {error}
              </Alert>
            )}
            {success && (
              <Alert status="success">
                <AlertIcon />
                {success}
              </Alert>
            )}
            <FormControl id="email" isRequired>
              <FormLabel color="gray.700">Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                width="100%"
                size="lg"
                bg="white"
                color="gray.800"
                borderColor="gray.300"
                _placeholder={{ color: 'gray.400' }}
              />
            </FormControl>
            {!isLogin && (
              <FormControl id="username" isRequired>
                <FormLabel color="gray.700">
                  Username
                </FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  width="100%"
                  size="lg"
                  bg="white"
                  color="gray.800"
                  borderColor="gray.300"
                  _placeholder={{ color: 'gray.400' }}
                />
              </FormControl>
            )}
            <FormControl id="password" isRequired>
              <FormLabel color="gray.700">
                Password
              </FormLabel>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                width="100%"
                size="lg"
                bg="white"
                color="gray.800"
                borderColor="gray.300"
                _placeholder={{ color: 'gray.400' }}
              />
            </FormControl>
            <Button type="submit" colorScheme="blue" isLoading={loading} width="full">
              {isLogin ? 'Login' : 'Sign Up'}
            </Button>
            <Button 
            variant="link" 
            onClick={() => {
              setIsLogin(!isLogin)
              setError('');
              setSuccess('');
              setEmail('');
              setUsername('');
              setPassword('');
              }}
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </Button>
          </VStack>
        </form>
      </Box>
      {/* Randomly selected quotes */}
      <Box
        display={{base: "none", md: "flex"}}
        alignItems="center"
        justifyContent="center"
        ml={20}
        height="100vh"
        p={8}
        maxW="850px"
        bg="none"
        boxShadow="none"
        flexDirection="column"
      >
        <Text
          fontSize="40px"
          color="rgba(255, 255, 255, 1)"
          fontWeight="bold"
          textAlign="left"
          width="100%"
          textShadow="2px 2px 6px rgba(0, 0, 0, 0.5)"
          marginLeft={20}
        >
          "{quoteText}"
        </Text>
        <Text
          fontSize="30px"
          color="rgba(255, 255, 255, 1)"
          fontStyle="italic"
          mt={2}
          marginLeft={20}
          textAlign="left"
          width="100%"
        >
          {quoteAuthor}
        </Text>
      </Box>
    </Box>
  );
}
