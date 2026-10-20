import { Link } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import './AuthPage.css';

function LeafIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 3c-6 0-13 2-13 9a5 5 0 0 0 10 0c0-3 1-6 3-9Z" />
      <path d="M5 21c0-6 5-10 10-13" />
    </svg>
  );
}

function Brand() {
  return (
    <Link to="/" className="auth-brand">
      <span className="auth-brand-icon">
        <LeafIcon />
      </span>

      <span>nutrigo</span>
      <small>AI</small>
    </Link>
  );
}

const appearance = {
  variables: {
    colorPrimary: '#007b58',
    colorBackground: '#fffdf7',
    colorText: '#123e30',
    colorTextSecondary: '#65796b',
    colorInputBackground: '#fffefa',
    colorInputText: '#123e30',
    borderRadius: '10px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },

  elements: {
    rootBox: 'nutri-clerk-root',
    cardBox: 'nutri-clerk-box',
    card: 'nutri-clerk-card',
    headerTitle: 'nutri-clerk-title',
    headerSubtitle: 'nutri-clerk-subtitle',
    formFieldInput: 'nutri-clerk-input',
    formButtonPrimary: 'nutri-clerk-button',
    socialButtonsBlockButton: 'nutri-clerk-social',
    footer: 'nutri-clerk-footer',
    footerActionLink: 'nutri-clerk-link',
  },
};

export default function AuthPage({ mode = 'sign-in' }) {
  const isSignup = mode === 'sign-up';

  return (
    <div className="nutrigo-auth">
      <header className="auth-header">
        <Brand />
        <p>Grocery clarity, one label at a time.</p>
      </header>

      <main className="auth-layout">
        <section className="auth-story">
          <p className="auth-eyebrow">
            {isSignup ? 'A BETTER GROCERY HABIT' : 'WELCOME BACK'}
          </p>

          <h1>
            {isSignup ? (
              <>
                Less guesswork.
                <br />
                <em>More knowing.</em>
              </>
            ) : (
              <>
                Your cart,
                <br />
                your way.
              </>
            )}
          </h1>

          <p className="auth-description">
            {isSignup
              ? 'Start with a label. Build a cart that makes sense to you.'
              : 'Pick up right where your next grocery run begins.'}
          </p>

          <div className="auth-illustration">
            <div className="auth-leaf-circle">
              <LeafIcon />
            </div>

            <p>
              {isSignup ? (
                <>
                  simple tools
                  <br />
                  for everyday
                  <br />
                  choices
                </>
              ) : (
                <>
                  good food
                  <br />
                  starts with
                  <br />
                  knowing
                </>
              )}
            </p>
          </div>
        </section>

        <section
          className="auth-panel"
          aria-label={isSignup ? 'Create an account' : 'Sign in'}
        >
          <div className="auth-panel-brand">
            <Brand />
          </div>

          {isSignup ? (
            <SignUp
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              forceRedirectUrl="/dashboard"
              appearance={appearance}
            />
          ) : (
            <SignIn
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              forceRedirectUrl="/dashboard"
              appearance={appearance}
            />
          )}
        </section>
      </main>
    </div>
  );
}