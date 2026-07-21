import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxmhx7wRReWw5x7UfLO1n3OK9JfAMnsTw",
  authDomain: "recruitmen-2cc3d.firebaseapp.com",
  projectId: "recruitmen-2cc3d",
  storageBucket: "recruitmen-2cc3d.firebasestorage.app",
  messagingSenderId: "664767825491",
  appId: "1:664767825491:web:fc42538cdc2a8a445828a6",
  measurementId: "G-1H2ZWBE72D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally to prevent errors in non-browser/SSR environments or if blocked by ad-blockers
let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase Analytics could not be initialized (possibly blocked by an ad-blocker):", error);
  }
}

export { app, analytics };
