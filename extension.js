
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
  } = require("@google/generative-ai");

/**
 * @param {vscode.ExtensionContext} context
 */

let model;
let generationConfig;
let secretStorage;
let ready = false;

function activate(context) {
	const provider = new MyViewProvider(context.extensionUri);
	context.subscriptions.push(
	  vscode.window.registerWebviewViewProvider("vulnascan.View", provider)
	);
	secretStorage = context.secrets;

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
			if(checkAPI(apiKey)){
				secretStorage.store('myApiKey',apiKey);
				vscode.window.showInformationMessage("Key registered successfully");
			} else{
				vscode.window.showInformationMessage("Invalid API key")
			}
		} else{
			vscode.window.showInformationMessage("Key registration error")
		}
	});

	let getApiKey = vscode.commands.registerCommand('vulnascan.runscan', async () => {
		runYourScan();
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposablekey);
}

async function checkAPI(key){
	try{
		const apiKey = key;
		const genAI = new GoogleGenerativeAI(apiKey);

		generationConfig = {
			temperature: 1,
			topP: 0.95,
			topK: 64,
			maxOutputTokens: 8192,
			responseMimeType: "text/plain",
		}; 
		
		model = genAI.getGenerativeModel({
			model: "gemini-1.5-flash",
			systemInstruction: `
			You are an expert in code security analysis. Analyze the following Python code and detect any vulnerabilities such as API key exposure, SQL injection, or other security risks. Return a JSON array with each vulnerability found, including:

        - "Error" (the type of vulnerability)
        - "Location" (the line number where it occurs)
        - "Fix" (how to fix the vulnerability)
        - "Impact" (the potential impact of the vulnerability)
        - "Severity" (the severity level: Low, Medium, High)

        Do not include any explanation or additional commentary. Example format:

        [
            {
                "Error": "API_Key_Exposure",
                "Location": "Line 6",
                "Fix": "Use environment variables to store API keys",
                "Impact": "Potential unauthorized access to API",
                "Severity": "High"
            },
            {
                "Error": "SQL_Injection",
                "Location": "Line 10",
                "Fix": "Use parameterized queries or prepared statements",
                "Impact": "Unauthorized data access or manipulation",
                "Severity": "High"
            }
        ]
			`
		});
		
		const chatSession = model.startChat({
			generationConfig,
			safetySettings: [
			  {
				  category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
				  threshold: HarmBlockThreshold.BLOCK_NONE,
			  }
			  ],
			history: [
			],
		  });
		
		const result = await chatSession.sendMessage(code);
		ready = true;
		return 1;
  } catch(e){
	return 0;
  }
}

async function runscan() {
	let code = "No code";
	const editor = vscode.window.activeTextEditor;
	const storedApiKey = await secretStorage.get('myApiKey');
	if (editor) {
		if (storedApiKey){
			const document = editor.document;
			code = document.getText();

			vscode.window.showInformationMessage('Scanning.');

			// console.log(fileContent);
		} else{
			vscode.window.showErrorMessage('Error in API Key. Please setup API key first. Use documentation for more help.');
			return 0;
		}
	} else {
		vscode.window.showErrorMessage('No active editor found.');
		return 0;
	}
	if(!ready){
		checkAPI(storedApiKey);
	}
	const chatSession = model.startChat({
	  generationConfig,
      safetySettings: [
		{
			category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
			threshold: HarmBlockThreshold.BLOCK_NONE,
		}
		],
	  history: [
	  ],
	});
  
	const result = await chatSession.sendMessage(code);
	vscode.window.showInformationMessage('Done');
	return result.response.text();
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

	  webviewView.webview.onDidReceiveMessage(async message => {
		switch (message.command) {
		  case 'runScan':
			const scanresult = await this.runYourScan();
			webviewView.webview.postMessage({ command: 'sendresult', data: scanresult });
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

	async runYourScan() {
		const geminidata = await runscan();
		if (geminidata){
			const jsonData = JSON.parse(geminidata.slice(7,-3));
			return jsonData;
		} else{
			console.log("no SCAN RESULT data error");
		}
	}
  }

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
