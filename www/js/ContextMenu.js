// vim: set ts=4 sw=4:

/* Context menu (used for the side bar only) with for actions and data binding */

import { Action } from './Action.js';

/* Usage:
   - pass the element id (of the container element)
   - ensure clickable elements have class 'context-node' and data attributes as needed
   - pass an options object like this

        [
            {
                label: 'Option 1',
                action: 'action1'
            },
            {
                label: 'Option 2',
                action: 'action2',
                type: 'folder'
            }
        ]

    Note:
    - passing a type will show the option only if the clicked element has that type in attribute data-type
    - no nesting for now
    - when calling the action, all data attributes of the clicked elements closest parent
      of class context-node will be passed as argument
*/
export class ContextMenu {
    fresh = false;

    // state
    static #listener;
    static #menues = new Map();

    constructor(selector, options) {
        ContextMenu.#menues.set(selector, options);

        if (!ContextMenu.#listener)
            ContextMenu.#listener = document.addEventListener('contextmenu', (ev) => {
                /* find parent with matching id */
                let el = ev.target;
                while (el) {
                    if (el.id && ContextMenu.#menues.has(el.id))
                        break;

                    el = el.parentElement;
                }
                if (el && el.id && ContextMenu.#menues.has(el.id)) {
                    console.log("Context menu opened", ContextMenu.#menues.get(el.id));

                    ev.preventDefault();
                    this.createMenu(el, ev, ContextMenu.#menues.get(el.id));
                }
            });

        document.addEventListener('click', () => this.checkRemove());
        document.addEventListener('auxclick', () => this.checkRemove());
    }

    checkRemove() {
        if (!this.fresh)
            document.querySelectorAll('.context-menu').forEach(menu => menu.remove());
        else
            this.fresh = false;
    }

    createMenu(el, ev, options) {
        // remove any existing menu
        this.checkRemove(el);

        // only open when there is a parent element with class context-node
        const parent = ev.target.closest('.context-node');
        if (!parent)
            return;

        this.fresh = true;
        this.menu = document.createElement('div');
        this.menu.className = 'context-menu';
        options.forEach(item => {
            if (item.type && parent.dataset['type'] !== item.type)
                return;

            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.textContent = item.label;
            menuItem.addEventListener('click', () => Action.dispatch(item.action, parent.dataset));
            this.menu.appendChild(menuItem);
        });

        this.menu.style.setProperty('--mouse-x', ev.pageX + 'px');
        this.menu.style.setProperty('--mouse-y', ev.pageY + 'px');
        this.menu.style.display = 'block';

        el.appendChild(this.menu);
    }

    hide() {
        this.menu.style.display = 'none';
    }
}