import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini GenAI using server-side environment variable
const apiKey = process.env.GEMINI_API_KEY || '';

// Helper: classify Gemini API errors into clean HTTP responses
function classifyGeminiError(error) {
  const status = error?.status ?? 500;
  const msg = error?.message ?? '';

  if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota')) {
    return {
      httpStatus: 429,
      code: 'QUOTA_EXCEEDED',
      message: 'Kuota Gemini API habis. Coba lagi beberapa saat lagi.',
    };
  }
  if (status === 400 || msg.includes('400')) {
    return {
      httpStatus: 400,
      code: 'BAD_REQUEST',
      message: 'Request tidak valid dikirim ke Gemini API.',
    };
  }
  if (status === 403 || msg.includes('403')) {
    return {
      httpStatus: 403,
      code: 'FORBIDDEN',
      message: 'API Key tidak valid atau tidak memiliki akses.',
    };
  }
  if (status === 503 || msg.includes('503') || msg.toLowerCase().includes('unavailable')) {
    return {
      httpStatus: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Layanan Gemini sedang tidak tersedia. Coba lagi nanti.',
    };
  }
  return {
    httpStatus: 500,
    code: 'INTERNAL_ERROR',
    message: error.message || 'Terjadi kesalahan internal pada server.',
  };
}

// Helper: send a safe error response (guards against double-send crashes)
function sendError(res, httpStatus, code, message) {
  if (res.headersSent) return;
  try {
    res.status(httpStatus).json({ error: true, code, message });
  } catch (e) {
    console.error('[sendError] Failed to send error response:', e);
  }
}

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
  }

  if (!apiKey) {
    return sendError(res, 500, 'MISSING_API_KEY', 'GEMINI_API_KEY is not configured on the server.');
  }

  // --- Validate request body ---
  const { action, data } = req.body ?? {};
  if (!action || !data) {
    return sendError(res, 400, 'INVALID_BODY', 'Request body must include "action" and "data".');
  }

  // =========================================================
  // ACTION: roasting
  // =========================================================
  if (action === 'roasting') {
    try {
      const { limit, spent, recentTransactions, character, spiciness } = data;

      if (limit === undefined || spent === undefined) {
        return sendError(res, 400, 'INVALID_DATA', 'Field "limit" dan "spent" wajib diisi.');
      }

      const transactionsSummary =
        recentTransactions && recentTransactions.length > 0
          ? recentTransactions
              .map(t => `- ${t.title}: Rp ${Number(t.amount).toLocaleString('id-ID')} (${t.category})`)
              .join('\n')
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
- Survival Score (Kesehatan Keuangan): ${Math.max(0, Math.round(100 - (spent / limit) * 100))} HP

Transaksi Terakhir:
${transactionsSummary}

Berikan respon singkat maksimal 3 kalimat saja. Langsung berikan responnya tanpa kata pengantar atau tanda kutip tambahan.
`;

      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (res.headersSent) return;
      return res.status(200).json({ reply: text });

    } catch (error) {
      console.error('[/api/gemini] roasting error:', error);
      const { httpStatus, code, message } = classifyGeminiError(error);
      return sendError(res, httpStatus, code, message);
    }
  }

  // =========================================================
  // ACTION: ocr
  // =========================================================
  if (action === 'ocr') {
    try {
      const { imagePart } = data;

      if (!imagePart?.inlineData?.data) {
        return sendError(res, 400, 'INVALID_DATA', 'Field "imagePart" dengan inlineData wajib diisi.');
      }

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

      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text().trim();
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

      if (res.headersSent) return;
      return res.status(200).json(JSON.parse(jsonStr));

    } catch (error) {
      console.error('[/api/gemini] ocr error:', error);
      // SyntaxError = JSON parse failed from AI output
      if (error instanceof SyntaxError) {
        return sendError(res, 422, 'PARSE_ERROR', 'Gagal membaca format JSON dari respons AI. Coba gambar yang lebih jelas.');
      }
      const { httpStatus, code, message } = classifyGeminiError(error);
      return sendError(res, httpStatus, code, message);
    }
  }

  // =========================================================
  // ACTION: chat
  // =========================================================
  if (action === 'chat') {
    try {
      const { chatHistory, userMessage, currentStats } = data;

      if (!userMessage || !currentStats) {
        return sendError(res, 400, 'INVALID_DATA', 'Field "userMessage" dan "currentStats" wajib diisi.');
      }

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
    "category": "Makan"
  }
}
Catatan: sertakan "command" hanya jika pengguna melaporkan pengeluaran baru. Kembalikan HANYA format JSON valid tanpa markdown wrapper.
`;

      const contents = [
        { role: 'user', parts: [{ text: prompt }] },
        ...(chatHistory ?? []).map(c => ({
          role: c.sender === 'user' ? 'user' : 'model',
          parts: [{ text: c.text }],
        })),
        { role: 'user', parts: [{ text: userMessage }] },
      ];

      const ai = new GoogleGenerativeAI(apiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent({ contents });
      const text = result.response.text().trim();
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

      if (res.headersSent) return;
      return res.status(200).json(JSON.parse(jsonStr));

    } catch (error) {
      console.error('[/api/gemini] chat error:', error);
      if (error instanceof SyntaxError) {
        return sendError(res, 422, 'PARSE_ERROR', 'Gagal membaca format JSON dari respons AI.');
      }
      const { httpStatus, code, message } = classifyGeminiError(error);
      return sendError(res, httpStatus, code, message);
    }
  }

  // Unknown action
  return sendError(res, 400, 'UNKNOWN_ACTION', `Action tidak dikenali: "${action}"`);
}
