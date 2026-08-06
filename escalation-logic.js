// ============================================================
// ЛОГИКА ЭСКАЛАЦИИ (ПОЛНАЯ ВЕРСИЯ)
// ============================================================

let escState = {
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
    nostophobiaCount: 0
};

// ============================================================
// ПРОВЕРКА ЗАГРУЗКИ ДАННЫХ
// ============================================================

function checkDataLoaded() {
    if (typeof mapsData === 'undefined') {
        console.error('❌ mapsData не загружен!');
        return false;
    }
    if (typeof equipmentData === 'undefined') {
        console.error('❌ equipmentData не загружен!');
        return false;
    }
    if (typeof ampsData === 'undefined') {
        console.error('❌ ampsData не загружен!');
        return false;
    }
    if (typeof ampCategories === 'undefined') {
        console.error('❌ ampCategories не загружен!');
        return false;
    }
    if (typeof trialsData === 'undefined') {
        console.error('❌ trialsData не загружен!');
        return false;
    }
    if (typeof allVariatorsData === 'undefined') {
        console.error('❌ allVariatorsData не загружен!');
        return false;
    }
    console.log('✅ Все данные загружены!');
    return true;
}

// ============================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С АМФАМИ
// ============================================================

function getAmpsByCategory(category) {
    if (typeof ampsData === 'undefined') return [];
    return ampsData.filter(function(amp) { return amp.category === category; });
}

function getAvailableAmpsByCategory(playerIndex, category) {
    var used = escState.usedAmps[playerIndex] || [];
    var categoryAmps = getAmpsByCategory(category);
    return categoryAmps.filter(function(amp) { return used.indexOf(amp.name) === -1; });
}

function isCategoryComplete(playerIndex, category) {
    var categoryAmps = getAmpsByCategory(category);
    var used = escState.usedAmps[playerIndex] || [];
    return categoryAmps.every(function(amp) { return used.indexOf(amp.name) !== -1; });
}

function areAllCategoriesComplete(playerIndex) {
    if (typeof ampCategories === 'undefined') return false;
    return ampCategories.every(function(cat) { return isCategoryComplete(playerIndex, cat); });
}

function checkAllAmpsUsed(playerIndex) {
    return areAllCategoriesComplete(playerIndex);
}

function getAmpForCategory(playerIndex, category) {
    var selections = escState.ampSelections[playerIndex] || {};
    return selections[category] || null;
}

function unlockAmpForPlayer(playerIndex, ampName) {
    if (!escState.unlockedAmps[playerIndex]) {
        escState.unlockedAmps[playerIndex] = [];
    }
    if (escState.unlockedAmps[playerIndex].indexOf(ampName) === -1) {
        escState.unlockedAmps[playerIndex].push(ampName);
    }
}

// ============================================================
// ПРОВЕРКА СОВМЕСТИМОСТИ ВАРИАТОРОВ
// ============================================================

