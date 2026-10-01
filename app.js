class CustomModal {
  constructor() {
    this.currentModal = null;
    this.currentTimer = null;
  }

  show(options = {}) {
    const {
      title = '',
      text = '',
      html = '',
      icon = null,
      showConfirmButton = true,
      showCancelButton = false,
      confirmButtonText = 'OK',
      cancelButtonText = 'Anuluj',
      confirmButtonColor = null,
      timer = null,
      timerProgressBar = false,
      allowOutsideClick = true,
      allowEscapeKey = true,
      showCloseButton = false,
      width = null,
      customClass = {},
      didOpen = null,
      replaceModal = false
    } = options;

    if (this.currentModal && !replaceModal) {
      this.close();
    } else if (this.currentModal && replaceModal) {
      if (this.currentModal.parentNode) {
        this.currentModal.parentNode.removeChild(this.currentModal);
      }
      this.currentModal = null;
      if (this.currentTimer) {
        clearTimeout(this.currentTimer);
        this.currentTimer = null;
      }
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    if (customClass.popup) overlay.classList.add(customClass.popup);

    const modal = document.createElement('div');
    modal.className = 'modal';
    if (width === '600px' || width === '680px' || customClass.popup === 'qr-modal-popup') {
      modal.classList.add('large');
    }
    if (width) modal.style.maxWidth = width;

    const header = document.createElement('div');
    header.className = 'modal-header';

    if (icon) {
      const iconEl = document.createElement('i');
      iconEl.className = `bi modal-icon ${icon}`;
      if (icon === 'success') iconEl.className = 'bi bi-check-circle modal-icon success';
      if (icon === 'error') iconEl.className = 'bi bi-x-circle modal-icon error';
      if (icon === 'warning') iconEl.className = 'bi bi-exclamation-triangle modal-icon warning';
      if (icon === 'info') iconEl.className = 'bi bi-info-circle modal-icon info';
      header.appendChild(iconEl);
    }

    const titleEl = document.createElement('h2');
    titleEl.className = 'modal-title';
    titleEl.innerHTML = title;
    header.appendChild(titleEl);

    if (showCloseButton) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'modal-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.onclick = () => this.close();
      header.appendChild(closeBtn);
    }

    modal.appendChild(header);

    const body = document.createElement('div');
    body.className = 'modal-body';
    if (html) body.innerHTML = html;
    else body.textContent = text;
    modal.appendChild(body);

    if (showConfirmButton || showCancelButton) {
      const actions = document.createElement('div');
      actions.className = 'modal-actions';

      if (showCancelButton) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn';
        cancelBtn.textContent = cancelButtonText;
        cancelBtn.onclick = () => {
          this.close();
          if (options.onCancel) options.onCancel();
        };
        actions.appendChild(cancelBtn);
      }

      if (showConfirmButton) {
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'modal-btn primary';
        confirmBtn.innerHTML = confirmButtonText;
        if (confirmButtonColor === '') confirmBtn.className = 'modal-btn danger';
        confirmBtn.onclick = () => {
          this.close();
          if (options.onConfirm) options.onConfirm();
        };
        actions.appendChild(confirmBtn);
      }

      modal.appendChild(actions);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(() => overlay.classList.add('show'), 10);

    if (allowOutsideClick) {
      overlay.onclick = (e) => {
        if (e.target === overlay) this.close();
      };
    }

    if (allowEscapeKey) {
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.close();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
    }

    if (timer) {
      if (timerProgressBar) {
        const progressBar = document.createElement('div');
        progressBar.className = 'modal-progress';
        const progressBarInner = document.createElement('div');
        progressBarInner.className = 'modal-progress-bar';
        progressBarInner.style.animation = `progress-countdown ${timer}ms linear`;
        progressBar.appendChild(progressBarInner);
        body.appendChild(progressBar);
      }
      this.currentTimer = setTimeout(() => this.close(), timer);
    }

    this.currentModal = overlay;
    if (didOpen) didOpen();

    return {
      isConfirmed: false,
      then: (callback) => {
        if (options.onConfirm) {
          const orig = options.onConfirm;
          options.onConfirm = () => {
            orig();
            callback({ isConfirmed: true });
          };
        }
        return this;
      }
    };
  }

  showLoading() {
    if (this.currentModal) {
      const body = this.currentModal.querySelector('.modal-body');
      if (body) {
        body.innerHTML = `
                            <div class="modal-loading">
                                <div class="modal-spinner"></div>
                            </div>
                        `;
      }
    }
  }

  close() {
    if (this.currentModal) {
      const m = this.currentModal;
      m.classList.remove('show');
      setTimeout(() => {
        if (m && m.parentNode) m.parentNode.removeChild(m);
        if (this.currentModal === m) this.currentModal = null;
      }, 250);
    }
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
  }

  fire(options) {
    return new Promise((resolve) => {
      this.show({
        ...options,
        onConfirm: () => resolve({ isConfirmed: true }),
        onCancel: () => resolve({ isConfirmed: false })
      });
    });
  }
}

