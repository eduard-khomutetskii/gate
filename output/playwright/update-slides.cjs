const fs = require('fs');
const path = 'trip-stages.html';
let html = fs.readFileSync(path, 'utf8');
const visualStart = html.indexOf('          <div class="trip-stages__visual"');
const navStart = html.indexOf('          <nav class="trip-stages__pagination"');
const phone = html.slice(visualStart, navStart).trim();
const buttonStart = html.indexOf('          <a class="trip-stages__demo"');
const button = html.slice(buttonStart, visualStart).trim();
const icon = (name) => `<span class="trip-stages__art-icon"><img src="assets/images/trip-stages/${name}.svg" alt=""></span>`;
const art = [
  phone,
  `<div class="trip-stages__art trip-stages__art--employees" aria-hidden="true"><div class="trip-stages__panel">${icon('employees')}<h4>Ваша команда</h4><div class="trip-stages__panel-toolbar">Сотрудники <span>+ Пригласить</span></div><div class="trip-stages__person"><i>АК</i><div>Анна Ковалёва<small>Администратор</small></div><b>Полный доступ</b></div><div class="trip-stages__person"><i>МС</i><div>Михаил Смирнов<small>Менеджер</small></div><b>Согласование</b></div><div class="trip-stages__person"><i>ЕИ</i><div>Елена Иванова<small>Сотрудник</small></div><b>Бронирование</b></div><div class="trip-stages__panel-foot">Роли и права доступа <span>✓ Настроены</span></div></div><div class="trip-stages__float">✓ Приглашение отправлено</div></div>`,
  `<div class="trip-stages__art trip-stages__art--policy" aria-hidden="true"><div class="trip-stages__panel">${icon('policy')}<h4>Тревел-политика</h4><div class="trip-stages__rule"><span>Авиабилеты</span><strong>Эконом</strong></div><div class="trip-stages__rule"><span>Проживание</span><strong>до 8 000 ₽ / ночь</strong></div><div class="trip-stages__rule"><span>Лимит командировки</span><strong>50 000 ₽</strong></div><div class="trip-stages__approval"><i>✓</i><span>Сотрудник</span><em>↓</em><i>✓</i><span>Руководитель</span><em>↓</em><i>✓</i><span>Командировка согласована</span></div></div><div class="trip-stages__float">Всё в рамках бюджета</div></div>`,
  `<div class="trip-stages__art trip-stages__art--payment" aria-hidden="true"><div class="trip-stages__bank-card"><img src="assets/images/trip-stages/imgGateLight.svg" alt=""><span>Командировки без пауз</span><strong>Постоплата</strong><b>до 30 дней</b><small>GATE · БИЗНЕС</small></div><div class="trip-stages__payment-methods">${icon('payment')}<h4>Удобный способ оплаты</h4><div>Расчётный счёт <span>✓</span></div><div>Банковская карта <span>✓</span></div><div>QR-код <span>✓</span></div></div></div>`,
  `<div class="trip-stages__art trip-stages__art--documents" aria-hidden="true"><div class="trip-stages__document trip-stages__document--back">${icon('documents')}<h4>УПД № 2</h4><div>Авиабилеты <b>8 500 ₽</b></div><div>Аэроэкспресс <b>3 200 ₽</b></div><strong>Итого <b>11 700 ₽</b></strong><span class="trip-stages__stamp">ЭДО<br>Подписано ✓</span></div><div class="trip-stages__document trip-stages__document--front"><img class="trip-stages__doc-logo" src="assets/images/logo.svg" alt=""><h4>УПД № 3</h4><div>Проживание <b>9 800 ₽</b></div><strong>Итого <b>9 800 ₽</b></strong><span class="trip-stages__stamp">Контур.Диадок<br>Подписано ✓</span></div><div class="trip-stages__float">1С + ЭДО · Данные переданы ✓</div></div>`,
  `<div class="trip-stages__art trip-stages__art--analytics" aria-hidden="true"><div class="trip-stages__panel">${icon('analytics')}<h4>Расходы под контролем</h4><div class="trip-stages__metric"><span>Бюджет командировок</span><strong>1 240 000 ₽</strong><small>Все подразделения · Этот год</small></div><div class="trip-stages__chart"><i style="--bar:42%"></i><i style="--bar:63%"></i><i style="--bar:51%"></i><i style="--bar:78%"></i><i style="--bar:66%"></i><i style="--bar:92%"></i></div><div class="trip-stages__chart-labels"><span>Янв</span><span>Фев</span><span>Мар</span><span>Апр</span><span>Май</span><span>Июн</span></div><div class="trip-stages__panel-foot">Экономия бюджета <span>18% ↗</span></div></div><div class="trip-stages__float">Отчёт готов к выгрузке ✓</div></div>`
];
// Every article owns its copy, action and illustration, so the timeline animates them together.
html = html.slice(0, buttonStart) + html.slice(navStart);
let index = 0;
html = html.replace(/(<article class="trip-stages__slide"[^>]*>)([\s\S]*?)(\s*<\/article>)/g, (_, open, copy, close) => `${open}\n              <div class="trip-stages__copy">${copy.trim()}\n${button}</div>\n${art[index++]}${close}`);
if (index !== 6) throw new Error('Expected six slides');
fs.writeFileSync(path, html);
