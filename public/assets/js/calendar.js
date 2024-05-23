const dBoxes = document.querySelector(".d-boxes");
const dayNumber = document.querySelector("#dayNumber");
const dayText = document.querySelector("#dayText");
const monthText = document.querySelector("#month");
const yearText = document.querySelector("#year");
const prevMonth = document.querySelector("#prev-month");
const nextMonth = document.querySelector("#next-month");
const prevYear = document.querySelector("#prev-year");
const nextYear = document.querySelector("#next-year");

let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();
let monthEvents = [];
let eventDays = [];

fetchMonthEvents(year, month, monthEvents);

renderCalendar(year, month);
fetchEventsMonth(year, month);

prevMonth.addEventListener("click", () => {
  month--;
  if (month < 0) {
    year--;
    month = 11;
  }
  renderCalendar(year, month);
  fetchEventsMonth(year, month);
});

nextMonth.addEventListener("click", () => {
  month++;
  if (month > 11) {
    year++;
    month = 0;
  }
  renderCalendar(year, month);
  fetchEventsMonth(year, month);
});

prevYear.addEventListener("click", () => {
  year--;
  renderCalendar(year, month);
  fetchEventsMonth(year, month);
});

nextYear.addEventListener("click", () => {
  year++;
  renderCalendar(year, month);
  fetchEventsMonth(year, month);
});

// Create calendar
function renderCalendar(year, month) {
  const today = new Date(); // get today's date
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  monthText.textContent = `${getMonthName(month)}`;
  yearText.textContent = `${year}`;

  let weekDiv = document.createElement("div");
  weekDiv.classList.add("line");
  dBoxes.innerHTML = "";
  dBoxes.appendChild(weekDiv);

  // Calculate the number of empty days to display before the first day of the month
  const emptyDays = (firstDay + 6) % 7;

  for (let i = 0; i < emptyDays; i++) {
    let dayDiv = document.createElement("div");
    dayDiv.classList.add("d-box");
    let bxDiv = document.createElement("div");
    bxDiv.classList.add("bx");
    let dayHeader = document.createElement("h3");
    dayHeader.textContent = "-";
    bxDiv.appendChild(dayHeader);
    dayDiv.appendChild(bxDiv);
    weekDiv.appendChild(dayDiv);
  }

  for (let i = 1; i <= lastDate; i++) {
    let dayDiv = document.createElement("div");
    dayDiv.classList.add("d-box");

    let bxDiv = document.createElement("div");
    bxDiv.classList.add("bx");
    let dayHeader = document.createElement("h3");
    dayHeader.textContent = i > 0 ? i : "-";
    bxDiv.appendChild(dayHeader);

    if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
      bxDiv.classList.add("active"); // add the "active" class if the day is today
      dayNumber.textContent = i.toString();
      dayText.textContent = getDayName(today.getDay());
      fetchEvents(formatDate(today));
    }

    bxDiv.addEventListener("click", () => {
      dayNumber.textContent = i.toString();
      dayText.textContent = getDayName(new Date(year, month, i).getDay());
      const clickedDate = new Date(year, month, i);
      fetchEvents(formatDate(clickedDate));
    });

    dayDiv.appendChild(bxDiv);
    weekDiv.appendChild(dayDiv);

    if (weekDiv.childNodes.length === 7) {
      weekDiv = document.createElement("div");
      weekDiv.classList.add("line");
      dBoxes.appendChild(weekDiv);
    }
  }

  if (weekDiv.childNodes.length < 7) {
    for (let i = weekDiv.childNodes.length; i < 7; i++) {
      let dayDiv = document.createElement("div");
      dayDiv.classList.add("d-box");
      let bxDiv = document.createElement("div");
      bxDiv.classList.add("bx");
      let dayHeader = document.createElement("h3");
      dayHeader.textContent = "-";
      bxDiv.appendChild(dayHeader);
      dayDiv.appendChild(bxDiv);
      weekDiv.appendChild(dayDiv);
    }
  }
}

