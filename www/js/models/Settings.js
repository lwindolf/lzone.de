// vim: set ts=4 sw=4:

/* Persistent settings using IndexedDB */

class Settings {
    // state
    static db;
    static values = {};    // value cache

    static async #getDB() {
        if (this.db)
            return this.db;

        await new Promise((resolve, reject) => {
            var s = this;

            var req = indexedDB.open("settings", 1);
            req.onsuccess = function () {
                s.db = this.result;
                resolve();
            };

            req.onerror = function (evt) {
                s.db = undefined;
                reject(`Error opening IndexedDB: ${evt.target.errorCode}`);
            };

            req.onupgradeneeded = function (evt) {
                s.db = evt.currentTarget.result;
                console.log("IndexedDB onupgradeneeded");
                s.db.createObjectStore("settings", { keyPath: 'id', autoIncrement: true });
            };
        });

        return this.db;
    }

    static async getAllKeys() {
        const db = await Settings.#getDB();
        const store = db.transaction("settings", "readonly").objectStore("settings");
        return store.getAllKeys();
    }

    static async get(name, defaultValue = 'null') {
        var db = await Settings.#getDB();

        await new Promise((resolve, reject) => {
            var store = db.transaction("settings", "readonly").objectStore("settings");
            var req = store.get(name);
            req.onsuccess = function (evt) {
                var value;
                if (!evt.target.result || !evt.target.result.value)
                    value = defaultValue;
                else
                    value = evt.target.result.value;

                Settings.values[name] = value;
                resolve(value);
            };
            req.onerror = function (evt) {
                reject(`Error getting setting ${evt.target.errorCode}`);
            };
        });

        return Settings.values[name];
    }

    static async set(name, value, event = true) {
        var db = await Settings.#getDB();

        Settings.values[name] = value;

        await new Promise((resolve, reject) => {
            var store = db.transaction("settings", "readwrite").objectStore("settings");
            try {
                store.put({ id: name, "value": value });
                if (event)
                    document.dispatchEvent(new CustomEvent('settings-changed', { detail: { name, value } }));
                resolve();
            } catch (e) {
                reject(`Error saving setting ${name}: ${e}`);
            }
        });
    }

    static async remove(name) {
        var db = await Settings.#getDB();

        Settings.values[name] = undefined;

        await new Promise((resolve, reject) => {
            var store = db.transaction("settings", "readwrite").objectStore("settings");
            try {
                store.delete(name);
                resolve();
            } catch (e) {
                reject(`Error deleting setting ${name}: ${e}`);
            }
        });
    }
}

window.Settings = Settings;

export { Settings };
