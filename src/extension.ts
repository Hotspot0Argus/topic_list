import * as vscode from 'vscode';
import { TopicListProvider } from './tree/TopicListProvider';
import { DocNode } from './tree/DocNode';
import { eventManager } from './message/EventManager';
import { user } from './active/User';
import { HttpRequest } from './message/HttpRequest';
import * as fs from 'fs';

const setting = require('../resource/Setting.json');

export function activate(context: vscode.ExtensionContext) {
	const topicListProvider: TopicListProvider = new TopicListProvider(context);
	const httpRequest = new HttpRequest(context);
	const _terminal = vscode.window.createTerminal(`Info Board`);
	eventManager.on('token', (content) => {
		context.globalState.update('token', content);
		topicListProvider.refresh();
	});
	let articleList: string[] = [];

	function emptyDir(filePath: string) {
		const files = fs.readdirSync(filePath);
		files.forEach((file) => {
			const nextFilePath = `${filePath}/${file}`;
			const states = fs.statSync(nextFilePath);
			if (states.isDirectory()) {
				emptyDir(nextFilePath);
			} else {
				fs.unlinkSync(nextFilePath);
			}
		});
	}


	function rmEmptyDir(filePath: string) {
		const files = fs.readdirSync(filePath);
		if (files.length === 0) {
			fs.rmdirSync(filePath);
		} else {
			let tempFiles = 0;
			files.forEach((file) => {
				tempFiles++;
				const nextFilePath = `${filePath}/${file}`;
				rmEmptyDir(nextFilePath);
			});
			if (tempFiles === files.length) {
				fs.rmdirSync(filePath);
			}
		}
	}
	function init() {
		const filePath = context.extensionPath + '\\doc';
		if (fs.existsSync(filePath)) {
			emptyDir(filePath);
			rmEmptyDir(filePath);
		}
		fs.mkdirSync(filePath);
	}
	try { init(); } catch{ init(); }



	const signIn = vscode.commands.registerCommand('python123.signIn', () => {
		user.signIn(context);
	});
	const signOut = vscode.commands.registerCommand('python123.signOut', () => {
		user.signOut(context);
		topicListProvider.refresh();
	});
	const refresh = vscode.commands.registerCommand('python123.refresh', () => {
		topicListProvider.refresh();
	});
	const refreshList = vscode.commands.registerCommand('python123.refreshList', () => {
		articleList = [];
		init();
	});
	const uploadMarkdown = vscode.commands.registerCommand('python123.uploadMarkdown', async (node: DocNode) => {
		const window = vscode.window.activeTextEditor;
		if (window && window.document.languageId === "markdown") {
			const doc = await vscode.workspace.openTextDocument(window.document.uri.fsPath);

			const articleContent = doc.getText();
			const uri = setting.uri + 'topics/' + node.topic + '/contents';
			const allName: any = window.document.uri.fsPath.split('\\').pop();
			const name = allName.split('.')[0];
			try {
				const articleResult = await httpRequest.post(uri, {
					markdown: articleContent,
					name: name,
					type: 'markdown',
					parent: node.id
				});

				vscode.window.showInformationMessage('文件 ' + name + ' 上传成功' + (articleResult.data || ''));
				topicListProvider.refresh();
				return;
			} catch (err) { vscode.window.showErrorMessage('文件上传失败'); }
		}
		else {
			vscode.window.showErrorMessage('未在打开的窗口中检测到 MarkDown 文件');
		}
	});
	const uploadProblem = vscode.commands.registerCommand('python123.uploadProblem', async (node: DocNode) => {
		const problemInfo = await user.inputInfo([{ label: '习题名称名称', field: 'name' }, { label: '习题编号', field: 'id' }]);
		const topicId = node.topic;
		if (!problemInfo.name || !problemInfo.id) { return; }
		const uri = setting.uri + 'topics/' + topicId + '/contents';
		try {
			await httpRequest.post(uri, {
				name: problemInfo.name,
				parent: node.id,
				type: 'problem',
				problem_id: problemInfo.id
			});
			vscode.window.showInformationMessage('添加成功');
			topicListProvider.refresh();
			return;
		} catch (err) { vscode.window.showErrorMessage('添加失败'); }

	});

	const uploadImg = vscode.commands.registerCommand('python123.uploadImg', async () => {
		const options: vscode.OpenDialogOptions = {
			canSelectMany: false,
			openLabel: 'Open',
			filters: {
				'Images': ['png', 'jpg', 'jpeg']
			}
		};
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
				try {
					const result = await httpRequest.uploadFile(uri, formData);
					const filename = result.body.data;
					const path = '/images/' + filename[0] + filename[1] + '/' + filename[2] + filename[3] + '/' + filename.substr(4);
					_terminal.show();
					_terminal.sendText(`echo '图片路径：![${fileName}](${setting.host + path})'`);
					vscode.window.showInformationMessage('将 ' + fileUri[0].fsPath + ' 上传至 ' + setting.host + path + ' 可在控制台查看');
					fs.writeFile(path, content, { 'encoding': 'utf-8' }, function (err) {
						if (err) {
							throw err;
						}
					}
					);
				} catch (err) {
					vscode.window.showErrorMessage('上传失败');
					_terminal.show();
					_terminal.sendText('echo 图片 ' + fileUri[0].fsPath + ' 上传失败');
				}
			} catch (err) {
			}
		}
	});
	const newFolder = vscode.commands.registerCommand('python123.newFolder', async (node: DocNode) => {
		const folderInfo = await user.inputInfo([{ label: '目录名称', field: 'name' }]);
		const topicId = node.topic;
		if (!folderInfo.name) { return; }
		const uri = setting.uri + 'topics/' + topicId + '/contents';
		try {
			await httpRequest.post(uri, {
				name: folderInfo.name,
				parent: node.id,
				type: 'folder'
			});
			vscode.window.showInformationMessage('创建成功');
			topicListProvider.refresh();
			return;
		} catch (err) { vscode.window.showErrorMessage('创建失败'); }

	});
	const deleteNode = vscode.commands.registerCommand('python123.deleteNode', async (node: DocNode) => {
		if (node.type === 'folder' && node.children.length > 0) {
			vscode.window.showErrorMessage('无法删除含内容节点');
			return;
		}
		const confirm = await user.requireConfirm(`是否删除 ${node.name}？`);
		if (confirm === '否') {
			return;
		}
		const uri = setting.uri + 'topics/' + node.topic + '/contents/' + node.id;
		try {
			await httpRequest.delete(uri);
			vscode.window.showInformationMessage('删除成功');
			topicListProvider.refresh();
			return;
		} catch (err) { vscode.window.showErrorMessage('删除失败'); }

	});
	const editContent = vscode.commands.registerCommand('python123.editContent', async (node: DocNode) => {
		const info = await user.inputInfo([{ label: '新标题', field: 'name' }]);
		const uri = setting.uri + 'topics/' + node.topic + '/contents/' + node.id + '/name';
		try {
			await httpRequest.patch(uri, {
				name: info.name
			});

			vscode.window.showInformationMessage('修改成功');
			topicListProvider.refresh();
			return;
		} catch (err) { vscode.window.showErrorMessage('修改失败'); }

	});
	const sortNode = vscode.commands.registerCommand('python123.sortNode', async (node: DocNode) => {
		const info = await user.inputInfo([{ label: '新的组内位置（从 1 开始）', field: 'position' }]);
		const uri = setting.uri + 'topics/' + node.topic + '/contents/' + node.id + '/position';
		try {
			await httpRequest.patch(uri, {
				position: info.position
			});

			vscode.window.showInformationMessage('修改成功');
			topicListProvider.refresh();
			return;
		} catch (err) { vscode.window.showErrorMessage('修改失败,请确认新位置是否有效'); }

	});
	const getContent = vscode.commands.registerCommand('python123.getContent', async (id, type, title, problem) => {
		if (type !== 'markdown' && type !== 'problem') {
			vscode.window.showErrorMessage('当前节点无效');
			return;
		}
		const name = title + '.' + ((type === 'markdown' || type === 'problem') ? 'md' : 'ipynb');
		const index = articleList.findIndex((item) => {
			return item === id;
		});
		const path = context.extensionPath + '\\doc\\' + id;
		if (index >= 0) {
			openFileinVscode(path + '\\' + name);
			return;
		}
		try {
			let uri = '';
			switch (type) {
				case 'markdown': uri = setting.uri + 'articles/' + id; break;
				case 'problem': uri = setting.uri + 'teacher/problems/' + problem; break;
			}

			const result = await httpRequest.get(uri);

			const markdown = type === 'markdown' ? result.body.data.markdown : '#  题目部分:\n' + result.body.data.markdown_content + '\n#  讲解部分:\n' + result.body.data.markdown_explanation;

			fs.mkdir(path, 0o777, function (err) {
				if (err) {
					fs.rmdir(path, function (err) { });
				}
				fs.writeFile(path + '\\' + name, markdown, function (err) {
					if (err) { }
					articleList.push(id);
					openFileinVscode(path + '\\' + name);
				});
			});
			return;
		} catch (err) { vscode.window.showErrorMessage('加载当前节点内容失败'); }

	});
	async function openFileinVscode(path: string) {
		try {
			const doc = await vscode.workspace.openTextDocument(path);
			if (doc) {
				vscode.window.showTextDocument(doc);
				return;
			}
		} catch (e) { vscode.window.showErrorMessage('加载当前文章失败,建议清空缓存后重新点击查看。'); }
	}
	const updateArticle = vscode.commands.registerCommand('python123.updateArticle', async (node: DocNode) => {
		try {
			const path = context.extensionPath + '\\doc\\' + node.id + '\\' + node.name + (node.type === 'markdown' ? '.md' : '.ipynb');
			const doc = await vscode.workspace.openTextDocument(path);
			const uri = setting.uri + 'articles/' + node.id + '/markdown';

			await httpRequest.patch(uri, {
				markdown: doc.getText()
			});


			const index = articleList.findIndex((item) => {
				return item === node.id;
			});
			articleList.splice(index, 1);
			vscode.window.showInformationMessage(`文件 ${path} 已更新至服务器`);
			_terminal.sendText(`echo 文件 ${path} 已更新至服务器`);
			topicListProvider.refresh();
			return;

		} catch (e) {
			vscode.window.showErrorMessage('更新失败,请检查是否已经对该文章做过修改');
		}

	});

	context.subscriptions.push(signIn, signOut, refresh, uploadMarkdown, uploadProblem, updateArticle, refreshList, uploadImg, newFolder, deleteNode, editContent, sortNode, getContent,
		vscode.window.registerTreeDataProvider("topic", topicListProvider));
	topicListProvider.refresh();
}

export function deactivate() {
}
