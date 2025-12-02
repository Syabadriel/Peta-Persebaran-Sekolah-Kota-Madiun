// ---------- Map ----------
const map = L.map('map').setView([-7.6298, 111.5239], 13);

const baseLayers = {
  "🌍 OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 19
  }),
  "🛰️ Satelit Esri": L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri', maxZoom: 19
  }),
  "🗺️ CartoDB": L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap, © CartoDB', maxZoom: 19
  })
};
baseLayers["🌍 OpenStreetMap"].addTo(map);
L.control.layers(baseLayers, null, { collapsed: false }).addTo(map);

// ---------- Config ----------
const colors = { TK:'#f472b6', KB:'#a78bfa', PAUD:'#8e44ad', SD:'#e74c3c', SMP:'#0d47a1', PKBM:'#720e2b', SPS:'#f39c12', TPA:'#27ae60' };
let markers = [];
let markerCluster;
let activeFilters = new Set();
let allSchools = [];

// ---------- Icon ----------
function createSchoolIcon(jenjang, isFiltered=false) {
  const color = colors[jenjang] || '#7f8c8d';
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="school-marker" style="background-color:${color};opacity:${isFiltered?0.3:1};animation:pulse 2s infinite;"></div>`,
    iconSize: [28,28], iconAnchor: [14,14]
  });
}

// ---------- Cluster ----------
markerCluster = L.markerClusterGroup({
  chunkedLoading: true,
  maxClusterRadius: 50,
  iconCreateFunction(c){
    const childCount = c.getChildCount();
    let size = childCount<10?'small':childCount<100?'medium':'large';
    return L.divIcon({
      html:`<div><span>${childCount}</span></div>`,
      className:`marker-cluster marker-cluster-${size}`,
      iconSize:new L.Point(40,40)
    });
  }
});

// ---------- Boundary ----------
fetch('Batas_kota_madiun.geojson').then(r=>r.json()).then(geo=>{
  const outline = L.geoJSON(geo,{style:{color:'#000',weight:6,opacity:0.8,fillOpacity:0}});
  const inner = L.geoJSON(geo,{style:{color:'#ff0000',weight:2,opacity:1,fillOpacity:0}});
  map.addLayer(outline);
  map.addLayer(inner);
  map.fitBounds(inner.getBounds());
});

// ---------- Load School Data ----------
fetch('Data_Sekolah.json').then(r=>r.json()).then(loadSchoolData);

function loadSchoolData(data){
  allSchools = data;
  let totalGuru=0, totalSiswa=0;
  markerCluster.clearLayers();
  markers = [];

  data.forEach(s=>{
    const m = L.marker([s.LATITUDE,s.LONGITUDE],{icon:createSchoolIcon(s.JENJANG)});
    m.bindTooltip(s['NAMA SEKOLAHAN'],{direction:'top',offset:[0,-10],className:'school-label'});
    m.bindPopup(`
      <div class="popup-content">
        <h4><i class="fas fa-school"></i> ${s['NAMA SEKOLAHAN']}</h4>
        <p><strong><i class="fas fa-id-card"></i> NPSN:</strong> ${s.NPSN||'-'}</p>
        <p><strong><i class="fas fa-graduation-cap"></i> Jenjang:</strong> <span style="color:${colors[s.JENJANG]};font-weight:700">${s.JENJANG}</span></p>
        <p><strong><i class="fas fa-map-marker-alt"></i> Alamat:</strong> ${s.ALAMAT||'-'}</p>
        <p><strong><i class="fas fa-chalkboard-teacher"></i> Guru:</strong> ${s['JUMLAH GURU']} orang</p>
        <p><strong><i class="fas fa-users"></i> Siswa:</strong> ${s['JUMLAH SISWA']} siswa</p>
      </div>`, {maxWidth:280, className:'custom-popup'});

    markerCluster.addLayer(m);
    markers.push({marker:m,data:s});
    totalGuru+=Number(s['JUMLAH GURU'])||0;
    totalSiswa+=Number(s['JUMLAH SISWA'])||0;
  });

  map.addLayer(markerCluster);
  updateStats(data.length,totalGuru,totalSiswa);
  createFilterChips();
  createLegend();
  document.getElementById('loading').style.display='none';
}

// ---------- Stats ----------
function updateStats(tSekolah,tGuru,tSiswa){
  animateNumber('total-sekolah',tSekolah);
  animateNumber('total-guru',tGuru);
  animateNumber('total-siswa',tSiswa);
}
function animateNumber(id,target){
  const el=document.getElementById(id);
  const start=parseInt(el.textContent.replace(/,/g,''))||0;
  const duration=1000;
  const startTime=performance.now();
  function step(time){
    const progress=Math.min((time-startTime)/duration,1);
    const val=Math.floor(start+(target-start)* (1-Math.pow(1-progress,3)));
    el.textContent=val.toLocaleString();
    if(progress<1) requestAnimationFrame(step);
    else el.textContent=target.toLocaleString();
  }
  requestAnimationFrame(step);
}

// ---------- Filter & Legend ----------
function createFilterChips(){
  const fg=document.getElementById('filter-group');
  const cnt={};
  allSchools.forEach(s=>{cnt[s.JENJANG]=(cnt[s.JENJANG]||0)+1;});
  Object.keys(colors).forEach(j=>{
    if(cnt[j]){
      const chip=document.createElement('div');
      chip.className='filter-chip';
      chip.innerHTML=`<span class="color-indicator" style="background:${colors[j]}"></span>${j} (${cnt[j]})`;
      chip.onclick=()=>toggleFilter(j,chip);
      fg.appendChild(chip);
    }
  });
}
function createLegend(){
  const li=document.getElementById('legend-items');
  const cnt={};
  allSchools.forEach(s=>{cnt[s.JENJANG]=(cnt[s.JENJANG]||0)+1;});
  Object.keys(colors).forEach(j=>{
    if(cnt[j]){
      const div=document.createElement('div');
      div.className='legend-item';
      div.innerHTML=`<span class="legend-color" style="background:${colors[j]}"></span>${j} (${cnt[j]})`;
      li.appendChild(div);
    }
  });
}
function toggleFilter(j,el){
  const wasActive=activeFilters.has(j);
  activeFilters.has(j)?activeFilters.delete(j):activeFilters.add(j);
  el.classList.toggle('active');
  // ripple effect
  el.style.position='relative'; el.style.overflow='hidden';
  const ripple=document.createElement('span');
  ripple.style.position='absolute';
  ripple.style.borderRadius='50%';
  ripple.style.background=wasActive?'rgba(255,255,255,0.3)':'rgba(102,126,234,0.3)';
  ripple.style.transform='scale(0)';
  ripple.style.animation='ripple 0.6s linear';
  ripple.style.left='50%'; ripple.style.top='50%';
  ripple.style.width='20px'; ripple.style.height='20px';
  ripple.style.marginLeft='-10px'; ripple.style.marginTop='-10px';
  el.appendChild(ripple); setTimeout(()=>ripple.remove(),600);
  applyFilters();
}
function applyFilters(){
  let filtered=allSchools;
  if(activeFilters.size) filtered=allSchools.filter(s=>activeFilters.has(s.JENJANG));
  markers.forEach(({marker,data})=>{
    const vis=activeFilters.size===0||activeFilters.has(data.JENJANG);
    const faded=activeFilters.size && !activeFilters.has(data.JENJANG);
    marker.setIcon(createSchoolIcon(data.JENJANG,faded));
    vis?markerCluster.addLayer(marker):markerCluster.removeLayer(marker);
  });
  const tg=filtered.reduce((a,s)=>a+(Number(s['JUMLAH GURU'])||0),0);
  const ts=filtered.reduce((a,s)=>a+(Number(s['JUMLAH SISWA'])||0),0);
  updateStats(filtered.length,tg,ts);
}
document.getElementById('clear-filters').onclick=()=>{
  activeFilters.clear();
  document.querySelectorAll('.filter-chip').forEach(c=>c.classList.remove('active'));
  applyFilters();
};

// ---------- Search ----------
const searchInput=document.getElementById('search-input');
const searchResult=document.getElementById('search-result');
let searchTimeout;
searchInput.addEventListener('input',()=>{
  clearTimeout(searchTimeout);
  searchTimeout=setTimeout(()=>{
    const kw=searchInput.value.toLowerCase().trim();
    searchResult.innerHTML='';
    if(!kw){searchResult.style.opacity='0';setTimeout(()=>searchResult.style.opacity='1',100);return;}
    const found=markers.filter(({data})=>data['NAMA SEKOLAHAN'].toLowerCase().includes(kw) || String(data.NPSN||'').toLowerCase().includes(kw));
    if(!found.length){
      searchResult.innerHTML=`<div style="padding:20px;text-align:center;color:#64748b;background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border-radius:12px;margin:8px 0;">
        <i class="fas fa-search" style="font-size:24px;margin-bottom:8px;opacity:0.5;"></i>
        <p style="margin:0;font-weight:500;">Tidak ada sekolah ditemukan</p>
      </div>`;
      return;
    }
    found.forEach(({marker,data},i)=>{
      const btn=document.createElement('button');
      btn.className='search-item';
      btn.style.animationDelay=`${i*0.1}s`; btn.style.opacity='0'; btn.style.transform='translateY(10px)';
      const name=data['NAMA SEKOLAHAN'].replace(new RegExp(`(${kw})`,'gi'),'<mark>$1</mark>');
      const npsn=String(data.NPSN||'').replace(new RegExp(`(${kw})`,'gi'),'<mark>$1</mark>');
      btn.innerHTML=`<div style="display:flex;align-items:center">
        <span class="color-indicator" style="background:${colors[data.JENJANG]};margin-right:12px"></span>
        <div style="text-align:left;flex:1">
          <div style="font-weight:600;margin-bottom:4px;">${name}</div>
          <small style="color:#64748b;font-size:12px;">NPSN: ${npsn} • ${data.JENJANG} • ${data['JUMLAH SISWA']} siswa</small>
        </div>
        <i class="fas fa-arrow-right" style="color:#94a3b8;font-size:12px;"></i>
      </div>`;
      btn.onclick=()=>{
        map.setView(marker.getLatLng(),17,{animate:true,duration:1});
        setTimeout(()=>marker.openPopup(),500);
        searchInput.value=''; searchResult.innerHTML='';
        if(window.innerWidth<=768) sidebar.classList.remove('mobile-open');
      };
      searchResult.appendChild(btn);
      setTimeout(()=>{btn.style.opacity='1';btn.style.transform='translateY(0)';},i*50);
    });
  },300);
});

// ---------- Sidebar ----------
const sidebar=document.getElementById('sidebar');
const sidebarToggle=document.getElementById('sidebar-toggle');
const isMobile=()=>window.innerWidth<=768;
const btnBack=document.getElementById('btn-back');
btnBack.addEventListener('click',()=>sidebar.classList.remove('mobile-open'));

// Sidebar toggle
sidebarToggle.onclick=()=>{
  if(isMobile()){sidebar.classList.toggle('mobile-open'); if(navigator.vibrate) navigator.vibrate(50);}
  else sidebar.classList.toggle('collapsed');
};
window.addEventListener('resize',()=>{
  if(!isMobile()) sidebar.classList.remove('mobile-open');
  map.invalidateSize();
});
map.on('click',()=>{if(isMobile()){sidebar.classList.remove('mobile-open');if(navigator.vibrate) navigator.vibrate(30);}});

// Swipe support
let touchStartX=0, touchEndX=0;
document.addEventListener('touchstart',e=>touchStartX=e.changedTouches[0].screenX);
document.addEventListener('touchend',e=>{touchEndX=e.changedTouches[0].screenX; handleSwipe();});
function handleSwipe(){
  const d=touchEndX-touchStartX, t=50;
  if(Math.abs(d)>t){
    if(d>0 && touchStartX<50 && isMobile()){sidebar.classList.add('mobile-open'); if(navigator.vibrate) navigator.vibrate(50);}
    else if(d<0 && sidebar.classList.contains('mobile-open')){sidebar.classList.remove('mobile-open'); if(navigator.vibrate) navigator.vibrate(30);}
  }
}

// ---------- Optional controls ----------
map.locate({setView:false,maxZoom:16});
map.on('locationfound',e=>{
  const radius=e.accuracy/2;
  L.marker(e.latlng,{
    icon:L.divIcon({
      className:'custom-div-icon',
      html:'<div style="width:20px;height:20px;border-radius:50%;background:#4285f4;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>',
      iconSize:[26,26],iconAnchor:[13,13]
    })
  }).addTo(map).bindPopup(`Anda berada dalam radius ${Math.round(radius)} meter dari titik ini`);
  L.circle(e.latlng,radius,{color:'#4285f4',fillColor:'#4285f4',fillOpacity:0.1,weight:2}).addTo(map);
});

// ---------- Keyboard shortcuts ----------
document.addEventListener('keydown',e=>{
  if(e.key==='f'&&e.ctrlKey){e.preventDefault(); searchInput.focus(); searchInput.select();}
  if(e.key==='Escape'){if(isMobile()) sidebar.classList.remove('mobile-open'); searchInput.blur(); searchResult.innerHTML=''; searchInput.value='';}
  if(e.key==='b'&&e.ctrlKey){e.preventDefault(); sidebarToggle.click();}
  if(e.key==='r'&&e.ctrlKey){e.preventDefault(); document.getElementById('clear-filters').click();}
});
document.addEventListener('DOMContentLoaded',()=>{
  searchInput.title='Tekan Ctrl+F untuk fokus pencarian';
  sidebarToggle.title='Tekan Ctrl+B untuk toggle sidebar';
  document.getElementById('clear-filters').title='Tekan Ctrl+R untuk hapus filter';
});


