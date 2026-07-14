import { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router';

import { useAuthStore } from '@features/auth';

import { router } from '@/app/router/router';

/**
 * App root: kicks off the one-shot session restore, then hands routing to the
 * data router. Providers are mounted above this in `main.tsx`.
 */
function App() {
  const restore = useAuthStore((state) => state.restore);
  const hasRestored = useRef(false);

  useEffect(() => {
    // Guard against StrictMode's double effect invocation so restore (and its
    // /users/me validation) runs exactly once.
    if (hasRestored.current) return;
    hasRestored.current = true;
    void restore();
  }, [restore]);

  return <RouterProvider router={router} />;
}

export default App;
