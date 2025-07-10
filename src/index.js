import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group'; 
import Home from './components/Home';
import About from './components/About';
import TryIt from './components/TryIt'; // Import the TryIt component
import theme from './theme';
import AuthPage from './components/AuthPage';
import './App.css'; 
import { Auth0Provider } from "@auth0/auth0-react";

const container = document.getElementById('root');
const root = createRoot(container);

const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;

function ProtectedRoutes() {
    const location = useLocation();
    return (
        <TransitionGroup>
            <CSSTransition key={location.key} classNames="fade" timeout={300}>
                <Routes location={location}>
                    <Route path="/about" element={<About />} />
                    <Route path="/try-it" element={<TryIt />} />
                    <Route path="/auth" element={<AuthPage />} />
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
                    <Route path="/*" element={
                        <Auth0Provider
                            domain={domain}
                            clientId={clientId}
                            authorizationParams={{
                              redirect_uri: window.location.origin + '/ProCommReact/try-it'
                            }}
                        >
                            <ProtectedRoutes />
                        </Auth0Provider>
                    } />
                </Routes>
            </CSSTransition>
        </TransitionGroup>
    );
}

root.render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
            <BrowserRouter basename="/ProCommReact">
                <AnimatedRoutes />
            </BrowserRouter>
        </ChakraProvider>
    </React.StrictMode>
);