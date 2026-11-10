// ============================================
// SCRIPT.JS - Website Penyewaan Ruang Karaoke "Aura Karaoke" (versi 4)
// Isi file ini hanya LOGIKA. Tampilan (navbar, form, kerangka tabel) ada di file .html pada folder Code/.
// Setiap halaman memanggil satu fungsi init...() di bagian bawah file HTML-nya.
//
//   BAGIAN 1  inti: konstanta, data, sesi login, aturan jadwal, promo
//   BAGIAN 2  pembantu tampilan: modal, kartu ruangan, kisi jam, bilah atas, penjaga halaman
//   BAGIAN 3  halaman publik   : index, pilih, login, admin-login, daftar, ruangan, detail-ruangan
//   BAGIAN 4  situs pelanggan  : dashboard, pesan-ruangan, bayar, riwayat, detail-pemesanan
//   BAGIAN 5  panel admin      : admin-dashboard, admin-ruangan, admin-pemesanan, admin-verifikasi, admin-verifikasi-detail
//
// Data disimpan di localStorage (kunci "aura2"), sesi login di kunci "aura2_sess".
// ============================================

/* =====================================================================
   BAGIAN 1 - INTI: konstanta, hash kata sandi, data, sesi, aturan jadwal
   ===================================================================== */

/* ---------- konstanta ---------- */
const KUNCI = 'aura2', KUNCI_SESI = 'aura2_sess', KUNCI_TEMA = 'aura2_tema', KUNCI_COBA = 'aura2_coba';
const BUKA = 10, TUTUP = 23, JAM = [];
for (let h = BUKA; h < TUTUP; h++) JAM.push(h);
const ST = {MP: 'Menunggu Pembayaran', MV: 'Menunggu Verifikasi', DK: 'Dikonfirmasi', PT: 'Pembayaran Ditolak', DB: 'Dibatalkan'};
const BATAS_BAYAR_MENIT = 30, BATAS_BATAL_JAM = 24, SESI_MENIT = 30, MAKS_COBA = 5, KUNCI_MENIT = 1;
const PROMO = {
  AURA10:    {label: 'Diskon 10% semua ruangan', pct: 10},
  WEEKDAY15: {label: 'Diskon 15% untuk Senin sampai Kamis', pct: 15, hari: [1, 2, 3, 4]},
  JAM3:      {label: 'Potongan Rp25.000 untuk sewa 3 jam atau lebih', flat: 25000, minDur: 3}
};

/* ---------- fungsi bantu ---------- */
const $ = id => document.getElementById(id);
const qs = (s, r) => (r || document).querySelector(s);
const qsa = (s, r) => [...(r || document).querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const rp = n => 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => ymd(new Date());
const addDays = (n, dari) => { const d = dari ? new Date(dari + 'T00:00') : new Date(); d.setDate(d.getDate() + n); return ymd(d) };
const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fmtD = d => { const x = new Date(d + 'T00:00'); return HARI[x.getDay()] + ', ' + x.getDate() + ' ' + BULAN[x.getMonth()] + ' ' + x.getFullYear() };
const fmtPendek = d => { const x = new Date(d + 'T00:00'); return x.getDate() + ' ' + BULAN[x.getMonth()] };
const jamTeks = (b) => pad(b.start) + '.00 - ' + pad(b.start + b.dur) + '.00';
const param = n => new URLSearchParams(location.search).get(n);
const klikOK = h => typeof h === 'function';

/* ---------- hash kata sandi (SHA-256, dengan cadangan untuk situs non-HTTPS) ---------- */
function sha256js(m){const K=[];for(let i=2,n=0;n<64;i++){let p=1;for(let j=2;j*j<=i;j++)if(i%j==0){p=0;break}if(p){K[n++]=(Math.pow(i,1/3)%1)*4294967296|0}}
  const H=[];for(let i=2,n=0;n<8;i++){let p=1;for(let j=2;j*j<=i;j++)if(i%j==0){p=0;break}if(p){H[n++]=(Math.pow(i,.5)%1)*4294967296|0}}
  const b=[...new TextEncoder().encode(m)],l=b.length*8;b.push(0x80);while(b.length%64!==56)b.push(0);
  for(let i=7;i>=0;i--)b.push(i>3?0:(l>>>(i*8))&255);
  const rr=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let o=0;o<b.length;o+=64){const w=[];for(let i=0;i<16;i++)w[i]=(b[o+i*4]<<24)|(b[o+i*4+1]<<16)|(b[o+i*4+2]<<8)|b[o+i*4+3];
    for(let i=16;i<64;i++){const s0=rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3),s1=rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0}
    let [a,c,d,e,f,g,h,k]=H;
    for(let i=0;i<64;i++){const S1=rr(f,6)^rr(f,11)^rr(f,25),ch=(f&g)^(~f&h),t1=(k+S1+ch+K[i]+w[i])|0,S0=rr(a,2)^rr(a,13)^rr(a,22),mj=(a&c)^(a&d)^(c&d),t2=(S0+mj)|0;
      k=h;h=g;g=f;f=(e+t1)|0;e=d;d=c;c=a;a=(t1+t2)|0}
    H[0]=(H[0]+a)|0;H[1]=(H[1]+c)|0;H[2]=(H[2]+d)|0;H[3]=(H[3]+e)|0;H[4]=(H[4]+f)|0;H[5]=(H[5]+g)|0;H[6]=(H[6]+h)|0;H[7]=(H[7]+k)|0}
  return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')}
async function sha(p) {
  const t = 'aura2:' + p;
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  return sha256js(t);
}

/* ---------- penyimpanan data ---------- */
let S = {users: [], rooms: [], bookings: [], notifs: []}, mem = null;
function simpan() { try { localStorage.setItem(KUNCI, JSON.stringify(S)) } catch (e) { mem = S } }
function baca() {
  try { const r = localStorage.getItem(KUNCI); if (r) { const o = JSON.parse(r); if (o && o.users && o.rooms && o.bookings) { o.notifs = o.notifs || []; return o } } } catch (e) {}
  return mem;
}
async function seed() {
  const h = await sha('admin123'), d = await sha('demo1234'), x = await sha('rahasia99');
  const t = today();
  return {
    users: [
      {id: 1, name: 'Admin Aura', email: 'admin@email.com', phone: '0210000000', pw: h, role: 'admin', favs: []},
      {id: 2, name: 'Pelanggan Demo', email: 'demo@email.com', phone: '081200000000', pw: d, role: 'customer', favs: [2]},
      {id: 3, name: 'Budi Santoso', email: 'budi@email.com', phone: '081311112222', pw: x, role: 'customer', favs: []},
      {id: 4, name: 'Sari Wulandari', email: 'sari@email.com', phone: '081322223333', pw: x, role: 'customer', favs: []}
    ],
    rooms: [
      {id: 1, name: 'Studio Melody', type: 'Reguler', cap: 6, fac: ['TV 50"', '2 mikrofon', 'AC'], price: 80000, status: 'Aktif'},
      {id: 2, name: 'Studio Harmoni', type: 'Reguler', cap: 10, fac: ['TV 65"', '4 mikrofon', 'AC', 'Sofa'], price: 100000, status: 'Aktif'},
      {id: 3, name: 'Ruang Keluarga', type: 'Family', cap: 15, fac: ['TV 75"', '6 mikrofon', 'Meja makan', 'AC'], price: 150000, status: 'Aktif'},
      {id: 4, name: 'VIP Aurora', type: 'VIP', cap: 12, fac: ['TV 85"', 'Sound system premium', 'Lampu panggung', 'Sofa kulit'], price: 250000, status: 'Aktif'},
      {id: 5, name: 'VIP Galaxy', type: 'VIP', cap: 20, fac: ['Layar LED', 'Panggung mini', 'Sound system premium', 'Ruang ganti'], price: 400000, status: 'Aktif'}
    ],
    bookings: [
      {id: 1001, uid: 2, rid: 2, date: addDays(1), start: 19, dur: 2, guests: 6, note: '', promo: '', disc: 0, total: 200000, status: ST.DK, proof: null, reason: '', at: Date.now() - 86400000},
      {id: 900, uid: 3, rid: 1, date: addDays(-6), start: 18, dur: 2, guests: 4, note: '', promo: '', disc: 0, total: 160000, status: ST.DK, proof: null, reason: '', at: Date.now() - 8 * 86400000, rating: 5, review: 'Sound system jernih dan ruangannya bersih. Pasti balik lagi.'},
      {id: 901, uid: 4, rid: 2, date: addDays(-4), start: 16, dur: 3, guests: 8, note: '', promo: '', disc: 0, total: 300000, status: ST.DK, proof: null, reason: '', at: Date.now() - 6 * 86400000, rating: 4, review: 'Nyaman untuk rombongan kecil, pelayanannya ramah.'},
      {id: 902, uid: 3, rid: 4, date: addDays(-3), start: 20, dur: 2, guests: 10, note: '', promo: '', disc: 0, total: 500000, status: ST.DK, proof: null, reason: '', at: Date.now() - 5 * 86400000, rating: 5, review: 'Ruang VIP-nya mewah, lampu panggungnya seru banget.'},
      {id: 903, uid: 4, rid: 3, date: addDays(-2), start: 13, dur: 3, guests: 12, note: '', promo: '', disc: 0, total: 450000, status: ST.DK, proof: null, reason: '', at: Date.now() - 4 * 86400000, rating: 4, review: 'Cocok untuk acara keluarga, meja makannya luas.'},
      {id: 904, uid: 2, rid: 1, date: addDays(-1), start: 15, dur: 2, guests: 4, note: '', promo: '', disc: 0, total: 160000, status: ST.DK, proof: null, reason: '', at: Date.now() - 3 * 86400000, rating: null, review: ''},
      {id: 905, uid: 3, rid: 5, date: t, start: 19, dur: 3, guests: 15, note: '', promo: '', disc: 0, total: 1200000, status: ST.DK, proof: null, reason: '', at: Date.now() - 2 * 86400000}
    ],
    notifs: [{id: 1, uid: 2, text: 'Selamat datang di Aura Karaoke! Pakai kode AURA10 untuk diskon 10% di pemesanan pertamamu.', at: Date.now(), read: false}]
  };
}
function notif(uid, text) {
  S.notifs.unshift({id: Date.now() + Math.random(), uid, text, at: Date.now(), read: false});
  if (S.notifs.length > 120) S.notifs.length = 120;
}
const notifAdmin = text => S.users.filter(u => u.role === 'admin').forEach(a => notif(a.id, text));
// Pemesanan yang tidak dibayar dalam 30 menit dibatalkan otomatis agar jadwalnya kembali tersedia
function kedaluwarsa() {
  let ubah = false; const now = Date.now();
  S.bookings.forEach(b => {
    if (b.status === ST.MP && now - b.at > BATAS_BAYAR_MENIT * 60000) {
      b.status = ST.DB; b.reason = 'Batas waktu pembayaran habis';
      notif(b.uid, 'Pemesanan #' + b.id + ' dibatalkan otomatis karena belum dibayar dalam ' + BATAS_BAYAR_MENIT + ' menit.'); ubah = true;
    }
  });
  if (ubah) simpan();
}
async function muat() {
  const o = baca();
  if (o) S = o; else { S = await seed(); simpan() }
  kedaluwarsa();
}
function segarkan() { const o = baca(); if (o) S = o; kedaluwarsa() }       // ambil data terbaru sebelum menyimpan perubahan

