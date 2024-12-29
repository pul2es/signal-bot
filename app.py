from flask import Flask, render_template, jsonify, request
import json
from datetime import datetime
import random
import os

app = Flask(__name__)

SIGNALS_FILE = 'signals.json'

def create_default_data():
    return {
        "signals": {
            "total_today": 0,
            "normal_signals": 0,
            "medium_signals": 0,
            "high_signals": 0
        },
        "stats": {
            "today_signals": 0,
            "win_rate": 95,
            "accuracy": 93,
            "status": "ACTIVE"
        },
        "last_reset": datetime.now().strftime("%Y-%m-%d")
    }

def check_and_reset_signals():
    if not os.path.exists(SIGNALS_FILE):
        with open(SIGNALS_FILE, 'w') as f:
            json.dump(create_default_data(), f, indent=4)
        return

    try:
        with open(SIGNALS_FILE, 'r+') as f:
            data = json.load(f)
            if not isinstance(data.get('signals', {}), dict):
                data = create_default_data()
            
            # Kunlik reset
            last_reset = datetime.strptime(data.get('last_reset', '2000-01-01'), "%Y-%m-%d").date()
            today = datetime.now().date()
            
            if last_reset < today:
                data['signals'] = {
                    "total_today": 0,
                    "normal_signals": 0,
                    "medium_signals": 0,
                    "high_signals": 0
                }
                data['last_reset'] = today.strftime("%Y-%m-%d")
            
            f.seek(0)
            json.dump(data, f, indent=4)
            f.truncate()
    except:
        with open(SIGNALS_FILE, 'w') as f:
            json.dump(create_default_data(), f, indent=4)

def get_signals_data():
    check_and_reset_signals()
    with open(SIGNALS_FILE, 'r') as f:
        return json.load(f)

def save_signals_data(data):
    with open(SIGNALS_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def generate_signal(game_type):
    data = get_signals_data()
    signals = data['signals']
    
    # Kunlik limit tekshiruvi
    if signals['total_today'] >= 72:
        return None
        
    # Signalni generatsiya qilish
    signal_type = random.random()  # 0 dan 1 gacha random son

    # 85% holatlarda oddiy signal (1-2x)
    if signal_type < 0.85:
        multiplier = round(random.uniform(1, 2), 2)
        signals['normal_signals'] += 1
    
    # 12% holatlarda o'rta signal (3-5x)
    elif signal_type < 0.97 and signals['medium_signals'] < 33:
        multiplier = round(random.uniform(3, 5), 2)
        signals['medium_signals'] += 1
    
    # 3% holatlarda katta signal (20-30x)
    elif signals['high_signals'] < 3:
        multiplier = round(random.uniform(20, 30), 2)
        signals['high_signals'] += 1
    
    # Agar yuqoridagi shartlar bajarilmasa, oddiy signal
    else:
        multiplier = round(random.uniform(1, 2), 2)
        signals['normal_signals'] += 1

    signals['total_today'] += 1
    data['signals'] = signals
    save_signals_data(data)
    
    # Signal uchun kutish vaqti
    if multiplier >= 20:
        countdown = random.randint(15, 20)  # Katta signallar uchun ko'proq kutish
    else:
        countdown = random.randint(10, 15)  # Oddiy va o'rta signallar uchun

    return {
        "multiplier": f"{multiplier}x",
        "countdown": countdown
    }

@app.route('/')
def index():
    data = get_signals_data()
    game = request.args.get('game', 'crash')
    bookmaker = request.args.get('bookmaker', '1xbet')
    lang = request.args.get('lang', 'en')
    
    data['stats']['today_signals'] = data['signals']['total_today']
    
    return render_template('index.html', 
                         game=game, 
                         bookmaker=bookmaker, 
                         lang=lang,
                         stats=data['stats'])

@app.route('/api/signal')
def get_signal():
    game_type = request.args.get('game', 'crash')
    signal = generate_signal(game_type)
    
    if signal is None:
        return jsonify({
            "error": "Bugun uchun signallar limiti tugadi",
            "status": "limit_reached"
        }), 429
    
    return jsonify(signal)

@app.route('/api/stats')
def get_stats():
    data = get_signals_data()
    stats = data['stats']
    stats['today_signals'] = data['signals']['total_today']
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=False)