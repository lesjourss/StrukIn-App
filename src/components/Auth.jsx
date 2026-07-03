import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Key, Mail, Sparkles } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Check if Supabase keys are missing
  const isSupabaseConfigured = () => {
    return (
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_URL !== 'https://your-supabase-project.supabase.co' &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-supabase-anon-key'
    );
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!isSupabaseConfigured()) {
      // Simulate authentication in Demo Mode
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess({
          id: 'demo-user-id-123',
          email: email || 'demo@strukin.com',
          user_metadata: { full_name: email.split('@')[0] || 'Demo User' }
        }, true); // true indicates demo mode
      }, 1000);
      return;
    }

    try {
      if (isSignUp) {
        // Daftar akun biasa: email + password, langsung tersimpan di Supabase.
        // Catatan: agar user langsung bisa dipakai tanpa menunggu email verifikasi,
        // matikan toggle "Confirm email" di Supabase Dashboard ->
        // Authentication -> Providers -> Email.
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data?.session) {
          // "Confirm email" nonaktif -> Supabase langsung memberi session, user bisa langsung masuk.
          onAuthSuccess(data.user, false);
        } else if (data?.user && data.user.identities && data.user.identities.length === 0) {
          // Tidak ada session & identities kosong -> email ini sudah pernah daftar sebelumnya.
          setErrorMsg('Email ini sudah terdaftar. Silakan masuk menggunakan password Anda.');
        } else {
          // "Confirm email" masih aktif -> Supabase tetap minta verifikasi email dulu.
          alert('Registrasi berhasil! Jika akun belum aktif, cek email untuk verifikasi, atau hubungi admin untuk mengaktifkan langsung.');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess(data.user, false);
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess({
          id: 'google-demo-user',
          email: 'dhikafauzan17@gmail.com',
          user_metadata: { full_name: 'dhikafauzan17' }
        }, true);
      }, 1000);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg('');
    setPassword('');
  };

  const handleDemoBypass = () => {
    onAuthSuccess({
      id: 'demo-user-id-123',
      email: 'demo@strukin.com',
      user_metadata: { full_name: 'dhikafauzan17' }
    }, true);
  };

  return (
    <div style={styles.container} className="animated-fade-in">
      <div style={styles.authCard}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Sparkles size={32} color="var(--color-primary)" />
            <h1 style={styles.logoText}>Struk<span>In</span></h1>
          </div>
          <p style={styles.subtitle}>
            Pantau keuanganmu & rasakan roasting AI yang mencerdaskan.
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <div style={styles.alertWarning}>
            <strong>Mode Demo Aktif:</strong> Database Supabase belum dikonfigurasi. Anda dapat masuk menggunakan email bebas atau menekan tombol <strong>Masuk Demo</strong>.
          </div>
        )}

        <form onSubmit={handleEmailAuth} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div style={styles.inputContainer}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className="form-input"
                style={styles.inputWithIcon}
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputContainer}>
              <Key size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                className="form-input"
                style={styles.inputWithIcon}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>

          {errorMsg && <div style={styles.errorText}>{errorMsg}</div>}

          <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Memproses...' : isSignUp ? 'Daftar Sekarang' : 'Masuk'}
          </button>
        </form>

        <div style={styles.divider}>
          <span>atau</span>
        </div>

        <button onClick={handleGoogleLogin} className="btn btn-secondary" style={styles.googleBtn} disabled={loading}>
          <svg style={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Masuk dengan Google
        </button>

        <div style={styles.toggleAuth}>
          {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <button onClick={handleToggleMode} style={styles.toggleBtn}>
            {isSignUp ? 'Masuk di sini' : 'Daftar di sini'}
          </button>
        </div>

        {!isSupabaseConfigured() && (
          <button onClick={handleDemoBypass} className="btn btn-outline" style={styles.demoBypassBtn}>
            Bypass & Gunakan Mode Demo 🚀
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '85vh',
    padding: '20px',
  },
  authCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '40px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: 'var(--shadow-lg)',
    textAlign: 'center',
  },
  header: {
    marginBottom: '24px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  logoText: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--color-primary)',
    fontFamily: 'var(--font-display)',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  alertWarning: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: 'var(--border-radius-sm)',
    color: '#b45309',
    padding: '12px',
    fontSize: '12px',
    textAlign: 'left',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  form: {
    textAlign: 'left',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
  },
  inputWithIcon: {
    paddingLeft: '44px',
    width: '100%',
  },
  submitBtn: {
    width: '100%',
    marginTop: '12px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  googleBtn: {
    width: '100%',
    gap: '10px',
    fontSize: '14px',
  },
  googleIcon: {
    marginRight: '4px',
  },
  toggleAuth: {
    marginTop: '20px',
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontWeight: '700',
    cursor: 'pointer',
  },
  errorText: {
    color: 'var(--color-danger)',
    fontSize: '14px',
    marginTop: '8px',
    marginBottom: '8px',
  },
  demoBypassBtn: {
    width: '100%',
    marginTop: '24px',
    fontSize: '13px',
    padding: '8px',
  }
};
