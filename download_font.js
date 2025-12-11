import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url =
    'https://raw.githubusercontent.com/google/fonts/main/ofl/greatvibes/GreatVibes-Regular.ttf';
const dest = path.join(__dirname, 'public', 'fonts', 'GreatVibes-Regular.ttf');

// Ensure directory exists
const dir = path.dirname(dest);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

function download(url, dest, cb) {
    const file = fs.createWriteStream(dest);
    const request = https
        .get(url, function (response) {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                console.log('Redirecting to:', response.headers.location);
                return download(response.headers.location, dest, cb);
            }

            if (response.statusCode !== 200) {
                console.error(`Failed to download: ${response.statusCode}`);
                return;
            }

            response.pipe(file);
            file.on('finish', function () {
                file.close(cb);
            });
        })
        .on('error', function (err) {
            fs.unlink(dest);
            if (cb) cb(err.message);
        });
}

console.log(`Downloading to ${dest}...`);
download(url, dest, (err) => {
    if (err) console.error('Error:', err);
    else console.log('Download completed successfully!');
});
