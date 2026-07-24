import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// In the beta, real Clerk handles session tokens.
// For the prototype we use localStorage + a dev header.
// The authTokenGetter returns the stored creator id as a bearer token
// so that the server middleware can authenticate the request.
import { setAuthTokenGetter } from '@workspace/api-client-react';

setAuthTokenGetter(() => {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem('eduwb_creator_id');
  return id || null;
});

createRoot(document.getElementById('root')!).render(<App />);
