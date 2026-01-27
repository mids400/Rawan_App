const dataManager = new DataManager();
const contentArea = document.getElementById('content-area');
const sidebar = document.querySelector('.sidebar');

const app = {
    pendingConfirmAction: null,
    isAuthenticated: false,

    init: function () {
        this.loadTheme();
        this.checkAuth();
        this.setupNavigation();

        // Initialize DataManager with a callback to render when data changes
        dataManager.init(() => {
            console.log("App: Data updated, re-rendering...");
            // Only re-render if we are on a page that needs it
            const activePage = document.querySelector('.nav-link.active')?.dataset.view || 'dashboard';

            // Smart Re-render
            if (activePage === 'dashboard') this.renderDashboard();
            if (activePage === 'clients') this.renderClientsPage();

            // If viewing a specific client, refresh that view? 
            // For now, let's keep it simple. If deep inside a form, re-rendering might lose input.
            // Ideally we check if we are just "viewing" or "editing".
        });

        // Mobile Sidebar Toggle Listener
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const toggle = document.querySelector('.mobile-menu-toggle');

            // If click is on toggle, handle it
            if (toggle && toggle.contains(e.target)) {
                sidebar.classList.toggle('active');
            }
            // If click is outside sidebar and sidebar is open, close it
            else if (sidebar && sidebar.classList.contains('active') && !sidebar.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    },

    loadTheme: function () {
        const savedTheme = dataManager.getTheme();
        document.body.className = savedTheme;
    },

    checkAuth: function () {
        const session = sessionStorage.getItem('rawan_auth');
        if (session === 'true') {
            this.isAuthenticated = true;
            sidebar.style.display = 'flex';
            document.body.classList.add('logged-in'); // Enable Mobile Menu
            this.navigate('dashboard');
        } else {
            this.isAuthenticated = false;
            this.showLogin();
        }
    },

    showLogin: function () {
        sidebar.style.display = 'none';
        document.body.classList.remove('logged-in'); // Disable Mobile Menu
        contentArea.innerHTML = Views.login();
    },

    handleLogin: function (e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        if (formData.get('username') === 'admin' && formData.get('password') === '123456') {
            sessionStorage.setItem('rawan_auth', 'true');
            this.isAuthenticated = true;
            sidebar.style.display = 'flex';
            document.body.classList.add('logged-in'); // Enable Mobile Menu
            this.navigate('dashboard');
        } else {
            alert('خطأ في المعلومات');
        }
    },

    logout: function () {
        sessionStorage.removeItem('rawan_auth');
        this.isAuthenticated = false;
        this.showLogin();
    },

    setupNavigation: function () {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.view; // Fixed: match HTML data-view
                this.navigate(page);

                // Auto-close sidebar on mobile
                if (sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            });
        });
    },

    navigate: function (pageId, param = null) {
        if (!this.isAuthenticated) return;

        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.remove('active');
            if (l.dataset.view === pageId) l.classList.add('active'); // Fixed: match HTML data-view
        });

        switch (pageId) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'clients':
                this.renderClientsPage();
                break;
            case 'add-client':
                contentArea.innerHTML = Views.clientForm();
                break;
            case 'edit-client':
                const clientToEdit = dataManager.getClientById(param);
                if (clientToEdit) contentArea.innerHTML = Views.clientForm(clientToEdit);
                break;
            case 'client':
                this.viewClient(param);
                break;
            case 'settings':
                contentArea.innerHTML = Views.settings();
                break;
            default:
                this.renderDashboard();
        }
    },

    renderDashboard: function () {
        const clients = dataManager.getClients();
        // Dashboard shows only recent 5 clients
        const recentClients = clients.slice(-5).reverse(); // Clone and reverse for recency
        contentArea.innerHTML = Views.dashboard(recentClients);
    },

    renderClientsPage: function () {
        const clients = dataManager.getClients();
        contentArea.innerHTML = Views.clientsPage(clients);
    },

    viewClient: function (clientId) {
        const client = dataManager.getClientById(clientId);
        if (!client) { this.navigate('dashboard'); return; }
        contentArea.innerHTML = Views.clientDetail(client);
    },

    handleClientSubmit: function (e, clientId) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const clientData = {
            name: formData.get('name'),
            age: formData.get('age'),
            height: formData.get('height'),
            currentWeight: Number(formData.get('currentWeight')),
            targetWeight: formData.get('targetWeight'),
            status: formData.get('status'),
            notes: formData.get('notes')
        };

        if (clientId) {
            clientData.id = clientId;
            dataManager.updateClient(clientData);
            this.showToast('تم التحديث');
            this.viewClient(clientId);
        } else {
            clientData.joinDate = new Date().toISOString().split('T')[0];
            clientData.startWeight = clientData.currentWeight;
            dataManager.addClient(clientData);
            this.showToast('تم الإضافة');
            this.navigate('dashboard');
        }
    },

    deleteClient: function (clientId) {
        dataManager.deleteClient(clientId);
        this.showToast('تم حذف المشترك');
        this.navigate('dashboard');
    },

    confirmAction: function (message, callback) {
        this.pendingConfirmAction = callback;
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.body.appendChild(modalContainer);
        }
        modalContainer.innerHTML = Views.modal(message, 1);
    },

    executeConfirm: function (actionIdx) {
        if (this.pendingConfirmAction) {
            this.pendingConfirmAction();
            this.pendingConfirmAction = null;
        }
        this.closeModal();
    },

    closeModal: function () {
        const el = document.getElementById('custom-modal');
        if (el) el.remove();
    },

    toggleStatus: function (clientId) {
        dataManager.toggleStatus(clientId);
        this.viewClient(clientId);
    },

    // --- Schedule Logic ---
    enableScheduleEdit: function (clientId) {
        document.querySelectorAll('.schedule-input').forEach(input => {
            input.removeAttribute('readonly');
            input.style.backgroundColor = 'white';
            input.style.border = '1px solid var(--primary-300)';
        });
        document.getElementById('edit-schedule-btn').style.display = 'none';
        document.getElementById('save-schedule-actions').style.display = 'flex';
    },

    cancelScheduleEdit: function (clientId) {
        this.viewClient(clientId); // Easy reset
    },

    saveSchedule: function (clientId) {
        const form = document.getElementById('schedule-form');
        const formData = new FormData(form);
        const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

        const newSchedule = days.map((day, index) => ({
            day: day,
            breakfast: formData.get(`breakfast_${index}`),
            lunch: formData.get(`lunch_${index}`),
            dinner: formData.get(`dinner_${index}`),
            workout: formData.get(`workout_${index}`)
        }));

        dataManager.updateSchedule(clientId, newSchedule);
        this.showToast('تم حفظ الجدول');
        this.viewClient(clientId);
    },

    // --- Progress & Images ---
    handleAddProgress: function (e, clientId) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const processLog = (photoBase64 = null) => {
            const logId = formData.get('logId'); // Check if it's edit mode

            const logEntry = {
                id: logId ? Number(logId) : undefined, // Keep existing ID if editing
                date: formData.get('date'),
                weight: Number(formData.get('weight')),
                measurements: {
                    chest: formData.get('chest'),
                    waist: formData.get('waist'),
                    hips: formData.get('hips')
                },
                photo: photoBase64
            };

            if (logId) {
                // UPDATE
                dataManager.updateProgressLog(clientId, logEntry);
                this.showToast('تم تحديث السجل');
            } else {
                // CREATE
                dataManager.addProgressLog(clientId, logEntry);
                this.showToast('تم الحفظ');
            }

            this.viewClient(clientId);
            setTimeout(() => {
                const btn = document.querySelectorAll('.tab-btn')[1];
                if (btn) app.switchTab('progress', btn);
            }, 50);
        };

        const fileInput = formData.get('photo');
        if (fileInput && fileInput.size > 0) {
            const reader = new FileReader();
            reader.onload = function (evt) {
                processLog(evt.target.result);
            };
            reader.readAsDataURL(fileInput);
        } else {
            processLog(null);
        }
    },

    editProgress: function (clientId, logId) {
        const client = dataManager.getClientById(clientId);
        const log = client.progressLogs.find(l => l.id == logId);
        if (!log) return;

        // Show form
        const formContainer = document.getElementById('add-progress-form');
        formContainer.style.display = 'block';

        // Populate fields
        const form = document.getElementById('real-progress-form');
        document.getElementById('progress-log-id').value = log.id;
        form.elements['date'].value = log.date;
        form.elements['weight'].value = log.weight;
        form.elements['chest'].value = log.measurements?.chest || '';
        form.elements['waist'].value = log.measurements?.waist || '';
        form.elements['hips'].value = log.measurements?.hips || '';

        // Update UI Text
        document.getElementById('progress-form-title').innerText = 'تعديل السجل';
        document.getElementById('progress-submit-btn').innerText = 'حفظ التغييرات';

        // Scroll to form
        formContainer.scrollIntoView({ behavior: 'smooth' });
    },

    resetProgressForm: function () {
        const form = document.getElementById('real-progress-form');
        if (form) {
            form.reset();
            document.getElementById('progress-log-id').value = '';
            document.getElementById('progress-form-title').innerText = 'إضافة تحديث جديد';
            document.getElementById('progress-submit-btn').innerText = 'حفظ التحديث';
            form.elements['date'].value = new Date().toISOString().split('T')[0];
        }
    },

    deleteProgress: function (clientId, logId) {
        dataManager.deleteProgressLog(clientId, logId);
        this.showToast('تم الحذف');
        this.viewClient(clientId);
        setTimeout(() => {
            const btn = document.querySelectorAll('.tab-btn')[1];
            if (btn) app.switchTab('progress', btn);
        }, 50);
    },

    viewImage: function (src) {
        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.body.appendChild(modalContainer);
        }
        modalContainer.innerHTML = Views.imageModal(src);
    },

    resetSystem: function () {
        localStorage.removeItem(dataManager.STORAGE_KEY);
        location.reload();
    },

    switchTab: function (tabId, btnElement) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        btnElement.classList.add('active');
    },

    showToast: function (msg) {
        console.log(msg);
    },

    // --- Backup & Profile ---
    exportBackup: function () {
        // Use dataManager.getClients() which has the latest Cloud data
        const clients = dataManager.getClients();
        const settings = {
            theme: dataManager.getTheme()
        };

        const backupData = {
            clients: clients,
            userSettings: settings,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RawanDiet_CloudBackup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.showToast('تم تصدير النسخة الاحتياطية من السحابة');
    },

    importBackup: function (input) {
        if (!input.files || !input.files[0]) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = async function (e) {
            try {
                const data = JSON.parse(e.target.result);

                // normalize data
                let clientsToImport = [];
                if (Array.isArray(data)) {
                    clientsToImport = data;
                } else if (data && data.clients && Array.isArray(data.clients)) {
                    clientsToImport = data.clients;
                }

                if (clientsToImport.length > 0) {
                    if (confirm(`تم العثور على ${clientsToImport.length} مشترك. هل تريد رفعهم إلى قاعدة البيانات السحابية؟ (قد يستغرق وقتاً)`)) {
                        app.showToast('جاري الرفع... يرجى الانتظار');

                        let successCount = 0;
                        for (const client of clientsToImport) {
                            // Clean up ID to ensure new cloud ID is generated or handle conflict?
                            // Safest is to treat as new entry or update if ID matches? 
                            // Firestore add() generates new ID. let's force new IDs to avoid conflicts with string/number mismatch
                            // BUT if we want to preserve history, maybe check naming?
                            // Let's just Add them.

                            // Remove the old ID to let Firebase generate a new string ID
                            const { id, ...clientData } = client;

                            // Add to Firebase
                            const success = await dataManager.addClient(clientData);
                            if (success) successCount++;
                        }

                        alert(`تم استيراد ورفع ${successCount} مشترك بنجاح!`);
                    }
                } else {
                    alert('لا توجد بيانات مشتركين في الملف');
                }
            } catch (err) {
                console.error(err);
                alert('خطأ في الملف: ' + err.message);
            }
        };
        reader.readAsText(file);
    },

    showUserProfile: function () {
        const modalHtml = Views.userProfileModal();
        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div.firstElementChild);
    },

    // Custom Input Modal Logic
    pendingInputCallback: null,

    openCustomInput: function (title, label, value, callback) {
        this.pendingInputCallback = callback;
        const modalHtml = Views.inputModal(title, label, value);
        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div.firstElementChild);
        document.getElementById('user-profile-modal').remove(); // Close profile
    },

    submitInputModal: function () {
        const val = document.getElementById('modal-input-field').value;
        if (this.pendingInputCallback) {
            this.pendingInputCallback(val);
        }
        document.getElementById('input-modal').remove();
        this.pendingInputCallback = null;
    },

    changeName: function (newName) {
        if (newName && newName.trim()) {
            localStorage.setItem('rawan_admin_name', newName.trim());
            this.showToast('تم تغيير الاسم');
            // Update UI
            document.querySelectorAll('.admin-name').forEach(el => el.innerText = newName.trim());
        }
    },

    changePassword: function (newPass) {
        if (newPass && newPass.trim()) {
            localStorage.setItem('rawan_admin_pass', newPass.trim());
            this.showToast('تم تغيير كلمة المرور');
        }
    }
};

window.app = app;

window.setTheme = (theme) => {
    document.body.className = theme;
    dataManager.setTheme(theme);
};

document.addEventListener('DOMContentLoaded', () => app.init());
