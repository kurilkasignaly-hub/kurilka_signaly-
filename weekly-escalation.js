// ============================================================
// ЛОГИКА ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// ============================================================

let weeklyEscState = {
    level: 1,
    playerCount: 0,
    players: [],
    equipSelections: {},
    ampSelections: {},
    usedAmps: {},
    unlockedAmps: {},
    allAmpsUsed: {},
    currentStep: 1,
    map: null,
    trial: null,
    difficulty: null,
    variators: [],
    isFirstRun: true,
    usedBigTrials: [],
    usedSmallTrials: [],
    nostophobiaCount: 0,
    // Специальные поля для еженедельной эскалации
    weeklyVariator: null,
    weeklyFixedVariators: [],
    weeklyAddedVariators: [],
    weeklyLevelCounter: 1,
    weeklyLastResetLevel: 1
};

// ============================================================
// ФИКСИРОВАННЫЙ СПИСОК ВАРИАТОРОВ ДЛЯ ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// ============================================================

var WEEKLY_VARIATOR_POOL = [
    'Таймер бомбы',
    'Вечная мерзлота',
    'Глубокий ожог',
    'Кровотечение'
];

// ============================================================
// ПОЛУЧЕНИЕ ПОЛНОГО ОБЪЕКТА ВАРИАТОРА ПО ИМЕНИ
// ============================================================

function getVariatorByName(name) {
    if (typeof allVariatorsData === 'undefined') return null;
    return allVariatorsData.find(function(v) { return v.name === name; }) || null;
}

// ============================================================
// ПОЛУЧЕНИЕ СЛУЧАЙНОГО ЕЖЕНЕДЕЛЬНОГО ВАРИАТОРА
// ============================================================

function getWeeklyVariator() {
    // Выбираем случайное имя из пула
    var randomIndex = Math.floor(Math.random() * WEEKLY_VARIATOR_POOL.length);
    var selectedName = WEEKLY_VARIATOR_POOL[randomIndex];
    
    // Получаем полный объект вариатора из allVariatorsData
    var fullVariator = getVariatorByName(selectedName);
    
    if (!fullVariator) {
        console.warn('⚠️ Вариатор "' + selectedName + '" не найден в allVariatorsData');
        // Создаем заглушку, если вариатор не найден
        return {
            id: 'weekly_' + selectedName.replace(/\s/g, '_').toLowerCase(),
            name: selectedName,
            image: 'images/placeholder.png',
            desc: 'Еженедельный вариатор'
        };
    }
    
    console.log('✅ Выбран еженедельный вариатор:', fullVariator.name);
    return fullVariator;
}

// ============================================================
// ПРОВЕРКА ЯВЛЯЕТСЯ ЛИ ВАРИАТОР ЕЖЕНЕДЕЛЬНЫМ
// ============================================================

function isWeeklyVariator(variator) {
    if (!variator) return false;
    if (!weeklyEscState.weeklyVariator) return false;
    return variator.name === weeklyEscState.weeklyVariator.name;
}

// ============================================================
// ПРОВЕРКА НУЖНО ЛИ СБРОСИТЬ ЕЖЕНЕДЕЛЬНУЮ ЭСКАЛАЦИЮ
// ============================================================

function isWeeklyResetNeeded() {
    var now = new Date();
    var day = now.getDay();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    
    // Вторник после 21:00
    if (day === 2 && hours >= 21 && minutes >= 0) {
        var lastReset = localStorage.getItem('weeklyEscLastReset');
        if (lastReset) {
            var lastResetDate = new Date(lastReset);
            var lastResetWeek = getWeekNumber(lastResetDate);
            var currentWeek = getWeekNumber(now);
            if (lastResetWeek === currentWeek) {
                return false;
            }
        }
        return true;
    }
    return false;
}

// ============================================================
// НОМЕР НЕДЕЛИ
// ============================================================

