const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const destDir = path.join(__dirname, '..', 'data', 'raw', 'benchmarks');
const zipPath = path.join(destDir, 'jena.zip');

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const url = 'https://storage.googleapis.com/tensorflow/tf-keras-datasets/jena_climate_2009_2016.csv.zip';
const file = fs.createWriteStream(zipPath);

console.log('Downloading via Node stream...');
https.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close(() => {
      console.log('Download complete. Extracting via tar...');
      try {
        execSync(`tar -xf "${zipPath}" -C "${destDir}"`);
        fs.unlinkSync(zipPath);
        console.log('Extracted successfully!');
      } catch (e) {
        console.log('Extraction fallback with powershell Expand-Archive...');
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`);
        fs.unlinkSync(zipPath);
        console.log('PowerShell extract complete!');
      }
    });
  });
}).on('error', (err) => {
  fs.unlinkSync(zipPath);
  console.error('Error:', err.message);
});
