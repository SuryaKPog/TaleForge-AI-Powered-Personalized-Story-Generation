// Function to send user message and get bot response
function sendMessage() {
    const inputField = document.getElementById("user-input");
    const userMessage = inputField.value.trim();
    if (!userMessage) return;

    const chatWindow = document.getElementById("chat-window");

    // Display user message
    chatWindow.innerHTML += `<div class="user-msg">You: ${userMessage}</div>`;

    // Call backend to get the bot's response
    fetch('http://localhost:5000/chat', { // Update the URL if necessary (e.g., for production)
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
    })
    .then(response => response.json())
    .then(data => {
        // Display bot's response
        chatWindow.innerHTML += `<div class="bot-msg">Bot: ${data.response}</div>`;
        chatWindow.scrollTop = chatWindow.scrollHeight;
    })
    .catch(error => {
        console.error('Error:', error);
        chatWindow.innerHTML += `<div class="bot-msg">Bot: Oops, something went wrong!</div>`;
        chatWindow.scrollTop = chatWindow.scrollHeight;
    });

    // Clear the input field after sending the message
    inputField.value = "";
}
