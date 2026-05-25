import React, { useState, useEffect } from 'react';

interface MedumanPreloaderProps {
  /**
   * If provided, overrides the auto-detected dark mode state.
   */
  darkMode?: boolean;
  /**
   * Optional callback function triggered when the preloader completely finishes fading out.
   */
  onComplete?: () => void;
  /**
   * Duration in milliseconds before the preloader begins its exit fade-out sequence.
   * Default is 2200ms to allow a complete drawing and elegant pulse cycle.
   */
  duration?: number;
}

export default function MedumanPreloader({
  darkMode,
  onComplete,
  duration = 2200
}: MedumanPreloaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect dark mode automatically based on document class or system preferences
  useEffect(() => {
    if (darkMode !== undefined) {
      setIsDark(darkMode);
      return;
    }

    const checkDarkMode = () => {
      const parentHasDarkClass = document.documentElement.classList.contains('dark') || 
                                 document.body.classList.contains('dark');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(parentHasDarkClass || systemPrefersDark);
    };

    checkDarkMode();

    // Set up media query listener for real-time adjustments
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (darkMode === undefined) {
        checkDarkMode();
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [darkMode]);

  // Detect prefers-reduced-motion for high accessibility
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const onChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    motionQuery.addEventListener('change', onChange);
    return () => motionQuery.removeEventListener('change', onChange);
  }, []);

  // Manage preloader exit phases
  useEffect(() => {
    // 1. Minimum show time
    const startFadeTimeout = setTimeout(() => {
      setIsFadingOut(true);
    }, duration);

    // 2. Clear from DOM after fade-out transition is complete
    const removeTimeout = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, duration + 700); // 700ms matches exit transition duration in CSS

    return () => {
      clearTimeout(startFadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, [duration, onComplete]);

  // Prevent parent scrollbar usage while loading
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  // Render variables corresponding to dark and light setups
  const brandPrimary = isDark ? '#233392' : '#22306E';
  const brandSecondary = isDark ? '#233392' : '#071635';

  return (
    <div
      id="meduman-preloader-container"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-all duration-[700ms] cubic-bezier(0.16, 1, 0.3, 1) ${
        isFadingOut 
          ? 'opacity-0 scale-[1.03] pointer-events-none' 
          : 'opacity-100 scale-100'
      } ${isDark ? 'bg-[#0D0C52]' : 'bg-[#F7F7F7]'}`}
    >
      {/* Injected Premium Animations Block */}
      <style>{`
        /* 1. Backdrop Glow Orbs Parallax and Floating */
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -45px) scale(1.15); }
          66% { transform: translate(-15px, 20px) scale(0.9); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1.1); }
          50% { transform: translate(-35px, 25px) scale(0.95); }
        }
        
        /* 2. Central Logo Card Entry Scaling */
        @keyframes cardEntrance {
          0% { opacity: 0; transform: scale(0.94); filter: blur(5px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }

        /* 3. Escrow S-Loop Double-Headed Draw Animation */
        @keyframes drawSPath {
          0% { stroke-dashoffset: 200; opacity: 0; }
          40% { opacity: 1; }
          100% { stroke-dashoffset: 0; }
        }

        /* 4. Elegant Glowing Aura behind the Glass Plate */
        @keyframes portalGlow {
          0%, 100% { opacity: 0.12; transform: scale(0.96); filter: blur(24px); }
          50% { opacity: 0.22; transform: scale(1.08); filter: blur(36px); }
        }

        /* 5. Subtly pulsed Arrows for secure flow hint */
        @keyframes arrowPulse {
          0%, 100% { opacity: 0.65; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.07); }
        }

        /* 6. Subtle Pulse Loop on the Stable Logo Icons to signal heartbeat */
        @keyframes gentleLogoPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        /* Simple Loading Text Dot Blink */
        @keyframes dotBlink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }

        /* Activation classes */
        .animate-draw-s {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawSPath 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .animate-arrow-pulse {
          transform-origin: 50px 50px;
          animation: arrowPulse 1.8s ease-in-out infinite;
        }

        .animate-logo-scale {
          transform-origin: 50px 50px;
          animation: gentleLogoPulse 2s ease-in-out infinite;
        }

        .orbit-float-1 {
          animation: floatOrb1 20s ease-in-out infinite;
        }

        .orbit-float-2 {
          animation: floatOrb2 25s ease-in-out infinite;
        }

        .premium-card-enter {
          animation: cardEntrance 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .blink-dot-1 { animation: dotBlink 1.4s infinite 0.2s; }
        .blink-dot-2 { animation: dotBlink 1.4s infinite 0.4s; }
        .blink-dot-3 { animation: dotBlink 1.4s infinite 0.6s; }
      `}</style>

      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Deep Navy/Teal Ambient Glow */}
        <div
          className={`absolute top-1/4 -left-1/4 w-[120%] aspect-square rounded-full mix-blend-screen opacity-10 filter blur-[90px] orbit-float-1 ${
            isDark ? 'bg-indigo-900/40' : 'bg-[#232F72]/15'
          }`}
        />
        <div
          className={`absolute bottom-1/4 -right-1/4 w-[110%] aspect-square rounded-full mix-blend-screen opacity-10 filter blur-[110px] orbit-float-2 ${
            isDark ? 'bg-teal-900/30' : 'bg-[#081635]/15'
          }`}
        />
      </div>

      {/* Soft Glow behind the Logo Glass Plate */}
      <div 
        className={`absolute w-72 h-72 rounded-full pointer-events-none ${
          isDark ? 'bg-[#233392] opacity-35' : 'bg-[#22306E] opacity-10'
        }`}
        style={{
          animation: prefersReducedMotion ? 'none' : 'portalGlow 3.5s ease-in-out infinite',
          filter: 'blur(30px)'
        }}
      />

      {/* Central Glass Plate Container */}
      <div 
        className={`premium-card-enter flex flex-col items-center justify-center p-8 sm:p-12 rounded-[40px] border relative z-10 w-[90%] max-w-[340px] text-center ${
          isDark 
            ? 'bg-neutral-900/35 border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl' 
            : 'bg-white/45 border-white/40 shadow-[0_32px_80px_rgba(35,47,114,0.06)] backdrop-blur-xl'
        }`}
        style={{
          animation: prefersReducedMotion ? 'none' : 'cardEntrance 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Animated Inline Meduman SVG Logo */}
        <div className="w-24 h-24 mb-7 relative flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`w-full h-full transition-transform duration-500 overflow-visible ${
              prefersReducedMotion ? '' : 'animate-logo-scale'
            }`}
          >
            {/* Left Head (Stable representing trust) */}
            <circle cx="24" cy="28" r="9.5" fill={brandSecondary} />
            
            {/* Right Head (Stable representing trust) */}
            <circle cx="76" cy="28" r="9.5" fill={brandSecondary} />
            
            {/* Left Stakeholder Pillar & Arm */}
            <path
              d="M24 76V42C24 37.5 26 36 30 37.5L41.5 48.5"
              stroke={brandSecondary}
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Right Stakeholder Pillar & Arm */}
            <path
              d="M76 76V42C76 37.5 74 36 70 37.5L58.5 48.5"
              stroke={brandSecondary}
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* INTERLOCKING S-LOOP WITH DRAW PATTERNS */}
            <g className={prefersReducedMotion ? '' : 'animate-draw-s'}>
              {/* Top Segment, clockwise flow */}
              <path
                d="M41.5 48.5C41.5 41.5 46.5 36 53 36C59.5 36 63 42 59.5 47.5C58 50 54.5 51 52.5 49.5"
                stroke={brandPrimary}
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={prefersReducedMotion ? '' : 'animate-draw-s'}
              />
              
              {/* Bottom Segment, clockwise flow */}
              <path
                d="M58.5 48.5C58.5 55.5 53.5 61 47 61C40.5 61 37 55 40.5 49.5C42 47 45.5 46 47.5 47.5"
                stroke={brandPrimary}
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={prefersReducedMotion ? '' : 'animate-draw-s'}
              />
            </g>

            {/* ARROWHEADS PULSING */}
            <g className={prefersReducedMotion ? '' : 'animate-arrow-pulse'}>
              {/* Top Segment Arrowhead */}
              <path
                d="M51.5 44L52.5 49.5L58 49.5"
                stroke={brandPrimary}
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Bottom Segment Arrowhead */}
              <path
                d="M48.5 53L47.5 47.5L42 47.5"
                stroke={brandPrimary}
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        {/* Loading Prompts */}
        <div className="space-y-1.5 pointer-events-none select-none">
          <h4 
            className={`text-xs font-bold tracking-widest uppercase transition-colors duration-500 flex items-center justify-center gap-0.5 ${
              isDark ? 'text-white/90' : 'text-[#232F72]'
            }`}
          >
            <span>Securing checkout</span>
            <span className="blink-dot-1">.</span>
            <span className="blink-dot-2">.</span>
            <span className="blink-dot-3">.</span>
          </h4>
          <p 
            className={`text-[9.5px] font-sans font-medium tracking-wider transition-colors duration-500 uppercase ${
              isDark ? 'text-white/50' : 'text-gray-400'
            }`}
          >
            Meduman
          </p>
        </div>
      </div>
    </div>
  );
}