function isVariatorCompatible(variator, selectedVariators, trialName, playerCount, level) {
    var variatorName = variator.name;
    var selectedNames = selectedVariators.map(function(v) { return v.name; });
    var mapName = escState.map ? escState.map.name : '';
    
    // Проверка на дубликаты
    if (selectedNames.indexOf(variatorName) !== -1) {
        return false;
    }
    
    // ============================================================
    // ОСОБЫЕ ПРАВИЛА ДЛЯ 1 ИГРОКА
    // ============================================================
    if (playerCount === 1) {
        if (variatorName === 'Без Имён' || variatorName === 'Без Рации') {
            return false;
        }
    }
    
    // ============================================================
    // 1. ЭКСТРАКЦИЯ КРОВИ — блокирует коллекции и другие вариаторы
    // ============================================================
    var extractionBloodBlocked = [
        'Сбор Подарков', 'Сбор Крыс', 'Сбор Амулетов', 'Доставьте Компоненты',
        'Извлеките Образцы Органов', 'Разбейте Телевизоры', 'Находите Радиопередатчики',
        'Собирайте Схемы', 'Найдите Трансляцию', 'Соберите Коробки С Уликами',
        'Расшифруйте Вещание', 'Потушите Огонь', 'Соберите плакаты', 'Нехватка Здоровья'
    ];
    
    if (variatorName === 'Экстракция Крови') {
        for (var ek = 0; ek < extractionBloodBlocked.length; ek++) {
            if (selectedNames.indexOf(extractionBloodBlocked[ek]) !== -1) {
                return false;
            }
        }
        for (var ec = 0; ec < selectedVariators.length; ec++) {
            if (selectedVariators[ec].category === 'collection' || selectedVariators[ec].category === 'collection_special') {
                return false;
            }
        }
    }
    if (selectedNames.indexOf('Экстракция Крови') !== -1) {
        if (extractionBloodBlocked.indexOf(variatorName) !== -1) {
            return false;
        }
        if (variator.category === 'collection' || variator.category === 'collection_special') {
            return false;
        }
    }
    
    // ============================================================
    // 2. ТРОФЕЙНОЕ СНАРЯЖЕНИЕ — НЕ БЛОКИРУЕТ УРОН ОТКЛЮЧАЕТ СНАРЯЖЕНИЕ И СЛОМАННЫЙ РЕАГЕНТ
    // ============================================================
    var trophyEquipmentBlocked = [
        'Первый Уровень', 'Без Снаряжения',
        'Без Улучшения Снаряжения', 'Увеличенная Перезарядка Снаряжения',
        'Ограниченное Снаряжение', 'Урон Перезапускает Снаряжение'
    ];
    
    if (variatorName === 'Трофейное Снаряжение') {
        for (var ts = 0; ts < trophyEquipmentBlocked.length; ts++) {
            if (selectedNames.indexOf(trophyEquipmentBlocked[ts]) !== -1) {
                return false;
            }
        }
        for (var tr = 0; tr < selectedVariators.length; tr++) {
            if (selectedVariators[tr].category === 'reagent') {
                return false;
            }
        }
    }
    if (selectedNames.indexOf('Трофейное Снаряжение') !== -1) {
        if (trophyEquipmentBlocked.indexOf(variatorName) !== -1) {
            return false;
        }
        if (variator.category === 'reagent') {
            return false;
        }
    }
    
    // ============================================================
    // 3. ОГРАНИЧЕНИЯ БОССОВ ПО КАРТАМ
    // ============================================================
    var bossMapRestrictions = {
        'Лиланд Койл': ['Полицейский участок', 'Здание суда', 'Тюремная ферма'],
        'Матушка Гуссбери': ['Детский дом', 'Парк развлечений', 'Фабрика игрушек'],
        'Франко Барби': ['Центр города', 'Пригород', 'Пристань'],
        'Близнецы Кресс': ['Торговый центр', 'Телестудия'],
        'Лилия Богомолова': ['Курорт']
    };
    
    var bossNames = Object.keys(bossMapRestrictions);
    
    if (bossNames.indexOf(variatorName) !== -1) {
        var allowedMaps = bossMapRestrictions[variatorName] || [];
        var isMapAllowed = false;
        for (var am = 0; am < allowedMaps.length; am++) {
            if (mapName.indexOf(allowedMaps[am]) !== -1 || mapName === allowedMaps[am]) {
                isMapAllowed = true;
                break;
            }
        }
        if (!isMapAllowed && allowedMaps.length > 0) {
            return false;
        }
    }
    
    // ============================================================
    // 4. БОССЫ НЕ МОГУТ ВЫПАДАТЬ ВМЕСТЕ С ГЛАВНАЯ РУЛЕТКА И САМОЕ ГЛАВНОЕ
    // ============================================================
    var selectedBosses = selectedNames.filter(function(name) { return bossNames.indexOf(name) !== -1; });
    
    if (bossNames.indexOf(variatorName) !== -1) {
        if (selectedNames.indexOf('Главная Рулетка') !== -1 || selectedNames.indexOf('Самое Главное') !== -1) {
            return false;
        }
    }
    
    if (selectedBosses.length > 0) {
        if (variatorName === 'Главная Рулетка' || variatorName === 'Самое Главное') {
            return false;
        }
    }
    
    // ============================================================
    // 5. ДВА БОССА НЕ МОГУТ ВЫПАДАТЬ ВМЕСТЕ
    // ============================================================
    if (bossNames.indexOf(variatorName) !== -1 && selectedBosses.length > 0) {
        return false;
    }
    
    // ============================================================
    // ДАЛЕЕ СЛЕДУЮТ ОСТАЛЬНЫЕ ПРАВИЛА (СОХРАНЕНЫ)
    // ============================================================
    
    if (variatorName === 'Все На Выход') {
        var blockedTrialsForAllExit = ['Устранение устаревшего оборудования'];
        if (blockedTrialsForAllExit.indexOf(trialName) !== -1) {
            return false;
        }
    }
    
    if (variatorName === 'Таймер Бомбы') {
        if (trialName === 'Устранение устаревшего оборудования') {
            return false;
        }
    }
    
    if (variatorName === 'Глубокий Ожог') {
        if (selectedNames.indexOf('Вечная Мерзлота') !== -1 || selectedNames.indexOf('Резкое Похолодание') !== -1) {
            return false;
        }
    }
    if (selectedNames.indexOf('Глубокий Ожог') !== -1) {
        if (variatorName === 'Вечная Мерзлота' || variatorName === 'Резкое Похолодание') {
            return false;
        }
    }
    
    if (variatorName === 'Сильнее Вместе' && playerCount === 1) {
        return false;
    }
    
    if (variatorName === 'Сильнее Вместе' && (playerCount === 2 || playerCount === 3)) {
        var blockedTrialsForStronger = ['Сожгите секс-игрушки', 'Обработайте фабрику газом', 'Освободите заключенных', 'Заберите наркотики'];
        if (blockedTrialsForStronger.indexOf(trialName) !== -1) {
            return false;
        }
    }
    
    var strongerTogetherBlocked = [
        'Главная Рулетка', 'Самое Главное', 'Токсический Шок',
        'Лиланд Койл', 'Матушка Гуссбери', 'Франко Барби',
        'Близнецы Кресс', 'Лилия Богомолова',
        'Больше Толкачей', 'Больше Притворщиков', 'Больше Бросателей', 'Егерь',
        'Больше Ловушек', 'Больше Ловушек II',
        'Огнеметы', 'Опасные Трубы',
        'Больше Мин Психоза', 'Больше Звуковых Ловушек',
        'Дополнительные Ловушки Главного Актива'
    ];
    if (variatorName === 'Сильнее Вместе') {
        for (var stb = 0; stb < strongerTogetherBlocked.length; stb++) {
            if (selectedNames.indexOf(strongerTogetherBlocked[stb]) !== -1) {
                return false;
            }
        }
    }
    if (selectedNames.indexOf('Сильнее Вместе') !== -1) {
        if (strongerTogetherBlocked.indexOf(variatorName) !== -1) {
            return false;
        }
    }
    
    if (variatorName === 'Вечная Мерзлота') {
        if (selectedNames.indexOf('Резкое Похолодание') !== -1 || selectedNames.indexOf('Токсический Шок') !== -1 || selectedNames.indexOf('Глубокий Ожог') !== -1) {
            return false;
        }
    }
    if (selectedNames.indexOf('Вечная Мерзлота') !== -1) {
        if (variatorName === 'Резкое Похолодание' || variatorName === 'Токсический Шок' || variatorName === 'Глубокий Ожог') {
            return false;
        }
    }
    
    if (variatorName === 'Резкое Похолодание') {
        if (selectedNames.indexOf('Глубокий Ожог') !== -1 || selectedNames.indexOf('Вечная Мерзлота') !== -1) {
            return false;
        }
    }
    if (selectedNames.indexOf('Резкое Похолодание') !== -1) {
        if (variatorName === 'Глубокий Ожог' || variatorName === 'Вечная Мерзлота') {
            return false;
        }
    }
    
    if (variatorName === 'Самое Главное' && selectedNames.indexOf('Главная Рулетка') !== -1) {
        return false;
    }
    if (variatorName === 'Главная Рулетка' && selectedNames.indexOf('Самое Главное') !== -1) {
        return false;
    }
    
    var samoGlavnoeBlocked = [
        'Лиланд Койл', 'Матушка Гуссбери', 'Франко Барби',
        'Близнецы Кресс', 'Лилия Богомолова',
        'Больше Толкачей', 'Больше Притворщиков', 'Больше Бросателей', 'Егерь'
    ];
    if (variatorName === 'Самое Главное' || variatorName === 'Главная Рулетка') {
        for (var sgb = 0; sgb < samoGlavnoeBlocked.length; sgb++) {
            if (selectedNames.indexOf(samoGlavnoeBlocked[sgb]) !== -1) {
                return false;
            }
        }
    }
    if (selectedNames.indexOf('Самое Главное') !== -1 || selectedNames.indexOf('Главная Рулетка') !== -1) {
        if (samoGlavnoeBlocked.indexOf(variatorName) !== -1) {
            return false;
        }
    }
    
    if (variatorName === 'Таймер Бомбы' && selectedNames.indexOf('Разбейте Телевизоры') !== -1) {
        return false;
    }
    if (selectedNames.indexOf('Таймер Бомбы') !== -1 && variatorName === 'Разбейте Телевизоры') {
        return false;
    }
    
    if (variatorName === 'Токсический Шок' && selectedNames.indexOf('Глубокий Ожог') !== -1) {
        return false;
    }
    if (selectedNames.indexOf('Токсический Шок') !== -1 && variatorName === 'Глубокий Ожог') {
        return false;
    }
    
    var doorsAndPassages = [
        'Ненадежные Двери',
        'Заблокированные Проходы',
        'Запертые Двери',
        'Забитые Двери',
        'Заблокированные Двери',
        'Закрытые Откатные Ворота'
    ];
    
    if (doorsAndPassages.indexOf(variatorName) !== -1) {
        for (var d = 0; d < selectedVariators.length; d++) {
            if (doorsAndPassages.indexOf(selectedVariators[d].name) !== -1) {
                return false;
            }
        }
    }
    
    var psychoBlocked = [
        'Повышенная Угроза', 'Повышенная Угроза II', 'Низкая Плотность Врагов',
        'Много Противников', 'Враги Сильнее', 'Враги Сильнее II',
        'Экстремальный Психоз', 'Без Имён'
    ];
    if (variatorName === 'Психохирургия') {
        for (var pb = 0; pb < psychoBlocked.length; pb++) {
            if (selectedNames.indexOf(psychoBlocked[pb]) !== -1) {
                return false;
            }
        }
    }
    if (selectedNames.indexOf('Психохирургия') !== -1) {
        if (psychoBlocked.indexOf(variatorName) !== -1) {
            return false;
        }
    }
    
    if (variatorName === 'Низкая Плотность Врагов' && level > 5) {
        return false;
    }
    
    if (level < 21) {
        if (variatorName === 'Ностофобия' || variatorName === 'Психохирургия') {
            return false;
        }
    }
    
    if (variatorName === 'Ностофобия' && level >= 21) {
        if (Math.random() > 0.02) {
            return false;
        }
        var nostophobiaBlocked = [
            'Без Рецептов', 'Без Амф', 'Без Снаряжения', 'Увеличенная Перезарядка Снаряжения',
            'Урон Отключает Снаряжения', 'Без Улучшения Снаряжения', 'Урон Перезапускает Снаряжения',
            'Урон Отключает Снаряжение', 'Первый Уровень', 'Сломанный Реагент'
        ];
        for (var n = 0; n < nostophobiaBlocked.length; n++) {
            if (selectedNames.indexOf(nostophobiaBlocked[n]) !== -1) {
                return false;
            }
        }
        return true;
    }
    
    var category = variator.category;
    var exclusiveCategories = [
        'collection', 'collection_special', 'hunters', 'boss', 'traps',
        'psychosis', 'obstacles', 'gates', 'reagent', 'items', 'damage'
    ];
    
    if (exclusiveCategories.indexOf(category) !== -1) {
        for (var s = 0; s < selectedVariators.length; s++) {
            if (selectedVariators[s].category === category) {
                return false;
            }
        }
    }
    
    if (category === 'collection') {
        for (var cs = 0; cs < selectedVariators.length; cs++) {
            if (selectedVariators[cs].category === 'collection_special') {
                return false;
            }
        }
    }
    if (category === 'collection_special') {
        for (var cs2 = 0; cs2 < selectedVariators.length; cs2++) {
            if (selectedVariators[cs2].category === 'collection') {
                return false;
            }
        }
    }
    
    if (variator.category === 'boss') {
        for (var h = 0; h < selectedVariators.length; h++) {
            if (selectedVariators[h].category === 'hunters') {
                return false;
            }
        }
    }
    if (variator.category === 'hunters') {
        for (var b = 0; b < selectedVariators.length; b++) {
            if (selectedVariators[b].category === 'boss') {
                return false;
            }
        }
    }
    
    if (variator.category === 'boss') {
        for (var sp = 0; sp < selectedVariators.length; sp++) {
            if (selectedVariators[sp].category === 'special') {
                return false;
            }
        }
    }
    if (variator.category === 'special') {
        for (var sp2 = 0; sp2 < selectedVariators.length; sp2++) {
            if (selectedVariators[sp2].category === 'boss') {
                return false;
            }
        }
    }
    
    var brokenReagentBlocked = [
        'Без Рецептов', 'Без Амф', 'Без Снаряжения', 'Увеличенная Перезарядка Снаряжения',
        'Урон Отключает Снаряжения', 'Без Улучшения Снаряжения', 'Урон Перезапускает Снаряжения',
        'Урон Отключает Снаряжение', 'Первый Уровень', 'Ностофобия'
    ];
    if (variatorName === 'Сломанный Реагент') {
        for (var br = 0; br < brokenReagentBlocked.length; br++) {
            if (selectedNames.indexOf(brokenReagentBlocked[br]) !== -1) {
                return false;
            }
        }
    }
    if (selectedNames.indexOf('Сломанный Реагент') !== -1) {
        if (brokenReagentBlocked.indexOf(variatorName) !== -1) {
            return false;
        }
    }
    
    var deepBurnBlocked = ['Больше Толкачей', 'Егерь', 'Больше Притворщиков'];
    if (variatorName === 'Глубокий Ожог') {
        for (var db = 0; db < deepBurnBlocked.length; db++) {
            if (selectedNames.indexOf(deepBurnBlocked[db]) !== -1) {
                return false;
            }
        }
    }
    if (selectedNames.indexOf('Глубокий Ожог') !== -1) {
        if (deepBurnBlocked.indexOf(variatorName) !== -1) {
            return false;
        }
    }
    
    var mineGroup = ['Взрывчатка', 'Ледяные Мины', 'Огненные Мины'];
    if (mineGroup.indexOf(variatorName) !== -1) {
        for (var mg = 0; mg < selectedVariators.length; mg++) {
            if (mineGroup.indexOf(selectedVariators[mg].name) !== -1) {
                return false;
            }
        }
    }
    
    var fireMineBlocked = [
        'Больше Ловушек', 'Больше Ловушек II', 'Больше Мин Психоза',
        'Больше Звуковых Ловушек', 'Дополнительные Ловушки Главного Актива',
        'Взрывчатка', 'Ледяные Мины'
    ];
    if (variatorName === 'Огненные Мины') {
        for (var fm = 0; fm < fireMineBlocked.length; fm++) {
            if (selectedNames.indexOf(fireMineBlocked[fm]) !== -1) {
                return false;
            }
        }
    }
    if (selectedNames.indexOf('Огненные Мины') !== -1) {
        if (fireMineBlocked.indexOf(variatorName) !== -1) {
            return false;
        }
    }
    
    var iceMineBlocked = [
        'Больше Ловушек', 'Больше Ловушек II', 'Больше Мин Психоза',
        'Больше Звуковых Ловушек', 'Дополнительные Ловушки Главного Актива',
        'Взрывчатка', 'Огненные Мины'
    ];
    if (variatorName === 'Ледяные Мины') {
        for (var im = 0; im < iceMineBlocked.length; im++) {
            if (selectedNames.indexOf(iceMineBlocked[im]) !== -1) {
                return false;
            }
        }
    }
    if (selectedNames.indexOf('Ледяные Мины') !== -1) {
        if (iceMineBlocked.indexOf(variatorName) !== -1) {
            return false;
        }
    }
    
    var explosionBlocked = [
        'Больше Ловушек', 'Больше Ловушек II', 'Больше Мин Психоза',
        'Больше Звуковых Ловушек', 'Дополнительные Ловушки Главного Актива',
        'Огненные Мины', 'Ледяные Мины', 'Опасные Трубы'
    ];
    if (variatorName === 'Взрывчатка') {
        for (var ex = 0; ex < explosionBlocked.length; ex++) {
            if (selectedNames.indexOf(explosionBlocked[ex]) !== -1) {
                return false;
            }
        }
    }
    if (selectedNames.indexOf('Взрывчатка') !== -1) {
        if (explosionBlocked.indexOf(variatorName) !== -1) {
            return false;
        }
    }
    
    if (variator.category === 'reagent') {
        var reagentCount = 0;
        for (var r = 0; r < selectedVariators.length; r++) {
            if (selectedVariators[r].category === 'reagent') {
                reagentCount++;
            }
        }
        if (reagentCount >= 2) {
            return false;
        }
    }
    
    return true;
}

// ============================================================
// ПОЛУЧЕНИЕ ВАРИАТОРОВ ДЛЯ УРОВНЯ
// ============================================================

