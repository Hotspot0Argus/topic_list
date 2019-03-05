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
                new Topic('登录', 'no_user')
            ];
        }
        if (!element) {
            return [
                new Column('我的专栏', 'my_topic'),
                new Column('所有', 'all')
            ];
        }
        if (element.id === 'all') {
            return this.topicsData;
        }
        if (element.id === 'my_topic') {
            return this.myTopicsData;
        }
        else {
            return element.docs;
        }
    }
    getTreeItem(element) {
        if (element.id === 'no_user') {
            return {
                label: element.label,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "python123.signIn",
                    title: "登录",
                },
            };
        }
        else if (element.id === 'all' || element.id === 'my_topic' || element.id.substr(0, 6) === 'topic$') {
            return {
                label: element.label,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                contextValue: element.id.substr(0, 6) === 'topic$' ? 'Topic' : 'Column'
            };
        }
        else if (element.id === 'sign_out') {
            return {
                label: element.label,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "python123.signOut",
                    title: "退出登录",
                },
            };
        }
        else if (element.id === 'upload_img') {
            return {
                label: element.label,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "python123.uploadImg",
                    title: "上传图片",
                },
            };
        }
        else if (element.id.substr(0, 4) === 'doc$') {
            return {
                label: element.label,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.None
            };
        }
        return {};
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
                        let articles = yield app.getInfoFromUri('https://www.python123.io/api/v1/topics/' + topic.uri + '/articles');
                        JSON.parse(articles).data.forEach((aritcle) => {
                            articleNodes.push(new Doc(aritcle.title, 'doc$' + aritcle._id));
                        });
                        progress.report({
                            increment: increment,
                            message: topic.name
                        });
                        app.topicsData.push(new Topic(topic.name, 'topic$' + topic.uri, articleNodes));
                    }
                    return new Promise(resolve => {
                        resolve();
                    });
                }));
                this.topicsData.push(new Topic('上传图片', 'upload_img'));
                this.topicsData.push(new Topic('退出登录', 'sign_out'));
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
class Column {
    constructor(label, id) {
        this.id = id;
        this.label = label;
    }
}
class Topic {
    constructor(label, id, docs) {
        this.id = id;
        this.label = label;
        this.docs = docs;
    }
}
exports.Topic = Topic;
class Doc {
    constructor(label, id) {
        this.id = id;
        this.label = label;
    }
}
//# sourceMappingURL=topicListProvider.js.map