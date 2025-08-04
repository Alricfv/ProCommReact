import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext({ username: '', setUsername: () => {} });

export function UserProvider({ children }) {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || '';
  });

  useEffect(() => {
    if (username) {
      localStorage.setItem('username', username);
    } else {
      localStorage.removeItem('username');
    }
  }, [username]);

  return (
    <UserContext.Provider value={{ username, setUsername }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
