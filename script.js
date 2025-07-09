const queueList = document.getElementById("queueList");

// Live queue display
window.db.collection("appointments")
  .orderBy("timestamp")
  .onSnapshot((snapshot) => {
    const servingList = [];
    const waitingVipList = [];
    const waitingRegularList = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === "served") return;

      if (data.status === "serving") {
        servingList.push(data);
      } else if (data.type === "VIP") {
        waitingVipList.push(data);
      } else {
        waitingRegularList.push(data);
      }
    });

    const fullList = [...servingList, ...waitingVipList, ...waitingRegularList];
    queueList.innerHTML = "";

    fullList.forEach((person, index) => {
      const li = document.createElement("li");
      li.classList.add("queue-item");

      let content = `<strong>${index + 1}. ${person.nickname}</strong> - ${person.type} - ${person.status}`;

      if (person.status === "serving") {
        content += `<br>⭐<span style="font-weight: bold; color: green;">Currently Serving....</span>`;
        li.style.backgroundColor = "#fff5d1";
        li.style.borderLeft = "5px solid #facc15";
      } else if (person.status === "waiting") {
        li.style.backgroundColor = "#e0f2fe";
        li.style.borderLeft = "5px solid #3b82f6";
      }

      li.innerHTML = content;
      queueList.appendChild(li);
    });
  });

// Staff panel access
document.getElementById("goToStaff").addEventListener("click", () => {
  const staffPin = prompt("Enter staff PIN:");
  const correctPin = "2025";
  if (staffPin === correctPin) {
    window.location.href = "staff.html";
  } else {
    alert("Incorrect PIN. Access denied.");
  }
});
