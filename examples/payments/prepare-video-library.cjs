// Run explicitly to prepare the licensed, local video collection. Never runs at startup.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const directory = path.join(__dirname, 'assets/videos');
const cachePath = path.resolve(__dirname, '../../tmp/video-source-cache.json');
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function get(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, {signal: AbortSignal.timeout(45000)});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response;
    } catch (error) {
      if (attempt === 3) throw error;
      await pause(1500 * (attempt + 1));
    }
  }
}
async function main() {
  const links = new Set();
  for (let page = 1; page <= 29; page++) {
    const url = 'https://mixkit.co/free-stock-video/coffee/' + (page > 1 ? '?page=' + page : '');
    const html = cache[url] || await (await get(url)).text();
    cache[url] = html;
    for (const match of html.matchAll(/href="(\/free-stock-video\/[^"/]+-\d+\/)"/g)) {
      if (/coffee|cappuccino|latte|espresso|barista|cafe|caffeine|chemex/i.test(match[1])) links.add('https://mixkit.co' + match[1]);
    }
    fs.writeFileSync(cachePath, JSON.stringify(cache));
    console.log('Collection page', page, 'candidates', links.size);
  }
  for (const tag of ['coffee-cup','coffee-bean','coffee-bar','cafe']) {
    for (let page=1;page<=7;page++) {
      const url='https://mixkit.co/free-stock-video/'+tag+'/' +(page>1?'?page='+page:'');
      try {cache[url]=cache[url]||await (await get(url)).text();fs.writeFileSync(cachePath,JSON.stringify(cache));console.log('Additional collection',tag,page);await pause(500);} catch(error) {console.log('Skipped collection',tag,page);break;}
    }
  }
  // The collection's JSON-LD explicitly identifies each asset's license and file.
  // Reuse that evidence rather than requesting hundreds of detail pages.
  const candidates = new Map();
  for (const [pageUrl, html] of Object.entries(cache)) {
    if (!/\/free-stock-video\/(coffee|coffee-cup|coffee-bean|coffee-bar|cafe)\//.test(pageUrl)) continue;
    for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      const data = JSON.parse(match[1]);
      for (const video of data['@graph'] || []) {
        if (video['@type'] === 'VideoObject' && video.license === 'https://mixkit.co/license/#videoFree') {
          const source = video['@id'].replace(/#video$/, '');
          if (/coffee|cappuccino|latte|espresso|barista|cafe|chemex/i.test(source) && !source.endsWith('-20028/')) candidates.set(source, {...video, pageUrl});
        }
      }
    }
  }
  const existing = require('./assets/videos/sources.json');
  const sources = existing.filter(s=>!s.source.endsWith('-20028/'));
  const hashes = new Set(existing.map(s => crypto.createHash('sha256').update(fs.readFileSync(path.join(directory, s.name + '.mp4'))).digest('hex')));
  for (const [source, metadata] of candidates) {
    if (sources.length >= 130) break;
    if (sources.some(s => s.source === source)) continue;
    try {
      const url = metadata.embedUrl;
      if (!url) continue;
      const id = source.match(/-(\d+)\/$/)[1];
      const name = 'coffee-' + id;
      const buffer = Buffer.from(await (await get(url)).arrayBuffer());
      if (buffer.length < 10000 || buffer.toString('ascii', 4, 8) !== 'ftyp') throw new Error('Invalid MP4');
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      if (hashes.has(hash)) continue;
      hashes.add(hash);
      fs.writeFileSync(path.join(directory, name + '.mp4'), buffer);
      sources.push({name, source, url, title:metadata.name, license:'Mixkit Stock Video Free License', licenseUrl:metadata.license, licenseEvidence:metadata.pageUrl, sha256:hash, bytes:buffer.length});
      fs.writeFileSync(path.join(directory, 'sources.json'), JSON.stringify(sources, null, 2) + '\n');
      console.log('Prepared', sources.length, name, buffer.length);
      await pause(450);
    } catch (error) { console.log('Skipped', source, error.message); }
  }
  if (sources.length !== 130) throw new Error('Only prepared ' + sources.length + ' unique videos');
}
main().catch(error => {console.error(error); process.exitCode = 1;});
