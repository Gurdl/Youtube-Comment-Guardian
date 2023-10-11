const OpenAI = require("openai");
const { config } = require("dotenv");
config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const response = async () => {
    const completion = await openai.completions.create({
        model: "text-davinci-003",
        prompt: "I am also good",
        max_tokens: 30,
      });
      console.log(completion.choices[0].text);
    
      
};
response();