const Swal = new CustomModal();
const pStyle = document.createElement('style');
pStyle.textContent = `@keyframes progress-countdown { from { width: 100%; } to { width: 0%; } }`;
document.head.appendChild(pStyle);

let allTractors = [];
let allBoxTrucks = [];
let currentSort = { key: null, direction: 'asc' };

const STORAGE_KEY_DESKTOP = 'FLEET_DESKTOP_DB';
const STORAGE_KEY_ENDPOINT = 'FLEET_MOBILE_ENDPOINT';

// Pomocnik parsowania godzin
const parseHours = (timeStr) => {
  if (timeStr == null || timeStr === '') return 0;
  if (typeof timeStr === 'number') return Number.isFinite(timeStr) ? timeStr : 0;
  const s = String(timeStr).trim().toLowerCase();
  if (!s) return 0;

  const colon = s.match(/^(\d+)\s*:\s*(\d{1,2})$/);
  if (colon) {
    const hh = parseInt(colon[1], 10);
    const mm = parseInt(colon[2], 10);
    if (mm >= 60) return parseFloat(`${colon[1]}.${colon[2]}`.replace(',', '.')) || 0;
    return hh + mm / 60;
  }

  let total = 0;
  let rest = s;

  const dayMatch = rest.match(/(\d+(?:[.,]\d+)?)\s*(?:d|days?|day|dni)\b/);
  if (dayMatch) {
    total += parseFloat(dayMatch[1].replace(',', '.')) * 24;
    rest = rest.replace(dayMatch[0], ' ');
  }

  const hUnit = rest.match(/(\d+(?:[.,]\d+)?)\s*(?:h(?:r|rs)?|hours?|godz\.?)\b/);
  if (hUnit) {
    total += parseFloat(hUnit[1].replace(',', '.'));
    rest = rest.replace(hUnit[0], ' ');
  }

  const mUnit = rest.match(/(\d+)\s*(?:m|min|minutes?|mins?)\b/);
  if (mUnit) {
    total += parseInt(mUnit[1], 10) / 60;
    return total;
  }

  if (hUnit) return total;
  const mOnly = s.match(/^(\d+)\s*(?:m|min|minutes?|mins?)\b$/);
  if (mOnly) return parseInt(mOnly[1], 10) / 60;

  const plain = s.match(/(\d+(?:[.,]\d+)?)/);
  return plain ? parseFloat(plain[1].replace(',', '.')) : 0;
};

function getTimeInYardSegments(hours) {
  if (!Number.isFinite(hours) || hours < 0) return { kind: 'dash' };
  const totalMin = Math.round(hours * 60);
  if (totalMin === 0) return { kind: 'zero' };

  const days = Math.floor(totalMin / (24 * 60));
  let rem = totalMin - days * 24 * 60;
  const hh = Math.floor(rem / 60);
  const m = rem % 60;

  const segments = [];
  if (days > 0) segments.push({ isDays: true, text: `${days} d` });
  if (hh > 0) segments.push({ isDays: false, text: `${hh} h` });
  if (m > 0) segments.push({ isDays: false, text: `${m} min` });
  return { kind: 'segments', segments };
}

