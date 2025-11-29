const DB_KEY = 'ds_wiki_data';
const CONFIG_KEY = 'ds_wiki_config';
const USER_KEY = 'ds_wiki_user';

const app = {
    data: [],
    config: { chapter: 172, limit: 100, debug: false },
    user: null, // null, 'user', 'admin'

    init() {
        this.loadConfig();
        this.loadUser();
        this.loadData();
        // Всегда темная тема
        document.body.classList.add('dark-mode');
        this.render(this.data);
        this.initSnowEffect();
    },

    // --- КОНФИГУРАЦИЯ И АДМИНКА ---
    loadConfig() {
        const saved = localStorage.getItem(CONFIG_KEY);
        if (saved) this.config = JSON.parse(saved);
        const chInput = document.getElementById('config-chapter');
        const limInput = document.getElementById('config-limit');
        const debInput = document.getElementById('config-debug');
        if(chInput) chInput.value = this.config.chapter;
        if(limInput) limInput.value = this.config.limit;
        if(debInput) debInput.checked = this.config.debug;
    },

    updateConfig(key, value) {
        if(key === 'debug') value = !!value;
        else value = parseInt(value);
        
        this.config[key] = value;
        localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
        this.render(this.data);
    },

    openAdminPanel() {
        document.getElementById('profile-dropdown').classList.add('hidden');
        document.getElementById('admin-panel-modal').classList.add('active');
    },

    // --- АВТОРИЗАЦИЯ (ЛК) ---
    loadUser() {
        const savedUser = localStorage.getItem(USER_KEY);
        if(savedUser) this.setUser(JSON.parse(savedUser));
    },

    openLoginModal() {
        document.getElementById('profile-dropdown').classList.add('hidden');
        document.getElementById('login-modal').classList.add('active');
    },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;

        if(u === 'admin' && p === '123') {
            this.setUser({ name: 'Администратор', role: 'admin' });
            document.getElementById('login-modal').classList.remove('active');
        } else if(u && p) {
            this.setUser({ name: u, role: 'user' });
            document.getElementById('login-modal').classList.remove('active');
        } else {
            alert('Пожалуйста, введите данные');
        }
    },

    logout() {
        this.user = null;
        localStorage.removeItem(USER_KEY);
        this.updateUIForUser();
        document.getElementById('profile-dropdown').classList.add('hidden');
    },

    setUser(userObj) {
        this.user = userObj;
        localStorage.setItem(USER_KEY, JSON.stringify(userObj));
        this.updateUIForUser();
    },

    updateUIForUser() {
        const userInfo = document.getElementById('user-info');
        const loginLink = document.getElementById('login-link');
        const logoutLink = document.getElementById('logout-link');
        const adminLink = document.getElementById('admin-link');
        const adminElements = document.querySelectorAll('.admin-only');

        if(this.user) {
            userInfo.innerText = `${this.user.name}`;
            loginLink.classList.add('hidden');
            logoutLink.classList.remove('hidden');
            
            if(this.user.role === 'admin') {
                adminLink.classList.remove('hidden');
                adminElements.forEach(el => el.classList.remove('hidden'));
            } else {
                adminLink.classList.add('hidden');
                adminElements.forEach(el => el.classList.add('hidden'));
            }
        } else {
            userInfo.innerText = 'Гость';
            loginLink.classList.remove('hidden');
            logoutLink.classList.add('hidden');
            adminLink.classList.add('hidden');
            adminElements.forEach(el => el.classList.add('hidden'));
        }
    },

    toggleProfileMenu() {
        document.getElementById('profile-dropdown').classList.toggle('hidden');
    },

    // --- ДАННЫЕ И РЕНДЕР ---
    loadData() {
        const raw = localStorage.getItem(DB_KEY);
        this.data = raw ? JSON.parse(raw) : [];
    },

    render(items) {
        const grid = document.getElementById('card-grid');
        grid.innerHTML = '';
        
        let displayItems = items.slice(0, this.config.limit);

        displayItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => this.openModal(item.id);

            let imageContent;
            if(item.img) {
                imageContent = `<img src="${item.img}" class="card-img" alt="${item.name}">`;
            } else {
                const iconClass = this.getFallbackIcon(item.type);
                imageContent = `<div class="card-icon"><i class="${iconClass}"></i></div>`;
            }

            card.innerHTML = `
                <div class="card-header">
                    ${imageContent}
                    <div class="card-title">
                        <h3>${item.name}</h3>
                        <span>${item.subtitle}</span>
                    </div>
                </div>
                <p style="font-size:0.85rem; color:#888; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; line-height:1.4;">
                    ${item.desc}
                </p>
            `;
            grid.appendChild(card);
        });

        document.getElementById('stats-bar').innerText = `DB: ${displayItems.length}/${items.length} (CH ${this.config.chapter})`;
    },

    getFallbackIcon(type) {
        switch(type) {
            case 'character': return 'fa-solid fa-user-ninja';
            case 'monster': return 'fa-solid fa-dragon';
            case 'item': return 'fa-solid fa-khanda';
            case 'essence': return 'fa-regular fa-gem';
            default: return 'fa-solid fa-box';
        }
    },

    // --- ЗАГРУЗКА ФАЙЛОВ ---
    handleImageUpload(input) {
        const file = input.files[0];
        if(!file) return;

        // Ограничение размера (например, 1МБ) для оптимизации
        if(file.size > 1024 * 1024) {
            alert('Файл слишком большой! Макс 1МБ.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Img = e.target.result;
            document.getElementById('m-img').src = base64Img;
            document.getElementById('m-img').style.display = 'block';
            document.getElementById('m-icon-fallback').style.display = 'none';
            this.currentImgData = base64Img; 
        };
        reader.readAsDataURL(file);
    },

    // --- МОДАЛКА ---
    currentId: null,
    currentImgData: null,

    openModal(id) {
        const item = this.data.find(i => i.id === id);
        this.currentId = id;
        this.currentImgData = item.img || null;
        
        const modal = document.getElementById('modal-overlay');
        
        document.getElementById('m-name').innerText = item.name;
        document.getElementById('m-subtitle').innerText = item.subtitle;
        document.getElementById('m-desc').innerText = item.desc;
        document.getElementById('m-status').innerText = item.status || 'Активен';

        const imgEl = document.getElementById('m-img');
        const iconEl = document.getElementById('m-icon-fallback');
        if(item.img) {
            imgEl.src = item.img;
            imgEl.style.display = 'block';
            iconEl.style.display = 'none';
        } else {
            imgEl.style.display = 'none';
            iconEl.style.display = 'flex';
            iconEl.innerHTML = `<i class="${this.getFallbackIcon(item.type)}"></i>`;
        }

        const detailsBox = document.getElementById('m-details');
        detailsBox.innerHTML = '';
        if(item.details) {
            Object.entries(item.details).forEach(([k, v]) => {
                this.addDetailField(k, v);
            });
        }

        this.toggleEditMode(false);
        modal.classList.add('active');
    },

    openAddModal() {
        this.currentId = 'new_' + Date.now();
        this.currentImgData = null;
        const modal = document.getElementById('modal-overlay');
        
        document.getElementById('m-img').style.display = 'none';
        document.getElementById('m-icon-fallback').style.display = 'flex';
        document.getElementById('m-icon-fallback').innerHTML = '<i class="fa-solid fa-plus"></i>';
        
        document.getElementById('m-name').innerText = 'Новое имя';
        document.getElementById('m-subtitle').innerText = 'Тип / Ранг';
        document.getElementById('m-desc').innerText = 'Описание...';
        document.getElementById('m-details').innerHTML = '';

        this.toggleEditMode(true);
        modal.classList.add('active');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

    toggleEditMode(forceState) {
        const modal = document.getElementById('modal-overlay');
        const isEditing = forceState !== undefined ? forceState : !modal.classList.contains('editing');
        
        const contentEditableElements = ['m-name', 'm-subtitle', 'm-desc', 'm-status'];
        
        if(isEditing) {
            modal.classList.add('editing');
            contentEditableElements.forEach(id => document.getElementById(id).contentEditable = "true");
            document.getElementById('btn-edit').classList.add('hidden');
            document.getElementById('btn-save').classList.remove('hidden');
            document.getElementById('btn-delete').classList.remove('hidden');
            document.getElementById('add-detail-btn').classList.remove('hidden');
            document.querySelector('.upload-overlay').classList.remove('hidden');
            
            document.querySelectorAll('.detail-key, .detail-val').forEach(el => el.contentEditable = "true");
        } else {
            modal.classList.remove('editing');
            contentEditableElements.forEach(id => document.getElementById(id).contentEditable = "false");
            document.getElementById('btn-edit').classList.remove('hidden');
            document.getElementById('btn-save').classList.add('hidden');
            document.getElementById('btn-delete').classList.add('hidden');
            document.getElementById('add-detail-btn').classList.add('hidden');
            document.querySelector('.upload-overlay').classList.add('hidden');
        }
    },

    addDetailField(k = 'Параметр', v = 'Значение') {
        const div = document.createElement('div');
        div.className = 'detail-item';
        div.innerHTML = `
            <span class="detail-label detail-key" contenteditable="${document.getElementById('modal-overlay').classList.contains('editing')}">${k}</span>
            <span class="detail-val" contenteditable="${document.getElementById('modal-overlay').classList.contains('editing')}">${v}</span>
        `;
        document.getElementById('m-details').appendChild(div);
    },

    saveEntry() {
        const name = document.getElementById('m-name').innerText;
        const subtitle = document.getElementById('m-subtitle').innerText;
        
        let type = 'item';
        const subLower = subtitle.toLowerCase();
        if(subLower.includes('варвар') || subLower.includes('маг')) type = 'character';
        else if(subLower.includes('монстр') || subLower.includes('босс')) type = 'monster';
        else if(subLower.includes('эссенция')) type = 'essence';

        const details = {};
        document.querySelectorAll('.detail-item').forEach(item => {
            const k = item.querySelector('.detail-key').innerText;
            const v = item.querySelector('.detail-val').innerText;
            if(k) details[k] = v;
        });

        const newItem = {
            id: this.currentId,
            type,
            name,
            subtitle,
            desc: document.getElementById('m-desc').innerText,
            status: document.getElementById('m-status').innerText,
            img: this.currentImgData,
            details
        };

        const idx = this.data.findIndex(i => i.id === this.currentId);
        if(idx > -1) this.data[idx] = newItem;
        else this.data.unshift(newItem);

        localStorage.setItem(DB_KEY, JSON.stringify(this.data));
        this.render(this.data);
        this.closeModal();
    },

    deleteEntry() {
        if(confirm('Удалить запись?')) {
            this.data = this.data.filter(i => i.id !== this.currentId);
            localStorage.setItem(DB_KEY, JSON.stringify(this.data));
            this.render(this.data);
            this.closeModal();
        }
    },

    // --- ОБЩИЕ ---
    // Функция toggleTheme убрана, так как теперь только темная тема
    toggleTheme() {}, 
    setupTheme() {}, // Убрана
    
    filter(type) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        
        if(type === 'all') this.render(this.data);
        else this.render(this.data.filter(i => i.type === type));
    },
    search() {
        const q = document.getElementById('searchInput').value.toLowerCase();
        this.render(this.data.filter(i => i.name.toLowerCase().includes(q)));
    },
    resetDB() {
        if(confirm('Вернуть базу к исходному состоянию?')) {
            localStorage.removeItem(DB_KEY);
            location.reload();
        }
    },

    // --- ЭФФЕКТ СНЕГА (Оптимизированный CSS) ---
    initSnowEffect() {
        const container = document.getElementById('snow-container');
        const snowCount = 50; // Количество снежинок

        for (let i = 0; i < snowCount; i++) {
            const snow = document.createElement('div');
            snow.className = 'snowflake';
            const size = Math.random() * 3 + 1;
            snow.style.width = `${size}px`;
            snow.style.height = `${size}px`;
            snow.style.left = `${Math.random() * 100}%`;
            snow.style.animationDuration = `${Math.random() * 3 + 2}s`;
            snow.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(snow);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());