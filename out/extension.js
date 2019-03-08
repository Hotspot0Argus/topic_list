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
const topicListProvider_1 = require("./topicListProvider");
const eventManager_1 = require("./eventManager");
const user_1 = require("./user");
const httpRequest_1 = require("./httpRequest");
const fs = require("fs");
const setting = require('../resource/setting.json');
function activate(context) {
    const _terminal = vscode.window.createTerminal(`Info Board`);
    eventManager_1.eventManager.on('token', (content) => {
        context.globalState.update('token', content);
        topicListProvider.refresh();
    });
    const signIn = vscode.commands.registerCommand('python123.signIn', () => {
        user_1.user.signIn();
    });
    const signOut = vscode.commands.registerCommand('python123.signOut', () => {
        user_1.user.signOut(context);
        topicListProvider.refresh();
    });
    const refresh = vscode.commands.registerCommand('python123.refresh', () => {
        topicListProvider.refresh();
    });
    const upload = vscode.commands.registerCommand('python123.upload', (topic) => __awaiter(this, void 0, void 0, function* () {
        if (user_1.user.isSignIn(context)) {
            const window = vscode.window.activeTextEditor;
            if (window && window.document.languageId === "markdown") {
                //todo: input info
                const articleInfo = yield user_1.user.inputInfo([{ label: '标题', field: 'title' },
                    { label: '副标题', field: 'subtitle' }, { label: '作者名称', field: 'penName' }, { label: ' URI', field: 'uri' }]);
                if (articleInfo.uri.length > 100) {
                    vscode.window.showInformationMessage('URI 文章 URI 过长');
                    return;
                }
                const doc = yield vscode.workspace.openTextDocument(window.document.uri.fsPath);
                if (!doc) {
                    vscode.window.showErrorMessage('请在 vscode 打开要上传的文件并将光标指入');
                    return;
                }
                const articleContent = doc.getText();
                const uri = setting.uri + 'articles/';
                const options = {
                    uri: uri,
                    method: 'POST',
                    json: true,
                    headers: {
                        "content-type": "application/json",
                        "authorization": 'Bearer ' + user_1.user.token(context)
                    },
                    body: {
                        content: JSON.stringify({ content: articleContent }),
                        pen_name: articleInfo.penName,
                        title: articleInfo.title,
                        subtitle: articleInfo.subtitle
                    }
                };
                const articleResult = yield httpRequest_1.httpRequest.send(context, options);
                if (articleResult.statusCode === 201) {
                    const targetUri = setting.uri + 'topics/' + topic.topic + '/articles';
                    const options = {
                        uri: targetUri,
                        method: 'POST',
                        json: true,
                        headers: {
                            "content-type": "application/json",
                            "authorization": 'Bearer ' + user_1.user.token(context)
                        },
                        body: {
                            article_id: articleResult.body.data._id,
                            parent: topic.id,
                            uri: articleInfo.uri
                        }
                    };
                    const topicResult = yield httpRequest_1.httpRequest.send(context, options);
                    if (topicResult.statusCode === 200) {
                        vscode.window.showInformationMessage('上传成功');
                        topicListProvider.refresh();
                        return;
                    }
                    vscode.window.showErrorMessage('未能添加文件 ID:' + articleResult.body.data._id + '到所选目录');
                    return;
                }
                vscode.window.showErrorMessage('上传失败请重新上传文件');
            }
            else {
                vscode.window.showErrorMessage('请在 vscode 打开要上传的文件并将光标指入');
            }
        }
    }));
    const options = {
        canSelectMany: false,
        openLabel: 'Open',
        filters: {
            'Images': ['png', 'jpg', 'jpeg']
        }
    };
    const uploadImg = vscode.commands.registerCommand('python123.uploadImg', (topic) => __awaiter(this, void 0, void 0, function* () {
        if (user_1.user.isSignIn(context)) {
            const uri = setting.uri + 'files';
            const fileUri = yield vscode.window.showOpenDialog(options);
            if (fileUri) {
                try {
                    const content = yield new Promise((resolve, reject) => {
                        fs.readFile(fileUri[0].fsPath, (err, buffer) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(buffer);
                            }
                        });
                    });
                    const path = fileUri[0].fsPath;
                    const extension = path.split('.').pop();
                    const fileName = path.split('\\').pop();
                    const formData = {
                        file: {
                            value: fs.createReadStream(path),
                            options: {
                                filename: fileName,
                                contentType: 'image/jpg'
                            }
                        },
                        extension: extension
                    };
                    const options = {
                        uri: uri,
                        method: 'POST',
                        json: true,
                        formData: formData,
                        headers: {
                            "content-type": "application/json",
                            "authorization": 'Bearer ' + user_1.user.token(context)
                        }
                    };
                    const result = yield httpRequest_1.httpRequest.send(context, options);
                    if (result.statusCode === 201) {
                        const filename = result.body.data;
                        const path = '/images/' + filename[0] + filename[1] + '/' + filename[2] + filename[3] + '/' + filename.substr(4);
                        _terminal.sendText('echo 将 ' + fileUri[0].fsPath + ' 上传至 ' + setting.host + path);
                        vscode.window.showInformationMessage('将 ' + fileUri[0].fsPath + ' 上传至 ' + setting.host + path + ' 可在控制台查看');
                        fs.writeFile(path, content, { 'encoding': 'utf-8' }, function (err) {
                            if (err) {
                                throw err;
                            }
                        });
                    }
                    else {
                        vscode.window.showErrorMessage('上传失败');
                    }
                }
                catch (err) {
                }
            }
        }
    }));
    const newFolderInColumn = vscode.commands.registerCommand('python123.newFolderInColumn', () => __awaiter(this, void 0, void 0, function* () {
        const topicInfo = yield user_1.user.inputInfo([{ label: '专栏名称', field: 'name' },
            { label: '专栏 URI', field: 'uri' }, { label: '专栏描述', field: 'description' },
            { label: '专栏领域', field: 'category' }, { label: '是否推荐专栏（true 或 false）', field: 'recommended' },
            { label: '是否公开专栏（true 或 false）', field: 'is_public' }]);
        const targetUri = setting.uri + 'topics/';
        const options = {
            uri: targetUri,
            method: 'POST',
            json: true,
            headers: {
                "content-type": "application/json",
                "authorization": 'Bearer ' + user_1.user.token(context)
            },
            body: {
                name: topicInfo.name,
                description: topicInfo.description,
                uri: topicInfo.uri,
                category: topicInfo.category,
                recommended: topicInfo.recommended === 'true' ? true : false,
                is_public: topicInfo.is_public === 'true' ? true : false,
            }
        };
        const result = yield httpRequest_1.httpRequest.send(context, options);
        if (result.statusCode === 201) {
            vscode.window.showInformationMessage('创建成功');
            topicListProvider.refresh();
        }
    }));
    const newFolderInTopic = vscode.commands.registerCommand('python123.newFolderInTopic', (node) => __awaiter(this, void 0, void 0, function* () {
        const topicInfo = yield user_1.user.inputInfo([{ label: '目录名称', field: 'name' }]);
        const topicId = node.topic;
        const uri = setting.uri + 'topics/' + topicId + '/folders';
        const options = {
            uri: uri,
            method: 'POST',
            json: true,
            headers: {
                "content-type": "application/json",
                "authorization": 'Bearer ' + user_1.user.token(context)
            },
            body: {
                name: topicInfo.name,
                parent: node.id
            }
        };
        const result = yield httpRequest_1.httpRequest.send(context, options);
        if (result.statusCode === 201) {
            vscode.window.showInformationMessage('创建成功');
            topicListProvider.refresh();
            return;
        }
        vscode.window.showErrorMessage('创建失败');
    }));
    const deleteNode = vscode.commands.registerCommand('python123.deleteNode', (node) => __awaiter(this, void 0, void 0, function* () {
        if (node.type === 'folder' && node.children.length > 0) {
            vscode.window.showErrorMessage('无法删除含内容节点');
            return;
        }
        const uri = setting.uri + 'topics/' + node.topic + '/contents/' + node.id;
        const options = {
            uri: uri,
            method: 'DELETE',
            json: true,
            headers: {
                "content-type": "application/json",
                "authorization": 'Bearer ' + user_1.user.token(context)
            }
        };
        const result = yield httpRequest_1.httpRequest.send(context, options);
        if (result.statusCode === 200) {
            vscode.window.showInformationMessage('删除成功');
            topicListProvider.refresh();
            return;
        }
        vscode.window.showErrorMessage('删除失败');
    }));
    const editArticle = vscode.commands.registerCommand('python123.editArticle', (node) => __awaiter(this, void 0, void 0, function* () {
        const info = yield user_1.user.inputInfo([{ label: '文章 URI', field: 'uri' }, { label: '作者名称', field: 'penName' }]);
        const uri = setting.uri + 'topics/' + node.topic + '/articles/' + node.id;
        const options = {
            uri: uri,
            method: 'PATCH',
            json: true,
            headers: {
                "content-type": "application/json",
                "authorization": 'Bearer ' + user_1.user.token(context)
            },
            body: {
                uri: info.uri,
                pen_name: info.penName
            }
        };
        const result = yield httpRequest_1.httpRequest.send(context, options);
        if (result.statusCode === 200) {
            vscode.window.showInformationMessage('修改成功');
            topicListProvider.refresh();
            return;
        }
        vscode.window.showErrorMessage('修改失败');
    }));
    const editFolder = vscode.commands.registerCommand('python123.editFolder', (node) => __awaiter(this, void 0, void 0, function* () {
        const info = yield user_1.user.inputInfo([{ label: '节点名称', field: 'name' }]);
        const uri = setting.uri + 'topics/' + node.topic + '/folders/' + node.id;
        const options = {
            uri: uri,
            method: 'PATCH',
            json: true,
            headers: {
                "content-type": "application/json",
                "authorization": 'Bearer ' + user_1.user.token(context)
            },
            body: {
                name: info.name
            }
        };
        const result = yield httpRequest_1.httpRequest.send(context, options);
        if (result.statusCode === 200) {
            vscode.window.showInformationMessage('修改成功');
            topicListProvider.refresh();
            return;
        }
        vscode.window.showErrorMessage('修改失败');
    }));
    const topicListProvider = new topicListProvider_1.TopicListProvider(context);
    context.subscriptions.push(signIn, signOut, refresh, upload, uploadImg, newFolderInColumn, newFolderInTopic, deleteNode, editArticle, editFolder, vscode.window.registerTreeDataProvider("topic", topicListProvider));
    topicListProvider.refresh();
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map