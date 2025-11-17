// vim: set ts=4 sw=4:

/* Context menu (used for the side bar only) with for actions and data binding */

import { Action } from './Action.js';

/* Usage:
   - pass a element selector (of the container element)
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
    - passing a type will show the option only if the clicked element has that type
    - no nesting for now
    - when calling the action, all data attributes of the clicked elements closest parent
      of class context-node will be passed as argument
*/
export class ContextMenu {
    fresh = false;

    constructor(el, options) {      
        el.addEventListener('contextmenu', (ev) => {
            ev.preventDefault();
            this.createMenu(el, ev, options);
        });

        document.addEventListener('click', () => this.checkRemove(el));
        document.addEventListener('auxclick', () => this.checkRemove(el))
    }

    checkRemove(el) {
        if(!this.fresh)
            el.querySelectorAll('.context-menu').forEach(menu => menu.remove());
        else
            this.fresh = false;
    }

    createMenu(el, ev, options) {
        // remove any existing menu
        this.checkRemove(el);

        // only open when there is a parent element with class context-node
        const parent = ev.target.closest('.context-node');
        if(!parent)
            return;

        this.fresh = true;
        this.menu = document.createElement('div');
        this.menu.className = 'context-menu';
        options.forEach(item => {
                if(item.type && parent.dataset['type'] !== item.type)
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