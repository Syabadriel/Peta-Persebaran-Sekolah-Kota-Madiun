// ---------- Map ----------
const map = L.map('map').setView([-7.6298, 111.5239], 13);

const baseLayers = {
  "🌍 OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }),
  "🛰️ Satelit Esri": L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri',
    maxZoom: 19
  }),
  "🗺️ CartoDB": L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CartoDB',
    maxZoom: 19
  })
};
baseLayers["🌍 OpenStreetMap"].addTo(map);
L.control.layers(baseLayers, null, { collapsed: false }).addTo(map);

// ---------- Config ----------
const colors = {
  TK: '#e74c3c', KB: '#c0392b', PAUD: '#8e44ad',
  SD: '#3498db', SMP: '#2980b9', PKBM: '#1abc9c',
  SPS: '#f39c12', TPA: '#27ae60'
};

let markers = [];
let markerCluster;
let activeFilters = new Set();
let allSchools = [];

// ---------- Icon ----------
function createSchoolIcon(jenjang, isFiltered = false) {
  const color = colors[jenjang] || '#7f8c8d';
  const opacity = isFiltered ? 0.3 : 1;
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="school-marker" style="background-color:${color};opacity:${opacity}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}

// ---------- Cluster ----------
markerCluster = L.markerClusterGroup({
  chunkedLoading: true,
  maxClusterRadius: 50,
  iconCreateFunction(c) {
    const childCount = c.getChildCount();
    let size = 'large';
    if (childCount < 10) size = 'small';
    else if (childCount < 100) size = 'medium';
    return new L.DivIcon({
      html: `<div><span>${childCount}</span></div>`,
      className: `marker-cluster marker-cluster-${size}`,
      iconSize: new L.Point(40, 40)
    });
  }
});

// ---------- Boundary ----------
fetch('Batas_kota_madiun.geojson')
  .then(r => r.json())
  .then(geo => {
    const batasOutline = L.geoJSON(geo, { style: { color: '#000', weight: 6, opacity: 0.8, fillOpacity: 0 } });
    const batasInner = L.geoJSON(geo, { style: { color: '#ff0000', weight: 2, opacity: 1, fillOpacity: 0 } });
    map.addLayer(batasOutline);
    map.addLayer(batasInner);
    map.fitBounds(batasInner.getBounds());
  });

// ---------- Load School Data ----------
fetch('Data_Sekolah.json')
  .then(r => r.json())
  .then(loadSchoolData);

function loadSchoolData(data) {
  allSchools = data;
  let totalGuru = 0, totalSiswa = 0;

  markerCluster.clearLayers();
  markers = [];

  data.forEach(s => {
    const m = L.marker([s.LATITUDE, s.LONGITUDE], { icon: createSchoolIcon(s.JENJANG) });
    m.bindTooltip(s['NAMA SEKOLAHAN'], { direction: 'top', offset: [0, -10], className: 'school-label' });

    m.bindPopup(`
      <div class="popup-content">
        <h4><i class="fas fa-school"></i> ${s['NAMA SEKOLAHAN']}</h4>
        <p><strong>NPSN:</strong> ${s.NPSN || '-'}</p>
        <p><strong>Jenjang:</strong> <span style="color:${colors[s.JENJANG]}">${s.JENJANG}</span></p>
        <p><strong>Alamat:</strong> ${s.ALAMAT || '-'}</p>
        <p><strong>Jumlah Guru:</strong> ${s['JUMLAH GURU']} orang</p>
        <p><strong>Jumlah Siswa:</strong> ${s['JUMLAH SISWA']} siswa</p>
      </div>`);

    markerCluster.addLayer(m);
    markers.push({ marker: m, data: s });
    totalGuru += Number(s['JUMLAH GURU']) || 0;
    totalSiswa += Number(s['JUMLAH SISWA']) || 0;
  });

  map.addLayer(markerCluster);
  updateStats(data.length, totalGuru, totalSiswa);
  createFilterChips();
  createLegend();
  document.getElementById('loading').style.display = 'none';
}

// ---------- Stats ----------
function updateStats(tSekolah, tGuru, tSiswa) {
  document.getElementById('total-sekolah').textContent = tSekolah.toLocaleString();
  document.getElementById('total-guru').textContent = tGuru.toLocaleString();
  document.getElementById('total-siswa').textContent = tSiswa.toLocaleString();
}

// ---------- Filter & Legend ----------
function createFilterChips() {
  const fg = document.getElementById('filter-group');
  const cnt = {};
  allSchools.forEach(s => { cnt[s.JENJANG] = (cnt[s.JENJANG] || 0) + 1; });
  Object.keys(colors).forEach(j => {
    if (cnt[j]) {
      const chip = document.createElement('div');
      chip.className = 'filter-chip';
      chip.innerHTML = `<span class="color-indicator" style="background:${colors[j]}"></span>${j} (${cnt[j]})`;
      chip.onclick = () => toggleFilter(j, chip);
      fg.appendChild(chip);
    }
  });
}
function createLegend() {
  const li = document.getElementById('legend-items');
  const cnt = {};
  allSchools.forEach(s => { cnt[s.JENJANG] = (cnt[s.JENJANG] || 0) + 1; });
  Object.keys(colors).forEach(j => {
    if (cnt[j]) {
      const div = document.createElement('div');
      div.className = 'legend-item';
      div.innerHTML = `<span class="legend-color" style="background:${colors[j]}"></span>${j} (${cnt[j]})`;
      li.appendChild(div);
    }
  });
}
function toggleFilter(j, el) {
  activeFilters.has(j) ? activeFilters.delete(j) : activeFilters.add(j);
  el.classList.toggle('active');
  applyFilters();
}
function applyFilters() {
  let filtered = allSchools;
  if (activeFilters.size) filtered = allSchools.filter(s => activeFilters.has(s.JENJANG));
  markers.forEach(({ marker, data }) => {
    const vis = activeFilters.size === 0 || activeFilters.has(data.JENJANG);
    const faded = activeFilters.size && !activeFilters.has(data.JENJANG);
    marker.setIcon(createSchoolIcon(data.JENJANG, faded));
    vis ? markerCluster.addLayer(marker) : markerCluster.removeLayer(marker);
  });
  const tg = filtered.reduce((a, s) => a + (Number(s['JUMLAH GURU']) || 0), 0);
  const ts = filtered.reduce((a, s) => a + (Number(s['JUMLAH SISWA']) || 0), 0);
  updateStats(filtered.length, tg, ts);
}
document.getElementById('clear-filters').onclick = () => {
  activeFilters.clear();
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  applyFilters();
};

// ---------- Search ----------
const searchInput = document.getElementById('search-input');
const searchResult = document.getElementById('search-result');
searchInput.addEventListener('input', () => {
  const kw = searchInput.value.toLowerCase().trim();
  searchResult.innerHTML = '';
  if (!kw) return;

  const found = markers.filter(({ data }) =>
    data['NAMA SEKOLAHAN'].toLowerCase().includes(kw) ||
    String(data.NPSN || '').toLowerCase().includes(kw)
  );

  if (!found.length) {
    searchResult.innerHTML = '<p style="padding:12px;text-align:center;color:#6c757d">Tidak ada sekolah ditemukan</p>';
    return;
  }

  found.forEach(({ marker, data }) => {
    const btn = document.createElement('button');
    btn.className = 'search-item';

    const name = data['NAMA SEKOLAHAN'].replace(new RegExp(`(${kw})`, 'gi'), '<mark>$1</mark>');
    const npsn = String(data.NPSN || '').replace(new RegExp(`(${kw})`, 'gi'), '<mark>$1</mark>');

    btn.innerHTML = `
      <div style="display:flex;align-items:center">
        <span class="color-indicator" style="background:${colors[data.JENJANG]};margin-right:8px"></span>
        <div style="text-align:left">
          <div>${name}</div>
          <small style="color:#6c757d">NPSN: ${npsn} • ${data.JENJANG} • ${data['JUMLAH SISWA']} siswa</small>
        </div>
      </div>`;

    btn.onclick = () => {
      map.setView(marker.getLatLng(), 17);
      marker.openPopup();
      searchInput.value = '';
      searchResult.innerHTML = '';
      if (window.innerWidth <= 768) sidebar.classList.remove('mobile-open');
    };
    searchResult.appendChild(btn);
  });
});

// ---------- Sidebar ----------
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const isMobile = () => window.innerWidth <= 768;

// ✅ Fungsi tombol Kembali
const btnBack = document.getElementById('btn-back');
btnBack.addEventListener('click', () => {
  sidebar.classList.remove('mobile-open');
});

sidebarToggle.onclick = () => {
  isMobile() ? sidebar.classList.toggle('mobile-open') : sidebar.classList.toggle('collapsed');
};
window.addEventListener('resize', () => {
  if (!isMobile()) sidebar.classList.remove('mobile-open');
  map.invalidateSize();
});
map.on('click', () => { if (isMobile()) sidebar.classList.remove('mobile-open'); });

// ---------- Optional controls ----------
map.locate({ setView: false, maxZoom: 16 });
map.on('locationfound', e => {
  const radius = e.accuracy / 2;
  L.marker(e.latlng, {
    icon: L.divIcon({
      className: 'custom-div-icon',
      html: '<div style="width:20px;height:20px;border-radius:50%;background:#4285f4;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>',
      iconSize: [26, 26], iconAnchor: [13, 13]
    })
  }).addTo(map).bindPopup(`Anda berada dalam radius ${Math.round(radius)} meter dari titik ini`);
  L.circle(e.latlng, radius, { color: '#4285f4', fillColor: '#4285f4', fillOpacity: .1, weight: 2 }).addTo(map);
});

// ---------- Keyboard ----------
document.addEventListener('keydown', e => {
  if (e.key === 'f' && e.ctrlKey) { e.preventDefault(); searchInput.focus(); }
  if (e.key === 'Escape') {
    if (isMobile()) sidebar.classList.remove('mobile-open');
    searchInput.blur(); searchResult.innerHTML = ''; searchInput.value = '';
  }
});