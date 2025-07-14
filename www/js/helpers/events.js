// vim: set ts=4 sw=4:

// generic event forwarding with dataset as detail
// allows for optional check condition function to verify the event (e.g. button check)
function forward(eventName, selector, customEventName, condition = undefined) {
	document.addEventListener(eventName, function (e) {
		if (condition && !condition(e))
			return;

		let n = e.target.closest(selector);

		if (n) {
			document.dispatchEvent(new CustomEvent(customEventName, {
				detail: n.dataset
			}));
			e.preventDefault();
		}
	});
}

// generic event callback with dataset as parameter
// allows for optional check condition function to verify the event (e.g. button check)
function connect(eventName, selector, callback, condition = undefined) {
	document.addEventListener(eventName, function (e) {
		if (condition && !condition(e))
			return;

		let n = e.target.closest(selector);

		if (n) {
			callback(n);
			e.preventDefault();
		}
	});
}

function keydown(selector, condition, callback) {
    document.querySelector(selector).addEventListener('keydown', (event) => {
        if(condition(event))
            callback(event);
    });
}

const dispatch = (name, data) => document.dispatchEvent(new CustomEvent(name, { detail: data }));

export { connect, forward, keydown, dispatch };