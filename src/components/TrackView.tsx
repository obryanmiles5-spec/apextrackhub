import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Calendar, Scale, Box, Check, FileText, Truck, ArrowRight, ShieldCheck, Map, Clock, AlertCircle, Bell, Mail, Send, Loader2, Trash2, X } from 'lucide-react';
import { Shipment, ShipmentStatus } from '../types';
import TrackingMap from './TrackingMap';
import { trackEvent, supabase } from '../lib/tracking';

interface TrackViewProps {
  currentTrackingId: string;
  onSearch: (trackingId: string | '') => void;
  availableShipments: Shipment[];
  isAdminAuthenticated?: boolean;
}

interface CargoAlert {
  id: string;
  shipmentId: string;
  email: string;
  milestones: boolean;
  delays: boolean;
  delivery: boolean;
  createdAt: string;
}

// Order of shipment stages
const STAGES: { key: ShipmentStatus; label: string; desc: string }[] = [
  { key: 'received', label: 'Cargo Received', desc: 'Manifested & scanned' },
  { key: 'transit', label: 'In Transit', desc: 'En route via carrier' },
  { key: 'customs', label: 'Customs Clearance', desc: 'Import/Export customs gateway' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Dispatch onto last-mile carrier' },
  { key: 'delivered', label: 'Signed Delivery', desc: 'Completed and verified signature' }
];

export default function TrackView({ currentTrackingId, onSearch, availableShipments, isAdminAuthenticated = false }: TrackViewProps) {
  const [searchVal, setSearchVal] = useState(currentTrackingId);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Email Alert Tracking System States
  const [email, setEmail] = useState('');
  const [alertMilestones, setAlertMilestones] = useState(true);
  const [alertDelays, setAlertDelays] = useState(true);
  const [alertDelivery, setAlertDelivery] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [activeAlerts, setActiveAlerts] = useState<CargoAlert[]>(() => {
    try {
      const saved = localStorage.getItem('apex_cargo_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('apex_cargo_alerts', JSON.stringify(activeAlerts));
  }, [activeAlerts]);

  // Dedicated active email domain drafting & SMTP simulation states
  const [mailTopic, setMailTopic] = useState('cargo_dispute');
  const [mailBody, setMailBody] = useState('');
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpStep, setSmtpStep] = useState(0);
  const [smtpTargetEmail, setSmtpTargetEmail] = useState('');

  const SMTP_LOG_STEPS = [
    { text: 'Resolving MX resource records for domain "apextrackhub.com"...', delay: 220 },
    { text: '✓ CRITICAL: Primary MX Record target verified: incoming-mail.apextrackhub.com (Priority 10)', delay: 180 },
    { text: 'Opening raw socket stream to incoming-mail.apextrackhub.com on Port 25...', delay: 280 },
    { text: '← [SMTP 220] mail.apextrackhub.com ESMTP Postfix Service ready to accept payloads', delay: 150 },
    { text: '→ EHLO web-portal.apextrackhub.com', delay: 200 },
    { text: '← [SMTP 250] DSN / 8BITMIME / PIPELINING / STARTTLS / SIZE 15728640', delay: 150 },
    { text: '→ MAIL FROM: <dispatcher@apextrackhub.com>', delay: 150 },
    { text: '← [SMTP 250] 2.1.0 Sender <dispatcher@apextrackhub.com> OK', delay: 150 },
    { text: '→ RCPT TO: <__EMAIL__>', delay: 250 },
    { text: '← [SMTP 250] 2.1.5 Recipient Verified. Remote mailbox accessible', delay: 180 },
    { text: '→ DATA', delay: 150 },
    { text: '← [SMTP 354] Start mail input. End with <CR><LF>.<CR><LF>', delay: 150 },
    { text: '→ Writing MIME Content-Type headers...', delay: 150 },
    { text: '→ Pushing HTML multipart responsive content templates to MX relays...', delay: 280 },
    { text: '← [SMTP 250] q92x_apex_logistics - 2.0.0 OK: Message parsed & accepted for outbound queue', delay: 200 },
    { text: '✓ [SUCCESS] Dispatch completed! Simulated email message relayed via MX successfully.', delay: 150 }
  ];

  useEffect(() => {
    if (!showSmtpModal) return;
    if (smtpStep >= SMTP_LOG_STEPS.length) return;

    const currentStep = SMTP_LOG_STEPS[smtpStep];
    const timer = setTimeout(() => {
      setSmtpStep(prev => prev + 1);
    }, currentStep.delay);

    return () => clearTimeout(timer);
  }, [showSmtpModal, smtpStep]);

  const handleLaunchMailClient = () => {
    if (!selectedShipment) return;
    
    let subject = '';
    let intro = '';
    
    if (mailTopic === 'cargo_dispute') {
      subject = `[APEX DISPUTE] Shipment Ref: ${selectedShipment.id} - Cargo Deviation Exception`;
      intro = `Apex Intermodal Dispatch Desk,\n\nI am lodging an official variance exception regarding shipment ${selectedShipment.id}.\n\nDetails:\n- Current logged status: ${selectedShipment.status.replace(/_/g, ' ').toUpperCase()}\n- Carrier: ${selectedShipment.carrier}\n- Destination: ${selectedShipment.destinationCity}, ${selectedShipment.destinationCountry}\n\nClient Notes:\n- ${mailBody || 'No custom details provided.'}\n\nPlease audit the latest tracking beacon updates.`;
    } else if (mailTopic === 'customs_hold') {
      subject = `[CUSTOMS CLEARANCE] Reference ID ID: ${selectedShipment.id} - Doc Submission`;
      intro = `Apex Import/Export Compliance Brokerage,\n\nRequesting status update on customs clearance for cargo ID ${selectedShipment.id}.\n\nCarrier Route: ${selectedShipment.originCity} ➜ ${selectedShipment.destinationCity}\n\nDiscrepancy Details:\n- ${mailBody || 'No custom notes provided.'}\n\nPlease review our active bond filing numbers: REG_FMC_${selectedShipment.id.replace(/-/g, '_')}`;
    } else {
      subject = `[MANIFEST AMEND] Update Dimensions for Shipment: ${selectedShipment.id}`;
      intro = `Apex Logistics Manifest Desk,\n\nRequesting weight / dimension amendment to active bills of lading for shipment ${selectedShipment.id}.\n\nCurrent Manifest Weight: ${selectedShipment.weight} lbs\nDimensions: ${selectedShipment.dimensions}\n\nAmendment Request details:\n- ${mailBody || 'No custom notes provided.'}`;
    }

    const mailtoUrl = `mailto:ship@apextrackhub.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(intro)}`;
    window.location.href = mailtoUrl;
  };

  const handleSimulateSmtpDispatch = () => {
    if (!selectedShipment) return;
    
    // Choose destination email
    const defaultDest = activeAlerts.length > 0 ? activeAlerts[0].email : 'shipper-terminal@business-hub.com';
    setSmtpTargetEmail(defaultDest);
    setSmtpStep(0);
    setShowSmtpModal(true);
  };

  const handleRegisterAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !selectedShipment) return;

    setIsRegistering(true);
    setSuccessMessage(null);

    const emailVal = email.trim();
    const trackingIdVal = selectedShipment.id;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'alert_registration',
          email: emailVal,
          trackingId: trackingIdVal
        })
      });

      const newAlert: CargoAlert = {
        id: Math.random().toString(36).substring(2, 9),
        shipmentId: trackingIdVal,
        email: emailVal,
        milestones: alertMilestones,
        delays: alertDelays,
        delivery: alertDelivery,
        createdAt: new Date().toISOString()
      };

      // Ensure no duplicates for same email & shipment id
      const exists = activeAlerts.some(
        a => a.email.toLowerCase() === newAlert.email.toLowerCase() && a.shipmentId === newAlert.shipmentId
      );
      
      if (exists) {
        setSuccessMessage(`Alert update confirmed! Email "${emailVal}" is already registered for shipment ${isAdminAuthenticated ? trackingIdVal : '••••-••••-••••'}.`);
      } else {
        setActiveAlerts(prev => [newAlert, ...prev]);
        if (response.ok) {
          setSuccessMessage(`Alert established successfully! Telemetry dispatch notification stream connected to ${emailVal}.`);
        } else {
          setSuccessMessage(`Alert logged offline. Notification dispatch was simulated for ${emailVal}.`);
        }
      }

      setEmail('');
    } catch (err) {
      console.error(err);
      const newAlert: CargoAlert = {
        id: Math.random().toString(36).substring(2, 9),
        shipmentId: trackingIdVal,
        email: emailVal,
        milestones: alertMilestones,
        delays: alertDelays,
        delivery: alertDelivery,
        createdAt: new Date().toISOString()
      };
      const exists = activeAlerts.some(
        a => a.email.toLowerCase() === newAlert.email.toLowerCase() && a.shipmentId === newAlert.shipmentId
      );
      if (!exists) {
        setActiveAlerts(prev => [newAlert, ...prev]);
      }
      setSuccessMessage(`Alert logged. Notification dispatch was simulated for ${emailVal}.`);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRemoveAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Handle outside search prop updates
  useEffect(() => {
    setSearchVal(currentTrackingId);
    
    if (currentTrackingId) {
      const trackingQuery = currentTrackingId.trim().toUpperCase();
      
      const performSearch = async () => {
        let match: Shipment | null = null;
        
        if (supabase) {
          try {
            // Search in tracking_data table where event_data->>trackingId matches, etc.
            const { data, error } = await supabase
              .from('tracking_data')
              .select('*')
              .or(`event_data->>trackingId.eq.${trackingQuery},event_data->>trackingNumber.eq.${trackingQuery},event_data->>id.eq.${trackingQuery}`)
              .order('id', { ascending: false })
              .limit(1);

            if (!error && data && data.length > 0) {
              match = data[0].event_data as Shipment;
            }
          } catch (e) {
            console.error('Supabase search failed', e);
          }
        }

        // Fallback to local availableShipments if not found via Supabase (or Supabase offline)
        if (!match) {
          const localMatch = availableShipments.find(
            s => s.id.toUpperCase() === trackingQuery
          );
          if (localMatch) match = localMatch;
        }

        if (match) {
          if (match.visibility === 'hidden') {
            setSelectedShipment(null);
            setErrorMessage('Target shipment is currently deactivated by the administrator cargo control panel.');
            trackEvent("cargo_search_deactivated", { trackingId: trackingQuery });
          } else {
            setSelectedShipment(match);
            setErrorMessage('');
            if (match.email) {
              setEmail(match.email);
            }
            trackEvent("cargo_search_success", { trackingId: trackingQuery, carrier: match.carrier, status: match.status });
          }
        } else {
          setSelectedShipment(null);
          setErrorMessage('No shipment found for this tracking number.');
          trackEvent("cargo_search_not_found", { trackingId: trackingQuery });
        }
      };

      performSearch();
    } else {
      setSelectedShipment(null);
      setErrorMessage('');
    }
  }, [currentTrackingId, availableShipments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) {
      setErrorMessage('Please enter a valid tracking number.');
      return;
    }
    onSearch(searchVal.trim());
  };

  // Get index of current status in the stages list
  const getCurrentStageIndex = (status: ShipmentStatus): number => {
    return STAGES.findIndex(s => s.key === status);
  };

  // Helper to draw a mock route simulator dynamically
  const drawRoutePath = (shipment: Shipment) => {
    const stageIdx = getCurrentStageIndex(shipment.status);
    const totalStages = STAGES.length - 1;
    const percentage = totalStages > 0 ? (stageIdx / totalStages) * 100 : 0;
    
    return (
      <div className="relative h-2 bg-slate-200 rounded-full mt-6">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-700 ease-out-back"
          style={{ width: `${percentage}%` }}
        />
        {/* Glowing node at active coordinates */}
        <div 
          className="absolute -top-1.5 w-5 h-5 bg-sky-500 rounded-full shadow-lg shadow-sky-400/40 border-4 border-white transition-all duration-700"
          style={{ left: `calc(${percentage}% - 10px)` }}
        >
          <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="relative -mt-10 py-16 px-4 sm:px-6 lg:px-8 rounded-3xl mx-4 lg:mx-8 overflow-hidden bg-cover bg-center bg-no-repeat shadow-sm" 
      style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.82)), url('https://lh3.googleusercontent.com/d/19y8tABlqkTXY987Jx6N1QouO7oBn-pqw')` }}
    >
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Upper header */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest text-sky-400 font-semibold font-mono">CARGO AUDITING PORTAL</span>
          <h1 className="text-3xl font-bold text-white font-sans tracking-tight">Active Freight Tracking</h1>
          <p className="text-slate-300 text-xs sm:text-sm font-sans">
            Enter your global tracking ID below to check live carrier records, estimated port release, and container historical scans.
          </p>
        </div>

      {/* Tracker Search Form */}
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-3xl border border-slate-100 shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Enter active tracking key (e.g. US-9482-9018, US-3810-7749)..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 font-mono text-sm tracking-widest uppercase transition"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-950 hover:bg-slate-900 text-white font-sans font-semibold px-8 py-4 rounded-2xl transition duration-150 text-sm uppercase tracking-wide shrink-0"
          >
            Locate Container
          </button>
        </form>

        {errorMessage && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-rose-800 text-xs sm:text-sm font-semibold">Logistics Clearance Alert</p>
              <p className="text-rose-600 text-[11px] sm:text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Quick Selections */}
        {!selectedShipment && isAdminAuthenticated && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Operational Demo Systems</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableShipments.filter(s => s.visibility !== 'hidden').map((shipment) => (
                <button
                  key={shipment.id}
                  onClick={() => {
                    setSearchVal(shipment.id);
                    onSearch(shipment.id);
                  }}
                  className="p-3 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-100 hover:border-sky-200 transition text-left cursor-pointer flex flex-col justify-between"
                >
                  <span className="font-mono text-xs font-dm font-bold text-slate-800 tracking-wider block">{shipment.id}</span>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                    <span className="font-sans">{shipment.originCity} ➜ {shipment.destinationCity}</span>
                    <span className="font-semibold uppercase text-sky-600 font-mono">{shipment.status.replace('_', ' ')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {selectedShipment && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left: General Tracker Details Card & Stages Timeline */}
            <div className="lg:col-span-8 space-y-8">
              {/* Main Timeline Card */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-8">
                {/* Upper tracking bar identifier */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-50 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">Active Shipment Tracking Key</span>
                    <h3 className="text-2xl font-bold font-mono text-slate-900 tracking-wide">
                      {isAdminAuthenticated ? selectedShipment.id : '••••-••••-••••'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded-full ${
                      selectedShipment.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                      selectedShipment.status === 'out_for_delivery' ? 'bg-orange-50 text-orange-700' :
                      selectedShipment.status === 'customs' ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700'
                    }`}>
                      • {selectedShipment.status.replace(/_/g, ' ')}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-mono rounded-full">
                      {selectedShipment.carrier}
                    </span>
                  </div>
                </div>

                {/* Progress bar and timeline stations */}
                <div className="space-y-6">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Shipment Milestone Timeline</h4>
                  
                  {/* Graphical Line */}
                  {drawRoutePath(selectedShipment)}

                  {/* Milestones list (Interactive visual) */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 pt-4">
                    {STAGES.map((stage, sIdx) => {
                      const currentActiveIdx = getCurrentStageIndex(selectedShipment.status);
                      const isCompleted = sIdx <= currentActiveIdx;
                      const isCurrent = sIdx === currentActiveIdx;

                      return (
                        <div 
                          key={stage.key} 
                          className={`flex sm:flex-col gap-3 p-3 rounded-2xl border transition duration-200 ${
                            isCurrent ? 'bg-sky-50/70 border-sky-200/80 shadow-xs' : 
                            isCompleted ? 'bg-slate-50/80 border-slate-100' : 'bg-transparent border-dashed border-slate-200 opacity-60'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isCompleted ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isCompleted ? <Check className="w-4 h-4 text-slate-950 stroke-[3px]" /> : <span className="text-[10px] font-mono font-bold">{sIdx + 1}</span>}
                          </div>

                          <div className="space-y-0.5">
                            <p className={`text-xs font-bold font-sans ${isCurrent ? 'text-sky-950 font-extrabold' : 'text-slate-800'}`}>
                              {stage.label}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-normal">{stage.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Cargo Route Mapping Simulation */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Map className="w-4 h-4 text-sky-500" /> Interactive Route Indicator
                  </h4>

                  <div className="space-y-4">
                    {/* Live Google Map Interactive Telemetry View */}
                    <TrackingMap
                      originCity={selectedShipment.originCity}
                      originCountry={selectedShipment.originCountry}
                      destinationCity={selectedShipment.destinationCity}
                      destinationCountry={selectedShipment.destinationCountry}
                      status={selectedShipment.status}
                      shippingMethod={selectedShipment.shippingMethod}
                      carrier={selectedShipment.carrier}
                    />

                    {/* Sat link / Courier logs terminal */}
                    <div className="bg-slate-950 rounded-2xl p-6 text-white border border-slate-800">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 block text-[10px]">CURRENT BEACON</span>
                          <span className="text-sky-300 font-semibold">{selectedShipment.carrier}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">ETA DELIVERY</span>
                          <span className="text-white font-semibold">{selectedShipment.estimatedDelivery}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">WEIGHT METRIC</span>
                          <span className="text-slate-300 font-semibold">{selectedShipment.weight} lbs</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">CARGO VALUE</span>
                          <span className="text-emerald-400 font-semibold">${selectedShipment.cargoValue?.toLocaleString() || 'N/A'} USD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scan History Log Details */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight uppercase tracking-widest text-slate-400">Hub Audit Scans ({selectedShipment.history.length})</h3>
                
                <div className="space-y-6 relative border-l border-slate-100 pl-4 py-2">
                  {selectedShipment.history.map((log, lIdx) => (
                    <div key={log.id} className="relative group">
                      {/* Hub node status */}
                      <span className="absolute -left-6.5 top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-300 group-hover:border-sky-500 transition" />
                      
                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-1">
                          <span className="font-bold text-slate-800 font-sans">{log.location}</span>
                          <span className="text-slate-450 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{log.description}</p>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 font-mono text-[9px] rounded uppercase font-semibold">
                          {log.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Core Manifest Panel & Warehouse Rules */}
            <div className="lg:col-span-4 space-y-8">
              {/* Manifest checklist card */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                  <FileText className="w-5 h-5 text-sky-500" />
                  <h4 className="font-bold text-slate-950 text-sm font-sans tracking-tight">Cargo Manifest Invoice</h4>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-slate-400 font-sans">Sender</span>
                    <span className="text-slate-800 font-semibold font-sans text-right max-w-[150px] truncate">{selectedShipment.senderName}</span>
                  </div>
                  <div className="py-2 border-b border-slate-50 space-y-1">
                    <span className="text-slate-400 block font-sans">Sender Dispatch Point</span>
                    <span className="text-slate-600 font-sans text-[11px] block leading-normal">{selectedShipment.senderAddress}</span>
                  </div>
                  {selectedShipment.senderEmail && (
                    <div className="py-2 border-b border-slate-50 space-y-0.5">
                      <span className="text-slate-400 block font-sans">Sender Email</span>
                      <span className="text-slate-600 font-mono text-[11px] block break-all">{selectedShipment.senderEmail}</span>
                    </div>
                  )}
                  {selectedShipment.senderPhone && (
                    <div className="py-2 border-b border-slate-50 space-y-0.5">
                      <span className="text-slate-400 block font-sans">Sender Phone</span>
                      <span className="text-slate-600 font-mono text-[11px] block break-all">{selectedShipment.senderPhone}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-slate-400 font-sans">Consignee</span>
                    <span className="text-slate-800 font-semibold font-sans text-right max-w-[150px] truncate">{selectedShipment.receiverName}</span>
                  </div>
                  <div className="py-2 border-b border-slate-50 space-y-1">
                    <span className="text-slate-400 block font-sans">Delivery Destination</span>
                    <span className="text-slate-600 font-sans text-[11px] block leading-normal">{selectedShipment.receiverAddress}</span>
                  </div>
                  {selectedShipment.receiverEmail && (
                    <div className="py-2 border-b border-slate-50 space-y-0.5">
                      <span className="text-slate-400 block font-sans">Consignee Email</span>
                      <span className="text-slate-600 font-mono text-[11px] block break-all">{selectedShipment.receiverEmail}</span>
                    </div>
                  )}
                  {selectedShipment.receiverPhone && (
                    <div className="py-2 border-b border-slate-50 space-y-0.5">
                      <span className="text-slate-400 block font-sans">Consignee Phone</span>
                      <span className="text-slate-600 font-mono text-[11px] block break-all">{selectedShipment.receiverPhone}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-slate-400 font-sans">Package Weight</span>
                    <span className="text-slate-800 font-mono font-bold">{selectedShipment.weight} lbs</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-slate-400 font-sans">Box Dimensions</span>
                    <span className="text-slate-800 font-mono">{selectedShipment.dimensions}</span>
                  </div>

                  {selectedShipment.email && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-slate-400 font-sans">Contact Email</span>
                      <span className="text-slate-800 font-mono text-[11px] truncate max-w-[155px]" title={selectedShipment.email}>{selectedShipment.email}</span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] border border-slate-105">
                    <span className="text-slate-400 block font-mono font-bold">CARRIER NOTES / INSTRUCTIONS</span>
                    <p className="text-slate-600 leading-normal italic font-sans">
                      {selectedShipment.notes || 'Routine commerce handling. Check seal integrity upon delivery handoff.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Mail Gateway (MX Record Integration) */}
              {isAdminAuthenticated && (
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                    <Mail className="w-5 h-5 text-sky-500" />
                    <h4 className="font-bold text-slate-950 text-sm font-sans tracking-tight">Active Mail Gateway</h4>
                  </div>
                  <p className="text-slate-500 text-[11px] font-sans leading-relaxed">
                    The MX records for <span className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10.5px] font-bold">apextrackhub.com</span> are fully active. Send custom manifests, clearance exceptions, or cargo claims directly to the central desk.
                  </p>

                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
                      <span className="text-slate-400 block text-[9.5px] font-mono font-bold uppercase tracking-wider">Central Desk Address</span>
                      <a 
                        href="mailto:ship@apextrackhub.com" 
                        className="text-sky-600 hover:text-sky-800 font-mono font-bold flex items-center gap-1.5 underline underline-offset-2 break-all"
                      >
                        ship@apextrackhub.com
                      </a>
                    </div>

                    {/* Mail drafting tool */}
                    <div className="space-y-2.5">
                      <span className="text-slate-400 block text-[9.5px] font-mono font-bold uppercase tracking-wider">Draft Official Communication</span>
                      
                      <select
                        value={mailTopic}
                        onChange={(e) => setMailTopic(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl px-3 py-2 text-xs text-slate-900 font-sans focus:outline-hidden transition"
                      >
                        <option value="cargo_dispute">Cargo Exception / Dispute</option>
                        <option value="customs_hold">Customs Clearance Hold Release</option>
                        <option value="manifest_edit">Manifest Weight Info Update</option>
                      </select>

                      <textarea
                        placeholder="Input custom cargo logs, billing notes or variance claims..."
                        value={mailBody}
                        onChange={(e) => setMailBody(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl p-3 text-xs text-slate-900 font-sans focus:outline-hidden transition resize-none"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleLaunchMailClient}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-sans font-bold text-[10px] py-3.5 px-3 rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
                          title="Launches your local email system with MX configurations"
                        >
                          <Send className="w-3.5 h-3.5 text-slate-700" /> Mail client
                        </button>

                        <button
                          type="button"
                          onClick={handleSimulateSmtpDispatch}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-950 font-sans font-bold text-[10px] py-3.5 px-3 rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 border border-sky-200 border-dashed"
                        >
                          <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" /> Live Sim
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Alert System Card */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                  <Bell className="w-5 h-5 text-sky-500 animate-pulse" />
                  <h4 className="font-bold text-slate-950 text-sm font-sans tracking-tight">Cargo Tracking Alerts</h4>
                </div>

                <p className="text-slate-500 text-[11px] font-sans leading-relaxed">
                  Subscribe to receive automated carrier updates. Real-time notifications will cascade whenever dispatcher logs record state changes.
                </p>

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-[11px] font-medium leading-normal relative pr-8"
                  >
                    <button 
                      type="button"
                      onClick={() => setSuccessMessage(null)}
                      className="absolute right-2.5 top-2.5 text-emerald-600 hover:text-emerald-800 font-bold transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {successMessage}
                  </motion.div>
                )}

                <form onSubmit={handleRegisterAlert} className="space-y-4">
                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-1.5 font-sans">
                      Recipient Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-slate-400 font-bold">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="carrier-desk@enterprise.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isRegistering}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl pl-9 pr-3 py-3 text-xs text-slate-900 font-sans focus:outline-hidden transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider">Alert Event Filters</span>
                    
                    <label className="flex items-center gap-2.5 text-[11px] text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={alertMilestones}
                        onChange={(e) => setAlertMilestones(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Transit Hub Milestones</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-[11px] text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={alertDelays}
                        onChange={(e) => setAlertDelays(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Critical Dispatch Delays</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-[11px] text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={alertDelivery}
                        onChange={(e) => setAlertDelivery(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Final Signed Proof & Delivery</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-white font-sans font-bold text-[10px] py-3.5 px-4 rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-400 shadow-xs"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> Connecting Gateway...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" /> Pin Alert Stream
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Active Alerts Watchlist */}
              {activeAlerts.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <h4 className="font-bold text-slate-950 text-xs font-sans tracking-tight">Active Telemetry Watchers</h4>
                    </div>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                      {activeAlerts.length}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {activeAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs opacity-95 hover:opacity-100 transition duration-150"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px] font-bold text-slate-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded">
                              {isAdminAuthenticated ? alert.shipmentId : '••••-••••-••••'}
                            </span>
                            <span className="text-slate-450 text-[9px] font-mono">active</span>
                          </div>
                          <p className="text-slate-800 font-sans truncate font-medium text-xs" title={alert.email}>
                            {alert.email}
                          </p>
                          <div className="flex flex-wrap gap-1 text-[8px] font-mono text-slate-400">
                            {alert.milestones && <span className="bg-white border text-slate-500 rounded px-1">Milestones</span>}
                            {alert.delays && <span className="bg-white border text-slate-500 rounded px-1">Delays</span>}
                            {alert.delivery && <span className="bg-white border text-slate-500 rounded px-1">Delivery</span>}
                          </div>
                        </div>

                        <button 
                          onClick={() => handleRemoveAlert(alert.id)}
                          className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Unbind watcher stream"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Secure Delivery Info */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4 border border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm tracking-tight text-white font-sans">Protected Cargo Bond</h4>
                <p className="text-slate-350 text-xs leading-relaxed font-sans">
                  This parcel transit status is securely registered with specialized USA import brokerages. To file an insurance variance or dispute carrier logs, reference registration code:
                </p>
                <code className="block bg-slate-950 p-2.5 rounded-lg text-emerald-400 font-mono text-[10px] text-center border border-slate-800 tracking-wider">
                  REG_FMC_{isAdminAuthenticated ? selectedShipment.id.replace(/-/g, '_') : '••••_••••_••••'}
                </code>
              </div>
            </div>

            {/* SMTP Socket Simulation Modal */}
            <AnimatePresence>
              {showSmtpModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col my-8"
                  >
                    {/* Modal Header */}
                    <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                        <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">SMTP Outbound Gateway Sim Terminal</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSmtpModal(false)}
                        className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Terminal Logs Scope */}
                    <div className="p-5 flex-1 space-y-4 text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-black block">Active Handshake telemetry logs</span>
                        <div className="bg-slate-950 rounded-xl p-4 font-mono text-[10px] text-sky-400 space-y-1.5 overflow-y-auto max-h-[160px] border border-slate-850 scrollbar-thin">
                          {SMTP_LOG_STEPS.slice(0, smtpStep).map((step, idx) => {
                            const message = step.text.replace('__EMAIL__', smtpTargetEmail || 'incoming@apextrackhub.com');
                            return (
                              <div key={idx} className="flex gap-2">
                                <span className="text-slate-600">[{new Date().toISOString().slice(11, 19)}]</span>
                                <span className={message.startsWith('✓') ? 'text-emerald-400 font-bold' : message.startsWith('←') ? 'text-indigo-400' : 'text-slate-300'}>
                                  {message}
                                </span>
                              </div>
                            );
                          })}
                          {smtpStep < SMTP_LOG_STEPS.length ? (
                            <div className="flex items-center gap-1.5 text-sky-400 animate-pulse pl-1">
                              <span className="w-1.5 h-3.5 bg-sky-500 animate-ping inline-block" />
                              <span className="text-[9px] font-mono">Resolving remote MX payload packet...</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-400 font-bold pl-1 animate-bounce">
                              ● OUTBOUND PACKETS ROUTED OK
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Email HTML Template Output rendering preview */}
                      {smtpStep >= SMTP_LOG_STEPS.length && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2 pt-2"
                        >
                          <span className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Delivered Mailbox Preview (via MX records)</span>
                          
                          {/* Mock Email Frame */}
                          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 text-slate-800 font-sans border border-slate-200 shadow-sm max-h-[320px] overflow-y-auto text-xs relative text-left">
                            {/* Email Header Info */}
                            <div className="border-b border-slate-200 pb-3 mb-4 text-[11px] text-slate-500 space-y-1">
                              <div><strong className="text-slate-705">From:</strong> Apex Intermodal Dispatch System &lt;dispatcher@apextrackhub.com&gt;</div>
                              <div><strong className="text-slate-705">To:</strong> {smtpTargetEmail || 'shipper-terminal@business-hub.com'}</div>
                              <div><strong className="text-slate-705">Subject:</strong> {mailTopic === 'cargo_dispute' ? `[APEX DISPUTE] Shipment ID: ${isAdminAuthenticated ? selectedShipment.id : '••••-••••-••••'} - Cargo Deviation` : mailTopic === 'customs_hold' ? `[CUSTOMS CLEARANCE] Reference ID: ${isAdminAuthenticated ? selectedShipment.id : '••••-••••-••••'}` : `[MANIFEST AMEND] Update Weights for: ${isAdminAuthenticated ? selectedShipment.id : '••••-••••-••••'}`}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Relayed via: Incoming MX mail.apextrackhub.com</div>
                            </div>

                            {/* Branded Mail content */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-slate-900 rounded-md overflow-hidden flex items-center justify-center border border-slate-850">
                                  <img src="/favicon.png" alt="" className="w-full h-full object-cover" />
                                </span>
                                <span className="font-extrabold text-slate-950 tracking-tight text-[11px] uppercase">APEX INTERMODAL LOGISTICS</span>
                              </div>

                              <div className="space-y-2">
                                <p className="font-medium text-slate-950">Official Carrier Dispatch Notification</p>
                                <p className="text-slate-500 leading-relaxed text-[11px]">
                                  An official inquiry has been logged regarding active Container Ref: <strong className="font-mono text-slate-950">{isAdminAuthenticated ? selectedShipment.id : '••••-••••-••••'}</strong>. The details below are active coordinates synced with transport partners.
                                </p>
                              </div>

                              {/* Shipment Progress Grid */}
                              <div className="bg-white p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-3 text-[11px]">
                                <div>
                                  <span className="text-slate-400 block text-[9px] font-mono uppercase">Current Stage</span>
                                  <span className="font-bold text-sky-700 uppercase">{selectedShipment.status.replace(/_/g, ' ')}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] font-mono uppercase">Estimated Delivery</span>
                                  <span className="font-semibold text-slate-800">{selectedShipment.estimatedDelivery}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] font-mono uppercase">Transit Corridor</span>
                                  <span className="font-semibold text-slate-800">{selectedShipment.originCity} ➜ {selectedShipment.destinationCity}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] font-mono uppercase">Bond Reference</span>
                                  <span className="font-mono text-emerald-600 font-bold">REG_FMC_{isAdminAuthenticated ? selectedShipment.id.replace(/-/g, '_') : '••••_••••_••••'}</span>
                                </div>
                              </div>

                              {/* User custom typed notes */}
                              <div className="bg-slate-100 border-l-4 border-slate-400 p-3 rounded-r-xl italic text-slate-650 text-[11px]">
                                <strong className="block text-[9px] text-slate-500 uppercase font-mono tracking-wider not-italic mb-1">Logged Exception details:</strong>
                                "{mailBody || 'No manual exception notes provided. Triggering standard manifest audit.'}"
                              </div>

                              {/* Mail footer */}
                              <p className="text-[10px] text-slate-400 pt-3 border-t border-slate-200 text-center leading-relaxed">
                                This notice is registered at Apex Intermodal USA logistics. Response queues are mapped directly inside the registered MX target inbox.
                                <br />
                                <strong className="text-slate-500 font-mono">support@apextrackhub.com</strong>
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Modal controls */}
                    <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">Status: Online MX Broker API</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSmtpStep(0)}
                          disabled={smtpStep === 0}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-350 rounded-lg uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
                        >
                          Reset Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSmtpModal(false)}
                          className="px-4 py-1.5 bg-sky-500 hover:bg-sky-450 text-slate-950 text-[10px] font-bold rounded-lg uppercase tracking-wider transition font-mono cursor-pointer"
                        >
                          Close Log
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}
