import * as vscode from 'vscode';
const request = require('request');
import { user } from './user';
import { eventManager } from './eventManager';
import { NodeListData, DocNode } from './docNode';

export class TopicListProvider implements vscode.TreeDataProvider<DocNode>{
    private topicsData: DocNode[] = [];
    private myTopicsData: DocNode[] = [];
    constructor(private context: vscode.ExtensionContext) {
    }
    getChildren(element?: DocNode): vscode.ProviderResult<any[]> {
        if (!user.isSignIn(this.context)) {
            return [
                new DocNode('no_user', '登录', 'root', 'folder')
            ];
        }
        if (!element) {
            return [
                new DocNode('all', '所有专栏', 'root', 'folder')
            ];
        }
        if (element.id === 'all') {
            return this.topicsData;
        }
        else {
            return element.children;
        }
    }
    getTreeItem(element: DocNode): myTreeItem | Thenable<myTreeItem> {
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
                parent:element.parent,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                contextValue: 'folder'
            };
        } else if (element.id === 'upload_img') {
            return {
                label: element.name,
                id: element.id,
                parent:element.parent,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "python123.uploadImg",
                    title: "上传图片",
                },
            };
        } else if (element.type === 'article') {
            return {
                label: element.name,
                id: element.id,
                parent:element.parent,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                contextValue: 'article'
            };
        }
        return {
            label: 'ERR',
            id: 'ERR',
            parent:'ERR',
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'ERR'
        };
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
                    const articleNodes: DocNode[] = [];
                    let nodes: any = await app.getInfoFromUri('https://www.python123.io/api/v1/topics/' + topic.uri + '/articles');

                    JSON.parse(nodes).data.forEach((node: any) => {
                        articleNodes.push(new DocNode(node._id,node.title,node.parent,node.type));
                    });
                    articleNodes.push(new DocNode(topic._id,topic.name,'root','folder',[]))
                    const treeData = new NodeListData();
                    treeData.getNodeTree(articleNodes)
                    progress.report({
                        increment: increment,
                        message: topic.name
                    });

                    app.topicsData.push(treeData.getNodeTree(articleNodes));
                }
                return new Promise(resolve => {
                    resolve();
                });
            });
            this.topicsData.push(new DocNode('upload_img','上传图片','root','folder'));
            this.topicsData.push(new DocNode('sign_out','退出登录','root','folder' ));
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

class myTreeItem implements vscode.TreeItem {
    public label: string = '';
    public id: string = '';
    public parent: string = '';
    public contextValue?: string = '';
    public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None;
    public command?: vscode.Command;
}