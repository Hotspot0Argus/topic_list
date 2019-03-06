import * as vscode from 'vscode';
import { appendFile } from 'fs';
const request = require('request');
const { eventManager } = require('./eventManager');

class User {
    public async signIn(): Promise<void> {
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
            request({
                method: 'PUT',
                uri: 'https://python123.io/api/v1/session',
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    pass: pwd
                }),
            }, function (error: any, request: any, body: any) {
                if (error) {
                    vscode.window.showErrorMessage('登录失败，错误', error);
                } else if (request) {
                    if (request.statusCode === 201) {
                        vscode.window.showInformationMessage('登录成功！请等待加载完毕');
                        eventManager.call('token', { email: email, token: JSON.parse(body).data.token });
                    } else {
                        vscode.window.showErrorMessage('登录失败，' + request.message);
                    }

                }
            });
        } catch (error) {
            console.log('ERR');
        }
    }
    public signOut(context: vscode.ExtensionContext) {
        context.globalState.update('token', {});
        vscode.window.showInformationMessage('退出成功！');
    }
    public isSignIn(context: vscode.ExtensionContext): Boolean {
        const user: any = context.globalState.get('token');
        return !!user && !!user.token && !!user.email;
    }
    public token(context: vscode.ExtensionContext) {
        const user: any = context.globalState.get('token');
        return user.token;
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
                result += (list[i].field + ':' + content + ',');
            }
            const content: string | undefined = await vscode.window.showInputBox({
                prompt: "输入" + list[list.length - 1].label,
                validateInput: (s: string): string | undefined => s && s.trim() ? undefined : list[list.length - 1].label + "不能为空",
            });
            if (!content) {
                return;
            }
            result += (list[list.length - 1].field + ':' + content + '}');

            return JSON.parse(result);

        } catch (err) {
            return { err };
        }

    }
}
export const user: User = new User();