import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini GenAI
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// A helper to check if Gemini key is configured
const isGeminiConfigured = () => {
  return apiKey && apiKey !== 'your-gemini-api-key' && apiKey.trim() !== '';
};

// Mock responses for smooth demonstration without API keys
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

const MOCK_OCR = {
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

export const generateRoasting = async (limit, spent, recentTransactions, character = 'Dosen Killer', spiciness = 'Sedang') => {
  if (!isGeminiConfigured()) {
    // Return mock roasting based on configuration
    const charRoasts = MOCK_ROASTS[character] || MOCK_ROASTS['Dosen Killer'];
    return charRoasts[spiciness] || charRoasts['Sedang'];
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const transactionsSummary = recentTransactions && recentTransactions.length > 0 
      ? recentTransactions.map(t => `- ${t.title}: Rp ${Number(t.amount).toLocaleString('id-ID')} (${t.category})`).join('\n')
      : 'Belum ada transaksi.';

    const prompt = `
Kamu adalah asisten keuangan bernama "StrukIn" dengan persona: "${character}".
Gaya bahasa kamu harus disesuaikan dengan tingkat kepedasan roasting: "${spiciness}".
- Manis: Berikan saran yang ramah, sopan, memotivasi, dan mendidik dengan gaya bahasa persona tersebut.
- Sedang: Gunakan sindiran halus, sarkasme ringan, dan nasihat lucu tapi masuk akal.
- Pedes Mampus: Lakukan roasting yang sangat tajam, sinis, sarkastik tanpa ampun, memarahi pemborosan pengguna secara blak-blakan namun tetap menghibur (tidak SARA atau kasar berlebihan).

Gunakan bahasa Indonesia yang santai, gaul, atau sesuai persona (misal Emak Bawel menggunakan bahasa khas ibu-ibu, Dosen menggunakan istilah akademis seperti "revisi", "sks", "silabus").

Data Pengguna saat ini:
- Limit Bulanan: Rp ${Number(limit).toLocaleString('id-ID')}
- Total Terpakai: Rp ${Number(spent).toLocaleString('id-ID')}
- Sisa Saldo: Rp ${Number(limit - spent).toLocaleString('id-ID')}
- Survival Score (Kesehatan Keuangan): ${Math.max(0, Math.round(100 - (spent / limit * 100)))} HP

Transaksi Terakhir:
${transactionsSummary}

Berikan respon singkat maksimal 3 kalimat saja. Langsung berikan responnya tanpa kata pengantar atau tanda kutip tambahan.
`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating roasting:', error);
    const charRoasts = MOCK_ROASTS[character] || MOCK_ROASTS['Dosen Killer'];
    return charRoasts[spiciness] || charRoasts['Sedang'];
  }
};

export const parseReceiptOCR = async (imageFile) => {
  if (!isGeminiConfigured()) {
    // Artificial delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    return MOCK_OCR;
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Convert file to generative part
    const fileToGenerativePart = async (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            inlineData: {
              data: reader.result.split(',')[1],
              mimeType: file.type
            },
          });
        };
        reader.readAsDataURL(file);
      });
    };

    const imagePart = await fileToGenerativePart(imageFile);

    const prompt = `
Analisis gambar struk belanja ini dan ekstrak informasinya ke dalam format JSON yang valid.
Ekstrak data-data berikut:
- merchantName: Nama toko/supermarket (misal: Indomaret, Alfamart)
- items: Daftar item belanja yang dibeli. Setiap item memiliki:
  - name: Nama produk (tulis dalam huruf kapital jika di struk demikian)
  - price: Harga akhir produk setelah diskon per baris (nominal angka saja)
- subtotal: Subtotal semua item sebelum pajak/diskon tambahan
- discount: Total diskon (jika ada, masukkan angka positif)
- tax: Pajak PPN (jika ada, masukkan angka positif)
- serviceCharge: Biaya layanan (jika ada, masukkan angka positif)
- total: Total nominal yang harus dibayar pada struk (nominal angka saja)

Kembalikan HANYA format JSON valid berikut tanpa markdown wrapper (\`\`\`json) atau teks penjelasan lainnya:
{
  "merchantName": "Nama Toko",
  "items": [
    { "name": "NAMA PRODUK", "price": 10000 }
  ],
  "subtotal": 10000,
  "discount": 0,
  "tax": 0,
  "serviceCharge": 0,
  "total": 10000
}
`;

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text().trim();
    
    // Clean potential markdown output
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error parsing receipt OCR:', error);
    return MOCK_OCR; // Fallback to mock data on error
  }
};

export const chatWithAI = async (chatHistory, userMessage, currentStats) => {
  if (!isGeminiConfigured()) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
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
      const charRoasts = MOCK_ROASTS[currentStats.character] || MOCK_ROASTS['Dosen Killer'];
      return {
        reply: `[${currentStats.character} - Mode ${currentStats.spiciness}]: ${charRoasts[currentStats.spiciness]}`
      };
    }
    return {
      reply: "Halo! Saya adalah AI StrukIn. Kamu bisa lapor pengeluaran (misal: 'bayar parkir 2 ribu') atau minta roasting pola belanjamu."
    };
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Kamu adalah "StrukIn AI", asisten keuangan pribadi yang cerdas dan asyik.
Persona saat ini: "${currentStats.character}" dengan tingkat kepedasan "${currentStats.spiciness}".

Kamu bertugas mendengarkan percakapan pengguna.
Pengguna bisa:
1. Melaporkan pengeluaran secara alami (contoh: "tadi beli kopi starbucks 55rb", "bayar kosan 1.5jt", "beli obat pusing 15.000").
2. Meminta evaluasi atau nasihat finansial.

Data keuangan pengguna saat ini:
- Limit Bulanan: Rp ${Number(currentStats.limit).toLocaleString('id-ID')}
- Terpakai: Rp ${Number(currentStats.spent).toLocaleString('id-ID')}
- Sisa Saldo: Rp ${Number(currentStats.limit - currentStats.spent).toLocaleString('id-ID')}

Jika pengguna berniat mencatat transaksi baru, kamu harus menyarankan pencatatan otomatis.
Kembalikan respon dalam format JSON berikut:
{
  "reply": "Kalimat balasan percakapan dari kamu sesuai persona dan level pedas",
  "command": {
    "action": "add_transaction",
    "title": "Nama Transaksi",
    "amount": 25000,
    "category": "Makan" // Harus salah satu dari: 'Makan', 'Transport', 'Lifestyle', 'Kesehatan', 'Hiburan', 'Lainnya'
  } // (sertakan objek command hanya jika pengguna melaporkan pengeluaran baru)
}

Kembalikan HANYA format JSON valid tanpa markdown wrapper (\`\`\`json).
`;

    // Map history to Gemini format
    const contents = [
      { role: 'user', parts: [{ text: prompt }] },
      ...chatHistory.map(c => ({
        role: c.sender === 'user' ? 'user' : 'model',
        parts: [{ text: c.text }]
      })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const result = await model.generateContent({ contents });
    const text = result.response.text().trim();
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error in chatWithAI:', error);
    return { reply: "Maaf terjadi kesalahan koneksi dengan AI. Coba lagi nanti." };
  }
};
