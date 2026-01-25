class DataManager {
    constructor() {
        this.STORAGE_KEY = 'rawan_diet_data_v2'; // Bumped version to ensure clean slate for new structure if needed
        this.data = this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return this.getInitialData();
    }

    saveData() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }

    getInitialData() {
        const defaultSchedule = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => ({
            day: day,
            breakfast: 'شوفان بالحليب والموز',
            lunch: 'صدر دجاج مشوي 150غ',
            dinner: 'سلطة تونة',
            workout: 'كارديو 45 دقيقة'
        }));

        return {
            clients: [
                {
                    id: 1,
                    name: 'سارة محمد',
                    joinDate: '2024-01-10',
                    currentWeight: 75,
                    startWeight: 85,
                    height: 165,
                    age: 28,
                    targetWeight: 65,
                    status: 'active',
                    notes: 'حساسية من اللاكتوز',
                    progressLogs: [],
                    schedule: defaultSchedule
                },
                {
                    id: 2,
                    name: 'خالد عمر',
                    joinDate: '2024-01-12',
                    currentWeight: 92,
                    startWeight: 95,
                    height: 180,
                    age: 32,
                    targetWeight: 85,
                    status: 'active',
                    notes: '',
                    progressLogs: [],
                    schedule: defaultSchedule
                }
            ],
            userSettings: {
                theme: 'theme-orange'
            }
        };
    }

    getClients() {
        return this.data.clients;
    }

    getClientById(id) {
        return this.data.clients.find(c => c.id == id);
    }

    addClient(client) {
        client.id = Date.now();
        client.progressLogs = [];
        // Assign default schedule if not present
        if (!client.schedule) {
            client.schedule = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => ({
                day: day,
                breakfast: '',
                lunch: '',
                dinner: '',
                workout: ''
            }));
        }
        this.data.clients.push(client);
        this.saveData();
    }

    updateClient(updatedClient) {
        const index = this.data.clients.findIndex(c => c.id == updatedClient.id);
        if (index !== -1) {
            // Merge to preserve schedule/logs if not passed
            this.data.clients[index] = { ...this.data.clients[index], ...updatedClient };
            this.saveData();
        }
    }

    deleteClient(id) {
        this.data.clients = this.data.clients.filter(c => c.id != id);
        this.saveData();
    }

    toggleStatus(clientId) {
        const client = this.getClientById(clientId);
        if (client) {
            client.status = client.status === 'active' ? 'inactive' : 'active';
            this.saveData();
        }
    }

    updateSchedule(clientId, newSchedule) {
        const client = this.getClientById(clientId);
        if (client) {
            client.schedule = newSchedule;
            this.saveData();
        }
    }

    addProgressLog(clientId, logEntry) {
        const client = this.getClientById(clientId);
        if (client) {
            logEntry.id = Date.now(); // Unique ID for delete
            // logEntry: { date: '...', weight: 80, measurements: '...', notes: '...' }
            client.progressLogs.push(logEntry);
            client.currentWeight = logEntry.weight; // Update main current weight
            this.saveData();
        }
    }

    updateProgressLog(clientId, updatedLog) {
        const client = this.getClientById(clientId);
        if (client) {
            const index = client.progressLogs.findIndex(l => l.id == updatedLog.id);
            if (index !== -1) {
                // Keep existing photo if not replaced
                if (!updatedLog.photo && client.progressLogs[index].photo) {
                    updatedLog.photo = client.progressLogs[index].photo;
                }
                client.progressLogs[index] = updatedLog;

                // Update current weight if this is the latest log
                // Simple logic: just check if it's the last one in the array or re-sort? 
                // For now, let's assume last added is current, but editing might change dates.
                // Let's just update currentWeight if it's the most recent by date.
                const sortedLogs = [...client.progressLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
                if (sortedLogs.length > 0) {
                    client.currentWeight = sortedLogs[0].weight;
                }

                this.saveData();
            }
        }
    }

    deleteProgressLog(clientId, logId) {
        const client = this.getClientById(clientId);
        if (client) {
            client.progressLogs = client.progressLogs.filter(log => log.id != logId);
            this.saveData();
        }
    }

    getTheme() {
        return this.data.userSettings.theme;
    }

    setTheme(themeName) {
        this.data.userSettings.theme = themeName;
        this.saveData();
    }
}
