import * as vscode from 'vscode';
const request = require('request');
import { user } from './user';
import { eventManager } from './eventManager';

export class TopicListProvider implements vscode.TreeDataProvider<Topic>{
    private topicsData: Topic[] = [];
    private myTopicsData: Topic[] = [];
    constructor(private context: vscode.ExtensionContext) {
    }
    getChildren(element?: Topic): vscode.ProviderResult<any[]> {
        if (!user.isSignIn(this.context)) {
            return [
                new Topic('登录', 'no_user')
            ];
        }
        if (!element) {
            return [
                new Column('我的专栏','my_topic'),
                new Column('所有','all')
            ];
        } 
        if(element.id === 'all'){
            return this.topicsData;
        } 
        if(element.id === 'my_topic'){
            return this.myTopicsData;
        }
        else {
            return element.docs;
        }
    }
    getTreeItem(element: Topic): vscode.TreeItem | Thenable<vscode.TreeItem> {
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
        else if (element.id ==='all'||element.id === 'my_topic'|| element.id.substr(0, 6) === 'topic$') {
            return {
                label: element.label,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                contextValue: element.id.substr(0, 6) === 'topic$'?'Topic':'Column'
            };
        } else if (element.id === 'sign_out') {
            return {
                label: element.label,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "python123.signOut",
                    title: "退出登录",
                },
            };
        } else if (element.id === 'upload_img') {
            return {
                label: element.label,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "python123.uploadImg",
                    title: "上传图片",
                },
            };
        } else if (element.id.substr(0, 4) === 'doc$') {
            return {
                label: element.label,
                id: element.id,
                collapsibleState: vscode.TreeItemCollapsibleState.None
            };
        }
        return {};
    }

    public async refresh(): Promise<void> {
        if (user.isSignIn(this.context)) {
            await this.getListData();
        } else {
            this.topicsData = [];
        }
        this.onDidChangeTreeDataEvent.fire();
    }
    private onDidChangeTreeDataEvent: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    public readonly onDidChangeTreeData: vscode.Event<any> = this.onDidChangeTreeDataEvent.event;
    private async getListData(): Promise<void> {
        this.topicsData = [];
        const app = this;
        try {
            const topicList: any = await this.getInfoFromUri('https://www.python123.io/api/v1/topics/public');
            const topics: any[] = JSON.parse(topicList).data;
            const increment = 100 / topics.length;
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "正在加载 ",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                for (let topic of topics) {
                    const articleNodes: Doc[] = [];
                    let articles: any = await app.getInfoFromUri('https://www.python123.io/api/v1/topics/' + topic.uri + '/articles');

                    JSON.parse(articles).data.forEach((aritcle: any) => {
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
            });
            this.topicsData.push(new Topic('上传图片', 'upload_img'));
            this.topicsData.push(new Topic('退出登录', 'sign_out'));
        } catch (err) {
            vscode.window.showErrorMessage(err);
        }
    }
    private async getInfoFromUri(uri: string): Promise<any> {
        const app = this;
        try {
            return new Promise((resolve, reject) => {
                request.get(uri, (err: any, request: any, body: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (request.statusCode === 200) {
                            resolve(body);
                        } else if (request.statusCode === 401 && body.message === 'TokenInvalid') {
                            user.signOut(app.context);
                            reject('登录信息失效');
                            vscode.window.showWarningMessage('登录信息失效,请重新登陆');
                            app.refresh();
                        }
                        resolve(request);
                    }
                });
            });
        } catch (err) {
            return new Promise(() => {
            });
        }
    }
}

class Column{
    public id: string;
    public label: string;
    constructor(label: string, id: string) {
        this.id = id;
        this.label = label;
    }
}

export class Topic {
    public id: string;
    public label: string;
    public docs: Doc[] | undefined;
    constructor(label: string, id: string, docs?: Doc[]) {
        this.id = id;
        this.label = label;
        this.docs = docs;
    }
}
class Doc {
    public id: string;
    public label: string;
    constructor(label: string, id: string) {
        this.id = id;
        this.label = label;
    }
}