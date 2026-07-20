import { Ship, Plane, Truck, Warehouse, Compass, Award, ArrowUpRight, ShieldCheck, Cpu } from 'lucide-react';
import React from 'react';

export default function ServicesView() {
  const serviceCategories = [
    {
      icon: Truck,
      title: 'Local Delivery & Distribution',
      duration: 'Same-day to 48 Hours',
      coverage: 'Intrastate & Metro Areas',
      desc: 'Optimized last-mile courier trucks for metropolitan corridors and adjacent distribution zones. Perfect for retail inventory replenishment, heavy construction machinery, and time-critical medical supplies with automated proof-of-delivery receipts.',
      features: ['Real-time GPS dispatch', 'Lift-gate equipped fleet', 'Signature verified hands-off', 'Metro overnight express']
    },
    {
      icon: Ship,
      title: 'International Ocean Cargo',
      duration: '14 to 28 Days',
      coverage: 'Global Seaports (Rotterdam, Shanghai, Tokyo)',
      desc: 'Robust ocean transportation covering Less-Than-Container Load (LCL) and Full Container Load (FCL). We feature certified hazardous materials handling, refrigerated cold chain containers for seafood or biological shipments, and port customs acceleration.',
      features: ['FCL & LCL consolidations', 'Refrigerated reefers', 'Port-to-Port transparency', 'Customs bonded storage']
    },
    {
      icon: Plane,
      title: 'Priority Air Freight',
      duration: '3 to 5 Days Worldwide',
      coverage: 'All Major International Airport Hubs',
      desc: 'When time is the determining cargo variable. Our charter relations allow rapid priority flight slots with expedited runway transfer. Fully supported by specialized customs brokerage brokers at USA entrance airports.',
      features: ['IATA licensed transit', 'Temperature controlled options', 'Next-flight-out dispatch', 'Expedited terminal clearance']
    },
    {
      icon: Warehouse,
      title: 'Warehousing & Last-Mile Depot',
      duration: 'Ongoing Inventory Control',
      coverage: 'US Major Transport Junctions',
      desc: 'A network of modern, secure, and climate-controlled warehouse spaces. Equipped with modern sorting conveyances, 24/7 video monitoring, and integrated WooCommerce APIs to automatically dispatch and update inventory codes.',
      features: ['FIFO / LIFO pick-and-pack', 'Secured hazardous storage', 'Live inventory dashboards', 'Cross-docking facilitation']
    },
    {
      icon: Compass,
      title: 'Heavy Auto Transport & Machinery',
      duration: '5 to 10 Days',
      coverage: 'All 50 US States & Key Global Ports',
      desc: 'Specialized roll-on/roll-off (RoRo) vessels and flatbed multi-car trailers. We specialize in transporting corporate fleets, heavy industrial earthmovers, premium luxury automobiles, and agricultural machinery with heavy cargo insurance safeguards.',
      features: ['Enclosed car carriers', 'Oversized cargo permits', 'Rigorous tie-down protocols', 'Full-value cargo insurance']
    },
    {
      icon: Cpu,
      title: 'Express Shipment Tracking & APIs',
      duration: 'Instant API Response',
      coverage: 'E-commerce & Corporate ERP Integrations',
      desc: 'High-fidelity API tracking layers built on modern logistics databases. Synchronizes seamlessly with major e-commerce platforms (like WooCommerce, Shopify, or enterprise ERPs) to deliver real-time shipping logs to end-consumers without friction.',
      features: ['REST/GraphQL tracking endpoints', 'Webhooks for milestone updates', 'WooCommerce cargo compatibility', 'Custom white-label dashboards']
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Services Intro */}
      <section 
        className="relative -mt-10 py-16 px-6 rounded-3xl mx-4 lg:mx-8 overflow-hidden bg-cover bg-center bg-no-repeat shadow-sm text-white" 
        style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.82)), url('https://lh3.googleusercontent.com/d/19y8tABlqkTXY987Jx6N1QouO7oBn-pqw')` }}
      >
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-block px-3 py-1 bg-sky-500/10 border border-sky-400/30 rounded-full text-sky-300 text-xs sm:text-sm font-semibold tracking-wide uppercase">
            LOGISTICS DEPLOYMENTS
          </span>
          <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight">
            Intermodal Shipping Services
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            From single pallet metropolitan courier service to global maritime vessel logistics, we manage critical deliveries with precision machinery and military-grade scanning pipelines.
          </p>
        </div>
      </section>

      {/* Services Grid layout */}
      <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {serviceCategories.map((service, index) => {
          return (
            <div key={index} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-xs hover:shadow-lg transition duration-300 flex flex-col justify-between group">
              <div className="space-y-6">
                {/* Icon block */}
                <div className="flex justify-between items-start">
                  <span className="p-4 bg-slate-50 text-slate-950 rounded-2xl group-hover:bg-sky-500 group-hover:text-slate-950 transition duration-300">
                    {React.createElement(service.icon, { className: 'w-6 h-6' })}
                  </span>
                  <span className="text-slate-300 hover:text-sky-500 transition duration-150 cursor-pointer">
                    <ArrowUpRight className="w-5 h-5" />
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 font-sans tracking-tight">{service.title}</h3>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">Timeframe: {service.duration}</span>
                    <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md">Limits: {service.coverage}</span>
                  </div>
                </div>

                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-sans">{service.desc}</p>
              </div>

              {/* Bullet list of advantages */}
              <div className="pt-6 mt-6 border-t border-slate-50 space-y-2">
                {service.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2 text-xs font-mono text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Specialty Cargo Support */}
      <section className="bg-slate-950 text-white py-16 px-6 rounded-3xl mx-4 lg:mx-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs uppercase tracking-widest text-sky-400 font-mono font-bold">SECURE PIPELINE PROTOCOLS</span>
            <h2 className="text-3xl font-bold font-sans tracking-tight text-white leading-tight">Specialty Regulatory Clearances & Security</h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              We carry custom federal and maritime credentials allowing us to dock, transport, and distribute regulated merchandise within the USA borders safely, bypassing third-party clearance roadblocks.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-905 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="font-mono text-xl font-bold text-sky-400">FDA Food</span>
                <p className="text-slate-400 text-[11px]">Cold chain monitoring certified for food items.</p>
              </div>
              <div className="bg-slate-905 border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="font-mono text-xl font-bold text-sky-400">Class 9</span>
                <p className="text-slate-400 text-[11px]">Hazardous materials shipping cleared by DOT.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full filter blur-3xl"></div>
            <h3 className="text-lg font-bold font-sans mb-4 flex items-center gap-2 text-white">
              <Award className="w-5 h-5 text-sky-400" /> Active Cargo Credentials
            </h3>
            
            <div className="space-y-4">
              {[
                { title: 'FMC (Federal Maritime Commission) License #048291', desc: 'Allows direct negotiation and space charter booking with major international oceanic ship alliances.' },
                { title: 'C-TPAT (Customs-Trade Partnership Against Terrorism) Tier III', desc: 'Pre-vetted expedited customs container clearance, reducing random audits from 15% to less than 0.3%.' },
                { title: 'TSA IAC (Indirect Air Carrier) Certification', desc: 'Permits priority loading onto civilian and specialized commercial flights across interstate shipping routes.' },
              ].map((cred, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> {cred.title}
                  </h4>
                  <p className="text-slate-400 text-xs pl-3.5 leading-relaxed">{cred.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
