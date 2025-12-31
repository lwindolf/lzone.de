// vim: set ts=4 sw=4:

import { DB } from '../src/js/models/DB.js';

test('DB.get', async () => {
	expect(await DB.get('aggregator', 'tree', 'tree', {}) !== undefined).toBe(true);
	await DB.set('aggregator', 'tree', 'tree', { id: '1', title: 'Node 1' });
	expect((await DB.get('aggregator', 'tree', 'tree', {})).title).toBe('Node 1');
	await DB.remove('aggregator', 'tree', 'tree');
	expect(await DB.get('aggregator', 'tree', 'tree', {})).toStrictEqual({});
});

it('DB get on unknown DB', async () =>  {        
    await expect(DB.get('foodreader', 'tree', 'tree', {}))
    .rejects
    .toThrowError();
});

test('DB get on different DBs', async () => {
	await DB.set('settings', 'settings', 'switch1', 'on');
	expect(await DB.get('settings', 'settings', 'switch1')).toBe('on');
	expect(await DB.get('aggregator', 'tree', 'switch1')).toBe('null');
});