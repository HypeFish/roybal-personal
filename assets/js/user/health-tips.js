document.addEventListener("DOMContentLoaded", async () => {
  // Fetch user data from backend
  fetch("/api/get_user_data")
    .then((response) => response.json())
    .then(async (data) => {
      let userIdElement = document.getElementById("user-id");
      userIdElement.innerText = data.user_id;
      let participantNumberElement =
        document.getElementById("participant-number");
      participantNumberElement.innerText = data.number;

      $("#calendar").fullCalendar({
        header: {
          left: "prev,next today",
          center: "title",
          right: "month,basicWeek,basicDay",
        },
        events: data.callingDays.map((day) => {
          return {
            title: "Call",
            start: day,
            color: "orange",
          };
        }),
      });

      // Get the tips from the file tips.json in the root directory
      const response = await fetch("/assets/tips.json");
      const tips = await response.json();

      // Calculate the current week number since the participant started
      const startDate = new Date(data.start_date); // assuming start_date is available in user data
      const currentDate = new Date();
      const weekNumber = Math.floor((currentDate - startDate) / (7 * 24 * 60 * 60 * 1000));

      // Get the tip index based on the week number and total tips available
      let tipIndex = weekNumber % tips.tips.length
      if (isNaN(tipIndex) ||tipIndex < 0) {
        tipIndex = 0; // Set to the first tip if the index is negative
      }
      console.log(tipIndex)
      const currentTip = tips.tips[tipIndex];

      // Update the HTML with the current tip
      const tipTitle = document.getElementById("tip-title");
      tipTitle.innerText = currentTip.title;
      const tipDescription = document.getElementById("tip-description");
      tipDescription.innerText = currentTip.description;
    });
});