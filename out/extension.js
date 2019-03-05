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
const User = require("./user");
function activate(context) {
    const _terminal = vscode.window.createTerminal(`Info Board`);
    eventManager_1.eventManager.on('token', (content) => {
        context.globalState.update('token', { email: content.email, token: content.token });
        topicListProvider.refresh();
    });
    let signIn = vscode.commands.registerCommand('python123.signIn', () => {
        User.user.signIn();
    });
    let signOut = vscode.commands.registerCommand('python123.signOut', () => {
        User.user.signOut(context);
        topicListProvider.refresh();
    });
    let refresh = vscode.commands.registerCommand('python123.refresh', () => {
        topicListProvider.refresh();
    });
    let upload = vscode.commands.registerCommand('python123.upload', (topic) => __awaiter(this, void 0, void 0, function* () {
        // todo: 检测身份，获取当前活动窗口，上传数据
        if (User.user.isSignIn(context)) {
            const window = vscode.window.activeTextEditor;
            if (window && window.document.languageId === "markdown") {
                //todo: input info
                const doc = yield vscode.workspace.openTextDocument(window.document.uri.fsPath);
                const fileContent = doc.getText();
                //todo: send and get articleID
                //todo:put article in topic 
            }
            // topicListProvider.refresh();
        }
    }));
    let uploadImg = vscode.commands.registerCommand('python123.uploadImg', (topic) => {
        // todo: 检测身份，上传图片,在控制台里显示图片路径
        if (User.user.isSignIn(context)) {
            const uri = '';
            _terminal.sendText('echo ' + uri);
            // topicListProvider.refresh();
        }
    });
    const topicListProvider = new topicListProvider_1.TopicListProvider(context);
    context.subscriptions.push(signIn, signOut, refresh, uploadImg, vscode.window.registerTreeDataProvider("topic", topicListProvider));
    topicListProvider.refresh();
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map