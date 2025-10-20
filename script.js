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
let activeFilters = ne// ---------- Enhanced Icon Creation ----------
function createSchoolIcon(jenjang, isFiltered = false) {
  const color = colors[jenjang] || '#7f8c8d';
  const opacity = isFiltered ? 0.3 : 1;
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="school-marker" style="background-color:${color};opacity:${opacity};animation: pulse 2s infinite;"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}24, 24],
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
    m.bindTooltip(s['NAMA SEKO    m.bindPopup(`
      <div class="popup-content">
        <h4><i class="fas fa-school"></i> ${s['NAMA SEKOLAHAN']}</h4>
        <p><strong><i class="fas fa-id-card"></i> NPSN:</strong> ${s.NPSN || '-'}</p>
        <p><strong><i class="fas fa-graduation-cap"></i> Jenjang:</strong> <span style="color:${colors[s.JENJANG]};font-weight:700">${s.JENJANG}</span></p>
        <p><strong><i class="fas fa-map-marker-alt"></i> Alamat:</strong> ${s.ALAMAT || '-'}</p>
        <p><strong><i class="fas fa-chalkboard-teacher"></i> Guru:</strong> ${s['JUMLAH GURU']} orang</p>
        <p><strong><i class="fas fa-users"></i> Siswa:</strong> ${s['JUMLAH SISWA']} siswa</p>
      </div>`, {
      maxWidth: 280,
      className: 'custom-popup'
    });       <p><strong>Jumlah Siswa:</strong> ${s['JUMLAH SISWA']} siswa</p>
      </div>`);

    markerCluster.addLayer(m);
    markers.push({ marker: m, data: s });
    totalGuru += Number(s['JUMLAH GURU']) || 0;
    totalSiswa += Number(s['JUMLAH SISWA']) || 0;
  });

  map.addLayer(markerCluster);
  updateStats(data.length, totalGuru, totalSiswa);
  createFilterCh// ---------- Enhanced Stats with Animation ----------
function updateStats(tSekolah, tGuru, tSiswa) {
  animateNumber('total-sekolah', tSekolah);
  animateNumber('total-guru', tGuru);
  animateNumber('total-siswa', tSiswa);
}

