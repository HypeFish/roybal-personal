document
  .getElementById("removeContact")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    deleteContact(); // Call your function to handle the submission
  });

document
  .getElementById("addContact")
  .addEventListener("click", function (event) {
    event.preventDefault(); // Prevent the default form submission behavior
    submitNewContact(); // Call your function to handle the submission
  });

async function submitNewContact() {
  const newPhone = document.getElementById("newPhone").value;

  if (newPhone) {
    try {
      const response = await fetch("/admin/submit-ema-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: newPhone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
      } else if (data.message === "Contact already exists") {
        alert("This email address or phone number is already registered");
      } else {
        alert("Error submitting contact");
      }
      document.getElementById("newPhone").value = "";

    } catch (error) {
      console.error("Error:", error);
    }
  } else {
    alert("Please enter a valid phone number");
  }
}

async function deleteContact() {
  const selectedContact = document.getElementById("removePhone").value;

  if (selectedContact) {
    try {
      const response = await fetch(
        `/admin/delete-ema-contact/${selectedContact}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(data.message);
      } else {
        alert("Error deleting contact");
      }

      document.getElementById("newPhone").value = "";
    } catch (error) {
      console.error("Error:", error);
    }
  } else {
    alert("Please enter a valid phone number");
  }
}
