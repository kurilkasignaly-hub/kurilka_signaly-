// ===== ВСЕ ВАРИАТОРЫ ДЛЯ ЭСКАЛАЦИИ С КАТЕГОРИЯМИ =====
const allVariatorsData = [
    // ===== ОСОБЫЕ СОБЫТИЯ =====
    { name: "Сильнее Вместе", image: "images/вариатор-сильнее-вместе.webp", category: "special" },
    { name: "Ностофобия", image: "images/вариатор-ностофобия.webp", category: "special" },
    { name: "Токсический Шок", image: "images/вариатор-токсический-шок.webp", category: "special" },
    { name: "Глубокий Ожог", image: "images/вариатор-глубокий-ожог.webp", category: "special" },
    { name: "Таймер Бомбы", image: "images/вариатор-таймербомбы.webp", category: "special" },
    { name: "Резкое Похолодание", image: "images/вариатор-резкое-похолодание.webp", category: "special" },
    { name: "Вечная Мерзлота", image: "images/вариатор-вечная-мерзлота.webp", category: "special" },
    { name: "Самое Главное", image: "images/вариатор-самое-главное.webp", category: "special" },
    { name: "Главная Рулетка", image: "images/вариатор-главная-рулетка.webp", category: "special" },
    
    // ===== БОССЫ =====
    { name: "Лиланд Койл", image: "images/вариатор-лиланд-койл.webp", category: "boss" },
    { name: "Матушка Гуссбери", image: "images/вариатор-матушка-гуссбери.webp", category: "boss" },
    { name: "Франко Барби", image: "images/вариатор-франко-барби.webp", category: "boss" },
    { name: "Близнецы Кресс", image: "images/вариатор-близнецы-кресс.webp", category: "boss" },
    { name: "Лилия Богомолова", image: "images/вариатор-лилия-богомолова.webp", category: "boss" },
    
    // ===== ПОБОЧНЫЕ ЗАДАНИЯ (СБОР) =====
    { name: "Сбор Подарков", image: "images/вариатор-сбор-подарков.webp", category: "collection" },
    { name: "Сбор Крыс", image: "images/вариатор-сбор-крыс.webp", category: "collection" },
    { name: "Сбор Амулетов", image: "images/вариатор-сбор-амулетов.webp", category: "collection" },
    { name: "Доставьте Компоненты", image: "images/вариатор-доставьте-компоненты.webp", category: "collection" },
    { name: "Извлеките Образцы Органов", image: "images/вариатор-образцы-органов.webp", category: "collection" },
    { name: "Разбейте Телевизоры", image: "images/вариатор-разбивайте-телевизоры.webp", category: "collection" },
    { name: "Находите Радиопередатчики", image: "images/вариатор-радиопередатчики.webp", category: "collection" },
    { name: "Собирайте Схемы", image: "images/вариатор-схемы.webp", category: "collection" },
    { name: "Найдите Трансляцию", image: "images/вариатор-трансляция.webp", category: "collection" },
    { name: "Соберите Коробки С Уликами", image: "images/вариатор-улики.webp", category: "collection" },
    { name: "Расшифруйте Вещание", image: "images/вариатор-вещание.webp", category: "collection" },
    { name: "Потушите Огонь", image: "images/вариатор-потушите-огонь.webp", category: "collection" },
    { name: "Соберите плакаты", image: "images/вариатор-соберите-плакаты.webp", category: "collection" },
    { name: "Экстракция крови", image: "images/вариатор-экстракция-крови.webp", category: "collection" },
    
    // ===== СПЕЦИАЛЬНЫЕ ПОБОЧНЫЕ ЗАДАНИЯ =====
    // Эти вариаторы блокируют все остальные из категории collection
    { name: "Случайное Побочное Задание", image: "images/вариатор-случайное-побочное-задание.webp", category: "collection_special" },
    { name: "Двойные задания", image: "images/вариатор-д-задания.webp", category: "collection_special" },
    { name: "Обязательное Побочное Задание", image: "images/вариатор-обязательное-задание.webp", category: "collection_special" },

    // ===== НАБОРЫ (УГРОЗЫ) =====
    { name: "Повышенная Угроза", image: "images/вариатор-повышенная-угроза.webp", category: "threat" },
    { name: "Повышенная Угроза II", image: "images/вариатор-повышенная-угроза-2.webp", category: "threat" },
    { name: "Ненадежные Двери", image: "images/вариатор-ненадежные-двери.webp", category: "doors" },
    { name: "Психохирургия", image: "images/вариатор-психохирургия.webp", category: "psycho" },
    
    // ===== ЭКС-ПОПЫ =====
    { name: "Низкая Плотность Врагов", image: "images/вариатор-низкая-плотность-врагов.webp", category: "enemies" },
    { name: "Много Противников", image: "images/вариатор-много-противников.webp", category: "enemies" },
    { name: "Больше Толкачей", image: "images/вариатор-больше-толкачей.webp", category: "hunters" },
    { name: "Больше Притворщиков", image: "images/вариатор-больше-притворщиков.webp", category: "hunters" },
    { name: "Больше Бросателей", image: "images/вариатор-больше-бросателей.webp", category: "hunters" },
    { name: "Егерь", image: "images/вариатор-егерь.webp", category: "hunters" },
    
    // ===== ИСТОЧНИКИ УРОНА =====
    { name: "Враги Сильнее", image: "images/вариатор-враги-сильнее.webp", category: "damage" },
    { name: "Враги Сильнее II", image: "images/вариатор-враги-сильнее-2.webp", category: "damage" },
    { name: "Разъяренные Враги", image: "images/вариатор-разъяренные-враги.webp", category: "damage" },
    { name: "Кровотечение", image: "images/вариатор-кровотечение.webp", category: "damage" },
    { name: "Постоянный Урон", image: "images/вариатор-постоянный-урон.webp", category: "damage" },
    { name: "Смертельный Главный Актив", image: "images/вариатор-смертельный-главный-актив.webp", category: "damage" },
    
    // ===== МОДИФИКАТОРЫ РЕАГЕНТОВ =====
    { name: "Первый Уровень", image: "images/вариатор-первый-уровень.webp", category: "reagent" },
    { name: "Сломанный Реагент", image: "images/вариатор-сломанный-реагент.webp", category: "reagent" },
    { name: "Без Рецептов", image: "images/вариатор-без-рецептов.webp", category: "reagent" },
    { name: "Без Амф", image: "images/вариатор-без амф.webp", category: "reagent" },
    { name: "Без Снаряжения", image: "images/вариатор-без снаряжения.webp", category: "reagent" },
    { name: "Без Улучшения Снаряжения", image: "images/вариатор-без-улучшения-снаряжения.webp", category: "reagent" },
    { name: "Увеличенная Перезарядка Снаряжения", image: "images/вариатор-перезарядка-снаряжения.webp", category: "reagent" },
    { name: "Ограниченное Снаряжение", image: "images/вариатор-ограниченное-снаряжение.webp", category: "reagent" },
    { name: "Урон Перезапускает Снаряжение", image: "images/вариатор-урон-п-снаряжения.webp", category: "reagent" },
    { name: "Урон Отключает Снаряжение", image: "images/вариатор-урон-о-снаряжение.webp", category: "reagent" },
    { name: "Трофейное Снаряжение", image: "images/вариатор-трофейное-снаряжение.webp", category: "reagent" },
    
    // ===== ПРЕДМЕТЫ И ИНВЕНТАРЬ =====
    { name: "Ограниченные Предметы", image: "images/вариатор-ограниченные-предметы.webp", category: "items" },
    { name: "Ограниченные Предметы II", image: "images/вариатор-ограниченные-предметы-2.webp", category: "items" },
    { name: "Без Медицинских Предметов", image: "images/вариатор без медецинских.webp", category: "items" },
    { name: "Без Технических Предметов", image: "images/вариатор-без-технических-предметов.webp", category: "items" },
    { name: "Без Предметов В Испытании", image: "images/вариатор-без-предметов.webp", category: "items" },
    { name: "Закрытые Предметы", image: "images/вариатор-закрытые-предметы.webp", category: "items" },
    { name: "Только Предметы Для Бросания", image: "images/вариатор-предметы-для-бросания.webp", category: "items" },
    { name: "Ограниченный Инвентарь", image: "images/вариатор-ограниченный-инвентарь.webp", category: "items" },
    { name: "Ограниченный Инвентарь II", image: "images/вариатор-ограниченный-инвентарь-2.webp", category: "items" },
    
    // ===== ЛОВУШКИ =====
    { name: "Больше Ловушек", image: "images/вариатор-больше-ловушек.webp", category: "traps" },
    { name: "Больше Ловушек II", image: "images/вариатор-больше-ловушек-2.webp", category: "traps" },
    { name: "Смертельные Ловушки", image: "images/вариатор-смертельные-ловушки.webp", category: "traps" },
    { name: "Больше Мин Психоза", image: "images/вариатор-мины-психоза.webp", category: "traps" },
    { name: "Больше Звуковых Ловушек", image: "images/вариатор-звуковые-ловушки.webp", category: "traps" },
    { name: "Дополнительные Ловушки Главного Актива", image: "images/вариатор-ловушки-главного-актива.webp", category: "traps" },
    { name: "Тошнотные Ловушки", image: "images/вариатор-тошнотные-ловушки.webp", category: "traps" },
    { name: "Больше Дверных Ловушек", image: "images/вариатор-дверные-ловушки.webp", category: "traps" },
    { name: "Взрывчатка", image: "images/вариатор-взрывчатка.webp", category: "traps" },
    { name: "Ледяные Мины", image: "images/вариатор-ледяные-мины.webp", category: "traps" },
    { name: "Огненные Мины", image: "images/вариатор-огненные-мины.webp", category: "traps" },
    { name: "Острое Стекло", image: "images/вариатор-острое-стекло.webp", category: "traps" },
    { name: "Опасные Трубы", image: "images/вариатор-опасные-трубы.webp", category: "traps" },
    { name: "Огнеметы", image: "images/вариатор-огнеметы.webp", category: "traps" },
    
    // ===== ПСИХОЗ =====
    { name: "Бэд Трип", image: "images/вариатор-бэд-трип.webp", category: "psychosis" },
    { name: "Бэд Трип II", image: "images/вариатор-бэд-трип-2.webp", category: "psychosis" },
    { name: "Галлюцинации", image: "images/вариатор-галлюцинации.webp", category: "psychosis" },
    { name: "Урон С Психозом", image: "images/вариатор-урон-с-психозом.webp", category: "psychosis" },
    { name: "Экстремальный Психоз", image: "images/вариатор-экстремальный-психоз.webp", category: "psychosis" },
    
    // ===== ПРЕПЯТСТВИЯ =====
    { name: "Заблокированные Проходы", image: "images/вариатор-заблокированные-проходы.webp", category: "obstacles" },
    { name: "Запертые Двери", image: "images/вариатор-запертые-двери.webp", category: "obstacles" },
    { name: "Забитые Двери", image: "images/вариатор-забитые-двери.webp", category: "obstacles" },
    { name: "Заблокированные Двери", image: "images/вариатор-заблокированные-двери.webp", category: "obstacles" },
    { name: "Закрытые Откатные Ворота", image: "images/вариатор-закрытые-откатные-ворота.webp", category: "obstacles" },
    
    // ===== ОТКАТНЫЕ ВОРОТА =====
    { name: "Ворота С Детектором Звука", image: "images/вариатор-ворота-детектор-звука.webp", category: "gates" },
    { name: "Дистанционные Ворота", image: "images/вариатор-дистанционные-ворота.webp", category: "gates" },
    { name: "Бесконтактные Ворота", image: "images/вариатор-бесконтактные-ворота.webp", category: "gates" },
    { name: "Времянные Ворота", image: "images/вариатор-времянные-ворота.webp", category: "gates" },
    { name: "Закрытые Ворота", image: "images/вариатор-закрытые-ворота.webp", category: "gates" },
    
    // ===== ДРУГИЕ =====
    { name: "Ограниченные Укрытия", image: "images/вариатор-ограниченные-укрытия.webp", category: "other" },
    { name: "Ограниченные Укрытия II", image: "images/вариатор-ограниченные-укрытия-2.webp", category: "other" },
    { name: "Не Бегать", image: "images/вариатор-не бегать.webp", category: "other" },
    { name: "Без Рации", image: "images/вариатор-без-рации.webp", category: "other" },
    { name: "Без Оживлении", image: "images/вариатор-без-оживлении.webp", category: "other" },
    { name: "Ограниченная Информация", image: "images/вариатор-ограниченная-информация.webp", category: "other" },
    { name: "Никакой Информации", image: "images/вариатор-никакой-информации.webp", category: "other" },
    { name: "Без Имён", image: "images/вариатор-без-имен.webp", category: "other" },
    { name: "Не Шумите", image: "images/вариатор-не шумите.webp", category: "other" },
    { name: "Нарушение Тишины", image: "images/вариатор-нарушение-тишины.webp", category: "other" },
    { name: "Все На Выход", image: "images/вариатор-все-на-выход.webp", category: "other" },
    { name: "Нехватка Здоровья", image: "images/вариатор-нехвадка-здоровья.webp", category: "other" },
    { name: "Камеры Наблюдения", image: "images/вариатор-камеры-наблюдения.webp", category: "other" }
];

