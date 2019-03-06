const request = require('request');
import * as vscode from 'vscode';
import {user} from './user';

class HttpRequest {

    public async get(context: vscode.ExtensionContext, uri: string): Promise<any> {
        const app = this;
        try {
            return new Promise((resolve, reject) => {
                request({
                    method: 'GET',
                    uri: uri,
                    headers: {
                        "content-type": "application/json",
                        "authorization": user.token(context)
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
    public async post(context: vscode.ExtensionContext, uri: string,body:object): Promise<any> {
        const app = this;
        try {
            return new Promise((resolve, reject) => {
                request({
                    method: 'POST',
                    uri: uri,
                    headers: {
                        "content-type": "application/json",
                        "authorization": user.token(context)
                    },
                    body:body
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

}
export const httpRequest: HttpRequest = new HttpRequest();