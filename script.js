// Inisialisasi Map
const map = L.map('map').setView([-7.6298, 111.5239], 13);

// Basemap
const baseLayers = {
  "🌍 OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }),
  "🛰️ Satelit Esri": L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles © Esri', maxZoom: 19 }
  )
};
baseLayers["🌍 OpenStreetMap"].addTo(map);
L.control.layers(baseLayers, null, { collapsed: false }).addTo(map);

// Warna Marker
const colors = {
  'TK': '#9b59b6','KB': '#8e44ad','PAUD': '#6c5ce7','SD': '#e74c3c',
  'SMP': '#3498db','PKBM': '#1abc9c','SPS': '#f39c12','TPA': '#2ecc71'
};

function createSchoolIcon(jenjang) {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:${colors[jenjang] || '#7f8c8d'};
      border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [26,26], iconAnchor: [13,13]
  });
}

let batasOutline, batasInner;

// Batas Kota
fetch("Batas_kota_madiun.geojson")
  .then(res => res.json())
  .then(geojsonData => {
    batasOutline = L.geoJSON(geojsonData, { style: { color:"#000", weight:6, opacity:0.7 } }).addTo(map);
    batasInner = L.geoJSON(geojsonData, { style: { color:"#ff0000", weight:2, opacity:1 } }).addTo(map);
    map.fitBounds(batasInner.getBounds());
  });

// Marker Sekolah
let markers = [];
fetch("Data_Sekolah.json")
  .then(res => res.json())
  .then(data => {
    let totalGuru=0, totalSiswa=0;
    data.forEach(sekolah=>{
      const marker = L.marker([sekolah.LATITUDE, sekolah.LONGITUDE], {
        icon: createSchoolIcon(sekolah.JENJANG)
      }).addTo(map);

      marker.bindTooltip(sekolah["NAMA SEKOLAHAN"], {
        permanent:true,direction:"top",offset:[0,-10],className:"school-label"
      });

      marker.bindPopup(`
        <div class="popup-content">
          <h4>${sekolah["NAMA SEKOLAHAN"]}</h4>
          <p><strong>Jenjang:</strong> ${sekolah.JENJANG}</p>
          <p><strong>Guru:</strong> ${sekolah["JUMLAH GURU"]} orang</p>
          <p><strong>Siswa:</strong> ${sekolah["JUMLAH SISWA"]} siswa</p>
        </div>`);

      markers.push({marker, data:sekolah});
      totalGuru += Number(sekolah["JUMLAH GURU"])||0;
      totalSiswa += Number(sekolah["JUMLAH SISWA"])||0;
    });
    document.getElementById('total-sekolah').textContent = data.length;
    document.getElementById('total-guru').textContent = totalGuru.toLocaleString();
    document.getElementById('total-siswa').textContent = totalSiswa.toLocaleString();
  });

// Search Sekolah (Live)
const searchInput=document.getElementById("search-input");
const searchResult=document.getElementById("search-result");
searchInput.addEventListener("input",()=>{
  const keyword=searchInput.value.toLowerCase().trim();
  searchResult.innerHTML="";
  if(!keyword){ map.closePopup(); return; }
  const found=markers.filter(i=>i.data["NAMA SEKOLAHAN"].toLowerCase().includes(keyword));
  if(found.length===0){ searchResult.innerHTML="<p>Tidak ada sekolah ditemukan</p>"; }
  else {
    found.forEach(item=>{
      const btn=document.createElement("button");
      btn.innerHTML=item.data["NAMA SEKOLAHAN"].replace(
        new RegExp(`(${keyword})`,"gi"),"<mark>$1</mark>"
      );
      btn.className="search-item";
      btn.onclick=()=>{ map.setView(item.marker.getLatLng(),17); item.marker.openPopup(); };
      searchResult.appendChild(btn);
    });
  }
});

// Ubah warna batas sesuai basemap
map.on('baselayerchange',function(e){
  if(e.name==="🌍 OpenStreetMap"){ batasOutline.setStyle({color:"#000"}); }
  else { batasOutline.setStyle({color:"#ffff00"}); }
});
