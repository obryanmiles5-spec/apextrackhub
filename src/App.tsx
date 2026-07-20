import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Ship, Globe2, HelpCircle, Phone, Mail, Clock, 
  MapPin, Menu, X, ArrowRight, ShieldCheck, Layers, Settings, FileText, Lock, Unlock, ShieldCheck as ShieldCheckIcon
} from 'lucide-react';
import { Shipment } from './types';
import { getShipments, saveShipments, INITIAL_SHIPMENTS } from './data/mockShipments';
import { captureEvent } from './lib/tracking';

// Sub-page component imports
import HomeView from './components/HomeView';
import AboutView from './components/AboutView';
import ServicesView from './components/ServicesView';
import TrackView from './components/TrackView';
import OnlinePanelView from './components/OnlinePanelView';
import LoginPortal from './components/LoginPortal';
import AdminView from './components/AdminView';

type ActiveTab = 'home' | 'about' | 'services' | 'track' | 'online_panel' | 'admin';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [currentTrackingId, setCurrentTrackingId] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Operator Authorization State from localStorage to survive reloads/HMR
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('apex_admin_auth') === 'true';
  });

  // Keep localStorage in sync with admin authentication status
  useEffect(() => {
    localStorage.setItem('apex_admin_auth', String(isAdminAuthenticated));
  }, [isAdminAuthenticated]);

  // Quick form for footer contact
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'liability' | 'surcharges' | 'privacy' | 'terms' | null>(null);

  // Fetch shipments from the server database
  const refreshServerShipments = async () => {
    try {
      const res = await fetch('/api/shipments');
      if (res.ok) {
        const data = await res.json();
        setShipments(data);
        saveShipments(data); // sync local storage backup
      } else {
        setShipments(getShipments());
      }
    } catch (e) {
      console.warn('Network database currently unreachable, loading local offline backup data:', e);
      setShipments(getShipments());
    }
  };

  useEffect(() => {
    refreshServerShipments();
    // Poll the server database every 8 seconds to automatically display any additions/updates instantly!
    const intervalId = setInterval(refreshServerShipments, 8000);
    
    // Log initial application load event to Supabase tracking table
    captureEvent("app_session_initialized", {
      environment: process.env.NODE_ENV || "production",
      referrer: document.referrer || "direct"
    }).catch(() => {});

    return () => clearInterval(intervalId);
  }, []);

  // Listen to secure url configurations (?portal=broker or #admin) to select admin panel directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const pathName = window.location.pathname;

    if (pathName === '/admin' || hash === '#/admin' || hash === '#admin') {
      setActiveTab('admin');
      captureEvent("admin_route_loaded", { path: pathName }).catch(() => {});
    } else if (params.get('portal') === 'broker' || params.get('admin') === 'true' || hash === '#broker') {
      setActiveTab('online_panel');
      captureEvent("admin_portal_url_override", { source: hash || "url_parameter" }).catch(() => {});
    }
  }, []);

  const handleUpdateShipments = async (updatedList: Shipment[]) => {
    // Optimistic UI updates
    setShipments(updatedList);
    saveShipments(updatedList); // local storage backup is always synced first

    try {
      await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedList)
      });
      captureEvent("shipments_database_synchronized", { records_count: updatedList.length }).catch(() => {});
    } catch (e) {
      console.error('Error synchronizing database write-back transaction to Express server:', e);
      captureEvent("shipments_sync_failed", { error: String(e) }).catch(() => {});
    }
  };

  const handleResetShipments = () => {
    if (confirm('Are you sure you want to clear/reset the active shipment registry? Custom edits will be overwritten.')) {
      handleUpdateShipments(INITIAL_SHIPMENTS);
      captureEvent("registry_reset_triggered", {}).catch(() => {});
    }
  };

  // Safe tracking action triggered from anywhere
  const handleTriggerTracking = (id: string | '') => {
    const cleanId = id.trim().toUpperCase();
    setCurrentTrackingId(cleanId);
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    captureEvent("cargo_tracking_triggered", { trackingId: cleanId }).catch(() => {});
  };

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tab === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else {
      window.history.pushState(null, '', '/');
    }

    captureEvent("tab_navigation", { target_tab: tab }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      
      {/* Upper Meta Info Bar */}
      <div className="bg-slate-950 text-slate-400 text-xs py-2 px-6 border-b border-slate-900 hidden sm:flex justify-between items-center z-50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-sky-400" /> Dispatch Hours: 24/7 Mon-Sat</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-sky-400" /> Central Office: Houston, TX, USA</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="mailto:ship@apextrackhub.com" className="hover:text-white transition flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-sky-400" /> ship@apextrackhub.com
          </a>
          <a href="tel:260-270-7501" className="hover:text-white transition flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-emerald-400" /> 260-270-7501
          </a>
        </div>
      </div>

      {/* Main Corporate Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 py-4 px-6 md:px-8 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Brand Logo & title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => selectTab('home')}>
            <span className="w-10 h-10 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center shadow-md border border-slate-800">
              <img 
                src="./favicon.png" 
                alt="Apex Track Hub" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </span>
            <div className="flex flex-col">
              <span className="font-sans font-extrabold text-slate-950 tracking-tight leading-none text-base sm:text-lg uppercase">
                APEX TRANS
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
                USA LOGISTICS CORE
              </span>
            </div>
          </div>

          {/* Navigation Links for Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {(isAdminAuthenticated 
              ? [
                  { id: 'home', label: 'Home' },
                  { id: 'about', label: 'About Us' },
                  { id: 'services', label: 'Services' },
                  { id: 'track', label: 'Track Cargo' },
                  { id: 'online_panel', label: 'Online Panel', isBadge: true }
                ]
              : [
                  { id: 'home', label: 'Home' },
                  { id: 'about', label: 'About Us' },
                  { id: 'services', label: 'Services' },
                  { id: 'track', label: 'Track Cargo' }
                ]
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => selectTab(tab.id as ActiveTab)}
                  className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-sans font-semibold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                    isActive ? 'text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                  {tab.isBadge && (
                    <span className="px-1.5 py-0.5 bg-sky-500 text-slate-950 font-mono font-bold text-[9px] rounded uppercase scale-90">
                      ADMIN
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="activeTabUnderline"
                      className="absolute bottom-[-17px] left-4 right-4 h-0.5 bg-slate-950"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}

            {/* Explicit Sign Out option if signed in */}
            {isAdminAuthenticated && (
              <button
                id="header-nav-signout"
                onClick={() => {
                  setIsAdminAuthenticated(false);
                  selectTab('home');
                }}
                className="ml-2 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-rose-600 hover:text-rose-700 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </nav>

          {/* Action CTA Trigger Button (Right Header) */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => selectTab('track')}
              className="bg-slate-950 hover:bg-slate-900 text-white font-sans font-semibold text-xs py-2.5 px-4.5 rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
            >
              Secure Tracking <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
            </button>
          </div>

          {/* Toggle button for Mobile Drawer menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-950 focus:outline-hidden transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Responsive Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden block bg-white border-t border-slate-50 overflow-hidden mt-4"
            >
              <div className="flex flex-col py-4 space-y-2">
                {(isAdminAuthenticated
                  ? [
                      { id: 'home', label: 'Home View' },
                      { id: 'about', label: 'Logistics Story' },
                      { id: 'services', label: 'Aviation & Marine cargo' },
                      { id: 'track', label: 'Search Status' },
                      { id: 'online_panel', label: 'Online Admin Console' }
                    ]
                  : [
                      { id: 'home', label: 'Home View' },
                      { id: 'about', label: 'Logistics Story' },
                      { id: 'services', label: 'Aviation & Marine cargo' },
                      { id: 'track', label: 'Search Status' }
                    ]
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectTab(item.id as ActiveTab)}
                    className={`w-full text-left py-3 px-4 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition ${
                      activeTab === item.id 
                        ? 'bg-slate-950 text-white' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                {isAdminAuthenticated && (
                  <button
                    onClick={() => {
                      setIsAdminAuthenticated(false);
                      selectTab('home');
                    }}
                    className="w-full text-[11px] text-left py-3 px-4 rounded-xl font-sans font-bold text-xs uppercase tracking-wider transition text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                  >
                    Logout Admin Console
                  </button>
                )}

                <div className="p-4 bg-slate-50 rounded-2xl flex flex-col gap-2 mt-4 text-[11px] text-slate-500 font-mono">
                  <span className="font-semibold text-slate-700">Central Office Hotline:</span>
                  <span>USA Support: 260-270-7501</span>
                  <span>Port Operations Desk: NYC / LA Harbor</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main View Display Area with animations */}
      <main className="flex-1 py-10 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            {activeTab === 'home' && (
              <HomeView 
                onSearch={handleTriggerTracking} 
                availableShipments={shipments} 
                isAdminAuthenticated={isAdminAuthenticated}
              />
            )}
            
            {activeTab === 'about' && (
              <AboutView />
            )}

            {activeTab === 'services' && (
              <ServicesView />
            )}

            {activeTab === 'track' && (
              <TrackView 
                currentTrackingId={currentTrackingId} 
                onSearch={setCurrentTrackingId} 
                availableShipments={shipments} 
                isAdminAuthenticated={isAdminAuthenticated}
              />
            )}

            {activeTab === 'online_panel' && (
              isAdminAuthenticated ? (
                <OnlinePanelView 
                  shipments={shipments} 
                  onUpdateShipments={handleUpdateShipments}
                  onResetShipments={handleResetShipments}
                />
              ) : (
                <LoginPortal 
                  onSuccess={() => {
                    setIsAdminAuthenticated(true);
                  }}
                  onCancel={() => {
                    selectTab('home');
                  }}
                />
              )
            )}

            {activeTab === 'admin' && (
              <AdminView />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Corporate Modern Footer */}
      <footer className="bg-slate-950 text-slate-400 font-sans border-t border-slate-900 pt-16 pb-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-slate-900">
          
          {/* Brief */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                <img 
                  src="./favicon.png" 
                  alt="Apex Track Hub" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </span>
              <span className="font-sans font-black text-white text-md uppercase tracking-wide">APEX TRANS</span>
            </div>
            
            <p className="text-slate-550 text-xs leading-relaxed">
              USA-based premier intermodal logistics enterprise coordinating bulk industrial maritime voyages, express airline freights, and national ground transfers since 1998.
            </p>

            <span className="text-[11px] font-mono text-sky-400 block tracking-wide">
              C-TPAT TIER III REGISTERED SHIPPER
            </span>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 text-xs font-sans">
            <h4 className="font-bold text-white uppercase tracking-widest font-sans text-xs">Logistic Portals</h4>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => selectTab('home')} className="hover:text-white transition cursor-pointer text-left py-1">Home Portal</button>
              <button onClick={() => selectTab('about')} className="hover:text-white transition cursor-pointer text-left py-1">Our Story</button>
              <button onClick={() => selectTab('services')} className="hover:text-white transition cursor-pointer text-left py-1">Port Services</button>
              <button onClick={() => selectTab('track')} className="hover:text-white transition cursor-pointer text-left py-1">Track Container</button>
              <button onClick={() => selectTab('admin')} className="hover:text-white transition cursor-pointer text-left py-1 text-sky-400 font-semibold">Supabase Admin</button>
            </div>
          </div>

          {/* Safety Specifications */}
          <div className="space-y-4 text-xs font-mono">
            <h4 className="font-bold text-white uppercase tracking-widest font-sans text-xs">Compliance Standards</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span>FMC License:</span>
                <span className="text-sky-400">#048291-TX</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span>DOT Authority:</span>
                <span className="text-sky-400">USDOT-940251</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-900">
                <span>TSA Air Intermediary:</span>
                <span className="text-emerald-400">IAC_982A</span>
              </div>
            </div>
          </div>

          {/* Contact Subscription Form */}
          <div className="space-y-4">
            <h4 className="font-bold text-white uppercase tracking-widest font-sans text-xs">Inquire Cargo Quote</h4>
            <p className="text-xs text-slate-500 leading-normal">Enter your email to receive direct container rate assessments or fuel surcharge index updates.</p>
            
            {contactSubmitted ? (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-emerald-400">
                ✓ Subscription approved. Rates inbox dispatched.
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (contactEmail.trim()) {
                    setContactSubmitted(true);
                    captureEvent("newsletter_signup", { email: contactEmail.trim() }).catch(() => {});
                  }
                }} 
                className="flex gap-2"
              >
                <input
                  type="email"
                  required
                  placeholder="name@business.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="bg-slate-900 border border-slate-820 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-550 flex-1 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-sans font-bold text-xs px-3.5 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Rights metadata */}
        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600 font-mono">
          <span>© 2026 Apex Intermodal Logistics LLC. All rights reserved.</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2 items-center justify-center sm:justify-end">
            <button onClick={() => { setActiveLegalModal('liability'); captureEvent("view_legal_modal", { type: "liability" }).catch(() => {}); }} className="hover:text-slate-400 transition cursor-pointer">Cargo Liability Terms</button>
            <span>•</span>
            <button onClick={() => { setActiveLegalModal('surcharges'); captureEvent("view_legal_modal", { type: "surcharges" }).catch(() => {}); }} className="hover:text-slate-400 transition cursor-pointer">FSC Index Surcharges</button>
            <span>•</span>
            <button onClick={() => { setActiveLegalModal('privacy'); captureEvent("view_legal_modal", { type: "privacy" }).catch(() => {}); }} className="hover:text-slate-400 transition cursor-pointer">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => { setActiveLegalModal('terms'); captureEvent("view_legal_modal", { type: "terms" }).catch(() => {}); }} className="hover:text-slate-400 transition cursor-pointer">Terms of Service</button>
          </div>
        </div>
      </footer>

      {/* Legal Dialog Overlay Modal */}
      <AnimatePresence>
        {activeLegalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="max-w-lg w-full bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl p-6 relative text-slate-900 text-left"
            >
              <button
                onClick={() => setActiveLegalModal(null)}
                className="absolute right-4 top-4 p-1 bg-slate-50 hover:bg-slate-100 text-slate-450 hover:text-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-150">
                  <ShieldCheck className="w-5 h-5 text-sky-500" />
                  <h3 className="font-sans font-bold text-lg text-slate-950 capitalize">
                    {activeLegalModal === 'liability' && 'Cargo Liability Terms'}
                    {activeLegalModal === 'surcharges' && 'FSC Index Surcharges'}
                    {activeLegalModal === 'privacy' && 'Privacy Policy'}
                    {activeLegalModal === 'terms' && 'Terms of Service'}
                  </h3>
                </div>

                <div className="text-slate-600 text-xs sm:text-sm leading-relaxed space-y-3 font-sans">
                  {activeLegalModal === 'liability' && (
                    <>
                      <p>Under Federal Maritime Commission FMC #048291 and US DOT regulations, Apex Trans maintains direct liability insurance up to $500,000 per intermodal dry box, with active GPS tracking override support.</p>
                      <p>For hazardous material Class 9 transits, liability cap expands to $2,000,000 subject to seal audit checks. Claims must be submitted to compliance@apextrackhub.com within 14 calendar days of port discharge.</p>
                    </>
                  )}
                  {activeLegalModal === 'surcharges' && (
                    <>
                      <p>FSC (Fuel Surcharge) values are dynamically updated every Monday at 08:00 EST based on the Gulf Coast (PADD 3) retail on-highway diesel fuel price index.</p>
                      <p>Current active FSC index is loaded at 12.4% for truckloads and 4.2% for intermodal rail bulk transits. Marine vessel fuel surcharges are indexed to Rotterdam bunker crude standards.</p>
                    </>
                  )}
                  {activeLegalModal === 'privacy' && (
                    <>
                      <p>We value the security of global supply chains. Container manifest listings, shipper emails, consignee phone numbers, and commercial invoices are encrypted at rest under AES-256 standards.</p>
                      <p>Our tracking systems do not share carrier GPS coordinates or client details with unvetted third parties. Under C-TPAT Tier III guidelines, metadata is securely audited solely by US Customs.</p>
                    </>
                  )}
                  {activeLegalModal === 'terms' && (
                    <>
                      <p>By utilizing the Apex Intermodal logistics portal and active satellite tracking systems, you agree to comply with standard FMC container rules, demurrage clearance schedules, and secure container seal practices.</p>
                      <p>Unauthorized access to administrative dispatch portals, spoofing cargo IDs, or running raw telemetry scanners is strictly audited under Texas State cyber-security codes.</p>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setActiveLegalModal(null)}
                    className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white font-sans font-semibold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
