
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
	const provider = new MyViewProvider(context.extensionUri);
	context.subscriptions.push(
	  vscode.window.registerWebviewViewProvider("vulnascan.View", provider)
	);
	const secretStorage = context.secrets;

	console.log("Extension Begin");

	const disposable = vscode.commands.registerCommand('vulnascan.helloWorld', function () {
		vscode.window.showInformationMessage('Hello World from VulnaScan!');
	});

	let disposablekey = vscode.commands.registerCommand('vulnascan.askForApiKey', async () => {
		const apiKey = await vscode.window.showInputBox({
		  prompt: "Enter your API key",
		  placeHolder: "API Key",
		  password: true
		});
		if(apiKey){
			secretStorage.store('myApiKey',apiKey);
			vscode.window.showInformationMessage("Key registered successfully")
		} else{
			vscode.window.showInformationMessage("Key registration error")
		}
	});

	let getApiKey = vscode.commands.registerCommand('vulnascan.getApiKey', async () => {
		const storedApiKey = await secretStorage.get('myApiKey');
		if (storedApiKey) {
		  vscode.window.showInformationMessage(`Your stored API key is: ${storedApiKey}`);
		} else {
		  vscode.window.showInformationMessage('No API key found.');
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposablekey);
}

class MyViewProvider {
	constructor(extensionUri) {
	  this._extensionUri = extensionUri;
	}
  
	resolveWebviewView(webviewView, context, _token) {
	  this._view = webviewView;
  
	  webviewView.webview.options = {
		enableScripts: true
	  };

	  webviewView.webview.onDidReceiveMessage(message => {
		switch (message.command) {
		  case 'runScan':
			webviewView.webview.postMessage({ command: 'sendresult', data: this.runYourScan() });

			break;
		}
	  });

	  const htmlFilePath = path.join(this._extensionUri.fsPath, 'webview.html');
	  let html = fs.readFileSync(htmlFilePath, 'utf8');

	  webviewView.webview.html = html;
  
	  //Below For HTML EMBED in this file
	  // webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	}

	
	// _getHtmlForWebview(webview) {
	//   return `HTML CODE HERE`;
	// } 

	runYourScan() {
		vscode.commands.executeCommand('vulnascan.getApiKey');

		const jsonData = [
			{
				"Error" : "Example 1 : API_Exposed",
				"Location" : "Line 6"
			  },
			{
				"Error" : "Example 2",
				"Location" : "Line 10"
			}
		  ];
		return jsonData;
	}
  }

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
