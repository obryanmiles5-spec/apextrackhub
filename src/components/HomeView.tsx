import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Globe, Shield, Anchor, Zap, Plane, Truck, ClipboardList, 
  CheckCircle2, Star, ChevronDown, ChevronUp, Award, ArrowLeft, ArrowRight, Play, Pause
} from 'lucide-react';
import { Shipment } from '../types';
import { captureEvent } from '../lib/tracking';

interface HomeViewProps {
  onSearch: (trackingId: string) => void;
  availableShipments: Shipment[];
  isAdminAuthenticated?: boolean;
}

const BRANDS = [
  { name: 'Boeing Aerospace', industry: 'Aero Trans Carrier' },
  { name: 'Caterpillar Inc.', industry: 'Heavy Equipment' },
  { name: 'Ford Motor Co.', industry: 'Automotive Freight' },
  { name: 'General Electric', industry: 'Energy & Power' },
  { name: 'Siemens Industrial', industry: 'Systems & Control' },
  { name: 'Intel Semiconductors', industry: 'Microchip Cargo' },
  { name: 'John Deere & Co.', industry: 'Agricultural Logistics' },
  { name: 'Chevron Corp.', industry: 'Fuel Surcharge Partners' },
  { name: 'Samsung Electronics', industry: 'Tech Supply Chains' },
  { name: 'Maersk Line', industry: 'Maritime Shipping' }
];

const REVIEWS = [
  {
    title: "Absolutely Flawless Bulk Delivery",
    text: "We migrated our bulk automotive imports to Apex Trans, and the customs clearance has been exemplary. The tracking records update exactly as the ship reaches coordinate waypoints.",
    author: "Marcus Vance",
    role: "Director of Supply Chain, Autotech US",
    rating: 5
  },
  {
    title: "C-TPAT Priority is a Game Changer",
    text: "Apex's Tier III compliance saved our reefer containers from cargo spoilage. What usually took 5 days at Houston port now gets cleared and loaded in under 4 hours.",
    author: "Sarah Jenkins",
    role: "Logistics Specialist, FreshFoods Co.",
    rating: 5
  },
  {
    title: "Amazing Customer Care & Precision",
    text: "Our high-value scientific cargo was tracked 24/7 with the GPS beacon system. Whenever we had a compliance audit question, the central desk helped us within minutes.",
    author: "Dr. Albert Chen",
    role: "Operations VP, BioLabs Intercontinental",
    rating: 5
  },
  {
    title: "Flawless API Syncing",
    text: "The WooCommerce API integration is incredibly robust. Our e-commerce customers automatically receive tracking updates without our staff needing to perform manual entries.",
    author: "Elena Rostova",
    role: "Global Logistics Manager, NordTech Solutions",
    rating: 5
  },
  {
    title: "Industrial Cargo Specialists",
    text: "Apex safely transported 120 tons of heavy assembly machinery from Rotterdam to Dallas. Impeccable coordination of heavy-haul flatbeds and oversize permits.",
    author: "Thomas Wright",
    role: "VP of Procurement, Zenith Manufacturing",
    rating: 5
  },
  {
    title: "Incredible Customs Clearance",
    text: "Their customs brokerage in Los Angeles cleared our massive textiles shipment overnight. Saved us thousands in demurrage fees and kept our retail launch on schedule.",
    author: "Aisha Rahman",
    role: "Supply Chain Director, Silk Road Exports",
    rating: 5
  },
  {
    title: "Express Air Freight Savior",
    text: "We had a critical assembly line shutdown in Munich. Apex arranged next-flight-out charter space, delivering essential turbine components in under 36 hours.",
    author: "Klaus Meyer",
    role: "Logistics Lead, AeroParts Group Hamburg",
    rating: 5
  },
  {
    title: "Last-Mile Perfection",
    text: "Their metropolitan distribution fleet handles our daily inventory runs with perfect timing, clear communication, and impeccable electronic sign-off systems.",
    author: "Devon Miller",
    role: "Operations Manager, Apex Retail Distributors",
    rating: 5
  },
  {
    title: "Temperature Chain Mastery",
    text: "Our organic coffee shipments require strict temperature control. Apex provided complete hour-by-hour telemetry data logs showing perfect environmental stability.",
    author: "Carla Sanchez",
    role: "Import/Export Specialist, Andes Coffee Co.",
    rating: 5
  },
  {
    title: "Unmatched Reliability",
    text: "After trying three other major logistics carriers, Apex Trans stands out as the most punctual, professional, and transparent. We're moving all our shipping lanes to them.",
    author: "Jameson O'Connor",
    role: "Director of Operations, WestCoast Logistics",
    rating: 5
  }
];