/* ---------- sesi login (tersimpan di localStorage, berakhir setelah 30 menit tanpa aktivitas) ---------- */
function bacaSesi() {
  try {
    const s = JSON.parse(localStorage.getItem(KUNCI_SESI) || 'null');
    if (s && Date.now() - s.last > SESI_MENIT * 60000) { localStorage.removeItem(KUNCI_SESI); return null }
    return s;
  } catch (e) { return null }
}
const me = () => { const s = bacaSesi(); return s ? (S.users.find(u => u.id === s.uid) || null) : null };
const peranSaya = () => { const u = me(); return u ? u.role : 'tamu' };
const mulaiSesi = u => { try { localStorage.setItem(KUNCI_SESI, JSON.stringify({uid: u.id, last: Date.now()})) } catch (e) {} };
const akhiriSesi = () => { try { localStorage.removeItem(KUNCI_SESI) } catch (e) {} };
let _sentuh = 0;
function sentuh() {
  const n = Date.now(); if (n - _sentuh < 5000) return; _sentuh = n;
  const s = bacaSesi(); if (s) { s.last = n; try { localStorage.setItem(KUNCI_SESI, JSON.stringify(s)) } catch (e) {} }
}
// Pembatasan percobaan login: 5 kali salah berturut-turut mengunci form selama 1 menit
function sisaKunci() { try { const c = JSON.parse(localStorage.getItem(KUNCI_COBA) || 'null'); return c && c.sampai > Date.now() ? Math.ceil((c.sampai - Date.now()) / 1000) : 0 } catch (e) { return 0 } }
function catatGagal() {
  let c = {n: 0, sampai: 0};
  try { c = JSON.parse(localStorage.getItem(KUNCI_COBA) || 'null') || c } catch (e) {}
  c.n = (c.sampai && c.sampai <= Date.now() ? 0 : c.n) + 1; c.sampai = 0;
  if (c.n >= MAKS_COBA) { c.sampai = Date.now() + KUNCI_MENIT * 60000; c.n = 0 }
  try { localStorage.setItem(KUNCI_COBA, JSON.stringify(c)) } catch (e) {}
}
const resetGagal = () => { try { localStorage.removeItem(KUNCI_COBA) } catch (e) {} };
const ALIAS = {admin: 'admin@email.com', demo: 'demo@email.com'};
async function authenticate(email, pw) {
  const k = sisaKunci(); if (k) return {err: 'Terlalu banyak percobaan. Coba lagi dalam ' + k + ' detik.'};
  let em = String(email).trim().toLowerCase(); em = ALIAS[em] || em;
  if (!em || !pw) return {err: 'Email dan kata sandi wajib diisi.'};
  segarkan();
  const h = await sha(pw), u = S.users.find(x => String(x.email).toLowerCase() === em && x.pw === h);
  if (!u) { catatGagal(); return {err: 'Email atau kata sandi tidak cocok.'} }
  resetGagal(); return {u};
}

/* ---------- aturan jadwal dan harga ---------- */
const room = id => S.rooms.find(r => r.id == id);
const aktif = b => b.status !== ST.DB && b.status !== ST.PT;
const taken = (rid, d, h) => S.bookings.some(b => b.rid == rid && b.date === d && aktif(b) && h >= b.start && h < b.start + b.dur);
const mulaiWaktu = b => new Date(b.date + 'T' + pad(b.start) + ':00');
const selesaiWaktu = b => new Date(b.date + 'T' + pad(b.start + b.dur) + ':00');
const jamLewat = (d, h) => new Date(d + 'T' + pad(h) + ':00') <= new Date();
const sudahSelesai = b => b.status === ST.DK && selesaiWaktu(b) <= new Date();
const bisaBatal = b => [ST.MP, ST.MV, ST.DK].includes(b.status) && mulaiWaktu(b) - Date.now() >= BATAS_BATAL_JAM * 3600e3;
const jamKosong = (r, d) => r.status === 'Aktif' ? JAM.filter(h => !taken(r.id, d, h) && !jamLewat(d, h)).length : 0;
function ratingRuangan(rid) {
  const l = S.bookings.filter(b => b.rid == rid && b.rating);
  return l.length ? {avg: l.reduce((a, b) => a + b.rating, 0) / l.length, n: l.length} : {avg: 0, n: 0};
}
// Menghitung potongan harga dari kode promo; mengembalikan {ok, diskon, pesan}
function hitungPromo(kode, tgl, dur, subtotal) {
  kode = String(kode || '').trim().toUpperCase();
  if (!kode) return {ok: false, diskon: 0, pesan: ''};
  const p = PROMO[kode]; if (!p) return {ok: false, diskon: 0, pesan: 'Kode promo tidak dikenal.'};
  if (p.hari && !p.hari.includes(new Date(tgl + 'T00:00').getDay())) return {ok: false, diskon: 0, pesan: 'Kode ini hanya berlaku untuk Senin sampai Kamis.'};
  if (p.minDur && dur < p.minDur) return {ok: false, diskon: 0, pesan: 'Kode ini berlaku untuk sewa minimal ' + p.minDur + ' jam.'};
  const d = p.pct ? Math.round(subtotal * p.pct / 100) : Math.min(p.flat, subtotal);
  return {ok: true, diskon: d, pesan: p.label + ' berhasil dipakai.'};
}
// Memeriksa pemesanan; mengembalikan teks kesalahan pertama atau '' bila lolos
function validasiPesan(k) {
  const r = room(k.rid);
  if (!r || r.status !== 'Aktif') return 'Ruangan tidak tersedia untuk dipesan';
  if (!k.date || k.date < today()) return 'Pilih tanggal hari ini atau setelahnya';
  if (!(k.dur >= 1) || k.dur > 12) return 'Durasi minimal 1 jam dan maksimal 12 jam';
  if (!(k.guests >= 1)) return 'Jumlah tamu minimal 1';
  if (k.start < BUKA || k.start + k.dur > TUTUP) return 'Jam di luar jam operasional (' + BUKA + '.00 sampai ' + TUTUP + '.00)';
  if (jamLewat(k.date, k.start)) return 'Jam mulai sudah lewat, pilih jam lain';
  if (k.guests > r.cap) return 'Jumlah tamu melebihi kapasitas ruangan (maks ' + r.cap + ')';
  for (let h = k.start; h < k.start + k.dur; h++) if (taken(k.rid, k.date, h)) return 'Jadwal sudah terisi, pilih jam lain';
  return '';
}

/* =====================================================================
   BAGIAN 2 - PEMBANTU TAMPILAN (dipakai semua halaman di folder Code/)
   ===================================================================== */

/* ---------- tujuan halaman menurut peran (sesuai sitemap Bab VII) ---------- */
const halamanLogin = p => p === 'admin' ? 'admin-login.html' : 'login.html';
const berandaPeran = r => r === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';

/* ---------- toast, pesan sekali tampil, modal ---------- */
let _tt;
function toast(m) { const t = $('toast'); if (!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(_tt); _tt = setTimeout(() => t.classList.remove('on'), 3600) }
const setFlash = m => { try { sessionStorage.setItem('aura2_flash', m) } catch (e) {} };
function tampilFlash() { let m = null; try { m = sessionStorage.getItem('aura2_flash'); sessionStorage.removeItem('aura2_flash') } catch (e) {} if (m) toast(m) }
function bukaModal(html, kelas) {
  const m = $('modal'); if (!m) return;
  $('modalIsi').innerHTML = html; m.className = 'modal ' + (kelas || ''); m.hidden = false; document.body.classList.add('modal-buka');
  const f = qs('#modalIsi [data-fokus]'); if (f) f.focus();
}
function tutupModal() { const m = $('modal'); if (!m) return; m.hidden = true; $('modalIsi').innerHTML = ''; document.body.classList.remove('modal-buka') }
function pasangModal() {
  const m = $('modal'); if (!m) return;
  m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-tutup]')) tutupModal() });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') tutupModal() });
}
const modalAktif = () => { const m = $('modal'); return m && !m.hidden };

/* ---------- lencana, bintang, waktu ---------- */
const KELAS_ST = {[ST.MP]: 'warn', [ST.MV]: 'info', [ST.DK]: 'ok', [ST.PT]: 'err', [ST.DB]: 'mut'};
const badge = s => '<span class="badge ' + (KELAS_ST[s] || 'mut') + '">' + esc(s) + '</span>';
const badgeBooking = b => sudahSelesai(b) ? '<span class="badge sel">Selesai</span>' : badge(b.status);
const badgeRuang = s => '<span class="badge ' + (s === 'Aktif' ? 'ok' : s === 'Perawatan' ? 'warn' : 'mut') + '">' + esc(s) + '</span>';
const bintang = avg => '<span class="bintang" aria-label="Rating ' + (+avg).toFixed(1) + ' dari 5"><span class="isi" style="width:' + Math.max(0, Math.min(100, avg / 5 * 100)) + '%"></span></span>';
function waktuLalu(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu'; return Math.floor(s / 86400) + ' hari lalu';
}
const sisaWaktu = b => Math.max(0, b.at + BATAS_BAYAR_MENIT * 60000 - Date.now());
const mmss = ms => pad(Math.floor(ms / 60000)) + ':' + pad(Math.floor(ms % 60000 / 1000));

/* ---------- komponen: kartu ruangan, strip tanggal, kisi jam ---------- */
function kartuRuangan(r, o) {
  o = o || {}; const d = o.tgl || today(), rt = ratingRuangan(r.id), kosong = jamKosong(r, d), u = me();
  const fav = u && u.favs && u.favs.includes(r.id);
  return '<article class="ruang t-' + esc(r.type) + '"><div class="ruang-banner"><span class="tipe">' + esc(r.type) + '</span>' +
    (u && u.role === 'customer' ? '<button type="button" class="hati ' + (fav ? 'on' : '') + '" data-fav="' + r.id + '" aria-pressed="' + (fav ? 'true' : 'false') + '" aria-label="Favorit">&#9829;</button>' : '') +
    '<h3>' + esc(r.name) + '</h3></div><div class="ruang-isi"><div class="baris"><span class="chip">Maks ' + r.cap + ' tamu</span>' +
    (r.status !== 'Aktif' ? badgeRuang(r.status) : '') +
    (rt.n ? '<span class="rating">' + bintang(rt.avg) + ' <b>' + rt.avg.toFixed(1) + '</b> <small>(' + rt.n + ')</small></span>' : '<span class="mut kecil">Belum ada ulasan</span>') + '</div>' +
    '<p class="fas">' + r.fac.map(esc).join(' &middot; ') + '</p>' +
    '<div class="bar" title="' + kosong + ' dari ' + JAM.length + ' jam kosong"><i style="width:' + Math.round(kosong / JAM.length * 100) + '%"></i></div>' +
    '<p class="kecil mut">' + (r.status === 'Aktif' ? '<b>' + kosong + '</b> jam masih kosong pada ' + fmtPendek(d) : 'Tidak dapat dipesan saat ini') + '</p>' +
    '<div class="harga-baris"><span class="harga">' + rp(r.price) + '<small>/jam</small></span><span class="aksi-kecil"><a class="btn ghost sm" href="detail-ruangan.html?id=' + r.id + '&amp;tgl=' + d + '">Detail</a> ' +
    (r.status === 'Aktif' ? '<a class="btn sm" href="pesan-ruangan.html?ruangan=' + r.id + '&amp;tgl=' + d + '">Pesan</a>' : '') + '</span></div></div></article>';
}
function pasangFavorit(setelah) {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-fav]'); if (!b) return; e.preventDefault();
    const u = me(); if (!u || u.role !== 'customer') { toast('Masuk sebagai pelanggan untuk menyimpan favorit.'); return }
    segarkan(); const x = S.users.find(y => y.id === u.id); x.favs = x.favs || [];
    const id = +b.dataset.fav, i = x.favs.indexOf(id);
    if (i >= 0) x.favs.splice(i, 1); else x.favs.push(id);
    simpan(); toast(i >= 0 ? 'Dihapus dari favorit' : 'Ditambahkan ke favorit'); if (setelah) setelah();
  });
}
function stripHari(aktifTgl, n) {
  let h = '<div class="strip">';
  for (let i = 0; i < (n || 14); i++) {
    const d = addDays(i), x = new Date(d + 'T00:00');
    h += '<button type="button" class="hari ' + (d === aktifTgl ? 'on' : '') + '" data-tgl="' + d + '"><small>' + HARI[x.getDay()] + '</small><b>' + x.getDate() + '</b><small>' + BULAN[x.getMonth()] + '</small></button>';
  }
  return h + '</div>';
}
function kisiJam(rid, d, pilih) {
  const p = pilih || {start: null, dur: 0};
  return '<div class="kisi-jam">' + JAM.map(h => {
    const t = taken(rid, d, h), l = !t && jamLewat(d, h), sel = p.start != null && h >= p.start && h < p.start + p.dur;
    const k = ['jam', t ? 'terisi' : '', l ? 'lewat' : '', sel ? 'pilih' : '', sel && h === p.start ? 'awal' : '', sel && h === p.start + p.dur - 1 ? 'akhir' : ''].join(' ');
    return '<button type="button" class="' + k + '" data-jam="' + h + '"' + (t || l ? ' disabled' : '') + '>' + pad(h) + '.00</button>';
  }).join('') + '</div><p class="legenda"><i class="lk"></i>Tersedia <i class="lt"></i>Terisi <i class="lp"></i>Dipilih</p>';
}

