import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Login from './components/Login';
import Scanner from './components/Scanner';
import { ScanIcon } from 'lucide-react';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin">
          <ScanIcon className="h-8 w-8 text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/scanner" /> : <Login />} 
        />
        <Route 
          path="/scanner" 
          element={user ? <Scanner /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/scanner" : "/login"} />} 
        />
      </Routes>
    </Router>
  );
}

export default App;