// vim: set ts=4 sw=4:

import * as ev from '../helpers/events.js';

// FIXME: folder must not be a feed reader class, but a aggregator node type

// DAO for folders

export class Folder {
    // state
    id;
    title;
    type = 'folder';
    unreadCount = 0;

    constructor(defaults = {}) {
        Object.keys(defaults).forEach((k) => { this[k] = defaults[k] });
    }

    serialize() {
        return {
            id               : this.id,
            title            : this.title,
            type             : this.type
        };
    }

    updateUnread(count) {
        this.unreadCount += count;
        if (this.unreadCount < 0)
            this.unreadCount = 0;

        console.log("folder updateUnread", this)
        if(this.parent.updateUnreadCount)
            this.parent.updateUnreadCount(count);

        ev.dispatch('nodeUpdated', this);
    }
}