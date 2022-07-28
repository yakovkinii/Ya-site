var js1Days = document.querySelector(".js1 .js-days");
var js1Hours = document.querySelector(".js1 .js-hours");

var eNewTaskCaption = document.querySelector(".js2 .js-caption");
var eNewTaskSubtasks = document.querySelector(".js2 .js-subtasks");
var eNewTaskTime = document.querySelector(".js2 .js-time");
var eNewTaskSubmit = document.querySelector(".js2 .js-submit");

var eTasksToday = document.querySelector(".js3");


var todayDate = new Date(); // current date and time
var todayStartDate = new Date(); // today day start for date comparison
todayStartDate.setHours(0, 0, 0, 0);
var todayMonthDay = todayDate.getDate();

var selectedDayDate = new Date();
selectedDayDate.setHours(0, 0, 0, 0);
var selectedMonthDay = selectedDayDate.getDate();

const SELECTED_HOUR_NONE = -1; //none deprecated
const SELECTED_HOUR_TODAY = -2;
var selectedHour = SELECTED_HOUR_TODAY;

var minhour = 10;
var maxhour = 23;

const STATUS_NONE = 0;
const STATUS_SELECTING_HOURS = 1;
var curr_status = STATUS_NONE;

var tasks = [];
var tasksSorted = [];


// Render:

function drawDays() {
    js1Days.innerHTML = "";

    let before = 4; // show days before selected
    let after = 4; // show days before selected

    let date = new Date(); // temp
    let startMonthDay = (new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)).getDay(); // to determine weekday from monthday

    for (let i = -before; i < after + 1; i++) {
        let day = i + selectedMonthDay;

        let weekday = i - startMonthDay;
        while (weekday < 0) {
            weekday = weekday + 7;
        }
        weekday = weekday % 7;

        date.setDate(day);
        date.setHours(0, 0, 0, 0);

        let dayClass = 'day';
        if (date.getTime() < todayStartDate.getTime()) {
            dayClass += ' daypast';
        }
        if (date.getTime() === todayStartDate.getTime()) {
            dayClass += ' daycurrent';
        }
        if (date.getTime() === selectedDayDate.getTime()) {
            dayClass += ' dayselected';
        }
        let date1=new Date();
        date1.setDate(day);

        js1Days.innerHTML += `<div class='${dayClass}' onclick='changeSelectedDay(${day});'>${date1.getDate()}</div>`;
    }
}

function drawHours() {
    js1Hours.innerHTML = "";
    let html = '';
    let currentHour = currentTimeToHour();

    for (let i = minhour; i < maxhour; i++) {
        html += `<div class='number-cont fcc'>
        <div class='stick-spacer'></div>
        <div class='number'>${i}</div>
        </div>`;
        html += `<div class='block4 frc'>`;
        for (let j = 0; j < 4; j++) {
            num = i * 4 + j;
            past = false;
            let stickClass = 'stick taskDefault';
            if (selectedDayDate.getTime() === todayStartDate.getTime()) {
                if (num < currentHour) {
                    stickClass += " past";
                    past = true;
                }
            }
            if (selectedDayDate.getTime() < todayStartDate.getTime()) {
                stickClass += " past";
                past = true;
            }
            if (!past) {
                stickClass += " future";
            }
            if (selectedHour <= num && num < selectedHour + parseInt(eNewTaskTime.value)) {
                stickClass += " stickselected";
            }
            html += `<div class='${stickClass} js-stick${num}' onmousedown='changeSelectedHour(${num})'  onmousemove='changeDurationHour(${num})'></div>`;
        }
        html += `</div>`;
    }
    html += `<div class='number-cont fcc'>
    <div class='stick-spacer'></div>
    <div class='number'>${maxhour}</div>
    </div>`;

    js1Hours.innerHTML = html;
    for (let t of tasks) {
        if (t.deleted) {
            continue;
        }
        if (new Date(JSON.parse(t.date)).getTime() === selectedDayDate.getTime()) {
            if (t.hourStart === SELECTED_HOUR_TODAY) {
                continue;
            }
            for (let h = t.hourStart; h < t.hourEnd; h++) {
                if (t.completed) {
                    document.querySelector(`.js-stick${h}`).classList.add('taskCompleted');
                } else {
                    document.querySelector(`.js-stick${h}`).classList.add('taskScheduled');
                }
            }
        }
    }
    document.querySelector(".js1 .js-time").innerHTML = (new Date()).getHours() + `:` + (new Date()).getMinutes();
    document.querySelector(".js1 .js-date").innerHTML = `
    <div>${dayToString((new Date()).getDay())}</div>
    <div>${(new Date()).getDate()} ${monthToString((new Date()).getMonth())}</div>`;
}

function drawTasks() {
    eTasksToday.innerHTML = '';
    let html = `
    <div style="height:28px;">
    <div class="${selectedHour === SELECTED_HOUR_TODAY ? 'selected-today' : ''}"
    onclick="changeSelectedHour(SELECTED_HOUR_TODAY);" style='font-family:  Comic Sans MS;
    font-size: large;'>TODAY</div>
    </div>
    `;

    for (let task of tasksSorted) {
        if (task.deleted) {
            continue;
        }
        if (new Date(JSON.parse(task.date)).getTime() === selectedDayDate.getTime()) {
            html += parseTask(task);
        }
    }
    eTasksToday.innerHTML = html;
}

function toggleTaskMenu(id) {
    document.querySelector(`.js3 .js-task${id} .js-menu`).classList.toggle("hidden");
}

// Parse:

