import * as vscode from 'vscode';
import { TopicListProvider } from './topicListProvider';
import { DocNode } from './docNode';
import { eventManager } from './eventManager';
import { user } from './user';
import { httpRequest } from './httpRequest';
import * as fs from 'fs';
const setting = require('../resource/setting.json');

export function activate(context: vscode.ExtensionContext) {
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
	const upload = vscode.commands.registerCommand('python123.upload', async (topic: DocNode) => {
		if (user.isSignIn(context)) {
			const window = vscode.window.activeTextEditor;
			if (window && window.document.languageId === "markdown") {
				//todo: input info
				const articleInfo = await user.inputInfo([{ label: '标题', field: 'title' },
				{ label: '副标题', field: 'subtitle' }, { label: '作者名称', field: 'penName' }, { label: ' URI', field: 'uri' }]);
				if (articleInfo.uri.length > 100) {
					vscode.window.showInformationMessage('URI 文章 URI 过长');
					return;
				}
				const doc = await vscode.workspace.openTextDocument(window.document.uri.fsPath);
				if (!doc) {
					vscode.window.showErrorMessage('请在 vscode 打开要上传的文件并将光标指入');
					return;
				}
				const articleContent = doc.getText();
				const uri = setting.uri + 'articles/';
				const options = {
					uri: uri,
					method: 'POST',
					json: true,
					headers: {
						"content-type": "application/json",
						"authorization": 'Bearer ' + user.token(context)
					},
					body: {
						content: JSON.stringify({ content: articleContent }),
						pen_name: articleInfo.penName,
						title: articleInfo.title,
						subtitle: articleInfo.subtitle
					}
				};
				const articleResult = await httpRequest.send(context, options);
				if (articleResult.statusCode === 201) {
					const targetUri = setting.uri + 'topics/' + topic.topic + '/articles';
					const options = {
						uri: targetUri,
						method: 'POST',
						json: true,
						headers: {
							"content-type": "application/json",
							"authorization": 'Bearer ' + user.token(context)
						},
						body: {
							article_id: articleResult.body.data._id,
							parent: topic.id,
							uri: articleInfo.uri
						}
					};
					const topicResult = await httpRequest.send(context, options);
					if (topicResult.statusCode === 200) {
						vscode.window.showInformationMessage('上传成功');
						topicListProvider.refresh();
						return;
					}
					vscode.window.showErrorMessage('未能添加文件 ID:' + articleResult.body.data._id + '到所选目录');
					return;
				}
				vscode.window.showErrorMessage('上传失败请重新上传文件');
			} else {
				vscode.window.showErrorMessage('请在 vscode 打开要上传的文件并将光标指入');
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
					}
				} catch (err) {
				}
			}
		}

	});
	const newFolderInColumn = vscode.commands.registerCommand('python123.newFolderInColumn', async () => {
		const topicInfo = await user.inputInfo([{ label: '专栏名称', field: 'name' },
		{ label: '专栏 URI', field: 'uri' }, { label: '专栏描述', field: 'description' },
		{ label: '专栏领域', field: 'category' }, { label: '是否推荐专栏（true 或 false）', field: 'recommended' },
		{ label: '是否公开专栏（true 或 false）', field: 'is_public' }]);
		const targetUri = setting.uri + 'topics/';
		const options = {
			uri: targetUri,
			method: 'POST',
			json: true,
			headers: {
				"content-type": "application/json",
				"authorization": 'Bearer ' + user.token(context)
			},
			body: {
				name: topicInfo.name,
				description: topicInfo.description,
				uri: topicInfo.uri,
				category: topicInfo.category,
				recommended: topicInfo.recommended === 'true' ? true : false,
				is_public: topicInfo.is_public === 'true' ? true : false,
			}
		};
		const result = await httpRequest.send(context, options);
		if (result.statusCode === 201) {
			vscode.window.showInformationMessage('创建成功');
			topicListProvider.refresh();
		}
	});
	const newFolderInTopic = vscode.commands.registerCommand('python123.newFolderInTopic', async (node: DocNode) => {
		const topicInfo = await user.inputInfo([{ label: '目录名称', field: 'name' }]);
		const topicId = node.topic;
		const uri = setting.uri + 'topics/' + topicId + '/folders';
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
				parent: node.id
			}
		};
		const result = await httpRequest.send(context, options);
		if (result.statusCode === 201) {
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
	const editArticle = vscode.commands.registerCommand('python123.editArticle', async (node: DocNode) => {
		const info = await user.inputInfo([{ label: '文章 URI', field: 'uri' }, { label: '作者名称', field: 'penName' }]);
		const uri = setting.uri + 'topics/' + node.topic + '/articles/' + node.id;
		const options = {
			uri: uri,
			method: 'PATCH',
			json: true,
			headers: {
				"content-type": "application/json",
				"authorization": 'Bearer ' + user.token(context)
			},
			body: {
				uri: info.uri,
				pen_name: info.penName
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

	const editFolder = vscode.commands.registerCommand('python123.editFolder', async (node: DocNode) => {
		const info = await user.inputInfo([{ label: '节点名称', field: 'name' }]);
		const uri = setting.uri + 'topics/' + node.topic + '/folders/' + node.id;
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


	const topicListProvider: TopicListProvider = new TopicListProvider(context);
	context.subscriptions.push(signIn, signOut, refresh, upload, uploadImg, newFolderInColumn, newFolderInTopic, deleteNode, editArticle, editFolder,
		vscode.window.registerTreeDataProvider("topic", topicListProvider));
	topicListProvider.refresh();
}

export function deactivate() { }
