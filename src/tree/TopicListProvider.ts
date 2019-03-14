import * as vscode from 'vscode';
import { user } from '../active/User';
import { NodeListData, DocNode } from './DocNode';
import { httpRequest } from '../message/HttpRequest';

const setting = require('../../resource/Setting.json');

export class TopicListProvider implements vscode.TreeDataProvider<DocNode> {
    private topicsData: DocNode[] = [];

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
            try {
                return this.topicsData;
            } catch (e) {
                this.refresh();
                return this.topicsData;
            }
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
        try {
            const result: any = await httpRequest.get(this.context, setting.uri + 'topics/owned');
            if (result.statusCode === 200) {
                const topics = JSON.parse(result.body);
                const topicsList = topics.data;
                for (let topic of topicsList) {
                    const contents = topic.contents;
                    contents.push({ _id: topic._id, type: 'folder', parent: 'root', name: topic.name });
                    const treeData = new NodeListData();
                    const tree = treeData.findAndAddChildren(contents);
                    if (tree) {
                        this.topicsData.push(tree);
                    } else {
                        this.topicsData.push(new DocNode(topic._id, topic.name, 'root', 'folder', ''));
                    }
                }
            } else {
                vscode.window.showErrorMessage('资源加载失败，正在重试');
                this.refresh();
            }
        } catch (err) {
            vscode.window.showErrorMessage('资源加载失败，正在重试' + err);
            this.refresh();
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