function getMonthName(month) {
  const months = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień"
  ];
  return months[month];
}

function getDayName(day) {
  const days = [
    "Niedziela",
    "Poniedziałek",
    "Wtorek",
    "Środa",
    "Czwartek",
    "Piątek",
    "Sobota"
  ];
  return days[day];
}

function padNumber(number) {
  return number.toString().padStart(2, "0");
}

function formatDate(date) {
  const day = padNumber(date.getDate());
  return `${day}`;
}

function fetchMonthEvents(year, month, monthEvents) {
  const xhr = new XMLHttpRequest();
  const url = `/events/${year}/${month + 1}`;
  xhr.open('GET', url, false); // Make the request synchronous
  xhr.send();

  if (xhr.status === 200) {
    const response = JSON.parse(xhr.responseText);
    // Remove the previous month events from the array
    monthEvents.splice(0, monthEvents.length);
    monthEvents.push(...response);
    eventDays.splice(0, eventDays.length);
    monthEvents.forEach(event => {
      eventDays.push(parseInt(event.day));
    });
  } else {
    console.error('Request failed. Status:', xhr.status);
  }
}

function filterEventsByDay(monthEvents, day) {
  return monthEvents.filter(event => event.day == day);
}

function fetchEvents(date) {
  const scrollDiv = document.querySelector(".scroll");
  scrollDiv.innerHTML = "";
  let dayEvents = [];
  dayEvents = filterEventsByDay(monthEvents, `${date}`);

  dayEvents.forEach(event => {
    const { name, time_from, time_to, day } = event;

    const scrollboxDiv = document.createElement("div");
    scrollboxDiv.classList.add("scrollbox");

    const iconDiv = document.createElement("div");
    iconDiv.classList.add("icon");
    const icDiv = document.createElement("div");
    icDiv.id = "l-blue";
    icDiv.classList.add("ic");
    const bgBlueDiv = document.createElement("div");
    bgBlueDiv.id = "bg-blue";
    bgBlueDiv.classList.add("circle");
    icDiv.appendChild(bgBlueDiv);
    iconDiv.appendChild(icDiv);
    scrollboxDiv.appendChild(iconDiv);

    const textDiv = document.createElement("div");
    textDiv.classList.add("text");
    const h2 = document.createElement("h2");
    h2.textContent = name;
    const h3 = document.createElement("h3");
    h3.textContent = `${time_from} - ${time_to}`;
    textDiv.appendChild(h2);
    textDiv.appendChild(h3);
    scrollboxDiv.appendChild(textDiv);

    scrollDiv.appendChild(scrollboxDiv);
  })
}

function fetchEventsMonth(year, month) {
  fetchMonthEvents(year, month, monthEvents);
  const daysWithEvents = eventDays;

  const dayBoxes = dBoxes.querySelectorAll(".d-box");
  dayBoxes.forEach((dayBox) => {
    const dayNumberElement = dayBox.querySelector(".bx h3");
    const dayNumber = dayNumberElement ? parseInt(dayNumberElement.innerText, 10) : null;

    if (dayNumber && daysWithEvents.includes(dayNumber)) {
      let dotsDiv = dayBox.querySelector(".dots");

      // If the .dots div does not exist, create it
      if (!dotsDiv) {
        dotsDiv = document.createElement("div");
        dotsDiv.classList.add("dots");
        dayBox.appendChild(dotsDiv);
      }

      const dotDiv = document.createElement("div");
      dotDiv.classList.add("dot");
      dotDiv.id = "bg-blue";
      dotsDiv.appendChild(dotDiv);

      if (daysWithEvents.filter(day => day === dayNumber).length >= 2) {
        const dotDiv2 = document.createElement("div");
        dotDiv2.classList.add("dot");
        dotDiv2.id = "bg-green";
        dotsDiv.appendChild(dotDiv2);
      }
    }
  });
}