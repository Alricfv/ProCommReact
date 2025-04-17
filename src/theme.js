
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: '#121212',
        color: '#f5f5f7',
      }
    }
  },
  colors: {
    brand: {
      100: '#f5f5f7',
      200: '#333333',
      300: '#1d1d1f',
      400: '#121212',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
      },
      variants: {
        primary: {
          bg: '#f5f5f7',
          color: '#000000',
          _hover: { bg: '#e5e5e5' }
        },
        secondary: {
          bg: '#1d1d1f',
          color: '#f5f5f7',
          _hover: { bg: '#333333' }
        }
      }
    }
  }
});

export default theme;
