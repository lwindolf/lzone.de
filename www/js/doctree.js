// vim: set ts=4 sw=4:

/* helper to convert children path list to a tree */

let splitter = /^((?<parent_id>.+):::)?(?<name>[^:]+)$/;

// Takes a section object + name and creates a tree from it
function buildTree(s, name) {
    let tree = {
        name,
        runbook : s.runbook,
        url     : s.url,
        author  : s.author,
        license : s.license,
        homepage: s.homepage,
        nodes: {},
        children: []
    };

    // Add documents to parent nodes. Creates missing parents.
    //
    // @pId     parent id (can be null for root)
    // @cId     child id
    function addToParent(pId, cId) {  
        if(!pId) {
            tree.children.push(cId);
            return;
        }

        let m = pId.match(splitter);
        if(!m)
            return;

        if(!tree.nodes[pId])
            tree.nodes[pId] = { id: pId, name: m.groups.name, parent_id: m.groups.parent_id || null, children: [] };
        if(!tree.nodes[pId].children)
            tree.nodes[pId].children = [];
        if(!tree.nodes[pId].children.includes(cId))
            tree.nodes[pId].children.push(cId);

        if(m.groups.parent_id)
            addToParent(m.groups.parent_id, pId);
        else if(!tree.children.includes(pId))
            tree.children.push(pId);
    }

    // Create a linked list
    s.children.sort().map((id) => {
        let p = id.split(':::');
        let name = p[p.length - 1] || id;
        p.pop();
        let parent_id = p.length > 0 ? p.join(':::') : null;
        tree.nodes[id] = { id, name, parent_id };
        addToParent(parent_id, id);
    });

    // Reduce single leaves (1 pass only, so only one level)
    s.children.sort()
    .filter((id) => {
        let node = tree.nodes[id];

        if(!node?.parent_id)
            return false;

        if(tree.nodes[node.parent_id].children.length == 1)
            return true;

        return false;
    })
    .forEach((id) => {
        let node = tree.nodes[id];
        let parent = tree.nodes[node.parent_id];
        let grandparent = tree.nodes[parent?.parent_id] || tree;

        // Reparent the leaf node to it's grand parent
        grandparent.children = grandparent.children.map((id) => {
            if(id == parent.id)
                return node.id;
            return id;
        });

        if (node.name =~ /^(index|README|Readme)$/)
            node.name = parent.name;
        else
            node.name = parent.name + ' / ' + node.name;

        delete tree.nodes[parent.id];
    });

    return tree;
}

export { buildTree };