function getVariatorsForLevel(level, mapName, playerCount) {
    if (typeof allVariatorsData === 'undefined') return [];
    
    console.log('🔄 Генерация вариаторов для уровня:', level);
    console.log('📍 Карта:', mapName);
    console.log('👥 Игроков:', playerCount);
    
    var availableVariators = allVariatorsData.slice();
    
    var excludedVariators = [
        'Ворота С Детектором Звука',
        'Дистанционные Ворота',
        'Бесконтактные Ворота',
        'Времянные Ворота',
        'Закрытые Ворота'
    ];
    
    availableVariators = availableVariators.filter(function(v) {
        return excludedVariators.indexOf(v.name) === -1;
    });
    
    if (level > 5) {
        availableVariators = availableVariators.filter(function(v) {
            return v.name !== "Низкая Плотность Врагов";
        });
    }
    
    var trialName = escState.trial ? escState.trial.name : '';
    
    if (level >= 21) {
        console.log('🎯 Уровень 21+ - 8 вариаторов');
        
        var psycho = availableVariators.find(function(v) { return v.name === "Психохирургия"; });
        var doubleTasks = availableVariators.find(function(v) { 
            return v.name === "Двойные задания";
        });
        
        if (!psycho) {
            console.warn('⚠️ Психохирургия не найдена, создаем');
            psycho = { name: "Психохирургия", image: "images/вариатор-психохирургия.webp", category: "psycho" };
            availableVariators.push(psycho);
        }
        
        if (!doubleTasks) {
            console.warn('⚠️ Двойные задания не найдены, создаем');
            doubleTasks = { name: "Двойные задания", image: "images/вариатор-д-задания.webp", category: "collection_special" };
            availableVariators.push(doubleTasks);
        }
        
        var result = [psycho, doubleTasks];
        console.log('📋 Обязательные:', result.map(function(v) { return v.name; }).join(', '));
        
        var others = availableVariators.filter(function(v) {
            return v.name !== "Психохирургия" && v.name !== "Двойные задания";
        });
        
        var shuffled = others.slice().sort(function() { return Math.random() - 0.5; });
        
        for (var i = 0; i < shuffled.length && result.length < 8; i++) {
            var candidate = shuffled[i];
            if (isVariatorCompatible(candidate, result, trialName, playerCount, level)) {
                result.push(candidate);
                console.log('✅ Добавлен:', candidate.name);
            }
        }
        
        if (result.length < 8) {
            console.log('⚠️ Не хватает до 8, добираем...');
            var remaining = others.filter(function(v) {
                return result.indexOf(v) === -1;
            });
            for (var j = 0; j < remaining.length && result.length < 8; j++) {
                var candidate2 = remaining[j];
                if (result.indexOf(candidate2) === -1) {
                    result.push(candidate2);
                    console.log('✅ Добавлен (принудительно):', candidate2.name);
                }
            }
        }
        
        console.log('✅ Итог (' + result.length + '):', result.map(function(v) { return v.name; }).join(', '));
        return result;
    }
    
    var count;
    if (level === 1) {
        count = 2;
    } else if (level >= 2 && level <= 2) {
        count = 3;
    } else if (level >= 3 && level <= 3) {
        count = 3;
    } else if (level >= 4 && level <= 4) {
        count = 4;
    } else if (level >= 5 && level <= 5) {
        count = 5;
    } else if (level >= 6 && level <= 15) {
        count = 6;
    } else if (level >= 16 && level <= 19) {
        count = 7;
    } else if (level >= 20 && level <= 20) {
        count = 7;
    } else {
        count = 2;
    }
    
    console.log('🎯 Нужно вариаторов:', count);
    
    var filtered = availableVariators.filter(function(v) {
        return v.name !== "Ностофобия" && v.name !== "Психохирургия";
    });
    
    var shuffled = filtered.slice().sort(function() { return Math.random() - 0.5; });
    var result = [];
    
    for (var k = 0; k < shuffled.length && result.length < count; k++) {
        var candidate = shuffled[k];
        if (isVariatorCompatible(candidate, result, trialName, playerCount, level)) {
            result.push(candidate);
        }
    }
    
    if (result.length < count) {
        for (var m = 0; m < shuffled.length && result.length < count; m++) {
            var candidate2 = shuffled[m];
            if (result.indexOf(candidate2) === -1) {
                result.push(candidate2);
            }
        }
    }
    
    console.log('✅ Итог (' + result.length + '):', result.map(function(v) { return v.name; }).join(', '));
    return result;
}

// ============================================================
// ПОЛУЧЕНИЕ КАРТЫ И ИСПЫТАНИЯ
// ============================================================

function getMapAndTrial(level) {
    if (typeof trialsData === 'undefined') return null;
    
    console.log('🔄 Поиск карты для уровня:', level);
    
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
                if (escState.usedBigTrials.indexOf(trial.name) === -1) {
                    availableTrials.push({
                        mapName: mapName,
                        mapImage: mapData.image,
                        trial: trial
                    });
                }
            } else if (!isBigLevel && !isBig) {
                if (escState.usedSmallTrials.indexOf(trial.name) === -1) {
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
            escState.usedBigTrials = [];
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
            escState.usedSmallTrials = [];
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
    
    escState.currentTrialName = selected.trial.name;
    escState.map = { name: selected.mapName, image: selected.mapImage };
    
    if (selected.trial.name === selected.trial.name.toUpperCase()) {
        escState.usedBigTrials.push(selected.trial.name);
    } else {
        escState.usedSmallTrials.push(selected.trial.name);
    }
    
    return selected;
}

// ============================================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ВАРИАТОРАМИ
// ============================================================

function getDifficultyByLevel(level) {
    if (level >= 1 && level <= 5) return { name: "Начальная", class: "level-difficulty-intro" };
    else if (level >= 6 && level <= 15) return { name: "Нормальная", class: "level-difficulty-standard" };
    else if (level >= 16 && level <= 20) return { name: "Высокая", class: "level-difficulty-intensive" };
    else return { name: "Психохирургия", class: "level-difficulty-psycho" };
}

// ============================================================
// НАВИГАЦИЯ
// ============================================================

function goToEscStep(step) {
    escState.currentStep = step;
    
    var step1 = document.getElementById('escStep1');
    var step2 = document.getElementById('escStep2');
    var step3 = document.getElementById('escStep3');
    var step4 = document.getElementById('escStep4');
    var result = document.getElementById('escResult');
    
    if (step1) step1.classList.add('hidden');
    if (step2) step2.classList.add('hidden');
    if (step3) step3.classList.add('hidden');
    if (step4) step4.classList.add('hidden');
    
    if (result) {
        result.classList.remove('active');
        result.style.display = 'none';
    }

    var stepMap = {
        1: step1,
        2: step2,
        3: step3,
        4: step4
    };

    var target = stepMap[step];
    if (target) target.classList.remove('hidden');
}

function updateLevelCounter() {
    var levelNum = document.getElementById('levelNumber');
    var levelDiff = document.getElementById('levelDifficulty');
    var difficulty = getDifficultyByLevel(escState.level);
    
    if (levelNum) levelNum.textContent = escState.level;
    if (levelDiff) {
        levelDiff.textContent = difficulty.name;
        levelDiff.className = 'level-difficulty ' + difficulty.class;
    }
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ЭСКАЛАЦИИ
// ============================================================

function initEscalation() {
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
                escState.playerCount = parseInt(this.dataset.count);
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
            escState.players = [];
            inputs.forEach(function(input, i) {
                escState.players.push(input.value.trim() || 'Игрок ' + (i + 1));
            });
            escState.players.forEach(function(_, idx) {
                if (!escState.usedAmps[idx]) escState.usedAmps[idx] = [];
                if (!escState.ampSelections[idx]) escState.ampSelections[idx] = {};
                if (!escState.unlockedAmps[idx]) escState.unlockedAmps[idx] = [];
                escState.allAmpsUsed[idx] = false;
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
            escState.players.forEach(function(_, idx) {
                var selected = escState.ampSelections[idx] || {};
                Object.keys(selected).forEach(function(category) {
                    var ampName = selected[category];
                    if (ampName) {
                        if (!escState.usedAmps[idx]) escState.usedAmps[idx] = [];
                        if (escState.usedAmps[idx].indexOf(ampName) === -1) {
                            escState.usedAmps[idx].push(ampName);
                        }
                        unlockAmpForPlayer(idx, ampName);
                    }
                });
            });
            generateEscResult();
        });
    }

    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', function() {
            escState.level++;
            console.log('🔄 Переход на уровень:', escState.level);
            updateLevelCounter();
            
            var allComplete = escState.players.every(function(_, idx) {
                return areAllCategoriesComplete(idx);
            });
            
            if (allComplete) {
                alert('Не осталось выбора улучшения. Все улучшения были применены.');
                generateEscResult();
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
            resetEscalation();
        });
    }
}

// ============================================================
// ОТРИСОВКА ШАГОВ
// ============================================================

function renderEscPlayerNames() {
    var container = document.getElementById('escPlayerNameInputs');
    if (!container) return;
    container.innerHTML = '';
    
    var grid = document.createElement('div');
    
    var playerCount = escState.playerCount;
    grid.className = 'selection-grid players-' + playerCount;
    grid.style.cssText = 'display: grid; gap: 12px 20px; max-width: 600px; margin: 0 auto;';
    
    if (playerCount === 1) {
        grid.style.gridTemplateColumns = '1fr';
        grid.style.maxWidth = '300px';
    } else if (playerCount === 2) {
        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.maxWidth = '500px';
    } else if (playerCount === 3) {
        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.maxWidth = '500px';
    } else if (playerCount === 4) {
        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.maxWidth = '550px';
    }
    
    for (var i = 0; i < playerCount; i++) {
        var row = document.createElement('div');
        row.className = 'player-block';
        row.style.cssText = 'display: flex; flex-direction: column; gap: 4px; background: rgba(0,0,0,0.15); border-radius: 12px; padding: 12px 16px; border: 1px solid rgba(220,90,50,0.08);';
        row.innerHTML = `
            <label style="font-size: 0.8rem; color: #888; font-weight: 500; letter-spacing: 0.5px;">
                <i class="fas fa-user" style="color: #e16d48; margin-right: 6px;"></i>
                Игрок ${i + 1}
            </label>
            <input type="text" placeholder="Введите ник..." id="escPlayerName_${i}" value="${escState.players[i] || ''}" style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(220,90,50,0.2); background: rgba(255,255,255,0.05); color: #ffbc9a; font-size: 0.95rem; outline: none; transition: border-color 0.3s; box-sizing: border-box;">
        `;
        grid.appendChild(row);
        
        if (playerCount === 3 && i === 2) {
            row.style.gridColumn = '1 / -1';
            row.style.maxWidth = '50%';
            row.style.justifySelf = 'center';
            row.style.width = '100%';
        }
    }
    
    container.appendChild(grid);
}

