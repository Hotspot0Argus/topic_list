const request = require('request');
import * as vscode from 'vscode';
import { user } from '../active/User';

export class HttpRequest {
    private context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;

    }

    public async put(uri: string, body: object): Promise<any> {
        try {
            return new Promise((resolve, reject) => {
                request({
                    method: 'PUT',
                    uri: uri,
                    json: true,
                    headers: {
                        "content-type": "application/json",
                        "authorization": 'Bearer ' + user.token(this.context)
                    },
                    body: body
                }, (err: any, request: any, body: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.handleRequest(reject, resolve, request);
                    }
                });
            });
        } catch (err) {
            return 'Err';
        }
    }
    public async get(uri: string): Promise<any> {
        try {
            return new Promise((resolve, reject) => {
                request({
                    method: 'GET',
                    uri: uri,
                    json: true,
                    headers: {
                        "content-type": "application/json",
                        "authorization": 'Bearer ' + user.token(this.context)
                    }
                }, (err: any, request: any, body: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.handleRequest(reject, resolve, request);
                    }
                });
            });
        } catch (err) {
            return 'Err';
        }
    }

    public async patch(uri: string, body: object): Promise<any> {
        try {
            return new Promise((resolve, reject) => {
                request({
                    method: 'PATCH',
                    json: true,
                    uri: uri,
                    headers: {
                        "content-type": "application/json",
                        "authorization": 'Bearer ' + user.token(this.context)
                    },
                    body: body
                }, (err: any, request: any, body: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.handleRequest(reject, resolve, request);
                    }
                });
            });
        } catch (err) {
            return 'Err';
        }
    }
    public async post(uri: string, body: object): Promise<any> {
        try {
            return new Promise((resolve, reject) => {
                request({
                    method: 'POST',
                    json: true,
                    uri: uri,
                    headers: {
                        "content-type": "application/json",
                        "authorization": 'Bearer ' + user.token(this.context)
                    },
                    body: body
                }, (err: any, request: any, body: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.handleRequest(reject, resolve, request);
                    }
                });
            });
        } catch (err) {
            return 'Err';
        }
    }
    public async delete(uri: string): Promise<any> {
        try {
            return new Promise((resolve, reject) => {
                request({
                    method: 'DELETE',
                    json: true,
                    uri: uri,
                    headers: {
                        "content-type": "application/json",
                        "authorization": 'Bearer ' + user.token(this.context)
                    },
                }, (err: any, request: any, body: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.handleRequest(reject, resolve, request);
                    }
                });
            });
        } catch (err) {
            return 'Err';
        }
    }

    public async send(options: any): Promise<any> {
        try {
            return new Promise((resolve, reject) => {
                request(options, (err: any, request: any, body: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.handleRequest(reject, resolve, request);
                    }
                });
            });
        } catch (err) {
            return 'Err';
        }
    }
    public async uploadFile(uri: string, formData: object): Promise<any> {
        try {
            return new Promise((resolve, reject) => {
                request({
                    method: 'POST',
                    json: true,
                    uri: uri,
                    headers: {
                        "content-type": "application/json",
                        "authorization": 'Bearer ' + user.token(this.context)
                    },
                    formData: formData
                }, (err: any, request: any, body: any) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.handleRequest(reject, resolve, request);
                    }
                });
            });
        } catch (err) {
            return 'Err';
        }
    }

    public handleRequest(reject: any, resolve: any, request: any) {
        if (request.statusCode === 401 && request.body.message === 'TokenInvalid') {
            user.signOut(this.context);
            reject('登录信息失效');
            vscode.window.showWarningMessage('登录信息失效,请重新登陆');
        }
        if (request.statusCode === 200 || request.statusCode === 201) {
            return resolve(request);
        }
        return reject(request);
    }

}