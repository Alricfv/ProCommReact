import React, { useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";

export default function AuthPage() {
  const { loginWithRedirect } = useAuth0();

  useEffect(() => {
    loginWithRedirect();
  }, [loginWithRedirect]);

  return null;
}

