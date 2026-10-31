'use client';

import { useState, type PointerEvent } from 'react';
import { Check, GripVertical, Sparkles } from 'lucide-react';

type Step = {
  title: string;
  description: string;
  aside: string;
  artifact: string;
};

type Copy = {
  instruction: string;
  sliderLabel: string;
  progressLabel: string;
  previewLabel: string;
  previewTitle: string;
  launchTitle: string;
  previewButton: string;
  live: string;
};

export function ProcessTimeline({ steps, copy }: { steps: Step[]; copy: Copy }) {
  const [progress, setProgress] = useState(0);
  const [dragOrigin, setDragOrigin] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const activeStep = Math.round(progress / 100);
  const active = steps[activeStep];

  const progressFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (event.clientX - left) / width)) * 300);
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;

    const marker = (event.target as Element).closest('[data-step-marker]');
    const markerIndex = marker ? Number(marker.getAttribute('data-step-marker')) : null;
    setDragOrigin(markerIndex);
    setProgress(markerIndex === null ? progressFromPointer(event) : markerIndex * 100);
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      setProgress(progressFromPointer(event));
    }
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
    setDragOrigin(null);
  };

  return (
    <div className="mt-16 border-t border-zinc-800 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Sparkles className="h-4 w-4 text-brand-light" aria-hidden="true" />
          {copy.instruction}
        </p>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
          {String(activeStep + 1).padStart(2, '0')} /{' '}
          {String(steps.length).padStart(2, '0')}
        </span>
      </div>

      <div
        className={`relative mx-5 mt-10 h-12 touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={() => {
          setIsDragging(false);
          setDragOrigin(null);
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-zinc-700" />
        <div
          className={`pointer-events-none absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-brand-light shadow-[0_0_18px_rgba(162,155,254,0.65)] ${isDragging ? '' : 'motion-safe:transition-[width] motion-safe:duration-150'}`}
          style={{ width: `${progress / 3}%` }}
        />
        {steps.map((step, index) => (
          <span
            key={step.title}
            aria-hidden="true"
            data-step-marker={index}
            className={`absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors ${dragOrigin === index ? 'opacity-0' : ''} ${index <= activeStep ? 'border-brand-light bg-brand/20 text-brand-light' : 'border-zinc-600 bg-zinc-950 text-zinc-500'}`}
            style={{ left: `${index * (100 / (steps.length - 1))}%` }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
        ))}
        <input
          type="range"
          min="0"
          max="300"
          step="1"
          value={progress}
          onChange={(event) => setProgress(Number(event.target.value))}
          aria-label={copy.sliderLabel}
          aria-valuetext={`${active.title}, ${copy.progressLabel} ${activeStep + 1} / ${steps.length}`}
          className="peer sr-only"
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-zinc-950 bg-brand text-white shadow-[0_0_0_1px_rgba(162,155,254,0.75),0_8px_30px_rgba(108,92,231,0.4)] peer-focus-visible:ring-2 peer-focus-visible:ring-brand-light peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-zinc-950 ${isDragging ? '' : 'motion-safe:transition-[left] motion-safe:duration-150'}`}
          style={{ left: `${progress / 3}%` }}
        >
          <GripVertical className="h-5 w-5" />
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-4 gap-2 sm:gap-6">
        {steps.map((step, index) => (
          <li key={step.title}>
            <button
              type="button"
              onClick={() => setProgress(index * 100)}
              aria-current={activeStep === index ? 'step' : undefined}
              className={`w-full rounded-xl px-1 py-2 text-left transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-light sm:px-2 ${activeStep === index ? 'text-white' : 'text-zinc-500'}`}
            >
              <span className="block text-[10px] font-semibold tracking-widest text-brand-light sm:text-xs">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="mt-2 block text-sm font-semibold leading-tight sm:text-lg">
                {step.title}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid min-h-[25rem] overflow-hidden rounded-3xl border border-zinc-800 bg-[#111116] lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
          <div key={activeStep} className="process-reveal" aria-live="polite">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-light">
              {String(activeStep + 1).padStart(2, '0')} /{' '}
              {String(steps.length).padStart(2, '0')}
            </span>
            <h3 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {active.title}
              <span className="text-brand-light">.</span>
            </h3>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-zinc-300 sm:text-lg">
              {active.description}
            </p>
            <p className="mt-7 max-w-sm text-sm italic text-zinc-500">{active.aside}</p>
          </div>
          <div className="mt-10 flex flex-wrap gap-2" aria-label={copy.progressLabel}>
            {steps.map((step, index) => (
              <span
                key={step.title}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${index <= activeStep ? 'border-brand/40 bg-brand/15 text-zinc-100' : 'border-zinc-800 text-zinc-600'}`}
              >
                {index <= activeStep ? (
                  <Check className="h-3 w-3 text-brand-light" aria-hidden="true" />
                ) : null}
                {step.artifact}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[22rem] items-center justify-center overflow-hidden border-t border-zinc-800 bg-[radial-gradient(circle_at_70%_35%,rgba(108,92,231,0.19),transparent_55%)] p-5 sm:p-9 lg:border-l lg:border-t-0">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/40">
            <div className="flex h-10 items-center gap-2 border-b border-zinc-800 bg-zinc-900/90 px-4">
              <div className="h-2 w-2 rounded-full bg-zinc-600" />
              <div className="h-2 w-2 rounded-full bg-zinc-600" />
              <div className="h-2 w-2 rounded-full bg-zinc-600" />
              <span className="mx-auto pr-10 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                {copy.previewLabel}
              </span>
            </div>
            <div
              className={`relative min-h-[17rem] overflow-hidden p-6 transition-colors duration-500 sm:p-8 ${activeStep >= 2 ? 'bg-[#131129]' : activeStep === 1 ? 'bg-[#1c1c23]' : 'bg-[#16161b]'}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`h-4 w-24 rounded-full transition-colors duration-500 ${activeStep >= 2 ? 'bg-brand-light' : 'border border-dashed border-zinc-600'}`}
                />
                <div className="flex gap-2">
                  <div className="h-2 w-8 rounded-full bg-zinc-700" />
                  <div className="h-2 w-8 rounded-full bg-zinc-700" />
                </div>
              </div>
              <div className="mt-10 grid grid-cols-[1.25fr_0.75fr] gap-4">
                <div>
                  {activeStep === 0 ? (
                    <div className="process-reveal space-y-3" aria-hidden="true">
                      <div className="h-5 w-4/5 rounded border border-dashed border-zinc-600" />
                      <div className="h-5 w-3/5 rounded border border-dashed border-zinc-600" />
                      <div className="mt-5 h-2 w-4/5 rounded bg-zinc-800" />
                      <div className="h-2 w-2/3 rounded bg-zinc-800" />
                    </div>
                  ) : activeStep === 1 ? (
                    <div className="process-reveal" aria-hidden="true">
                      <div className="h-7 w-5/6 rounded border border-dashed border-zinc-500 bg-zinc-700/10" />
                      <div className="mt-2 h-7 w-2/3 rounded border border-dashed border-zinc-500 bg-zinc-700/10" />
                      <div className="mt-6 h-2 w-5/6 rounded-full bg-zinc-600/60" />
                      <div className="mt-2 h-2 w-3/4 rounded-full bg-zinc-600/60" />
                      <div className="mt-2 h-2 w-1/2 rounded-full bg-zinc-600/60" />
                      <div className="mt-6 h-8 w-24 rounded-full border border-dashed border-zinc-500" />
                    </div>
                  ) : (
                    <div key={activeStep} className="process-reveal">
                      <p className="max-w-[15rem] text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                        {activeStep === 3 ? copy.launchTitle : copy.previewTitle}
                      </p>
                      <div className="mt-5 h-2 w-4/5 rounded-full bg-zinc-700/70" />
                      <div className="mt-2 h-2 w-2/3 rounded-full bg-zinc-700/70" />
                      <span className="mt-6 inline-flex rounded-full bg-brand px-4 py-2 text-[11px] font-semibold text-white">
                        {copy.previewButton}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  className={`relative min-h-36 rounded-xl transition-all duration-500 ${activeStep >= 2 ? 'bg-gradient-to-br from-brand via-violet-400 to-cyan-300' : 'border border-dashed border-zinc-600 bg-zinc-700/10'}`}
                >
                  {activeStep === 0 ? (
                    <span className="absolute inset-0 flex items-center justify-center text-5xl text-zinc-600">
                      ?
                    </span>
                  ) : activeStep === 1 ? (
                    <svg
                      className="absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] text-zinc-600"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="1"
                        y="1"
                        width="98"
                        height="98"
                        rx="6"
                        stroke="currentColor"
                        strokeDasharray="3 3"
                      />
                      <path
                        d="M2 2L98 98M98 2L2 98"
                        stroke="currentColor"
                        strokeDasharray="3 3"
                      />
                    </svg>
                  ) : (
                    <div className="absolute inset-4 rounded-lg border border-white/30 bg-white/15 backdrop-blur-sm" />
                  )}
                </div>
              </div>
              {activeStep === 3 ? (
                <div className="process-reveal absolute right-5 top-16 flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 shadow-lg shadow-black/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  {copy.live}
                </div>
              ) : null}
            </div>
          </div>
          {activeStep === 3 ? (
            <div
              className="process-reveal pointer-events-none absolute bottom-5 right-6 flex gap-2"
              aria-hidden="true"
            >
              <span className="h-2 w-2 rotate-45 bg-cyan-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
              <span className="h-2 w-2 -rotate-12 bg-emerald-300" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
