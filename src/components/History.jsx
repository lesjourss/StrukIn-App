import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FileDown, Trash2, Search, Calendar, Tag, Layers, Utensils, Car, ShoppingBag, HeartPulse, Clapperboard, Package, Folder, FileText } from 'lucide-react';

export default function History({ user, isDemo, transactions, onTransactionDeleted }) {
  const [selectedMonth, setSelectedMonth] = useState('Semua Bulan');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'Semua Kategori', icon: Folder, color: '#64748b' },
    { name: 'Makan', icon: Utensils, color: '#0d9488' },
    { name: 'Transport', icon: Car, color: '#3b82f6' },
    { name: 'Lifestyle', icon: ShoppingBag, color: '#ec4899' },
    { name: 'Kesehatan', icon: HeartPulse, color: '#ef4444' },
    { name: 'Hiburan', icon: Clapperboard, color: '#8b5cf6' },
    { name: 'Lainnya', icon: Package, color: '#64748b' }
  ];

  // Helper to format date string to month name (e.g., "Juni 2026")
  const formatMonthYear = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  };

  // Get unique months from transactions for filter list
  const uniqueMonths = ['Semua Bulan', ...new Set(transactions.map(t => formatMonthYear(t.transaction_date)))];

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const txMonth = formatMonthYear(t.transaction_date);
    const matchesMonth = selectedMonth === 'Semua Bulan' || txMonth === selectedMonth;
    const matchesCategory = selectedCategory === 'Semua Kategori' || t.category === selectedCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesMonth && matchesCategory && matchesSearch;
  });

  const totalFilteredAmount = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

    if (isDemo) {
      onTransactionDeleted(id);
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onTransactionDeleted(id);
    } catch (err) {
      console.error('Error deleting transaction:', err.message);
      onTransactionDeleted(id);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }
    const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Nominal (Rp)', 'Tipe Catatan', 'Catatan Tambahan'];
    const rows = filteredTransactions.map(t => [
      t.transaction_date,
      t.title,
      t.category,
      t.amount,
      t.source_type,
      t.notes || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_StrukIn_${selectedMonth.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const tableRows = filteredTransactions.map((t, index) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${t.transaction_date}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>${t.title}</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${t.category}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-transform: uppercase; font-size: 11px;">${t.source_type}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">Rp ${Number(t.amount).toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Transaksi StrukIn</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #0d9488; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f1f5f9; padding: 12px; text-align: left; font-weight: bold; }
            .total { text-align: right; font-size: 18px; margin-top: 20px; font-weight: bold; color: #0d9488; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">StrukIn</div>
            <p>Laporan Riwayat Transaksi Keuangan</p>
          </div>
          <div class="meta">
            <div>Bulan: <strong>${selectedMonth}</strong></div>
            <div>Kategori: <strong>${selectedCategory}</strong></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Kategori</th>
                <th>Sumber</th>
                <th style="text-align: right;">Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="total">
            Total Pengeluaran: Rp ${Number(totalFilteredAmount).toLocaleString('id-ID')}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getCategoryIcon = (catName) => {
    const found = categories.find(c => c.name === catName);
    if (found) {
      const Icon = found.icon;
      return <Icon size={14} style={{ marginRight: '4px' }} />;
    }
    return <Package size={14} style={{ marginRight: '4px' }} />;
  };

  const getCategoryColor = (catName) => {
    const found = categories.find(c => c.name === catName);
    return found ? found.color : '#64748b';
  };

  return (
    <div style={styles.container} className="animated-fade-in">
      {/* Header & Export Actions */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Riwayat Transaksi</h2>
          <p style={styles.subTitle}>
            {filteredTransactions.length} transaksi (difilter) — total <strong>Rp {Number(totalFilteredAmount).toLocaleString('id-ID')}</strong>
          </p>
        </div>

        <div style={styles.actionBtnRow}>
          <button onClick={handleExportCSV} className="btn btn-secondary" style={styles.exportBtn}>
            <FileDown size={16} /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="btn btn-primary" style={{ ...styles.exportBtn, backgroundColor: '#1e293b' }}>
            <FileDown size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={styles.filterCard} className="card">
        {/* Search */}
        <div style={styles.searchRow}>
          <Search size={18} color="var(--text-muted)" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan keterangan..."
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Month Filters */}
        <div style={styles.filterSection}>
          <span style={styles.filterLabel}><Calendar size={14} /> Bulan:</span>
          <div style={styles.filterBadgeGroup}>
            {uniqueMonths.map(month => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                style={{
                  ...styles.filterBadge,
                  backgroundColor: selectedMonth === month ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                  color: selectedMonth === month ? 'var(--text-white)' : 'var(--text-main)',
                }}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div style={styles.filterSection}>
          <span style={styles.filterLabel}><Tag size={14} /> Kategori:</span>
          <div style={styles.filterBadgeGroup}>
            {categories.map(cat => {
              const IconComponent = cat.icon;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  style={{
                    ...styles.filterBadge,
                    backgroundColor: selectedCategory === cat.name ? getCategoryColor(cat.name) : 'var(--bg-tertiary)',
                    color: selectedCategory === cat.name ? 'var(--text-white)' : 'var(--text-main)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <IconComponent size={13} /> {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
        {filteredTransactions.length === 0 ? (
          <div style={styles.emptyState}>
            <FileText size={36} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
            <h4>Belum ada catatan</h4>
            <p>Coba ubah filter pencarian atau rekam transaksi baru Anda.</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: '120px' }}>Tanggal</th>
                  <th style={styles.th}>Transaksi</th>
                  <th style={{ ...styles.th, width: '140px' }}>Kategori</th>
                  <th style={{ ...styles.th, width: '120px' }}>Metode</th>
                  <th style={{ ...styles.th, width: '150px', textAlign: 'right' }}>Nominal</th>
                  <th style={{ ...styles.th, width: '60px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => (
                  <tr key={t.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.dateBadge}>{t.transaction_date}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.titleCol}>
                        <strong style={styles.txTitle}>{t.title}</strong>
                        {t.notes && <span style={styles.txNotes}>{t.notes}</span>}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.catBadge,
                        backgroundColor: getCategoryColor(t.category) + '15',
                        color: getCategoryColor(t.category)
                      }}>
                        {getCategoryIcon(t.category)} {t.category}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.sourceBadge,
                        backgroundColor: t.source_type === 'scan' ? 'var(--color-primary-light)' : t.source_type === 'ai_chat' ? 'var(--color-accent-light)' : 'var(--bg-tertiary)',
                        color: t.source_type === 'scan' ? 'var(--color-primary-dark)' : t.source_type === 'ai_chat' ? 'var(--color-accent)' : 'var(--text-muted)'
                      }}>
                        {t.source_type === 'scan' ? 'OCR SCAN' : t.source_type === 'ai_chat' ? 'AI CHAT' : 'MANUAL'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: '800', color: 'var(--text-main)', fontSize: '15px' }}>
                      Rp {Number(t.amount).toLocaleString('id-ID')}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button onClick={() => handleDelete(t.id)} style={styles.deleteBtn}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '12px 0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '4px',
  },
  subTitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  actionBtnRow: {
    display: 'flex',
    gap: '12px',
  },
  exportBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    borderRadius: '10px',
  },
  filterCard: {
    padding: '20px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  searchRow: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 46px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-main)',
    transition: 'var(--transition-smooth)',
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: '80px',
  },
  filterBadgeGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  filterBadge: {
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 20px',
    color: 'var(--text-muted)',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '36px',
    marginBottom: '10px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '16px 20px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-muted)',
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--border-color)',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
    transition: 'var(--transition-smooth)',
  },
  td: {
    padding: '16px 20px',
    verticalAlign: 'middle',
  },
  dateBadge: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  titleCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  txTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--text-main)',
  },
  txNotes: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    maxWidth: '400px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  catBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  sourceBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-smooth)',
  }
};
