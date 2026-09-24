import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Join the K.E.R.N FTC Team";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#062D59",
          color: "white",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 6, color: "#E3C27A" }}>
          K.E.R.N SCHOOL · FTC
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.05 }}>
            Join the K.E.R.N
          </div>
          <div style={{ fontSize: 52, fontWeight: 500, color: "#C89B4A" }}>
            FTC Team
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#D8E3F0" }}>
          Build · Create · Promote · Grow
        </div>
      </div>
    ),
    { ...size },
  );
}
