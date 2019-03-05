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
const request = require('request');
const { eventManager } = require('./eventManager');
class User {
    signIn() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const email = yield vscode.window.showInputBox({
                    prompt: "输入账号邮箱",
                    validateInput: (s) => s && s.trim() ? undefined : "邮箱不能能为空",
                });
                if (!email) {
                    return;
                }
                const pwd = yield vscode.window.showInputBox({
                    prompt: "输入密码",
                    password: true,
                    validateInput: (s) => s ? undefined : "密码不能为空",
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
                }, function (error, request, body) {
                    if (error) {
                        vscode.window.showErrorMessage('登录失败，错误', error);
                    }
                    else if (request) {
                        if (request.statusCode === 201) {
                            vscode.window.showInformationMessage('登录成功！请等待加载完毕');
                            eventManager.call('token', { email: email, token: JSON.parse(body).data.token });
                        }
                        else {
                            vscode.window.showErrorMessage('登录失败，' + request.message);
                        }
                    }
                });
            }
            catch (error) {
                console.log('ERR');
            }
        });
    }
    signOut(context) {
        context.globalState.update('token', {});
        vscode.window.showInformationMessage('退出成功！');
    }
    isSignIn(context) {
        const user = context.globalState.get('token');
        return !!user && !!user.token && !!user.email;
    }
}
exports.user = new User();
//# sourceMappingURL=user.js.map