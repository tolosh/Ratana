export function TrendChart() {
  return <div className="relative h-44 overflow-hidden border border-border bg-card" aria-label="Oxygen saturation trend for the past 24 hours">
    <div className="absolute inset-0 clinical-grid opacity-50" />
    <div className="absolute inset-x-0 bottom-0 h-[28%] bg-rapid-soft/60" />
    <div className="absolute inset-x-0 bottom-[28%] h-[20%] bg-review-soft/60" />
    <svg className="relative size-full" viewBox="0 0 700 176" role="img" aria-label="SpO2 declined from 95 to 88 percent">
      <polyline fill="none" stroke="var(--primary)" strokeWidth="3" points="0,48 75,43 150,50 225,45 300,58 375,65 450,74 525,95 600,115 700,137" />
      <circle cx="700" cy="137" r="5" fill="var(--primary)" />
    </svg>
    <div className="absolute bottom-2 left-3 font-mono text-xs text-muted-foreground">08:00</div>
    <div className="absolute bottom-2 right-3 font-mono text-xs text-muted-foreground">08:42 AEST</div>
  </div>;
}