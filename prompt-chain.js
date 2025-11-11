const api = process.env.OPENROUTER_API_KEY;


if (!api) {
    throw new Error("OPENROUTER_API_KEY is not set");
}

const fetchResponse = async ({ body }) => {
    if (!body) {
        throw new Error("Body is required");
    }
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${api}`,
        },
        body: JSON.stringify(body),
    });
    if(!response.ok){
        throw new Error(" Failed to connect ")
    }
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "No response";
};

const body = (content) => {
    return {
        model: "minimax/minimax-m2:free",
        messages: [
            {
                role: "user",
                content: content,
            },
        ],
    };
};

const runPromptChain = async (prompt) => {
    if(typeof prompt!=="string"){
        return "Prompt is required and should be of type string"
    }
    // Step 1: Interpret intent
    const firstRes = await fetchResponse({
        body: body(`Summarize the user's request and intent in one or two sentences.
        Do not give any solutions. User question: "${prompt}"`),
    });


    const categories = [
        "Account Opening",
        "Billing Issue",
        "Account Access",
        "Transaction Inquiry",
        "Card Services",
        "Account Statement",
        "Loan Inquiry",
        "General Information",
    ];

    // Step 2: Map to possible categories
    const secondRes = await fetchResponse({
        body: body(`From the list ${categories}, select all categories that apply to the user's request: "${firstRes}". 
        Respond only with the selected categories, separated by commas.`),
    });


    // Step 3: Choose best category
    const thirdRes = await fetchResponse({
        body: body(`From the selected categories: "${secondRes}", choose the single best category for the user's request: "${firstRes}". 
        Respond with just the category name.`),
    });


    // Step 4: Extract additional details
    const fourthRes = await fetchResponse({
        body: body(`Based on the chosen category "${thirdRes}" and the user's request "${firstRes}", 
        list the additional information needed to address the request (e.g., transaction date, amount, card type). 
        Respond concisely.`),
    });


    // Step 5: Generate response
    const fifthRes = await fetchResponse({
        body: body(`Provide a short and accurate customer support reply for the user's request, under the category "${thirdRes}". 
        Use the context: "${firstRes}" and mention any missing information from "${fourthRes}".`),
    });
    const array = [firstRes, secondRes, thirdRes, fourthRes, fifthRes]
    console.log(array)
    return array
};

// Run the prompt chain
runPromptChain("I am unable to make transfer");
