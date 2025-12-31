// vim: set ts=4 sw=4:

// Simple base class for views featuring:
//
// - rendering Handlebars templates
// - very basic data binding
// - managing view state
// - processing update based on events
//
// Limitations:
//
// - No support for nested views
// - "data" is stored in event container dataset (and should only have ids, use mapper for complex data fetching)
// - Limited event handling capabilities
//
// Usage:
//
//     const view = new View({
//         root     : document.getElementById("someId"),
//         template : "<div>{{content}}</div>",
//         data     : { id: 123 },
//
//         /* optional events to trigger re-rendering, the event details needs to match all fields of the data above exactly */
//         updateEvents : [ "content-update"],
//
//         /* optional events to change the view data trigger re-rendering */
//         dataEvents   : [ "content-set"],
//
//         /* optional data mapping function, only mapped data is used for rendering */
//         mapper   : async (data) => {
//             return {
//                 content: await SomeClass.getContentById(data.id)
//             };
//         }
//     });
//
// which will render the following HTML and keep it up to date:
//
//     <div id="someId">
//         <div class="event-container" data-id="123">
//             <div>Loaded content for id 123</div>
//         </div>
//     </div>

export class View {
    // state
    #template;
    #data;
    #mapper;
    #eventContainer;    // target element for rendering and event binding
    #postRender;

    constructor(options) {
        this.#template = window.Handlebars.compile(options.template);
        this.#data = options.data || {};
        this.#mapper = options.mapper;
        this.#postRender = options.postRender;

        // Create an event listener container for event binding this allows us to 
        // automatically get rid of the event listeners when it is removed from the DOM
        this.#eventContainer = document.createElement('div');
        this.#eventContainer.className = 'event-container';
        options.root.appendChild(this.#eventContainer);

        // Trigger initial render
        this.setData(this.#data);

        // Bind update events
        options.updateEvents?.forEach(eventName => {
            console.log(`View binding to update event ${eventName}`);
            this.#eventContainer.ownerDocument.addEventListener(eventName, (event) => {
                // Check if event details fields match all fields in this.#data
                for (const key in this.#data) {
                    if (event.detail[key]+"" !== this.#data[key]+"") {
                        return;
                    }
                }
                console.log(`View update event ${eventName} received`, event.detail);
                this.#render();
            });
        });

        // Bind data events
        options.dataEvents?.forEach(eventName => {
            console.log(`View binding to data event ${eventName}`);
            this.#eventContainer.ownerDocument.addEventListener(eventName, (event) => {
                this.setData(event.detail);
            });
        });
    }

    async #render() {
        const input = this.#mapper ? await this.#mapper(this.#data) : this.#data;
        const newHTML = this.#template(input, this.#data);
        if (this.#eventContainer.innerHTML !== newHTML) {  // Simple diff
            this.#eventContainer.innerHTML = newHTML;
        }

        if (this.#postRender)
            this.#postRender(this.#data);
    }

    setData(newData) {
        this.#data = { ...this.#data, ...newData };
        console.log(`View new data received`, this.#data);
        
        for(const key in this.#data)
            this.#eventContainer.dataset[key] = this.#data[key];
        this.#render();
    }
}