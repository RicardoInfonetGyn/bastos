import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRoutesWithRouter from './routes/AppRoutes';
import { TranslationProvider } from './context/TranslationContext';

const App = () => (
  <AuthProvider>
    <TranslationProvider>
      <AppRoutesWithRouter />
       </TranslationProvider>
  </AuthProvider>
);

export default App;