function getWeekNumber(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    var week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// ============================================================
// СБРОС ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// ============================================================

function resetWeeklyEscalation() {
    var newWeekly = getWeeklyVariator();
    
    weeklyEscState = {
        level: 1,
        playerCount: 0,
        players: [],
        equipSelections: {},
        ampSelections: {},
        usedAmps: {},
        unlockedAmps: {},
        allAmpsUsed: {},
        currentStep: 1,
        map: null,
        trial: null,
        difficulty: null,
        variators: [],
        isFirstRun: true,
        usedBigTrials: [],
        usedSmallTrials: [],
        nostophobiaCount: 0,
        weeklyVariator: newWeekly,
        weeklyFixedVariators: newWeekly ? [newWeekly] : [],
        weeklyAddedVariators: [],
        weeklyLevelCounter: 1,
        weeklyLastResetLevel: 1
    };
    
    var weekNumber = getWeekNumber(new Date());
    localStorage.setItem('weeklyEscWeekNumber', weekNumber.toString());
    localStorage.setItem('weeklyEscLastReset', new Date().toISOString());
    if (newWeekly) {
        localStorage.setItem('weeklyEscVariator', JSON.stringify(newWeekly));
    } else {
        localStorage.removeItem('weeklyEscVariator');
    }
    
    console.log('🔄 Еженедельная эскалация сброшена!');
    console.log('📌 Еженедельный вариатор:', newWeekly ? newWeekly.name : 'Нет');
    
    // Обновляем отображение
    updateWeeklyVariatorDisplay();
    
    return newWeekly;
}

// ============================================================
// ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ ЕЖЕНЕДЕЛЬНОГО ВАРИАТОРА
// ============================================================

function updateWeeklyVariatorDisplay() {
    var nameEl = document.getElementById('weeklyVariatorName');
    if (nameEl) {
        if (weeklyEscState.weeklyVariator) {
            nameEl.innerHTML = '<i class="fas fa-star"></i> ' + weeklyEscState.weeklyVariator.name;
        } else {
            nameEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Не выбран';
        }
    }
}

// ============================================================
// ВОССТАНОВЛЕНИЕ ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ ИЗ LOCALSTORAGE
// ============================================================

function restoreWeeklyEscalation() {
    if (isWeeklyResetNeeded()) {
        console.log('🔄 Наступила новая неделя, сбрасываем еженедельную эскалацию...');
        return resetWeeklyEscalation();
    }
    
    var savedVariator = localStorage.getItem('weeklyEscVariator');
    var savedWeek = localStorage.getItem('weeklyEscWeekNumber');
    var currentWeek = getWeekNumber(new Date());
    
    if (savedVariator && savedWeek && parseInt(savedWeek) === currentWeek) {
        try {
            var variator = JSON.parse(savedVariator);
            // Проверяем, что вариатор существует в allVariatorsData
            if (variator && variator.name) {
                var existing = getVariatorByName(variator.name);
                if (existing) {
                    weeklyEscState.weeklyVariator = existing;
                    weeklyEscState.weeklyFixedVariators = [existing];
                    console.log('📥 Восстановлен еженедельный вариатор:', existing.name);
                    updateWeeklyVariatorDisplay();
                    return existing;
                } else {
                    console.warn('⚠️ Сохраненный вариатор не найден в данных, выбираем новый');
                }
            }
        } catch(e) {
            console.error('Ошибка восстановления еженедельного вариатора:', e);
        }
    }
    
    // Если ничего не восстановилось - сбрасываем
    return resetWeeklyEscalation();
}

// ============================================================
// ПОЛУЧЕНИЕ ВАРИАТОРОВ ДЛЯ ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// ============================================================

function getWeeklyVariatorsForLevel(level, mapName, playerCount) {
    if (typeof allVariatorsData === 'undefined') {
        console.error('❌ allVariatorsData не загружен');
        return [];
    }
    
    console.log('🔄 Генерация вариаторов для еженедельной эскалации, уровень:', level);
    console.log('📌 Еженедельный вариатор:', weeklyEscState.weeklyVariator ? weeklyEscState.weeklyVariator.name : 'Нет');
    
    // ============================================================
    // МАКСИМАЛЬНОЕ КОЛИЧЕСТВО ВАРИАТОРОВ - 8
    // ============================================================
    var MAX_VARIATORS = 8;
    
    // Проверяем, нужно ли сбросить добавочные вариаторы (каждые 10 уровней)
    if (level > 1 && (level - 1) % 10 === 0 && level <= 20) {
        weeklyEscState.weeklyLevelCounter = 1;
        weeklyEscState.weeklyAddedVariators = [];
        weeklyEscState.weeklyLastResetLevel = level;
        console.log('🔄 Сброс добавочных вариаторов на уровне:', level);
    }
    
    // ============================================================
    // ФОРМИРУЕМ РЕЗУЛЬТИРУЮЩИЙ СПИСОК
    // ============================================================
    
    var result = [];
    var usedNames = [];
    
    // 1. Еженедельный вариатор (всегда первый)
    if (weeklyEscState.weeklyVariator) {
        result.push(weeklyEscState.weeklyVariator);
        usedNames.push(weeklyEscState.weeklyVariator.name);
        console.log('✅ Еженедельный:', weeklyEscState.weeklyVariator.name);
    }
    
    // 2. Психохирургия и Двойные задания (после 20 уровня)
    if (level >= 21) {
        var psycho = allVariatorsData.find(function(v) { return v.name === "Психохирургия"; });
        var doubleTasks = allVariatorsData.find(function(v) { return v.name === "Двойные задания"; });
        
        if (psycho && usedNames.indexOf(psycho.name) === -1) {
            result.push(psycho);
            usedNames.push(psycho.name);
            console.log('✅ Добавлена Психохирургия');
        }
        if (doubleTasks && usedNames.indexOf(doubleTasks.name) === -1) {
            result.push(doubleTasks);
            usedNames.push(doubleTasks.name);
            console.log('✅ Добавлены Двойные задания');
        }
    }
    
    // 3. Добавляем все НАКОПЛЕННЫЕ добавочные вариаторы
    weeklyEscState.weeklyAddedVariators.forEach(function(v) {
        if (usedNames.indexOf(v.name) === -1) {
            result.push(v);
            usedNames.push(v.name);
        }
    });
    
    // 4. Проверяем, сколько еще можно добавить
    var currentCount = result.length;
    var maxAllowed = MAX_VARIATORS - currentCount;
    
    console.log('📊 Текущее количество:', currentCount, 'Можно добавить:', maxAllowed);
    
    // 5. Добавляем новые вариаторы (до 8)
    if (maxAllowed > 0) {
        // Исключаем уже использованные и еженедельные вариаторы
        var weeklyNames = WEEKLY_VARIATOR_POOL;
        var available = allVariatorsData.filter(function(v) {
            if (usedNames.indexOf(v.name) !== -1) return false;
            if (weeklyNames.indexOf(v.name) !== -1) return false;
            if (v.name === 'Ностофобия') return false;
            if (v.name === 'Психохирургия' && level < 21) return false;
            if (v.name === 'Двойные задания' && level < 21) return false;
            if (v.name === 'Низкая Плотность Врагов' && level > 5) return false;
            return true;
        });
        
        var shuffled = available.slice().sort(function() { return Math.random() - 0.5; });
        var trialName = weeklyEscState.trial ? weeklyEscState.trial.name : '';
        
        var added = false;
        for (var i = 0; i < shuffled.length && !added && result.length < MAX_VARIATORS; i++) {
            var candidate = shuffled[i];
            if (isVariatorCompatible(candidate, result, trialName, playerCount, level)) {
                result.push(candidate);
                usedNames.push(candidate.name);
                weeklyEscState.weeklyAddedVariators.push(candidate);
                console.log('✅ Добавлен новый вариатор:', candidate.name);
                added = true;
            }
        }
    }
    
    // Обновляем состояние
    weeklyEscState.variators = result;
    weeklyEscState.weeklyLevelCounter++;
    
    console.log('✅ ИТОГ (' + result.length + ' вариаторов):', result.map(function(v) { return v.name; }).join(', '));
    console.log('📌 Еженедельный:', weeklyEscState.weeklyVariator ? weeklyEscState.weeklyVariator.name : 'Нет');
    console.log('📌 Накопленные:', weeklyEscState.weeklyAddedVariators.map(function(v) { return v.name; }).join(', ') || 'нет');
    
    return result;
}

// ============================================================
// ПОЛУЧЕНИЕ КАРТЫ И ИСПЫТАНИЯ
// ============================================================

function getWeeklyMapAndTrial(level) {
    if (typeof trialsData === 'undefined') {
        console.error('❌ trialsData не загружен');
        return null;
    }
    
    console.log('🔄 Поиск карты для уровня:', level);
    
    var mapNames = Object.keys(trialsData);
    var isBigLevel = (level % 10 === 0);
    
    var availableTrials = [];
    
    for (var m = 0; m < mapNames.length; m++) {
        var mapName = mapNames[m];
        var mapData = trialsData[mapName];
        
        for (var t = 0; t < mapData.trials.length; t++) {
            var trial = mapData.trials[t];
            var isBig = trial.name === trial.name.toUpperCase();
            
            if (isBigLevel && isBig) {
                if (weeklyEscState.usedBigTrials.indexOf(trial.name) === -1) {
                    availableTrials.push({ mapName: mapName, mapImage: mapData.image, trial: trial });
                }
            } else if (!isBigLevel && !isBig) {
                if (weeklyEscState.usedSmallTrials.indexOf(trial.name) === -1) {
                    availableTrials.push({ mapName: mapName, mapImage: mapData.image, trial: trial });
                }
            }
        }
    }
    
    // Если все испытания использованы - сбрасываем список
    if (availableTrials.length === 0) {
        console.log('🔄 Сброс списка использованных испытаний');
        if (isBigLevel) {
            weeklyEscState.usedBigTrials = [];
            for (var m2 = 0; m2 < mapNames.length; m2++) {
                var mapName2 = mapNames[m2];
                var mapData2 = trialsData[mapName2];
                for (var t2 = 0; t2 < mapData2.trials.length; t2++) {
                    var trial2 = mapData2.trials[t2];
                    if (trial2.name === trial2.name.toUpperCase()) {
                        availableTrials.push({ mapName: mapName2, mapImage: mapData2.image, trial: trial2 });
                    }
                }
            }
        } else {
            weeklyEscState.usedSmallTrials = [];
            for (var m3 = 0; m3 < mapNames.length; m3++) {
                var mapName3 = mapNames[m3];
                var mapData3 = trialsData[mapName3];
                for (var t3 = 0; t3 < mapData3.trials.length; t3++) {
                    var trial3 = mapData3.trials[t3];
                    if (trial3.name !== trial3.name.toUpperCase()) {
                        availableTrials.push({ mapName: mapName3, mapImage: mapData3.image, trial: trial3 });
                    }
                }
            }
        }
    }
    
    if (availableTrials.length === 0) return null;
    
    var randomIndex = Math.floor(Math.random() * availableTrials.length);
    var selected = availableTrials[randomIndex];
    
    console.log('✅ Выбрано:', selected.trial.name, 'на', selected.mapName);
    
    weeklyEscState.currentTrialName = selected.trial.name;
    weeklyEscState.map = { name: selected.mapName, image: selected.mapImage };
    weeklyEscState.trial = selected.trial;
    
    if (selected.trial.name === selected.trial.name.toUpperCase()) {
        weeklyEscState.usedBigTrials.push(selected.trial.name);
    } else {
        weeklyEscState.usedSmallTrials.push(selected.trial.name);
    }
    
    return selected;
}

// ============================================================
// ГЕНЕРАЦИЯ РЕЗУЛЬТАТА
// ============================================================

function generateWeeklyEscResult() {
    console.log('🔄 Генерация результата, уровень:', weeklyEscState.level);
    
    if (typeof mapsData === 'undefined' || mapsData.length === 0) {
        console.error('❌ mapsData не загружен');
        return;
    }
    
    if (typeof trialsData === 'undefined' || Object.keys(trialsData).length === 0) {
        console.error('❌ trialsData не загружен');
        return;
    }
    
    var selected = getWeeklyMapAndTrial(weeklyEscState.level);
    if (!selected) {
        console.error('❌ Не найдено подходящее испытание');
        return;
    }
    
    var mapName = selected.mapName;
    var mapImage = selected.mapImage;
    var trial = selected.trial;
    
    weeklyEscState.trial = trial;
    
    var difficulty = getDifficultyByLevel(weeklyEscState.level);
    weeklyEscState.difficulty = difficulty.name;
    
    weeklyEscState.variators = getWeeklyVariatorsForLevel(
        weeklyEscState.level, 
        mapName, 
        weeklyEscState.playerCount
    );
    
    // Скрываем шаги
    var step1 = document.getElementById('escStep1');
    var step2 = document.getElementById('escStep2');
    var step3 = document.getElementById('escStep3');
    var step4 = document.getElementById('escStep4');
    
    if (step1) step1.classList.add('hidden');
    if (step2) step2.classList.add('hidden');
    if (step3) step3.classList.add('hidden');
    if (step4) step4.classList.add('hidden');
    
    // Показываем результат
    prepareWeeklyFullResult(mapName, mapImage, trial, difficulty);
}

// ============================================================
// ПОДГОТОВКА РЕЗУЛЬТАТА
// ============================================================

function prepareWeeklyFullResult(mapName, mapImage, trial, difficulty) {
    var resultContainer = document.getElementById('escResult');
    if (!resultContainer) return;
    
    resultContainer.style.display = 'none';
    resultContainer.classList.remove('active');
    
    var resultMap = document.getElementById('escResultMap');
    if (resultMap) {
        var trialImage = trial.image || mapImage;
        var trialNameUpper = trial.name.toUpperCase();
        var mapNameUpper = mapName.toUpperCase();
        
        var weeklyVariatorName = weeklyEscState.weeklyVariator ? weeklyEscState.weeklyVariator.name : 'Нет';
        
        resultMap.innerHTML = `
            <div class="result-map-row">
                <img class="map-image" src="${trialImage}" alt="${trial.name}" style="width:100%; max-width:200px; height:auto; object-fit:contain; border-radius:16px; border:2px solid rgba(220,90,50,0.3);" onerror="this.src='https://placehold.co/200x200/1a1a2e/e16d48?text=${encodeURIComponent(trial.name)}'">
                <div class="result-map-info" style="flex:1; min-width:200px;">
                    <div class="map-label" style="font-size:0.75rem; color:#888; text-transform:uppercase; letter-spacing:1px;">
                        <i class="fas fa-calendar-week" style="color: #e16d48;"></i> Еженедельная эскалация
                    </div>
                    <div class="trial-name" style="font-size:1.6rem; color:#e16d48; font-weight:900; margin:0.2rem 0 0.1rem; letter-spacing:1px;">${trialNameUpper}</div>
                    <div class="map-name" style="font-size:1.2rem; color:#ffbc9a; font-weight:300; margin-bottom:0.3rem; letter-spacing:2px; text-transform:uppercase;">${mapNameUpper}</div>
                    <div class="trial-desc" style="color:#c2b9d4; font-size:0.85rem; line-height:1.5;">${trial.desc || 'Пройдите испытание'}</div>
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem 1rem; margin-top:0.5rem; padding:6px 12px; background:rgba(220,90,50,0.1); border-radius:8px; border:1px solid rgba(220,90,50,0.15);">
                        <span style="font-size:0.75rem; color:#f1c40f; font-weight:700;">
                            <i class="fas fa-star" style="color:#f1c40f;"></i> Еженедельный: ${weeklyVariatorName}
                        </span>
                        <span style="font-size:0.75rem; color:#888;">
                            <i class="fas fa-layer-group"></i> Уровень: ${weeklyEscState.level}
                        </span>
                        <span style="font-size:0.75rem; color:#888;">
                            <i class="fas fa-hashtag"></i> Вариаторов: ${weeklyEscState.variators.length}/8
                        </span>
                    </div>
                    <div class="map-meta" style="display:flex; flex-wrap:wrap; gap:1rem; margin-top:0.8rem; padding-top:0.8rem; border-top:1px solid rgba(220,90,50,0.15);">
                        <span class="map-meta-item" style="font-size:0.8rem; color:#888;"><strong style="color:#ffbc9a;">№ Эскалационной терапии:</strong> #${weeklyEscState.level}</span>
                        <span class="map-meta-item" style="font-size:0.8rem; color:#888;"><strong style="color:#ffbc9a;">Сложность:</strong> ${weeklyEscState.difficulty}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    var resultVariators = document.getElementById('escResultVariators');
    if (resultVariators) {
        if (weeklyEscState.variators.length === 0) {
            resultVariators.innerHTML = '<div style="color: #888; text-align: center; padding: 1rem;">Нет вариаторов</div>';
        } else {
            resultVariators.innerHTML = weeklyEscState.variators.map(function(v) {
                var varNameUpper = v.name.toUpperCase();
                var fontSize = '0.75rem';
                if (v.name.length > 20) {
                    fontSize = '0.55rem';
                } else if (v.name.length > 14) {
                    fontSize = '0.6rem';
                } else if (v.name.length > 10) {
                    fontSize = '0.65rem';
                }
                
                var isWeekly = weeklyEscState.weeklyVariator && v.name === weeklyEscState.weeklyVariator.name;
                var borderColor = isWeekly ? '#f1c40f' : 'rgba(220,90,50,0.15)';
                var bgColor = isWeekly ? 'rgba(241,196,15,0.15)' : 'rgba(0,0,0,0.3)';
                var weeklyBadge = isWeekly ? '<div style="font-size:0.5rem; color:#f1c40f; font-weight:700; letter-spacing:0.5px;"><i class="fas fa-star"></i> НЕДЕЛЯ</div>' : '';
                
                return `
                    <div class="var-item" style="display:flex; flex-direction:column; align-items:center; gap:0.3rem; max-width:100px; border:2px solid ${borderColor}; border-radius:14px; padding:6px; background:${bgColor};">
                        <img src="${v.image || 'images/placeholder.png'}" alt="${v.name}" style="width:70px; height:70px; object-fit:contain; border-radius:12px; background:rgba(0,0,0,0.3); padding:4px;" onerror="this.src='https://placehold.co/70x70/1a1a2e/e16d48?text=?'">
                        <span style="font-size:${fontSize}; color:#ffbc9a; text-align:center; max-width:90px; line-height:1.3; font-weight:600; letter-spacing:0.3px; word-break:keep-all; overflow-wrap:normal; white-space:normal;">${varNameUpper}</span>
                        ${weeklyBadge}
                    </div>
                `;
            }).join('');
        }
    }
    
    // Показываем результат
    setTimeout(function() {
        resultContainer.style.display = 'block';
        resultContainer.classList.add('active');
        resultContainer.style.animation = 'none';
        setTimeout(function() {
            resultContainer.style.animation = 'resultAppear 0.6s ease-out';
        }, 50);
    }, 100);
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

function initWeeklyEscalation() {
    console.log('🚀 Запуск еженедельной эскалации...');
    
    // Восстанавливаем состояние
    restoreWeeklyEscalation();
    
    // Обновляем отображение еженедельного вариатора
    updateWeeklyVariatorDisplay();
    
    // Проверяем загрузку данных
    if (typeof mapsData === 'undefined' || typeof allVariatorsData === 'undefined') {
        console.error('❌ Данные не загружены!');
        return;
    }
    
    console.log('✅ Данные загружены, инициализация...');
    
    // Настройка кнопок выбора количества игроков
    var options = document.querySelectorAll('#escPlayerCountOptions .player-count-btn');
    var step1Next = document.getElementById('escStep1Next');
    
    if (options) {
        options.forEach(function(btn) {
            btn.addEventListener('click', function() {
                options.forEach(function(b) { b.classList.remove('selected'); });
                this.classList.add('selected');
                weeklyEscState.playerCount = parseInt(this.dataset.count);
                if (step1Next) step1Next.disabled = false;
            });
        });
    }
    
    if (step1Next) {
        step1Next.addEventListener('click', function() {
            goToEscStep(2);
            renderEscPlayerNames();
        });
    }
    
    // Остальные кнопки навигации
    setupEscNavigation();
    
    // Настройка модальных окон
    initAmpModal();
    initConfirmModal();
    
    // Обновление счетчика уровня
    updateLevelCounter();
    
    console.log('✅ Еженедельная эскалация инициализирована!');
    console.log('📌 Еженедельный вариатор:', weeklyEscState.weeklyVariator ? weeklyEscState.weeklyVariator.name : 'Нет');
}

// ============================================================
// ЗАПУСК
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен');
    
    if (document.getElementById('escalationWrapper')) {
        console.log('✅ Страница еженедельной эскалации найдена');
        
        // Ждем загрузки данных
        var checkInterval = setInterval(function() {
            if (typeof mapsData !== 'undefined' && typeof allVariatorsData !== 'undefined') {
                clearInterval(checkInterval);
                console.log('✅ Данные загружены');
                initWeeklyEscalation();
            }
        }, 300);
        
        // Таймаут
        setTimeout(function() {
            clearInterval(checkInterval);
            if (typeof mapsData === 'undefined') {
                console.error('❌ Данные не загружены!');
                var wrapper = document.querySelector('.escalation-wrapper');
                if (wrapper) {
                    wrapper.innerHTML = `
                        <div style="text-align: center; padding: 3rem; color: #e16d48;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                            <h2>Ошибка загрузки данных</h2>
                            <p style="color: #c2b9d4; margin-top: 0.5rem;">Не удалось загрузить необходимые данные.<br>Проверьте подключение JS файлов.</p>
                            <a href="roulette.html" style="display: inline-block; margin-top: 1.5rem; color: #e16d48; text-decoration: none; border: 1px solid #e16d48; padding: 0.5rem 2rem; border-radius: 30px;">Вернуться к рулетке</a>
                        </div>
                    `;
                }
            }
        }, 10000);
    }
});
