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
    let threadId = req.body.threadId; // Receive threadId from the client
    const assistantId = 'asst_FjXlnGFz9Am4IWs3xOS2IEf8'; // Replace with your actual assistant ID

    // If no threadId or it's a new session, create a new thread
    if (!threadId) {
        const thread = await openai.beta.threads.create();
        threadId = thread.id;
    }

    await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: userMessage,
    });


    // Use runs to wait for the assistant response and then retrieve it
    const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
    });

    let runStatus = await openai.beta.threads.runs.retrieve(
        threadId,
        run.id
      );

      // Polling mechanism to see if runStatus is completed
      // This should be made more robust.
      while (runStatus.status !== "completed") {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      }


  //     //CHECKING FOR TABLE RESERVATION:
  //         // If the model output includes a function call
  //   if (runStatus.status === 'requires_action') {
  //     // You might receive an array of actions, iterate over it
  //     for (const action of runStatus.required_action.submit_tool_outputs.tool_calls) {
  //         const functionName = action.function.name;
  //         const arguments = JSON.parse(action.function.arguments);
          
  //         // Check if the function name matches 'table_reservation'
  //         if (functionName === 'table_reservation') {
  //             handleTableReservation(arguments);
  //             // Respond back to the model that the action has been handled
  //             await openai.beta.threads.runs.submit_tool_outputs(threadId, run.id, {
  //                 tool_outputs: [{
  //                     tool_call_id: action.id,
  //                     output: { success: true } // You can include more details if needed
  //                 }]
  //             });
  //         }
  //     }
  // }


      // Get the last assistant message from the messages array
      const messages = await openai.beta.threads.messages.list(threadId);

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
        console.log(`${assistantMessage} \n`);
      }
    
    res.json({ message: assistantMessage, threadId: threadId });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
