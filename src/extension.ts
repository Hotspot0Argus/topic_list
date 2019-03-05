import * as vscode from 'vscode';
import { TopicListProvider, Topic } from './topicListProvider';
import { eventManager } from './eventManager';
import * as User from './user';

export function activate(context: vscode.ExtensionContext) {
	const _terminal = vscode.window.createTerminal(`Info Board`);
	eventManager.on('token', (content) => {
		context.globalState.update('token', { email: content.email, token: content.token });
		topicListProvider.refresh();
	});

	let signIn = vscode.commands.registerCommand('python123.signIn', () => {
		User.user.signIn();
	});
	let signOut = vscode.commands.registerCommand('python123.signOut', () => {
		User.user.signOut(context);
		topicListProvider.refresh();
	});
	let refresh = vscode.commands.registerCommand('python123.refresh', () => {
		topicListProvider.refresh();
	});
	let upload = vscode.commands.registerCommand('python123.upload', (topic: Topic) => {
		// todo: 检测身份，获取当前活动窗口，上传数据
		if (User.user.isSignIn(context)) {
			const window = vscode.window.activeTextEditor;
			
			if(window && window.document.languageId === "markdown"){
				console.log(window);
			}
			// topicListProvider.refresh();
		}

	});
	let uploadImg = vscode.commands.registerCommand('python123.uploadImg', (topic: Topic) => {
		// todo: 检测身份，上传图片,在控制台里显示图片路径
		if (User.user.isSignIn(context)) {
			const uri = '';
			_terminal.sendText('echo '+ uri);
			// topicListProvider.refresh();
		}

	});

	const topicListProvider: TopicListProvider = new TopicListProvider(context);
	context.subscriptions.push(signIn, signOut, refresh,uploadImg,
		vscode.window.registerTreeDataProvider("topic", topicListProvider));
	topicListProvider.refresh();
}

export function deactivate() { }
