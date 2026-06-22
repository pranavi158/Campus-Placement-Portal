import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('placement_user');
    const storedToken = localStorage.getItem('placement_token');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, token: storedToken });
      } catch (err) {
        console.error('Error parsing stored user data:', err);
        // Clear corrupt storage
        localStorage.removeItem('placement_user');
        localStorage.removeItem('placement_token');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Log in user
   */
  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store in localStorage
      localStorage.setItem('placement_token', data.token);
      localStorage.setItem('placement_user', JSON.stringify(data.user));

      // Set user state
      setUser({ ...data.user, token: data.token });
      return { success: true };
    } catch (err) {
      console.error('AuthContext login error:', err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a Student
   */
  const registerStudent = async (studentData) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/register/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return { success: true, message: data.message };
    } catch (err) {
      console.error('Student registration error:', err);
      return { success: false, message: err.message };
    }
  };

  /**
   * Register a Company
   */
  const registerCompany = async (companyData) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/register/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return { success: true, message: data.message };
    } catch (err) {
      console.error('Company registration error:', err);
      return { success: false, message: err.message };
    }
  };

  /**
   * Log out user
   */
  const logout = () => {
    localStorage.removeItem('placement_token');
    localStorage.removeItem('placement_user');
    setUser(null);
  };

  // Helper function to query backend with Auth headers attached
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('placement_token');
    
    const headers = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type header if body is FormData (e.g. PDF upload)
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`http://localhost:5001${endpoint}`, {
      ...options,
      headers,
    });

    // Handle session expiration or token invalidation
    if (response.status === 401) {
      logout();
      throw new Error('Session expired, please login again.');
    }

    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerStudent,
        registerCompany,
        logout,
        apiCall,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
