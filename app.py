from flask import Flask, render_template, jsonify
import json, os

app = Flask(__name__)

# --- Load static JSON dataset ---
with open(os.path.join(app.static_folder, 'data', 'static_data.json')) as f:
    DATA = json.load(f)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/visualization')
def visualization():
    return render_template('visualization.html')

@app.route('/api/data')
def get_data():
    return jsonify(DATA)

if __name__ == '__main__':
    app.run(debug=True)
