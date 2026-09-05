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
// КЛЮЧИ ДЛЯ LOCALSTORAGE
// ============================================================

var STORAGE_KEYS = {
    WEEKLY_VARIATOR: 'weeklyEscVariator',
    WEEK_NUMBER: 'weeklyEscWeekNumber',
    LAST_RESET: 'weeklyEscLastReset',
    WEEKLY_STATE: 'weeklyEscState'
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
    // Проверяем разные возможные источники данных
    if (typeof allVariatorsData !== 'undefined' && allVariatorsData.length > 0) {
        var found = allVariatorsData.find(function(v) { return v.name === name; });
        if (found) return found;
    }
    
    // Проверяем VARIATORS (из variators.js)
    if (typeof VARIATORS !== 'undefined' && VARIATORS.length > 0) {
        var found2 = VARIATORS.find(function(v) { return v.name === name; });
        if (found2) return found2;
    }
    
    console.warn('⚠️ Вариатор "' + name + '" не найден в данных');
    return null;
}

// ============================================================
// ПОЛУЧЕНИЕ НОМЕРА НЕДЕЛИ
// ============================================================

function getWeekNumber(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    var week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// ============================================================
// ПРОВЕРКА ЗАГРУЗКИ ДАННЫХ
// ============================================================

function isDataLoaded() {
    var hasMaps = typeof mapsData !== 'undefined' && mapsData.length > 0;
    var hasVariators = (typeof allVariatorsData !== 'undefined' && allVariatorsData.length > 0) || 
                       (typeof VARIATORS !== 'undefined' && VARIATORS.length > 0);
    var hasAmps = typeof ampsData !== 'undefined' && ampsData.length > 0;
    var hasEquipment = typeof equipmentData !== 'undefined' && equipmentData.length > 0;
    var hasTrials = typeof trialsData !== 'undefined' && Object.keys(trialsData).length > 0;
    
    console.log('📊 Проверка данных:', {
        maps: hasMaps,
        variators: hasVariators,
        amps: hasAmps,
        equipment: hasEquipment,
        trials: hasTrials
    });
    
    return hasMaps && hasVariators && hasAmps && hasEquipment && hasTrials;
}

// ============================================================
// ПРОВЕРКА НУЖНО ЛИ СБРОСИТЬ ЕЖЕНЕДЕЛЬНЫЙ ВАРИАТОР
// ============================================================

function isWeeklyResetNeeded() {
    var now = new Date();
    var day = now.getDay();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    
    // Вторник после 21:00
    if (day === 2 && hours >= 21 && minutes >= 0) {
        var lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
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
// СОХРАНЕНИЕ ЕЖЕНЕДЕЛЬНОГО ВАРИАТОРА В LOCALSTORAGE
// ============================================================

function saveWeeklyVariator(variator) {
    if (!variator) return;
    try {
        var now = new Date();
        localStorage.setItem(STORAGE_KEYS.WEEKLY_VARIATOR, JSON.stringify(variator));
        localStorage.setItem(STORAGE_KEYS.WEEK_NUMBER, getWeekNumber(now).toString());
        localStorage.setItem(STORAGE_KEYS.LAST_RESET, now.toISOString());
        console.log('💾 Еженедельный вариатор сохранен:', variator.name);
    } catch(e) {
        console.error('Ошибка сохранения еженедельного вариатора:', e);
    }
}

// ============================================================
// ЗАГРУЗКА ЕЖЕНЕДЕЛЬНОГО ВАРИАТОРА ИЗ LOCALSTORAGE
// ============================================================

function loadWeeklyVariator() {
    try {
        var saved = localStorage.getItem(STORAGE_KEYS.WEEKLY_VARIATOR);
        var savedWeek = localStorage.getItem(STORAGE_KEYS.WEEK_NUMBER);
        var currentWeek = getWeekNumber(new Date());
        
        if (saved && savedWeek && parseInt(savedWeek) === currentWeek) {
            var variator = JSON.parse(saved);
            if (variator && variator.name) {
                var existing = getVariatorByName(variator.name);
                if (existing) {
                    console.log('📥 Загружен еженедельный вариатор из localStorage:', existing.name);
                    return existing;
                } else {
                    console.warn('⚠️ Сохраненный вариатор не найден в данных:', variator.name);
                }
            }
        } else {
            console.log('📭 Нет сохраненного вариатора для текущей недели');
        }
    } catch(e) {
        console.error('Ошибка загрузки еженедельного вариатора:', e);
    }
    return null;
}

// ============================================================
// ПОЛУЧЕНИЕ СЛУЧАЙНОГО ЕЖЕНЕДЕЛЬНОГО ВАРИАТОРА
// ============================================================

function getRandomWeeklyVariator() {
    var randomIndex = Math.floor(Math.random() * WEEKLY_VARIATOR_POOL.length);
    var selectedName = WEEKLY_VARIATOR_POOL[randomIndex];
    var fullVariator = getVariatorByName(selectedName);
    
    if (fullVariator) {
        console.log('✅ Выбран еженедельный вариатор:', fullVariator.name);
        return fullVariator;
    }
    
    // Если вариатор не найден, создаем заглушку
    console.warn('⚠️ Создаем заглушку для вариатора:', selectedName);
    return {
        id: 'weekly_' + selectedName.replace(/\s/g, '_').toLowerCase(),
        name: selectedName,
        image: 'images/placeholder.png',
        desc: 'Еженедельный вариатор'
    };
}

// ============================================================
// ПОЛУЧЕНИЕ ТЕКУЩЕГО ЕЖЕНЕДЕЛЬНОГО ВАРИАТОРА
// ============================================================

function getCurrentWeeklyVariator() {
    // Проверяем, нужно ли сбросить (новая неделя)
    if (isWeeklyResetNeeded()) {
        console.log('🔄 Наступила новая неделя, выбираем новый вариатор');
        var newVariator = getRandomWeeklyVariator();
        saveWeeklyVariator(newVariator);
        return newVariator;
    }
    
    // Пытаемся загрузить из localStorage
    var loaded = loadWeeklyVariator();
    if (loaded) {
        return loaded;
    }
    
    // Если ничего не загрузилось - генерируем новый
    console.log('🆕 Генерируем новый еженедельный вариатор');
    var newVariator = getRandomWeeklyVariator();
    saveWeeklyVariator(newVariator);
    return newVariator;
}

// ============================================================
// ОБНОВЛЕНИЕ ОТОБРАЖЕНИЯ ЕЖЕНЕДЕЛЬНОГО ВАРИАТОРА
// ============================================================

function updateWeeklyVariatorDisplay() {
    var nameEl = document.getElementById('weeklyVariatorName');
    if (nameEl) {
        if (weeklyEscState.weeklyVariator) {
            nameEl.innerHTML = '<i class="fas fa-star"></i> ' + weeklyEscState.weeklyVariator.name;
            console.log('✅ Обновлено отображение:', weeklyEscState.weeklyVariator.name);
        } else {
            nameEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
            console.log('⏳ Ожидание загрузки вариатора...');
        }
    }
}

// ============================================================
// СБРОС ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// ============================================================

function resetWeeklyEscalation() {
    var newWeekly = getCurrentWeeklyVariator();
    
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
    
    // Сохраняем состояние
    try {
        localStorage.setItem(STORAGE_KEYS.WEEKLY_STATE, JSON.stringify({
            level: weeklyEscState.level,
            weeklyVariator: weeklyEscState.weeklyVariator,
            weeklyFixedVariators: weeklyEscState.weeklyFixedVariators,
            weeklyAddedVariators: weeklyEscState.weeklyAddedVariators,
            weeklyLevelCounter: weeklyEscState.weeklyLevelCounter,
            weeklyLastResetLevel: weeklyEscState.weeklyLastResetLevel
        }));
    } catch(e) {
        console.error('Ошибка сохранения состояния:', e);
    }
    
    console.log('🔄 Еженедельная эскалация сброшена!');
    console.log('📌 Еженедельный вариатор:', newWeekly ? newWeekly.name : 'Нет');
    
    // Обновляем отображение
    updateWeeklyVariatorDisplay();
    
    return newWeekly;
}

// ============================================================
// ВОССТАНОВЛЕНИЕ ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ ИЗ LOCALSTORAGE
// ============================================================

function restoreWeeklyEscalation() {
    console.log('🔄 Восстановление еженедельной эскалации...');
    
    // Проверяем сброс по неделе
    if (isWeeklyResetNeeded()) {
        console.log('🔄 Наступила новая неделя, сбрасываем еженедельную эскалацию...');
        return resetWeeklyEscalation();
    }
    
    // Получаем еженедельный вариатор
    var weeklyVariator = getCurrentWeeklyVariator();
    weeklyEscState.weeklyVariator = weeklyVariator;
    if (weeklyVariator) {
        weeklyEscState.weeklyFixedVariators = [weeklyVariator];
    }
    
    // Восстанавливаем прогресс
    try {
        var savedState = localStorage.getItem(STORAGE_KEYS.WEEKLY_STATE);
        if (savedState) {
            var parsed = JSON.parse(savedState);
            if (parsed.weeklyVariator && parsed.weeklyVariator.name === weeklyVariator.name) {
                weeklyEscState.level = parsed.level || 1;
                weeklyEscState.weeklyAddedVariators = parsed.weeklyAddedVariators || [];
                weeklyEscState.weeklyLevelCounter = parsed.weeklyLevelCounter || 1;
                weeklyEscState.weeklyLastResetLevel = parsed.weeklyLastResetLevel || 1;
                console.log('📥 Восстановлено состояние, уровень:', weeklyEscState.level);
            } else {
                console.log('📥 Вариатор изменился, сбрасываем прогресс');
                weeklyEscState.level = 1;
                weeklyEscState.weeklyAddedVariators = [];
                weeklyEscState.weeklyLevelCounter = 1;
                weeklyEscState.weeklyLastResetLevel = 1;
            }
        }
    } catch(e) {
        console.error('Ошибка восстановления состояния:', e);
    }
    
    updateWeeklyVariatorDisplay();
    return weeklyVariator;
}

// ============================================================
// ПОЛУЧЕНИЕ ВАРИАТОРОВ ДЛЯ ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// ============================================================

function getWeeklyVariatorsForLevel(level, mapName, playerCount) {
    // Проверяем наличие данных
    var variatorsData = null;
    if (typeof allVariatorsData !== 'undefined' && allVariatorsData.length > 0) {
        variatorsData = allVariatorsData;
    } else if (typeof VARIATORS !== 'undefined' && VARIATORS.length > 0) {
        variatorsData = VARIATORS;
    }
    
    if (!variatorsData) {
        console.error('❌ Данные вариаторов не загружены');
        return [];
    }
    
    console.log('🔄 Генерация вариаторов для еженедельной эскалации, уровень:', level);
    console.log('📌 Еженедельный вариатор:', weeklyEscState.weeklyVariator ? weeklyEscState.weeklyVariator.name : 'Нет');
    
    var MAX_VARIATORS = 8;
    
    // Проверяем сброс добавочных вариаторов
    if (level > 1 && (level - 1) % 10 === 0 && level <= 20) {
        weeklyEscState.weeklyLevelCounter = 1;
        weeklyEscState.weeklyAddedVariators = [];
        weeklyEscState.weeklyLastResetLevel = level;
        console.log('🔄 Сброс добавочных вариаторов на уровне:', level);
    }
    
    var result = [];
    var usedNames = [];
    
    // 1. Еженедельный вариатор
    if (weeklyEscState.weeklyVariator) {
        result.push(weeklyEscState.weeklyVariator);
        usedNames.push(weeklyEscState.weeklyVariator.name);
        console.log('✅ Еженедельный:', weeklyEscState.weeklyVariator.name);
    }
    
    // 2. Психохирургия и Двойные задания
    if (level >= 21) {
        var psycho = variatorsData.find(function(v) { return v.name === "Психохирургия"; });
        var doubleTasks = variatorsData.find(function(v) { return v.name === "Двойные задания"; });
        
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
    
    // 3. Накопленные добавочные вариаторы
    weeklyEscState.weeklyAddedVariators.forEach(function(v) {
        if (usedNames.indexOf(v.name) === -1) {
            result.push(v);
            usedNames.push(v.name);
        }
    });
    
    var currentCount = result.length;
    var maxAllowed = MAX_VARIATORS - currentCount;
    
    console.log('📊 Текущее количество:', currentCount, 'Можно добавить:', maxAllowed);
    
    // 4. Добавляем новые вариаторы
    if (maxAllowed > 0) {
        var weeklyNames = WEEKLY_VARIATOR_POOL;
        var available = variatorsData.filter(function(v) {
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
            if (typeof isVariatorCompatible === 'function' && 
                isVariatorCompatible(candidate, result, trialName, playerCount, level)) {
                result.push(candidate);
                usedNames.push(candidate.name);
                weeklyEscState.weeklyAddedVariators.push(candidate);
                console.log('✅ Добавлен новый вариатор:', candidate.name);
                added = true;
            } else if (typeof isVariatorCompatible !== 'function') {
                // Если функция не определена, добавляем без проверки
                result.push(candidate);
                usedNames.push(candidate.name);
                weeklyEscState.weeklyAddedVariators.push(candidate);
                console.log('✅ Добавлен вариатор (без проверки):', candidate.name);
                added = true;
            }
        }
    }
    
    weeklyEscState.variators = result;
    weeklyEscState.weeklyLevelCounter++;
    
    // Сохраняем состояние
    try {
        localStorage.setItem(STORAGE_KEYS.WEEKLY_STATE, JSON.stringify({
            level: weeklyEscState.level,
            weeklyVariator: weeklyEscState.weeklyVariator,
            weeklyFixedVariators: weeklyEscState.weeklyFixedVariators,
            weeklyAddedVariators: weeklyEscState.weeklyAddedVariators,
            weeklyLevelCounter: weeklyEscState.weeklyLevelCounter,
            weeklyLastResetLevel: weeklyEscState.weeklyLastResetLevel
        }));
    } catch(e) {
        console.error('Ошибка сохранения состояния:', e);
    }
    
    console.log('✅ ИТОГ (' + result.length + ' вариаторов):', result.map(function(v) { return v.name; }).join(', '));
    
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
    
    var step1 = document.getElementById('escStep1');
    var step2 = document.getElementById('escStep2');
    var step3 = document.getElementById('escStep3');
    var step4 = document.getElementById('escStep4');
    
    if (step1) step1.classList.add('hidden');
    if (step2) step2.classList.add('hidden');
    if (step3) step3.classList.add('hidden');
    if (step4) step4.classList.add('hidden');
    
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
    
    // Проверяем загрузку данных
    if (!isDataLoaded()) {
        console.log('⏳ Данные еще не загружены, ждем...');
        var checkInterval = setInterval(function() {
            if (isDataLoaded()) {
                clearInterval(checkInterval);
                console.log('✅ Данные загружены');
                doInit();
            }
        }, 500);
        
        setTimeout(function() {
            clearInterval(checkInterval);
            console.warn('⚠️ Таймаут загрузки данных, пробуем инициализировать');
            doInit();
        }, 10000);
        return;
    }
    
    doInit();
}

function doInit() {
    console.log('🔄 Инициализация...');
    
    // Восстанавливаем состояние
    restoreWeeklyEscalation();
    
    // Обновляем отображение еженедельного вариатора
    updateWeeklyVariatorDisplay();
    
    // Проверяем наличие необходимых функций
    if (typeof goToEscStep !== 'function') {
        console.warn('⚠️ Функция goToEscStep не определена');
    }
    if (typeof renderEscPlayerNames !== 'function') {
        console.warn('⚠️ Функция renderEscPlayerNames не определена');
    }
    if (typeof setupEscNavigation !== 'function') {
        console.warn('⚠️ Функция setupEscNavigation не определена');
    }
    if (typeof initAmpModal !== 'function') {
        console.warn('⚠️ Функция initAmpModal не определена');
    }
    if (typeof initConfirmModal !== 'function') {
        console.warn('⚠️ Функция initConfirmModal не определена');
    }
    if (typeof updateLevelCounter !== 'function') {
        console.warn('⚠️ Функция updateLevelCounter не определена');
    }
    
    // Настройка кнопок
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
            if (typeof goToEscStep === 'function') {
                goToEscStep(2);
                if (typeof renderEscPlayerNames === 'function') {
                    renderEscPlayerNames();
                }
            }
        });
    }
    
    // Настройка остальных кнопок
    setupStepButtons();
    
    // Обновление счетчика уровня
    if (typeof updateLevelCounter === 'function') {
        updateLevelCounter();
    }
    
    console.log('✅ Еженедельная эскалация инициализирована!');
    console.log('📌 Еженедельный вариатор:', weeklyEscState.weeklyVariator ? weeklyEscState.weeklyVariator.name : 'Нет');
    console.log('📅 Сохраняется до следующего вторника 21:00');
}

// ============================================================
// НАСТРОЙКА КНОПОК ШАГОВ
// ============================================================

function setupStepButtons() {
    var step2Back = document.getElementById('escStep2Back');
    var step2Next = document.getElementById('escStep2Next');
    var step3Back = document.getElementById('escStep3Back');
    var step3Next = document.getElementById('escStep3Next');
    var step4Back = document.getElementById('escStep4Back');
    var step4Next = document.getElementById('escStep4Next');
    var nextLevelBtn = document.getElementById('escNextLevelBtn');
    var exitBtn = document.getElementById('escExitBtn');
    
    if (step2Back) {
        step2Back.addEventListener('click', function() {
            if (typeof goToEscStep === 'function') goToEscStep(1);
        });
    }
    
    if (step2Next) {
        step2Next.addEventListener('click', function() {
            var inputs = document.querySelectorAll('#escPlayerNameInputs input');
            weeklyEscState.players = [];
            inputs.forEach(function(input, i) {
                weeklyEscState.players.push(input.value.trim() || 'Игрок ' + (i + 1));
            });
            weeklyEscState.players.forEach(function(_, idx) {
                if (!weeklyEscState.usedAmps[idx]) weeklyEscState.usedAmps[idx] = [];
                if (!weeklyEscState.ampSelections[idx]) weeklyEscState.ampSelections[idx] = {};
                if (!weeklyEscState.unlockedAmps[idx]) weeklyEscState.unlockedAmps[idx] = [];
                weeklyEscState.allAmpsUsed[idx] = false;
            });
            if (typeof goToEscStep === 'function') {
                goToEscStep(3);
                if (typeof renderEscEquipment === 'function') {
                    renderEscEquipment();
                }
            }
        });
    }
    
    if (step3Back) {
        step3Back.addEventListener('click', function() {
            if (typeof goToEscStep === 'function') goToEscStep(2);
        });
    }
    
    if (step3Next) {
        step3Next.addEventListener('click', function() {
            if (typeof goToEscStep === 'function') {
                goToEscStep(4);
                if (typeof renderEscAmps === 'function') {
                    renderEscAmps();
                }
            }
        });
    }
    
    if (step4Back) {
        step4Back.addEventListener('click', function() {
            if (typeof goToEscStep === 'function') goToEscStep(3);
        });
    }
    
    if (step4Next) {
        step4Next.addEventListener('click', function() {
            weeklyEscState.players.forEach(function(_, idx) {
                var selected = weeklyEscState.ampSelections[idx] || {};
                Object.keys(selected).forEach(function(category) {
                    var ampName = selected[category];
                    if (ampName) {
                        if (!weeklyEscState.usedAmps[idx]) weeklyEscState.usedAmps[idx] = [];
                        if (weeklyEscState.usedAmps[idx].indexOf(ampName) === -1) {
                            weeklyEscState.usedAmps[idx].push(ampName);
                        }
                        if (typeof unlockAmpForPlayer === 'function') {
                            unlockAmpForPlayer(idx, ampName);
                        }
                    }
                });
            });
            generateWeeklyEscResult();
        });
    }
    
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', function() {
            weeklyEscState.level++;
            console.log('🔄 Переход на уровень:', weeklyEscState.level);
            if (typeof updateLevelCounter === 'function') {
                updateLevelCounter();
            }
            
            var allComplete = weeklyEscState.players.every(function(_, idx) {
                if (typeof areAllCategoriesComplete === 'function') {
                    return areAllCategoriesComplete(idx);
                }
                return true;
            });
            
            if (allComplete && typeof areAllCategoriesComplete === 'function') {
                alert('Не осталось выбора улучшения. Все улучшения были применены.');
                generateWeeklyEscResult();
            } else if (typeof showBreakModal === 'function') {
                showBreakModal();
            } else {
                generateWeeklyEscResult();
            }
        });
    }
    
    if (exitBtn) {
        exitBtn.addEventListener('click', function() {
            var modal = document.getElementById('confirmModal');
            if (modal) modal.classList.add('active');
        });
    }
}

// ============================================================
// ЗАПУСК
// ============================================================

// Ждем загрузки DOM и данных
var initAttempts = 0;
var maxAttempts = 20;

function tryInit() {
    initAttempts++;
    console.log('🔄 Попытка инициализации #' + initAttempts);
    
    if (isDataLoaded()) {
        console.log('✅ Данные загружены, инициализируем');
        initWeeklyEscalation();
        return true;
    }
    
    if (initAttempts >= maxAttempts) {
        console.error('❌ Превышено количество попыток инициализации');
        return false;
    }
    
    setTimeout(tryInit, 1000);
    return false;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 DOM загружен');
        if (document.getElementById('escalationWrapper')) {
            tryInit();
        }
    });
} else {
    console.log('🚀 DOM уже загружен');
    if (document.getElementById('escalationWrapper')) {
        tryInit();
    }
}
