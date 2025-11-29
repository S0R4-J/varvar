const DB_KEY = 'ds_wiki_data';

const app = {
    data: [],
    
    init() {
        // Инициализация БД
        if (typeof initDatabase === 'function') initDatabase();
        this.loadData();
        this.render(this.data);
        this.setupTheme();
        this.animatePetals();
        this.updateStats();
    },

    loadData() {
        const raw = localStorage.getItem(DB_KEY);
        this.data = raw ? JSON.parse(raw) : [];
    },

    saveData() {
        localStorage.setItem(DB_KEY, JSON.stringify(this.data));
        this.render(this.data);
        this.updateStats();
    },

    resetDB() {
        if(confirm('Сбросить базу данных до исходного состояния? Все ваши изменения будут потеряны.')) {
            localStorage.removeItem(DB_KEY);
            location.reload();
        }
    },

    // Рендеринг
    render(items) {
        const grid = document.getElementById('card-grid');
        grid.innerHTML = '';

        if (items.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-sec); margin-top:20px;">Ничего не найдено...</div>';
            return;
        }

        items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.animationDelay = `${Math.min(index * 0.05, 1)}s`; // Лимит задержки
            card.onclick = () => this.openModal(item.id);

            let typeIcon = '📦';
            if(item.type === 'character') typeIcon = '👤';
            if(item.type === 'monster') typeIcon = '🐲';
            if(item.type === 'essence') typeIcon = '💎';

            card.innerHTML = `
                <div class="card-header">
                    <img src="${item.img || 'https://via.placeholder.com/60'}" class="card-avatar" alt="${item.name}" onerror="this.src='https://via.placeholder.com/60'">
                    <div class="card-info">
                        <h3>${item.name} <span class="blue-emoji">${typeIcon}</span></h3>
                        <span>${item.subtitle}</span>
                    </div>
                </div>
                <div class="card-desc">${item.desc}</div>
            `;
            grid.appendChild(card);
        });
    },

    // Фильтры и Поиск
    filter(type) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        
        if (type === 'all') {
            this.render(this.data);
        } else {
            this.render(this.data.filter(i => i.type === type));
        }
    },

    search() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const filtered = this.data.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.desc.toLowerCase().includes(query) ||
            item.subtitle.toLowerCase().includes(query)
        );
        this.render(filtered);
    },

    // Модальное окно
    currentId: null,

    openModal(id) {
        const item = this.data.find(i => i.id === id);
        this.currentId = id;
        const modal = document.getElementById('modal-overlay');
        
        // Заполнение
        document.getElementById('m-img').src = item.img || 'https://via.placeholder.com/150';
        document.getElementById('m-img-input').value = item.img || '';
        document.getElementById('m-name').innerText = item.name;
        document.getElementById('m-subtitle').innerText = item.subtitle;
        document.getElementById('m-desc').innerText = item.desc;
        document.getElementById('m-status').innerText = item.status || 'Активен';

        // Детали
        const detailsContainer = document.getElementById('m-details');
        detailsContainer.innerHTML = '';
        if(item.details) {
            Object.entries(item.details).forEach(([key, val]) => {
                this.addDetailField(key, val);
            });
        }

        this.toggleEditMode(false); // Всегда открывать в режиме просмотра
        modal.classList.add('active');
    },

    openAddModal() {
        this.currentId = 'new_' + Date.now();
        const modal = document.getElementById('modal-overlay');
        
        // Очистка
        document.getElementById('m-img').src = 'https://via.placeholder.com/150?text=New';
        document.getElementById('m-img-input').value = '';
        document.getElementById('m-name').innerText = 'Новое Имя';
        document.getElementById('m-subtitle').innerText = 'Тип / Ранг';
        document.getElementById('m-desc').innerText = 'Описание...';
        document.getElementById('m-status').innerText = 'Активен';
        document.getElementById('m-details').innerHTML = '';

        this.toggleEditMode(true); // Сразу режим редактирования
        modal.classList.add('active');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    },

    // Редактирование
    toggleEditMode(forceState) {
        const card = document.querySelector('.modal-card');
        const isEditing = forceState !== undefined ? forceState : !card.classList.contains('is-editing');
        
        const contentEditableElements = ['m-name', 'm-subtitle', 'm-desc', 'm-status'];
        
        if (isEditing) {
            card.classList.add('is-editing');
            contentEditableElements.forEach(id => document.getElementById(id).contentEditable = "true");
            document.getElementById('m-img-input').classList.remove('hidden');
            document.getElementById('btn-edit').classList.add('hidden');
            document.getElementById('btn-save').classList.remove('hidden');
            document.getElementById('btn-delete').classList.remove('hidden');
            document.getElementById('add-detail-btn').classList.remove('hidden');
            
            // Делаем детали редактируемыми
            document.querySelectorAll('.detail-key, .detail-val').forEach(el => el.contentEditable = "true");
        } else {
            card.classList.remove('is-editing');
            contentEditableElements.forEach(id => document.getElementById(id).contentEditable = "false");
            document.getElementById('m-img-input').classList.add('hidden');
            document.getElementById('btn-edit').classList.remove('hidden');
            document.getElementById('btn-save').classList.add('hidden');
            document.getElementById('btn-delete').classList.add('hidden');
            document.getElementById('add-detail-btn').classList.add('hidden');
        }
    },

    addDetailField(key = 'Параметр', val = 'Значение') {
        const div = document.createElement('div');
        div.className = 'detail-item';
        div.innerHTML = `
            <b class="detail-key" contenteditable="${document.querySelector('.modal-card').classList.contains('is-editing')}">${key}</b>
            <div class="detail-val" contenteditable="${document.querySelector('.modal-card').classList.contains('is-editing')}">${val}</div>
        `;
        document.getElementById('m-details').appendChild(div);
    },

    saveEntry() {
        const name = document.getElementById('m-name').innerText;
        const subtitle = document.getElementById('m-subtitle').innerText;
        const desc = document.getElementById('m-desc').innerText;
        const status = document.getElementById('m-status').innerText;
        const img = document.getElementById('m-img-input').value || 'https://via.placeholder.com/150';

        // Сбор деталей
        const details = {};
        document.querySelectorAll('.detail-item').forEach(item => {
            const k = item.querySelector('.detail-key').innerText;
            const v = item.querySelector('.detail-val').innerText;
            if(k && v) details[k] = v;
        });

        // Автоопределение типа
        let type = 'item';
        const subLower = subtitle.toLowerCase();
        if(subLower.includes('варвар') || subLower.includes('человек') || subLower.includes('эльф') || subLower.includes('зверолюд') || subLower.includes('маг')) type = 'character';
        else if(subLower.includes('монстр') || subLower.includes('босс')) type = 'monster';
        else if(subLower.includes('эссенция')) type = 'essence';

        const newObj = {
            id: this.currentId,
            type, name, subtitle, desc, status, img, details
        };

        const existingIndex = this.data.findIndex(i => i.id === this.currentId);
        if (existingIndex > -1) {
            this.data[existingIndex] = newObj;
        } else {
            this.data.unshift(newObj);
        }

        this.saveData();
        this.closeModal();
    },

    deleteEntry() {
        if(confirm('Удалить эту запись навсегда?')) {
            this.data = this.data.filter(i => i.id !== this.currentId);
            this.saveData();
            this.closeModal();
        }
    },

    // Темная тема (Yandex style)
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('ds_theme', isDark ? 'dark' : 'light');
    },

    setupTheme() {
        if (localStorage.getItem('ds_theme') === 'dark') {
            document.body.classList.add('dark-mode');
        }
    },

    // Анимация лепестков
    animatePetals() {
        const container = document.getElementById('petals-container');
        const petalCount = 12; // Оптимальное кол-во
        
        // Добавляем стили анимации динамически
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes fall {
                0% { transform: translateY(-10vh) rotate(0deg); }
                100% { transform: translateY(110vh) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        for(let i=0; i<petalCount; i++) {
            const p = document.createElement('div');
            p.className = 'petal';
            p.style.left = Math.random() * 100 + '%';
            p.style.animation = `fall ${8 + Math.random() * 10}s linear infinite`;
            p.style.animationDelay = `-${Math.random() * 10}s`;
            const size = 5 + Math.random() * 10;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            container.appendChild(p);
        }
    },
    
    updateStats() {
        const count = this.data.length;
        const bar = document.getElementById('stats-bar');
        if(bar) bar.innerHTML = `База данных: <b>${count}</b> записей (Обновлено: Глава 172)`;
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());