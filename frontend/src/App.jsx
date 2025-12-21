import { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState('login'); // 'login', 'signup', 'dashboard'
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleSignupSuccess = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {view === 'dashboard' && user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : view === 'signup' ? (
        <Signup 
          onSuccess={handleSignupSuccess} 
          onSwitchToLogin={() => setView('login')} 
        />
      ) : (
        <Login 
          onSuccess={handleLoginSuccess} 
          onSwitchToSignup={() => setView('signup')} 
        />
      )}
    </div>
  );
}

export default App;
