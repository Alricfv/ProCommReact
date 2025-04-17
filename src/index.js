import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group'; 
import Home from './components/Home';
import About from './components/About';
import TryIt from './components/TryIt'; // Import the TryIt component
import theme from './theme';
import './App.css'; 

const container = document.getElementById('root');
const root = createRoot(container);

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <TransitionGroup>
            <CSSTransition key={location.key} classNames="fade" timeout={300}>
                <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/try-it" element={<TryIt />} />
                </Routes>
            </CSSTransition>
        </TransitionGroup>
    );
}

root.render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
            <BrowserRouter>
                <AnimatedRoutes />
            </BrowserRouter>
        </ChakraProvider>
    </React.StrictMode>
);