import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ReceiptText, ShieldCheck } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <ReceiptText size={28} color="#0d9488" />
          </div>
          <h1 style={styles.logoText}>
            Struk<span style={styles.logoIn}>In</span>
          </h1>
        </div>

        <h2 style={styles.title}>Selamat Datang!</h2>
        <p style={styles.subtitle}>
          Pantau keuanganmu dan rasakan roasting AI yang bikin melek finansial.
        </p>

        {/* Error */}
        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            ...styles.googleBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <span style={styles.spinner} />
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>{loading ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
        </button>

        {/* Trust note */}
        <div style={styles.trustNote}>
          <ShieldCheck size={14} color="#0d9488" />
          <span>Data kamu aman. Kami tidak pernah menyimpan password.</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    background: 'var(--bg-primary)',
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '28px',
  },
  logoIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: '#e6fffc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '30px',
    fontWeight: '800',
    color: '#0d9488',
    fontFamily: 'var(--font-display)',
    margin: 0,
  },
  logoIn: {
    color: 'var(--text-main, #191c1e)',
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--text-main)',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    lineHeight: '1.6',
    marginBottom: '36px',
    maxWidth: '300px',
    margin: '0 auto 36px',
  },
  errorBox: {
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: '10px',
    color: '#be123c',
    fontSize: '13px',
    padding: '10px 14px',
    marginBottom: '16px',
    textAlign: 'left',
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    padding: '14px 20px',
    background: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#191c1e',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    fontFamily: 'var(--font-display)',
  },
  spinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid #e2e8f0',
    borderTopColor: '#0d9488',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  },
  trustNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '20px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
};
