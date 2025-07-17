// vim: set ts=4 sw=4:

/* Persistent key value store using IndexedDB */

export class DB {
    // config of DBs and stores that can be used / will be set up
    static #schema = {
        // generic aggregator DB for all aggregated content
        aggregator: {
            version: 1,
            stores: {
                // stores the node tree (feed, cheat sheets, folders...)
                tree     : { keyPath: 'id', autoIncrement: true },
                // stores all feed reader items
                items    : { keyPath: 'id', autoIncrement: true },
                // cache for favicon data
                favicons : { keyPath: 'id', autoIncrement: true }
            },
            indexes: {
                items : [
                    // feed reader items loading by nodeId
                    { name: 'nodeId', field: 'value.nodeId', params: { unique: false } }
                ]
            }
        },
        settings: {
            version: 1,
            stores: {
                settings : { keyPath: 'id', autoIncrement: true }
            },
            indexes: { }
        }
    }

    // state
    static #db = [];       // IndexedDB object by name
    static values = {};    // value cache for test mode only

    // flags
    static testDisable = false;     // if true no DB actions will be performed (for test code), FIXME: properly mock IndexDB

    static async #getDB(name) {
        if(!this.#schema[name])
            throw new Error(`DB '${name}' not configured`);

        if(this.testDisable)
            return;

        if(this.#db[name])
            return this.#db[name];

        await new Promise((resolve, reject) => {
            let s = this;

            let req = indexedDB.open(name, s.#schema[name].version);
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

                // Create stores if not already existing
                const stores = s.#schema[name].stores;
                Object.keys(stores).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        console.log(`Creating store '${storeName}' in IndexedDB ${name}`);
                        db.createObjectStore(storeName, stores[storeName]);
                    }
                });

                // Create indexes if not already existing
                const indexes = s.#schema[name].indexes;
                Object.keys(indexes).forEach(storeName => {
                    if (db.objectStoreNames.contains(storeName)) {
                        const store = evt.target.transaction.objectStore(storeName);
                        Object.keys(indexes[storeName]).forEach(indexName => {
                            if (!store.indexNames.contains(indexName)) {
                                const i = indexes[storeName][indexName];
                                console.log(`Creating index '${indexName}' in store '${storeName}' of IndexedDB ${name}`);
                                store.createIndex(i.name, i.field, i.params);
                            }
                        });
                    }
                });
            };
        });

        window.DB = this; // make DB accessible globally for debugging
        return this.#db[name];
    }

    static async getByIndexOnly(dbName, storeName, indexName, id) {
        const db = await this.#getDB(dbName);
        return await new Promise((resolve, reject) => {
            const store = db.transaction(storeName, "readonly").objectStore(storeName);
            if (!store.indexNames.contains(indexName)) {
                reject(`Index '${indexName}' does not exist in store '${storeName}'`);
                return;
            }
            const index = store.index(indexName);
            const results = [];
            const cursorRequest = index.openCursor(IDBKeyRange.only(id));
            cursorRequest.onsuccess = (evt) => {
                const cursor = evt.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            cursorRequest.onerror = (evt) => reject(`Error getting '${id}' from DB '${dbName}' store '${storeName}' index '${indexName}': ${evt.target.errorCode}`);
        });
    }

    static async getAllKeys(dbName, storeName) {
        const db = await this.#getDB(dbName);

        if (this.testDisable)
            return Object.keys(this.values).filter(key => key.startsWith(`${dbName}_${storeName}_`)).map(key => key.split('_')[2]);

        return await new Promise((resolve, reject) => {
            const store = db.transaction(storeName, "readonly").objectStore(storeName);
            const req = store.getAllKeys();
            req.onsuccess = function (evt) {
                resolve(evt.target.result);
            };
            req.onerror = function (evt) {
                reject(`Error getting all keys from DB '${dbName}' store '${storeName}': ${evt.target.errorCode}`);
            };
        });
    }

    static async get(dbName, storeName, name, defaultValue = 'null') {
        const db = await this.#getDB(dbName);

        if (this.testDisable)
            return this.values[`${dbName}_${storeName}_${name}`]?this.values[`${dbName}_${storeName}_${name}`]:defaultValue;

        return await new Promise((resolve, reject) => {
            const store = db.transaction(storeName, "readonly").objectStore(storeName);
            const req = store.get(name);
            req.onsuccess = function (evt) {
                let value;
                if (!evt.target.result || evt.target.result.value === undefined || evt.target.result.value === null)
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
        const db = await this.#getDB(dbName);

        if(this.testDisable) {
            this.values[`${dbName}_${storeName}_${name}`] = value;
            return;
        }

        await new Promise((resolve, reject) => {
            const store = db.transaction(storeName, "readwrite").objectStore(storeName);
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
        const db = await this.#getDB(dbName);

        if(this.testDisable) {
            delete this.values[`${dbName}_${storeName}_${name}`];
            return;
        }

        await new Promise((resolve, reject) => {
            const store = db.transaction(storeName, "readwrite").objectStore(storeName);
            try {
                store.delete(name);
                resolve();
            } catch (e) {
                reject(`Error deleting '${name}' DB '${dbName}' from store '${storeName}': ${e}`);
            }
        });
    }
}