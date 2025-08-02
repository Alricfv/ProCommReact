import { useState } from 'react';
import edinburghImg from '../images/edinburgh.jpg';
import { useUser } from '../context/UserContext';
import { Box, Button, Input, Heading, VStack, FormControl, FormLabel, Alert, AlertIcon } from '@chakra-ui/react';
import api from '../utils/api';

export default function LoginPage() {

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [isLogin, setIsLogin] = useState(true); 
  const { setUsername: setUserContext } = useUser();

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
          window.location.href = 'ProCommReact/try-it';
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
      <Box
        width={{ base: '90vw', sm: '350px', md: '400px' }}
        ml={{ base: 2, sm: 8, md: 16 }}
        mt={{ base: 8, sm: 16, md: 24 }}
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
            {(error || success) && (
              <Alert status={error ? "error" : "success"}>
                <AlertIcon />
                {error || success}
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
            <Button variant="link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}
