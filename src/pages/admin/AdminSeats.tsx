import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Armchair,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Tv,
  Building,
} from 'lucide-react';
import { Hall, Seat, SeatType } from '../../types';
import { getHalls } from '../../services/halls';
import {
  getSeatsByHallId,
  generateDefaultSeatsForHall,
  updateSeat,
} from '../../services/seats';

export const AdminSeats: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialHallId = searchParams.get('hallId') || '';

  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<string>(initialHallId);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulk Generator State
  const [rowCount, setRowCount] = useState<number>(6);
  const [seatsPerRow, setSeatsPerRow] = useState<number>(8);
  const [vipRowsInput, setVipRowsInput] = useState<string>('E, F');
  const [premiumRowsInput, setPremiumRowsInput] = useState<string>('C, D');

  // Load Halls
  useEffect(() => {
    getHalls().then((hallList) => {
      setHalls(hallList);
      if (hallList.length > 0 && !selectedHallId) {
        setSelectedHallId(hallList[0].id);
      }
    });
  }, []);

  // Load seats when selectedHallId changes
  useEffect(() => {
    if (!selectedHallId) return;

    const fetchSeats = async () => {
      setLoading(true);
      try {
        const seatList = await getSeatsByHallId(selectedHallId);
        setSeats(seatList);

        // sync row/col state with hall if available
        const currentHall = halls.find((h) => h.id === selectedHallId);
        if (currentHall) {
          setRowCount(currentHall.totalRows || 6);
          setSeatsPerRow(currentHall.seatsPerRow || 8);
        }
      } catch (err: any) {
        console.error('Error loading seats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [selectedHallId, halls]);

  const handleGenerateSeats = async () => {
    if (!selectedHallId) return;
    if (
      seats.length > 0 &&
      !window.confirm('This hall already has seats configured. Re-generating will overwrite the existing seat layout. Proceed?')
    ) {
      return;
    }

    setGenerating(true);
    setMessage(null);

    const vipRows = vipRowsInput
      .split(',')
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean);

    const premiumRows = premiumRowsInput
      .split(',')
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean);

    try {
      const newSeats = await generateDefaultSeatsForHall(
        selectedHallId,
        Number(rowCount),
        Number(seatsPerRow),
        vipRows,
        premiumRows
      );
      setSeats(newSeats);
      setMessage({
        type: 'success',
        text: `Generated ${newSeats.length} seats for this auditorium successfully.`,
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.message || 'Failed to generate seats.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCycleSeatType = async (seat: Seat) => {
    const types: SeatType[] = ['STANDARD', 'PREMIUM', 'VIP', 'COUPLE', 'WHEELCHAIR'];
    const currentIndex = types.indexOf(seat.type);
    const nextType = types[(currentIndex + 1) % types.length];

    let newModifier = 1.0;
    if (nextType === 'PREMIUM') newModifier = 1.15;
    if (nextType === 'VIP') newModifier = 1.35;
    if (nextType === 'COUPLE') newModifier = 1.4;

    try {
      await updateSeat(seat.id, {
        type: nextType,
        priceModifier: newModifier,
      });

      setSeats((prev) =>
        prev.map((s) =>
          s.id === seat.id
            ? { ...s, type: nextType, priceModifier: newModifier }
            : s
        )
      );
    } catch (err: any) {
      alert(`Could not update seat: ${err.message}`);
    }
  };

  // Group seats by row
  const rowsMap = new Map<string, Seat[]>();
  seats.forEach((s) => {
    const list = rowsMap.get(s.row) || [];
    list.push(s);
    rowsMap.set(s.row, list);
  });

  const sortedRows = Array.from(rowsMap.keys()).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162035]">
        <div className="space-y-1">
          <Link
            to="/admin/halls"
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-amber-400 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Auditoriums</span>
          </Link>
          <h1 className="text-3xl font-black text-white">Seat Layout & Generator</h1>
          <p className="text-xs text-slate-400">
            Generate physical seating matrices, assign VIP rows, and calibrate price multipliers.
          </p>
        </div>

        {/* Hall Selector */}
        <div className="flex items-center space-x-2 bg-[#0d1424] p-2 rounded-xl border border-[#1b263b]">
          <Tv className="w-4 h-4 text-amber-400 ml-1" />
          <span className="text-xs text-slate-400 font-semibold">Auditorium:</span>
          <select
            value={selectedHallId}
            onChange={(e) => setSelectedHallId(e.target.value)}
            className="bg-[#121c32] border border-[#1b263b] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {halls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border border-red-800 text-red-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Visual Seat Map */}
        <div className="lg:col-span-2 bg-[#0d1424] border border-[#1b263b] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-white">Physical Seating Grid</h2>
              <p className="text-xs text-slate-400">
                Click any seat to cycle its tier (Standard → Premium → VIP → Couple → Wheelchair)
              </p>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              {seats.length} Total Seats Configured
            </span>
          </div>

          {/* Screen Canvas Curve */}
          <div className="w-full flex flex-col items-center py-4">
            <div className="w-3/4 h-2 bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-2">
              4K Laser Curved Projection Screen
            </span>
          </div>

          {/* Seat Grid */}
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
            </div>
          ) : seats.length > 0 ? (
            <div className="space-y-3 overflow-x-auto pb-4">
              {sortedRows.map((rowName) => {
                const rowSeats = (rowsMap.get(rowName) || []).sort((a, b) => a.number - b.number);
                return (
                  <div key={rowName} className="flex items-center justify-center space-x-2">
                    <span className="w-6 text-center text-xs font-bold text-slate-500">{rowName}</span>
                    <div className="flex items-center space-x-2">
                      {rowSeats.map((seat) => {
                        let bg = 'bg-[#121c32] border-[#1b263b] text-slate-300';
                        if (seat.type === 'VIP') bg = 'bg-amber-500/20 border-amber-400 text-amber-300';
                        if (seat.type === 'PREMIUM') bg = 'bg-blue-600/30 border-blue-500/60 text-blue-300';
                        if (seat.type === 'COUPLE') bg = 'bg-pink-600/30 border-pink-500/60 text-pink-300';
                        if (seat.type === 'WHEELCHAIR') bg = 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300';

                        return (
                          <button
                            key={seat.id}
                            type="button"
                            onClick={() => handleCycleSeatType(seat)}
                            title={`Seat ${seat.row}${seat.number} (${seat.type}, ${seat.priceModifier}x) - Click to cycle`}
                            className={`w-8 h-8 rounded-lg border flex flex-col items-center justify-center transition-all hover:scale-110 shadow-sm ${bg}`}
                          >
                            <Armchair className="w-3.5 h-3.5" />
                            <span className="text-[8px] font-bold">{seat.number}</span>
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-6 text-center text-xs font-bold text-slate-500">{rowName}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center bg-[#121c32] rounded-2xl border border-dashed border-[#1b263b] space-y-2">
              <Armchair className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">No Seats Configured</p>
              <p className="text-xs text-slate-400">
                Use the Seat Generator tool on the right to automatically create a seating layout for this hall.
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-[#162035] text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-[#121c32] border border-[#1b263b]" />
              <span>Standard (1.0x)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-blue-600/30 border border-blue-500" />
              <span>Premium (1.15x)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-400" />
              <span>VIP Recliner (1.35x)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-pink-600/30 border border-pink-500" />
              <span>Couple (1.4x)</span>
            </span>
          </div>
        </div>

        {/* Right Column: Bulk Matrix Generator */}
        <div className="bg-[#0d1424] border border-[#1b263b] rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="space-y-1 pb-3 border-b border-[#162035]">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
              <Sliders className="w-4 h-4" />
              <span>GENERATOR TOOL</span>
            </div>
            <h3 className="text-lg font-black text-white">Bulk Matrix Builder</h3>
            <p className="text-xs text-slate-400">
              Instantly create grid rows, numbers, and tier mappings.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Number of Rows</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={rowCount}
                  onChange={(e) => setRowCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Seats per Row</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={seatsPerRow}
                  onChange={(e) => setSeatsPerRow(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                VIP Recliner Rows (1.35x Price)
              </label>
              <input
                type="text"
                value={vipRowsInput}
                onChange={(e) => setVipRowsInput(e.target.value)}
                placeholder="e.g. E, F"
                className="w-full px-3 py-2 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                Premium Rows (1.15x Price)
              </label>
              <input
                type="text"
                value={premiumRowsInput}
                onChange={(e) => setPremiumRowsInput(e.target.value)}
                placeholder="e.g. C, D"
                className="w-full px-3 py-2 rounded-xl bg-[#121c32] border border-[#1b263b] text-white text-xs"
              />
            </div>

            <div className="p-3 bg-[#121c32] rounded-xl text-xs text-slate-400 space-y-1">
              <span>Will generate: <strong>{Number(rowCount) * Number(seatsPerRow)} Total Seats</strong></span>
              <span className="block text-[11px] text-slate-500">
                Rows: A through {String.fromCharCode(65 + Number(rowCount) - 1)}
              </span>
            </div>

            <button
              type="button"
              id="admin-generate-seats-btn"
              disabled={generating}
              onClick={handleGenerateSeats}
              className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shadow-lg shadow-amber-950/40 disabled:opacity-50"
            >
              {generating ? (
                <span>Generating Layout...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Auditorium Matrix</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