// ============================================================
// ОТРИСОВКА СНАРЯЖЕНИЯ (С ЗЕЛЕНЫМ ФОНОМ ПРИ ВЫБОРЕ)
// ============================================================

function renderEscEquipment() {
    var container = document.getElementById('escStep3Content');
    if (!container) return;
    container.innerHTML = '';
    
    if (typeof equipmentData === 'undefined' || equipmentData.length === 0) {
        container.innerHTML = '<div style="color: #e16d48; text-align: center; padding: 2rem;">Ошибка: данные снаряжения не загружены</div>';
        return;
    }
    
    var header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 20px;';
    header.innerHTML = `
        <div style="font-size: 0.8rem; color: #888; letter-spacing: 2px; text-transform: uppercase;">Шаг 3</div>
        <div style="font-size: 1.5rem; font-weight: 700; color: #ffbc9a; margin-top: 2px;">Выбор снаряжения</div>
        <div style="font-size: 0.85rem; color: #888; margin-top: 4px;">Каждому игроку предлагается 3 случайных снаряжения на выбор (нужно выбрать 1)</div>
    `;
    container.appendChild(header);
    
    var playerCount = escState.players.length;
    var gridWrapper = document.createElement('div');
    gridWrapper.className = 'selection-grid players-' + playerCount;
    gridWrapper.style.cssText = 'display: grid; gap: 16px 24px; max-width: 600px; margin: 0 auto;';
    
    if (playerCount === 1) {
        gridWrapper.style.gridTemplateColumns = '1fr';
        gridWrapper.style.maxWidth = '350px';
    } else if (playerCount === 2) {
        gridWrapper.style.gridTemplateColumns = '1fr 1fr';
        gridWrapper.style.maxWidth = '550px';
    } else if (playerCount === 3) {
        gridWrapper.style.gridTemplateColumns = '1fr 1fr';
        gridWrapper.style.maxWidth = '550px';
    } else if (playerCount === 4) {
        gridWrapper.style.gridTemplateColumns = '1fr 1fr';
        gridWrapper.style.maxWidth = '600px';
    }
    
    escState.players.forEach(function(player, idx) {
        var section = document.createElement('div');
        section.className = 'player-block';
        section.style.cssText = 'background: rgba(0,0,0,0.2); border-radius: 16px; padding: 16px; border: 1px solid rgba(220,90,50,0.08);';
        
        var title = document.createElement('div');
        title.style.cssText = 'font-weight: 600; color: #ffbc9a; margin-bottom: 12px; text-align: center; font-size: 0.95rem; letter-spacing: 0.5px;';
        title.innerHTML = '<i class="fas fa-user" style="color: #e16d48; margin-right: 6px;"></i> ' + player;
        section.appendChild(title);
        
        var wrapper = document.createElement('div');
        wrapper.className = 'selection-wrapper';
        
        var grid = document.createElement('div');
        grid.className = 'selection-grid';
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;';
        
        var shuffled = equipmentData.slice().sort(function() { return Math.random() - 0.5; });
        var selectedEquip = shuffled.slice(0, 3);
        
        selectedEquip.forEach(function(eq) {
            var item = document.createElement('div');
            item.className = 'selection-item';
            item.dataset.player = idx;
            item.dataset.equip = eq.name;
            var isSelected = escState.equipSelections[idx] === eq.name;
            
            // ============================================================
            // ЗЕЛЕНЫЙ ФОН ПРИ ВЫБОРЕ (как на картинке)
            // ============================================================
            item.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 2px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.3s ease; position: relative;';
            if (isSelected) {
                item.style.borderColor = '#2ecc71';
                item.style.background = 'rgba(46, 204, 113, 0.15)';
                item.style.boxShadow = '0 0 20px rgba(46, 204, 113, 0.15)';
            }
            
            // Hover эффект
            item.addEventListener('mouseenter', function() {
                if (!this.classList.contains('selected')) {
                    this.style.borderColor = 'rgba(46, 204, 113, 0.3)';
                    this.style.background = 'rgba(46, 204, 113, 0.05)';
                }
            });
            item.addEventListener('mouseleave', function() {
                if (!this.classList.contains('selected')) {
                    this.style.borderColor = 'rgba(255,255,255,0.06)';
                    this.style.background = 'rgba(255,255,255,0.03)';
                }
            });
            
            item.innerHTML = `
                <img src="${eq.image}" alt="${eq.name}" onerror="this.src='https://placehold.co/80x80/1a1a2e/e16d48?text=?'" style="width:80px; height:80px; object-fit:contain; border-radius:10px; background:rgba(0,0,0,0.3); padding:4px;">
                <div style="font-size:0.65rem; color:#c2b9d4; text-align:center; font-weight:500; line-height:1.2;">${eq.name}</div>
                <div class="check-mark" style="position:absolute; top:4px; right:4px; color:#2ecc71; font-size:1rem; ${isSelected ? '' : 'display:none;'}"><i class="fas fa-check-circle"></i></div>
            `;
            
            item.addEventListener('click', function() {
                var parent = this.closest('.selection-grid');
                parent.querySelectorAll('.selection-item').forEach(function(el) {
                    el.classList.remove('selected');
                    el.style.borderColor = 'rgba(255,255,255,0.06)';
                    el.style.background = 'rgba(255,255,255,0.03)';
                    el.style.boxShadow = 'none';
                    var check = el.querySelector('.check-mark');
                    if (check) check.style.display = 'none';
                });
                this.classList.add('selected');
                // Зеленый фон при выборе
                this.style.borderColor = '#2ecc71';
                this.style.background = 'rgba(46, 204, 113, 0.15)';
                this.style.boxShadow = '0 0 20px rgba(46, 204, 113, 0.15)';
                var check = this.querySelector('.check-mark');
                if (check) check.style.display = 'block';
                escState.equipSelections[idx] = eq.name;
                checkEscEquipReady();
            });
            
            grid.appendChild(item);
        });
        
        wrapper.appendChild(grid);
        section.appendChild(wrapper);
        gridWrapper.appendChild(section);
        
        if (playerCount === 3 && idx === 2) {
            section.style.gridColumn = '1 / -1';
            section.style.maxWidth = '60%';
            section.style.justifySelf = 'center';
            section.style.width = '100%';
        }
    });
    
    container.appendChild(gridWrapper);
    checkEscEquipReady();
}

function checkEscEquipReady() {
    var allSelected = escState.players.every(function(_, idx) {
        return escState.equipSelections[idx] !== undefined;
    });
    var btn = document.getElementById('escStep3Next');
    if (btn) btn.disabled = !allSelected;
}

// ============================================================
// ОТРИСОВКА АМФ
// ============================================================

function renderEscAmps() {
    var container = document.getElementById('escStep4Content');
    if (!container) return;
    container.innerHTML = '';
    
    if (typeof ampsData === 'undefined' || ampsData.length === 0) {
        container.innerHTML = '<div style="color: #e16d48; text-align: center; padding: 2rem;">Ошибка: данные амф не загружены</div>';
        return;
    }
    
    if (typeof ampCategories === 'undefined' || ampCategories.length === 0) {
        container.innerHTML = '<div style="color: #e16d48; text-align: center; padding: 2rem;">Ошибка: категории амф не загружены</div>';
        return;
    }
    
    var header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 20px;';
    header.innerHTML = `
        <div style="font-size: 0.8rem; color: #888; letter-spacing: 2px; text-transform: uppercase;">Шаг 4</div>
        <div style="font-size: 1.5rem; font-weight: 700; color: #ffbc9a; margin-top: 2px;">Выбор АМФ</div>
        <div style="font-size: 0.85rem; color: #888; margin-top: 4px;">Каждому игроку предлагается 3 случайных амфы на выбор (нужно выбрать 1)</div>
    `;
    container.appendChild(header);
    
    var playerCount = escState.players.length;
    var gridWrapper = document.createElement('div');
    gridWrapper.className = 'selection-grid players-' + playerCount;
    gridWrapper.style.cssText = 'display: grid; gap: 16px 24px; max-width: 600px; margin: 0 auto;';
    
    if (playerCount === 1) {
        gridWrapper.style.gridTemplateColumns = '1fr';
        gridWrapper.style.maxWidth = '350px';
    } else if (playerCount === 2) {
        gridWrapper.style.gridTemplateColumns = '1fr 1fr';
        gridWrapper.style.maxWidth = '550px';
    } else if (playerCount === 3) {
        gridWrapper.style.gridTemplateColumns = '1fr 1fr';
        gridWrapper.style.maxWidth = '550px';
    } else if (playerCount === 4) {
        gridWrapper.style.gridTemplateColumns = '1fr 1fr';
        gridWrapper.style.maxWidth = '600px';
    }
    
    escState.players.forEach(function(player, idx) {
        var section = document.createElement('div');
        section.className = 'player-block';
        section.style.cssText = 'background: rgba(0,0,0,0.2); border-radius: 16px; padding: 16px; border: 1px solid rgba(220,90,50,0.08);';
        
        var title = document.createElement('div');
        title.style.cssText = 'font-weight: 600; color: #ffbc9a; margin-bottom: 8px; text-align: center; font-size: 0.95rem; letter-spacing: 0.5px;';
        title.innerHTML = '<i class="fas fa-user" style="color: #e16d48; margin-right: 6px;"></i> ' + player;
        section.appendChild(title);

        var availableCategories = ampCategories.filter(function(cat) {
            return !isCategoryComplete(idx, cat);
        });
        
        if (availableCategories.length === 0) {
            var msg = document.createElement('div');
            msg.style.cssText = 'text-align: center; color: #2ecc71; padding: 0.5rem; font-size: 0.85rem;';
            msg.innerHTML = '<i class="fas fa-check-circle"></i> Все улучшения применены';
            section.appendChild(msg);
            gridWrapper.appendChild(section);
            return;
        }
        
        var randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        
        var catLabel = document.createElement('div');
        catLabel.style.cssText = 'text-align: center; color: #e16d48; font-size: 0.75rem; margin-bottom: 10px; font-weight: 500; letter-spacing: 0.5px;';
        catLabel.innerHTML = '<i class="fas fa-tag"></i> ' + randomCategory;
        section.appendChild(catLabel);
        
        var wrapper = document.createElement('div');
        wrapper.className = 'selection-wrapper';
        
        var grid = document.createElement('div');
        grid.className = 'selection-grid';
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;';
        
        var availableAmps = getAvailableAmpsByCategory(idx, randomCategory);
        var shuffled = availableAmps.slice().sort(function() { return Math.random() - 0.5; });
        var ampCount = Math.min(shuffled.length, 3);
        var selectedAmps = shuffled.slice(0, ampCount);
        
        if (selectedAmps.length === 0) {
            for (var i = 0; i < 3; i++) {
                var emptyItem = document.createElement('div');
                emptyItem.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.05); opacity: 0.4;';
                emptyItem.innerHTML = `
                    <div style="font-size: 2rem; color: #555;">⛔</div>
                    <div style="font-size:0.6rem; color:#555;">ПУСТО</div>
                `;
                grid.appendChild(emptyItem);
            }
        } else {
            selectedAmps.forEach(function(amp) {
                var item = document.createElement('div');
                item.className = 'selection-item';
                item.dataset.player = idx;
                item.dataset.amp = amp.name;
                var currentAmp = escState.ampSelections[idx] ? escState.ampSelections[idx][randomCategory] : null;
                var isSelected = currentAmp === amp.name;
                
                item.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 2px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.3s ease; position: relative;';
                if (isSelected) {
                    item.style.borderColor = '#e16d48';
                    item.style.background = 'rgba(220,90,50,0.1)';
                }
                
                item.innerHTML = `
                    <img src="${amp.image}" alt="${amp.name}" onerror="this.src='https://placehold.co/80x80/1a1a2e/e16d48?text=?'" style="width:80px; height:80px; object-fit:contain; border-radius:10px; background:rgba(0,0,0,0.3); padding:4px;">
                    <div style="font-size:0.65rem; color:#c2b9d4; text-align:center; font-weight:500; line-height:1.2;">${amp.name}</div>
                    <div style="font-size:0.5rem; color:#666;">${amp.category}</div>
                    <div class="check-mark" style="position:absolute; top:4px; right:4px; color:#2ecc71; font-size:1rem; ${isSelected ? '' : 'display:none;'}"><i class="fas fa-check-circle"></i></div>
                `;
                
                item.addEventListener('click', function() {
                    var parent = this.closest('.selection-grid');
                    parent.querySelectorAll('.selection-item').forEach(function(el) {
                        el.classList.remove('selected');
                        el.style.borderColor = 'rgba(255,255,255,0.06)';
                        el.style.background = 'rgba(255,255,255,0.03)';
                        var check = el.querySelector('.check-mark');
                        if (check) check.style.display = 'none';
                    });
                    this.classList.add('selected');
                    this.style.borderColor = '#e16d48';
                    this.style.background = 'rgba(220,90,50,0.1)';
                    var check = this.querySelector('.check-mark');
                    if (check) check.style.display = 'block';
                    if (!escState.ampSelections[idx]) escState.ampSelections[idx] = {};
                    escState.ampSelections[idx][randomCategory] = amp.name;
                    unlockAmpForPlayer(idx, amp.name);
                    checkEscAmpsReady();
                });
                
                grid.appendChild(item);
            });
            
            if (selectedAmps.length < 3) {
                for (var j = selectedAmps.length; j < 3; j++) {
                    var emptyItem = document.createElement('div');
                    emptyItem.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.05); opacity: 0.4;';
                    emptyItem.innerHTML = `
                        <div style="font-size: 2rem; color: #555;">⛔</div>
                        <div style="font-size:0.6rem; color:#555;">ПУСТО</div>
                    `;
                    grid.appendChild(emptyItem);
                }
            }
        }
        
        wrapper.appendChild(grid);
        section.appendChild(wrapper);
        gridWrapper.appendChild(section);
        
        if (playerCount === 3 && idx === 2) {
            section.style.gridColumn = '1 / -1';
            section.style.maxWidth = '60%';
            section.style.justifySelf = 'center';
            section.style.width = '100%';
        }
    });
    
    container.appendChild(gridWrapper);
    checkEscAmpsReady();
}

