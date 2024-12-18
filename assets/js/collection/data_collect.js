//data_collect.js

async function getPlannedActivities(user_id) {
  try {
    const response = await fetch(`/admin/api/planned_activities/${user_id}`);
    const data = await response.json();

    if (data.success) {
      const plannedActivities = data.plannedActivities;
      return plannedActivities;
    }
    return [];
  } catch (error) {
    alert("No data for this participant");
    return [];
  }
}

async function generateCSV(user_id, participantNumber) {
  try {
    // Fetch planned activities for the user
    const plannedActivities = await getPlannedActivities(user_id);
    const response = await fetch(`/admin/api/combined_data/${user_id}`);
    const data = await response.json();

    if (!data.success) {
      alert("There is no data for this participant");
      return;
    }

    const combinedData = data.data;
    let csvData =
      "participant_number,date,day_of_week,planned,start_time,activity_name,total_steps,distance,duration(minutes),calories_burned,points,dailyStepCount\n";

    // normalize dates as est
    function convertToEST(date) {
      return new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
    }

    // Determine the range of dates
    const startDate = convertToEST(new Date(combinedData[0].date));
    const endDate = convertToEST(new Date(combinedData[combinedData.length - 1].date));

    // Helper function to format date as YYYY-MM-DD
    function formatDate(date) {
      return date.toISOString().split('T')[0];
    }

    // Generate a list of all dates in the range
    let allDates = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      allDates.push(formatDate(new Date(d)));
    }

    // Create a map to store the total duration and total steps for each day
    let activityMap = new Map();
    let plannedActivityDates = plannedActivities.map(activity => activity.startDate);

    // Loop through each combined data item to fill activityMap
    combinedData.forEach((item) => {
      const date = item.date;
      const dayOfWeekIndex = new Date(date).getDay();
      const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const dayOfWeek = daysOfWeek[dayOfWeekIndex];

      // Initialize map entries if not present
      if (!activityMap.has(date)) {
        activityMap.set(date, []);
      }

      // Loop through each activity for the date
      item.activities.forEach((activity) => {
        let isPlanned = plannedActivityDates.includes(date);
        if (isPlanned) {
          isPlanned = plannedActivities.find(pa => pa.startDate === date).startTime === activity.startTime;
        }

        const activityDetails = {
          isPlanned,
          dayOfWeek,
          startTime: activity.startTime,
          activityName: activity.name,
          totalSteps: activity.steps,
          distance: activity.distance !== undefined ? activity.distance : "NA",
          durationInMinutes: Math.round((activity.duration / 60000) * 100) / 100,
          caloriesBurned: activity.calories,
        };

        // Update the map with the new activity
        activityMap.get(date).push(activityDetails);
      });
    });

    // Ensure every date has an entry in activityMap
    allDates.forEach((date) => {
      if (!activityMap.has(date)) {
        const dayOfWeekIndex = new Date(date).getDay();
        // indexing ?????
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayOfWeek = daysOfWeek[dayOfWeekIndex];
        activityMap.set(date, [{
          isPlanned: false,
          dayOfWeek: dayOfWeek,
          startTime: "NA",
          activityName: "NA",
          totalSteps: "NA",
          distance: "NA",
          durationInMinutes: "NA",
          caloriesBurned: "NA",
        }]);
      }
    });

    // Calculate points and generate CSV data
    allDates.forEach((date) => {
      const activities = activityMap.get(date);
      let dailyPointsAwarded = false;
      let dailyDuration = activities.reduce((acc, act) => acc + (isNaN(act.durationInMinutes) ? 0 : act.durationInMinutes), 0);
      let dailyStepCount = activities.reduce((acc, act) => acc + (isNaN(act.totalSteps) ? 0 : act.totalSteps), 0);

      // if an activity is planned and the activity duration is 27 mins (3 min buffer), points rewarded
      // if sum of duration of all activities is 30 mins, points rewarded 
      activities.forEach((activity) => {
        let plannedPoints = 0;
        if (activity.isPlanned && activity.durationInMinutes > 27.0) {
          plannedPoints = 500;
          dailyPointsAwarded = true;
        } else if (!dailyPointsAwarded && dailyDuration > 30.0) {
          plannedPoints = 500;
          dailyPointsAwarded = true;
        }

        csvData += `sub_${participantNumber.toString().padStart(2, "0")},${date},${activity.dayOfWeek},${activity.isPlanned},${activity.startTime},${activity.activityName},${activity.totalSteps},${activity.distance},${activity.durationInMinutes},${activity.caloriesBurned},${plannedPoints},${dailyStepCount}\n`;
      });
    });

    // Generate CSV file
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitbit_data_participant${participantNumber}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(`Error generating CSV for user ${user_id}:`, error);
  }
}


async function getParticipants() {
  try {
    const response = await fetch("/admin/api/participants");
    const data = await response.json();
    console.log(data);

    if (data.success) {
      const participantSelector = document.getElementById(
        "participantSelector"
      );
      const pointSelector = document.getElementById("pointSelector");

      // Clear existing options
      participantSelector.innerHTML = "";

      // Inside the getParticipants function after fetching data
      data.data.forEach((participant, index) => {
        const option = document.createElement("option");
        option.value = participant.user_id;
        option.textContent = `Participant ${index + 1}`; // Set the participant number as text
        option.setAttribute("data-participant-number", index + 1); // Add participant number as data attribute
        participantSelector.appendChild(option);
      });

      data.data.forEach((participant, index) => {
        const option = document.createElement("option");
        option.value = participant.user_id;
        option.textContent = `Participant ${index + 1}`; // Set the participant number as text
        option.setAttribute("data-participant-number", index + 1); // Add participant number as data attribute
        pointSelector.appendChild(option);
      });
    } else {
      console.error("Error fetching participants:", data.error);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Call the function to populate the participant selector
getParticipants();

//get the data for the selected participant and generate the csv. 
// The dropdown should be sorted by participant number and the csv should be generated for the selected participant
document.getElementById("generate-csv").addEventListener("click", function () {
  const participantSelector = document.getElementById("participantSelector");
  const selectedUserID = participantSelector.value;
  const selectedParticipantNumber =
    participantSelector.options[participantSelector.selectedIndex].dataset
      .participantNumber;
  generateCSV(selectedUserID, selectedParticipantNumber);
});
