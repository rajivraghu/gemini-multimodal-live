





import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";


// const renderAltairDeclaration : FunctionDeclaration = {
//   name: "render_altair",
//   description: "Displays an Altair graph."
// };





const getUsersDeclarations: FunctionDeclaration = {
  name: "get_users",
  description: "Display users data"
};

function AltairComponent() {
  const [jsonString, setJSONString] = useState<string>("");
  const [usersData, setUsersData] = useState<any>(null); // State to store user data
  const { client, setConfig } = useLiveAPIContext();

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: 'You are my helpful assistant. If I ask about users, call the "get_users" function. Do not ask for additional information, just make your best judgement.',
          },
        ],
      },
      tools: [
        { googleSearch: {} },
        { functionDeclarations: [getUsersDeclarations] },
      ],
    });
  }, [setConfig]);

  useEffect(() => {
    const onToolCall = async (toolCall: ToolCall) => {
      console.log("got toolcall", toolCall);

      for (const fc of toolCall.functionCalls) {
        switch (fc.name) {
          case getUsersDeclarations.name:
            {
              try {
                const response = await fetch(
                  "https://rajivraghu-fabulousivorydragon.web.val.run"
                );
                const data = await response.json();
                setUsersData(data);
               // console.log("response.."+response)
                //const obj = { name: "Rajiv", age: 30, password: "secret" };
                const obj = { data };
                client.sendToolResponse({ functionResponses: [{ id: fc.id, response: obj }] })
              } catch (error) {
                console.error("Error fetching user data:", error);
                // Handle the error, e.g., show an error message to the user
              }
            }
            break;
        }
      }

      // Send successful tool response
      if (toolCall.functionCalls.length) {
        setTimeout(
          () =>
            client.sendToolResponse({
              functionResponses: toolCall.functionCalls.map((fc) => ({
                response: { output: { success: true } },
                id: fc.id,
              })),
            }),
          200,
        );
      }
    };

    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);

  // Conditionally render user data or the Altair graph
  return (
    <div>
      {usersData ? (
        <div>
          {/* Display user data */}
          <h2>Users:</h2>
          <ul>
            {usersData.map((user: any) => (
              <li key={user.id}>
                {user.name} - {user.email}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="vega-embed" ref={embedRef} />
      )}
    </div>
  );
}

export const Altair = memo(AltairComponent);









