class DataManager {
    constructor() {
        this.db = firebase.firestore();
        this.clients = [];
        this.authData = {
            adminName: localStorage.getItem('rawan_admin_name') || 'المشرف',
            // Simple password check usually done server side, but for this level:
            // We will rely on the local storage for the "session", 
            // but we could store the correct password in Firestore 'settings' collection.
        };
        this.onChangeCallback = null;
    }

    // --- Initialization & Real-time Listener ---
    init(callback) {
        this.onChangeCallback = callback;

        // Listen to 'clients' collection
        this.db.collection('clients').onSnapshot((snapshot) => {
            this.clients = [];
            snapshot.forEach((doc) => {
                let client = doc.data();
                client.id = doc.id; // Map doc ID to client ID
                this.clients.push(client);
            });

            console.log("Data synced from Cloud:", this.clients.length, "clients");
            if (this.onChangeCallback) this.onChangeCallback();
        }, (error) => {
            console.error("Error syncing data: ", error);
            // Fail silently or show toast?
            // alert("خطأ في الاتصال بقاعدة البيانات");
        });
    }

    // --- CRUD Operations ---

    // Clients
    getClients() {
        return this.clients;
    }

    getClientById(id) {
        return this.clients.find(c => c.id == id);
    }

    async addClient(client) {
        try {
            // Ensure schedule exists
            if (!client.schedule || client.schedule.length === 0) {
                client.schedule = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => ({
                    day: day,
                    breakfast: '',
                    lunch: '',
                    dinner: '',
                    workout: ''
                }));
            }

            // Remove 'id' if it was set by date, let Firestore generate it
            const docRef = await this.db.collection('clients').add(client);
            console.log("Client added with ID: ", docRef.id);
            // No need to manually push to this.clients, onSnapshot will handle it.
            return true;
        } catch (e) {
            console.error("Error adding client: ", e);
            alert("خطأ في الحفظ: " + e.message);
            return false;
        }
    }

    async updateClient(updatedClient) {
        try {
            const id = updatedClient.id;
            // Create a clean object without the ID field itself for update
            const { id: _, ...dataToUpdate } = updatedClient;
            await this.db.collection('clients').doc(id).update(dataToUpdate);
        } catch (e) {
            console.error(e);
        }
    }

    // Alias for updateClient to match app.js usage
    async saveClient(client) {
        return this.updateClient(client);
    }

    async deleteClient(id) {
        try {
            await this.db.collection('clients').doc(id).delete();
        } catch (e) {
            console.error(e);
        }
    }

    async toggleStatus(clientId) {
        const client = this.getClientById(clientId);
        if (client) {
            const newStatus = client.status === 'active' ? 'inactive' : 'active';
            await this.db.collection('clients').doc(clientId).update({ status: newStatus });
        }
    }

    // Schedule
    async updateSchedule(clientId, newSchedule) {
        await this.db.collection('clients').doc(clientId).update({ schedule: newSchedule });
    }

    // Progress Logs
    async addProgressLog(clientId, logEntry) {
        const client = this.getClientById(clientId);
        if (client) {
            logEntry.id = Date.now(); // Keep using timestamp for sub-item ID

            // Use arrayUnion to add to the array
            // Note: Update 'currentWeight' as well
            await this.db.collection('clients').doc(clientId).update({
                progressLogs: firebase.firestore.FieldValue.arrayUnion(logEntry),
                currentWeight: logEntry.weight
            });
        }
    }

    async updateProgressLog(clientId, updatedLog) {
        // Firestore array manipulation is hard for updates. 
        // Easiest strategy: Read user, replace array, Write user.
        // Or remove old, add new.
        // We will do Read-Modify-Write since we have 'client' locally.
        const client = this.getClientById(clientId);
        if (client) {
            const index = client.progressLogs.findIndex(l => l.id == updatedLog.id);
            if (index !== -1) {
                // Keep photo logic
                if (!updatedLog.photo && client.progressLogs[index].photo) {
                    updatedLog.photo = client.progressLogs[index].photo;
                }

                const newLogs = [...client.progressLogs];
                newLogs[index] = updatedLog;

                // Sort and get weight
                const sortedLogs = [...newLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
                const newWeight = sortedLogs.length > 0 ? sortedLogs[0].weight : client.currentWeight;

                await this.db.collection('clients').doc(clientId).update({
                    progressLogs: newLogs,
                    currentWeight: newWeight
                });
            }
        }
    }

    async deleteProgressLog(clientId, logId) {
        const client = this.getClientById(clientId);
        if (client) {
            const logToDelete = client.progressLogs.find(l => l.id == logId);
            if (logToDelete) {
                await this.db.collection('clients').doc(clientId).update({
                    progressLogs: firebase.firestore.FieldValue.arrayRemove(logToDelete)
                });
            }
        }
    }

    // Theme (Local is fine for theme?)
    // User requested "Color prefs on device is fine". 
    getTheme() {
        return this.data?.userSettings?.theme || localStorage.getItem('rawan_theme') || 'theme-orange';
    }

    setTheme(themeName) {
        localStorage.setItem('rawan_theme', themeName);
    }
}
