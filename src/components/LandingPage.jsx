import React, { useState } from 'react';
import {
  ReceiptText, Camera, Zap, BarChart2, ChevronDown,
  ArrowRight, Star, CheckCircle, MessageSquare, TrendingUp, ShieldCheck
} from 'lucide-react';
import '../landing.css';

const faqs = [
  { q: 'Apakah data keuanganku aman?', a: 'Ya, data kamu disimpan secara aman menggunakan enkripsi end-to-end. Kami tidak pernah menjual data pribadimu ke pihak ketiga.' },
  { q: 'Apakah StrukIn gratis?', a: 'StrukIn tersedia gratis dengan fitur lengkap. Coba Demo Mode tanpa perlu daftar akun!' },
  { q: 'Bagaimana cara kerja Scan struk?', a: 'Cukup foto struk belanjaanmu, AI kami otomatis mengekstrak nominal, kategori, dan merchant dalam hitungan detik.' },
  { q: 'Apa itu AI Roasting?', a: 'AI Roasting adalah fitur feedback jujur (dan sedikit pedas) dari AI kami tentang pola pengeluaranmu. Sakit dikit, tapi bikin melek finansial!' },
  { q: 'Bisa dipakai di HP?', a: 'Tentu! StrukIn fully responsive dan bisa diakses lewat browser di HP, tablet, maupun desktop.' },
];

const testimonials = [
  { name: 'Sarah K.', role: 'Freelance Designer', avatar: 'S', stars: 5, text: 'Awalnya iseng karena pengen di-roast AI, eh keterusan. Gara-gara dibilang "kolektor struk yang gak punya masa depan", sekarang aku jadi rajin nabung!' },
  { name: 'Budi Pratama', role: 'Software Engineer', avatar: 'B', stars: 5, text: 'Fitur scannya gila cepet banget. Analitiknya juga gak ribet. Soal roasting? Pedas tapi bener semua. Dompet aman, hati agak perih.' },
  { name: 'Rini Andriani', role: 'Marketing Manager', avatar: 'R', stars: 5, text: 'Akhirnya nemu app keuangan yang gak bikin ngantuk. AI-nya lucu banget tapi beneran ngebantu aku sadar pengeluaran bulanan udah gila-gilaan.' },
];

const features = [
  { icon: Camera, title: 'Scan & Simpan', desc: 'Cukup foto struk belanjaanmu. AI kami secara otomatis mengekstrak data nominal, kategori, hingga merchant secara instan.', color: '#14b8a6', bg: '#e6fffc' },
  { icon: Zap, title: 'AI Roasting', desc: 'Dapatkan feedback jujur (dan kadang pedas) tentang kebiasaan jajanmu. Cara terbaik untuk sadar diri tanpa merasa digurui.', color: '#f43f5e', bg: '#fff1f2' },
  { icon: BarChart2, title: 'Analitik Pintar', desc: 'Lihat aliran uangmu dalam grafik yang cantik dan mudah dipahami. Tahu persis ke mana perginya setiap rupiah.', color: '#6366f1', bg: '#eef2ff' },
];

const steps = [
  { num: '01', icon: Camera, title: 'Foto Struk', desc: 'Ambil foto struk atau input manual pengeluaranmu.' },
  { num: '02', icon: MessageSquare, title: 'AI Analisis', desc: 'AI kami memproses dan mengkategorikan pengeluaranmu otomatis.' },
  { num: '03', icon: Zap, title: 'Dapat Roasting', desc: 'Terima insight jujur (dan agak pedas) tentang pola belanjamu.' },
  { num: '04', icon: TrendingUp, title: 'Tumbuh Finansial', desc: 'Perbaiki kebiasaan dan pantau progressmu dari waktu ke waktu.' },
];

