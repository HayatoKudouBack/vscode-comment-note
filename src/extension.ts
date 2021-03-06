import * as vscode from 'vscode';

let commentId = 1;

class NoteComment implements vscode.Comment {
	id: number;
	label: string | undefined;
	constructor(
		public body: string | vscode.MarkdownString,
		public mode: vscode.CommentMode,
		public author: vscode.CommentAuthorInformation,
		public parent?: vscode.CommentThread,
		public contextValue?: string
	) {
		this.id = ++commentId;
	}
}

export function activate(context: vscode.ExtensionContext) {
	const commentController = vscode.comments.createCommentController('comment-sample', 'Comment API Sample');
	context.subscriptions.push(commentController);
	commentController.commentingRangeProvider = {
		provideCommentingRanges: (document: vscode.TextDocument, token: vscode.CancellationToken) => {
			const lineCount = document.lineCount;
			return [new vscode.Range(0, 0, lineCount - 1, 0)];
		}
	};

	const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

	const cmd_id = 'show_quick';
	let default_locale = 'en';
	const cmd = vscode.commands.registerCommand(cmd_id, () => {
		vscode.window.showQuickPick(['en', 'ja', 'zh-cn', 'ko', 'fr', 'de']).then((selected) => {
			if(selected !== undefined){
				default_locale = selected;
				myStatusBarItem.text = `$(globe) `+default_locale;
				context.subscriptions.push(myStatusBarItem);
				myStatusBarItem.show();
			}
		});
	});

	myStatusBarItem.command = cmd_id;
	myStatusBarItem.text = `$(globe) `+default_locale;
	context.subscriptions.push(myStatusBarItem);
	myStatusBarItem.show();

	context.subscriptions.push(vscode.commands.registerCommand('mywiki.createNote', (reply: vscode.CommentReply) => {
		replyNote(reply);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('mywiki.replyNote', (reply: vscode.CommentReply) => {
		replyNote(reply);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('mywiki.deleteNoteComment', (comment: NoteComment) => {
		const thread = comment.parent;
		if (!thread) {
			return;
		}
		thread.comments = thread.comments.filter(cmt => (cmt as NoteComment).id !== comment.id);
		if (thread.comments.length === 0) {
			thread.dispose();
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('mywiki.deleteNote', (thread: vscode.CommentThread) => {
		thread.dispose();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('mywiki.cancelsaveNote', (comment: NoteComment) => {
		if (!comment.parent) {
			return;
		}
		comment.parent.comments = comment.parent.comments.map(cmt => {
			if ((cmt as NoteComment).id === comment.id) {
				cmt.mode = vscode.CommentMode.Preview;
			}
			return cmt;
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('mywiki.saveNote', (comment: NoteComment) => {
		if (!comment.parent) {
			return;
		}
		comment.parent.comments = comment.parent.comments.map(cmt => {
			if ((cmt as NoteComment).id === comment.id) {
				cmt.mode = vscode.CommentMode.Preview;
			}
			return cmt;
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('mywiki.editNote', (comment: NoteComment) => {
		if (!comment.parent) {
			return;
		}
		comment.parent.comments = comment.parent.comments.map(cmt => {
			if ((cmt as NoteComment).id === comment.id) {
				cmt.mode = vscode.CommentMode.Editing;
			}
			return cmt;
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('mywiki.dispose', () => {
		commentController.dispose();
	}));

	function replyNote(reply: vscode.CommentReply) {
		const thread = reply.thread;
		const date = new Date();
		const format_date = date.toLocaleString(default_locale);
		const reply_text = format_date + ": " + reply.text;
		const newComment = new NoteComment(reply_text, vscode.CommentMode.Preview, { name: '' }, thread, thread.comments.length ? 'canDelete' : undefined);
		if (thread.contextValue === 'draft') {
			newComment.label = 'pending';
		}

		thread.comments = [...thread.comments, newComment];
	}
}
