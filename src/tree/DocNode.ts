import * as _ from 'lodash';

export class NodeListData {
    public parentNodeList: DocNode[] = [];
    public childrenNodeList: DocNode[] = [];
    public allData: DocNode[] = [];

    public findAndAddChildren(rawData: any[]) {
        this.allData = [];
        rawData.forEach((item) => {
            this.allData.push(new DocNode(item._id, item.name, item.parent, item.type, '', item.problem_id + ''));
        });
        const root = _.find(this.allData, { parent: 'root' });
        if (root) {
            const tree = this.addChildren(root, root.id);
            return tree;
        }
        return root;
    }

    public addChildren(root: DocNode, id: string) {
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

export class DocNode {
    public id: string;
    public name: string;
    public parent: string;
    public type: string;
    public topic: string; //topic_id
    public problem: string;
    public children: DocNode[] = [];

    constructor(id: string, name: string, parent: string, type: string, topic: string, problem: string, children?: DocNode[]) {
        this.id = id;
        this.name = name;
        this.parent = parent;
        this.topic = topic;
        this.problem = problem;
        this.type = type;
        this.children = children || [];
    }
}