function animateNumber(elementId, targetValue) {
  const element = document.getElementById(elementId);
  const startValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
  const duration = 1000;
  const startTime = performance.now();
  
  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutCubic);
    
    element.textContent = currentValue.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      element.textContent = targetValue.toLocaleString();
    }
  }
  
  requestAnimationFrame(updateNumber);
}LocaleString();
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
      div.innerHTML = `<sfunction toggleFilter(j, el) {
  const wasActive = activeFilters.has(j);
  activeFilters.has(j) ? activeFilters.delete(j) : activeFilters.add(j);
  el.classList.toggle('active');
  
  // Add ripple effect
  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  
  const ripple = document.createElement('span');
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.background = wasActive ? 'rgba(255,255,255,0.3)' : 'rgba(102,126,234,0.3)';
  ripple.style.transform = 'scale(0)';
  ripple.style.animation = 'ripple 0.6s linear';
  ripple.style.left = '50%';
  ripple.style.top = '50%';
  ripple.style.width = '20px';
  ripple.style.height = '20px';
  ripple.style.marginLeft = '-10px';
  ripple.style.marginTop = '-10px';
  
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
  
  applyFilters();
}) {
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
document.getElementById('clear-filters').onclic// ---------- Enhanced Search with Animations ----------
const searchInput = document.getElementById('search-input');
const searchResult = document.getElementById('search-result');
let searchTimeout;

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const kw = searchInput.value.toLowerCase().trim();
    searchResult.innerHTML = '';
    
    if (!kw) {
      searchResult.style.opacity = '0';
      setTimeout(() => searchResult.style.opacity = '1', 100);
      return;
    }

    const found = markers.filter(({ data }) =>
      data['NAMA SEKOLAHAN'].toLowerCase().includes(kw) ||
      String(data.NPSN || '').toLowerCase().includes(kw)
    );

    if (!found.length) {
      searchResult.innerHTML = `
        <div style="padding:20px;text-align:center;color:#64748b;background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border-radius:12px;margin:8px 0;">
          <i class="fas fa-search" style="font-size:24px;margin-bottom:8px;opacity:0.5;"></i>
          <p style="margin:0;font-weight:500;">Tidak ada sekolah ditemukan</p>
        </div>`;
      return;
    }

    found.forEach(({ marker, data }, index) => {
      const btn = document.createElement('button');
      btn.className = 'search-item';
      btn.style.animationDelay = `${index * 0.1}s`;
      btn.style.opacity = '0';
      btn.style.transform = 'translateY(10px)';

      const name = data['NAMA SEKOLAHAN'].replace(new RegExp(`(${kw})`, 'gi'), '<mark>$1</mark>');
      const npsn = String(data.NPSN || '').replace(new RegExp(`(${kw})`, 'gi'), '<mark>$1</mark>');

      btn.innerHTML = `
        <div style="display:flex;align-items:center">
          <span class="color-indicator" style="background:${colors[data.JENJANG]};margin-right:12px"></span>
          <div style="text-align:left;flex:1">
            <div style="font-weight:600;margin-bottom:4px;">${name}</div>
            <small style="color:#64748b;font-size:12px;">NPSN: ${npsn} • ${data.JENJANG} • ${data['JUMLAH SISWA']} siswa</small>
          </div>
          <i class="fas fa-arrow-right" style="color:#94a3b8;font-size:12px;"></i>
        </div>`;

      btn.onclick = () => {
        // Smooth animation to marker
        map.setView(marker.getLatLng(), 17, { animate: true, duration: 1 });
        setTimeout(() => marker.openPopup(), 500);
        searchInput.value = '';
        searchResult.innerHTML = '';
        if (window.innerWidth <= 768) sidebar.classList.remove('mobile-open');
      };
      
      searchResult.appendChild(btn);
      
      // Animate in
      setTimeout(() => {
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
      }, index * 50);
    });
  }, 300);
});   searchInput.value = '';
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

// ✅ Fungsi tombol Kemb// Enhanced sidebar toggle with haptic feedback
sidebarToggle.onclick = () => {
  if (isMobile()) {
    sidebar.classList.toggle('mobile-open');
    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } else {
    sidebar.classList.toggle('collapsed');
  }
};

// Enhanced window resize handling
window.addEventListener('resize', () => {
  if (!isMobile()) {
    sidebar.classList.remove('mobile-open');
  }
  map.invalidateSize();
});

// Enhanced map click handling
map.on('click', () => { 
  if (isMobile()) {
    sidebar.classList.remove('mobile-open');
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }
});

// Add swipe gesture support for mobile sidebar
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const swipeDistance = touchEndX - touchStartX;
  
  if (Math.abs(swipeDistance) > swipeThreshold) {
    if (swipeDistance > 0 && touchStartX < 50) {
      // Swipe right from left edge - open sidebar
      if (isMobile()) {
        sidebar.classList.add('mobile-open');
        if (navigator.vibrate) navigator.vibrate(50);
      }
    } else if (swipeDistance < 0 && sidebar.classList.contains('mobile-open')) {
      // Swipe left - close sidebar
      sidebar.classList.remove('mobile-open');
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }
}()) sidebar.classList.remove('mobile-open');
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
  }).addTo(map).bindPopup(`Anda berada dalam// ---------- Enhanced Keyboard Shortcuts ----------
document.addEventListener('keydown', e => {
  // Search focus
  if (e.key === 'f' && e.ctrlKey) { 
    e.preventDefault(); 
    searchInput.focus();
    searchInput.select();
  }
  
  // Escape key
  if (e.key === 'Escape') {
    if (isMobile()) sidebar.classList.remove('mobile-open');
    searchInput.blur(); 
    searchResult.innerHTML = ''; 
    searchInput.value = '';
  }
  
  // Toggle sidebar with Ctrl+B
  if (e.key === 'b' && e.ctrlKey) {
    e.preventDefault();
    sidebarToggle.click();
  }
  
  // Clear filters with Ctrl+R
  if (e.key === 'r' && e.ctrlKey) {
    e.preventDefault();
    document.getElementById('clear-filters').click();
  }
});

// Add tooltips for keyboard shortcuts
document.addEventListener('DOMContentLoaded', () => {
  searchInput.title = 'Tekan Ctrl+F untuk fokus pencarian';
  sidebarToggle.title = 'Tekan Ctrl+B untuk toggle sidebar';
  document.getElementById('clear-filters').title = 'Tekan Ctrl+R untuk hapus filter';
});); }
  if (e.key === 'Escape') {
    if (isMobile()) sidebar.classList.remove('mobile-open');
    searchInput.blur(); searchResult.innerHTML = ''; searchInput.value = '';
  }
});