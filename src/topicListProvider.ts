import * as vscode from 'vscode';
const request = require('request');
import { user } from './user';
import { NodeListData, DocNode } from './docNode';
import * as _ from 'lodash';
import { httpRequest } from './httpRequest';

export class TopicListProvider implements vscode.TreeDataProvider<DocNode>{
    private topicsData: DocNode[] = [];
    private myTopicsData: DocNode[] = [];
    constructor(private context: vscode.ExtensionContext) {
    }
    getChildren(element?: DocNode): vscode.ProviderResult<any[]> {
        if (!user.isSignIn(this.context)) {
            return [
                new DocNode('no_user', '登录', 'root', 'folder', user.id(this.context), '')
            ];
        }
        if (!element) {
            return [
                new DocNode('upload_img', '上传图片', 'root', 'folder', user.id(this.context), ''),
                new DocNode('all', '所有专栏', 'root', 'column', user.id(this.context), '')
            ];
        }
        if (element.id === 'all') {
            return this.topicsData;
        }
        else {
            return element.children;
        }
    }
    getTreeItem(element: DocNode): MyTreeItem | Thenable<MyTreeItem> {
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
        } else if (element.id === 'upload_img') {
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
        } else if (element.type === 'folder' || element.id === 'all') {
            return {
                label: element.name,
                id: element.id,
                parent: element.parent,
                owner: element.owner,
                topic: element.topic,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                contextValue: this.getNodeType(element)
            };
        } else if (element.type === 'article') {
            return {
                label: element.name,
                id: element.id,
                parent: element.parent,
                owner: element.owner,
                topic: element.topic,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                contextValue: element.owner.toString() === user.id(app.context) ? 'article' : 'article&other'
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
    public getNodeType(element: DocNode): string {
        if (element.id === 'all') {
            return 'root';
        }
        if (element.topic === element.id && element.owner.toString() === user.id(this.context)) {
            return 'topic';
        }
        if (element.owner.toString() === user.id(this.context)) {
            return 'folder';
        }
        return 'folder&other';

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
            const result: any = await httpRequest.get(this.context, 'http://localhost:8080/api/v1/topics/owned');
            if (result.statusCode === 200) {
                const topics = JSON.parse(result.body);
                const topicsList = topics.data;
                const increment = 100 / topicsList.length;
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "正在加载 ",
                    cancellable: false
                }, async (progress) => {
                    progress.report({ increment: 0 });
                    for (let topic of topicsList) {
                        let result: any = await httpRequest.get(this.context, 'http://localhost:8080/api/v1/topics/' + topic.uri + '/articles');
                        if (result.statusCode === 200 && JSON.parse(result.body).data.contents) {
                            const contents = JSON.parse(result.body).data.contents;
                            const articles = JSON.parse(result.body).data.articles;

                            contents.forEach((content: any) => {
                                if (content.type === 'article') {
                                    const article: any = _.find(articles, { _id: content._id });
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
                            const treeData = new NodeListData();
                            const tree = treeData.findAndAddChildren(contents);
                            progress.report({
                                increment: increment,
                                message: topic.name
                            });
                            if (tree) {
                                app.topicsData.push(tree);
                            } else {
                                app.topicsData.push(new DocNode(topic._id, topic.name, 'root', 'folder', topic.owner_id >= 0 ? topic.owner_id : -1, ''));
                            }
                        } else {
                            app.topicsData.push(new DocNode('', '无内容', 'root', '', '', ''));
                        }
                    }
                    return new Promise(resolve => {
                        resolve();
                    });
                });
                console.log(this.topicsData);
            }
        } catch (err) {
            vscode.window.showErrorMessage(err);
            console.log(err);
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

class MyTreeItem implements vscode.TreeItem {
    public label: string = '';
    public id: string = '';
    public parent: string = '';
    public contextValue?: string = '';
    public owner: string = '';
    public topic: string = '';
    public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None;
    public command?: vscode.Command;
}