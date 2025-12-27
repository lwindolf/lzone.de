// vim: set ts=4 sw=4:

// Simple action dispatcher

/* Usage
   - register a new action handlers with Action.newAction('actionName', handlerFunction)
   - dispatch an action with Action.dispatch('actionName', arg1, arg2, ...)
   - alternatively define <button data-action="actionName"> and the action will be dispatched on click
 */

export class Action {
    // state
    static handlers = {};   // action handlers by action name
    static listener;        // generic listener

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

    /* Allows defining action hotkeys that can be conditional to a location
       hash prefix. Listening is on the parent document.
       
       Hotkey format is <modifiers>-<JS keycode> with modifiers
       being something like "C", "C-A", "C-S". Hotkey examples are
       "C-F1", "S-KeyA", "C-A-ArrowRight".

       keyString         : the hotkey combination to listen for
       action            : name of the action to trigger
       locationHashMatch : an optional suffix to match the current location hash against
       paramCb           : an optional callback function to generate parameters for the action
    */
    static hotkey(keyString, action, locationHashMatch = '/', paramCb = undefined) {
        const modifierList = keyString.split('-');
        const keyCode = modifierList.pop();
        const modifiers = {
            alt: modifierList.includes('A'),
            ctrl: modifierList.includes('C'),
            shift: modifierList.includes('S')
        };
        const handler = (e) => {
            if (window.location.hash.startsWith(locationHashMatch) && 
                e.ctrlKey === modifiers.ctrl && 
                e.altKey === modifiers.alt && 
                e.shiftKey === modifiers.shift && 
                e.code === keyCode) {
                e.preventDefault();

                let params = {};
                if(paramCb)
                    params = paramCb();
                Action.dispatch(action, params);
            }
        };
        document.addEventListener('keydown', handler);
    }

    static dispatch(name, ...args) {
        if(this.handlers[name]) {
            return this.handlers[name](...args);
        } else {
            console.warn(`No handler for action "${name}"`);
        }
    }
}