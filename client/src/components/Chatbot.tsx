import { useEffect } from "react";

const PROJECT_ID = process.env.NEXT_PUBLIC_VOICEFLOW_PROJECT_ID;
const URL_RUNTIME = "https://general-runtime.voiceflow.com";
const URL_WIDGET = "https://cdn.voiceflow.com/widget/bundle.mjs";

interface VoiceflowWindow extends Window {
  voiceflow?: {
    chat: {
      load: (opzioni: {
        verify: { projectID: string };
        url: string;
        versionID: string;
      }) => void;
    };
  };
}

/**
 * Assistente conversazionale fornito da Voiceflow.
 *
 * È un componente esterno (COTS): Tech4All non implementa né ospita la logica
 * di dialogo, si limita a incorporare il widget. Se
 * `NEXT_PUBLIC_VOICEFLOW_PROJECT_ID` non è configurato il componente non
 * viene caricato e l'applicazione funziona senza assistente.
 */
const Chatbot: React.FC = () => {
  useEffect(() => {
    if (!PROJECT_ID) {
      return;
    }

    const script = document.createElement("script");
    script.src = URL_WIDGET;
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => {
      const finestra = window as VoiceflowWindow;
      finestra.voiceflow?.chat.load({
        verify: { projectID: PROJECT_ID },
        url: URL_RUNTIME,
        versionID: "production",
      });
    };

    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return null;
};

export default Chatbot;
