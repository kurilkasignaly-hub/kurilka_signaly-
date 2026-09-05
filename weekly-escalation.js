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
    weeklyVariator: null, // Главный вариатор недели (НЕ МЕНЯЕТСЯ)
    weeklyFixedVariators: [], // Постоянные вариаторы (еженедельный + психохирургия + двойные задания)
    weeklyAddedVariators: [], // Добавленные вариаторы за уровень (накапливаются)
    weeklyLevelCounter: 1, // Счетчик уровней в рамках недели (1-20)
    weeklyLastResetLevel: 1 // Уровень последнего сброса
};

// ============================================================
// ФИКСИРОВАННЫЙ СПИСОК ВАРИАТОРОВ ДЛЯ ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// (ЭТИ ВАРИАТОРЫ НЕ МЕНЯЮТСЯ В ТЕЧЕНИЕ НЕДЕЛИ)
// ============================================================

var WEEKLY_VARIATOR_POOL = [
    { name: 'Таймер бомбы', image: 'images/таймер бомбы.webp', desc: 'На каждом уровне заложена бомба с таймером' },
    { name: 'Вечная мерзлота', image: 'images/вечная мерзлота.webp', desc: 'Постоянный эффект замедления и холода' },
    { name: 'Глубокий ожог', image: 'images/глубокий ожог.webp', desc: 'Огонь наносит увеличенный урон' },
    { name: 'Кровотечение', image: 'images/кровотечение.webp', desc: 'Раны продолжают кровоточить, нанося урон со временем' }
];

// ============================================================
// ПОЛУЧЕНИЕ СЛУЧАЙНОГО ЕЖЕНЕДЕЛЬНОГО ВАРИАТОРА ИЗ ФИКСИРОВАННОГО ПУЛА
// ============================================================

function getWeeklyVariator() {
    // Берем случайный вариатор из фиксированного пула
    var randomIndex = Math.floor(Math.random() * WEEKLY_VARIATOR_POOL.length);
    var selected = WEEKLY_VARIATOR_POOL[randomIndex];
    
    // Добавляем id для совместимости с остальной логикой
    selected.id = 'weekly_' + selected.name.replace(/\s/g, '_').toLowerCase();
    
    return selected;
}

// ============================================================
// ПОЛУЧЕНИЕ ПОЛНОГО ВАРИАТОРА ПО ИМЕНИ (ДЛЯ СОВМЕСТИМОСТИ С allVariatorsData)
// ============================================================

function getFullVariatorByName(name) {
    if (typeof allVariatorsData === 'undefined') return null;
    return allVariatorsData.find(function(v) { return v.name === name; }) || null;
}

// ============================================================
// ПРОВЕРКА НУЖНО ЛИ СБРОСИТЬ ЕЖЕНЕДЕЛЬНУЮ ЭСКАЛАЦИЮ (ВТОРНИК 21:00)
// ============================================================

function isWeeklyResetNeeded() {
    var now = new Date();
    var day = now.getDay();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    
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
// СБРОС ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ (ПРИ НОВОЙ НЕДЕЛЕ)
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
    
    localStorage.setItem('weeklyEscWeekNumber', getWeekNumber(new Date()).toString());
    localStorage.setItem('weeklyEscLastReset', new Date().toISOString());
    if (newWeekly) {
        localStorage.setItem('weeklyEscVariator', JSON.stringify(newWeekly));
    } else {
        localStorage.removeItem('weeklyEscVariator');
    }
    
    console.log('🔄 Еженедельная эскалация сброшена! Главный вариатор недели:', 
        newWeekly ? newWeekly.name : 'Нет');
    
    return newWeekly;
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
            weeklyEscState.weeklyVariator = variator;
            if (variator) {
                weeklyEscState.weeklyFixedVariators = [variator];
            }
            console.log('📥 Восстановлен еженедельный вариатор:', variator ? variator.name : 'Нет');
            return variator;
        } catch(e) {
            console.error('Ошибка восстановления еженедельного вариатора:', e);
            return resetWeeklyEscalation();
        }
    } else {
        return resetWeeklyEscalation();
    }
}