function checkEscAmpsReady() {
    var btn = document.getElementById('escStep4Next');
    if (btn) btn.disabled = false;
}

// ============================================================
// ВСПЛЫВАЮЩЕЕ ОКНО-ПРЕВЬЮ
// ============================================================

function showPreviewModal(trialName, mapName, variators, level) {
    var oldModal = document.getElementById('previewModal');
    if (oldModal) {
        oldModal.remove();
    }

    var isLevel21Plus = level >= 21;

    var overlay = document.createElement('div');
    overlay.className = 'preview-overlay';
    overlay.id = 'previewModal';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        cursor: pointer;
        animation: fadeInPreview 0.5s ease;
    `;

    var modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: linear-gradient(145deg, #1a1a2e, #2a1a3e);
        border-radius: 24px;
        padding: ${isLevel21Plus ? '25px 30px' : '35px 45px'};
        max-width: ${isLevel21Plus ? '1300px' : '1000px'};
        width: 96%;
        text-align: center;
        border: 1px solid rgba(220, 90, 50, 0.3);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(220, 90, 50, 0.1);
        animation: slideUpPreview 0.6s ease;
    `;

    var style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInPreview {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUpPreview {
            from { 
                opacity: 0;
                transform: translateY(40px) scale(0.95);
            }
            to { 
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        @keyframes slideDownPreview {
            from { 
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            to { 
                opacity: 0;
                transform: translateY(40px) scale(0.95);
            }
        }
        .preview-variator-item {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            gap: ${isLevel21Plus ? '5px' : '6px'};
            animation: variatorAppear 0.4s ease forwards;
            opacity: 0;
            transform: scale(0.8);
            margin: ${isLevel21Plus ? '0 4px' : '0 5px'};
            max-width: ${isLevel21Plus ? '100px' : '110px'};
            min-width: ${isLevel21Plus ? '65px' : '70px'};
            flex: 0 1 auto;
        }
        @keyframes variatorAppear {
            from {
                opacity: 0;
                transform: scale(0.8) rotate(-5deg);
            }
            to {
                opacity: 1;
                transform: scale(1) rotate(0deg);
            }
        }
        .preview-close-hint {
            animation: pulseHint 2s ease-in-out infinite;
        }
        @keyframes pulseHint {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
        .preview-variator-name {
            font-weight: 700;
            color: #ffbc9a;
            text-align: center;
            letter-spacing: 0.2px;
            max-width: ${isLevel21Plus ? '100px' : '110px'};
            line-height: 1.2;
            word-break: keep-all;
            overflow-wrap: normal;
            white-space: normal;
            display: block;
            text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .preview-variator-img {
            width: ${isLevel21Plus ? '60px' : '70px'};
            height: ${isLevel21Plus ? '60px' : '70px'};
            object-fit: contain;
            border-radius: ${isLevel21Plus ? '10px' : '12px'};
            background: rgba(0,0,0,0.3);
            padding: ${isLevel21Plus ? '4px' : '6px'};
            border: 1px solid rgba(220,90,50,0.15);
            flex-shrink: 0;
        }
        .preview-variators-container {
            display: flex;
            flex-wrap: nowrap;
            justify-content: center;
            align-items: flex-start;
            gap: ${isLevel21Plus ? '6px 10px' : '8px 14px'};
            padding: ${isLevel21Plus ? '12px 0 10px 0' : '16px 0 12px 0'};
            border-top: 1px solid rgba(220, 90, 50, 0.15);
            border-bottom: 1px solid rgba(220, 90, 50, 0.15);
            margin-bottom: ${isLevel21Plus ? '14px' : '18px'};
            min-height: ${isLevel21Plus ? '100px' : '110px'};
            overflow-x: auto;
            overflow-y: visible;
            scrollbar-width: thin;
        }
        .preview-variators-container::-webkit-scrollbar {
            height: 3px;
        }
        .preview-variators-container::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
            border-radius: 3px;
        }
        .preview-variators-container::-webkit-scrollbar-thumb {
            background: rgba(220,90,50,0.3);
            border-radius: 3px;
        }
        .preview-level-number {
            font-size: ${isLevel21Plus ? '2.5rem' : '3rem'};
            font-weight: 900;
            color: #e16d48;
            letter-spacing: 2px;
            margin-bottom: ${isLevel21Plus ? '4px' : '8px'};
            text-shadow: 0 2px 20px rgba(220, 90, 50, 0.3);
        }
        .preview-trial-name {
            font-size: ${isLevel21Plus ? '1.7rem' : '2rem'};
            font-weight: 900;
            color: #ffbc9a;
            letter-spacing: 2px;
            margin-bottom: ${isLevel21Plus ? '2px' : '4px'};
            line-height: 1.2;
        }
        .preview-map-name {
            font-size: ${isLevel21Plus ? '1.1rem' : '1.2rem'};
            font-weight: 300;
            color: #c2b9d4;
            letter-spacing: 3px;
            margin-bottom: ${isLevel21Plus ? '14px' : '18px'};
            text-transform: uppercase;
        }
        .preview-label {
            font-size: ${isLevel21Plus ? '0.7rem' : '0.85rem'};
            color: #888;
            letter-spacing: 2px;
            text-transform: uppercase;
            font-weight: 300;
        }
        .preview-hint {
            color: #666;
            font-size: ${isLevel21Plus ? '0.65rem' : '0.75rem'};
            letter-spacing: 1px;
            text-transform: uppercase;
        }
    `;
    document.head.appendChild(style);

    var variatorsHtml = variators.map(function(v, index) {
        var nameUpper = v.name.toUpperCase();
        var delay = index * 0.05;
        
        var fontSize;
        var maxWidth;
        
        if (isLevel21Plus) {
            if (v.name.length > 24) {
                fontSize = '0.5rem';
                maxWidth = '80px';
            } else if (v.name.length > 20) {
                fontSize = '0.55rem';
                maxWidth = '85px';
            } else if (v.name.length > 16) {
                fontSize = '0.6rem';
                maxWidth = '90px';
            } else if (v.name.length > 12) {
                fontSize = '0.65rem';
                maxWidth = '95px';
            } else if (v.name.length > 8) {
                fontSize = '0.7rem';
                maxWidth = '100px';
            } else {
                fontSize = '0.75rem';
                maxWidth = '100px';
            }
        } else {
            if (v.name.length > 22) {
                fontSize = '0.5rem';
                maxWidth = '90px';
            } else if (v.name.length > 18) {
                fontSize = '0.55rem';
                maxWidth = '95px';
            } else if (v.name.length > 14) {
                fontSize = '0.6rem';
                maxWidth = '100px';
            } else if (v.name.length > 10) {
                fontSize = '0.65rem';
                maxWidth = '105px';
            } else {
                fontSize = '0.75rem';
                maxWidth = '110px';
            }
        }
        
        return `
            <div class="preview-variator-item" style="animation-delay: ${delay}s; max-width: ${maxWidth};">
                <img class="preview-variator-img" src="${v.image}" alt="${v.name}" onerror="this.src='https://placehold.co/${isLevel21Plus ? '60x60' : '70x70'}/1a1a2e/e16d48?text=?'">
                <span class="preview-variator-name" style="font-size:${fontSize}; max-width:${maxWidth};">${nameUpper}</span>
            </div>
        `;
    }).join('');

    var levelDisplay = '#' + level;

    modalContent.innerHTML = `
        <div style="margin-bottom: 2px;">
            <span class="preview-label">Эскалационная терапия</span>
        </div>
        <div class="preview-level-number">${levelDisplay}</div>
        <div class="preview-trial-name">${trialName.toUpperCase()}</div>
        <div class="preview-map-name">${mapName.toUpperCase()}</div>
        <div class="preview-variators-container">
            ${variatorsHtml}
        </div>
        <div class="preview-hint">
            <i class="fas fa-mouse-pointer" style="margin-right: 6px;"></i>
            Нажмите в любом месте для продолжения
        </div>
    `;

    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
        modalContent.style.animation = 'slideDownPreview 0.3s ease forwards';
        overlay.style.animation = 'fadeInPreview 0.3s ease reverse';
        
        setTimeout(function() {
            overlay.remove();
            showFullResult();
        }, 350);
    });

    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', escHandler);
            overlay.click();
        }
    });
}

// ============================================================
// ПОКАЗ ПОЛНОГО РЕЗУЛЬТАТА
// ============================================================

function showFullResult() {
    var resultContainer = document.getElementById('escResult');
    if (resultContainer) {
        resultContainer.style.display = 'block';
        resultContainer.classList.add('active');
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============================================================
// ГЕНЕРАЦИЯ РЕЗУЛЬТАТА
// ============================================================

function generateEscResult() {
    console.log('🔄 Генерация результата для уровня:', escState.level);
    
    if (typeof mapsData === 'undefined' || mapsData.length === 0) {
        console.error('❌ mapsData не загружен!');
        return;
    }
    
    if (typeof trialsData === 'undefined' || Object.keys(trialsData).length === 0) {
        console.error('❌ trialsData не загружен!');
        return;
    }
    
    var selected = getMapAndTrial(escState.level);
    if (!selected) {
        console.error('❌ Не найдено подходящее испытание!');
        return;
    }
    
    var mapName = selected.mapName;
    var mapImage = selected.mapImage;
    var trial = selected.trial;
    
    escState.map = { name: mapName, image: mapImage };
    escState.trial = trial;
    
    var difficulty = getDifficultyByLevel(escState.level);
    escState.difficulty = difficulty.name;
    
    escState.variators = getVariatorsForLevel(escState.level, mapName, escState.playerCount);

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
        escState.variators,
        escState.level
    );

    prepareFullResult(mapName, mapImage, trial, difficulty);
}

// ============================================================
// ПОДГОТОВКА ПОЛНОГО РЕЗУЛЬТАТА
// ============================================================

function prepareFullResult(mapName, mapImage, trial, difficulty) {
    var resultContainer = document.getElementById('escResult');
    if (!resultContainer) return;
    
    resultContainer.style.display = 'none';
    resultContainer.classList.remove('active');

    var resultMap = document.getElementById('escResultMap');
    if (resultMap) {
        var trialImage = trial.image || mapImage;
        var trialNameUpper = trial.name.toUpperCase();
        var mapNameUpper = mapName.toUpperCase();
        
        resultMap.innerHTML = `
            <div class="result-map-row">
                <img class="map-image" src="${trialImage}" alt="${trial.name}" style="width:100%; max-width:200px; height:auto; object-fit:contain; border-radius:16px; border:2px solid rgba(220,90,50,0.3);" onerror="this.src='https://placehold.co/200x200/1a1a2e/e16d48?text=${encodeURIComponent(trial.name)}'">
                <div class="result-map-info" style="flex:1; min-width:200px;">
                    <div class="map-label" style="font-size:0.75rem; color:#888; text-transform:uppercase; letter-spacing:1px;"><i class="fas fa-map"></i> Карта</div>
                    <div class="trial-name" style="font-size:1.6rem; color:#e16d48; font-weight:900; margin:0.2rem 0 0.1rem; letter-spacing:1px;">${trialNameUpper}</div>
                    <div class="map-name" style="font-size:1.2rem; color:#ffbc9a; font-weight:300; margin-bottom:0.3rem; letter-spacing:2px; text-transform:uppercase;">${mapNameUpper}</div>
                    <div class="trial-desc" style="color:#c2b9d4; font-size:0.85rem; line-height:1.5;">${trial.desc}</div>
                    <div class="map-meta" style="display:flex; flex-wrap:wrap; gap:1rem; margin-top:0.8rem; padding-top:0.8rem; border-top:1px solid rgba(220,90,50,0.15);">
                        <span class="map-meta-item" style="font-size:0.8rem; color:#888;"><strong style="color:#ffbc9a;">№ Эскалационной терапии:</strong> #${escState.level}</span>
                        <span class="map-meta-item" style="font-size:0.8rem; color:#888;"><strong style="color:#ffbc9a;">Сложность:</strong> ${escState.difficulty}</span>
                        <span class="map-meta-item" style="font-size:0.8rem; color:#888;"><strong style="color:#ffbc9a;">Вариаторов:</strong> ${escState.variators.length}</span>
                    </div>
                </div>
            </div>
        `;
    }

    var resultVariators = document.getElementById('escResultVariators');
    if (resultVariators) {
        if (escState.variators.length === 0) {
            resultVariators.innerHTML = '<div style="color: #888; text-align: center; padding: 1rem;">Нет вариаторов</div>';
        } else {
            resultVariators.innerHTML = escState.variators.map(function(v) {
                var varNameUpper = v.name.toUpperCase();
                var fontSize = '0.75rem';
                if (v.name.length > 20) {
                    fontSize = '0.55rem';
                } else if (v.name.length > 14) {
                    fontSize = '0.6rem';
                } else if (v.name.length > 10) {
                    fontSize = '0.65rem';
                }
                return `
                    <div class="var-item" style="display:flex; flex-direction:column; align-items:center; gap:0.4rem; max-width:100px;">
                        <img src="${v.image}" alt="${v.name}" style="width:80px; height:80px; object-fit:contain; border-radius:14px; background:rgba(0,0,0,0.3); padding:6px; border:1px solid rgba(220,90,50,0.15);" onerror="this.src='https://placehold.co/80x80/1a1a2e/e16d48?text=?'">
                        <span style="font-size:${fontSize}; color:#ffbc9a; text-align:center; max-width:90px; line-height:1.3; font-weight:600; letter-spacing:0.3px; word-break:keep-all; overflow-wrap:normal; white-space:normal;">${varNameUpper}</span>
                    </div>
                `;
            }).join('');
        }
    }

    renderEscResultPlayers();
}

// ============================================================
// ОТРИСОВКА РЕЗУЛЬТАТА С ИНФОРМАЦИЕЙ О ИГРОКАХ
// ============================================================

function renderEscResultPlayers() {
    var container = document.getElementById('escResultPlayers');
    if (!container) return;
    container.innerHTML = '';
    
    var header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 16px;';
    header.innerHTML = `
        <div style="font-size: 0.9rem; font-weight: 600; color: #ffbc9a; letter-spacing: 1px;">
            <i class="fas fa-users" style="color: #e16d48; margin-right: 8px;"></i>
            Участники
        </div>
    `;
    container.appendChild(header);
    
    escState.players.forEach(function(player, idx) {
        var equip = escState.equipSelections[idx] || 'Не выбрано';
        var equipData = typeof equipmentData !== 'undefined' ? equipmentData.find(function(e) { return e.name === equip; }) : null;
        var allUsed = checkAllAmpsUsed(idx);
        
        var section = document.createElement('div');
        section.style.cssText = 'background: rgba(0,0,0,0.25); border-radius: 16px; border: 1px solid rgba(220,90,50,0.1); overflow: hidden; margin-bottom: 12px;';
        
        var playerNameFontSize = '1rem';
        if (player.length > 15) {
            playerNameFontSize = '0.8rem';
        } else if (player.length > 10) {
            playerNameFontSize = '0.85rem';
        }
        
        var toggleBtn = document.createElement('div');
        toggleBtn.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; cursor: pointer; transition: background 0.3s; background: rgba(0,0,0,0.15);';
        toggleBtn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex-shrink: 1;">
                <i class="fas fa-user" style="color: #e16d48; font-size: 1rem; flex-shrink: 0;"></i>
                <span style="font-weight: 700; color: #ffbc9a; font-size: ${playerNameFontSize}; letter-spacing: 0.5px; white-space: nowrap; flex-shrink: 1;">${player}</span>
                <span style="font-size: 0.65rem; color: #888; margin-left: 4px; background: rgba(0,0,0,0.3); padding: 2px 12px; border-radius: 12px; flex-shrink: 0;">
                    ${allUsed ? '✅ Все амфы' : '⏳ В процессе'}
                </span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                ${equipData ? `<img src="${equipData.image}" alt="${equip}" style="width:32px; height:32px; object-fit:contain; border-radius:8px; background:rgba(0,0,0,0.3); padding:3px; flex-shrink:0;" onerror="this.style.display='none'">` : ''}
                <span style="font-size: 0.8rem; color: #ffbc9a; font-weight: 500; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 1;">${equip}</span>
                <i class="fas fa-chevron-down" style="color: #888; font-size: 0.9rem; transition: transform 0.3s; flex-shrink: 0;"></i>
            </div>
        `;
        section.appendChild(toggleBtn);
        
        var content = document.createElement('div');
        content.style.cssText = 'padding: 0 20px; max-height: 0; overflow: hidden; transition: max-height 0.4s ease, padding 0.3s ease;';
        content.id = 'resultContent_' + idx;
        section.appendChild(content);
        
        var innerContent = document.createElement('div');
        innerContent.style.cssText = 'padding: 6px 0 16px 0;';
        
        var equipBlock = document.createElement('div');
        equipBlock.style.cssText = 'display: flex; align-items: center; gap: 14px; padding: 10px 14px; background: rgba(255,255,255,0.04); border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.05);';
        equipBlock.innerHTML = `
            ${equipData ? `<img src="${equipData.image}" alt="${equip}" style="width:48px; height:48px; object-fit:contain; border-radius:10px; background:rgba(0,0,0,0.3); padding:5px;" onerror="this.style.display='none'">` : ''}
            <div>
                <div style="font-size: 0.6rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Снаряжение</div>
                <div style="font-size: 1rem; color: #ffbc9a; font-weight: 600;">${equip}</div>
            </div>
        `;
        innerContent.appendChild(equipBlock);
        
        var ampsLabel = document.createElement('div');
        ampsLabel.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 0 4px;';
        ampsLabel.innerHTML = `
            <span style="font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                <i class="fas fa-capsules" style="color: #e16d48; margin-right: 6px;"></i>
                Улучшения
            </span>
            ${!allUsed ? '<span style="font-size: 0.6rem; color: #e16d48; font-weight: 500;">Нажмите на категорию для смены</span>' : '<span style="font-size: 0.6rem; color: #2ecc71; font-weight: 500;"><i class="fas fa-check-circle"></i> Все применены</span>'}
        `;
        innerContent.appendChild(ampsLabel);
        
        var ampsGrid = document.createElement('div');
        ampsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;';
        
        ampCategories.forEach(function(category) {
            var ampName = getAmpForCategory(idx, category);
            var ampData = typeof ampsData !== 'undefined' ? ampsData.find(function(a) { return a.name === ampName; }) : null;
            var isComplete = isCategoryComplete(idx, category);
            
            var block = document.createElement('div');
            block.style.cssText = 'background: rgba(255,255,255,0.04); border-radius: 12px; padding: 10px 12px; text-align: center; cursor: pointer; transition: all 0.3s; border: 1px solid rgba(255,255,255,0.06);';
            if (!allUsed) {
                block.onclick = function() { openAmpModal(idx, category); };
                block.onmouseover = function() { this.style.borderColor = 'rgba(220,90,50,0.3)'; this.style.background = 'rgba(255,255,255,0.07)'; };
                block.onmouseout = function() { this.style.borderColor = 'rgba(255,255,255,0.06)'; this.style.background = 'rgba(255,255,255,0.04)'; };
            }
            
            var categoryName = document.createElement('div');
            categoryName.style.cssText = 'font-size: 0.55rem; color: #e16d48; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; margin-bottom: 4px;';
            categoryName.textContent = category;
            block.appendChild(categoryName);
            
            if (isComplete) {
                var complete = document.createElement('div');
                complete.style.cssText = 'font-size: 0.5rem; color: #2ecc71; font-weight: 500;';
                complete.innerHTML = '<i class="fas fa-check-circle"></i> Все';
                block.appendChild(complete);
            } else if (ampData) {
                var ampNameEl = document.createElement('div');
                ampNameEl.style.cssText = 'font-size: 0.75rem; color: #ffbc9a; font-weight: 600; line-height: 1.2;';
                ampNameEl.textContent = ampData.name;
                block.appendChild(ampNameEl);
                
                var ampCat = document.createElement('div');
                ampCat.style.cssText = 'font-size: 0.45rem; color: #666; margin-top: 2px;';
                ampCat.textContent = ampData.category;
                block.appendChild(ampCat);
            } else {
                var empty = document.createElement('div');
                empty.style.cssText = 'font-size: 0.7rem; color: #555; font-weight: 500;';
                empty.textContent = 'Не выбрана';
                block.appendChild(empty);
            }
            
            ampsGrid.appendChild(block);
        });
        
        innerContent.appendChild(ampsGrid);
        content.appendChild(innerContent);
        container.appendChild(section);
        
        function toggleResultContent(idx) {
            var contentEl = document.getElementById('resultContent_' + idx);
            var sectionEl = contentEl.closest('div');
            var chevron = sectionEl.querySelector('.fa-chevron-down');
            if (contentEl.style.maxHeight === '0px' || contentEl.style.maxHeight === '') {
                contentEl.style.maxHeight = contentEl.scrollHeight + 30 + 'px';
                contentEl.style.padding = '0 20px 20px 20px';
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            } else {
                contentEl.style.maxHeight = '0px';
                contentEl.style.padding = '0 20px';
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            }
        }
        
        toggleBtn.onclick = function() { toggleResultContent(idx); };
        
        var hasSelections = false;
        for (var c = 0; c < ampCategories.length; c++) {
            if (getAmpForCategory(idx, ampCategories[c])) {
                hasSelections = true;
                break;
            }
        }
        if (hasSelections || allUsed) {
            setTimeout(function() {
                var contentEl = document.getElementById('resultContent_' + idx);
                var sectionEl = contentEl.closest('div');
                var chevron = sectionEl.querySelector('.fa-chevron-down');
                contentEl.style.maxHeight = contentEl.scrollHeight + 30 + 'px';
                contentEl.style.padding = '0 20px 20px 20px';
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }, 100);
        }
    });
}

// ============================================================
// МОДАЛЬНОЕ ОКНО ДЛЯ СМЕНЫ АМФЫ
// ============================================================

var modalState = {
    playerIndex: null,
    selectedAmp: null,
    selectedCategory: "Инструмент"
};

function initAmpModal() {
    var modal = document.getElementById('ampModal');
    var closeBtn = document.getElementById('ampModalClose');
    var confirmBtn = document.getElementById('ampModalConfirm');

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
        });
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (modalState.playerIndex !== null && modalState.selectedAmp && modalState.selectedCategory) {
                var idx = modalState.playerIndex;
                var category = modalState.selectedCategory;
                
                var currentAmps = escState.ampSelections[idx] || {};
                var oldAmp = currentAmps[category];
                
                if (oldAmp === modalState.selectedAmp) {
                    if (modal) {
                        modal.classList.remove('active');
                        modal.style.display = 'none';
                    }
                    return;
                }
                
                if (oldAmp && escState.usedAmps[idx]) {
                    escState.usedAmps[idx] = escState.usedAmps[idx].filter(function(a) { return a !== oldAmp; });
                }
                
                if (!escState.ampSelections[idx]) escState.ampSelections[idx] = {};
                escState.ampSelections[idx][category] = modalState.selectedAmp;
                
                if (!escState.usedAmps[idx]) escState.usedAmps[idx] = [];
                if (escState.usedAmps[idx].indexOf(modalState.selectedAmp) === -1) {
                    escState.usedAmps[idx].push(modalState.selectedAmp);
                }
                unlockAmpForPlayer(idx, modalState.selectedAmp);

                renderEscResultPlayers();
                
                if (modal) {
                    modal.classList.remove('active');
                    modal.style.display = 'none';
                }
            }
        });
    }
}

