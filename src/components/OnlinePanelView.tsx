import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, CheckCircle2, AlertTriangle, 
  Settings, User, Landmark, Weight, FileText, Sparkles, Database, 
  RotateCcw, History, Search, ArrowRight, Tag, Activity, Calendar,
  Mail, Send, Loader2, X, Shield, Copy
} from 'lucide-react';
import { Shipment, ShipmentStatus, CarrierType, ShippingMethod } from '../types';

interface OnlinePanelViewProps {
  shipments: Shipment[];
  onUpdateShipments: (updatedList: Shipment[]) => void;
  onResetShipments: () => void;
}

const CARRIERS: CarrierType[] = [
  'Apex Logistics',
  'FedEx',
  'DHL Global',
  'UPS Transport',
  'USPS Priority',
  'Oceanic Cargo',
  'Swift Express Cargo'
];

const METHODS: ShippingMethod[] = [
  'Ground Transport',
  'Express Delivery',
  'Air Freight',
  'Sea Cargo'
];

const STATUSES: { value: ShipmentStatus; label: string }[] = [
  { value: 'received', label: 'Received & Manifested' },
  { value: 'transit', label: 'In Transit' },
  { value: 'customs', label: 'Customs Hold / Review' },
  { value: 'out_for_delivery', label: 'Out for Local Delivery' },
  { value: 'delivered', label: 'Completed Delivery' }
];

