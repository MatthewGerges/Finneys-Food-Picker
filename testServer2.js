require('dotenv').config(); // This should be at the top of your file

const { OpenAI } = require('openai');
const readline = require('readline');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Example dummy function hard coded to return the same weather
// In production, this could be your backend API or an external API
function getCurrentWeather(location) {
    if (location.toLowerCase().includes("tokyo")) {
      return JSON.stringify({ location: "Tokyo", temperature: "10", unit: "celsius" });
    } else if (location.toLowerCase().includes("san francisco")) {
      return JSON.stringify({ location: "San Francisco", temperature: "72", unit: "fahrenheit" });
    } else if (location.toLowerCase().includes("paris")) {
      return JSON.stringify({ location: "Paris", temperature: "22", unit: "fahrenheit" });
    } else {
      return JSON.stringify({ location, temperature: "unknown" });
    }
  }

function get_table_reservations(bookingTime, numGuests) {
  if (bookingTime.toLowerCase().includes("4:30")) {
    return JSON.stringify({ availability: "Not available"});
  }
  else if (!bookingTime) {
    return JSON.stringify({ availability: "Please include a booking time"});
  }
  else {
    return JSON.stringify({ availability: "Available", forGuests: numGuests});
}
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const availableFunctions = {
  get_current_weather: getCurrentWeather,
  get_table_reservations: get_table_reservations
};

async function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function runConversation() {
  let messages = []; // Initialize messages array

  while (true) { // Loop indefinitely
    const userInput = await askQuestion("You: "); // Get user input
    if (userInput.toLowerCase() === "exit") break; // Break loop if user types "exit"

    messages.push({ role: "user", content: userInput });

    const tools = [
        {
          type: "function",
          function: {
            name: "get_current_weather",
            description: "Get the current weather in a given location",
            parameters: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "The city and state, e.g. San Francisco, CA",
                },
                unit: { type: "string", enum: ["celsius", "fahrenheit"] },
              },
              required: ["location"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_table_reservations",
            description: "Tell the user if a table is available for the number of guests and time they request",
            parameters: {
              type: "object",
              properties: {
                numGuests: {
                  type: "integer",
                  description: "The number of guests",
                },
                bookingTime: { type: "string", description: "The time requested for a reservation, eg. 8:30 PM" },
              },
              required: ["numGuests", "bookingTime"],
            },
          },
        },
      ];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;


  // Step 2: check if the model wanted to call a function
  const toolCalls = responseMessage.tool_calls;
  if (responseMessage.tool_calls) {
    // Step 3: call the function
    // Note: the JSON response may not always be valid; be sure to handle errors
    const availableFunctions = {
      get_current_weather: getCurrentWeather,
      get_table_reservations: get_table_reservations
    }; // only one function in this example, but you can have multiple
    messages.push(responseMessage); // extend conversation with assistant's reply
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const functionToCall = availableFunctions[functionName];
      const functionArgs = JSON.parse(toolCall.function.arguments);
      console.log('Arguments:', toolCall.function.arguments, 'name:', functionName); // Add this line to debug
      const functionResponse = functionToCall(
        functionArgs.bookingTime,
        functionArgs.numGuests
      );
      messages.push({
        tool_call_id: toolCall.id,
        role: "tool",
        name: functionName,
        content: functionResponse,
      }); // extend conversation with function response
    }
    const secondResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messages,
    }); // get a new response from the model where it can see the function response
    console.log(secondResponse.choices);
    // return secondResponse.choices;
  }

        //   // Regardless of tool calls, always add the latest model response to the conversation history
        //   try{
        //   messages.push({ role: "assistant", content: responseMessage.content });
        // } catch (error) {
        //   console.error("Error:", error); // Log any errors that occur during the process
        //   break; // Optionally break the loop on error
        // }
  }

  rl.close();

}



runConversation().catch(console.error);

