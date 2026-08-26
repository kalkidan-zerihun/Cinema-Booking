import React from 'react';
import { Link } from 'react-router-dom';
import { Film, MapPin, Phone, Mail, Clock, ShieldCheck, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#05070c] border-t border-white/[0.06] text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center shadow-md shadow-amber-400/20 text-slate-950">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-wider text-white uppercase">
                CINEMA
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Online movie ticket reservation and seat booking platform. Laser projection, Dolby Atmos sound, and real-time guaranteed seat reservations.
            </p>
            <div className="inline-flex items-center space-x-1.5 text-[11px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2.5 py-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Real-Time Seat Hold & Concurrency Control</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Explore</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/movies" className="hover:text-amber-400 transition-colors">
                  Now Showing Movies
                </Link>
              </li>
              <li>
                <Link to="/cinemas" className="hover:text-amber-400 transition-colors">
                  Cinema Locations & Lounges
                </Link>
              </li>
              <li>
                <Link to="/my-reservations" className="hover:text-amber-400 transition-colors">
                  My Digital Tickets
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-400 transition-colors">
                  Member Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Theaters</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Cinema Lounge - Edna Mall</span>
                  <span className="text-[11px] text-slate-400">Edna Mall Complex, Addis Ababa</span>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-200 block">Cinema Lounge - Bole</span>
                  <span className="text-[11px] text-slate-400">Bole Medhanealem, Addis Ababa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Hours */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Box Office Contact</h4>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>+251 11 661 2233</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>boxoffice@cinema.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Open Daily: 10:00 AM – Midnight</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 space-y-2 sm:space-y-0">
          <p>© {new Date().getFullYear()} Cinema. All rights reserved.</p>
          <div className="flex items-center space-x-3">
            <span>Addis Ababa, Ethiopia</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">Direct Booking Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
