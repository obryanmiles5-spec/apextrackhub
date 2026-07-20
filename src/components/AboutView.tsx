import { motion } from 'motion/react';
import { ShieldCheck, Calendar, Clock, Anchor, Users, Truck, CheckCircle, Ship, Plane } from 'lucide-react';

export default function AboutView() {
  const years = [
    { year: '1998', title: 'Company Inception', desc: 'Founded as a local transport carrier in Houston, Texas with a fleet of five delivery trucks.' },
    { year: '2005', title: 'National Expansion', desc: 'Opened regional hubs in Los Angeles, Chicago, and Atlanta, scaling ground cargo shipping.' },
    { year: '2012', title: 'Intercontinental Licenses', desc: 'Acquired federal ocean cargo carrier licenses and established partner ports in Rotterdam and Tokyo.' },
    { year: '2019', title: 'WooCommerce Integration & Smart Portals', desc: 'Launched fully digital tracking APIs allowing commercial e-commerce businesses instant cargo audits.' },
    { year: '2026', title: 'Zero Emission Targets & Core Modernization', desc: 'Committed to over 40% sustainable fuel choices for state delivery fleets and high-resolution tracking telemetry.' }
  ];

  const steps = [
    { number: '01', title: 'Manifestation & Scan', desc: 'Shipment is cataloged, weighed, measured, and labeled with high-contrast tracking seals.' },
    { number: '02', title: 'Regional Consolidation', desc: 'Parcels or container pallets are batched onto trailers or aircraft cargo holds based on speed routes.' },
    { number: '03', title: 'Port / Customs Gateway', desc: 'For international freight, ocean or air cargo goes through instant pre-cleared automated customs brokers.' },
    { number: '04', title: 'Active Transit & Routing', desc: 'Constant live scans occur at deep hubs. Transport is actively scheduled matching sea, air, and truck timetables.' },
    { number: '05', title: 'Last-Mile Verification', desc: 'Delivered directly to the warehouse loading dock or home address with mandatory sign-off receipt.' }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Intro Header */}
      <section className="relative overflow-hidden bg-slate-900 text-white rounded-3xl mx-4 lg:mx-8 py-16 px-6">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="./freight_airplane.png" 
            alt="Cargo plane on the tarmac" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter saturate-50"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-block px-3 py-1 bg-sky-500/10 border border-sky-400/30 rounded-full text-sky-300 text-xs sm:text-sm font-semibold tracking-wide uppercase">
            WHO WE ARE
          </span>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight">
            The USA Core Logistics Platform
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Leading the logistics standard since 1998, Apex Logistics manages high-fidelity supply lines across land, sea, and airspace, guaranteeing absolute visibility for every container.
          </p>
        </div>
      </section>

      {/* Core Mission & Commitments */}
      <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-md transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Guaranteed Speed</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            By optimizing shipping routes using predictive transport schedules, we bypass high-traffic ocean bottleneck channels and prioritize the fastest customs lanes.
          </p>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-md transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Unyielding Safety</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            From climate-controlled refrigerated compartments for bio-medical items to physical security container tags, we maintain strict safety chain compliance.
          </p>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-md transition space-y-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Anchor className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Total Transparency</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            No dark zones. No missing coordinates. We enforce constant scanning metrics at every hub and offer deep client tracking panels so you always know where your assets stand.
          </p>
        </div>
      </section>

      {/* How Shipping Works Section */}
      <section className="bg-slate-50 py-16 px-6 rounded-3xl mx-4 lg:mx-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-sky-600 font-semibold font-sans">OPERATIONAL Blueprints</h2>
            <h3 className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 tracking-tight">How Local & Global Shipping Works</h3>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              Our end-to-end framework guarantees safe transfers of heavy commercial machinery, automotive parts, and parcel inventory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {steps.map((step, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs relative flex flex-col justify-between">
                <span className="font-mono text-3xl font-extrabold text-sky-100 absolute top-4 right-4">{step.number}</span>
                <div className="space-y-3 pt-6">
                  <h4 className="font-bold text-slate-900 text-sm tracking-tight">{step.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mini Visual Diagram icons */}
          <div className="flex flex-wrap justify-center items-center gap-6 pt-6 text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-mono"><Users className="w-4 h-4 text-sky-500" /> Sender Pickup</span>
            <span className="text-slate-300">➜</span>
            <span className="flex items-center gap-1.5 font-mono"><Truck className="w-4 h-4 text-sky-500" /> Land Fleet</span>
            <span className="text-slate-300">➜</span>
            <span className="flex items-center gap-1.5 font-mono"><Plane className="w-4 h-4 text-emerald-500" /> Air Transit</span>
            <span className="text-slate-300">and / or</span>
            <span className="flex items-center gap-1.5 font-mono"><Ship className="w-4 h-4 text-teal-500" /> Ocean Freight</span>
            <span className="text-slate-300">➜</span>
            <span className="flex items-center gap-1.5 font-mono"><CheckCircle className="w-4 h-4 text-emerald-600" /> Receiver Signature</span>
          </div>
        </div>
      </section>

      {/* Corporate Timeline Story */}
      <section className="max-w-4xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-sky-600 font-semibold">ESTABLISHED CHRONOLOGY</span>
          <h2 className="text-2xl sm:text-3xl font-bold font-sans text-slate-900">The Journey of Apex Logistics</h2>
        </div>

        <div className="relative border-l border-slate-200 ml-4 md:ml-32 py-4 space-y-12">
          {years.map((y, idx) => (
            <div key={idx} className="relative pl-8 group">
              {/* Year Badge absolute position on left for larger screen */}
              <div className="hidden md:flex absolute -left-32 top-0.5 items-center justify-end w-24 text-right">
                <span className="font-mono font-bold text-slate-900 text-base">{y.year}</span>
              </div>
              
              {/* Timeline bubble icon */}
              <span className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-sky-500 flex items-center justify-center group-hover:bg-sky-500 transition duration-150">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
              </span>

              <div className="space-y-1.5">
                <span className="inline-block md:hidden font-mono text-xs font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md mb-1">{y.year}</span>
                <h4 className="font-bold text-slate-900 text-base">{y.title}</h4>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-2xl">{y.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
