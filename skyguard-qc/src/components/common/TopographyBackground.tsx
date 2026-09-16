import React, { memo } from 'react';
import { Topography } from './Topography';

/**
 * TopographyBackground
 * 
 * Reusable full-page background enhancement for SkyGuard.
 * Uses the React Bits Topography component with very subtle, restrained meteorological
 * elevation contours, low opacity, and calm movement.
 * 
 * Key guarantees:
 * - Positioned with absolute inset-0, pointer-events-none, z-0
 * - Does not interfere with clicks, hover states, charts, or scrolling
 * - Opaque UI cards and navy sidebar remain crisp and high-contrast
 * - Memoized to eliminate unnecessary React re-renders
 */
export const TopographyBackground: React.FC = memo(() => {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="pointer-events-none select-none fixed inset-0 overflow-hidden z-0"
    >
      {/* Dynamic Animated Topographic Elevation Map */}
      <Topography
        lowColor="#B8CCD8"
        midColor="#7898AA"
        highColor="#DCE8EF"
        speed={0.28}
        morphAmount={2.2}
        morphSpeed={0.045}
        bands={1.8}
        thickness={0.009}
        scale={1.15}
        pixelSize={1.0}
        glow={0.12}
        colorMode="elevation"
        contrast={1.5}
        brightness={1.0}
        fillBands={false}
        opacity={0.20}
        grain={true}
        grainIntensity={0.015}
        mouseInteraction={true}
        mouseRadius={0.25}
        mouseStrength={0.18}
        className="w-full h-full"
      />

      {/* Subtle Meteorological Graticule Overlay (crosshairs and reference nodes) */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1600 1000"
      >
        <defs>
          <pattern
            id="topo-graticule"
            width="160"
            height="160"
            patternUnits="userSpaceOnUse"
          >
            {/* Coordinate intersection crosshair (+) */}
            <path
              d="M 76 80 H 84 M 80 76 V 84"
              fill="none"
              stroke="#334155"
              strokeWidth="0.75"
              strokeOpacity="0.035"
            />
            {/* Sub-node micro dot */}
            <circle
              cx="80"
              cy="80"
              r="0.75"
              fill="#334155"
              fillOpacity="0.03"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#topo-graticule)" />

        {/* Quiet Synoptic Station Observation Points */}
        <g stroke="#334155" fill="none" strokeWidth="0.75" strokeOpacity="0.035">
          <circle cx="280" cy="240" r="3" />
          <line x1="280" y1="234" x2="280" y2="246" />
          <line x1="274" y1="240" x2="286" y2="240" />

          <circle cx="760" cy="340" r="3" />
          <line x1="760" y1="334" x2="760" y2="346" />
          <line x1="754" y1="340" x2="766" y2="340" />

          <circle cx="1080" cy="620" r="3" />
          <line x1="1080" y1="614" x2="1080" y2="626" />
          <line x1="1074" y1="620" x2="1086" y2="620" />

          <circle cx="520" cy="740" r="3" />
          <line x1="520" y1="734" x2="520" y2="746" />
          <line x1="514" y1="740" x2="526" y2="740" />

          <circle cx="1400" cy="420" r="3" />
          <line x1="1400" y1="414" x2="1400" y2="426" />
          <line x1="1394" y1="420" x2="1406" y2="420" />
        </g>

        {/* Quiet Scientific Frame Coordinates */}
        <g
          fill="#334155"
          fillOpacity="0.03"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          fontSize="8.5"
          letterSpacing="0.06em"
        >
          <text x="50" y="45">GRID 0.05° // QC REF 1013.25</text>
          <text x="1420" y="45">WMO-AWS SYNOPTIC</text>
          <text x="1420" y="975">DATUM: WGS84</text>
          <text x="50" y="975">SYS: METEO_QC_V2.4</text>
        </g>
      </svg>
    </div>
  );
});

TopographyBackground.displayName = 'TopographyBackground';
export default TopographyBackground;