function openAmpModal(playerIndex, category) {
    if (checkAllAmpsUsed(playerIndex)) {
        alert('Все улучшения уже применены. Смена амф невозможна.');
        return;
    }

    if (isCategoryComplete(playerIndex, category)) {
        alert('Все амфы в этой категории уже использованы.');
        return;
    }

    var playerName = escState.players[playerIndex];
    var currentAmp = getAmpForCategory(playerIndex, category);
    
    modalState.playerIndex = playerIndex;
    modalState.selectedCategory = category;
    modalState.selectedAmp = currentAmp;

    var playerNameEl = document.getElementById('ampModalPlayerName');
    if (playerNameEl) {
        playerNameEl.textContent = playerName + ' — ' + category;
    }

    var tabsContainer = document.getElementById('ampCategoryTabs');
    if (tabsContainer) {
        tabsContainer.innerHTML = '';
        
        var availableCategories = ampCategories.filter(function(cat) {
            return !isCategoryComplete(playerIndex, cat);
        });
        
        if (availableCategories.length === 0) {
            var grid = document.getElementById('ampModalGrid');
            if (grid) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; color: #2ecc71; padding: 2rem;">
                        <i class="fas fa-check-circle" style="font-size: 2rem;"></i>
                        <div style="margin-top: 0.5rem;">Все улучшения применены</div>
                    </div>
                `;
            }
            var confirmBtn = document.getElementById('ampModalConfirm');
            if (confirmBtn) confirmBtn.disabled = true;
            var modal = document.getElementById('ampModal');
            if (modal) {
                modal.classList.add('active');
                modal.style.display = 'flex';
            }
            return;
        }

        availableCategories.forEach(function(cat) {
            var tab = document.createElement('button');
            tab.textContent = cat;
            tab.dataset.category = cat;
            if (cat === category) {
                tab.classList.add('active');
            }
            tab.addEventListener('click', function() {
                if (tabsContainer) {
                    tabsContainer.querySelectorAll('button').forEach(function(t) {
                        t.classList.remove('active');
                    });
                    this.classList.add('active');
                    var newCategory = this.dataset.category;
                    modalState.selectedCategory = newCategory;
                    modalState.selectedAmp = getAmpForCategory(playerIndex, newCategory);
                    renderAmpModalGrid(playerIndex, newCategory);
                }
            });
            tabsContainer.appendChild(tab);
        });
    }

    renderAmpModalGrid(playerIndex, category);
    var modal = document.getElementById('ampModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function renderAmpModalGrid(playerIndex, category) {
    var grid = document.getElementById('ampModalGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (typeof ampsData === 'undefined' || ampsData.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #e16d48; padding: 2rem;">Ошибка: данные амф не загружены</div>';
        return;
    }

    var categoryAmps = getAmpsByCategory(category);
    var used = escState.usedAmps[playerIndex] || [];
    var unlocked = escState.unlockedAmps[playerIndex] || [];
    var currentAmp = getAmpForCategory(playerIndex, category);

    var hasAvailable = false;

    categoryAmps.forEach(function(amp) {
        var isUsed = used.indexOf(amp.name) !== -1;
        var isUnlocked = unlocked.indexOf(amp.name) !== -1;
        var isCurrent = currentAmp === amp.name;
        
        var isAvailable = isUnlocked || isCurrent;

        var item = document.createElement('div');
        item.className = 'amp-modal-item';
        
        if (isCurrent) {
            item.classList.add('selected');
        }

        if (!isAvailable) {
            item.classList.add('locked');
            item.innerHTML = `
                <div class="lock-overlay">
                    <i class="fas fa-lock"></i>
                    <span>Засекречено</span>
                </div>
                <img src="${amp.image}" alt="${amp.name}" style="opacity: 0.3;" onerror="this.src='https://placehold.co/65x65/1a1a2e/e16d48?text=?'">
                <div class="amp-name">${amp.name}</div>
                <div class="amp-category-label">${amp.category}</div>
                <div class="amp-status locked">🔒 Засекречено</div>
            `;
        } else {
            hasAvailable = true;
            item.innerHTML = `
                <img src="${amp.image}" alt="${amp.name}" onerror="this.src='https://placehold.co/65x65/1a1a2e/e16d48?text=?'">
                <div class="amp-name">${amp.name}</div>
                <div class="amp-category-label">${amp.category}</div>
                <div class="amp-status ${isCurrent ? 'current' : 'available'}">
                    ${isCurrent ? '✓ Текущая' : 'Доступна'}
                </div>
            `;
            item.addEventListener('click', function() {
                if (this.classList.contains('locked')) return;
                grid.querySelectorAll('.amp-modal-item').forEach(function(el) {
                    el.classList.remove('selected');
                });
                this.classList.add('selected');
                modalState.selectedAmp = amp.name;
                var confirmBtn = document.getElementById('ampModalConfirm');
                if (confirmBtn) confirmBtn.disabled = false;
            });
        }
        grid.appendChild(item);
    });

    if (!hasAvailable) {
        var emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; color: #888; padding: 2rem;';
        emptyMsg.textContent = 'В этой категории нет доступных амф. Выберите другую категорию.';
        grid.appendChild(emptyMsg);
    }

    var confirmBtn = document.getElementById('ampModalConfirm');
    if (confirmBtn) confirmBtn.disabled = true;
}

// ============================================================
// ПЕРЕРЫВ (выбор амф)
// ============================================================

function showBreakModal() {
    var hasAvailable = false;
    escState.players.forEach(function(_, idx) {
        if (!areAllCategoriesComplete(idx)) {
            hasAvailable = true;
        }
    });

    if (!hasAvailable) {
        alert('Не осталось выбора улучшения. Все улучшения были применены.');
        generateEscResult();
        return;
    }

    var oldModal = document.getElementById('breakModal');
    if (oldModal) {
        oldModal.remove();
    }

    var overlay = document.createElement('div');
    overlay.className = 'amp-modal-overlay active';
    overlay.id = 'breakModal';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1500; overflow-y: auto; padding: 20px;';

    var modal = document.createElement('div');
    modal.className = 'amp-modal';
    modal.style.cssText = 'background: linear-gradient(145deg, #1a1a2e, #2a1a3e); border-radius: 24px; padding: 30px 35px; max-width: 900px; width: 100%; border: 1px solid rgba(220,90,50,0.3); box-shadow: 0 20px 60px rgba(0,0,0,0.8); max-height: 90vh; overflow-y: auto;';

    modal.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 0.8rem; color: #888; letter-spacing: 2px; text-transform: uppercase;"><i class="fas fa-coffee"></i> Перерыв</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #ffbc9a; margin-top: 2px;">Выбор АМФ</div>
            <div style="font-size: 0.85rem; color: #888; margin-top: 4px;">Каждому игроку нужно выбрать 1 амфу из доступной категории</div>
        </div>
        <div id="breakModalContent" style="display: grid; gap: 16px 24px; max-width: 700px; margin: 0 auto;"></div>
        <div style="text-align: center; margin-top: 20px;">
            <button id="breakModalConfirm" disabled style="padding: 12px 40px; border-radius: 30px; border: none; background: rgba(220,90,50,0.2); color: #888; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; letter-spacing: 1px;">Продолжить →</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var content = document.getElementById('breakModalContent');
    var breakSelections = {};
    
    var playerCount = escState.players.length;
    
    if (playerCount === 1) {
        content.style.gridTemplateColumns = '1fr';
        content.style.maxWidth = '350px';
    } else if (playerCount === 2) {
        content.style.gridTemplateColumns = '1fr 1fr';
        content.style.maxWidth = '550px';
    } else if (playerCount === 3) {
        content.style.gridTemplateColumns = '1fr 1fr';
        content.style.maxWidth = '550px';
    } else if (playerCount === 4) {
        content.style.gridTemplateColumns = '1fr 1fr';
        content.style.maxWidth = '600px';
    }

    escState.players.forEach(function(player, idx) {
        var section = document.createElement('div');
        section.className = 'player-block';
        section.style.cssText = 'background: rgba(0,0,0,0.2); border-radius: 16px; padding: 16px; border: 1px solid rgba(220,90,50,0.08);';
        
        var title = document.createElement('div');
        title.style.cssText = 'font-weight: 600; color: #ffbc9a; margin-bottom: 8px; text-align: center; font-size: 0.95rem; letter-spacing: 0.5px;';
        title.innerHTML = '<i class="fas fa-user" style="color: #e16d48; margin-right: 6px;"></i> ' + player;
        section.appendChild(title);

        if (areAllCategoriesComplete(idx)) {
            var completeMsg = document.createElement('div');
            completeMsg.style.cssText = 'text-align: center; color: #2ecc71; padding: 0.5rem; font-size: 0.85rem;';
            completeMsg.innerHTML = '<i class="fas fa-check-circle"></i> Все улучшения применены';
            section.appendChild(completeMsg);
            content.appendChild(section);
            
            if (playerCount === 3 && idx === 2) {
                section.style.gridColumn = '1 / -1';
                section.style.maxWidth = '60%';
                section.style.justifySelf = 'center';
                section.style.width = '100%';
            }
            
            breakSelections[idx] = null;
            return;
        }

        var availableCategories = ampCategories.filter(function(cat) {
            return !isCategoryComplete(idx, cat);
        });
        var randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        
        var availableAmps = getAvailableAmpsByCategory(idx, randomCategory);
        var shuffled = availableAmps.slice().sort(function() { return Math.random() - 0.5; });
        var displayAmps = shuffled.slice(0, 3);

        var catLabel = document.createElement('div');
        catLabel.style.cssText = 'text-align: center; color: #e16d48; font-size: 0.75rem; margin-bottom: 10px; font-weight: 500; letter-spacing: 0.5px;';
        catLabel.innerHTML = '<i class="fas fa-tag"></i> ' + randomCategory;
        section.appendChild(catLabel);

        var wrapper = document.createElement('div');
        wrapper.className = 'selection-wrapper';

        var grid = document.createElement('div');
        grid.className = 'selection-grid';
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;';

        breakSelections[idx] = null;

        if (displayAmps.length === 0) {
            for (var i = 0; i < 3; i++) {
                var emptyItem = document.createElement('div');
                emptyItem.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.05); opacity: 0.4;';
                emptyItem.innerHTML = `
                    <div style="font-size: 2rem; color: #555;">⛔</div>
                    <div style="font-size:0.6rem; color:#555;">ПУСТО</div>
                `;
                grid.appendChild(emptyItem);
            }
            breakSelections[idx] = 'skip';
        } else {
            displayAmps.forEach(function(amp) {
                var item = document.createElement('div');
                item.className = 'selection-item';
                item.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 2px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.3s ease; position: relative;';
                item.innerHTML = `
                    <img src="${amp.image}" alt="${amp.name}" onerror="this.src='https://placehold.co/80x80/1a1a2e/e16d48?text=?'" style="width:80px; height:80px; object-fit:contain; border-radius:10px; background:rgba(0,0,0,0.3); padding:4px;">
                    <div style="font-size:0.65rem; color:#c2b9d4; text-align:center; font-weight:500; line-height:1.2;">${amp.name}</div>
                    <div style="font-size:0.5rem; color:#666;">${amp.category}</div>
                `;
                item.addEventListener('click', function() {
                    grid.querySelectorAll('.selection-item').forEach(function(el) {
                        el.style.borderColor = 'rgba(255,255,255,0.06)';
                        el.style.background = 'rgba(255,255,255,0.03)';
                    });
                    this.style.borderColor = '#e16d48';
                    this.style.background = 'rgba(220,90,50,0.1)';
                    breakSelections[idx] = amp.name;
                    unlockAmpForPlayer(idx, amp.name);
                    checkBreakReady();
                });
                grid.appendChild(item);
            });
            
            if (displayAmps.length < 3) {
                for (var j = displayAmps.length; j < 3; j++) {
                    var emptyItem = document.createElement('div');
                    emptyItem.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.05); opacity: 0.4;';
                    emptyItem.innerHTML = `
                        <div style="font-size: 2rem; color: #555;">⛔</div>
                        <div style="font-size:0.6rem; color:#555;">ПУСТО</div>
                    `;
                    grid.appendChild(emptyItem);
                }
            }
        }

        wrapper.appendChild(grid);
        section.appendChild(wrapper);
        content.appendChild(section);
        
        if (playerCount === 3 && idx === 2) {
            section.style.gridColumn = '1 / -1';
            section.style.maxWidth = '60%';
            section.style.justifySelf = 'center';
            section.style.width = '100%';
        }
    });

    function checkBreakReady() {
        var ready = true;
        escState.players.forEach(function(_, idx) {
            if (!areAllCategoriesComplete(idx) && !breakSelections[idx]) {
                ready = false;
            }
        });
        var confirmBtn = document.getElementById('breakModalConfirm');
        if (confirmBtn) {
            confirmBtn.disabled = !ready;
            if (ready) {
                confirmBtn.style.background = 'linear-gradient(135deg, #e16d48, #c0392b)';
                confirmBtn.style.color = '#fff';
                confirmBtn.style.cursor = 'pointer';
            } else {
                confirmBtn.style.background = 'rgba(220,90,50,0.2)';
                confirmBtn.style.color = '#888';
                confirmBtn.style.cursor = 'default';
            }
        }
    }
    checkBreakReady();

    var confirmBtn = document.getElementById('breakModalConfirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (this.disabled) return;
            escState.players.forEach(function(_, idx) {
                if (breakSelections[idx] && breakSelections[idx] !== 'skip') {
                    var category = ampCategories.find(function(cat) {
                        var amp = ampsData.find(function(a) { return a.name === breakSelections[idx]; });
                        return amp && amp.category === cat;
                    });
                    if (category) {
                        if (!escState.ampSelections[idx]) escState.ampSelections[idx] = {};
                        escState.ampSelections[idx][category] = breakSelections[idx];
                        
                        if (!escState.usedAmps[idx]) escState.usedAmps[idx] = [];
                        if (escState.usedAmps[idx].indexOf(breakSelections[idx]) === -1) {
                            escState.usedAmps[idx].push(breakSelections[idx]);
                        }
                        unlockAmpForPlayer(idx, breakSelections[idx]);
                    }
                }
            });
            overlay.remove();
            generateEscResult();
        });
    }
}

// ============================================================
// СБРОС ЭСКАЛАЦИИ
// ============================================================

function resetEscalation() {
    escState = {
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
        nostophobiaCount: 0
    };
    
    var buttons = document.querySelectorAll('#escPlayerCountOptions .player-count-btn');
    buttons.forEach(function(b) { b.classList.remove('selected'); });
    
    var step1Next = document.getElementById('escStep1Next');
    if (step1Next) step1Next.disabled = true;
    
    var result = document.getElementById('escResult');
    if (result) {
        result.classList.remove('active');
        result.style.display = 'none';
    }
    
    updateLevelCounter();
    goToEscStep(1);
    
    var modal = document.getElementById('ampModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ МОДАЛЬНЫХ ОКОН
// ============================================================

function initConfirmModal() {
    var cancelBtn = document.getElementById('confirmCancel');
    var exitBtn = document.getElementById('confirmExit');
    var modal = document.getElementById('confirmModal');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (modal) modal.classList.remove('active');
        });
    }

    if (exitBtn) {
        exitBtn.addEventListener('click', function() {
            if (modal) modal.classList.remove('active');
            resetEscalation();
        });
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }
}

// ============================================================
// ЗАПУСК ЭСКАЛАЦИИ
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Запуск эскалации...');
    
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
            
            initEscalation();
            initAmpModal();
            initConfirmModal();
            updateLevelCounter();
            
            console.log('✅ Эскалация инициализирована!');
        }, 500);
    }
});
