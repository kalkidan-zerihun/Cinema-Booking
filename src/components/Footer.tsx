import React from 'react';
import { Link } from 'react-router-dom';
import { Film, MapPin, Phone, Mail, Clock, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#05070d] border-t border-[#161f33] text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                <Film className="w-5 h-5 text-slate-950" />
              </div>
              <span className="text-xl font-black tracking-wider text-white uppercase">
                CINEMA
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Online movie ticket reservation and seat booking platform. Enjoy laser projection, immersive surround sound, and instant real-time reserved seating.
            </p>
            <div className="flex items-center space-x-2 text-xs text-amber-300 bg-amber-950/20 border border-amber-500/30 rounded-lg p-2 w-fit">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>100% Real-Time Guaranteed Seat Locks</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Explore</h4>
            <ul className="space-y-2 text-sm">
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
                  Member Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Locations</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300 block">Cinema - Downtown</span>
                  <span className="text-xs text-slate-400">Edna Mall Complex, Addis Ababa</span>
                </div>
              </div>
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300 block">Cinema - Bole Medhanealem</span>
                  <span className="text-xs text-slate-400">Bole Sub-City, Addis Ababa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Hours */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Hotline & Hours</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+251 11 661 2233 / +251 91 123 4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>boxoffice@cinema.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Daily: 10:00 AM – Midnight (ET)</span>
              </li>
            </ul>
            <div className="pt-2">
              <span className="text-xs text-slate-400 block mb-1">Supported Payments:</span>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                <span className="px-2 py-0.5 bg-[#0e1628] text-amber-400 rounded border border-[#1e293b]">
                  Telebirr
                </span>
                <span className="px-2 py-0.5 bg-[#0e1628] text-emerald-400 rounded border border-[#1e293b]">
                  Chapa
                </span>
                <span className="px-2 py-0.5 bg-[#0e1628] text-sky-400 rounded border border-[#1e293b]">
                  Visa / Master
                </span>
                <span className="px-2 py-0.5 bg-[#0e1628] text-slate-300 rounded border border-[#1e293b]">
                  Counter
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#131b2d] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 space-y-3 sm:space-y-0">
          <p>© {new Date().getFullYear()} Cinema Group. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Addis Ababa, Ethiopia</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">Strict Zero Double-Booking Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

