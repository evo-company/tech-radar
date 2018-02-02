const GoogleSpreadsheet = require('google-spreadsheet');
const fs = require('fs');
const path = require('path');

function getWorksheet(doc) {
  return new Promise((res, rej) => {
    doc.getInfo((err, info) => {
      err ? rej(err) : res(info.worksheets[0]);
    });
  });
}

function getRows(sheet) {
  return new Promise((res, rej) => {
    sheet.getRows((err, rows) => err ? rej(err) : res(rows));
  });
}

function getCells(sheet) {
  return new Promise((res, rej) => {
    sheet.getCells((err, rows) => err ? rej(err) : res(rows));
  });
}

const rings = {
  adopt: 0,
  trial: 1,
  assess: 2,
  hold: 3,
}

function getQuadrants(rows) {
    return Array.from(
      new Set(rows.map(({ quadrant }) => quadrant))
    ).map((quadrant) => ({ name: quadrant }));
}

function getRings(rows) {
  return Array.from(
    new Set(rows.map(({ ring }) => ring))
  ).map((quadrant) => ({ name: quadrant }));
}

function comparator(a, b) {
  if (a < b) {
    return -1;
  } 
  if (a > b) {
    return 1;
  }
  return 0;
}

async function start() {
  const doc = new GoogleSpreadsheet('1h7Dp_9TnPKS1CveyY4gI2T_lOLDxfV2Cv45TrCgCGFA');
  const sheet = await getWorksheet(doc);
  const [rows, cells] = await Promise.all([getRows(sheet), getCells(sheet)]);
  const quadrants = getQuadrants(rows);

  const quadrantsMap = {};
  quadrants.forEach((quad, i) => quadrantsMap[quad.name] = i);
  
  const entries = rows.map((row) => {
      return {
        quadrant: quadrantsMap[row.quadrant],
        ring: rings[row.ring],
        label: row.name,
        active: false,
        moved: 0,
        link: '',
      }
  }).sort((e1, e2) => comparator(e2.quadrant, e1.quadrant));

  const tmpl = fs.readFileSync(path.join(__dirname, 'index-tmpl.html')).toString();
  const resultFile = tmpl.replace('<ENTRIES>', JSON.stringify(entries));
  fs.writeFileSync('docs/index.html', resultFile);
}

start();