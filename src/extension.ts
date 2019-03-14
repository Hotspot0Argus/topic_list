import * as vscode from 'vscode';
import { TopicListProvider } from './tree/TopicListProvider';
import { DocNode } from './tree/DocNode';
import { eventManager } from './message/EventManager';
import { user } from './active/User';
import { httpRequest } from './message/HttpRequest';
import * as fs from 'fs';

const setting = require('../resource/Setting.json');

export function activate(context: vscode.ExtensionContext) {
	const topicListProvider: TopicListProvider = new TopicListProvider(context);
	const _terminal = vscode.window.createTerminal(`Info Board`);
	eventManager.on('token', (content) => {
		context.globalState.update('token', content);
		topicListProvider.refresh();
	});

	const signIn = vscode.commands.registerCommand('python123.signIn', () => {
		user.signIn();
	});
	const signOut = vscode.commands.registerCommand('python123.signOut', () => {
		user.signOut(context);
		topicListProvider.refresh();
	});
	const refresh = vscode.commands.registerCommand('python123.refresh', () => {
		topicListProvider.refresh();
	});
	const upload = vscode.commands.registerCommand('python123.upload', async (node: DocNode) => {
		if (user.isSignIn(context)) {
			const window = vscode.window.activeTextEditor;
			if (window && window.document.languageId === "markdown") {
				const doc = await vscode.workspace.openTextDocument(window.document.uri.fsPath);

				const articleContent = doc.getText();
				const uri = setting.uri + 'topics/' + node.topic + '/contents';
				const allName: any = window.document.uri.fsPath.split('\\').pop();
				const name = allName.split('.')[0];
				const options = {
					uri: uri,
					method: 'POST',
					json: true,
					headers: {
						"content-type": "application/json",
						"authorization": 'Bearer ' + user.token(context)
					},
					body: {
						markdown: articleContent,
						name: name,
						type: 'markdown',
						parent: node.id
					}
				};
				const articleResult = await httpRequest.send(context, options);
				if (articleResult.statusCode === 200) {
					vscode.window.showInformationMessage('文件 ' + name + ' 上传成功' + (articleResult.data || ''));
					topicListProvider.refresh();
					return;
				}
				vscode.window.showErrorMessage('文件上传失败');
			}
			else {
				vscode.window.showErrorMessage('未在打开的窗口中检测到 MarkDown 文件');
			}
		}
	});
	const options: vscode.OpenDialogOptions = {
		canSelectMany: false,
		openLabel: 'Open',
		filters: {
			'Images': ['png', 'jpg', 'jpeg']
		}
	};
	const uploadImg = vscode.commands.registerCommand('python123.uploadImg', async (topic: DocNode) => {
		if (user.isSignIn(context)) {
			const uri = setting.uri + 'files';
			const fileUri = await vscode.window.showOpenDialog(options);
			if (fileUri) {
				try {
					const content: string = await new Promise((resolve, reject) => {
						fs.readFile(fileUri[0].fsPath, (err: any, buffer: any) => {
							if (err) {
								reject(err);
							} else {
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
							"authorization": 'Bearer ' + user.token(context)
						}
					};
					const result = await httpRequest.send(context, options);
					if (result.statusCode === 201) {
						const filename = result.body.data;
						const path = '/images/' + filename[0] + filename[1] + '/' + filename[2] + filename[3] + '/' + filename.substr(4);
						_terminal.show();
						_terminal.sendText('echo 将 ' + fileUri[0].fsPath + ' 上传至 ' + setting.host + path);
						vscode.window.showInformationMessage('将 ' + fileUri[0].fsPath + ' 上传至 ' + setting.host + path + ' 可在控制台查看');
						fs.writeFile(path, content, { 'encoding': 'utf-8' }, function (err) {
							if (err) {
								throw err;
							}
						}
						);
					} else {
						vscode.window.showErrorMessage('上传失败');
						_terminal.show();
						_terminal.sendText('echo 图片 ' + fileUri[0].fsPath + ' 上传失败');
					}
				} catch (err) {
				}
			}
		}

	});
	const newFolder = vscode.commands.registerCommand('python123.newFolder', async (node: DocNode) => {
		const topicInfo = await user.inputInfo([{ label: '目录名称', field: 'name' }]);
		const topicId = node.topic;
		const uri = setting.uri + 'topics/' + topicId + '/contents';
		const options = {
			uri: uri,
			method: 'POST',
			json: true,
			headers: {
				"content-type": "application/json",
				"authorization": 'Bearer ' + user.token(context)
			},
			body: {
				name: topicInfo.name,
				parent: node.id,
				type: 'folder'
			}
		};
		const result = await httpRequest.send(context, options);
		if (result.statusCode === 200) {
			vscode.window.showInformationMessage('创建成功');
			topicListProvider.refresh();
			return;
		}
		vscode.window.showErrorMessage('创建失败');
	});
	const deleteNode = vscode.commands.registerCommand('python123.deleteNode', async (node: DocNode) => {
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
				"authorization": 'Bearer ' + user.token(context)
			}
		};
		const result = await httpRequest.send(context, options);
		if (result.statusCode === 200) {
			vscode.window.showInformationMessage('删除成功');
			topicListProvider.refresh();
			return;
		}
		vscode.window.showErrorMessage('删除失败');
	});
	const editContent = vscode.commands.registerCommand('python123.editContent', async (node: DocNode) => {
		const info = await user.inputInfo([{ label: '新标题', field: 'name' }]);
		const uri = setting.uri + 'topics/' + node.topic + '/contents/' + node.id + '/name';
		const options = {
			uri: uri,
			method: 'PATCH',
			json: true,
			headers: {
				"content-type": "application/json",
				"authorization": 'Bearer ' + user.token(context)
			},
			body: {
				name: info.name
			}
		};
		const result = await httpRequest.send(context, options);
		if (result.statusCode === 200) {
			vscode.window.showInformationMessage('修改成功');
			topicListProvider.refresh();
			return;
		}
		vscode.window.showErrorMessage('修改失败');
	});
	const sortNode = vscode.commands.registerCommand('python123.sortNode', async (node: DocNode) => {
		const info = await user.inputInfo([{ label: '新的组内位置（从 1 开始）', field: 'position' }]);
		const uri = setting.uri + 'topics/' + node.topic + '/contents/' + node.id + '/position';
		const options = {
			uri: uri,
			method: 'PATCH',
			json: true,
			headers: {
				"content-type": "application/json",
				"authorization": 'Bearer ' + user.token(context)
			},
			body: {
				position: info.position
			}
		};
		const result = await httpRequest.send(context, options);
		if (result.statusCode === 200) {
			vscode.window.showInformationMessage('修改成功');
			topicListProvider.refresh();
			return;
		}
		vscode.window.showErrorMessage('修改失败,请确认新位置是否有效');
	});

	context.subscriptions.push(signIn, signOut, refresh, upload, uploadImg, newFolder, deleteNode, editContent, sortNode,
		vscode.window.registerTreeDataProvider("topic", topicListProvider));
	topicListProvider.refresh();
}

export function deactivate() {
}
