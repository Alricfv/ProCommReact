import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group'; 
import Home from './components/Home';
import About from './components/About';
import TryIt from './components/TryIt';
import LoginPage from './authentication/LoginPage';
import theme from './theme';
import './App.css';
import { UserProvider } from './context/UserContext';

const container = document.getElementById('root');
const root = createRoot(container);

function ProtectedRoutes() {
    const location = useLocation();
    return (
        <TransitionGroup>
            <CSSTransition key={location.key} classNames="fade" timeout={300}>
                <Routes location={location}>
                    <Route path="/about" element={<About />} />
                    <Route path="/try-it" element={<TryIt />} />
                </Routes>
            </CSSTransition>
        </TransitionGroup>
    );
}

function AnimatedRoutes() {
    const location = useLocation();
    return (
        <TransitionGroup>
            <CSSTransition key={location.key} classNames="fade" timeout={300}>
                <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login-page" element={<LoginPage />} />
                    <Route path="/*" element={<ProtectedRoutes />} />
                </Routes>
            </CSSTransition>
        </TransitionGroup>
    );
}



root.render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
            <UserProvider>
                <BrowserRouter basename="/ProCommReact">
                    <AnimatedRoutes />
                </BrowserRouter>
            </UserProvider>
        </ChakraProvider>
    </React.StrictMode>
);