function formatTimeInYardDisplay(hours) {
  const seg = getTimeInYardSegments(hours);
  if (seg.kind === 'dash') return '—';
  if (seg.kind === 'zero') return '0 h';
  return seg.segments.map(s => s.text).join(' - ');
}

function getVehicleYardHours(vehicle) {
  const raw = vehicle['Time in Yard'] != null ? String(vehicle['Time in Yard']).trim() : '';
  if (typeof vehicle.TimeInYardHours === 'number' && Number.isFinite(vehicle.TimeInYardHours)) {
    return vehicle.TimeInYardHours;
  }
  return parseHours(raw);
}

function vehicleHasDaysInYard(vehicle) {
  const seg = getTimeInYardSegments(getVehicleYardHours(vehicle));
  return seg.kind === 'segments' && seg.segments.some(s => s.isDays);
}

function countFleetUnitsWithDaysInYard() {
  return [...allTractors, ...allBoxTrucks].filter(vehicleHasDaysInYard).length;
}

function fleetTotalExcludingDaysUnits() {
  const full = allTractors.length + allBoxTrucks.length;
  return Math.max(0, full - countFleetUnitsWithDaysInYard());
}

function renderDesktopTables() {
  const allVehicles = [...allTractors, ...allBoxTrucks];
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = '';

  allVehicles.forEach(row => {
    const tr = document.createElement('tr');
    const rawTime = row['Time in Yard'] != null ? String(row['Time in Yard']).trim() : '';
    const yardHours = typeof row.TimeInYardHours === 'number' && Number.isFinite(row.TimeInYardHours)
      ? row.TimeInYardHours
      : parseHours(rawTime);
    row.TimeInYardHours = yardHours;

    if (vehicleHasDaysInYard(row)) {
      tr.classList.add('row-has-days-in-yard');
    }

    ['Location', 'Type', 'Time in Yard', 'Vehicle ID', 'Notes'].forEach((key) => {
      const td = document.createElement('td');
      const value = row[key] || '';

      if (key === 'Time in Yard') {
        td.textContent = formatTimeInYardDisplay(yardHours);
        td.title = `${rawTime} (${yardHours.toFixed(2)} h)`;
        td.classList.add('cell-time-in-yard');
      } else {
        td.textContent = value;
        td.title = value;
      }

      if (key === 'Type') {
        if (value.toLowerCase() === 'box truck') td.classList.add('vehicle-type-boxtruck');
        else if (value.toLowerCase() === 'tractor') td.classList.add('vehicle-type-tractor');
      }
      tr.appendChild(td);
    });

    const type = row['Type'] || '';
    if (type.toLowerCase() === 'box truck') tr.classList.add('row-boxtruck');
    else if (type.toLowerCase() === 'tractor') tr.classList.add('row-tractor');

    tbody.appendChild(tr);
  });

  updateDesktopCounts(allTractors.length, allBoxTrucks.length);
}

function updateDesktopCounts(tractorCount, boxTruckCount) {
  const totalCount = allTractors.length + allBoxTrucks.length;
  const summaryTotal = fleetTotalExcludingDaysUnits();

  document.getElementById('tractorCount').textContent = tractorCount;
  document.getElementById('boxTruckCount').textContent = boxTruckCount;
  document.getElementById('fleetAllCount').textContent = totalCount;
  document.getElementById('fleetDaysCount').textContent = countFleetUnitsWithDaysInYard();
  document.getElementById('totalCount').textContent = summaryTotal;
  document.getElementById('visibleRowsDisplay').textContent = totalCount;

  const printBtn = document.getElementById('printBtn');
  const pdfBtn = document.getElementById('savePdfBtn');
  const qrBtn = document.getElementById('generateQrBtn');

  printBtn.disabled = totalCount === 0;
  pdfBtn.disabled = totalCount === 0;
  qrBtn.disabled = totalCount === 0;

  const placeholder = document.getElementById('emptyPlaceholder');
  if (placeholder) placeholder.classList.toggle('hidden', totalCount > 0);
}

