import subprocess
from flask import Flask, request

app = Flask(__name__)

@app.route('/ping', methods=['GET'])
def ping():
    host = request.args.get('host', '')
    if not host:
        return "Please provide a host parameter", 400

    command = f"ping -c 1 {host}"
    result = subprocess.getoutput(command)
    return f"<pre>{result}</pre>"

if __name__ == '__main__':
    app.run(debug=True)
