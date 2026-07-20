import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Unlock, ShieldAlert, Key, Plus, Edit3, Save, RefreshCw, 
  Trash2, AlertCircle, CheckCircle2, Database, Layers, Search, Clock
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
      referrer: 'supabase-admin-dashboard'
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
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-900 shadow-xl mb-8 relative overflow-hidden">
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

          <form onSubmit={handleSaveChanges} className="space-y-4">
            {/* Event Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Event Name (event_name)
              </label>
              <select
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
              >
                <option value="shipment_created">shipment_created (Initial creation)</option>
                <option value="cargo_status_updated">cargo_status_updated (Milestone / route log)</option>
                <option value="app_session_initialized">app_session_initialized</option>
                <option value="cargo_dispute_logged">cargo_dispute_logged</option>
                <option value="custom_milestone">custom_milestone</option>
              </select>
            </div>

            {/* Tracking ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Tracking Number (metadata: trackingId)
              </label>
              <input
                type="text"
                placeholder="e.g. AP-2026-9481"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
                required
              />
            </div>

            {/* Carrier */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Carrier (metadata: carrier)
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900"
              >
                <option value="Apex Logistics">Apex Logistics</option>
                <option value="FedEx">FedEx</option>
                <option value="DHL Global">DHL Global</option>
                <option value="UPS Transport">UPS Transport</option>
                <option value="USPS Priority">USPS Priority</option>
                <option value="Oceanic Cargo">Oceanic Cargo</option>
                <option value="Swift Express Cargo">Swift Express Cargo</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Log Status (metadata: status)
              </label>
              <div className="grid grid-cols-2 gap-2">
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
                    className={`py-2 px-3 border rounded-xl text-center text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      status === s.value
                        ? 'bg-sky-50 border-sky-200 text-sky-800 ring-1 ring-sky-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes / Descriptions */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Event Log Comments / Notes (metadata: notes)
              </label>
              <textarea
                rows={3}
                placeholder="Log internal comments regarding harbor delays, customs inspection codes, or routing updates..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 leading-relaxed"
              />
            </div>

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
                      
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-4 px-4 font-mono font-semibold text-slate-500">
                            #{rec.id}
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
