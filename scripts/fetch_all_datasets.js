const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');

const rawDir = path.join(__dirname, '..', 'data', 'raw');
const openMeteoDir = path.join(rawDir, 'open_meteo');
const benchmarkDir = path.join(rawDir, 'benchmarks');

[rawDir, openMeteoDir, benchmarkDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const indianStations = [
  { name: 'New_Delhi_Safdarjung', lat: 28.5833, lon: 77.2000, desc: 'Northern Plains / Extreme Heat & Winter Fog' },
  { name: 'Mumbai_Santacruz', lat: 19.1167, lon: 72.8500, desc: 'Western Coastal / High Humidity & Monsoon Depressions' },
  { name: 'Bengaluru_HAL', lat: 12.9500, lon: 77.6667, desc: 'Deccan Plateau / Tropical Savanna' },
  { name: 'Jaisalmer_Desert', lat: 26.9157, lon: 70.9083, desc: 'Thar Arid / Extreme Diurnal Swing & Low RH' },
  { name: 'Cherrapunji_Mawsynram', lat: 25.2702, lon: 91.7323, desc: 'Northeast Highlands / Ultra-High Precipitation & Saturation' },
  { name: 'Chennai_Meenambakkam', lat: 12.9900, lon: 80.1800, desc: 'Southeast Coast / Northeast Monsoon & Maritime Climate' },
  { name: 'Shimla_Himalayan', lat: 31.1048, lon: 77.1734, desc: 'High Altitude Mountain / Sub-zero & Low Atmospheric Pressure' }
];

function fetchHttps(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchHttps(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage} for ${url}`));
      }
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function fetchMultiYearStation(station, startYear = 2021, endYear = 2024) {
  console.log(`[+] Fetching multi-year data (${startYear}-${endYear}) for ${station.name}...`);
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${station.lat}&longitude=${station.lon}&start_date=${startYear}-01-01&end_date=${endYear}-12-31&hourly=temperature_2m,relative_humidity_2m,surface_pressure,dew_point_2m&timezone=Asia%2FKolkata`;
  
  const buf = await fetchHttps(url);
  const json = JSON.parse(buf.toString('utf8'));
  
  if (!json.hourly) throw new Error(`Failed to parse hourly data for ${station.name}`);
  
  const { time, temperature_2m, relative_humidity_2m, surface_pressure, dew_point_2m } = json.hourly;
  const rows = ['timestamp,temperature_c,relative_humidity_pct,surface_pressure_hpa,dew_point_c,station,latitude,longitude,climate_zone'];
  
  for (let i = 0; i < time.length; i++) {
    rows.push(`${time[i]},${temperature_2m[i]},${relative_humidity_2m[i]},${surface_pressure[i]},${dew_point_2m[i]},${station.name},${station.lat},${station.lon},"${station.desc}"`);
  }
  
  const filename = path.join(openMeteoDir, `${station.name}_${startYear}_${endYear}_hourly.csv`);
  fs.writeFileSync(filename, rows.join('\n'), 'utf8');
  console.log(`    -> Saved ${rows.length - 1} records to ${path.basename(filename)}`);
}

async function fetchJenaClimateBenchmark() {
  console.log('\n[+] Fetching Max Planck Jena Climate Benchmark Dataset (standard meteorological benchmark)...');
  const url = 'https://storage.googleapis.com/tensorflow/tf-keras-datasets/jena_climate_2009_2016.csv.zip';
  const zipBuf = await fetchHttps(url);
  
  // Unzip using AdmZip or raw extract
  const unzipped = zlib.unzipSync(zipBuf);
  // Note: standard zip container contains local file headers. Let's write the zip and extract.
  const zipPath = path.join(benchmarkDir, 'jena_climate_2009_2016.zip');
  fs.writeFileSync(zipPath, zipBuf);
  console.log(`    -> Jena Climate dataset downloaded (${(zipBuf.length / (1024 * 1024)).toFixed(2)} MB).`);
}

async function main() {
  console.log('===============================================================');
  console.log('   SkyGuard AI: Comprehensive Meteorological Dataset Downloader');
  console.log('===============================================================\n');
  
  for (const st of indianStations) {
    try {
      await fetchMultiYearStation(st, 2021, 2024);
      // Small pause to be polite to API
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`[-] Error fetching ${st.name}:`, err.message);
    }
  }

  try {
    await fetchJenaClimateBenchmark();
  } catch (err) {
    console.error('[-] Error fetching Jena benchmark zip:', err.message);
  }

  console.log('\n[✓] All dataset downloads finished. Proceeding to verification...');
}

main();
