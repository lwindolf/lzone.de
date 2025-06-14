// vim: set ts=4 sw=4:

import { DB } from '../www/js/models/DB.js';

DB.testDisable = true;  // DB class won't use IndexedDB, but will use a static cache

test('DB.get', async () => {
	expect(await DB.get('feedreader', 'feedlist', 'tree', {}) !== undefined).toBe(true);
	await DB.set('feedreader', 'feedlist', 'tree', { id: '1', title: 'Node 1' });
	expect((await DB.get('feedreader', 'feedlist', 'tree', {})).title).toBe('Node 1');
	await DB.remove('feedreader', 'feedlist', 'tree');
	expect(await DB.get('feedreader', 'feedlist', 'tree', {})).toStrictEqual({});
});

it('DB get on unknown DB', async () =>  {        
    await expect(DB.get('foodreader', 'feedlist', 'tree', {}))
    .rejects
    .toThrowError();
});

test('DB get on different DBs', async () => {
	await DB.set('settings', 'settings', 'switch1', 'on');
	expect(await DB.get('settings', 'settings', 'switch1')).toBe('on');
	expect(await DB.get('feedreader', 'feedlist', 'switch1')).toBe('null');
});