function parseTask(task) {
    let res = `
    <div class="fcc bor round2 task js-task${task.id}">
        <div class="frc" style="width:90%; justify-content: space-between;">
            <div class="caption${task.completed ? ' completed' : ''}" onclick="toggleTaskMenu(${task.id})" style="width:90%;">${task.caption}</div>
            <i class="fas fa-check${task.completed ? ' completed' : ''}" onclick="toggleTaskCompleted(${task.id})"></i>
        </div>
        <div class="frc bor2 hidden round js-menu" style="width:90%; padding:5px; justify-content: space-around;">
            <i class="fas fa-trash-alt" onclick="deleteTask(${task.id})"></i>
            <i class="far fa-edit"></i>
        </div>
        <div class="frc c1">`

    if (task.hourStart === SELECTED_HOUR_TODAY) {
        res += `
            <div class="fcc c3${task.completed ? ' completed' : ''}">
                <div style="font-size:small">Today</div>
            </div>
            `;
    } else {
        res += `
            <div class="fcc c3${task.completed ? ' completed' : ''}">
                <div> ${parseHours(task.hourStart)}</div>
                <div> ${parseHours(task.hourEnd)}</div>
            </div>
            `;
    }
    res += `
        </div>
    </div>
    `;
    return res;
}

function parseHours(hour) {
    let min = hour % 4 === 0 ? `00` : `${hour % 4 * 15}`;
    return `${Math.floor(hour / 4)}:${min}`;
}

function monthToString(month) {
    switch (month) {
        case 0:
            return "Jan";
        case 1:
            return "Feb";
        case 2:
            return "Mar";
        case 3:
            return "Apr";
        case 4:
            return "May";
        case 5:
            return "Jun";
        case 6:
            return "Jul";
        case 7:
            return "Aug";
        case 8:
            return "Sep";
        case 9:
            return "Oct";
        case 10:
            return "Nov";
        case 11:
            return "Dec";
        default:
            return "Unknown";
    }
}

function dayToString(day) {
    switch (day) {
        case 0:
            return "Sunday";
        case 1:
            return "Monday";
        case 2:
            return "Tuesday";
        case 3:
            return "Wednesday";
        case 4:
            return "Thirsday";
        case 5:
            return "Friday";
        case 6:
            return "Saturday";
        default:
            return "Unknown";
    }
}

// Mass task operations:

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
    let newtasks = JSON.parse(localStorage.getItem("tasks"));
    for (let t of newtasks) {
        if (t.caption.length != 0) {
            tasks.push(t);
        }
    }
    sortTasks();
}

function sortTasks() {
    tasksSorted = [...tasks];
    tasksSorted.sort(function (a, b) {
        let aDate = new Date(a.date);
        let bDate = new Date(b.date);
        if (aDate < bDate) return -1;
        if (aDate > bDate) return 1;
        if (a.hourStart < b.hourStart) return -1;
        if (a.hourStart > b.hourStart) return 1;
        if (a.hourEnd < b.hourEnd) return 1;
        if (a.hourEnd > b.hourEnd) return -1;
        return 0;
    });
}

function deleteCache() {
    tasks = [];
    sortTasks();
    saveTasks();
    drawDays();
    drawHours();
    drawTasks();
}

// Single task operations:

function deleteTask(id) {
    tasks[id].deleted = true;
    sortTasks();
    saveTasks();
    drawDays();
    drawHours();
    drawTasks();
}

function submitTask() {
    let task = {};
    task.caption = eNewTaskCaption.value;
    if (task.caption.length == 0) {
        return;
    }
    task.id = tasks.length;
    task.deleted = false;
    task.subtasks = [];
    task.date = JSON.stringify(selectedDayDate);
    task.hourStart = selectedHour === -1 ? "undefined" : selectedHour;
    task.hourEnd = selectedHour === -1 ? "undefined" : selectedHour + parseInt(eNewTaskTime.value);
    tasks.push(task);

    sortTasks();
    saveTasks();
    drawDays();
    drawHours();
    drawTasks();

    eNewTaskCaption.value = "";
    changeSelectedHour(SELECTED_HOUR_TODAY);
}

function toggleTaskCompleted(id) {
    if (tasks[id].completed) {
        tasks[id].completed = false;
    } else {
        tasks[id].completed = true;
    }
    saveTasks();
    drawDays();
    drawHours();
    drawTasks();
}

// onclick etc. :

function bodyMouseUp() {
    curr_status = STATUS_NONE;
}

function changeSelectedDay(day) {
    selectedDayDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), day);
    selectedDayDate.setHours(0, 0, 0, 0);
    selectedMonthDay = selectedDayDate.getDate();
    changeSelectedHour(SELECTED_HOUR_TODAY);
    drawDays();
    drawTasks();
    drawHours();
}

function changeSelectedHour(hour) {
    selectedHour = hour;

    if (hour === SELECTED_HOUR_TODAY) {
        eNewTaskTime.disabled = true;
    } else {
        eNewTaskTime.disabled = false;
        curr_status = STATUS_SELECTING_HOURS;
        eNewTaskTime.value = `${1}`;
    }

    drawHours();
    drawTasks();
}

function changeDurationHour(hour) {
    if (curr_status != STATUS_SELECTING_HOURS) {
        return;
    }
    if (hour >= selectedHour) {
        eNewTaskTime.value = `${hour - selectedHour + 1}`;
    }
    drawHours();
}

function currentTimeToHour() {
    let now = new Date();
    return now.getHours() * 4 + Math.floor(now.getMinutes() / 15);
}

function newTaskKeyPress(event) {
    if (event.keyCode == 13) {
        submitTask();
    }
}

function scrollToTop(elem){
    // elem.animate({scrollTop: '0px'}, 1000);
    // elem.scrollToTop=0;
    console.log(elem);
}

changeSelectedHour(SELECTED_HOUR_TODAY);
loadTasks();
drawDays();
drawHours();
drawTasks();

var intervalId = window.setInterval(function () {
    drawHours();
}, 5000);