require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const result = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    const data = await result.json();

    if (!data.models) {
      console.log("No models returned.");
      console.log(data);
      return;
    }

    console.log("\nAvailable Models:\n");

    data.models.forEach((model) => {
      console.log("-", model.name);
    });
  } catch (error) {
    console.error("Error listing models:");
    console.error(error);
  }
}

listModels();
