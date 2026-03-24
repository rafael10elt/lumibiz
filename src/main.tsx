import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false
    }
  }
});

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </QueryClientProvider>
);
