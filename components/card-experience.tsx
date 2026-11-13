'use client';

import Image from 'next/image';
import { ArrowUpRight, Download, Globe2, Linkedin, Mail, Phone, Share2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { CardProfile } from '@/lib/card';

type Labels = Record<'eyebrow' | 'title' | 'intro' | 'flip' | 'flipBack' | 'call' | 'email' | 'website' | 'linkedin' | 'save' | 'share' | 'copied' | 'shareError' | 'qrTitle' | 'qrDescription' | 'permanent', string>;

export function CardExperience({ profile, labels }: { profile: CardProfile; labels: Labels }) {
  const [flipped, setFlipped] = useState(false);
  const [shareStatus, setShareStatus] = useState('');

  async function share() {
    setShareStatus('');
    try {
      if (navigator.share) {
        await navigator.share({ title: profile.name, text: profile.role, url: profile.url });
        return;
      }
      await navigator.clipboard.writeText(profile.url);
      setShareStatus(labels.copied);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareStatus(labels.shareError);
    }
  }

  const contactLinks = [
    { href: `tel:${profile.phone}`, icon: Phone, label: labels.call, value: profile.phoneDisplay },
    { href: `mailto:${profile.email}`, icon: Mail, label: labels.email, value: profile.email },
    { href: profile.website, icon: Globe2, label: labels.website, value: profile.websiteDisplay, external: true },
    ...(profile.linkedin ? [{ href: profile.linkedin, icon: Linkedin, label: labels.linkedin, value: 'NomaSoft', external: true }] : []),
  ];

  return (
    <div className="relative isolate overflow-hidden bg-[#080808] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-8 -z-10 h-[30rem] w-[40rem] -translate-x-1/2 rounded-full bg-white/[0.055] blur-[110px]" />
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:pb-28">
        <div className="max-w-2xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">{labels.eyebrow}</p>
          <h1 className="text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">{labels.title}</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">{labels.intro}</p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-start lg:gap-12">
          <div>
            <button
              type="button"
              onClick={() => setFlipped((value) => !value)}
              aria-label={flipped ? labels.flipBack : labels.flip}
              aria-pressed={flipped}
              className="group block aspect-[1.66] w-full overflow-hidden rounded-[1.6rem] border border-zinc-700/70 bg-black p-7 text-left shadow-[0_28px_80px_rgba(0,0,0,0.65)] transition duration-300 hover:-translate-y-1 hover:border-zinc-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:rounded-[2rem] sm:p-10"
            >
              {flipped ? (
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <Image src="/images/NomaSoftLogo.png" alt="" width={58} height={58} className="h-12 w-12 object-contain sm:h-14 sm:w-14" />
                    <span className="text-right text-xl font-semibold uppercase tracking-tight sm:text-3xl">{profile.name}</span>
                  </div>
                  <div className="self-end text-right text-sm leading-relaxed sm:text-lg">
                    <p>{profile.role}</p>
                    <p className="mt-3 text-zinc-300">{profile.phoneDisplay}</p>
                    <p className="text-zinc-300">{profile.email}</p>
                    <p className="text-zinc-300">{profile.websiteDisplay}</p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center">
                  <Image src="/images/NomaSoft.png" alt="NomaSoft hexagonal logo" width={500} height={500} priority className="h-44 w-44 object-contain sm:h-60 sm:w-60" />
                </div>
              )}
            </button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500"><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />{flipped ? labels.flipBack : labels.flip}</p>
          </div>

          <div className="rounded-[1.6rem] border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">{profile.role}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{profile.name}</h2>
            <div className="mt-7 border-t border-zinc-800">
              {contactLinks.map(({ href, icon: Icon, label, value, external }) => (
                <a key={href} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="group flex min-h-16 items-center gap-4 border-b border-zinc-800 py-3 transition hover:text-white">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 group-hover:border-white"><Icon aria-hidden="true" className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-xs text-zinc-500">{label}</span><span className="block truncate text-sm text-zinc-100 sm:text-base">{value}</span></span>
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-white" />
                </a>
              ))}
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <a href={profile.vcardPath} download={`${profile.name}.vcf`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-4 text-center text-sm font-semibold text-black transition hover:bg-zinc-200"><Download aria-hidden="true" className="h-4 w-4" />{labels.save}</a>
              <button type="button" onClick={share} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-600 px-4 text-sm font-semibold text-white transition hover:border-white hover:bg-zinc-800"><Share2 aria-hidden="true" className="h-4 w-4" />{labels.share}</button>
            </div>
            <p role="status" aria-live="polite" className="mt-3 min-h-5 text-center text-xs text-zinc-300">{shareStatus}</p>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-zinc-800 pt-8 sm:flex-row sm:items-center">
          <div className="w-fit rounded-xl bg-white p-3"><Image src={profile.qrPath} alt="" width={112} height={112} className="h-28 w-28" /></div>
          <div><h2 className="text-xl font-semibold">{labels.qrTitle}</h2><p className="mt-1 max-w-md text-sm leading-relaxed text-zinc-400">{labels.qrDescription}</p><a href={profile.url} className="mt-3 inline-block break-all text-sm text-zinc-200 underline underline-offset-4">{labels.permanent}: {profile.url.replace(/^https:\/\//, '')}</a></div>
        </div>
      </div>
    </div>
  );
}