/* ---------- bilah atas, tema, notifikasi ---------- */
function pasangTema() {
  const b = $('btnTema'); if (!b) return;
  b.onclick = () => { const t = document.documentElement.dataset.tema === 'terang' ? 'gelap' : 'terang'; document.documentElement.dataset.tema = t; try { localStorage.setItem(KUNCI_TEMA, t) } catch (e) {} };
}
function keluar() { akhiriSesi(); setFlash('Anda sudah keluar. Sampai jumpa!'); location.href = 'index.html' }
function isiNotif(u) {
  const w = $('notifWrap'); if (!w) return;
  w.hidden = !u; if (!u) return;
  const milik = S.notifs.filter(n => n.uid === u.id), belum = milik.filter(n => !n.read).length;
  $('notifCount').textContent = belum; $('notifCount').hidden = !belum;
  $('notifList').innerHTML = milik.slice(0, 10).map(n => '<li class="' + (n.read ? '' : 'baru') + '"><span>' + esc(n.text) + '</span><small>' + waktuLalu(n.at) + '</small></li>').join('') || '<li class="kosong">Belum ada notifikasi.</li>';
}
function initTopbar(u) {
  const peran = u ? u.role : 'tamu';
  document.body.classList.add('siap');
  qsa('.tabs a').forEach(a => {
    const utk = (a.dataset.utk || 'tamu,customer,admin').split(',');
    a.hidden = !utk.includes(peran);
    a.classList.toggle('on', a.dataset.hal === document.body.dataset.hal);
  });
  const brand = qs('.brand'); if (brand && u && u.role === 'admin') brand.href = 'admin-dashboard.html';
  const t = $('areaTamu'), a = $('areaUser'); if (t) t.hidden = !!u; if (a) a.hidden = !u;
  const n = $('namaUser'); if (n) n.textContent = u ? u.name : '';
  const k = $('btnKeluar'); if (k) k.onclick = keluar;
  const c = $('cntBayar'); if (c) { const j = S.bookings.filter(b => b.status === ST.MV).length; c.textContent = j; c.hidden = !j }
  isiNotif(u);
  const bn = $('btnNotif');
  if (bn && !bn.dataset.siap) {
    bn.dataset.siap = '1';
    bn.onclick = e => {
      e.stopPropagation(); const p = $('notifPanel'); p.hidden = !p.hidden;
      if (!p.hidden) { const x = me(); if (x) { segarkan(); S.notifs.forEach(m => { if (m.uid === x.id) m.read = true }); simpan(); setTimeout(() => { $('notifCount').hidden = true }, 50) } }
    };
    document.addEventListener('click', e => { const p = $('notifPanel'); if (p && !p.hidden && !e.target.closest('#notifWrap')) p.hidden = true });
  }
}
const sedangMengetik = () => { const a = document.activeElement; return a && ['INPUT', 'SELECT', 'TEXTAREA'].includes(a.tagName) };

/* Dipanggil di awal setiap halaman.
   opsi.peran    : 'customer' atau 'admin' = halaman hanya untuk peran itu (yang lain dialihkan)
   opsi.tamuSaja : halaman masuk/daftar (yang sudah login dialihkan ke dashboard)
   jalankan(u)   : mengisi halaman; boleh mengembalikan fungsi render() yang dipanggil lagi saat data berubah */
