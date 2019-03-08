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
const request = require('request');
const vscode = require("vscode");
const user_1 = require("./user");
class HttpRequest {
    get(context, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return new Promise((resolve, reject) => {
                    request({
                        method: 'GET',
                        uri: uri,
                        headers: {
                            "content-type": "application/json",
                            "authorization": 'Bearer ' + user_1.user.token(context)
                        }
                    }, (err, request, body) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(request);
                        }
                    });
                });
            }
            catch (err) {
                return 'Err';
            }
        });
    }
    send(context, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return new Promise((resolve, reject) => {
                    request(options, (err, request, body) => {
                        if (err) {
                            reject(err);
                        }
                        else if (request.statusCode === 401 && body.message === 'TokenInvalid') {
                            user_1.user.signOut(context);
                            reject('登录信息失效');
                            vscode.window.showWarningMessage('登录信息失效,请重新登陆');
                        }
                        else {
                            resolve(request);
                        }
                    });
                });
            }
            catch (err) {
                return 'Err';
            }
        });
    }
}
exports.httpRequest = new HttpRequest();
//# sourceMappingURL=httpRequest.js.map