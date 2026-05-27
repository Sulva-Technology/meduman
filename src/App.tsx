/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import MedumanPreloader from './components/MedumanPreloader';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Zap,
  Smartphone,
  Share2,
  Menu,
  X,
  Check,
  Plus,
  AlertCircle,
  Copy,
  PlusCircle,
  Sparkles,
  Info,
  ArrowUpRight,
  RefreshCw,
  Clock,
  UserCheck,
  ThumbsUp,
  Sliders,
  DollarSign,
  ChevronDown,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Send,
  Download,
  Filter,
  Globe,
  MapPin,
  User,
  ArrowLeft
} from 'lucide-react';

const MEDUMAN_LOGOS = {
  black: '/brand/meduman-logo-black.png',
  navy: '/brand/meduman-logo-classic-indigo.png',
  dark: '/brand/meduman-logo-slate-navy.png',
  royal: '/brand/meduman-logo-escrow-royal.png',
  'light-on-dark': '/brand/meduman-logo-sovereign-dark.png',
  white: '/brand/meduman-logo-sovereign-dark.png',
  'two-tone': '/brand/meduman-logo-slate-navy.png'
} as const;

type MedumanLogoVariant = keyof typeof MEDUMAN_LOGOS;

const MedumanLogo = ({
  className = "h-8 w-8",
  strokeColor,
  variant = "royal"
}: {
  className?: string;
  strokeColor?: string;
  variant?: MedumanLogoVariant;
}) => {
  return (
    <img
      src={strokeColor ? MEDUMAN_LOGOS.black : MEDUMAN_LOGOS[variant]}
      alt="Meduman logo"
      className={`${className} rounded-[50%] object-contain select-none`}
      draggable={false}
    />
  );
};

const getLogoUrl = (variant: MedumanLogoVariant) => {
  return `${window.location.origin}${MEDUMAN_LOGOS[variant]}`;
};

