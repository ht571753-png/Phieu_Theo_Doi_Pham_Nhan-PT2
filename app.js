// ==========================================
// 1. ĐĂNG KÝ SERVICE WORKER CHẠY OFFLINE
// ==========================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => {
    console.log('SW register failed: ', err);
  });
}

// ==========================================
// 2. KHỞI TẠO CƠ SỞ DỮ LIỆU INDEXEDDB TRÊN MÁY
// ==========================================
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

request.onerror = (e) => {
  console.error('Lỗi khởi tạo IndexedDB:', e.target.error);
};

// ==========================================
// 3. ĐIỀU HƯỚNG TAB NHẬP LIỆU
// ==========================================
function switchTab(index) {
  document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === index);
  });
  document.querySelectorAll('.tab-content').forEach((tab, idx) => {
    tab.classList.toggle('active', idx === index);
  });
}

// ==========================================
// 4. QUẢN LÝ GIAO DIỆN FORM & DANH SÁCH
// ==========================================
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

// ==========================================
// 5. LƯU DỮ LIỆU VÀO BỘ NHỚ MÁY
// ==========================================
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

// ==========================================
// 6. TẢI DANH SÁCH & TÌM KIẾM
// ==========================================
function loadPrisoners(query = '') {
  const container = document.getElementById('prisonerList');
  container.innerHTML = '';
  const tx = db.transaction('pham_nhan', 'readonly');
  const store = tx.objectStore('pham_nhan');
  
  store.openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      const p = cursor.value;
      const q = query.toLowerCase().trim();
      const match = !q || 
        (p.ho_ten && p.ho_ten.toLowerCase().includes(q)) || 
        (p.shspn && p.shspn.toLowerCase().includes(q)) ||
        (p.so_cccd && p.so_cccd.includes(q));

      if (match) {
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = `
          <div>
            <strong>${p.ho_ten}</strong> (SHS: ${p.shspn || '---'})<br>
            <small>Tội danh: ${p.toi_danh || 'Chưa rõ'} | Ngày sinh: ${p.ngay_sinh || '---'}</small>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" onclick="exportWord(${p.id})">Xuất Word</button>
            <button type="button" onclick="openForm(${p.id})">Sửa</button>
            <button type="button" class="btn-danger" onclick="deletePrisoner(${p.id})">Xóa</button>
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

// ==========================================
// 7. XUẤT FILE WORD TƯƠNG THÍCH MẪU ${tên_biến}
// ==========================================
async function exportWord(id) {
  const tx = db.transaction('pham_nhan', 'readonly');
  tx.objectStore('pham_nhan').get(id).onsuccess = async (e) => {
    const data = e.target.result;
    if (!data) {
      alert('Không tìm thấy dữ liệu!');
      return;
    }

    try {
      // Tải file template.docx
      const response = await fetch('./template.docx');
      if (!response.ok) {
        throw new Error('Không tìm thấy file template.docx trên hệ thống.');
      }
      const content = await response.arrayBuffer();

      const zip = new PizZip(content);
      
      // Cấu hình delimiters nhận diện đúng cú pháp ${...}
      const doc = new window.docxtemplater(zip, {
        delimiters: { start: '${', end: '}' },
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: function() {
          return ""; // Ô trống sẽ để khoảng trắng, không bao giờ hiện undefined
        }
      });

      // Khớp chính xác toàn bộ danh sách biến trong file template.docx
      doc.render({
        // Trang bìa
        ho_ten_bia: data.ho_ten || '',
        ngay_sinh_bia: data.ngay_sinh || '',
        dktt_bia: data.thuong_tru || '',
        toi_danh_bia: data.toi_danh || '',
        ngay_bat_bia: data.ngay_bat || '',
        an_phat_bia: data.an_phat || '',
        tu_ngay: '......',
        tu_thang: '......',
        tu_nam: '20...',
        den_ngay: '......',
        den_thang: '......',
        den_nam: '20...',

        // Mục I: Sơ lược lý lịch
        shspn: data.shspn || '',
        ho_ten: data.ho_ten || '',
        ho_ten_khac: data.ho_ten_khac || '',
        que_quan: data.que_quan || '',
        thuong_tru: data.thuong_tru || '',
        cccd: data.so_cccd || '',
        ngay_cap_cccd: data.ngay_cap_cccd || '',
        noi_cap_cccd: data.noi_cap_cccd || '',
        dan_toc: data.dan_toc || 'Kinh',
        quoc_tich: data.quoc_tich || 'Việt Nam',
        ton_giao: data.ton_giao || 'Không',
        hoc_van: data.hoc_van || '',
        toi_danh: data.toi_danh || '',
        ngay_bat: data.ngay_bat || '',
        an_phat: data.an_phat || '',
        ngay_den_trai: data.ngay_den_trai || '',
        so_ban_an: data.so_ban_an || '',
        ngay_ban_an: data.ngay_ban_an || '',
        toaan_ban_an: data.toaan_ban_an || '',
        so_tha: data.so_tha || '',
        ngay_tha: data.ngay_tha || '',
        toaan_tha: data.toaan_tha || '',
        tg_tam_giu_giam: data.tg_tam_giu_giam || '',
        pham_toi_khi_tam_giam: data.pham_toi_khi_tam_giam || '',
        tg_chua_benh_bat_buoc: data.tg_chua_benh_bat_buoc || '',
        bo_tron_chua_benh: data.bo_tron_chua_benh || '',
        tien_an: data.tien_an || 'Không',
        tien_su: data.tien_su || 'Không',
        tien_su_ma_tuy: data.tien_su_ma_tuy || 'Không',
        tien_su_benh_tat: data.tien_su_benh_tat || 'Bình thường',
        tron_trai_giam: data.tron_trai_giam || 'Không',
        bat_lai_dau_thu: data.bat_lai_dau_thu || '',

        // Nghĩa vụ tài chính / Án phí
        phat_tien: data.phat_tien || '',
        phat_tien_da_th: data.phat_tien_da_th || '',
        phat_tien_chua_th: data.phat_tien_chua_th || '',
        bt_thiet_hai: data.bt_thiet_hai || '',
        bt_da_th: data.bt_da_th || '',
        bt_chua_th: data.bt_chua_th || '',
        tra_tai_san: data.tra_tai_san || '',
        tra_ts_da_th: data.tra_ts_da_th || '',
        tra_ts_chua_th: data.tra_ts_chua_th || '',
        an_phi_hs: data.an_phi_hs || '',
        aphs_da_th: data.aphs_da_th || '',
        aphs_chua_th: data.aphs_chua_th || '',
        an_phi_ds: data.an_phi_ds || '',
        apds_da_th: data.apds_da_th || '',
        apds_chua_th: data.apds_chua_th || '',
        hpbs_khac: data.hpbs_khac || '',

        // Mục II: Hành vi phạm tội
        tom_tat_hanh_vi_pham_toi: data.hanh_vi || '',

        // Mục III: Gia đình
        ho_ten_bo: data.thong_tin_bo || '',
        nam_sinh_bo: '',
        nguyen_quan_bo: '',
        dktt_bo: '',
        cho_o_bo: '',
        nghe_nghiep_bo: '',

        ho_ten_me: data.thong_tin_me || '',
        nam_sinh_me: '',
        nguyen_quan_me: '',
        dktt_me: '',
        cho_o_me: '',
        nghe_nghiep_me: '',

        ho_ten_vo_chong: data.thong_tin_vo_chong || '',
        nam_sinh_vo_chong: '',
        nguyen_quan_vo_chong: '',
        dktt_vo_chong: '',
        cho_o_vo_chong: '',
        nghe_nghiep_vo_chong: '',

        thong_tin_cac_con: data.con_va_anh_em || '',
        anh_chi_em_ruot: '',
        bo_me_con_nuoi: '',

        // Mục IV & V: Quan hệ xã hội & Quá trình chấp hành án
        quan_he_xa_hoi: '',
        tam_dinh_chi: '',
        tha_tu_tthcdk: '',
        pham_toi_moi: 'Không',
        phan_loai_quan_che: '',
        trich_xuat: 'Không',
        chuyen_doi_phan_trai: '',
        nhan_xet_can_bo: data.nhan_xet_can_bo || '',
        thong_tin_khac: data.khen_thuong_ky_luat || ''
      });

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const cleanName = (data.ho_ten || 'PhamNhan').replace(/[^a-zA-Z0-9\s]/g, '').trim();
      saveAs(out, `PT78BH_${data.shspn || 'HS'}_${cleanName}.docx`);

    } catch (err) {
      console.error(err);
      alert('Lỗi xuất file Word: ' + err.message);
    }
  };
}

// ==========================================
// 8. SAO LƯU DỮ LIỆU RA FILE JSON CỤC BỘ
// ==========================================
function exportBackupData() {
  const tx = db.transaction('pham_nhan', 'readonly');
  const allData = [];
  tx.objectStore('pham_nhan').openCursor().onsuccess = (e) => {
    const cursor = e.target.result;
    if (cursor) {
      allData.push(cursor.value);
      cursor.continue();
    } else {
      if (allData.length === 0) {
        alert('Chưa có dữ liệu nào để sao lưu!');
        return;
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      saveAs(blob, `SaoLuu_PhamNhan_${new Date().toISOString().slice(0,10)}.json`);
    }
  };
}
