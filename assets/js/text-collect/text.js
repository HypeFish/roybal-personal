document.addEventListener("DOMContentLoaded", function () {
  const plannedExerciseYesRadio = document.getElementById("planned_exercise_yes");
  const plannedExerciseNoRadio = document.getElementById("planned_exercise_no");
  const performedExerciseYesRadio = document.getElementById("performed_exercise_yes");
  const performedExerciseNoRadio = document.getElementById("performed_exercise_no");
  const motivatedTextbox = document.getElementById("motivated_textbox");
  const stoppedTextbox = document.getElementById("stopped_textbox");
  const submitBtn = document.getElementById("submit");
  const errorMsg = document.getElementById("error-msg");

  // Initial state of textboxes
  motivatedTextbox.disabled = true;
  stoppedTextbox.disabled = true;

  // Enable/disable textboxes based on exercise performance
  performedExerciseYesRadio.addEventListener("change", function () {
    motivatedTextbox.disabled = false;
    stoppedTextbox.disabled = true;
  });

  performedExerciseNoRadio.addEventListener("change", function () {
    motivatedTextbox.disabled = true;
    stoppedTextbox.disabled = false;
  });

  submitBtn.addEventListener("click", function () {
    // Clear previous error message
    if (errorMsg) errorMsg.textContent = "";

    // Validate radio button selection and textbox input
    if (
      (!plannedExerciseYesRadio.checked && !plannedExerciseNoRadio.checked) ||
      (!performedExerciseYesRadio.checked && !performedExerciseNoRadio.checked)
    ) {
      if (errorMsg) errorMsg.textContent = "Please answer both questions.";
      return; // Stop execution if no radio button is checked
    }

    let textValue = "";
    if (performedExerciseYesRadio.checked && !motivatedTextbox.value.trim()) {
      if (errorMsg) errorMsg.textContent = "Please state what motivated you to exercise.";
      return; // Stop execution if text is empty
    } else if (performedExerciseYesRadio.checked) {
      textValue = motivatedTextbox.value;
    }

    if (performedExerciseNoRadio.checked && !stoppedTextbox.value.trim()) {
      if (errorMsg) errorMsg.textContent = "Please state what stopped you from exercising.";
      return; // Stop execution if text is empty
    } else if (performedExerciseNoRadio.checked) {
      textValue = stoppedTextbox.value;
    }

    // Determine which exercise options are selected
    const plannedExerciseValue = plannedExerciseYesRadio.checked ? 1 : 0;
    const performedExerciseValue = performedExerciseYesRadio.checked ? 1 : 0;

    // Send data to backend
    fetch("/api/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plannedExercise: plannedExerciseValue,
        performedExercise: performedExerciseValue,
        text: textValue,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        message.textContent = "Data received successfully!";
        message.style.color = "green";
        console.log(data);
      })
      .catch((error) => {
        console.error(error);
        message.textContent = "An error occurred. Please try again.";
        message.style.color = "red";
      });

    // Clear text and input field
    motivatedTextbox.value = "";
    stoppedTextbox.value = "";
    plannedExerciseYesRadio.checked = false;
    plannedExerciseNoRadio.checked = false;
    performedExerciseYesRadio.checked = false;
    performedExerciseNoRadio.checked = false;
    motivatedTextbox.disabled = true;
    stoppedTextbox.disabled = true;
  });

  const backButton = document.getElementById("back");

  if (backButton) {
    backButton.addEventListener("click", function () {
      window.location.href = "/home";
    });
  }
});