function saveDesktopDataLocally() {
  const data = {
    tractorRows: allTractors,
    boxTruckRows: allBoxTrucks,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY_DESKTOP, JSON.stringify(data));
}

function loadDesktopData() {
  const savedData = localStorage.getItem(STORAGE_KEY_DESKTOP);
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      allTractors = data.tractorRows || [];
      allBoxTrucks = data.boxTruckRows || [];
      [...allTractors, ...allBoxTrucks].forEach((v) => {
        v.TimeInYardHours = parseHours(v['Time in Yard']);
      });
      renderDesktopTables();
      if (allTractors.length > 0 || allBoxTrucks.length > 0) {
        const fileNameEl = document.getElementById('file-name');
        if (fileNameEl) {
          fileNameEl.textContent = 'Pamięć podręczna komputera';
          fileNameEl.classList.remove('no-file-blink');
        }
      }
    } catch (e) {
      console.error("Błąd odczytu bazy komputera:", e);
    }
  }
}

function getResolvedMobileUrl() {
  const inputVal = (document.getElementById('mobileEndpointInput').value || '').trim();
  if (!inputVal) return 'https://s-pro-v.github.io/tablica_mobile/';

  if (inputVal.startsWith('http://') || inputVal.startsWith('https://')) {
    return inputVal;
  }

  try {
    const base = window.location.href.replace(/\/[^\/]*$/, '/');
    return new URL(inputVal, base).toString();
  } catch (e) {
    return inputVal;
  }
}

function renderQrToCanvas(text, targetDisplaySize = 280) {
  const tempCanvas = document.createElement('canvas');
  const qr = new QRious({
    element: tempCanvas,
    value: text,
    size: 400,
    background: '#ffffff',
    foreground: '#000000',
    level: 'L',
    padding: 0
  });
  void qr;

  const ctx = tempCanvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const { data, width, height } = imgData;

  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx] < 128 && data[idx + 3] > 128) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { dataUrl: tempCanvas.toDataURL('image/png'), size: targetDisplaySize };
  }

  const qrWidth = maxX - minX + 1;
  const qrHeight = maxY - minY + 1;

  let finderStroke = 0;
  for (let x = minX; x <= maxX; x++) {
    const idx = (minY * width + x) * 4;
    if (data[idx] < 128 && data[idx + 3] > 128) finderStroke++;
    else break;
  }
  const modulePx = finderStroke > 0 ? (finderStroke / 7) : (qrWidth / 29);
  const moduleCount = Math.round(qrWidth / modulePx);

  const minPadding = 14;
  let targetModuleSize = Math.floor((targetDisplaySize - minPadding * 2) / moduleCount);
  if (targetModuleSize < 3) targetModuleSize = 3;

  const scaledMatrixSize = moduleCount * targetModuleSize;
  const padding = Math.max(minPadding, Math.round((targetDisplaySize - scaledMatrixSize) / 2));
  const finalSize = scaledMatrixSize + padding * 2;

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = finalSize;
  finalCanvas.height = finalSize;
  const fCtx = finalCanvas.getContext('2d');

  fCtx.fillStyle = '#ffffff';
  fCtx.fillRect(0, 0, finalSize, finalSize);

  fCtx.imageSmoothingEnabled = false;
  fCtx.drawImage(
    tempCanvas,
    minX, minY, qrWidth, qrHeight,
    padding, padding, scaledMatrixSize, scaledMatrixSize
  );

  return {
    dataUrl: finalCanvas.toDataURL('image/png'),
    size: finalSize
  };
}

function packFleetData(fleet) {
  const ts = Date.now();
  const rows = fleet.map(v => {
    const id = (v['Vehicle ID'] || '').replace(/[|~]/g, ' ').trim();
    const typeCode = (v.Type || '').toLowerCase() === 'tractor' ? 'T' : 'B';
    const loc = (v.Location || '').replace(/[|~]/g, ' ').trim();
    const yardHours = typeof v.TimeInYardHours === 'number' && Number.isFinite(v.TimeInYardHours)
      ? v.TimeInYardHours
      : parseHours(v['Time in Yard']);
    const mins = Math.max(0, Math.round(yardHours * 60));
    const notes = (v.Notes || '').replace(/[|~]/g, ' ').trim();
    return `${id}|${typeCode}|${loc}|${mins}|${notes}`;
  });
  return `${ts}~${rows.join('~')}`;
}

