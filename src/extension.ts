import * as vscode from 'vscode';
import { TopicListProvider, Topic,Column } from './topicListProvider';
import { eventManager } from './eventManager';
import { user } from './user';
import { httpRequest } from './httpRequest'
import * as fs from 'fs'

export function activate(context: vscode.ExtensionContext) {
	const _terminal = vscode.window.createTerminal(`Info Board`);
	eventManager.on('token', (content) => {
		context.globalState.update('token', { email: content.email, token: content.token });
		topicListProvider.refresh();
	});

	let signIn = vscode.commands.registerCommand('python123.signIn', () => {
		user.signIn();
	});
	let signOut = vscode.commands.registerCommand('python123.signOut', () => {
		user.signOut(context);
		topicListProvider.refresh();
	});
	let refresh = vscode.commands.registerCommand('python123.refresh', () => {
		topicListProvider.refresh();
	});
	let upload = vscode.commands.registerCommand('python123.upload', async (topic: Topic) => {
		// todo: 检测身份，获取当前活动窗口，上传数据
		if (user.isSignIn(context)) {
			const window = vscode.window.activeTextEditor;
			if (window && window.document.languageId === "markdown") {
				//todo: input info
				const articleInfo = await user.inputInfo([{ label: '标题', field:'title' },
				 { label: '副标题',field:'subTitle'}, { label: '作者名称',filed:'penName'}]);
				const doc = await vscode.workspace.openTextDocument(window.document.uri.fsPath);
				const articleContent = doc.getText();
				//todo: send and get articleID
				//todo:put article in topic 
			}
			// topicListProvider.refresh();
		}

	});
	const options: vscode.OpenDialogOptions = {
		canSelectMany: false,
		openLabel: 'Open',
		filters: {
			'Images': ['png', 'jpg', 'jpeg']
		}
	};
	let uploadImg = vscode.commands.registerCommand('python123.uploadImg', async (topic: Topic) => {
		// todo: 检测身份，上传图片,在控制台里显示图片路径
		if (user.isSignIn(context)) {
			const uri = 'https://www.python123.io/api/v1/files';
			const fileUri = await vscode.window.showOpenDialog(options);
			if (fileUri) {
				_terminal.sendText('echo ' + fileUri[0].path);
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
					//todo：构造file类
					const result = await httpRequest.post(context, uri, { files: { file: content }, extension: "" });
				} catch (err) {
					console.log(err);
				}
			}
		}

	});
	let newFolderInColumn = vscode.commands.registerCommand('python123.newFolderInColumn',async (column:Column) => {
		const topicInfo = await user.inputInfo([{ label: '专栏名称', field:'name' },
		{ label: '专栏 URI',field:'uri'}, { label: '专栏描述',filed:'description'},{label:'推荐专栏',field:'recommended'}]);
		topicInfo.parent = column.id;
		topicListProvider.refresh();
	});
	let newFolderInTopic = vscode.commands.registerCommand('python123.newFolderInTopic', async (topic: Topic) => {
		const folderInfo = await user.inputInfo([{ label: '专栏名称', field:'name' },
		{ label: '专栏 URI',field:'uri'}, { label: '专栏描述',filed:'description'}]);
		folderInfo.parent = topic.id;
		const column = topic.parent;
		topicListProvider.refresh();
	});
	let deleteFolder = vscode.commands.registerCommand('python123.deleteFolder', () => {
		//todo: 循环删除所有文件 in python123
		topicListProvider.refresh();
	});
	let deleteDoc = vscode.commands.registerCommand('python123.deleteDoc', () => {
		topicListProvider.refresh();
	});

	const topicListProvider: TopicListProvider = new TopicListProvider(context);
	context.subscriptions.push(signIn, signOut, refresh, upload, uploadImg,
		vscode.window.registerTreeDataProvider("topic", topicListProvider));
	topicListProvider.refresh();
}

export function deactivate() { }
