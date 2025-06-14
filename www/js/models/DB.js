// vim: set ts=4 sw=4:

/* Persistent key value store using IndexedDB */

export class DB {
    // config of DBs and stores that can be used / will be set up
    static #dbConfigs = {
        feedreader: {
            version: 2,
            stores: {
                feedlist : { keyPath: 'id', autoIncrement: true },
                items    : { keyPath: 'id', autoIncrement: true }
            }
        },
        settings: {
            version: 1,
            stores: {
                settings : { keyPath: 'id', autoIncrement: true }
            }
        }
    }

    // state
    static #db = [];       // IndexedDB object by name
    static values = {};    // value cache for test mode only

    // flags
    static testDisable = false;     // if true no DB actions will be performed (for test code), FIXME: properly mock IndexDB

    static async #getDB(name) {
        if(!this.#dbConfigs[name])
            throw new Error(`DB '${name}' not configured`);

        if(this.testDisable)
            return;

        if(this.#db[name])
            return this.#db[name];

        await new Promise((resolve, reject) => {
            let s = this;

            let req = indexedDB.open(name, s.#dbConfigs[name].version);
            req.onsuccess = function () {
                s.#db[name] = this.result;
                resolve();
            };

            req.onerror = function (evt) {
                s.#db = undefined;
                reject(`Error opening IndexedDB: ${evt.target.errorCode}`);
            };

            req.onupgradeneeded = (evt) => {
                const db = s.#db[name] = evt.currentTarget.result;
                console.log("IndexedDB onupgradeneeded");
                Object.keys(this.#dbConfigs[name].stores).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        console.log(`Creating store '${storeName}' in IndexedDB ${name}`);
                        db.createObjectStore(storeName, this.#dbConfigs[name].stores[storeName]);
                    }
                });
            };
        });

        return this.#db[name];
    }

    static async get(dbName, storeName, name, defaultValue = 'null') {
        var db = await this.#getDB(dbName);

        if (this.testDisable)
            return this.values[`${dbName}_${storeName}_${name}`]?this.values[`${dbName}_${storeName}_${name}`]:defaultValue;

        return await new Promise((resolve, reject) => {
            var store = db.transaction(storeName, "readonly").objectStore(storeName);
            var req = store.get(name);
            req.onsuccess = function (evt) {
                var value;
                if (!evt.target.result || !evt.target.result.value)
                    value = defaultValue;
                else
                    value = evt.target.result.value;
                resolve(value);
            };
            req.onerror = function (evt) {
                reject(`Error getting '${name}' from DB '${dbName}' store '${storeName}' ${evt.target.errorCode}`);
            };
        });
    }

    static async set(dbName, storeName, name, value) {
        var db = await this.#getDB(dbName);

        if(this.testDisable) {
            this.values[`${dbName}_${storeName}_${name}`] = value;
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
                    reject(`Error saving '${name}' in DB '${dbName}' store '${storeName}': ${evt.target.errorCode}`);
                }
            } catch (e) {
                reject(`Error saving '${name}' in DB '${dbName}' store '${storeName}': ${e}`);
            }
        });
    }

    static async remove(dbName, storeName, name) {
        var db = await this.#getDB(dbName);

        if(this.testDisable) {
            delete this.values[`${dbName}_${storeName}_${name}`];
            return;
        }

        await new Promise((resolve, reject) => {
            var store = db.transaction(storeName, "readwrite").objectStore(storeName);
            try {
                store.delete(name);
                resolve();
            } catch (e) {
                reject(`Error deleting '${name}' DB '${dbName}' from store '${storeName}': ${e}`);
            }
        });
    }
}