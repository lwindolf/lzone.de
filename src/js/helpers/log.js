// vim: set ts=4 sw=4:

/* Provides trace topic like filtering of console.log + console.warn
   First word of the msg string is considered the topic name and topics
   can be enabled by setting window.app.debug['topic']=true */

const filteredLog = (msg, ...optionalParams) => {
    // If it is not a string it is a data dump, log it directly and always
    if (typeof msg !== 'string') {
        window.originalConsoleLog(msg, ...optionalParams);
        return;
    }

    const topic = msg.split(' ')[0];
    if (window?.app?.debug[topic] || window?.app?.debug['all'])
        window.originalConsoleLog(msg, ...optionalParams);
};
window.originalConsoleLog = window.console.log;
window.console.log = filteredLog;
window.console.info = filteredLog;
window.console.warn = filteredLog;
window.console.debug = filteredLog;