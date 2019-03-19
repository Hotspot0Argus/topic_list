import * as vscode from 'vscode';
const { eventManager } = require('../message/EventManager');
import { HttpRequest } from '../message/HttpRequest';

const setting = require('../../resource/Setting.json');

class User {
    public async signIn(context: vscode.ExtensionContext): Promise<void> {
        try {
            const email: string | undefined = await vscode.window.showInputBox({
                prompt: "输入账号邮箱",
                validateInput: (s: string): string | undefined => s && s.trim() ? undefined : "邮箱不能为空",
            });
            if (!email) {
                return;
            }
            const pwd: string | undefined = await vscode.window.showInputBox({
                prompt: "输入密码",
                password: true,
                validateInput: (s: string): string | undefined => s ? undefined : "密码不能为空",
            });
            if (!pwd) {
                return;
            }
            const option = {
                method: 'PUT',
                uri: setting.uri + 'session',
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    pass: pwd
                }),
            };
            const httpRequest = new HttpRequest(context);
            httpRequest.send(option);

        } catch (error) {
        }
    }
    public signOut(context: vscode.ExtensionContext) {
        context.globalState.update('token', {});
        vscode.window.showInformationMessage('退出成功！');
        eventManager.call('token', {});
    }
    public isSignIn(context: vscode.ExtensionContext): Boolean {
        const user: any = context.globalState.get('token');
        return !!user && !!user.token && !!user.email;
    }
    public token(context: vscode.ExtensionContext) {
        const user: any = context.globalState.get('token');
        return user.token;
    }
    public id(context: vscode.ExtensionContext) {
        const user: any = context.globalState.get('token');
        return user.id;
    }
    public async inputInfo(list: any[]) {
        let result = '{';
        try {
            for (let i = 0; i < list.length - 1; i++) {
                const content: string | undefined = await vscode.window.showInputBox({
                    prompt: "输入" + list[i].label,
                    validateInput: (s: string): string | undefined => s && s.trim() ? undefined : list[i].label + "不能为空",
                });
                if (!content) {
                    return;
                }
                result += ('"' + list[i].field + '":"' + content + '",');
            }
            const content: string | undefined = await vscode.window.showInputBox({
                prompt: "输入" + list[list.length - 1].label,
                validateInput: (s: string): string | undefined => s && s.trim() ? undefined : list[list.length - 1].label + "不能为空",
            });
            if (!content) {
                return;
            }
            result += ('"' + list[list.length - 1].field + '":"' + content + '"}');
            return JSON.parse(result);

        } catch (err) {
            return { err };
        }

    }
    public async requireConfirm(content: string) {
        return vscode.window.showInformationMessage(content, '是', '否');
    }
}
export const user: User = new User();