export default function HomeView({ onSearch, availableShipments, isAdminAuthenticated = false }: HomeViewProps) {
  const [searchVal, setSearchVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Review Slider States
  const [reviewIdx, setReviewIdx] = useState(0);
  const [autoplayReviews, setAutoplayReviews] = useState(true);

  useEffect(() => {
    if (!autoplayReviews) return;
    const interval = setInterval(() => {
      setReviewIdx((prev) => (prev + 1) % REVIEWS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [autoplayReviews]);

  const nextReview = () => {
    setReviewIdx((prev) => (prev + 1) % REVIEWS.length);
  };

  const prevReview = () => {
    setReviewIdx((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  const getVisibleReviews = () => {
    const items = [];
    for (let i = 0; i < 3; i++) {
      const idx = (reviewIdx + i) % REVIEWS.length;
      items.push({ ...REVIEWS[idx], originalIndex: idx });
    }
    return items;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) {
      setErrorMsg('Please enter a valid tracking number.');
      captureEvent("home_search_error", { reason: "empty_query" }).catch(() => {});
      return;
    }
    setErrorMsg('');
    onSearch(searchVal.trim());
    captureEvent("home_search_submit", { trackingId: searchVal.trim() }).catch(() => {});
  };

  const fillDemoId = (id: string) => {
    setSearchVal(id);
    setErrorMsg('');
    captureEvent("home_demo_id_selected", { trackingId: id }).catch(() => {});
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white rounded-3xl mx-4 lg:mx-8">
        {/* Background Image with Dark Tint Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://lh3.googleusercontent.com/d/1Tuc1DLWlbBxrea70p-km4ojzLuy82cYR"
            alt="Elite Global Freight Cargo Ship"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-75 scale-105 transform hover:scale-100 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 lg:py-28 flex flex-col items-start space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-400/35 rounded-full text-sky-300 text-xs sm:text-sm font-medium tracking-wide uppercase"
          >
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            USA-Based Elite Intercontinental Cargo Network
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-sans font-bold tracking-tight text-white leading-tight max-w-3xl"
          >
            Real-Time Logistics <br/>
            <span className="text-sky-400">Precision Shipment Tracking</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-300 text-lg max-w-2xl leading-relaxed font-sans"
          >
            Track domestic and international freight, secure custom maritime cargo, air transport, and localized high-priority parcels instantly from a unified modern portal.
          </motion.p>

          {/* Search Track Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-2xl"
          >
            <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row gap-2 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-700/60 backdrop-blur-md shadow-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Enter tracking number (e.g. US-9482-9018, US-3810-7749)..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-transparent border-0 text-white focus:ring-0 focus:outline-hidden placeholder-slate-400 font-mono text-sm tracking-widest uppercase"
                />
              </div>
              <button
                type="submit"
                className="bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-slate-950 font-sans font-semibold px-6 py-3.5 rounded-xl transition duration-150 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                Track Cargo
              </button>
            </form>
            {errorMsg && (
              <p className="text-rose-400 text-xs mt-2 font-medium px-1 flex items-center gap-1">
                ⚠️ {errorMsg}
              </p>
            )}

            {/* Quick Demo Links */}
            {isAdminAuthenticated && (
              <div className="mt-4 flex flex-wrap gap-2 items-center text-xs">
                <span className="text-slate-400 font-sans mr-1">Demo Shipments:</span>
                {availableShipments.filter(s => s.visibility !== 'hidden').slice(0, 3).map((shipment) => (
                  <button
                    key={shipment.id}
                    onClick={() => fillDemoId(shipment.id)}
                    className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/85 text-sky-300 hover:text-white rounded-lg transition border border-slate-700/40 font-mono cursor-pointer"
                  >
                    {shipment.id} ({shipment.status.replace('_', ' ')})
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Infinite Rotating Brand Logos Slider */}
      <section className="bg-slate-900 py-6 overflow-hidden relative border-y border-slate-800 mx-4 lg:mx-8 rounded-3xl">
        {/* Left & Right gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-6 mb-4 text-center">
          <p className="text-[10px] uppercase font-mono tracking-widest text-sky-400 font-bold opacity-75">
            Trusted Carrier & Intermodal Partner for Global Leaders
          </p>
        </div>

        <div className="flex w-full relative">
          <motion.div
            className="flex gap-16 whitespace-nowrap px-4"
            animate={{ x: [0, -2000] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 35
            }}
          >
            {[...BRANDS, ...BRANDS, ...BRANDS, ...BRANDS].map((brand, bIdx) => (
              <div key={bIdx} className="flex items-center gap-3 select-none hover:opacity-100 opacity-50 transition duration-300">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400 font-mono font-bold tracking-tighter shadow-inner">
                  {brand.name.split(' ')[0].substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-white font-sans font-bold text-xs sm:text-sm tracking-wide">{brand.name}</span>
                  <span className="text-slate-400 text-[9px] font-mono uppercase tracking-widest leading-none mt-0.5">{brand.industry}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trust Statistics Strip */}
      <section className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { metric: '99.94%', description: 'Tracking Accuracy Rating', icon: Shield },
          { metric: '190+', description: 'Supported Countries & Ports', icon: Globe },
          { metric: '5.4M+', description: 'Annual Cargo Deliveries', icon: DirectUploadIcon },
          { metric: '0.02%', description: 'Worldwide Cargo Discrepancy', icon: Zap },
        ].map((stat, idx) => {
          return (
            <div key={idx} className="flex flex-col items-center text-center p-6 bg-white border border-slate-100 rounded-2xl shadow-xs transition hover:shadow-md">
              <span className="p-3 bg-sky-50 rounded-full text-sky-600 mb-3">
                {React.createElement(stat.icon || CheckCircle2, { className: "w-5 h-5" })}
              </span>
              <span className="text-2xl sm:text-3xl font-sans font-bold text-slate-900 tracking-tight">{stat.metric}</span>
              <span className="text-slate-500 text-xs sm:text-sm mt-1 max-w-[150px]">{stat.description}</span>
            </div>
          );
        })}
      </section>

      {/* Logistics Showcase Section with visual references */}
      <section className="bg-slate-50 py-16 px-6 rounded-3xl mx-4 lg:mx-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-sky-600 font-semibold font-sans">Core Operations</h2>
            <p className="text-3xl font-bold font-sans text-slate-900 tracking-tight">Heavy Duty Cargo Solutions</p>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">Our USA-based central stations command sea, air, and land logistics through custom software monitoring frameworks.</p>
          </div>

          {/* Award-Winning Logistics Showcase Banner */}
          <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-250/85 bg-white p-6 sm:p-10 lg:p-12 shadow-sm relative">
            {/* Subtle background abstract aura */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
              {/* Left Column: Image with golden highlight container */}
              <div className="md:col-span-5 w-full">
                <div className="relative w-full h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-50/70 via-slate-50 to-orange-50/50 flex items-center justify-center border border-amber-200/60 shadow-xs group">
                  {/* Glowing background aura inside the container */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15),transparent_70%)] pointer-events-none"></div>
                  
                  {/* Corner accents for premium framed look */}
                  <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400/60 rounded-tl-sm"></div>
                  <div className="absolute top-3 right-3 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400/60 rounded-tr-sm"></div>
                  <div className="absolute bottom-3 left-3 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400/60 rounded-bl-sm"></div>
                  <div className="absolute bottom-3 right-3 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400/60 rounded-br-sm"></div>

                  <img 
                    src="https://lh3.googleusercontent.com/d/10vupV5zU8HMGNNs7OWnaf1OEu6CEyWYh" 
                    alt="National Logistics Excellence Award Winner Medal" 
                    referrerPolicy="no-referrer"
                    className="max-w-[82%] max-h-[82%] object-contain drop-shadow-[0_10px_15px_rgba(245,158,11,0.12)] transform group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 ease-out"
                  />
                  
                  {/* Verified Ribbon Badge */}
                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-400 px-3 py-1 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-widest border border-amber-500/30 shadow-md">
                    ★ Tier-1 Certified ★
                  </span>
                </div>
              </div>

              {/* Right Column: Detailed copy & Honors metrics */}
              <div className="md:col-span-7 space-y-6 text-left">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-400/35 text-amber-900 text-xs font-bold font-sans uppercase rounded-full">
                    <Award className="w-4 h-4 text-amber-600 animate-bounce" /> National Logistics Honors
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-sans font-extrabold text-slate-950 tracking-tight leading-tight">
                    National Logistics <br className="hidden sm:inline" /> Excellence Honors Winner
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-sans">
                    Apex Trans has been awarded the prestigious **National Logistics Excellence** honors, representing the pinnacle of domestic and maritime carrier achievements. This award distinguishes our industry-leading intermodal precision, custom-engineered tracking telemetry, and 100% port release compliance rate.
                  </p>
                </div>

                {/* Sub-metrics/Achievements grid to enrich the award */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm font-sans">#1 Compliance Standard</h4>
                      <p className="text-slate-500 text-[11px] sm:text-xs leading-normal mt-0.5">Top safety audit rankings across major USA intermodal ports.</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm font-sans">Satellite Integration</h4>
                      <p className="text-slate-500 text-[11px] sm:text-xs leading-normal mt-0.5">Continuous GPS tracking with instant sub-minute telemetry updates.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Sea Logistics Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 group border border-slate-100">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src="https://lh3.googleusercontent.com/d/1-47OmBDMXE1mH5CL_ruAj_BxgRk1FCc5" 
                  alt="Ocean Maritime Vessel" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 right-4 bg-sky-500 text-slate-950 font-sans font-semibold text-xs py-1 px-3 rounded-full uppercase tracking-wider">Oceanic Freight</span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold text-slate-900">Ground dispatch</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Handling multi-ton sea container freighters across Atlantic and Pacific pathways. Customized refrigerated units are monitored hour-by-hour.</p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Anchor className="w-4 h-4 text-sky-500" /> Seattle / Houston / Long Beach Hubs
                </div>
              </div>
            </div>

            {/* Air Cargo Card - Priority Jet Expeditions */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 group border border-slate-100">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src="https://lh3.googleusercontent.com/d/1xWrKYwWYr3bVfPFwojWKAHU3GwnwPV2B" 
                  alt="Charter Aeroplane loading logistics"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 right-4 bg-emerald-500 text-white font-sans font-semibold text-xs py-1 px-3 rounded-full uppercase tracking-wider">Air Transport</span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold text-slate-900">Priority Jet Expeditions</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-sans">When deadlines dictate swift transport. Over-night and high-trust intercontinental flight clearance routes for urgent technical cargo.</p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Plane className="w-4 h-4 text-emerald-500" /> High-Clearance Airport Networks
                </div>
              </div>
            </div>

            {/* Land Logistics Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 group border border-slate-100">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src="https://lh3.googleusercontent.com/d/1lcfvy5LLY2K8pg-p5F9WeDTVktiVYIXK" 
                  alt="Delivery Truck highway shipment" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 right-4 bg-orange-500 text-white font-sans font-semibold text-xs py-1 px-3 rounded-full uppercase tracking-wider">Ground Express</span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold text-slate-900">Last-Mile Interstate Fleet</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-sans">A modern commercial truck fleet connecting urban terminals and sorting docks with high fuel efficiency and automated GPS dispatch maps.</p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Truck className="w-4 h-4 text-orange-500" /> Full-Coverage US Interstates
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Advantages / Values */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-sky-600 font-sans font-semibold text-xs uppercase tracking-widest">Why Logistics Clients Select Us</span>
            <h2 className="text-3xl font-bold font-sans tracking-tight text-slate-900">Uncompromising Fidelity from Port to Front Door</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              Global shipment is not merely shifting weight from port A to port B. It demands detailed documentation safeguards, continuous temperature integrity checkups, customs brokerage accelerators, and absolute local control over delivery schedules. We remove the uncertainty.
            </p>

            <div className="space-y-4 pt-2">
              {[
                { title: 'Full WooCommerce Integration Ready', text: 'Admins handle tracking records via a real WooCommerce-styled core portal to modify states, update locations, and check values in real time.' },
                { title: 'USA-based Legal Customs Clearance', text: 'Our brokers work straight at major US ports (LA, Long Beach, Newark) for fast automated release timelines.' },
                { title: 'Automated Status Alert Milestones', text: 'Instantly updates your customers at each progress stage from pickup, high-seas transit, customs audit, to the signed handoff.' },
              ].map((adv, idx) => (
                <div key={idx} className="flex gap-4">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{adv.title}</h4>
                    <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{adv.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white p-8 space-y-6 border border-slate-800">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full filter blur-3xl"></div>
            <h3 className="text-lg font-bold font-sans flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-sky-400" /> Active Cargo Safety Protocols
            </h3>
            <p className="text-xs text-slate-300">Our logistics centers operate under critical federal guidelines to prevent cargo tampering and support instant tracking accuracy:</p>
            
            <div className="space-y-3">
              {[
                { label: 'Container Seal Verification', stat: '100% inspected upon arrival' },
                { label: 'Dynamic Temperature Auditing', stat: 'Logfiles registered every 4 mins' },
                { label: 'Licensed Customs Brokerage', stat: 'In-house agents in 14 US ports' },
                { label: 'Active GPS Beacon Overlays', stat: 'Available on all high-value items (> $10k)' },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="text-sky-300 font-semibold">{item.stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trustpilot Reviews Section - Revolution Slider Rotating Automatically */}
      <section className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pb-2 border-b border-slate-100">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1 text-emerald-500">
              <span className="font-bold text-slate-900 mr-2 font-sans text-sm sm:text-base">Rated Excellent on</span>
              <Star className="w-5 h-5 fill-emerald-500 text-emerald-500" />
              <span className="font-extrabold text-slate-900 tracking-tight font-sans text-lg">Trustpilot</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-1 text-xs">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className="w-4 h-4 bg-emerald-500 rounded-xs flex items-center justify-center text-white text-[9px] font-bold">★</span>
              ))}
              <span className="text-slate-500 font-medium ml-2 font-sans text-[11px] sm:text-xs">4.8 out of 5 based on 12,480+ enterprise reviews</span>
            </div>
          </div>

          {/* Autoplay & Slider controls */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-mono text-[11px] font-semibold bg-slate-150 px-2 py-1 rounded">
              {reviewIdx + 1} - {(reviewIdx + 2) % REVIEWS.length + 1} - {(reviewIdx + 3) % REVIEWS.length + 1} of {REVIEWS.length}
            </span>
            <button 
              onClick={() => {
                setAutoplayReviews(!autoplayReviews);
              }}
              className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-500 transition cursor-pointer"
              title={autoplayReviews ? "Pause Autoplay" : "Start Autoplay"}
            >
              {autoplayReviews ? <Pause className="w-4 h-4 text-sky-600" /> : <Play className="w-4 h-4 text-emerald-600" />}
            </button>
            <button 
              onClick={prevReview}
              className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 transition cursor-pointer"
              title="Previous Reviews"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={nextReview}
              className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 transition cursor-pointer"
              title="Next Reviews"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sliding Window Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative overflow-hidden min-h-[290px] px-1 py-2">
          <AnimatePresence mode="popLayout">
            {getVisibleReviews().map((review, rIdx) => (
              <motion.div 
                key={review.originalIndex}
                initial={{ opacity: 0, x: 50, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.98 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition duration-350 flex flex-col justify-between ${
                  rIdx === 1 ? 'hidden md:flex' : rIdx === 2 ? 'hidden lg:flex' : 'flex'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-0.5 text-emerald-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="w-4 h-4 bg-emerald-500 rounded-xs flex items-center justify-center text-white text-[9px] font-bold">★</span>
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-slate-300 font-bold bg-slate-50 px-2 py-0.5 rounded">
                      VERIFIED CLIENT #{review.originalIndex + 1}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-sm font-sans leading-snug">"{review.title}"</h4>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-sans">{review.text}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 text-xs font-sans flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-800">{review.author}</p>
                    <p className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">{review.role}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-650 flex items-center justify-center font-bold text-[10px] border border-sky-100 uppercase">
                    {review.author.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-8 bg-white border border-slate-100 rounded-3xl shadow-xs space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-sky-600 font-semibold font-sans">HELP CENTER & GUIDES</span>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-900">Frequently Asked Questions</h2>
          <p className="text-slate-500 text-xs sm:text-sm font-sans">Everything you need to know about our heavy-duty freight tracking, clearance times, and cargo safety protocols.</p>
        </div>

        <div className="divide-y divide-slate-100">
          {[
            {
              q: "How does the real-time cargo tracking system operate?",
              a: "Our tracking database is connected directly to global vessel satellites, priority airplane manifest relays, and automated last-mile truck GPS beacons. When your cargo is scanned at any transit hub, the records update instantly in our database. You can search your tracking key at any hour of the day."
            },
            {
              q: "Can I update cargo dimensions or delivery destination after dispatch?",
              a: "Yes. Operators and brokers can sign in to the Online Admin Panel to edit active shipment manifests, update weight metrics, change dispatch targets, and submit compliance comments. For security reasons, changes are instantly synchronized across our port databases."
            },
            {
              q: "What are the benefits of your C-TPAT Tier III customs certification?",
              a: "C-TPAT Tier III is the highest level of security vetting issued by US Customs and Border Protection. Because our supply chain processes are fully pre-screened and certified compliant, Apex cargo containers face 98% fewer random examinations, guaranteeing faster transit and zero port delay fees."
            },
            {
              q: "How do I configure email or SMS alerts for my shipment?",
              a: "In the 'Track Cargo' view, once you locate your active container, you can use the 'Cargo Tracking Alerts' widget to input your email. You can customize your notification filters to trigger emails upon transit hub arrivals, customs clearance completion, or final signed delivery."
            }
          ].map((faq, fIdx) => {
            const isOpen = openFaq === fIdx;
            return (
              <div key={fIdx} className="py-4 font-sans">
                <button
                  onClick={() => {
                    const nextState = !isOpen;
                    setOpenFaq(nextState ? fIdx : null);
                    if (nextState) {
                      captureEvent("faq_expanded", { question: faq.q }).catch(() => {});
                    }
                  }}
                  className="w-full flex justify-between items-center text-left py-2 font-semibold text-slate-900 text-sm sm:text-base hover:text-sky-600 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-slate-450 shrink-0 ml-4" /> : <ChevronDown className="w-5 h-5 text-slate-450 shrink-0 ml-4" />}
                </button>
                {isOpen && (
                  <div className="mt-2 text-slate-500 text-xs sm:text-sm leading-relaxed pl-1">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// Minimal dummy layout icon wrapper to satisfy clean compile
function DirectUploadIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}


