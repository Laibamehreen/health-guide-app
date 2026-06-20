import axios from 'axios';

const SYSTEM_INSTRUCTION = `You are a helpful and caring health assistant.
You provide information about nutrition, diet, general fitness, and basic symptom guidance.
You MUST include a disclaimer that you are not a doctor, that this is not medical advice, and to seek professional care for severe conditions.
Keep responses concise, using bullet points where appropriate.`;

const LOCAL_RESPONSES = {
  headache: {
    reply: "Headaches can be caused by tension, dehydration, eye strain, or lack of sleep. \n\n**Self-Care Tips:**\n- Drink a large glass of water.\n- Rest in a quiet, dark room.\n- Apply a cool compress to your forehead.\n\n*If your headache is sudden, severe, or accompanied by fever or numbness, seek emergency medical care immediately.*"
  },
  fever: {
    reply: "A fever is usually a sign that your body is fighting off an infection. \n\n**Guidelines:**\n- Stay well-hydrated with water, broths, or herbal teas.\n- Get plenty of rest.\n- Wear lightweight clothing.\n- You may use over-the-counter fever reducers like acetaminophen or ibuprofen (consult a pharmacist for dosage).\n\n*Seek medical attention if the fever exceeds 103°F (39.4°C) or lasts more than 3 days.*"
  },
  cough: {
    reply: "Coughs can result from colds, allergies, or infections. \n\n**Self-Care Tips:**\n- Drink warm water with honey (do not give honey to infants under 1 year old).\n- Use a humidifier in your room.\n- Inhale steam from a hot shower.\n\n*Consult a doctor if you cough up blood, have breathing difficulties, or if the cough lasts over 3 weeks.*"
  },
  diet: {
    reply: "A healthy diet is balanced and rich in whole foods. \n\n**Key Nutrition Tips:**\n- Focus on lean proteins (chicken, fish, legumes).\n- Fill half your plate with colorful vegetables and fruits.\n- Choose whole grains (oats, brown rice, quinoa) over refined grains.\n- Limit added sugars and processed foods.\n- Drink plenty of water."
  },
  fitness: {
    reply: "Physical activity is essential for cardiovascular health, muscle strength, and mental wellness. \n\n**Recommendations:**\n- Aim for 150 minutes of moderate cardiovascular exercise per week (brisk walking, cycling).\n- Add strength training at least 2 days a week.\n- Always start with a warm-up and end with a cool-down stretch."
  },
  flu: {
    reply: "Influenza (flu) is a respiratory infection. \n\n**Recovery Plan:**\n- Isolate and rest to help your body heal and avoid spreading it.\n- Drink warm fluids to soothe your throat and stay hydrated.\n- Monitor your temperature.\n\n*If you experience chest pain, difficulty breathing, or persistent vomiting, contact a healthcare provider immediately.*"
  },
  soreThroat: {
    reply: "Sore throats are commonly caused by viral infections like colds. \n\n**Remedies:**\n- Gargle with warm salt water (1/2 tsp salt in warm water).\n- Drink warm liquids (tea with honey).\n- Rest your voice.\n\n*If you have difficulty swallowing or breathing, or a high fever, consult a healthcare provider.*"
  },
  default: {
    reply: "I understand you have questions about your health. To help you best, could you tell me more about what you are experiencing? \n\nFor diet, try to eat fresh veggies and lean protein. For fitness, aim for a daily 30-minute walk. \n\n*Always remember that I am an AI, not a healthcare professional. For diagnoses and prescriptions, please consult your doctor.*"
  }
};

export const getAIResponse = async (userMessage) => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const isPlaceholderKey = !apiKey || apiKey.includes('your_') || apiKey.includes('_here');

  if (isPlaceholderKey) {
    return simulateLocalAI(userMessage);
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${SYSTEM_INSTRUCTION}\n\nUser Question: ${userMessage}` }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (generatedText) {
      return generatedText;
    }
    throw new Error('Invalid structure in response');
  } catch (error) {
    console.error('Gemini API call failed, using local model fallback:', error.message);
    return simulateLocalAI(userMessage);
  }
};

const simulateLocalAI = (message) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const msgLower = message.toLowerCase();
      
      let matchedKey = 'default';
      if (msgLower.includes('headache') || msgLower.includes('migraine')) {
        matchedKey = 'headache';
      } else if (msgLower.includes('fever') || msgLower.includes('temperature') || msgLower.includes('warm')) {
        matchedKey = 'fever';
      } else if (msgLower.includes('cough') || msgLower.includes('congestion')) {
        matchedKey = 'cough';
      } else if (msgLower.includes('diet') || msgLower.includes('eat') || msgLower.includes('food') || msgLower.includes('nutrition')) {
        matchedKey = 'diet';
      } else if (msgLower.includes('fit') || msgLower.includes('workout') || msgLower.includes('exercise') || msgLower.includes('gym')) {
        matchedKey = 'fitness';
      } else if (msgLower.includes('flu') || msgLower.includes('cold')) {
        matchedKey = 'flu';
      } else if (msgLower.includes('throat') || msgLower.includes('swallow')) {
        matchedKey = 'soreThroat';
      }

      resolve(LOCAL_RESPONSES[matchedKey].reply);
    }, 1200); // Simulate API latency of 1.2s
  });
};
