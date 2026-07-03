// Mock responses for smooth demonstration without API keys or during local fallback
const MOCK_ROASTS = {
  'Dosen Killer': {
    'Manis': 'Saya melihat potensi pada keuangan Anda. Namun, jika Anda tidak mulai membatasi pengeluaran non-primer, target kelulusan finansial Anda bisa tertunda. Silakan revisi anggaran belanja Anda.',
    'Sedang': 'Pengeluaran Anda bulan ini sudah mulai di luar silabus. Baru pertengahan bulan tapi budget sudah terpakai banyak. Apakah Anda ingin mengulang kelas Manajemen Keuangan tahun depan?',
    'Pedes Mampus': 'Nilai laporan keuangan Anda E! Uang Rp 1.000.000 saja sudah merasa paling kaya dan belanja sembarangan. Segera matikan HP Anda dan kerjakan revisi skripsi, jangan sok-sokan jajan kopi mahal!'
  },
  'Emak Bawel': {
    'Manis': 'Nak, tolong kurangi jajan-jajan yang kurang perlu ya. Emak cuma khawatir kamu nanti pusing sendiri pas akhir bulan. Tabung uangnya buat masa depan.',
    'Sedang': 'Ya ampun le/nduk, itu belanjaan apa lagi? Tiap hari paket dateng terus, kasihan itu dompetmu udah mangap-mangap minta diisi. Hemat sedikit kenapa sih!',
    'Pedes Mampus': 'Heh! Kamu pikir cari uang segampang metik daun kelor di belakang rumah? Uang tinggal sedikit bukannya prihatin malah beli barang ga guna! Mau makan batu kamu nanti di akhir bulan?!'
  },
  'Teman Santai': {
    'Manis': 'Santai cuy, pengeluaran lu masih oke kok. Tapi jangan kebablasan ya, entar weekend depan kita ga bisa nongkrong kalau dompet lu kering.',
    'Sedang': 'Waduh bro, dompet lu udah mulai batuk-batuk tuh. Mending kurang-kurangin dulu check-out barang ga penting biar ga kere-kere amat akhir bulan.',
    'Pedes Mampus': 'Asli, lu boros banget gila! Gaya hidup elit tapi saldo sulit. Besok-besok kalau kita nongkrong, lu minum air putih keran aja ya biar hemat!'
  }
};

export const MOCK_OCR = {
  merchantName: 'Indomaret',
  items: [
    { name: 'IDM RAMOS SUPER 5KG', price: 59900 },
    { name: 'SO KLIN SOFTERGENT 800', price: 14700 },
    { name: 'MOGU MOGU LYCHEE 320', price: 7900 },
    { name: 'PLASTIK BSR', price: 3 }
  ],
  subtotal: 82503,
  discount: 6203,
  tax: 2055,
  serviceCharge: 0,
  total: 78355
};

// Helper: parse backend error response, returns a user-friendly message string
async function parseBackendError(response) {
  try {
    const body = await response.json();
    // Backend now returns { error: true, code, message }
    if (body.code === 'QUOTA_EXCEEDED') {
      return { isQuota: true, message: body.message };
    }
    return { isQuota: false, message: body.message || 'Server error' };
  } catch {
    return { isQuota: false, message: `HTTP ${response.status}` };
  }
}

export const generateRoasting = async (limit, spent, recentTransactions, character = 'Dosen Killer', spiciness = 'Sedang') => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'roasting',
        data: { limit, spent, recentTransactions, character, spiciness }
      })
    });

    if (!response.ok) {
      const { isQuota, message } = await parseBackendError(response);
      if (isQuota) {
        // Return a quota-specific in-character message instead of crashing
        return `⚠️ Kuota AI habis sementara. Ini pesan offline dari ${character}: "${MOCK_ROASTS[character]?.[spiciness] || MOCK_ROASTS['Dosen Killer'][spiciness]}"`;
      }
      throw new Error(message);
    }

    const resData = await response.json();
    return resData.reply;
  } catch (error) {
    console.error('Error generating roasting via backend:', error);
    const charRoasts = MOCK_ROASTS[character] || MOCK_ROASTS['Dosen Killer'];
    return charRoasts[spiciness] || charRoasts['Sedang'];
  }
};

const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Gagal mengompresi gambar pada kanvas'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const parseReceiptOCR = async (imageFile) => {
  let processedFile = imageFile;
  try {
    // Hanya kompres jika browser mendukung canvas dan file adalah image
    if (typeof window !== 'undefined' && imageFile.type.startsWith('image/')) {
      processedFile = await compressImage(imageFile);
    }
  } catch (compressErr) {
    console.warn('Gagal mengompresi gambar secara client-side, menggunakan file asli:', compressErr);
  }

  const fileToGenerativePart = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          inlineData: {
            data: reader.result.split(',')[1],
            mimeType: 'image/jpeg'
          },
        });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const imagePart = await fileToGenerativePart(processedFile);

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ocr', data: { imagePart } })
  });

  if (!response.ok) {
    const { isQuota, message } = await parseBackendError(response);
    throw new Error(message || `HTTP ${response.status}`);
  }

  return await response.json();
};

export const chatWithAI = async (chatHistory, userMessage, currentStats) => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'chat',
        data: { chatHistory, userMessage, currentStats }
      })
    });

    if (!response.ok) {
      const { isQuota, message } = await parseBackendError(response);
      if (isQuota) {
        return {
          reply: '⚠️ Kuota AI sedang habis. Coba lagi beberapa menit ya! Sementara ini fitur AI offline dulu.',
          quotaExceeded: true
        };
      }
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in chatWithAI via backend:', error);

    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes('parkir')) {
      return {
        reply: "Oke bro, parkir dicatat Rp 2.000 kategori 'Transport'. Mau langsung dimasukin ke pembukuan?",
        command: { action: 'add_transaction', title: 'Bayar Parkir', amount: 2000, category: 'Transport' }
      };
    }
    if (lowerMsg.includes('makan') || lowerMsg.includes('warteg')) {
      return {
        reply: "Siap, makan siang dicatat Rp 25.000 kategori 'Makan'. Masukin sekarang?",
        command: { action: 'add_transaction', title: 'Makan Siang', amount: 25000, category: 'Makan' }
      };
    }
    if (lowerMsg.includes('roasting') || lowerMsg.includes('evaluasi') || lowerMsg.includes('parah')) {
      const charRoasts = MOCK_ROASTS[currentStats?.character] || MOCK_ROASTS['Dosen Killer'];
      return {
        reply: `[${currentStats?.character} - Mode ${currentStats?.spiciness}]: ${charRoasts[currentStats?.spiciness]}`
      };
    }
    return {
      reply: "Halo! Saya adalah AI StrukIn. Kamu bisa lapor pengeluaran (misal: 'bayar parkir 2 ribu') atau minta roasting pola belanjamu."
    };
  }
};
