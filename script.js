const queueList = document.getElementById("queueList");
const urlParams = new URLSearchParams(window.location.search);
const pin = urlParams.get("pin");

if (!pin) {
  queueList.innerHTML = "<p class='error-message'>❌ Missing PIN. Invalid link.</p>";
  throw new Error("No PIN in URL");
}

// First check if the customer's appointment exists and if they're already served
window.db.collection("appointments")
  .where("pin", "==", pin)
  .limit(1)
  .get()
  .then(snapshot => {
    if (snapshot.empty) {
      queueList.innerHTML = "<p class='error-message'>❌ Invalid or expired PIN.</p>";
      return;
    }

    const data = snapshot.docs[0].data();

    if (data.status === "served") {
      queueList.innerHTML = "<p class='error-message'>✅ Your service is completed. This link has expired.</p>";
      return;
    }

    // Show live queue if not served
    showLiveQueue();
  })
  .catch(error => {
    console.error("Error checking PIN:", error);
    queueList.innerHTML = "<p class='error-message'>❌ Error loading status. Please try again later.</p>";
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
        if (person.status === "serving") {
          li.classList.add("serving");
        }

        let content = `<strong>${index + 1}. ${person.nickname}</strong> - ${person.type} - ${person.status}`;

        if (person.status === "serving") {
          content += `<br><span>⭐ Currently Serving....</span>`;
        }

        li.innerHTML = content;
        queueList.appendChild(li);
      });
    });
}