import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Sparkles, Shield, User, Flame, GraduationCap, Heart, UserCheck, Rocket } from 'lucide-react';

export default function Onboarding({ user, isDemo, onOnboardingComplete }) {
  const [limit, setLimit] = useState(0);
  const [character, setCharacter] = useState('Dosen Killer');
  const [spiciness, setSpiciness] = useState('Sedang');
  const [loading, setLoading] = useState(false);

  // Format angka jadi string dengan titik (1000000 → "1.000.000")
  const formatNumber = (val) => {
    const num = val.toString().replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Ambil angka murni dari string berformat
  const parseNumber = (val) => Number(val.toString().replace(/\./g, ''));

  const handleLimitChange = (e) => {
    const raw = e.target.value.replace(/\./g, '');
    if (raw === '' || /^\d+$/.test(raw)) {
      setLimit(raw === '' ? 0 : Number(raw));
    }
  };

  const isBelowMin = limit > 0 && limit < 10000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const profileData = {
      id: user.id,
      monthly_limit: Number(limit),
      ai_character: character,
      ai_spiciness: spiciness,
    };

    if (isDemo) {
      // In demo mode, save to localStorage
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
      setLoading(false);
      onOnboardingComplete(profileData);
      return;
    }

    try {
      // Coba INSERT dulu (untuk akun baru yang belum punya profil)
      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (insertError) {
        // Kalau error karena duplicate (profil sudah ada), coba UPDATE
        if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              monthly_limit: profileData.monthly_limit,
              ai_character: profileData.ai_character,
              ai_spiciness: profileData.ai_spiciness,
            })
            .eq('id', user.id);

          if (updateError) throw updateError;
        } else {
          throw insertError;
        }
      }

      onOnboardingComplete(profileData);
    } catch (err) {
      console.error('Error saving profile onboarding:', err);
      alert('Gagal menyimpan profil ke Supabase:\n\n' + err.message + '\n\nKemungkinan penyebab:\n- Policy RLS tidak mengizinkan INSERT/UPDATE\n- Cek Supabase > Authentication > Policies');
      // Fallback ke localStorage agar UI tetap bisa berjalan
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
      onOnboardingComplete(profileData);
    } finally {
      setLoading(false);
    }
  };

  const personas = [
    {
      name: 'Dosen Killer',
      icon: <GraduationCap size={24} color="var(--color-primary)" />,
      description: 'Formal, ketat, menuntut kedisiplinan tingkat tinggi, menganggap pengeluaran bocor alus sebagai kegagalan kelas.'
    },
    {
      name: 'Emak Bawel',
      icon: <Heart size={24} color="#ef4444" />,
      description: 'Penuh perhatian tapi cerewet setengah mati, selalu membandingkan jajanmu dengan harga kebutuhan pokok.'
    },
    {
      name: 'Teman Santai',
      icon: <UserCheck size={24} color="#3b82f6" />,
      description: 'Menggunakan bahasa santai tongkrongan, menasehati layaknya kawan tapi suka menyindir tajam kalau boros.'
    }
  ];

  const spicinessLevels = [
    {
      level: 'Manis',
      color: '#10b981',
      bg: '#d1fae5',
      desc: 'Saran logis & edukasi keuangan yang memotivasi.'
    },
    {
      level: 'Sedang',
      color: '#f59e0b',
      bg: '#fef3c7',
      desc: 'Sindiran komedi ringan & nasehat lucu.'
    },
    {
      level: 'Pedes Mampus',
      color: '#ef4444',
      bg: '#fee2e2',
      desc: 'Roasting brutal, sarkasme murni tanpa ampun.'
    }
  ];

  return (
    <div style={styles.container} className="animated-fade-in">
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.badge}>
            <Sparkles size={16} /> Setup Keuanganmu
          </div>
          <h1 style={styles.title}>Selamat Datang di StrukIn!</h1>
          <p style={styles.subtitle}>
            Ayo atur budget dan konfigurasikan asisten AI pelatih hematmu.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Budget Input */}
          <div className="form-group" style={styles.section}>
            <label className="form-label" style={styles.sectionTitle}>
              <Shield size={18} color="var(--color-primary)" />
              1. Berapa limit uang jajan / budget bulananmu?
            </label>
            <div style={{
              ...styles.inputContainer,
              borderColor: isBelowMin ? '#ef4444' : 'var(--border-color)',
            }}>
              <span style={styles.currencyPrefix}>Rp</span>
              <input
                type="text"
                inputMode="numeric"
                className="form-input"
                style={styles.budgetInput}
                value={limit === 0 ? '' : formatNumber(limit)}
                placeholder="0"
                onChange={handleLimitChange}
                required
              />
            </div>
            {isBelowMin ? (
              <p style={{ ...styles.helpText, color: '#ef4444', fontWeight: '600' }}>
                ⚠️ Budget terlalu kecil! Minimal Rp 10.000 ya.
              </p>
            ) : (
              <p style={styles.helpText}>
                Limit ini akan menjadi acuan sisa saldo dan tingkat "Survival Score" kamu.
              </p>
            )}
          </div>

          {/* AI Character */}
          <div className="form-group" style={styles.section}>
            <label className="form-label" style={styles.sectionTitle}>
              <User size={18} color="var(--color-primary)" />
              2. Pilih Karakter Asisten AI Roasting
            </label>
            <div style={styles.personaGrid}>
              {personas.map((p) => (
                <div
                  key={p.name}
                  style={{
                    ...styles.personaCard,
                    borderColor: character === p.name ? 'var(--color-primary)' : 'var(--border-color)',
                    backgroundColor: character === p.name ? 'var(--color-primary-light)' : 'transparent'
                  }}
                  onClick={() => setCharacter(p.name)}
                >
                  <div style={styles.personaHeader}>
                    <span style={styles.personaIcon}>{p.icon}</span>
                    <strong style={styles.personaName}>{p.name}</strong>
                  </div>
                  <p style={styles.personaDesc}>{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Spiciness Level */}
          <div className="form-group" style={styles.section}>
            <label className="form-label" style={styles.sectionTitle}>
              <Flame size={18} color="var(--color-primary)" />
              3. Pilih Level Kepedasan Roasting
            </label>
            <div style={styles.spicyContainer}>
              {spicinessLevels.map((s) => (
                <div
                  key={s.level}
                  style={{
                    ...styles.spicyCard,
                    borderColor: spiciness === s.level ? s.color : 'var(--border-color)',
                    backgroundColor: spiciness === s.level ? s.bg : 'transparent',
                    color: spiciness === s.level ? s.color : 'var(--text-main)'
                  }}
                  onClick={() => setSpiciness(s.level)}
                >
                  <div style={styles.spicyHeader}>
                    <strong style={{ fontWeight: '800' }}>{s.level}</strong>
                  </div>
                  <p style={{ ...styles.spicyDesc, color: spiciness === s.level ? 'inherit' : 'var(--text-muted)' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              ...styles.submitBtn,
              opacity: (loading || isBelowMin || limit === 0) ? 0.6 : 1,
              cursor: (loading || isBelowMin || limit === 0) ? 'not-allowed' : 'pointer',
            }}
            disabled={loading || isBelowMin || limit === 0}
          >
            {loading ? 'Menyimpan Pengaturan...' : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Mulai Petualangan Hemat <Rocket size={18} />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px 0',
  },
  card: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '40px',
    maxWidth: '680px',
    width: '100%',
    boxShadow: 'var(--shadow-lg)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary-dark)',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    marginBottom: '10px',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '15px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '24px',
    marginBottom: '8px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-main)',
    marginBottom: '16px',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  currencyPrefix: {
    position: 'absolute',
    left: '16px',
    fontWeight: '700',
    color: 'var(--text-muted)',
  },
  budgetInput: {
    paddingLeft: '44px',
    fontSize: '20px',
    fontWeight: '700',
    width: '100%',
  },
  helpText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '6px',
  },
  personaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
  },
  '@media (min-width: 600px)': {
    personaGrid: {
      gridTemplateColumns: '1fr 1fr 1fr',
    }
  },
  personaCard: {
    border: '2px solid',
    borderRadius: 'var(--border-radius-md)',
    padding: '16px',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  personaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  personaIcon: {
    fontSize: '24px',
  },
  personaName: {
    fontSize: '15px',
  },
  personaDesc: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  spicyContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
  },
  spicyCard: {
    border: '2px solid',
    borderRadius: 'var(--border-radius-md)',
    padding: '14px 20px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'var(--transition-smooth)',
  },
  spicyHeader: {
    fontSize: '15px',
  },
  spicyDesc: {
    fontSize: '13px',
    textAlign: 'right',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
  }
};
