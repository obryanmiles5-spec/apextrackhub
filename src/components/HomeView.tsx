import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Globe, Shield, Anchor, Zap, Plane, Truck, ClipboardList, CheckCircle2 } from 'lucide-react';
import { Shipment } from '../types';

interface HomeViewProps {
  onSearch: (trackingId: string) => void;
  availableShipments: Shipment[];
  isAdminAuthenticated?: boolean;
}

export default function HomeView({ onSearch, availableShipments, isAdminAuthenticated = false }: HomeViewProps) {
  const [searchVal, setSearchVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) {
      setErrorMsg('Please enter a valid tracking number.');
      return;
    }
    setErrorMsg('');
    onSearch(searchVal.trim());
  };

  const fillDemoId = (id: string) => {
    setSearchVal(id);
    setErrorMsg('');
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white rounded-3xl mx-4 lg:mx-8">
        {/* Background Image with Dark Tint Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="./hero_cargo_ship.png"
            alt="Elite Global Freight Cargo Ship"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35 scale-105 transform hover:scale-100 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent"></div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Sea Logistics Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 group border border-slate-100">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src="./hero_cargo_ship.png" 
                  alt="Ocean Maritime Vessel" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 right-4 bg-sky-500 text-slate-950 font-sans font-semibold text-xs py-1 px-3 rounded-full uppercase tracking-wider">Oceanic Freight</span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold text-slate-900">Global Vessel Transit</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Handling multi-ton sea container freighters across Atlantic and Pacific pathways. Customized refrigerated units are monitored hour-by-hour.</p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Anchor className="w-4 h-4 text-sky-500" /> Seattle / Houston / Long Beach Hubs
                </div>
              </div>
            </div>

            {/* Air Cargo Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 group border border-slate-100">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src="./freight_airplane.png" 
                  alt="Charter Aeroplane loading logistics"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 right-4 bg-emerald-500 text-white font-sans font-semibold text-xs py-1 px-3 rounded-full uppercase tracking-wider">Air Transport</span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold text-slate-900">Priority Jet Expeditions</h3>
                <p className="text-slate-500 text-sm leading-relaxed">When deadlines dictate swift transport. Over-night and high-trust intercontinental flight clearance routes for urgent technical cargo.</p>
                <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Plane className="w-4 h-4 text-emerald-500" /> High-Clearance Airport Networks
                </div>
              </div>
            </div>

            {/* Land Logistics Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 group border border-slate-100">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src="./delivery_truck.png" 
                  alt="Delivery Truck highway shipment" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 right-4 bg-orange-500 text-white font-sans font-semibold text-xs py-1 px-3 rounded-full uppercase tracking-wider">Ground Express</span>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold text-slate-900">Last-Mile Interstate Fleet</h3>
                <p className="text-slate-500 text-sm leading-relaxed">A modern commercial truck fleet connecting urban terminals and sorting docks with high fuel efficiency and automated GPS dispatch maps.</p>
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
