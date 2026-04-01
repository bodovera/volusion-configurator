function getBreakpoint(value, list) {
  return list.find(function (x) {
    return x >= value;
  });
}

function lookupPrice(tableName, width, height, tables) {
  var table = tables[tableName];
  if (!table) return 0;

  var w = getBreakpoint(width, table.widths);
  var h = getBreakpoint(height, table.heights);

  if (!w || !h) return 0;

  var wIndex = table.widths.indexOf(w);
  if (wIndex === -1) return 0;

  if (!table.values || !table.values[h]) return 0;

  return table.values[h][wIndex] || 0;
}

function parseFraction(val) {
  if (!val || val === '0') return 0;

  val = String(val).trim();

  if (val.indexOf('/') > -1) {
    var parts = val.split('/');
    if (parts.length === 2) {
      var num = parseFloat(parts[0]);
      var den = parseFloat(parts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }
  }

  var parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
}

function getEffectiveSize() {
  var width = parseFloat(document.querySelector('#width')?.value || 0);
  var widthInc = parseFraction(document.querySelector('#widthInc')?.value);

  var height = parseFloat(document.querySelector('#height')?.value || 0);
  var heightInc = parseFraction(document.querySelector('#heightInc')?.value);

  return {
    width: width + widthInc,
    height: height + heightInc
  };
}