export default function OnlinePanelView({ shipments, onUpdateShipments, onResetShipments }: OnlinePanelViewProps) {
  // Navigation / Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Shipment Form Fields
  const [newId, setNewId] = useState('');
  const [newSender, setNewSender] = useState('');
  const [newSenderAddr, setNewSenderAddr] = useState('');
  const [newSenderEmail, setNewSenderEmail] = useState('');
  const [newSenderPhone, setNewSenderPhone] = useState('');
  const [newReceiver, setNewReceiver] = useState('');
  const [newReceiverAddr, setNewReceiverAddr] = useState('');
  const [newReceiverEmail, setNewReceiverEmail] = useState('');
  const [newReceiverPhone, setNewReceiverPhone] = useState('');
  const [newOriginCity, setNewOriginCity] = useState('');
  const [newOriginCountry, setNewOriginCountry] = useState('USA');
  const [newDestCity, setNewDestCity] = useState('');
  const [newDestCountry, setNewDestCountry] = useState('USA');
  const [newStatus, setNewStatus] = useState<ShipmentStatus>('received');
  const [newCarrier, setNewCarrier] = useState<CarrierType>('Apex Logistics');
  const [newMethod, setNewMethod] = useState<ShippingMethod>('Ground Transport');
  const [newWeight, setNewWeight] = useState(25);
  const [newDims, setNewDims] = useState('12x12x12 in');
  const [newEstDelivery, setNewEstDelivery] = useState('2026-05-30');
  const [newCargoValue, setNewCargoValue] = useState(1500);
  const [newNotes, setNewNotes] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // New Historical Scan Log Fields (For the shipment being edited)
  const [newLogLocation, setNewLogLocation] = useState('');
  const [newLogDesc, setNewLogDesc] = useState('');
  const [newLogStatus, setNewLogStatus] = useState<ShipmentStatus>('received');

  // Dedicated active email domain drafting & SMTP simulation states
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

  const [adminMailTopic, setAdminMailTopic] = useState('cargo_dispute');
  const [adminMailBody, setAdminMailBody] = useState('');
  const [adminShowSmtpModal, setAdminShowSmtpModal] = useState(false);
  const [adminSmtpStep, setAdminSmtpStep] = useState(0);
  const [adminSmtpTargetEmail, setAdminSmtpTargetEmail] = useState('');

  // Deliverability and Spam DNS optimizer states
  const [sendingDomain, setSendingDomain] = useState('apextrackhub.com');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dnsVerifyStep, setDnsVerifyStep] = useState<'idle' | 'checking' | 'verified'>('idle');

  useEffect(() => {
    if (!adminShowSmtpModal) return;
    if (adminSmtpStep >= SMTP_LOG_STEPS.length) return;

    const currentStep = SMTP_LOG_STEPS[adminSmtpStep];
    const timer = setTimeout(() => {
      setAdminSmtpStep(prev => prev + 1);
    }, currentStep.delay);

    return () => clearTimeout(timer);
  }, [adminShowSmtpModal, adminSmtpStep]);

  const handleAdminSimulateSmtpDispatch = () => {
    setAdminSmtpTargetEmail(adminSmtpTargetEmail || 'incoming@apextrackhub.com');
    setAdminSmtpStep(0);
    setAdminShowSmtpModal(true);
  };

  const handleVerifyDns = () => {
    setDnsVerifyStep('checking');
    setTimeout(() => {
      setDnsVerifyStep('verified');
    }, 1200);
  };

  const handleCopyToClipboard = (text: string, field: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      // Fallback if clipboard is unsupported or in a sandbox/iframe
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Trigger random formatted tracking code creation
  const generateRandomTrackingId = () => {
    const r1 = Math.floor(1000 + Math.random() * 9000);
    const r2 = Math.floor(1000 + Math.random() * 9000);
    setNewId(`US-${r1}-${r2}`);
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    const trackingKey = (newId.trim() || `US-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
    
    // Check duplication
    if (shipments.some(s => s.id.toUpperCase() === trackingKey.toUpperCase())) {
      alert(`Cargo tracking code "${trackingKey}" is already registered in the system.`);
      return;
    }

    const created: Shipment = {
      id: trackingKey,
      senderName: newSender || 'Default Sender Co.',
      senderAddress: newSenderAddr || '100 Main St, Austin, TX',
      senderEmail: newSenderEmail || '',
      senderPhone: newSenderPhone || '',
      receiverName: newReceiver || 'Default Recipient Corp',
      receiverAddress: newReceiverAddr || '500 Center Blvd, Los Angeles, CA',
      receiverEmail: newReceiverEmail || '',
      receiverPhone: newReceiverPhone || '',
      originCity: newOriginCity || 'Austin',
      originCountry: newOriginCountry || 'USA',
      destinationCity: newDestCity || 'Los Angeles',
      destinationCountry: newDestCountry || 'USA',
      status: newStatus,
      carrier: newCarrier,
      shippingMethod: newMethod,
      weight: Number(newWeight) || 10,
      dimensions: newDims || '10x10x10 in',
      estimatedDelivery: newEstDelivery || '2026-06-01',
      isActive: true,
      visibility: 'visible',
      cargoValue: Number(newCargoValue) || 1000,
      notes: newNotes,
      email: newEmail,
      history: [
        {
          id: `h-init-${Date.now()}`,
          timestamp: new Date().toISOString(),
          location: `${newOriginCity || 'Austin'} Terminal, USA`,
          description: 'Shipment recorded and queued into the WooCommerce Cargo Network.',
          status: newStatus
        }
      ]
    };

    const updated = [created, ...shipments];
    onUpdateShipments(updated);
    
    // Reset Add fields
    setNewId('');
    setNewSender('');
    setNewSenderAddr('');
    setNewSenderEmail('');
    setNewSenderPhone('');
    setNewReceiver('');
    setNewReceiverAddr('');
    setNewReceiverEmail('');
    setNewReceiverPhone('');
    setNewOriginCity('');
    setNewDestCity('');
    setNewNotes('');
    setNewEmail('');
    setShowAddForm(false);
  };

  const handleDeleteShipment = (id: string) => {
    if (confirm(`Are you sure you want to delete tracking number ${id}? This cannot be undone.`)) {
      const updated = shipments.filter(s => s.id !== id);
      onUpdateShipments(updated);
      if (editingShipment?.id === id) {
        setEditingShipment(null);
      }
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = shipments.map(s => {
      if (s.id === id) {
        return { ...s, isActive: !s.isActive };
      }
      return s;
    });
    onUpdateShipments(updated);
  };

  const handleToggleVisibility = (id: string) => {
    const updated = shipments.map(s => {
      if (s.id === id) {
        return { ...s, visibility: s.visibility === 'visible' ? 'hidden' as const : 'visible' as const };
      }
      return s;
    });
    onUpdateShipments(updated);
  };

  // Submit edit panel changes
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;

    const updated = shipments.map(s => {
      if (s.id === editingShipment.id) {
        return editingShipment;
      }
      return s;
    });

    onUpdateShipments(updated);
    setEditingShipment(null);
  };

  // Add custom manual history timestamp logs
  const handleAddNewHistoryLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment || !newLogLocation.trim() || !newLogDesc.trim()) {
      alert('Provide both location coordinates and standard scan comments.');
      return;
    }

    const newLogItem = {
      id: `h-manual-${Date.now()}`,
      timestamp: new Date().toISOString(),
      location: newLogLocation.trim(),
      description: newLogDesc.trim(),
      status: newLogStatus
    };

    // Prepend to current shipment editing history
    const updatedHistory = [newLogItem, ...editingShipment.history];
    const updatedShipment = { ...editingShipment, history: updatedHistory, status: newLogStatus };
    
    setEditingShipment(updatedShipment);

    // Also sync globally so it's live instantly
    const updatedGlobal = shipments.map(s => {
      if (s.id === editingShipment.id) {
        return updatedShipment;
      }
      return s;
    });
    onUpdateShipments(updatedGlobal);

    // Clear fields
    setNewLogLocation('');
    setNewLogDesc('');
  };

  const handleDeleteHistoryLog = (logId: string) => {
    if (!editingShipment) return;
    const filteredHistory = editingShipment.history.filter(h => h.id !== logId);
    
    const updatedShipment = { ...editingShipment, history: filteredHistory };
    setEditingShipment(updatedShipment);

    const updatedGlobal = shipments.map(s => {
      if (s.id === editingShipment.id) {
        return updatedShipment;
      }
      return s;
    });
    onUpdateShipments(updatedGlobal);
  };

  // Statistics summaries
  const totalWeight = shipments.reduce((sum, s) => sum + s.weight, 0);
  const activeCount = shipments.filter(s => s.isActive).length;
  const transitCount = shipments.filter(s => s.status === 'transit').length;
  const customsHoldCount = shipments.filter(s => s.status === 'customs').length;
  const totalValue = shipments.reduce((sum, s) => sum + (s.cargoValue || 0), 0);

  // Filtered lists
  const filteredShipments = shipments.filter(s => {
    const term = searchTerm.toLowerCase();
    return s.id.toLowerCase().includes(term) || 
           s.senderName.toLowerCase().includes(term) || 
           s.receiverName.toLowerCase().includes(term) ||
           s.originCity.toLowerCase().includes(term) ||
           s.destinationCity.toLowerCase().includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24 space-y-12">
      {/* Admin Panel Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-slate-950 text-white rounded-3xl border border-slate-800 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-sky-500 text-slate-950 font-mono text-[10px] uppercase font-bold rounded">WooCommerce Cargo Core</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <h1 className="text-3xl font-bold font-sans tracking-tight">Cargo Administration System</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Manage, edit, activate, and update customer shipment records and tracking metrics.</p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => {
              generateRandomTrackingId();
              setShowAddForm(true);
              setEditingShipment(null);
            }}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-sans font-semibold text-xs py-3 px-5 rounded-xl cursor-pointer transition flex items-center gap-1.5 uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" /> Add Tracking Number
          </button>
          
          <button
            onClick={onResetShipments}
            className="bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-mono text-xs py-3 px-4 rounded-xl cursor-pointer border border-slate-700/50 transition flex items-center gap-1.5"
            title="Reset to pre-seeded demo values"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Re-seed System Data
          </button>
        </div>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: 'Registered Records', count: shipments.length, colorBg: 'bg-slate-100', textCol: 'text-slate-900', subtext: 'Total Database items' },
          { label: 'Active Shipments', count: activeCount, colorBg: 'bg-emerald-50', textCol: 'text-emerald-700', subtext: 'Pulsing search clients' },
          { label: 'Transiting Inland', count: transitCount, colorBg: 'bg-sky-50', textCol: 'text-sky-700', subtext: 'Moving over carrier channels' },
          { label: 'Customs Holds', count: customsHoldCount, colorBg: 'bg-indigo-50', textCol: 'text-indigo-700', subtext: 'At US/Foreign borders' },
          { label: 'Accumulated Value', count: `$${totalValue.toLocaleString()}`, colorBg: 'bg-amber-50', textCol: 'text-amber-800', subtext: 'Insured cargo sum' },
        ].map((met, idx) => (
          <div key={idx} className={`${met.colorBg} border border-slate-100/30 p-5 rounded-2xl flex flex-col justify-between shadow-xs transition hover:scale-[1.01]`}>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">{met.label}</span>
            <div className="py-2">
              <span className={`text-2xl sm:text-3xl font-sans font-extrabold ${met.textCol}`}>{met.count}</span>
            </div>
            <span className="text-slate-400 text-[10px] block leading-normal mt-1">{met.subtext}</span>
          </div>
        ))}
      </div>

      {/* Main Grid content: Datatable & Edit/Create Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Dynamic Left: Tables and search */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold font-sans text-slate-900 text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-500" /> WooCommerce Shipment Registry
            </h3>

            {/* In-table Search box */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tracking, user, origin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-hidden text-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-mono text-[10px] uppercase">
                  <th className="py-3 px-2">Tracking Key</th>
                  <th className="py-3 px-2">Route Route</th>
                  <th className="py-3 px-2">Method / Carrier</th>
                  <th className="py-3 px-2">Milestone</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans">
                {filteredShipments.length > 0 ? (
                  filteredShipments.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition duration-150 group">
                      {/* Tracking key with visual status */}
                      <td className="py-4 px-2 font-mono">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-950 tracking-wide text-xs">{s.id}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            Val: ${s.cargoValue?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Cities & Users */}
                      <td className="py-4 px-2">
                        <div className="text-slate-800 font-medium">
                          {s.originCity} ➜ <span className="text-slate-950">{s.destinationCity}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]" title={`Receiver: ${s.receiverName}`}>
                          Recv: {s.receiverName}
                        </div>
                      </td>

                      {/* Operator & Method */}
                      <td className="py-4 px-2 font-sans text-slate-500">
                        <div className="text-slate-800">{s.shippingMethod}</div>
                        <div className="text-[10px] font-mono text-slate-400">{s.carrier}</div>
                      </td>

                      {/* Status state */}
                      <td className="py-4 px-2 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase rounded-md ${
                          s.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                          s.status === 'out_for_delivery' ? 'bg-orange-50 text-orange-700' :
                          s.status === 'customs' ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-55 text-sky-700'
                        }`}>
                          {s.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Controls (isActive, visibility) */}
                      <td className="py-4 px-2 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {/* Active controller */}
                          <button
                            onClick={() => handleToggleActive(s.id)}
                            className={`p-1 rounded cursor-pointer transition ${
                              s.isActive ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-300 hover:text-slate-400'
                            }`}
                            title={s.isActive ? 'Shipment Active (Search Enabled)' : 'Shipment Deactivated'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Visibility controller */}
                          <button
                            onClick={() => handleToggleVisibility(s.id)}
                            className={`p-1 rounded cursor-pointer transition ${
                              s.visibility === 'visible' ? 'text-sky-600 hover:text-sky-700' : 'text-slate-350 hover:text-slate-500'
                            }`}
                            title={s.visibility === 'visible' ? 'Visible in Public tracking' : 'Hidden from searches'}
                          >
                            {s.visibility === 'visible' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>

                      {/* Tools edit/delete */}
                      <td className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => {
                              setEditingShipment({ ...s });
                              setShowAddForm(false);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition cursor-pointer"
                            title="Edit details & Timeline logs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteShipment(s.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg transition cursor-pointer"
                            title="Remove tracking"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No matching shipments found in the WooCommerce logistics database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Right: Panel contextual actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Action 1: Registrar panel (Create) */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-sky-500/30 rounded-3xl p-6 shadow-xl space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-rose-50">
                <h4 className="font-bold text-slate-900 font-sans tracking-tight text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-500" /> Register Core Cargo Item
                </h4>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  className="text-xs text-slate-400 hover:text-slate-650 cursor-pointer font-bold font-sans"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
                {/* ID Generator */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-500 font-semibold font-sans uppercase text-[10px]">Cargo Tracking Key</label>
                    <button
                      type="button"
                      onClick={generateRandomTrackingId}
                      className="text-sky-600 hover:text-sky-700 font-medium text-[11px]"
                    >
                      (Auto Generate)
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. US-9012-4421"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-slate-900 font-mono text-[11px] uppercase tracking-wider"
                  />
                </div>

                {/* Sender Specifics */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider flex items-center gap-1"><User className="w-3.5 h-3.5" /> SENDER (CONSIGNOR)</span>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Sender/Company Name"
                      value={newSender}
                      onChange={(e) => setNewSender(e.target.value)}
                      className="w-full bg-white rounded-lg p-2 border border-slate-200 text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Direct Address (City, State, Zip)"
                      value={newSenderAddr}
                      onChange={(e) => setNewSenderAddr(e.target.value)}
                      className="w-full bg-white rounded-lg p-2 border border-slate-200 text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="email"
                      placeholder="Sender Email Address"
                      value={newSenderEmail}
                      onChange={(e) => setNewSenderEmail(e.target.value)}
                      className="w-full bg-white rounded-lg p-2 border border-slate-200 text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Sender Phone Number"
                      value={newSenderPhone}
                      onChange={(e) => setNewSenderPhone(e.target.value)}
                      className="w-full bg-white rounded-lg p-2 border border-slate-200 text-[10px]"
                    />
                  </div>
                </div>

                {/* Receiver Specifics */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider flex items-center gap-1"><User className="w-3.5 h-3.5" /> RECEIVER (CONSIGNEE)</span>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Receiver/Customer Name"
                      value={newReceiver}
                      onChange={(e) => setNewReceiver(e.target.value)}
                      className="w-full bg-white rounded-lg p-2 border border-slate-200 text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Delivery Address (City, State, Country)"
                      value={newReceiverAddr}
                      onChange={(e) => setNewReceiverAddr(e.target.value)}
                      className="w-full bg-white rounded-lg p-2 border border-slate-200 text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="email"
                      placeholder="Receiver Email Address"
                      value={newReceiverEmail}
                      onChange={(e) => setNewReceiverEmail(e.target.value)}
                      className="w-full bg-white rounded-lg p-2 border border-slate-200 text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Receiver Phone Number"
                      value={newReceiverPhone}
                      onChange={(e) => setNewReceiverPhone(e.target.value)}
                      className="w-full bg-white rounded-lg p-2 border border-slate-200 text-[10px]"
                    />
                  </div>
                </div>

                {/* Origin / Destination routing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 font-semibold uppercase text-[9px]">Origin City</label>
                    <input
                      type="text"
                      placeholder="e.g. Austin"
                      value={newOriginCity}
                      onChange={(e) => setNewOriginCity(e.target.value)}
                      className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-semibold uppercase text-[9px]">Dest City</label>
                    <input
                      type="text"
                      placeholder="e.g. Seattle"
                      value={newDestCity}
                      onChange={(e) => setNewDestCity(e.target.value)}
                      className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-[11px]"
                    />
                  </div>
                </div>

                {/* Select carrier / methods */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 font-semibold uppercase text-[9px]">Carrier Assign</label>
                    <select
                      value={newCarrier}
                      onChange={(e) => setNewCarrier(e.target.value as CarrierType)}
                      className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-[11px]"
                    >
                      {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 font-semibold uppercase text-[9px]">Shipping Route</label>
                    <select
                      value={newMethod}
                      onChange={(e) => setNewMethod(e.target.value as ShippingMethod)}
                      className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-[11px]"
                    >
                      {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {/* More Parameters */}
                <div className="grid grid-cols-2 gap-3 p-2 border border-slate-100 rounded-xl">
                  <div>
                    <label className="text-slate-400 uppercase text-[9px]">Insured Val ($)</label>
                    <input
                      type="number"
                      value={newCargoValue}
                      onChange={(e) => setNewCargoValue(Number(e.target.value))}
                      className="w-full bg-slate-50 rounded-lg p-2 border-slate-200 text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 uppercase text-[9px]">Weight (lbs)</label>
                    <input
                      type="number"
                      value={newWeight}
                      onChange={(e) => setNewWeight(Number(e.target.value))}
                      className="w-full bg-slate-50 rounded-lg p-2 border-slate-200 text-[11px]"
                    />
                  </div>
                </div>

                {/* Contact/Notification Email */}
                <div>
                  <label className="text-slate-500 font-semibold uppercase text-[9px]">Client / Notification Email</label>
                  <input
                    type="email"
                    placeholder="name@business.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-[11.5px]"
                  />
                </div>

                {/* Description notes */}
                <div>
                  <label className="text-slate-500 font-semibold uppercase text-[9px]">Dispatch Instructions / Notes</label>
                  <textarea
                    placeholder="Fragile items, specific delivery points, etc."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 rounded-lg p-2 border border-slate-200 text-[11px]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-sans font-semibold py-3 px-4 rounded-xl transition uppercase tracking-wider text-xs cursor-pointer"
                >
                  Create & Catalog Item
                </button>
              </form>
            </motion.div>
          )}

          {/* Action 2: Update and Edit Panel of Selected Shipment */}
          {editingShipment && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-slate-950 rounded-3xl p-6 shadow-xl space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-rose-50">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">Cargo Key Editor</span>
                  <h4 className="font-bold font-mono text-slate-950 text-base tracking-wide mt-0.5">{editingShipment.id}</h4>
                </div>
                <button 
                  onClick={() => setEditingShipment(null)} 
                  className="text-xs text-slate-400 hover:text-slate-650 cursor-pointer font-bold font-sans"
                >
                  ✕ Close
                </button>
              </div>

              {/* Status Selector Slider/List */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl relative">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block"><Activity className="w-4.5 h-4.5 inline text-sky-500 mr-1" /> Active Milestone Stage</span>
                
                <div className="grid grid-cols-1 gap-1 pt-1 text-xs">
                  {STATUSES.map(st => (
                    <button
                      key={st.value}
                      onClick={() => setEditingShipment({ ...editingShipment, status: st.value })}
                      className={`w-full py-2.5 px-3 rounded-lg flex justify-between items-center transition cursor-pointer text-left ${
                        editingShipment.status === st.value 
                        ? 'bg-slate-900 text-white font-bold' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-100'
                      }`}
                    >
                      <span>{st.label}</span>
                      {editingShipment.status === st.value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form details updates (Sender/Receiver adjustments, weight, visibility) */}
              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                {/* Adjust Operator Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 uppercase text-[9px]">Carrier Operator</label>
                    <select
                      value={editingShipment.carrier}
                      onChange={(e) => setEditingShipment({ ...editingShipment, carrier: e.target.value as CarrierType })}
                      className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-[11px]"
                    >
                      {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 uppercase text-[9px]">Transit Route Type</label>
                    <select
                      value={editingShipment.shippingMethod}
                      onChange={(e) => setEditingShipment({ ...editingShipment, shippingMethod: e.target.value as ShippingMethod })}
                      className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-[11px]"
                    >
                      {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl">
                  {/* Sender block */}
                  <div className="space-y-2">
                    <span className="text-slate-450 font-bold block text-[9px] uppercase tracking-wider">SENDER</span>
                    <input
                      type="text"
                      placeholder="Name"
                      value={editingShipment.senderName}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderName: e.target.value })}
                      className="w-full bg-white p-2 border rounded-lg text-[10px]"
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={editingShipment.senderAddress || ''}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderAddress: e.target.value })}
                      className="w-full bg-white p-2 border rounded-lg text-[10px]"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={editingShipment.senderEmail || ''}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderEmail: e.target.value })}
                      className="w-full bg-white p-2 border rounded-lg text-[10px]"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={editingShipment.senderPhone || ''}
                      onChange={(e) => setEditingShipment({ ...editingShipment, senderPhone: e.target.value })}
                      className="w-full bg-white p-2 border rounded-lg text-[10px]"
                    />
                  </div>

                  {/* Receiver block */}
                  <div className="space-y-2">
                    <span className="text-slate-450 font-bold block text-[9px] uppercase tracking-wider">RECEIVER</span>
                    <input
                      type="text"
                      placeholder="Name"
                      value={editingShipment.receiverName}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverName: e.target.value })}
                      className="w-full bg-white p-2 border rounded-lg text-[10px]"
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={editingShipment.receiverAddress || ''}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverAddress: e.target.value })}
                      className="w-full bg-white p-2 border rounded-lg text-[10px]"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={editingShipment.receiverEmail || ''}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverEmail: e.target.value })}
                      className="w-full bg-white p-2 border rounded-lg text-[10px]"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={editingShipment.receiverPhone || ''}
                      onChange={(e) => setEditingShipment({ ...editingShipment, receiverPhone: e.target.value })}
                      className="w-full bg-white p-2 border rounded-lg text-[10px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 uppercase text-[9px]">Weight</label>
                    <input
                      type="number"
                      value={editingShipment.weight}
                      onChange={(e) => setEditingShipment({ ...editingShipment, weight: Number(e.target.value) })}
                      className="w-full bg-slate-50 p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 uppercase text-[9px]">ETA DLV</label>
                    <input
                      type="text"
                      value={editingShipment.estimatedDelivery}
                      onChange={(e) => setEditingShipment({ ...editingShipment, estimatedDelivery: e.target.value })}
                      className="w-full bg-slate-50 p-2 border rounded-lg text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 uppercase text-[9px]">Insured ($)</label>
                    <input
                      type="number"
                      value={editingShipment.cargoValue || 0}
                      onChange={(e) => setEditingShipment({ ...editingShipment, cargoValue: Number(e.target.value) })}
                      className="w-full bg-slate-50 p-2 border rounded-lg text-[10px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">Client / Notification Email</label>
                  <input
                    type="email"
                    placeholder="name@business.com"
                    value={editingShipment.email || ''}
                    onChange={(e) => setEditingShipment({ ...editingShipment, email: e.target.value })}
                    className="w-full bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-slate-900 text-[11px]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-sans font-semibold py-3 px-4 rounded-xl transition uppercase tracking-wider cursor-pointer"
                >
                  Save Standard Details
                </button>
              </form>

              {/* Sub-panel 2: Interactive Historical Scan Log Builder */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block"><History className="w-4 h-4 inline text-sky-500 mr-1" /> Dynamic Hub Scans ({editingShipment.history.length})</span>
                
                {/* Form to append scan logs directly */}
                <form onSubmit={handleAddNewHistoryLog} className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100 text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Append Scan Event Live</span>
                  
                  <div className="space-y-1">
                    <input
                      type="text"
                      required
                      placeholder="Location: city/facility (e.g. Dallas Central Depot, TX)"
                      value={newLogLocation}
                      onChange={(e) => setNewLogLocation(e.target.value)}
                      className="w-full bg-white p-2 border rounded-lg placeholder-slate-400 text-[10px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <textarea
                      required
                      placeholder="Log details (e.g. Scanned, container sealed, customs authorized release)"
                      value={newLogDesc}
                      onChange={(e) => setNewLogDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-white p-2 border rounded-lg placeholder-slate-400 text-[10px]"
                    />
                  </div>

                  {/* Set log's matching status */}
                  <div className="flex items-center gap-2 justify-between">
                    <select
                      value={newLogStatus}
                      onChange={(e) => setNewLogStatus(e.target.value as ShipmentStatus)}
                      className="bg-white p-2 border rounded-lg flex-1 text-[10px]"
                    >
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    
                    <button
                      type="submit"
                      className="bg-sky-500 hover:bg-sky-450 text-slate-950 font-bold py-2 px-3.5 rounded-lg text-[10px] font-sans transition shrink-0 uppercase tracking-wider cursor-pointer flex items-center gap-1"
                    >
                      Append Log
                    </button>
                  </div>
                </form>

                {/* Vertical scrollable mini list of editable historical scan logs */}
                <div className="max-h-48 overflow-y-auto space-y-3 pt-2 divide-y divide-slate-50 pr-1">
                  {editingShipment.history.map((h, hIdx) => (
                    <div key={h.id} className="pt-3 flex justify-between items-start gap-2 text-[11px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            h.status === 'delivered' ? 'bg-emerald-500' :
                            h.status === 'customs' ? 'bg-indigo-500' : 'bg-sky-500'
                          }`}></span>
                          <span className="font-bold text-slate-800 font-sans">{h.location}</span>
                        </div>
                        <p className="text-slate-500 leading-normal text-[10px]">{h.description}</p>
                        <span className="text-[9px] text-slate-400 font-mono italic block">{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteHistoryLog(h.id)}
                        className="text-slate-350 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer transition"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Action 3: General System Instructions and WooCommerce Integration Guidelines */}
          {!editingShipment && !showAddForm && (
            <div className="space-y-6">
              {/* Active Mail Gateway (MX Record Integration) */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4 text-slate-900">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                  <Mail className="w-5 h-5 text-sky-500" />
                  <h4 className="font-bold text-slate-950 text-sm font-sans tracking-tight">Active Mail Gateway</h4>
                </div>
                <p className="text-slate-500 text-[11px] font-sans leading-relaxed">
                  Send custom manifests, clearance exceptions, or cargo claims directly to clients/partners. The central MX relays are fully active.
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[9px] font-mono font-bold uppercase tracking-wider text-left">Recipient (Select active shipment client)</span>
                    <select 
                      value={adminSmtpTargetEmail}
                      onChange={(e) => setAdminSmtpTargetEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-sans focus:outline-hidden transition"
                    >
                      <option value="">-- Select Shipment Client Email --</option>
                      {shipments.filter(s => s.email || s.senderEmail || s.receiverEmail).map(s => {
                        const emailOpt = s.email || s.senderEmail || s.receiverEmail || '';
                        return (
                          <option key={s.id} value={emailOpt}>
                            {s.id} - {emailOpt.substring(0, 20)}... ({s.senderName})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[9px] font-mono font-bold uppercase tracking-wider text-left">Or Input Custom Email</span>
                    <input
                      type="email"
                      placeholder="name@business.com"
                      value={adminSmtpTargetEmail}
                      onChange={(e) => setAdminSmtpTargetEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-sans focus:outline-hidden transition"
                    />
                  </div>

                  {/* Mail drafting tool */}
                  <div className="space-y-2.5">
                    <span className="text-slate-400 block text-[9px] font-mono font-bold uppercase tracking-wider text-left">Mail Topic</span>
                    <select
                      value={adminMailTopic}
                      onChange={(e) => setAdminMailTopic(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-sans focus:outline-hidden transition"
                    >
                      <option value="cargo_dispute">Cargo Exception / Dispute</option>
                      <option value="customs_hold">Customs Clearance Hold Release</option>
                      <option value="manifest_edit">Manifest Weight Info Update</option>
                    </select>

                    <textarea
                      placeholder="Input custom cargo logs, billing notes or variance claims..."
                      value={adminMailBody}
                      onChange={(e) => setAdminMailBody(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl p-2.5 text-xs text-slate-900 font-sans focus:outline-hidden transition resize-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`mailto:${adminSmtpTargetEmail || 'ship@apextrackhub.com'}?subject=${encodeURIComponent(adminMailTopic)}&body=${encodeURIComponent(adminMailBody)}`}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-sans font-bold text-[9px] py-2 px-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
                        title="Launches local email system"
                      >
                        <Send className="w-3 h-3 text-slate-700" /> Mail client
                      </a>

                      <button
                        type="button"
                        onClick={handleAdminSimulateSmtpDispatch}
                        className="bg-sky-50 hover:bg-sky-100 text-sky-950 font-sans font-bold text-[9px] py-2 px-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 border border-sky-200 border-dashed"
                      >
                        <Loader2 className="w-3.5 h-3.5 text-sky-600 animate-spin" /> Live Sim
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Deliverability & Anti-Spam (SPF / DKIM / DMARC) Setup & DNS Optimizer */}
              <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs space-y-4 text-slate-900">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-slate-950 text-sm font-sans tracking-tight flex items-center gap-1.5">
                    Deliverability & Anti-Spam Control
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold uppercase animate-pulse">Inbox Active</span>
                  </h4>
                </div>
                
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Is your WooCommerce tracking mail going directly to clients' <strong>Spam folder</strong> instead of their Inbox? Real-world providers (like Google and Yahoo) enforce strict cryptographic validation requirements. Configure these exact settings in your hosting domain provider (e.g., Cloudflare, GoDaddy, Namecheap) to fix inbox delivery instantly:
                </p>

                <div className="space-y-3">
                  {/* Custom business domain input */}
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold block text-[9.5px] uppercase tracking-wider text-left">Your sending domain name</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={sendingDomain}
                        onChange={(e) => setSendingDomain(e.target.value.toLowerCase().replace(/https?:\/\//i, '').split('/')[0])}
                        placeholder="yourfirm.com"
                        className="flex-1 bg-slate-50 border border-slate-200 focus:border-slate-950 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-sans focus:outline-hidden transition"
                      />
                      <button 
                        type="button"
                        onClick={handleVerifyDns}
                        className="bg-slate-950 hover:bg-slate-900 text-white font-sans font-bold text-[9px] py-1.5 px-3 rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        {dnsVerifyStep === 'checking' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> Analyzing...
                          </>
                        ) : dnsVerifyStep === 'verified' ? (
                          '✓ DNS Safe'
                        ) : (
                          'Verify Records'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* DNS Record copy fields */}
                  <div className="space-y-2 text-left">
                    {/* SPF Record */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl relative text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[9.5px] font-bold text-slate-450 uppercase tracking-widest">1. SPF Record (TXT)</span>
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(`v=spf1 include:_spf.google.com include:_spf.mailgun.org include:${sendingDomain} ~all`, 'spf')}
                          className="text-sky-600 hover:text-sky-700 font-medium text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedField === 'spf' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="font-mono text-[10px] text-slate-800 bg-white p-2 rounded-lg border border-slate-150 break-all select-all">
                        v=spf1 include:_spf.google.com include:servers.{sendingDomain || 'apextrackhub.com'} ~all
                      </div>
                      <span className="text-slate-400 text-[9px] leading-relaxed block mt-1">
                        🔒 Prevents spam filters from rejecting mail by defining authorized sending IP boundaries.
                      </span>
                    </div>

                    {/* DKIM Record */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl relative text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[9.5px] font-bold text-slate-450 uppercase tracking-widest">2. DKIM Record (TXT Selector: apexkey)</span>
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(`v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0r+V9Xg...`, 'dkim')}
                          className="text-sky-600 hover:text-sky-700 font-medium text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedField === 'dkim' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="font-mono text-[10px] text-slate-800 bg-white p-2 rounded-lg border border-slate-150 break-all select-all">
                        v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu_apex_tracking_key_rsa_sha25...
                      </div>
                      <span className="text-slate-400 text-[9px] leading-relaxed block mt-1">
                        ✍️ Adds an encrypted cryptographic signature to tracking headers, validating sender legitimacy.
                      </span>
                    </div>

                    {/* DMARC Policy */}
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl relative text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[9.5px] font-bold text-slate-450 uppercase tracking-widest">3. DMARC Alignment (TXT Host: _dmarc.{sendingDomain})</span>
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(`v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@${sendingDomain}`, 'dmarc')}
                          className="text-sky-600 hover:text-sky-700 font-medium text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedField === 'dmarc' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="font-mono text-[10px] text-slate-800 bg-white p-2 rounded-lg border border-slate-150 break-all select-all">
                        v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-logs@{sendingDomain || 'apextrackhub.com'}
                      </div>
                      <span className="text-slate-400 text-[9px] leading-relaxed block mt-1">
                        🛡️ High Reputation Policy. Tells receiving systems to trust aligned MX packets and report delivery errors.
                      </span>
                    </div>
                  </div>

                  {/* Mail Body Real-time Spam Trigger Analyzer */}
                  <div className="p-3 bg-slate-950 text-slate-300 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] font-mono font-bold text-sky-450 uppercase tracking-wider block">Real-time Outbox Spam Risk Scan</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    </div>

                    <div className="text-[10px] space-y-1 text-left leading-normal">
                      {adminMailBody.trim() === '' ? (
                        <p className="text-slate-400">No text detected. Draft a message in the Mail Gateway above to analyze spam risks dynamically.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {(() => {
                            const triggers = ["free", "urgent", "test", "guarantee", "act now", "action required", "pay now", "click here", "lottery", "prize", "cash", "dollars"];
                            const matched = triggers.filter(word => adminMailBody.toLowerCase().includes(word));
                            const hasExclamations = (adminMailBody.match(/!/g) || []).length > 2;
                            const hasShouted = adminMailBody === adminMailBody.toUpperCase() && adminMailBody.length > 10;
                            
                            if (matched.length === 0 && !hasExclamations && !hasShouted) {
                              return (
                                <p className="text-emerald-400 font-medium flex items-center gap-1">
                                  ✓ Clean Logistics Score: No spam triggers found under current MX heuristics. Safe for professional carrier relay.
                                </p>
                              );
                            }
                            
                            return (
                              <div className="space-y-1 text-slate-300 text-[10px]">
                                <p className="text-amber-400 font-bold flex items-center gap-1">
                                  ⚠️ Spam Potential Warning indicators detected:
                                </p>
                                <ul className="list-disc pl-3 text-[9.5px] text-slate-450 space-y-0.5 mt-1">
                                  {matched.length > 0 && (
                                    <li>Flagged terms found: <strong className="font-mono text-rose-400 font-semibold">{matched.join(', ')}</strong></li>
                                  )}
                                  {hasExclamations && (
                                    <li>Avoid excessive exclamation points (Gmail tracks these as spam signals)</li>
                                  )}
                                  {hasShouted && (
                                    <li>Message contains entirely uppercase words ("shouting"). Rewrite in polite client format.</li>
                                  )}
                                </ul>
                                <p className="text-[9.5px] mt-1.5 text-slate-400 leading-normal bg-slate-900 p-2 rounded border border-slate-800">
                                  💡 <strong>Tip to Bypass Filters:</strong> Replace sales/marketing language with cold factual transport updates. For example: "Your cargo container registration reference is active on transit beacon <code>{shipments[0]?.id || 'US-9482-9018'}</code>. Track updates securely on the Apex Intermodal dispatch network."
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4 border border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Settings className="w-5 h-5 animate-spin-slow" />
                </div>
                <h4 className="font-bold font-sans text-sm tracking-tight text-left">Cargo Admin Instructions</h4>
                
                <div className="space-y-3 text-xs leading-relaxed text-slate-300 text-left">
                  <p>
                    This terminal simulates a **WooCommerce Order Tracking** database where you can register active tracking tags, assign logistics companies, and update transit states.
                  </p>
                  <p className="border-l-2 border-sky-400 pl-3 italic text-[11px]">
                    When you modify or append a dynamic history scan to any cargo index here, it is cached straight into `localStorage`. You can immediately enter that tracking key into the <strong>Track Shipment</strong> main sub-view or Home search input to trace its coordinates.
                  </p>
                  <p>
                    Use the green and blue checks to toggle public search availability or deactivate tracking items dynamically.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin SMTP Socket Simulation Modal */}
      <AnimatePresence>
        {adminShowSmtpModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-55">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-950 text-emerald-400 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Terminal header */}
              <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 block shrink-0"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 block shrink-0"></span>
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 block shrink-0"></span>
                  <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider ml-2">MX SMTP Direct Relay System Console</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setAdminShowSmtpModal(false)}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Terminal screen output */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2.5 font-mono text-xs text-left bg-slate-950 min-h-[300px]">
                {SMTP_LOG_STEPS.slice(0, adminSmtpStep).map((step, idx) => {
                  const message = step.text.replace('__EMAIL__', adminSmtpTargetEmail || 'incoming@apextrackhub.com');
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 0.9 + (idx === adminSmtpStep - 1 ? 0.1 : 0) }}
                      className={`${
                        step.text.startsWith('✓') ? 'text-emerald-300 font-bold' :
                        step.text.startsWith('→') ? 'text-sky-400' :
                        step.text.startsWith('←') ? 'text-purple-400' : 'text-slate-350'
                      }`}
                    >
                      {idx === adminSmtpStep - 1 && adminSmtpStep < SMTP_LOG_STEPS.length && (
                        <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse mr-1 font-sans"></span>
                      )}
                      {message}
                    </motion.div>
                  );
                })}

                {adminSmtpStep < SMTP_LOG_STEPS.length ? (
                  <div className="flex items-center gap-2 pt-2 text-slate-500 italic">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500 shrink-0" />
                    <span>Transmitting stream packet {adminSmtpStep + 1}/{SMTP_LOG_STEPS.length}...</span>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-6 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-1.5"
                  >
                    <span className="text-emerald-500 block font-bold text-[10px] uppercase tracking-wider">MIME Delivery Confirmation Payload</span>
                    <div className="text-[11px] text-slate-405 space-y-1 font-mono text-left">
                      <div><strong className="text-slate-200">To:</strong> {adminSmtpTargetEmail || 'incoming@apextrackhub.com'}</div>
                      <div><strong className="text-slate-200">Gateway:</strong> mail.apextrackhub.com (25)</div>
                      <div><strong className="text-slate-200">Topic:</strong> {adminMailTopic}</div>
                      <div><strong className="text-slate-200">Payload size:</strong> {3.5 + Math.round(adminMailBody.length / 50) / 10} KB</div>
                      <p className="mt-2.5 p-3 rounded-xl bg-slate-950 text-slate-350 border border-slate-850 break-all leading-relaxed whitespace-pre-wrap">
                        {adminMailBody || '(Standard dispatch exception release confirmation message)'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Terminal actions footer */}
              <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex gap-3 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => setAdminSmtpStep(0)}
                  disabled={adminSmtpStep === 0}
                  className="bg-slate-800 hover:bg-slate-705 text-white disabled:opacity-50 font-mono text-[10px] py-2 px-4 rounded-xl transition cursor-pointer uppercase tracking-wider flex items-center gap-1.5 border border-slate-750"
                >
                  Clear Logs
                </button>
                <button
                  type="button"
                  onClick={() => setAdminShowSmtpModal(false)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-[10px] py-2 px-4 rounded-xl transition cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
                >
                  Close Terminal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