// ============================================================
// КАТЕГОРИИ И ПРАВИЛА
// ============================================================

// Категории, которые не могут быть вместе
const exclusiveCategories = [
    'collection',      // Побочные задания (сбор крыс, схем и т.д.)
    'collection_special', // Специальные побочные задания (блокируют collection)
    'hunters',         // Толкачи/бросатели/притворщики/егерь
    'boss',            // Боссы
    'traps',           // Ловушки
    'psychosis',       // Психоз
    'obstacles',       // Препятствия
    'gates',           // Откатные ворота
    'reagent',         // Модификаторы реагентов
    'items',           // Предметы и инвентарь
    'damage'           // Источники урона
];

// Специальные категории, которые блокируют другие категории
const categoryBlockers = {
    'collection_special': ['collection'] // collection_special блокирует все collection
};

// Вариаторы, которые блокируются сломанным реагентом
const brokenReagentBlocked = [
    'Без Рецептов', 'Без Амф', 'Без Снаряжения', 'Увеличенная Перезарядка Снаряжения',
    'Урон Отключает Снаряжения', 'Без Улучшения Снаряжения', 'Урон Перезапускает Снаряжения',
    'Урон Отключает Снаряжение', 'Первый Уровень', 'Ностофобия'
];

// Вариаторы, которые блокируются ностофобией
const nostophobiaBlocked = [
    'Без Рецептов', 'Без Амф', 'Без Снаряжения', 'Увеличенная Перезарядка Снаряжения',
    'Урон Отключает Снаряжения', 'Без Улучшения Снаряжения', 'Урон Перезапускает Снаряжения',
    'Урон Отключает Снаряжение', 'Первый Уровень', 'Сломанный Реагент'
];

// Ограничения боссов по картам
const bossMapRestrictions = {
    'Лиланд Койл': ['Полицейский участок', 'Здание суда'],
    'Матушка Гуссбери': ['Парк развлечений', 'Детский дом', 'Фабрика игрушек'],
    'Франко Барби': ['Пристань', 'Центр города', 'Пригород'],
    'Близнецы Кресс': ['Торговый центр', 'Телестудия'],
    'Лилия Богомолова': ['Курорт']
};

// Вариаторы, которые блокируются глубоким ожогом
const deepBurnBlocked = ['Больше Толкачей', 'Егерь', 'Больше Притворщиков'];

// Вариаторы, которые блокируются сильнее вместе (для одиночной игры)
const togetherBlocked = ['Сильнее Вместе'];
