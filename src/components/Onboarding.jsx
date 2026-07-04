import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Sparkles, Shield, Flame, GraduationCap, Heart, UserCheck,
  Rocket, ChevronRight, ChevronLeft, Check, RefreshCw
} from 'lucide-react';

// ─── 5 Pertanyaan Kepribadian ───────────────────────────────────────────────
const questions = [
  {
    id: 1,
    q: 'Gimana perasaanmu setelah jajan lebih dari biasanya?',
    options: [
      { label: ' Nyesel banget, langsung ngomel ke diri sendiri', persona: 'Dosen Killer' },
      { label: ' Khawatir, terus nanya "ini bener ga sih?"', persona: 'Emak Bawel' },
      { label: ' Santai aja, next time lebih hati-hati', persona: 'Teman Santai' },
    ],
  },
  {
    id: 2,
    q: 'Kamu lagi lihat struk belanja. Apa reaksi pertamamu?',
    options: [
      { label: ' Langsung analisis mana yang tidak efisien', persona: 'Dosen Killer' },
      { label: ' "Aduh segini? Mana buat makan besok?"', persona: 'Emak Bawel' },
      { label: ' Scan aja dulu, urusan ntar belakangan', persona: 'Teman Santai' },
    ],
  },
  {
    id: 3,
    q: 'Teman paling ngaruh buat keuanganmu tuh kayak gimana?',
    options: [
      { label: ' Galak tapi bikin kamu disiplin', persona: 'Dosen Killer' },
      { label: ' Cerewet tapi selalu ada dan sayang banget', persona: 'Emak Bawel' },
      { label: ' Asik, ga drama, kasih masukan santai', persona: 'Teman Santai' },
    ],
  },
  {
    id: 4,
    q: 'Kamu lebih suka feedback keuangan yang seperti apa?',
    options: [
      { label: ' Terstruktur, data-driven, langsung ke akar masalah', persona: 'Dosen Killer' },
      { label: ' Penuh kepedulian meski agak lebay', persona: 'Emak Bawel' },
      { label: ' Jujur tapi tetap kasual, tanpa ceramah panjang', persona: 'Teman Santai' },
    ],
  },
  {
    id: 5,
    q: 'Kalau budget hampir habis, kamu bakal...',
    options: [
      { label: ' Buat laporan pengeluaran dan evaluasi ketat', persona: 'Dosen Killer' },
      { label: ' Panik dan phone a friend (ibu)', persona: 'Emak Bawel' },
      { label: ' Makan indomie dulu, overthinking belakangan', persona: 'Teman Santai' },
    ],
  },
];

const personaInfo = {
  'Dosen Killer': {
    icon: GraduationCap,
    color: 'var(--color-primary)',
    bg: 'var(--color-primary-light)',
    emoji: '🎓',
    tagline: 'Tegas, Analitis, Anti-Bocor!',
    desc: 'Kamu cocok dengan gaya feedback yang ketat dan berbasis data. Dosen Killer akan membantumu membedah setiap pengeluaran dengan presisi tinggi.',
  },
  'Emak Bawel': {
    icon: Heart,
    color: '#ef4444',
    bg: '#fee2e2',
    emoji: '👩‍👧',
    tagline: 'Peduli, Cerewet, Penuh Kasih!',
    desc: 'Kamu butuh sosok yang hangat tapi ga bisa diam kalau kamu boros. Emak Bawel selalu ada, tapi siap ceramah panjang kalau perlu.',
  },
  'Teman Santai': {
    icon: UserCheck,
    color: '#3b82f6',
    bg: '#dbeafe',
    emoji: '😎',
    tagline: 'Asik, Jujur, No Drama!',
    desc: 'Kamu lebih suka feedback yang ringan dan tidak menghakimi. Teman Santai akan kasih insight tanpa bikin kamu stress.',
  },
};

const spicinessLevels = [
  { level: 'Manis',       color: '#10b981', bg: '#d1fae5', desc: 'Saran logis & edukasi keuangan yang memotivasi.' },
  { level: 'Sedang',      color: '#f59e0b', bg: '#fef3c7', desc: 'Sindiran komedi ringan & nasehat lucu.' },
  { level: 'Pedes Mampus',color: '#ef4444', bg: '#fee2e2', desc: 'Roasting brutal, sarkasme murni tanpa ampun.' },
];

// Hitung karakter dari jawaban
function calcPersona(answers) {
  const count = { 'Dosen Killer': 0, 'Emak Bawel': 0, 'Teman Santai': 0 };
  answers.forEach(a => { if (a) count[a]++; });
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
}