const downloadLogo = (variant: MedumanLogoVariant, filename: string) => {
  const link = document.createElement('a');
  link.href = MEDUMAN_LOGOS[variant];
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function App() {
  // Navigation
  const [currentPage, setCurrentPage] = useState<'home' | 'how-it-works' | 'for-buyers' | 'for-sellers' | 'pricing' | 'security' | 'waitlist' >('home');
  // | 'admin-waitlist' | 'brand-kit'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Global Interactive Simulator Modal State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simRole, setSimRole] = useState<'buyer' | 'seller'>('buyer');
  const [simStep, setSimStep] = useState<1 | 2 | 3>(1);
  const [simPrice, setSimPrice] = useState('35,000');
  const [simProduct, setSimProduct] = useState('Handwoven Kente Fabric');
  const [simOtp, setSimOtp] = useState('');
  const [simOtpError, setSimOtpError] = useState(false);
  const [simCompleted, setSimCompleted] = useState(false);

  // Reusable Waitlist Modal State
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [preselectedRole, setPreselectedRole] = useState<string>('');

  // Local Storage Backed Waitlist Database
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>(() => {
    const stored = localStorage.getItem('meduman-waitlist-entries');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }
    const defaultEntries = [
      {
        id: 'WM-3019',
        fullName: 'Iyiola Ogunjobi',
        email: 'ogunjobiiyiola906@gmail.com',
        phone: '+234 812 3456 7890',
        userType: 'Both buyer and seller',
        mainChannel: 'Instagram',
        country: 'Nigeria',
        city: 'Lagos',
        useCase: 'Secure luxury clothes purchases on Instagram and WhatsApp without shipping delays.',
        averageTransactionValue: '₦100,000 – ₦500,000',
        consent: true,
        createdAt: '2026-05-24T12:00:00.000Z'
      },
      {
        id: 'WM-3024',
        fullName: 'Chioma Adeleke',
        email: 'chioma.seller@gmail.com',
        phone: '+234 901 2345 678',
        userType: 'Seller',
        mainChannel: 'WhatsApp',
        country: 'Nigeria',
        city: 'Enugu',
        useCase: 'Selling custom bespoke fabrics; need to verify real deposit before cutting material.',
        averageTransactionValue: '₦20,000 – ₦100,000',
        consent: true,
        createdAt: '2026-05-23T15:30:00.000Z'
      },
      {
        id: 'WM-3028',
        fullName: 'Koffi Mensah',
        email: 'koffi.dev@outlook.com',
        phone: '+233 24 123 4567',
        userType: 'Freelancer',
        mainChannel: 'Telegram',
        country: 'Ghana',
        city: 'Accra',
        useCase: 'Protect design work deliverables until international clients release escrow payment.',
        averageTransactionValue: '₦100,000 – ₦500,000',
        consent: true,
        createdAt: '2026-05-25T01:15:00.000Z'
      },
      {
        id: 'WM-3031',
        fullName: 'Amara Dike',
        email: 'amara.boutique@info.ng',
        phone: '+234 809 111 2222',
        userType: 'Business',
        mainChannel: 'Instagram',
        country: 'Nigeria',
        city: 'Abuja',
        useCase: 'Escrow payment links embedded inside Instagram Bio to guarantee verified shipping orders.',
        averageTransactionValue: 'Above ₦500,000',
        consent: true,
        createdAt: '2026-05-22T09:45:00.000Z'
      },
      {
        id: 'WM-3045',
        fullName: 'Babajide Cole',
        email: 'babs.co@gmail.com',
        phone: '+234 703 444 5555',
        userType: 'Buyer',
        mainChannel: 'Facebook Marketplace',
        country: 'Nigeria',
        city: 'Lekki',
        useCase: 'Buying vintage shoe collections locally; safety is required before transferring cash.',
        averageTransactionValue: 'Below ₦20,000',
        consent: true,
        createdAt: '2026-05-24T18:22:00.000Z'
      }
    ];
    localStorage.setItem('meduman-waitlist-entries', JSON.stringify(defaultEntries));
    return defaultEntries;
  });

  // Sync entries to Local Storage
  useEffect(() => {
    localStorage.setItem('meduman-waitlist-entries', JSON.stringify(waitlistEntries));
  }, [waitlistEntries]);

  // Toast / Info Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Waitlist Page Form State
  const [waitlistForm, setWaitlistForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    userType: 'Buyer',
    mainChannel: 'WhatsApp',
    country: 'Nigeria',
    city: '',
    useCase: '',
    averageTransactionValue: 'Below ₦20,000',
    consent: false
  });
  const [waitlistValidationError, setWaitlistValidationError] = useState<string | null>(null);
  const [waitlistSuccessData, setWaitlistSuccessData] = useState<any | null>(null);

  // Waitlist Modal Short Form State (re-initializes on modal load)
  const [modalForm, setModalForm] = useState({
    fullName: '',
    email: '',
    userType: 'Buyer',
    mainChannel: 'WhatsApp',
    consent: false
  });
  const [modalValidationError, setModalValidationError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);

  // Old email field preserved for internal layout compat / secondary bindings
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Page Specific Interactive States
  // 1. How It Works interactives
  const [howTab, setHowTab] = useState<1 | 2 | 3>(1);

  // 2. Buyers Page interactives
  const [buyerSimStep, setBuyerSimStep] = useState<1 | 2 | 3>(1);
  const [buyerInputOtp, setBuyerInputOtp] = useState('');
  const [buyerOtpVerified, setBuyerOtpVerified] = useState(false);
  const [buyerOtpError, setBuyerOtpError] = useState(false);

  // 3. Sellers Page interactives
  const [sellerInputName, setSellerInputName] = useState('Vintage Denim Overshirt');
  const [sellerInputPrice, setSellerInputPrice] = useState('22,000');
  const [sellerGeneratedLink, setSellerGeneratedLink] = useState('');
  const [sellerCopied, setSellerCopied] = useState(false);
  const [sellerActiveFilter, setSellerActiveFilter] = useState<'all' | 'escrow' | 'released'>('all');

  // 4. Security Page interactives
  const [disputeStatus, setDisputeStatus] = useState<'review' | 'buyer-refunded' | 'seller-paid'>('review');
  const [securityTab, setSecurityTab] = useState<'network' | 'vaults'>('network');

  // 5. Pricing and Admin Waitlist interactives
  const [isAnnual, setIsAnnual] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminUserTypeFilter, setAdminUserTypeFilter] = useState<'All' | 'Buyer' | 'Seller' | 'Freelancer' | 'Business' | 'Both buyer and seller'>('All');
  const [adminCountryFilter, setAdminCountryFilter] = useState('All');

  // Mouse movement tracking for premium parallax depth
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for high-end luxury feel
  const springConfig = { damping: 20, stiffness: 100 };
  const cardRotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), springConfig);
  const cardRotateY = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), springConfig);
  const cardTranslateX = useSpring(useTransform(mouseX, [-300, 300], [-12, 12]), springConfig);
  const cardTranslateY = useSpring(useTransform(mouseY, [-300, 300], [-12, 12]), springConfig);

  // Background highlightCoordinates
  const highlightX = useSpring(useTransform(mouseX, [-300, 300], [-25, 25]), springConfig);
  const highlightY = useSpring(useTransform(mouseY, [-300, 300], [-25, 25]), springConfig);

  // Elevated motion values for decorative background glows & badging (avoiding conditional rendering of hooks)
  const bgGlow1X = useTransform(mouseX, [-300, 300], [15, -15]);
  const bgGlow1Y = useTransform(mouseY, [-300, 300], [15, -15]);
  const bgGlow2X = useTransform(mouseX, [-300, 300], [-20, 20]);
  const bgGlow2Y = useTransform(mouseY, [-300, 300], [-20, 20]);

  const badge1X = useSpring(useTransform(mouseX, [-300, 300], [-30, 30]), springConfig);
  const badge1Y = useSpring(useTransform(mouseY, [-300, 300], [-30, 30]), springConfig);
  const badge2X = useSpring(useTransform(mouseX, [-300, 300], [25, -25]), springConfig);
  const badge2Y = useSpring(useTransform(mouseY, [-300, 300], [25, -25]), springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    // Calculate relative mouse position from -width/2 to width/2
    const mX = event.clientX - rect.left - width / 2;
    const mY = event.clientY - rect.top - height / 2;
    mouseX.set(mX);
    mouseY.set(mY);
  };

  const handleMouseLeave = () => {
    // Return smoothly to center
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      setEmail('');
    }, 1000);
  };

  // Full robust waitlist form handler
  const handleFullWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistValidationError(null);

    // 1. Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(waitlistForm.email)) {
      setWaitlistValidationError('Please enter a valid email address.');
      return;
    }

    // 2. Duplicate check
    const duplicate = waitlistEntries.some(
      entry => entry.email.trim().toLowerCase() === waitlistForm.email.trim().toLowerCase()
    );
    if (duplicate) {
      setWaitlistValidationError('This email has already joined the waitlist.');
      return;
    }

    // 3. Consent check
    if (!waitlistForm.consent) {
      setWaitlistValidationError('Please accept the consent checkbox to continue.');
      return;
    }

    // Create entry
    const newId = `WM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry = {
      id: newId,
      fullName: waitlistForm.fullName.trim(),
      email: waitlistForm.email.trim(),
      phone: waitlistForm.phone.trim() || undefined,
      userType: waitlistForm.userType,
      mainChannel: waitlistForm.mainChannel,
      country: waitlistForm.country,
      city: waitlistForm.city.trim() || undefined,
      useCase: waitlistForm.useCase.trim() || undefined,
      averageTransactionValue: waitlistForm.averageTransactionValue || undefined,
      consent: waitlistForm.consent,
      createdAt: new Date().toISOString()
    };

    try {
      setIsWaitlistSubmitting(true);
      const { submitWaitlistEntry } = await import('./lib/supabase');
      const result = await submitWaitlistEntry(newEntry);

      // Add entry and clear form
      setWaitlistEntries([newEntry, ...waitlistEntries]);
      setWaitlistSuccessData(newEntry);
      setWaitlistForm({
        fullName: '',
        email: '',
        phone: '',
        userType: 'Buyer',
        mainChannel: 'WhatsApp',
        country: 'Nigeria',
        city: '',
        useCase: '',
        averageTransactionValue: 'Below ₦20,000',
        consent: false
      });

      // Dispatch waitlist confirmation email
      try {
        const mailResponse = await fetch('/api/send-waitlist-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry)
        });
        if (!mailResponse.ok) {
          const errData = await mailResponse.json();
          console.warn('[Email Warning] Failed to trigger waitlist email:', errData.error || mailResponse.statusText);
        } else {
          const resData = await mailResponse.json();
          console.log('[Email Info] Waitlist email status:', resData);
        }
      } catch (emailErr) {
        console.warn('[Email Warning] Network error trying to call send-waitlist-email api:', emailErr);
      }

      showToast(
        result.storedRemotely
          ? `Access Confirmed! Profile stored under ID ${newId}`
          : `Access Confirmed locally! Configure Supabase env vars to sync ID ${newId}`
      );
    } catch (error) {
      setWaitlistValidationError(error instanceof Error ? error.message : 'Unable to save your waitlist profile right now.');
    } finally {
      setIsWaitlistSubmitting(false);
    }
  };

  // Shorts / Quick waitlist modal form handler
  const handleShortWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalValidationError(null);

    // 1. Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(modalForm.email)) {
      setModalValidationError('Please enter a valid email address.');
      return;
    }

    // 2. Duplicate check
    const duplicate = waitlistEntries.some(
      entry => entry.email.trim().toLowerCase() === modalForm.email.trim().toLowerCase()
    );
    if (duplicate) {
      setModalValidationError('This email has already joined the waitlist.');
      return;
    }

    // 3. Consent check
    if (!modalForm.consent) {
      setModalValidationError('Please accept the consent checkbox to continue.');
      return;
    }

    // Create entry
    const newId = `WM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry = {
      id: newId,
      fullName: modalForm.fullName.trim(),
      email: modalForm.email.trim(),
      phone: undefined,
      userType: modalForm.userType,
      mainChannel: modalForm.mainChannel,
      country: 'Nigeria', // default in short modal
      city: undefined,
      useCase: undefined,
      averageTransactionValue: undefined,
      consent: modalForm.consent,
      createdAt: new Date().toISOString()
    };

    try {
      setIsModalSubmitting(true);
      const { submitWaitlistEntry } = await import('./lib/supabase');
      const result = await submitWaitlistEntry(newEntry);

      // Add entry & complete
      setWaitlistEntries([newEntry, ...waitlistEntries]);
      setModalSuccess(true);
      setModalForm({
        fullName: '',
        email: '',
        userType: 'Buyer',
        mainChannel: 'WhatsApp',
        consent: false
      });

      // Dispatch waitlist confirmation email
      try {
        const mailResponse = await fetch('/api/send-waitlist-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry)
        });
        if (!mailResponse.ok) {
          const errData = await mailResponse.json();
          console.warn('[Email Warning] Failed to trigger waitlist email:', errData.error || mailResponse.statusText);
        } else {
          const resData = await mailResponse.json();
          console.log('[Email Info] Waitlist email status:', resData);
        }
      } catch (emailErr) {
        console.warn('[Email Warning] Network error trying to call send-waitlist-email api:', emailErr);
      }

      showToast(
        result.storedRemotely
          ? `Access Confirmed! Profile stored under ID ${newId}`
          : `Access Confirmed locally! Configure Supabase env vars to sync ID ${newId}`
      );
    } catch (error) {
      setModalValidationError(error instanceof Error ? error.message : 'Unable to save your waitlist profile right now.');
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const resetSimulator = () => {
    setSimStep(1);
    setSimOtp('');
    setSimOtpError(false);
    setSimCompleted(false);
  };

  // Safe navigation helper
  const navigateTo = (page: 'home' | 'how-it-works' | 'for-buyers' | 'for-sellers' | 'pricing' | 'security' | 'waitlist' ) => {
    // | 'admin-waitlist' | 'brand-kit'
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Shared elegant CTA form that is used in exactly one spot per page
  const renderSharedCTA = () => (
    <section id="early-access-section" className="py-24 bg-[#081635] text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#232F72]/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10 w-full">
        <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
          <Sparkles className="h-4 w-4 text-[#F7F7F7]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Meduman Sovereign Access</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-light tracking-tight max-w-2xl mx-auto text-white">
          Join the Meduman Waitlist
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          Be among the first buyers, sellers, and businesses across Africa to protect commerce payments inside chats and DMs instantly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button 
            type="button"
            onClick={() => {
              setModalForm(prev => ({ ...prev, userType: 'Both buyer and seller' }));
              setIsWaitlistModalOpen(true);
            }}
            className="w-full sm:w-auto bg-[#232F72] hover:bg-[#121358] text-white hover:text-white border border-[#232F72] text-xs font-bold tracking-wider uppercase px-8 py-4 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg"
          >
            <span>Join Early Access</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button 
            type="button"
            onClick={() => {
              navigateTo('waitlist');
            }}
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/20 text-white text-xs font-bold tracking-wider uppercase px-8 py-4 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Fill Detailed Profile</span>
          </button>
        </div>
        <p className="text-[10px] text-gray-500">Zero integration overhead. Clear CBN regulated depository protections.</p>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#000000] selection:bg-[#232F72] selection:text-white relative font-sans flex flex-col justify-between">
      {/* Premium Fintech Preloader Overlay */}
      <MedumanPreloader />
      
      {/* 1. STICKY GLASSMORPHIC NAVBAR (Minimalist Header) */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${isScrolled ? 'py-4 px-6 scale-[0.98]' : 'py-6 px-8'}`}>
        <div className={`max-w-6xl mx-auto flex items-center justify-between rounded-full border px-6 py-2.5 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-lg border-gray-200/40' : 'bg-white/60 backdrop-blur-sm border-transparent'}`}>
          <button onClick={() => navigateTo('home')} className="flex items-center space-x-2 pb-0.5 group focus:outline-none">
            <div className="transition-transform duration-300 group-hover:rotate-12">
              <MedumanLogo className="h-7 w-7" variant="two-tone" />
            </div>
            <span className="font-display font-bold text-sm tracking-wider text-[#232F72]">
              MEDUMAN
            </span>
          </button>

          {/* Core Desktop Navigation links */}
          <nav className="hidden lg:flex items-center space-x-6">
            <button 
              onClick={() => navigateTo('how-it-works')} 
              className={`text-xs uppercase tracking-wider font-bold transition-colors pb-0.5 border-b ${currentPage === 'how-it-works' ? 'text-[#232F72] border-[#232F72]' : 'text-gray-500 border-transparent hover:text-[#232F72]'}`}
            >
              How It Works
            </button>
            <button 
              onClick={() => navigateTo('for-buyers')} 
              className={`text-xs uppercase tracking-wider font-bold transition-colors pb-0.5 border-b ${currentPage === 'for-buyers' ? 'text-[#232F72] border-[#232F72]' : 'text-gray-500 border-transparent hover:text-[#232F72]'}`}
            >
              Buyers Page
            </button>
            <button 
              onClick={() => navigateTo('for-sellers')} 
              className={`text-xs uppercase tracking-wider font-bold transition-colors pb-0.5 border-b flex items-center gap-1.5 ${currentPage === 'for-sellers' ? 'text-[#232F72] border-[#232F72]' : 'text-gray-500 border-transparent hover:text-[#232F72]'}`}
            >
              Sellers Hub
            </button>
            <button 
              onClick={() => navigateTo('pricing')} 
              className={`text-xs uppercase tracking-wider font-bold transition-colors pb-0.5 border-b ${currentPage === 'pricing' ? 'text-[#232F72] border-[#232F72]' : 'text-gray-500 border-transparent hover:text-[#232F72]'}`}
            >
              Pricing
            </button>
            <button 
              onClick={() => navigateTo('security')} 
              className={`text-xs uppercase tracking-wider font-bold transition-colors pb-0.5 border-b ${currentPage === 'security' ? 'text-[#232F72] border-[#232F72]' : 'text-gray-500 border-transparent hover:text-[#232F72]'}`}
            >
              Security Layer
            </button>
          </nav>

          {/* Desktop Call to Action buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <button 
              onClick={() => setIsSimulatorOpen(true)}
              className="text-gray-600 hover:text-black hover:bg-gray-100 text-[10px] font-bold tracking-widest uppercase px-4 py-2.5 rounded-full transition-all"
            >
              Live Sandbox
            </button>
            <button 
              onClick={() => navigateTo('waitlist')}
              className="bg-[#232F72] hover:bg-[#121358] text-white text-[10px] font-bold tracking-widest uppercase px-5 py-2.5 rounded-full shadow-md transition-all uppercase"
            >
              Join Waitlist
            </button>
          </div>

          {/* Minimalist Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 text-gray-700 hover:text-black focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute inset-x-4 top-20 bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl rounded-3xl p-6 flex flex-col space-y-4 animate-fadeIn lg:hidden z-50">
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => navigateTo('how-it-works')} 
                className={`text-sm font-bold text-left py-2 border-b border-gray-100 ${currentPage === 'how-it-works' ? 'text-[#232F72]' : 'text-gray-500'}`}
              >
                How It Works
              </button>
              <button 
                onClick={() => navigateTo('for-buyers')} 
                className={`text-sm font-bold text-left py-2 border-b border-gray-100 ${currentPage === 'for-buyers' ? 'text-[#232F72]' : 'text-gray-500'}`}
              >
                For Buyers
              </button>
              <button 
                onClick={() => navigateTo('for-sellers')} 
                className={`text-sm font-bold text-left py-2 border-b border-gray-100 ${currentPage === 'for-sellers' ? 'text-[#232F72]' : 'text-gray-500'}`}
              >
                For Sellers
              </button>
              <button 
                onClick={() => navigateTo('pricing')} 
                className={`text-sm font-bold text-left py-2 border-b border-gray-100 ${currentPage === 'pricing' ? 'text-[#232F72]' : 'text-gray-500'}`}
              >
                Pricing Tariff
              </button>
              <button 
                onClick={() => navigateTo('security')} 
                className={`text-sm font-bold text-left py-2 border-b border-gray-100 ${currentPage === 'security' ? 'text-[#232F72]' : 'text-gray-500'}`}
              >
                Security Protocol
              </button>
              <button 
                onClick={() => navigateTo('admin-waitlist')} 
                className={`text-sm font-bold text-[#121358] text-left py-2 border-b border-gray-100 ${currentPage === 'admin-waitlist' ? 'text-[#232F72]' : 'text-gray-400'}`}
              >
                Admin Waitlist stats
              </button>
              <button 
                onClick={() => navigateTo('brand-kit')} 
                className={`text-sm font-bold text-left py-2 border-b border-gray-100 ${currentPage === 'brand-kit' ? 'text-[#232F72]' : 'text-gray-500'}`}
              >
                Brand Guidelines
              </button>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => { setIsMobileMenuOpen(false); navigateTo('waitlist'); }}
                className="w-full text-center py-3 bg-[#232F72] text-white rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-[#121358] transition-all"
              >
                Join Waitlist
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); setIsSimulatorOpen(true); }}
                className="w-full text-center py-3 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-gray-200 transition-all"
              >
                Launch Sandbox
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ======================================================= */}
      {/* 2. MAIN ROUTES DISPATCHER                               */}
      {/* ======================================================= */}
      <main className="flex-grow pt-24">

        {/* ==================== A. HOMEPAGE ==================== */}
        {currentPage === 'home' && (
          <div className="space-y-0">
            
            {/* 1. Hero Area (Apple Developer Style with framer-motion mouse parallax) */}
            <section 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative pt-20 pb-20 md:pt-32 md:pb-28 px-6 overflow-hidden select-none"
            >
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full bg-gradient-to-tr from-[#232F72]/5 to-[#121358]/5 blur-[120px] pointer-events-none"></div>
              
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-6 text-left">
                  <div className="inline-flex items-center space-x-2 bg-[#232F72]/5 border border-[#232F72]/10 px-3.5 py-1.5 rounded-full">
                    <Shield className="h-4 w-4 text-[#232F72]" />
                    <span className="text-[10px] font-bold text-[#232F72] tracking-wider uppercase">Fintech Transaction Escrow</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#081635] leading-tight tracking-tight">
                    Buy and sell online <span className="text-[#232F72] block">without fear.</span>
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base max-w-xl leading-relaxed">
                    Meduman protects peer-to-peer social commerce payments until delivery is complete. It shields transactions initiated on WhatsApp, Instagram, or direct chats.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                    <button 
                      onClick={() => {
                        setModalForm(prev => ({ ...prev, userType: 'Both buyer and seller' }));
                        setPreselectedRole('Both buyer and seller');
                        setIsWaitlistModalOpen(true);
                      }}
                      className="bg-[#232F72] hover:bg-[#121358] text-white text-xs font-bold tracking-wider uppercase px-7 py-3.5 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-transform flex items-center justify-center space-x-2"
                    >
                      <span>Join Early Access</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => navigateTo('how-it-works')}
                      className="text-gray-900 border border-gray-300 hover:bg-gray-100 text-xs font-bold tracking-wider uppercase px-7 py-3.5 rounded-xl transition-all"
                    >
                      Explore How It Works
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Or run our interactive <button onClick={() => setIsSimulatorOpen(true)} className="underline hover:text-[#232F72] font-semibold bg-transparent border-none cursor-pointer">Live Protection Sandbox</button>.
                  </p>
                </div>

                <div className="lg:col-span-5 flex justify-center relative pt-8 lg:pt-0">
                  {/* Subtle decorative background glow circles that also parallax in opposite directions */}
                  <motion.div 
                    style={{ x: bgGlow1X, y: bgGlow1Y }}
                    className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-indigo-500/10 blur-xl pointer-events-none"
                  />
                  <motion.div 
                    style={{ x: bgGlow2X, y: bgGlow2Y }}
                    className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-emerald-500/5 blur-xl pointer-events-none"
                  />

                  {/* Premium floating extra badge elements that have a different parallax speed for true 3D depth */}
                  <motion.div 
                    style={{ 
                      x: badge1X,
                      y: badge1Y,
                    }}
                    className="absolute z-20 -top-4 -left-6 bg-[#081635] text-white py-2 px-3.5 rounded-2xl border border-white/10 shadow-lg flex items-center space-x-2 pointer-events-none"
                  >
                    <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <div>
                      <span className="block text-[8px] tracking-wider uppercase text-gray-400 font-bold">LGA Verification</span>
                      <span className="text-[10px] font-bold block leading-none">Escrow Release Verified</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    style={{ 
                      x: badge2X,
                      y: badge2Y,
                    }}
                    className="absolute z-20 -bottom-6 -right-4 bg-white py-2.5 px-4 rounded-2xl border border-gray-200/80 shadow-md flex items-center space-x-2.5 pointer-events-none"
                  >
                    <div className="h-5 w-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                      <Shield className="h-3 w-3" />
                    </div>
                    <div>
                      <span className="block text-[8px] tracking-wider uppercase text-gray-400 font-bold">Sovereign Vault</span>
                      <span className="text-[10px] font-bold block leading-none text-[#081635]">100% Capital Covered</span>
                    </div>
                  </motion.div>

                  {/* Main premium dashboard card with smooth rotation & float motion combined */}
                  <motion.div 
                    style={{ 
                      rotateX: cardRotateX, 
                      rotateY: cardRotateY,
                      x: cardTranslateX,
                      y: cardTranslateY,
                      transformStyle: "preserve-3d"
                    }}
                    whileHover={{ scale: 1.02 }}
                    className="w-full max-w-sm bg-white border border-gray-200/60 rounded-3xl p-6 shadow-2xl relative cursor-grab active:cursor-grabbing"
                  >
                    {/* Inner glowing light highlight reflecting mouse coordinates */}
                    <motion.div 
                      style={{ 
                        x: highlightX, 
                        y: highlightY,
                      }}
                      className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#232F72]/5 to-[#232F72]/10 rounded-3xl opacity-60 pointer-events-none"
                    />

                    <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div className="flex items-center space-x-3 mb-6 border-b border-gray-150 pb-4">
                      <div className="h-8 w-8 rounded-full bg-[#232F72]/10 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-[#232F72]" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-gray-400">Lock ID #MED-9402</span>
                        <span className="text-xs font-bold text-[#081635]">Secure Escrow Active</span>
                      </div>
                    </div>

                    <div className="space-y-4 font-sans">
                      <div className="bg-[#F7F7F7] p-3 rounded-2xl flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-medium">Protection Balance</span>
                        <span className="text-sm font-extrabold text-[#081635]">₦45,000 NGN</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-500">Transaction Milestone</span>
                          <span className="text-emerald-600">Fund Deposited</span>
                        </div>
                        {/* Static track step */}
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-500 w-2/3 h-full"></div>
                        </div>
                      </div>

                      <div className="text-center pt-2">
                        <p className="text-[10px] text-gray-400">
                          Funds are protected until shipping is validated.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* 2. The Core Problem Statement (Minimalist) */}
            <section className="py-24 bg-white border-t border-b border-gray-200/40 px-6">
              <div className="max-w-6xl mx-auto text-center space-y-12">
                <div className="space-y-3 max-w-xl mx-auto">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">The Safety Imperative</span>
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-black">
                    Why social commerce lacks structural trust.
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-6 bg-[#F7F7F7] rounded-3xl space-y-3 text-left">
                    <ShieldAlert className="h-6 w-6 text-rose-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#081635]">Silent Scams</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      Buyers send pre-payments, and find the vendor immediately deletes their page. Direct transfers carry immense risk.
                    </p>
                  </div>
                  <div className="p-6 bg-[#F7F7F7] rounded-3xl space-y-3 text-left">
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#081635]">Fake Bank Alerts</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      Sellers dispatch premium inventory, only to discover customer alert SMS details were completely forged.
                    </p>
                  </div>
                  <div className="p-6 bg-[#F7F7F7] rounded-3xl space-y-3 text-left">
                    <ShieldCheck className="h-6 w-6 text-[#232F72]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#081635]">The Meduman Cure</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      Our CBN regulated partner vault holds deposit value until buyer approves receipt. Total symmetry for both peers.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. High-End Callouts to Deep Pages (Bento Grid) */}
            <section className="py-24 px-6 max-w-6xl mx-auto space-y-12">
              <div className="text-center space-y-2">
                <span className="text-[10px] font-bold text-[#232F72] uppercase tracking-widest">Product Gateways</span>
                <h2 className="text-2xl md:text-3xl font-display font-light">Customized pathways constructed for each side.</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* For Buyers Bento card */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="h-10 w-10 bg-[#232F72]/5 rounded-xl flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-[#232F72]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#081635]">For Selective Buyers</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      Verify merchant credibility before committing money. Keep complete charge power until real goods rest safely in your hands.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigateTo('for-buyers')}
                    className="group inline-flex items-center space-x-2 text-xs font-bold text-[#232F72] text-left pt-4 hover:underline"
                  >
                    <span>Read Buyer Shield Protocol</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                {/* For Sellers Bento card */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="h-10 w-10 bg-[#232F72]/5 rounded-xl flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-[#232F72]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#081635]">For Professional Sellers</h3>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      Validate real deposit intention before scheduling complex customized orders or shipping valuable goods.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigateTo('for-sellers')}
                    className="group inline-flex items-center space-x-2 text-xs font-bold text-[#232F72] text-left pt-4 hover:underline"
                  >
                    <span>Enter Merchant Hub</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </section>

            {/* 4. CBN Regulated Partner Notice (Large minimal visual banner) */}
            <section className="py-20 bg-gray-50 border-t border-b border-gray-150 px-6">
              <div className="max-w-4xl mx-auto text-center space-y-6">
                <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#081635]">Regulated Security. Institutional Vaults.</h3>
                <p className="text-gray-500 text-xs max-w-xl mx-auto leading-relaxed">
                  All protected payments are deposited directly into tier-1 CBN licensed partner banks. Your money never touches speculative market risks.
                </p>
              </div>
            </section>

            {/* 5. Minimal FAQ snapshot */}
            <section className="py-24 max-w-4xl mx-auto px-6 space-y-12">
              <div className="text-center space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">Common Answers</span>
                <h2 className="text-2xl font-light text-[#081635]">Frequently Answered Questions</h2>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-gray-200/60 rounded-2xl p-5 text-left">
                  <h4 className="text-sm font-bold text-[#081635] mb-2">How fast are seller payouts released?</h4>
                  <p className="text-xs text-gray-500">
                    Sellers receive safe payouts instantly following Buyer OTP delivery validation.
                  </p>
                </div>
                <div className="bg-white border border-gray-200/60 rounded-2xl p-5 text-[#000000] text-left">
                  <h4 className="text-sm font-bold text-[#081635] mb-2">What if the seller fails to dispatch?</h4>
                  <p className="text-xs text-gray-500">
                    If dispatch timelines collapse, funds revert automatically to the buyer source wallet.
                  </p>
                </div>
              </div>
            </section>

            {/* Shared CTA for email acquisition */}
            {renderSharedCTA()}
          </div>
        )}

        {/* ==================== B. HOW IT WORKS ==================== */}
        {currentPage === 'how-it-works' && (
          <div className="space-y-0">
            {/* 1. Header Portion */}
            <section className="py-24 max-w-5xl mx-auto px-6 space-y-6 text-center">
              <span className="text-[10px] uppercase tracking-wider text-[#232F72] bg-[#232F72]/5 px-3.5 py-1 rounded-full font-bold">The Escrow Blueprint</span>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-[#081635]">
                Symmetric Protection protocol.
              </h1>
              <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
                A simple three-stage safe route designed to neutralize payment and shipping fraud entirely.
              </p>
            </section>

            {/* 2. Interactive Steps Panel (Google Developer Style) */}
            <section className="py-16 max-w-5xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Step Selectors */}
                <div className="lg:col-span-4 space-y-4">
                  {[
                    { val: 1, label: '1. Initiate Verification Link', desc: 'Secure links created by either side.' },
                    { val: 2, label: '2. CBN Partner Vault Holds', desc: 'Funds are isolated before ship triggers.' },
                    { val: 3, label: '3. OTP Release Confirmation', desc: 'Direct secure code releases cash.' }
                  ].map(step => (
                    <button 
                      key={step.val}
                      onClick={() => setHowTab(step.val as 1|2|3)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all ${howTab === step.val ? 'bg-white border-[#232F72] shadow-md' : 'bg-transparent border-gray-250/20 hover:bg-white'}`}
                    >
                      <h4 className={`text-xs font-bold uppercase ${howTab === step.val ? 'text-[#232F72]' : 'text-gray-500'}`}>{step.label}</h4>
                      <p className="text-xs text-gray-400 mt-1 font-light leading-normal">{step.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Right Interactive Mockups */}
                <div className="lg:col-span-8 bg-white border border-gray-200/60 rounded-3xl p-6 shadow-sm min-h-[340px] flex flex-col justify-between">
                  {howTab === 1 && (
                    <div className="space-y-4 text-left">
                      <div className="flex items-center justify-between border-b border-gray-105 pb-3">
                        <span className="text-xs font-bold text-[#081635]">WhatsApp DM Simulation</span>
                        <span className="text-[10.5px] text-gray-400">Buyer & Seller Chat</span>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-[#F7F7F7] text-xs p-3 rounded-2xl max-w-[80%] text-gray-700">
                          Hi vendor, sent payment yet?
                        </div>
                        <div className="bg-[#232F72]/10 text-xs p-3 rounded-2xl max-w-[80%] ml-auto text-right text-[#081635] font-medium">
                          Please tap here to deposit ₦35k escrow safely: <span className="underline block font-bold text-[#232F72]">medu.link/pay/2910</span>
                        </div>
                      </div>
                      <p className="text-gray-500 text-xs pt-4 border-t border-gray-100 font-light">
                        Either peer generates deep verified transaction targets via short templates instantly.
                      </p>
                    </div>
                  )}

                  {howTab === 2 && (
                    <div className="space-y-4 text-left">
                      <div className="flex items-center space-x-2.5 text-[#232F72]">
                        <Lock className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Regulated Vault Active</span>
                      </div>
                      <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-2xl space-y-2">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase">Locked Trust Account</span>
                        <p className="text-xs text-amber-800">
                          Transaction value is isolated under professional commercial bank custody systems.
                        </p>
                      </div>
                      <p className="text-gray-500 text-xs font-light leading-relaxed">
                        The merchant receives notification of verified payment but cannot claim credit until dispatch code is submitted.
                      </p>
                    </div>
                  )}

                  {howTab === 3 && (
                    <div className="space-y-4 text-left">
                      <span className="text-xs text-gray-400 uppercase block font-bold">Delivery Protocol Verified</span>
                      <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl flex items-center space-x-4">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-emerald-900">OTP Release Triggered</h5>
                          <p className="text-xs text-emerald-800">
                            Merchant escrow payout cleared is distributed instantly to local bank ledger.
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-500 text-xs font-light leading-relaxed">
                        The buyer shares a confidential, single-use dispatch verification code once product conforms to agreement.
                      </p>
                    </div>
                  )}

                  <div className="text-center pt-4 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400">
                      Symmetric security ensures that no party has unverified leverage.
                    </p>
                  </div>

                </div>

              </div>
            </section>

            {/* 3. Global Shipping & Dispute Core */}
            <section className="py-24 bg-white border-t border-b border-gray-100/80 px-6">
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left">
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-rose-500">Autonomous Mediation</span>
                  <h3 className="text-2xl font-display font-extrabold text-[#081635]">
                    Independent human dispute council controls.
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    If logistics disputes emerge, Meduman locks resources immediately. Certified mediation experts examine physical proof of parcel tracking and dispatch records, ruling inside 24 hours.
                  </p>
                </div>
                <div className="bg-[#F7F7F7] border border-gray-200/50 p-6 rounded-3xl space-y-4">
                  <h4 className="text-xs font-bold uppercase text-[#081635] tracking-wider">Arbitration Logs</h4>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-white border border-gray-100 rounded-xl flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium">Claims initiated</span>
                      <span className="text-rose-500 font-bold uppercase">Locked under review</span>
                    </div>
                    <div className="p-2.5 bg-white border border-gray-100 rounded-xl flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 font-medium font-medium">Evidence uploaded</span>
                      <span className="text-[#232F72] font-semibold">Under Panel Review</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {renderSharedCTA()}
          </div>
        )}

        {/* ==================== C. FOR BUYERS ==================== */}
        {currentPage === 'for-buyers' && (
          <div className="space-y-0">
            {/* 1. Header Portion */}
            <section className="py-24 max-w-5xl mx-auto px-6 space-y-6 text-center">
              <span className="text-[10px] uppercase tracking-wider text-[#232F72] bg-[#232F72]/5 px-3.5 py-1 rounded-full font-bold">Uncompromising Safety</span>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-[#081635]">
                Never get ghosted again.
              </h1>
              <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
                Control active cash payout states directly until delivery conditions match agreement perfectly.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalForm(prev => ({ ...prev, userType: 'Buyer' }));
                    setPreselectedRole('Buyer');
                    setIsWaitlistModalOpen(true);
                  }}
                  className="bg-[#232F72] hover:bg-[#121358] text-white text-xs font-bold tracking-wider uppercase px-7 py-3.5 rounded-xl shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer"
                >
                  <span>Join as a Buyer</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            {/* 2. Key Safeguards cards Grid */}
            <section className="py-16 max-w-5xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border border-gray-250/20 p-6 rounded-3xl space-y-3 text-left">
                  <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <Check className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase text-[#081635]">Protected Escrow Return</h3>
                  <p className="text-gray-500 text-xs font-light leading-relaxed">
                    If dispatch timelines break or seller drops contact, deposit values revert to you instantly.
                  </p>
                </div>
                <div className="bg-white border border-gray-250/20 p-6 rounded-3xl space-y-3 text-left">
                  <div className="h-8 w-8 bg-[#232F72]/10 rounded-lg flex items-center justify-center text-[#232F72]">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase text-[#081635]">Inspection Grace Window</h3>
                  <p className="text-gray-500 text-xs font-light leading-relaxed">
                    Review and verify product quality attributes before releasing the confidential payout OTP.
                  </p>
                </div>
                <div className="bg-white border border-gray-250/20 p-6 rounded-3xl space-y-3 text-left">
                  <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase text-[#081635]">Discretionary Appeals</h3>
                  <p className="text-gray-500 text-xs font-light leading-relaxed">
                    Trigger custom arbitration disputes with ease if delivered goods fail physical inspection criteria.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Interactive Buyer Validation Stepper */}
            <section className="py-20 bg-white border-t border-b border-gray-200/40 px-6">
              <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#232F72]">Symmetric Ledger Demo</span>
                  <h3 className="text-2xl font-bold text-[#081635]">Confirm active dispatch code.</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    Test the buyer interface by keying in the mock courier confirmation OTP (5310) to authorize seller payout.
                  </p>
                </div>

                <div className="lg:col-span-7 bg-[#F7F7F7] border border-gray-200 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-gray-200 pb-3">
                    <span className="text-[#081635]">Buyer Active Portal</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px]">LOCKED CUSTODY</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Purchase Item</span>
                      <span className="font-bold">Original Leather Boots</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Protection Vault Total</span>
                      <span className="font-bold text-[#232F72]">₦55,000</span>
                    </div>

                    {!buyerOtpVerified ? (
                      <div className="space-y-2 pt-2">
                        <label className="block text-[10px] uppercase font-bold text-gray-400">Key In OTP Code (Hint: 5310)</label>
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            value={buyerInputOtp}
                            onChange={(e) => {
                              setBuyerInputOtp(e.target.value);
                              setBuyerOtpError(false);
                            }}
                            placeholder="Type digits"
                            className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs w-full focus:outline-none focus:border-[#232F72] text-[#000000] font-bold"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              if (buyerInputOtp === '5310') {
                                setBuyerOtpVerified(true);
                                setBuyerOtpError(false);
                              } else {
                                setBuyerOtpError(true);
                              }
                            }}
                            className="bg-[#232F72] text-white text-xs font-bold tracking-wider uppercase px-5 py-3 rounded-xl hover:bg-[#121358]"
                          >
                            Submit
                          </button>
                        </div>
                        {buyerOtpError && (
                          <p className="text-[10px] text-rose-500 font-medium">
                            Invalid OTP. Please key in the correct hint code (5310) to proceed.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2 pt-2">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-150 px-2 py-0.5 rounded uppercase">Released</span>
                        <p className="text-xs text-emerald-900 font-light">
                          Verified. Escrow balance cleared for merchant withdrawal.
                        </p>
                        <button 
                          type="button"
                          onClick={() => { 
                            setBuyerInputOtp(''); 
                            setBuyerOtpVerified(false); 
                            setBuyerOtpError(false); 
                          }}
                          className="text-[10px] text-gray-400 underline block text-left"
                        >
                          Reset Demo Stepper
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {renderSharedCTA()}
          </div>
        )}

        {/* ==================== D. FOR SELLERS ==================== */}
        {currentPage === 'for-sellers' && (
          <div className="space-y-0">
            {/* 1. Header Portion */}
            <section className="py-24 max-w-5xl mx-auto px-6 space-y-6 text-center">
              <span className="text-[10px] uppercase tracking-wider text-[#232F72] bg-[#232F72]/5 px-3.5 py-1 rounded-full font-bold">Unfair Advantage</span>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-[#081635]">
                Cease shipping on trust.
              </h1>
              <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
                Verify cash resources are isolated in regulated partner structures before crafting customized fabrics or dispatching riders.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalForm(prev => ({ ...prev, userType: 'Seller' }));
                    setPreselectedRole('Seller');
                    setIsWaitlistModalOpen(true);
                  }}
                  className="bg-[#232F72] hover:bg-[#121358] text-white text-xs font-bold tracking-wider uppercase px-7 py-3.5 rounded-xl shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer"
                >
                  <span>Join as a Seller</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            {/* 2. Key Safeguards cards Grid for Sellers */}
            <section className="py-16 max-w-5xl mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border border-gray-250/20 p-6 rounded-3xl space-y-3 text-left">
                  <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-800">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase text-[#081635]">Verify Intention</h3>
                  <p className="text-gray-500 text-xs font-light leading-relaxed">
                    Instantly filter out customers who execute mock transfers or drag dispatch timelines without real capital.
                  </p>
                </div>
                <div className="bg-white border border-gray-250/20 p-6 rounded-3xl space-y-3 text-left">
                  <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase text-[#081635]">Zero Fake Alerts</h3>
                  <p className="text-gray-500 text-xs font-light leading-relaxed">
                    Our API communicates directly with commercial banking infrastructure to guarantee cash balances are locked before dispatch.
                  </p>
                </div>
                <div className="bg-white border border-gray-250/20 p-6 rounded-3xl space-y-3 text-left">
                  <div className="h-8 w-8 bg-rose-100 rounded-lg flex items-center justify-center text-rose-800">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase text-[#081635]">Dispatch Risk Coverage</h3>
                  <p className="text-gray-500 text-xs font-light leading-relaxed">
                    If customer rejects parcel without premium justification, Meduman system structures can cover logistic fees.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Interactive Link Generator Mockup Widget */}
            <section className="py-24 bg-white border-t border-b border-gray-200/40 px-6">
              <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#232F72]">Instant Protection Tool</span>
                  <h3 className="text-2xl font-bold text-[#081635]">Generate escrow links.</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-light">
                    Input customized purchase details below to simulate generating checkout parameters for your customer base.
                  </p>
                </div>

                <div className="lg:col-span-7 bg-[#F7F7F7] border border-gray-200 p-6 rounded-3xl space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Product Designation</label>
                      <input 
                        type="text" 
                        value={sellerInputName}
                        onChange={(e) => {
                          setSellerInputName(e.target.value);
                          setSellerGeneratedLink('');
                        }}
                        className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs w-full focus:outline-none focus:border-[#232F72] text-[#000000]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Price (₦ NGN)</label>
                      <input 
                        type="text" 
                        value={sellerInputPrice}
                        onChange={(e) => {
                          setSellerInputPrice(e.target.value);
                          setSellerGeneratedLink('');
                        }}
                        className="bg-white border border-gray-300 rounded-xl px-4 py-1.5 text-xs w-full focus:outline-none focus:border-[#232F72] text-[#000000]"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        const randomId = Math.floor(1000 + Math.random() * 9000);
                        setSellerGeneratedLink(`medu.link/escrow/auth-${randomId}`);
                      }}
                      className="w-full bg-[#232F72] hover:bg-[#121358] text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all"
                    >
                      Create Protected Checkout Link
                    </button>

                    {sellerGeneratedLink && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl space-y-2 pt-2 transition-all">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-150 px-2 py-0.5 rounded">Active Escrow Parameter Ready</span>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="text" 
                            readOnly
                            value={sellerGeneratedLink}
                            className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs w-full text-gray-500"
                          />
                          <button 
                            onClick={() => {
                              setSellerCopied(true);
                              setTimeout(() => setSellerCopied(false), 1500);
                            }}
                            className="bg-gray-200 hover:bg-gray-300 text-xs px-3 py-2 rounded-xl text-[#000000]"
                          >
                            {sellerCopied ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Mini merchant lists panel */}
            <section className="py-24 max-w-4xl mx-auto px-6 space-y-6">
              <div className="text-center space-y-2">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">Simulated Ledger</span>
                <h3 className="text-2xl font-light text-[#081635]">Sample Seller Activity Dashboard</h3>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4">
                <div className="flex border-b border-gray-150 pb-2 space-x-4">
                  {['all', 'escrow', 'released'].map(fil => (
                    <button 
                      key={fil}
                      onClick={() => setSellerActiveFilter(fil as any)}
                      className={`text-[10px] uppercase font-bold tracking-wider py-1.5 px-3 rounded-md transition-all ${sellerActiveFilter === fil ? 'bg-[#232F72] text-white' : 'text-gray-400 hover:text-[#081635]'}`}
                    >
                      {fil}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'TX-90', client: 'Ayo B.', val: '₦45,000', status: 'escrow', item: 'Ankara Fabric' },
                    { id: 'TX-82', client: 'Chidi O.', val: '₦22,000', status: 'released', item: 'Leather Belt' },
                    { id: 'TX-61', client: 'Nkechi K.', val: '₦125,000', status: 'escrow', item: 'Lace Material v1' }
                  ]
                  .filter(it => sellerActiveFilter === 'all' || it.status === sellerActiveFilter)
                  .map(it => (
                    <div key={it.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#081635] block">{it.item}</span>
                        <span className="text-[10px] text-gray-400">Client: {it.client}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-[#232F72] block">{it.val}</span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${it.status === 'escrow' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {it.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {renderSharedCTA()}
          </div>
        )}

        {/* ==================== E. SECURITY LAYER ==================== */}
        {currentPage === 'security' && (
          <div className="space-y-0">
            {/* 1. Header Portion */}
            <section className="py-24 max-w-5xl mx-auto px-6 space-y-6 text-center">
              <span className="text-[10px] uppercase tracking-wider text-[#232F72] bg-[#232F72]/5 px-3.5 py-1 rounded-full font-bold">Uncompromising Encryption</span>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-[#081635]">
                Institutional Protection Standard.
              </h1>
              <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
                Explore the cryptographic mechanisms securing peer transactions and banking records at every step.
              </p>
            </section>

            {/* 2. Four core metrics rows */}
            <section className="py-16 bg-white border-t border-b border-gray-150 px-6">
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-2 text-left">
                  <div className="h-8 w-8 bg-[#232F72]/5 rounded flex items-center justify-center text-[#232F72]">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs font-bold uppercase text-[#081635]">Isolated Escrow Vaults</h4>
                  <p className="text-gray-500 text-[11px] font-light leading-normal">
                    Capital deposits sit inside CBN partner commercial bank infrastructures with audited solvency parameters.
                  </p>
                </div>
                <div className="space-y-2 text-left">
                  <div className="h-8 w-8 bg-[#232F72]/5 rounded flex items-center justify-center text-[#232F72]">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs font-bold uppercase text-[#081635]">Biometric Audits</h4>
                  <p className="text-gray-500 text-[11px] font-light leading-normal">
                    To eliminate fake accounts, merchants verify official registration credentials and national ID profiles.
                  </p>
                </div>
                <div className="space-y-2 text-left">
                  <div className="h-8 w-8 bg-[#232F72]/5 rounded flex items-center justify-center text-[#232F72]">
                    <RefreshCw className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs font-bold uppercase text-[#081635]">Automated Reversals</h4>
                  <p className="text-gray-500 text-[11px] font-light leading-normal">
                    If logistic terms break or transport targets lapse, cash allocation reverts safely to destination accounts.
                  </p>
                </div>
                <div className="space-y-2 text-left">
                  <div className="h-8 w-8 bg-[#232F72]/5 rounded flex items-center justify-center text-[#232F72]">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="text-xs font-bold uppercase text-[#081635]">Encrypted Trails</h4>
                  <p className="text-gray-500 text-[11px] font-light leading-normal">
                    Conversations and agreements reside securely encoded inside AES-256 protected ledger vaults.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Dispute Council Sandbox Simulator */}
            <section className="py-24 max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Independent Panel Council</span>
                <h3 className="text-2xl font-bold text-[#081635]">Safe dispute arbitration.</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-light">
                  Witness how Meduman mediation experts inspect shipping declarations to clear escrow payouts or trigger buyer refunds.
                </p>
              </div>

              <div className="lg:col-span-7 bg-white border border-gray-200/80 p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold border-b border-gray-150 pb-3">
                  <span>DISPUTE ARBITRATION BOARD #6830</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${disputeStatus === 'review' ? 'bg-amber-100 text-amber-800' : disputeStatus === 'buyer-refunded' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    Status: {disputeStatus === 'review' ? 'UNDER_REVIEW' : disputeStatus === 'buyer-refunded' ? 'REFUNDED_TO_BUYER' : 'PAID_TO_SELLER'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-[#081635] block">Locked Value: ₦80,000</span>
                      <span className="text-[10px] text-gray-400">Claim reason: Color parameters mismatched</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setDisputeStatus('buyer-refunded')}
                      className="w-1/2 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all"
                    >
                      Issue Buyer Refund
                    </button>
                    <button 
                      onClick={() => setDisputeStatus('seller-paid')}
                      className="w-1/2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all"
                    >
                      Clear Payout to Seller
                    </button>
                  </div>

                  {disputeStatus !== 'review' && (
                    <button 
                      onClick={() => setDisputeStatus('review')}
                      className="text-[10px] text-gray-400 underline block mx-auto text-center"
                    >
                      Reset Arbitration Screen
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* 4. Privacy & Data Protection Dark Panel */}
            <section className="py-20 bg-gradient-to-br from-[#081635] to-[#121358] text-white">
              <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
                <span className="text-[10px] uppercase tracking-widest text-[#232F72] bg-white/5 py-1 px-3 rounded-full font-bold">Privacy Priority Mandate</span>
                <h3 className="text-xl md:text-2xl font-light">
                  We believe transactional details should remain private.
                </h3>
                <p className="text-gray-400 text-xs max-w-xl mx-auto leading-relaxed">
                  Meduman utilizes double-blind storage variables to keep buyer and merchant identities encrypted. Third parties have zero operational entry to transactional ledger contents.
                </p>
              </div>
            </section>

            {renderSharedCTA()}
          </div>
        )}

        {currentPage === 'pricing' && (
          <div className="max-w-5xl mx-auto px-6 py-16 space-y-16 animate-fadeIn">
            {/* Header portion */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="text-[10px] font-bold text-[#232F72] uppercase tracking-widest bg-[#232F72]/5 px-3 py-1 rounded-full">Transparent Tariff Architecture</span>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold text-[#081635]">
                Symmetric fee structure.
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                No integration overhead. No administrative setup fees. Pay only for verified deliveries completed under full lock.
              </p>

              {/* Billing Switcher Toggle */}
              <div className="flex items-center justify-center space-x-3 pt-6">
                <span className={`text-xs font-semibold ${!isAnnual ? 'text-[#232F72]' : 'text-gray-400'}`}>Standard Monthly</span>
                <button 
                  onClick={() => setIsAnnual(!isAnnual)}
                  type="button"
                  className="w-12 h-6 bg-gray-200 rounded-full p-1 transition-colors duration-300 relative focus:outline-none cursor-pointer"
                  aria-label="Toggle Annual Billing"
                >
                  <div className={`w-4 h-4 bg-[#232F72] rounded-full transition-transform duration-300 transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
                <span className={`text-xs font-semibold flex items-center space-x-1.5 ${isAnnual ? 'text-[#232F72]' : 'text-gray-400'}`}>
                  <span>Annual Billing</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full">Save 20%</span>
                </span>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Basic Plan */}
              <div className="bg-white border border-gray-200/60 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:shadow-xl transition-all relative">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="text-left">
                      <h3 className="text-md font-bold text-[#081635]">Basic Protection</h3>
                      <p className="text-[11px] text-gray-500 leading-normal">Optimized for individual social buyers and casual peer sellers.</p>
                    </div>
                    <span className="bg-gray-100 text-gray-700 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Self-Serve</span>
                  </div>

                  <div className="pt-2 text-left">
                    <span className="text-3xl font-extrabold text-black">1.5%</span>
                    <span className="text-xs text-gray-450 font-medium"> per locked transaction</span>
                    <p className="text-[10px] text-[#232F72] font-semibold mt-1">Capped at ₦2,000 maximum fee per escrow contract</p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-3 text-left">
                    <h4 className="text-[10px] font-bold uppercase text-gray-450 tracking-wider">Features Included:</h4>
                    <ul className="space-y-2.5">
                      {[
                        'Standard transaction protection inside any chat',
                        'Generate dynamic single-escrow verified links',
                        'Direct WhatsApp, IG, & X integrations',
                        'Standard biological identity verification audits',
                        '24/7 basic dispute arbitration access'
                      ].map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-2.5 text-xs text-gray-600">
                          <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => {
                      setWaitlistForm(prev => ({
                        ...prev,
                        userType: 'Buyer',
                        averageTransactionValue: 'Below ₦20,000'
                      }));
                      navigateTo('waitlist');
                      showToast('Plan pre-filled: Basic Protection');
                    }}
                    className="w-full bg-[#232F72] hover:bg-[#121358] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Secure Early Access</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="bg-white border-2 border-[#232F72] rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:shadow-2xl transition-all relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#232F72] text-[#FFFFFF] text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                  Highly Recommended
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="text-left">
                      <h3 className="text-md font-bold text-[#081635]">Pro Business</h3>
                      <p className="text-[11px] text-gray-500 leading-normal">Ideal for structured vendors, freelancers, digital agencies, and growing stores.</p>
                    </div>
                    <span className="bg-[#232F72]/10 text-[#232F72] text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Sovereign API</span>
                  </div>

                  <div className="pt-2 text-left">
                    <span className="text-3xl font-extrabold text-black">2.5%</span>
                    <span className="text-xs text-gray-450 font-medium"> per locked transaction</span>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">Capped at ₦5,000 maximum fee per contract</p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-3 text-left">
                    <h4 className="text-[10px] font-bold uppercase text-gray-450 tracking-wider">Everything in Basic, Plus:</h4>
                    <ul className="space-y-2.5">
                      {[
                        'Automated multi-escrow merchant dashboards',
                        'Customized delivery milestones and partial payouts',
                        'Protected design delivery holds for freelancers',
                        'Embedded checkout widget buttons on websites',
                        'First-priority settlement with dedicated arbitrator'
                      ].map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-2.5 text-xs text-gray-600">
                          <Check className="h-4 w-4 text-[#232F72] mt-0.5 shrink-0" />
                          <span className="font-medium text-gray-700">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => {
                      setWaitlistForm(prev => ({
                        ...prev,
                        userType: 'Business',
                        averageTransactionValue: '₦100,000 – ₦500,000'
                      }));
                      navigateTo('waitlist');
                      showToast('Plan pre-filled: Pro Business Hub');
                    }}
                    className="w-full bg-[#081635] hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer text-white hover:text-white"
                  >
                    <span>Pre-Register Pro Plan</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Guarantee statement block */}
            <div className="bg-gray-100/50 rounded-3xl p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              <div className="space-y-1">
                <h5 className="text-xs font-bold uppercase text-[#081635]">Early User Privilege</h5>
                <p className="text-gray-500 text-[11px] leading-relaxed">Early signups join completely free with 0% introductory fee on their first 5 completions.</p>
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold uppercase text-[#081635]">Regulated Security</h5>
                <p className="text-gray-550 text-[11px] leading-relaxed">Depository accounts managed by leading commercial banking structures across Africa with deep legal vaults.</p>
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-bold uppercase text-[#081635]">Risk-Free Trial Mode</h5>
                <p className="text-gray-550 text-[11px] leading-relaxed">No binding contract parameters or setup fees. Secure transactions on demand as needed.</p>
              </div>
            </div>

            {renderSharedCTA()}
          </div>
        )}

        {currentPage === 'waitlist' && (
          <div className="max-w-4xl mx-auto px-6 py-16 space-y-12 animate-fadeIn">
            {/* Header Portion */}
            <div className="text-center space-y-4 max-w-xl mx-auto flex flex-col items-center">
              <MedumanLogo className="h-12 w-12 mb-1" variant="navy" />
              <span className="text-[10px] font-bold text-[#232F72] uppercase tracking-widest bg-[#232F72]/5 px-3 py-1 rounded-full">Secure Early Credentials</span>
              <h1 className="text-3xl md:text-5xl font-display font-extrabold text-[#081635]">
                Register for early access.
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Provide your trading parameters. Our onboarding ledger will secure your biometric API tokens and escrow structures.
              </p>
            </div>

            {waitlistSuccessData ? (
              /* Success State Confirmation Card */
              <div className="bg-white border border-gray-200 shadow-2xl rounded-3xl p-8 md:p-12 text-center space-y-8 max-w-xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 to-[#232F72]"></div>
                
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <div className="space-y-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Onboarding Verification Success
                  </span>
                  <h3 className="text-2xl font-display font-bold text-[#081635]">Waitlist Confirmed</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                    Welcome to Meduman! Your slot is secure under Member credential ledger. We will contact you at <span className="font-semibold text-black">{waitlistSuccessData.email}</span>.
                  </p>
                </div>

                {/* Profile Snapshot Grid */}
                <div className="bg-[#F7F7F7] rounded-2xl p-5 text-left grid grid-cols-2 gap-4 border border-gray-150">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Credential Token</span>
                    <p className="text-xs font-mono font-bold text-gray-850">{waitlistSuccessData.id}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Access Category</span>
                    <p className="text-xs font-semibold text-gray-850">{waitlistSuccessData.userType}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Market Connection</span>
                    <p className="text-xs font-semibold text-gray-850">{waitlistSuccessData.mainChannel}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Region Origin</span>
                    <p className="text-xs font-semibold text-gray-850">{waitlistSuccessData.city ? `${waitlistSuccessData.city}, ` : ''}{waitlistSuccessData.country}</p>
                  </div>
                </div>

                {/* Share tools */}
                <div className="border-t border-gray-100 pt-6 space-y-4">
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Refer other buyers, sellers, or freelancers to advance your position on the priority roll.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => {
                        const shareTxt = `I just secured early transaction escrow access on Meduman. Safer social trading across Africa. Secure early access: ${window.location.origin}`;
                        navigator.clipboard.writeText(shareTxt);
                        showToast('Copied referral text to clipboard!');
                      }}
                      className="w-full sm:w-auto flex-1 bg-[#232F72] hover:bg-[#121358] text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy Referral Text</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setWaitlistSuccessData(null);
                      }}
                      className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-705 text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Join Another</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => navigateTo('home')}
                    className="text-xs text-[#232F72] font-semibold hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Return to Homepage
                  </button>
                </div>
              </div>
            ) : (
              /* Detailed Waitlist Form */
              <div className="bg-white border border-gray-200/50 shadow-xl rounded-3xl p-6 md:p-10 max-w-2xl mx-auto">
                <form onSubmit={handleFullWaitlistSubmit} className="space-y-6">
                  {waitlistValidationError && (
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start space-x-3 text-rose-800">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p className="text-xs font-medium text-left leading-relaxed">{waitlistValidationError}</p>
                    </div>
                  )}

                  {/* Form fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label htmlFor="fullname-input" className="block text-xs font-bold uppercase text-gray-500 tracking-wider">Full name *</label>
                      <input 
                        id="fullname-input"
                        type="text"
                        required
                        value={waitlistForm.fullName}
                        onChange={(e) => setWaitlistForm(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="e.g. Adebayo Ogunlesi"
                        className="w-full bg-[#F7F7F7] border border-gray-200 hover:border-gray-300 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                      />
                    </div>

                    {/* Email address */}
                    <div className="space-y-2">
                      <label htmlFor="email-input" className="block text-xs font-bold uppercase text-gray-500 tracking-wider">Email address *</label>
                      <input 
                        id="email-input"
                        type="email"
                        required
                        value={waitlistForm.email}
                        onChange={(e) => setWaitlistForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="e.g. adebayo@example.com"
                        className="w-full bg-[#F7F7F7] border border-gray-200 hover:border-gray-300 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <label htmlFor="phone-input" className="block text-xs font-bold uppercase text-gray-500 tracking-wider">Phone number (Optional)</label>
                      <input 
                        id="phone-input"
                        type="tel"
                        value={waitlistForm.phone}
                        onChange={(e) => setWaitlistForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. +234 803 123 4567"
                        className="w-full bg-[#F7F7F7] border border-gray-200 hover:border-gray-300 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                      />
                    </div>

                    {/* Joining as drop-down */}
                    <div className="space-y-2">
                      <label htmlFor="usertype-select" className="block text-xs font-bold uppercase text-gray-500 tracking-wider">I am joining as *</label>
                      <select
                        id="usertype-select"
                        required
                        value={waitlistForm.userType}
                        onChange={(e) => setWaitlistForm(prev => ({ ...prev, userType: e.target.value }))}
                        className="w-full bg-[#F7F7F7] border border-gray-200 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                      >
                        <option value="Buyer">Buyer (Protecting my purchases)</option>
                        <option value="Seller">Seller (Securing bank payments)</option>
                        <option value="Freelancer">Freelancer (Protecting design work/deliveries)</option>
                        <option value="Business">Business / Brand (API payment routing)</option>
                        <option value="Both buyer and seller">Both Buyer & Seller</option>
                      </select>
                    </div>

                    {/* Main Channel */}
                    <div className="space-y-2">
                      <label htmlFor="channel-select" className="block text-xs font-bold uppercase text-gray-500 tracking-wider">Primary Sales Channel *</label>
                      <select
                        id="channel-select"
                        required
                        value={waitlistForm.mainChannel}
                        onChange={(e) => setWaitlistForm(prev => ({ ...prev, mainChannel: e.target.value }))}
                        className="w-full bg-[#F7F7F7] border border-gray-200 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook Marketplace">Facebook Marketplace</option>
                        <option value="Telegram">Telegram</option>
                        <option value="X/Twitter">X/Twitter</option>
                        <option value="Website">Website Link</option>
                        <option value="Other">Other DM / Group feeds</option>
                      </select>
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <label htmlFor="country-select" className="block text-xs font-bold uppercase text-gray-500 tracking-wider">Region Country *</label>
                      <select
                        id="country-select"
                        required
                        value={waitlistForm.country}
                        onChange={(e) => setWaitlistForm(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full bg-[#F7F7F7] border border-gray-200 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                      >
                        <option value="Nigeria">Nigeria</option>
                        <option value="Ghana">Ghana</option>
                        <option value="Kenya">Kenya</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="Uganda">Uganda</option>
                      </select>
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <label htmlFor="city-input" className="block text-xs font-bold uppercase text-gray-500 tracking-wider">City (Optional)</label>
                      <input 
                        id="city-input"
                        type="text"
                        value={waitlistForm.city}
                        onChange={(e) => setWaitlistForm(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="e.g. Lagos, Accra"
                        className="w-full bg-[#F7F7F7] border border-gray-200 hover:border-gray-300 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                      />
                    </div>

                    {/* Avg Transaction Value */}
                    <div className="space-y-2">
                      <label htmlFor="value-select" className="block text-xs font-bold uppercase text-gray-500 tracking-wider">Avg Transaction Value</label>
                      <select
                        id="value-select"
                        value={waitlistForm.averageTransactionValue}
                        onChange={(e) => setWaitlistForm(prev => ({ ...prev, averageTransactionValue: e.target.value }))}
                        className="w-full bg-[#F7F7F7] border border-gray-200 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                      >
                        <option value="Below ₦20,000">Below ₦20,000</option>
                        <option value="₦20,000 – ₦100,000">₦20,000 – ₦100,000</option>
                        <option value="₦100,000 – ₦500,000">₦100,000 – ₦500,000</option>
                        <option value="Above ₦500,000">Above ₦500,000</option>
                      </select>
                    </div>
                  </div>

                  {/* Use case text area */}
                  <div className="space-y-2 text-left">
                    <label htmlFor="usecase-textarea" className="block text-xs font-bold uppercase text-gray-500 tracking-wider">Specifically, how will you use Meduman? (Optional)</label>
                    <textarea
                      id="usecase-textarea"
                      rows={3}
                      value={waitlistForm.useCase}
                      onChange={(e) => setWaitlistForm(prev => ({ ...prev, useCase: e.target.value }))}
                      placeholder="e.g. To verify secure cash availability before shipping out my tailor-designed clothing..."
                      className="w-full bg-[#F7F7F7] border border-gray-200 hover:border-gray-300 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3.5 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                    ></textarea>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start space-x-3 text-left pt-2">
                    <input 
                      id="consent-checkbox"
                      type="checkbox"
                      required
                      checked={waitlistForm.consent}
                      onChange={(e) => setWaitlistForm(prev => ({ ...prev, consent: e.target.checked }))}
                      className="h-4 w-4 mt-0.5 rounded border-gray-300 text-[#232F72] focus:ring-[#232F72] cursor-pointer"
                    />
                    <label htmlFor="consent-checkbox" className="text-xs text-gray-500 leading-normal select-none cursor-pointer">
                      I agree to receive early access system onboarding notifications from Meduman. I acknowledge Meduman protects peer transactions using regulated deposit trust vaults. *
                    </label>
                  </div>

                  {/* Submit buttons */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                    <button
                      type="submit"
                      disabled={isWaitlistSubmitting}
                      className="w-full sm:w-auto bg-[#232F72] hover:bg-[#121358] disabled:bg-[#232F72]/60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl shadow-lg transition-transform inline-flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>{isWaitlistSubmitting ? 'Securing Position...' : 'Secure Onboarding Position'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('pricing')}
                      className="text-xs text-gray-500 hover:text-[#232F72] py-2 font-semibold bg-transparent border-none cursor-pointer"
                    >
                      Review Protection Fees
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {currentPage === 'admin-waitlist' && (
          <div className="max-w-6xl mx-auto px-6 py-16 space-y-8 animate-fadeIn">
            {/* Header Portion */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200/60 pb-6">
              <div className="space-y-1.5 text-left">
                <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase text-[#232F72]">
                  <Briefcase className="h-4 w-4" />
                  <span>Onboarding Operations Portal</span>
                </div>
                <h1 className="text-2xl md:text-3.5xl font-display font-extrabold text-[#081635]">Waitlist Central Registry</h1>
                <p className="text-xs text-gray-500">Live escrow pre-registration databases. Protected under operator biometric parameters.</p>
              </div>

              {/* CSV Export Tool and Add Mock buttons */}
              <div className="flex flex-row items-center gap-3">
                {/* Simulated CSV Download anchor */}
                <button
                  type="button"
                  onClick={() => {
                    // Generate CSV content
                    const headers = 'ID,Full Name,Email,Phone,Category,Sales Channel,Country,City,Avg Value,CreatedAt\n';
                    const rows = waitlistEntries.map(e => 
                      `"${e.id}","${e.fullName}","${e.email}","${e.phone || ''}","${e.userType}","${e.mainChannel}","${e.country}","${e.city || ''}","${e.averageTransactionValue || ''}","${e.createdAt}"`
                    ).join('\n');
                    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
                    const link = document.createElement("a");
                    link.setAttribute("href", csvContent);
                    link.setAttribute("download", `meduman-waitlist-export-${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast('CSV Export database successfully dispatched!');
                  }}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-[11px] font-bold tracking-wider uppercase px-4 py-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Spreadsheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Quick add fake user for proof of capability
                    const names = ['Kelechi Nwosu', 'Fatima Bello', 'Farouk Diallo', 'Yene Assefah'];
                    const emails = ['nwosu@outlook.com', 'fati.b@gmail.ng', 'fdiallo@agency.gn', 'yene@trade.et'];
                    const pickedIdx = Math.floor(Math.random() * names.length);
                    const randId = `WM-${Math.floor(1000 + Math.random() * 9000)}`;
                    const mockEntry = {
                      id: randId,
                      fullName: names[pickedIdx],
                      email: emails[pickedIdx],
                      phone: '+234 815 999 8888',
                      userType: ['Buyer', 'Seller', 'Freelancer', 'Business'][pickedIdx],
                      mainChannel: ['Instagram', 'WhatsApp', 'Telegram', 'X/Twitter'][pickedIdx],
                      country: ['Nigeria', 'Ghana', 'Kenya', 'Ethiopia'][pickedIdx],
                      city: ['Lagos', 'Accra', 'Nairobi', 'Addis Ababa'][pickedIdx],
                      averageTransactionValue: '₦100,000 – ₦500,000',
                      consent: true,
                      createdAt: new Date().toISOString()
                    };
                    setWaitlistEntries([mockEntry, ...waitlistEntries]);
                    showToast(`Dispatched test user "${names[pickedIdx]}" successfully!`);
                  }}
                  className="bg-[#232F72] hover:bg-[#121358] text-white text-[11px] font-bold tracking-wider uppercase px-4 py-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Insert Trial Entity</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Dashboard Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Registrations */}
              <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="text-left space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Registered Profiles</span>
                  <p className="text-3xl font-extrabold text-[#081635]">{waitlistEntries.length}</p>
                  <p className="text-[9px] text-[#232F72] font-semibold">100% Biometric Compliant</p>
                </div>
                <div className="p-3 bg-[#232F72]/5 text-[#232F72] rounded-xl">
                  <User className="h-5 w-5" />
                </div>
              </div>

              {/* Buyer Ratio */}
              {(() => {
                const buyers = waitlistEntries.filter(e => e.userType.includes('Buyer') || e.userType === 'Both buyer and seller').length;
                return (
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="text-left space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Buyers</span>
                      <p className="text-3xl font-extrabold text-[#081635]">{buyers}</p>
                      <p className="text-[9px] text-emerald-600 font-semibold">{((buyers / Math.max(1, waitlistEntries.length)) * 100).toFixed(0)}% Escrow ratio</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Lock className="h-5 w-5" />
                    </div>
                  </div>
                );
              })()}

              {/* Seller Ratio */}
              {(() => {
                const sellers = waitlistEntries.filter(e => e.userType.includes('Seller') || e.userType.includes('Business') || e.userType === 'Both buyer and seller').length;
                return (
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="text-left space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Merchants / Sellers</span>
                      <p className="text-3xl font-extrabold text-[#081635]">{sellers}</p>
                      <p className="text-[9px] text-indigo-600 font-semibold">{((sellers / Math.max(1, waitlistEntries.length)) * 100).toFixed(0)}% Merchant ratio</p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>
                );
              })()}

              {/* Premium Signups */}
              {(() => {
                const highValue = waitlistEntries.filter(e => e.averageTransactionValue && (e.averageTransactionValue.includes('₦100,000') || e.averageTransactionValue.includes('Above'))).length;
                return (
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="text-left space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-semibold">High Value Vaults</span>
                      <p className="text-3xl font-extrabold text-[#081635]">{highValue}</p>
                      <p className="text-[9px] text-amber-600 font-bold">₦100k+ AVG. Deals</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Searching and table Filters block */}
            <div className="bg-white border border-gray-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shadow-sm text-left">
              {/* Search text input */}
              <div className="w-full sm:flex-1 space-y-1">
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Search spreadsheet columns</span>
                <input
                  type="text"
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  placeholder="Filter name, email or city credentials..."
                  className="w-full bg-[#F7F7F7] border border-gray-200 hover:border-gray-300 focus:border-[#232F72] rounded-xl px-4 py-2.5 text-xs focus:bg-white text-black transition-all focus:outline-none"
                />
              </div>

              {/* Segment Type Filter */}
              <div className="w-full sm:w-auto space-y-1">
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Category Segment</span>
                <select
                  value={adminUserTypeFilter}
                  onChange={(e: any) => setAdminUserTypeFilter(e.target.value)}
                  className="w-full sm:w-48 bg-[#F7F7F7] border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-black focus:outline-none focus:border-[#232F72] focus:bg-white"
                >
                  <option value="All">All Categories</option>
                  <option value="Buyer">Buyers</option>
                  <option value="Seller">Sellers</option>
                  <option value="Freelancer">Freelancers</option>
                  <option value="Business">Businesses</option>
                  <option value="Both buyer and seller">Hybrid Trades</option>
                </select>
              </div>

              {/* Country Filter selection */}
              <div className="w-full sm:w-auto space-y-1">
                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Origin Country</span>
                <select
                  value={adminCountryFilter}
                  onChange={(e) => setAdminCountryFilter(e.target.value)}
                  className="w-full sm:w-40 bg-[#F7F7F7] border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-black focus:outline-none focus:border-[#232F72] focus:bg-white"
                >
                  <option value="All">All Nations</option>
                  {Array.from(new Set(waitlistEntries.map(e => e.country))).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Registry table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAFBFD] border-b border-gray-200 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                      <th className="py-4 px-5">ID Code</th>
                      <th className="py-4 px-5">Participant Details</th>
                      <th className="py-4 px-5">Role Category</th>
                      <th className="py-4 px-5">Sales Channel</th>
                      <th className="py-4 px-5">Region</th>
                      <th className="py-4 px-5">Avg Transaction Value</th>
                      <th className="py-4 px-5">Registered At</th>
                      <th className="py-4 px-5 text-right">Operators</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Apply searching & filtering criteria
                      const filtered = waitlistEntries.filter(e => {
                        // 1. Search Query
                        const matchedSearch = 
                          e.fullName.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                          e.email.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                          (e.city && e.city.toLowerCase().includes(adminSearchQuery.toLowerCase())) ||
                          e.id.toLowerCase().includes(adminSearchQuery.toLowerCase());
                        
                        // 2. Category Filter
                        const matchedType = 
                          adminUserTypeFilter === 'All' || 
                          e.userType === adminUserTypeFilter;

                        // 3. Country Filter
                        const matchedCountry = 
                          adminCountryFilter === 'All' || 
                          e.country === adminCountryFilter;

                        return matchedSearch && matchedType && matchedCountry;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-xs text-gray-400 font-light">
                              No credential parameters match your search criteria. Try a different query.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((entry, idx) => (
                        <tr key={entry.id} className="border-b border-gray-150 hover:bg-gray-50/70 text-xs transition-colors">
                          {/* ID Code */}
                          <td className="py-4 px-5 font-mono text-gray-500 font-bold">{entry.id}</td>
                          
                          {/* Participant Details */}
                          <td className="py-4 px-5 text-left">
                            <div className="font-semibold text-[#081635]">{entry.fullName}</div>
                            <div className="text-[10px] text-gray-400 font-light">{entry.email}</div>
                            {entry.phone && <div className="text-[10px] text-gray-400 font-mono">{entry.phone}</div>}
                          </td>

                          {/* Role Category */}
                          <td className="py-4 px-5">
                            <span className={`inline-flex px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              entry.userType.includes('Buyer') ? 'bg-emerald-50 text-emerald-700' :
                              entry.userType.includes('Seller') ? 'bg-indigo-50 text-indigo-700' :
                              entry.userType.includes('Business') ? 'bg-[#232F72]/15 text-[#232F72]' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {entry.userType}
                            </span>
                          </td>

                          {/* Sales Channel */}
                          <td className="py-4 px-5 font-medium text-gray-600 text-left">{entry.mainChannel}</td>

                          {/* Region */}
                          <td className="py-4 px-5 text-gray-600 space-y-0.5 text-left font-light">
                            <div className="flex items-center space-x-1 font-medium">
                              <Globe className="h-3 w-3 text-gray-400 shrink-0" />
                              <span>{entry.country}</span>
                            </div>
                            {entry.city && (
                              <div className="flex items-center space-x-1 text-[10px] text-gray-400 font-light">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                <span>{entry.city}</span>
                              </div>
                            )}
                          </td>

                          {/* Avg Value */}
                          <td className="py-4 px-5 font-medium text-gray-650 text-left">{entry.averageTransactionValue || '—'}</td>

                          {/* Registered At */}
                          <td className="py-4 px-5 text-gray-400 font-light text-[10px] text-left">
                            {new Date(entry.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>

                          {/* Operators */}
                          <td className="py-4 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove custom waitlist entry ID ${entry.id}?`)) {
                                  setWaitlistEntries(waitlistEntries.filter(item => item.id !== entry.id));
                                  showToast(`Removed signature with credential token ${entry.id}`);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              Release Signature
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'brand-kit' && (
          <div className="max-w-6xl mx-auto px-6 py-16 space-y-16 animate-fadeIn">
            {/* Header Portion */}
            <div className="text-center space-y-4 max-w-2xl mx-auto flex flex-col items-center">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#22306E]/10 to-[#233392]/10 px-4 py-1.5 rounded-full border border-[#22306E]/15">
                <Sparkles className="h-4 w-4 text-[#22306E]" />
                <span className="text-[10px] font-bold text-[#22306E] uppercase tracking-widest">Meduman Brand Assets</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-extrabold text-[#071635]">
                Brand guidelines & assets.
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xl">
                Explore the visual identity of Meduman. View our color palettes, typography specifications, and copy or download official logo variations.
              </p>
            </div>

            {/* Logo Meaning / Visual Metaphor Showcase */}
            <div className="bg-white border border-gray-200/60 rounded-[32px] p-8 md:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-4 flex justify-center">
                <div className="p-8 bg-[#F7F7F7] rounded-3xl border border-gray-150/50 shadow-inner flex items-center justify-center w-56 h-56">
                  <MedumanLogo className="w-40 h-40 animate-float" variant="two-tone" />
                </div>
              </div>
              <div className="lg:col-span-8 space-y-6 text-left">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#22306E] bg-[#22306E]/5 px-2.5 py-1 rounded-full">Visual Metaphor</span>
                  <h3 className="text-xl font-bold text-[#071635]">The Escrow Symmetry Symbol</h3>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed">
                  The Meduman logo is a premium mark that visualizes the core mechanics of secure social commerce. 
                  It consists of two symmetrical stakeholder pillars—representing the **buyer** on the left and the **seller** on the right—reaching out to connect. 
                  In the center, they are linked by a double-headed, interlocking **escrow S-loop**. 
                  This double loop represents the protected transaction state: a secure flow where value is held safely in escrow and only releases when delivery is fully validated.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="border border-gray-150 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Left Pillar</span>
                    <span className="block text-xs font-bold text-[#071635]">Buyer Trust</span>
                  </div>
                  <div className="border border-gray-150 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Center S-Loop</span>
                    <span className="block text-xs font-bold text-[#22306E]">Escrow Flow</span>
                  </div>
                  <div className="border border-gray-150 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400">Right Pillar</span>
                    <span className="block text-xs font-bold text-[#071635]">Seller Guarantee</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Variations Grid */}
            <div className="space-y-6">
              <div className="text-left">
                <h3 className="text-lg font-bold text-[#071635]">Official Logo Variations</h3>
                <p className="text-xs text-gray-500">Select, copy, or download the exact variation that fits your layout.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                
                {/* Variant 1: Monochrome Black */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="h-44 w-full bg-white rounded-2xl flex items-center justify-center border border-gray-150/50 relative overflow-hidden group">
                      <MedumanLogo className="w-20 h-20 transition-transform duration-300 group-hover:scale-110" variant="black" />
                      <span className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider bg-white/90 border border-gray-200 px-2 py-0.5 rounded-full text-black">Mono Mark</span>
                    </div>
                    <div className="text-left space-y-1">
                      <h4 className="text-xs font-bold text-[#071635]">Monochrome Black</h4>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        A strict black mark for legal documents, simple print use, and high-contrast neutral placements.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] border-t border-b border-gray-100 py-2">
                      <span className="text-gray-400">Tone:</span>
                      <span className="font-mono font-bold text-black">BLACK</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getLogoUrl('black'));
                          showToast('Monochrome Black logo URL copied to clipboard');
                        }}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => {
                          downloadLogo('black', 'meduman-logo-black.png');
                          showToast('Downloaded meduman-logo-black.png');
                        }}
                        className="bg-[#22306E] hover:bg-[#071635] text-white py-2 px-3 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                        title="Download PNG"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Variant 2: Classic Indigo */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="h-44 w-full bg-[#F7F7F7] rounded-2xl flex items-center justify-center border border-gray-150/50 relative overflow-hidden group">
                      <MedumanLogo className="w-20 h-20 transition-transform duration-300 group-hover:scale-110" variant="navy" />
                      <span className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider bg-white/90 border border-gray-200 px-2 py-0.5 rounded-full text-[#0E0C5B]">Light Base</span>
                    </div>
                    <div className="text-left space-y-1">
                      <h4 className="text-xs font-bold text-[#071635]">Classic Indigo</h4>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        Our high-contrast primary branding option. Perfect for clean, print, or corporate communication.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] border-t border-b border-gray-100 py-2">
                      <span className="text-gray-400">Hex:</span>
                      <span className="font-mono font-bold text-[#0E0C5B]">#0E0C5B</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getLogoUrl('navy'));
                          showToast('Classic Indigo logo URL copied to clipboard');
                        }}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => {
                          downloadLogo('navy', 'meduman-logo-classic-indigo.png');
                          showToast('Downloaded meduman-logo-classic-indigo.png');
                        }}
                        className="bg-[#22306E] hover:bg-[#071635] text-white py-2 px-3 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                        title="Download PNG"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Variant 3: Slate Navy */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="h-44 w-full bg-white rounded-2xl flex items-center justify-center border border-gray-150/50 relative overflow-hidden group">
                      <MedumanLogo className="w-20 h-20 transition-transform duration-300 group-hover:scale-110" variant="dark" />
                      <span className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider bg-white/90 border border-gray-200 px-2 py-0.5 rounded-full text-[#071635]">Pure White Base</span>
                    </div>
                    <div className="text-left space-y-1">
                      <h4 className="text-xs font-bold text-[#071635]">Slate Navy</h4>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        Deepest slate navy. Optimized for headers, light background layouts, and stark content contrast.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] border-t border-b border-gray-100 py-2">
                      <span className="text-gray-400">Hex:</span>
                      <span className="font-mono font-bold text-[#071635]">#071635</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getLogoUrl('dark'));
                          showToast('Slate Navy logo URL copied to clipboard');
                        }}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => {
                          downloadLogo('dark', 'meduman-logo-slate-navy.png');
                          showToast('Downloaded meduman-logo-slate-navy.png');
                        }}
                        className="bg-[#22306E] hover:bg-[#071635] text-white py-2 px-3 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                        title="Download PNG"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Variant 4: Escrow Royal Blue */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="h-44 w-full bg-white rounded-2xl flex items-center justify-center border border-gray-150/50 relative overflow-hidden group">
                      <MedumanLogo className="w-20 h-20 transition-transform duration-300 group-hover:scale-110" variant="royal" />
                      <span className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider bg-white/90 border border-gray-200 px-2 py-0.5 rounded-full text-[#22306E]">Royal Accent</span>
                    </div>
                    <div className="text-left space-y-1">
                      <h4 className="text-xs font-bold text-[#071635]">Escrow Royal</h4>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        Our vibrant signature royal blue. Used for action items, buttons, and high-engagement digital spots.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] border-t border-b border-gray-100 py-2">
                      <span className="text-gray-400">Hex:</span>
                      <span className="font-mono font-bold text-[#22306E]">#22306E</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getLogoUrl('royal'));
                          showToast('Escrow Royal logo URL copied to clipboard');
                        }}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => {
                          downloadLogo('royal', 'meduman-logo-escrow-royal.png');
                          showToast('Downloaded meduman-logo-escrow-royal.png');
                        }}
                        className="bg-[#22306E] hover:bg-[#071635] text-white py-2 px-3 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                        title="Download PNG"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Variant 5: Sovereign Dark */}
                <div className="bg-white border border-gray-200/60 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="space-y-4">
                    <div className="h-44 w-full bg-[#0D0C52] rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden group">
                      <MedumanLogo className="w-20 h-20 transition-transform duration-300 group-hover:scale-110" variant="light-on-dark" />
                      <span className="absolute top-2 left-2 text-[8px] font-bold uppercase tracking-wider bg-[#233392]/20 border border-[#233392]/30 px-2 py-0.5 rounded-full text-white">Dark Base</span>
                    </div>
                    <div className="text-left space-y-1">
                      <h4 className="text-xs font-bold text-[#071635]">Sovereign Dark</h4>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        Vibrant royal blue logo on deep indigo background. Used for footer blocks and dark mode configurations.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] border-t border-b border-gray-100 py-2">
                      <span className="text-gray-400">Hex:</span>
                      <span className="font-mono font-bold text-[#233392]">#233392</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getLogoUrl('light-on-dark'));
                          showToast('Sovereign Dark logo URL copied to clipboard');
                        }}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => {
                          downloadLogo('light-on-dark', 'meduman-logo-sovereign-dark.png');
                          showToast('Downloaded meduman-logo-sovereign-dark.png');
                        }}
                        className="bg-[#22306E] hover:bg-[#071635] text-white py-2 px-3 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                        title="Download PNG"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Brand Colors Grid */}
            <div className="space-y-6">
              <div className="text-left">
                <h3 className="text-lg font-bold text-[#071635]">Brand Color System</h3>
                <p className="text-xs text-gray-500">The core tones that define our digital platform interfaces.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                
                <div className="border border-gray-150 rounded-2xl p-4 text-left space-y-3 bg-white">
                  <div className="h-12 w-full rounded-lg bg-[#0E0C5B] border border-gray-200/10"></div>
                  <div>
                    <span className="block text-[9px] font-bold uppercase text-gray-400">Sovereign Navy</span>
                    <span className="block text-xs font-bold text-[#071635]">#0E0C5B</span>
                  </div>
                </div>

                <div className="border border-gray-150 rounded-2xl p-4 text-left space-y-3 bg-white">
                  <div className="h-12 w-full rounded-lg bg-[#22306E] border border-gray-200/10"></div>
                  <div>
                    <span className="block text-[9px] font-bold uppercase text-gray-400">Escrow Blue</span>
                    <span className="block text-xs font-bold text-[#071635]">#22306E</span>
                  </div>
                </div>

                <div className="border border-gray-150 rounded-2xl p-4 text-left space-y-3 bg-white">
                  <div className="h-12 w-full rounded-lg bg-[#071635] border border-gray-200/10"></div>
                  <div>
                    <span className="block text-[9px] font-bold uppercase text-gray-400">Slate Navy</span>
                    <span className="block text-xs font-bold text-[#071635]">#071635</span>
                  </div>
                </div>

                <div className="border border-gray-150 rounded-2xl p-4 text-left space-y-3 bg-white">
                  <div className="h-12 w-full rounded-lg bg-[#0D0C52] border border-gray-200/10"></div>
                  <div>
                    <span className="block text-[9px] font-bold uppercase text-gray-400">Indigo Dark</span>
                    <span className="block text-xs font-bold text-[#071635]">#0D0C52</span>
                  </div>
                </div>

                <div className="border border-gray-150 rounded-2xl p-4 text-left space-y-3 bg-white text-left col-span-2 lg:col-span-1">
                  <div className="h-12 w-full rounded-lg bg-[#233392] border border-gray-200/10"></div>
                  <div>
                    <span className="block text-[9px] font-bold uppercase text-gray-400">Action Blue</span>
                    <span className="block text-xs font-bold text-[#071635]">#233392</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Brand Typography specification */}
            <div className="bg-white border border-gray-200/60 rounded-[32px] p-8 md:p-12 text-left space-y-8 shadow-sm">
              <div className="space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#22306E] bg-[#22306E]/5 px-2.5 py-1 rounded-full">Typography Specs</span>
                <h3 className="text-lg font-bold text-[#071635]">Brand Typography Guidelines</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block border-b pb-2">Space Grotesk (Headers)</span>
                  <div className="space-y-2">
                    <p className="font-display font-light text-2xl tracking-tight text-[#071635]">Light Tracking Heading</p>
                    <p className="font-display font-bold text-2xl text-[#071635]">Bold Display Heading</p>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Used for large marketing headers and display statements. Space Grotesk offers geometric structure that fits our technological escrow platform.
                  </p>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block border-b pb-2">Plus Jakarta Sans / Inter (Body & Controls)</span>
                  <div className="space-y-2">
                    <p className="font-sans font-medium text-sm text-[#071635]">Medium Interactive Label</p>
                    <p className="font-sans text-xs text-gray-500 leading-relaxed">
                      This body text demonstrates how body elements render in Plus Jakarta Sans. It's clean, legible, and optimized for data density in dashboards.
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Used for dashboards, forms, system prompts, table fields, and core descriptions to maintain maximum text clarity on small mobile screens.
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Home CTA */}
            <div className="pt-4">
              <button
                onClick={() => navigateTo('home')}
                className="bg-gray-150 hover:bg-gray-200 border border-gray-200 text-[#071635] text-xs font-bold tracking-wider uppercase px-8 py-3.5 rounded-xl transition-all inline-flex items-center space-x-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Portal</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ==================== 3. FOOTER ==================== */}
      <footer className="bg-[#0D0C52] text-white pt-16 pb-12 px-6 z-20 relative border-t border-[#233392]/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-white/[0.08] text-left">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <MedumanLogo className="h-6 w-6" variant="light-on-dark" />
              <span className="font-display font-extrabold tracking-wider text-white text-sm">
                MEDUMAN
              </span>
            </div>
            <p className="text-xs text-gray-400 font-light leading-relaxed max-w-xs">
              Symmetric billing and protection systems architecture built specifically for peer commerce inside Africa.
            </p>
          </div>

          <div className="space-y-3.5">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#232F72]">Company Pathways</span>
            <ul className="space-y-2 text-xs text-gray-400 font-light">
              <li><button onClick={() => navigateTo('home')} className="hover:text-white transition-colors cursor-pointer text-left">Core Portal</button></li>
              <li><button onClick={() => navigateTo('how-it-works')} className="hover:text-white transition-colors cursor-pointer text-left">Processes</button></li>
              <li><button onClick={() => navigateTo('security')} className="hover:text-white transition-colors cursor-pointer text-left">Security Framework</button></li>
              <li><button onClick={() => navigateTo('brand-kit')} className="hover:text-white transition-colors cursor-pointer text-left">Brand Kit</button></li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#232F72]">Target Pathways</span>
            <ul className="space-y-2 text-xs text-gray-400 font-light">
              <li><button onClick={() => navigateTo('for-buyers')} className="hover:text-white transition-colors cursor-pointer text-left">Buyer Protections</button></li>
              <li><button onClick={() => navigateTo('for-sellers')} className="hover:text-white transition-colors cursor-pointer text-left">Seller Growth Hub</button></li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#232F72]">Direct Compliance</span>
            <p className="text-gray-400 text-xs font-light leading-relaxed">
              Protected escrow assets sit isolated directly within Central Bank of Nigeria regulated partner depository bank vaults.
            </p>
          </div>

        </div>

        <div className="max-w-6xl mx-auto pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-400 text-left">
          <p>© 2026 Meduman Security Systems. Certified Escrow.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 font-light">
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">Privacy Protocol</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-white">Terms of Custody</a>
          </div>
        </div>
      </footer>

      {/* ======================================================= */}
      {/* 4. ACTIVE TRANSACTION SANDBOX INTERACTIVE MODAL         */}
      {/* ======================================================= */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 bg-[#081635]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-gray-200/80 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl space-y-0 relative text-left">
            
            {/* Header portion */}
            <div className="border-b border-gray-150 p-6 flex justify-between items-center bg-[#F7F7F7]">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400">Meduman Live Sandbox</span>
                <h3 className="text-base font-extrabold text-[#081635] flex items-center gap-2">
                  <span>P2P Secured Escrow Process</span>
                  <Lock className="h-4 w-4 text-[#232F72]" />
                </h3>
              </div>
              <button 
                onClick={() => { setIsSimulatorOpen(false); resetSimulator(); }}
                className="text-gray-400 hover:text-black p-2 hover:bg-gray-200 rounded-full transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulated Stages content body */}
            <div className="p-6 space-y-6">
              
              {/* Step indicator */}
              <div className="flex items-center justify-between bg-[#F7F7F7] p-3 rounded-2xl text-[11px]">
                <span className={`font-bold ${simStep >= 1 ? 'text-[#232F72]' : 'text-gray-405'}`}>1. Init Terms</span>
                <ChevronRight className="h-4.5 w-4.5 text-gray-300" />
                <span className={`font-bold ${simStep >= 2 ? 'text-[#232F72]' : 'text-gray-405'}`}>2. Store Deposit</span>
                <ChevronRight className="h-4.5 w-4.5 text-gray-300" />
                <span className={`font-bold ${simStep >= 3 ? 'text-[#232F72]' : 'text-gray-405'}`}>3. OTP Release</span>
              </div>

              {simStep === 1 && (
                <div className="space-y-4">
                  <span className="text-xs uppercase font-extrabold text-gray-400 block pb-1 border-b">Specify active parameters</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Interactive Role</label>
                      <select 
                        value={simRole}
                        onChange={(e) => setSimRole(e.target.value as any)}
                        className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs w-full text-black focus:outline-none"
                      >
                        <option value="buyer">I am Buyer</option>
                        <option value="seller">I am Seller</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Product Amount (₦)</label>
                      <input 
                        type="text" 
                        value={simPrice}
                        onChange={(e) => setSimPrice(e.target.value)}
                        className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs w-full text-black focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Product Label</label>
                    <input 
                      type="text" 
                      value={simProduct}
                      onChange={(e) => setSimProduct(e.target.value)}
                      className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs w-full text-black focus:outline-none"
                    />
                  </div>
                  
                  <button 
                    onClick={() => setSimStep(2)}
                    className="w-full bg-[#232F72] hover:bg-[#121358] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all"
                  >
                    Lock Protection Escrow Terms
                  </button>
                </div>
              )}

              {simStep === 2 && (
                <div className="space-y-4">
                  <span className="text-xs uppercase font-extrabold text-gray-400 block pb-1 border-b">Assets Safeguarded</span>
                  
                  <div className="bg-emerald-50 border border-emerald-200/50 p-4 rounded-2xl text-left space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-150 px-2 py-0.5 rounded uppercase">Isolated Vault State</span>
                      <span className="text-xs font-extrabold text-emerald-900">₦{simPrice}</span>
                    </div>
                    <p className="text-xs text-emerald-800 font-light">
                      The deposit is locked inside our CBN regulated vault. If seller fails courier dispatch constraints, value returns automatically.
                    </p>
                  </div>

                  <div className="bg-[#F7F7F7] p-3 rounded-xl text-left border border-gray-150">
                    <span className="block text-[10px] text-gray-400">ACTIVE PRODUCT TARGETS</span>
                    <span className="text-xs font-bold block mt-0.5 text-[#081635]">{simProduct}</span>
                  </div>

                  <button 
                    onClick={() => setSimStep(3)}
                    className="w-full bg-[#232F72] hover:bg-[#121358] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all"
                  >
                    Confirm Delivery Dispatch
                  </button>
                </div>
              )}

              {simStep === 3 && (
                <div className="space-y-4">
                  <span className="text-xs uppercase font-extrabold text-gray-400 block pb-1 border-b">OTP Security check</span>
                  
                  {!simCompleted ? (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 font-light leading-relaxed">
                        The buyer has shared the confidential release code [7420] following positive courier item inspection. Enter code below to payout merchant.
                      </p>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 block">OTP Code (Hint: 7420)</label>
                        <div className="flex space-x-2">
                          <input 
                            type="text" 
                            value={simOtp}
                            onChange={(e) => {
                              setSimOtp(e.target.value);
                              setSimOtpError(false);
                            }}
                            placeholder="Type index digit"
                            className="bg-[#F7F7F7] border border-gray-300 rounded-xl px-4 py-3 text-xs w-full font-bold focus:outline-none focus:border-[#232F72]"
                          />
                          <button 
                            onClick={() => {
                              if (simOtp === '7420') {
                                setSimCompleted(true);
                              } else {
                                setSimOtpError(true);
                              }
                            }}
                            className="bg-[#232F72] text-white text-xs font-bold uppercase px-5 py-3 rounded-xl"
                          >
                            Submit
                          </button>
                        </div>
                        {simOtpError && (
                          <span className="text-rose-500 text-[10px] block">Invalid key entered. Type 7420.</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-gray-900">Protected Escrow Resolved Successfully</h4>
                        <p className="text-xs text-gray-500 font-light">
                          Verified. Seller payout of ₦{simPrice} cleared and distributed to destination.
                        </p>
                      </div>
                      <button 
                        onClick={() => { setIsSimulatorOpen(false); resetSimulator(); }}
                        className="w-full bg-[#081635] text-white text-xs font-bold uppercase py-3 rounded-xl"
                      >
                        Finish Simulation
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 5. REUSABLE WAITLIST REGISTRATION MODAL                 */}
      {/* ======================================================= */}
      {isWaitlistModalOpen && (
        <div className="fixed inset-0 bg-[#081635]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
          <div className="bg-white border border-gray-200/85 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl relative">
            {/* Header portion */}
            <div className="border-b border-gray-150 p-6 flex justify-between items-center bg-[#F7F7F7]">
              <div className="flex items-center space-x-3.5">
                <MedumanLogo className="h-9 w-9" variant="two-tone" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Exclusive Membership</span>
                  <h3 className="text-base font-extrabold text-[#081635] flex items-center gap-1.5">
                    <span>Join Onboarding Queue</span>
                    <Sparkles className="h-4 w-4 text-[#232F72]" />
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsWaitlistModalOpen(false);
                  setModalSuccess(false);
                  setModalValidationError(null);
                }}
                className="text-gray-400 hover:text-black p-2 hover:bg-gray-200 rounded-full transition-all cursor-pointer"
                type="button"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {modalSuccess ? (
                /* Modal Success State */
                <div className="space-y-6 text-center py-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Onboarding Signature Authorized</span>
                    <h4 className="text-lg font-bold text-[#081635]">Waitlist Seat Reserved</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                      Your position is safely secured. We've recorded your DM protection segment parameters. Onboarding dispatch will reach out soon.
                    </p>
                  </div>

                  {/* Share button action */}
                  <div className="border-t border-gray-100 pt-5 space-y-3">
                    <button
                      onClick={() => {
                        const referralTxt = `I just pre-registered for secure social commerce lock protection on Meduman. Join the waitlist: ${window.location.origin}`;
                        navigator.clipboard.writeText(referralTxt);
                        showToast('Referral copy confirmed.');
                      }}
                      className="w-full bg-[#232F72] hover:bg-[#121358] text-white text-xs font-bold uppercase py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy Referral Invite</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsWaitlistModalOpen(false);
                        setModalSuccess(false);
                      }}
                      className="text-xs text-[#232F72] font-semibold hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Return to Website
                    </button>
                  </div>
                </div>
              ) : (
                /* Modal Form State */
                <form onSubmit={handleShortWaitlistSubmit} className="space-y-5">
                  {modalValidationError && (
                    <div className="bg-rose-50 border border-rose-250 p-3.5 rounded-xl flex items-start space-x-2.5 text-rose-800">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p className="text-xs leading-relaxed font-medium">{modalValidationError}</p>
                    </div>
                  )}

                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="modal-name-input" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name *</label>
                    <input 
                      id="modal-name-input"
                      type="text"
                      required
                      value={modalForm.fullName}
                      onChange={(e) => setModalForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="e.g. Kolawole Aluko"
                      className="w-full bg-[#F7F7F7] border border-gray-200 hover:border-gray-300 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="modal-email-input" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address *</label>
                    <input 
                      id="modal-email-input"
                      type="email"
                      required
                      value={modalForm.email}
                      onChange={(e) => setModalForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. aluko@onlinedeals.com"
                      className="w-full bg-[#F7F7F7] border border-gray-200 hover:border-gray-300 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Joining as segment */}
                    <div className="space-y-1.5">
                      <label htmlFor="modal-segment-select" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Segment Category *</label>
                      <select
                        id="modal-segment-select"
                        required
                        value={modalForm.userType}
                        onChange={(e) => setModalForm(prev => ({ ...prev, userType: e.target.value }))}
                        className="w-full bg-[#F7F7F7] border border-gray-200 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                      >
                        <option value="Buyer">Buyer (Buying in DMs)</option>
                        <option value="Seller">Seller (Vendor/Individual)</option>
                        <option value="Freelancer">Freelancer (Trade protective checkouts)</option>
                        <option value="Business">Business Hub (API & Integrations)</option>
                        <option value="Both buyer and seller">Both Buyer & Seller</option>
                      </select>
                    </div>

                    {/* Channel */}
                    <div className="space-y-1.5">
                      <label htmlFor="modal-channel-select" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Primary Channel *</label>
                      <select
                        id="modal-channel-select"
                        required
                        value={modalForm.mainChannel}
                        onChange={(e) => setModalForm(prev => ({ ...prev, mainChannel: e.target.value }))}
                        className="w-full bg-[#F7F7F7] border border-gray-200 focus:border-[#232F72] focus:bg-white rounded-xl px-4 py-3 text-xs text-black transition-all focus:outline-none focus:ring-1 focus:ring-[#232F72]"
                      >
                        <option value="WhatsApp">WhatsApp Chat</option>
                        <option value="Instagram">Instagram DM</option>
                        <option value="Facebook Marketplace">Facebook Marketplace</option>
                        <option value="Telegram">Telegram Group</option>
                        <option value="Other">Other DM / Feeds</option>
                      </select>
                    </div>
                  </div>

                  {/* Consent checkbox */}
                  <div className="flex items-start space-x-2.5 pt-1.5">
                    <input 
                      id="modal-consent-checkbox"
                      type="checkbox"
                      required
                      checked={modalForm.consent}
                      onChange={(e) => setModalForm(prev => ({ ...prev, consent: e.target.checked }))}
                      className="h-4 w-4 mt-0.5 rounded border-gray-300 text-[#232F72] focus:ring-[#232F72] cursor-pointer"
                    />
                    <label htmlFor="modal-consent-checkbox" className="text-[11px] text-gray-500 leading-normal select-none cursor-pointer">
                      I agree to receive invitation onboarding credentials from Meduman. Standard regulatory escrow applies. *
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={isModalSubmitting}
                      className="w-full bg-[#232F72] hover:bg-[#121358] disabled:bg-[#232F72]/60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <span>{isModalSubmitting ? 'Securing Card...' : 'Secure Onboarding Card'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
