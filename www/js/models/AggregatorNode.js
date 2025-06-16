// Class representing a node type in the aggregator content tree
//
// The type name registered with the constructor is used to
// map views and actions to the node type.

export class AggregatorNode {
        constructor(type) {
            this.type = type; // e.g. "Feed", "Folder", "CheatSheet"
        }

        serialize() {
            return {
                type: this.type
            };
        }
}