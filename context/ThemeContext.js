'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('corporate');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('chronicle_theme') || 'corporate';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'luxury' ? 'corporate' : 'luxury';
    setTheme(newTheme);
    localStorage.setItem('chronicle_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const setThemeExplicit = (t) => {
    setTheme(t);
    localStorage.setItem('chronicle_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeExplicit, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

