const fs = require('fs');
const path = require('path');
const https = require('https');

const stations = [
  { name: 'New_Delhi', lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai_Colaba', lat: 18.9067, lon: 72.8147 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Jaisalmer_Desert', lat: 26.9157, lon: 70.9083 },
  { name: 'Cherrapunji_Wet', lat: 25.2702, lon: 91.7323 }
];

const targetDir = path.join(__dirname, '..', 'data', 'raw', 'open_meteo');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function fetchStationData(station) {
  return new Promise((resolve, reject) => {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${station.lat}&longitude=${station.lon}&start_date=2023-01-01&end_date=2023-12-31&hourly=temperature_2m,relative_humidity_2m,surface_pressure&timezone=Asia%2FKolkata`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.hourly) {
            return reject(new Error('No hourly data found in response'));
          }
          const rows = ['timestamp,temperature_c,relative_humidity_pct,surface_pressure_hpa,station,latitude,longitude'];
          const { time, temperature_2m, relative_humidity_2m, surface_pressure } = json.hourly;
          
          for (let i = 0; i < time.length; i++) {
            rows.push(`${time[i]},${temperature_2m[i]},${relative_humidity_2m[i]},${surface_pressure[i]},${station.name},${station.lat},${station.lon}`);
          }
          
          const filePath = path.join(targetDir, `${station.name}_2023_hourly.csv`);
          fs.writeFileSync(filePath, rows.join('\n'), 'utf8');
          console.log(`[✓] Downloaded ${rows.length - 1} hourly records for ${station.name} -> ${filePath}`);
          resolve(rows.length - 1);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Starting automated Indian AWS multi-station dataset download...');
  for (const st of stations) {
    await fetchStationData(st);
  }
  console.log('\nAll 5 Indian climate stations successfully downloaded and saved to data/raw/open_meteo/ !');
}

run().catch(console.error);
