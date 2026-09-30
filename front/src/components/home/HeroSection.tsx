import { MapPin } from 'lucide-react';
import Button from '../common/Button';
import { heroCounts } from './landing-highlights';
import { GYM_LOCATION, LANDING_ANCHORS } from './landing.data';
import type { Class } from '../../types/class';
import type { LandingErrors } from '../../types/landing';
import type { Trainer } from '../../types/trainer';
import Badge from '../common/badge/Badge';
import { GYM_SCHEDULE } from '../../utils/gym-hours';
import { useIsGymOpen } from '../../hooks/useIsGymOpen';

interface HeroSectionProps {
  classes: Class[];
  trainers: Trainer[];
  errors: LandingErrors;
  isLoading: boolean;
}

const HeroSection = ({
  classes,
  trainers,
  errors,
  isLoading,
}: HeroSectionProps) => {
  const counts = heroCounts(classes, trainers, errors);
  const isOpen = useIsGymOpen();

  // While the data is still loading, classes/trainers are empty arrays and
  // errors are all null, which heroCounts cannot tell apart from "the gym
  // really has zero". Facts are omitted (not shown as zero) until loading
  // finishes. A count is also omitted rather than shown as zero when its
  // request failed, so an outage never advertises "0 disciplinas". See
  // landing-highlights.ts.
  // The opening hours are not in this list: they get their own badge with
  // the open/closed light, rendered first in the list below.
  const facts = [
    !isLoading && counts.disciplines !== null
      ? `${counts.disciplines} disciplinas`
      : null,
    !isLoading && counts.trainers !== null
      ? `${counts.trainers} profesores`
      : null,
  ].filter((fact): fact is string => fact !== null);

  // CSS media queries cannot stop autoPlay/loop, so the reduced-motion guard
  // for the hero video needs a JS check. Recomputed on every render is fine:
  // this is a cheap read and the component is not expected to react to the
  // preference changing mid-session.
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <section
      id={LANDING_ANCHORS.hero}
      aria-labelledby="hero-heading"
      // Split screen on desktop: fills the first screen below the sticky
      // navbar (h-20 = 5rem), capped so very tall monitors don't stretch it.
      className="grid grid-cols-1 border-b border-border bg-background lg:min-h-[min(calc(100svh-5rem),56rem)] lg:grid-cols-2"
    >
      {/* ── Left half: copy and actions ── */}
      {/* relative z-10: the slanted video reaches into this column's right
          padding at the bottom, so the copy must stay painted above it. */}
      <div className="relative z-10 flex flex-col justify-center">
        {/*
          The block is at most half of Container's max width (180 = 45rem,
          half of max-w-360) and sits against the right edge of its column,
          so on wide screens its left edge lines up exactly with the logo in
          the navbar. Below that width it simply fills the column.
        */}
        <div className="w-full px-4 pt-12 pb-10 sm:px-6 lg:ml-auto lg:max-w-180 lg:py-16 lg:pr-12 lg:pl-8 xl:pr-16">
          <a
            href={`#${LANDING_ANCHORS.location}`}
            className="inline-flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Badge variant="neutral2" icon={MapPin}>
              {GYM_LOCATION.street}, {GYM_LOCATION.city}
            </Badge>
          </a>
          {/*
            Font size scales with the viewport so "EMPIEZA ACÁ" always fits
            on one line inside half the screen. leading-[1.05] leaves room
            for the accents on Ó and Á so they don't hit the line above.
          */}
          <h1
            id="hero-heading"
            className="mt-6 font-display text-[clamp(2.5rem,11vw,4.5rem)] font-extrabold leading-[1.05] tracking-tight text-text lg:text-[clamp(3.5rem,5.6vw,5.25rem)]"
          >
            <span className="block">TU MEJOR</span>
            <span className="block text-primary">VERSIÓN</span>
            <span className="block">EMPIEZA ACÁ</span>
          </h1>

          <p className="mt-6 max-w-md font-body text-base leading-relaxed text-text-muted sm:text-lg">
            Equipamiento de primera línea, clases guiadas todos los días y
            profesores que te acompañan desde el primer ejercicio.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={`#${LANDING_ANCHORS.freePass}`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-body font-semibold text-background shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Reclamar pase gratis de 1 día
            </a>
            <Button href="/membership" variant="secondary">
              Ver planes y precios
            </Button>
          </div>

          {/* The hours badge is always present, so the list always renders. */}
          <ul className="mt-9 flex flex-wrap gap-3">
            <li>
              <Badge variant="neutral2">
                {/* Status light. Decorative: the word "Abierto"/"Cerrado"
                    next to it carries the meaning, so color-blind visitors
                    (red and green look alike to many of them) still get it. */}
                <span aria-hidden="true" className="relative flex size-2 shrink-0">
                  {isOpen && (
                    // Soft "live" pulse, skipped for reduced-motion users.
                    <span className="absolute inset-0 rounded-full bg-primary opacity-75 motion-safe:animate-ping" />
                  )}
                  <span
                    className={`relative size-2 rounded-full ${
                      isOpen
                        ? 'bg-primary shadow-[0_0_8px_var(--color-primary)]'
                        : 'bg-red-500 shadow-[0_0_8px_var(--color-red-500)]'
                    }`}
                  />
                </span>
                {isOpen ? 'Abierto' : 'Cerrado'} · {GYM_SCHEDULE.label}
              </Badge>
            </li>

            {facts.map((fact) => (
              <li key={fact}>
                <Badge variant="neutral2">{fact}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right half: media ── */}
      <div className="relative px-4 pb-10 sm:px-6 lg:p-0">
        {/*
          Mobile: a rounded card below the copy.
          Desktop: absolutely fills the right column, edge to edge, so its
          height always matches the text column without needing a fixed
          aspect ratio.

          The slant: the box reaches 3rem into the left column (-left-12)
          and clip-path cuts its left edge from 6rem in at the top to 0 at
          the bottom. The diagonal crosses the exact middle of the screen at
          mid-height: 3rem right of center at the top, 3rem left at the
          bottom (the text column's lg:pr-12, so it never runs under the
          copy). For a steeper cut, raise both numbers together, e.g.
          -left-16 with 8rem, and raise the text column's right padding to
          lg:pr-16 to match.
        */}
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-border bg-surface sm:aspect-video lg:absolute lg:inset-y-0 lg:right-0 lg:-left-12 lg:aspect-auto lg:rounded-none lg:border-0 lg:[clip-path:polygon(6rem_0,100%_0,100%_100%,0_100%)]">
          <video
            src="/videos/hero-video3.mp4"
            poster="/images/hero-imagen.avif"
            autoPlay={!prefersReducedMotion}
            muted
            loop={!prefersReducedMotion}
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;