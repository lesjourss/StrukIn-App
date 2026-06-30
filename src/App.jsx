import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Scan from './components/Scan';
import Chat from './components/Chat';
import ProfilePage from './components/ProfilePage';
import { Sparkles, Home, History as HistoryIcon, Camera, MessageSquare, User } from 'lucide-react';

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('Home');
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);

  // Check if Supabase is properly configured
  const isSupabaseConfigured = () => {
    return (
      import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_URL !== 'https://your-supabase-project.supabase.co' &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-supabase-anon-key'
    );
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (!isSupabaseConfigured()) {
        // Fallback to Demo Mode check
        const storedUser = localStorage.getItem('demo_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setSessionUser(parsedUser);
          setIsDemo(true);
          loadDemoData(parsedUser.id);
        } else {
          setLoading(false);
        }
        return;
      }

      try {
        // Get current Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionUser(session.user);
          setIsDemo(false);
          await loadSupabaseData(session.user.id);
        } else {
          setLoading(false);
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session) {
            setSessionUser(session.user);
            setIsDemo(false);
            await loadSupabaseData(session.user.id);
          } else {
            setSessionUser(null);
            setProfile(null);
            setTransactions([]);
            setLoading(false);
          }
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error('Supabase initial connection failed, defaulting to Demo Mode:', err);
        const storedUser = localStorage.getItem('demo_user') || JSON.stringify({ id: 'demo-user-id-123', email: 'demo@strukin.com' });
        const parsed = JSON.parse(storedUser);
        setSessionUser(parsed);
        setIsDemo(true);
        loadDemoData(parsed.id);
      }
    };

    initializeAuth();
  }, []);

  const loadDemoData = (userId) => {
    // Load profile
    const storedProfile = localStorage.getItem(`profile_${userId}`);
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }

    // Load transactions or seed initial ones if empty
    const storedTx = localStorage.getItem(`tx_${userId}`);
    if (storedTx) {
      setTransactions(JSON.parse(storedTx));
    } else {
      // Seed some realistic transactions
      const initialTx = [
        {
          id: 'tx-seed-1',
          user_id: userId,
          title: 'Kopi Susu Gula Aren',
          amount: 22000,
          category: 'Makan',
          transaction_date: new Date().toISOString().split('T')[0],
          notes: 'Jajan sore',
          source_type: 'manual',
          created_at: new Date().toISOString()
        },
        {
          id: 'tx-seed-2',
          user_id: userId,
          title: 'Grab Ride ke Kantor',
          amount: 15000,
          category: 'Transport',
          transaction_date: new Date().toISOString().split('T')[0],
          notes: 'Berangkat kerja',
          source_type: 'manual',
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem(`tx_${userId}`, JSON.stringify(initialTx));
      setTransactions(initialTx);
    }
    setLoading(false);
  };

  const loadSupabaseData = async (userId) => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch transactions
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (txErr) throw txErr;
      setTransactions(txData || []);
    } catch (err) {
      console.error('Error loading Supabase data:', err.message);
      // fallback to localStorage
      loadDemoData(userId);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (user, isDemoMode) => {
    setSessionUser(user);
    setIsDemo(isDemoMode);
    if (isDemoMode) {
      localStorage.setItem('demo_user', JSON.stringify(user));
      loadDemoData(user.id);
    } else {
      loadSupabaseData(user.id);
    }
  };

  const handleOnboardingComplete = (newProfile) => {
    setProfile(newProfile);
  };

  const handleLogout = async () => {
    if (isDemo) {
      localStorage.removeItem('demo_user');
      setSessionUser(null);
      setProfile(null);
      setTransactions([]);
    } else {
      await supabase.auth.signOut();
    }
    setActiveTab('Home');
  };

  const handleTransactionAdded = (newTx) => {
    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    
    if (isDemo && sessionUser) {
      localStorage.setItem(`tx_${sessionUser.id}`, JSON.stringify(updatedTx));
    }
  };

  const handleTransactionDeleted = (deletedId) => {
    const updatedTx = transactions.filter(t => t.id !== deletedId);
    setTransactions(updatedTx);
    
    if (isDemo && sessionUser) {
      localStorage.setItem(`tx_${sessionUser.id}`, JSON.stringify(updatedTx));
    }
  };

  const handleUpdateProfileSettings = async (settings) => {
    const updatedProfile = { ...profile, ...settings };
    setProfile(updatedProfile);

    if (isDemo && sessionUser) {
      localStorage.setItem(`profile_${sessionUser.id}`, JSON.stringify(updatedProfile));
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(settings)
        .eq('id', sessionUser.id);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to update profile settings in DB:', err.message);
      localStorage.setItem(`profile_${sessionUser.id}`, JSON.stringify(updatedProfile));
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <h2 style={styles.loadingText}>Memuat StrukIn...</h2>
      </div>
    );
  }

  // Not Logged In
  if (!sessionUser) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Onboarding (First time setup)
  if (!profile || profile.monthly_limit === null || profile.monthly_limit === undefined) {
    return (
      <Onboarding
        user={sessionUser}
        isDemo={isDemo}
        onOnboardingComplete={handleOnboardingComplete}
      />
    );
  }

  // Logged In Main Dashboard Layout
  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="navbar">
        <a href="/" className="logo">
          <Sparkles size={24} />
          Struk<span>In</span>
        </a>

        <nav className="nav-links">
          <button
            onClick={() => setActiveTab('Home')}
            className={`nav-link ${activeTab === 'Home' ? 'active' : ''}`}
          >
            <Home size={16} /> Home
          </button>
          <button
            onClick={() => setActiveTab('Riwayat')}
            className={`nav-link ${activeTab === 'Riwayat' ? 'active' : ''}`}
          >
            <HistoryIcon size={16} /> Riwayat
          </button>
          <button
            onClick={() => setActiveTab('Scan')}
            className={`nav-link ${activeTab === 'Scan' ? 'active' : ''}`}
          >
            <Camera size={16} /> Scan
          </button>
          <button
            onClick={() => setActiveTab('AI Chat')}
            className={`nav-link ${activeTab === 'AI Chat' ? 'active' : ''}`}
          >
            <MessageSquare size={16} /> AI Chat
          </button>
        </nav>

        <div className="nav-profile">
          <button
            onClick={() => setActiveTab('Profil')}
            className={`nav-link ${activeTab === 'Profil' ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}
          >
            <div style={styles.navAvatar}>
              {sessionUser.email ? sessionUser.email[0].toUpperCase() : 'U'}
            </div>
            <span>{sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0]}</span>
            {isDemo && <span style={styles.demoBadge}>Demo</span>}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'Home' && (
          <Dashboard
            user={sessionUser}
            profile={profile}
            isDemo={isDemo}
            transactions={transactions}
            onTransactionAdded={handleTransactionAdded}
            updateProfileSettings={handleUpdateProfileSettings}
          />
        )}

        {activeTab === 'Riwayat' && (
          <History
            user={sessionUser}
            isDemo={isDemo}
            transactions={transactions}
            onTransactionDeleted={handleTransactionDeleted}
          />
        )}

        {activeTab === 'Scan' && (
          <Scan
            user={sessionUser}
            isDemo={isDemo}
            onTransactionsSaved={(newTxList) => {
              newTxList.forEach(t => handleTransactionAdded(t));
              setActiveTab('Riwayat'); // Redirect to history to view saved scans
            }}
          />
        )}

        {activeTab === 'AI Chat' && (
          <Chat
            user={sessionUser}
            profile={profile}
            isDemo={isDemo}
            transactions={transactions}
            onTransactionAdded={handleTransactionAdded}
          />
        )}

        {activeTab === 'Profil' && (
          <ProfilePage
            user={sessionUser}
            profile={profile}
            isDemo={isDemo}
            onProfileUpdated={async (settings) => {
              await handleUpdateProfileSettings(settings);
            }}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: 'var(--bg-primary)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid var(--border-color)',
    borderTopColor: 'var(--color-primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-main)',
  },
  navAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
    color: 'white',
    fontSize: '13px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  demoBadge: {
    backgroundColor: 'var(--color-accent-light)',
    color: 'var(--color-accent)',
    fontSize: '10px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '10px',
    textTransform: 'uppercase',
  }
};