export default function LandingPage({ onGetStarted }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="lp-root">
      {/* NAVBAR */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#" className="lp-logo">
            <ReceiptText size={22} />
            Struk<span className="lp-logo-in">In</span>
          </a>
          <nav className="lp-nav-links">
            <a href="#features">Fitur</a>
            <a href="#how-it-works">Cara Kerja</a>
            <a href="#testimonials">Testimoni</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="lp-nav-cta">
            <button className="lp-btn-ghost" onClick={onGetStarted}>Masuk</button>
            <button className="lp-btn-primary" onClick={onGetStarted}>
              Coba Gratis <ArrowRight size={16} />
            </button>
          </div>
          <button className="lp-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
        {menuOpen && (
          <div className="lp-mobile-menu">
            <a href="#features" onClick={() => setMenuOpen(false)}>Fitur</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>Cara Kerja</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>Testimoni</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <button className="lp-btn-primary lp-btn-full" onClick={onGetStarted}>Coba Gratis</button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-bg" />
        <div className="lp-container">
          <div className="lp-hero-badge">
            <ShieldCheck size={14} /> Aman & Terpercaya
          </div>
          <h1 className="lp-hero-title">
            Pantau Keuanganmu &<br />
            <span className="lp-gradient-text">Rasakan Roasting AI</span><br />
            yang Mencerdaskan
          </h1>
          <p className="lp-hero-sub">
            Ubah struk belanja jadi insight keuangan dengan sentuhan humor dari AI kami. Berhenti boros dengan cara yang lebih menyenangkan.
          </p>
          <div className="lp-hero-roast">
            <div className="lp-roast-avatar">AI</div>
            <div className="lp-roast-bubble">
              "Kopi Starbucks tiap hari? Saldo tabunganmu menangis di pojokan, lho. ☕️💅"
            </div>
          </div>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary lp-btn-lg" onClick={onGetStarted}>
              Mulai Sekarang — Gratis! <ArrowRight size={18} />
            </button>
            <button className="lp-btn-ghost lp-btn-lg" onClick={onGetStarted}>
              Coba Demo Dulu
            </button>
          </div>
          <div className="lp-hero-stats">
            <div className="lp-stat"><strong>10K+</strong><span>Pengguna Aktif</span></div>
            <div className="lp-stat-divider" />
            <div className="lp-stat"><strong>500K+</strong><span>Struk Dipindai</span></div>
            <div className="lp-stat-divider" />
            <div className="lp-stat"><strong>4.9★</strong><span>Rating Pengguna</span></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-badge">Fitur Unggulan</span>
            <h2>Fitur Cerdas untuk Dompet Sehat</h2>
            <p>Semua yang kamu butuhkan untuk mengelola keuangan dengan sentuhan kecanggihan AI.</p>
          </div>
          <div className="lp-features-grid">
            {features.map((f, i) => (
              <div className="lp-feature-card" key={i}>
                <div className="lp-feature-icon" style={{ background: f.bg, color: f.color }}>
                  <f.icon size={28} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                {f.title === 'AI Roasting' && (
                  <div className="lp-feature-quote">
                    "Beli skincare lagi? Muka glowing tapi dompet burning nih bos! 🧴"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-section lp-section-alt" id="how-it-works">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-badge">Cara Kerja</span>
            <h2>Mulai dalam 4 Langkah Mudah</h2>
            <p>Dari foto struk sampai insight finansial, prosesnya cepat dan menyenangkan.</p>
          </div>
          <div className="lp-steps-grid">
            {steps.map((s, i) => (
              <div className="lp-step-card" key={i}>
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-icon"><s.icon size={24} /></div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-section" id="testimonials">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-badge">Testimoni</span>
            <h2>Dipercayai oleh Mereka yang Mau Berubah</h2>
            <p>Ratusan orang telah merasakan manfaat (dan rasa sakit) dari roasting AI kami.</p>
          </div>
          <div className="lp-testimonials-grid">
            {testimonials.map((t, i) => (
              <div className="lp-testimonial-card" key={i}>
                <div className="lp-testimonial-stars">
                  {[...Array(t.stars)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p className="lp-testimonial-text">"{t.text}"</p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar">{t.avatar}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="lp-cta-banner">
        <div className="lp-container">
          <div className="lp-cta-inner">
            <div className="lp-cta-icon"><ReceiptText size={40} /></div>
            <h2>Siap Menghadapi Kenyataan?</h2>
            <p>Bergabunglah dengan ribuan orang lainnya yang sudah mulai menata masa depan finansialnya dengan cara yang lebih seru.</p>
            <div className="lp-cta-checks">
              {['Gratis selamanya', 'Tanpa kartu kredit', 'Setup dalam 1 menit'].map((c, i) => (
                <span key={i}><CheckCircle size={16} /> {c}</span>
              ))}
            </div>
            <button className="lp-btn-white lp-btn-lg" onClick={onGetStarted}>
              Mulai Sekarang — Gratis! <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section" id="faq">
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-badge">FAQ</span>
            <h2>Pertanyaan Sering Diajukan</h2>
            <p>Punya pertanyaan? Kami punya jawabannya.</p>
          </div>
          <div className="lp-faq-list">
            {faqs.map((f, i) => (
              <div className={`lp-faq-item ${openFaq === i ? 'open' : ''}`} key={i}>
                <button className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  <ChevronDown size={18} className="lp-faq-chevron" />
                </button>
                {openFaq === i && <div className="lp-faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <a href="#" className="lp-logo">
                <ReceiptText size={18} />
                Struk<span className="lp-logo-in">In</span>
              </a>
              <p>Aplikasi pengatur keuangan dengan AI yang paling jujur sedunia.</p>
            </div>
            <div className="lp-footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Contact Us</a>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2025 StrukIn. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
