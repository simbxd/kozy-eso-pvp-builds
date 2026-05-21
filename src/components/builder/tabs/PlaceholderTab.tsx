import { T, F } from "../atoms";

export default function PlaceholderTab({ what }: { what: string }) {
  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 12,
      color: T.inkMute,
    }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <polygon points="28,4 52,28 28,52 4,28" fill="none" stroke={T.inkDim} strokeWidth="1" />
        <polygon points="28,16 40,28 28,40 16,28" fill="none" stroke={T.accent} strokeWidth="1" />
      </svg>
      <div style={{ fontFamily: F.cinzel, fontStyle: "italic", fontSize: 22, color: T.inkDim }}>{what}</div>
      <div style={{
        fontFamily: F.mono, fontSize: 10, letterSpacing: "0.32em",
        color: T.inkFaint, textTransform: "uppercase",
      }}>coming in a later milestone</div>
    </div>
  );
}
