const ADMIN_PW_KEY = 'eph_admin_pw';
const ARTICLES_KEY = 'eph_articles';

function getPassword() {
return localStorage.getItem(ADMIN_PW_KEY) || 'admin123';
}

function getArticles() {
try { return JSON.parse(localStorage.getItem(ARTICLES_KEY)) || []; }
catch { return []; }
}

function saveArticles(arr) {
localStorage.setItem(ARTICLES_KEY, JSON.stringify(arr));
}

function showToast(msg, type = 'success') {
const t = document.getElementById('toast');
t.textContent = msg;
t.className = 'toast show ' + type;
setTimeout(() => t.className = 'toast', 2800);
}

function openAdmin() {
document.getElementById('adminModal').classList.add('open');
renderAdminArticles();
}

function closeModal(id) {
document.getElementById(id).classList.remove('open');
}

function checkLogin() {
const pw = document.getElementById('admin-pw').value;
const err = document.getElementById('login-error');
if (pw === getPassword()) {
    document.getElementById('admin-login-panel').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    document.getElementById('admin-pw').value = '';
    err.style.display = 'none';
    renderAdminArticles();
} else {
    err.style.display = 'block';
}
}

function logout() {
document.getElementById('admin-dashboard').style.display = 'none';
document.getElementById('admin-login-panel').style.display = 'block';
closeModal('adminModal');
}

function switchTab(name) {
document.querySelectorAll('.admin-tab').forEach((t, i) => {
    const tabs = ['articles', 'new-article', 'settings'];
    t.classList.toggle('active', tabs[i] === name);
});
document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
document.getElementById('tab-' + name).classList.add('active');
if (name === 'articles') renderAdminArticles();
}

function renderAdminArticles() {
const articles = getArticles();
const list = document.getElementById('admin-articles-list');
if (articles.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:var(--gris);font-size:0.88rem;padding:1.5rem 0;">Aucun article publié.</p>';
    return;
}
list.innerHTML = articles.map(a => `
    <div class="article-row">
    <span class="article-row-title">${escHtml(a.title)}</span>
    <span class="article-row-date">${formatDate(a.date)}</span>
    <div class="article-row-actions">
        <button class="icon-btn" onclick="editArticle('${a.id}')" title="Modifier"><i class="fa fa-edit"></i></button>
        <button class="icon-btn delete" onclick="deleteArticle('${a.id}')" title="Supprimer"><i class="fa fa-trash"></i></button>
    </div>
    </div>
`).join('');
}

function editArticle(id) {
const art = getArticles().find(a => a.id === id);
if (!art) return;
document.getElementById('edit-id').value = id;
document.getElementById('art-title').value = art.title;
document.getElementById('art-content').value = art.content;
document.getElementById('art-img-data').value = art.image || '';
const preview = document.getElementById('art-img-preview');
if (art.image) { preview.src = art.image; preview.style.display = 'block'; }
else preview.style.display = 'none';
updatePreview();
switchTab('new-article');
}

function cancelEdit() {
document.getElementById('edit-id').value = '';
document.getElementById('art-title').value = '';
document.getElementById('art-content').value = '';
document.getElementById('art-img-data').value = '';
document.getElementById('art-img-preview').style.display = 'none';
document.getElementById('art-preview').innerHTML = '<em style="color:var(--gris)">L\'aperçu s\'affiche ici…</em>';
switchTab('articles');
}

function saveArticle() {
const title = document.getElementById('art-title').value.trim();
const content = document.getElementById('art-content').value.trim();
if (!title || !content) { showToast('Titre et contenu requis.', 'error'); return; }
const image = document.getElementById('art-img-data').value || '';
const editId = document.getElementById('edit-id').value;
let articles = getArticles();

if (editId) {
    articles = articles.map(a => a.id === editId ? {...a, title, content, image} : a);
    showToast('Article mis à jour !');
} else {
    articles.unshift({ id: Date.now().toString(), title, content, image, date: new Date().toISOString() });
    showToast('Article publié !');
}
saveArticles(articles);
renderBlog();
cancelEdit();
}

function deleteArticle(id) {
if (!confirm('Supprimer cet article ?')) return;
saveArticles(getArticles().filter(a => a.id !== id));
renderAdminArticles();
renderBlog();
showToast('Article supprimé.');
}

function changePw() {
const np = document.getElementById('new-pw').value;
const cp = document.getElementById('confirm-pw').value;
if (!np) { showToast('Entrez un mot de passe.', 'error'); return; }
if (np !== cp) { showToast('Les mots de passe ne correspondent pas.', 'error'); return; }
localStorage.setItem(ADMIN_PW_KEY, np);
document.getElementById('new-pw').value = '';
document.getElementById('confirm-pw').value = '';
showToast('Mot de passe mis à jour !');
}

function previewImage(event) {
const file = event.target.files[0];
if (!file) return;
if (file.size > 5 * 1024 * 1024) { showToast('Image trop grande (max 5 Mo).', 'error'); return; }
const reader = new FileReader();
reader.onload = e => {
    const data = e.target.result;
    document.getElementById('art-img-data').value = data;
    const preview = document.getElementById('art-img-preview');
    preview.src = data;
    preview.style.display = 'block';
};
reader.readAsDataURL(file);
}

function updatePreview() {
const md = document.getElementById('art-content').value;
document.getElementById('art-preview').innerHTML = md ? marked.parse(md) : '<em style="color:var(--gris)">L\'aperçu s\'affiche ici…</em>';
}

function renderBlog() {
const articles = getArticles();
const grid = document.getElementById('blog-grid');
if (articles.length === 0) {
    grid.innerHTML = `<div class="blog-empty">
    <i class="fa fa-pen-nib" style="font-size:1.5rem;color:var(--or);display:block;margin-bottom:1rem;"></i>
    Aucun article pour le moment.<br>
    <span style="font-size:0.8rem;">Connectez-vous à l'administration pour publier votre premier article.</span>
    </div>`;
    return;
}
grid.innerHTML = articles.map(a => `
    <div class="blog-card" onclick="readArticle('${a.id}')">
    ${a.image
        ? `<img src="${a.image}" alt="${escHtml(a.title)}" class="blog-card-img">`
        : `<div class="blog-card-img-placeholder">É</div>`}
    <div class="blog-card-body">
        <p class="blog-card-date">${formatDate(a.date)}</p>
        <h3 class="blog-card-title">${escHtml(a.title)}</h3>
        <p class="blog-card-excerpt">${extractExcerpt(a.content)}</p>
    </div>
    </div>
`).join('');
}

function readArticle(id) {
const art = getArticles().find(a => a.id === id);
if (!art) return;
const container = document.getElementById('article-reader-content');
container.innerHTML = `
    <p class="meta">${formatDate(art.date)}</p>
    <h1>${escHtml(art.title)}</h1>
    ${art.image ? `<img src="${art.image}" alt="${escHtml(art.title)}">` : ''}
    <div class="content">${marked.parse(art.content)}</div>
`;
document.getElementById('readerModal').classList.add('open');
}

function extractExcerpt(md) {
const plain = md.replace(/#{1,6}\s?/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n/g, ' ').trim();
return plain.length > 120 ? plain.slice(0, 120) + '…' : plain;
}

function formatDate(iso) {
try {
    return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
} catch { return ''; }
}

function escHtml(str) {
const d = document.createElement('div');
d.textContent = str;
return d.innerHTML;
}

function handleContact(e) {
e.preventDefault();
showToast('Message envoyé, merci !');
e.target.reset();
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
});
});

renderBlog();