// ============================================================
// ПОЛУЧЕНИЕ ВАРИАТОРОВ ДЛЯ ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// ============================================================

function getWeeklyVariatorsForLevel(level, mapName, playerCount) {
    if (typeof allVariatorsData === 'undefined') return [];
    
    console.log('🔄 Генерация вариаторов для еженедельной эскалации, уровень:', level);
    console.log('📍 Карта:', mapName);
    console.log('👥 Игроков:', playerCount);
    console.log('📌 Еженедельный вариатор (НЕ МЕНЯЕТСЯ):', weeklyEscState.weeklyVariator ? weeklyEscState.weeklyVariator.name : 'Нет');
    console.log('📌 Накопленные вариаторы:', weeklyEscState.weeklyAddedVariators.map(function(v) { return v.name; }).join(', ') || 'нет');
    
    // ============================================================
    // МАКСИМАЛЬНОЕ КОЛИЧЕСТВО ВАРИАТОРОВ - 8
    // ============================================================
    var MAX_VARIATORS = 8;
    
    // Проверяем, нужно ли сбросить добавочные вариаторы (каждые 10 уровней)
    if (level > 1 && (level - 1) % 10 === 0 && level <= 20) {
        weeklyEscState.weeklyLevelCounter = 1;
        weeklyEscState.weeklyAddedVariators = [];
        weeklyEscState.weeklyLastResetLevel = level;
        console.log('🔄 Сброс добавочных вариаторов на уровне:', level, '(еженедельный сохранен)');
    }
    
    // ============================================================
    // ФОРМИРУЕМ РЕЗУЛЬТИРУЮЩИЙ СПИСОК
    // ============================================================
    
    var result = [];
    
    // 1. Еженедельный вариатор (всегда первый) - БЕРЁМ ИЗ ФИКСИРОВАННОГО ПУЛА
    if (weeklyEscState.weeklyVariator) {
        result.push(weeklyEscState.weeklyVariator);
        console.log('✅ Еженедельный вариатор (из фиксированного пула):', weeklyEscState.weeklyVariator.name);
    }
    
    // 2. Психохирургия и Двойные задания (после 20 уровня)
    if (level >= 21) {
        var hasPsycho = result.some(function(v) { return v.name === "Психохирургия"; });
        var hasDoubleTasks = result.some(function(v) { return v.name === "Двойные задания"; });
        
        var psycho = allVariatorsData.find(function(v) { return v.name === "Психохирургия"; });
        var doubleTasks = allVariatorsData.find(function(v) { return v.name === "Двойные задания"; });
        
        if (psycho && !hasPsycho) {
            result.push(psycho);
            if (weeklyEscState.weeklyFixedVariators.indexOf(psycho) === -1) {
                weeklyEscState.weeklyFixedVariators.push(psycho);
            }
            console.log('✅ Добавлена Психохирургия (фиксированный)');
        }
        if (doubleTasks && !hasDoubleTasks) {
            result.push(doubleTasks);
            if (weeklyEscState.weeklyFixedVariators.indexOf(doubleTasks) === -1) {
                weeklyEscState.weeklyFixedVariators.push(doubleTasks);
            }
            console.log('✅ Добавлены Двойные задания (фиксированный)');
        }
    }
    
    // 3. Добавляем все НАКОПЛЕННЫЕ добавочные вариаторы
    var addedVariators = weeklyEscState.weeklyAddedVariators.slice();
    console.log('📦 Накопленные добавочные:', addedVariators.map(function(v) { return v.name; }).join(', ') || 'нет');
    result = result.concat(addedVariators);
    
    // 4. Проверяем, сколько еще можно добавить (НЕ БОЛЬШЕ 8)
    var currentCount = result.length;
    var maxAllowed = MAX_VARIATORS - currentCount;
    
    console.log('📊 Текущее количество:', currentCount, 'Максимум можно добавить:', maxAllowed);
    
    // 5. Добавляем новые вариаторы, если есть место (до 8)
    if (maxAllowed > 0) {
        var usedNames = result.map(function(v) { return v.name; });
        // Исключаем еженедельные вариаторы из пула для добавления
        var weeklyNames = WEEKLY_VARIATOR_POOL.map(function(v) { return v.name; });
        
        var available = allVariatorsData.filter(function(v) {
            // Не добавляем вариаторы, которые уже есть
            if (usedNames.indexOf(v.name) !== -1) return false;
            // Исключаем еженедельные вариаторы (они не должны добавляться как обычные)
            if (weeklyNames.indexOf(v.name) !== -1) return false;
            // Исключаем Ностофобию
            if (v.name === 'Ностофобия') return false;
            // Психохирургия и Двойные задания только после 20 уровня
            if (v.name === 'Психохирургия' && level < 21) return false;
            if (v.name === 'Двойные задания' && level < 21) return false;
            // Низкая Плотность Врагов только до 5 уровня
            if (v.name === 'Низкая Плотность Врагов' && level > 5) return false;
            return true;
        });
        
        var shuffled = available.slice().sort(function() { return Math.random() - 0.5; });
        var trialName = weeklyEscState.trial ? weeklyEscState.trial.name : '';
        
        // Добавляем только 1 новый вариатор на уровень (если есть место до 8)
        var added = false;
        for (var i = 0; i < shuffled.length && !added && result.length < MAX_VARIATORS; i++) {
            var candidate = shuffled[i];
            if (isVariatorCompatible(candidate, result, trialName, playerCount, level)) {
                result.push(candidate);
                weeklyEscState.weeklyAddedVariators.push(candidate);
                console.log('✅ Добавлен новый вариатор (сохранен):', candidate.name);
                added = true;
            }
        }
    }
    
    // Обновляем состояние
    weeklyEscState.variators = result;
    weeklyEscState.weeklyLevelCounter++;
    
    console.log('✅ ИТОГ (' + result.length + ' вариаторов из 8 возможных):', result.map(function(v) { return v.name; }).join(', '));
    console.log('📌 Еженедельный вариатор (из фиксированного пула):', weeklyEscState.weeklyVariator ? weeklyEscState.weeklyVariator.name : 'Нет');
    console.log('📌 Накопленные добавочные:', weeklyEscState.weeklyAddedVariators.map(function(v) { return v.name; }).join(', ') || 'нет');
    
    return result;
}

