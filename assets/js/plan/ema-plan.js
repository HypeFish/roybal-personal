document.getElementById("removeContact").addEventListener("click", function (event) {
  event.preventDefault(); // Prevent the default form submission behavior
  deleteContact(); // Call your function to handle the submission
});

document.getElementById("addContact").addEventListener("click", function (event) {
  event.preventDefault(); // Prevent the default form submission behavior
  submitNewContact(); // Call your function to handle the submission
});

document.getElementById("generateId").addEventListener("click", function (event) {
  event.preventDefault(); // Prevent the default form submission behavior
  generateRandomId(); // Call your function to generate a random ID
});

function generateRandomId() {
  const randomId = 'ID-' + Math.random().toString(36).substring(2,9)
  document.getElementById("newId").value = randomId;
};

async function submitNewContact() {
  const newPhone = document.getElementById("newPhone").value;
  const newId = document.getElementById("newId").value;

  if (newPhone && newId) {
      try {
          const response = await fetch("/admin/submit-ema-contact", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  contact: newPhone,
                  id: newId,
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
          document.getElementById("newId").value = "";

      } catch (error) {
          console.error("Error:", error);
      }
  } else {
      alert("Please enter a valid phone number and generate an ID");
  }
}

async function deleteContact() {
  const selectedContact = document.getElementById("removePhone").value;

  if (selectedContact) {
      try {
          const response = await fetch(`/admin/delete-ema-contact/${selectedContact}`, {
              method: "DELETE",
          });

          const data = await response.json();

          if (data.success) {
              alert(data.message);
          } else {
              alert("Error deleting contact");
          }

          document.getElementById("removePhone").value = "";
      } catch (error) {
          console.error("Error:", error);
      }
  } else {
      alert("Please enter a valid phone number");
  }
}
