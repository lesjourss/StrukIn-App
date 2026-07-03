import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { generateRoasting } from '../lib/gemini';
import { PlusCircle, Wallet, Flame, Sparkles, Share2, DollarSign, Activity, Utensils, Car, ShoppingBag, HeartPulse, Clapperboard, Package, Pencil } from 'lucide-react';

export default function Dashboard({ user, profile, isDemo, transactions, onTransactionAdded, updateProfileSettings }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Makan');
  const [roasting, setRoasting] = useState('Mengambil evaluasi keuangan Anda...');
  const [roastLoading, setRoastLoading] = useState(false);
  const [quickInputError, setQuickInputError] = useState('');
  const [quickInputLoading, setQuickInputLoading] = useState(false);

  // Calculate total spent
  const totalSpent = transactions.reduce((acc, t) => acc + Number(t.amount), 0);
  const sisaSaldo = profile.monthly_limit - totalSpent;
  const survivalScore = Math.max(0, Math.round(100 - (totalSpent / profile.monthly_limit * 100)));

  // Calculate category totals
  const categoryData = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});

  const categories = [
    { name: 'Makan', icon: Utensils, color: '#0d9488' },
    { name: 'Transport', icon: Car, color: '#3b82f6' },
    { name: 'Lifestyle', icon: ShoppingBag, color: '#ec4899' },
    { name: 'Kesehatan', icon: HeartPulse, color: '#ef4444' },
    { name: 'Hiburan', icon: Clapperboard, color: '#8b5cf6' },
    { name: 'Lainnya', icon: Package, color: '#64748b' }
  ];

  // Refresh roasting whenever transactions, limit, character, or spiciness changes
  useEffect(() => {
    let active = true;
    const fetchRoast = async () => {
      setRoastLoading(true);
      // Fetch latest 5 transactions
      const recent = [...transactions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      const text = await generateRoasting(profile.monthly_limit, totalSpent, recent, profile.ai_character, profile.ai_spiciness);
      if (active) {
        setRoasting(text);
        setRoastLoading(false);
      }
    };
    fetchRoast();
    return () => { active = false; };
  }, [transactions, profile.monthly_limit, profile.ai_character, profile.ai_spiciness]);

  const handleQuickInput = async (e) => {
    e.preventDefault();
    if (!title || !amount || Number(amount) <= 0) {
      setQuickInputError('Mohon isi keterangan dan nominal dengan benar.');
      return;
    }

    setQuickInputLoading(true);
    setQuickInputError('');

    const newTx = {
      user_id: user.id,
      title,
      amount: Number(amount),
      category,
      transaction_date: new Date().toISOString().split('T')[0],
      source_type: 'manual'
    };

    if (isDemo) {
      // In demo mode, construct local mock response
      const mockTx = {
        ...newTx,
        id: `local-tx-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      onTransactionAdded(mockTx);
      setTitle('');
      setAmount('');
      setQuickInputLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert(newTx)
        .select()
        .single();

      if (error) throw error;
      onTransactionAdded(data);
      setTitle('');
      setAmount('');
    } catch (err) {
      console.error('Error inserting transaction:', err.message);
      // Fallback
      const mockTx = {
        ...newTx,
        id: `local-tx-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      onTransactionAdded(mockTx);
      setTitle('');
      setAmount('');
    } finally {
      setQuickInputLoading(false);
    }
  };

  const handleShareRoast = () => {
    const shareText = `[StrukIn AI - ${profile.ai_character} (${profile.ai_spiciness})]\n"${roasting}"\n\nSurvival Score: ${survivalScore} HP! Cek kesehatan dompetmu di StrukIn!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      alert('Teks roasting berhasil disalin ke clipboard! Siap dibagikan.');
    } else {
      alert(shareText);
    }
  };

  // SVG Custom Ring for Gauge calculation
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (survivalScore / 100) * circumference;

  // Determine HP color state
  const getHpColor = () => {
    if (survivalScore > 60) return '#10b981'; // Green
    if (survivalScore > 30) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  // Determine budget status text
  const getBudgetStatus = () => {
    const ratio = totalSpent / profile.monthly_limit;
    if (ratio === 0) return { text: 'Belum ada pengeluaran, aman!', color: '#10b981' };
    if (ratio < 0.5) return { text: 'Aman, budget masih terkontrol', color: '#10b981' };
    if (ratio < 0.8) return { text: 'Waspada, pengeluaran mulai meninggi', color: '#f59e0b' };
    if (ratio <= 1.0) return { text: 'Kritis! Segera batasi jajan Anda', color: '#ef4444' };
    return { text: 'Bocor Alus! Budget Anda telah terlampaui', color: '#ef4444' };
  };

  const budgetStatus = getBudgetStatus();

  // Custom SVG Doughnut Chart Calculation
  const totalCategoryAmt = Object.values(categoryData).reduce((a, b) => a + b, 0);
  let accumulatedAngle = 0;

  return (
    <div className="dashboard-grid animated-fade-in">
      {/* Left Column */}
      <div className="left-column">
        {/* Remaining Budget Card */}
        <div className="card" style={styles.budgetCard}>
          <div style={styles.cardHeader}>
            <div>
              <p style={styles.cardMutedLabel}>Sisa Uang Jajan</p>
              <h4 style={styles.dateLabel}>{new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h4>
            </div>
            <div style={styles.iconCircle}>
              <Wallet size={20} color="var(--color-primary)" />
            </div>
          </div>
          
          <h2 style={styles.amountDisplay}>
            Rp {Number(sisaSaldo).toLocaleString('id-ID')}
          </h2>
          
          <p style={styles.limitLabel}>
            dari limit Rp {Number(profile.monthly_limit).toLocaleString('id-ID')}
          </p>

          <div style={styles.progressBarBg}>
            <div style={{
              ...styles.progressBarFg,
              width: `${Math.min(100, (totalSpent / profile.monthly_limit) * 100)}%`,
              backgroundColor: budgetStatus.color
            }} />
          </div>

          <div style={{ ...styles.statusIndicator, color: budgetStatus.color }}>
            <span style={{ ...styles.statusDot, backgroundColor: budgetStatus.color }} />
            {budgetStatus.text}
          </div>
        </div>

        {/* Survival Score and Spent Card (Split) */}
        <div style={styles.splitRow}>
          <div className="card" style={{ ...styles.splitCard, flex: 1.2 }}>
            <p style={styles.smallCardLabel}>Survival Score</p>
            <div style={styles.gaugeContainer}>
              <div className="circle-gauge">
                <svg width="90" height="90">
                  <circle className="bg-circle" cx="45" cy="45" r={radius} />
                  <circle
                    className="fg-circle"
                    cx="45"
                    cy="45"
                    r={radius}
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: strokeDashoffset,
                      stroke: getHpColor()
                    }}
                  />
                </svg>
                <div className="text" style={{ color: getHpColor() }}>
                  {survivalScore}
                  <span>HP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ ...styles.splitCard, flex: 1 }}>
            <p style={styles.smallCardLabel}>Total Kepake</p>
            <div style={styles.spentContainer}>
              <h3 style={styles.spentValue}>
                Rp {Number(totalSpent).toLocaleString('id-ID')}
              </h3>
              <div style={styles.spentBar}>
                <div style={{
                  ...styles.spentBarFill,
                  width: `${Math.min(100, (totalSpent / profile.monthly_limit) * 100)}%`
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Input Card */}
        <div className="card">
          <div style={styles.cardTitleRow}>
            <PlusCircle size={18} color="var(--color-primary)" />
            <h3>Input Cepat</h3>
          </div>
          <p style={styles.quickInputSub}>Catat pengeluaran instan Anda di bawah ini</p>
          
          <form onSubmit={handleQuickInput} style={styles.quickForm}>
            <div className="form-group">
              <label className="form-label" htmlFor="quick-keterangan">Keterangan</label>
              <input
                id="quick-keterangan"
                type="text"
                className="form-input"
                placeholder="Makan siang warteg..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={styles.formRow}>
              <div className="form-group" style={{ flex: 1.5 }}>
                <label className="form-label" htmlFor="quick-nominal">Nominal (Rp)</label>
                <input
                  id="quick-nominal"
                  type="number"
                  className="form-input"
                  placeholder="25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="quick-kategori">Kategori</label>
                <select
                  id="quick-kategori"
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {quickInputError && <p style={styles.errorMsg}>{quickInputError}</p>}

            <button type="submit" className="btn btn-primary" style={styles.quickBtn} disabled={quickInputLoading}>
              {quickInputLoading ? 'Mencatat...' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Catat Pengeluaran <Pencil size={14} />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column */}
      <div className="right-column">
        {/* AI Roasting Card */}
        <div className="card" style={styles.roastCard}>
          <div style={styles.roastHeader}>
            <div style={styles.roastLeftHeader}>
              <div style={styles.sparkleIconBg}>
                <Sparkles size={16} color="var(--color-primary-dark)" />
              </div>
              <span style={styles.roastTitle}>Evaluasi AI</span>
              
              {/* Persona Selector */}
              <select
                value={profile.ai_character}
                onChange={(e) => updateProfileSettings({ ai_character: e.target.value })}
                style={styles.personaSelect}
              >
                <option value="Dosen Killer">Dosen</option>
                <option value="Emak Bawel">Emak</option>
                <option value="Teman Santai">Teman</option>
              </select>

              {/* Spiciness Level Badge */}
              <div style={{
                ...styles.spicinessBadge,
                backgroundColor: profile.ai_spiciness === 'Pedes Mampus' ? 'var(--color-danger-light)' : profile.ai_spiciness === 'Sedang' ? 'var(--color-accent-light)' : 'var(--color-success-light)',
                color: profile.ai_spiciness === 'Pedes Mampus' ? 'var(--color-danger)' : profile.ai_spiciness === 'Sedang' ? 'var(--color-accent)' : 'var(--color-success)'
              }}>
                <Flame size={12} style={{ marginRight: '4px' }} />
                {profile.ai_spiciness}
              </div>
            </div>
            
            <button onClick={handleShareRoast} className="btn btn-secondary" style={styles.shareBtn}>
              <Share2 size={14} />
              Bagikan
            </button>
          </div>

          <div style={styles.roastBubble}>
            {roastLoading ? (
              <div style={styles.shimmerText}>Memikirkan roasting terbaik untuk kondisi dompetmu...</div>
            ) : (
              <p style={styles.roastText}>"{roasting}"</p>
            )}
          </div>
        </div>

        {/* Expense Distribution Card */}
        <div className="card" style={styles.distributionCard}>
          <div style={styles.cardTitleRow}>
            <Activity size={18} color="var(--color-primary)" />
            <h3>Sebaran Pengeluaran</h3>
          </div>

          {transactions.length === 0 ? (
            <div style={styles.emptyState}>
              <Activity size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
              <p>Belum ada data pengeluaran bulan ini.</p>
            </div>
          ) : (
            <div style={styles.chartContainer}>
              {/* Left: Custom SVG Doughnut Chart */}
              <div style={styles.chartVisual}>
                <svg viewBox="0 0 100 100" width="160" height="160">
                  <circle cx="50" cy="50" r="30" fill="none" stroke="var(--bg-tertiary)" strokeWidth="12" />
                  {categories.map((c) => {
                    const amount = categoryData[c.name] || 0;
                    if (amount === 0) return null;
                    const percentage = amount / totalCategoryAmt;
                    const strokeDash = percentage * (2 * Math.PI * 30);
                    const strokeOffset = (2 * Math.PI * 30) - (accumulatedAngle / totalCategoryAmt) * (2 * Math.PI * 30);
                    accumulatedAngle += amount;

                    return (
                      <circle
                        key={c.name}
                        cx="50"
                        cy="50"
                        r="30"
                        fill="none"
                        stroke={c.color}
                        strokeWidth="12"
                        strokeDasharray={`${strokeDash} ${2 * Math.PI * 30}`}
                        strokeDashoffset={strokeOffset}
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                      />
                    );
                  })}
                  <circle cx="50" cy="50" r="22" fill="var(--bg-secondary)" />
                  <text x="50" y="48" textAnchor="middle" style={styles.chartTotalLabel}>Total</text>
                  <text x="50" y="58" textAnchor="middle" style={styles.chartTotalValue}>
                    {totalSpent >= 1000000 
                      ? `${(totalSpent / 1000000).toFixed(1)}M` 
                      : `${(totalSpent / 1000).toFixed(0)}k`}
                  </text>
                </svg>
              </div>

              {/* Right: Legend Breakdown */}
              <div style={styles.chartLegend}>
                {categories.map((c) => {
                  const amount = categoryData[c.name] || 0;
                  const pct = totalCategoryAmt > 0 ? ((amount / totalCategoryAmt) * 100).toFixed(0) : 0;
                  
                  return (
                    <div key={c.name} style={styles.legendItem}>
                      <div style={styles.legendLeft}>
                        <span style={{ ...styles.legendDot, backgroundColor: c.color }} />
                        <span style={{ ...styles.legendIcon, display: 'inline-flex', alignItems: 'center' }}>
                          <c.icon size={14} color={c.color} />
                        </span>
                        <span style={styles.legendName}>{c.name}</span>
                      </div>
                      <div style={styles.legendRight}>
                        <span style={styles.legendAmount}>Rp {Number(amount).toLocaleString('id-ID')}</span>
                        <span style={styles.legendPct}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  budgetCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
    borderLeft: '5px solid var(--color-primary)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  cardMutedLabel: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  dateLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--color-primary-dark)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountDisplay: {
    fontSize: '36px',
    fontWeight: '800',
    color: 'var(--text-main)',
    letterSpacing: '-1px',
    margin: '6px 0',
  },
  limitLabel: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    marginBottom: '16px',
  },
  progressBarBg: {
    height: '8px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '14px',
  },
  progressBarFg: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.4s ease-out-in',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '700',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  splitRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  splitCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minWidth: '140px',
  },
  smallCardLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  gaugeContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '10px',
  },
  spentContainer: {
    marginTop: '16px',
  },
  spentValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--text-main)',
    marginBottom: '8px',
  },
  spentBar: {
    height: '4px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  spentBarFill: {
    height: '100%',
    backgroundColor: 'var(--color-primary)',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  quickInputSub: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginBottom: '20px',
  },
  quickForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formRow: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
  },
  quickBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    backgroundColor: '#0f766e',
  },
  errorMsg: {
    color: 'var(--color-danger)',
    fontSize: '13px',
  },
  roastCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
    border: '1px solid #fef3c7',
  },
  roastHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  roastLeftHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  sparkleIconBg: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: 'var(--color-accent-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roastTitle: {
    fontWeight: '700',
    fontSize: '15px',
  },
  personaSelect: {
    padding: '4px 8px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 'var(--bg-secondary)',
    cursor: 'pointer',
  },
  spicinessBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
  },
  shareBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '8px',
  },
  roastBubble: {
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '12px',
    padding: '16px',
    borderLeft: '4px solid var(--color-accent)',
  },
  roastText: {
    fontSize: '14px',
    fontStyle: 'italic',
    lineHeight: '1.6',
    fontWeight: '500',
  },
  shimmerText: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    animation: 'pulse 1.5s infinite',
  },
  distributionCard: {
    flex: 1,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    color: 'var(--text-muted)',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '32px',
  },
  chartContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    marginTop: '10px',
  },
  '@media (min-width: 600px)': {
    chartContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    }
  },
  chartVisual: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTotalLabel: {
    fontSize: '7px',
    fill: 'var(--text-muted)',
    fontWeight: '600',
  },
  chartTotalValue: {
    fontSize: '10px',
    fill: 'var(--text-main)',
    fontWeight: '800',
  },
  chartLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    maxWidth: '280px',
  },
  legendItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  legendLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  legendIcon: {
    fontSize: '14px',
  },
  legendName: {
    fontWeight: '500',
    color: 'var(--text-main)',
  },
  legendRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendAmount: {
    fontWeight: '600',
  },
  legendPct: {
    color: 'var(--text-muted)',
    fontSize: '11px',
    width: '28px',
    textAlign: 'right',
  }
};
