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
function activate(context) {
    const _terminal = vscode.window.createTerminal(`Info Board`);
    eventManager_1.eventManager.on('token', (content) => {
        context.globalState.update('token', { email: content.email, token: content.token });
        topicListProvider.refresh();
    });
    let signIn = vscode.commands.registerCommand('python123.signIn', () => {
        user_1.user.signIn();
    });
    let signOut = vscode.commands.registerCommand('python123.signOut', () => {
        user_1.user.signOut(context);
        topicListProvider.refresh();
    });
    let refresh = vscode.commands.registerCommand('python123.refresh', () => {
        topicListProvider.refresh();
    });
    let upload = vscode.commands.registerCommand('python123.upload', (topic) => __awaiter(this, void 0, void 0, function* () {
        // todo: 检测身份，获取当前活动窗口，上传数据
        if (user_1.user.isSignIn(context)) {
            const window = vscode.window.activeTextEditor;
            if (window && window.document.languageId === "markdown") {
                //todo: input info
                const articleInfo = yield user_1.user.inputInfo([{ label: '标题', field: 'title' },
                    { label: '副标题', field: 'subTitle' }, { label: '作者名称', filed: 'penName' }]);
                const doc = yield vscode.workspace.openTextDocument(window.document.uri.fsPath);
                const articleContent = doc.getText();
                //todo: send and get articleID
                //todo:put article in topic 
            }
            // topicListProvider.refresh();
        }
    }));
    const options = {
        canSelectMany: false,
        openLabel: 'Open',
        filters: {
            'Images': ['png', 'jpg', 'jpeg']
        }
    };
    let uploadImg = vscode.commands.registerCommand('python123.uploadImg', (topic) => __awaiter(this, void 0, void 0, function* () {
        // todo: 检测身份，上传图片,在控制台里显示图片路径
        if (user_1.user.isSignIn(context)) {
            const uri = 'https://www.python123.io/api/v1/files';
            const fileUri = yield vscode.window.showOpenDialog(options);
            if (fileUri) {
                _terminal.sendText('echo ' + fileUri[0].path);
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
                    //todo：构造file类
                    const result = yield httpRequest_1.httpRequest.post(context, uri, { files: { file: content }, extension: "" });
                }
                catch (err) {
                    console.log(err);
                }
            }
        }
    }));
    let newFolderInColumn = vscode.commands.registerCommand('python123.newFolderInColumn', (column) => __awaiter(this, void 0, void 0, function* () {
        const topicInfo = yield user_1.user.inputInfo([{ label: '专栏名称', field: 'name' },
            { label: '专栏 URI', field: 'uri' }, { label: '专栏描述', filed: 'description' }, { label: '推荐专栏', field: 'recommended' }]);
        topicInfo.parent = column.id;
        topicListProvider.refresh();
    }));
    let newFolderInTopic = vscode.commands.registerCommand('python123.newFolderInTopic', (topic) => __awaiter(this, void 0, void 0, function* () {
        const folderInfo = yield user_1.user.inputInfo([{ label: '专栏名称', field: 'name' },
            { label: '专栏 URI', field: 'uri' }, { label: '专栏描述', filed: 'description' }]);
        folderInfo.parent = topic.id;
        const column = topic.parent;
        topicListProvider.refresh();
    }));
    let deleteFolder = vscode.commands.registerCommand('python123.deleteFolder', () => {
        //todo: 循环删除所有文件 in python123
        topicListProvider.refresh();
    });
    let deleteDoc = vscode.commands.registerCommand('python123.deleteDoc', () => {
        topicListProvider.refresh();
    });
    const topicListProvider = new topicListProvider_1.TopicListProvider(context);
    context.subscriptions.push(signIn, signOut, refresh, upload, uploadImg, vscode.window.registerTreeDataProvider("topic", topicListProvider));
    topicListProvider.refresh();
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map