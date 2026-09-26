// Đăng ký Service Worker chạy Offline
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// 1. Khởi tạo Cơ sở dữ liệu IndexedDB trên máy
let db;
const request = indexedDB.open('QLPhamNhanDB', 1);

request.onupgradeneeded = (e) => {
  db = e.target.result;
  const store = db.createObjectStore('pham_nhan', { keyPath: 'id', autoIncrement: true });
  store.createIndex('ho_ten', 'ho_ten', { unique: false });
  store.createIndex('shspn', 'shspn', { unique: false });
};

request.onsuccess = (e) => {
  db = e.target.result;
  loadPrisoners();
};

// 2. Chuyển tab nhập liệu
function switchTab(index) {
  document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === index);
  });
  document.querySelectorAll('.tab-content').forEach((tab, idx) => {
    tab.classList.toggle('active', idx === index);
  });
}

// 3. Quản lý Form & Hiển thị
function openForm(id = null) {
  document.getElementById('listSection').style.display = 'none';
  document.getElementById('formSection').style.display = 'block';
  document.getElementById('recordForm').reset();
  document.getElementById('recordId').value = '';
  switchTab(0);

  if (id) {
    const tx = db.transaction('pham_nhan', 'readonly');
    const store = tx.objectStore('pham_nhan');
    store.get(id).onsuccess = (e) => {
      const data = e.target.result;
      if (data) {
        document.getElementById('recordId').value = data.id;
        for (const key in data) {
          if (document.getElementById(key)) {
            document.getElementById(key).value = data[key] || '';
          }
        }
      }
    };
  }
}

function closeForm() {
  document.getElementById('listSection').style.display = 'block';
  document.getElementById('formSection').style.display = 'none';
}

// 4. Lưu hồ sơ vào IndexedDB
document.getElementById('recordForm').onsubmit = (e) => {
  e.preventDefault();
  const idVal = document.getElementById('recordId').value;
  const prisoner = {
    shspn: document.getElementById('shspn').value,
    ho_ten: document.getElementById('ho_ten').value,
    ngay_sinh: document.getElementById('ngay_sinh').value,
    so_cccd: document.getElementById('so_cccd').value,
    que_quan: document.getElementById('que_quan').value,
    thuong_tru: document.getElementById('thuong_tru').value,
    toi_danh: document.getElementById('toi_danh').value,
    an_phat: document.getElementById('an_phat').value,
    ngay_bat: document.getElementById('ngay_bat').value,
    ngay_den_trai: document.getElementById('ngay_den_trai').value,
    hanh_vi: document.getElementById('hanh_vi').value,
    nghia_vu_dan_su: document.getElementById('nghia_vu_dan_su').value,
    thong_tin_bo: document.getElementById('thong_tin_bo').value,
    thong_tin_me: document.getElementById('thong_tin_me').value,
    thong_tin_vo_chong: document.getElementById('thong_tin_vo_chong').value,
    con_va_anh_em: document.getElementById('con_va_anh_em').value,
    nhan_xet_can_bo: document.getElementById('nhan_xet_can_bo').value,
    khen_thuong_ky_luat: document.getElementById('khen_thuong_ky_luat').value,
    updated_at: new Date().toISOString()
  };

  const tx = db.transaction('pham_nhan', 'readwrite');
  const store = tx.objectStore('pham_nhan');
  if (idVal) {
    prisoner.id = parseInt(idVal);
    store.put(prisoner);
  } else {
    store.add(prisoner);
  }

  tx.oncomplete = () => {
    alert('Đã lưu hồ sơ thành công vào bộ nhớ máy!');
    closeForm();
    loadPrisoners();
  };
};

// 5. Tải danh sách & Tìm kiếm
function loadPrisoners(query = '') {
  const container = document.getElementById('prisonerList');
  container.innerHTML = '';
  const tx = db.transaction('pham_nhan', 'readonly');
  const store = tx.objectStore('pham_nhan');
  
  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const p = cursor.value;
      const searchMatch = !query || 
        p.ho_ten.toLowerCase().includes(query.toLowerCase()) || 
        p.shspn.toLowerCase().includes(query.toLowerCase()) ||
        (p.so_cccd && p.so_cccd.includes(query));

      if (searchMatch) {
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = `
          <div>
            <strong>${p.ho_ten}</strong> (SHS: ${p.shspn})<br>
            <small>Tội danh: ${p.toi_danh || 'Chưa rõ'} | Ngày sinh: ${p.ngay_sinh || '---'}</small>
          </div>
          <div style="display:flex; gap:6px;">
            <button onclick="exportWord(${p.id})">Xuất Word</button>
            <button onclick="openForm(${p.id})">Sửa</button>
            <button class="btn-danger" onclick="deletePrisoner(${p.id})">Xóa</button>
          </div>
        `;
        container.appendChild(item);
      }
      cursor.continue();
    }
  };
}

function searchData() {
  const query = document.getElementById('searchInput').value;
  loadPrisoners(query);
}

function deletePrisoner(id) {
  if (confirm('Bạn chắc chắn muốn xóa hồ sơ này khỏi máy?')) {
    const tx = db.transaction('pham_nhan', 'readwrite');
    tx.objectStore('pham_nhan').delete(id);
    tx.oncomplete = () => loadPrisoners();
  }
}

// 6. XUẤT FILE WORD TỰ ĐỘNG CHUẨN MẪU PT78BH
async function exportWord(id) {
  const tx = db.transaction('pham_nhan', 'readonly');
  tx.objectStore('pham_nhan').get(id).onsuccess = async (e) => {
    const data = e.target.result;
    if (!data) return;

    try {
      // Đọc file template.docx lưu sẵn trong app
      const response = await fetch('./template.docx');
      const content = await response.arrayBuffer();

      const zip = new PizZip(content);
      const doc = new window.docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      // Đưa dữ liệu vào template
      doc.render({
        shspn: data.shspn || '',
        ho_ten: data.ho_ten || '',
        ngay_sinh: data.ngay_sinh || '',
        so_cccd: data.so_cccd || '',
        que_quan: data.que_quan || '',
        thuong_tru: data.thuong_tru || '',
        toi_danh: data.toi_danh || '',
        an_phat: data.an_phat || '',
        ngay_bat: data.ngay_bat || '',
        ngay_den_trai: data.ngay_den_trai || '',
        hanh_vi: data.hanh_vi || '',
        nghia_vu_dan_su: data.nghia_vu_dan_su || '',
        thong_tin_bo: data.thong_tin_bo || '',
        thong_tin_me: data.thong_tin_me || '',
        thong_tin_vo_chong: data.thong_tin_vo_chong || '',
        con_va_anh_em: data.con_va_anh_em || '',
        nhan_xet_can_bo: data.nhan_xet_can_bo || '',
        khen_thuong_ky_luat: data.khen_thuong_ky_luat || ''
      });

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      // Tải trực tiếp file Word về điện thoại
      saveAs(out, `PT78BH_${data.shspn}_${data.ho_ten}.docx`);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xuất file Word: Kiểm tra lại file template.docx');
    }
  };
}

// 7. Chức năng sao lưu toàn bộ dữ liệu ra file JSON
function exportBackupData() {
  const tx = db.transaction('pham_nhan', 'readonly');
  const allData = [];
  tx.objectStore('pham_nhan').openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      allData.push(cursor.value);
      cursor.continue();
    } else {
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      saveAs(blob, `SaoLuu_PhamNhan_${new Date().toISOString().slice(0,10)}.json`);
    }
  };
}
