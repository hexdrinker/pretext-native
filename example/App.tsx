import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './src/App';

export default function Root() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}
