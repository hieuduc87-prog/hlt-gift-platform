export default function GiftNotFound() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #FDF8F0 0%, #FAF5EE 50%, #F5EDE0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", padding: "0 24px" }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 20px",
            background: "#FDF8F0",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #EDE9E3",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C9A96E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display), serif",
            fontSize: 22,
            color: "#1A1A1A",
            margin: "0 0 8px",
            fontWeight: 600,
          }}
        >
          Kh\u00f4ng t\u00ecm th\u1ea5y qu\u00e0
        </h1>
        <p style={{ color: "#9A9490", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Li\u00ean k\u1ebft qu\u00e0 t\u1eb7ng kh\u00f4ng h\u1ee3p l\u1ec7 ho\u1eb7c \u0111\u00e3 h\u1ebft h\u1ea1n.
        </p>
      </div>
    </div>
  );
}
