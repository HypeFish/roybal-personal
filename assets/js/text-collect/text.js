document.addEventListener("DOMContentLoaded", function () {
  const exerciseRadio = document.getElementById("exercise");
  const noExerciseRadio = document.getElementById("no_exercise");
  const textbox = document.getElementById("textbox");
  const submitBtn = document.getElementById("submit");
  const errorMsg = document.getElementById("error-msg");

  submitBtn.addEventListener("click", function () {
    // Clear previous error message
    errorMsg.textContent = "";

    if (!exerciseRadio.checked && !noExerciseRadio.checked) {
      errorMsg.textContent = "Please select an option.";
      return; // Stop execution if neither radio button is checked
    }

    if (!textbox.value.trim()) {
      errorMsg.textContent = "Please state a reason for your choice.";
      return; // Stop execution if text is empty
    }

    // take the value of the radio button that is checked
    const exerciseValue = exerciseRadio.checked
      ? exerciseRadio.value
      : noExerciseRadio.value;
    const textValue = textbox.value;
    // Send data to backend
    fetch("/api/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exercise: exerciseValue,
        text: textValue,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      });

    // Clear text and input field
    textbox.value = "";
    exerciseRadio.checked = false;
    noExerciseRadio.checked = false;
  });
});