// Generator kodu QR dla telefonu z przyciskiem druku tabeli
function generatePhoneSyncQR() {
  const allVehicles = [...allTractors, ...allBoxTrucks];
  if (allVehicles.length === 0) return;

  const targetBaseUrl = getResolvedMobileUrl();
  const compactPayload = packFleetData(allVehicles);

  // Kompresja LZ-String skróconego ciągu znaków
  const compressed = LZString.compressToEncodedURIComponent(compactPayload);
  const finalMobileUrl = `${targetBaseUrl}#d=${compressed}`;
  const qrResult = renderQrToCanvas(finalMobileUrl, 280);

  Swal.show({
    title: '<i class="bi bi-phone" style="color: var(--highlight-color);"></i> KOD QR DLA SMARTFONA',
    html: `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center;">
                        <div class="qr-bezel-frame">
                            <img src="${qrResult.dataUrl}" class="qr-code-image" style="width: ${qrResult.size}px; height: ${qrResult.size}px; max-width: 100%;" alt="QR Kod do przesłania na telefon">
                        </div>

                        <div style="background: var(--card-bg); border: 1px solid var(--border-color); padding: 0.75rem; text-align: left; width: 100%; font-size: 0.7rem; display: flex; flex-direction: column; gap: 0.4rem;">
                            <div><strong style="color: var(--led-green);">OPTYMALIZACJA QR:</strong> Skondensowano dane (${allVehicles.length} pojazdów). Kod jest idealnie wycentrowany i wypełnia równo kwadrat.</div>
                            <div><strong style="color: var(--highlight-color);">ODBIORNIK:</strong> <code>${targetBaseUrl}</code></div>
                            <div style="color: var(--text-muted); font-size: 0.65rem;">
                                Typy wysyłane są w minimalnym kodzie [T/B], a czas jako minuty. Strona mobilna automatycznie rozwinie pełne opisy i zachowa dane trwale w telefonie.
                            </div>
                        </div>

                        <div style="display: flex; gap: 0.5rem; width: 100%; flex-wrap: wrap;">
                            <button type="button" id="copyMobileLinkBtn" class="modal-btn" style="flex: 1;">
                                <i class="bi bi-clipboard"></i> Kopiuj Link
                            </button>
                            <button type="button" id="printModalTableBtn" class="modal-btn" style="flex: 1;">
                                <i class="bi bi-printer"></i> Drukuj Tabelę
                            </button>
                            <button type="button" id="openMobilePreviewBtn" class="modal-btn primary" style="flex: 1 1 100%;">
                                <i class="bi bi-box-arrow-up-right"></i> Otwórz w Nowym Oknie
                            </button>
                        </div>
                    </div>
                `,
    width: '600px',
    showCloseButton: true,
    confirmButtonText: 'Zamknij',
    didOpen: () => {
      const copyBtn = document.getElementById('copyMobileLinkBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          const tempInput = document.createElement('input');
          tempInput.value = finalMobileUrl;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
          copyBtn.innerHTML = '<i class="bi bi-check-lg" style="color: var(--led-green);"></i> Skopiowano Link!';
          setTimeout(() => { copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> Kopiuj Link'; }, 2000);
        });
      }

      const printTableBtn = document.getElementById('printModalTableBtn');
      if (printTableBtn) {
        printTableBtn.addEventListener('click', () => {
          printReport();
        });
      }

      const openBtn = document.getElementById('openMobilePreviewBtn');
      if (openBtn) {
        openBtn.addEventListener('click', () => {
          window.open(finalMobileUrl, '_blank');
        });
      }
    }
  });
}

