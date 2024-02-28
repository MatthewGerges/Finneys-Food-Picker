document.addEventListener('DOMContentLoaded', (event) => {
  const sendButton = document.querySelector('.send-button');
  const inputMessage = document.querySelector('.input-message');
  const chatMessages = document.querySelector('.chat-messages');

   // Retrieve the thread ID from session storage or set it to null
   let threadId = sessionStorage.getItem('threadId') || null;

  const sendMessage = async () => {
    const userText = inputMessage.value.trim();
      if (userText) {
          // Display user's message
          const userMessageDiv = document.createElement('div');
          userMessageDiv.textContent = userText;
          userMessageDiv.className = 'user-message';
          chatMessages.appendChild(userMessageDiv);

          inputMessage.value = ''; // Clear the input

          // Show loading indicator
          const loadingDiv = document.createElement('div');
          loadingDiv.className = 'loading-indicator';
          loadingDiv.textContent = 'Loading...';
          chatMessages.appendChild(loadingDiv);

          try {
              // Send the message to your server
              //START COMMENT IF TESTING STYLES
              // const response = await fetch('https://finneyspickerbackend.onrender.com/get-response', {
                const response = await fetch('http://localhost:3001/get-response', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ message: userText, threadId: threadId })
              });

              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }

              const data = await response.json();
              //END COMMENT

              // Check if a new thread ID was returned from the server and store it
              if (data.threadId && !threadId) {
                    threadId = data.threadId;
                    sessionStorage.setItem('threadId', threadId);
                }

              // Remove loading indicator
              chatMessages.removeChild(loadingDiv)

              // Display bot's response
              const botResponseDiv = document.createElement('div');
              // botResponseDiv.textContent = "Hello!";
              botResponseDiv.textContent = data.message;
              botResponseDiv.className = 'bot-message';
              chatMessages.appendChild(botResponseDiv);
          } catch (error) {
              console.error('Failed to get response: ', error);
              // Remove loading indicator if there is an error
              chatMessages.removeChild(loadingDiv);
          }
      }
  };
  sendButton.addEventListener('click', sendMessage);

  // Add event listener for Enter key on the input field
  inputMessage.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent the default action to avoid form submission
        sendMessage();
      }
  });
});