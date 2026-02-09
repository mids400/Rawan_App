const dataManager = new DataManager();
const contentArea = document.getElementById('content-area');
const sidebar = document.querySelector('.sidebar');

const app = {
    pendingConfirmAction: null,
    isAuthenticated: false,
    quill: null, // Removed
    tinymceInitialized: false,

    // System Tabs State
    currentSystemPageIndex: 0,
    currentZoom: 1, // Default Zoom Level

    adjustZoom: function (delta) {
        let newZoom = this.currentZoom + delta;
        // Clamp between 0.4 and 2.0
        newZoom = Math.min(Math.max(newZoom, 0.4), 2.0);
        this.setZoom(newZoom);
    },

    resetZoom: function () {
        this.setZoom(1);
    },

    setZoom: function (zoomLevel) {
        this.currentZoom = zoomLevel;
        // Update UI Text
        const indicator = document.getElementById('zoom-level-indicator');
        if (indicator) indicator.innerText = Math.round(zoomLevel * 100) + '%';

        // Apply Scale to Wrapper
        const container = document.querySelector('.scalable-content');
        if (container) {
            container.style.transform = `scale(${zoomLevel})`;
            // transform-origin is already set in CSS/HTML style, but good to reinforce if needed.
            // It was set inline in views.js: style="transform-origin:top center;"

            // Adjust margin to prevent overlap if scaled up? 
            // Or just let it flow. The wrapper is flex column.
        }
    },

    init: function () {
        this.loadTheme();
        this.checkAuth();
        this.setupNavigation();

        // State to track current deep view
        this.currentClientId = null;


        // Initialize DataManager with a callback to render when data changes
        dataManager.init(() => {
            console.log("App: Data updated, re-rendering...");

            // SECURITY CHECK: Do not render content if not logged in
            if (!this.isAuthenticated) return;

            // CRITICAL: Preserve Client View if active
            // This prevents redirecting to Dashboard when auto-pagination updates the client data
            if (this.currentClientId) {
                // If we are currently editing a client, stay there and refresh data
                // preserveTab = true (2nd arg)
                this.viewClient(this.currentClientId, true);
                return;
            }

            // Only re-render if we are on a page that needs it
            const activePage = document.querySelector('.nav-link.active')?.dataset.view || 'dashboard';

            // Smart Re-render
            if (activePage === 'dashboard') this.renderDashboard();
            if (activePage === 'clients') this.renderClientsPage();
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
        // Cleanup old keys if any
        localStorage.removeItem('rawan_auth');
        sessionStorage.removeItem('rawan_auth');

        // Check new session key
        const session = sessionStorage.getItem('rawan_app_session');
        if (session === 'true') {
            this.isAuthenticated = true;
            sidebar.style.display = 'flex';
            document.body.classList.add('logged-in');
            this.navigate('dashboard');
        } else {
            this.isAuthenticated = false;
            this.showLogin();
        }
    },

    showLogin: function () {
        sidebar.style.display = 'none';
        document.body.classList.remove('logged-in');
        contentArea.innerHTML = Views.login();
    },

    handleLogin: function (e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        if (formData.get('username') === 'admin' && formData.get('password') === '123456') {
            // Use new key
            sessionStorage.setItem('rawan_app_session', 'true');
            this.isAuthenticated = true;
            sidebar.style.display = 'flex';
            document.body.classList.add('logged-in');
            this.navigate('dashboard');
        } else {
            alert('خطأ في المعلومات');
        }
    },

    logout: function () {
        // 1. Close ALL Modals (Profile, Confirm, etc.)
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());

        // 2. Clear Session
        sessionStorage.removeItem('rawan_app_session');
        this.isAuthenticated = false;

        // 3. Show Login
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
            let targetView = pageId;
            // Map sub-views to main nav items
            if (['client', 'add-client', 'edit-client'].includes(pageId)) {
                targetView = 'clients';
            }
            if (l.dataset.view === targetView) l.classList.add('active');
        });

        // Reset sub-view state unless we are navigating to 'client'
        if (pageId !== 'client' && pageId !== 'edit-client') {
            this.currentClientId = null;
        }

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

    viewClient: function (clientId, preserveTab = false) {
        const client = dataManager.getClientById(clientId);
        console.log("ViewClient:", clientId, "Pages:", client ? (client.systemPages || []).length : 'N/A');
        if (!client) {
            this.currentClientId = null;
            this.navigate('dashboard');
            return;
        }

        this.currentClientId = clientId; // Set current

        // Keep track of active tab if refreshing
        let activeTabId = 'schedule'; // default
        if (preserveTab) {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) activeTabId = activeTab.id;
        }

        // Reset System Page Index unless preserving system tab specifically?
        // Let's reset to 0 to be safe, unless we implement deeper persistence.
        if (!preserveTab || activeTabId !== 'system') {
            this.currentSystemPageIndex = 0;
        }

        contentArea.innerHTML = Views.clientDetail(client);

        // Restore tab
        if (preserveTab) {
            const btn = document.querySelector(`.tab-btn[onclick*="'${activeTabId}'"]`);
            if (btn) this.switchTab(activeTabId, btn);
        }

        // Trigger Progress Bar Animation safely
        setTimeout(() => {
            this.animateProgressBar(client);
        }, 100);
    },

    animateProgressBar: function (client) {
        const bar = document.getElementById('client-progress-bar');
        if (!bar) return;

        const start = parseFloat(client.startWeight) || parseFloat(client.currentWeight) || 0;
        const current = parseFloat(client.currentWeight) || 0;
        const target = parseFloat(client.targetWeight) || 0;

        // Safety check to avoid division by zero or weirdness
        if (start === target) return;

        const totalToLose = start - target;
        const lost = start - current;

        // Logic:
        // If aiming to lose weight (Start > Target):
        //   Percent = (Lost / TotalToLose) * 100
        // If aiming to gain weight (Start < Target):
        //   TotalToGain = Target - Start
        //   Gained = Current - Start
        //   Percent = (Gained / TotalToGain) * 100

        let pct = 0;
        if (Math.abs(totalToLose) > 0.1) {
            // Universal formula works for both gain/loss if signs are consistent
            // Lost/TotalToLose works:
            // Loss: Start 100, Target 80. Total=20. Current 90. Lost=10. 10/20 = 50%.
            // Gain: Start 50, Target 60. Total=-10. Current 55. Lost=-5. -5/-10 = 50%.
            pct = (lost / totalToLose) * 100;
        }

        pct = Math.min(100, Math.max(0, pct));
        bar.style.width = pct + '%';
    },

    handleClientSubmit: function (e, clientId) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const clientData = {
            name: formData.get('name'),
            age: formData.get('age'),
            height: formData.get('height'),
            targetWeight: formData.get('targetWeight'),
            status: formData.get('status'),
            notes: formData.get('notes'),
            startWeight: Number(formData.get('startWeight'))
        };

        if (clientId) {
            // EDIT MODE
            this.currentClientId = clientId; // Force state sync
            clientData.id = clientId;

            dataManager.updateClient(clientData);
            this.showToast('تم التحديث');

            // Stay on the client view
            this.viewClient(clientId, true);
        } else {
            // New Client
            clientData.joinDate = new Date().toISOString().split('T')[0];
            clientData.currentWeight = clientData.startWeight;

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

        // Handle System Tab Initialization
        if (tabId === 'system') {
            // Init TinyMCE
            setTimeout(() => {
                this.initTinyMCE();
            }, 100);
        }
    },

    // --- System / Editor Logic (TinyMCE) ---
    // --- System / Editor Logic --- 
    initTinyMCE: function () {
        // Destroy existing instance to handle re-initialization cleanly if needed? 
        // Or keep it alive and just swap content. 
        // Keeping it alive is better for performance.
        if (tinymce.get('tinymce-editor')) {
            // If already initialized, just set content for current page
            // But we might be re-rendering the whole DOM (tab switch in views.js resets DOM).
            // Views.clientDetail DESTROYS the DOM elements. So TinyMCE instance is likely orphaned.
            // We MUST remove it.
            tinymce.get('tinymce-editor').remove();
        }

        const client = dataManager.getClientById(this.currentClientId);

        // Handle migration: if systemData (old string) exists but no pages, make pages
        let pages = client.systemPages || [];
        if (pages.length === 0 && client.systemData) {
            pages = [{ title: 'الصفحة الرئيسية', content: client.systemData }];
        }
        if (pages.length === 0) {
            pages = [{ title: 'الصفحة 1', content: '' }];
        }

        // Validate index
        if (this.currentSystemPageIndex >= pages.length) {
            this.currentSystemPageIndex = 0;
        }

        // Get content, handling string vs object
        const pageData = pages[this.currentSystemPageIndex];
        const initialContent = (typeof pageData === 'object' && pageData.content !== undefined) ? pageData.content : (typeof pageData === 'string' ? pageData : '');

        tinymce.init({
            selector: '#tinymce-editor',
            height: '1125px', // Exact A4 Height
            language: 'ar',
            menubar: true,
            statusbar: false, /* Hide status bar/resize handle */
            resize: false,    /* Disable resizing */
            plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount pagebreak quickbars',
            toolbar: 'undo redo | blocks | ' +
                'bold italic backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'image | removeformat | pagebreak | help',

            quickbars_insert_toolbar: false,
            quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
            quickbars_image_toolbar: 'alignleft aligncenter alignright | rotateleft rotateright | imageoptions',
            contextmenu: 'link image table',
            image_advtab: true,
            /* Enable Local Image Upload */
            image_title: true,

            image_class_list: [
                { title: 'افتراضي (ضمن النص)', value: 'img-inline' },
                { title: 'مربع - يمين', value: 'img-wrap-right' },
                { title: 'مربع - يسار', value: 'img-wrap-left' },
                { title: 'توسط (أعلى/أسفل)', value: 'img-center' },
                { title: 'حر (متقدم)', value: 'img-absolute' },
                { title: 'أمام النص', value: 'img-front' },
                { title: 'خلف النص (شفاف)', value: 'img-behind' }
            ],

            automatic_uploads: true,
            file_picker_types: 'image',
            file_picker_callback: (cb, value, meta) => {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');

                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = function () {
                        // Note: In a real app we'd upload to server. Here we use Base64.
                        // TinyMCE Blob Cache approach for better performance while editing
                        const id = 'blobid' + (new Date()).getTime();
                        const blobCache = tinymce.activeEditor.editorUpload.blobCache;
                        const base64 = reader.result.split(',')[1];
                        const blobInfo = blobCache.create(id, file, base64);
                        blobCache.add(blobInfo);

                        // Call the callback and populate the Title field with the file name
                        cb(blobInfo.blobUri(), { title: file.name });
                    };
                    reader.readAsDataURL(file);
                });

                input.click();
            },

            content_style: `
                body { font-family: Cairo, sans-serif; font-size: 14pt; line-height: 1.5; margin: 1cm; overflow-x: hidden; }
                /* Auto Direction */
                
                .img-inline { display: inline-block; vertical-align: middle; }
                .img-wrap-right { float: right; margin: 10px 0 10px 20px; clear: right; }
                .img-wrap-left { float: left; margin: 10px 20px 10px 0; clear: left; }
                .img-center { display: block; margin-left: auto; margin-right: auto; clear: both; }
                .img-absolute { position: absolute !important; z-index: 10; }
                .img-front { position: absolute !important; z-index: 20; }
                .img-behind { position: absolute !important; z-index: -1; opacity: 0.6; }
                
                /* Visual Page Break gap */
                .mce-pagebreak { display: block; width: 100%; border: 0; height: 10px; background: #e5e7eb; border-top: 1px dashed #9ca3af; border-bottom: 1px dashed #9ca3af; margin: 20px 0; }
            `,
            setup: (editor) => {
                editor.on('init', () => {
                    editor.setContent(initialContent);
                    editor.getBody().setAttribute('dir', 'auto');

                    // Auto-Focus Logic for Pagination
                    if (app.autoFocusNewPage) {
                        try {
                            editor.focus();
                            // Place cursor at very start
                            editor.selection.setCursorLocation(editor.getBody(), 0);
                        } catch (e) { console.log('Focus error', e); }
                        app.autoFocusNewPage = false;
                    }
                });
                editor.on('KeyUp NodeChange', () => {
                    app.checkForPageOverflow(editor);
                });
            }
        });
    },

    // --- Tabs Management ---

    checkForPageOverflow: function (editor) {
        if (!editor || !editor.getBody()) return;
        if (app.isSplitting) return; // Debounce

        const body = editor.getBody();
        const lastNode = body.lastElementChild || body.lastChild;
        if (!lastNode) return;

        // More robust detection relative to document top
        const contentBottom = lastNode.offsetTop + lastNode.offsetHeight;

        // Strict A4 content limit (1125px total - ~80px margins = ~1045px usable)
        // Trigger BEFORE visual overflow to ensure smooth split
        const MAX_HEIGHT = 960;

        if (contentBottom > MAX_HEIGHT) {
            console.log("Splitting page at contentBottom:", contentBottom);
            app.isSplitting = true;

            // Check if last node is just an empty placeholder or break
            const isEmptyLine = lastNode.nodeName === 'P' && (lastNode.innerHTML === '<br>' || lastNode.innerHTML === '<br data-mce-bogus="1">');

            // Capture overflowing content
            // If empty line, ensure strictly empty paragraph to avoid ghost text issues, but allow split
            let overflowHtml = (lastNode.outerHTML || lastNode.textContent);
            if (isEmptyLine) overflowHtml = '<p><br data-mce-bogus="1"></p>';

            // Remove from current DOM safely
            if (lastNode.parentNode) {
                lastNode.parentNode.removeChild(lastNode);
            }

            // Save modified current page content
            const currentContent = editor.getContent();
            const client = dataManager.getClientById(this.currentClientId);

            // Ensure data structure
            if (!client.systemPages) client.systemPages = [];

            // Update Current Page Object
            if (client.systemPages[this.currentSystemPageIndex]) {
                const page = client.systemPages[this.currentSystemPageIndex];
                if (typeof page === 'object') page.content = currentContent;
                else client.systemPages[this.currentSystemPageIndex] = { title: `صفحة ${this.currentSystemPageIndex + 1}`, content: currentContent };
            }

            // Prepare Next Page
            const nextIndex = this.currentSystemPageIndex + 1;

            if (!client.systemPages[nextIndex]) {
                client.systemPages.push({ title: `صفحة ${nextIndex + 1}`, content: '' });
            }

            let nextPage = client.systemPages[nextIndex];
            if (typeof nextPage === 'string') {
                nextPage = { title: `صفحة ${nextIndex + 1}`, content: nextPage };
                client.systemPages[nextIndex] = nextPage;
            }

            // Prepend overflow content to the next page
            const existingContent = nextPage.content || '';
            nextPage.content = overflowHtml + existingContent;

            // Persist Changes (Important: Update DB to sync state)
            dataManager.updateClient({
                id: client.id,
                systemPages: client.systemPages
            });

            // Move to next page
            this.currentSystemPageIndex = nextIndex;
            app.autoFocusNewPage = true;

            // Re-render UI
            this.viewClient(this.currentClientId, true);

            setTimeout(() => { app.isSplitting = false; }, 1000);
        }
    },

    switchSystemPage: function (newIndex) {
        // 1. Save current editor content to local client object (memory)
        const editor = tinymce.get('tinymce-editor');
        if (editor) {
            const currentContent = editor.getContent();

            const client = dataManager.getClientById(this.currentClientId);
            if (!client.systemPages || client.systemPages.length === 0) {
                // Initialize if missing
                client.systemPages = client.systemData ? [{ title: 'الصفحة الرئيسية', content: client.systemData }] : [{ title: 'الصفحة 1', content: '' }];
            }

            // Normalize current page if string
            let currentPage = client.systemPages[this.currentSystemPageIndex];
            if (typeof currentPage === 'string') {
                client.systemPages[this.currentSystemPageIndex] = { title: `صفحة ${this.currentSystemPageIndex + 1}`, content: currentContent };
            } else {
                currentPage.content = currentContent;
            }

            // 2. Update Index
            this.currentSystemPageIndex = newIndex;

            // 3. Update UI
            // Update Tab Styles
            document.querySelectorAll('.system-tab').forEach((el, idx) => {
                if (idx === newIndex) el.classList.add('active');
                else el.classList.remove('active');
            });

            // Update Header Title
            const newPage = client.systemPages[newIndex];
            const newTitle = (typeof newPage === 'object' && newPage.title) ? newPage.title : (typeof newPage === 'string' ? `صفحة ${newIndex + 1}` : '');
            const titleEl = document.getElementById('current-page-title');
            if (titleEl) titleEl.innerText = newTitle;

            // Update Editor Content
            // Check if target page exists (it should)
            const nextContent = (typeof newPage === 'object' && newPage.content !== undefined) ? newPage.content : (typeof newPage === 'string' ? newPage : '');
            editor.setContent(nextContent);
        }
    },

    addSystemPage: function () {
        // 1. Save current
        const editor = tinymce.get('tinymce-editor');
        if (editor) {
            const currentContent = editor.getContent();
            const client = dataManager.getClientById(this.currentClientId);

            // Migration check
            if (!client.systemPages || client.systemPages.length === 0) {
                client.systemPages = client.systemData ? [{ title: 'الصفحة الرئيسية', content: client.systemData }] : [{ title: 'الصفحة 1', content: '' }];
            }

            // Save current
            let currentPage = client.systemPages[this.currentSystemPageIndex];
            if (typeof currentPage === 'string') {
                client.systemPages[this.currentSystemPageIndex] = { title: `صفحة ${this.currentSystemPageIndex + 1}`, content: currentContent };
            } else {
                currentPage.content = currentContent;
            }

            // 2. Add new empty page object
            client.systemPages.push({
                title: `صفحة ${client.systemPages.length + 1}`,
                content: ''
            });

            // 3. Switch to new page
            this.currentSystemPageIndex = client.systemPages.length - 1;

            // 4. Force Re-render to show new tab in DOM
            this.viewClient(this.currentClientId, true);
        }
    },

    renameSystemPage: function (index) {
        const client = dataManager.getClientById(this.currentClientId);
        const page = client.systemPages[index];
        const currentTitle = (typeof page === 'object' && page.title) ? page.title : `صفحة ${index + 1}`;

        this.openCustomInput('تغيير اسم الصفحة', 'اسم الصفحة الجديد:', currentTitle, (newName) => {
            if (newName && newName.trim()) {
                if (typeof page === 'string') {
                    client.systemPages[index] = { title: newName.trim(), content: page };
                } else {
                    page.title = newName.trim();
                }

                // Save to DB immediately or just update UI?
                // Let's just update UI and wait for manual Save, OR auto-save structure.
                // Better to update memory and re-render.
                this.viewClient(this.currentClientId, true);
            }
        });
    },

    resetSystemPages: function () {
        this.confirmAction('تحذير: هل أنت متأكد من حذف جميع الصفحات والبدء من جديد؟ سيتم فقدان كل المحتوى.', () => {
            const client = dataManager.getClientById(this.currentClientId);
            if (!client) return;

            // Reset to single empty page
            client.systemPages = [{ title: 'الصفحة 1', content: '' }];

            // Save to DB
            dataManager.updateClient({
                id: client.id,
                systemPages: client.systemPages
            });

            // Reset Index
            this.currentSystemPageIndex = 0;

            // Re-render
            this.viewClient(this.currentClientId, true);
            this.showToast('تم تصفير الصفحات بنجاح');
        });
    },

    deleteSystemPage: function (index) {
        this.confirmAction('هل أنت متأكد من حذف هذه الصفحة؟', () => {
            const client = dataManager.getClientById(this.currentClientId);
            if (!client.systemPages) return;

            // Remove page
            client.systemPages.splice(index, 1);

            // If empty, add one back
            if (client.systemPages.length === 0) {
                client.systemPages.push({ title: 'الصفحة 1', content: '' });
            }

            // Adjust index
            if (this.currentSystemPageIndex >= client.systemPages.length) {
                this.currentSystemPageIndex = client.systemPages.length - 1;
            }

            // Re-render
            this.viewClient(this.currentClientId, true);
        });
    },

    saveSystemData: function (clientId) {
        if (!tinymce.get('tinymce-editor')) return;

        // Save current page content first
        const currentContent = tinymce.get('tinymce-editor').getContent();
        const client = dataManager.getClientById(clientId);

        // Ensure migration
        if (!client.systemPages || client.systemPages.length === 0) {
            client.systemPages = client.systemData ? [{ title: 'الصفحة الرئيسية', content: client.systemData }] : [{ title: 'الصفحة 1', content: '' }];
        }

        let currentPage = client.systemPages[this.currentSystemPageIndex];
        if (typeof currentPage === 'string') {
            client.systemPages[this.currentSystemPageIndex] = { title: `صفحة ${this.currentSystemPageIndex + 1}`, content: currentContent };
        } else {
            currentPage.content = currentContent;
        }

        // Save to Firebase
        dataManager.updateClient({
            id: clientId,
            systemPages: client.systemPages,
            // Fallback string
            systemData: client.systemPages.map(p => (typeof p === 'object' ? p.content : p)).join('<br><hr><br>')
        });
        this.showToast('تم حفظ النظام بنجاح');
    },

    insertPageBreak: function () {
        if (!tinymce.get('tinymce-editor')) return;
        tinymce.get('tinymce-editor').insertContent('<div style="page-break-after: always; border-top: 1px dashed #ccc; margin: 20px 0;"></div>');
    },

    exportSystemPDF: function (clientName) {
        // We need to gather content from ALL PAGES, not just the editor.
        // We assume the user clicked Save, OR we grab current state from memory + current editor.

        const editor = tinymce.get('tinymce-editor');
        const client = dataManager.getClientById(this.currentClientId);

        // Ensure migration in memory
        if (!client.systemPages || client.systemPages.length === 0) {
            client.systemPages = client.systemData ? [{ title: 'الصفحة الرئيسية', content: client.systemData }] : [{ title: 'الصفحة 1', content: '' }];
        }

        // Clone to avoid mutation
        let pagesToExport = JSON.parse(JSON.stringify(client.systemPages));

        // Update the CURRENT page in this list with what's currently in the editor
        if (editor) {
            const currentContent = editor.getContent();
            let currentPage = pagesToExport[this.currentSystemPageIndex];
            if (typeof currentPage === 'string') {
                pagesToExport[this.currentSystemPageIndex] = { title: `صفحة ${this.currentSystemPageIndex + 1}`, content: currentContent };
            } else {
                currentPage.content = currentContent;
            }
        }

        // Generate stacked HTML for all pages

        const logoUrl = 'img/company_logo.png';

        // Helper to generate one A4 page HTML
        const generatePageHtml = (page) => {
            // Extract content and title
            const content = (typeof page === 'object' && page.content !== undefined) ? page.content : (typeof page === 'string' ? page : '');
            const title = (typeof page === 'object' && page.title) ? page.title : '';

            return `
                <div class="a4-page">
                    <div class="watermark-overlay"></div>
                    <div class="a4-header">
                        <img src="${logoUrl}" class="header-logo" alt="Logo">
                        
                         <!-- Centered Title -->
                        <div class="header-page-title">${title}</div>
                        
                        <!-- QR Code -->
                        <img src="img/qr_code.png" class="header-qr" alt="Instagram">
                    </div>
                    <div class="content-wrapper">
                        <div class="content-body">
                            ${content}
                        </div>
                    </div>
                </div>
            `;
        };

        const allPagesHtml = pagesToExport.map(p => generatePageHtml(p)).join('');

        const printWindow = window.open('', '_blank', 'width=900,height=1000');

        const fullHtml = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <title>System_${clientName}</title>
                <style>
                    body { margin: 0; background: #ccc; display: flex; flex-direction: column; align-items: center; font-family: 'Cairo', sans-serif; padding: 20px; gap: 20px; }
                    
                    @page { margin: 0; size: A4 portrait; }
                    
                    .a4-page {
                        width: 210mm;
                        /* Safety margin: 296mm avoids browser rounding errors pushing to next page */
                        height: 296mm;
                        background: white; 
                        position: relative;
                        padding: 0;
                        display: flex;
                        flex-direction: column;
                        margin-bottom: 20px; /* Preview gap */
                        overflow: hidden;
                    }
                    .watermark-overlay {
                        position: absolute;
                        top: 50%; left: 50%;
                        transform: translate(-50%, -50%);
                        width: 60%; height: 60%;
                        background-image: url('${logoUrl}');
                        background-repeat: no-repeat;
                        background-position: center;
                        background-size: contain;
                        opacity: 0.08;
                        z-index: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        pointer-events: none;
                    }
                    .a4-header {
                        padding: 1.5cm 2cm 0.5cm 2cm;
                        display: flex; justify-content: space-between; align-items: center;
                        /* border-bottom removed */
                        background: white;
                        z-index: 1;
                        position: relative;
                    }
                    .header-page-title {
                        position: absolute;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 24px;
                        font-weight: 700;
                        color: #166534; /* Green matching theme or primary */
                        text-align: center;
                        max-width: 40%;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        top: auto;
                        bottom: 10px; 
                    }

                    .header-logo { height: 140px; width: auto; }
                    .header-qr { width: 100px; height: 100px; border-radius: 12px; border: 1px solid #eee; }
                    
                    .content-wrapper { padding: 1cm 2cm; flex-grow: 1; position: relative; z-index: 1;}
                    .content-body { direction: rtl; text-align: right; font-family: 'Cairo', sans-serif; font-size: 14pt; line-height: 1.6; }

                    /* Footer Removed */
                    .a4-footer { display: none; }

                    @media print {
                        html, body { 
                            height: auto !important; 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            overflow: visible !important; 
                            background: white; 
                            display: block !important; 
                        }
                        
                        .a4-page { 
                            box-shadow: none; 
                            margin: 0 !important; 
                            padding: 0 !important;
                            width: 100%; 
                            /* Force strict constraint to avoid spillover */
                            height: 296mm !important; 
                            border: none;
                            page-break-after: always; 
                            page-break-inside: avoid;
                            position: relative;
                            overflow: hidden !important;
                            margin-bottom: 0 !important;
                        }
                        .a4-page:last-child {
                             page-break-after: auto !important;
                             margin-bottom: 0 !important;
                        }
                        .watermark-overlay { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
            </head>
            <body>
                ${allPagesHtml}
                <script>
                    window.onload = function() {
                        setTimeout(() => { window.print(); }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(fullHtml);
        printWindow.document.close();
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
