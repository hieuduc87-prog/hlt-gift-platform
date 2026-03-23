"use client";

import { useState, useEffect } from "react";

interface GiftPageData {
  token: string;
  recipient_viewed_at: string | null;
  recipient_response: string | null;
  order: {
    recipient_name: string;
    card_message: string | null;
    status: string;
    combo_name: string | null;
    sender_name: string | null;
  };
}

type Phase = "envelope" | "card" | "thankyou";

export default function UnwrapClient({ data }: { data: GiftPageData }) {
  // If already viewed, skip to card phase
  const initialPhase: Phase = data.recipient_viewed_at ? "card" : "envelope";
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [envelopeOpening, setEnvelopeOpening] = useState(false);
  const [cardVisible, setCardVisible] = useState(initialPhase === "card");
  const [thankMessage, setThankMessage] = useState("");
  const [thankSent, setThankSent] = useState(!!data.recipient_response);
  const [thankSending, setThankSending] = useState(false);
  const [showThankForm, setShowThankForm] = useState(false);

  // Floating particles
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; delay: number; size: number }>
  >([]);

  useEffect(() => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      size: 4 + Math.random() * 8,
    }));
    setParticles(items);
  }, []);

  async function handleEnvelopeClick() {
    if (envelopeOpening) return;
    setEnvelopeOpening(true);

    // Fire the open API (best effort, don't block animation)
    fetch(`/api/gift/${data.token}/open`, { method: "POST" }).catch(() => {});

    // Animate: envelope flap opens, then card slides up
    setTimeout(() => {
      setPhase("card");
      setTimeout(() => {
        setCardVisible(true);
      }, 100);
    }, 800);
  }

  async function handleSendThank() {
    if (!thankMessage.trim() || thankSending) return;
    setThankSending(true);

    try {
      const res = await fetch(`/api/gift/${data.token}/thank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: thankMessage.trim() }),
      });
      if (res.ok) {
        setThankSent(true);
      }
    } catch {
      // Silent fail
    } finally {
      setThankSending(false);
    }
  }

  const deliveryStatusText =
    data.order.status === "delivering"
      ? "Qu\u00e0 c\u1ee7a b\u1ea1n \u0111ang tr\u00ean \u0111\u01b0\u1eddng giao"
      : data.order.status === "delivered"
        ? "Qu\u00e0 \u0111\u00e3 \u0111\u01b0\u1ee3c giao"
        : null;

  return (
    <div className="gift-unwrap-page">
      {/* Global styles */}
      <style>{`
        .gift-unwrap-page {
          position: fixed;
          inset: 0;
          overflow: hidden;
          background: linear-gradient(135deg, #FDF8F0 0%, #FAF5EE 50%, #F5EDE0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-body), system-ui, sans-serif;
        }

        /* Floating particles */
        .particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, #C9A96E33, #C9A96E11);
          animation: floatParticle 8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.6; }
        }

        /* Envelope container */
        .envelope-container {
          cursor: pointer;
          position: relative;
          width: 280px;
          height: 200px;
          perspective: 600px;
          transition: transform 0.3s ease;
        }
        .envelope-container:hover {
          transform: scale(1.02);
        }
        .envelope-container:active {
          transform: scale(0.98);
        }

        /* Envelope body */
        .envelope-body {
          position: absolute;
          inset: 0;
          background: linear-gradient(145deg, #D4B87A, #C9A96E, #B8944D);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(201, 169, 110, 0.3), 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .envelope-body::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.05));
        }

        /* Envelope inner pattern */
        .envelope-inner {
          position: absolute;
          inset: 6px;
          border: 1px dashed rgba(255,255,255,0.25);
          border-radius: 8px;
          pointer-events: none;
        }

        /* Envelope flap (triangle) */
        .envelope-flap {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100px;
          transform-origin: top center;
          transition: transform 0.8s ease;
          z-index: 2;
        }
        .envelope-flap svg {
          width: 100%;
          height: 100%;
        }
        .envelope-flap.open {
          transform: rotateX(180deg);
        }

        /* Seal */
        .envelope-seal {
          position: absolute;
          top: 85px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, #8B2020, #6B1515);
          border-radius: 50%;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: opacity 0.4s ease;
        }
        .envelope-seal.hide {
          opacity: 0;
        }
        .seal-text {
          color: #F5D5A0;
          font-size: 16px;
          font-family: var(--font-display), serif;
          font-weight: 700;
        }

        /* Fade out entire envelope */
        .envelope-wrapper {
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .envelope-wrapper.leaving {
          opacity: 0;
          transform: scale(0.9);
        }

        /* Card */
        .gift-card {
          max-width: 380px;
          width: calc(100vw - 48px);
          background: white;
          border-radius: 24px;
          box-shadow: 0 12px 48px rgba(0,0,0,0.08), 0 4px 16px rgba(201, 169, 110, 0.15);
          padding: 40px 32px;
          text-align: center;
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .gift-card.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .card-divider {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #C9A96E, transparent);
          margin: 20px auto;
        }

        .card-message {
          font-family: var(--font-display), serif;
          font-size: 18px;
          line-height: 1.7;
          color: #1A1A1A;
          margin: 0;
          white-space: pre-wrap;
        }

        .card-sender {
          color: #C9A96E;
          font-size: 15px;
          font-weight: 500;
          margin-top: 24px;
        }

        .card-combo {
          display: inline-block;
          background: #FDF8F0;
          color: #A68B55;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 16px;
          border-radius: 20px;
          margin-top: 12px;
        }

        .card-delivery {
          color: #3A7D54;
          font-size: 13px;
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        /* Thank you section */
        .thank-section {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid #EDE9E3;
        }

        .thank-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(145deg, #C9A96E, #B8944D);
          color: white;
          font-size: 14px;
          font-weight: 600;
          padding: 12px 28px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(201, 169, 110, 0.3);
        }
        .thank-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(201, 169, 110, 0.4);
        }
        .thank-btn:active {
          transform: translateY(0);
        }
        .thank-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .thank-textarea {
          width: 100%;
          min-height: 100px;
          padding: 14px 16px;
          border: 1.5px solid #EDE9E3;
          border-radius: 12px;
          font-size: 14px;
          font-family: var(--font-body), system-ui, sans-serif;
          color: #1A1A1A;
          background: #FAFAF8;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 12px;
        }
        .thank-textarea:focus {
          border-color: #C9A96E;
        }
        .thank-textarea::placeholder {
          color: #9A9490;
        }

        .thank-form {
          animation: fadeSlideUp 0.3s ease;
        }
        .thank-sent {
          animation: fadeSlideUp 0.3s ease;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .thank-sent-message {
          color: #3A7D54;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        /* Prompt text above envelope */
        .envelope-prompt {
          text-align: center;
          margin-bottom: 24px;
          animation: fadeSlideUp 0.5s ease 0.3s both;
        }
        .envelope-prompt h1 {
          font-family: var(--font-display), serif;
          font-size: 24px;
          color: #1A1A1A;
          margin: 0 0 6px;
          font-weight: 600;
        }
        .envelope-prompt p {
          color: #9A9490;
          font-size: 14px;
          margin: 0;
        }

        /* Sparkle burst on open */
        .sparkle-burst {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
        }
        .sparkle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #C9A96E;
          border-radius: 50%;
          animation: sparkleOut 0.8s ease forwards;
        }
        @keyframes sparkleOut {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { opacity: 0; }
        }

        /* HLT branding */
        .hlt-branding {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          color: #9A9490;
          font-size: 12px;
          z-index: 1;
        }
        .hlt-branding a {
          color: #C9A96E;
          text-decoration: none;
        }
      `}</style>

      {/* Floating background particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Phase: Envelope */}
      {phase === "envelope" && (
        <div
          className={`envelope-wrapper ${envelopeOpening ? "leaving" : ""}`}
          style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <div className="envelope-prompt">
            <h1>B\u1ea1n c\u00f3 m\u1ed9t m\u00f3n qu\u00e0</h1>
            <p>Nh\u1ea5n \u0111\u1ec3 m\u1edf</p>
          </div>

          <div className="envelope-container" onClick={handleEnvelopeClick}>
            {/* Envelope flap */}
            <div className={`envelope-flap ${envelopeOpening ? "open" : ""}`}>
              <svg viewBox="0 0 280 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0 0 L140 90 L280 0 L280 10 Q280 12 278 12 L2 12 Q0 12 0 10 Z"
                  fill="url(#flapGradient)"
                />
                <defs>
                  <linearGradient id="flapGradient" x1="0" y1="0" x2="280" y2="100">
                    <stop offset="0%" stopColor="#DABB7F" />
                    <stop offset="50%" stopColor="#C9A96E" />
                    <stop offset="100%" stopColor="#B8944D" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Seal */}
            <div className={`envelope-seal ${envelopeOpening ? "hide" : ""}`}>
              <span className="seal-text">H</span>
            </div>

            {/* Envelope body */}
            <div className="envelope-body">
              <div className="envelope-inner" />
            </div>

            {/* Sparkle burst on open */}
            {envelopeOpening && (
              <div className="sparkle-burst">
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * 360;
                  const rad = (angle * Math.PI) / 180;
                  const dist = 60 + Math.random() * 40;
                  return (
                    <div
                      key={i}
                      className="sparkle"
                      style={{
                        left: "50%",
                        top: "50%",
                        animationDelay: `${i * 0.05}s`,
                        // @ts-expect-error CSS custom property for sparkle direction
                        "--tx": `${Math.cos(rad) * dist}px`,
                        "--ty": `${Math.sin(rad) * dist}px`,
                        animation: `sparkleOut 0.8s ease ${i * 0.05}s forwards`,
                        transform: `translate(${Math.cos(rad) * dist}px, ${Math.sin(rad) * dist}px)`,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase: Card reveal */}
      {(phase === "card" || phase === "thankyou") && (
        <div className={`gift-card ${cardVisible ? "visible" : ""}`}>
          {/* Greeting */}
          <p style={{ color: "#9A9490", fontSize: 13, margin: "0 0 4px" }}>
            G\u1eedi t\u1edbi
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display), serif",
              fontSize: 22,
              color: "#1A1A1A",
              margin: "0 0 0",
              fontWeight: 600,
            }}
          >
            {data.order.recipient_name}
          </h2>

          <div className="card-divider" />

          {/* Card message */}
          {data.order.card_message && (
            <p className="card-message">{data.order.card_message}</p>
          )}

          {/* Sender */}
          {data.order.sender_name && (
            <p className="card-sender">T\u1eeb: {data.order.sender_name}</p>
          )}

          {/* Combo name */}
          {data.order.combo_name && (
            <span className="card-combo">{data.order.combo_name}</span>
          )}

          {/* Delivery status */}
          {deliveryStatusText && (
            <div className="card-delivery">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
              {deliveryStatusText}
            </div>
          )}

          {/* Thank you section */}
          <div className="thank-section">
            {thankSent ? (
              <div className="thank-sent">
                <div className="thank-sent-message">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3A7D54" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  \u0110\u00e3 g\u1eedi l\u1eddi c\u1ea3m \u01a1n!
                </div>
              </div>
            ) : showThankForm ? (
              <div className="thank-form">
                <textarea
                  className="thank-textarea"
                  placeholder="Vi\u1ebft l\u1eddi c\u1ea3m \u01a1n c\u1ee7a b\u1ea1n..."
                  value={thankMessage}
                  onChange={(e) => setThankMessage(e.target.value)}
                  maxLength={500}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button
                    className="thank-btn"
                    onClick={handleSendThank}
                    disabled={!thankMessage.trim() || thankSending}
                    style={{
                      background: !thankMessage.trim()
                        ? "#D0D0D0"
                        : undefined,
                    }}
                  >
                    {thankSending ? "\u0110ang g\u1eedi..." : "G\u1eedi l\u1eddi c\u1ea3m \u01a1n"}
                  </button>
                </div>
              </div>
            ) : (
              <button className="thank-btn" onClick={() => setShowThankForm(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                G\u1eedi l\u1eddi c\u1ea3m \u01a1n
              </button>
            )}
          </div>
        </div>
      )}

      {/* Branding */}
      <div className="hlt-branding">
        <a href="https://hoalangthang.com" target="_blank" rel="noopener noreferrer">
          Hoa Lang Thang
        </a>
      </div>
    </div>
  );
}
