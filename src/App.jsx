import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// --- Battlefield data (simplified & georeferenced) ---
// Coordinates focus on the northern shore of modern Lago Trasimeno (Umbria–Tuscany border, Italy)
// All positions are approximate and intended for didactic visualisation
const unitData = [
  {
    name: "Roman Column (Legiones & Allies)",
    color: "#0072B2", // color-blind friendly blue
    path: [
      [43.192, 12.062], // near Passignano – column entry to the lakeside road
      [43.190, 12.080],
      [43.188, 12.100],
      [43.188, 12.120] // toward Tuoro pass (ambush exit)
    ]
  },
  {
    name: "Carthaginian Main Infantry",
    color: "#D55E00", // color-blind friendly orange
    path: [
      [43.202, 12.076], // ridge north-west of the Roman route
      [43.198, 12.090],
      [43.195, 12.100] // closes south onto the road
    ]
  },
  {
    name: "Carthaginian Cavalry & Numidians (blocking force)",
    color: "#009E73", // color-blind friendly green
    path: [
      [43.190, 12.135], // east gate of the defile – hidden beyond morning mists
      [43.190, 12.115] // rides west to seal Roman escape
    ]
  },
  {
    name: "Gallic & Iberian Contingents (left wing)",
    color: "#CC79A7", // color-blind friendly purple
    path: [
      [43.205, 12.070],
      [43.197, 12.084],
      [43.192, 12.092] // descends on Roman rear/flank
    ]
  }
];

// Linear interpolation helper for small polyline segments
function interpolate(path, t) {
  if (t <= 0) return path[0];
  const segments = path.length - 1;
  const segFloat = t * segments;
  const idx = Math.floor(segFloat);
  const frac = segFloat - idx;
  const p1 = path[idx];
  const p2 = path[idx + 1] || p1;
  return [p1[0] + (p2[0] - p1[0]) * frac, p1[1] + (p2[1] - p1[1]) * frac];
}

export default function TrasimeneBattleMap() {
  const [time, setTime] = useState(0); // 0–1
  const [speed, setSpeed] = useState(0.01); // increment per tick (~500 ms)
  const [visibleUnits, setVisibleUnits] = useState(unitData.map(() => true));
  const playingRef = useRef(true);

  // advance timeline
  useEffect(() => {
    const id = setInterval(() => {
      if (playingRef.current) {
        setTime((prev) => (prev + speed) % 1);
      }
    }, 500);
    return () => clearInterval(id);
  }, [speed]);

  // UI handlers
  const togglePlay = () => (playingRef.current = !playingRef.current);
  const slower = () => setSpeed((s) => Math.max(s / 2, 0.0025));
  const faster = () => setSpeed((s) => Math.min(s * 2, 0.08));
  const toggleUnit = (idx) =>
    setVisibleUnits((v) => {
      const copy = [...v];
      copy[idx] = !copy[idx];
      return copy;
    });

  return (
    <div className="w-full h-screen relative">
      {/* Map */}
      <MapContainer
        center={[43.195, 12.09]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="w-full h-full"
      >
        {/* Base map with relief to display topography */}
        <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution="Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)"
        />

        {/* Render polylines & animated markers */}
        {unitData.map((unit, idx) => {
          if (!visibleUnits[idx]) return null;
          const pos = interpolate(unit.path, time);
          return (
            <React.Fragment key={idx}>
              <Polyline
                positions={unit.path}
                pathOptions={{ color: unit.color, weight: 3, dashArray: "4 6" }}
              />
              <CircleMarker
                center={pos}
                radius={6}
                pathOptions={{
                  color: unit.color,
                  fillColor: unit.color,
                  fillOpacity: 0.9,
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>{unit.name}</Tooltip>
                <Popup>{unit.name}</Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-4 text-sm">
        <p className="font-semibold mb-2">Units</p>
        <div className="flex flex-col gap-1">
          {unitData.map((unit, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={visibleUnits[idx]}
                onChange={() => toggleUnit(idx)}
                className="cursor-pointer"
              />
              <span
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: unit.color }}
              />
              <span>{unit.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-50 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-4 flex flex-col gap-2 text-sm items-end">
        <div className="flex items-center gap-3 w-full">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={time}
            onChange={(e) => setTime(parseFloat(e.target.value))}
            className="flex-grow cursor-pointer"
          />
          <span className="font-semibold text-gray-700 min-w-[3rem] text-right">
            {(time * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex gap-2 self-end">
          <button className="px-3 py-1 rounded-lg bg-gray-800 text-white" onClick={togglePlay}>
            {playingRef.current ? "Pause" : "Play"}
          </button>
          <button className="px-3 py-1 rounded-lg bg-gray-200" onClick={slower}>
            – Slower
          </button>
          <button className="px-3 py-1 rounded-lg bg-gray-200" onClick={faster}>
            Faster +
          </button>
        </div>
        <p className="mt-1 text-gray-500 max-w-xs text-right">
          Click on unit markers to see their identity. Use the slider or buttons to control playback.
        </p>
      </div>
    </div>
  );
}



