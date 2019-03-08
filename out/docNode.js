"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class NodeListData {
    constructor() {
        this.parentNodeList = [];
        this.childrenNodeList = [];
        this.allData = [];
    }
    findAndAddChildren(rawData) {
        this.allData = [];
        rawData.forEach((item) => {
            this.allData.push(new DocNode(item._id, item.name, item.parent, item.type, item.owner, ''));
        });
        const root = _.find(this.allData, { parent: 'root' });
        if (root) {
            const tree = this.addChildren(root, root.id);
            return tree;
        }
        return root;
    }
    addChildren(root, id) {
        const children = _.filter(this.allData, { parent: root.id });
        if (children.length >= 1) {
            children.forEach((child) => {
                root.children.push(this.addChildren(child, id));
            });
        }
        root.topic = id;
        return root;
    }
}
exports.NodeListData = NodeListData;
class DocNode {
    constructor(id, name, parent, type, owner, topic, children) {
        this.children = [];
        this.id = id;
        this.name = name;
        this.parent = parent;
        this.topic = topic;
        this.type = type;
        this.owner = owner;
        this.children = children || [];
    }
}
exports.DocNode = DocNode;
//# sourceMappingURL=docNode.js.map