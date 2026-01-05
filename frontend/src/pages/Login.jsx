import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signInWithGoogle, signInWithEmail } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        console.log('🔵 Login Page: Starting Google Sign-In...');
        const result = await signInWithGoogle();
        console.log('🔵 Login Page: Google Sign-In result:', result);
        if (result.success) {
            console.log('✅ Login Page: Sign-in successful, navigating...');
            navigate('/');
        } else {
            console.error('❌ Login Page: Sign-in failed:', result.error);
            // User-friendly error messages
            let userError = result.error;
            if (result.error.includes('auth/invalid-credential')) {
                userError = '⚠️ Authentication not enabled. Please enable Google Sign-In in Firebase Console.';
            } else if (result.error.includes('auth/popup-closed-by-user')) {
                userError = 'Sign-in cancelled. Please try again.';
            } else if (result.error.includes('auth/operation-not-allowed')) {
                userError = '⚠️ Google Sign-In is not enabled. Please enable it in Firebase Console.';
            } else if (result.error.includes('auth/unauthorized-domain')) {
                userError = '⚠️ This domain is not authorized. Please add it to Firebase Console.';
            }
            setError(userError);
        }
        setLoading(false);
    };

    const handleEmailSignIn = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        setError('');
        console.log('🔵 Login Page: Starting Email Sign-In for:', email);
        const result = await signInWithEmail(email, password);
        console.log('🔵 Login Page: Email Sign-In result:', result);
        if (result.success) {
            console.log(' Login Page: Sign-in successful, navigating...');
            navigate('/');
        } else {
            console.error(' Login Page: Sign-in failed:', result.error);
            // User-friendly error messages
            let userError = result.error;
            if (result.error.includes('auth/invalid-credential')) {
                userError = 'Invalid email or password. Please check your credentials or enable Email/Password authentication in Firebase Console.';
            } else if (result.error.includes('auth/user-not-found')) {
                userError = 'No account found with this email. Please sign up first.';
            } else if (result.error.includes('auth/wrong-password')) {
                userError = 'Incorrect password. Please try again.';
            } else if (result.error.includes('auth/operation-not-allowed')) {
                userError = 'Email/Password authentication is not enabled. Please enable it in Firebase Console.';
            } else if (result.error.includes('auth/too-many-requests')) {
                userError = 'Too many failed attempts. Please try again later.';
            }
            setError(userError);
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-form-panel">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1>AnchorRisk - Sign In</h1>
                        <p>Enter your credentials to access the household risk analysis system</p>
                    </div>

                    {error &&
                     <div className="auth-error">{error}</div>}

                    <button
                        onClick={handleGoogleSignIn}
                        className="auth-button google-main"
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="auth-divider">
                        <span>or</span>
                    </div>

                    <form onSubmit={handleEmailSignIn} className="auth-form">
                        <div className="input-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                disabled={loading}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="auth-button primary" disabled={loading}>
                            {loading ? <span className="button-spinner"></span> : 'Sign In'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Don't have an account? <Link to="/signup">Create an account</Link>
                    </p>

                    <div className="security-badge">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" />
                            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Secure government-grade encryption</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