export default function Onboarding({ user, isDemo, onOnboardingComplete, onBackToLanding }) {
  const [step, setStep] = useState(0); // 0=budget, 1=quiz, 2=result, 3=spicy
  const [limit, setLimit] = useState(0);
  const [answers, setAnswers] = useState(Array(5).fill(null)); // jawaban per soal
  const [quizIdx, setQuizIdx] = useState(0);             // soal ke-berapa
  const [suggestedChar, setSuggestedChar] = useState('');
  const [character, setCharacter] = useState('');
  const [spiciness, setSpiciness] = useState('Sedang');
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const formatNumber = (val) => val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const isBelowMin = limit > 0 && limit < 10000;

  // ── Step 0: Budget submit ──
  const handleBudgetNext = (e) => {
    e.preventDefault();
    if (!limit || limit < 10000) return;
    setStep(1);
    setQuizIdx(0);
  };

  // ── Step 1: Jawab soal ──
  const handleAnswer = (personaVal) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const newAnswers = [...answers];
    newAnswers[quizIdx] = personaVal;
    setAnswers(newAnswers);

    setTimeout(() => {
      if (quizIdx < questions.length - 1) {
        setQuizIdx(quizIdx + 1);
      } else {
        // Semua soal terjawab → hitung karakter
        const result = calcPersona(newAnswers);
        setSuggestedChar(result);
        setCharacter(result);
        setStep(2);
      }
      setIsTransitioning(false);
    }, 450); // Delay agar warna hijau terlihat
  };

  // ── Step 3 → Submit ──
  const handleSubmit = async () => {
    setLoading(true);
    const profileData = {
      id: user.id,
      monthly_limit: Number(limit),
      ai_character: character,
      ai_spiciness: spiciness,
    };

    if (isDemo) {
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
      setLoading(false);
      onOnboardingComplete(profileData);
      return;
    }

    try {
      const { error: insertError } = await supabase.from('profiles').insert(profileData);
      if (insertError) {
        if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ monthly_limit: profileData.monthly_limit, ai_character: profileData.ai_character, ai_spiciness: profileData.ai_spiciness })
            .eq('id', user.id);
          if (updateError) throw updateError;
        } else throw insertError;
      }
      onOnboardingComplete(profileData);
    } catch (err) {
      console.error('Error saving profile onboarding:', err);
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
      onOnboardingComplete(profileData);
    } finally {
      setLoading(false);
    }
  };

  const personas = Object.entries(personaInfo);
  const progress = step === 0 ? 0 : step === 1 ? Math.round((quizIdx / questions.length) * 100) : step === 2 ? 100 : 100;

  return (
    <div style={styles.container} className="animated-fade-in">
      <div style={styles.card}>

        {onBackToLanding && (
          <button type="button" onClick={onBackToLanding} style={styles.exitLink}>
            <ChevronLeft size={16} /> Kembali ke beranda
          </button>
        )}

        {/* Progress Bar */}
        <div style={styles.progressWrap}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>

        {/* ─── STEP 0: Budget ─── */}
        {step === 0 && (
          <>
            <div style={styles.header}>
              <div style={styles.badge}><Sparkles size={16} /> Setup Keuanganmu</div>
              <h1 style={styles.title}>Selamat Datang di StrukIn! </h1>
              <p style={styles.subtitle}>Mulai dengan mengatur budget bulananmu.</p>
            </div>
            <form onSubmit={handleBudgetNext} style={styles.form}>
              <div className="form-group" style={styles.section}>
                <label className="form-label" style={styles.sectionTitle}>
                  <Shield size={18} color="var(--color-primary)" />
                  Berapa budget / limit uang jajanmu per bulan?
                </label>
                <div style={{ ...styles.inputContainer, borderColor: isBelowMin ? '#ef4444' : 'var(--border-color)' }}>
                  <span style={styles.currencyPrefix}>Rp</span>
                  <input
                    type="text" inputMode="numeric"
                    className="form-input" style={styles.budgetInput}
                    value={limit === 0 ? '' : formatNumber(limit)}
                    placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, '');
                      if (raw === '' || /^\d+$/.test(raw)) setLimit(raw === '' ? 0 : Number(raw));
                    }}
                    required
                  />
                </div>
                {isBelowMin
                  ? <p style={{ ...styles.helpText, color: '#ef4444', fontWeight: '600' }}>⚠️ Budget terlalu kecil! Minimal Rp 10.000 ya.</p>
                  : <p style={styles.helpText}>Ini jadi acuan Survival Score & sisa saldo harianmu.</p>
                }
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ ...styles.submitBtn, opacity: (isBelowMin || !limit) ? 0.6 : 1 }}
                disabled={isBelowMin || !limit}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Lanjut — Kenali Dirimu <ChevronRight size={18} />
                </span>
              </button>
            </form>
          </>
        )}

        {/* ─── STEP 1: Quiz ─── */}
        {step === 1 && (
          <>
            <div style={styles.header}>
              <div style={styles.badge}><Sparkles size={16} /> Pertanyaan {quizIdx + 1} dari {questions.length}</div>
              <h1 style={styles.title}>Kenali Gayamu Dulu </h1>
              <p style={styles.subtitle}>Jawaban kamu akan menentukan karakter AI yang paling cocok.</p>
            </div>

            <div style={styles.quizDots}>
              {questions.map((_, i) => (
                <div key={i} style={{
                  ...styles.dot,
                  backgroundColor: i < quizIdx ? 'var(--color-primary)' : i === quizIdx ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  opacity: i === quizIdx ? 1 : i < quizIdx ? 0.7 : 0.4,
                  transform: i === quizIdx ? 'scale(1.3)' : 'scale(1)',
                }} />
              ))}
            </div>

            <div style={styles.questionBox}>
              <p style={styles.questionText}>{questions[quizIdx].q}</p>
            </div>

            <div style={styles.optionsList}>
              {questions[quizIdx].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt.persona)}
                  style={{
                    ...styles.optionBtn,
                    backgroundColor: answers[quizIdx] === opt.persona ? 'var(--color-primary)' : 'var(--bg-secondary)',
                    borderColor: answers[quizIdx] === opt.persona ? 'var(--color-primary)' : 'var(--border-color)',
                    color: answers[quizIdx] === opt.persona ? 'white' : 'var(--text-main)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {quizIdx > 0 && (
              <button onClick={() => setQuizIdx(quizIdx - 1)} style={styles.backLink}>
                <ChevronLeft size={16} /> Soal sebelumnya
              </button>
            )}
          </>
        )}

        {/* ─── STEP 2: Hasil Karakter ─── */}
        {step === 2 && (() => {
          const info = personaInfo[character];
          const Icon = info.icon;
          return (
            <>
              <div style={styles.header}>
                <div style={styles.badge}><Check size={16} /> Hasil Analisis</div>
                <h1 style={styles.title}>Cocok Banget sama Kamu!</h1>
                <p style={styles.subtitle}>Berdasarkan jawabanmu, karakter AI yang paling pas adalah...</p>
              </div>

              {/* Suggested Character Card */}
              <div style={{ ...styles.resultCard, borderColor: info.color, backgroundColor: info.bg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                  <div style={{ ...styles.resultIcon, backgroundColor: info.color }}>
                    <Icon size={28} color="white" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '800', color: info.color }}>{character}</h2>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: info.color, opacity: 0.8 }}>{info.tagline}</p>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.6 }}>{info.desc}</p>
              </div>

              {/* Konfirmasi */}
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', margin: '20px 0 12px', textAlign: 'center' }}>
                Apakah karakter ini cocok untukmu?
              </p>

              <button
                className="btn btn-primary"
                onClick={() => setStep(3)}
                style={{ ...styles.submitBtn, marginBottom: '12px' }}
              >
                <Check size={18} /> Ya, Cocok! Lanjutkan
              </button>

              {/* Ganti Manual */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '4px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '12px' }}>
                  <RefreshCw size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Atau pilih karakter lain secara manual:
                </p>
                <div style={styles.personaGrid}>
                  {personas.map(([name, info]) => {
                    const PIcon = info.icon;
                    const isActive = character === name;
                    return (
                      <button
                        key={name}
                        onClick={() => setCharacter(name)}
                        style={{
                          ...styles.personaCard,
                          borderColor: isActive ? info.color : 'var(--border-color)',
                          backgroundColor: isActive ? info.bg : 'var(--bg-secondary)',
                        }}
                      >
                        <PIcon size={20} color={isActive ? info.color : 'var(--text-muted)'} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: isActive ? info.color : 'var(--text-main)', marginTop: '6px' }}>
                          {name}
                        </span>
                        {name === suggestedChar && (
                          <span style={styles.suggestedBadge}>Rekomendasi</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {character !== suggestedChar && (
                  <button className="btn btn-primary" onClick={() => setStep(3)} style={{ ...styles.submitBtn, marginTop: '16px' }}>
                    Pakai {character} <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </>
          );
        })()}

        {/* ─── STEP 3: Level Pedas ─── */}
        {step === 3 && (
          <>
            <div style={styles.header}>
              <div style={styles.badge}><Flame size={16} color="#ef4444" /> Langkah Terakhir</div>
              <h1 style={styles.title}>Pilih Level Kepedasan</h1>
              <p style={styles.subtitle}>Seberapa "pedas" roasting dari {character} ke kamu?</p>
            </div>

            <div style={styles.spicyContainer}>
              {spicinessLevels.map((s) => (
                <div
                  key={s.level}
                  style={{
                    ...styles.spicyCard,
                    borderColor: spiciness === s.level ? s.color : 'var(--border-color)',
                    backgroundColor: spiciness === s.level ? s.bg : 'transparent',
                    color: spiciness === s.level ? s.color : 'var(--text-main)',
                  }}
                  onClick={() => setSpiciness(s.level)}
                >
                  <strong style={{ fontWeight: '800' }}>{s.level}</strong>
                  <p style={{ ...styles.spicyDesc, color: spiciness === s.level ? 'inherit' : 'var(--text-muted)' }}>{s.desc}</p>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              style={{ ...styles.submitBtn, marginTop: '24px', opacity: loading ? 0.6 : 1 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Mulai Petualangan Hemat <Rocket size={18} />
                </span>
              )}
            </button>

            <button onClick={() => setStep(2)} style={styles.backLink}>
              <ChevronLeft size={16} /> Kembali
            </button>
          </>
        )}

      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', padding: '24px 0 120px' },
  card: {
    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)', padding: '32px 28px',
    maxWidth: '600px', width: '100%', boxShadow: 'var(--shadow-lg)',
  },
  progressWrap: { height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', marginBottom: '28px', overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '2px', transition: 'width 0.4s ease' },
  header: { textAlign: 'center', marginBottom: '24px' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)',
    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', marginBottom: '14px',
  },
  title: { fontSize: '26px', fontWeight: '800', marginBottom: '8px' },
  subtitle: { color: 'var(--text-muted)', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  section: { borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', marginBottom: '14px' },
  inputContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
  currencyPrefix: { position: 'absolute', left: '16px', fontWeight: '700', color: 'var(--text-muted)' },
  budgetInput: { paddingLeft: '44px', fontSize: '20px', fontWeight: '700', width: '100%' },
  helpText: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' },

  // Quiz
  quizDots: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', transition: 'all 0.3s ease' },
  questionBox: {
    backgroundColor: 'var(--bg-tertiary)', borderRadius: '14px',
    padding: '20px', marginBottom: '16px', textAlign: 'center',
  },
  questionText: { fontSize: '16px', fontWeight: '700', lineHeight: 1.5, color: 'var(--text-main)' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  optionBtn: {
    padding: '14px 16px', borderRadius: '12px', border: '2px solid',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.2s', fontFamily: 'inherit', lineHeight: 1.4,
    WebkitTapHighlightColor: 'transparent',
  },

  // Result
  resultCard: { border: '2px solid', borderRadius: '16px', padding: '20px', marginBottom: '4px' },
  resultIcon: {
    width: '52px', height: '52px', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // Persona grid di result
  personaGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  personaCard: {
    border: '2px solid', borderRadius: '12px', padding: '14px 8px',
    cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '2px', transition: 'all 0.2s',
    background: 'none', fontFamily: 'inherit', position: 'relative',
    WebkitTapHighlightColor: 'transparent',
  },
  suggestedBadge: {
    position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
    backgroundColor: 'var(--color-primary)', color: 'white',
    fontSize: '9px', fontWeight: '800', padding: '2px 7px', borderRadius: '10px',
    whiteSpace: 'nowrap',
  },

  // Spicy
  spicyContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
  spicyCard: {
    border: '2px solid', borderRadius: 'var(--border-radius-md)',
    padding: '16px 20px', cursor: 'pointer',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    transition: 'all 0.2s',
  },
  spicyDesc: { fontSize: '13px', textAlign: 'right' },

  submitBtn: { width: '100%', padding: '16px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  backLink: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
    background: 'none', border: 'none', color: 'var(--text-muted)',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '12px',
    width: '100%', WebkitTapHighlightColor: 'transparent',
  },
  exitLink: {
    display: 'flex', alignItems: 'center', gap: '4px',
    background: 'none', border: 'none', color: 'var(--text-muted)',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px',
    padding: 0, fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
  },
};
