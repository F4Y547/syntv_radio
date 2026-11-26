import { ImageResponse } from "next/og";

export const alt = "SYNTV RADIO — Free World Radio";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #071019 0%, #0B1622 45%, #08111A 100%)",
          color: "#F4FAFF",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 72% 35%, rgba(56,201,232,0.28), transparent 28%), radial-gradient(circle at 25% 80%, rgba(251,191,36,0.16), transparent 24%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 72,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(56,201,232,0.14)",
              border: "1px solid rgba(56,201,232,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38C9E8",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 1 }}>SYNTV RADIO</div>
            <div style={{ fontSize: 16, color: "#9FB0C3", letterSpacing: 2 }}>FREE WORLD RADIO</div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 72,
            top: 230,
            display: "flex",
            flexDirection: "column",
            maxWidth: 700,
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            Listen to the world,
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: -2,
              color: "#5FD8EA",
            }}
          >
            one station at a time.
          </div>
          <div style={{ marginTop: 28, fontSize: 28, color: "#B7C6D6", lineHeight: 1.4 }}>
            Discover free live radio stations across countries, genres, and languages.
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 72,
            bottom: 64,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 22px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "#D7E6F3",
            fontSize: 24,
          }}
        >
          syntv.online
        </div>
      </div>
    ),
    size,
  );
}
