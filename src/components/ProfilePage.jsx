import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  User, Mail, Shield, Flame, LogOut, Save, Check,
  GraduationCap, Heart, UserCheck, ChevronRight,
  Wallet, Sparkles, AlertTriangle, X, CreditCard, History
} from 'lucide-react';

export default function ProfilePage({ user, profile, isDemo, onProfileUpdated, onLogout, setActiveTab }) {
  const [monthlyLimit, setMonthlyLimit] = useState(profile?.monthly_limit || 0);
  const [aiCharacter, setAiCharacter] = useState(profile?.ai_character || 'Dosen Killer');
  const [aiSpiciness, setAiSpiciness] = useState(profile?.ai_spiciness || 'Sedang');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSettings, setShowSettings] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatNumber = (val) => {
    const num = val.toString().replace(/\D/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleLimitChange = (e) => {
    const raw = e.target.value.replace(/\./g, '');
    if (raw === '' || /^\d+$/.test(raw)) {
      setMonthlyLimit(raw === '' ? 0 : Number(raw));
    }
  };

  const isBelowMin = monthlyLimit > 0 && monthlyLimit < 10000;

  const personas = [
    { id: 'Dosen Killer', label: 'Dosen Killer', icon: GraduationCap, desc: 'Kritis & akademis' },
    { id: 'Emak Bawel', label: 'Emak Bawel', icon: Heart, desc: 'Cerewet & peduli' },
    { id: 'Teman Santai', label: 'Teman Santai', icon: UserCheck, desc: 'Asik & no drama' },
  ];

  const spicinesses = [
    { id: 'Manis', label: '🍬 Manis', desc: 'Kritik lembut & sopan' },
    { id: 'Sedang', label: '🌶️ Sedang', desc: 'Balanced & to the point' },
    { id: 'Pedes Mampus', label: '🔥 Pedes Mampus', desc: 'Jujur sadis tanpa filter' },
  ];

  const handleTopUp = async () => {
    const raw = Number(topUpAmount.toString().replace(/\./g, ''));
    if (!raw || raw <= 0) return;
    const newLimit = Number(monthlyLimit) + raw;
    setMonthlyLimit(newLimit);
    setTopUpAmount('');
    setShowTopUp(false);
    // Langsung simpan ke profil agar Dashboard ikut update
    await onProfileUpdated({
      monthly_limit: newLimit,
      ai_character: aiCharacter,
      ai_spiciness: aiSpiciness,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const updated = {
      monthly_limit: Number(monthlyLimit),
      ai_character: aiCharacter,
      ai_spiciness: aiSpiciness,
    };
    await onProfileUpdated(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna';
  const avatarLetter = (user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase();

  return (
    <div style={styles.page} className="animated-fade-in">
      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>
              <AlertTriangle size={32} color="#f59e0b" />
            </div>
            <h3 style={styles.modalTitle}>Yakin mau keluar?</h3>
            <p style={styles.modalDesc}>
              Semua data transaksi kamu tetap tersimpan dan bisa diakses lagi saat login.
            </p>
            <div style={styles.modalBtns}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={styles.cancelBtn}
              >
                <X size={16} /> Batal
              </button>
              <button
                onClick={onLogout}
                style={styles.confirmLogoutBtn}
              >
                <LogOut size={16} /> Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {(!isMobile || showSettings) && (
        <div style={styles.header}>
          <h2 style={styles.title}>
            {isMobile ? (
              <button onClick={() => setShowSettings(false)} style={styles.backBtn}>
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)', marginRight: 4 }} />
                Kembali
              </button>
            ) : "Profil & Pengaturan"}
          </h2>
          {!isMobile && <p style={styles.subtitle}>Kelola akun dan preferensi AI kamu</p>}
        </div>
      )}

      {isMobile && !showSettings ? (
        /* Mobile Menu Hub */
        <div style={styles.mobileHub}>
          {/* Komponen Profil (Bagian Atas) - Avatar kotak rounded */}
          <div 
            onClick={() => setShowSettings(true)}
            style={styles.mobileProfileCard}
          >
            <div style={styles.avatarRoundedSquare}>{avatarLetter}</div>
            <div style={styles.mobileProfileInfo}>
              <h3 style={styles.mobileDisplayName}>{displayName}</h3>
              <p style={styles.mobileEmailText}>
                <Mail size={13} style={{ marginRight: 4 }} />
                {user?.email || '—'}
              </p>
              <span style={styles.mobilePill}>Lihat Pengaturan &gt;</span>
            </div>
            <ChevronRight size={20} color="var(--text-muted)" />
          </div>

          {/* Menu Navigasi & Action (Bagian Bawah) */}
          <div style={styles.mobileMenuList}>
            <button 
              onClick={() => setShowSettings(true)}
              style={styles.mobileMenuItem}
            >
              <CreditCard size={18} style={styles.mobileMenuIcon} />
              <span style={styles.mobileMenuLabel}>Pengaturan Akun</span>
              <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </button>

            <button 
              onClick={() => setActiveTab('Riwayat')}
              style={styles.mobileMenuItem}
            >
              <History size={18} style={styles.mobileMenuIcon} />
              <span style={styles.mobileMenuLabel}>Riwayat Transaksi</span>
              <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* Tombol Keluar dari Akun */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={styles.mobileLogoutBtn}
          >
            <LogOut size={16} />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      ) : (
        /* Desktop Layout or Mobile Detailed Settings View */
        <div style={isMobile ? styles.mobileSettingsContainer : styles.grid}>
          {/* Left Column — User Info + Logout (Desktop only) */}
          {!isMobile && (
            <div style={styles.leftCol}>
              {/* User Card */}
              <div className="card" style={styles.userCard}>
                <div style={styles.avatarBig}>{avatarLetter}</div>
                <h3 style={styles.displayName}>{displayName}</h3>
                <p style={styles.emailText}>
                  <Mail size={13} style={{ marginRight: 4 }} />
                  {user?.email || '—'}
                </p>
                {isDemo && (
                  <span style={styles.demoPill}>Mode Demo</span>
                )}
                <div style={styles.divider} />
                <div style={styles.infoRow}>
                  <Shield size={14} color="var(--color-primary)" />
                  <span style={styles.infoLabel}>Status Akun</span>
                  <span style={styles.infoBadge}>Aktif</span>
                </div>
                <div style={styles.infoRow}>
                  <Sparkles size={14} color="var(--color-accent)" />
                  <span style={styles.infoLabel}>Karakter AI</span>
                  <span style={{ ...styles.infoBadge, backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
                    {aiCharacter}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <Flame size={14} color="#ef4444" />
                  <span style={styles.infoLabel}>Level Pedes</span>
                  <span style={{ ...styles.infoBadge, backgroundColor: '#fee2e2', color: '#ef4444' }}>
                    {aiSpiciness}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                style={styles.logoutBtn}
              >
                <LogOut size={18} />
                <span>Keluar dari Akun</span>
                <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
              </button>
            </div>
          )}

          {/* Right Column — Settings */}
          <div style={styles.rightCol}>
            {/* Budget Setting */}
            <div className="card" style={styles.settingCard}>
              <div style={styles.settingHeader}>
                <Wallet size={20} color="var(--color-primary)" />
                <div>
                  <h4 style={styles.settingTitle}>Budget Bulanan</h4>
                  <p style={styles.settingDesc}>Limit pengeluaran bulananmu</p>
                </div>
              </div>
              <div style={{
                ...styles.budgetInputWrap,
                borderColor: isBelowMin ? '#ef4444' : 'var(--color-primary)',
              }}>
                <span style={styles.budgetPrefix}>Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={monthlyLimit === 0 ? '' : formatNumber(monthlyLimit)}
                  placeholder="Belum diatur"
                  readOnly
                  style={{ ...styles.budgetInput, cursor: 'default', color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)' }}
                />
              </div>
              {isBelowMin && (
                <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600', marginBottom: '10px' }}>
                  ⚠️ Budget terlalu kecil! Minimal Rp 10.000 ya.
                </p>
              )}

              {/* Tambah Saldo Toggle */}
              <div style={{ marginTop: '12px' }}>
                <button
                  onClick={() => setShowTopUp(!showTopUp)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-primary)', fontSize: '13px', fontWeight: '700',
                    padding: '4px 0',
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{showTopUp ? '−' : '+'}</span>
                  {showTopUp ? 'Batal Tambah Saldo' : 'Tambah Saldo ke Budget'}
                </button>

                {showTopUp && (
                  <div style={{ marginTop: '12px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '600' }}>
                      Tambahkan nominal ke budget saat ini (Rp {formatNumber(monthlyLimit)})
                    </p>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      border: '2px solid var(--color-primary)',
                      borderRadius: '10px', overflow: 'hidden', marginBottom: '10px',
                    }}>
                      <span style={{ padding: '10px 12px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', fontWeight: '800', fontSize: '13px' }}>+ Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={topUpAmount === '' ? '' : formatNumber(Number(topUpAmount.toString().replace(/\./g, '')))}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\./g, '');
                          if (raw === '' || /^\d+$/.test(raw)) setTopUpAmount(raw);
                        }}
                        style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: '16px', fontWeight: '700', backgroundColor: 'var(--bg-primary)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {[100000, 250000, 500000, 1000000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setTopUpAmount(String(amt))}
                          style={{
                            ...styles.quickBtn,
                            backgroundColor: Number(topUpAmount) === amt ? 'var(--color-primary)' : 'var(--bg-secondary)',
                            color: Number(topUpAmount) === amt ? 'white' : 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          +{amt >= 1000000 ? `${amt/1000000}Jt` : `${amt/1000}K`}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleTopUp}
                      disabled={!topUpAmount || Number(topUpAmount) <= 0}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '10px',
                        border: 'none', backgroundColor: 'var(--color-primary)',
                        color: 'white', fontWeight: '700', fontSize: '14px',
                        cursor: topUpAmount ? 'pointer' : 'not-allowed',
                        opacity: topUpAmount ? 1 : 0.5,
                      }}
                    >
                      Tambahkan ke Budget
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Karakter AI */}
            <div className="card" style={styles.settingCard}>
              <div style={styles.settingHeader}>
                <Sparkles size={20} color="var(--color-accent)" />
                <div>
                  <h4 style={styles.settingTitle}>Karakter AI</h4>
                  <p style={styles.settingDesc}>Kepribadian asisten keuanganmu</p>
                </div>
              </div>
              <div style={{
                ...styles.personaGrid,
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)'
              }}>
                {personas.map(p => {
                  const Icon = p.icon;
                  const isActive = aiCharacter === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setAiCharacter(p.id)}
                      style={{
                        ...styles.personaCard,
                        borderColor: isActive ? 'var(--color-primary)' : 'var(--border-color)',
                        backgroundColor: isActive ? 'var(--color-primary-light)' : 'var(--bg-secondary)',
                      }}
                    >
                      <Icon size={22} color={isActive ? 'var(--color-primary-dark)' : 'var(--text-muted)'} />
                      <span style={{ ...styles.personaLabel, color: isActive ? 'var(--color-primary-dark)' : 'var(--text-main)' }}>
                        {p.label}
                      </span>
                      <span style={styles.personaDesc}>{p.desc}</span>
                      {isActive && (
                        <div style={styles.checkBadge}>
                          <Check size={11} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level Pedas */}
            <div className="card" style={styles.settingCard}>
              <div style={styles.settingHeader}>
                <Flame size={20} color="#ef4444" />
                <div>
                  <h4 style={styles.settingTitle}>Level Pedes AI</h4>
                  <p style={styles.settingDesc}>Seberapa pedas roasting AI ke kamu</p>
                </div>
              </div>
              <div style={styles.spicyList}>
                {spicinesses.map(s => {
                  const isActive = aiSpiciness === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setAiSpiciness(s.id)}
                      style={{
                        ...styles.spicyRow,
                        borderColor: isActive ? '#ef4444' : 'var(--border-color)',
                        backgroundColor: isActive ? '#fff1f2' : 'var(--bg-secondary)',
                      }}
                    >
                      <div>
                        <div style={{ ...styles.spicyLabel, color: isActive ? '#ef4444' : 'var(--text-main)' }}>
                          {s.label}
                        </div>
                        <div style={styles.spicyDesc}>{s.desc}</div>
                      </div>
                      {isActive && <Check size={16} color="#ef4444" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={async () => {
                await handleSave();
                if (isMobile) {
                  setShowSettings(false);
                }
              }}
              disabled={saving}
              className="btn btn-primary"
              style={styles.saveBtn}
            >
              {saving ? (
                <span>Menyimpan...</span>
              ) : saved ? (
                <><Check size={18} /> Tersimpan!</>
              ) : (
                <><Save size={18} /> Simpan Perubahan</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '12px 0' },
  header: { marginBottom: '28px' },
  title: { fontSize: '24px', fontWeight: '800', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: 'var(--text-muted)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '24px',
    alignItems: 'start',
  },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '20px' },

  // User Card
  userCard: { padding: '28px 24px', textAlign: 'center' },
  avatarBig: {
    width: '72px', height: '72px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
    color: 'white', fontSize: '28px', fontWeight: '800',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 14px',
    boxShadow: '0 4px 20px rgba(13,148,136,0.3)',
  },
  displayName: { fontSize: '18px', fontWeight: '800', marginBottom: '6px' },
  emailText: {
    fontSize: '12px', color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
    marginBottom: '12px',
  },
  demoPill: {
    display: 'inline-block',
    background: 'var(--color-accent-light)', color: 'var(--color-accent)',
    fontSize: '11px', fontWeight: '700', padding: '3px 10px',
    borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px',
    marginBottom: '12px',
  },
  divider: { height: '1px', backgroundColor: 'var(--border-color)', margin: '16px 0' },
  infoRow: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '10px', textAlign: 'left',
  },
  infoLabel: { fontSize: '13px', color: 'var(--text-muted)', flex: 1 },
  infoBadge: {
    fontSize: '11px', fontWeight: '700',
    padding: '3px 8px', borderRadius: '8px',
    backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)',
  },

  // Logout button
  logoutBtn: {
    width: '100%', padding: '14px 18px',
    borderRadius: '14px', border: '2px solid #fee2e2',
    backgroundColor: '#fff5f5', color: '#ef4444',
    display: 'flex', alignItems: 'center', gap: '10px',
    fontSize: '14px', fontWeight: '700', cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Setting Cards
  settingCard: { padding: '24px' },
  settingHeader: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    marginBottom: '20px',
  },
  settingTitle: { fontSize: '15px', fontWeight: '700', marginBottom: '2px' },
  settingDesc: { fontSize: '12px', color: 'var(--text-muted)' },

  // Budget
  budgetInputWrap: {
    display: 'flex', alignItems: 'center',
    border: '2px solid var(--color-primary)',
    borderRadius: '12px', overflow: 'hidden',
    marginBottom: '14px',
  },
  budgetPrefix: {
    padding: '12px 14px', backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary-dark)', fontWeight: '800', fontSize: '14px',
  },
  budgetInput: {
    flex: 1, padding: '12px 14px', border: 'none', outline: 'none',
    fontSize: '18px', fontWeight: '800', backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-main)',
  },
  quickBudgets: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  quickBtn: {
    padding: '6px 14px', borderRadius: '8px', border: 'none',
    fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
  },

  // Persona
  personaGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' },
  personaCard: {
    padding: '16px 12px', borderRadius: '12px',
    border: '2px solid', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    transition: 'all 0.2s', position: 'relative',
    width: '100%',
  },
  personaLabel: { fontSize: '12px', fontWeight: '700', textAlign: 'center' },
  personaDesc: { fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' },
  checkBadge: {
    position: 'absolute', top: '8px', right: '8px',
    width: '18px', height: '18px', borderRadius: '50%',
    backgroundColor: 'var(--color-primary)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // Spicy
  spicyList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  spicyRow: {
    padding: '14px 16px', borderRadius: '12px', border: '2px solid',
    cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', transition: 'all 0.2s',
    width: '100%',
  },
  spicyLabel: { fontSize: '14px', fontWeight: '700', marginBottom: '2px' },
  spicyDesc: { fontSize: '12px', color: 'var(--text-muted)' },

  // Save
  saveBtn: {
    padding: '14px', fontSize: '15px', fontWeight: '700',
    borderRadius: '14px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '8px', width: '100%',
  },

  // Modal overlay
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--bg-primary)', borderRadius: '20px',
    padding: '32px', maxWidth: '380px', width: '90%',
    textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalIcon: {
    width: '64px', height: '64px', borderRadius: '50%',
    backgroundColor: '#fef3c7', display: 'flex',
    alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
  },
  modalTitle: { fontSize: '20px', fontWeight: '800', marginBottom: '10px' },
  modalDesc: { fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' },
  modalBtns: { display: 'flex', gap: '12px' },
  cancelBtn: {
    flex: 1, padding: '12px', borderRadius: '12px',
    border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    fontSize: '14px',
  },
  confirmLogoutBtn: {
    flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
    backgroundColor: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    fontSize: '14px',
  },

  // Mobile Hub Styles
  mobileHub: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '8px 4px',
  },
  mobileProfileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s',
  },
  avatarRoundedSquare: {
    width: '60px', height: '60px', borderRadius: '16px',
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
    color: 'white', fontSize: '24px', fontWeight: '800',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(13,148,136,0.2)',
  },
  mobileProfileInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
    flex: 1,
  },
  mobileDisplayName: {
    fontSize: '16px',
    fontWeight: '800',
    margin: 0,
    color: 'var(--text-main)',
  },
  mobileEmailText: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    margin: 0,
  },
  mobilePill: {
    fontSize: '11px',
    color: 'var(--color-primary)',
    fontWeight: '700',
    marginTop: '2px',
  },
  mobileMenuList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  mobileMenuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    width: '100%',
    borderRadius: '14px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-main)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  mobileMenuIcon: {
    color: 'var(--color-primary)',
    flexShrink: 0,
  },
  mobileMenuLabel: {
    fontSize: '14px',
    fontWeight: '700',
  },
  mobileLogoutBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    marginTop: '16px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontSize: '18px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    padding: 0,
  },
  mobileSettingsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  mobileSettingsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
};

