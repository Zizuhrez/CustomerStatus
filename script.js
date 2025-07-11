const queueList = document.getElementById("queueList");
const urlParams = new URLSearchParams(window.location.search);
const pin = urlParams.get("pin");

if (!pin) {
  queueList.innerHTML = "<p style='color:red;'>❌ Missing PIN. Invalid link.</p>";
  throw new Error("No PIN in URL");
}

// First, check if this customer is already served
window.db.collection("appointments")
  .where("pin", "==", pin)
  .limit(1)
  .get()
  .then(snapshot => {
    if (snapshot.empty) {
      queueList.innerHTML = "<p style='color:red;'>❌ Invalid or expired PIN.</p>";
      return;
    }

    const data = snapshot.docs[0].data();

    if (data.status === "served") {
      queueList.innerHTML = "<p style='color:red;'>✅ Your service is completed. This link has expired.</p>";
      return;
    }

    // If not served, show live queue
    showLiveQueue();
  })
  .catch(error => {
    console.error("Error checking PIN:", error);
    queueList.innerHTML = "<p style='color:red;'>❌ Error loading status. Try again later.</p>";
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
}