function handleCSV(file) {
  const fileNameEl = document.getElementById('file-name');
  fileNameEl.textContent = file.name;
  fileNameEl.classList.remove('no-file-blink');

  Swal.show({
    title: 'Przetwarzanie pliku CSV...',
    text: 'Parsowanie i przygotowywanie bazy pojazdów.',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
    complete: function (results) {
      allTractors = [];
      allBoxTrucks = [];
      let processed = 0;

      results.data.forEach(row => {
        if (!row || typeof row !== 'object' || !row.Type || !row.Location) return;
        const v = {};
        for (const k in row) {
          if (Object.prototype.hasOwnProperty.call(row, k)) {
            v[k] = typeof row[k] === 'string' ? row[k].trim() : row[k];
          }
        }
        v.TimeInYardHours = parseHours(v['Time in Yard']);
        const type = (v.Type || '').toLowerCase();
        const loc = v.Location || '';

        // Filtruj strefy OS- zgodnie ze specyfikacją terminala
        if (type === 'tractor' && !loc.startsWith('OS-')) {
          allTractors.push(v);
          processed++;
        } else if (type === 'box truck' && !loc.startsWith('OS-')) {
          allBoxTrucks.push(v);
          processed++;
        }
      });

      renderDesktopTables();
      saveDesktopDataLocally();
      Swal.close();

      // Automatyczne przejście do okna QR po poprawnym załadowaniu
      setTimeout(() => {
        if (processed > 0) {
          generatePhoneSyncQR();
        } else {
          Swal.show({
            title: 'Brak Pojazdów',
            text: 'Plik CSV został wczytany, lecz nie znaleziono żadnych pasujących rekordów.',
            icon: 'warning',
            timer: 2000,
            timerProgressBar: true
          });
        }
      }, 100);
    },
    error: function (err) {
      Swal.close();
      Swal.show({
        icon: 'error',
        title: 'Błąd Parsowania CSV',
        text: err.message
      });
    }
  });
}

function handleSort(e) {
  const th = e.target.closest('th');
  if (!th || !th.dataset.sortKey) return;

  const key = th.dataset.sortKey;
  const direction = currentSort.key === key && currentSort.direction === 'asc' ? 'desc' : 'asc';
  currentSort = { key, direction };

  const allVehicles = [...allTractors, ...allBoxTrucks];
  allVehicles.sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    let comp = 0;
    if (typeof valA === 'number' && typeof valB === 'number') comp = valA - valB;
    else if (valA != null && valB != null) comp = valA.toString().localeCompare(valB.toString(), undefined, { numeric: true });
    else if (valA != null) comp = 1;
    else if (valB != null) comp = -1;
    return direction === 'asc' ? comp : -comp;
  });

  allTractors = allVehicles.filter(v => (v.Type || '').toLowerCase() === 'tractor');
  allBoxTrucks = allVehicles.filter(v => (v.Type || '').toLowerCase() === 'box truck');

  renderDesktopTables();

  document.querySelectorAll('th[data-sort-key]').forEach(h => {
    const ind = h.querySelector('.sort-indicator');
    if (!ind) return;
    ind.className = 'bi bi-arrow-down-up sort-indicator';
    if (h.dataset.sortKey === currentSort.key) {
      ind.className = `bi ${direction === 'asc' ? 'bi-sort-up' : 'bi-sort-down'} sort-indicator`;
    }
  });
}

