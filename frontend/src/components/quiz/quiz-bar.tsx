// Barra fina de progreso del quiz (reloj y avance).

export function QuizBar({
  value,
  tone,
  instant,
}: {
  value: number;
  tone: 'line' | 'accent';
  instant?: boolean;
}) {
  return (
    <div className="bg-line h-px w-full overflow-hidden">
      <div
        className={[
          'h-px w-full origin-left',
          tone === 'accent' ? 'bg-accent' : 'bg-fg-subtle',
          instant ? '' : 'ease-out-bp transition-transform duration-[var(--dur-3)]',
        ].join(' ')}
        style={{ transform: `scaleX(${Math.max(0, Math.min(1, value))})` }}
      />
    </div>
  );
}
