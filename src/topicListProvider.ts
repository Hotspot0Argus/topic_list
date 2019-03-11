import * as vscode from 'vscode';
const request = require('request');
import { user } from './user';
import { NodeListData, DocNode } from './docNode';
import * as _ from 'lodash';
import { httpRequest } from './httpRequest';

const setting = require('../resource/setting.json');

export class TopicListProvider implements vscode.TreeDataProvider<DocNode>{
    private topicsData: DocNode[] = [];
    private myTopicsData: DocNode[] = [];
    constructor(private context: vscode.ExtensionContext) {
    }
    getChildren(element?: DocNode): vscode.ProviderResult<any[]> {
        if (!user.isSignIn(this.context)) {
            return [
                new DocNode('no_user', '登录', 'root', 'folder', '')
            ];
        }
        if (!element) {
            return [
                new DocNode('upload_img', '上传图片', 'root', 'folder', ''),
                new DocNode('root', '所有专栏', 'root', 'column', '')
            ];
        }
        if (element.id === 'root') {
            return this.topicsData;
        }
        else {
            return element.children;
        }
    }
    getTreeItem(element: DocNode): MyTreeItem | Thenable<MyTreeItem> {
        if (element.id === 'no_user') {
            return {
                label: element.name,
                id: element.id,
                parent: 'root',
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
                topic: '',
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                command: {
                    command: "python123.uploadImg",
                    title: "上传图片",
                },
            };
        } else if (element.type === 'folder' || element.id === 'root') {
            return {
                label: element.name,
                id: element.id,
                parent: element.parent,
                topic: element.topic,
                collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                contextValue: this.getNodeType(element)
            };
        } else {
            return {
                label: '- ' + element.name,
                id: element.id,
                parent: element.parent,
                topic: element.topic,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                contextValue: element.type
            };
        }
    }
    public getNodeType(element: DocNode): string {
        if (element.id === 'root') {
            return 'root';
        }
        if (element.topic === element.id) {
            return 'topic';
        }
        return 'folder';
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
            const result: any = await httpRequest.get(this.context, setting.uri + 'topics/owned');
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
                        const contents = topic.contents;
                        contents.push({ _id: topic._id, type: 'folder', parent: 'root', name: topic.name });
                        const treeData = new NodeListData();
                        const tree = treeData.findAndAddChildren(contents);
                        if (tree) {
                            app.topicsData.push(tree);
                        } else {
                            app.topicsData.push(new DocNode(topic._id, topic.name, 'root', 'folder', ''));
                        }

                    }
                    return new Promise(resolve => {
                        resolve();
                    });
                });
            }
        } catch (err) {
            vscode.window.showErrorMessage(err);
        }
    }
}

class MyTreeItem implements vscode.TreeItem {
    public label: string = '';
    public id: string = '';
    public parent: string = '';
    public contextValue?: string = '';
    public topic: string = '';
    public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None;
    public command?: vscode.Command;
}