import React from 'react';

/**
 * AtmosphericBackground
 * 
 * A calm, barely visible meteorological & scientific background treatment for SkyGuard.
 * 
 * Design characteristics:
 * - Subtle synoptic isobars (mean sea level pressure contours)
 * - Geopotential atmospheric height dashed flow lines
 * - Coordinate graticule crosshairs and delicate meteorological grid nodes
 * - Tiny scientific pressure indices (1004, 1008, 1012, 1016, 1020, 1024 hPa)
 * - Ultra-low opacity (3% - 5.5%) ensuring zero competition with cards, typography, or telemetry charts
 * - 100% static SVG with no animation, glowing effects, or performance overhead
 * - pointer-events-none so all interactions pass through completely
 */
export const AtmosphericBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="pointer-events-none select-none fixed inset-0 overflow-hidden z-0"
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1600 1000"
      >
        <defs>
          {/* Scientific Graticule Pattern: 160x160 grid with subtle crosshair ticks */}
          <pattern
            id="meteo-graticule"
            width="160"
            height="160"
            patternUnits="userSpaceOnUse"
          >
            {/* Fine coordinate grid lines at ultra-low opacity */}
            <path
              d="M 160 0 L 0 0 0 160"
              fill="none"
              stroke="#475569"
              strokeWidth="0.5"
              strokeDasharray="2 10"
              strokeOpacity="0.03"
            />
            {/* Coordinate intersection crosshair (+) */}
            <path
              d="M 76 80 H 84 M 80 76 V 84"
              fill="none"
              stroke="#334155"
              strokeWidth="0.75"
              strokeOpacity="0.05"
            />
            {/* Sub-node micro dot */}
            <circle
              cx="80"
              cy="80"
              r="0.75"
              fill="#334155"
              fillOpacity="0.04"
            />
          </pattern>
        </defs>

        {/* 1. Base Scientific Graticule Grid */}
        <rect width="100%" height="100%" fill="url(#meteo-graticule)" />

        {/* 2. Synoptic Isobars (Atmospheric Surface Pressure Fields) */}
        {/* Isobar 1000 hPa - Deep low cyclonic trough in upper region */}
        <g stroke="#334155" fill="none" strokeWidth="0.75" strokeOpacity="0.04">
          <path d="M -100 120 C 200 80, 480 260, 820 160 C 1120 70, 1400 210, 1720 130" />
        </g>

        {/* Isobar 1004 hPa */}
        <g stroke="#334155" fill="none" strokeWidth="0.75" strokeOpacity="0.045">
          <path d="M -100 210 C 220 160, 500 340, 840 240 C 1140 150, 1420 290, 1720 210" />
        </g>

        {/* Isobar 1008 hPa */}
        <g stroke="#334155" fill="none" strokeWidth="0.75" strokeOpacity="0.045">
          <path d="M -80 320 C 240 270, 520 450, 860 350 C 1160 260, 1440 400, 1740 310" />
        </g>

        {/* Isobar 1012 hPa (Standard Atmospheric MSLP Baseline) */}
        <g stroke="#2563EB" fill="none" strokeWidth="0.85" strokeOpacity="0.055">
          <path d="M -60 450 C 230 400, 500 560, 840 470 C 1180 380, 1460 520, 1760 430" />
        </g>

        {/* Isobar 1016 hPa - Primary ridge line */}
        <g stroke="#334155" fill="none" strokeWidth="0.75" strokeOpacity="0.045">
          <path d="M -80 580 C 200 530, 470 670, 810 600 C 1160 520, 1460 660, 1740 560" />
        </g>

        {/* Isobar 1020 hPa - Anticyclonic high ridge */}
        <g stroke="#334155" fill="none" strokeWidth="0.75" strokeOpacity="0.045">
          <path d="M -100 720 C 170 670, 440 800, 780 730 C 1140 660, 1450 780, 1720 690" />
        </g>

        {/* Isobar 1024 hPa */}
        <g stroke="#334155" fill="none" strokeWidth="0.75" strokeOpacity="0.04">
          <path d="M -100 860 C 150 810, 420 920, 750 870 C 1120 810, 1430 910, 1700 830" />
        </g>

        {/* 3. Geopotential Height Discontinuity / Frontal Trough Lines (Dashed) */}
        <g stroke="#475569" fill="none" strokeWidth="0.65" strokeDasharray="5 7" strokeOpacity="0.035">
          <path d="M -60 380 C 300 320, 600 520, 950 420 C 1240 330, 1500 470, 1740 390" />
          <path d="M -80 650 C 240 590, 540 740, 890 660 C 1220 580, 1500 720, 1740 630" />
        </g>

        {/* 4. Closed Atmospheric Cells (Synoptic High / Low centers) */}
        {/* High Pressure System (H) - Upper Right */}
        <g stroke="#334155" fill="none" strokeWidth="0.7" strokeOpacity="0.04">
          <ellipse cx="1320" cy="190" rx="200" ry="100" transform="rotate(-15 1320 190)" />
          <ellipse cx="1320" cy="190" rx="130" ry="65" transform="rotate(-15 1320 190)" />
          <ellipse cx="1320" cy="190" rx="60" ry="30" transform="rotate(-15 1320 190)" />
        </g>

        {/* Low Pressure System (L) - Lower Left */}
        <g stroke="#334155" fill="none" strokeWidth="0.7" strokeOpacity="0.035">
          <ellipse cx="280" cy="870" rx="240" ry="110" transform="rotate(12 280 870)" />
          <ellipse cx="280" cy="870" rx="150" ry="70" transform="rotate(12 280 870)" />
        </g>

        {/* 5. Delicate Observation Station Node Markers (AWS Synoptic Sites) */}
        <g stroke="#334155" fill="none" strokeWidth="0.75" strokeOpacity="0.045">
          {/* Station AWS-01 (Delhi Ridge) */}
          <circle cx="280" cy="240" r="3.5" />
          <line x1="280" y1="233" x2="280" y2="247" />
          <line x1="273" y1="240" x2="287" y2="240" />

          {/* Station (Chennai Meenambakkam) */}
          <circle cx="760" cy="340" r="3.5" />
          <line x1="760" y1="333" x2="760" y2="347" />
          <line x1="753" y1="340" x2="767" y2="340" />

          {/* Station AWS-11 (Jaisalmer) */}
          <circle cx="1080" cy="620" r="3.5" />
          <line x1="1080" y1="613" x2="1080" y2="627" />
          <line x1="1073" y1="620" x2="1087" y2="620" />

          {/* Station AWS-06 (Cherrapunji) */}
          <circle cx="520" cy="740" r="3.5" />
          <line x1="520" y1="733" x2="520" y2="747" />
          <line x1="513" y1="740" x2="527" y2="740" />

          {/* Station AWS-04 (Pune) */}
          <circle cx="1400" cy="420" r="3.5" />
          <line x1="1400" y1="413" x2="1400" y2="427" />
          <line x1="1393" y1="420" x2="1407" y2="420" />
        </g>

        {/* 6. Subtle Scientific Typographic Annotations */}
        <g
          fill="#334155"
          fillOpacity="0.045"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          fontSize="9"
          letterSpacing="0.06em"
        >
          {/* Pressure contour labels */}
          <text x="140" y="200">1004 hPa</text>
          <text x="1160" y="305">1008 hPa</text>
          <text x="800" y="462" fill="#2563EB" fillOpacity="0.06">1012.0 MSLP</text>
          <text x="1380" y="572">1016 hPa</text>
          <text x="180" y="730">1020 hPa</text>
          <text x="1315" y="194" fontWeight="bold">H</text>
          <text x="275" y="874" fontWeight="bold">L</text>

          {/* Perimeter frame metadata */}
          <text x="50" y="45">GRID 0.05° // QC REF 1013.25</text>
          <text x="1420" y="45">WMO-AWS SYNOPTIC</text>
          <text x="1420" y="975">DATUM: WGS84</text>
          <text x="50" y="975">SYS: METEO_QC_V2.4</text>
        </g>
      </svg>
    </div>
  );
};