// ============================================================
// ПОЛУЧЕНИЕ КАРТЫ И ИСПЫТАНИЯ ДЛЯ ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// ============================================================

function getWeeklyMapAndTrial(level) {
    if (typeof trialsData === 'undefined') return null;
    
    console.log('🔄 Поиск карты для еженедельной эскалации, уровень:', level);
    
    var mapNames = Object.keys(trialsData);
    var isBigLevel = (level % 10 === 0);
    console.log('🔤 Тип:', isBigLevel ? 'БОЛЬШАЯ' : 'маленькая');
    
    var availableTrials = [];
    
    for (var m = 0; m < mapNames.length; m++) {
        var mapName = mapNames[m];
        var mapData = trialsData[mapName];
        
        for (var t = 0; t < mapData.trials.length; t++) {
            var trial = mapData.trials[t];
            var isBig = trial.name === trial.name.toUpperCase();
            
            if (isBigLevel && isBig) {
                if (weeklyEscState.usedBigTrials.indexOf(trial.name) === -1) {
                    availableTrials.push({
                        mapName: mapName,
                        mapImage: mapData.image,
                        trial: trial
                    });
                }
            } else if (!isBigLevel && !isBig) {
                if (weeklyEscState.usedSmallTrials.indexOf(trial.name) === -1) {
                    availableTrials.push({
                        mapName: mapName,
                        mapImage: mapData.image,
                        trial: trial
                    });
                }
            }
        }
    }
    
    if (availableTrials.length === 0) {
        console.log('🔄 Сброс списка использованных');
        if (isBigLevel) {
            weeklyEscState.usedBigTrials = [];
            for (var m2 = 0; m2 < mapNames.length; m2++) {
                var mapName2 = mapNames[m2];
                var mapData2 = trialsData[mapName2];
                for (var t2 = 0; t2 < mapData2.trials.length; t2++) {
                    var trial2 = mapData2.trials[t2];
                    if (trial2.name === trial2.name.toUpperCase()) {
                        availableTrials.push({
                            mapName: mapName2,
                            mapImage: mapData2.image,
                            trial: trial2
                        });
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
                        availableTrials.push({
                            mapName: mapName3,
                            mapImage: mapData3.image,
                            trial: trial3
                        });
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
// ГЕНЕРАЦИЯ РЕЗУЛЬТАТА ДЛЯ ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// ============================================================

function generateWeeklyEscResult() {
    console.log('🔄 Генерация результата для еженедельной эскалации, уровень:', weeklyEscState.level);
    
    if (typeof mapsData === 'undefined' || mapsData.length === 0) {
        console.error('❌ mapsData не загружен!');
        return;
    }
    
    if (typeof trialsData === 'undefined' || Object.keys(trialsData).length === 0) {
        console.error('❌ trialsData не загружен!');
        return;
    }
    
    var selected = getWeeklyMapAndTrial(weeklyEscState.level);
    if (!selected) {
        console.error('❌ Не найдено подходящее испытание!');
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
    
    showPreviewModal(
        trial.name,
        mapName,
        weeklyEscState.variators,
        weeklyEscState.level
    );
    
    prepareWeeklyFullResult(mapName, mapImage, trial, difficulty);
}

// ============================================================
// ПОДГОТОВКА ПОЛНОГО РЕЗУЛЬТАТА ДЛЯ ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
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
                    <div class="trial-desc" style="color:#c2b9d4; font-size:0.85rem; line-height:1.5;">${trial.desc}</div>
                    <div style="display:flex; flex-wrap:wrap; gap:0.5rem 1rem; margin-top:0.5rem; padding:6px 12px; background:rgba(220,90,50,0.1); border-radius:8px; border:1px solid rgba(220,90,50,0.15);">
                        <span style="font-size:0.75rem; color:#f1c40f; font-weight:700;">
                            <i class="fas fa-star" style="color:#f1c40f;"></i> Еженедельный вариатор: ${weeklyVariatorName}
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
                // Проверяем, является ли вариатор еженедельным (из фиксированного пула)
                var isWeekly = weeklyEscState.weeklyVariator && v.name === weeklyEscState.weeklyVariator.name;
                var borderColor = isWeekly ? '#f1c40f' : 'rgba(220,90,50,0.15)';
                var bgColor = isWeekly ? 'rgba(241,196,15,0.15)' : 'rgba(0,0,0,0.3)';
                var weeklyBadge = isWeekly ? '<div style="font-size:0.5rem; color:#f1c40f; font-weight:700; letter-spacing:0.5px;"><i class="fas fa-star"></i> НЕДЕЛЯ</div>' : '';
                
                return `
                    <div class="var-item" style="display:flex; flex-direction:column; align-items:center; gap:0.3rem; max-width:100px; border:2px solid ${borderColor}; border-radius:14px; padding:6px; background:${bgColor};">
                        <img src="${v.image}" alt="${v.name}" style="width:70px; height:70px; object-fit:contain; border-radius:12px; background:rgba(0,0,0,0.3); padding:4px;" onerror="this.src='https://placehold.co/70x70/1a1a2e/e16d48?text=?'">
                        <span style="font-size:${fontSize}; color:#ffbc9a; text-align:center; max-width:90px; line-height:1.3; font-weight:600; letter-spacing:0.3px; word-break:keep-all; overflow-wrap:normal; white-space:normal;">${varNameUpper}</span>
                        ${weeklyBadge}
                    </div>
                `;
            }).join('');
        }
    }
    
    renderEscResultPlayers();
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// ============================================================

function initWeeklyEscalation() {
    console.log('🚀 Запуск еженедельной эскалации...');
    
    restoreWeeklyEscalation();
    
    var weeklyVariatorNameEl = document.getElementById('weeklyVariatorName');
    if (weeklyVariatorNameEl) {
        if (weeklyEscState.weeklyVariator) {
            weeklyVariatorNameEl.innerHTML = '<i class="fas fa-star"></i> ' + weeklyEscState.weeklyVariator.name;
        } else {
            weeklyVariatorNameEl.innerHTML = '<i class="fas fa-star"></i> Нет';
        }
    }
    
    if (!checkDataLoaded()) {
        var wrapper = document.querySelector('.escalation-wrapper');
        if (wrapper) {
            wrapper.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #e16d48;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                    <h2>Ошибка загрузки данных</h2>
                    <p style="color: #c2b9d4; margin-top: 0.5rem;">Не удалось загрузить необходимые данные.<br>Проверьте подключение JS файлов.</p>
                </div>
            `;
        }
        return;
    }
    
    var options = document.querySelectorAll('#escPlayerCountOptions .player-count-btn');
    var step1Next = document.getElementById('escStep1Next');
    var step2Back = document.getElementById('escStep2Back');
    var step2Next = document.getElementById('escStep2Next');
    var step3Back = document.getElementById('escStep3Back');
    var step3Next = document.getElementById('escStep3Next');
    var step4Back = document.getElementById('escStep4Back');
    var step4Next = document.getElementById('escStep4Next');
    var nextLevelBtn = document.getElementById('escNextLevelBtn');
    var exitBtn = document.getElementById('escExitBtn');
    var restartBtn = document.getElementById('escRestartBtn');
    
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
    
    if (step2Back) {
        step2Back.addEventListener('click', function() { goToEscStep(1); });
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
            goToEscStep(3);
            renderEscEquipment();
        });
    }
    
    if (step3Back) {
        step3Back.addEventListener('click', function() { goToEscStep(2); });
    }
    
    if (step3Next) {
        step3Next.addEventListener('click', function() { 
            goToEscStep(4);
            renderEscAmps();
        });
    }
    
    if (step4Back) {
        step4Back.addEventListener('click', function() { goToEscStep(3); });
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
                        unlockAmpForPlayer(idx, ampName);
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
            updateLevelCounter();
            
            var allComplete = weeklyEscState.players.every(function(_, idx) {
                return areAllCategoriesComplete(idx);
            });
            
            if (allComplete) {
                alert('Не осталось выбора улучшения. Все улучшения были применены.');
                generateWeeklyEscResult();
            } else {
                showBreakModal();
            }
        });
    }
    
    if (exitBtn) {
        exitBtn.addEventListener('click', function() {
            var modal = document.getElementById('confirmModal');
            if (modal) modal.classList.add('active');
        });
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
            resetWeeklyEscalation();
        });
    }
    
    updateLevelCounter();
}

// ============================================================
// ЗАПУСК ЕЖЕНЕДЕЛЬНОЙ ЭСКАЛАЦИИ
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Запуск еженедельной эскалации...');
    
    if (document.getElementById('escalationWrapper')) {
        console.log('✅ Страница эскалации найдена');
        
        setTimeout(function() {
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
                return;
            }
            
            console.log('✅ Данные загружены:');
            console.log('  - mapsData:', mapsData.length, 'карт');
            console.log('  - equipmentData:', equipmentData.length, 'снаряжений');
            console.log('  - ampsData:', ampsData.length, 'амф');
            console.log('  - ampCategories:', ampCategories);
            console.log('  - trialsData:', Object.keys(trialsData).length, 'карт с испытаниями');
            console.log('  - allVariatorsData:', allVariatorsData.length, 'вариаторов');
            console.log('  - WEEKLY_VARIATOR_POOL:', WEEKLY_VARIATOR_POOL.map(function(v) { return v.name; }).join(', '));
            
            initWeeklyEscalation();
            initAmpModal();
            initConfirmModal();
            updateLevelCounter();
            
            console.log('✅ Еженедельная эскалация инициализирована!');
            console.log('📌 Еженедельный вариатор:', weeklyEscState.weeklyVariator ? weeklyEscState.weeklyVariator.name : 'Нет');
        }, 500);
    }
});