function printReport() {
  const total = allTractors.length + allBoxTrucks.length;
  if (total === 0) return;

  const printWindow = window.open('', '_blank');
  const rowsHtml = Array.from(document.querySelectorAll('#dataTable tbody tr'))
    .map(r => `<tr>${Array.from(r.cells).map(c => `<td>${c.textContent}</td>`).join('')}</tr>`)
    .join('');

  printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="pl">
                <head>
                    <meta charset="UTF-8">
                    <title>Raport Floty - ${new Date().toLocaleString('pl-PL')}</title>
                    <style>
                        @media print {
                            * { font-family: monospace; }
                            body { padding: 0.5cm; font-size: 8pt; color: #000; }
                            table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
                            th, td { border: 1px solid #333; padding: 4px; text-align: left; }
                            th { background: #eee; text-transform: uppercase; }
                            @page { size: A4 landscape; margin: 0.5cm; }
                        }
                    </style>
                </head>
                <body>
                    <h2>STACJA GŁÓWNA FLOTY // RAPORT DYSPEDYTORSKI</h2>
                    <div>Razem (bez dni): ${fleetTotalExcludingDaysUnits()} | Ciągniki: ${allTractors.length} | Dostawcze: ${allBoxTrucks.length} | ≥1 Dzień: ${countFleetUnitsWithDaysInYard()}</div>
                    <table>
                        <thead>
                            <tr><th>Lokalizacja</th><th>Typ</th><th>Czas na placu</th><th>ID Pojazdu</th><th>Notatki</th></tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </body>
                </html>
            `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
  // Motyw ciemny / jasny
  const themeToggleBtn = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('theme', savedTheme);
  themeToggleBtn.querySelector('i').className = `bi bi-${savedTheme === 'dark' ? 'sun' : 'moon'}`;

  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('theme', next);
    localStorage.setItem('theme', next);
    themeToggleBtn.querySelector('i').className = `bi bi-${next === 'dark' ? 'sun' : 'moon'}`;
  });

  // Wczytaj zapamiętany adres docelowy mobile.html
  const savedEndpoint = localStorage.getItem(STORAGE_KEY_ENDPOINT);
  if (savedEndpoint) {
    document.getElementById('mobileEndpointInput').value = savedEndpoint;
  }

  document.getElementById('saveEndpointBtn').addEventListener('click', () => {
    const val = document.getElementById('mobileEndpointInput').value.trim();
    localStorage.setItem(STORAGE_KEY_ENDPOINT, val);
    Swal.show({
      title: 'Adres Zapisany',
      text: `Kody QR będą kierować do: ${val}`,
      icon: 'success',
      timer: 1600,
      timerProgressBar: true
    });
  });

  // Drag & Drop plików CSV
  const uploadBox = document.getElementById('upload-section');
  uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); uploadBox.classList.add('drop-zone-active'); });
  uploadBox.addEventListener('dragleave', () => uploadBox.classList.remove('drop-zone-active'));
  uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('drop-zone-active');
    if (e.dataTransfer.files.length) handleCSV(e.dataTransfer.files[0]);
  });
  document.getElementById('csvFile').addEventListener('change', (e) => {
    if (e.target.files.length) handleCSV(e.target.files[0]);
  });

  // Akcje przycisków
  document.getElementById('generateQrBtn').addEventListener('click', generatePhoneSyncQR);
  document.getElementById('printBtn').addEventListener('click', printReport);
  document.getElementById('savePdfBtn').addEventListener('click', printReport);

  // Czyszczenie bazy
  document.getElementById('resetBtn').addEventListener('click', () => {
    Swal.fire({
      title: 'Wyczyścić bazę w komputerze?',
      text: 'Dane zostaną usunięte z widoku stacji głównej. Telefony zachowają swoje bazy dopóki nie zostaną wyczyszczone ręcznie.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Tak, wyczyść stację',
      cancelButtonText: 'Anuluj'
    }).then(res => {
      if (res.isConfirmed) {
        allTractors = [];
        allBoxTrucks = [];
        localStorage.removeItem(STORAGE_KEY_DESKTOP);
        document.getElementById('csvFile').value = '';
        document.getElementById('file-name').textContent = 'Nie wybrano pliku';
        document.getElementById('file-name').classList.add('no-file-blink');
        renderDesktopTables();
      }
    });
  });

  // Instrukcja
  document.getElementById('toggleInfoBtn').addEventListener('click', () => {
    Swal.show({
      title: '<i class="bi bi-shield-lock" style="color: var(--led-green);"></i> DOKUMENTACJA TECHNICZNA // GWARANCJA ZERO-CLOUD',
      html: `
                        <div class="doc-section">
                            <div class="doc-card accent-green">
                                <div class="doc-title" style="color: var(--led-green);">
                                    <i class="bi bi-hdd-network"></i> 100% PRZETWARZANIE LOKALNE (ZERO-CLOUD / BRAK SERWERÓW ZEWNĘTRZNYCH)
                                </div>
                                <div class="doc-text">
                                    System działa w modelu <strong>Client-Only (Client-Side In-Memory Architecture)</strong>.
                                    Żadne dane o pojazdach, numerach VIN, czasach postoju ani notatkach <strong>NIGDY nie opuszczają Twojego komputera ani telefonu</strong>:
                                    <ul class="doc-list">
                                        <li><strong>Zero zapytań sieciowych (Zero Telemetry):</strong> Podczas pracy z plikiem CSV system nie wykonuje żadnych wywołań <code>fetch</code>, <code>XMLHttpRequest</code> ani <code>WebSocket</code> przesyłających dane firmy.</li>
                                        <li><strong>Przetwarzanie w pamięci RAM:</strong> Biblioteka <code>PapaParse</code> analizuje plik CSV bezpośrednio w procesie przeglądarki na Twoim komputerze.</li>
                                        <li><strong>Brak zewnętrznych baz danych:</strong> Baza istnieje tylko na ekranie komputera oraz w bezpiecznej pamięci przeglądarki smartfona.</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="doc-card accent-blue">
                                <div class="doc-title" style="color: var(--vs-blue);">
                                    <i class="bi bi-camera"></i> FIZYCZNY TRANSFER OPTYCZNY (AIR-GAP VIA QR)
                                </div>
                                <div class="doc-text">
                                    Przesył danych ze stacji PC na smartfon odbywa się za pomocą <strong>światła widzialnego (Air-Gap)</strong>:
                                    <ul class="doc-list">
                                        <li>Komputer kompresuje dane pojazdów (lokalnym algorytmem LZ-String) bezpośrednio do linku z parametrem hasha: <code>mobile.html#d=...</code>.</li>
                                        <li>Aparat telefonu rejestruje kod QR. Żaden serwer pośredniczący, chmura dyskowa czy zewnętrzny serwer proxy nie uczestniczy w transmisji.</li>
                                        <li>Przesył działa nawet na komputerze całkowicie odciętym od Internetu.</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="doc-card accent-orange">
                                <div class="doc-title" style="color: var(--highlight-color);">
                                    <i class="bi bi-phone"></i> PAMIĘĆ TRWAŁA TELEFONU & PRACA OFFLINE
                                </div>
                                <div class="doc-text">
                                    Smartfon po zeskanowaniu natychmiast zapisuje dane w lokalnym magazynie <code>localStorage</code> urządzenia:
                                    <ul class="doc-list">
                                        <li><strong>Odporność na restart:</strong> Możesz zamknąć przeglądarkę, schować telefon do kieszeni, włączyć tryb samolotowy lub zrestartować urządzenie — dane nie znikną.</li>
                                        <li><strong>Pełna kontrola dyspozytora:</strong> Dane z telefonu zostaną usunięte <strong>wyłącznie wtedy, gdy sam klikniesz czerwony przycisk „Wyczyść”</strong> na smartfonie.</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="doc-card accent-red">
                                <div class="doc-title" style="color: var(--hazard-red);">
                                    <i class="bi bi-lightning-charge"></i> ULTRA-KOMPAKTOWA KOMPRESJA DANYCH
                                </div>
                                <div class="doc-text">
                                    Aby kod QR był maksymalnie czytelny i szybko wykrywany przez każdy aparat:
                                    <ul class="doc-list">
                                        <li>Typ pojazdu redukowany jest do 1 znaku: <code>T</code> = Ciągnik, <code>B</code> = Dostawczy.</li>
                                        <li>Czas na placu przesyłany jest jako surowa liczba minut (np. 1440 min zamiast długiego tekstu).</li>
                                        <li>Strona mobilna automatycznie rozwija skróty do pełnych nazw, przelicza dni/godziny i generuje czerwone alerty dla postoju &ge; 24h.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `,
      width: '680px',
      confirmButtonText: '<i class="bi bi-check-lg"></i> ZROZUMIAŁEM // ZAMKNIJ'
    });
  });

  // Sortowanie kolumn
  document.querySelectorAll('#dataTable thead th').forEach(th => th.addEventListener('click', handleSort));

  // Wczytanie zapisanych danych
  loadDesktopData();
});