import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Unlock, ShieldAlert, Key, Plus, Edit3, Save, RefreshCw, 
  Trash2, AlertCircle, CheckCircle2, Database, Layers, Search, Clock,
  User, Mail, Phone, MapPin, Package, Globe, Calendar, CreditCard,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/tracking';

// Default Master Password
const MASTER_PASSWORD = 'admin';

export default function AdminView() {
  // Authorization States
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return localStorage.getItem('apex_supabase_admin_auth') === 'true';
  });
  const [authError, setAuthError] = useState('');

  // Dashboard and Telemetry States
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form States (for creating/editing)
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [eventName, setEventName] = useState('shipment_created');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('Apex Logistics');
  const [status, setStatus] = useState('received');
  const [notes, setNotes] = useState('');

  // WooCommerce/WP Cargo Intake Fields
  const [shipperName, setShipperName] = useState('');
  const [shipperPhone, setShipperPhone] = useState('');
  const [shipperEmail, setShipperEmail] = useState('');
  const [shipperAddress, setShipperAddress] = useState('');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');

  const [cargoType, setCargoType] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [piecesCount, setPiecesCount] = useState('1');
  const [paymentMode, setPaymentMode] = useState('prepaid');

  const [originHarbor, setOriginHarbor] = useState('');
  const [estDeliveryDate, setEstDeliveryDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [totalFreightCharge, setTotalFreightCharge] = useState('');

  // Collapsible rows tracking
  const [expandedRows, setExpandedRows] = useState<Record<string | number, boolean>>({});

  const toggleRowExpanded = (id: string | number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Local/Fallback Database for preview when Supabase is not fully configured or is loading
  const [localFallbackDb, setLocalFallbackDb] = useState<any[]>([
    {
      id: 1,
      event_name: 'shipment_created',
      event_data: {
        trackingId: 'AP-2026-9481',
        tracking_number: 'AP-2026-9481',
        carrier: 'Apex Logistics',
        status: 'received',
        timestamp: new Date().toISOString(),
        notes: 'Initial bulk cargo allocation received from sea dock.'
      }
    },
    {
      id: 2,
      event_name: 'cargo_status_updated',
      event_data: {
        trackingId: 'AP-2026-9482',
        tracking_number: 'AP-2026-9482',
        carrier: 'Oceanic Cargo',
        status: 'transit',
        timestamp: new Date().toISOString(),
        notes: 'Vessel departing offshore Gulf of Mexico.'
      }
    }
  ]);

  // Sync auth state to localStorage
  useEffect(() => {
    localStorage.setItem('apex_supabase_admin_auth', String(isAuthorized));
  }, [isAuthorized]);

  // Load telemetry records from Supabase
  const fetchRecords = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    if (!supabase) {
      // Graceful fallback to local mock database if Supabase client is offline
      setRecords(localFallbackDb);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tracking_data')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        setRecords(data);
      } else {
        setRecords([]);
      }
    } catch (err: any) {
      console.warn('[Supabase Admin] Error fetching records:', err?.message || err);
      setErrorMessage(`Could not read "tracking_data" table. Showing local fallback data. Error: ${err?.message || err}`);
      setRecords(localFallbackDb);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger records load when authorized
  useEffect(() => {
    if (isAuthorized) {
      fetchRecords();
    }
  }, [isAuthorized]);

  // Keep tracking local fallback db updates
  useEffect(() => {
    if (!supabase && isAuthorized) {
      setRecords(localFallbackDb);
    }
  }, [localFallbackDb]);

  // Password Authentication handler
  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === MASTER_PASSWORD) {
      setIsAuthorized(true);
      setAuthError('');
      setSuccessMessage('Successfully authenticated to Supabase panel.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setAuthError('Access Denied: Invalid security password code.');
    }
  };

  // Log out handler
  const handleLogout = () => {
    setIsAuthorized(false);
    setPasswordInput('');
    localStorage.removeItem('apex_supabase_admin_auth');
  };

  // Populate Form for Editing
  const handleEditInitiate = (record: any) => {
    setIsEditing(true);
    setSelectedId(record.id);
    setEventName(record.event_name || 'shipment_created');
    
    const meta = record.event_data || {};
    setTrackingNumber(meta.trackingId || meta.tracking_number || '');
    setCarrier(meta.carrier || 'Apex Logistics');
    setStatus(meta.status || 'received');
    setNotes(meta.notes || '');

    const shipper = meta.shipper || {};
    setShipperName(shipper.name || '');
    setShipperPhone(shipper.phone || '');
    setShipperEmail(shipper.email || '');
    setShipperAddress(shipper.address || '');

    const receiver = meta.receiver || {};
    setReceiverName(receiver.name || '');
    setReceiverPhone(receiver.phone || '');
    setReceiverEmail(receiver.email || '');
    setReceiverAddress(receiver.address || '');

    setCargoType(meta.cargoType || '');
    setTotalWeight(meta.totalWeight || '');
    setPiecesCount(meta.piecesCount || '1');
    setPaymentMode(meta.paymentMode || 'prepaid');

    setOriginHarbor(meta.originHarbor || '');
    setEstDeliveryDate(meta.estDeliveryDate || '');
    setDepartureDate(meta.departureDate || '');
    setDimensions(meta.dimensions || '');
    setTotalFreightCharge(meta.totalFreightCharge || '');
    
    // Smooth scroll to form
    const formElement = document.getElementById('shipment-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Clear Form State
  const handleResetForm = () => {
    setIsEditing(false);
    setSelectedId(null);
    setEventName('shipment_created');
    setTrackingNumber('');
    setCarrier('Apex Logistics');
    setStatus('received');
    setNotes('');

    setShipperName('');
    setShipperPhone('');
    setShipperEmail('');
    setShipperAddress('');

    setReceiverName('');
    setReceiverPhone('');
    setReceiverEmail('');
    setReceiverAddress('');

    setCargoType('');
    setTotalWeight('');
    setPiecesCount('1');
    setPaymentMode('prepaid');

    setOriginHarbor('');
    setEstDeliveryDate('');
    setDepartureDate('');
    setDimensions('');
    setTotalFreightCharge('');
  };

  // Save changes (Insert or Update row in database)
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!trackingNumber.trim()) {
      setErrorMessage('Please enter a valid tracking number.');
      return;
    }

    const payloadEventData = {
      trackingId: trackingNumber.trim().toUpperCase(),
      tracking_number: trackingNumber.trim().toUpperCase(),
      carrier,
      status,
      notes: notes.trim(),
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Admin Dashboard',
      referrer: 'supabase-admin-dashboard',
      shipper: {
        name: shipperName.trim(),
        phone: shipperPhone.trim(),
        email: shipperEmail.trim(),
        address: shipperAddress.trim()
      },
      receiver: {
        name: receiverName.trim(),
        phone: receiverPhone.trim(),
        email: receiverEmail.trim(),
        address: receiverAddress.trim()
      },
      cargoType: cargoType.trim(),
      totalWeight: totalWeight.trim(),
      piecesCount: parseInt(String(piecesCount)) || 1,
      paymentMode,
      originHarbor: originHarbor.trim(),
      estDeliveryDate,
      departureDate,
      dimensions: dimensions.trim(),
      totalFreightCharge: totalFreightCharge.trim()
    };

    setIsLoading(true);

    if (supabase) {
      try {
        if (isEditing && selectedId !== null) {
          // Asynchronous update command in Supabase
          const { data, error } = await supabase
            .from('tracking_data')
            .update({
              event_name: eventName,
              event_data: payloadEventData
            })
            .eq('id', selectedId)
            .select();

          if (error) throw new Error(error.message);
          setSuccessMessage(`Successfully updated row ID ${selectedId} in Supabase!`);
        } else {
          // Asynchronous insert command in Supabase
          const { data, error } = await supabase
            .from('tracking_data')
            .insert([
              {
                event_name: eventName,
                event_data: payloadEventData
              }
            ])
            .select();

          if (error) throw new Error(error.message);
          setSuccessMessage('Successfully inserted a new shipment record into Supabase tracking_data!');
        }

        // Reload data from live table
        await fetchRecords();
        handleResetForm();
      } catch (err: any) {
        console.error('[Supabase Admin] Save Failed:', err);
        setErrorMessage(`Supabase Operation Failed: ${err?.message || err}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Supabase not online, process local fallback update/insert simulated state
      setTimeout(() => {
        if (isEditing && selectedId !== null) {
          setLocalFallbackDb(prev => 
            prev.map(item => 
              item.id === selectedId 
                ? { ...item, event_name: eventName, event_data: payloadEventData }
                : item
            )
          );
          setSuccessMessage(`[Simulated Fallback] Updated record ID ${selectedId} successfully.`);
        } else {
          const nextId = localFallbackDb.length > 0 
            ? Math.max(...localFallbackDb.map(i => i.id)) + 1 
            : 1;
          const newRecord = {
            id: nextId,
            event_name: eventName,
            event_data: payloadEventData
          };
          setLocalFallbackDb(prev => [newRecord, ...prev]);
          setSuccessMessage('[Simulated Fallback] Created a new shipment record successfully.');
        }
        setIsLoading(false);
        handleResetForm();
      }, 600);
    }
  };

  // Delete handler
  const handleDeleteRecord = async (id: string | number) => {
    if (!confirm(`Are you sure you want to permanently delete record ID ${id}?`)) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (supabase) {
      try {
        const { error } = await supabase
          .from('tracking_data')
          .delete()
          .eq('id', id);

        if (error) throw new Error(error.message);
        setSuccessMessage(`Record ID ${id} deleted successfully from Supabase.`);
        await fetchRecords();
      } catch (err: any) {
        setErrorMessage(`Delete action failed: ${err?.message || err}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        setLocalFallbackDb(prev => prev.filter(item => item.id !== id));
        setSuccessMessage(`[Simulated Fallback] Deleted record ID ${id}.`);
        setIsLoading(false);
      }, 500);
    }
  };

  // UI Lock Screen for unauthorized users
  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 px-6 py-10 bg-white rounded-2xl border border-slate-100 shadow-xl font-sans" id="supabase-admin-lock-screen">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center animate-pulse">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Access Restricted</h2>
            <p className="text-xs text-slate-500 font-mono">SUPABASE TRACKING_DATA CONTROL PANEL</p>
          </div>

          <form onSubmit={handleAuthenticate} className="w-full space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest block">
                Enter Master Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Enter administrator password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-mono text-center tracking-widest transition"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-slate-400 font-mono text-center mt-1">Hint: Type <span className="font-bold text-slate-600">admin</span> to unlock</p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition shadow-md cursor-pointer"
            >
              Authorize Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans" id="supabase-admin-dashboard-container">
      
      {/* Upper Status Header Card */}
      <div 
        className="text-white rounded-3xl p-6 sm:p-8 border border-slate-900 shadow-xl mb-8 relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.88)), url('https://lh3.googleusercontent.com/d/19y8tABlqkTXY987Jx6N1QouO7oBn-pqw')` }}
      >
        {/* Glow decorative pattern */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-60 h-60 bg-emerald-600/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-[10px] font-mono tracking-wider uppercase font-bold">
                SUPABASE LIVE
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">Table: tracking_data</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tracking Telemetry Control Panel
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Read, insert, and update historical logistics milestones inside the master tracking repository. Writes map to the <code className="bg-slate-900 px-1 py-0.5 text-sky-300 font-mono rounded">event_name</code> and <code className="bg-slate-900 px-1 py-0.5 text-sky-300 font-mono rounded">event_data</code> columns.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchRecords}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono font-medium border border-slate-800 hover:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Reload Table
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-rose-650 hover:bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock Console
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="mb-6">
        {errorMessage && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold uppercase tracking-wider text-[10px] text-amber-800">Connection/Query Status Alert</p>
              <p className="font-medium leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-950 text-xs flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="font-semibold">{successMessage}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Shipment Create / Edit Form */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-md space-y-6" id="shipment-form-section">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base uppercase tracking-tight">
                {isEditing ? 'Modify Track Entry' : 'Create New Shipment'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {isEditing ? `Editing Row ID: ${selectedId}` : 'Appends row to tracking_data table'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveChanges} className="space-y-6">
            {/* 1. SHIPMENT OVERVIEW */}
            <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200/60 pb-1.5 flex items-center gap-1.5 font-sans">
                <Layers className="w-3.5 h-3.5 text-sky-500" /> 1. Shipment Overview
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Event Type Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Event Type
                  </label>
                  <select
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  >
                    <option value="shipment_created">shipment_created (Shipment Created)</option>
                    <option value="updated_logistics">updated_logistics (Updated Logistics)</option>
                    <option value="cargo_status_updated">cargo_status_updated (Cargo Status Updated)</option>
                    <option value="app_session_initialized">app_session_initialized (App Session Init)</option>
                    <option value="cargo_dispute_logged">cargo_dispute_logged (Cargo Dispute Logged)</option>
                    <option value="custom_milestone">custom_milestone (Custom Milestone)</option>
                  </select>
                </div>

                {/* Internal Ref ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Internal Ref ID (trackingNumber)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AP-2026-X"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                    required
                  />
                </div>
              </div>

              {/* Carrier Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Courier / Carrier
                </label>
                <select
                  value={
                    carrier === ''
                      ? 'custom'
                      : ['Apex Logistics', 'FedEx', 'DHL Global', 'UPS Transport', 'USPS Priority', 'Oceanic Cargo', 'Swift Express Cargo'].includes(carrier)
                      ? carrier
                      : 'custom'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setCarrier('');
                    } else {
                      setCarrier(val);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                >
                  <option value="Apex Logistics">Apex Logistics</option>
                  <option value="FedEx">FedEx</option>
                  <option value="DHL Global">DHL Global</option>
                  <option value="UPS Transport">UPS Transport</option>
                  <option value="USPS Priority">USPS Priority</option>
                  <option value="Oceanic Cargo">Oceanic Cargo</option>
                  <option value="Swift Express Cargo">Swift Express Cargo</option>
                  <option value="custom">Other (Enter Custom Carrier)...</option>
                </select>
                {(carrier === '' || !['Apex Logistics', 'FedEx', 'DHL Global', 'UPS Transport', 'USPS Priority', 'Oceanic Cargo', 'Swift Express Cargo'].includes(carrier)) && (
                  <input
                    type="text"
                    placeholder="Type Custom Carrier Name"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 animate-fade-in"
                    required
                  />
                )}
              </div>
            </div>

            {/* 2. SHIPPER / ORIGIN */}
            <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200/60 pb-1.5 flex items-center gap-1.5 font-sans">
                <MapPin className="w-3.5 h-3.5 text-sky-500" /> 2. Shipper / Origin
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Shipper Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme MFG Industries"
                    value={shipperName}
                    onChange={(e) => setShipperName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Shipper Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 902-1920"
                    value={shipperPhone}
                    onChange={(e) => setShipperPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Origin Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street, Suite, City, State, ZIP Code, Country"
                  value={shipperAddress}
                  onChange={(e) => setShipperAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Departure Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 3. RECEIVER / DESTINATION */}
            <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200/60 pb-1.5 flex items-center gap-1.5 font-sans">
                <User className="w-3.5 h-3.5 text-emerald-500" /> 3. Receiver / Destination
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Receiver Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Global Depot LLC"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Receiver Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +44 20 7946 0192"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Destination Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street, Dock, City, State, Postal Code, Country"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={estDeliveryDate}
                  onChange={(e) => setEstDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            {/* 4. CARGO / PACKAGE DETAILS */}
            <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200/60 pb-1.5 flex items-center gap-1.5 font-sans">
                <Package className="w-3.5 h-3.5 text-indigo-500" /> 4. Cargo / Package Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Type of Cargo */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Type of Cargo
                  </label>
                  <select
                    value={
                      cargoType === ''
                        ? 'custom'
                        : ['General Cargo', 'Hazardous Materials', 'Perishable Goods', 'Fragile / High-Value', 'Refrigerated / Reefer', 'Dry Bulk', 'Liquid Bulk'].includes(cargoType)
                        ? cargoType
                        : 'custom'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setCargoType('');
                      } else {
                        setCargoType(val);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  >
                    <option value="">-- Select Cargo Type --</option>
                    <option value="General Cargo">General Cargo</option>
                    <option value="Hazardous Materials">Hazardous Materials</option>
                    <option value="Perishable Goods">Perishable Goods</option>
                    <option value="Fragile / High-Value">Fragile / High-Value</option>
                    <option value="Refrigerated / Reefer">Refrigerated / Reefer</option>
                    <option value="Dry Bulk">Dry Bulk</option>
                    <option value="Liquid Bulk">Liquid Bulk</option>
                    <option value="custom">Other (Custom Cargo)...</option>
                  </select>
                  {(cargoType === '' || !['General Cargo', 'Hazardous Materials', 'Perishable Goods', 'Fragile / High-Value', 'Refrigerated / Reefer', 'Dry Bulk', 'Liquid Bulk'].includes(cargoType)) && (
                    <input
                      type="text"
                      placeholder="Type Custom Cargo Type"
                      value={cargoType}
                      onChange={(e) => setCargoType(e.target.value)}
                      className="mt-2 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 animate-fade-in"
                      required
                    />
                  )}
                </div>

                {/* Weight */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Weight (KG/LBS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 15400"
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dimensions */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Dimensions (L x W x H)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 120 x 80 x 160 cm"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                {/* Pieces count */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Piece Count (Quantity)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1"
                    value={piecesCount}
                    onChange={(e) => setPiecesCount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 5. STATUS & PAYMENT */}
            <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-200/60 pb-1.5 flex items-center gap-1.5 font-sans">
                <CreditCard className="w-3.5 h-3.5 text-amber-500" /> 5. Status & Payment Details
              </h4>

              {/* Status Pill-Button Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Log Status (metadata: status)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { value: 'received', label: 'Received' },
                    { value: 'transit', label: 'In Transit' },
                    { value: 'customs', label: 'Customs' },
                    { value: 'out_for_delivery', label: 'Out for Delivery' },
                    { value: 'delivered', label: 'Delivered' }
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value)}
                      className={`py-2 px-1 border rounded-xl text-center text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                        status === s.value
                          ? 'bg-sky-50 border-sky-200 text-sky-800 ring-1 ring-sky-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Mode */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  >
                    <option value="prepaid">Prepaid</option>
                    <option value="cash_on_delivery">Cash on Delivery</option>
                    <option value="collect">Collect</option>
                    <option value="postpaid_invoice">Postpaid Invoice</option>
                  </select>
                </div>

                {/* Total Freight Charge */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Total Freight Charge
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
                      $
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 1,250.00"
                      value={totalFreightCharge.replace(/^\$/, '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTotalFreightCharge(val ? `$${val}` : '');
                      }}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Event Log Comments */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Event Log Comments / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Internal comments regarding scheduling, priority clearance, container assignment, or harbor updates..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 leading-relaxed"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {isEditing ? 'Save Changes' : 'Create Entry'}
              </button>
              
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Supabase Status Alert Widget */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <Database className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-xs text-slate-600">
              <p className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wide">SUPABASE STATUS</p>
              <p className="leading-relaxed">
                {supabase 
                  ? 'Connected directly to live Supabase servers using NEXT_PUBLIC_SUPABASE_URL. All CRUD operations update table records in real-time.' 
                  : 'Supabase credentials missing. Utilizing client-side telemetry state emulation.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: List of All Shipment Rows */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl py-4 px-5 shadow-xs">
            <div className="space-y-1">
              <h2 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                Live Shipment Telemetry Registry
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                {records.length} {records.length === 1 ? 'record' : 'records'} found in workspace
              </p>
            </div>
            
            <div className="text-xs font-mono text-slate-500">
              UTC: {new Date().toISOString().substring(11,19)}
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-md">
            {isLoading && records.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-mono">Synchronizing telemetry record queue...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="p-16 text-center space-y-3 font-sans">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No active tracking records available</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Create a new shipment record on the left to initialize the Supabase telemetry registry.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[9px] uppercase tracking-wider font-mono font-bold">
                      <th className="py-3 px-4">Row ID</th>
                      <th className="py-3 px-4">Tracking Info</th>
                      <th className="py-3 px-4">Milestone Event</th>
                      <th className="py-3 px-4">Carrier</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {records.map((rec) => {
                      const data = rec.event_data || {};
                      const trackId = data.trackingId || data.tracking_number || 'N/A';
                      const carrierName = data.carrier || 'Unknown';
                      const statusVal = data.status || 'N/A';
                      const recordNotes = data.notes || '';
                      const isExpanded = !!expandedRows[rec.id];

                      const shipper = data.shipper || {};
                      const receiver = data.receiver || {};
                      
                      return (
                        <React.Fragment key={rec.id}>
                          <tr className="hover:bg-slate-50/70 transition">
                            <td className="py-4 px-4 font-mono font-semibold text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpanded(rec.id)}
                                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-md transition"
                                  title={isExpanded ? 'Collapse' : 'Expand details'}
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                <span>#{rec.id}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 space-y-1">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] block w-fit">
                                {trackId}
                              </span>
                              {recordNotes && (
                                <p className="text-[10px] text-slate-500 max-w-xs line-clamp-1 italic leading-relaxed" title={recordNotes}>
                                  "{recordNotes}"
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-mono font-semibold">
                                {rec.event_name}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-semibold text-slate-700">
                              {carrierName}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                                statusVal === 'delivered' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : statusVal === 'transit' 
                                  ? 'bg-sky-100 text-sky-800'
                                  : statusVal === 'customs'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}>
                                {statusVal}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleEditInitiate(rec)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-sky-600 rounded-lg transition cursor-pointer"
                                  title="Edit Record"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord(rec.id)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={6} className="p-4 border-b border-slate-100">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700">
                                  {/* Shipper Details Card */}
                                  <div className="bg-white p-3.5 rounded-2xl border border-slate-150 space-y-2">
                                    <h5 className="font-bold text-slate-900 border-b pb-1 flex items-center gap-1 font-sans">
                                      <User className="w-3.5 h-3.5 text-sky-500" /> Shipper Details
                                    </h5>
                                    {shipper.name ? (
                                      <div className="space-y-1 font-sans">
                                        <p><span className="font-semibold text-slate-500 font-sans">Name:</span> {shipper.name}</p>
                                        {shipper.phone && <p><span className="font-semibold text-slate-500 font-sans">Phone:</span> {shipper.phone}</p>}
                                        {shipper.email && <p><span className="font-semibold text-slate-500 font-sans">Email:</span> {shipper.email}</p>}
                                        {shipper.address && <p><span className="font-semibold text-slate-500 font-sans">Address:</span> {shipper.address}</p>}
                                        {data.departureDate && <p><span className="font-semibold text-slate-500 font-sans">Departure Date:</span> {data.departureDate}</p>}
                                      </div>
                                    ) : (
                                      <p className="text-slate-450 italic font-mono text-[10px]">No shipper credentials recorded.</p>
                                    )}
                                  </div>

                                  {/* Consignee Details Card */}
                                  <div className="bg-white p-3.5 rounded-2xl border border-slate-150 space-y-2">
                                    <h5 className="font-bold text-slate-900 border-b pb-1 flex items-center gap-1 font-sans">
                                      <User className="w-3.5 h-3.5 text-emerald-500" /> Consignee Details
                                    </h5>
                                    {receiver.name ? (
                                      <div className="space-y-1 font-sans">
                                        <p><span className="font-semibold text-slate-500 font-sans">Name:</span> {receiver.name}</p>
                                        {receiver.phone && <p><span className="font-semibold text-slate-500 font-sans">Phone:</span> {receiver.phone}</p>}
                                        {receiver.email && <p><span className="font-semibold text-slate-500 font-sans">Email:</span> {receiver.email}</p>}
                                        {receiver.address && <p><span className="font-semibold text-slate-500 font-sans">Address:</span> {receiver.address}</p>}
                                      </div>
                                    ) : (
                                      <p className="text-slate-450 italic font-mono text-[10px]">No receiver credentials recorded.</p>
                                    )}
                                  </div>

                                  {/* Cargo Specs details */}
                                  <div className="bg-white p-3.5 rounded-2xl border border-slate-150 space-y-2">
                                    <h5 className="font-bold text-slate-900 border-b pb-1 flex items-center gap-1 font-sans">
                                      <Package className="w-3.5 h-3.5 text-indigo-500" /> Shipment Details
                                    </h5>
                                    <div className="space-y-1 font-sans">
                                      {data.cargoType && <p><span className="font-semibold text-slate-500 font-sans">Cargo Type:</span> {data.cargoType}</p>}
                                      {data.totalWeight && <p><span className="font-semibold text-slate-500 font-sans">Weight:</span> {data.totalWeight} kg/lbs</p>}
                                      {data.dimensions && <p><span className="font-semibold text-slate-500 font-sans">Dimensions:</span> {data.dimensions}</p>}
                                      {data.piecesCount && <p><span className="font-semibold text-slate-500 font-sans">Pieces count:</span> {data.piecesCount}</p>}
                                      {data.paymentMode && <p><span className="font-semibold text-slate-500 font-sans">Payment:</span> <span className="uppercase font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded font-bold text-slate-750">{data.paymentMode.replace(/_/g, ' ')}</span></p>}
                                      {data.totalFreightCharge && <p><span className="font-semibold text-slate-500 font-sans">Total Freight:</span> <span className="font-mono text-emerald-600 font-bold">{data.totalFreightCharge}</span></p>}
                                      {data.originHarbor && <p><span className="font-semibold text-slate-500 font-sans">Origin Harbor:</span> {data.originHarbor}</p>}
                                      {data.estDeliveryDate && <p><span className="font-semibold text-slate-500 font-sans">Est. Delivery:</span> {data.estDeliveryDate}</p>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
