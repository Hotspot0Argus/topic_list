"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const request = require('request');
const user_1 = require("./user");
const docNode_1 = require("./docNode");
class TopicListProvider {
    constructor(context) {
        this.context = context;
        this.topicsData = [];
        this.myTopicsData = [];
        this.onDidChangeTreeDataEvent = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEvent.event;
    }
    getChildren(element) {
        if (!user_1.user.isSignIn(this.context)) {
            return [
                new docNode_1.DocNode('no_user', '登录', 'root', 'folder')
            ];
        }
        if (!element) {
            return [
                new docNode_1.DocNode('all', '所有专栏', 'root', 'folder')
            ];
        }
        if (element.id === 'all') {
            return this.topicsData;
        }
        else {
            return element.children;
        }
    }
    getTreeItem(element) {
        if (element.id === 'no_user') {
            return {
                label: element.name,
                id: element.id,
                parent: 'root',
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "python123.signIn",
                    title: "登录",
                },
            };
        }
        else if (element.id === 'all' || element.type === 'folder') {
            return {
                label: element.name,
                id: element.id,
                parent: element.parent,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                contextValue: 'folder'
            };
        }
        else if (element.id === 'upload_img') {
            return {
                label: element.name,
                id: element.id,
                parent: element.parent,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "python123.uploadImg",
                    title: "上传图片",
                },
            };
        }
        else if (element.type === 'article') {
            return {
                label: element.name,
                id: element.id,
                parent: element.parent,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                contextValue: 'article'
            };
        }
        return {
            label: 'ERR',
            id: 'ERR',
            parent: 'ERR',
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'ERR'
        };
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            if (user_1.user.isSignIn(this.context)) {
                yield this.getListData();
            }
            else {
                this.topicsData = [];
            }
            this.onDidChangeTreeDataEvent.fire();
        });
    }
    getListData() {
        return __awaiter(this, void 0, void 0, function* () {
            this.topicsData = [];
            const app = this;
            try {
                const topicList = yield this.getInfoFromUri('https://www.python123.io/api/v1/topics/public');
                const topics = JSON.parse(topicList).data;
                const increment = 100 / topics.length;
                yield vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "正在加载 ",
                    cancellable: false
                }, (progress) => __awaiter(this, void 0, void 0, function* () {
                    progress.report({ increment: 0 });
                    for (let topic of topics) {
                        const articleNodes = [];
                        let nodes = yield app.getInfoFromUri('https://www.python123.io/api/v1/topics/' + topic.uri + '/articles');
                        JSON.parse(nodes).data.forEach((node) => {
                            articleNodes.push(new docNode_1.DocNode(node._id, node.title, node.parent, node.type));
                        });
                        articleNodes.push(new docNode_1.DocNode(topic._id, topic.name, 'root', 'folder', []));
                        const treeData = new docNode_1.NodeListData();
                        treeData.getNodeTree(articleNodes);
                        progress.report({
                            increment: increment,
                            message: topic.name
                        });
                        app.topicsData.push(treeData.getNodeTree(articleNodes));
                    }
                    return new Promise(resolve => {
                        resolve();
                    });
                }));
                this.topicsData.push(new docNode_1.DocNode('upload_img', '上传图片', 'root', 'folder'));
                this.topicsData.push(new docNode_1.DocNode('sign_out', '退出登录', 'root', 'folder'));
            }
            catch (err) {
                vscode.window.showErrorMessage(err);
            }
        });
    }
    getInfoFromUri(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this;
            try {
                return new Promise((resolve, reject) => {
                    request.get(uri, (err, request, body) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            if (request.statusCode === 200) {
                                resolve(body);
                            }
                            else if (request.statusCode === 401 && body.message === 'TokenInvalid') {
                                user_1.user.signOut(app.context);
                                reject('登录信息失效');
                                vscode.window.showWarningMessage('登录信息失效,请重新登陆');
                                app.refresh();
                            }
                            resolve(request);
                        }
                    });
                });
            }
            catch (err) {
                return new Promise(() => {
                });
            }
        });
    }
}
exports.TopicListProvider = TopicListProvider;
class myTreeItem {
    constructor() {
        this.label = '';
        this.id = '';
        this.parent = '';
        this.contextValue = '';
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
}
//# sourceMappingURL=topicListProvider.js.map