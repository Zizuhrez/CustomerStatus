const queueList = document.getElementById("queueList");

// Get the customer's PIN from the URL
const urlParams = new URLSearchParams(window.location.search);
const customerPin = urlParams.get("pin");

if (!customerPin) {
  document.body.innerHTML = `<h2 style="color:red;">Invalid link. No PIN provided.</h2>`;
  throw new Error("No PIN in URL");
}

// Check if the customer with this PIN exists
window.db.collection("appointments").doc(customerPin).get().then((doc) => {
  if (!doc.exists) {
    document.body.innerHTML = `<h2 style="color:red;">This link has expired or does not exist.</h2>`;
    return;
  }

  const data = doc.data();
  if (data.status === "served") {
    document.body.innerHTML = `<h2 style="color:red;">You have already been served. This link is no longer active.</h2>`;
    return;
  }

  // Show live queue if still waiting or serving
  showLiveQueue();
}).catch((error) => {
  console.error("Error checking PIN:", error);
  document.body.innerHTML = `<h2 style="color:red;">Something went wrong. Please try again later.</h2>`;
});

function showLiveQueue() {
  window.db.collection("appointments")
    .orderBy("timestamp")
    .onSnapshot((snapshot) => {
      const servingList = [];
      const waitingVipList = [];
      const waitingRegularList = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === "served") return;

        data.pin = doc.id; // Add PIN from document ID

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

        const isCurrentUser = (person.pin === customerPin);

        // Name line
        let content = `<strong>${index + 1}. ${person.nickname}</strong>`;
        if (isCurrentUser) {
          content += ` <span style="color: orange; font-weight: bold;">(👉 You)</span>`;
        }

        content += `<br>- ${person.type} - ${person.status}`;

        if (person.status === "serving") {
          content += `<br>⭐<span style="font-weight: bold; color: green;">Currently Serving....</span>`;
          li.style.backgroundColor = "#fff5d1";
          li.style.borderLeft = "5px solid #facc15";
        } else if (person.status === "waiting") {
          li.style.backgroundColor = "#e0f2fe";
          li.style.borderLeft = "5px solid #3b82f6";
        }

        if (isCurrentUser) {
          li.style.border = "3px solid red";
        }

        li.innerHTML = content;
        queueList.appendChild(li);
      });
    });
}