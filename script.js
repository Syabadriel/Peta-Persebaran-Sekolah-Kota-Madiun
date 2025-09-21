// === Inisialisasi map ===
const map = L.map('map').setView([-7.6298, 111.5239], 13);

// === Basemap ===
const baseLayers = {
  "🌍 OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }),

  "🛰️ Satelit Esri": L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri',
    maxZoom: 19
  })
};

// Tambahkan default layer (OSM)
baseLayers["🌍 OpenStreetMap"].addTo(map);

// === Control untuk ganti basemap ===
L.control.layers(baseLayers, null, { collapsed: false }).addTo(map);

// === Warna marker per jenjang ===
const colors = {
  'TK': '#9b59b6',
  'KB': '#8e44ad',
  'PAUD': '#6c5ce7',
  'SD': '#e74c3c',
  'SMP': '#3498db',
  'PKBM': '#1abc9c',
  'SPS': '#f39c12',
  'TPA': '#2ecc71'
};

function createSchoolIcon(jenjang) {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      width: 20px; height: 20px;
      border-radius: 50%;
      background-color: ${colors[jenjang] || '#7f8c8d'};
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
}

// === Tambahkan GeoJSON batas Kota Madiun ===
// === Tambahkan GeoJSON batas Kota Madiun ===
fetch("Batas_kota_madiun.geojson")
  .then(res => res.json())
  .then(geojsonData => {
    // Outline tebal (kontras di background terang)
    const batasOutline = L.geoJSON(geojsonData, {
      style: {
        color: "#ffff00",   // kuning terang
        weight: 6,
        opacity: 0.8
      }
    }).addTo(map);

    // Inner line tipis (kontras di background gelap)
    const batasInner = L.geoJSON(geojsonData, {
      style: {
        color: "#ff0000",   // merah
        weight: 2,
        opacity: 1
      }
    }).addTo(map);

    // Fit ke batas
    map.fitBounds(batasInner.getBounds());
  })
  .catch(err => console.error("Gagal load GeoJSON batas:", err));


let markers = []; // simpan semua marker

// === Load data sekolah ===
fetch("Data_Sekolah.json")
  .then(res => res.json())
  .then(data => {
    let totalGuru = 0, totalSiswa = 0;

    data.forEach(sekolah => {
      const marker = L.marker([sekolah.LATITUDE, sekolah.LONGITUDE], {
        icon: createSchoolIcon(sekolah.JENJANG)
      }).addTo(map);

      marker.bindTooltip(sekolah["NAMA SEKOLAHAN"], {
        permanent: true,
        direction: "top",
        offset: [0, -10],
        className: "school-label"
      });

      const popupContent = `
        <div class="popup-content">
          <h4>${sekolah["NAMA SEKOLAHAN"]}</h4>
          <p><strong>Jenjang:</strong> ${sekolah.JENJANG}</p>
          <p><strong>Jumlah Guru:</strong> ${sekolah["JUMLAH GURU"]} orang</p>
          <p><strong>Jumlah Siswa:</strong> ${sekolah["JUMLAH SISWA"]} siswa</p>
        </div>
      `;
      marker.bindPopup(popupContent);

      markers.push({ marker, data: sekolah });

      totalGuru += Number(sekolah["JUMLAH GURU"]) || 0;
      totalSiswa += Number(sekolah["JUMLAH SISWA"]) || 0;
    });

    document.getElementById('total-sekolah').textContent = data.length;
    document.getElementById('total-guru').textContent = totalGuru.toLocaleString();
    document.getElementById('total-siswa').textContent = totalSiswa.toLocaleString();
  })
  .catch(err => console.error("Gagal load JSON sekolah:", err));

// === Fitur search sekolah ===
// === Fitur search sekolah dengan list hasil ===
// === Fitur search sekolah dengan list hasil ===
const searchInput = document.getElementById("search-input");
const searchResult = document.getElementById("search-result"); // <div> buat nampung list hasil

searchInput.addEventListener("keyup", function(e) {
  const keyword = searchInput.value.toLowerCase().trim();

  // kalau input kosong → kosongkan hasil & keluar
  if (!keyword) {
    searchResult.innerHTML = "";
    return;
  }

  if (e.key === "Enter") {
    // cari semua sekolah yang namanya mengandung keyword
    const found = markers.filter(item =>
      item.data["NAMA SEKOLAHAN"].toLowerCase().includes(keyword)
    );

    searchResult.innerHTML = ""; // bersihkan hasil lama

    if (found.length === 0) {
      searchResult.innerHTML = "<p>Tidak ada sekolah ditemukan</p>";
    } else {
      found.forEach(item => {
        const btn = document.createElement("button");
        btn.textContent = item.data["NAMA SEKOLAHAN"];
        btn.className = "search-item";
        btn.onclick = () => {
          map.setView(item.marker.getLatLng(), 17);
          item.marker.openPopup();
        };
        searchResult.appendChild(btn);
      });
    }
  }
});

