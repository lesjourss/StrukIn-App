import React, { useState } from 'react';
import { CheckCircle, XCircle, Zap, Star, Crown, ArrowRight, Sparkles } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Gratis',
    tagline: 'Gratis, tapi dikit-dikit dibatasin. Kaya ngekos tapi WiFi lemot.',
    price: 0,
    priceAnnual: 0,
    color: '#6366f1',
    colorLight: '#eef2ff',
    icon: Star,
    badge: null,
    features: [
      { label: 'Scan Struk', value: '10x / bulan', ok: true },
      { label: 'AI Roasting', value: '3x / bulan', ok: true },
      { label: 'Riwayat Transaksi', value: '30 hari', ok: true },
      { label: 'Analitik & Grafik', value: 'Basic', ok: true },
      { label: 'Laporan PDF/Excel', value: null, ok: false },
      { label: 'AI Chat Advisor', value: null, ok: false },
      { label: 'Multi Dompet', value: null, ok: false },
    ],
    cta: 'Mulai Gratis',
    ctaStyle: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Buat kamu yang serius berubah, tapi dompet masih mau diajak kompromi.',
    price: 29000,
    priceAnnual: 24000,
    color: '#0d9488',
    colorLight: '#e6fffc',
    icon: Zap,
    badge: '🔥 Paling Populer',
    features: [
      { label: 'Scan Struk', value: 'Unlimited', ok: true },
      { label: 'AI Roasting', value: 'Unlimited', ok: true },
      { label: 'Riwayat Transaksi', value: '1 Tahun', ok: true },
      { label: 'Analitik & Grafik', value: 'Advanced', ok: true },
      { label: 'Laporan PDF/Excel', value: 'Termasuk', ok: true },
      { label: 'AI Chat Advisor', value: null, ok: false },
      { label: 'Multi Dompet', value: null, ok: false },
    ],
    cta: 'Coba Pro — 7 Hari Gratis',
    ctaStyle: 'primary',
  },
  {
    id: 'premium',
    name: 'Sultan',
    tagline: 'Level Sultan. Semua fitur, semua akses, semua roasting tanpa batas.',
    price: 59000,
    priceAnnual: 49000,
    color: '#f59e0b',
    colorLight: '#fffbeb',
    icon: Crown,
    badge: '👑 Sultan Mode',
    features: [
      { label: 'Scan Struk', value: 'Unlimited', ok: true },
      { label: 'AI Roasting', value: 'Unlimited', ok: true },
      { label: 'Riwayat Transaksi', value: 'Selamanya', ok: true },
      { label: 'Analitik & Grafik', value: 'Advanced + Export', ok: true },
      { label: 'Laporan PDF/Excel', value: 'Termasuk', ok: true },
      { label: 'AI Chat Advisor', value: 'Termasuk', ok: true },
      { label: 'Multi Dompet', value: '5 Dompet', ok: true },
    ],
    cta: 'Jadi Sultan Sekarang',
    ctaStyle: 'gold',
  },
];

export default function PricingSection({ onGetStarted }) {
  const [annual, setAnnual] = useState(false);

  const formatPrice = (price) =>
    price === 0 ? 'Gratis' : `Rp ${price.toLocaleString('id-ID')}`;

  return (
    <section className="lp-section lp-section-alt" id="pricing">
      <div className="lp-container">
        {/* Header */}
        <div className="lp-section-header">
          <span className="lp-section-badge">Harga</span>
          <h2>Pilih Plan yang Cocok di Kantong</h2>
          <p>Mulai gratis, upgrade kalau udah sadar diri. Tidak ada jebakan batman.</p>

          {/* Billing Toggle */}
          <div className="lp-pricing-toggle">
            <span className={!annual ? 'toggle-active' : ''}>Bulanan</span>
            <button
              className={`lp-toggle-btn ${annual ? 'on' : ''}`}
              onClick={() => setAnnual(!annual)}
              aria-label="Toggle billing period"
            >
              <span className="lp-toggle-knob" />
            </button>
            <span className={annual ? 'toggle-active' : ''}>
              Tahunan
              <span className="lp-pricing-save-badge">Hemat 17%</span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="lp-pricing-grid">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const displayPrice = annual && plan.price > 0 ? plan.priceAnnual : plan.price;
            const isPro = plan.id === 'pro';

            return (
              <div
                key={plan.id}
                className={`lp-pricing-card ${isPro ? 'lp-pricing-card--featured' : ''}`}
                style={{ '--plan-color': plan.color, '--plan-color-light': plan.colorLight }}
              >
                {isPro && <div className="lp-pricing-featured-glow" />}

                {/* Badge */}
                {plan.badge && (
                  <div className="lp-pricing-badge" style={{ background: plan.colorLight, color: plan.color }}>
                    {plan.badge}
                  </div>
                )}

                {/* Icon + Name */}
                <div className="lp-pricing-icon" style={{ background: plan.colorLight, color: plan.color }}>
                  <Icon size={22} />
                </div>
                <h3 className="lp-pricing-name">{plan.name}</h3>
                <p className="lp-pricing-tagline">"{plan.tagline}"</p>

                {/* Price */}
                <div className="lp-pricing-price-wrap">
                  <div className="lp-pricing-price">
                    {plan.price === 0 ? (
                      <span className="lp-price-main">Gratis</span>
                    ) : (
                      <>
                        <span className="lp-price-rp">Rp</span>
                        <span className="lp-price-main">
                          {displayPrice.toLocaleString('id-ID')}
                        </span>
                        <span className="lp-price-period">/bulan</span>
                      </>
                    )}
                  </div>
                  {annual && plan.price > 0 && (
                    <div className="lp-price-annual-note">
                      Ditagih Rp {(plan.priceAnnual * 12).toLocaleString('id-ID')}/tahun
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="lp-pricing-divider" />

                {/* Features */}
                <ul className="lp-pricing-features">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`lp-pricing-feature ${f.ok ? 'ok' : 'no'}`}>
                      {f.ok ? (
                        <CheckCircle size={16} className="lp-feat-check" />
                      ) : (
                        <XCircle size={16} className="lp-feat-cross" />
                      )}
                      <span>{f.label}</span>
                      {f.ok && f.value && (
                        <span className="lp-feat-value">{f.value}</span>
                      )}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  className={`lp-pricing-cta lp-pricing-cta--${plan.ctaStyle}`}
                  onClick={onGetStarted}
                >
                  {plan.cta}
                  {plan.id !== 'free' && <ArrowRight size={16} />}
                </button>

                {plan.id === 'free' && (
                  <p className="lp-pricing-no-cc">Tidak perlu kartu kredit</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="lp-pricing-footnote">
          <Sparkles size={16} />
          <span>
            Semua plan sudah termasuk enkripsi data, backup otomatis, dan update fitur terbaru.
            Bisa cancel kapan saja, tanpa drama.
          </span>
        </div>
      </div>
    </section>
  );
}
