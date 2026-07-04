import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { parseReceiptOCR, MOCK_OCR } from '../lib/gemini';
import { Camera, Image, Check, Plus, Trash2, ArrowRight, RefreshCw, Users, User, CheckCircle, AlertCircle, X } from 'lucide-react';

// ─── Custom Modal Component ────────────────────────────────────────────────
function ScanModal({ modal, onClose }) {
  if (!modal) return null;
  const isSuccess = modal.type === 'success';
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.box} onClick={(e) => e.stopPropagation()} className="animated-fade-in">
        <div style={{ ...modalStyles.iconCircle, backgroundColor: isSuccess ? '#d1fae5' : '#fee2e2' }}>
          {isSuccess
            ? <CheckCircle size={36} color="#10b981" />
            : <AlertCircle size={36} color="#ef4444" />}
        </div>
        <h3 style={{ ...modalStyles.title, color: isSuccess ? '#065f46' : '#991b1b' }}>
          {modal.title}
        </h3>
        <p style={modalStyles.message}>{modal.message}</p>
        <button
          onClick={onClose}
          style={{ ...modalStyles.closeBtn, backgroundColor: isSuccess ? '#10b981' : '#ef4444' }}
        >
          {isSuccess ? <><Check size={16} /> Oke, Lanjut!</> : <><X size={16} /> Tutup</>}
        </button>
      </div>
    </div>
  );
}

