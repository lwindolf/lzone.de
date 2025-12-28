// Class representing a node type in the content tree
//
// The type name registered with the constructor is used to
// map views and actions to the node type.

export class Node {
    // state
    id;
    parent_id;  // undefined only for "root" node
    type;       // e.g. "Root", "Feed", "Folder", "CheatSheet"
    nodes = []; // child nodes
    properties = {}; // type-specific properties

    constructor(name, id, parent_id, type, properties={}) {
        this.name = name;
        this.id = id;
        this.parent_id = parent_id;
        this.type = type;
        this.properties = properties;
    }

    serialize() {
        return {
            name       : this.name,
            type       : this.type,
            id         : this.id,
            parent_id  : this.parent_id,
            properties : this.properties
        };
    }

    /**
     * Get the location hash link for this node
     * 
     * #/-/feed/<feedId>
     * #/-/folder/<folderId>
     * #/<path>
     */
    getLinks() {
        return [];
    }
}