import * as vscode from 'vscode';
import * as _ from 'lodash';

export class NodeListData {
    public parentNodeList: DocNode[] = [];
    public childrenNodeList: DocNode[] = [];
    public allData: DocNode[] = [];

    public getNodeTree(rawData: any[]) {
        this.allData = [];
        rawData.forEach((item) => {
            this.allData.push(new DocNode(item.id, item.name, item.parent, item.type))
        })
        this.getChildrenNodeList(rawData);
        this.parentNodeList = []
        do {
            this.findFrontParent(this.allData)
            this.childrenNodeList = this.parentNodeList;
            this.parentNodeList = [];
        } while (this.childrenNodeList.length === 1)
        return this.childrenNodeList[0];
    }
    public findFrontParent(allData: DocNode[]) {
        this.childrenNodeList.forEach((child) => {
            if (child.parent === 'root') {
                this.parentNodeList.push(child);
            }
            if (!this.nodeExist(child, this.parentNodeList)) {
                const parent = _.find(allData, { id: child.parent });
                if (parent) {
                    this.parentNodeList.push(new DocNode(child.parent,child.name, parent.parent, parent.type));
                }
            } else {
                const parent = _.find(this.parentNodeList, { id: child.id });
                if (parent) {
                    parent.children.push(child);
                }
            }
        });
    }
    public nodeExist(node: DocNode, nodes: DocNode[]) {
        if (_.find(nodes, { _id: node.id })) {
            return true
        }
        return false;
    }
    public getChildrenNodeList(rawData: DocNode[]) {
        this.childrenNodeList = [];
        rawData.forEach((item) => {
            if (item.type === 'article') {
                this.childrenNodeList.push(item);
            }
        })

    }
}
export class DocNode {
    public id: string;
    public name: string;
    public parent: string;
    public type: string;
    public children: DocNode[] = [];
    constructor(id: string, name: string, parent: string, type: string, children?: DocNode[]) {
        this.id = id;
        this.name = name;
        this.parent = parent;
        this.type = type;
        this.children = children || [];
    }
}