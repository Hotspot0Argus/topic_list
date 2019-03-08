const request = require('request');
import * as vscode from 'vscode';
import { user } from './user';

class HttpRequest {

    public async get(context: vscode.ExtensionContext, uri: string): Promise<any> {
        try {
            return new Promise((resolve, reject) => {
                request({
                    method: 'GET',
                    uri: uri,
                    headers: {
                        "content-type": "application/json",
                        "authorization": 'Bearer ' + user.token(context)
                    }
                }, (err: any, request: any, body: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(request);
                    }
                });
            });
        } catch (err) {
            return 'Err';
        }
    }
    public async send(context: vscode.ExtensionContext, options:any): Promise<any> {
        try {
            return new Promise((resolve, reject) => {
                request(options, (err: any, request: any, body: any) => {
                    if (err) {
                        reject(err);
                    }else if (request.statusCode === 401 && body.message === 'TokenInvalid') {
                        user.signOut(context);
                        reject('登录信息失效');
                        vscode.window.showWarningMessage('登录信息失效,请重新登陆');
                    } else {
                        resolve(request);
                    }
                });
            });
        } catch (err) {
            return 'Err';
        }
    }

}
export const httpRequest: HttpRequest = new HttpRequest();