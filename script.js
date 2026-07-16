let mode = 'ru'; // 'ru' или 'try'

// Грамматические правила
const grammar = {
    tenses: {
        'наст.вр.': { prefix: '', desc: 'настоящее время' },
        'прош.вр.': { prefix: 'жо', desc: 'прошедшее время (жо-)' },
        'буд.вр.': { prefix: 'хё', desc: 'будущее время (хё-)' }
    },
    plural: { prefix: 'тё', desc: 'множественное число (тё-)' },
    possessive: { prefix: 'я', desc: 'притяжательность (я-)' }
};

function switchMode(m) {
    mode = m;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => {
        if ((m === 'ru' && t.innerText.includes('Русский')) || 
            (m === 'try' && t.innerText.includes('Trýabian'))) {
            t.classList.add('active');
        }
    });
    document.getElementById('search').value = '';
    document.getElementById('result').style.display = 'none';
    document.getElementById('sentence-result').style.display = 'none';
    if (m === 'try') renderAlphabet();
    else document.getElementById('alphabet').innerHTML = '';
}

function renderAlphabet() {
    const letters = [...new Set(dictionary.map(w => w[0][0].toLowerCase()))].sort();
    document.getElementById('alphabet').innerHTML = letters.map(l => 
        `<span class="letter" onclick="document.getElementById('search').value='${l}'; search()">${l}</span>`
    ).join('');
}

// Создаём индексы для быстрого поиска
const ruIndex = {};
const tryIndex = {};

dictionary.forEach(w => {
    // Индекс русский → tryabian
    const ruWords = w[4].toLowerCase().split(/[,;\s]+/);
    ruWords.forEach(rw => {
        if (!ruIndex[rw]) ruIndex[rw] = [];
        ruIndex[rw].push(w);
    });
    
    // Индекс tryabian → русский (латиница и кириллица)
    if (!tryIndex[w[0].toLowerCase()]) tryIndex[w[0].toLowerCase()] = w;
    if (!tryIndex[w[1].toLowerCase()]) tryIndex[w[1].toLowerCase()] = w;
});

function search() {
    const query = document.getElementById('search').value.trim();
    const resultDiv = document.getElementById('result');
    const sentenceDiv = document.getElementById('sentence-result');
    const content = document.getElementById('result-content');
    const sentenceContent = document.getElementById('sentence-content');
    
    if (!query) { 
        resultDiv.style.display = 'none'; 
        sentenceDiv.style.display = 'none';
        return; 
    }
    
    // Проверяем, предложение ли это (несколько слов)
    const words = query.split(/\s+/);
    
    if (words.length > 1) {
        // Переводим предложение
        resultDiv.style.display = 'none';
        sentenceDiv.style.display = 'block';
        
        let translated = [];
        let breakdown = [];
        
        words.forEach((word, i) => {
            const cleanWord = word.toLowerCase().replace(/[.,!?]/g, '');
            const punct = word.match(/[.,!?]/) ? word.match(/[.,!?]/)[0] : '';
            
            if (mode === 'ru') {
                // Русский → Tryabian
                const entry = ruIndex[cleanWord];
                if (entry) {
                    const w = entry[0];
                    translated.push(w[0] + punct);
                    breakdown.push(`${word} → ${w[0]} (${w[1]}) [${w[3]}]`);
                } else {
                    translated.push(`[${word}]`);
                    breakdown.push(`${word} → ❌ не найдено`);
                }
            } else {
                // Tryabian → Русский
                const entry = tryIndex[cleanWord];
                if (entry) {
                    translated.push(entry[4].split(',')[0] + punct);
                    breakdown.push(`${word} → ${entry[4]} [${entry[3]}]`);
                } else {
                    // Пробуем распознать грамматические префиксы
                    let stem = cleanWord;
                    let grammarNote = '';
                    
                    if (stem.startsWith('хё')) {
                        stem = stem.substring(2);
                        grammarNote = ' (буд.вр.)';
                    } else if (stem.startsWith('жо')) {
                        stem = stem.substring(2);
                        grammarNote = ' (прош.вр.)';
                    } else if (stem.startsWith('тё')) {
                        stem = stem.substring(2);
                        grammarNote = ' (мн.ч.)';
                    } else if (stem.startsWith('я')) {
                        stem = stem.substring(1);
                        grammarNote = ' (притяж.)';
                    }
                    
                    const stemEntry = tryIndex[stem];
                    if (stemEntry) {
                        translated.push(stemEntry[4].split(',')[0] + grammarNote + punct);
                        breakdown.push(`${word} → ${stemEntry[4]}${grammarNote} [основа: ${stem}]`);
                    } else {
                        translated.push(`[${word}]`);
                        breakdown.push(`${word} → ❌ не найдено`);
                    }
                }
            }
        });
        
        sentenceContent.innerHTML = `
            <div style="background:#0f3460;padding:20px;border-radius:8px;margin-bottom:15px;">
                <div style="font-size:14px;color:#aaa;margin-bottom:5px;">ПЕРЕВОД:</div>
                <div style="font-size:22px;color:#fff;">${translated.join(' ')}</div>
            </div>
            <div style="background:#16213e;padding:20px;border-radius:8px;">
                <div style="font-size:14px;color:#aaa;margin-bottom:10px;">РАЗБОР:</div>
                ${breakdown.map(b => `<div style="font-size:16px;color:#ccc;margin:5px 0;">${b}</div>`).join('')}
            </div>
        `;
        
    } else {
        // Переводим одно слово (старая логика)
        sentenceDiv.style.display = 'none';
        
        let matches = [];
        if (mode === 'ru') {
            const q = query.toLowerCase();
            Object.keys(ruIndex).forEach(key => {
                if (key.includes(q)) {
                    ruIndex[key].forEach(w => {
                        if (!matches.includes(w)) matches.push(w);
                    });
                }
            });
        } else {
            const q = query.toLowerCase();
            Object.keys(tryIndex).forEach(key => {
                if (key.includes(q)) {
                    const w = tryIndex[key];
                    if (!matches.includes(w)) matches.push(w);
                }
            });
        }
        
        if (matches.length === 0) {
            content.innerHTML = '<div id="not-found">❌ Слово не найдено</div>';
            resultDiv.style.display = 'block';
            return;
        }
        
        content.innerHTML = matches.slice(0, 20).map(w => `
            <div class="word-title">${w[0]} <span style="font-size:16px;color:#ccc;">(${w[1]})</span></div>
            <div class="word-pron">${w[2]}</div>
            <div class="word-pos">${w[3]}</div>
            <div class="word-def">→ ${w[4]}</div>
            <hr style="border-color:#333;margin:15px 0;">
        `).join('');
        resultDiv.style.display = 'block';
    }
}

// Инициализация
renderAlphabet();
