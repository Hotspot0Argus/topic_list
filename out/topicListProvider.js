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
const _ = require("lodash");
const httpRequest_1 = require("./httpRequest");
const setting = require('../resource/setting.json');
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
                new docNode_1.DocNode('no_user', '登录', 'root', 'folder', user_1.user.id(this.context), '')
            ];
        }
        if (!element) {
            return [
                new docNode_1.DocNode('upload_img', '上传图片', 'root', 'folder', user_1.user.id(this.context), ''),
                new docNode_1.DocNode('root', '所有专栏', 'root', 'column', user_1.user.id(this.context), '')
            ];
        }
        if (element.id === 'root') {
            return this.topicsData;
        }
        else {
            return element.children;
        }
    }
    getTreeItem(element) {
        const app = this;
        if (element.id === 'no_user') {
            return {
                label: element.name,
                id: element.id,
                parent: 'root',
                owner: element.owner,
                topic: '',
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "python123.signIn",
                    title: "登录",
                },
            };
        }
        else if (element.id === 'upload_img') {
            return {
                label: element.name,
                id: element.id,
                parent: element.parent,
                owner: element.owner,
                topic: '',
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "python123.uploadImg",
                    title: "上传图片",
                },
            };
        }
        else if (element.type === 'folder' || element.id === 'root') {
            return {
                label: element.name,
                id: element.id,
                parent: element.parent,
                owner: element.owner,
                topic: element.topic,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                contextValue: this.getNodeType(element)
            };
        }
        else if (element.type === 'article') {
            return {
                label: element.name,
                id: element.id,
                parent: element.parent,
                owner: element.owner,
                topic: element.topic,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                contextValue: element.owner.toString() === user_1.user.id(app.context) ? 'article' : 'article&other'
            };
        }
        return {
            label: 'ERR',
            id: 'ERR',
            parent: 'ERR',
            owner: 'ERR',
            topic: 'ERR',
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'ERR'
        };
    }
    getNodeType(element) {
        if (element.id === 'root') {
            return 'root';
        }
        if (element.topic === element.id && element.owner.toString() === user_1.user.id(this.context)) {
            return 'topic';
        }
        if (element.owner.toString() === user_1.user.id(this.context)) {
            return 'folder';
        }
        return 'folder&other';
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
                const result = yield httpRequest_1.httpRequest.get(this.context, setting.uri + 'topics/owned');
                if (result.statusCode === 200) {
                    const topics = JSON.parse(result.body);
                    const topicsList = topics.data;
                    const increment = 100 / topicsList.length;
                    yield vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "正在加载 ",
                        cancellable: false
                    }, (progress) => __awaiter(this, void 0, void 0, function* () {
                        progress.report({ increment: 0 });
                        for (let topic of topicsList) {
                            let result = yield httpRequest_1.httpRequest.get(this.context, setting.uri + 'topics/' + topic.uri + '/articles');
                            if (result.statusCode === 200 && JSON.parse(result.body).data.contents) {
                                const contents = JSON.parse(result.body).data.contents;
                                const articles = JSON.parse(result.body).data.articles;
                                contents.forEach((content) => {
                                    if (content.type === 'article') {
                                        const article = _.find(articles, { _id: content._id });
                                        if (article) {
                                            content.name = article.title;
                                            content.owner = article.author_id;
                                        }
                                    }
                                    if (content.type === 'folder') {
                                        content.owner = topic.owner_id >= 0 ? topic.owner_id : -1;
                                    }
                                });
                                contents.push({ _id: topic._id, type: 'folder', parent: 'root', name: topic.name, owner: topic.owner_id >= 0 ? topic.owner_id : -1, topic: topic._id });
                                const treeData = new docNode_1.NodeListData();
                                const tree = treeData.findAndAddChildren(contents);
                                if (tree) {
                                    app.topicsData.push(tree);
                                }
                                else {
                                    app.topicsData.push(new docNode_1.DocNode(topic._id, topic.name, 'root', 'folder', topic.owner_id >= 0 ? topic.owner_id : -1, ''));
                                }
                            }
                            else {
                                app.topicsData.push(new docNode_1.DocNode('', '无内容', 'root', '', '', ''));
                            }
                        }
                        return new Promise(resolve => {
                            resolve();
                        });
                    }));
                }
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
class MyTreeItem {
    constructor() {
        this.label = '';
        this.id = '';
        this.parent = '';
        this.contextValue = '';
        this.owner = '';
        this.topic = '';
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
}
//# sourceMappingURL=topicListProvider.js.map