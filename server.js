const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI(process.env.OPENAI_API_KEY);

app.post('/get-response', async (req, res) => {
    const userMessage = req.body.message;
    const assistantId = 'asst_FjXlnGFz9Am4IWs3xOS2IEf8'; // Replace with your actual assistant ID
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userMessage,
      });

    // Use runs to wait for the assistant response and then retrieve it
    const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
    });

    let runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );

      // Polling mechanism to see if runStatus is completed
      // This should be made more robust.
      while (runStatus.status !== "completed") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }

      // Get the last assistant message from the messages array
      const messages = await openai.beta.threads.messages.list(thread.id);

      // Find the last message for the current run
      const lastMessageForRun = messages.data
        .filter(
          (message) => message.run_id === run.id && message.role === "assistant"
        )
        .pop();

      // If an assistant message is found, console.log() it
      assistantMessage = ""
      if (lastMessageForRun) {
        assistantMessage = lastMessageForRun.content[0].text.value
        // console.log(`${assistantMessage} \n`);
      }
    
      res.json({ message: assistantMessage });

    // try {
    //     const response = await openai.createMessage({
    //         assistant_id: assistantId,
    //         model: "davinci", // Replace with the specific model you're using with the assistant, if necessary
    //         messages: [{
    //             role: "user",
    //             content: userMessage
    //         }]
    //     });

    //     // Assuming the assistant's response is in the last message of the array
    //     const lastMessage = response.data.data.messages.slice(-1)[0];

    //     // Send the assistant's response to the frontend
    //     res.json({ message: lastMessage.content });

    // } catch (error) {
    //     console.error('OpenAI error:', error);
    //     res.status(500).send('Error processing your request');
    // }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
