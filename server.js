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
  //             await openai.beta.threads.runs.submit_tool_outputs(thread.id, run.id, {
  //                 tool_outputs: [{
  //                     tool_call_id: action.id,
  //                     output: { success: true } // You can include more details if needed
  //                 }]
  //             });
  //         }
  //     }
  // }


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
        console.log(`${assistantMessage} \n`);
      }
    
      res.json({ message: assistantMessage });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));


// const express = require('express');
// const { OpenAI } = require('openai');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// const openai = new OpenAI(process.env.OPENAI_API_KEY);

// // Dummy function for demonstration purposes
// function makeReservation(details) {
//   // Here you can integrate with an actual reservation system or database
//   console.log(`Reservation request: ${JSON.stringify(details)}`);
//   return { confirmation: "Reservation made successfully!" };
// }
// app.post('/get-response', async (req, res) => {
//   const userMessage = req.body.message;

//   // Define the function call details in the tools list
//   const tools = [{
//     "type": "function",
//     "function": {
//         "name": "make_reservation",
//         "description": "Make a table reservation",
//         // ...additional details here...
//     }
//   }];

//   // Create a conversation with the initial user message
//   const initialResponse = await openai.chat.completions.create({
//     model: "gpt-3.5-turbo",
//     messages: [{
//         role: "user",
//         content: userMessage
//     }],
//     tools: tools,
//   });

//   // Check if the model's response includes a function call
//   const toolCalls = initialResponse.choices[0].message.tool_calls;
//   if (toolCalls && toolCalls.length > 0) {
//       // Prepare the tool response messages
//       const toolResponseMessages = toolCalls.map(toolCall => {
//           // Call your function based on the tool call details
//           // This should be replaced with your actual function logic
//           const functionOutput = makeReservation(/* ...arguments... */);
//           return {
//               role: "system",
//               tool_call_id: toolCall.id, // Match the id of the tool call
//               content: JSON.stringify(functionOutput)
//           };
//       });

//       // Add the tool response messages to the conversation
//       const followUpResponse = await openai.chat.completions.create({
//           model: "gpt-3.5-turbo",
//           messages: initialResponse.choices[0].message.concat(toolResponseMessages),
//           tools: tools,
//       });

//       // Send the final response back to the client
//       res.json({
//           message: followUpResponse.choices[0].message.content
//       });
//   } else {
//       // If no function call was required, send the initial response
//       res.json({
//           message: initialResponse.choices[0].message.content
//       });
//   }
// });



// const PORT = 3001;
// app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
