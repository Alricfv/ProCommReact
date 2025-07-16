import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Box, Button, Input, Heading, Text, VStack, FormControl, FormLabel, Alert, AlertIcon } from '@chakra-ui/react';
import api from '../utils/api';

export default function LoginPage() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [isLogin, setIsLogin] = useState(true); // true = login, false = signup
  const { setUsername: setUserContext } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/login' : '/signup';
      // Use x-www-form-urlencoded for compatibility with backend
      const formBody = new URLSearchParams({ username, password });
      const response = await api.fetchWithFallback(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(isLogin ? 'Login successful! Redirecting...' : 'Registration successful! Redirecting...');
        setUserContext(username); // Store username in context
        localStorage.setItem('username', username); // Persist username
        setTimeout(() => {
          window.location.href = '/ProCommReact/try-it';
        }, 1000);
      } else {
        setError(data.error || (isLogin ? 'Incorrect username or password.' : 'Could not register.'));
      }
    } catch (err) {
      setError('Server error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bgGradient="linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)">
      <Box bg="rgba(0,0,0,0.7)" p={8} borderRadius={12} boxShadow="xl" maxW="350px" w="100%">
        <Heading mb={6} color="white" textAlign="center">{isLogin ? 'Login' : 'Sign Up'}</Heading>
        {error && (
          <Alert status="error" mb={4} borderRadius={6}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        {success && (
          <Alert status="success" mb={4} borderRadius={6}>
            <AlertIcon />
            {success}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel color="white">Username</FormLabel>
              <Input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                bg="white"
                color="black"
                borderRadius={6}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel color="white">Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                bg="white"
                color="black"
                borderRadius={6}
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme={isLogin ? 'blue' : 'green'}
              isLoading={loading}
              w="100%"
              borderRadius={6}
              fontWeight="bold"
              mb={2}
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </Button>
            <Button
              variant="outline"
              colorScheme={isLogin ? 'green' : 'blue'}
              w="100%"
              borderRadius={6}
              fontWeight="bold"
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            >
              {isLogin ? 'Switch to Sign Up' : 'Switch to Login'}
            </Button>
          </VStack>
        </form>
        <Text mt={6} color="gray.200" fontSize="sm" textAlign="center">
          Your credentials are securely sent to the server for authentication or registration.
        </Text>
      </Box>
    </Box>
  );
}
