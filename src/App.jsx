// src/App.jsx
import React, { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for login/logout
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading UniGO...</div>;

  return (
    <div>
      {user ? <Dashboard user={user} /> : <Login />}
    </div>
  );
}

export default App;