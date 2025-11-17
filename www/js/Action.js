// vim: set ts=4 sw=4:

// Simple action dispatcher

/* Usage
   - register a new action handlers with Action.newAction('actionName', handlerFunction)
   - dispatch an action with Action.dispatch('actionName', arg1, arg2, ...)
   - alternatively define <button data-action="actionName"> and the action will be dispatched on click
 */

export class Action {
    static handlers = {};
    static listener;

    static register(name, handler) {
        this.handlers[name] = handler;

        if(!this.listener)
                this.listener = document.addEventListener('click', (ev) => {
                    const action = ev.target.closest('[data-action]');
                    if(action && ev.target.tagName === 'button') {
                        Action.dispatch(action.dataset.action, action);
                    }
                });
    }

    static dispatch(name, ...args) {
        if(this.handlers[name]) {
            return this.handlers[name](...args);
        } else {
            console.warn(`No handler for action "${name}"`);
        }
    }
}