function mulai(opsi, jalankan) {
  opsi = opsi || {};
  pasangTema();
  muat().catch(e => console.error('muat gagal', e)).then(() => {
    const u = me();
    if (opsi.peran && !u) { setFlash('Silakan masuk terlebih dahulu.'); location.href = halamanLogin(opsi.peran) + '?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); return }
    if (opsi.peran && u.role !== opsi.peran) { setFlash('Halaman itu khusus ' + (opsi.peran === 'admin' ? 'admin' : 'pelanggan') + '.'); location.href = berandaPeran(u.role); return }
    if (opsi.tamuSaja && u) { location.href = berandaPeran(u.role); return }
    initTopbar(u); tampilFlash(); pasangModal();
    const render = jalankan ? jalankan(u) : null, adaSesi = !!u;
    document.addEventListener('click', sentuh); document.addEventListener('keydown', sentuh);
    const segar = () => { initTopbar(me()); if (klikOK(render) && !sedangMengetik() && !modalAktif()) render() };
    window.addEventListener('storage', e => {
      if (e.key === KUNCI) { segarkan(); segar() }
      if (e.key === KUNCI_SESI && adaSesi !== !!bacaSesi()) location.reload();
    });
    setInterval(() => {
      segarkan();
      if (adaSesi && !bacaSesi()) { setFlash('Sesi berakhir. Silakan masuk lagi.'); location.href = opsi.peran ? halamanLogin(opsi.peran) : 'index.html'; return }
      segar();
    }, 5000);       // data ketersediaan disegarkan tiap 5 detik (NFR-02)
  });
}

/* =====================================================================
   BAGIAN 3 - HALAMAN PUBLIK: index, pilih, login, daftar, ruangan, detail-ruangan, admin-login
   ===================================================================== */

const tglValid = t => /^\d{4}-\d{2}-\d{2}$/.test(t || '') && t >= today() && t <= addDays(60);
const rataRating = () => S.rooms.map(r => ({r, rt: ratingRuangan(r.id)}));
function kartuUlasan(b) {
  const u = S.users.find(x => x.id === b.uid), r = room(b.rid);
  return '<figure class="ulasan"><div>' + bintang(b.rating) + '</div><blockquote>' + esc(b.review || 'Tanpa komentar.') + '</blockquote><figcaption><b>' + esc(u ? u.name : 'Pelanggan') + '</b> <span class="mut">&middot; ' + esc(r ? r.name : '') + ' &middot; ' + fmtPendek(b.date) + '</span></figcaption></figure>';
}

// index.html - beranda dengan pencarian cepat ruangan kosong
function initBeranda() {
  mulai({}, () => {
    $('cTgl').min = today(); $('cTgl').max = addDays(60); $('cTgl').value = today();
    $('cJam').innerHTML = '<option value="">Semua jam</option>' + JAM.map(h => '<option value="' + h + '">' + pad(h) + '.00</option>').join('');
    $('formCari').onsubmit = e => {
      e.preventDefault();
      const t = $('cTgl').value, tamu = +$('cTamu').value;
      if (!tglValid(t)) return toast('Pilih tanggal dalam 60 hari ke depan.');
      if (!(tamu >= 1)) return toast('Jumlah tamu minimal 1.');
      location.href = 'ruangan.html?tgl=' + t + '&tamu=' + tamu + ($('cJam').value ? '&jam=' + $('cJam').value : '');
    };
    pasangFavorit(tampil);
    function tampil() {
      const rs = S.rooms.filter(r => r.status === 'Aktif'), t = today();
      $('sRuangan').textContent = rs.length;
      $('sJam').textContent = BUKA + '.00 - ' + TUTUP + '.00';
      $('sHarga').textContent = rs.length ? rp(Math.min(...rs.map(r => r.price))) : '-';
      const urut = rataRating().filter(x => x.r.status === 'Aktif').sort((a, b) => b.rt.avg - a.rt.avg || a.r.price - b.r.price).slice(0, 3);
      $('topRuangan').innerHTML = urut.map(x => kartuRuangan(x.r, {tgl: t})).join('') || '<p class="mut">Belum ada ruangan tersedia.</p>';
      const ul = S.bookings.filter(b => b.rating && b.review).sort((a, b) => b.at - a.at).slice(0, 3);
      $('ulasanBox').innerHTML = ul.map(kartuUlasan).join('') || '<p class="mut">Belum ada ulasan.</p>';
    }
    tampil(); return tampil;
  });
}

// pilih.html - memilih masuk atau mendaftar sebagai pelanggan, atau masuk sebagai admin
function initPilih() {
  mulai({}, () => {
    function atur() {
      const daftar = location.hash === '#daftar';
      $('subJudul').textContent = daftar ? 'Buat akun pelanggan untuk mulai memesan.' : 'Masuk sebagai siapa hari ini?';
      $('btnUtama').textContent = daftar ? 'Daftar akun baru' : 'Masuk pelanggan';
      $('btnUtama').href = daftar ? 'daftar.html' : 'login.html';
      $('btnKedua').textContent = daftar ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar';
      $('btnKedua').href = daftar ? 'login.html' : 'daftar.html';
    }
    window.addEventListener('hashchange', atur); atur();
  });
}

// login.html (pelanggan) dan admin-login.html (admin) memakai pasangLogin() yang sama
function nextAman(u) {
  const n = param('next');
  if (n && /^[a-z0-9-]+\.html(\?[A-Za-z0-9_=&%.\-]*)?$/i.test(n) && (u.role === 'admin') === /^admin/i.test(n)) return n;
  return berandaPeran(u.role);
}
function pasangLogin(peran) {
  const DEMO = peran === 'admin' ? ['admin@email.com', 'admin123'] : ['demo@email.com', 'demo1234']; let timer = null;
  const pesan = m => { $('pesan').innerHTML = m ? '<div class="pesan er">' + m + '</div>' : '' };
  $('btnTampil').onclick = () => { const p = $('mp'); p.type = p.type === 'password' ? 'text' : 'password'; $('btnTampil').textContent = p.type === 'password' ? 'Tampil' : 'Sembunyi' };
  $('btnDemo').onclick = () => { $('me').value = DEMO[0]; $('mp').value = DEMO[1]; pesan('') };
  function tampilKunci() {
    clearInterval(timer); const tombol = $('btnMasuk'), k = sisaKunci();
    if (!k) { tombol.disabled = false; tombol.textContent = 'Masuk'; return }
    tombol.disabled = true; tombol.textContent = 'Coba lagi dalam ' + k + ' dtk';
    timer = setInterval(() => { const s = sisaKunci(); if (!s) { clearInterval(timer); tombol.disabled = false; tombol.textContent = 'Masuk'; pesan(''); return } tombol.textContent = 'Coba lagi dalam ' + s + ' dtk' }, 500);
  }
  $('formMasuk').onsubmit = async e => {
    e.preventDefault();
    try {
      const r = await authenticate($('me').value, $('mp').value);
      if (r.err) { pesan(esc(r.err)); tampilKunci(); return }
      if (r.u.role !== peran) return pesan(peran === 'admin' ? 'Ini akun pelanggan. Silakan masuk melalui <a href="login.html">halaman login pelanggan</a>.' : 'Ini akun admin. Silakan masuk melalui <a href="admin-login.html">halaman login admin</a>.');
      mulaiSesi(r.u); setFlash('Selamat datang, ' + r.u.name + '!'); location.href = nextAman(r.u);
    } catch (err) { console.error(err); pesan('Terjadi kesalahan: ' + esc(err.message)) }
  };
  tampilKunci();
}
function initLogin() { mulai({tamuSaja: true}, () => { pasangLogin('customer') }) }
function initAdminLogin() { mulai({tamuSaja: true}, () => { pasangLogin('admin') }) }

// daftar.html - registrasi pelanggan, langsung masuk setelah berhasil
function kekuatanSandi(p) {
  let s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return !p ? 0 : s <= 2 ? 1 : s <= 3 ? 2 : 3;
}
function initDaftar() {
  mulai({tamuSaja: true}, () => {
    const err = m => { $('pesan').innerHTML = m ? '<div class="pesan er">' + esc(m) + '</div>' : '' };
    $('dp').oninput = () => {
      const k = kekuatanSandi($('dp').value);
      $('meter').className = 'meter-sandi k' + k; $('meterTeks').textContent = ['', 'Lemah', 'Sedang', 'Kuat'][k] || '';
    };
    $('formDaftar').onsubmit = async e => {
      e.preventDefault();
      const n = $('dn').value.trim(), em = $('de').value.trim().toLowerCase(), t = $('dt').value.replace(/[\s-]/g, ''), p = $('dp').value, c = $('dc').value;
      if (!n || !em || !t || !p || !c) return err('Semua kolom wajib diisi.');
      if (n.length < 3) return err('Nama minimal 3 karakter.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return err('Format email tidak benar.');
      if (!/^\+?\d{9,15}$/.test(t)) return err('Nomor telepon tidak valid (9 sampai 15 angka).');
      if (p.length < 8) return err('Kata sandi minimal 8 karakter.');
      if (p !== c) return err('Konfirmasi kata sandi tidak sama.');
      segarkan();
      if (S.users.some(u => String(u.email).toLowerCase() === em)) return err('Email sudah terdaftar. Silakan masuk.');
      const u = {id: Date.now(), name: n, email: em, phone: t, pw: await sha(p), role: 'customer', favs: []};
      S.users.push(u); notif(u.id, 'Akun berhasil dibuat. Pakai kode AURA10 untuk diskon 10% di pemesanan pertamamu.'); simpan();
      mulaiSesi(u); setFlash('Akun berhasil dibuat. Selamat datang, ' + n + '!'); location.href = nextAman(u);
    };
  });
}

// ruangan.html - daftar ruangan dengan penyaring, pengurutan, dan dua mode tampilan
function initRuangan() {
  mulai({}, () => {
    const F = {tipe: '', tamu: +param('tamu') || 0, tgl: tglValid(param('tgl')) ? param('tgl') : today(), jam: param('jam') || '', urut: 'rekomendasi', tampil: 'grid', fav: false};
    $('fTgl').min = today(); $('fTgl').max = addDays(60); $('fTgl').value = F.tgl; if (F.tamu) $('fTamu').value = F.tamu;
    $('fJam').innerHTML = '<option value="">Semua jam</option>' + JAM.map(h => '<option value="' + h + '">' + pad(h) + '.00</option>').join(''); $('fJam').value = F.jam;
    qsa('[data-tipe]').forEach(b => b.onclick = () => { F.tipe = b.dataset.tipe; tampil() });
    qsa('[data-tampil]').forEach(b => b.onclick = () => { F.tampil = b.dataset.tampil; tampil() });
    $('fTgl').onchange = () => { F.tgl = tglValid($('fTgl').value) ? $('fTgl').value : today(); $('fTgl').value = F.tgl; tampil() };
    $('fTamu').oninput = () => { F.tamu = +$('fTamu').value || 0; tampil() };
    $('fJam').onchange = () => { F.jam = $('fJam').value; tampil() };
    $('fUrut').onchange = () => { F.urut = $('fUrut').value; tampil() };
    $('fFav').onclick = () => { F.fav = !F.fav; tampil() };
    $('btnReset').onclick = () => { F.fav = false; F.tipe = ''; F.tamu = 0; F.jam = ''; F.urut = 'rekomendasi'; F.tgl = today(); $('fTamu').value = ''; $('fJam').value = ''; $('fUrut').value = 'rekomendasi'; $('fTgl').value = F.tgl; tampil() };
    pasangFavorit(tampil);
    function tampil() {
      qsa('[data-tipe]').forEach(b => b.classList.toggle('on', b.dataset.tipe === F.tipe));
      qsa('[data-tampil]').forEach(b => b.classList.toggle('on', b.dataset.tampil === F.tampil));
      const u = me(), bisaFav = !!(u && u.role === 'customer'); $('fFav').hidden = !bisaFav; $('fFav').classList.toggle('on', F.fav && bisaFav);
      let rs = S.rooms.filter(r => r.status !== 'Nonaktif');
      if (F.fav && bisaFav) rs = rs.filter(r => (u.favs || []).includes(r.id));
      if (F.tipe) rs = rs.filter(r => r.type === F.tipe);
      if (F.tamu) rs = rs.filter(r => r.cap >= F.tamu);
      if (F.jam !== '') rs = rs.filter(r => r.status === 'Aktif' && !taken(r.id, F.tgl, +F.jam) && !jamLewat(F.tgl, +F.jam));
      const rt = r => ratingRuangan(r.id).avg;
      const U = {rekomendasi: (a, b) => rt(b) - rt(a) || a.price - b.price, murah: (a, b) => a.price - b.price, mahal: (a, b) => b.price - a.price, rating: (a, b) => rt(b) - rt(a), kapasitas: (a, b) => b.cap - a.cap};
      rs.sort(U[F.urut] || U.rekomendasi);
      $('jumlah').textContent = rs.length + ' ruangan ditemukan untuk ' + fmtD(F.tgl) + (F.jam !== '' ? ' pukul ' + pad(+F.jam) + '.00' : '');
      $('hasil').className = F.tampil === 'daftar' ? 'daftar-ruang' : 'grid';
      $('hasil').innerHTML = rs.map(r => kartuRuangan(r, {tgl: F.tgl})).join('') || '<div class="kosong-box"><b>Belum ada ruangan yang cocok.</b><p class="mut">Coba ubah tanggal, jam, atau jumlah tamu.</p></div>';
    }
    tampil(); return tampil;
  });
}

// detail-ruangan.html?id=... - detail ruangan, ketersediaan per tanggal, dan ulasan
function initDetailRuangan() {
  mulai({}, () => {
    const id = param('id'); let tgl = tglValid(param('tgl')) ? param('tgl') : today(), jam = null;
    function tampil() {
      const r = room(id);
      $('isi').hidden = !r; $('tidakAda').hidden = !!r; if (!r) return;
      const rt = ratingRuangan(r.id), ul = S.bookings.filter(b => b.rid == r.id && b.rating).sort((a, b) => b.at - a.at);
      document.title = r.name + ' - Aura Karaoke';
      $('banner').className = 'ruang-banner besar t-' + r.type; $('banner').innerHTML = '<span class="tipe">' + esc(r.type) + '</span><h1>' + esc(r.name) + '</h1>';
      $('ringkas').innerHTML = '<span class="chip">Maks ' + r.cap + ' tamu</span> ' + badgeRuang(r.status) + ' <span class="harga">' + rp(r.price) + '<small>/jam</small></span>';
      $('fasilitas').innerHTML = r.fac.map(f => '<li>' + esc(f) + '</li>').join('');
      $('ratingTotal').innerHTML = rt.n ? '<b class="besar-angka">' + rt.avg.toFixed(1) + '</b> ' + bintang(rt.avg) + ' <span class="mut">dari ' + rt.n + ' ulasan</span>' : '<span class="mut">Belum ada ulasan untuk ruangan ini.</span>';
      $('sebaran').innerHTML = rt.n ? [5, 4, 3, 2, 1].map(n => { const c = ul.filter(b => b.rating === n).length; return '<div class="sb"><span>' + n + '</span><div class="bar"><i style="width:' + Math.round(c / rt.n * 100) + '%"></i></div><span>' + c + '</span></div>' }).join('') : '';
      $('daftarUlasan').innerHTML = ul.slice(0, 6).map(kartuUlasan).join('');
      $('strip').innerHTML = stripHari(tgl);
      $('kisi').innerHTML = kisiJam(r.id, tgl, jam != null ? {start: jam, dur: 1} : null);
      $('infoJam').textContent = jam != null ? 'Mulai dari pukul ' + pad(jam) + '.00 pada ' + fmtD(tgl) : 'Pilih jam untuk langsung memesan, atau tekan Pesan Sekarang.';
      const a = $('btnPesan'); a.href = 'pesan-ruangan.html?ruangan=' + r.id + '&tgl=' + tgl + (jam != null ? '&jam=' + jam : '');
      a.hidden = r.status !== 'Aktif';
      $('tdkAktif').hidden = r.status === 'Aktif';
    }
    $('strip').onclick = e => { const b = e.target.closest('[data-tgl]'); if (!b) return; tgl = b.dataset.tgl; jam = null; tampil() };
    $('kisi').onclick = e => { const b = e.target.closest('[data-jam]'); if (!b || b.disabled) return; jam = +b.dataset.jam === jam ? null : +b.dataset.jam; tampil() };
    pasangFavorit(tampil);
    tampil(); return tampil;
  });
}

/* =====================================================================
   BAGIAN 4 - SITUS PELANGGAN: dashboard, pesan-ruangan, bayar, riwayat, detail-pemesanan
   ===================================================================== */

const milikSaya = () => S.bookings.filter(b => b.uid === me().id).sort((a, b) => b.at - a.at);
const selisihTeks = ms => { const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24); return d >= 1 ? d + ' hari ' + (h % 24) + ' jam lagi' : h >= 1 ? h + ' jam ' + (m % 60) + ' menit lagi' : Math.max(m, 0) + ' menit lagi' };
const METODE = {
  bca: {nama: 'Transfer BCA', info: 'BCA 000-111-2222 a.n. Aura Karaoke'},
  mandiri: {nama: 'Transfer Mandiri', info: 'Mandiri 123-000-444-555 a.n. Aura Karaoke'},
  qris: {nama: 'QRIS / E-wallet', info: 'Bayar lewat QRIS atau e-wallet ke nomor 0812-0000-1111, lalu unggah tangkapan layar bukti pembayaran'}
};
function barcode(teks) {
  const seq = (String(teks) + 'AURA').split('').flatMap(c => { const n = c.charCodeAt(0); return [1 + (n % 3), 1 + ((n >> 2) % 3), 1 + ((n >> 4) % 2)] });
  let x = 0, i = 0, h = '<svg class="barcode" viewBox="0 0 220 46" role="img" aria-label="Kode booking">';
  while (x < 214) { const w = seq[i % seq.length] * 1.7; if (i % 2 === 0) h += '<rect x="' + x.toFixed(1) + '" y="0" width="' + w.toFixed(1) + '" height="46"/>'; x += w; i++ }
  return h + '</svg>';
}
function previewBukti(p) {
  if (!p) return '<p class="mut">Belum ada bukti.</p>';
  return p.data && p.data.startsWith('data:image') ? '<img class="bukti" src="' + p.data + '" alt="Bukti pembayaran">' : '<div class="berkas-chip">PDF &middot; ' + esc(p.name) + '</div>';
}
function bacaBerkas(input, simpanKe, pesan) {
  simpanKe.v = null; const f = input.files[0]; if (!f) return;
  if (!/\.(jpe?g|png|pdf)$/i.test(f.name)) { pesan('Format berkas harus JPG, PNG, atau PDF'); input.value = ''; return }
  if (f.size > 2 * 1048576) { pesan('Ukuran berkas maksimal 2 MB'); input.value = ''; return }
  const fr = new FileReader(); fr.onload = () => { simpanKe.v = {name: f.name, data: fr.result, size: f.size}; pesan('') }; fr.readAsDataURL(f);
}
function kotakPesan(el) { return m => { el.innerHTML = m ? '<div class="pesan er">' + esc(m) + '</div>' : '' } }

/* ---------- ulasan (dipakai dashboard dan pemesanan-saya) ---------- */
function modalUlasan(bid, setelah) {
  const b = S.bookings.find(x => x.id == bid && x.uid === me().id), r = b && room(b.rid); if (!b || !sudahSelesai(b) || b.rating) return;
  let nilai = 0;
  bukaModal('<h2>Beri ulasan</h2><p class="mut">' + esc(r ? r.name : '') + ' &middot; ' + fmtD(b.date) + '</p><div class="bintang-input" id="bi">' +
    [1, 2, 3, 4, 5].map(n => '<button type="button" data-n="' + n + '" aria-label="' + n + ' bintang">&#9733;</button>').join('') + '</div>' +
    '<label for="ulTeks">Ceritakan pengalamanmu (opsional)</label><textarea id="ulTeks" rows="3" maxlength="200" data-fokus></textarea><div id="ulPesan"></div>' +
    '<p class="aksi-modal"><button type="button" class="btn ghost" data-tutup>Nanti saja</button> <button type="button" class="btn" id="ulKirim">Kirim ulasan</button></p>');
  $('bi').onclick = e => { const t = e.target.closest('[data-n]'); if (!t) return; nilai = +t.dataset.n; qsa('#bi button').forEach(x => x.classList.toggle('on', +x.dataset.n <= nilai)) };
  $('ulKirim').onclick = () => {
    if (!nilai) { $('ulPesan').innerHTML = '<div class="pesan er">Pilih jumlah bintang dulu.</div>'; return }
    segarkan(); const x = S.bookings.find(y => y.id == bid && y.uid === me().id);
    if (!x || !sudahSelesai(x) || x.rating) { tutupModal(); return }
    x.rating = nilai; x.review = $('ulTeks').value.trim().slice(0, 200); simpan(); tutupModal(); toast('Terima kasih atas ulasanmu!'); if (setelah) setelah();
  };
}

// dashboard.html
function initDashboard() {
  mulai({peran: 'customer'}, () => {
    function tampil() {
      const u = me(), m = milikSaya(), now = new Date();
      $('sapaan').textContent = u.name.split(' ')[0];
      const depan = m.filter(b => b.status === ST.DK && mulaiWaktu(b) > now).sort((a, b) => mulaiWaktu(a) - mulaiWaktu(b))[0];
      const r = depan && room(depan.rid);
      $('sesiDepan').innerHTML = depan
        ? '<div class="label">Sesi berikutnya</div><h2>' + esc(r ? r.name : '') + '</h2><p>' + fmtD(depan.date) + ' &middot; ' + jamTeks(depan) + ' &middot; ' + depan.guests + ' tamu</p><p class="besar-angka">' + selisihTeks(mulaiWaktu(depan) - now) + '</p><a class="btn" href="detail-pemesanan.html?id=' + depan.id + '">Lihat e-tiket</a>'
        : '<div class="label">Sesi berikutnya</div><h2>Belum ada jadwal</h2><p class="mut">Pilih ruangan dan jam favoritmu, lalu pesan dalam hitungan menit.</p><a class="btn" href="pesan-ruangan.html">Pesan ruangan</a>';
      const selesai = m.filter(sudahSelesai);
      $('stTotal').textContent = m.length;
      $('stAktif').textContent = m.filter(b => aktif(b) && mulaiWaktu(b) > now).length;
      $('stJam').textContent = selesai.reduce((a, b) => a + b.dur, 0);
      $('stHemat').textContent = rp(m.filter(b => b.status === ST.DK).reduce((a, b) => a + (b.disc || 0), 0));
      const bayar = m.filter(b => b.status === ST.MP);
      $('boxBayar').hidden = !bayar.length;
      $('listBayar').innerHTML = bayar.map(b => '<li><span><b>#' + b.id + '</b> ' + esc((room(b.rid) || {}).name) + ' &middot; ' + rp(b.total) + '</span><a class="btn sm" href="bayar.html?id=' + b.id + '">Bayar (' + mmss(sisaWaktu(b)) + ')</a></li>').join('');
      const ul = selesai.find(b => !b.rating);
      $('boxUlasan').hidden = !ul;
      if (ul) { $('teksUlasan').textContent = 'Bagaimana sesimu di ' + ((room(ul.rid) || {}).name || 'ruangan') + ' pada ' + fmtPendek(ul.date) + '?'; $('btnUlasan').dataset.id = ul.id }
      const fv = S.rooms.filter(r => (u.favs || []).includes(r.id) && r.status !== 'Nonaktif');
      $('favRow').innerHTML = fv.map(r => '<a class="chip besar" href="detail-ruangan.html?id=' + r.id + '">&#9829; ' + esc(r.name) + '</a>').join('') || '<span class="mut kecil">Tekan ikon hati pada kartu ruangan untuk menyimpannya di sini.</span>';
      $('notifBaru').innerHTML = S.notifs.filter(n => n.uid === u.id).slice(0, 4).map(n => '<li><span>' + esc(n.text) + '</span><small>' + waktuLalu(n.at) + '</small></li>').join('') || '<li class="kosong">Belum ada notifikasi.</li>';
    }
    $('btnUlasan').onclick = () => modalUlasan($('btnUlasan').dataset.id, tampil);
    tampil(); return tampil;
  });
}

// pesan-ruangan.html - pemesanan bertahap: 1) ruangan dan tanggal  2) jam  3) ringkasan, lalu pembayaran di bayar.html
function initPesanRuangan() {
  mulai({peran: 'customer'}, () => {
    const rs0 = S.rooms.filter(r => r.status === 'Aktif'), pr = room(param('ruangan'));
    const K = {step: 1, rid: pr && pr.status === 'Aktif' ? pr.id : (rs0[0] && rs0[0].id), date: tglValid(param('tgl')) ? param('tgl') : today(), start: null, dur: 0, guests: Math.max(1, +param('tamu') || 2), promo: '', note: ''};
    const jm = param('jam'); if (jm !== null && jm !== '' && K.rid && !taken(K.rid, K.date, +jm) && !jamLewat(K.date, +jm) && +jm >= BUKA && +jm < TUTUP) { K.start = +jm; K.dur = 1 }
    const err = kotakPesan($('pesan'));
    const subtotal = () => { const r = room(K.rid); return r ? r.price * Math.max(K.dur, 0) : 0 };
    const promo = () => hitungPromo(K.promo, K.date, K.dur, subtotal());

    function stepper() { qsa('#stepper li').forEach((li, i) => { li.classList.toggle('on', i + 1 === K.step); li.classList.toggle('selesai', i + 1 < K.step) }) }
    function tampil1() {
      $('pilihRuangan').innerHTML = S.rooms.filter(r => r.status === 'Aktif').map(r => '<button type="button" class="tile t-' + esc(r.type) + (r.id === K.rid ? ' on' : '') + '" data-rid="' + r.id + '"><b>' + esc(r.name) + '</b><span>' + esc(r.type) + ' &middot; maks ' + r.cap + ' tamu</span><span class="harga">' + rp(r.price) + '<small>/jam</small></span></button>').join('');
      $('stripTgl').innerHTML = stripHari(K.date);
      $('tamuVal').value = K.guests;
      const r = room(K.rid); $('infoTamu').textContent = r ? 'Kapasitas ' + r.name + ': maksimal ' + r.cap + ' tamu.' : '';
    }
    function tampil2() {
      const r = room(K.rid);
      $('judulJam').textContent = (r ? r.name : '') + ' - ' + fmtD(K.date);
      $('kisiJam').innerHTML = kisiJam(K.rid, K.date, {start: K.start, dur: K.dur});
      $('infoPilih').innerHTML = K.start == null ? 'Pilih jam mulai, lalu pilih jam terakhir yang diinginkan.' : '<b>' + pad(K.start) + '.00 - ' + pad(K.start + K.dur) + '.00</b> (' + K.dur + ' jam) &middot; ' + rp(subtotal());
    }
    function tampil3() {
      const r = room(K.rid), p = promo(), sub = subtotal();
      $('ringkasan').innerHTML = '<dl class="rinci"><dt>Ruangan</dt><dd>' + esc(r.name) + ' (' + esc(r.type) + ')</dd><dt>Tanggal</dt><dd>' + fmtD(K.date) + '</dd><dt>Jam</dt><dd>' + pad(K.start) + '.00 - ' + pad(K.start + K.dur) + '.00 (' + K.dur + ' jam)</dd><dt>Tamu</dt><dd>' + K.guests + ' orang</dd><dt>Tarif</dt><dd>' + rp(r.price) + ' / jam</dd></dl>' +
        '<div class="hitung"><div><span>Subtotal</span><b>' + rp(sub) + '</b></div>' + (p.ok ? '<div class="potong"><span>Promo ' + esc(K.promo) + '</span><b>-' + rp(p.diskon) + '</b></div>' : '') + '<div class="total"><span>Total</span><b>' + rp(sub - (p.ok ? p.diskon : 0)) + '</b></div></div>';
      $('kodePromo').value = K.promo; $('catatan').value = K.note;
    }
    function render() {
      stepper();
      ['l1', 'l2', 'l3'].forEach((id, i) => { $(id).hidden = i + 1 !== K.step });
      if (K.step === 1) tampil1(); else if (K.step === 2) tampil2(); else tampil3();
      $('btnKembali').hidden = K.step === 1;
      $('btnLanjut').textContent = K.step === 3 ? 'Pesan sekarang' : 'Lanjut';
    }
    function cek1() {
      const r = room(K.rid);
      if (!r) return 'Pilih ruangan terlebih dahulu';
      if (!tglValid(K.date)) return 'Pilih tanggal dalam 60 hari ke depan';
      if (!(K.guests >= 1)) return 'Jumlah tamu minimal 1';
      if (K.guests > r.cap) return 'Jumlah tamu melebihi kapasitas ruangan (maks ' + r.cap + ')';
      return '';
    }
    function kirim() {
      segarkan();
      const e = validasiPesan(K); if (e) { err(e); toast(e); if (/Jadwal|jam/i.test(e)) { K.start = null; K.dur = 0; K.step = 2; render() } return }
      const r = room(K.rid), sub = r.price * K.dur, p = hitungPromo(K.promo, K.date, K.dur, sub);
      const b = {id: Date.now() % 1e7, uid: me().id, rid: K.rid, date: K.date, start: K.start, dur: K.dur, guests: K.guests, note: K.note.trim().slice(0, 200), promo: p.ok ? K.promo.toUpperCase() : '', disc: p.ok ? p.diskon : 0, total: sub - (p.ok ? p.diskon : 0), status: ST.MP, proof: null, reason: '', at: Date.now()};
      S.bookings.push(b); notif(b.uid, 'Pemesanan #' + b.id + ' dibuat. Selesaikan pembayaran dalam ' + BATAS_BAYAR_MENIT + ' menit.'); simpan();
      setFlash('Pemesanan tersimpan. Selesaikan pembayaran dalam ' + BATAS_BAYAR_MENIT + ' menit.'); location.href = 'bayar.html?id=' + b.id;
    }
    $('btnLanjut').onclick = () => {
      err('');
      if (K.step === 1) { const e = cek1(); if (e) return err(e); K.step = 2 }
      else if (K.step === 2) { if (K.start == null) return err('Pilih jam mulai dan jam selesai terlebih dahulu'); const e = validasiPesan(K); if (e) return err(e); K.step = 3 }
      else return kirim();
      render(); window.scrollTo({top: 0, behavior: 'smooth'});
    };
    $('btnKembali').onclick = () => { err(''); K.step = Math.max(1, K.step - 1); render() };
    $('pilihRuangan').onclick = e => { const t = e.target.closest('[data-rid]'); if (!t) return; K.rid = +t.dataset.rid; K.start = null; K.dur = 0; err(''); tampil1() };
    $('stripTgl').onclick = e => { const t = e.target.closest('[data-tgl]'); if (!t) return; K.date = t.dataset.tgl; K.start = null; K.dur = 0; err(''); tampil1() };
    const setTamu = n => { K.guests = Math.max(1, Math.min(99, n || 1)); $('tamuVal').value = K.guests };
    $('tamuMin').onclick = () => setTamu(K.guests - 1); $('tamuPlus').onclick = () => setTamu(K.guests + 1);
    $('tamuVal').oninput = () => { K.guests = Math.max(0, +$('tamuVal').value || 0) };
    $('kisiJam').onclick = e => {
      const b = e.target.closest('[data-jam]'); if (!b || b.disabled) return; const h = +b.dataset.jam; err('');
      if (K.start == null || K.dur > 1 || h < K.start) { K.start = h; K.dur = 1 }
      else if (h === K.start) { K.start = null; K.dur = 0 }
      else {
        let bebas = true; for (let x = K.start; x <= h; x++) if (taken(K.rid, K.date, x)) bebas = false;
        if (!bebas) { toast('Ada jam terisi di antara pilihanmu. Pilih rentang yang kosong.'); K.start = h; K.dur = 1 }
        else if (h - K.start + 1 > 12) { toast('Durasi maksimal 12 jam.') }
        else K.dur = h - K.start + 1;
      }
      tampil2();
    };
    $('btnPromo').onclick = () => {
      K.promo = $('kodePromo').value.trim().toUpperCase(); const p = promo();
      $('pesanPromo').innerHTML = K.promo ? '<div class="pesan ' + (p.ok ? 'ok' : 'er') + '">' + esc(p.pesan) + '</div>' : '';
      if (!p.ok) K.promo = ''; tampil3();
    };
    $('catatan').oninput = () => { K.note = $('catatan').value };
    render();
    return () => { if (K.step === 2) tampil2() };
  });
}

// konfirmasi pembatalan (dipakai halaman detail pemesanan)
function konfirmasiBatal(id, setelah) {
  bukaModal('<h2>Batalkan pemesanan?</h2><p>Jadwal akan dilepas dan bisa dipesan orang lain. Tindakan ini tidak dapat dibatalkan.</p><div id="mPesan"></div><p class="aksi-modal"><button type="button" class="btn ghost" data-tutup data-fokus>Tidak</button> <button type="button" class="btn bahaya" id="yaBatal">Ya, batalkan</button></p>');
  $('yaBatal').onclick = () => {
    segarkan(); const b = S.bookings.find(x => x.id == id && x.uid === me().id);
    if (!b || !bisaBatal(b)) { $('mPesan').innerHTML = '<div class="pesan er">Pembatalan hanya bisa dilakukan minimal ' + BATAS_BATAL_JAM + ' jam sebelum jadwal</div>'; return }
    b.status = ST.DB; b.reason = 'Dibatalkan oleh pelanggan'; notifAdmin('Pemesanan #' + b.id + ' dibatalkan oleh pelanggan.'); simpan();
    tutupModal(); toast('Pemesanan dibatalkan. Jadwal kembali tersedia.'); if (setelah) setelah();
  };
}
function linimasa(b) {
  if (b.status === ST.DB) return '<ol class="linimasa"><li class="ok">Dipesan</li><li class="gagal">Dibatalkan</li></ol>';
  const dibayar = !!b.proof || b.status === ST.DK, verif = b.status === ST.DK, selesai = sudahSelesai(b);
  if (b.status === ST.PT) return '<ol class="linimasa"><li class="ok">Dipesan</li><li class="ok">Dibayar</li><li class="gagal">Ditolak</li></ol>';
  const L = [['Dipesan', true], ['Dibayar', dibayar], ['Diverifikasi', verif], ['Selesai', selesai]]; let sekarang = false;
  return '<ol class="linimasa">' + L.map(([t, ok]) => { const k = ok ? 'ok' : (!sekarang ? (sekarang = true, 'now') : ''); return '<li class="' + k + '">' + t + '</li>' }).join('') + '</ol>';
}

// bayar.html?id=... - pembayaran (hanya untuk pemesanan yang menunggu pembayaran)
function initBayar() {
  mulai({peran: 'customer'}, () => {
    const id = param('id'), PF = {v: null}; let metode = 'bca', tick = null;
    const err = kotakPesan($('pesan'));
    const cari = () => S.bookings.find(x => x.id == id && x.uid === me().id);
    function tampil() {
      const b = cari();
      $('tidakAda').hidden = !!b; $('isi').hidden = !b; if (!b) return;
      if (b.status !== ST.MP) { clearInterval(tick); location.replace('detail-pemesanan.html?id=' + b.id); return }   // sudah dibayar, dibatalkan, atau kedaluwarsa
      const r = room(b.rid) || {name: '-'};
      $('ringkasBayar').innerHTML = '<div class="label">Pemesanan #' + b.id + '</div><h2>' + esc(r.name) + '</h2><p>' + fmtD(b.date) + ' &middot; ' + jamTeks(b) + ' &middot; ' + b.guests + ' tamu</p>' +
        (b.disc ? '<p class="mut">Subtotal ' + rp(b.total + b.disc) + ' &middot; Promo ' + esc(b.promo) + ' -' + rp(b.disc) + '</p>' : '') + '<p class="besar-angka">' + rp(b.total) + '</p>';
      clearInterval(tick);
      const t = () => { const s = sisaWaktu(b); $('hitung').textContent = mmss(s); if (s <= 0) { clearInterval(tick); segarkan(); tampil() } };
      t(); tick = setInterval(t, 1000);
      $('infoMetode').textContent = METODE[metode].info;
    }
    qsa('[name=metode]').forEach(r => r.onchange = () => { metode = r.value; $('infoMetode').textContent = METODE[metode].info });
    $('berkas').onchange = () => {
      bacaBerkas($('berkas'), PF, err);
      setTimeout(() => { $('preview').innerHTML = PF.v ? previewBukti(PF.v) + '<p class="kecil mut">' + esc(PF.v.name) + ' &middot; ' + Math.round(PF.v.size / 1024) + ' KB</p>' : '' }, 250);
    };
    $('btnKirim').onclick = () => {
      if (!PF.v) return err('Bukti pembayaran wajib dilampirkan');
      segarkan(); const x = cari();
      if (!x || x.status !== ST.MP) { err('Pemesanan ini tidak bisa dibayar lagi'); tampil(); return }
      x.proof = {name: PF.v.name, data: PF.v.data, metode}; x.status = ST.MV; x.reason = '';
      notifAdmin('Bukti pembayaran #' + x.id + ' (' + rp(x.total) + ') menunggu verifikasi.'); notif(x.uid, 'Bukti pembayaran #' + x.id + ' terkirim dan sedang diverifikasi admin.'); simpan();
      setFlash('Bukti terkirim. Menunggu verifikasi admin.'); location.href = 'detail-pemesanan.html?id=' + x.id;
    };
    tampil(); return () => { if (!sedangMengetik()) tampil() };
  });
}

// riwayat.html - daftar pemesanan dengan penyaring status
function initRiwayat() {
  mulai({peran: 'customer'}, () => {
    let filter = param('f') || 'semua';
    const pasS = (b, f) => f === 'semua' || (f === 'aktif' && aktif(b) && !sudahSelesai(b)) || (f === 'selesai' && sudahSelesai(b)) || (f === 'batal' && (b.status === ST.DB || b.status === ST.PT));
    function tampil() {
      const m = milikSaya();
      qsa('[data-f]').forEach(c => { c.classList.toggle('on', c.dataset.f === filter); c.querySelector('span').textContent = m.filter(b => pasS(b, c.dataset.f)).length });
      $('daftar').innerHTML = m.filter(b => pasS(b, filter)).map(b => {
        const r = room(b.rid) || {name: '-'};
        return '<article class="pesanan"><div class="pesanan-kiri"><b>#' + b.id + ' &middot; ' + esc(r.name) + '</b><span>' + fmtD(b.date) + ' &middot; ' + jamTeks(b) + ' &middot; ' + b.guests + ' tamu</span><span class="mut kecil">Total ' + rp(b.total) + (b.promo ? ' (promo ' + esc(b.promo) + ')' : '') + '</span></div><div class="pesanan-kanan">' + badgeBooking(b) +
          '<span class="aksi-kecil"><a class="btn ghost sm" href="detail-pemesanan.html?id=' + b.id + '">Detail</a>' + (b.status === ST.MP ? '<a class="btn sm" href="bayar.html?id=' + b.id + '">Bayar</a>' : '') +
          (sudahSelesai(b) && !b.rating ? '<button type="button" class="btn sm" data-ulasan="' + b.id + '">Beri ulasan</button>' : '') + '</span></div></article>';
      }).join('') || '<div class="kosong-box"><b>Belum ada pemesanan di kategori ini.</b><p class="mut">Mulai dengan memilih ruangan dan jadwal.</p><a class="btn" href="pesan-ruangan.html">Pesan ruangan</a></div>';
    }
    qsa('[data-f]').forEach(c => c.onclick = () => { filter = c.dataset.f; tampil() });
    $('daftar').onclick = e => { const t = e.target.closest('[data-ulasan]'); if (t) modalUlasan(t.dataset.ulasan, tampil) };
    tampil(); return tampil;
  });
}

// detail-pemesanan.html?id=... - rincian, e-tiket, pembayaran, pembatalan, dan ulasan
function initDetailPemesanan() {
  mulai({peran: 'customer'}, () => {
    const id = param('id');
    function tampil() {
      const b = milikSaya().find(x => x.id == id);
      $('tidakAda').hidden = !!b; $('isi').hidden = !b; if (!b) return;
      const r = room(b.rid) || {name: '-', type: ''};
      $('dpJudul').innerHTML = 'Pemesanan #' + b.id + ' ' + badgeBooking(b);
      $('linimasa').innerHTML = linimasa(b);
      $('dpRinci').innerHTML = '<dt>Ruangan</dt><dd>' + esc(r.name) + ' (' + esc(r.type) + ')</dd><dt>Jadwal</dt><dd>' + fmtD(b.date) + ', ' + jamTeks(b) + ' (' + b.dur + ' jam)</dd><dt>Tamu</dt><dd>' + b.guests + ' orang</dd>' +
        (b.note ? '<dt>Catatan</dt><dd>' + esc(b.note) + '</dd>' : '') + (b.disc ? '<dt>Promo</dt><dd>' + esc(b.promo) + ' (-' + rp(b.disc) + ')</dd>' : '') + '<dt>Total</dt><dd><b>' + rp(b.total) + '</b></dd>' +
        (b.proof && b.proof.metode ? '<dt>Metode</dt><dd>' + esc((METODE[b.proof.metode] || {}).nama || '-') + '</dd>' : '') + (b.reason ? '<dt>Keterangan</dt><dd class="galat">' + esc(b.reason) + '</dd>' : '') +
        (b.rating ? '<dt>Ulasanmu</dt><dd>' + bintang(b.rating) + ' ' + esc(b.review) + '</dd>' : '');
      $('dpTiket').hidden = b.status !== ST.DK;
      $('dpTiket').innerHTML = b.status === ST.DK ? '<div class="tiket-kiri"><div class="label">E-tiket Aura Karaoke</div><h3>' + esc(r.name) + '</h3><p>' + fmtD(b.date) + '<br><b>' + jamTeks(b) + '</b> &middot; ' + b.guests + ' tamu</p><p class="kecil mut">Tunjukkan kode ini ke petugas saat datang.</p></div><div class="tiket-kanan">' + barcode(b.id) + '<b class="kode">AURA-' + b.id + '</b></div>' : '';
      $('dpBukti').hidden = !b.proof; $('dpBukti').innerHTML = b.proof ? '<h3>Bukti pembayaran</h3>' + previewBukti(b.proof) : '';
      const aktifBatal = [ST.MP, ST.MV, ST.DK].includes(b.status);
      $('dpAksi').innerHTML =
        (b.status === ST.MP ? '<a class="btn" href="bayar.html?id=' + b.id + '">Bayar sekarang (' + mmss(sisaWaktu(b)) + ')</a> ' : '') +
        (sudahSelesai(b) && !b.rating ? '<button type="button" class="btn" id="btnUlasan">Beri ulasan</button> ' : '') +
        (aktifBatal && !sudahSelesai(b) ? '<button type="button" class="btn bahaya" id="btnBatal"' + (bisaBatal(b) ? '' : ' disabled') + '>Batalkan pemesanan</button>' : '') +
        ([ST.DB, ST.PT].includes(b.status) ? '<a class="btn" href="pesan-ruangan.html?ruangan=' + b.rid + '">Pesan lagi</a>' : '');
      $('dpCatatan').hidden = !(aktifBatal && !sudahSelesai(b) && !bisaBatal(b));
      if ($('btnBatal')) $('btnBatal').onclick = () => konfirmasiBatal(b.id, tampil);
      if ($('btnUlasan')) $('btnUlasan').onclick = () => modalUlasan(b.id, tampil);
    }
    tampil(); return tampil;
  });
}

/* =====================================================================
   BAGIAN 5 - PANEL ADMIN: admin-dashboard, admin-ruangan, admin-pemesanan, admin-verifikasi, admin-verifikasi-detail
   ===================================================================== */

const userDari = id => S.users.find(u => u.id === id) || {name: '-', phone: '-', email: '-'};
const jamTerisiHari = (r, d) => JAM.filter(h => taken(r.id, d, h)).length;
function detailAdmin(id) {
  const b = S.bookings.find(x => x.id == id); if (!b) return;
  const r = room(b.rid) || {name: '-'}, u = userDari(b.uid);
  bukaModal('<h2>Pemesanan #' + b.id + '</h2><p>' + badgeBooking(b) + '</p><dl class="rinci"><dt>Pelanggan</dt><dd>' + esc(u.name) + ' (' + esc(u.phone) + ')</dd><dt>Ruangan</dt><dd>' + esc(r.name) + '</dd><dt>Jadwal</dt><dd>' + fmtD(b.date) + ', ' + jamTeks(b) + ' (' + b.dur + ' jam)</dd><dt>Tamu</dt><dd>' + b.guests + ' orang</dd>' +
    (b.note ? '<dt>Catatan</dt><dd>' + esc(b.note) + '</dd>' : '') + (b.disc ? '<dt>Promo</dt><dd>' + esc(b.promo) + ' (-' + rp(b.disc) + ')</dd>' : '') + '<dt>Total</dt><dd><b>' + rp(b.total) + '</b></dd>' +
    (b.proof ? '<dt>Metode</dt><dd>' + esc((METODE[b.proof.metode] || {}).nama || '-') + '</dd>' : '') + (b.reason ? '<dt>Keterangan</dt><dd>' + esc(b.reason) + '</dd>' : '') + (b.rating ? '<dt>Ulasan</dt><dd>' + bintang(b.rating) + ' ' + esc(b.review) + '</dd>' : '') + '</dl>' +
    (b.proof ? '<div class="bukti-box">' + previewBukti(b.proof) + '</div>' : '') +
    (b.status === ST.MV ? '<p class="aksi-modal"><a class="btn" href="admin-verifikasi-detail.html?id=' + b.id + '">Periksa pembayaran</a></p>' : '') +
    '<p class="aksi-modal"><button type="button" class="btn ghost" data-tutup data-fokus>Tutup</button></p>');
}
function barAngka(label, nilai, maks, teks, tanda) {
  return '<div class="bar-baris' + (tanda ? ' ' + tanda : '') + '"><span class="bl">' + esc(label) + '</span><div class="bar"><i style="width:' + (maks ? Math.round(nilai / maks * 100) : 0) + '%"></i></div><span class="bt">' + teks + '</span></div>';
}

// admin-dashboard.html - ringkasan, grafik pendapatan 7 hari, okupansi hari ini, antrean verifikasi
function initAdminDashboard() {
  mulai({peran: 'admin'}, () => {
    function tampil() {
      const t = today(), hari = []; for (let i = 6; i >= 0; i--) hari.push(addDays(-i));
      const dk = S.bookings.filter(b => b.status === ST.DK);
      const rev = hari.map(d => dk.filter(b => b.date === d).reduce((a, b) => a + b.total, 0)), maks = Math.max(...rev, 1);
      const rsAktif = S.rooms.filter(r => r.status === 'Aktif'), terisi = rsAktif.reduce((a, r) => a + jamTerisiHari(r, t), 0), kap = rsAktif.length * JAM.length;
      $('aPendapatan').textContent = rp(rev.reduce((a, b) => a + b, 0));
      $('aHariIni').textContent = S.bookings.filter(b => b.date === t && aktif(b)).length;
      $('aMV').textContent = S.bookings.filter(b => b.status === ST.MV).length;
      $('aOkupansi').textContent = (kap ? Math.round(terisi / kap * 100) : 0) + '%';
      $('grafik').innerHTML = hari.map((d, i) => '<div class="kolom' + (d === t ? ' hari-ini' : '') + '" title="' + fmtD(d) + ': ' + rp(rev[i]) + '"><div class="batang" style="height:' + Math.round(rev[i] / maks * 100) + '%"><span>' + (rev[i] ? Math.round(rev[i] / 1000) + 'rb' : '') + '</span></div><small>' + HARI[new Date(d + 'T00:00').getDay()] + '</small></div>').join('');
      $('okupansiRuang').innerHTML = rsAktif.map(r => { const n = jamTerisiHari(r, t); return barAngka(r.name, n, JAM.length, n + '/' + JAM.length + ' jam') }).join('') || '<p class="mut">Belum ada ruangan aktif.</p>';
      const mv = S.bookings.filter(b => b.status === ST.MV).sort((a, b) => a.at - b.at);
      $('antrian').innerHTML = mv.slice(0, 4).map(b => '<li><span><b>#' + b.id + '</b> ' + esc(userDari(b.uid).name) + ' &middot; ' + esc((room(b.rid) || {}).name) + ' &middot; ' + rp(b.total) + '</span><a class="btn sm" href="admin-verifikasi-detail.html?id=' + b.id + '">Periksa</a></li>').join('') || '<li class="kosong">Tidak ada pembayaran yang menunggu verifikasi.</li>';
      $('linkAntrian').hidden = !mv.length;
    }
    tampil(); return tampil;
  });
}

// admin-ruangan.html - tambah, ubah, aktifkan, nonaktifkan ruangan
function initAdminRuangan() {
  mulai({peran: 'admin'}, () => {
    function tampil() {
      $('tbody').innerHTML = S.rooms.map(r => { const rt = ratingRuangan(r.id);
        return '<tr><td><b>' + esc(r.name) + '</b></td><td>' + esc(r.type) + '</td><td>' + r.cap + '</td><td>' + rp(r.price) + '</td><td>' + (rt.n ? rt.avg.toFixed(1) + ' (' + rt.n + ')' : '-') + '</td><td>' + badgeRuang(r.status) + '</td><td class="aksi-sel">' +
          '<button type="button" class="btn ghost sm" data-aksi="ubah" data-id="' + r.id + '">Ubah</button> ' +
          (r.status === 'Nonaktif' ? '<button type="button" class="btn sm" data-aksi="aktifkan" data-id="' + r.id + '">Aktifkan</button>' : '<button type="button" class="btn ghost sm" data-aksi="nonaktif" data-id="' + r.id + '">Nonaktifkan</button>') + '</td></tr>' }).join('');
    }
    function form(id) {
      const r = id ? room(id) : {name: '', type: 'Reguler', cap: 6, price: 100000, status: 'Aktif', fac: []};
      bukaModal('<h2>' + (id ? 'Ubah ruangan' : 'Tambah ruangan') + '</h2><label for="rn">Nama ruangan</label><input id="rn" data-fokus value="' + esc(r.name) + '"><div class="dua"><div><label for="rt">Tipe</label><select id="rt">' + ['Reguler', 'Family', 'VIP'].map(t => '<option' + (t === r.type ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></div><div><label for="rs">Status</label><select id="rs">' + ['Aktif', 'Perawatan', 'Nonaktif'].map(t => '<option' + (t === r.status ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></div></div>' +
        '<div class="dua"><div><label for="rc">Kapasitas (tamu)</label><input id="rc" type="number" min="1" value="' + r.cap + '"></div><div><label for="rh">Harga per jam (Rp)</label><input id="rh" type="number" min="1000" step="1000" value="' + r.price + '"></div></div><label for="rf">Fasilitas (pisahkan dengan koma)</label><input id="rf" value="' + esc(r.fac.join(', ')) + '"><div id="mPesan"></div>' +
        '<p class="aksi-modal"><button type="button" class="btn ghost" data-tutup>Batal</button> <button type="button" class="btn" id="simpanRuang">Simpan</button></p>');
      $('simpanRuang').onclick = () => {
        const n = $('rn').value.trim(), c = +$('rc').value, h = +$('rh').value;
        if (n.length < 3 || !(c >= 1) || !(h >= 1000)) { $('mPesan').innerHTML = '<div class="pesan er">Nama (minimal 3 karakter), kapasitas, dan harga wajib diisi dengan benar</div>'; return }
        segarkan();
        if (S.rooms.some(x => x.id !== id && x.name.toLowerCase() === n.toLowerCase())) { $('mPesan').innerHTML = '<div class="pesan er">Nama ruangan sudah dipakai</div>'; return }
        const d = {name: n, type: $('rt').value, cap: c, price: h, status: $('rs').value, fac: $('rf').value.split(',').map(s => s.trim()).filter(Boolean)};
        if (id) { const r2 = room(id); if (!r2) return; Object.assign(r2, d) } else S.rooms.push({id: Math.max(0, ...S.rooms.map(x => x.id)) + 1, ...d});
        simpan(); tutupModal(); toast('Data ruangan disimpan'); tampil();
      };
    }
    $('btnTambah').onclick = () => form(0);
    $('tbody').onclick = e => {
      const t = e.target.closest('[data-aksi]'); if (!t) return; const id = +t.dataset.id;
      if (t.dataset.aksi === 'ubah') return form(id);
      if (t.dataset.aksi === 'aktifkan') { segarkan(); const r = room(id); if (r) { r.status = 'Aktif'; simpan(); toast('Ruangan diaktifkan'); tampil() } return }
      bukaModal('<h2>Nonaktifkan ruangan?</h2><p>Pelanggan tidak bisa memesan <b>' + esc((room(id) || {}).name) + '</b> sampai diaktifkan lagi. Pemesanan yang sudah ada tidak berubah.</p><p class="aksi-modal"><button type="button" class="btn ghost" data-tutup data-fokus>Batal</button> <button type="button" class="btn bahaya" id="yaNon">Nonaktifkan</button></p>');
      $('yaNon').onclick = () => { segarkan(); const r = room(id); if (r) { r.status = 'Nonaktif'; simpan() } tutupModal(); toast('Ruangan dinonaktifkan'); tampil() };
    };
    tampil(); return tampil;
  });
}

// admin-pemesanan.html - kalender mingguan, daftar semua pemesanan, dan laporan dengan ekspor CSV
function senin(d) { const x = new Date(d + 'T00:00'), g = (x.getDay() + 6) % 7; return addDays(-g, d) }
function csvSel(v) { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"' }
function initAdminPemesanan() {
  mulai({peran: 'admin'}, () => {
    let tab = param('tab') || 'kalender', minggu = senin(today());
    $('kRuang').innerHTML = S.rooms.map(r => '<option value="' + r.id + '">' + esc(r.name) + '</option>').join('');
    $('fRuang').innerHTML = '<option value="">Semua ruangan</option>' + S.rooms.map(r => '<option value="' + r.id + '">' + esc(r.name) + '</option>').join('');
    $('lDari').value = addDays(-29); $('lSampai').value = today();
    function kalender() {
      const rid = +$('kRuang').value || (S.rooms[0] && S.rooms[0].id), hari = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(i, minggu));
      $('judulMinggu').textContent = fmtPendek(hari[0]) + ' - ' + fmtPendek(hari[6]) + ' ' + new Date(hari[6] + 'T00:00').getFullYear();
      let h = '<table class="kal"><thead><tr><th></th>' + hari.map(d => '<th class="' + (d === today() ? 'hari-ini' : '') + '">' + HARI[new Date(d + 'T00:00').getDay()] + '<br><small>' + new Date(d + 'T00:00').getDate() + '</small></th>').join('') + '</tr></thead><tbody>';
      JAM.forEach(j => {
        h += '<tr><th>' + pad(j) + '.00</th>' + hari.map(d => {
          const b = S.bookings.find(x => x.rid == rid && x.date === d && aktif(x) && j >= x.start && j < x.start + x.dur);
          return b ? '<td class="isi s' + (b.status === ST.DK ? 'dk' : b.status === ST.MV ? 'mv' : 'mp') + '" data-bid="' + b.id + '" title="#' + b.id + ' ' + esc(userDari(b.uid).name) + '">' + (j === b.start ? '#' + b.id : '') + '</td>' : '<td class="' + (jamLewat(d, j) ? 'lewat' : '') + '"></td>';
        }).join('') + '</tr>';
      });
      $('kalender').innerHTML = h + '</tbody></table><p class="legenda"><i class="lk"></i>Dikonfirmasi <i class="lv"></i>Menunggu verifikasi <i class="lw"></i>Menunggu pembayaran</p>';
    }
    function daftar() {
      const tg = $('fTgl').value, rid = $('fRuang').value, st = $('fStatus').value;
      const l = S.bookings.filter(b => (!tg || b.date === tg) && (!rid || b.rid == rid) && (!st || b.status === st)).sort((a, b) => (b.date + pad(b.start)) < (a.date + pad(a.start)) ? -1 : 1);
      $('tbodyDaftar').innerHTML = l.map(b => '<tr><td>#' + b.id + '</td><td>' + esc(userDari(b.uid).name) + '</td><td>' + esc((room(b.rid) || {}).name) + '</td><td>' + fmtD(b.date) + '<br><small class="mut">' + jamTeks(b) + '</small></td><td>' + rp(b.total) + '</td><td>' + badgeBooking(b) + '</td><td><button type="button" class="btn ghost sm" data-bid="' + b.id + '">Detail</button></td></tr>').join('');
      $('tabelDaftar').hidden = !l.length; $('kosongDaftar').hidden = !!l.length;
    }
    const rentang = () => {
      let a = $('lDari').value, z = $('lSampai').value; if (a && z && a > z) [a, z] = [z, a];
      return {a, z, l: S.bookings.filter(b => b.status === ST.DK && (!a || b.date >= a) && (!z || b.date <= z)).sort((x, y) => (x.date + pad(x.start)) < (y.date + pad(y.start)) ? -1 : 1)};
    };
    function laporan() {
      const {a, z, l} = rentang(), hari = a && z ? Math.max(1, Math.round((new Date(z + 'T00:00') - new Date(a + 'T00:00')) / 86400000) + 1) : 30;
      const total = l.reduce((x, b) => x + b.total, 0), jam = l.reduce((x, b) => x + b.dur, 0);
      $('lJumlah').textContent = l.length; $('lJam').textContent = jam; $('lTotal').textContent = rp(total); $('lRata').textContent = l.length ? rp(total / l.length) : rp(0);
      const per = S.rooms.map(r => { const m = l.filter(b => b.rid === r.id); return {r, n: m.length, j: m.reduce((x, b) => x + b.dur, 0), p: m.reduce((x, b) => x + b.total, 0)} });
      const maks = Math.max(...per.map(x => x.p), 1);
      $('tbodyLap').innerHTML = per.map(x => '<tr><td><b>' + esc(x.r.name) + '</b></td><td>' + x.n + '</td><td>' + x.j + '</td><td>' + Math.round(x.j / (hari * JAM.length) * 100) + '%</td><td>' + rp(x.p) + '</td><td class="sel-bar"><div class="bar"><i style="width:' + Math.round(x.p / maks * 100) + '%"></i></div></td></tr>').join('');
      $('lKosong').hidden = !!l.length;
    }
    function tampil() {
      qsa('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      $('pKalender').hidden = tab !== 'kalender'; $('pDaftar').hidden = tab !== 'daftar'; $('pLaporan').hidden = tab !== 'laporan';
      if (tab === 'kalender') kalender(); else if (tab === 'daftar') daftar(); else laporan();
    }
    $('btnCsv').onclick = () => {
      const {l} = rentang(); if (!l.length) return toast('Tidak ada data pada rentang tanggal ini.');
      const baris = [['ID', 'Tanggal', 'Mulai', 'Selesai', 'Ruangan', 'Pelanggan', 'Telepon', 'Tamu', 'Promo', 'Diskon', 'Total', 'Status']];
      l.forEach(b => { const r = room(b.rid) || {name: '-'}, u = userDari(b.uid); baris.push([b.id, b.date, pad(b.start) + '.00', pad(b.start + b.dur) + '.00', r.name, u.name, u.phone, b.guests, b.promo || '', b.disc || 0, b.total, b.status]) });
      const blob = new Blob(['\ufeff' + baris.map(r => r.map(csvSel).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'laporan-aura-' + today() + '.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Laporan diunduh (' + l.length + ' pemesanan).');
    };
    qsa('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; tampil() });
    $('kRuang').onchange = tampil;
    $('mingguPrev').onclick = () => { minggu = addDays(-7, minggu); tampil() };
    $('mingguNext').onclick = () => { minggu = addDays(7, minggu); tampil() };
    $('mingguIni').onclick = () => { minggu = senin(today()); tampil() };
    ['fTgl', 'fRuang', 'fStatus', 'lDari', 'lSampai'].forEach(id => $(id).onchange = tampil);
    document.addEventListener('click', e => { const t = e.target.closest('[data-bid]'); if (t) detailAdmin(t.dataset.bid) });
    tampil(); return tampil;
  });
}

// admin-verifikasi.html - antrean pembayaran yang menunggu verifikasi dan riwayat keputusan
function initAdminVerifikasi() {
  mulai({peran: 'admin'}, () => {
    let tab = 'antrian';
    function kartu(b) {
      const r = room(b.rid) || {name: '-'}, u = userDari(b.uid);
      return '<article class="verif"><div class="verif-bukti">' + previewBukti(b.proof) + '</div><div class="verif-info"><div class="baris"><b>#' + b.id + '</b> ' + badgeBooking(b) + '</div><h3>' + esc(u.name) + '</h3><p class="mut">' + esc(u.phone) + '</p><p>' + esc(r.name) + ' &middot; ' + fmtD(b.date) + ' &middot; ' + jamTeks(b) + '</p><p><b>' + rp(b.total) + '</b>' + (b.proof && b.proof.metode ? ' <span class="mut">via ' + esc((METODE[b.proof.metode] || {}).nama || '-') + '</span>' : '') + '</p>' + (b.reason ? '<p class="mut kecil">Keterangan: ' + esc(b.reason) + '</p>' : '') +
        '<p class="aksi-kecil"><a class="btn' + (b.status === ST.MV ? '' : ' ghost') + '" href="admin-verifikasi-detail.html?id=' + b.id + '">' + (b.status === ST.MV ? 'Periksa' : 'Lihat detail') + '</a></p></div></article>';
    }
    function tampil() {
      qsa('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
      const mv = S.bookings.filter(b => b.status === ST.MV).sort((a, b) => a.at - b.at);
      const rw = S.bookings.filter(b => b.proof && (b.status === ST.DK || b.status === ST.PT)).sort((a, b) => b.at - a.at);
      $('cMV').textContent = mv.length; $('cRW').textContent = rw.length;
      $('isi').innerHTML = tab === 'antrian' ? (mv.map(kartu).join('') || '<div class="kosong-box"><b>Antrean kosong.</b><p class="mut">Tidak ada pembayaran yang menunggu verifikasi.</p></div>') : (rw.map(kartu).join('') || '<div class="kosong-box"><b>Belum ada riwayat verifikasi.</b></div>');
    }
    qsa('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; tampil() });
    tampil(); return tampil;
  });
}

// admin-verifikasi-detail.html?id=... - memeriksa bukti lalu mengonfirmasi atau menolak
function initAdminVerifikasiDetail() {
  mulai({peran: 'admin'}, () => {
    const id = param('id'), err = kotakPesan($('pesan'));
    function tampil() {
      const b = S.bookings.find(x => x.id == id);
      $('tidakAda').hidden = !!b; $('isi').hidden = !b; if (!b) return;
      const r = room(b.rid) || {name: '-', type: ''}, u = userDari(b.uid);
      $('vJudul').innerHTML = 'Pemesanan #' + b.id + ' ' + badgeBooking(b);
      $('vRinci').innerHTML = '<dt>Pelanggan</dt><dd>' + esc(u.name) + ' (' + esc(u.phone) + ')</dd><dt>Ruangan</dt><dd>' + esc(r.name) + ' (' + esc(r.type) + ')</dd><dt>Jadwal</dt><dd>' + fmtD(b.date) + ', ' + jamTeks(b) + ' (' + b.dur + ' jam)</dd><dt>Tamu</dt><dd>' + b.guests + ' orang</dd>' +
        (b.note ? '<dt>Catatan</dt><dd>' + esc(b.note) + '</dd>' : '') + (b.disc ? '<dt>Promo</dt><dd>' + esc(b.promo) + ' (-' + rp(b.disc) + ')</dd>' : '') + '<dt>Total tagihan</dt><dd><b>' + rp(b.total) + '</b></dd>' +
        (b.proof && b.proof.metode ? '<dt>Metode</dt><dd>' + esc((METODE[b.proof.metode] || {}).nama || '-') + '</dd>' : '') + (b.reason ? '<dt>Keterangan</dt><dd class="galat">' + esc(b.reason) + '</dd>' : '');
      $('vBukti').innerHTML = previewBukti(b.proof);
      $('formVerif').hidden = b.status !== ST.MV;
      $('vSelesai').hidden = b.status === ST.MV;
    }
    function proses(ok) {
      let alasan = '';
      if (!ok) { alasan = $('alasan').value.trim(); if (alasan.length < 5) return err('Isi alasan penolakan (minimal 5 karakter)') }
      segarkan(); const b = S.bookings.find(x => x.id == id);
      if (!b || b.status !== ST.MV) { setFlash('Pemesanan ini sudah diproses.'); location.href = 'admin-verifikasi.html'; return }
      b.status = ok ? ST.DK : ST.PT; b.reason = ok ? '' : alasan;
      notif(b.uid, ok ? 'Pembayaran #' + b.id + ' dikonfirmasi. E-tiket sudah tersedia.' : 'Pembayaran #' + b.id + ' ditolak: ' + alasan);
      simpan(); setFlash(ok ? 'Pembayaran dikonfirmasi' : 'Pembayaran ditolak'); location.href = 'admin-verifikasi.html';
    }
    $('btnKonfirmasi').onclick = () => proses(true);
    $('btnTolak').onclick = () => proses(false);
    tampil(); return tampil;
  });
}
