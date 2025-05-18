// vim: set ts=4 sw=4:

// Date to epoch conversion
// Epoch to localized string

class DateParser {
    /**
     * Parse a given string (can be null)
     *
     * Will return undefined or the number of epoch seconds
     */
    static parse(str) {
            if(!str)
                    return undefined;

            // For now we rely solely on the browser RFC-822 + ISO8601 parsing support
            return new Date(str)?.getTime() / 1000;
    }


    // pretty print date from epoch
    static getShortDateStr(time) {
        return new Intl.DateTimeFormat(
            'en-GB',
            {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'GMT'
            }
        ).format(time*1000)
    }

}

export { DateParser };