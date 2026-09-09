/// <reference types="vite/client" />

interface GoogleCredentialResponse {
  credential: string;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: GoogleCredentialResponse) => void;
        }) => void;
        renderButton: (
          element: HTMLElement,
          config: {
            type: "standard";
            theme: "outline";
            size: "large";
            width: number;
            text: "signin_with";
          },
        ) => void;
      };
    };
  };
}