export default function Scan({ user, isDemo, onTransactionsSaved }) {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [splitMode, setSplitMode] = useState('mine'); // 'mine' or 'split'
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [modal, setModal] = useState(null); // { type: 'success'|'error', title, message, onClose }
  const fileInputRef = useRef(null);

  const showModal = (type, title, message, afterClose) => {
    setModal({ type, title, message, afterClose });
  };

  const closeModal = () => {
    const cb = modal?.afterClose;
    setModal(null);
    if (cb) cb();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      startScan(selectedFile);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const startScan = async (selectedFile) => {
    setScanning(true);
    try {
      const data = await parseReceiptOCR(selectedFile);
      setParsedData(data);
    } catch (err) {
      console.error('Scan Error:', err);
      showModal(
        'error',
        'Gagal Memindai Nota',
        `Tidak dapat mendeteksi nota belanja: ${err.message || err}. Menggunakan data simulasi (mock) untuk demo.`,
        () => {}
      );
      setParsedData(MOCK_OCR);
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...parsedData.items];
    if (field === 'price') {
      updatedItems[index][field] = Number(value) || 0;
    } else {
      updatedItems[index][field] = value;
    }
    
    // Recalculate subtotal
    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.price, 0);
    const newTotal = newSubtotal - parsedData.discount + parsedData.tax + parsedData.serviceCharge;

    setParsedData({
      ...parsedData,
      items: updatedItems,
      subtotal: newSubtotal,
      total: newTotal
    });
  };

  const handleAddNewItem = () => {
    const newItems = [...parsedData.items, { name: 'ITEM BARU', price: 0 }];
    const newSubtotal = newItems.reduce((sum, item) => sum + item.price, 0);
    const newTotal = newSubtotal - parsedData.discount + parsedData.tax + parsedData.serviceCharge;

    setParsedData({
      ...parsedData,
      items: newItems,
      subtotal: newSubtotal,
      total: newTotal
    });
  };

  const handleDeleteItem = (index) => {
    const newItems = parsedData.items.filter((_, i) => i !== index);
    const newSubtotal = newItems.reduce((sum, item) => sum + item.price, 0);
    const newTotal = newSubtotal - parsedData.discount + parsedData.tax + parsedData.serviceCharge;

    setParsedData({
      ...parsedData,
      items: newItems,
      subtotal: newSubtotal,
      total: newTotal
    });
  };

  const handleSummaryChange = (field, value) => {
    const numValue = Number(value) || 0;
    const newData = { ...parsedData, [field]: numValue };
    newData.total = newData.subtotal - newData.discount + newData.tax + newData.serviceCharge;
    setParsedData(newData);
  };

  const handleSaveReceipt = async () => {
    // Determine target amount based on split mode
    let amountToSave = parsedData.total;
    let titleToSave = `Scan Struk ${parsedData.merchantName || 'Belanja'}`;

    if (splitMode === 'split') {
      amountToSave = Math.round(parsedData.total / numberOfPeople);
      titleToSave += ` (Bagi ${numberOfPeople} orang)`;
    }

    const newTx = {
      user_id: user.id,
      title: titleToSave,
      amount: amountToSave,
      category: 'Makan', // Default category for groceries, can be edited in history
      transaction_date: new Date().toISOString().split('T')[0],
      notes: `Detail Struk: Subtotal Rp ${parsedData.subtotal}, Diskon Rp ${parsedData.discount}, Pajak Rp ${parsedData.tax}. Total Rp ${parsedData.total}`,
      source_type: 'scan'
    };

    if (isDemo) {
      const mockSavedTx = {
        ...newTx,
        id: `local-tx-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      onTransactionsSaved([mockSavedTx]);
      showModal(
        'success',
        'Struk Tersimpan!',
        'Transaksimu berhasil dicatat. Cek di halaman Riwayat untuk melihat detail.',
        resetScanState
      );
      return;
    }

    try {
      // Save receipt log in scanned_receipts first
      await supabase.from('scanned_receipts').insert({
        user_id: user.id,
        merchant_name: parsedData.merchantName,
        subtotal: parsedData.subtotal,
        discount: parsedData.discount,
        tax: parsedData.tax,
        service_charge: parsedData.serviceCharge,
        total: parsedData.total
      });

      // Save transaction
      const { data, error } = await supabase
        .from('transactions')
        .insert(newTx)
        .select()
        .single();

      if (error) throw error;
      onTransactionsSaved([data]);
      showModal(
        'success',
        'Struk Tersimpan!',
        'Transaksimu berhasil dicatat. Cek di halaman Riwayat untuk melihat detail.',
        resetScanState
      );
    } catch (err) {
      console.error('Error saving scanned receipt:', err.message);
      // fallback
      const mockSavedTx = {
        ...newTx,
        id: `local-tx-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      onTransactionsSaved([mockSavedTx]);
      resetScanState();
    }
  };

  const resetScanState = () => {
    setFile(null);
    setImagePreview(null);
    setScanning(false);
    setParsedData(null);
    setSplitMode('mine');
    setNumberOfPeople(2);
  };

  return (
    <div style={styles.container} className="animated-fade-in">
      <ScanModal modal={modal} onClose={closeModal} />
      {!parsedData && !scanning && (
        <div className="card" style={styles.uploadCard}>
          <div style={styles.iconCircleBig}>
            <Camera size={32} color="var(--color-primary)" />
          </div>
          <h2 style={styles.uploadTitle}>Scan Nota Belanja</h2>
          <p style={styles.uploadDesc}>
            Unggah foto nota belanjamu, kami akan mengekstrak daftar item dan totalnya secara otomatis dengan AI.
          </p>

          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <div style={styles.btnRow}>
            <button onClick={triggerFileInput} className="btn btn-primary" style={styles.scanBtn}>
              <Camera size={18} /> Kamera
            </button>
            <button onClick={triggerFileInput} className="btn btn-secondary" style={styles.scanBtn}>
              <Image size={18} /> Galeri
            </button>
          </div>
        </div>
      )}

      {scanning && (
        <div className="card" style={styles.loadingCard}>
          <div style={styles.spinnerContainer}>
            <RefreshCw size={48} className="spinner" style={styles.spinnerIcon} />
          </div>
          <h3 style={styles.loadingTitle}>Memindai Nota Belanja...</h3>
          <p style={styles.loadingDesc}>
            Gemini AI sedang membaca item, harga, diskon, dan total belanjaan Anda secara instan.
          </p>
        </div>
      )}

      {parsedData && !scanning && (
        <div style={styles.resultContainer}>
          {/* Left: Items Verification */}
          <div className="card" style={styles.itemsCard}>
            <div style={styles.itemsHeader}>
              <div>
                <h3 style={styles.resultCardTitle}>Daftar Item Belanja</h3>
                <p style={styles.resultCardSub}>Klik teks atau harga untuk mengedit jika ada yang kurang tepat.</p>
              </div>
            </div>

            <div style={styles.itemsList}>
              {parsedData.items.map((item, idx) => (
                <div key={idx} style={styles.itemRow}>
                  <span style={styles.itemIndex}>{String(idx + 1).padStart(2, '0')}</span>
                  
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                    style={styles.itemNameInput}
                  />

                  <div style={styles.itemPriceCol}>
                    <span style={styles.itemPricePrefix}>Rp</span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleUpdateItem(idx, 'price', e.target.value)}
                      style={styles.itemPriceInput}
                    />
                  </div>

                  <button onClick={() => handleDeleteItem(idx)} style={styles.deleteBtn}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button onClick={handleAddNewItem} className="btn btn-secondary" style={styles.addItemBtn}>
              <Plus size={16} /> Tambah Item Baru
            </button>
          </div>

          {/* Right: Ringkasan Tagihan */}
          <div style={styles.summaryColumn}>
            <div className="card" style={styles.summaryCard}>
              <h3 style={styles.merchantNameTitle}>
                {parsedData.merchantName || 'Merchant'}
              </h3>
              <p style={styles.summarySubtitle}>Ringkasan Tagihan</p>

              <div style={styles.summaryDivider} />

              <div style={styles.summaryRow}>
                <span>Subtotal Item</span>
                <strong>Rp {Number(parsedData.subtotal).toLocaleString('id-ID')}</strong>
              </div>

              <div style={styles.summaryInputRow}>
                <span>Diskon</span>
                <div style={styles.summaryInputWrapper}>
                  <span style={styles.summaryInputPrefix}>- Rp</span>
                  <input
                    type="number"
                    value={parsedData.discount}
                    onChange={(e) => handleSummaryChange('discount', e.target.value)}
                    style={styles.summaryInput}
                  />
                </div>
              </div>

              <div style={styles.summaryInputRow}>
                <span>Pajak (PPN)</span>
                <div style={styles.summaryInputWrapper}>
                  <span style={styles.summaryInputPrefix}>+ Rp</span>
                  <input
                    type="number"
                    value={parsedData.tax}
                    onChange={(e) => handleSummaryChange('tax', e.target.value)}
                    style={styles.summaryInput}
                  />
                </div>
              </div>

              <div style={styles.summaryInputRow}>
                <span>Biaya Layanan</span>
                <div style={styles.summaryInputWrapper}>
                  <span style={styles.summaryInputPrefix}>+ Rp</span>
                  <input
                    type="number"
                    value={parsedData.serviceCharge}
                    onChange={(e) => handleSummaryChange('serviceCharge', e.target.value)}
                    style={styles.summaryInput}
                  />
                </div>
              </div>

              <div style={styles.summaryDivider} />

              <div style={styles.totalRow}>
                <span>Total Nota</span>
                <span style={styles.totalValue}>Rp {Number(parsedData.total).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Split Mode Options */}
            <div className="card" style={styles.splitCard}>
              <p style={styles.splitTitle}>Metode Penyimpanan</p>
              
              <div style={styles.splitTabs}>
                <button
                  onClick={() => setSplitMode('mine')}
                  style={{
                    ...styles.splitTab,
                    backgroundColor: splitMode === 'mine' ? 'var(--color-primary-light)' : 'transparent',
                    borderColor: splitMode === 'mine' ? 'var(--color-primary)' : 'var(--border-color)',
                    color: splitMode === 'mine' ? 'var(--color-primary-dark)' : 'var(--text-muted)'
                  }}
                >
                  <User size={16} />
                  <span>Milikku Semua</span>
                </button>

                <button
                  onClick={() => setSplitMode('split')}
                  style={{
                    ...styles.splitTab,
                    backgroundColor: splitMode === 'split' ? 'var(--color-primary-light)' : 'transparent',
                    borderColor: splitMode === 'split' ? 'var(--color-primary)' : 'var(--border-color)',
                    color: splitMode === 'split' ? 'var(--color-primary-dark)' : 'var(--text-muted)'
                  }}
                >
                  <Users size={16} />
                  <span>Bagi Tagihan</span>
                </button>
              </div>

              {splitMode === 'split' && (
                <div style={styles.splitConfig} className="animated-fade-in">
                  <div style={styles.peopleRow}>
                    <label>Bagi untuk berapa orang?</label>
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={numberOfPeople}
                      onChange={(e) => setNumberOfPeople(Math.max(2, Number(e.target.value)))}
                      style={styles.peopleInput}
                    />
                  </div>
                  <div style={styles.splitSummaryMsg}>
                    Setiap orang membayar: <strong>Rp {Number(Math.round(parsedData.total / numberOfPeople)).toLocaleString('id-ID')}</strong> (Pengeluaran dicatat sejumlah bagian Anda).
                  </div>
                </div>
              )}

              <div style={styles.actionBtnRow}>
                <button onClick={resetScanState} className="btn btn-secondary" style={{ flex: 1 }}>
                  Ulangi Pindai
                </button>
                <button onClick={handleSaveReceipt} className="btn btn-primary" style={{ flex: 1.5 }}>
                  Simpan Transaksi <Check size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add CSS keyframe rotation for Spinner
const styleSheet = document.styleSheets[0];
try {
  styleSheet.insertRule(`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `, styleSheet.cssRules.length);
} catch (e) {}

const styles = {
  container: {
    padding: '12px 0',
  },
  uploadCard: {
    maxWidth: '560px',
    margin: '40px auto',
    textAlign: 'center',
    padding: '40px',
  },
  iconCircleBig: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary-light)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  uploadTitle: {
    fontSize: '22px',
    fontWeight: '800',
    marginBottom: '10px',
  },
  uploadDesc: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  btnRow: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  scanBtn: {
    flex: 1,
    maxWidth: '160px',
  },
  loadingCard: {
    maxWidth: '560px',
    margin: '40px auto',
    textAlign: 'center',
    padding: '40px',
  },
  spinnerContainer: {
    marginBottom: '20px',
  },
  spinnerIcon: {
    animation: 'spin 1.5s linear infinite',
    color: 'var(--color-primary)',
  },
  loadingTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  loadingDesc: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  resultContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px',
  },
  '@media (min-width: 900px)': {
    resultContainer: {
      gridTemplateColumns: '7fr 5fr',
    }
  },
  itemsCard: {
    display: 'flex',
    flexDirection: 'column',
    height: 'fit-content',
  },
  resultCardTitle: {
    fontSize: '18px',
    fontWeight: '800',
    marginBottom: '4px',
  },
  resultCardSub: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginBottom: '20px',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '12px',
    padding: '10px 14px',
    gap: '12px',
    border: '1px solid var(--border-color)',
  },
  itemIndex: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    minWidth: '20px',
  },
  itemNameInput: {
    flex: 2,
    border: 'none',
    background: 'transparent',
    fontWeight: '600',
    fontSize: '14px',
    color: 'var(--text-main)',
    outline: 'none',
  },
  itemPriceCol: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    justifyContent: 'flex-end',
  },
  itemPricePrefix: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-muted)',
  },
  itemPriceInput: {
    width: '80px',
    border: 'none',
    background: 'transparent',
    textAlign: 'right',
    fontWeight: '700',
    fontSize: '14px',
    color: 'var(--text-main)',
    outline: 'none',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '6px',
    transition: 'var(--transition-smooth)',
  },
  addItemBtn: {
    width: '100%',
    borderStyle: 'dashed',
    borderWidth: '2px',
  },
  summaryColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  summaryCard: {
    backgroundColor: 'var(--bg-secondary)',
  },
  merchantNameTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--text-main)',
    marginBottom: '2px',
  },
  summarySubtitle: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  summaryDivider: {
    height: '1px',
    backgroundColor: 'var(--border-color)',
    margin: '16px 0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    marginBottom: '12px',
  },
  summaryInputRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    marginBottom: '10px',
  },
  summaryInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'var(--bg-primary)',
    padding: '8px 12px',
    borderRadius: '12px',
    border: '1.5px solid var(--border-color)',
    width: '140px',
    transition: 'var(--transition-smooth)',
  },
  summaryInputPrefix: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    minWidth: '24px',
  },
  summaryInput: {
    border: 'none',
    background: 'transparent',
    width: '100%',
    outline: 'none',
    fontWeight: '700',
    textAlign: 'right',
    color: 'var(--text-main)',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
  splitCard: {
    backgroundColor: 'var(--bg-secondary)',
  },
  splitTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    marginBottom: '12px',
  },
  splitTabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  splitTab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 0',
    borderRadius: '10px',
    border: '1.5px solid',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    background: 'none',
    transition: 'var(--transition-smooth)',
  },
  splitConfig: {
    backgroundColor: 'var(--bg-primary)',
    borderRadius: '12px',
    padding: '12px 16px',
    border: '1px solid var(--border-color)',
    marginBottom: '16px',
  },
  peopleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  peopleInput: {
    width: '50px',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    textAlign: 'center',
    fontWeight: '700',
  },
  splitSummaryMsg: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  actionBtnRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: '22px',
    color: 'var(--color-primary-dark)',
    fontWeight: '800',
  }
};

// ─── Modal Styles ────────────────────────────────────────────────────────────
const modalStyles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px',
  },
  box: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '24px',
    padding: '36px 32px',
    maxWidth: '380px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
    border: '1px solid var(--border-color)',
  },
  iconCircle: {
    width: '72px', height: '72px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: '20px', fontWeight: '800', marginBottom: '10px',
  },
  message: {
    fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px',
  },
  closeBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    color: 'white', border: 'none', borderRadius: '14px',
    padding: '14px 32px', fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', width: '100%', fontFamily: 'inherit',
    transition: 'opacity 0.2s',
  },
};
// Mount global styles dynamically to enable CSS animation on component load
if (typeof document !== 'undefined') {
  const css = `
    .spinner {
      animation: spin 1.2s linear infinite;
    }
  `;
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}
