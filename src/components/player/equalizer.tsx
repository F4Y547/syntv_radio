"use client";

export function Equalizer({ active }: { active: boolean }) {
  return (
    <div className="flex h-4 items-end gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-primary"
          style={{
            height: active ? "100%" : "35%",
            animation: active ? `eq-bar 900ms ease-in-out ${i * 120}ms infinite alternate` : "none",
            opacity: active ? 1 : 0.45,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes eq-bar {
          0% { height: 30%; }
          100% { height: 100%; }
        }
      `}</style>
    </div>
  );
}
