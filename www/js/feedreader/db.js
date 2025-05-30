// vim: set ts=4 sw=4:

/* Persistent feed list using IndexedDB */

class DB {
    // state
    static db;
    static values = {};    // value cache for test mode only

    // flags
    static testDisable = false;     // if true no DB actions will be performed (for test code), FIXME: properly mock IndexDB

    static async #getDB() {
        if (this.db)
            return this.db;

        if (this.testDisable) {
            this.db = this;
            return;
        }

        await new Promise((resolve, reject) => {
            let s = this;

            let req = indexedDB.open("feedreader", 1);
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
                s.db.createObjectStore("feedlist", { keyPath: 'id', autoIncrement: true });
            };
        });

        return this.db;
    }

    static async get(storeName, name, defaultValue = 'null') {
        var db = await DB.#getDB();

        if (this.testDisable)
            return DB.values[storeName + "_" + name]?DB.values[storeName + "_" + name]:defaultValue;

        await new Promise((resolve, reject) => {
            var store = db.transaction(storeName, "readonly").objectStore(storeName);
            var req = store.get(name);
            req.onsuccess = function (evt) {
                var value;
                if (!evt.target.result || !evt.target.result.value)
                    value = defaultValue;
                else
                    value = evt.target.result.value;

                DB.values[storeName + "_" + name] = value;
                resolve(value);
            };
            req.onerror = function (evt) {
                reject(`Error getting '${name}' from store '${storeName}' ${evt.target.errorCode}`);
            };
        });

        return DB.values[storeName + "_" + name];
    }

    static async set(storeName, name, value) {
        var db = await DB.#getDB();

        if (this.testDisable) {
            DB.values[storeName + "_" + name] = value;
            return;
        }

        await new Promise((resolve, reject) => {
            var store = db.transaction(storeName, "readwrite").objectStore(storeName);
            try {
                const res = store.put({ id: name, value });
                res.onsuccess = function () {
                    resolve();
                }
                res.onerror = function (evt) {
                    reject(`Error saving '${name}' in store '${storeName}': ${evt.target.errorCode}`);
                }
            } catch (e) {
                reject(`Error saving '${name}' in store '${storeName}': ${e}`);
            }
        });
    }

    static async remove(storeName, name) {
        var db = await DB.#getDB();

        if (this.testDisable) {
            delete DB.values[storeName + "_" + name];
            return;
        }

        await new Promise((resolve, reject) => {
            var store = db.transaction(storeName, "readwrite").objectStore(storeName);
            try {
                store.delete(name);
                resolve();
            } catch (e) {
                reject(`Error deleting '${name}' from store '${storeName}': ${e}`);
            }
        });
    }
}

window.DB = DB;

export { DB };
