import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@clerk/clerk-react';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route
          path="/signup"
          element={<Navigate to="/sign-up" replace />}
        />

        <Route
          path="/login"
          element={<Navigate to="/sign-in" replace />}
        />

        <Route
          path="/sign-in/*"
          element={<AuthPage mode="sign-in" />}
        />

        <Route
          path="/sign-up/*"
          element={<AuthPage mode="sign-up" />}
        />

        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>

              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}