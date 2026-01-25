// src/Login.jsx
import React from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';

const Login = () => {
  
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Logged in user:", user);
      alert(`Welcome, ${user.displayName}!`);
    } catch (error) {
      console.error("Login Error:", error);
      alert("Login Failed: " + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🚀 UniGo</h1>
        <p style={styles.subtitle}>Campus Commute & Safety</p>
        
        <button onClick={handleLogin} style={styles.button}>
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            style={styles.icon}
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

// Simple CSS-in-JS for speed
const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    textAlign: 'center',
    width: '300px'
  },
  title: {
    margin: '0 0 10px 0',
    color: '#333'
  },
  subtitle: {
    margin: '0 0 30px 0',
    color: '#666'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#555',
    transition: '0.3s'
  },
  icon: {
    width: '20px',
    marginRight: '10px'
  }
};

export default Login;