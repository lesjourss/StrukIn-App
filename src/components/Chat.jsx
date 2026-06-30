import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { chatWithAI } from '../lib/gemini';
import { Send, Sparkles, MessageSquare, Plus, Check, X, ShieldAlert, Bot } from 'lucide-react';

export default function Chat({ user, profile, isDemo, transactions, onTransactionAdded }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Halo! Saya adalah StrukIn AI dengan persona ${profile.ai_character} (Level Roasting: ${profile.ai_spiciness}).\n\nKamu bisa melaporkan pengeluaran langsung (misal: "bayar parkir 2rb") atau meminta evaluasi keuanganmu. Ada yang bisa saya bantu?`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const totalSpent = transactions.reduce((acc, t) => acc + Number(t.amount), 0);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    if (!textToSend) setInputText('');

    const newUserMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      text
    };

    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const historyForAI = messages.slice(-10); // Keep last 10 messages for context
      const stats = {
        limit: profile.monthly_limit,
        spent: totalSpent,
        character: profile.ai_character,
        spiciness: profile.ai_spiciness
      };

      const response = await chatWithAI(historyForAI, text, stats);
      
      const newAiMessage = {
        id: `ai-msg-${Date.now()}`,
        sender: 'ai',
        text: response.reply,
        command: response.command // holds { action, title, amount, category }
      };

      setMessages(prev => [...prev, newAiMessage]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: `err-msg-${Date.now()}`,
        sender: 'ai',
        text: "Maaf bro, ada kendala koneksi dengan server AI. Bisa coba kirim lagi?"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransaction = async (msgId, command) => {
    const newTx = {
      user_id: user.id,
      title: command.title,
      amount: command.amount,
      category: command.category,
      transaction_date: new Date().toISOString().split('T')[0],
      source_type: 'ai_chat',
      notes: 'Dicatat via Asisten AI Chat'
    };

    if (isDemo) {
      const mockTx = {
        ...newTx,
        id: `local-tx-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      onTransactionAdded(mockTx);
      updateMessageCommandStatus(msgId, 'saved');
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
      updateMessageCommandStatus(msgId, 'saved');
    } catch (err) {
      console.error('Error inserting transaction from chat:', err.message);
      // Fallback
      const mockTx = {
        ...newTx,
        id: `local-tx-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      onTransactionAdded(mockTx);
      updateMessageCommandStatus(msgId, 'saved');
    }
  };

  const updateMessageCommandStatus = (msgId, status) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return {
          ...m,
          command: { ...m.command, status }
        };
      }
      return m;
    }));
  };

  const chips = [
    "Pengeluaranku bulan ini parah nggak?",
    "Roasting deh pola belanjaku",
    "Lapor bayar parkir 2 ribu",
    "Lapor makan siang 25 ribu",
    "Kasih tips hemat dong"
  ];

  return (
    <div style={styles.container} className="animated-fade-in">
      <div className="card" style={styles.chatCard}>
        {/* Chat Header */}
        <div style={styles.chatHeader}>
          <div style={styles.headerTitleRow}>
            <div style={styles.aiBadgeIcon}>
              <Sparkles size={16} color="var(--color-primary-dark)" />
            </div>
            <div>
              <h3 style={styles.aiName}>Asisten AI StrukIn</h3>
              <p style={styles.aiStatus}>
                Aktif • {profile.ai_character} ({profile.ai_spiciness})
              </p>
            </div>
          </div>
        </div>

        {/* Message Log */}
        <div style={styles.messageLog}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                ...styles.messageWrapper,
                justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {m.sender === 'ai' && (
                <div style={styles.aiAvatar}><Bot size={16} color="var(--color-primary-dark)" /></div>
              )}
              <div style={styles.msgCol}>
                <div
                  style={{
                    ...styles.messageBubble,
                    backgroundColor: m.sender === 'user' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                    color: m.sender === 'user' ? 'var(--text-white)' : 'var(--text-main)',
                    borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
                  }}
                >
                  <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
                </div>

                {/* Inline Confirmation Card for adding transaction */}
                {m.command && m.command.action === 'add_transaction' && (
                  <div style={styles.commandCard}>
                    <div style={styles.commandHeader}>
                      <ShieldAlert size={16} color="var(--color-accent)" />
                      <span>AI mendeteksi pengeluaran baru</span>
                    </div>
                    <div style={styles.commandDetails}>
                      <strong>{m.command.title}</strong>
                      <span>Rp {Number(m.command.amount).toLocaleString('id-ID')} ({m.command.category})</span>
                    </div>

                    {m.command.status === 'saved' ? (
                      <div style={styles.savedStatus}>
                        <Check size={14} /> Berhasil Dicatat!
                      </div>
                    ) : m.command.status === 'cancelled' ? (
                      <div style={styles.cancelledStatus}>
                        Dicatatkan dibatalkan.
                      </div>
                    ) : (
                      <div style={styles.commandActions}>
                        <button
                          onClick={() => updateMessageCommandStatus(m.id, 'cancelled')}
                          style={styles.cancelBtn}
                        >
                          <X size={14} /> Batal
                        </button>
                        <button
                          onClick={() => handleConfirmTransaction(m.id, m.command)}
                          style={styles.confirmBtn}
                        >
                          <Plus size={14} /> Ya, Catat!
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.messageWrapper}>
              <div style={styles.aiAvatar}><Bot size={16} color="var(--color-primary-dark)" /></div>
              <div style={styles.typingIndicator}>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating suggestion chips */}
        <div style={styles.chipsContainer}>
          {chips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              style={styles.chip}
              disabled={loading}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          style={styles.inputForm}
        >
          <input
            type="text"
            placeholder="Ketik pesan Anda atau laporkan pengeluaran..."
            style={styles.chatInput}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" style={styles.sendBtn} disabled={loading || !inputText.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

// Add typing indicator styling dynamically
if (typeof document !== 'undefined') {
  const css = `
    .dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--text-muted);
      margin-right: 4px;
      animation: wave 1.2s infinite ease-in-out;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes wave {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }
  `;
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}

const styles = {
  container: {
    padding: '12px 0',
  },
  chatCard: {
    maxWidth: '720px',
    margin: '10px auto',
    height: '75vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '0px',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-secondary)',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  aiBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiName: {
    fontSize: '15px',
    fontWeight: '700',
  },
  aiStatus: {
    fontSize: '12px',
    color: 'var(--color-success)',
    fontWeight: '600',
  },
  messageLog: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: '#f8fafc',
  },
  messageWrapper: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    maxWidth: '85%',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: 'var(--color-primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  msgCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  messageBubble: {
    padding: '12px 18px',
    fontSize: '14px',
    lineHeight: '1.5',
    boxShadow: 'var(--shadow-sm)',
  },
  commandCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '12px 16px',
    marginTop: '4px',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '260px',
  },
  commandHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
  },
  commandDetails: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '13px',
  },
  commandActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  confirmBtn: {
    flex: 1.2,
    padding: '6px',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--text-white)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  cancelBtn: {
    flex: 1,
    padding: '6px',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  savedStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--color-success)',
  },
  cancelledStatus: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-muted)',
  },
  typingIndicator: {
    backgroundColor: 'var(--bg-tertiary)',
    padding: '12px 18px',
    borderRadius: '18px 18px 18px 4px',
    display: 'flex',
    alignItems: 'center',
  },
  chipsContainer: {
    display: 'flex',
    gap: '8px',
    padding: '8px 16px',
    overflowX: 'auto',
    backgroundColor: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border-color)',
    whiteSpace: 'nowrap',
  },
  chip: {
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  inputForm: {
    display: 'flex',
    padding: '16px',
    backgroundColor: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border-color)',
    gap: '10px',
  },
  chatInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-main)',
  },
  sendBtn: {
    padding: '12px',
    borderRadius: '12px',
  }
};
